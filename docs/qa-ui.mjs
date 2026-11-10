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
  await send("Network.enable");
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
    `document.querySelector('.map-pin')&&!document.querySelector('.map-pin').disabled`,
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
    "town-panorama.png",
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
    `document.querySelector('.town-stage').dataset.focused==='overview'`,
    "overview first",
  );
  await new Promise((done) => setTimeout(done, 1000));
  assert(
    await evaluate(
      `!document.querySelector('.map-connectors')&&!document.querySelector('.today-panel')&&!document.querySelector('.exercise-panel')`,
    ),
    "only destination buttons on map",
  );
  assert(
    await evaluate(
      `(()=>{const world=document.querySelector('.map-world').getBoundingClientRect(),view=document.querySelector('.town-stage').getBoundingClientRect();return world.left<=view.left+2&&world.top<=view.top+2&&world.right>=view.right-2&&world.bottom>=view.bottom-2;})()`,
    ),
    "extended scenery fills the viewport",
  );
  await screenshot("ui-map-overview.png");
  await tap(".map-companion .companion-portrait");
  await until(
    `document.querySelector('.companion-dialogue')?.innerText.includes('Guten Tag')`,
    "Mia bilingual greeting",
  );
  await click(".companion-topics button");
  assert(
    await evaluate(
      `document.querySelector('.companion-next').innerText.includes('面包店')`,
    ),
    "Mia recommendation follows progress",
  );
  await screenshot("ui-map-mia.png");
  await click(".companion-close");

  const initialScale = await evaluate(
    `Number(document.querySelector('.map-world').dataset.cameraScale)`,
  );
  const initialWidth = await evaluate(
    `document.querySelector('.map-world').getBoundingClientRect().width`,
  );
  await tap('[data-chapter="park"]');
  await until(
    `document.querySelector('.town-stage')?.dataset.focused==='park'`,
    "park zoom target",
  );
  assert(
    await evaluate(
      `Number(document.querySelector('.map-world').dataset.cameraScale)>${initialScale}`,
    ),
    "camera zooms in",
  );
  await new Promise((done) => setTimeout(done, 200));
  assert(
    await evaluate(
      `document.querySelector('.map-world').getBoundingClientRect().width>${initialWidth}+10`,
    ),
    "visible scale transition",
  );
  await screenshot("ui-map-zoom.png");
  await until(
    `Boolean(document.querySelector('.scene-park'))&&Boolean(document.querySelector('.scene-start-panel'))`,
    "locked scene preview",
  );
  assert(
    await evaluate(
      `!document.querySelector('.exercise-panel')&&document.querySelector('.scene-start-button').disabled`,
    ),
    "locked tasks cannot start",
  );
  assert(taskStarts === 0, "scene previews do not start tasks");
  await screenshot("ui-scene-locked.png");
  await click(".lesson-toolbar .text-button");
  await until(
    `document.querySelector('.town-stage')?.dataset.focused==='overview'`,
    "return to overview",
  );
  await tap('[data-chapter="bakery"]');
  await until(
    `Boolean(document.querySelector('.scene-bakery'))&&Boolean(document.querySelector('.scene-start-panel'))`,
    "first click enters scene only",
  );
  assert(taskStarts === 0, "visiting bakery makes no task request");
  assert(
    await evaluate(
      `!document.querySelector('.exercise-panel')&&!document.querySelector('.scene-task-pane')`,
    ),
    "no exercise before second click",
  );
  await screenshot("ui-bakery-scene.png");
  await click(".scene-companion-button");
  assert(
    await evaluate(
      `document.querySelector('.dialogue-box').innerText.includes('Schau mal')`,
    ),
    "Mia encourages observation",
  );
  await tap(".scene-start-button");
  await until(
    `Boolean(document.querySelector('.exercise-panel'))`,
    "second click starts task",
  );
  assert(taskStarts === 1, "one explicit task start");
  assert(
    await evaluate(
      `document.querySelector('.scene-task-pane').getBoundingClientRect().left>=document.querySelector('.lesson-scene').getBoundingClientRect().right`,
    ),
    "task appears beside scene",
  );
  await screenshot("ui-bakery-task.png");
  await click(".scene-task-picker summary");
  assert(
    await evaluate(
      `document.querySelectorAll('.scene-task-picker .mission-card').length===3`,
    ),
    "three tasks in scene picker",
  );
  await click(".scene-task-picker summary");
  const blinked = await evaluate(
    `new Promise(resolve=>{const portrait=document.querySelector('.lesson-mia .mia-portrait');let closed=false;const observer=new MutationObserver(()=>{if(portrait.dataset.blink==='closed')closed=true;else if(closed){observer.disconnect();resolve(true);}});observer.observe(portrait,{attributes:true,attributeFilter:['data-blink']});setTimeout(()=>{observer.disconnect();resolve(false);},10000);})`,
  );
  assert(blinked, "scene Mia blinks");
  await click(".scene-companion-button");
  await click(".scene-companion-actions button");
  await until(
    `Boolean(document.querySelector('.answer-feedback'))&&!document.querySelector('.hint-actions button').disabled`,
    "Mia hint arrives",
  );

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
    if (m < lessons.length - 1) {
      await click(".completion-actions .primary-button");
      if (lessons[m + 1].chapter !== mission.chapter) {
        await until(
          `document.querySelector('.town-stage')?.dataset.focused==='overview'`,
          "next place returns to overview",
        );
        await tap(`[data-chapter="${lessons[m + 1].chapter}"]`);
        await until(
          `Boolean(document.querySelector('.scene-start-button'))`,
          "next destination scene",
        );
        assert(
          await evaluate(`!document.querySelector('.exercise-panel')`),
          "next scene waits for task click",
        );
        await tap(".scene-start-button");
      }
    }
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
  await new Promise((done) => setTimeout(done, 1000));
  await screenshot("ui-map-mobile.png");
  assert(
    await evaluate(`document.documentElement.scrollWidth<=innerWidth`),
    "mobile map no overflow",
  );
  assert(
    await evaluate(
      `(()=>{const view=document.querySelector('.town-stage').getBoundingClientRect();return [...document.querySelectorAll('.map-pin')].every(button=>{const r=button.getBoundingClientRect();return r.left>=view.left&&r.right<=view.right&&r.top>=view.top&&r.bottom<=view.bottom;});})()`,
    ),
    "mobile map buttons visible",
  );
  await tap('[data-chapter="school"]');
  await until(
    `Boolean(document.querySelector('.scene-school'))&&Boolean(document.querySelector('.scene-start-button'))`,
    "mobile scene entry",
  );
  assert(
    await evaluate(`!document.querySelector('.exercise-panel')`),
    "mobile first click only visits",
  );
  await tap(".scene-start-button");
  await until(
    `Boolean(document.querySelector('.exercise-panel'))`,
    "mobile explicit start",
  );
  await screenshot("ui-scene-mobile.png");
  assert(
    await evaluate(`document.documentElement.scrollWidth<=innerWidth`),
    "mobile scene no overflow",
  );
  await click(".lesson-toolbar .text-button");
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
          "overview map",
          "visible zoom",
          "two-click scene then task",
          "Mia greeting and recommendation",
          "Mia observation and hints",
          "side task pane",
          "return to overview",
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
} catch (error) {
  await screenshot("ui-failure.png");
  throw error;
} finally {
  socket.close();
}
