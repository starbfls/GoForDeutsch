// CSS-only review of the production atlases; no bitmap manipulation.
import { OUTFIT_APPEARANCES, MIA_EXPRESSIONS, miaSpriteStyle } from "../frontend/src/components/miaAppearance.js";
import { send, evaluate, until, screenshot, assert, base, socket } from "./qa-cdp.mjs";
try {
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1340, height: 730, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate",{url:base});
  await until("Boolean(document.querySelector('.mia-sprite'))","app styles ready");
  for(const id of ["pink-gingham","blue-gingham"]) {
    const frames=Object.entries(MIA_EXPRESSIONS).map(([name,expression])=>({name,label:expression.label,style:miaSpriteStyle(name,id)}));
    await evaluate(`(()=>{
      document.body.innerHTML='<main class="adventure-app" style="padding:20px;background:#dce8f3"><h1 style="font-size:24px;margin:0 0 16px">${id}</h1><div id="frames" style="display:grid;grid-template-columns:repeat(6,1fr);gap:16px"></div></main>';
      for(const f of ${JSON.stringify(frames)}) {
        const card=document.createElement('div');card.style='display:grid;justify-items:center;background:#f5f8fc;border-radius:12px;padding:8px';
        const portrait=document.createElement('div');portrait.className='mia-portrait';portrait.style.width='175px';
        const sprite=document.createElement('div');sprite.className='mia-sprite';Object.assign(sprite.style,f.style);
        portrait.append(sprite);card.append(portrait);const label=document.createElement('span');label.textContent=f.name;card.append(label);document.querySelector('#frames').append(card);
      }
    })()`);
    await evaluate(`new Promise((done,fail)=>{const i=new Image();i.onload=done;i.onerror=fail;i.src=${JSON.stringify(OUTFIT_APPEARANCES[id].image)};})`);
    assert(await evaluate("document.querySelectorAll('.mia-sprite').length===12"),"all expressions");
    await screenshot("mia-"+id+"-expressions.png");
  }
  console.log("Both outfit atlases rendered: 12 frames each.");
} finally { socket.close(); }
