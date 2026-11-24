import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { send, evaluate, until, click, screenshot, assert, errors, base, socket } from "./qa-cdp.mjs";
const owner=crypto.randomUUID();
const logoDigest=createHash("sha256").update(await readFile(resolve("frontend/src/assets/logo.png"))).digest("hex");
execFileSync(resolve("backend/venv/Scripts/python.exe"),["-B",resolve("docs/seed-wardrobe-qa.py"),owner],{env:process.env});
const item='[data-outfit-card="pink-cardigan"]';
const nav=async(label,selector)=>{await click(`button[aria-label="${label}"]`);await until(`Boolean(document.querySelector(${JSON.stringify(selector)}))`,label);};
try {
  await send("Page.enable");await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send("Page.navigate",{url:base});await send("Page.bringToFront");
  await until("Boolean(document.querySelector('.map-pin'))","initial map");
  await evaluate(`localStorage.clear();localStorage.setItem('gfd-learner',${JSON.stringify(owner)});location.reload()`);
  await until("document.querySelector('.coin-pill')?.innerText.includes('660')","seeded account");
  await until("document.querySelector('.brand .project-logo')?.complete && document.querySelector('.brand .project-logo').naturalWidth===1536","project logo loaded");
  const favicon=await evaluate("fetch(document.querySelector('link[rel=icon]').href).then(async r=>({type:r.headers.get('content-type'),hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('')}))");
  assert(favicon.type.includes("image/png")&&favicon.hash===logoDigest,"favicon is original supplied logo PNG");
  assert(await evaluate("document.querySelector('.brand .project-logo').currentSrc===document.querySelector('link[rel=icon]').href"),"favicon and project branding share source");
  for(const [width,height] of [[1920,1080],[1024,768],[820,768],[390,844],[320,844]]) {
    await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<650});
    await evaluate("new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))");
    assert(await evaluate("document.documentElement.scrollWidth<=innerWidth"),"brand layout no overflow "+width);
    if(width>650) assert(await evaluate("(()=>{const a=document.querySelector('.brand .project-logo').getBoundingClientRect(),b=document.querySelector('.adventure-sidebar').getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&a.bottom<=document.querySelector('.adventure-sidebar nav').getBoundingClientRect().top})()"),"brand fits sidebar "+width);
  }
  await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await screenshot("project-logo-map.png");
  await nav("商店",item);
  assert(await evaluate(`document.querySelector('${item}').innerText.includes('240')`),"same 240 coin price");
  assert(await evaluate(`document.querySelector('${item} .mia-portrait').dataset.expression==='smile'`),"default preview expression");
  await screenshot("cardigan-shop.png");
  await click(item+" button");
  await until("document.querySelector('.coin-pill').innerText.includes('420')","purchase debit");
  assert(await evaluate(`document.querySelector('${item} button').disabled`),"repeat button disabled");
  const repeated=await evaluate(`fetch('/api/wardrobe/purchase',{method:'POST',headers:{'Content-Type':'application/json','X-Learner-ID':localStorage.getItem('gfd-learner')},body:JSON.stringify({outfit_id:'pink-cardigan'})}).then(r=>r.json()).then(j=>j.wallet.balance)`);
  assert(repeated===420,"retry does not charge twice");
  await nav("背包",item);
  await click(item+" button");
  await until(`document.querySelector('${item}').classList.contains('is-equipped')`,"equipped");
  await screenshot("cardigan-backpack.png");
  await nav("学习地图",".town-stage");
  await until("document.querySelector('.map-companion .mia-portrait').dataset.outfit==='pink-cardigan'","map outfit");
  const blinked=await evaluate("new Promise(resolve=>{const p=document.querySelector('.map-companion .mia-portrait');let closed=false;const o=new MutationObserver(()=>{if(p.dataset.blink==='closed')closed=true;else if(closed){o.disconnect();resolve(true)}});o.observe(p,{attributes:true,attributeFilter:['data-blink']});setTimeout(()=>{o.disconnect();resolve(false)},10000)})");
  assert(blinked,"new outfit random blink closes and reopens");
  await send("Page.reload");
  await until("document.querySelector('.map-companion .mia-portrait')?.dataset.outfit==='pink-cardigan'","reload retains outfit");
  await click('[data-chapter="bakery"]');
  await until("Boolean(document.querySelector('.scene-start-button'))","scene");
  assert(await evaluate("document.querySelector('.lesson-mia .mia-portrait').dataset.outfit==='pink-cardigan'"),"scene outfit");
  await screenshot("cardigan-scene.png");
  await nav("单词卡",".flashcard-mia");
  assert(await evaluate("document.querySelector('.flashcard-mia .mia-portrait').dataset.outfit==='pink-cardigan'"),"flashcard outfit");
  await nav("背包",item);
  for (const width of [390,320]) {
    await send("Emulation.setDeviceMetricsOverride",{width,height:844,deviceScaleFactor:1,mobile:true});
    await evaluate("new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))");
    assert(await evaluate("document.documentElement.scrollWidth<=innerWidth"),"mobile no overflow "+width);
  }
  await screenshot("cardigan-mobile.png");
  await click('[data-outfit-card="school-uniform"] button');
  await until("document.querySelector('[data-outfit-card=\"school-uniform\"]').classList.contains('is-equipped')","restore uniform");
  const isolated=await evaluate("fetch('/api/wardrobe',{headers:{'X-Learner-ID':crypto.randomUUID()}}).then(r=>r.json()).then(j=>!j.catalog.find(i=>i.id==='pink-cardigan').owned)");
  assert(isolated,"new costume account isolation");
  await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await click(".profile-button");
  await until("document.querySelector('.auth-card .project-logo')?.naturalWidth===1536","login logo");
  await screenshot("project-logo-login.png");
  await click(".auth-switch a");
  await until("Boolean(document.querySelector('#account-confirmation'))","register");
  for(const width of [390,320]) {
    await send("Emulation.setDeviceMetricsOverride",{width,height:844,deviceScaleFactor:1,mobile:true});
    await evaluate("new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))");
    assert(await evaluate("document.documentElement.scrollWidth<=innerWidth"),"auth logo no overflow "+width);
  }
  await screenshot("project-logo-register-mobile.png");
  await evaluate("document.querySelectorAll('.auth-card input').forEach(i=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'CardiganQaPass2026');i.dispatchEvent(new Event('input',{bubbles:true}));})");
  await click(".auth-card form > button");
  await until("Boolean(document.querySelector('.welcome-continue'))","registration welcome");
  assert(await evaluate("document.querySelector('.welcome-card .project-logo').naturalWidth===1536"),"welcome project logo");
  await screenshot("project-logo-welcome.png");
  assert(errors.length===0,"runtime errors "+errors.join(","));
  console.log(JSON.stringify({passed:true,outfit:"pink-cardigan",price:240,checks:["shop preview","purchase","idempotent retry","backpack equip","map and scene","flashcards","random blink","reload persistence","default restoration","mobile320/390","account isolation","favicon original PNG hash","branding five widths","login and register logo","registration welcome"]},null,2));
} catch(error){await screenshot("cardigan-failure.png");throw error;}
finally{socket.close();}
