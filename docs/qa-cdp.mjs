import { execFileSync } from "node:child_process";
// Local browser QA. Start Chrome headless with remote debugging on 9223 first.
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const directory = resolve("artifacts");
await mkdir(directory, { recursive: true });
const base = process.env.GFD_QA_URL || "http://127.0.0.1:8000";
const cdp = process.env.GFD_CDP_URL || "http://127.0.0.1:9223";
const target = await (
  await fetch(cdp + "/json/new?" + base, { method: "PUT" })
).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((done, reject) => {
  socket.onopen = done;
  socket.onerror = reject;
});
let sequence = 0;
const pending = new Map();
const errors = [];
let taskStarts = 0;
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const request = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  }
  if (
    message.method === "Network.requestWillBeSent" &&
    message.params.request.url.includes("/api/learning/start")
  )
    taskStarts += 1;
  if (message.method === "Runtime.exceptionThrown")
    errors.push(message.params.exceptionDetails.text);
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails)
    throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const until = async (expression, description) => {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await new Promise((done) => setTimeout(done, 150));
  }
  throw new Error("Timed out: " + description);
};
const click = (selector) =>
  evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const tap = async (selector) => {
  await until(
    `Boolean(document.querySelector(${JSON.stringify(selector)}))`,
    "click target ready",
  );
  const point = await evaluate(
    `(()=>{const button=document.querySelector(${JSON.stringify(selector)});button.scrollIntoView({block:'nearest'});const r=button.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`,
  );
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    button: "left",
    clickCount: 1,
    ...point,
  });
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    button: "left",
    clickCount: 1,
    ...point,
  });
};
const screenshot = async (name) => {
  await evaluate("document.fonts.ready");
  await new Promise((done) => setTimeout(done, 650));
  const result = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(resolve(directory, name), Buffer.from(result.data, "base64"));
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

export { send, evaluate, until, click, tap, screenshot, assert, errors, base, socket };
