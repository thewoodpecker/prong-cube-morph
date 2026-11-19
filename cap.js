const {chromium}=require('playwright-core');
const fs=require('fs');
(async()=>{
 const [,,mode,out,fps,theme]=process.argv;
 const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'});
 const p=await b.newPage({viewport:{width:720,height:720},deviceScaleFactor:+(process.env.DSF||1)});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file://'+__dirname+'/index.html?capture=1'+(theme?'&theme='+theme:''));
 await p.evaluate(()=>document.fonts.ready);
 const L=await p.evaluate(()=>window.__LOOP);
 fs.mkdirSync(out,{recursive:true});
 const st=await p.$('#stage');
 if(mode==='times'){const ts=fps.split(',').map(Number);for(let i=0;i<ts.length;i++){await p.evaluate(t=>window.__render(t),L.start+ts[i]);await st.screenshot({path:`${out}/s${String(i).padStart(3,'0')}.png`});}}
 else{const f=+fps,n=Math.round(L.len*f);for(let i=0;i<n;i++){await p.evaluate(t=>window.__render(t),L.start+i/f);await st.screenshot({path:`${out}/f${String(i).padStart(4,'0')}.png`});}}
 console.log(JSON.stringify({L,errs}));
 await b.close();
})();
