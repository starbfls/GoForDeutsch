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
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const request = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  }
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
const screenshot = async (name) => {
  await evaluate("document.fonts.ready");
  await new Promise((done) => setTimeout(done, 350));
  const result = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(resolve(directory, name), Buffer.from(result.data, "base64"));
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const lessons = JSON.parse(
  execFileSync(
    resolve("backend/venv/Scripts/python.exe"),
    [resolve("docs/export-qa-lessons.py")],
    { encoding: "utf8" },
  ),
);

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "Math.random=()=>0.17;",
  });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: base });
  await send("Page.bringToFront");
  await until(
    `document.querySelector('.today-panel .primary-button')&&!document.querySelector('.today-panel .primary-button').disabled`,
    "map ready",
  );
  await evaluate(
    `localStorage.clear();localStorage.setItem('gfd-learner',crypto.randomUUID());location.reload()`,
  );
  await until(
    `document.querySelector('.town-stage')&&document.querySelectorAll('.map-pin').length===3`,
    "fresh map",
  );
  assert(
    await evaluate(`document.querySelector('h1').innerText==='Kennenlernen'`),
    "unit title",
  );
  assert(
    await evaluate(
      `parseFloat(getComputedStyle(document.querySelector('h1')).fontSize)>=30`,
    ),
    "large main heading",
  );
  assert(
    await evaluate(
      `!document.body.innerText.includes('冒险')&&!document.body.innerText.includes('每一条小路')`,
    ),
    "no adventure slogans",
  );
  for (const asset of [
    "town-unit1.png",
    "bakery-unit1.png",
    "park-unit1.png",
    "school-unit1.png",
    "mia-idle.png",
    "mia-expressions-v3.png",
  ])
    assert(
      await evaluate(`fetch('/assets/${asset}').then(r=>r.status===200)`),
      "asset " + asset,
    );
  await until(
    `document.querySelector('.town-stage').dataset.focused==='bakery'`,
    "bakery focus",
  );
  await new Promise((done) => setTimeout(done, 1100));
  await screenshot("ui-map-bakery.png");
  const before = await evaluate(
    `document.querySelector('.map-world').dataset.cameraX`,
  );
  await click('[data-chapter="park"]');
  await until(
    `document.querySelector('.town-stage').dataset.focused==='park'`,
    "park focus",
  );
  assert(
    await evaluate(
      `document.querySelector('.map-world').dataset.cameraX!==${JSON.stringify(before)}`,
    ),
    "camera moves",
  );
  assert(
    await evaluate(
      `document.querySelector('.today-panel .primary-button').disabled`,
    ),
    "locked scene cannot start",
  );
  await new Promise((done) => setTimeout(done, 1100));
  await screenshot("ui-map-park.png");
  await click('[data-chapter="bakery"]');
  const blinked = await evaluate(
    `new Promise(resolve=>{const image=document.querySelector('.map-mia .mia-portrait');let closed=false;const observer=new MutationObserver(()=>{if(image.dataset.blink==='closed')closed=true;else if(closed){observer.disconnect();resolve(true);}});observer.observe(image,{attributes:true,attributeFilter:['data-blink']});setTimeout(()=>{observer.disconnect();resolve(false);},10000);})`,
  );
  assert(blinked, "idle character blinks and reopens eyes");
  await click(".today-panel .primary-button");
  for (let m = 0; m < lessons.length; m++) {
    const mission = lessons[m];
    await until(
      `Boolean(document.querySelector('.scene-${mission.chapter}'))&&!document.querySelector('.scene-transition')`,
      "scene " + mission.id,
    );
    if (m === 3 || m === 6)
      await screenshot(m === 3 ? "ui-park-lesson.png" : "ui-school-lesson.png");
    for (const step of mission.steps) {
      await until(
        `document.querySelector('.exercise-panel')?.dataset.step===${JSON.stringify(step.id)}`,
        "step " + step.id,
      );
      if (step.type === "choice")
        await click(`.choice-option:nth-child(${step.choice + 1})`);
      else if (step.type === "tiles")
        for (const index of step.tiles)
          await click(`.tile-bank button:nth-child(${index + 1})`);
      else
        await evaluate(
          `{const input=document.querySelector('#german-answer');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,${JSON.stringify(step.answer)});input.dispatchEvent(new Event('input',{bubbles:true}));}`,
        );
      await until(
        `!document.querySelector('.exercise-bottom > .primary-button').disabled`,
        "answer ready",
      );
      await click(".exercise-bottom > .primary-button");
      await until(
        `Boolean(document.querySelector('.answer-feedback.correct'))`,
        "answer accepted",
      );
      await click(".exercise-bottom > .primary-button");
    }
    await until(
      `Boolean(document.querySelector('.completion'))`,
      "task complete",
    );
    if (m < lessons.length - 1)
      await click(".completion-actions .primary-button");
  }
  assert(
    await evaluate(
      `document.querySelector('.xp-pill').innerText.includes('480')`,
    ),
    "all task rewards preserved",
  );
  await click('button[aria-label="单词卡"]');
  await until(
    `document.querySelectorAll('.word-card').length===26`,
    "word library",
  );
  assert(
    await evaluate(
      `!document.querySelector('.word-card svg[aria-label="小面包"]')&&!document.querySelector('.flashcard-emoji')`,
    ),
    "word cards have no emoji",
  );
  assert(
    await evaluate(
      `parseFloat(getComputedStyle(document.querySelector('.word-trigger')).fontSize)>=25`,
    ),
    "large word titles",
  );
  await screenshot("ui-cards-library.png");
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 10, y: 10 });
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  await evaluate(`document.querySelector('.word-trigger').focus()`);
  await until(
    `document.querySelector('.word-trigger').getAttribute('aria-expanded')==='true'`,
    "keyboard expands word",
  );
  await evaluate(`document.activeElement.blur()`);
  const rect = await evaluate(
    `{const r=document.querySelector('.word-card').getBoundingClientRect();({x:r.x+r.width/2,y:r.y+30})}`,
  );
  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: rect.x,
    y: rect.y,
  });
  await until(
    `document.querySelector('.word-card').classList.contains('expanded')`,
    "hover expands card",
  );
  assert(
    await evaluate(
      `document.querySelector('.word-card .word-memory').innerText.length>10`,
    ),
    "memory link available",
  );
  await until(
    `document.querySelector('.flashcard-mia .mia-portrait').dataset.expression==='focus'`,
    "focused thinking expression",
  );
  await new Promise((done) => setTimeout(done, 400));
  await screenshot("ui-card-hover.png");
  const second = await evaluate(
    `{const r=document.querySelectorAll('.word-card')[6].getBoundingClientRect();({x:r.x+30,y:r.y+25})}`,
  );
  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: second.x,
    y: second.y,
  });
  await until(
    `document.querySelector('.flashcard-mia .mia-portrait').dataset.expression==='ponder'`,
    "curious thinking expression",
  );
  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: rect.x,
    y: rect.y,
  });
  await click(".word-card .bookmark-button");
  await until(
    `Boolean(document.querySelector('.word-card .bookmark-button.saved'))`,
    "favorite",
  );
  await click(".card-filters > .primary-button");
  await until(
    `Boolean(document.querySelector('.flashcard-flipper'))`,
    "review",
  );
  assert(
    await evaluate(`document.querySelector('[data-rating="good"]').disabled`),
    "rating requires reveal",
  );
  await click(".flashcard-flipper");
  await new Promise((done) => setTimeout(done, 600));
  await screenshot("ui-card-back.png");
  await click('[data-rating="good"]');
  await until(
    `document.querySelector('.review-topline')?.innerText.includes('2/5')`,
    "next review card",
  );
  await click(".review-topline .text-button");
  await until(
    `document.querySelectorAll('.word-card').length===25`,
    "review saved",
  );
  await send("Page.reload");
  await until(`Boolean(document.querySelector('.town-stage'))`, "reload");
  await click('button[aria-label="单词卡"]');
  await until(
    `document.querySelectorAll('.word-card').length===25`,
    "review survives reload",
  );
  await click('[data-scope="saved"]');
  await until(
    `document.querySelectorAll('.word-card').length===1`,
    "favorite survives reload",
  );
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await screenshot("ui-cards-mobile.png");
  assert(
    await evaluate(`document.documentElement.scrollWidth<=innerWidth`),
    "mobile card no overflow",
  );
  await click(".word-trigger");
  await until(
    `document.querySelector('.word-trigger').getAttribute('aria-expanded')==='true'`,
    "touch expands",
  );
  await click('button[aria-label="学习地图"]');
  await until(`Boolean(document.querySelector('.town-stage'))`, "mobile map");
  await click('[data-chapter="school"]');
  await new Promise((done) => setTimeout(done, 1100));
  await screenshot("ui-map-mobile.png");
  assert(
    await evaluate(`document.documentElement.scrollWidth<=innerWidth`),
    "mobile map no overflow",
  );
  assert(
    await evaluate(
      `document.querySelector('.today-panel .primary-button').getBoundingClientRect().bottom<=document.querySelector('.adventure-sidebar').getBoundingClientRect().top`,
    ),
    "mobile start above navigation",
  );
  await click('button[aria-label="打开设置"]');
  await click(".motion-toggle input");
  assert(
    await evaluate(
      `document.querySelector('.adventure-app').classList.contains('reduce-motion')`,
    ),
    "reduced motion",
  );
  await click(".modal-close");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await click(".profile-button");
  await until(
    `Boolean(document.querySelector('input[autocomplete="username"]'))`,
    "login",
  );
  await click(".auth-switch a");
  await until(
    `Boolean(document.querySelector('#account-confirmation'))`,
    "register",
  );
  await evaluate(
    `document.querySelectorAll('.auth-card input').forEach(input=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'LocalQaPass2026');input.dispatchEvent(new Event('input',{bubbles:true}));})`,
  );
  await click(".auth-card form > button");
  await until(
    `Boolean(document.querySelector('.welcome-continue'))`,
    "registration",
  );
  await click(".welcome-continue");
  await until(
    `document.querySelector('.profile-button')?.innerText.length>3`,
    "account home",
  );
  assert(errors.length === 0, "runtime errors " + errors.join(","));
  console.log(
    JSON.stringify(
      {
        passed: true,
        lessons: 9,
        steps: 27,
        cards: 26,
        checks: [
          "readable typography",
          "no adventure slogans",
          "unit catalog",
          "camera focus",
          "locked scene preview",
          "natural blink",
          "all tasks",
          "hover memory links",
          "flip",
          "review persistence",
          "favorites",
          "mobile touch",
          "mobile map",
          "reduced motion",
          "registration",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  socket.close();
}
