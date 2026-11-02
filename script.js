'use strict';
/* 1. CONFIG */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addD=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)};
const TODAY=iso(new Date());
const uid=()=>crypto.randomUUID?crypto.randomUUID():'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const KEY='orbit.demo.v1';
const PD={'7D':7,'30D':30,'90D':90,'1Y':365};
const EXP=['housing','food','transport','shopping','lifestyle','health'];
const CATS={housing:{n:'Housing',c:'#C7F36B',i:'M3 11l9-8 9 8v9H3z'},food:{n:'Food & Drinks',c:'#E8B04B',i:'M6 3v8M10 3v8M8 11v10M17 3c-2 2-2 6 0 8v10'},transport:{n:'Transport',c:'#6FB7E9',i:'M4 15l2-7h12l2 7zM7 18v2M17 18v2'},shopping:{n:'Shopping',c:'#D98CE0',i:'M5 8h14l-1 12H6zM9 8a3 3 0 016 0'},lifestyle:{n:'Lifestyle',c:'#7FE0B5',i:'M12 21s-8-5-8-11a4 4 0 018-1 4 4 0 018 1c0 6-8 11-8 11z'},health:{n:'Health',c:'#F08A7E',i:'M12 5v14M5 12h14'},income:{n:'Income',c:'#C7F36B',i:'M12 19V5M6 11l6-6 6 6'},transfer:{n:'Transfer',c:'#9AA39A',i:'M4 8h14l-3-3M20 16H6l3 3'}};
const NAV=[['overview','Overview','M3 11l9-8 9 8v9H3z'],['activity','Activity','M4 6h16M4 12h16M4 18h10'],['insights','Insights','M4 20V10M10 20V4M16 20v-7M22 20H2'],['goals','Goals','M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8z'],['wallet','Wallet','M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2'],['settings','Settings','M4 8h10M18 8h2M4 16h2M10 16h10']];
const ico=(d,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

/* 2. SEED DATA (amounts in euros here, stored as integer cents) */
function seed(){
  const R=[[2,'Studio salary','income','income',2450,'a1'],[3,'Rent','housing','expense',820,'a1'],[4,'Mercado Central','food','expense',64.2,'a1'],[6,'Metro pass','transport','expense',40,'a1'],[8,'Padel club','lifestyle','expense',28,'a1'],[9,'Zara','shopping','expense',89.9,'a1'],[11,'Pharmacy','health','expense',18.5,'a1'],[12,'Move to savings','transfer','transfer',300,'a1'],[14,'Dinner at Bar Mut','food','expense',72,'a1'],[17,'Streaming bundle','lifestyle','expense',17.99,'a1'],[20,'Freelance logo','income','income',480,'a1'],[24,'Electricity','housing','expense',61.3,'a1'],[27,'Studio salary','income','income',2450,'a1'],[28,'Rent','housing','expense',820,'a1'],[31,'Supermarket','food','expense',118.4,'a1'],[35,'Train to Girona','transport','expense',26,'a1'],[40,'Headphones','shopping','expense',149,'a1'],[44,'Gym','health','expense',39,'a1'],[49,'Move to savings','transfer','transfer',300,'a1'],[58,'Studio salary','income','income',2450,'a1'],[59,'Rent','housing','expense',820,'a1'],[63,'Groceries','food','expense',134.7,'a1'],[75,'Surf lesson','lifestyle','expense',55,'a1'],[88,'Studio salary','income','income',2450,'a1'],[89,'Rent','housing','expense',820,'a1']];
  return{acc:[{id:'a1',name:'Main account',open:120000},{id:'a2',name:'Savings pocket',open:400000}],
    tx:R.map(([d,name,cat,type,e,acc])=>({id:uid(),name,cat,type,amt:Math.round(e*100),date:addD(TODAY,-d),acc,to:type==='transfer'?'a2':'',desc:''})),
    goals:[{id:uid(),name:'Surf Trip',target:90000,saved:41000,deadline:addD(TODAY,120),color:'#6FB7E9'},{id:uid(),name:'Emergency Fund',target:600000,saved:215000,deadline:'',color:'#C7F36B'},{id:uid(),name:'New MacBook',target:180000,saved:180000,deadline:addD(TODAY,30),color:'#E8B04B'}],
    cards:[{id:'c1',name:'ORBIT Prime',last:'4821',acc:'a1',frozen:false,active:true,kind:'v1'},{id:'c2',name:'ORBIT Core',last:'1037',acc:'a1',frozen:false,active:true,kind:'v2'},{id:'c3',name:'ORBIT Virtual',last:'7764',acc:'a2',frozen:false,active:true,kind:'v3'}],
    scn:[],prefs:{hide:false,cur:'EUR',calm:false}};
}

/* 3-4. STATE & PERSISTENCE */
let S;
const DEF={q:'',cat:'',type:'',acc:'',per:'all',sort:'date',dir:'desc'};
const UI={v:'overview',p:'30D',sc:'all',f:{...DEF},card:0,lab:null,base:null,cb:null};
function load(){
  let d=null;try{d=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  const ok=d&&['tx','goals','cards','scn','acc'].every(k=>Array.isArray(d[k]))&&d.prefs&&typeof d.prefs==='object'&&d.acc.length>=2&&d.cards.length>=3;
  S=ok?d:seed();
  S.tx=S.tx.filter(t=>t&&Number.isInteger(t.amt)&&t.amt>0&&/^\d{4}-\d\d-\d\d$/.test(t.date)&&CATS[t.cat]&&S.acc.some(a=>a.id===t.acc));
  S.goals=S.goals.filter(g=>g&&g.target>0&&Number.isFinite(g.saved));
  S.prefs={hide:false,cur:'EUR',calm:false,...S.prefs};
  S.cards.forEach(c=>{if(c.name==='ORBIT Black')c.name='ORBIT Prime'});
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

/* 5. FINANCE */
const rng=(p,off=0)=>{const n=PD[p],e=addD(TODAY,-n*off);return[addD(e,-n+1),e]};
const inR=(t,[a,b])=>t.date>=a&&t.date<=b;
const sumT=(l,ty)=>l.filter(t=>t.type===ty).reduce((s,t)=>s+t.amt,0);
function stats(p,off=0){const l=S.tx.filter(t=>inR(t,rng(p,off))),inc=sumT(l,'income'),exp=sumT(l,'expense'),by={};
  l.filter(t=>t.type==='expense').forEach(t=>by[t.cat]=(by[t.cat]||0)+t.amt);
  return{l,inc,exp,net:inc-exp,rate:inc>0?(inc-exp)/inc:0,by}}
const delta=(a,b)=>b?(a-b)/Math.abs(b):null;
const balAt=d=>S.acc.reduce((s,a)=>s+a.open,0)+S.tx.filter(t=>t.date<=d&&t.type!=='transfer').reduce((s,t)=>s+(t.type==='income'?t.amt:-t.amt),0);
const accBal=id=>S.acc.find(a=>a.id===id).open+S.tx.reduce((s,t)=>s+(t.acc===id?(t.type==='income'?t.amt:-t.amt):0)+(t.type==='transfer'&&t.to===id?t.amt:0),0);
function series(p){const[a,b]=rng(p),o=[];for(let d=a;d<=b;d=addD(d,1))o.push({l:fdate(d),y:balAt(d)});return o}
const gpct=g=>g.target>0?Math.min(1,g.saved/g.target):0;
const gstat=g=>g.saved>=g.target?'Completed':g.deadline&&g.deadline<TODAY?'Past deadline':'In progress';

/* 6. FORMAT */
const loc=()=>S.prefs.cur==='USD'?'en-US':'es-ES';
const fmt=c=>S.prefs.hide?'••••••':new Intl.NumberFormat(loc(),{style:'currency',currency:S.prefs.cur}).format(c/100);
const fdate=d=>new Intl.DateTimeFormat(loc(),{day:'numeric',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00'));
const fshort=d=>new Intl.DateTimeFormat(loc(),{day:'numeric',month:'short'}).format(new Date(d+'T12:00:00'));
const fp=x=>x==null?'—':(x>0?'+':'')+Math.round(x*100)+'%';
const toC=s=>{s=String(s).trim().replace(',','.');if(!/^\d{1,9}(\.\d{1,2})?$/.test(s))return null;const c=Math.round(parseFloat(s)*100);return c>0?c:null};
const toC0=s=>String(s).trim()===''?0:(/^0+([.,]0{1,2})?$/.test(String(s).trim())?0:toC(s));

/* 9. CHARTS */
const CH={};
const empty=m=>`<div class="empty"><b>Nothing to show yet</b>${m}</div>`;
function line(id,pts){
  if(pts.length<2)return empty('Add more transactions to draw this chart.');
  const W=600,H=220,m=8,ys=pts.map(p=>p.y),lo=Math.min(...ys),hi=Math.max(...ys),sp=hi-lo||1;
  CH[id]={pts,lo,sp,W,H,m};
  const X=i=>m+i*(W-2*m)/(pts.length-1),Y=v=>H-24-(v-lo)/sp*(H-48);
  const d=pts.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(p.y).toFixed(1)).join('');
  return `<svg class="chart" data-ch="${id}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Balance over time, hover or touch for values"><defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C7F36B" stop-opacity=".28"/><stop offset="1" stop-color="#C7F36B" stop-opacity="0"/></linearGradient></defs><path class="ar" d="${d}L${X(pts.length-1)} ${H}L${m} ${H}Z" fill="url(#g${id})"/><path class="ln" pathLength="1" d="${d}" fill="none" stroke="#C7F36B" stroke-width="2" stroke-linejoin="round"/><line class="cur" y1="0" y2="${H}"/><circle class="dot" r="4"/><text x="${m}" y="14">${fmt(hi)}</text><text x="${m}" y="${H-4}">${fmt(lo)}</text></svg>`}
function bars(p){
  const[a]=rng(p),n=PD[p]<=7?7:6,len=Math.ceil(PD[p]/n),bk=[];
  for(let i=0;i<n;i++){const s=addD(a,i*len),e=addD(s,len-1),l=S.tx.filter(t=>t.date>=s&&t.date<=e);bk.push({s,i:sumT(l,'income'),x:sumT(l,'expense')})}
  const mx=Math.max(1,...bk.flatMap(k=>[k.i,k.x])),w=600/n;
  return `<svg class="chart" viewBox="0 0 600 200" role="img" aria-label="Income (green) and expenses (grey) per interval">`+bk.map((k,j)=>{const x=j*w+w*.18,bw=w*.3,h1=k.i/mx*160,h2=k.x/mx*160;return `<rect x="${x}" y="${180-h1}" width="${bw}" height="${h1}" rx="3" fill="#C7F36B"><title>Income ${fmt(k.i)}</title></rect><rect x="${x+bw+3}" y="${180-h2}" width="${bw}" height="${h2}" rx="3" fill="#6b726a"><title>Expenses ${fmt(k.x)}</title></rect><text x="${x}" y="196">${fshort(k.s)}</text>`}).join('')+'</svg>'}
function donut(by){
  const tot=Object.values(by).reduce((a,b)=>a+b,0);if(!tot)return '';
  const R=52,C=2*Math.PI*R;let o=0;
  return `<svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Spending by category">`+Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{const f=v/tot*C,s=`<circle r="${R}" cx="70" cy="70" fill="none" stroke="${CATS[k].c}" stroke-width="14" stroke-dasharray="${Math.max(f-2,.5)} ${C}" stroke-dashoffset="${-o}" transform="rotate(-90 70 70)"/>`;o+=f;return s}).join('')+`<text x="70" y="74" text-anchor="middle">${fmt(tot)}</text></svg>`}
function catList(by){
  const tot=Object.values(by).reduce((a,b)=>a+b,0);
  if(!tot)return empty('No expenses in this period.');
  return `<ul class="cats">`+Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<li><i style="--c:${CATS[k].c}"></i>${CATS[k].n}<span>${fmt(v)} <small>${Math.round(v/tot*100)}%</small></span></li>`).join('')+'</ul>'}

/* 8. VIEWS */
const per=()=>`<div class="pills" role="group" aria-label="Period">${Object.keys(PD).map(p=>`<button data-act="per" data-p="${p}" aria-pressed="${p===UI.p}">${p}</button>`).join('')}</div>`;
const netLogo=n=>n==='visa'?`<svg viewBox="0 0 60 22" width="52" role="img" aria-label="Visa"><text x="0" y="18" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="800" font-style="italic" fill="#F4F5F1" letter-spacing="-1">VISA</text></svg>`:`<svg viewBox="0 0 48 30" width="44" role="img" aria-label="Mastercard"><circle cx="17" cy="15" r="13" fill="#EB001B"/><circle cx="31" cy="15" r="13" fill="#F79E1B"/><path d="M24 4.6a13 13 0 010 20.8 13 13 0 010-20.8z" fill="#FF5F00"/></svg>`;
const TIER={v1:'Prime',v2:'Core',v3:'Virtual',v4:'Gold'};
const cnet=k=>k.net||(k.kind==='v2'?'visa':'mc');
const cvv=k=>/^\d{4}$/.test(k.last)?String(+k.last*7%900+100):'•••';
const card=k=>`<div class="cwrap"><div class="flip" data-act="flip" role="button" tabindex="0" aria-pressed="false" aria-label="${esc(k.name)} card, press to flip"><div class="fi"><div class="vcard face ${k.kind}${k.frozen||!k.active?' off':''}"><div class="cr"><b>ORBIT <i class="tier">${TIER[k.kind]||''}</i></b><small class="st">${k.frozen?'Frozen':k.active?'Active':'Inactive'} · demo</small></div><span class="chip"></span><div><p class="cn">•••• •••• •••• <span class="pv-l">${k.last}</span></p><div class="cr"><span class="pv-h">${esc(k.holder||'Alex Rivera')}</span><span class="net">${netLogo(cnet(k))}</span></div></div><span class="glare"></span></div><div class="vcard face back ${k.kind}${k.frozen||!k.active?' off':''}"><div class="strip"></div><div class="sig"><small>Security code</small><b>${cvv(k)}</b></div><p class="fine"><span class="pv-nm">${esc(k.name)}</span> · expires <span class="pv-e">${esc(k.exp||'08/29')}</span><br>Fictional demo card. It cannot make payments.</p><span class="glare"></span></div></div></div></div>`;
const row=t=>{const c=CATS[t.cat],s=t.type==='income'?'+':t.type==='expense'?'−':'⇄ ';return `<button class="tx" data-act="tx" data-id="${t.id}"><span class="ci" style="--c:${c.c}">${ico(c.i)}</span><span class="tn"><b>${esc(t.name)}</b><small>${c.n} · ${fdate(t.date)}</small></span><span class="amt ${t.type}">${s}${fmt(t.amt)}</span></button>`};
const recent=n=>[...S.tx].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,n);

function ovParts(){
  const sc=UI.sc,all=sc==='all',c=statsS(UI.p,0,sc),q=statsS(UI.p,1,sc),h=new Date().getHours(),bal=balS(TODAY,sc),pb=balS(addD(rng(UI.p)[0],-1),sc),a=S.acc.find(x=>x.id===sc),
  k=all?S.cards[0]:(S.cards.find(x=>x.acc===sc)||S.cards[0]),
  kp=(l,v,d,inv)=>`<div class="kpi"><small>${l}</small><b data-c="${v}">${fmt(v)}</b>${d==null?'<em class="mu">No prior data</em>':`<em class="${(inv?-d:d)>=0?'up':'dn'}">${fp(d)} vs previous ${UI.p}</em>`}</div>`;
  return{
    head:`<p class="mu">${new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long'}).format(new Date())}</p><h2>Good ${h<12?'morning':h<19?'afternoon':'evening'}, Alex. Here is where your money stands.</h2><div class="big" data-c="${bal}" aria-label="Balance">${fmt(bal)}</div><p class="mu sub">${all?'Total across '+S.acc.length+' demo accounts':esc(a.name)}</p>`,
    card:card(k),
    kpis:kp(all?'Total balance':'Balance',bal,delta(bal,pb))+kp(all?'Income':'Money in',c.inc,delta(c.inc,q.inc))+kp(all?'Expenses':'Money out',c.exp,delta(c.exp,q.exp),1)+kp(all?'Net savings':'Net change',c.net,delta(c.net,q.net)),
    chart:line('ov',seriesS(UI.p,sc)),
    cats:`<div class="split">${donut(c.by)}${catList(c.by)}</div>`,
    recent:recentS(6,sc).map(row).join('')||empty('No movements on this account yet.')}}
function vOverview(){
  const P=ovParts(),idx=['all',...S.acc.map(a=>a.id)].indexOf(UI.sc);
  return `<section class="hero"><div id="ovHead">${P.head}</div><div id="ovCard">${P.card}</div></section>
  <div class="ovbar"><div class="seg scope" style="--n:${S.acc.length+1};--p:${idx}" role="group" aria-label="Accounts"><i class="thumb"></i><button data-act="scope" data-v="all" aria-pressed="${UI.sc==='all'}">All accounts</button>${S.acc.map(a=>`<button data-act="scope" data-v="${a.id}" aria-pressed="${UI.sc===a.id}">${esc(a.name)}</button>`).join('')}</div>${per()}</div>
  <div class="kpis" id="ovK">${P.kpis}</div>
  <div class="panel"><header><h3>Balance over the last ${UI.p}</h3></header><div id="ovChart">${P.chart}</div></div>
  <div class="grid"><div class="panel"><header><h3>Where it went</h3></header><div id="ovCats">${P.cats}</div></div>
  <div class="panel"><header><h3>Recent transactions</h3><button class="ghost" data-act="goto" data-v="activity">See all</button></header><div id="ovRecent">${P.recent}</div></div></div>`}

const o=(a,v)=>a.map(([k,n])=>`<option value="${k}"${v===k?' selected':''}>${n}</option>`).join('');
function vActivity(){
  const f=UI.f;
  return `<div class="bar"><input id="q" type="search" placeholder="Search name or note" aria-label="Search transactions" value="${esc(f.q)}">
  <select data-f="cat" aria-label="Category"><option value="">All categories</option>${o(Object.entries(CATS).map(([k,c])=>[k,c.n]),f.cat)}</select>
  <select data-f="type" aria-label="Type"><option value="">All types</option>${o([['income','Income'],['expense','Expenses'],['transfer','Transfers']],f.type)}</select>
  <select data-f="acc" aria-label="Account"><option value="">All accounts</option>${o(S.acc.map(a=>[a.id,a.name]),f.acc)}</select>
  <select data-f="per" aria-label="Period"><option value="all">All time</option>${o(Object.keys(PD).map(p=>[p,'Last '+p]),f.per)}</select>
  <select data-f="sort" aria-label="Sort by">${o([['date','Sort: date'],['amt','Sort: amount']],f.sort)}</select>
  <button class="ghost" data-act="dir"></button><button class="ghost" data-act="clr">Clear filters</button></div>
  <p class="mu" id="cnt" aria-live="polite"></p><div id="actList"></div><p class="note">Filters only change this list. Your balance is always calculated from every transaction.</p>`}
function filtered(){
  const f=UI.f,q=f.q.toLowerCase(),m=f.dir==='asc'?1:-1;
  return S.tx.filter(t=>(!q||(t.name+' '+(t.desc||'')).toLowerCase().includes(q))&&(!f.cat||t.cat===f.cat)&&(!f.type||t.type===f.type)&&(!f.acc||t.acc===f.acc||t.to===f.acc)&&(f.per==='all'||inR(t,rng(f.per)))).sort((a,b)=>(f.sort==='amt'?a.amt-b.amt:a.date.localeCompare(b.date))*m)}
function updList(a){
  const l=filtered();let h='',last='';
  $('#cnt').textContent=`${l.length} result${l.length===1?'':'s'}`;
  $('[data-act=dir]').textContent=UI.f.dir==='desc'?'Descending ↓':'Ascending ↑';
  if(!l.length)h=`<div class="empty"><b>No movements found</b>Try another search or clear the filters.</div>`;
  else l.forEach(t=>{if(UI.f.sort==='date'&&t.date!==last){h+=`<h3 class="dg">${fdate(t.date)}</h3>`;last=t.date}h+=row(t)});
  $('#actList').innerHTML=h;if(a)stagger($('#actList'),'.tx,.dg,.empty')}

function vInsights(){
  const c=stats(UI.p),q=stats(UI.p,1),n=PD[UI.p],top=Object.entries(c.by).sort((a,b)=>b[1]-a[1])[0],
  days=new Set(c.l.filter(t=>t.type==='expense').map(t=>t.date)).size,dE=delta(c.exp,q.exp),
  rate=Math.max(0,Math.min(1,c.rate)),R=74,C=2*Math.PI*R,ok=c.l.length>=3&&q.l.length>0,ob=[],share=top&&c.exp?top[1]/c.exp:0;
  if(ok){
    Object.entries(c.by).forEach(([k,v])=>{const p=q.by[k]||0;if(p>0&&v/p>1.25)ob.push(['dn',`${CATS[k].n} up ${Math.round((v/p-1)*100)}%`])});
    if(q.exp&&c.exp<q.exp)ob.push(['up',`${fmt(q.exp-c.exp)} less spent than before`]);
    if(c.inc>0&&c.rate>=.2)ob.push(['up',`Saving ${Math.round(c.rate*100)}% of income`])}
  else ob.push(['ne','Add more activity to unlock insights']);
  const pc=c.inc?Math.round(c.rate*100)+'%':'—';
  return `<div class="ctr">${per()}</div>
  <section class="gauge"><svg viewBox="0 0 180 180" role="img" aria-label="Saving rate ${pc}"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C7F36B"/><stop offset="1" stop-color="#7FE0B5"/></linearGradient></defs><circle cx="90" cy="90" r="${R}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="14"/><circle class="gv" cx="90" cy="90" r="${R}" fill="none" stroke="url(#gg)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C*rate} ${C}" transform="rotate(-90 90 90)"/><text x="90" y="90" text-anchor="middle" class="gp">${pc}</text><text x="90" y="114" text-anchor="middle" class="gl">saved</text></svg>
  <h2>${c.inc?'You kept '+fmt(c.net):'No income yet'}</h2><p class="mu">${c.inc?'of '+fmt(c.inc)+' earned · last '+UI.p:'last '+UI.p}</p></section>
  <div class="obs">${ob.slice(0,3).map(([t,x])=>`<span class="ob" data-t="${t}">${esc(x)}</span>`).join('')}</div>
  <div class="tiles">
  <div class="panel tile"><small>Top category</small>${top?`<div class="tv"><span class="ci" style="--c:${CATS[top[0]].c}">${ico(CATS[top[0]].i)}</span><b>${CATS[top[0]].n}</b></div><div class="prog" style="--c:${CATS[top[0]].c}"><i style="width:${share*100}%"></i></div><small>${fmt(top[1])} · ${Math.round(share*100)}% of spending</small>`:`<div class="tv"><b class="mu">—</b></div>`}</div>
  <div class="panel tile"><small>Spending vs before</small><div class="tv"><b class="${dE==null?'':dE<=0?'good':'bad'}">${dE==null?'—':(dE<=0?'↓ ':'↑ ')+Math.abs(Math.round(dE*100))+'%'}</b></div><div class="prog"><i style="width:${Math.min(100,q.exp?c.exp/q.exp*100:0)}%"></i></div><small>${fmt(c.exp)} vs ${fmt(q.exp)}</small></div>
  <div class="panel tile"><small>Daily average</small><div class="tv"><b>${fmt(Math.round(c.exp/n))}</b></div><div class="prog"><i style="width:${(n-days)/n*100}%"></i></div><small>${n-days} no-spend days</small></div></div>
  <div class="grid" style="margin-top:18px"><div class="panel"><header><h3>Income vs expenses</h3><span class="lgs"><span class="lg"><i></i>In</span><span class="lg x"><i></i>Out</span></span></header>${bars(UI.p)}</div>
  <div class="panel"><header><h3>Where it goes</h3></header><div class="split">${donut(c.by)}${catList(c.by)}</div></div></div>`}

const ring=g=>{const p=gpct(g),R=34,C=2*Math.PI*R;return `<svg viewBox="0 0 84 84" class="ring" role="img" aria-label="${Math.round(p*100)}% saved"><circle cx="42" cy="42" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/><circle cx="42" cy="42" r="${R}" fill="none" stroke="${esc(g.color)}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C*p} ${C}" transform="rotate(-90 42 42)"/><text x="42" y="47" text-anchor="middle">${Math.round(p*100)}%</text></svg>`};
function vGoals(){
  return `<div class="row" style="border:0"><p class="mu">Contributions are simulated inside this demo. No real account is touched.</p><button class="btn" data-act="addgoal">Create goal</button></div>
  ${S.goals.length?`<div class="goals">${S.goals.map(g=>`<div class="panel"><div class="cr">${ring(g)}<div style="text-align:right"><b>${esc(g.name)}</b><br><small>${gstat(g)}${g.deadline?' · by '+fdate(g.deadline):''}</small></div></div><div class="prog" style="--c:${esc(g.color)}"><i style="width:${gpct(g)*100}%"></i></div><p>${fmt(g.saved)} of ${fmt(g.target)}<br><small>${g.saved>=g.target?'Goal reached':fmt(g.target-g.saved)+' to go'}</small></p><div class="mini"><button class="btn" data-act="contrib" data-id="${g.id}">Add contribution</button><button class="ghost" data-act="editgoal" data-id="${g.id}">Edit</button><button class="ghost" data-act="delgoal" data-id="${g.id}">Delete</button></div></div>`).join('')}</div>`:`<div class="empty"><b>No goals yet</b>Create one to start tracking progress.</div>`}`}

function vWallet(){
  UI.card=Math.min(UI.card,S.cards.length-1);
  const k=S.cards[UI.card],a=S.acc.find(x=>x.id===k.acc),l=S.tx.filter(t=>t.acc===k.acc||t.to===k.acc).sort((x,y)=>y.date.localeCompare(x.date)).slice(0,8);
  return `<div class="chips" role="tablist" aria-label="Cards">${S.cards.map((c,i)=>`<button role="tab" data-act="card" data-i="${i}" aria-pressed="${i===UI.card}" aria-selected="${i===UI.card}">${esc(c.name)} ··${c.last}</button>`).join('')}<button class="addc" data-act="addcard">+ Add card</button></div>
  <div class="grid"><div>${card(k)}<div class="mini" style="margin-top:18px;justify-content:center"><button class="btn" data-act="freeze">${k.frozen?'Unfreeze card':'Freeze card'}</button>${k.kind==='v3'?`<button class="ghost" data-act="activate">${k.active?'Deactivate virtual card':'Activate virtual card'}</button>`:''}${k.custom?`<button class="ghost" data-act="delcard">Remove card</button>`:''}</div>
  <p class="note" style="text-align:center">Status: ${k.frozen?'Frozen':k.active?'Active':'Inactive'} · Linked to ${esc(a.name)} (${fmt(accBal(a.id))})</p></div>
  <div class="panel"><header><h3>Latest movements · ${esc(a.name)}</h3></header>${l.length?l.map(row).join(''):empty('No movements on this account yet.')}</div></div>
  <p class="note">Cards and accounts are fictional demo data. ORBIT cannot make payments or connect to banks.</p>`}

function vSettings(){
  const sz=(new Blob([JSON.stringify(S)]).size/1024).toFixed(1),P=S.prefs;
  return `<div class="panel"><div class="row"><label for="p-hide">Hide amounts</label><input id="p-hide" type="checkbox" data-pref="hide" ${P.hide?'checked':''}></div>
  <div class="row"><span>Currency and number format</span><div class="seg" style="--n:2;--p:${P.cur==='USD'?1:0};min-width:220px"><i class="thumb"></i><button data-act="cur" data-v="EUR" aria-pressed="${P.cur==='EUR'}">EUR · 1.234,56</button><button data-act="cur" data-v="USD" aria-pressed="${P.cur==='USD'}">USD · 1,234.56</button></div></div>
  <div class="row"><label for="p-calm">Reduce motion</label><input id="p-calm" type="checkbox" data-pref="calm" ${P.calm?'checked':''}></div>
  <p class="note">Changing currency only changes the symbol and format. Amounts are not converted.</p></div>
  <div class="panel"><header><h3>Local storage</h3></header><p>${S.tx.length} transactions · ${S.goals.length} goals · ${sz} KB</p>
  <p class="note">ORBIT is a portfolio demo with fictional data. Your changes are saved in this browser's local storage only. Nothing is sent anywhere, and nothing here is encrypted.</p>
  <div class="mini" style="margin-top:12px"><button class="ghost" data-act="restore">Restore demo data</button></div></div>`}
const V={overview:vOverview,activity:vActivity,insights:vInsights,goals:vGoals,wallet:vWallet,settings:vSettings};
function render(){
  if(!V[UI.v])UI.v='overview';
  const n=NAV.find(x=>x[0]===UI.v),vw=$('#view');
  $('#title').textContent=n[1];
  nav();
  const hb=$('#hideBtn');hb.textContent=S.prefs.hide?'Show amounts':'Hide amounts';hb.setAttribute('aria-pressed',S.prefs.hide);
  document.documentElement.classList.toggle('calm',!!S.prefs.calm);
  vw.innerHTML=V[UI.v]();stagger(vw);countUp();if(UI.v==='activity')updList(true);
}

/* 10-11. FORMS, MODALS, TOASTS */
const dlg=$('#dlg');
let dT;
function openDlg(t,b){clearTimeout(dT);dlg.classList.remove('closing');dlg.innerHTML=`<div class="dh"><h2 id="dt">${t}</h2><button data-act="x" aria-label="Close dialog">×</button></div>${b}`;dlg.setAttribute('aria-labelledby','dt');if(!dlg.open)dlg.showModal();stagger(dlg,'.dh,form>*,.dh~p,.dh~table,.dh~.fa')}
const closeDlg=()=>{if(!dlg.open)return;if(calm())return dlg.close();dlg.classList.add('closing');clearTimeout(dT);dT=setTimeout(()=>{dlg.close();dlg.classList.remove('closing')},200)};
dlg.addEventListener('cancel',e=>{e.preventDefault();closeDlg()});
function toast(m,undo){const t=document.createElement('div');t.className='toast';t.innerHTML=`<span>${esc(m)}</span>`;if(undo){const b=document.createElement('button');b.textContent='Undo';b.onclick=()=>{undo();t.remove()};t.append(b)}$('#toasts').append(t);setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),260)},undo?6000:3200)}
function confirmDlg(t,p,cb,label='Delete'){UI.cb=cb;openDlg(t,`<p>${p}</p><div class="fa"><button class="ghost" data-act="x">Cancel</button><button class="btn danger" data-act="ok">${label}</button></div>`)}
const fld=(l,n,v,a='')=>`<label>${l}<input name="${n}" value="${esc(v)}" ${a}><small class="err" data-e="${n}" role="alert"></small></label>`;
const sel=(l,n,op,v)=>`<label>${l}<select name="${n}">${o(op,v)}</select><small class="err" data-e="${n}" role="alert"></small></label>`;
function showErr(f,er){f.querySelectorAll('[data-e]').forEach(e=>e.textContent='');f.querySelectorAll('input').forEach(i=>i.removeAttribute('aria-invalid'));
  Object.entries(er).forEach(([k,m])=>{$(`[data-e="${k}"]`,f).textContent=m;const i=f.elements[k];if(i)i.setAttribute('aria-invalid','true')});
  const k=Object.keys(er)[0];if(k){f.elements[k].focus();f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake')}return !!k}
function commit(msg){save();closeDlg();render();toast(msg)}
function txForm(t){
  t=t||{type:'expense',date:TODAY,acc:'a1',cat:'food'};const e=!!t.id,ty=['expense','income','transfer'],cat=EXP.includes(t.cat)?t.cat:'food',to=t.type==='transfer'&&t.to&&t.to!==t.acc?t.to:S.acc.find(a=>a.id!==t.acc).id;
  openDlg(e?'Edit transaction':'New transaction',`<form class="nf" data-form="tx" data-id="${t.id||''}" data-type="${t.type}" novalidate>
  <input type="hidden" name="type" value="${t.type}"><input type="hidden" name="cat" value="${cat}"><input type="hidden" name="acc" value="${t.acc}"><input type="hidden" name="to" value="${to}"><input type="hidden" name="date" value="${t.date}">
  <div class="seg" style="--p:${ty.indexOf(t.type)}" role="group" aria-label="Type"><i class="thumb"></i>${ty.map(k=>`<button type="button" data-act="seg" data-v="${k}" aria-pressed="${k===t.type}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>
  <label class="amt-big"><span class="cur">${S.prefs.cur==='USD'?'$':'€'}</span><input name="amount" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${e?(t.amt/100).toFixed(2):''}" aria-label="Amount"></label><small class="err" data-e="amount" role="alert"></small>
  <div class="quick" aria-label="Quick add">${[5,10,20,50,100].map(n=>`<button type="button" data-act="quick" data-n="${n}">+${n}</button>`).join('')}</div>
  ${fld('Name','name',t.name||'','maxlength="60" placeholder="What was it?" autocomplete="off"')}
  <div class="cw"><div class="catg" role="group" aria-label="Category">${EXP.map(k=>`<button type="button" data-act="cat" data-v="${k}" style="--c:${CATS[k].c}" aria-pressed="${k===cat}"><span class="ci" style="--c:${CATS[k].c}">${ico(CATS[k].i)}</span>${CATS[k].n}</button>`).join('')}</div></div>
  <div class="accs" role="group" aria-label="Account">${S.acc.map(a=>`<button type="button" data-act="acc" data-v="${a.id}" aria-pressed="${a.id===t.acc}"><small>${esc(a.name)}</small><b>${fmt(accBal(a.id))}</b></button>`).join('')}</div>
  <p class="xfer"><span>Moves money to <b id="toName"></b></span><button type="button" class="ghost" data-act="swap">Swap</button></p>
  <div class="dates"><button type="button" data-act="qdate" data-d="0">Today</button><button type="button" data-act="qdate" data-d="1">Yesterday</button><label class="dpick">Pick a date<input type="date" id="dpick" value="${t.date}" aria-label="Pick a date"></label></div><small class="err" data-e="date" role="alert"></small>
  ${fld('Note (optional)','desc',t.desc||'','maxlength="140" autocomplete="off"')}
  <div class="prev" id="prev" aria-live="polite"></div>
  <div class="fa"><button type="button" class="ghost" data-act="x">Cancel</button><button class="btn">${e?'Save changes':'Add transaction'}</button></div></form>`);
  syncTx($('form.nf'));
}
function submitTx(f){
  const d=Object.fromEntries(new FormData(f)),er={},a=toC(d.amount);
  if(!d.name.trim())er.name='Enter a name.';
  if(a==null)er.amount='Enter an amount above 0, like 12.50.';
  if(!/^\d{4}-\d\d-\d\d$/.test(d.date))er.date='Choose a valid date.';
  if(d.type==='transfer'&&d.to===d.acc)er.to='Pick a different destination account.';
  if(showErr(f,er))return;
  const x={name:d.name.trim(),type:d.type,amt:a,cat:d.type==='expense'?d.cat:d.type,date:d.date,acc:d.acc,to:d.type==='transfer'?d.to:'',desc:d.desc.trim()};
  if(f.dataset.id)Object.assign(S.tx.find(t=>t.id===f.dataset.id),x);else S.tx.push({id:uid(),...x});
  commit(f.dataset.id?'Transaction updated':'Transaction added')}
function openTx(id){
  const t=S.tx.find(x=>x.id===id);if(!t)return;const c=CATS[t.cat],ac=i=>(S.acc.find(a=>a.id===i)||{}).name;
  openDlg(esc(t.name),`<table><tr><td>Amount</td><td>${t.type==='income'?'+':t.type==='expense'?'−':''}${fmt(t.amt)}</td></tr><tr><td>Type</td><td>${t.type}</td></tr><tr><td>Category</td><td>${c.n}</td></tr><tr><td>Date</td><td>${fdate(t.date)}</td></tr><tr><td>Account</td><td>${esc(ac(t.acc))}${t.to?' → '+esc(ac(t.to)):''}</td></tr>${t.desc?`<tr><td>Note</td><td>${esc(t.desc)}</td></tr>`:''}</table><div class="fa"><button class="ghost" data-act="deltx" data-id="${t.id}">Delete</button><button class="btn" data-act="edittx" data-id="${t.id}">Edit</button></div>`)}
function goalForm(g){
  g=g||{color:'#C7F36B',saved:0};const e=!!g.id;
  openDlg(e?'Edit goal':'Create goal',`<form data-form="goal" data-id="${g.id||''}" novalidate>${fld('Name','name',g.name||'','maxlength="40"')}${fld('Target amount','target',e?(g.target/100).toFixed(2):'','inputmode="decimal"')}${fld('Saved so far','saved',(g.saved/100).toFixed(2),'inputmode="decimal"')}${fld('Deadline (optional)','deadline',g.deadline||'','type="date"')}<input type="hidden" name="color" value="${g.color}"><div class="sws" role="group" aria-label="Colour">${[['#C7F36B','Lime'],['#6FB7E9','Blue'],['#E8B04B','Amber'],['#D98CE0','Violet']].map(([c,n])=>`<button type="button" data-act="color" data-v="${c}" aria-label="${n}" aria-pressed="${c===g.color}" style="--c:${c}"></button>`).join('')}</div><div class="fa"><button type="button" class="ghost" data-act="x">Cancel</button><button class="btn">${e?'Save changes':'Create goal'}</button></div></form>`)}
function submitGoal(f){
  const d=Object.fromEntries(new FormData(f)),er={},t=toC(d.target),s=toC0(d.saved);
  if(!d.name.trim())er.name='Enter a name.';
  if(t==null)er.target='Target must be greater than 0.';
  if(s==null)er.saved='Enter 0 or a valid amount.';
  if(showErr(f,er))return;
  const x={name:d.name.trim(),target:t,saved:s,deadline:d.deadline,color:d.color};
  if(f.dataset.id)Object.assign(S.goals.find(g=>g.id===f.dataset.id),x);else S.goals.push({id:uid(),...x});
  commit(f.dataset.id?'Goal updated':'Goal created')}
function contribForm(id){const g=S.goals.find(x=>x.id===id);openDlg('Add contribution',`<form data-form="contrib" data-id="${id}" novalidate><p class="mu">${esc(g.name)} · ${fmt(g.saved)} of ${fmt(g.target)}. Simulated, no real money moves.</p>${fld('Amount ('+S.prefs.cur+')','amount','','inputmode="decimal" placeholder="0.00"')}<div class="fa"><button type="button" class="ghost" data-act="x">Cancel</button><button class="btn">Add contribution</button></div></form>`)}
function submitContrib(f){
  const a=toC(new FormData(f).get('amount'));if(showErr(f,a==null?{amount:'Enter an amount above 0.'}:{}))return;
  const g=S.goals.find(x=>x.id===f.dataset.id),was=g.saved>=g.target;g.saved+=a;
  commit(!was&&g.saved>=g.target?`${g.name} reached. Well done.`:'Contribution added')}

/* 12. EVENTS */
function act(a,d,b){switch(a){
  case 'flip':b.classList.toggle('on');b.setAttribute('aria-pressed',b.classList.contains('on'));break;
  case 'seg':case 'cat':case 'acc':case 'swap':case 'qdate':case 'quick':txPick(a,d,b.closest('form'));break;
  case 'color':{const f=b.closest('form');f.elements.color.value=d.v;f.querySelectorAll('[data-act=color]').forEach(x=>x.setAttribute('aria-pressed',x===b));break}
  case 'cur':S.prefs.cur=d.v;save();render();break;
  case 'scope':UI.sc=d.v;ovSwap();break;
  case 'addcard':cardForm();break;
  case 'cnet':case 'ckind':case 'cacc':{const f=b.closest('form');f.elements[{cnet:'net',ckind:'kind',cacc:'acc'}[a]].value=d.v;syncCard(f);break}
  case 'delcard':{const k=S.cards[UI.card];confirmDlg('Remove card?',`“${esc(k.name)}” will be removed from your wallet.`,()=>{S.cards.splice(S.cards.indexOf(k),1);UI.card=0;save();render();toast('Card removed')},'Remove');break}
  case 'hide':S.prefs.hide=!S.prefs.hide;save();render();break;
  case 'per':UI.p=d.p;render();break;
  case 'addtx':txForm();break;
  case 'goto':location.hash=d.v;break;
  case 'tx':openTx(d.id);break;
  case 'edittx':txForm(S.tx.find(t=>t.id===d.id));break;
  case 'deltx':{const t=S.tx.find(x=>x.id===d.id);confirmDlg('Delete transaction?',`“${esc(t.name)}” will be removed from every total and chart.`,()=>{const i=S.tx.indexOf(t);S.tx.splice(i,1);save();render();toast('Transaction deleted',()=>{S.tx.splice(Math.min(i,S.tx.length),0,t);save();render()})});break}
  case 'x':closeDlg();break;
  case 'ok':{const f=UI.cb;UI.cb=null;closeDlg();f&&f();break}
  case 'dir':UI.f.dir=UI.f.dir==='desc'?'asc':'desc';updList();break;
  case 'clr':UI.f={...DEF};render();toast('Filters cleared');break;
  case 'addgoal':goalForm();break;
  case 'editgoal':goalForm(S.goals.find(g=>g.id===d.id));break;
  case 'delgoal':{const g=S.goals.find(x=>x.id===d.id);confirmDlg('Delete goal?',`“${esc(g.name)}” and its progress will be removed.`,()=>{S.goals=S.goals.filter(x=>x!==g);save();render();toast('Goal deleted')});break}
  case 'contrib':contribForm(d.id);break;
  case 'card':UI.card=+d.i;render();break;
  case 'freeze':{const k=S.cards[UI.card];k.frozen=!k.frozen;save();render();toast(k.frozen?'Card frozen':'Card unfrozen');break}
  case 'activate':{const k=S.cards[UI.card];k.active=!k.active;save();render();toast(k.active?'Virtual card activated':'Virtual card deactivated');break}
  case 'restore':confirmDlg('Restore demo data?','Transactions, goals, cards and scenarios will be replaced by the original fictional data. Your display preferences are kept.',()=>{const p=S.prefs;S=seed();S.prefs=p;UI.lab=null;UI.f={...DEF};save();render();toast('Demo data restored')},'Restore');break;
}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)act(b.dataset.act,b.dataset,b);else if(e.target===dlg)closeDlg()});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target,m={tx:submitTx,goal:submitGoal,contrib:submitContrib,card:submitCard}[f.dataset.form];m&&m(f)});
document.addEventListener('input',e=>{const t=e.target;
  if(t.id==='q'){UI.f.q=t.value;updList()}
  else if(t.form&&t.form.classList.contains('nf')&&t.name==='amount')syncTx(t.form);
  else if(t.form&&t.form.dataset.form==='card')cardInput(t);
});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='dpick'){t.form.elements.date.value=t.value||TODAY;syncTx(t.form)}
  else if(t.dataset.f){UI.f[t.dataset.f]=t.value;updList()}
  else if(t.dataset.pref){S.prefs[t.dataset.pref]=t.type==='checkbox'?t.checked:t.value;save();render()}});
window.addEventListener('hashchange',()=>{UI.v=location.hash.slice(1)||'overview';closeDlg();nav();const vw=$('#view');if(calm()){render();window.scrollTo(0,0);return}vw.classList.add('out');setTimeout(()=>{vw.classList.remove('out');render();window.scrollTo(0,0)},210)});
/* chart tooltip + card tilt */
const tip=$('#tip'),canTilt=()=>matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches&&!S.prefs.calm;
function hover(e){
  const s=e.target.closest&&e.target.closest('.chart[data-ch]'),c=s&&CH[s.dataset.ch];
  if(!c){tip.hidden=true;document.querySelectorAll('.chart .cur,.chart .dot').forEach(x=>x.style.opacity=0);return}
  const r=s.getBoundingClientRect(),n=c.pts.length,i=Math.max(0,Math.min(n-1,Math.round((e.clientX-r.left)/r.width*(n-1)))),p=c.pts[i];
  const x=c.m+i*(c.W-2*c.m)/(n-1),y=c.H-24-(p.y-c.lo)/c.sp*(c.H-48),l=$('.cur',s),d=$('.dot',s);
  l.setAttribute('x1',x);l.setAttribute('x2',x);d.setAttribute('cx',x);d.setAttribute('cy',y);l.style.opacity=1;d.style.opacity=1;
  tip.textContent=`${p.l} · ${fmt(p.y)}`;tip.style.left=e.clientX+'px';tip.style.top=e.clientY+'px';tip.hidden=false}
/* v2: motion helpers */
const calm=()=>S.prefs.calm||matchMedia('(prefers-reduced-motion:reduce)').matches;
function nav(){const n=$('#nav');if(!n.children.length)n.innerHTML=NAV.map((x,i)=>`<a href="#${x[0]}" style="--i:${i}">${ico(x[2])}<span>${x[1]}</span></a>`).join('');n.querySelectorAll('a').forEach((a,i)=>{if(NAV[i][0]===UI.v)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}
function stagger(root,sel='.hero>*,.pills,.kpi,.panel,.tx,.dg,.cats li,.row,.chips button,.goals>.panel,.empty,.bar>*,#cnt,.mini>*,.res>div,.ob,.gauge>h2,.gauge>p,.ovbar>*'){let i=0;root.querySelectorAll(sel).forEach(el=>{el.style.setProperty('--i',Math.min(i++,22));el.classList.add('rv')})}
function countUp(){if(calm()||S.prefs.hide)return;document.querySelectorAll('[data-c]').forEach(el=>{const to=+el.dataset.c,t0=performance.now();const step=n=>{if(!el.isConnected)return;const k=Math.min(1,(n-t0)/1000);el.textContent=fmt(Math.round(to*(1-Math.pow(1-k,4))));if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)})}
function syncTx(f){
  const v=k=>f.elements[k].value,ty=v('type'),A=n=>S.acc.find(a=>a.id===n),mark=(sel,fn)=>f.querySelectorAll(sel).forEach(b=>b.setAttribute('aria-pressed',fn(b)));
  f.dataset.type=ty;f.querySelector('.seg').style.setProperty('--p',['expense','income','transfer'].indexOf(ty));
  mark('[data-act=seg]',b=>b.dataset.v===ty);mark('[data-act=cat]',b=>b.dataset.v===v('cat'));mark('[data-act=acc]',b=>b.dataset.v===v('acc'));mark('[data-act=qdate]',b=>addD(TODAY,-b.dataset.d)===v('date'));
  $('#dpick',f).value=v('date');$('#toName',f).textContent=A(v('to')).name;
  const a=toC(v('amount')),sg=ty==='income'?'+':ty==='expense'?'−':'⇄ ';
  $('#prev',f).textContent=`${ty==='expense'?CATS[v('cat')].n:ty[0].toUpperCase()+ty.slice(1)} · ${a?sg+fmt(a):'enter an amount'} · ${A(v('acc')).name} · ${fdate(v('date'))}`}
function txPick(a,d,f){
  const set=(k,v)=>f.elements[k].value=v;
  if(a==='seg')set('type',d.v);
  else if(a==='cat')set('cat',d.v);
  else if(a==='acc'){set('acc',d.v);set('to',S.acc.find(x=>x.id!==d.v).id)}
  else if(a==='swap'){const x=f.elements.acc.value;set('acc',f.elements.to.value);set('to',x)}
  else if(a==='qdate')set('date',addD(TODAY,-d.d));
  else{const i=f.elements.amount;i.value=((parseFloat(String(i.value).replace(',','.'))||0)+ +d.n).toFixed(2)}
  syncTx(f)}
document.addEventListener('pointermove',e=>{hover(e);const T=e.target;if(!T.closest)return;
  const s=T.closest('.panel,.tx,.kpi');if(s){const r=s.getBoundingClientRect();s.style.setProperty('--mx',e.clientX-r.left+'px');s.style.setProperty('--my',e.clientY-r.top+'px')}
  const k=T.closest('.flip');if(k&&canTilt()){const r=k.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;k.style.setProperty('--ry',(x-.5)*22+'deg');k.style.setProperty('--rx',(.5-y)*18+'deg');k.style.setProperty('--gx',x*100+'%');k.style.setProperty('--gy',y*100+'%')}});
document.addEventListener('pointerdown',hover);
document.addEventListener('pointerout',e=>{const k=e.target.closest&&e.target.closest('.flip');if(k&&!k.contains(e.relatedTarget)){k.style.setProperty('--rx','0deg');k.style.setProperty('--ry','0deg')}});
document.addEventListener('keydown',e=>{const k=e.target;if((e.key==='Enter'||e.key===' ')&&k.classList&&k.classList.contains('flip')){e.preventDefault();act('flip',{},k)}});

/* v3: scoped finance, account switch, add card */
const flow=(t,sc='all')=>sc==='all'?(t.type==='income'?t.amt:t.type==='expense'?-t.amt:0):(t.acc===sc?(t.type==='income'?t.amt:-t.amt):(t.type==='transfer'&&t.to===sc?t.amt:0));
const balS=(d,sc='all')=>(sc==='all'?S.acc.reduce((s,a)=>s+a.open,0):S.acc.find(a=>a.id===sc).open)+S.tx.filter(t=>t.date<=d).reduce((s,t)=>s+flow(t,sc),0);
function statsS(p,off=0,sc='all'){
  const l=S.tx.filter(t=>inR(t,rng(p,off))&&(sc==='all'||t.acc===sc||t.to===sc)),by={};let inc=0,exp=0;
  l.forEach(t=>{const f=flow(t,sc);if(f>0)inc+=f;else if(f<0)exp-=f;if(t.type==='expense')by[t.cat]=(by[t.cat]||0)+t.amt});
  return{l,inc,exp,net:inc-exp,rate:inc>0?(inc-exp)/inc:0,by}}
function seriesS(p,sc){const[a,b]=rng(p),o=[];for(let d=a;d<=b;d=addD(d,1))o.push({l:fdate(d),y:balS(d,sc)});return o}
const recentS=(n,sc)=>S.tx.filter(t=>sc==='all'||t.acc===sc||t.to===sc).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,n);
function ovSwap(){
  const P=ovParts(),idx=['all',...S.acc.map(a=>a.id)].indexOf(UI.sc),
  set=(id,h,s)=>{const el=$(id);if(!el)return;el.innerHTML=h;el.classList.remove('swp');void el.offsetWidth;el.classList.add('swp');if(s)stagger(el,s)};
  set('#ovHead',P.head);set('#ovCard',P.card);set('#ovK',P.kpis,'.kpi');set('#ovChart',P.chart);set('#ovCats',P.cats,'.cats li');set('#ovRecent',P.recent,'.tx,.empty');countUp();
  const sg=$('.scope');sg.style.setProperty('--p',idx);sg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===UI.sc))}
function cardForm(){
  const kinds=[['v1','Prime','#C7F36B'],['v2','Core','#E8B04B'],['v3','Virtual','#6FB7E9'],['v4','Gold','#E6C27A']];
  openDlg('Add card',`<form class="nf" data-form="card" data-type="card" novalidate>
  <div id="cprev">${card({name:'New card',last:'••••',kind:'v1',net:'mc',frozen:false,active:true,holder:'Alex Rivera',exp:'MM/YY'})}</div>
  <input type="hidden" name="net" value="mc"><input type="hidden" name="acc" value="a1"><input type="hidden" name="kind" value="v1">
  <div class="seg" style="--n:2;--p:1" role="group" aria-label="Network"><i class="thumb"></i><button type="button" data-act="cnet" data-v="visa" aria-pressed="false">Visa</button><button type="button" data-act="cnet" data-v="mc" aria-pressed="true">Mastercard</button></div>
  <label class="numf">Card number<input name="number" inputmode="numeric" autocomplete="off" placeholder="0000 0000 0000 0000" maxlength="23"><small class="err" data-e="number" role="alert"></small></label>
  <div class="two">${fld('Name on card','holder','Alex Rivera','maxlength="26" autocomplete="off"')}${fld('Expiry','exp','','inputmode="numeric" placeholder="MM/YY" maxlength="5" autocomplete="off"')}</div>
  ${fld('Card name (optional)','nm','','maxlength="24" placeholder="e.g. Travel card" autocomplete="off"')}
  <div class="dates" role="group" aria-label="Design">${kinds.map(([k,n,c])=>`<button type="button" data-act="ckind" data-v="${k}" aria-pressed="${k==='v1'}"><i class="dot" style="background:${c}"></i>${n}</button>`).join('')}</div>
  <div class="accs" role="group" aria-label="Linked account">${S.acc.map(a=>`<button type="button" data-act="cacc" data-v="${a.id}" aria-pressed="${a.id==='a1'}"><small>${esc(a.name)}</small><b>${fmt(accBal(a.id))}</b></button>`).join('')}</div>
  <p class="note" style="margin:0">Demo only: ORBIT keeps just the last 4 digits, never the full number. Cards cannot make payments.</p>
  <div class="fa"><button type="button" class="ghost" data-act="x">Cancel</button><button class="btn">Add card</button></div></form>`);
  syncCard($('form.nf'))}
function cardInput(t){
  const f=t.form;
  if(t.name==='number'){const d=t.value.replace(/\D/g,'').slice(0,19);t.value=d.replace(/(.{4})(?=.)/g,'$1 ');const net=d[0]==='4'?'visa':/^(5[1-5]|2[2-7])/.test(d)?'mc':null;if(net)f.elements.net.value=net}
  else if(t.name==='exp'){const d=t.value.replace(/\D/g,'').slice(0,4);t.value=d.length>2?d.slice(0,2)+'/'+d.slice(2):d}
  syncCard(f)}
function syncCard(f){
  const v=k=>f.elements[k].value,d=v('number').replace(/\D/g,''),pv=$('#cprev',f),mark=(s,fn)=>f.querySelectorAll(s).forEach(b=>b.setAttribute('aria-pressed',fn(b)));
  pv.querySelectorAll('.vcard').forEach(c=>{c.classList.remove('v1','v2','v3','v4');c.classList.add(v('kind'))});
  $('.tier',pv).textContent=TIER[v('kind')];
  $('.pv-l',pv).textContent=d.length>=4?d.slice(-4):'••••';
  $('.pv-h',pv).textContent=v('holder').trim()||'Your name';
  $('.pv-e',pv).textContent=v('exp')||'MM/YY';
  $('.pv-nm',pv).textContent=v('nm').trim()||'New card';
  const nt=$('.net',pv),lg=netLogo(v('net'));if(nt.dataset.n!==v('net')){nt.innerHTML=lg;nt.dataset.n=v('net')}
  f.querySelector('.seg').style.setProperty('--p',v('net')==='visa'?0:1);
  mark('[data-act=cnet]',b=>b.dataset.v===v('net'));mark('[data-act=ckind]',b=>b.dataset.v===v('kind'));mark('[data-act=cacc]',b=>b.dataset.v===v('acc'))}
function submitCard(f){
  const d=Object.fromEntries(new FormData(f)),n=d.number.replace(/\D/g,''),er={},m=+d.exp.slice(0,2),y=2000+ +d.exp.slice(3,5),now=new Date();
  if(n.length<13||n.length>19)er.number='Enter a card number with 13 to 19 digits.';
  else if(S.cards.some(c=>c.last===n.slice(-4)))er.number=`A card ending in ${n.slice(-4)} is already in your wallet.`;
  else if(S.cards.length>=8)er.number='You can keep up to 8 cards in this demo.';
  if(d.holder.trim().length<2)er.holder='Enter the name on the card.';
  if(!/^\d\d\/\d\d$/.test(d.exp)||m<1||m>12)er.exp='Use the format MM/YY.';
  else if(y<now.getFullYear()||(y===now.getFullYear()&&m<now.getMonth()+1))er.exp='This card has expired.';
  if(showErr(f,er))return;
  S.cards.push({id:uid(),name:d.nm.trim()||'ORBIT '+TIER[d.kind],last:n.slice(-4),acc:d.acc,frozen:false,active:true,kind:d.kind,net:d.net,holder:d.holder.trim(),exp:d.exp,custom:true});
  UI.card=S.cards.length-1;commit('Card added to your wallet')}

/* 13. INIT (with intro curtain) */
$('.logo').addEventListener('click',e=>{e.preventDefault();closeDlg();if(UI.v==='overview'){UI.sc='all';render();window.scrollTo({top:0,behavior:'smooth'})}else location.hash='overview'});
load();
document.documentElement.classList.toggle('calm',!!S.prefs.calm);
UI.v=location.hash.slice(1)||'overview';
const iv=$('#intro');
if(!iv||calm()){if(iv)iv.remove();render()}
else{let o=0;const open=()=>{if(o)return;o=1;iv.classList.add('open');document.body.classList.add('enter');render();setTimeout(()=>{iv.remove();document.body.classList.remove('enter')},1500)};iv.addEventListener('click',open);setTimeout(open,2400)}
