import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { send, evaluate, until, click, screenshot, assert, errors, base, socket } from "./qa-cdp.mjs";
const owner=crypto.randomUUID();
execFileSync(resolve("backend/venv/Scripts/python.exe"),["-B",resolve("docs/seed-wardrobe-qa.py"),owner],{env:process.env});
const item='[data-outfit-card="casual-hoodie"]';
const nav=async(label,selector)=>{await click(`button[aria-label="${label}"]`);await until(`Boolean(document.querySelector(${JSON.stringify(selector)}))`,label);};
try {
  await send("Page.enable");await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send("Page.navigate",{url:base});await send("Page.bringToFront");
  await until("Boolean(document.querySelector('.map-pin'))","initial map");
  await evaluate(`localStorage.clear();localStorage.setItem('gfd-learner',${JSON.stringify(owner)});location.reload()`);
  await until("document.querySelector('.coin-pill')?.innerText.includes('660')","seeded account");
  await nav("商店",item);
  assert(await evaluate(`document.querySelector('${item}').innerText.includes('240')`),"same 240 coin price");
  assert(await evaluate(`document.querySelector('${item} .mia-portrait').dataset.expression==='smile'`),"default preview expression");
  await screenshot("hoodie-shop.png");
  await click(item+" button");
  await until("document.querySelector('.coin-pill').innerText.includes('420')","purchase debit");
  assert(await evaluate(`document.querySelector('${item} button').disabled`),"repeat button disabled");
  const repeated=await evaluate(`fetch('/api/wardrobe/purchase',{method:'POST',headers:{'Content-Type':'application/json','X-Learner-ID':localStorage.getItem('gfd-learner')},body:JSON.stringify({outfit_id:'casual-hoodie'})}).then(r=>r.json()).then(j=>j.wallet.balance)`);
  assert(repeated===420,"retry does not charge twice");
  await nav("背包",item);
  await click(item+" button");
  await until(`document.querySelector('${item}').classList.contains('is-equipped')`,"equipped");
  await screenshot("hoodie-backpack.png");
  await nav("学习地图",".town-stage");
  await until("document.querySelector('.map-companion .mia-portrait').dataset.outfit==='casual-hoodie'","map outfit");
  const blinked=await evaluate("new Promise(resolve=>{const p=document.querySelector('.map-companion .mia-portrait');let closed=false;const o=new MutationObserver(()=>{if(p.dataset.blink==='closed')closed=true;else if(closed){o.disconnect();resolve(true)}});o.observe(p,{attributes:true,attributeFilter:['data-blink']});setTimeout(()=>{o.disconnect();resolve(false)},10000)})");
  assert(blinked,"new outfit random blink closes and reopens");
  await send("Page.reload");
  await until("document.querySelector('.map-companion .mia-portrait')?.dataset.outfit==='casual-hoodie'","reload retains outfit");
  await click('[data-chapter="bakery"]');
  await until("Boolean(document.querySelector('.scene-start-button'))","scene");
  assert(await evaluate("document.querySelector('.lesson-mia .mia-portrait').dataset.outfit==='casual-hoodie'"),"scene outfit");
  await screenshot("hoodie-scene.png");
  await nav("单词卡",".flashcard-mia");
  assert(await evaluate("document.querySelector('.flashcard-mia .mia-portrait').dataset.outfit==='casual-hoodie'"),"flashcard outfit");
  await nav("背包",item);
  for (const width of [390,320]) {
    await send("Emulation.setDeviceMetricsOverride",{width,height:844,deviceScaleFactor:1,mobile:true});
    await evaluate("new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))");
    assert(await evaluate("document.documentElement.scrollWidth<=innerWidth"),"mobile no overflow "+width);
  }
  await screenshot("hoodie-mobile.png");
  await click('[data-outfit-card="school-uniform"] button');
  await until("document.querySelector('[data-outfit-card=\"school-uniform\"]').classList.contains('is-equipped')","restore uniform");
  const isolated=await evaluate("fetch('/api/wardrobe',{headers:{'X-Learner-ID':crypto.randomUUID()}}).then(r=>r.json()).then(j=>!j.catalog.find(i=>i.id==='casual-hoodie').owned)");
  assert(isolated,"new costume account isolation");
  assert(errors.length===0,"runtime errors "+errors.join(","));
  console.log(JSON.stringify({passed:true,outfit:"casual-hoodie",price:240,checks:["shop preview","purchase","idempotent retry","backpack equip","map and scene","flashcards","random blink","reload persistence","default restoration","mobile320/390","account isolation"]},null,2));
} catch(error){await screenshot("hoodie-failure.png");throw error;}
finally{socket.close();}
