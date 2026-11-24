import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { send, evaluate, until, click, screenshot, assert, errors, base, socket } from "./qa-cdp.mjs";
const owner=crypto.randomUUID();
execFileSync(resolve("backend/venv/Scripts/python.exe"),["-B",resolve("docs/seed-assessment-qa.py"),owner],{env:process.env});
const answer = async (text) => {
  await evaluate(`{const t=document.querySelector('#german-answer');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,${JSON.stringify(text)});t.dispatchEvent(new Event('input',{bubbles:true}));}`);
  await until("!document.querySelector('.exercise-bottom > .primary-button').disabled","input ready");
  await click(".exercise-bottom > .primary-button");
};
const chooseMission=async(title)=>{
  await click('button[aria-label="练习"]');
  await until("Boolean(document.querySelector('.mission-card'))","mission list");
  await evaluate(`[...document.querySelectorAll('.mission-card')].find(b=>b.innerText.includes(${JSON.stringify(title)})).click()`);
  await until("Boolean(document.querySelector('.exercise-panel'))","mission ready");
};
try {
  await send("Page.enable");await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send("Page.navigate",{url:base});
  await until("Boolean(document.querySelector('.map-pin'))","initial ready");
  await evaluate(`localStorage.clear();localStorage.setItem('gfd-learner',${JSON.stringify(owner)});location.reload()`);
  await until("Boolean(document.querySelector('.map-pin'))","fresh ready");
  await chooseMission("把课堂需要写出来");
  await until("document.querySelector('.exercise-panel').dataset.step==='bag-location'","reported school step");
  await answer("Mein Buch ist in meinem Rucksack.");
  await until("Boolean(document.querySelector('.answer-continue'))","school alternative accepted");
  assert(await evaluate("document.querySelector('.answer-feedback').innerText.includes('回答正确')"),"school correct marker");
  assert(await evaluate("!document.querySelector('.dialogue-box').innerText.includes('再试')"),"no rewrite demand");
  await screenshot("assessment-school-correct.png");
  await click(".answer-continue");
  await until("Boolean(document.querySelector('.completion'))","school complete");
  await chooseMission("把课堂需要写出来");
  await until("document.querySelector('.exercise-panel').dataset.step==='pencil-choice'","new short writing");
  const unknown="In meinem Etui befindet sich ein Bleistift.";
  await answer(unknown);
  await until("document.querySelector('.answer-feedback')?.innerText.includes('暂未确认')","honest offline state");
  assert(await evaluate(`document.querySelector('#german-answer').value===${JSON.stringify(unknown)}&&!document.querySelector('.answer-continue')`),"unconfirmed preserves input and cannot advance");
  assert(await evaluate("!document.querySelector('.writing-feedback')"),"no fabricated missing criteria");
  await screenshot("assessment-unconfirmed.png");
  await answer("Ich habe einen Bleistift.");
  await until("Boolean(document.querySelector('.answer-continue'))","known answer works without AI");

  await click('button[aria-label="学习地图"]');
  await until("Boolean(document.querySelector('.town-stage'))","map");
  await evaluate("{const s=document.querySelector('select[aria-label=\"选择单元\"]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'einkaufen');s.dispatchEvent(new Event('change',{bubbles:true}));}");
  await until("document.querySelector('h1').innerText==='Einkaufen'","unit2");
  await chooseMission("核对小票，获得新服装");
  await until("document.querySelector('.exercise-panel').dataset.step==='items'","reported reading step");
  await answer("Mia kauft eine rosa Bluse und einen blauen Rock.");
  await until("Boolean(document.querySelector('.answer-continue'))","whole passage sentence accepted");
  assert(await evaluate("document.querySelector('.reading-context .evidence-line').dataset.line==='1'"),"source evidence");
  assert(await evaluate("getComputedStyle(document.querySelector('.answer-continue')).backgroundColor.includes('22, 134, 75')"),"continue success green");
  await screenshot("assessment-clothing-correct.png");
  assert(errors.length===0,"runtime errors "+errors.join(","));
  console.log(JSON.stringify({passed:true,checks:["school screenshot answer","full reading sentence","green Continue","no contradictory rewrite","unconfirmed is not incorrect","input retained","no false checklist","offline recovery","no runtime errors"]},null,2));
} catch(error) { await screenshot("assessment-failure.png");throw error; }
finally {socket.close();}
