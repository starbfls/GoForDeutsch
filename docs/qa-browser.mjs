// Local browser QA. Start Chrome headless with remote debugging on 9223 first.
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const directory = resolve('artifacts');
await mkdir(directory, { recursive: true });
const target = await (await fetch('http://127.0.0.1:9223/json/new?http://127.0.0.1:8000', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((done, reject) => { socket.onopen = done; socket.onerror = reject; });
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
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const until = async (expression, description) => {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await new Promise((done) => setTimeout(done, 150));
  }
  throw new Error('Timed out: ' + description);
};
const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const screenshot = async (name) => {
  await evaluate('document.fonts.ready');
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile(resolve(directory, name), Buffer.from(result.data, 'base64'));
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:8000' });
  await until(`document.querySelector('.bakery-pin') && !document.querySelector('.bakery-pin').disabled`, 'town ready');
  await evaluate(`localStorage.clear(); localStorage.setItem('gfd-learner',crypto.randomUUID()); location.reload();`);
  await until(`document.querySelector('.today-panel .primary-button') && !document.querySelector('.today-panel .primary-button').disabled`, 'fresh guest');
  await until(`Array.from(document.images).every(i=>i.complete)`, 'images ready');
  await new Promise((done) => setTimeout(done, 600));
  await screenshot('town-desktop.png');
  assert(await evaluate(`document.querySelectorAll('.mission-card:disabled').length === 2`), 'later missions should be locked');
  await click('.today-panel .primary-button');
  await until(`document.querySelectorAll('.choice-option').length === 3`, 'choice lesson');
  await click('.choice-option:nth-child(1)');
  await click('.exercise-bottom > .primary-button');
  await until(`document.querySelector('.answer-feedback') && !document.querySelector('.exercise-bottom > .primary-button').disabled`, 'wrong answer feedback');
  assert(await evaluate(`!document.querySelector('.answer-feedback.correct')`), 'wrong answer must not pass');
  await click('.choice-option:nth-child(2)');
  await click('.exercise-bottom > .primary-button');
  await until(`Boolean(document.querySelector('.answer-feedback.correct'))`, 'correct answer');
  await screenshot('lesson-desktop.png');
  await click('.exercise-bottom > .primary-button');
  await until(`Boolean(document.querySelector('.tile-bank'))`, 'sentence tiles');
  // Leave and re-enter to check persisted cursor.
  await click('.lesson-toolbar .text-button');
  await click('.today-panel .primary-button');
  await until(`Boolean(document.querySelector('.tile-bank'))`, 'resume sentence');
  for (const index of [2, 4, 3, 1, 0]) await click(`.tile-bank button:nth-child(${index + 1})`);
  await click('.exercise-bottom > .primary-button');
  await until(`Boolean(document.querySelector('.answer-feedback.correct'))`, 'sentence accepted');
  await click('.exercise-bottom > .primary-button');
  await until(`Boolean(document.querySelector('#german-answer'))`, 'independent expression');
  await evaluate(`{ const input=document.querySelector('#german-answer'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'Ein Brötchen, bitte.'); input.dispatchEvent(new Event('input',{bubbles:true})); }`);
  await until(`!document.querySelector('.exercise-bottom > .primary-button').disabled`, 'text entered');
  await click('.exercise-bottom > .primary-button');
  await until(`Boolean(document.querySelector('.answer-feedback.correct'))`, 'natural alternative accepted');
  await click('.exercise-bottom > .primary-button');
  await until(`Boolean(document.querySelector('.completion'))`, 'completion');
  assert(await evaluate(`document.querySelector('.xp-pill').innerText.includes('40')`), '40 XP awarded');
  await screenshot('completion-desktop.png');
  await click('.completion-actions .secondary-button');
  await until(`Boolean(document.querySelector('.evidence-row'))`, 'notebook');
  assert(await evaluate(`document.querySelector('.evidence-row').innerText.includes('提示后完成')`), 'hinted evidence recorded');
  await click('.vocab-card summary');
  assert(await evaluate(`Boolean(document.querySelector('.vocab-card[open]'))`), 'vocabulary expands');
  await screenshot('notebook-desktop.png');
  await click('.nav-item');
  await until(`Boolean(document.querySelector('.town-stage'))`, 'back to town');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await screenshot('town-mobile.png');
  assert(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), 'mobile has no horizontal overflow');
  await click('.today-panel .primary-button');
  await until(`Boolean(document.querySelector('.exercise-panel'))`, 'mobile lesson');
  await screenshot('lesson-mobile.png');
  assert(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), 'mobile lesson has no horizontal overflow');
  await click('.lesson-toolbar .text-button');
  await click('.sidebar-bottom .nav-item');
  await until(`Boolean(document.querySelector('.settings-modal'))`, 'settings');
  await click('.motion-toggle input');
  assert(await evaluate(`document.querySelector('.adventure-app').classList.contains('reduce-motion')`), 'motion setting applies');
  await click('.modal-close');

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await click('.profile-button');
  await until(`Boolean(document.querySelector('.auth-card'))`, 'login screen');
  await screenshot('login-desktop.png');
  await click('.auth-switch a');
  await until(`document.querySelectorAll('.auth-card input').length === 2 && document.querySelector('.auth-card h2').innerText.includes('领取')`, 'register screen');
  await evaluate(`document.querySelectorAll('.auth-card input').forEach(input=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'LocalQaPass2026');input.dispatchEvent(new Event('input',{bubbles:true}));})`);
  await click('.auth-card form > button');
  await until(`document.querySelector('.profile-button') && !document.querySelector('.profile-button').innerText.includes('体验冒险家')`, 'registered account');
  const username = await evaluate(`document.querySelector('.profile-button').innerText.trim().replace('🌿','').trim()`);
  assert(username.length > 3, 'generated username visible');
  await click('.profile-button');
  await until(`document.querySelector('.profile-button') && document.querySelector('.profile-button').innerText.includes('体验冒险家')`, 'logged out');
  await click('.profile-button');
  await until(`Boolean(document.querySelector('input[autocomplete="username"]'))`, 'login form');
  await evaluate(`{ const input=document.querySelector('input[autocomplete="username"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(username)});input.dispatchEvent(new Event('input',{bubbles:true})); const password=document.querySelector('input[autocomplete="current-password"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(password,'LocalQaPass2026');password.dispatchEvent(new Event('input',{bubbles:true})); }`);
  await click('.auth-card form > button');
  await until(`document.querySelector('.profile-button') && document.querySelector('.profile-button').innerText.includes(${JSON.stringify(username)})`, 'login successful');
  await send('Page.reload');
  await until(`document.querySelector('.profile-button') && document.querySelector('.profile-button').innerText.includes(${JSON.stringify(username)})`, 'login restored after reload');

  assert(errors.length === 0, 'browser runtime errors: ' + errors.join(', '));
  console.log(JSON.stringify({ passed: true, checks: ['town', 'locked missions', 'incorrect answer', 'correction', 'sentence tiles', 'resume', 'free expression', 'completion XP', 'notebook evidence', 'vocabulary expansion', 'mobile overflow', 'mobile lesson', 'reduced motion', 'registration', 'logout', 'login', 'login restoration'], screenshots: ['town-desktop.png','lesson-desktop.png','completion-desktop.png','notebook-desktop.png','town-mobile.png','lesson-mobile.png'] }, null, 2));
} finally {
  socket.close();
}
