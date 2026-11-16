// Start an isolated server and Chrome; DATA_DIR must be backend/.qa-data-*.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { send, evaluate, until, click, tap, screenshot, assert, errors, base, socket } from "./qa-cdp.mjs";
const owner = crypto.randomUUID();
const python = resolve("backend/venv/Scripts/python.exe");
execFileSync(python, ["-B", resolve("docs/seed-unit2-qa.py"), owner], { env: process.env });
const lessons = JSON.parse(execFileSync(python, ["-B", resolve("docs/export-qa-lessons.py")], { env: { ...process.env, GFD_QA_UNIT: "einkaufen" }, encoding: "utf8" }));
const setAnswer = (answer) => evaluate(`{const input=document.querySelector('#german-answer');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,${JSON.stringify(answer)});input.dispatchEvent(new Event('input',{bubbles:true}));}`);
const nav = async (label, selector) => { await click(`button[aria-label="${label}"]`); await until(`Boolean(document.querySelector(${JSON.stringify(selector)}))`, label); };
const unit = async (id) => {
  await until(`Boolean(document.querySelector('select[aria-label="选择单元"]'))`, "unit select");
  await evaluate(`{const s=document.querySelector('select[aria-label="选择单元"]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,${JSON.stringify(id)});s.dispatchEvent(new Event('change',{bubbles:true}));}`);
  await until(`document.querySelector('h1').innerText===${JSON.stringify(id === "einkaufen" ? "Einkaufen" : "Kennenlernen")}`, "selected unit");
};
try {
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: base });
  await until("Boolean(document.querySelector('.map-pin'))", "first load");
  await evaluate(`localStorage.clear();localStorage.setItem('gfd-learner',${JSON.stringify(owner)});localStorage.setItem('gfd-unit:guest','einkaufen');location.reload()`);
  await until("document.querySelector('h1')?.innerText==='Einkaufen'&&document.querySelectorAll('.map-pin').length===3", "mall ready");
  assert(await evaluate("document.querySelector('.coin-pill').innerText.includes('480')"), "seed first unit balance");
  assert(await evaluate("document.querySelector('.adventure-app').dataset.theme==='blue'"), "blue unit theme");
  await nav("背包", ".outfit-card");
  assert(await evaluate("document.querySelectorAll('.outfit-card').length===1&&document.querySelector('.outfit-card .mia-portrait').dataset.expression==='smile'"), "default outfit only");
  await nav("商店", ".shop-locked");
  assert(await evaluate("document.querySelector('.shop-locked').innerText.includes('0/3')"), "shop locked");
  await nav("学习地图", ".town-stage");

  for (const [width,height] of [[1440,1000],[1920,1080],[2560,1080],[390,844],[320,844]]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 650 });
    await evaluate("new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))");
    assert(await evaluate("document.documentElement.scrollWidth<=innerWidth"), "no overflow "+width);
    assert(await evaluate(`(()=>{
      const view=document.querySelector('.town-stage').getBoundingClientRect();
      const world=document.querySelector('.map-world').getBoundingClientRect();
      const pins=[...document.querySelectorAll('.map-pin')].map(b=>b.getBoundingClientRect());
      return world.left<=view.left+1&&world.right>=view.right-1&&world.top<=view.top+1&&world.bottom>=view.bottom-1&&pins.every((a,i)=>a.left>=view.left&&a.right<=view.right&&a.top>=view.top&&a.bottom<=view.bottom&&!pins.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top));
    })()`), "map fills viewport; pins visible, separate "+width);
    await screenshot("unit2-map-"+width+".png");
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await tap(".companion-portrait");
  assert(await evaluate("document.querySelector('.companion-dialogue').innerText.includes('Einkaufen')"), "Mia unit-specific greeting");
  await click(".companion-close");

  await tap('[data-chapter="electronics"]');
  await until("Boolean(document.querySelector('.scene-start-panel'))", "locked electronics preview");
  assert(await evaluate("document.querySelector('.scene-start-button').disabled&&!document.querySelector('.exercise-panel')"), "locked scene two-click preview");
  await click(".lesson-toolbar .text-button");
  const initialScale=await evaluate("Number(document.querySelector('.map-world').dataset.cameraScale)");
  await tap('[data-chapter="clothing"]');
  await until("document.querySelector('.town-stage')?.dataset.focused==='clothing'", "zoom target");
  assert(await evaluate("Number(document.querySelector('.map-world').dataset.cameraScale)>"+initialScale), "zoom increases scale");
  await until("Boolean(document.querySelector('.scene-start-panel'))", "clothing preview");
  assert(await evaluate("!document.querySelector('.exercise-panel')"), "first click scene only");
  await screenshot("unit2-clothing-preview.png");
  await tap(".scene-start-button");

  for (let m=0;m<lessons.length;m++) {
    const mission=lessons[m];
    for(const step of mission.steps) {
      await until(`document.querySelector('.exercise-panel')?.dataset.step===${JSON.stringify(step.id)}`, "step "+mission.id+"/"+step.id);
      if (m===0 && step===mission.steps[0]) await screenshot("unit2-reading.png");
      if (m===3 && step===mission.steps[0]) {
        await setAnswer("Katze"); await click(".exercise-bottom > .primary-button");
        await until("document.querySelector('.answer-feedback')?.innerText.includes('再试一次')&&!document.querySelector('.exercise-bottom > .primary-button').disabled", "wrong word");
        await screenshot("unit2-vocabulary-clues.png");
      }
      if (m===8 && step===mission.steps[2]) {
        await setAnswer("Wir sind zu zweit. Ich möchte eine Pizza ohne Fleisch. Ich trinke Wasser.");
        await click(".exercise-bottom > .primary-button");
        await until("Boolean(document.querySelector('.writing-feedback'))&&!document.querySelector('.exercise-bottom > .primary-button').disabled", "writing checklist");
        assert(await evaluate("document.querySelector('.writing-feedback').innerText.includes('请求结账')"), "missing bill feedback");
        await screenshot("unit2-writing-feedback.png");
      }
      await setAnswer(step.answer);
      await until("!document.querySelector('.exercise-bottom > .primary-button').disabled", "answer ready");
      const before=await evaluate("getComputedStyle(document.querySelector('.exercise-bottom > .primary-button')).backgroundColor");
      await click(".exercise-bottom > .primary-button");
      await until("Boolean(document.querySelector('.answer-feedback.correct'))", "accepted "+mission.id+"/"+step.id);
      await until(`getComputedStyle(document.querySelector('.answer-continue')).backgroundColor!==${JSON.stringify(before)}`, "correct continue changes color");
      if(step.card_id) {
        await until("Boolean(document.querySelector('.collect-word-button'))", "word offered");
        await click(".collect-word-button");
        await until("document.querySelector('.collect-word-button')?.innerText.includes('已加入')", "explicit word collected");
      }
      await click(".answer-continue");
    }
    await until("Boolean(document.querySelector('.completion'))", "completed "+mission.id);
    if(await evaluate("Boolean(document.querySelector('.word-collection [data-select-all]'))")) {
      await click(".word-collection [data-select-all]");
      await click(".collect-selected-button");
      await until("!document.querySelector('.word-collection [data-select-all]')", "collected chosen completion words");
    }
    if(m===2) {
      await until("Boolean(document.querySelector('.outfit-reward'))", "reward card");
      await screenshot("unit2-outfit-reward.png");
      await click(".outfit-reward button");
      await until("document.querySelectorAll('.outfit-card').length===2", "reward in backpack");
      await click('[data-outfit-card="pink-gingham"] button');
      await until("document.querySelector('[data-outfit-card=\"pink-gingham\"]').classList.contains('is-equipped')", "equip reward");
      await screenshot("unit2-backpack-pink.png");
      await nav("学习地图", ".town-stage");
      assert(await evaluate("document.querySelector('.map-companion .mia-portrait').dataset.outfit==='pink-gingham'&&document.querySelector('.map-companion .mia-portrait').dataset.expression==='smile'"), "Mia outfit and default expression on map");
      await nav("商店", '[data-outfit-card="blue-gingham"]');
      await click('[data-outfit-card="blue-gingham"] button');
      await until("document.querySelector('.coin-pill').innerText.includes('420')", "purchase deducts 240 coins");
      assert(await evaluate("document.querySelector('[data-outfit-card=\"blue-gingham\"] button').disabled"), "owned item not buyable again");
      await screenshot("unit2-shop-purchased.png");
      await nav("背包", ".outfit-card");
      await until("document.querySelectorAll('.outfit-card').length===3", "all outfits owned");
      await click('[data-outfit-card="blue-gingham"] button');
      await until("document.querySelector('[data-outfit-card=\"blue-gingham\"]').classList.contains('is-equipped')", "equip blue");
      await send("Page.reload");
      await until("document.querySelector('.map-companion .mia-portrait')?.dataset.outfit==='blue-gingham'", "outfit survives reload");
      await unit("kennenlernen");
      assert(await evaluate("document.querySelector('.adventure-app').dataset.theme==='green'&&document.querySelector('.map-companion .mia-portrait').dataset.outfit==='blue-gingham'"), "first unit preserved, outfit global");
      await unit("einkaufen");
      await tap('[data-chapter="electronics"]');
      await until("Boolean(document.querySelector('.scene-start-button'))", "electronics scene");
      assert(await evaluate("!document.querySelector('.exercise-panel')"), "electronics waits second click");
      await screenshot("unit2-electronics-preview.png");
      await tap(".scene-start-button");
    } else if(m<lessons.length-1) {
      await click(".completion-actions .primary-button");
      if(lessons[m+1].chapter!==mission.chapter) {
        await until("Boolean(document.querySelector('.town-stage'))", "next map");
        await tap(`[data-chapter="${lessons[m+1].chapter}"]`);
        await until("Boolean(document.querySelector('.scene-start-button'))", "next scene");
        assert(await evaluate("!document.querySelector('.exercise-panel')"), "restaurant waits second click");
        await screenshot("unit2-restaurant-preview.png");
        await tap(".scene-start-button");
      }
    }
  }
  assert(await evaluate("document.querySelector('.coin-pill').innerText.includes('780')"), "final balance after purchase");
  await nav("学习记录", ".record-section");
  assert(await evaluate("document.querySelectorAll('.evidence-row').length===9&&[...document.querySelectorAll('.evidence-row')].every(e=>!e.innerText.includes('未完成'))"), "unit2 progress complete");
  await nav("单词卡", ".word-card");
  assert(await evaluate("[...document.querySelectorAll('.word-trigger')].some(e=>e.innerText.includes('Handy'))"), "unit2 words in personal deck");
  assert(await evaluate("document.querySelector('.flashcard-mia .mia-portrait').dataset.outfit==='blue-gingham'"), "flashcards use selected outfit");
  await screenshot("unit2-flashcards.png");
  await nav("背包", ".outfit-card");
  await click('[data-outfit-card="school-uniform"] button');
  await until("document.querySelector('[data-outfit-card=\"school-uniform\"]').classList.contains('is-equipped')", "restore default");
  await nav("学习地图", ".town-stage");
  assert(await evaluate("document.querySelector('.map-companion .mia-portrait').dataset.outfit==='school-uniform'"), "restored original atlas");

  // Assert actual account boundaries through the running HTTP routes as well.
  const isolation=await evaluate(`(async()=>{
    const a=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'LocalUnit2QaPass2026'})}).then(r=>r.json());
    const hdr={'Authorization':'Bearer '+a.access_token,'Content-Type':'application/json'};
    const fresh=await fetch('/api/wardrobe',{headers:hdr}).then(r=>r.json());
    const forbidden=await fetch('/api/wardrobe/equip',{method:'POST',headers:hdr,body:JSON.stringify({outfit_id:'pink-gingham'})});
    return fresh.wallet.balance===0&&fresh.catalog.filter(i=>i.owned).length===1&&!fresh.shop_unlocked&&forbidden.status===403;
  })()`);
  assert(isolation,"new registered account isolated");
  assert(errors.length===0,"runtime errors "+errors.join(","));
  console.log(JSON.stringify({passed:true,lessons:9,steps:27,coinsAfterPurchase:780,outfits:3,checks:["five map widths","unit themes","two-click scene entry","all unit2 tasks","correct feedback","explicit flashcards","automatic outfit reward","coin purchase","all outfits equip","outfit survives reload","default restoration","account isolation"]},null,2));
} catch(error) {
  await screenshot("unit2-failure.png"); throw error;
} finally { socket.close(); }
