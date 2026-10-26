/* Shared record blocks. Every figure is settled picks from the live Bets tab.
   Blank dates stay in All time only. Units are profit/loss ÷ £5, shown with a plain sign. */
(function(root){
  const UNIT=5,RULE='2026-10-21',SHEET='1nDay5elWFLF9GrzxfSGLpzpmSLSMx4FI38IFklZJvYs';
  const ISO=/^\d{4}-\d{2}-\d{2}$/;
  const money=s=>{if(s==null)return NaN;s=String(s).replace(/[£,\s]/g,'');return s===''?NaN:parseFloat(s)};
  const settled=r=>['Won','Lost','Void'].includes(r.result);
  const dated=r=>ISO.test(String(r.date||'').trim());
  const koKey=r=>{const t=String(r.kickoff_uk||'').match(/(\d+):(\d+)(?::\d+)?\s*(am|pm)?/i);let h=0,mi=0;if(t){h=+t[1]%12;mi=+t[2];if(/pm/i.test(t[3]||''))h+=12;if(!t[3])h=+t[1]}return (r.date||'')+' '+String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0')};
  const pence=s=>{const n=money(s);return isFinite(n)?Math.round(n*100):0};
  function agg(rows){let w=0,l=0,v=0,st=0,pl=0;rows.forEach(r=>{if(!settled(r))return;if(r.result==='Won')w++;else if(r.result==='Lost')l++;else v++;st+=pence(r.stake);pl+=pence(r.profit_loss)});const stake=st/100,pounds=pl/100;return{w,l,v,st:stake,pl:pounds,n:w+l+v,roi:stake?pounds/stake*100:0}}
  function slices(rows,ym){
    const list=rows||[];
    const order=list.filter(r=>settled(r)&&dated(r)).slice().sort((a,b)=>koKey(a).localeCompare(koKey(b))||((a._id||0)-(b._id||0)));
    return{
      since:agg(list.filter(r=>settled(r)&&dated(r)&&r.date>=RULE)),
      all:agg(list.filter(settled)),
      last30:agg(order.slice(-30)),
      month:agg(list.filter(r=>settled(r)&&dated(r)&&String(r.date).startsWith(ym)))
    };
  }
  function unitsPlain(pl){const p=Math.round(Number(pl)*100);const neg=p<0,abs=Math.abs(p);const tenths=Math.floor((abs+25)/50);if(!tenths)return '0.0u';return (neg?'-':'+')+Math.floor(tenths/10)+'.'+(tenths%10)+'u'}
  function roiPlain(roi){const n=Number(roi);if(!isFinite(n)||n===0)return '0.0%';const neg=n<0,tenths=Math.floor(Math.abs(n)*10+0.5);if(!tenths)return '0.0%';return (neg?'-':'+')+Math.floor(tenths/10)+'.'+(tenths%10)+'%'}
  function line(a){const n=a.n;return `<span class="recfig">${a.w}-${a.l}-${a.v}</span> <span class="recfig">${unitsPlain(a.pl)}</span> <span class="recfig">ROI ${roiPlain(a.roi)}</span> <span class="recmeta">${n} pick${n===1?'':'s'}</span>`}
  const clvNorm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
  function trueCloses(j){return ((j&&j.rows)||[]).filter(r=>r&&r.approximate!==true&&isFinite(+r.posted)&&isFinite(+r.closing)&&+r.posted>1&&+r.closing>1)}
  function clvHit(row,bet){if(clvNorm(row.selection)!==clvNorm(bet.selection))return false;if(row.match&&bet.match){const a=clvNorm(row.match),b=clvNorm(bet.match);if(a!==b&&!a.includes(b)&&!b.includes(a))return false}else if((row.match||bet.match)&&!(row.match&&bet.match))return false;const bd=String(bet.date||''),rd=String(row.date||'');if(bd&&rd&&bd!==rd)return false;return true}
  const decOdds=v=>{const n=+String(v??'').replace(/[£,\s]/g,'');return n>1&&isFinite(n)?n:NaN};
  function closeFromNote(notes){const s=String(notes||''),m=s.match(/\bClos(?:ed|ing price)\s+(\d+\.\d{1,3})/i);if(!m)return null;const closing=+m[1];if(!(closing>1))return null;const rest=s.slice(m.index+m[0].length);let book='';
    const named=rest.match(/^\s+([A-Za-z0-9][\w.&'+-]*(?:\s+[A-Za-z0-9][\w.&'+-]*){0,3})(?=\s*(?:\(|[.,;]|Fair\b|checked\b|https?:|$))/);
    if(named&&!/^(supplied|at|on|only|tbc)$/i.test(named[1]))book=named[1].trim();
    else{const paren=rest.match(/^\s*\(([^)]+)\)/);if(paren&&!/supplied|tipster|real close|estimate|indicative|tbc|n\/a/i.test(paren[1]))book=paren[1].trim()}
    return{closing,book}}
  function closeInfo(r,clv){const row=trueCloses(clv).find(x=>clvHit(x,r));
    let closing=NaN,book='';
    if(row){closing=+row.closing;book=String(row.books||'').trim()}
    else{const n=closeFromNote(r&&r.notes);if(n){closing=n.closing;book=n.book}}
    if(!(closing>1)){if(/\bClos(?:ed|ing price)\s+TBC\b/i.test(String(r&&r.notes||'')))return{tbc:true};return null}
    let took=decOdds(r.odds);if(!isFinite(took)&&row&&+row.posted>1)took=+row.posted;
    const beat=isFinite(took)?(took>closing+1e-9?1:took<closing-1e-9?-1:0):null;
    return{took:isFinite(took)?took:null,tookRaw:r.odds,closing,book,beat}}
  function beatLine(rows,clv){const rec=(rows||[]).map(r=>closeInfo(r,clv)).filter(x=>x&&!x.tbc);const y=rec.length,x=rec.filter(i=>i.beat>0).length;return `Beat the close on ${x} of ${y} recorded pick${y===1?'':'s'}${y<20?' (early sample)':''}`}
  function parseCsv(text){const rows=[];let row=[],cur='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}else if(c==='"')q=true;else if(c===','){row.push(cur);cur=''}else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur=''}else if(c!=='\r')cur+=c}if(cur.length||row.length){row.push(cur);rows.push(row)}const header=(rows.shift()||[]).map(h=>h.trim());return rows.filter(r=>r.some(x=>String(x).trim()!=='')).map(r=>{const o={};header.forEach((h,i)=>o[h]=r[i]??'');return o})}
  function sectionHtml(rows,ym,beat,howHref){const s=slices(rows,ym);const how=howHref?`<a class="reclink" href="${howHref}">How we bet</a>`:`<button type="button" class="reclink" data-how="1">How we bet</button>`;
    return `<p class="reclead">${beat}</p>
<article class="recblock"><h2>Since 21 Oct 2026 (new rules)</h2><p class="recrow"><span class="recnums">${line(s.since)}</span> ${how}</p></article>
<article class="recblock"><h2>All time</h2><p class="recnums">${line(s.all)}</p></article>
<p class="recnote">Rules changed 21 Oct: flat 1u singles at 1.50–2.49, priced against Pinnacle fair.</p>
<article class="recblock"><h2>Last 30 picks</h2><p class="recnums">${line(s.last30)}</p></article>
<article class="recblock"><h2>This month</h2><p class="recnums">${line(s.month)}</p></article>`}
  function ensureCss(){if(typeof document==='undefined'||document.getElementById('ptxrec-css'))return;const st=document.createElement('style');st.id='ptxrec-css';st.textContent='#ptxrec{text-align:left;max-width:720px;margin:16px auto;background:#060c16;color:#fff;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}#ptxrec .reclead{margin:0 0 8px;color:#fff;font-size:18px;font-weight:800;line-height:1.35}#ptxrec .recblock{padding:8px 0 2px;border-top:1px solid rgba(255,255,255,.08)}#ptxrec .recblock h2{margin:0 0 4px;font-size:12px;letter-spacing:.6px;text-transform:uppercase;color:#8394ad;font-weight:700}#ptxrec .recnums,#ptxrec .recfig{color:#fff;font-weight:800;font-variant-numeric:tabular-nums}#ptxrec .recmeta{color:#8394ad;font-weight:600}#ptxrec .recnote{margin:8px 0 4px;color:#8394ad;font-size:13px;line-height:1.4}#ptxrec .recrow{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px;margin:0}#ptxrec .reclink{color:#fff;font-weight:700;text-decoration:underline}';document.head.appendChild(st)}
  function fill(el,rows,ym,beat,howHref){ensureCss();el.innerHTML=sectionHtml(rows,ym,beat,howHref)}
  async function boot(){const el=document.getElementById('ptxrec');if(!el)return;el.textContent='Loading the record…';
    try{const src=document.currentScript&&document.currentScript.src;const base=src?new URL('./',src):new URL('./',location.href);
      const csv=await fetch(`https://docs.google.com/spreadsheets/d/${SHEET}/gviz/tq?tqx=out:csv&sheet=Bets&_=${Date.now()}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.text()});
      const raw=parseCsv(csv);raw.forEach((r,i)=>r._id=i+2);const rows=raw.filter(r=>r.selection&&(r.date||r.match));
      let clv=null;try{clv=await fetch(new URL('clv.json',base),{cache:'no-store'}).then(r=>{if(!r.ok)throw 0;return r.json()})}catch(e){}
      const ym=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'}).slice(0,7);
      fill(el,rows,ym,beatLine(rows,clv),new URL('./#how',base).href)}catch(e){el.textContent='The live record could not be loaded.'}}
  root.ptxRecord={UNIT,agg,slices,line,unitsPlain,roiPlain,closeInfo,beatLine,parseCsv,fill};
  if(typeof document!=='undefined')boot();
})(typeof window!=='undefined'?window:globalThis);
