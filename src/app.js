/* ---------- Daten ---------- */
const ITEMS=[
  {id:'rtw',fl:0,name:'RTW',icon:'truck',cost:0,perk:'Dein erstes Fahrzeug.'},
  {id:'ktw',fl:0,name:'KTW',icon:'truck',cost:120,perk:'+5 XP pro Einsatz.'},
  {id:'nef',fl:0,name:'NEF',icon:'car',cost:180,perk:'+10 XP pro Einsatz.'},
  {id:'rtw2',fl:0,name:'Zweiter RTW',icon:'truck',cost:260,perk:'+5 XP pro Einsatz.'},
  {id:'defi',fl:0,name:'Defi/Monitor',icon:'bolt',cost:60,perk:'Geprüft und einsatzbereit.'},
  {id:'rucksack',fl:0,name:'Notfall\u00ADrucksack',icon:'bag',cost:50,perk:'Gehört auf jeden RTW.'},
  {id:'vakuum',fl:0,name:'Vakuum\u00ADmatratze',icon:'mat',cost:90,perk:'Bereit für Trauma-Einsätze.'},
  {id:'beatmung',fl:0,name:'Beatmungs\u00ADgerät',icon:'lungs',cost:140,perk:'Bereit für Atemweg-Einsätze.'},
  {id:'desinfektion',fl:0,name:'Desinfektion',icon:'drop',cost:70,perk:'+3 Münzen pro Einsatz. Hygiene zahlt sich aus.'},
  {id:'funk',fl:1,name:'Funkraum',icon:'radio',cost:80,perk:'+5 Münzen pro Einsatz.'},
  {id:'kaffee',fl:1,name:'Kaffeemaschine',icon:'coffee',cost:40,perk:'+1 Schicht-Freeze.'},
  {id:'kueche',fl:1,name:'Küche',icon:'pan',cost:90,perk:'Gemeinsam kochen auf der Wache.'},
  {id:'esstisch',fl:1,name:'Esstisch',icon:'table',cost:60,perk:'Zusammen essen, bis der Melder geht.'},
  {id:'tv',fl:1,name:'Fernseher',icon:'tv',cost:60,perk:'Für die ruhigen Minuten.'},
  {id:'sofa',fl:1,name:'Sofa',icon:'sofa',cost:70,perk:'Pause zwischen den Einsätzen.'},
  {id:'kicker',fl:1,name:'Kicker',icon:'ball',cost:110,perk:'Revanche ist Ehrensache.'},
  {id:'schulung',fl:1,name:'Schulungsraum',icon:'school',cost:200,perk:'+10 % XP pro Einsatz.'},
  {id:'betten',fl:2,name:'Ruheräume',icon:'bed',cost:120,perk:'Bis zu 4 Schicht-Freezes.'},
  {id:'fitness',fl:2,name:'Fitness',icon:'dumbbell',cost:160,perk:'+5 Münzen pro Einsatz.'},
  {id:'spinde',fl:2,name:'Spinde',icon:'locker',cost:80,perk:'+1 Schicht-Freeze.'},
  {id:'dusche',fl:2,name:'Dusche',icon:'drop',cost:90,perk:'Frisch in den nächsten Einsatz.'},
];
const ROOMS=[{id:'halle',name:'Fahrzeughalle'},{id:'funk',name:'Funk'},{id:'geraete',name:'Geräteraum'},{id:'sozial',name:'Sozial'}];
const RANKS=['Praktikant','Azubi RS','Rettungssanitäter','Erfahrener RS','Azubi NotSan','Notfallsanitäter','Praxisanleiter','Wachleiter'];

const LOOT=[
  {n:'Goldene Pinzette',d:'+40 Münzen',c:40},
  {n:'Lob vom Wachleiter',d:'+25 Münzen',c:25},
  {n:'Kuchen vom Kollegen',d:'+1 Schicht-Freeze',f:1},
  {n:'Ruhige Nacht',d:'+60 Münzen',c:60},
];

/* ---------- State ---------- */
const KEY='wachenalarm.v1';
const fresh=()=>({floors:1,xp:0,coins:50,owned:['rtw'],streak:0,freezes:2,last:null,cards:[],plays:{},sel:null,sound:true,rolle:'rs',region:'sh'});
let S=fresh();
try{const raw=localStorage.getItem(KEY);if(raw)S=Object.assign(fresh(),JSON.parse(raw));}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};

function levelInfo(xp){let lvl=1,need=100,acc=0;while(xp>=acc+need){acc+=need;lvl++;need=100+(lvl-1)*60;}return{lvl,into:xp-acc,need};}
const has=id=>S.owned.includes(id);

/* ---------- Render Home ---------- */
const $=s=>document.querySelector(s);
const ic=n=>`<svg class="i"><use href="#i-${n}"/></svg>`;

function renderHUD(){
  const L=levelInfo(S.xp);
  $('#lvl').textContent=L.lvl;
  $('#rank').textContent=RANKS[Math.min(L.lvl-1,RANKS.length-1)];
  $('#xptxt').textContent=`${L.into} / ${L.need} XP`;
  $('#xpbar').style.width=(L.into/L.need*100)+'%';
  $('#coins').textContent=S.coins;
  $('#streak').textContent=S.streak;
  $('#freezes').textContent=S.freezes;
}
function renderCards(){
  const L=levelInfo(S.xp).lvl;const c=$('#cards');c.innerHTML='';
  const list=playable();
  if(!list.length){c.innerHTML=`<p class="empty" style="grid-column:1/-1">${dbState==='loading'?'Steckbriefe werden geladen …':'Steckbriefe erscheinen, sobald Fälle in der Bibliothek sind.'}</p>`;$('#cardcount').textContent='';return;}
  list.forEach(cs=>{
    const got=S.cards.includes(cs.id);const b=document.createElement('button');
    b.className='ccard'+(got?'':' locked');
    b.innerHTML=got?`<span class="label" style="color:var(--accent)">${esc(cs.card.key||cs.stw)}</span><h3>${esc(cs.title)}</h3><span class="tag">${S.plays[cs.id]||0}× gefahren</span>`
      :`${ic('lock')}<h3>${esc(cs.title)}</h3><span class="tag">${L<cs.minLevel?`ab Level ${cs.minLevel}`:'Einsatz meistern'}</span>`;
    b.onclick=()=>{if(got)openCard(cs,false);else toast(L<cs.minLevel?`Freischalten ab Level ${cs.minLevel}`:'Fahre diesen Einsatz, um den Steckbrief zu bekommen.');};
    c.appendChild(b);
  });
  $('#cardcount').textContent=`${list.filter(x=>S.cards.includes(x.id)).length} / ${list.length}`;
}
function renderAll(){renderHUD();renderWache();renderCards();
  const nP=playable().length;$('#go').classList.toggle('off',!nP);
  $('#gosub').textContent=dbState==='loading'?'Fälle werden geladen …':dbState==='offline'?'Fallbibliothek nicht erreichbar':nP?`${nP} ${nP===1?'Fall':'Fälle'} in der Bibliothek · xABCDE`:'Noch keine aktiven Fälle – lege einen im Tab Fälle an';
  const h=S.last?(Date.now()-S.last)/36e5:null;
  $('#streaknote').textContent=S.streak&&h!==null&&h<48?`Serie läuft noch ${Math.max(1,Math.round(48-h))} h. Ein Einsatz hält sie am Leben.`:'Serie hält 48 h, passend zum 24/24-Dienst. Freezes retten verpasste Schichten.';
}

/* ---------- Pixel-Wache (isometrisch) ---------- */
const SC={W:244,H:170,GX:14,GY:9,WALL:40};
SC.ox=SC.GY*10+6;SC.oy=SC.WALL+8;
const P=(x,y,z=0)=>[SC.ox+(x-y)*10,SC.oy+(x+y)*5-z];
const cv=document.getElementById('wache');const cx=cv.getContext('2d');let SCALE=1;
function fitCanvas(){const w=cv.clientWidth||SC.W*2;const dpr=Math.min(3,window.devicePixelRatio||1);cv.width=Math.round(w*dpr);cv.height=Math.round(w*dpr*SC.H/SC.W);SCALE=cv.width/SC.W;}
fitCanvas();addEventListener('resize',()=>{fitCanvas();if(REDUCED)drawScene(performance.now());});
const EDGE='rgba(22,28,38,.30)';
function shade(c,a){let r,g,b;
  if(c[0]==='#'){const n=parseInt(c.slice(1),16);r=n>>16;g=n>>8&255;b=n&255;}else[r,g,b]=(c.match(/[\d.]+/g)||[0,0,0]).map(Number);
  const f=v=>Math.max(0,Math.min(255,Math.round(a<0?v*(1+a):v+(255-v)*a)));return`rgb(${f(r)},${f(g)},${f(b)})`;}
function poly(pts,fill,stroke){cx.beginPath();pts.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.closePath();cx.fillStyle=fill;cx.fill();if(stroke){cx.strokeStyle=stroke;cx.lineWidth=.35;cx.lineJoin='round';cx.stroke();}}
function B(x,y,z,w,d,h,col,o=true){
  poly([P(x,y+d,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x,y+d,z+h)],shade(col,-.1),o&&EDGE);
  poly([P(x+w,y,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x+w,y,z+h)],shade(col,-.24),o&&EDGE);
  poly([P(x,y,z+h),P(x+w,y,z+h),P(x+w,y+d,z+h),P(x,y+d,z+h)],shade(col,.05),o&&EDGE);
  if(o&&h>2){cx.strokeStyle='rgba(255,255,255,.4)';cx.lineWidth=.3;cx.beginPath();const a=P(x,y+d,z+h),b=P(x+w,y+d,z+h),c=P(x+w,y,z+h);cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.lineTo(c[0],c[1]);cx.stroke();}}
function wheel(xc,yc,zc,R){const pts=[],pts2=[];for(let t=0;t<6.3;t+=.4){pts.push(P(xc,yc+R/11*Math.cos(t),zc+R*Math.sin(t)));pts2.push(P(xc+.01,yc+R*.45/11*Math.cos(t),zc+R*.45*Math.sin(t)));}
  poly(pts,'#23242A',EDGE);poly(pts2,'#9AA1A8');}
function glow(p,col,r){const g=cx.createRadialGradient(p[0],p[1],0,p[0],p[1],r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.beginPath();cx.arc(p[0],p[1],r,0,7);cx.fill();}
const bandX=(xc,y1,y2,z1,z2,c)=>poly([P(xc,y1,z1),P(xc,y2,z1),P(xc,y2,z2),P(xc,y1,z2)],c);
const bandY=(yc,x1,x2,z1,z2,c)=>poly([P(x1,yc,z1),P(x2,yc,z1),P(x2,yc,z2),P(x1,yc,z2)],c);
const flat=(x1,y1,x2,y2,c,z=0)=>poly([P(x1,y1,z),P(x2,y1,z),P(x2,y2,z),P(x1,y2,z)],c);

let alarmMode=false,tNow=0;
const beaconOn=()=>alarmMode&&Math.floor(tNow/170)%2===0;
const RD_RED='#E2261B',RD_YEL='#F4E21C',WHITE='#F6F7F9',GLASS='#3B5B78';
function sideText(xc,yStart,z,txt,size,col){const p=P(xc,yStart,z);cx.save();
  cx.transform(1,-.5,0,1,p[0],p[1]);cx.font=`800 ${size}px "Saira Condensed",Arial Narrow,sans-serif`;cx.fillStyle=col;cx.textBaseline='bottom';
  cx.fillText(txt,0,0);cx.restore();}
/* abgerundeter Quader: weiche Kanten oben und an der vorderen Ecke */
function RB(x,y,z,w,d,h,col,b=.16,rb=2.6){
  const zt=z+h-rb,L=shade(col,-.09),R=shade(col,-.23),C=shade(col,-.16),T=shade(col,.06),BF=shade(col,-.02),BR=shade(col,-.12);
  poly([P(x,y+d,z),P(x+w-b,y+d,z),P(x+w-b,y+d,zt),P(x,y+d,zt)],L);
  poly([P(x+w-b,y+d,z),P(x+w,y+d-b,z),P(x+w,y+d-b,zt),P(x+w-b,y+d,zt)],C);
  poly([P(x+w,y,z),P(x+w,y+d-b,z),P(x+w,y+d-b,zt),P(x+w,y,zt)],R);
  poly([P(x,y+d,zt),P(x+w-b,y+d,zt),P(x+w-b,y+d-b,z+h),P(x,y+d-b,z+h)],BF);
  poly([P(x+w-b,y+d,zt),P(x+w,y+d-b,zt),P(x+w-b,y+d-b,z+h)],shade(col,-.06));
  poly([P(x+w,y+d-b,zt),P(x+w,y,zt),P(x+w-b,y,z+h),P(x+w-b,y+d-b,z+h)],BR);
  poly([P(x,y,z+h),P(x+w-b,y,z+h),P(x+w-b,y+d-b,z+h),P(x,y+d-b,z+h)],T);
  cx.strokeStyle=EDGE;cx.lineWidth=.3;cx.lineJoin='round';cx.beginPath();
  [[P(x,y+d,z),P(x+w-b,y+d,z),P(x+w,y+d-b,z),P(x+w,y,z),P(x+w,y,zt),P(x+w-b,y,z+h),P(x,y,z+h),P(x,y+d-b,z+h),P(x,y+d,zt)]].forEach(pts=>{pts.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));cx.closePath();});cx.stroke();}
/* große gelb-rote Warnmarkierung in zwei Reihen */
function blocks(xc,y1,y2,z1,z2,size=.34){const n=Math.max(2,Math.round((y2-y1)/size));const st=(y2-y1)/n,zm=(z1+z2)/2;
  for(let i=0;i<n;i++){bandX(xc,y1+i*st,y1+(i+1)*st,z1,zm,i%2?RD_RED:RD_YEL);bandX(xc,y1+i*st,y1+(i+1)*st,zm,z2,i%2?RD_YEL:RD_RED);}}
function blocksY(yc,x1,x2,z1,z2,size=.34){const n=Math.max(2,Math.round((x2-x1)/size));const st=(x2-x1)/n,zm=(z1+z2)/2;
  for(let i=0;i<n;i++){bandY(yc,x1+i*st,x1+(i+1)*st,z1,zm,i%2?RD_RED:RD_YEL);bandY(yc,x1+i*st,x1+(i+1)*st,zm,z2,i%2?RD_YEL:RD_RED);}}
function blue(on){return on?'#6A97FF':'#2B4C9A';}
/* Fahrerhaus mit schräger Frontscheibe (Sprinter/Vito) */
function cab(x,y,w,d,z,hLow,hUp,slope,col){
  RB(x,y,z,w,d,hLow,col,.14,2.2);
  const zr=z+hLow,ye=y+d-slope;
  RB(x,y,zr-1,w,d-slope-.05,hUp+1,col,.14,2);
  poly([P(x+.08,ye,zr+hUp),P(x+w-.08,ye,zr+hUp),P(x+w-.08,y+d-.12,zr),P(x+.08,y+d-.12,zr)],GLASS,EDGE);
  poly([P(x+w,ye-.02,zr-1),P(x+w,ye-.02,zr+hUp-1.5),P(x+w,y+d-.18,zr)],shade(col,-.2),EDGE);
  bandX(x+w+.001,y+d-slope-.55,ye-.08,zr+.8,zr+hUp-1.8,GLASS);
  bandY(y+d,x+.14,x+.42,z+hLow-4.5,z+hLow-2.5,'#FFF4C8');bandY(y+d,x+w-.42,x+w-.14,z+hLow-4.5,z+hLow-2.5,'#FFF4C8');
  bandY(y+d,x+.55,x+w-.55,z+hLow-5,z+hLow-2,'#2E323A');
}
function rtw(x,y,w,d,z0,label){
  const cabY=y+d-1.3,on=beaconOn(),on2=alarmMode&&!on;
  B(x+.14,y+.3,z0,w-.28,d-.5,4.5,'#25262C',false);
  RB(x,y,z0+4.5,w,cabY-y,25,WHITE,.2,3.4);
  const zb=z0+4.5;
  blocks(x+w+.002,y+.08,cabY-.08,zb+1.5,zb+11);
  bandX(x+w+.002,y+.08,cabY-.08,zb+11.5,zb+12.6,RD_RED);
  sideText(x+w+.002,cabY-.2,zb+19,label,3.9,RD_RED);
  bandX(x+w+.002,y+.35,y+1.1,zb+14,zb+19.5,'#CCD9E2');
  poly([P(x+w,y+1.45,zb+1.5),P(x+w,y+1.47,zb+1.5),P(x+w,y+1.47,zb+21),P(x+w,y+1.45,zb+21)],'rgba(30,35,45,.45)');
  blocksY(cabY,x+.08,x+w-.08,zb+16,zb+21,.3);
  cab(x+.1,cabY,w-.2,1.3,z0+4,9,7,.5,WHITE);
  blocks(x+w-.1+.002,cabY+.06,y+d-.5,z0+5.2,z0+9.6,.28);
  const zs=z0+20,ze=zb+25;
  poly([P(x+.12,cabY+.62,zs),P(x+w-.12,cabY+.62,zs),P(x+w-.06,cabY+.02,ze-1),P(x+.06,cabY+.02,ze-1)],shade(WHITE,-.02),EDGE);
  poly([P(x+w-.06,cabY,zs-.5),P(x+w-.12,cabY+.62,zs),P(x+w-.06,cabY+.02,ze-1)],shade(WHITE,-.2),EDGE);
  const ly=cabY+.18,lz=ze-4;
  poly([P(x+.16,ly,lz),P(x+.6,ly,lz),P(x+.6,ly-.06,lz+2.2),P(x+.16,ly-.06,lz+2.2)],blue(on));
  poly([P(x+w-.6,ly,lz),P(x+w-.16,ly,lz),P(x+w-.16,ly-.06,lz+2.2),P(x+w-.6,ly-.06,lz+2.2)],blue(on2));
  RB(x+.45,y+.6,zb+25,w-.9,.9,2.6,'#DDE2E7',.1,1);
  wheel(x+w+.01,y+.85,z0+3,3.4);wheel(x+w-.09,y+d-.7,z0+3,3.4);
  if(on)glow(P(x+.38,ly,lz+1),'rgba(106,151,255,.85)',10);if(on2)glow(P(x+w-.38,ly,lz+1),'rgba(106,151,255,.85)',10);
}
function ktw(x,y,w,d,z0){
  const on=beaconOn(),on2=alarmMode&&!on,fy=y+d-.95;
  B(x+.12,y+.3,z0,w-.24,d-.5,4,'#25262C',false);
  RB(x,y,z0+4,w,fy-y+.05,21,WHITE,.18,3);
  cab(x+.04,fy,w-.08,.95,z0+4,8,10,.55,WHITE);
  poly([P(x+.1,fy+.05,z0+22),P(x+w-.1,fy+.05,z0+22),P(x+w-.1,fy-.15,z0+25),P(x+.1,fy-.15,z0+25)],shade(WHITE,-.03));
  blocks(x+w+.002,y+.08,fy-.06,z0+5,z0+11,.3);
  bandX(x+w+.002,y+.08,fy-.06,z0+11.5,z0+12.4,RD_RED);
  bandX(x+w+.002,y+.3,y+1.5,z0+15,z0+20.5,'#CCD9E2');
  sideText(x+w+.002,fy-.12,z0+16.4,'KRANKENTRANSPORT',2.9,RD_RED);
  B(x+.25,fy-.45,z0+25,w-.5,.3,1.6,'#E1E5EA');B(x+.27,fy-.42,z0+26.6,.38,.24,1.4,blue(on));B(x+w-.65,fy-.42,z0+26.6,.38,.24,1.4,blue(on2));
  wheel(x+w+.01,y+.75,z0+3,3);wheel(x+w-.03,y+d-.65,z0+3,3);
}
function nef(x,y,w,d,z0){
  const on=beaconOn(),on2=alarmMode&&!on,cy=y+d-1.05;
  B(x+.12,y+.3,z0,w-.24,d-.55,3.5,'#25262C',false);
  RB(x,y,z0+3.5,w,cy-y+.05,15.5,WHITE,.18,3);
  cab(x+.03,cy,w-.06,1.05,z0+3.5,8,7,.62,WHITE);
  blocks(x+w+.002,y+.08,cy-.05,z0+4.5,z0+9.5,.3);
  blocks(x+w-.03+.002,cy+.05,y+d-.6,z0+4.8,z0+9.2,.28);
  bandX(x+w+.002,y+.08,cy-.05,z0+10,z0+10.8,RD_RED);
  bandX(x+w+.002,y+.2,y+.75,z0+12.5,z0+17,GLASS);bandX(x+w+.002,y+.85,cy-.12,z0+12.5,z0+17,GLASS);
  sideText(x+w+.002,cy-.1,z0+12.2,'NOTARZT',2.7,RD_RED);
  const rz=z0+19;RB(x+.1,cy-.42,rz,w-.2,.34,2.2,'#E6EAEE',.08,.8);
  B(x+.12,cy-.4,rz+2.2,.4,.3,1.5,blue(on));B(x+w-.52,cy-.4,rz+2.2,.4,.3,1.5,blue(on2));
  B(x+.12,y+.35,rz,.07,cy-y-.85,.8,'#9AA1A8',false);B(x+w-.19,y+.35,rz,.07,cy-y-.85,.8,'#9AA1A8',false);
  wheel(x+w+.01,y+.6,z0+3,2.9);wheel(x+w-.02,y+d-.6,z0+3,2.9);
  if(on)glow(P(x+.32,cy-.25,rz+3),'rgba(106,151,255,.85)',9);if(on2)glow(P(x+w-.32,cy-.25,rz+3),'rgba(106,151,255,.85)',9);
}
/* Unterschrank für die Geräte an der Rückwand (Oberkante z+9.8) */
function counter(x,y,z){B(x-.03,y,z,.86,.62,9,'#C3CAD0');B(x-.03,y,z+9,.86,.62,.8,'#8E979F');
  bandY(y+.621,x-.03,x+.83,z,z+.9,'#5E666D');bandY(y+.622,x+.38,x+.41,z+1.2,z+8.6,'#9CA5AD');
  B(x+.24,y+.62,z+6.6,.1,.04,.5,'#6F7880',false);B(x+.47,y+.62,z+6.6,.1,.04,.5,'#6F7880',false);}
function discX(xc,yc,zc,R,fill,stroke=EDGE){const pts=[];for(let t=0;t<6.3;t+=.35)pts.push(P(xc,yc+R/11*Math.cos(t),zc+R*Math.sin(t)));poly(pts,fill,stroke);}
function discY(xc,yc,zc,R,fill,stroke=EDGE){const pts=[];for(let t=0;t<6.3;t+=.35)pts.push(P(xc+R/11*Math.cos(t),yc,zc+R*Math.sin(t)));poly(pts,fill,stroke);}
function circFlat(xc,yc,r,fill,z=0,stroke){const pts=[];for(let t=0;t<6.3;t+=.3)pts.push(P(xc+r*Math.cos(t),yc+r*Math.sin(t),z));poly(pts,fill,stroke);}
/* liegender Zylinder (Achse x), stehender Zylinder (Achse z) */
function cylX(x0,x1,yc,zc,R,col,bands=[]){for(let x=x0;x<x1;x+=.035){const b=bands.some(([a,e])=>x>=a&&x<e);discX(x,yc,zc,R,b?'#26282D':shade(col,-.12),false);}
  discX(x1,yc,zc,R,col);discX(x1+.001,yc,zc,R*.62,shade(col,-.1),false);discX(x1+.002,yc,zc,R*.3,shade(col,-.2),false);}
function cylZ(xc,yc,r,z0,h,col){for(let z=z0;z<z0+h;z+=.6)circFlat(xc,yc,r,shade(col,-.16),z);circFlat(xc,yc,r,shade(col,.06),z0+h,EDGE);}
/* Stuhl: Lehne hinten (n = Richtung -y) oder vorne (s = Richtung +y) */
function chair(x,y,z,back,col='#8A6446'){const L=shade(col,-.25);
  const legs=()=>[[0,0],[.34,0],[0,.34],[.34,.34]].forEach(([a,b])=>B(x+a,y+b,z,.06,.06,4,L,false));
  const seat=()=>B(x,y,z+4,.4,.4,.8,col);const rest=()=>B(x,back==='s'?y+.34:y,z+4.8,.4,.06,5,col);
  legs();if(back==='s'){seat();rest();}else{rest();seat();}}
function officeChair(x,y,z){circFlat(x+.3,y+.3,.26,'#2B2B2B',z+.4);B(x+.27,y+.27,z,.06,.06,4,'#5E666D',false);
  B(x+.05,y+.05,z+4,.5,.5,1.2,'#2E3238');B(x+.05,y+.47,z+5.2,.5,.08,6,'#2E3238');}
function plant(x,y){B(x,y,0,.42,.42,4,'#B5562A');B(x-.02,y-.02,4,.46,.46,.8,'#9A4520');circFlat(x+.21,y+.21,.17,'#4A3426',4.85);
  [[0,0,8,4.2,'#2F7A3F'],[-.12,.08,10,3.4,'#3E8E4E'],[.12,-.06,11,3.2,'#3E8E4E'],[.02,.1,13,2.8,'#57A866'],[-.04,-.08,14.5,2.2,'#6FBE7A']].forEach(([dx,dy,z,r,c])=>{
    const p=P(x+.21+dx,y+.21+dy,z);cx.fillStyle=c;cx.beginPath();cx.ellipse(p[0],p[1],r,r*.8,0,0,7);cx.fill();});}
/* ---------- Möbel und Geräte ---------- */
/* Hygiene-Ecke an der Trennwand: Fliesenspiegel mit Spender und Schild, Ausgussbecken, Waschmaschine */
function drawDesinf(g,z){const px=g.x-.08,fx=px+.12;
  B(px,g.y,z,.12,g.d,21,'#EEF2F4');for(let k=1;k<7;k++)bandX(fx+.001,g.y,g.y+g.d,z+k*3,z+k*3+.15,'#D3DADF');
  for(let k=1;k<6;k++)bandX(fx+.001,g.y+k*g.d/6-.01,g.y+k*g.d/6+.01,z,z+21,'#D3DADF');
  bandX(fx+.002,g.y+.12,g.y+.78,z+16.5,z+20.2,'#E2231A');bandX(fx+.003,g.y+.4,g.y+.5,z+17.2,z+19.5,'#FFFFFF');bandX(fx+.003,g.y+.31,g.y+.59,z+17.9,z+18.8,'#FFFFFF');
  B(fx,g.y+.32,z+11.5,.12,.26,4,'#F4F6F8');bandX(fx+.121,g.y+.37,g.y+.53,z+12.5,z+14.5,'#3A9AD9');B(fx+.04,g.y+.42,z+10.6,.05,.06,.9,'#8A939B',false);
  B(fx,g.y+.04,z,.68,.78,9,'#E9EDF0');bandX(fx+.681,g.y+.38,g.y+.42,z+1,z+8.5,'#C9D0D6');B(fx,g.y+.04,z+9,.68,.78,1,'#AEB6BD');
  flat(fx+.1,g.y+.14,fx+.58,g.y+.72,'#6E7880',z+10.02);flat(fx+.14,g.y+.18,fx+.54,g.y+.68,'#8C979F',z+10.03);
  B(fx+.03,g.y+.4,z+10,.07,.07,4.2,'#C3CAD0',false);B(fx+.03,g.y+.4,z+13.6,.26,.07,.6,'#C3CAD0',false);
  const wy=g.y+.86;B(fx,wy,z,.68,.8,10.5,'#F6F8FA');bandX(fx+.681,wy+.06,wy+.74,z+8.6,z+9.9,'#DCE2E7');bandX(fx+.682,wy+.5,wy+.7,z+8.9,z+9.6,'#3A9AD9');
  discX(fx+.683,wy+.4,z+4.6,3.3,'#7C8790');discX(fx+.684,wy+.4,z+4.6,2.4,'#9FC6DC',false);discX(fx+.685,wy+.33,z+5.4,.9,'rgba(255,255,255,.55)',false);}
function drawKueche(g,z){B(g.x,g.y,z,g.w,g.d,9,'#E6E0D4');B(g.x,g.y,z+9,g.w,g.d,1,'#40454C');
  for(let i=0;i<4;i++){const cxp=g.x+.35+(i%2)*.45,cyp=g.y+.2+Math.floor(i/2)*.3;circFlat(cxp,cyp,.12,'#22252A',z+10.1);}
  B(g.x+1.4,g.y+.1,z+9.6,.7,.45,.6,'#AEB6BD',false);circFlat(g.x+1.75,g.y+.33,.14,'#7C8790',z+10.3);B(g.x+1.72,g.y+.06,z+10,.07,.07,3.5,'#C3CAD0');
  [0,1,2,3].forEach(i=>bandX(g.x+g.w+.001,g.y+.05,g.y+g.d-.05,z+1,z+8,i%2?'#DCD5C7':'#E6E0D4'));
  for(let i=0;i<5;i++)bandY(g.y+g.d+.001,g.x+.1+i*.52,g.x+.52+i*.52,z+1.5,z+8,'#DAD3C5');
  B(g.x,g.y,z+22,g.w,.38,8,'#E6E0D4');B(g.x+.2,g.y+.12,z+10,.4,.25,3.5,'#C8102E');}
function drawTisch(g,z){const ty=g.y+.45;
  chair(g.x+.35,g.y,z,'n');chair(g.x+1.25,g.y,z,'n');
  [[.1,.1],[1.78,.1],[.1,.83],[1.78,.83]].forEach(([a,b])=>B(g.x+a,ty+b,z,.12,.12,6,'#6E4E36'));
  B(g.x,ty,z+6,g.w,1.05,1,'#C49A6C');[[.5,.3],[1.45,.3],[.5,.75],[1.45,.75]].forEach(([a,b])=>{circFlat(g.x+a,ty+b,.15,'#F4F6F8',z+7.1,'rgba(0,0,0,.12)');circFlat(g.x+a,ty+b,.07,'#E6E9EC',z+7.15);});
  circFlat(g.x+1,ty+.52,.12,'#E8590C',z+7.2);B(g.x+.95,ty+.47,z+7.2,.1,.1,2.2,'#3E8E4E',false);
  chair(g.x+.35,ty+1.12,z,'s');chair(g.x+1.25,ty+1.12,z,'s');}
function drawTV(g,z){B(g.x,g.y,z,g.w,g.d,4,'#5A4636');bandY(g.y+g.d+.001,g.x+.1,g.x+g.w/2-.05,z+.8,z+3.2,'#6E5644');bandY(g.y+g.d+.001,g.x+g.w/2+.05,g.x+g.w-.1,z+.8,z+3.2,'#6E5644');
  B(g.x+.75,g.y+.18,z+4,.5,.15,1.2,'#1C1F24');B(g.x+.15,g.y+.2,z+5,g.w-.3,.1,9,'#1C1F24');
  const t=Math.floor(tNow/900)%3;bandY(g.y+.301,g.x+.25,g.x+g.w-.25,z+5.8,z+13.2,['#3E7BC4','#4FA36A','#C47A3E'][t]);bandY(g.y+.302,g.x+.35,g.x+.9,z+8,z+12,'rgba(255,255,255,.35)');}
function drawSofa(g,z){const c='#3E6E8E';B(g.x,g.y,z,g.w,g.d,4.5,c);B(g.x,g.y+g.d-.28,z+4.5,g.w,.28,6,shade(c,-.08));B(g.x,g.y,z+4.5,.28,g.d-.28,3,shade(c,-.05));B(g.x+g.w-.28,g.y,z+4.5,.28,g.d-.28,3,shade(c,-.05));
  B(g.x+.4,g.y+.1,z+4.5,.6,.35,1.6,'#F2C230');B(g.x+1.5,g.y+.1,z+4.5,.6,.35,1.6,'#E8590C');}
function drawKicker(g,z){[[0,0],[g.w-.15,0],[0,g.d-.15],[g.w-.15,g.d-.15]].forEach(([a,b])=>B(g.x+a,g.y+b,z,.15,.15,5,'#3A2E26'));
  B(g.x,g.y,z+5,g.w,g.d,3,'#7A4E2E');B(g.x+.08,g.y+.08,z+8,g.w-.16,g.d-.16,.2,'#2F8F4E',false);flat(g.x+g.w/2-.02,g.y+.08,g.x+g.w/2+.02,g.y+g.d-.08,'#FFFFFF',z+8.25);
  for(let i=0;i<6;i++){const xr=g.x+.2+i*(g.w-.4)/5;B(xr,g.y-.15,z+9,.04,g.d+.3,.3,'#C3CAD0',false);for(let k=0;k<2;k++)B(xr-.04,g.y+.25+k*.4,z+8.3,.1,.1,1.4,i%2?'#E2231A':'#1D5FE0',false);}
  circFlat(g.x+g.w*.42,g.y+g.d*.55,.05,'#FFFFFF',z+8.4);}
function schulWall(g){bandY(.001,g.x-.06,g.x+2.46,16.6,31.6,'#9AA1A8');bandY(.002,g.x,g.x+2.4,17,31,'#F4F6F8');bandY(.003,g.x+.15,g.x+.8,26,27,'#1D5FE0');bandY(.003,g.x+.15,g.x+1.4,23,24,'#2B2B2B');bandY(.003,g.x+.15,g.x+1.1,20,21,'#E2231A');
  bandY(.003,g.x+1.6,g.x+2.2,19,28,'#FCE6E4');bandY(.004,g.x+1.85,g.x+1.95,20.5,26.5,'#E2231A');bandY(.004,g.x+1.7,g.x+2.1,23,24,'#E2231A');bandY(.002,g.x+.3,g.x+2.1,16.2,16.8,'#8A939B');}
function drawSchulung(g,z){
  B(g.x,g.y,z,.12,.12,7,'#8A939B');B(g.x+g.w-.12,g.y,z,.12,.12,7,'#8A939B');B(g.x,g.y+1.0-.12,z,.12,.12,7,'#8A939B');B(g.x+g.w-.12,g.y+1.0-.12,z,.12,.12,7,'#8A939B');
  B(g.x,g.y,z+7,g.w,1.0,.8,'#D4D9DE');B(g.x+.55,g.y+.25,z+7.8,1.1,.5,2.2,'#F0C8A8');B(g.x+1.65,g.y+.3,z+7.8,.38,.4,1.6,'#F0C8A8');B(g.x+.7,g.y+.33,z+10,.5,.34,.15,'#C8102E',false);
  B(g.x+.15,g.y+.3,z+7.8,.3,.4,1,'#3A3D44');chair(g.x+.5,g.y+1.15,z,'s','#5E7487');chair(g.x+1.5,g.y+1.15,z,'s','#5E7487');}
function bed(x,y,z,col){const L=1.9;B(x,y,z,.12,1.0,8,'#7A5A3A');B(x+.12,y,z,L-.12,1.0,3.2,'#8A6A4A');B(x+.15,y+.05,z+3.2,L-.2,.9,1.6,'#F4F6F8');
  B(x+.2,y+.2,z+4.8,.42,.6,.9,'#FFFFFF');B(x+.7,y+.04,z+4.8,L-.78,.92,.7,col);bandY(y+.961,x+.7,x+L-.08,z+3.6,z+5.5,shade(col,-.08));B(x+L-.08,y,z,.08,1.0,5,'#7A5A3A');}
function nightstand(x,y,z,lamp){B(x,y,z,.4,.45,4.5,'#B98552');bandY(y+.451,x+.05,x+.35,z+2.6,z+2.75,'#8F6438');
  if(lamp){B(x+.17,y+.17,z+4.5,.06,.06,2.5,'#5E666D',false);const p=P(x+.2,y+.2,z+8.2);cx.fillStyle='#F2C230';cx.beginPath();cx.ellipse(p[0],p[1],1.6,1.3,0,0,7);cx.fill();}}
function drawBetten(g,z){nightstand(g.x,g.y,z,1);bed(g.x+.5,g.y,z,'#3E6E8E');nightstand(g.x+3.0,g.y,z,1);bed(g.x+3.5,g.y,z,'#7A5A9E');}
function drawFitness(g,z){B(g.x,g.y+.2,z,1.6,.7,2,'#2E3238');B(g.x+.1,g.y+.25,z+2,1.4,.6,.3,'#45505A',false);B(g.x+1.45,g.y+.2,z+2,.08,.08,9,'#8A939B');B(g.x+1.45,g.y+.82,z+2,.08,.08,9,'#8A939B');B(g.x+1.4,g.y+.2,z+10,.25,.7,1.5,'#3A3D44');
  B(g.x+2.0,g.y+.35,z,1.0,.4,4,'#3A3D44');B(g.x+2.0,g.y+.35,z+4,1.0,.4,1,'#C8102E');B(g.x+2.85,g.y+.1,z,.08,.08,9,'#8A939B');B(g.x+2.85,g.y+.82,z,.08,.08,9,'#8A939B');B(g.x+2.75,g.y,z+8.5,.08,.98,.5,'#C3CAD0',false);
  discX(g.x+2.75,g.y+.05,z+8.7,2.2,'#22252A');discX(g.x+2.75,g.y+.95,z+8.7,2.2,'#22252A');B(g.x+.2,g.y+1.0,z,1.2,.3,1.6,'#6E7880');}
function drawSpinde(g,z){B(g.x,g.y,z,g.w,.6,22,'#7E93A6');for(let i=1;i<6;i++)bandY(g.y+.601,g.x+i*g.w/6-.02,g.x+i*g.w/6+.02,z+.5,z+21.5,'#5F7487');
  for(let i=0;i<6;i++){bandY(g.y+.602,g.x+i*g.w/6+.15,g.x+i*g.w/6+.4,z+18,z+18.6,'#5F7487');bandY(g.y+.602,g.x+i*g.w/6+.15,g.x+i*g.w/6+.4,z+17,z+17.6,'#5F7487');B(g.x+i*g.w/6+.42,g.y+.6,z+11,.04,.04,2,'#D9DEE3',false);}
  B(g.x+.3,g.y+1.0,z,g.w-.6,.38,3.5,'#B98552');}
/* Duschkabine: geflieste Rück- und Seitenwand, Glas vorn und rechts, Brause an der Rückwand */
function drawDusche(g,z){const x0=g.x,y0=g.y,x1=g.x+g.w,y1=g.y+g.d,H=22;
  B(x0,y0,z,.1,g.d,H,'#DCE8EE');B(x0+.1,y0,z,g.w-.1,.1,H,'#E4EEF2');
  for(let k=1;k<7;k++){bandY(y0+.101,x0+.1,x1,z+k*3,z+k*3+.15,'#C3D3DB');bandX(x0+.101,y0+.1,y1,z+k*3,z+k*3+.15,'#C3D3DB');}
  B(x0+.1,y0+.1,z,g.w-.1,g.d-.1,1.2,'#F4F8FA');flat(x0+.25,y0+.25,x1-.12,y1-.12,'#D6E3EA',z+1.21);circFlat(x0+.65,y0+.65,.07,'#8A939B',z+1.25);
  B(x0+.55,y0+.1,z+8,.05,.04,12,'#B7C0C7',false);B(x0+.45,y0+.1,z+19.5,.25,.18,.7,'#B7C0C7',false);circFlat(x0+.58,y0+.32,.14,'#C9D0D6',z+19.4);
  B(x0+.4,y0+.1,z+10,.3,.05,.6,'#B7C0C7',false);
  if(!REDUCED){const on=Math.floor(tNow/2600)%3!==0;if(on)for(let i=0;i<6;i++){const ph=((tNow/520)+i/6)%1;const p=P(x0+.5+(i%3)*.06,y0+.28+(i%2)*.07,z+19-ph*17);cx.fillStyle=`rgba(120,190,230,${.75*(1-ph*.6)})`;cx.fillRect(p[0],p[1],.45,1.4);}}
  bandY(y1,x0,x1,z+1.2,z+H,'rgba(175,215,235,.30)');bandX(x1,y0,y1,z+1.2,z+H,'rgba(175,215,235,.24)');
  bandY(y1+.001,x0+.15,x0+.35,z+3,z+H-1,'rgba(255,255,255,.28)');
  B(x1-.04,y1-.04,z,.05,.05,H,'#9AA1A8',false);B(x0,y1-.04,z+H-.5,g.w,.05,.5,'#9AA1A8',false);B(x1-.04,y0,z+H-.5,.05,g.d,.5,'#9AA1A8',false);
  B(x0+.75,y1,z+9,.04,.05,4,'#9AA1A8',false);}
const FUNK=(g,z)=>{B(g.x,g.y,z,g.w,g.d,9,'#8C6A4A');
  B(g.x+.25,g.y+.1,z+9,.9,.15,7,'#22252A');bandY(g.y+.25,g.x+.32,g.x+1.08,z+10,z+15,Math.floor(tNow/600)%2?'#5CC8FF':'#4FB6EA');
  B(g.x+1.3,g.y+.1,z+9,.8,.15,7,'#22252A');bandY(g.y+.25,g.x+1.37,g.x+2.03,z+10,z+15,'#7CE0A8');
  B(g.x+2.25,g.y+.1,z+9,.8,.15,7,'#22252A');bandY(g.y+.25,g.x+2.32,g.x+2.98,z+10,z+15,'#F2B24A');
  B(g.x+3.1,g.y+.2,z+9,.25,.4,3,'#333');officeChair(g.x+1.0,g.y+1.2,z);officeChair(g.x+2.2,g.y+1.2,z);};
const KAFFEE=(g,z)=>{B(g.x,g.y,z,g.w,g.d,9,'#6E5A4A');B(g.x+.15,g.y+.12,z+9,.45,.4,7,'#1E1E22');
  bandY(g.y+.52,g.x+.25,g.x+.32,z+12,z+13,'#E2231A');B(g.x+.8,g.y+.25,z+9,.15,.15,2,'#F4F6F8');B(g.x+1.05,g.y+.3,z+9,.15,.15,2,'#E2231A');};
const ITEMGEO={
  rtw:{x:.3,y:.45,w:1.85,d:4.3,h:36,draw:(g,z)=>rtw(g.x,g.y,g.w,g.d,z,'RETTUNGSDIENST')},
  rtw2:{x:2.75,y:.45,w:1.85,d:4.3,h:36,draw:(g,z)=>rtw(g.x,g.y,g.w,g.d,z,'RETTUNGSDIENST')},
  ktw:{x:5.25,y:.9,w:1.6,d:3.6,h:26,draw:(g,z)=>ktw(g.x,g.y,g.w,g.d,z)},
  nef:{x:7.85,y:1.2,w:1.45,d:3.3,h:25,draw:(g,z)=>nef(g.x,g.y,g.w,g.d,z)},
  defi:{x:10.3,y:.12,w:.8,d:.62,h:18,draw:(g,z)=>{counter(g.x,g.y,z);const t=z+9.8,x=g.x,y=g.y;
    B(x+.14,y+.12,t,.52,.4,5.6,'#4E555D');bandY(y+.521,x+.19,x+.47,t+1.4,t+5,'#0E1A14');
    {const a=[[.2,3.2],[.27,3.2],[.3,4.4],[.33,2.2],[.36,3.2],[.46,3.2]].map(([dx,dz])=>P(x+dx,y+.523,t+dz));cx.strokeStyle='#4BE07A';cx.lineWidth=.35;cx.beginPath();a.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));cx.stroke();}
    bandY(y+.522,x+.5,x+.6,t+3.6,t+4.4,'#E2231A');bandY(y+.522,x+.5,x+.6,t+2.2,t+3,'#F2C230');bandX(x+.661,y+.16,y+.48,t+.6,t+2.4,'#F07F1A');
    B(x+.24,y+.27,t+5.6,.06,.1,1.2,'#2E3238',false);B(x+.54,y+.27,t+5.6,.06,.1,1.2,'#2E3238',false);B(x+.24,y+.27,t+6.6,.36,.1,.4,'#2E3238',false);}},
  rucksack:{x:11.2,y:.12,w:.8,d:.62,h:19,draw:(g,z)=>{counter(g.x,g.y,z);const t=z+9.8,x=g.x,y=g.y;
    RB(x+.1,y+.08,t,.62,.46,8,'#C8102E',.12,2);B(x+.17,y+.54,t+.6,.48,.07,4.6,'#A50D25');
    bandY(y+.611,x+.36,x+.46,t+1.5,t+4.5,'#FFFFFF');bandY(y+.612,x+.26,x+.56,t+2.55,t+3.45,'#FFFFFF');
    bandX(x+.721,y+.12,y+.5,t+5.4,t+6.1,'#DDE3E8');bandY(y+.541,x+.12,x+.68,t+5.4,t+6.1,'#DDE3E8');B(x+.3,y+.25,t+8,.2,.06,.8,'#26282D',false);}},
  vakuum:{x:12.1,y:.12,w:.8,d:.62,h:17,draw:(g,z)=>{counter(g.x,g.y,z);cylX(g.x+.06,g.x+.74,g.y+.31,z+13.2,3.4,'#F07F1A',[[g.x+.2,g.x+.26],[g.x+.54,g.x+.6]]);}},
  beatmung:{x:13.0,y:.12,w:.8,d:.62,h:20,draw:(g,z)=>{counter(g.x,g.y,z);const t=z+9.8,x=g.x,y=g.y;
    cylZ(x+.16,y+.22,.12,t,10,'#F2F4F6');circFlat(x+.16,y+.22,.12,'#FFFFFF',t+10);B(x+.13,y+.19,t+10,.06,.06,1.8,'#8A939B',false);bandY(y+.34,x+.04,x+.28,t+7.4,t+8,'#2F8F4E');
    B(x+.31,y+.12,t,.46,.44,6.6,'#E6E9EC');B(x+.31,y+.12,t+6.6,.46,.44,.5,'#3AA0E0');bandY(y+.561,x+.35,x+.6,t+2.6,t+5.6,'#1E7BC4');bandY(y+.562,x+.38,x+.5,t+4,t+5,'#9FD4FF');
    discY(x+.69,y+.563,t+4.2,1,'#3A3D44');discY(x+.69,y+.564,t+1.8,.7,'#E2231A');
    {const a=P(x+.77,y+.32,t+4.6),b=P(x+1.0,y+.45,t+1.4),c=P(x+.86,y+.62,t+.4);cx.strokeStyle='#8FC3E6';cx.lineWidth=1.2;cx.lineCap='round';cx.beginPath();cx.moveTo(a[0],a[1]);cx.quadraticCurveTo(b[0],b[1],c[0],c[1]);cx.stroke();
     cx.strokeStyle='rgba(60,110,150,.5)';cx.lineWidth=.25;cx.setLineDash([.4,.5]);cx.stroke();cx.setLineDash([]);}}},
  desinfektion:{x:10.15,y:2.3,w:.8,d:1.7,h:22,draw:drawDesinf},
  funk:{x:.4,y:.15,w:3.4,d:.9,h:18,draw:FUNK},
  kueche:{x:5.35,y:.1,w:2.6,d:.7,h:30,draw:drawKueche},
  kaffee:{x:8.15,y:.1,w:1.4,d:.7,h:16,draw:KAFFEE},
  esstisch:{x:6.0,y:1.7,w:2.0,d:2.0,h:10,draw:drawTisch},
  tv:{x:.6,y:5.1,w:2.0,d:.45,h:14,draw:drawTV},
  sofa:{x:.4,y:7.7,w:2.4,d:.95,h:10,draw:drawSofa},
  kicker:{x:4.2,y:6.5,w:1.6,d:.9,h:10,draw:drawKicker},
  schulung:{x:10.5,y:1.0,w:2.4,d:1.6,h:12,draw:drawSchulung,wall:schulWall},
  betten:{x:.2,y:.3,w:5.4,d:1.0,h:9,draw:drawBetten},
  fitness:{x:6.4,y:.3,w:3.2,d:1.3,h:11,draw:drawFitness},
  spinde:{x:10.3,y:.1,w:3.4,d:1.4,h:22,draw:drawSpinde},
  dusche:{x:12.6,y:3.4,w:1.2,d:1.2,h:22,draw:drawDusche},
};
/* ---------- Geschosse ---------- */
const FLOORS=[
  {short:'EG',name:'Fahrzeughalle',cost:0,desc:'Fahrzeuge, Geräte und Hygiene'},
  {short:'1. OG',name:'Wache',cost:150,desc:'Funk, Küche, Aufenthaltsraum und Schulung'},
  {short:'2. OG',name:'Ruhe & Training',cost:300,desc:'Ruheräume, Fitness, Umkleide und Dusche'}];
const POLE=[8,6];
/* Treppe vorne rechts, zwei Läufe übereinander versetzt:
   EG → 1. OG im vorderen Lauf (y 8–9, steigt nach rechts), 1. OG → 2. OG im hinteren Lauf (y 7–8, steigt nach links).
   bot = Antritt auf dem unteren Geschoss, top = Austritt auf dem oberen Geschoss. */
const FH=40,NSTEP=9;
const STAIRS=[{lo:0,bot:[10,8],top:[13,8],y0:8,y1:9,xl:11,xh:13},{lo:1,bot:[13,7],top:[10,7],y0:7,y1:8,xl:13,xh:11}];
const stX=st=>[Math.min(st.xl,st.xh),Math.max(st.xl,st.xh)];
const stK=st=>stX(st)[0]+st.y0+3-.6;
const WALLS={
  0:[{v:1,c:10,a:0,b:9,doors:[[7,8]]}],
  1:[{v:0,c:4,a:0,b:5,doors:[[3,4]]},{v:1,c:5,a:0,b:4,doors:[]},{v:1,c:10,a:0,b:6,doors:[[4,5]]},{v:0,c:6,a:10,b:14,doors:[]}],
  2:[{v:1,c:3,a:0,b:4,doors:[]},{v:0,c:4,a:0,b:6,doors:[[1,2],[4,5]]},{v:1,c:6,a:0,b:4,doors:[]},{v:1,c:10,a:0,b:6,doors:[[4,5]]},{v:0,c:6,a:10,b:14,doors:[]}]};
/* Treppenlauf (dz verschiebt ihn nach unten, z. B. Blick in den Treppenschacht) */
function flight(st,dz=0,rails='both'){const {xl,xh,y0,y1}=st,n=NSTEP,s=(xh-xl)/n,h=FH/n,yi=y0+.1,yo=y1-.1;
  const STR='#7F8890',RAIL='#8C949B';
  const stringer=(yc,col)=>poly([P(xl,yc,dz),P(xl,yc,dz+h+1.2),P(xh,yc,dz+FH+1.2),P(xh,yc,dz+FH-4.5)],col,EDGE);
  const rail=yc=>{for(let i=1;i<n;i+=3){const xp=xl+s*(i+.5);B(xp-.03,yc-.03,dz+(i+1)*h,.06,.06,10,RAIL,false);}
    const a=P(xl+s*.5,yc,dz+h+10.5),b=P(xh-s*.5,yc,dz+FH+10.5);cx.strokeStyle=RAIL;cx.lineWidth=.9;cx.lineCap='round';cx.beginPath();cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.stroke();
    cx.strokeStyle='rgba(255,255,255,.35)';cx.lineWidth=.3;cx.stroke();};
  stringer(y0,shade(STR,-.15));if(rails!=='front')rail(y0+.05);
  const order=[...Array(n).keys()];if(s<0)order.reverse();
  order.forEach(i=>{const xa=xl+i*s,xb=xa+s;B(Math.min(xa,xb),yi,dz+i*h,Math.abs(s),yo-yi,h,i%2?'#CFC8BC':'#C6BEB2');
    const nx=s>0?xa:xa-.06;flat(nx,yi,nx+.06,yo,'#E0B83A',dz+(i+1)*h+.01);});
  stringer(y1,STR);if(rails!=='back')rail(y1-.05);}
/* Öffnung im Boden: Schacht mit dem darunterliegenden Lauf */
function holeRect(st){const [x0,x1]=stX(st);return [P(x0,st.y0),P(x1,st.y0),P(x1,st.y1),P(x0,st.y1)];}
function holeFloor(st){const [x0,x1]=stX(st);cx.save();poly(holeRect(st),'#1E1B19');cx.clip();
  bandY(st.y0,x0,x1,-FH,0,'#4A433C');bandX(x0,st.y0,st.y1,-FH,0,'#3C3631');bandY(st.y0,x0,x1,-2.5,0,'#8A7F70');bandX(x0,st.y0,st.y1,-2.5,0,'#7D7366');
  flight(st,-FH);poly(holeRect(st),'rgba(12,10,8,.22)');cx.restore();}
/* Zuschnitt für Figuren, die in der Öffnung auf- oder absteigen */
function holeClip(st){const [x0,x1]=stX(st);const pts=[P(x0,st.y1),P(x1,st.y1),P(x1,st.y0),P(x1,st.y0,90),P(x0,st.y0,90),P(x0,st.y1,90)];
  cx.beginPath();pts.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));cx.closePath();}
function poleClip(){const c=[POLE[0]+.5,POLE[1]+.5],r=.5;cx.beginPath();for(let t=0;t<=6.3;t+=.15){const front=Math.cos(t)+Math.sin(t)>=0;const q=P(c[0]+r*Math.cos(t),c[1]+r*Math.sin(t),front?0:90);t?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]);}cx.closePath();}
/* Geländer um die Öffnung (Austrittsseite bleibt offen) */
function holeRails(st){const [x0,x1]=stX(st),RAIL='#8C949B',H=10.5;const out=[];
  const alongX=yc=>({x:x0,y:yc-.04,w:x1-x0,d:.08,h:12,nofoot:1,draw:()=>{for(let x=x0+.04;x<=x1;x+=.5)B(x-.03,yc-.03,0,.06,.06,H,RAIL,false);B(x0,yc-.03,H,x1-x0,.06,.7,RAIL,false);B(x0,yc-.02,5,x1-x0,.04,.4,RAIL,false);}});
  out.push(alongX(st.y0),alongX(st.y1));
  const xc=st.xl;out.push({x:xc-.04,y:st.y0,w:.08,d:st.y1-st.y0,h:12,nofoot:1,draw:()=>{for(let y=st.y0+.04;y<=st.y1;y+=.48)B(xc-.03,y-.03,0,.06,.06,H,RAIL,false);B(xc-.03,st.y0,H,.06,st.y1-st.y0,.7,RAIL,false);B(xc-.02,st.y0,5,.04,st.y1-st.y0,.4,RAIL,false);}});
  return out;}
function poleFloor(fl){const pc=[POLE[0]+.5,POLE[1]+.5];
  if(fl===0){circFlat(pc[0],pc[1],.48,'#F2C230');circFlat(pc[0],pc[1],.32,'#2B2B2B');}
  else{circFlat(pc[0],pc[1],.5,'#2A2522');circFlat(pc[0]-.04,pc[1]-.04,.44,'#1A1714');}}
function poleDraw(fl){const pc=[POLE[0]+.5,POLE[1]+.5];
  if(fl){for(let i=0;i<8;i++){const a=i*Math.PI/4;B(pc[0]+.62*Math.cos(a)-.03,pc[1]+.62*Math.sin(a)-.03,0,.06,.06,8,'#B08A3A',false);}
    const ring=[];for(let t=0;t<6.3;t+=.3)ring.push(P(pc[0]+.62*Math.cos(t),pc[1]+.62*Math.sin(t),8));cx.strokeStyle='#C9A24A';cx.lineWidth=.6;cx.beginPath();ring.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));cx.closePath();cx.stroke();}
  const a=P(pc[0],pc[1],0),b=P(pc[0],pc[1],46);const gr=cx.createLinearGradient(a[0]-1,0,a[0]+1,0);gr.addColorStop(0,'#8A6A2A');gr.addColorStop(.5,'#F2D27A');gr.addColorStop(1,'#9A7A3A');
  cx.fillStyle=gr;cx.fillRect(a[0]-.7,b[1],1.4,a[1]-b[1]);}
const poleObj=fl=>({x:POLE[0]-.15,y:POLE[1]-.15,w:1.3,d:1.3,h:46,draw:()=>poleDraw(fl),nofoot:1});
const flightObj=(i,rails)=>({x:stX(STAIRS[i])[0],y:STAIRS[i].y0,w:2,d:1,h:52,draw:()=>flight(STAIRS[i],0,rails),nofoot:1});
const DECOR={
  0:[{x:9.2,y:5.3,w:.35,d:.35,h:8,draw:g=>{B(g.x,g.y,0,g.w,g.d,2,'#E8590C');B(g.x+.08,g.y+.08,2,.2,.2,5,'#F07F1A');B(g.x+.08,g.y+.08,4,.2,.2,1,'#F4F6F8');}},
     {floor:()=>poleFloor(0)},poleObj(0),flightObj(0,'both')],
  1:[{x:4.5,y:4.5,w:.42,d:.42,h:16,draw:g=>plant(g.x,g.y)},
     {floor:()=>holeFloor(STAIRS[0])},...holeRails(STAIRS[0]),flightObj(1,'back'),
     {floor:()=>poleFloor(1)},poleObj(1)],
  2:[{x:9.25,y:5.4,w:.42,d:.42,h:16,draw:g=>plant(g.x,g.y)},
     {floor:()=>holeFloor(STAIRS[1])},...holeRails(STAIRS[1]),
     {floor:()=>poleFloor(2)},poleObj(2)]};
const ZONES={
  0:[{name:'Fahrzeughalle',x:5,y:0,z:47},{name:'Geräte & Hygiene',x:11.3,y:0,z:47}],
  1:[{name:'Funk',x:2.5,y:0,z:47},{name:'Küche & Aufenthalt',x:7.5,y:0,z:47},{name:'Schulung',x:12,y:0,z:47}],
  2:[{name:'Ruheräume',x:3,y:0,z:47},{name:'Fitness',x:8,y:0,z:47},{name:'Umkleide',x:12,y:0,z:47}]};

/* Laufbare Kacheln je Geschoss */
const blockedF={},freeF={};
for(let fl=0;fl<3;fl++){
  const bl=Array.from({length:SC.GX},()=>Array(SC.GY).fill(false));
  const mark=g=>{for(let i=Math.floor(g.x);i<Math.ceil(g.x+g.w-.05);i++)for(let j=Math.floor(g.y);j<Math.ceil(g.y+g.d-.05);j++)if(i>=0&&j>=0&&i<SC.GX&&j<SC.GY)bl[i][j]=true;};
  ITEMS.filter(it=>it.fl===fl).forEach(it=>mark(ITEMGEO[it.id]));
  DECOR[fl].forEach(g=>{if(!g.nofoot&&!g.floor)mark(g);});
  STAIRS.forEach(st=>{if(st.lo===fl||st.lo+1===fl){const [x0,x1]=stX(st);for(let i=x0;i<x1;i++)bl[i][st.y0]=true;}});
  if(fl===1){bl[1][1]=true;bl[2][1]=true;}
  bl[POLE[0]][POLE[1]]=true;
  blockedF[fl]=bl;const fr=[];for(let i=0;i<SC.GX;i++)for(let j=0;j<SC.GY;j++)if(!bl[i][j])fr.push([i,j]);freeF[fl]=fr;}
function edgeBlocked(fl,i,j,ni,nj){for(const w of WALLS[fl]){
  if(w.v&&ni!==i){const c=Math.max(i,ni);if(c===w.c&&j>=w.a&&j<w.b&&!w.doors.some(([a,b])=>j>=a&&j<b))return true;}
  if(!w.v&&nj!==j){const c=Math.max(j,nj);if(c===w.c&&i>=w.a&&i<w.b&&!w.doors.some(([a,b])=>i>=a&&i<b))return true;}}return false;}
function path(fl,a,b){const key=(i,j)=>i*100+j;const prev=new Map([[key(...a),null]]);const q=[a];const bl=blockedF[fl];
  while(q.length){const [i,j]=q.shift();if(i===b[0]&&j===b[1])break;
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=SC.GX||nj>=SC.GY||(bl[ni][nj]&&!(ni===b[0]&&nj===b[1]))||edgeBlocked(fl,i,j,ni,nj))continue;const k=key(ni,nj);if(!prev.has(k)){prev.set(k,[i,j]);q.push([ni,nj]);}}}
  if(!prev.has(key(...b)))return[];const out=[];let c=b;while(c&&!(c[0]===a[0]&&c[1]===a[1])){out.unshift(c);c=prev.get(key(...c));}return out;}
/* Nur Kacheln behalten, die vom Treppenantritt aus erreichbar sind (keine Ziele in eingeschlossenen Ecken) */
for(let fl=0;fl<3;fl++){const st=fl?STAIRS[fl-1].top:STAIRS[0].bot;freeF[fl]=freeF[fl].filter(t=>(t[0]===st[0]&&t[1]===st[1])||path(fl,st,t).length);}

/* Crew */
const HAIR=['#3B2A1E','#C9A15A','#1E1E1E','#8A4B2A','#B0B0B0','#E6C88A','#5A3A22','#2B2B2B','#D9B07A'];
const SKIN=['#F1C7A5','#D9A47E','#A86F4C','#F5D3B8','#E8B48F','#C68A62'];
const crew=[];
let VIEWFL=0;try{VIEWFL=Math.min(+localStorage.getItem('wachenalarm.fl')||0,2);}catch(e){}
const flOpen=fl=>fl<(S.floors||1);
function randFloor(){const n=S.floors||1;return Math.floor(Math.random()*n);}
function spawn(atDoor){const n=crew.length;const fl=atDoor?0:randFloor();const fr=freeF[fl];const t=atDoor?STAIRS[0].bot:fr[Math.floor(Math.random()*fr.length)];
  crew.push({fl,x:t[0]+.5,y:t[1]+.5,z:0,path:[],dir:1,anim:0,wait:Math.random()*2,hair:HAIR[n%HAIR.length],skin:SKIN[(n*3)%SKIN.length],outfit:n%3===1?'polo':'jacke',style:['short','pony','beard','curly','bald','bun'][n%6],say:null,sayT:0});}
const crewTarget=()=>Math.min(9,2+Math.floor(S.owned.length/2)+((S.floors||1)-1));
function syncCrew(atDoor){while(crew.length<crewTarget())spawn(atDoor);
  crew.forEach(f=>{if(f.goFl!=null&&!flOpen(f.goFl))f.goFl=null;if(!flOpen(f.fl)){f.fl=0;f.cl=null;f.z=0;f.goFl=null;const t=freeF[0][Math.floor(Math.random()*freeF[0].length)];f.x=t[0]+.5;f.y=t[1]+.5;f.path=[];}});
  const n=crew.length;$('#crewnote').textContent=`${n} Kolleg${n===1?'e':'en'} im Dienst · tippe auf einen blassen Platz zum Bauen`;renderFloors();}
function lines(){const L=['Kaffee?','Wer fährt mit?','Schicht läuft','RTW ist sauber','Desinfektion läuft'];
  const add=(id,t)=>{if(has(id))L.push(t);};
  add('defi','Defi geprüft');add('funk','Funkprobe!');add('kaffee','Frischer Kaffee!');add('nef','NEF ist klar');add('beatmung','Beatmung gecheckt');
  add('rucksack','Rucksack komplett');add('rtw2','Zweiter RTW klar');add('kueche','Wer kocht heute?');add('kicker','Revanche am Kicker?');add('tv','Läuft was im TV?');
  add('schulung','Kurze Reafortbildung?');add('fitness','Noch ’ne Runde Laufband');add('betten','Kurz die Augen zu');add('dusche','Erst mal duschen');add('sofa','Feierabend-Sofa');
  if(S.streak>1)L.push(`${S.streak} Schichten am Stück!`);return L;}
function sprite(f){
  const p=P(f.x,f.y,f.z||0);const walking=f.path.length>0||!!f.cl;const t=f.anim*10;const d=f.dir;const back=!!(f.back&&walking);
  const sw=walking?Math.sin(t):0,bob=walking?Math.abs(Math.cos(t))*.5:0;
  const polo=f.outfit==='polo';
  const RED='#E43C24',REDD='#B42D1A',YEL='#D8EA2E',YELD='#B4C61E',SIL='#DCE3E8',SILD='#B9C3CA',NAVY='#26314B',NAVYD='#1A2236',BOOT='#1A1B20';
  const LINE='rgba(30,20,22,.62)';
  const skin=f.skin,skinD=shade(skin,-.14),skinDD=shade(skin,-.28),skinL=shade(skin,.14);
  const hair=f.hair,hairD=shade(hair,-.34),hairL=shade(hair,.3),hairM=shade(hair,-.14);
  const st=f.style,ty=-bob;
  cx.save();cx.translate(p[0],p[1]);
  cx.fillStyle='rgba(20,25,35,.22)';cx.beginPath();cx.ellipse(0,0,4.6,1.9,0,0,7);cx.fill();
  cx.scale(d,1);
  const fillP=(fn,fill,stroke=true)=>{cx.beginPath();fn();cx.closePath();cx.fillStyle=fill;cx.fill();if(stroke){cx.strokeStyle=LINE;cx.lineWidth=.26;cx.lineJoin='round';cx.stroke();}};
  const ln=(pts,c,w=.2)=>{cx.beginPath();pts.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));cx.strokeStyle=c;cx.lineWidth=w;cx.lineCap='round';cx.lineJoin='round';cx.stroke();};
  const cv=(x0,y0,qx,qy,x1,y1,c,w=.18)=>{cx.beginPath();cx.moveTo(x0,y0+ty);cx.quadraticCurveTo(qx,qy+ty,x1,y1+ty);cx.strokeStyle=c;cx.lineWidth=w;cx.lineCap='round';cx.stroke();};
  const dot=(x,y,r,c)=>{cx.fillStyle=c;cx.beginPath();cx.arc(x,y+ty,r,0,7);cx.fill();};

  /* ---------- Beine ---------- */
  const pants=polo?NAVY:RED,pantsD=polo?NAVYD:REDD;
  const leg=(lx,lift,far)=>{const top=-12.7-bob,bot=-1.6-lift,c=far?pantsD:pants;
    fillP(()=>{cx.moveTo(lx-1.35,top);cx.lineTo(lx+1.3,top);cx.lineTo(lx+1.12,-6.6-lift*.5);cx.lineTo(lx+1.02,bot);cx.lineTo(lx-1.02,bot);cx.lineTo(lx-1.18,-6.6-lift*.5);},c);
    if(!back){fillP(()=>{cx.rect(lx-.05,-10.3-bob*.6,1.05,1.8);},far?shade(pantsD,-.18):pantsD,false);cx.fillStyle=shade(c,-.3);cx.fillRect(lx-.05,-10.3-bob*.6,1.05,.25);}
    cx.fillStyle=polo?SIL:YEL;cx.fillRect(lx-1.07,-5.4-lift,2.15,.6);cx.fillStyle=far?SILD:SIL;cx.fillRect(lx-1.06,-4.5-lift,2.12,.5);
    const toe=back?0:.6;
    fillP(()=>{cx.moveTo(lx-1.08,bot-.25);cx.lineTo(lx+1.04,bot-.25);cx.quadraticCurveTo(lx+1.15+toe,bot+.4,lx+1.15+toe,bot+1.25);cx.lineTo(lx-1.15,bot+1.25);},BOOT);
    cx.fillStyle='#45464E';cx.fillRect(lx-1.15,bot+1.0,2.3+toe,.3);cx.fillStyle='rgba(255,255,255,.22)';cx.fillRect(lx-.6,bot+.1,.8,.25);
  };

  /* ---------- Hand: Handfläche, Daumen, Fingerlinien ---------- */
  const L=7.2;
  const hand=far=>{const sk=far?skinD:skin,sl=far?skinDD:skinD;
    cx.fillStyle=sl;cx.fillRect(-.66,L-.15,1.32,.55);
    fillP(()=>{cx.moveTo(-.76,L+.15);cx.lineTo(.7,L+.15);cx.quadraticCurveTo(.98,L+1.15,.62,L+1.85);cx.quadraticCurveTo(.05,L+2.2,-.48,L+1.92);cx.quadraticCurveTo(-.92,L+1.2,-.76,L+.15);},sk);
    cx.save();cx.translate(.72,L+.78);cx.rotate(-.45);fillP(()=>{cx.ellipse(0,0,.32,.7,0,0,7);},sk);cx.restore();
    ln([[-.3,L+1.2],[-.33,L+1.9]],sl,.12);ln([[.04,L+1.28],[.03,L+2.02]],sl,.12);ln([[.36,L+1.25],[.36,L+1.85]],sl,.12);
    cx.fillStyle=far?skin:skinL;cx.fillRect(-.55,L+.35,.32,.55);
  };
  const arm=(sx,rot,far)=>{cx.save();cx.translate(sx,-20.6-bob);cx.rotate(rot);
    const c=far?REDD:RED;
    if(polo){
      fillP(()=>{cx.moveTo(-1.2,-.3);cx.lineTo(1.2,-.3);cx.lineTo(1.15,2.9);cx.lineTo(-1.15,2.9);},c);
      cx.fillStyle=shade(c,-.18);cx.fillRect(-1.15,2.45,2.3,.45);
      fillP(()=>{cx.moveTo(-.82,2.85);cx.lineTo(.82,2.85);cx.lineTo(.7,L+.2);cx.lineTo(-.7,L+.2);},far?skinD:skin);
      cx.fillStyle=far?skinDD:skinD;cx.fillRect(-.82,2.9,1.64,.35);
    }else{
      fillP(()=>{cx.moveTo(-1.22,-.3);cx.lineTo(1.22,-.3);cx.lineTo(1.0,L+.2);cx.lineTo(-1.0,L+.2);},c);
      cx.fillStyle=far?YELD:YEL;cx.fillRect(-1.2,-.3,2.4,1.7);
      cx.fillStyle=far?SILD:SIL;cx.fillRect(-1.13,4.1,2.22,.55);
      cx.fillStyle=shade(c,-.18);cx.fillRect(-1.0,L-.45,2.0,.65);
      ln([[-.2,2.2],[-.1,3.6]],shade(c,-.22),.12);
    }
    hand(far);cx.restore();};

  /* ---------- Rumpf ---------- */
  const torso=()=>{cx.moveTo(-3.2,-21.6+ty);cx.quadraticCurveTo(-4.45,-21.4+ty,-4.25,-19.8+ty);cx.lineTo(-3.6,-12.1+ty);cx.lineTo(3.6,-12.1+ty);cx.lineTo(4.25,-19.8+ty);cx.quadraticCurveTo(4.45,-21.4+ty,3.2,-21.6+ty);};
  const drawTorso=()=>{
    fillP(torso,RED);
    cx.save();cx.beginPath();torso();cx.closePath();cx.clip();
    if(!back){cx.fillStyle='rgba(110,18,8,.2)';cx.fillRect(-4.5,-22+ty,1.8,10);}
    if(!polo){
      cx.fillStyle=YEL;cx.fillRect(-4.5,-22+ty,9,3.4);cx.fillStyle=YELD;cx.fillRect(-4.5,-18.75+ty,9,.18);
      cx.fillStyle=SIL;cx.fillRect(-4.5,-17.9+ty,9,.65);cx.fillRect(-4.5,-14.8+ty,9,.65);
      if(back){cx.fillStyle=SIL;cx.fillRect(-2.7,-17.0+ty,5.4,1.7);cx.fillStyle=RED;cx.fillRect(-2.3,-16.4+ty,4.6,.45);}
      else{
        ln([[.35,-21.5+ty],[.35,-12.2+ty]],REDD,.2);
        fillP(()=>{cx.rect(1.15,-17.2+ty,1.35,2.2);},'#202329');cx.fillStyle='#3a3e46';cx.fillRect(1.35,-16.9+ty,.95,.6);
        ln([[2.25,-17.2+ty],[2.3,-18.7+ty]],'#202329',.22);
        cx.fillStyle=shade(RED,-.15);cx.fillRect(-2.9,-14.0+ty,2.2,1.4);cx.fillStyle=shade(RED,-.3);cx.fillRect(-2.9,-14.0+ty,2.2,.25);
      }
    }else{
      cx.fillStyle=SIL;cx.fillRect(-4.5,-15.4+ty,9,.45);
      if(!back){ln([[.35,-21.3+ty],[.35,-19.3+ty]],REDD,.2);dot(.6,-20.6,.13,'#f0f0f0');dot(.6,-19.8,.13,'#f0f0f0');
        cx.fillStyle='#f4f6f8';cx.fillRect(1.5,-19.6+ty,1.3,.8);cx.fillStyle=RED;cx.fillRect(1.9,-19.5+ty,.5,.6);cx.fillRect(1.75,-19.35+ty,.8,.3);}
    }
    cx.restore();
    if(polo){
      cx.fillStyle=NAVYD;cx.fillRect(-3.65,-12.9+ty,7.3,.9);
      if(!back){cx.fillStyle='#C8CFD5';cx.fillRect(.0,-12.85+ty,.8,.8);}
      if(!back){fillP(()=>{cx.moveTo(-1.5,-21.9+ty);cx.lineTo(.3,-21.5+ty);cx.lineTo(-.4,-20.4+ty);cx.lineTo(-1.8,-21.2+ty);},RED);
        fillP(()=>{cx.moveTo(1.9,-21.9+ty);cx.lineTo(.3,-21.5+ty);cx.lineTo(.95,-20.4+ty);cx.lineTo(2.2,-21.2+ty);},RED);}
      else fillP(()=>{cx.moveTo(-1.9,-22.1+ty);cx.lineTo(1.9,-22.1+ty);cx.lineTo(2.1,-21.2+ty);cx.lineTo(-2.1,-21.2+ty);},RED);
    }else{
      fillP(()=>{cx.moveTo(-1.75,-22.3+ty);cx.lineTo(1.85,-22.3+ty);cx.lineTo(2.1,-21.2+ty);cx.lineTo(-2.0,-21.2+ty);},YEL);
      if(!back)ln([[.35,-22.3+ty],[.35,-21.3+ty]],YELD,.18);
    }
  };

  /* ---------- Kopf ---------- */
  const headF=()=>{cx.moveTo(-2.45,-24.8+ty);cx.bezierCurveTo(-2.5,-27.5+ty,2.3,-28.3+ty,2.45,-25.3+ty);cx.bezierCurveTo(2.6,-24.4+ty,2.7,-24.0+ty,2.55,-23.5+ty);
    cx.bezierCurveTo(2.42,-22.6+ty,1.9,-21.8+ty,.95,-21.7+ty);cx.bezierCurveTo(-.4,-21.6+ty,-1.5,-22.1+ty,-2.0,-22.9+ty);cx.bezierCurveTo(-2.4,-23.5+ty,-2.5,-24.1+ty,-2.45,-24.8+ty);};
  const headB=()=>{cx.ellipse(0,-24.75+ty,2.5,2.95,0,0,7);};

  /* Frisuren (Seite nach rechts gewandt) */
  const capShort=()=>fillP(()=>{cx.moveTo(-1.3,-22.95+ty);cx.quadraticCurveTo(-2.8,-23.4+ty,-2.68,-25.2+ty);cx.bezierCurveTo(-2.62,-28.0+ty,2.25,-28.7+ty,2.78,-25.65+ty);
    cx.quadraticCurveTo(2.35,-25.95+ty,1.9,-25.7+ty);cx.quadraticCurveTo(1.45,-26.0+ty,1.0,-25.65+ty);cx.quadraticCurveTo(.5,-25.95+ty,.05,-25.7+ty);
    cx.quadraticCurveTo(-.28,-25.3+ty,-.2,-24.55+ty);cx.lineTo(-.18,-23.75+ty);cx.lineTo(-.5,-23.75+ty);cx.lineTo(-.62,-24.85+ty);cx.quadraticCurveTo(-1.25,-24.95+ty,-1.38,-24.2+ty);cx.lineTo(-1.3,-22.95+ty);},hair);
  const strandsShort=()=>{cv(-1.7,-27.0,-.2,-28.0,1.5,-27.45,hairL,.36);cv(-2.25,-25.7,-2.1,-26.9,-1.2,-27.4,hairL,.2);
    cv(.5,-27.5,1.7,-27.0,2.3,-26.0,hairD,.14);cv(-.5,-27.6,.7,-26.8,1.15,-25.9,hairD,.14);cv(-1.3,-27.3,-.4,-26.6,-.1,-25.9,hairD,.13);cv(-2.3,-24.3,-2.15,-25.4,-1.6,-26.3,hairD,.13);};
  const capLong=()=>fillP(()=>{cx.moveTo(-1.55,-23.1+ty);cx.quadraticCurveTo(-2.85,-23.7+ty,-2.72,-25.4+ty);cx.bezierCurveTo(-2.62,-28.1+ty,2.3,-28.7+ty,2.82,-25.6+ty);
    cx.quadraticCurveTo(2.75,-25.0+ty,2.45,-24.75+ty);cx.quadraticCurveTo(1.9,-25.55+ty,.9,-25.7+ty);cx.quadraticCurveTo(.2,-25.75+ty,-.15,-25.35+ty);
    cx.quadraticCurveTo(-.32,-24.9+ty,-.3,-24.35+ty);cx.lineTo(-.62,-24.85+ty);cx.quadraticCurveTo(-1.25,-24.95+ty,-1.42,-24.1+ty);cx.lineTo(-1.55,-23.1+ty);},hair);
  const strandsLong=()=>{cv(2.3,-26.0,.4,-27.9,-2.2,-25.9,hairL,.3);cv(1.6,-25.85,0,-27.1,-2.35,-25.0,hairD,.13);cv(2.5,-25.3,1.4,-26.6,-.4,-27.3,hairD,.12);cv(-.6,-27.5,-1.8,-27.1,-2.4,-24.8,hairD,.12);};
  const ponytail=sideView=>{cx.save();
    if(sideView){cx.translate(-2.45,-25.35+ty);cx.rotate(.22+sw*.12);}else{cx.translate(0,-25.0+ty);cx.rotate(sw*.1);}
    fillP(()=>{cx.moveTo(-.35,-.15);cx.quadraticCurveTo(-1.45,.9,-1.0,3.2);cx.quadraticCurveTo(-.7,4.5,-.05,5.0);cx.quadraticCurveTo(-.15,3.6,.55,1.5);cx.quadraticCurveTo(.75,.3,-.35,-.15);},hair);
    const q=(a,b,c,dd,e,g,col,w)=>{cx.beginPath();cx.moveTo(a,b);cx.quadraticCurveTo(c,dd,e,g);cx.strokeStyle=col;cx.lineWidth=w;cx.lineCap='round';cx.stroke();};
    q(-.2,.5,-.9,2.0,-.45,4.2,hairL,.22);q(.2,.6,-.3,2.4,-.15,4.5,hairD,.12);q(-.55,.9,-1.05,2.4,-.75,3.8,hairD,.1);
    fillP(()=>{cx.ellipse(-.1,.2,.62,.38,.2,0,7);},'#2E4FA8');cx.restore();};
  const bun=sideView=>{const bx=sideView?-1.95:0,by=sideView?-27.35:-27.7;
    fillP(()=>{cx.arc(bx,by+ty,1.2,0,7);},hair);cv(bx-.8,by-.2,bx,by-1.2,bx+.8,by-.3,hairL,.24);cv(bx-.9,by+.3,bx,by-.4,bx+.9,by+.4,hairD,.12);cv(bx-.6,by+.7,bx,by+.2,bx+.7,by+.8,hairD,.1);};
  const curls=(backView)=>{
    const pts=[];const cxH=backView?0:.05,cyH=-25.1,rx=backView?2.75:2.8,ry=3.05;
    const a0=backView?Math.PI*.95:Math.PI*.98,a1=backView?Math.PI*2.05:Math.PI*1.9;
    for(let a=a0;a<=a1;a+=.32)pts.push([cxH+rx*Math.cos(a),cyH+ry*Math.sin(a)]);
    if(!backView)[[2.4,-25.7],[1.6,-25.9],[.85,-25.9],[.15,-25.7]].forEach(q=>pts.push(q));
    else[[-2.55,-23.6],[2.55,-23.6],[-2.45,-24.4],[2.45,-24.4]].forEach(q=>pts.push(q));
    if(!backView)[[-2.6,-24.3],[-2.2,-23.4],[-1.5,-23.1]].forEach(q=>pts.push(q));
    fillP(()=>{backView?cx.ellipse(0,-25.0+ty,2.6,2.6,0,Math.PI,Math.PI*2):(cx.moveTo(-1.4,-23.0+ty),cx.quadraticCurveTo(-2.8,-23.5+ty,-2.7,-25.3+ty),cx.bezierCurveTo(-2.6,-28.0+ty,2.3,-28.6+ty,2.7,-25.7+ty),cx.lineTo(-.2,-25.6+ty),cx.lineTo(-.6,-24.8+ty),cx.lineTo(-1.35,-24.2+ty));},hair,false);
    pts.forEach(([x,y])=>{cx.beginPath();cx.arc(x,y+ty,.62,0,7);cx.fillStyle=hair;cx.fill();cx.strokeStyle=LINE;cx.lineWidth=.2;cx.stroke();});
    pts.forEach(([x,y])=>{cx.beginPath();cx.arc(x-.12,y-.12+ty,.3,Math.PI*1.1,Math.PI*1.9);cx.strokeStyle=hairL;cx.lineWidth=.16;cx.stroke();});
    for(let i=0;i<9;i++){const a=Math.PI*(1.15+i*.08);const x=cxH+1.6*Math.cos(a),y=cyH-.4+2.0*Math.sin(a);cx.beginPath();cx.arc(x,y+ty,.42,0,Math.PI*1.4);cx.strokeStyle=hairD;cx.lineWidth=.12;cx.stroke();}
  };
  const baldRing=backView=>{
    if(backView)fillP(()=>{cx.moveTo(-2.5,-24.7+ty);cx.quadraticCurveTo(0,-25.5+ty,2.5,-24.7+ty);cx.lineTo(2.25,-23.4+ty);cx.quadraticCurveTo(0,-22.8+ty,-2.25,-23.4+ty);},shade(hair,.05),false);
    else fillP(()=>{cx.moveTo(-.55,-24.8+ty);cx.quadraticCurveTo(-1.4,-25.45+ty,-2.55,-25.0+ty);cx.quadraticCurveTo(-2.75,-23.8+ty,-1.4,-22.95+ty);cx.lineTo(-1.36,-24.15+ty);cx.quadraticCurveTo(-1.05,-24.7+ty,-.6,-24.6+ty);},shade(hair,.05),false);
    cx.globalAlpha=.5;for(let i=0;i<14;i++){const x=(backView?-2.2:-2.4)+(i%7)*(backView?.7:.28),y=-24.7+Math.floor(i/7)*.6+(i%3)*.12;dot(x,y,.08,hairD);}cx.globalAlpha=1;
    cx.fillStyle='rgba(255,255,255,.3)';cx.beginPath();cx.ellipse(backView?-.6:.2,-27.0+ty,1.1,.5,-.2,0,7);cx.fill();
  };
  const beard=()=>{
    const bc=hairM;
    fillP(()=>{cx.moveTo(-.48,-23.75+ty);cx.quadraticCurveTo(.15,-23.05+ty,1.0,-23.1+ty);cx.quadraticCurveTo(1.55,-23.3+ty,2.1,-23.4+ty);cx.lineTo(2.58,-23.38+ty);
      cx.quadraticCurveTo(2.74,-22.3+ty,2.2,-21.68+ty);cx.quadraticCurveTo(1.3,-21.0+ty,.2,-21.32+ty);cx.quadraticCurveTo(-1.0,-21.7+ty,-1.58,-22.6+ty);cx.quadraticCurveTo(-1.0,-22.95+ty,-.78,-23.25+ty);},bc);
    cx.globalAlpha=.55;[[.1,-23.25],[.45,-23.05],[.8,-23.0],[1.15,-23.1],[1.5,-23.25],[-.25,-23.45]].forEach(([x,y])=>dot(x,y-.12,.09,bc));cx.globalAlpha=1;
    cv(-.9,-22.35,.4,-21.55,1.9,-21.85,hairD,.16);cv(.2,-22.6,1.2,-22.0,2.1,-22.35,hairL,.15);cv(-.4,-22.95,.0,-22.3,.6,-22.05,hairD,.12);cv(1.0,-21.6,1.5,-21.7,2.05,-22.0,hairL,.12);
    cx.fillStyle='#A9574D';cx.beginPath();cx.ellipse(1.88,-22.72+ty,.32,.12,-.05,0,7);cx.fill();
    fillP(()=>{cx.moveTo(1.1,-23.0+ty);cx.quadraticCurveTo(1.85,-23.55+ty,2.62,-23.2+ty);cx.quadraticCurveTo(2.05,-22.85+ty,1.1,-23.0+ty);},shade(hair,-.22),false);
    cv(1.35,-23.12,1.85,-23.35,2.4,-23.2,hairL,.1);
  };

  /* ---------- Zeichnen ---------- */
  const l1=Math.max(0,sw)*1.1,l2=Math.max(0,-sw)*1.1;
  leg(-1.5,l1,!back);leg(1.5,l2,back);
  arm(-3.75,sw*.28,!back);
  if(!back&&st==='pony')ponytail(true);
  if(!back&&st==='bun')bun(true);
  drawTorso();
  arm(3.75,-sw*.28,back);
  cx.fillStyle=skinD;cx.fillRect(-1.0,-22.75+ty,1.95,1.25);cx.fillStyle=skinDD;cx.fillRect(-1.0,-22.75+ty,1.95,.3);
  if(back){
    [-1,1].forEach(s=>fillP(()=>{cx.ellipse(s*2.45,-24.4+ty,.5,.8,0,0,7);},skinD));
    fillP(headB,skin);
    if(st==='bald')baldRing(true);
    else if(st==='curly')curls(true);
    else{fillP(()=>{cx.moveTo(-2.62,-24.1+ty);cx.bezierCurveTo(-2.9,-28.4+ty,2.9,-28.4+ty,2.62,-24.1+ty);cx.quadraticCurveTo(2.35,-23.05+ty,1.2,-23.1+ty);cx.quadraticCurveTo(0,-23.3+ty,-1.2,-23.1+ty);cx.quadraticCurveTo(-2.35,-23.05+ty,-2.62,-24.1+ty);},hair);
      cv(-.3,-27.2,.8,-27.3,1.1,-26.6,hairD,.14);cv(-1.9,-25.6,-1.6,-27.2,-.2,-27.4,hairL,.3);cv(1.5,-23.6,2.2,-24.8,2.0,-26.4,hairD,.12);cv(-1.5,-23.6,-2.2,-24.8,-2.0,-26.4,hairD,.12);
      if(st==='pony')ponytail(false);if(st==='bun')bun(false);}
  }else{
    fillP(headF,skin);
    cx.save();cx.beginPath();headF();cx.closePath();cx.clip();
    cx.fillStyle=skinD;cx.beginPath();cx.ellipse(-1.6,-23.0+ty,1.4,1.3,0,0,7);cx.fill();
    cx.fillStyle='rgba(225,105,105,.22)';cx.beginPath();cx.ellipse(1.25,-23.45+ty,.6,.35,0,0,7);cx.fill();
    cx.restore();
    cv(.15,-25.55,1.3,-25.35,2.6,-25.5,skinD,.32);
    if(st==='bald')baldRing(false);
    else if(st==='curly')curls(false);
    else if(st==='pony'||st==='bun'){capLong();strandsLong();}
    else{capShort();strandsShort();}
    cx.fillStyle=skin;cx.beginPath();cx.ellipse(-.8,-24.05+ty,.42,.68,-.1,0,7);cx.fill();cx.strokeStyle='rgba(30,20,22,.35)';cx.lineWidth=.18;cx.stroke();
    cv(-.92,-24.4,-.62,-24.45,-.68,-23.8,skinDD,.12);
    const brow=st==='bald'?shade(hair,-.1):hairD;
    ln([[.32,-25.15+ty],[.75,-25.3+ty],[1.12,-25.22+ty]],brow,.26);ln([[1.72,-25.25+ty],[2.05,-25.32+ty],[2.32,-25.2+ty]],brow,.24);
    cx.fillStyle='#fff';cx.beginPath();cx.ellipse(.76,-24.5+ty,.34,.26,0,0,7);cx.fill();cx.beginPath();cx.ellipse(2.04,-24.5+ty,.26,.24,0,0,7);cx.fill();
    cx.fillStyle='#2A2226';cx.beginPath();cx.ellipse(.86,-24.48+ty,.2,.25,0,0,7);cx.fill();cx.beginPath();cx.ellipse(2.1,-24.48+ty,.16,.23,0,0,7);cx.fill();
    ln([[.42,-24.78+ty],[1.1,-24.8+ty]],'rgba(40,25,25,.55)',.1);
    fillP(()=>{cx.moveTo(2.45,-24.55+ty);cx.quadraticCurveTo(2.75,-24.1+ty,2.98,-23.72+ty);cx.quadraticCurveTo(2.75,-23.5+ty,2.45,-23.55+ty);},skin,false);
    ln([[2.47,-24.5+ty],[2.96,-23.74+ty],[2.62,-23.52+ty]],skinDD,.13);cx.fillStyle=skinD;cx.fillRect(2.1,-23.62+ty,.45,.18);
    if(st==='beard')beard();
    else{cv(1.42,-22.82,1.85,-22.62,2.28,-22.86,'#9C4A43',.2);cv(1.6,-22.55,1.85,-22.45,2.1,-22.55,skinD,.12);}
  }
  cx.restore();
}

/* Etagenwechsel über die Treppe */
function stairFor(f){if(f.goFl>f.fl){const st=STAIRS[f.fl];return{st,entry:st.bot,up:true};}const st=STAIRS[f.fl-1];return{st,entry:st.top,up:false};}
function goStairs(f){if(f.goFl==null||f.goFl===f.fl){f.goFl=null;return;}
  const {entry}=stairFor(f),cur=[Math.floor(f.x),Math.floor(f.y)];
  if(cur[0]===entry[0]&&cur[1]===entry[1]){climb(f);return;}
  f.path=path(f.fl,cur,entry);if(!f.path.length)f.goFl=null;}
function climb(f){const {st,up}=stairFor(f),yc=(st.y0+st.y1)/2;
  const pts=[[st.bot[0]+.5,st.bot[1]+.5,0],[st.xl,yc,0],[st.xh,yc,FH],[st.top[0]+.5,st.top[1]+.5,FH]];if(!up)pts.reverse();
  f.cl={st,pts,i:0};f.path=[];f.x=pts[0][0];f.y=pts[0][1];f.h=pts[0][2];}
function tickClimb(f,dt){const c=f.cl;let sp=(alarmMode?3.2:1.3)*dt;
  while(sp>0&&c.i<c.pts.length-1){const a=c.pts[c.i],b=c.pts[c.i+1];const dx=b[0]-f.x,dy=b[1]-f.y,d=Math.hypot(dx,dy);
    if(d>.001){f.dir=(dx-dy)>=0?1:-1;f.back=(dx+dy)<-.01;}
    if(d<=sp){f.x=b[0];f.y=b[1];f.h=b[2];sp-=d;c.i++;}
    else{f.x+=dx/d*sp;f.y+=dy/d*sp;const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1;f.h=a[2]+(b[2]-a[2])*(1-Math.hypot(b[0]-f.x,b[1]-f.y)/L);sp=0;}}
  const lo=c.st.lo;if(f.h<FH/2){f.fl=lo;f.z=f.h;}else{f.fl=lo+1;f.z=f.h-FH;}
  f.anim+=dt;
  if(c.i>=c.pts.length-1){f.cl=null;f.z=0;f.h=0;if(f.goFl===f.fl)f.goFl=null;if(f.goFl!=null)goStairs(f);else f.wait=.8+Math.random()*2.5;}}
function tickCrew(dt){
  crew.forEach(f=>{
    if(f.slide!=null){f.slide+=dt*2.2;if(f.slide>=1){f.slide=null;f.fl=0;f.x=POLE[0]+.5;f.y=POLE[1]+.5;f.drop=1;f.path=path(0,POLE,f.spot||[1,5]);}return;}
    if(f.drop){f.drop=Math.max(0,f.drop-dt*3);f.z=40*f.drop*f.drop;if(f.drop>0)return;f.z=0;}
    if(f.cl)tickClimb(f,dt);
    else if(f.path.length){const [ti,tj]=f.path[0];const tx=ti+.5,ty=tj+.5;const sp=(alarmMode?4.4:1.5)*dt;
      const dx=tx-f.x,dy=ty-f.y;const dist=Math.hypot(dx,dy);
      if(Math.abs(dx)>.01||Math.abs(dy)>.01){f.dir=(dx-dy)>=0?1:-1;f.back=(dx+dy)<-.01;}
      if(dist<=sp){f.x=tx;f.y=ty;f.path.shift();
        if(!f.path.length){
          if(alarmMode&&f.fl>0&&Math.floor(f.x)===POLE[0]&&Math.floor(f.y)===POLE[1]){f.slide=0;f.say=null;}
          else if(f.goFl!=null&&!alarmMode)goStairs(f);
          else f.wait=1.5+Math.random()*4;}}
      else{f.x+=dx/dist*sp;f.y+=dy/dist*sp;}
      f.anim+=dt;}
    else if(!alarmMode){f.wait-=dt;if(f.wait<=0){
      const cur=[Math.floor(f.x),Math.floor(f.y)];
      if((S.floors||1)>1&&Math.random()<.22){const to=randFloor();if(to!==f.fl){f.goFl=to;goStairs(f);}}
      if(!f.path.length&&!f.cl){f.goFl=null;const fr=freeF[f.fl];f.path=path(f.fl,cur,fr[Math.floor(Math.random()*fr.length)]);}
      if(!f.path.length&&!f.cl)f.wait=1;}}
    if(f.say){f.sayT-=dt;if(f.sayT<=0)f.say=null;}
  });
}
let nextTalk=3;
const bubbles=new Map();
function updateBubbles(){
  const hot=$('#hot');
  crew.forEach((f,i)=>{let el=bubbles.get(i);const show=f.say&&f.fl===VIEWFL&&f.slide==null&&flOpen(VIEWFL);
    if(show){if(!el){el=document.createElement('div');el.className='bubble';hot.appendChild(el);bubbles.set(i,el);}el.textContent=f.say;
      const p=P(f.x,f.y,33+(f.z||0));el.style.left=(p[0]/SC.W*100)+'%';el.style.top=(p[1]/SC.H*100)+'%';}
    else if(el){el.remove();bubbles.delete(i);}});
}

/* Zeichnen */
const dropT={};const sparks=[];
function tileCol(fl,i,j){const k=(i+j)%2;
  if(fl===0)return i<10?(k?'#B7BCC0':'#AFB4B9'):(k?'#D9DEE2':'#D1D7DB');
  if(fl===1){if(i<5&&j<4)return k?'#5E7FA3':'#58799C';if(i>=10&&j<6)return k?'#DADEE1':'#D2D7DB';if(i>=10)return k?'#C9C3B9':'#C1BBB1';return k?'#C99C6B':'#BF925F';}
  if(i<6&&j<4)return k?'#9285B4':'#8B7EAD';if(i>=6&&i<10&&j<4)return k?'#4E5A63':'#48545C';if(i>=10&&j<6)return k?'#CFE0E6':'#C6D8DF';if(i>=10)return k?'#C9C3B9':'#C1BBB1';return k?'#D6BA92':'#CDB089';}
function drawBackWalls(fl,locked){
  const W=SC.WALL,GX=SC.GX,GY=SC.GY;
  if(locked){poly([P(0,0,0),P(GX,0,0),P(GX,0,W),P(0,0,W)],'rgba(169,199,230,.25)','#A9C7E6');poly([P(0,0,0),P(0,GY,0),P(0,GY,W),P(0,0,W)],'rgba(169,199,230,.18)','#A9C7E6');return;}
  const back=fl===0?'#DCD3C4':fl===1?'#E9E1D3':'#E7E0EE',left=fl===0?'#ECE5D9':fl===1?'#F1EADF':'#EFE9F3';
  poly([P(0,0,0),P(GX,0,0),P(GX,0,W),P(0,0,W)],back);poly([P(0,0,0),P(0,GY,0),P(0,GY,W),P(0,0,W)],left);
  bandY(0,0,GX,0,2,'#8A7F70');bandX(0,0,GY,0,2,'#9C9182');
  const win=(y1,y2)=>{bandX(0,y1,y2,16,33,'#7A8A96');bandX(0,y1+.1,y2-.1,17,32,'#A9D3EE');bandX(0,(y1+y2)/2-.05,(y1+y2)/2+.05,17,32,'#7A8A96');};
  if(fl===0){
    bandY(0,10,GX,0,W,'#E3E7E9');
    [[.2,2.3],[2.65,4.75],[5.1,7.0],[7.7,9.5]].forEach(([a,b])=>{bandY(0,a-.1,b+.1,0,32,'#C8102E');bandY(0,a,b,0,30,'#9DA5AD');
      for(let z=2.5;z<30;z+=2.5)bandY(0,a,b,z,z+.4,'rgba(60,68,76,.35)');bandY(0,a+.7,b-.7,22,27,'#F4F6F8');});
    bandY(0,10.3,13.7,22,34,'#F4F6F8');bandY(0,10.5,13.5,30,32,'#2E7D4F');bandY(0,10.5,12,25,26,'#14202B');bandY(0,10.5,13,27.5,28.5,'#14202B');
    win(6,8.4);}
  if(fl===1){
    bandY(0,0,5,0,W,'#D8E2EA');bandY(0,.6,3.6,20,34,'#2B3A46');
    [[1,.3],[1.6,.6],[2.3,.4],[2.8,.7],[1.3,.8],[3.2,.5]].forEach(([x,f],k)=>bandY(0,x,x+.12,22+f*10,24+f*10,k%2?'#FF7B33':'#5CC8FF'));
    bandY(0,5.2,9.8,10,21,'#F2F1EC');for(let x=5.2;x<9.8;x+=.4)bandY(0,x,x+.02,10,21,'#D9D6CC');
    bandY(0,10,GX,0,W,'#E6E9EA');win(5.2,7.8);
    circ3=P(4.5,0,30);cx.fillStyle='#F4F1E8';cx.beginPath();cx.arc(circ3[0],circ3[1],2.6,0,7);cx.fill();cx.strokeStyle='#2B2B2B';cx.lineWidth=.4;cx.stroke();}
  if(fl===2){
    bandY(0,6,10,0,W,'#DCE6EC');bandY(0,6.3,9.7,6,32,'#CFE3EE');bandY(0,6.6,7.1,8,30,'rgba(255,255,255,.5)');
    bandY(0,10,GX,0,W,'#E1ECEF');bandY(0,1,2.4,18,30,'#7A8A96');bandY(0,1.1,2.3,19,29,'#A9D3EE');bandY(0,3.8,5.2,18,30,'#7A8A96');bandY(0,3.9,5.1,19,29,'#A9D3EE');win(5.2,7.8);}
  poly([P(-.3,-.3,W),P(GX,-.3,W),P(GX,0,W),P(0,0,W)],'#8A7F70');poly([P(-.3,-.3,W),P(0,0,W),P(0,GY,W),P(-.3,GY,W)],'#9C9182');
  poly([P(GX,-.3,0),P(GX,0,0),P(GX,0,W),P(GX,-.3,W)],'#6F6558');poly([P(-.3,GY,0),P(0,GY,0),P(0,GY,W),P(-.3,GY,W)],'#7D7366');
}
let circ3;
function drawFloor(fl,locked){
  for(let i=0;i<SC.GX;i++)for(let j=0;j<SC.GY;j++){const c=locked?((i+j)%2?'#2F5F8C':'#2B5885'):tileCol(fl,i,j);poly([P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)],c,locked?'rgba(169,199,230,.35)':'rgba(20,25,35,.06)');}
  if(locked)return;
  flat(0,0,SC.GX,.5,'rgba(20,25,35,.07)');flat(0,0,.5,SC.GY,'rgba(20,25,35,.07)');
  if(fl===0){[2.45,4.95,7.45].forEach(x=>flat(x,.2,x+.07,4.8,'#F3D23B'));flat(0,5.05,10,5.15,'#F3D23B');[[3.2,3.4],[6.2,2.8]].forEach(([x,y])=>circFlat(x,y,.3,'rgba(30,30,35,.18)'));}
  if(fl===1){flat(.8,6.2,3.4,9,'#9B4B4B');flat(.95,6.35,3.25,8.85,'#B55C55');}
  if(fl===2){flat(6.6,1.8,9.6,3.6,'#3A444C');}
}
function wallObjs(fl,locked){const out=[];const IW=12,T=.14;
  WALLS[fl].forEach(w=>{for(let s=w.a;s<w.b;s++){if(w.doors.some(([a,b])=>s>=a&&s<b)){continue;}
    if(w.v)out.push({k:w.c+s+1+.15-.6,bb:[w.c-T/2,s,w.c+T/2,s+1],h:IW+.6,f:()=>{if(locked){bandX(w.c,s,s+1,0,IW,'rgba(169,199,230,.45)');return;}B(w.c-T/2,s,0,T,1,IW,'#DDD6CA');B(w.c-T/2,s,IW,T,1,.6,'#8A7F70',false);}});
    else out.push({k:s+1+w.c+.15-.6,bb:[s,w.c-T/2,s+1,w.c+T/2],h:IW+.6,f:()=>{if(locked){bandY(w.c,s,s+1,0,IW,'rgba(169,199,230,.45)');return;}B(s,w.c-T/2,0,1,T,IW,'#DDD6CA');B(s,w.c-T/2,IW,1,T,.6,'#8A7F70',false);}});}});
  return out;}
function doorSills(fl){WALLS[fl].forEach(w=>w.doors.forEach(([a,b])=>{if(w.v)flat(w.c-.08,a,w.c+.08,b,'rgba(120,100,80,.35)');else flat(a,w.c-.08,b,w.c+.08,'rgba(120,100,80,.35)');}));}
function foot(g){poly([P(g.x-.1,g.y-.05),P(g.x+g.w+.22,g.y-.05),P(g.x+g.w+.22,g.y+g.d+.22),P(g.x-.1,g.y+g.d+.22)],'rgba(20,25,35,.13)');}
/* Zeichenreihenfolge: Objekte, die sich auf dem Bildschirm überlappen, werden über ihre Grundflächen
   geordnet (wer in x oder y komplett davor steht, wird später gezeichnet). Nur bei sich überschneidenden
   Grundflächen entscheidet der Schlüssel k. */
function depthSort(objs){const n=objs.length,E=.02;
  objs.forEach(o=>{const [x0,y0,x1,y1]=o.bb,h=o.h||12;o.sx0=(x0-y1)*10;o.sx1=(x1-y0)*10;o.sy0=(x0+y0)*5-h;o.sy1=(x1+y1)*5;o.nin=0;o.next=[];});
  for(let i=0;i<n;i++){const a=objs[i];for(let j=i+1;j<n;j++){const b=objs[j];
    if(a.sx1<=b.sx0||b.sx1<=a.sx0||a.sy1<=b.sy0||b.sy1<=a.sy0)continue;
    const ab=a.bb[2]<=b.bb[0]+E||a.bb[3]<=b.bb[1]+E,ba=b.bb[2]<=a.bb[0]+E||b.bb[3]<=a.bb[1]+E;
    const first=ab&&!ba?a:ba&&!ab?b:(a.k<=b.k?a:b),second=first===a?b:a;first.next.push(second);second.nin++;}}
  const out=[],rest=new Set(objs);let ready=objs.filter(o=>!o.nin);
  while(rest.size){let pick;
    if(ready.length){let m=0;for(let i=1;i<ready.length;i++)if(ready[i].k<ready[m].k)m=i;pick=ready.splice(m,1)[0];if(!rest.has(pick))continue;}
    else{for(const o of rest)if(!pick||o.k<pick.k)pick=o;}
    rest.delete(pick);out.push(pick);pick.next.forEach(o=>{if(--o.nin===0&&rest.has(o))ready.push(o);});}
  return out;}
let lastDraw=0;
function drawScene(now){
  const dt=Math.min(.05,Math.max(0,(now-(lastDraw||now))/1000));lastDraw=now;
  tNow=now;cx.setTransform(SCALE,0,0,SCALE,0,0);cx.clearRect(0,0,SC.W,SC.H);
  const fl=VIEWFL,locked=!flOpen(fl);
  drawBackWalls(fl,locked);
  if(!locked)ITEMS.filter(it=>it.fl===fl&&ITEMGEO[it.id].wall).forEach(it=>{if(!has(it.id))cx.globalAlpha=.24;ITEMGEO[it.id].wall(ITEMGEO[it.id]);cx.globalAlpha=1;});
  drawFloor(fl,locked);
  const objs=wallObjs(fl,locked);
  if(!locked){
    doorSills(fl);DECOR[fl].forEach(g=>{if(g.floor)g.floor();});
    ITEMS.filter(it=>it.fl===fl).forEach(it=>{const g=ITEMGEO[it.id];if(has(it.id)&&!dropT[it.id])foot(g);});
    DECOR[fl].forEach(g=>{if(!g.floor&&!g.nofoot)foot(g);});
    ITEMS.filter(it=>it.fl===fl).forEach(it=>{const g=ITEMGEO[it.id];objs.push({k:g.x+g.y+g.w+g.d-.6,bb:[g.x,g.y,g.x+g.w,g.y+g.d],h:g.h+(dropT[it.id]?46:0),f:()=>{
      const built=has(it.id);let z=0;
      if(built&&dropT[it.id]){const k=Math.min(1,(now-dropT[it.id])/550);z=46*Math.pow(1-k,2);if(k>=1)delete dropT[it.id];}
      if(!built)cx.globalAlpha=.24;g.draw(g,z);cx.globalAlpha=1;}});});
    DECOR[fl].forEach(g=>{if(!g.floor)objs.push({k:g.x+g.y+g.w+g.d-.6,bb:[g.x,g.y,g.x+g.w,g.y+g.d],h:g.h||12,f:()=>g.draw(g)});});
    crew.forEach(f=>{if(f.fl!==fl)return;let k=f.x+f.y,clip=null;
      if(f.cl){if(f.fl===f.cl.st.lo)k=stK(f.cl.st)+.01;else if(f.z<0)clip=()=>holeClip(f.cl.st);}
      if(f.slide!=null)clip=poleClip;
      objs.push({k,bb:[f.x-.22,f.y-.22,f.x+.22,f.y+.22],h:38,f:()=>{
        if(clip){cx.save();clip();cx.clip();}
        if(f.slide!=null){f.z=-40*f.slide*f.slide;sprite(f);f.z=0;}else sprite(f);
        if(clip)cx.restore();}});});
  }
  depthSort(objs).forEach(o=>o.f());
  if(!locked&&fl===1&&has('kaffee')&&!REDUCED){const g=ITEMGEO.kaffee;const t=now/1000;for(let s=0;s<3;s++){const ph=(t*0.8+s/3)%1;const p=P(g.x+.38,g.y+.32,16+ph*12);
    cx.fillStyle=`rgba(255,255,255,${.6*(1-ph)})`;cx.beginPath();cx.arc(p[0]+Math.sin(t*3+s)*1.5,p[1],1+ph*1.2,0,7);cx.fill();}}
  if(REDUCED)sparks.length=0;
  const st=dt*60;
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.l-=dt;if(s.l<=0){sparks.splice(i,1);continue;}s.x+=s.vx*st;s.y+=s.vy*st;s.vy+=.05*st;
    cx.fillStyle=s.c;cx.globalAlpha=Math.min(1,s.l*3);cx.beginPath();cx.arc(s.x,s.y,.9,0,7);cx.fill();cx.globalAlpha=1;}
  {const g=cx.createLinearGradient(0,0,SC.W,SC.H);g.addColorStop(0,'rgba(255,240,210,.10)');g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.fillRect(0,0,SC.W,SC.H);}
  if(alarmMode){const ph=(Math.sin(now/1000*Math.PI*2*1.6)+1)/2;cx.fillStyle=`rgba(${Math.round(226*(1-ph)+61*ph)},${Math.round(35*(1-ph)+123*ph)},${Math.round(26*(1-ph)+255*ph)},${.07+.05*ph})`;cx.fillRect(0,0,SC.W,SC.H);}
}
function burst(id){const g=ITEMGEO[id];const p=P(g.x+g.w/2,g.y+g.d/2,g.h);
  for(let i=0;i<26;i++)sparks.push({x:p[0],y:p[1],vx:(Math.random()-.5)*2.4,vy:-Math.random()*2.2,l:.6+Math.random()*.5,c:['#F3D23B','#FF7B33','#FFFFFF','#5CC8FF'][i%4]});}

/* Geschoss-Auswahl */
function setView(fl){VIEWFL=fl;try{localStorage.setItem('wachenalarm.fl',fl);}catch(e){}S.sel=null;renderWache();if(REDUCED)drawScene(performance.now());}
function renderFloors(){const box=$('#floors');if(!box)return;
  box.innerHTML=[2,1,0].map(fl=>{const F=FLOORS[fl];const open=flOpen(fl);const n=crew.filter(f=>f.fl===fl).length;
    return `<button type="button" class="flbtn${fl===VIEWFL?' on':''}${open?'':' locked'}" data-fl="${fl}" aria-pressed="${fl===VIEWFL}"><span class="flshort">${F.short}</span><span class="flname">${F.name}</span><span class="flmeta">${open?`${ic('user')}${n}`:`${ic('lock')}${F.cost}`}</span></button>`;}).join('');
  box.querySelectorAll('.flbtn').forEach(b=>b.onclick=()=>setView(+b.dataset.fl));}
function unlockFloor(fl){const F=FLOORS[fl];if(flOpen(fl)||fl!==(S.floors||1)||S.coins<F.cost)return;
  S.coins-=F.cost;S.floors=fl+1;save();
  for(let i=0;i<14;i++){const p=P(2+Math.random()*10,1+Math.random()*7,10);sparks.push({x:p[0],y:p[1],vx:(Math.random()-.5)*2,vy:-Math.random()*2.4,l:.8,c:['#F3D23B','#FF7B33','#FFFFFF','#5CC8FF'][i%4]});}
  syncCrew(true);const f=crew.find(c=>c.fl===0);if(f){f.goFl=fl;goStairs(f);f.say='Ab nach oben!';f.sayT=2.4;}
  renderHUD();renderWache();chime([523,659,784,1047,1319],.1);buzz([20,40,20,40,60]);toast(`${F.short} ausgebaut!`);}

/* Hotspots */
function renderHot(){
  const hot=$('#hot');hot.querySelectorAll('.hs,.rlabel,.lockcard').forEach(e=>e.remove());
  const fl=VIEWFL;
  if(!flOpen(fl)){const F=FLOORS[fl];const next=fl===(S.floors||1);const card=document.createElement('div');card.className='lockcard';
    card.innerHTML=`<span class="label">${F.short} · noch im Rohbau</span><strong>${F.name}</strong><span>${F.desc}</span>${next?`<button type="button" class="btn acc" id="unlockfl" ${S.coins<F.cost?'disabled':''}>Ausbauen · ${F.cost} Münzen</button>${S.coins<F.cost?`<span class="small">Noch ${F.cost-S.coins} Münzen</span>`:''}`:`<span class="small">Erst ${FLOORS[fl-1].short} ausbauen</span>`}`;
    hot.appendChild(card);const ub=$('#unlockfl');if(ub)ub.onclick=()=>unlockFloor(fl);return;}
  ZONES[fl].forEach(z=>{const p=P(z.x,z.y,z.z);const el=document.createElement('span');el.className='rlabel';el.textContent=z.name;
    el.style.left=(p[0]/SC.W*100)+'%';el.style.top=(p[1]/SC.H*100)+'%';hot.appendChild(el);});
  ITEMS.filter(it=>it.fl===fl).forEach(it=>{const g=ITEMGEO[it.id];const pts=[];
    for(const x of[g.x,g.x+g.w])for(const y of[g.y,g.y+g.d])for(const z of[0,g.h])pts.push(P(x,y,z));
    const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);const l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...ys),b=Math.max(...ys);
    const built=has(it.id),afford=!built&&S.coins>=it.cost;
    const bt=document.createElement('button');bt.className='hs'+(afford?' afford':'')+(S.sel===it.id?' sel':'');
    bt.setAttribute('aria-label',`${it.name.replace(/­/g,'')}${built?' (gebaut)':`, ${it.cost} Münzen`}`);
    Object.assign(bt.style,{left:(l/SC.W*100)+'%',top:(t/SC.H*100)+'%',width:((r-l)/SC.W*100)+'%',height:((b-t)/SC.H*100)+'%'});
    if(!built&&(afford||S.sel===it.id))bt.innerHTML=`<span class="price">${ic('coin')}${it.cost}</span>`;
    bt.onclick=()=>{S.sel=it.id;renderWache();};
    hot.appendChild(bt);});
}
function renderWache(){
  renderHot();syncCrew(false);
  const avail=ITEMS.filter(i=>flOpen(i.fl));
  $('#buildcount').textContent=`${S.owned.length} / ${ITEMS.length} gebaut · ${S.floors||1} von 3 Etagen`;
  const d=$('#detail');const it=ITEMS.find(i=>i.id===S.sel);
  if(!it){
    const nextIt=avail.filter(i=>!has(i.id)).sort((a,b)=>a.cost-b.cost)[0];const nf=(S.floors||1)<3?FLOORS[S.floors||1]:null;
    const cand=[nextIt&&{n:nextIt.name.replace(/­/g,''),c:nextIt.cost,fl:nextIt.fl},nf&&{n:nf.short+' ausbauen',c:nf.cost,fl:S.floors||1}].filter(Boolean).sort((a,b)=>a.c-b.c)[0];
    d.innerHTML=cand?`<svg class="i" style="color:var(--gold)"><use href="#i-coin"/></svg><div class="txt"><h3>Nächstes Ziel: ${cand.n}</h3><p>${S.coins>=cand.c?`Genug Münzen! ${cand.fl!==VIEWFL?`Wechsle zu ${FLOORS[cand.fl].short} und tippe`:'Tippe in der Wache'} auf den blassen Platz.`:`Noch ${cand.c-S.coins} Münzen, etwa ${Math.ceil((cand.c-S.coins)/80)} Einsatz${Math.ceil((cand.c-S.coins)/80)>1?'e':''}.`}</p></div>`:`<div class="txt"><h3>Wache komplett ausgebaut</h3><p>Stark. Alle drei Etagen stehen.</p></div>`;
    return;}
  const built=has(it.id);
  d.innerHTML=`<svg class="i" style="color:var(--accent);width:30px;height:30px"><use href="#i-${it.icon}"/></svg>
    <div class="txt"><h3>${it.name.replace(/­/g,'')}</h3><p>${it.perk}</p></div>
    ${built?'<span class="label" style="color:var(--ok)">Gebaut</span>':`<button class="btn acc" id="buy" ${S.coins<it.cost?'disabled':''}>Bauen · ${it.cost}</button>`}`;
  const bb=$('#buy');if(bb)bb.onclick=()=>buy(it);
}
const maxFz=()=>has('betten')?4:3;
function buy(it){
  if(S.coins<it.cost||has(it.id)||!flOpen(it.fl))return;
  S.coins-=it.cost;S.owned.push(it.id);
  if(it.id==='kaffee'||it.id==='spinde')S.freezes=Math.min(maxFz(),S.freezes+1);
  save();if(!REDUCED){dropT[it.id]=performance.now();setTimeout(()=>burst(it.id),520);}
  renderHUD();renderWache();syncCrew(true);
  const here=crew.filter(c=>c.fl===VIEWFL);const f=here[Math.floor(Math.random()*here.length)];if(f){f.say='Wie geil, neu!';f.sayT=2.4;}
  chime([660,880,1320]);buzz([20,40,20]);
  toast(`${it.name.replace(/­/g,'')} gebaut!`);
  if(REDUCED)drawScene(performance.now());
}

/* Schleife */
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastT=performance.now();
function loop(now){
  const dt=Math.min(.05,(now-lastT)/1000);lastT=now;
  const visible=!document.hidden&&!$('#home').hidden&&$('#mission').hidden&&$('#debrief').hidden&&$('#cardview').hidden&&$('#editor').hidden&&$('#wview').hidden;
  if(visible){
    tickCrew(dt);
    nextTalk-=dt;if(nextTalk<=0&&crew.length&&!alarmMode){const f=crew[Math.floor(Math.random()*crew.length)];const L=lines();f.say=L[Math.floor(Math.random()*L.length)];f.sayT=2.4;nextTalk=4+Math.random()*4;}
    drawScene(now);updateBubbles();
  }
  requestAnimationFrame(loop);
}

/* ---------- Sound & Haptik ---------- */
let AC=null;
function chime(freqs,dur=.12,type='sine'){
  if(!S.sound)return;
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    freqs.forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;
      const t=AC.currentTime+i*dur;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.18,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur*1.6);
      o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur*1.7);});
  }catch(e){}
}
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
function toast(t){const el=document.createElement('div');el.className='toast';el.textContent=t;document.body.appendChild(el);setTimeout(()=>el.remove(),2200);}
function pop(t){const el=document.createElement('div');el.className='pop';el.textContent=t;document.body.appendChild(el);setTimeout(()=>el.remove(),1000);}

/* ---------- Alarm ---------- */
function pickCase(){
  const all=playable();if(!all.length)return null;
  const L=levelInfo(S.xp).lvl;let pool=all.filter(c=>c.minLevel<=L);if(!pool.length)pool=all.slice().sort((a,b)=>a.minLevel-b.minLevel).slice(0,1);
  const fresh=pool.filter(c=>!S.plays[c.id]);
  const list=fresh.length?fresh:pool.sort((a,b)=>(S.plays[a.id]||0)-(S.plays[b.id]||0)).slice(0,2);
  return list[Math.floor(Math.random()*list.length)];
}
let M=null;
$('#go').onclick=()=>{
  if(alarmMode)return;
  const cs=pickCase();if(!cs){toast(dbState==='ready'?'Noch keine aktiven Fälle. Lege im Tab Fälle einen an.':'Fallbibliothek noch nicht geladen');return;}M={cs};
  chime([523,659,523,659],.18,'square');buzz([200,100,200]);
  if(REDUCED){showAlarm(cs);return;}
  alarmMode=true;document.getElementById('scene').scrollIntoView({behavior:'smooth',block:'center'});
  const spots=[[1,5],[2,5],[0,5],[1,6],[2,6],[0,6],[3,5],[3,6],[1,7]];let up=0;
  crew.forEach((f,i)=>{f.say=i===0?'Alarm!':null;f.sayT=1.4;f.spot=spots[i%spots.length];f.goFl=null;f.cl=null;f.h=0;f.slide=null;f.drop=0;f.z=0;
    const cur=[Math.floor(f.x),Math.floor(f.y)];
    if(f.fl===0)f.path=path(0,cur,f.spot);
    else{up++;f.path=path(f.fl,cur,POLE);if(!f.path.length)f.slide=0;}});
  if(!flOpen(VIEWFL))setView(0);
  if(up&&VIEWFL!==0)setTimeout(()=>{if(alarmMode)setView(0);},1150);
  setTimeout(()=>{alarmMode=false;crew.forEach(f=>{f.path=[];f.cl=null;f.slide=null;if(f.fl!==0){f.fl=0;const sp=f.spot||[1,5];f.x=sp[0]+.5;f.y=sp[1]+.5;}f.drop=0;f.z=0;});showAlarm(cs);},up?3000:1700);
};
function showAlarm(cs){
  $('#a-stw').textContent=cs.stw;$('#a-pat').textContent=cs.pat;
  const now=new Date();$('#a-meta').textContent=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} · ${cs.region==='sh'?'SH':'SAA/BPR'}`;
  $('#alarm').hidden=false;
  chime([523,659,523,659],.18,'square');buzz([200,100,200]);
}
$('#ausruecken').onclick=()=>{$('#alarm').hidden=true;const pr=M.probe;startMission(M.cs);M.probe=pr;};

/* ---------- Einsatz ---------- */
const fmtT=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
function startMission(cs){
  M={cs,pi:0,gross:0,grossList:[],ended:null,mistakes:0,missed:0,xp:0,coins:0,v:{...cs.v},rev:new Set(),rhythm:cs.rhythm,t:0,done:{},order:[],q:null,qDone:new Set(),answers:[],warned:-1,lastMissed:[],missedAll:[],probe:false};
  $('#m-title').textContent=cs.stw||'Einsatz';$('#m-pat').textContent=cs.pat;
  const sit=$('#m-sit');sit.textContent=cs.situation||'';sit.hidden=!cs.situation;
  const reg=$('#m-reg');reg.innerHTML=cs.regional?`<b>⚑ ${cs.region==='sh'?'SH':'Regional'}</b><span>${esc(cs.regional)}</span>`:'';reg.hidden=true;
  $('#mission').hidden=false;$('#mission').scrollTop=0;
  renderVitals(true);renderPhase();startECG();
}
function renderPhases(){
  $('#phases').innerHTML=PH.map((p,k)=>`<div class="ph ${k<M.pi?'done':k===M.pi?'now':''}">${p}</div>`).join('');
}
const curP=()=>M.cs.phases[M.pi];
function logItem(d){
  return `<li class="t-${d.typ}"><div class="lt"><strong>${esc(d.text)}</strong><span class="badges">${d.sh?'<span class="badge b-sh">SH</span>':''}${d.reg?'<span class="badge b-reg">Regional</span>':''}<span class="badge b-${d.typ}">${d.typ==='falsch'?'Nicht sinnvoll':d.typ==='gefahr'?'Gefährlich':d.typ==='neutral'?esc(d.nl||'Vertretbar'):TYPN[d.typ]}</span></span></div>${d.res?`<p class="lr">${esc(d.res)}</p>`:''}</li>`;
}
function actBtn(a){const d=M.done[M.pi+':'+a.id];
  return `<button type="button" class="act${a.med?' med':''}${d?' did t-'+d.typ:''}" data-aid="${esc(a.id)}" ${d||M.q?'disabled':''}>${d?ic(BADT.includes(d.typ)?'x':'check'):''}<span>${esc(a.text)}</span>${a.reg&&!a.med?'<span class="flag" title="Regional unterschiedlich geregelt">⚑</span>':''}</button>`;}
function renderPhase(){
  renderPhases();
  const P=curP();const q=$('#qcard');
  const doneHere=M.order.filter(d=>d.pi===M.pi);
  const next=M.pi<PH.length-1?PH[M.pi+1]:null;
  q.innerHTML=`<div class="qhead"><span class="big">${P.ph}</span><div><div class="pn">${PHN[P.ph]} · Phase ${M.pi+1} von 6</div><h2>${PHQ[P.ph]}</h2></div></div>
   ${M.lastMissed.length?`<div class="fb no slim"><div><strong>In ${M.lastMissed[0].ph} ${M.lastMissed.length===1?'eine wichtige Maßnahme':M.lastMissed.length+' wichtige Maßnahmen'} verpasst</strong>Welche, siehst du in der Auswertung.</div></div>`:''}
   ${P.eindruck?`<div class="eindruck"><span class="ik">Erster Eindruck</span>${esc(P.eindruck)}</div>`:''}
   ${doneHere.length?`<ol class="alog">${doneHere.map(logItem).join('')}</ol>`:'<p class="hint">Wähle, was du machst. Ergebnisse siehst du erst nach der Maßnahme, Begründungen in der Auswertung.</p>'}
   <div id="qslot"></div>
   <div class="agrid">${P.actions.filter(a=>!a.med||!a.mittel.length).map(actBtn).join('')}</div>
   ${(M.cs.role||ROLE)==='ns'?`<div class="agroup"><span class="sub">Medikamente nach ${M.cs.region==='sh'?'SH-Handlungsempfehlungen':'SAA'} <span class="badge b-ns">NotSan</span></span><div id="medslot">${medHTML()}</div></div>`:''}
   <div id="leaveslot"></div>
   ${M.q?'':`<button type="button" class="btn acc next" id="leave">${next?`WEITER ZU ${next}`:'EINSATZ ABSCHLIESSEN'}</button>`}`;
  q.querySelectorAll('.act[data-aid]').forEach(b=>b.onclick=()=>doAction(P.actions.find(a=>a.id===b.dataset.aid)));bindMed();
  if(M.q)renderQuestion();
  const lv=$('#leave');if(lv)lv.onclick=leavePhase;
}
function doAction(a,tpi){
  if(!a||M.q||M.ended)return;const kpi=tpi===undefined?M.pi:tpi;const key=kpi+':'+a.id;if(M.done[key])return;
  M.t+=a.t||20;let res='';
  if(a.typ==='abbruch'){M.done[key]={pi:M.pi,id:a.id,text:a.text,typ:a.typ,res:'',why:a.warum,reg:a.reg,sh:a.sh};M.order.push(M.done[key]);return endMission({titel:a.text,text:a.warum,art:'massnahme'});}
  if(a.typ==='gefahr'){const d={pi:M.pi,id:a.id,text:a.text,typ:a.typ,res:'',why:a.warum,reg:a.reg,sh:a.sh};M.done[key]=d;M.order.push(d);M.gross++;M.grossList.push(d);
    if(a.fx){const {rhythm,...rest}=a.fx;Object.assign(M.v,rest);if(rhythm)M.rhythm=rhythm;}
    renderVitals();renderPhase();showStop(a.text,a.warum,!!a.fx);return;}
  if(!BADT.includes(a.typ)){
    res=a.ergebnis||defaultResult(a.id,M.v,M.rhythm);
    if(a.fx){const {rhythm,...rest}=a.fx;Object.assign(M.v,rest);if(rhythm)M.rhythm=rhythm;}
    (a.zeigt||[]).forEach(k=>M.rev.add(k));
  }
  const d={pi:M.pi,id:a.id,text:a.text,typ:a.typ,res,why:a.typ==='neutral'?'':a.warum,reg:a.reg,sh:a.sh,nl:a.nl};M.done[key]=d;M.order.push(d);
  if(a.typ==='pflicht'){M.xp+=15;M.coins+=6;pop('+15 XP');chime([784,1047]);buzz(25);}
  else if(a.typ==='sinnvoll'){M.xp+=5;M.coins+=2;pop('+5 XP');chime([660,880],.08);}
  else if(a.typ==='falsch'){M.mistakes++;M.v.hf=Math.min(150,M.v.hf+3);chime([220],.18,'sawtooth');buzz([60,40,60]);}
  else chime([520],.06);
  const fq=kpi===M.pi?curP().fragen.find(f=>f.nach===a.id&&!M.qDone.has(f)):null;
  if(fq)M.q={f:fq,first:true,opts:shuffle(fq.opts)};
  renderVitals();renderPhase();
  const items=document.querySelectorAll('#qcard .alog li');const tgt=M.q?$('#qslot'):items[items.length-1];if(tgt)tgt.scrollIntoView({behavior:'smooth',block:'center'});
}
function renderQuestion(){
  const {f,opts}=M.q;
  $('#qslot').innerHTML=`<div class="qbox"><span class="ik">Entscheidung ${f.rolle==='ns'?'<span class="badge b-ns">NotSan</span>':''}${f.sh?'<span class="badge b-sh">SH</span>':''}${f.reg?'<span class="badge b-reg">Regional</span>':''}</span><h3>${esc(f.q)}</h3>${f.finds&&f.finds.length?`<div class="finds">${f.finds.map(x=>`<span class="find">${esc(x)}</span>`).join('')}</div>`:''}
   <div class="opts">${opts.map((o,k)=>`<button type="button" class="opt" data-k="${k}">${esc(o.t)}</button>`).join('')}</div><div id="fbslot"></div></div>`;
  $('#qslot').querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(opts[+b.dataset.k],b));
}
function answer(o,btn){
  const fb=$('#fbslot');
  if(o.ok){
    btn.classList.add('right');document.querySelectorAll('#qslot .opt').forEach(b=>{b.disabled=true;if(b!==btn)b.classList.add('faded');});
    const xp=M.q.first?20:5;M.xp+=xp;M.coins+=M.q.first?10:3;pop(`+${xp} XP`);chime(M.q.first?[784,1047]:[660]);buzz(25);
    M.qDone.add(M.q.f);M.answers.push({pi:M.pi,q:M.q.f.q,first:M.q.first});
    fb.innerHTML=`<div class="fb ok">${ic('check')}<div><strong>${M.q.first?'Richtig!':'Jetzt passt es.'}</strong>${esc(o.why)}</div></div><button type="button" class="btn acc next" id="qnext" style="margin-top:10px">WEITER</button>`;
    $('#qnext').onclick=()=>{const end=M.q.end;M.q=null;if(end)leavePhase();else renderPhase();};
    $('#qnext').focus({preventScroll:true});
  }else{
    btn.classList.add('wrong');btn.disabled=true;M.q.first=false;
    if(o.sev==='abbruch'){M.order.push({pi:M.pi,id:'q',text:o.t,typ:'abbruch',res:'',why:o.why});return endMission({titel:o.t,text:o.why,art:'entscheidung',frage:M.q.f.q});}
    if(o.sev==='gefahr'){M.gross++;M.grossList.push({text:o.t,why:o.why,typ:'gefahr'});M.v.hf=Math.min(160,M.v.hf+6);renderVitals();showStop(o.t,o.why,false,true);}
    else{M.mistakes++;M.v.hf=Math.min(150,M.v.hf+2);renderVitals();chime([220],.18,'sawtooth');buzz([60,40,60]);}
    fb.innerHTML=`<div class="fb no">${ic('x')}<div><strong>${o.sev==='gefahr'?'Gefährlich':'Nicht ganz'}</strong>${esc(o.why)}</div></div>`;
  }
}
function leavePhase(){
  const P=curP();const next=M.pi<PH.length-1?PH[M.pi+1]:null;
  const fq=P.fragen.find(f=>!f.nach&&!M.qDone.has(f));
  if(fq){M.q={f:fq,first:true,opts:shuffle(fq.opts),end:true};renderPhase();$('#qslot').scrollIntoView({behavior:'smooth',block:'center'});return;}
  const missed=P.actions.filter(a=>a.typ==='pflicht'&&!M.done[M.pi+':'+a.id]);
  const vitalMiss=missed.filter(a=>a.vital);
  if(missed.length&&M.warned!==M.pi){M.warned=M.pi;
    $('#leaveslot').innerHTML=vitalMiss.length?`<div class="fb no"><div><strong>Achtung: Hier fehlt etwas Lebenswichtiges</strong>Ohne diese Maßnahme wird der Patient den Einsatz nicht überstehen. ${missed.length>1?`Insgesamt fehlen ${missed.length} wichtige Maßnahmen.`:''}</div></div>`:`<div class="fb warn"><div><strong>Noch nicht vollständig</strong>In dieser Phase ${missed.length===1?'fehlt noch eine wichtige Maßnahme':`fehlen noch ${missed.length} wichtige Maßnahmen`}. Du kannst sie jetzt noch durchführen.</div></div>`;
    $('#leave').textContent=next?`TROTZDEM WEITER ZU ${next}`:'TROTZDEM ABSCHLIESSEN';
    $('#leaveslot').scrollIntoView({behavior:'smooth',block:'center'});chime([440,330],.12);return;}
  M.lastMissed=missed.map(a=>({ph:P.ph,a}));M.missedAll.push(...M.lastMissed);M.missed+=missed.length;
  if(vitalMiss.length)return endMission({titel:vitalMiss.map(a=>a.text).join(', '),text:vitalMiss.map(a=>a.warum).filter(Boolean).join(' '),art:'verpasst'});
  if(missed.length){M.v.hf=Math.min(150,M.v.hf+2*missed.length);}
  M.q=null;M.med=null;M.pi++;
  if(M.pi>=M.cs.phases.length){finish();return;}
  renderVitals();renderPhase();$('#mission').scrollTop=0;
}

function showStop(titel,warum,folge,zeigen){
  chime([880,660,880,660],.14,'square');buzz([120,60,120,60,200]);
  const el=$('#crit');el.className='crit stop';
  el.innerHTML=`<div class="critbox" role="alertdialog" aria-labelledby="crit-h"><div class="critband">STOPP</div><h2 id="crit-h">Das wäre kontraproduktiv</h2><p class="critact">${esc(titel)}</p>${zeigen&&warum?`<p>${esc(warum)}</p>`:'<p class="critnote">Warum, erfährst du in der Auswertung.</p>'}${folge?'<p class="critnote">Der Zustand des Patienten hat sich verschlechtert.</p>':''}<p class="critnote">Zählt als grober Fehler.</p><button type="button" class="btn acc next" id="crit-ok">VERSTANDEN</button></div>`;
  el.hidden=false;$('#crit-ok').focus();$('#crit-ok').onclick=()=>{el.hidden=true;};
}
function endMission(r){
  M.ended=r;M.q=null;
  M.v.hf=r.art==='verpasst'?Math.max(30,M.v.hf-50):Math.min(170,M.v.hf+30);M.v.spo2=Math.max(70,M.v.spo2-12);M.v.sys=Math.max(60,M.v.sys-50);M.v.dia=Math.max(30,M.v.dia-30);
  ['hf','spo2','rr'].forEach(k=>M.rev.add(k));renderVitals();
  chime([440,415,392,370,349],.22,'sawtooth');buzz([300,100,300,100,600]);
  const head=r.art==='verpasst'?'Lebenswichtige Maßnahme fehlte':r.art==='entscheidung'?'Folgenschwere Entscheidung':'Grober Fehler';
  const el=$('#crit');el.className='crit end';
  el.innerHTML=`<div class="critbox" role="alertdialog" aria-labelledby="crit-h"><div class="critband">EINSATZ BEENDET</div><h2 id="crit-h">${head}</h2>${r.frage?`<p class="critq">${esc(r.frage)}</p>`:''}<p class="critact">${esc(r.titel)}</p>${r.text?`<p>${esc(r.text)}</p>`:''}<p class="critnote">Der Patient ist zu Schaden gekommen. Schau dir in der Auswertung an, was richtig gewesen wäre.</p><button type="button" class="btn acc next" id="crit-ok">ZUR AUSWERTUNG</button></div>`;
  el.hidden=false;$('#crit-ok').focus();$('#crit-ok').onclick=()=>{el.hidden=true;finishAbort();};
}
function finishAbort(){
  stopECG();const cs=M.cs;const r=M.ended;
  if(!M.probe){S.plays[cs.id]=(S.plays[cs.id]||0)+1;save();}
  $('#debriefinner').innerHTML=`<div class="result aborted"><span class="label">Einsatz abgebrochen · ${esc(cs.stw)} · Diagnose: ${esc(cs.title)}</span><h1>Einsatz beendet</h1>
    <div class="abortbox"><span class="ik">Grund</span><strong>${esc(r.titel)}</strong>${r.text?`<p>${esc(r.text)}</p>`:''}</div>
    <p class="hint">${M.probe?'Probefahrt · wird nicht gewertet.':'Keine XP und Münzen für diesen Einsatz. Deine Serie bleibt erhalten.'}</p></div>
   ${loesungHTML(cs,M)}
   <button class="btn acc next" id="retry">FALL NOCHMAL FAHREN</button>
   <button class="btn ghost" id="tohome">${M.probe?'Zurück zum Editor':'Zur Wache'}</button>`;
  $('#mission').hidden=true;$('#debrief').hidden=false;$('#debrief').scrollTop=0;
  const probe=M.probe;
  $('#retry').onclick=()=>{$('#debrief').hidden=true;M={cs,probe};showAlarm(cs);};
  $('#tohome').onclick=()=>{$('#debrief').hidden=true;if(probe&&ED)$('#editor').hidden=false;else showView('home');};
}
const tw={};
function renderVitals(instant){
  const v=M.v,r=M.rev;
  const set=(id,show,val,alarm)=>{const el=$(id);
    if(!show){el.textContent='--';el.classList.remove('alarm');el.parentElement.classList.add('off');tw[id]=undefined;return;}
    el.parentElement.classList.remove('off');el.classList.toggle('alarm',!!alarm);
    if(instant||REDUCED||tw[id]===undefined){el.textContent=val;tw[id]=val;return;}
    const from=tw[id];const t0=performance.now();
    const step=n=>{const k=Math.min(1,(n-t0)/800);el.textContent=Math.round(from+(val-from)*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step);else tw[id]=val;};
    requestAnimationFrame(step);};
  set('#v-hf',r.has('hf')||r.has('ekg'),v.hf,v.hf>110||v.hf<50);
  set('#v-spo2',r.has('spo2'),v.spo2,v.spo2<90);
  set('#v-af',r.has('af'),v.af,v.af>24||v.af<8);
  const rr=$('#v-rr');if(r.has('rr')){rr.textContent=`${v.sys}/${v.dia}`;rr.classList.toggle('alarm',v.sys>180||v.sys<90);rr.parentElement.classList.remove('off');}else{rr.textContent='--/--';rr.classList.remove('alarm');rr.parentElement.classList.add('off');}
  $('#v-gcs').textContent=r.has('gcs')?v.gcs:'?';
  $('#v-bz').textContent=r.has('bz')?v.bz:'?';
  $('#v-temp').textContent=r.has('temp')?fmtNum(v.temp):'?';
  $('#ecglabel').textContent=!r.has('ekg')?'KEIN EKG ANGELEGT':M.rhythm==='stemi'?'12-KANAL · ABL. II':'EKG II · 25 mm/s';
  $('#clock').textContent='EINSATZZEIT '+fmtT(M.t);
}
$('#abort').onclick=()=>{
  const q=$('#qcard');if(q.querySelector('#confirmAbort'))return;
  const box=document.createElement('div');box.className='fb no';box.id='confirmAbort';
  box.innerHTML=`<div style="flex:1"><strong>Einsatz abbrechen?</strong>Der Fortschritt dieses Einsatzes geht verloren.<div style="display:flex;gap:8px;margin-top:10px"><button class="btn" id="ab-yes">Abbrechen</button><button class="btn ghost" id="ab-no">Weiterfahren</button></div></div>`;
  q.prepend(box);$('#mission').scrollTop=0;
  $('#ab-yes').onclick=()=>{stopECG();$('#mission').hidden=true;if(M.probe&&ED){$('#editor').hidden=false;}else renderAll();};
  $('#ab-no').onclick=()=>box.remove();
};

/* ---------- EKG ---------- */
let raf=null,ecgState=null;
const g=(x,mu,s,a)=>a*Math.exp(-((x-mu)**2)/(2*s*s));
function wave(ph,type){
  let y=0;
  if(type==='avb3'){/* P-Wellen unabhängig, breite Kammerkomplexe */
    y+=g(ph,.08,.02,.12)+g(ph,.42,.02,.12)+g(ph,.76,.02,.12);
    y+=g(ph,.26,.03,.85)+g(ph,.32,.03,-.35)+g(ph,.55,.06,-.2);return y;}
  if(type==='svt'){y+=g(ph,.235,.008,-.1)+g(ph,.25,.01,1)+g(ph,.27,.009,-.24)+g(ph,.5,.06,.2);return y;}
  if(type!=='afib')y+=g(ph,.12,.022,.12);
  else y+=.035*Math.sin(ph*90)+.02*Math.sin(ph*143);
  y+=g(ph,.235,.008,-.12)+g(ph,.25,.01,1)+g(ph,.27,.009,-.26);
  if(type==='stemi'){const w=(1/(1+Math.exp(-(ph-.285)*140)))*(1/(1+Math.exp((ph-.44)*60)));y+=.3*w+g(ph,.42,.045,.32);}
  else y+=g(ph,.43,.04,.24);
  return y;
}
function startECG(){
  const c=$('#ecg');const dpr=Math.min(2,window.devicePixelRatio||1);
  const resize=()=>{c.width=c.clientWidth*dpr;c.height=c.clientHeight*dpr;};resize();
  const ctx=c.getContext('2d');
  const css=getComputedStyle(document.documentElement);
  const col=css.getPropertyValue('--mon-hf').trim()||'#3BE38A',grid=css.getPropertyValue('--mon-grid').trim()||'#0F2530',bg=css.getPropertyValue('--mon-bg').trim()||'#061017';
  ecgState={x:0,ph:0,prevY:null,factor:1,last:performance.now()};
  ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
  const drawGrid=(x0,w)=>{ctx.fillStyle=bg;ctx.fillRect(x0,0,w,c.height);ctx.strokeStyle=grid;ctx.lineWidth=1;
    for(let gx=Math.ceil(x0/(12*dpr))*12*dpr;gx<x0+w;gx+=12*dpr){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,c.height);ctx.stroke();}
    for(let gy=0;gy<c.height;gy+=12*dpr){ctx.beginPath();ctx.moveTo(x0,gy);ctx.lineTo(x0+w,gy);ctx.stroke();}};
  drawGrid(0,c.width);
  const speed=110*dpr; // px/s
  const yOf=v=>c.height*.68-v*c.height*.55;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){if(!M.rev.has('ekg'))return;ctx.strokeStyle=col;ctx.lineWidth=2*dpr;ctx.beginPath();let ph=0;for(let x=0;x<c.width;x++){ph+=(M.v.hf/60)/speed;const y=yOf(wave(ph%1,M.rhythm));x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();return;}
  const tick=now=>{
    const dt=Math.min(.05,(now-ecgState.last)/1000);ecgState.last=now;
    const px=speed*dt;const steps=Math.max(1,Math.round(px));
    drawGrid(ecgState.x,px+14*dpr);
    ctx.strokeStyle=M.rev.has('ekg')?col:'#2E4A56';ctx.lineWidth=2*dpr;ctx.lineJoin='round';ctx.beginPath();
    for(let s=0;s<steps;s++){
      ecgState.ph+=(M.v.hf/60)*(dt/steps)*ecgState.factor;
      if(ecgState.ph>=1){ecgState.ph-=1;ecgState.factor=M.rhythm==='afib'?(.7+Math.random()*.6):1;}
      const y=M.rev.has('ekg')?yOf(wave(ecgState.ph,M.rhythm)):yOf(0);
      if(ecgState.prevY===null){ctx.moveTo(ecgState.x,y);}else{ctx.moveTo(ecgState.x,ecgState.prevY);ctx.lineTo(ecgState.x+px/steps,y);}
      ecgState.x+=px/steps;ecgState.prevY=y;
      if(ecgState.x>c.width){ecgState.x=0;ecgState.prevY=null;}
    }
    ctx.stroke();
    raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
}
function stopECG(){if(raf)cancelAnimationFrame(raf);raf=null;}

/* ---------- Abschluss ---------- */
function finish(){
  stopECG();
  const cs=M.cs;const errors=M.mistakes+M.missed+M.gross;let stars=errors===0?3:errors<=2?2:1;if(M.gross)stars=1;
  const pflichtDone=M.order.filter(d=>d.typ==='pflicht').length;
  const summary=`<div class="sumrow${M.gross?' four':''}"><div><span class="label">Pflicht erledigt</span><strong>${pflichtDone} / ${cs.nP}</strong></div><div><span class="label">Fehlgriffe</span><strong>${M.mistakes}</strong></div>${M.gross?`<div class="grossbox"><span class="label">Grobe Fehler</span><strong>${M.gross}</strong></div>`:''}<div><span class="label">Einsatzzeit</span><strong>${fmtT(M.t)}</strong></div></div>`;
  if(M.probe){
    $('#debriefinner').innerHTML=`<div class="result"><span class="label">Probefahrt · wird nicht gewertet</span><h1>${errors===0?'Fehlerfrei durchgespielt':errors+(errors===1?' Fehler':' Fehler')}</h1>${summary}</div>${loesungHTML(cs,M)}${cs.card.key||cs.card.see.length?cardHTML(cs):''}<button class="btn acc next" id="tohome">ZURÜCK ZUM EDITOR</button>`;
    $('#mission').hidden=true;$('#debrief').hidden=false;$('#debrief').scrollTop=0;
    $('#tohome').onclick=()=>{$('#debrief').hidden=true;$('#editor').hidden=false;};return;}
  const before=levelInfo(S.xp).lvl;
  let xp=M.xp+stars*10+(has('ktw')?5:0)+(has('nef')?10:0)+(has('rtw2')?5:0);if(has('schulung'))xp=Math.round(xp*1.1);
  let coins=M.coins+stars*10+(has('funk')?5:0)+(has('desinfektion')?3:0)+(has('fitness')?5:0);
  const now=Date.now();let streakMsg='';
  if(!S.last){S.streak=1;}
  else{const h=(now-S.last)/36e5;
    if(h<20){}else if(h<=48){S.streak++;}
    else if(S.freezes>0&&h<=96){S.freezes--;S.streak++;streakMsg='Ein Schicht-Freeze hat deine Serie gerettet.';}
    else{S.streak=1;streakMsg='Neue Serie gestartet.';}}
  S.last=now;
  let loot=null;if(Math.random()<.3){loot=LOOT[Math.floor(Math.random()*LOOT.length)];if(loot.c)coins+=loot.c;if(loot.f)S.freezes=Math.min(maxFz(),S.freezes+loot.f);}
  S.xp+=xp;S.coins+=coins;S.plays[cs.id]=(S.plays[cs.id]||0)+1;
  const newCard=!S.cards.includes(cs.id);if(newCard)S.cards.push(cs.id);
  const after=levelInfo(S.xp).lvl;if(after>before)S.freezes=Math.min(maxFz(),S.freezes+1);
  const unlocked=playable().filter(c=>c.minLevel>before&&c.minLevel<=after);
  save();
  const affordable=ITEMS.filter(i=>!has(i.id)&&S.coins>=i.cost);
  const star=on=>`<svg viewBox="0 0 24 24" class="${on?'on':''}"><path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z"/></svg>`;
  $('#debriefinner').innerHTML=`
   <div class="result">
     <span class="label">Einsatz abgeschlossen · ${esc(cs.stw)} · Diagnose: ${esc(cs.title)}</span>
     <div class="stars">${star(stars>=1)}${star(stars>=2)}${star(stars>=3)}</div>
     <h1>${stars===3?'Fehlerfrei!':stars===2?'Starker Einsatz':'Patient übergeben'}</h1>
     ${summary}
     <div class="gains"><span class="gain xp">+${xp} XP</span><span class="gain co">+${coins} Münzen</span><span class="gain" style="color:var(--accent)">Serie ${S.streak}</span></div>
     ${streakMsg?`<span style="font-size:14px;color:var(--muted)">${streakMsg}</span>`:''}
     ${after>before?`<div class="lvlup">LEVEL ${after} · ${RANKS[Math.min(after-1,RANKS.length-1)].toUpperCase()}<small>+1 Schicht-Freeze${unlocked.length?` · Neuer Einsatz: ${unlocked.map(u=>esc(u.title)).join(', ')}`:''}</small></div>`:''}
     ${loot?`<div class="loot">${ic('gift')}<div><strong>Seltener Fund: ${loot.n}</strong><div style="font-size:14px;color:var(--muted)">${loot.d}</div></div></div>`:''}
   </div>
   ${loesungHTML(cs,M)}
   ${cs.card.key||cs.card.see.length?(newCard?'<span class="label" style="color:var(--accent)">Neuer Steckbrief freigeschaltet</span>':'<span class="label">Dein Steckbrief zum Fall</span>')+cardHTML(cs):''}
   <button class="btn acc next" id="tohome">${affordable.length?`ZUR WACHE · ${affordable.length} AUSBAU${affordable.length>1?'TEN':''} MÖGLICH`:'ZUR WACHE'}</button>
   <button class="btn ghost" id="again">Direkt nächster Einsatz</button>`;
  $('#mission').hidden=true;$('#debrief').hidden=false;$('#debrief').scrollTop=0;
  chime([523,659,784,1047],.11);buzz([30,30,30,30,80]);
  $('#tohome').onclick=()=>{$('#debrief').hidden=true;showView('home');};
  $('#again').onclick=()=>{$('#debrief').hidden=true;showView('home');$('#go').click();};
}
function cardHTML(cs){
  const c=cs.card;
  return `<article class="sb"><div class="sbhead"><span class="label">Steckbrief</span><h2>${esc(cs.title)}</h2>${c.key?`<span class="keyfact">${esc(c.key)}</span>`:''}</div>
   <div class="sbcols">
    ${c.see.length?`<div class="sbcol c-see"><span class="label">${ic('eye')} Erkennen</span><div class="chips">${c.see.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div></div>`:''}
    ${c.doo.length?`<div class="sbcol c-do"><span class="label">${ic('check')} Tun</span><ol class="steps">${c.doo.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`:''}
    ${c.dont.length?`<div class="sbcol c-dont"><span class="label">${ic('ban')} Vermeiden</span><div class="chips">${c.dont.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div></div>`:''}
    ${arr(c.ns).length?`<div class="sbcol c-ns"><span class="label">${ic('bolt')} NotSan nach ${cs.region==='sh'?'SH-Handlungsempfehlungen':'SAA'} <span class="badge b-reg">Regional</span></span><div class="chips">${c.ns.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div></div>`:''}
    ${cs.regional?`<div class="sbreg"><div class="reginfo"><b>⚑ ${cs.region==='sh'?'SH':'Regional'}</b><span>${esc(cs.regional)}</span></div></div>`:''}
   </div></article>`;
}
function openCard(cs){
  $('#cardinner').innerHTML=`<div class="mtop"><span class="label">${S.plays[cs.id]||0}× gefahren</span><button class="x" id="cardclose" aria-label="Schließen">${ic('x')}</button></div>${cardHTML(cs)}`;
  $('#cardview').hidden=false;$('#cardclose').onclick=()=>$('#cardview').hidden=true;
}

/* ---------- Bibliothek: Datenbank, Fälle, Wissen ---------- */
const PH=['x','A','B','C','D','E'];
const PHN={x:'Exsanguination',A:'Airway',B:'Breathing',C:'Circulation',D:'Disability',E:'Exposure'};
const PHQ={x:'Lebensbedrohliche Blutung?',A:'Ist der Atemweg frei?',B:'Wie atmet der Patient?',C:'Wie ist der Kreislauf?',D:'Wie ist die Neurologie?',E:'Was fehlt noch?'};
const RHY={sinus:'Sinusrhythmus',afib:'Absolute Arrhythmie',stemi:'ST-Hebung',avb3:'AV-Block III°',svt:'Schmalkomplextachykardie'};
const VF=[['hf','HF'],['sys','RR sys'],['dia','RR dia'],['spo2','SpO₂'],['af','AF'],['gcs','GCS'],['bz','BZ'],['temp','Temp']];
const TYPES=['pflicht','sinnvoll','falsch','gefahr','abbruch','neutral'];
const BADT=['falsch','gefahr','abbruch'];
const SEV=['gefahr','abbruch'];
const TYPN={pflicht:'Wichtig',sinnvoll:'Sinnvoll',falsch:'Falsch',gefahr:'Gefährlich',abbruch:'Grober Fehler',neutral:'Ohne Wertung'};
const MONK=['hf','spo2','rr','af','ekg','gcs','bz','temp'];
/* Maßnahmen-Katalog: [id, Text, deckt am Monitor auf, Zeit in Sekunden, 'ns' = nur NotSan (SAA)] */
const CAT={
 x:[['bodycheck','Bodycheck: Kopf bis Fuß abtasten',[],40],['kompression','Blutung manuell abdrücken',[],20],['druckverband','Druckverband anlegen',[],60],['tourniquet','Tourniquet anlegen',[],40],['becken','Beckenschlinge anlegen',[],60]],
 A:[['ansprechen','Ansprechen',[],5],['mund','Mundraum inspizieren',[],10],['absaugen','Absaugen',[],20],['esmarch','Kopf überstrecken, Esmarch-Handgriff',[],10],['guedel','Guedel-Tubus einlegen',[],15],['wendl','Wendl-Tubus einlegen',[],15],['hws','HWS manuell stabilisieren',[],10],['stifneck','Zervikalstütze anlegen',[],40],['sga','Extraglottischen Atemweg einlegen (Larynxtubus)',[],60,'ns']],
 B:[['af','Atemfrequenz zählen',['af'],30],['spo2','Pulsoxymetrie anlegen',['spo2','hf'],15],['thorax','Thorax ansehen',[],10],['auskultation','Lunge abhören',[],30],['palpation','Thorax abtasten',[],20],['o2','Sauerstoff geben',[],20],['beatmen','Beutel-Masken-Beatmung',[],30],['cpap','CPAP / NIV anlegen',[],60,'ns']],
 C:[['puls','Puls tasten',['hf'],15],['haut','Haut beurteilen',[],5],['rekap','Rekap-Zeit prüfen',[],5],['rr','Blutdruck messen',['rr'],40],['rr2','Blutdruck an beiden Armen',['rr'],70],['ekg3','EKG anlegen (Monitoring)',['ekg','hf'],40],['ekg12','12-Kanal-EKG schreiben',['ekg','hf'],120],['zugang','i.v.-Zugang legen',[],90,'ns'],['io','i.o.-Zugang legen',[],60,'ns'],['vel','Infusion: Vollelektrolytlösung',[],30,'ns'],['schocklage','Beine hochlagern',[],15],['na','Notarzt nachfordern',[],10]],
 D:[['avpu','Bewusstsein prüfen (AVPU)',[],10],['gcs','GCS erheben',['gcs'],30],['pupillen','Pupillen prüfen',[],15],['bz','Blutzucker messen',['bz'],40],['befast','BE-FAST prüfen',[],40],['motorik','Motorik und Sensibilität prüfen',[],30],['glukose_oral','Glukose oral geben',[],60],['glukose','Glukose i.v. geben',[],60,'ns']],
 E:[['entkleiden','Entkleiden und genau untersuchen',[],60],['temp','Temperatur messen',['temp'],20],['waerme','Zudecken, Wärmeerhalt',[],15],['sampler','Anamnese nach SAMPLER',[],90],['opqrst','Schmerz erfragen (OPQRST)',[],45],['oberkoerper','Oberkörper hoch lagern',[],15],['ssl','Stabile Seitenlage',[],20],['flach','Flach lagern',[],10],['transport','Zielklinik wählen und voranmelden',[],30]]
};
const ROLN={rs:'RS',ns:'NotSan'};
let ROLE=S.rolle==='ns'?'ns':'rs';
let REGION=S.region==='saa'?'saa':'sh';
const catName=(p,id)=>(CAT[p].find(c=>c[0]===id)||[])[1];
const fmtNum=v=>String(v).replace('.',',');
function defaultResult(id,v,rh){const af=rh==='afib';
 const D={bodycheck:'Keine Blutung, keine Verletzung tastbar',kompression:'Durchgeführt',druckverband:'Angelegt',tourniquet:'Angelegt',becken:'Angelegt',
  ansprechen:v.gcs>=15?'Antwortet adäquat':v.gcs>8?'Reagiert verlangsamt auf Ansprache':'Keine Reaktion auf Ansprache',
  mund:'Mundraum frei',absaugen:'Kaum Sekret',esmarch:'Durchgeführt',guedel:'Eingelegt',wendl:'Eingelegt',hws:'Kopf wird gehalten',stifneck:'Angelegt',sga:'Eingelegt',
  af:`AF ${v.af}/min`,spo2:`SpO₂ ${v.spo2} %, Puls ${v.hf}/min`,thorax:'Hebt sich seitengleich',auskultation:'Vesikuläres Atemgeräusch beidseits',palpation:'Stabil, nicht druckschmerzhaft',o2:'Sauerstoff läuft',beatmen:'Beatmung läuft',
  puls:`${v.hf}/min, ${af?'unregelmäßig':'regelmäßig'}, gut tastbar`,haut:'Rosig, warm, trocken',rekap:'Unter 2 Sekunden',rr:`${v.sys}/${v.dia} mmHg`,
  ekg3:`${rh==='stemi'?'Sinusrhythmus mit ST-Hebung':RHY[rh]}, HF ${v.hf}/min`,ekg12:rh==='stemi'?'ST-Hebungen sichtbar':'Keine ST-Streckenveränderungen',
  zugang:'Zugang liegt',io:'i.o.-Zugang liegt',vel:'VEL läuft',schocklage:'Beine hochgelagert',na:'Notarzt ist alarmiert',
  rr2:`Rechts ${v.sys}/${v.dia}, links ähnlich – keine relevante Differenz`,cpap:'CPAP/NIV läuft',
  avpu:v.gcs>=15?'A – wach und orientiert':v.gcs>8?'V – reagiert auf Ansprache':'P – reagiert nur auf Schmerz',gcs:`GCS ${v.gcs}`,pupillen:'Isokor, prompt lichtreagibel',bz:`${v.bz} mg/dl`,befast:'Kein neurologischer Ausfall',motorik:'Seitengleich, unauffällig',glukose:'Glukose i.v. gegeben',glukose_oral:'Glukose oral gegeben',
  entkleiden:'Keine weiteren Auffälligkeiten',temp:`${fmtNum(v.temp)} °C`,waerme:'Zugedeckt',sampler:'Keine Besonderheiten erhoben',opqrst:'Keine Schmerzen angegeben',oberkoerper:'Oberkörper hochgelagert',ssl:'In stabiler Seitenlage',flach:'Flach gelagert',transport:'Zielklinik ist informiert'};
 return D[id]||'Durchgeführt';}
const WCATS=['Leitsymptome','Krankheitsbilder','Schemata','Anatomie','Physiologie','Pharmakologie','Normwerte','Sonstiges'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const num=(v,d)=>Number.isFinite(+v)&&v!==''&&v!==null?+v:d;
const shuffle=a=>a.slice().sort(()=>Math.random()-.5);
let CASES=[],WISSEN=[],DB=null,CAN_EDIT=false,dbState='loading',wState='loading';

function fxOf(dn){if(!dn||typeof dn!=='object')return null;const o={};VF.forEach(([k])=>{if(Number.isFinite(+dn[k])&&dn[k]!==''&&dn[k]!==null)o[k]=+dn[k];});if(RHY[dn.rhythmus])o.rhythm=dn.rhythmus;return Object.keys(o).length?o:null;}
/* Automatische Bewertung nicht bewerteter Katalog-Maßnahmen anhand der Patientenwerte.
   Untersuchungen sind nie falsch; Therapie ohne Indikation zählt als Fehler. Fallspezifische Bewertungen gehen immer vor. */
const DIAG=['bodycheck','ansprechen','mund','af','spo2','thorax','auskultation','palpation','puls','haut','rekap','rr','rr2','ekg3','ekg12','avpu','gcs','pupillen','bz','befast','motorik','entkleiden','temp','sampler','opqrst'];
function autoRate(id,V){
  const ok=(nl,w='')=>({typ:'neutral',nl,warum:w}),no=w=>({typ:'falsch',warum:w}),bad=w=>({typ:'gefahr',warum:w});
  const tief=V.gcs<=8,wach=V.gcs>=13,hypo=!V.kind&&V.sys<100,konflikt=hypo&&(V.spo2<92||V.af>24);
  const lage='Lagerung nach Leitsymptom: Atemnot eher erhöht, Schock eher flach – hier ist beides vertretbar.';
  if(DIAG.includes(id))return ok('Untersuchung');
  switch(id){
    case 'kompression':case 'druckverband':return no('Es gibt keine relevante Blutung – ohne Indikation.');
    case 'tourniquet':return no('Ein Tourniquet ohne lebensbedrohliche Extremitätenblutung schnürt die Durchblutung ab und schmerzt – ohne Indikation.');
    case 'becken':return no('Kein Trauma und kein Hinweis auf eine Beckenverletzung – ohne Indikation.');
    case 'absaugen':return tief?ok('Vertretbar','Bei Bewusstseinsstörung Absaugbereitschaft – ohne Sekret aber nicht nötig.'):no('Kein Sekret, der Patient schluckt selbst – Absaugen reizt nur.');
    case 'esmarch':return tief?ok('Vertretbar','Bei tiefer Bewusstlosigkeit hält der Esmarch-Handgriff den Atemweg offen.'):no('Der Patient hält seinen Atemweg selbst frei.');
    case 'guedel':return tief?ok('Vertretbar','Nur ohne Schutzreflexe – sonst Würgen und Erbrechen.'):no('Bei erhaltenen Schutzreflexen löst der Guedel-Tubus Würgen und Erbrechen aus.');
    case 'wendl':return tief?ok('Vertretbar','Der Wendl-Tubus wird auch bei erhaltenen Reflexen toleriert.'):no('Der Atemweg ist frei – kein Wendl-Tubus nötig.');
    case 'hws':case 'stifneck':return no('Kein Trauma und kein Hinweis auf eine Wirbelsäulenverletzung – ohne Indikation.');
    case 'sga':return tief?no('Erst Basismaßnahmen. Ein extraglottischer Atemweg kommt erst, wenn die Beutel-Masken-Beatmung versagt und keine Schutzreflexe mehr da sind.'):bad('Bei einem Patienten mit Schutzreflexen löst ein Larynxtubus Würgen, Erbrechen und Aspiration aus.');
    case 'o2':return ok('Vertretbar','Sauerstoff nach SpO₂ – hier nicht zwingend.');
    case 'beatmen':return V.af<8||(tief&&V.spo2<90)?ok('Vertretbar'):no('Der Patient atmet ausreichend selbst – eine Beutel-Masken-Beatmung ist nicht indiziert.');
    case 'cpap':return tief?bad('CPAP/NIV ohne Schutzreflexe: Aspirationsgefahr.'):no('Keine Indikation für CPAP/NIV – zuerst Sauerstoff und die Ursache behandeln.');
    case 'zugang':return ok('Vertretbar','Ein Zugang ist hier nicht zwingend, aber vertretbar.');
    case 'io':return no('Ein i.o.-Zugang ist nur bei vitaler Bedrohung vorgesehen, wenn i.v. nicht zeitgerecht gelingt.');
    case 'vel':return V.kind?no('Beim Kind ohne Volumenmangel keine Infusion.'):V.sys<110?ok('Vertretbar','Bei niedrigem Blutdruck ist Volumen vertretbar.'):no('Kein Volumenmangel – eine Infusion ist ohne Indikation.');
    case 'schocklage':return konflikt?ok('Vertretbar',lage):hypo?ok('Vertretbar','Bei Hypotonie vertretbar, wenn die Atmung es zulässt.'):no('Kein Schock – Beine hochlagern bringt nichts.');
    case 'na':return ok('Vertretbar','Notarzt nicht zwingend, aber vertretbar – lokale Vorgaben beachten.');
    case 'glukose_oral':return V.bz<60?ok('Vertretbar'):!wach?bad('Bei Bewusstseinsstörung droht Aspiration – nichts oral geben.'):no('Der Blutzucker ist normal – keine Glukose.');
    case 'glukose':return V.bz<60?ok('Vertretbar'):no('Der Blutzucker ist normal – Glucose ist ohne Indikation.');
    case 'waerme':return V.temp>=38.5?no('Bei Fieber nicht warm einpacken – Wärmestau.'):ok('Vertretbar','Wärmeerhalt schadet nie.');
    case 'oberkoerper':return konflikt?ok('Vertretbar',lage):!V.kind&&V.sys<90?no('Bei Hypotonie verschlechtert die Oberkörperhochlage die Hirndurchblutung.'):tief?no('Bei tiefer Bewusstlosigkeit: Seitenlage statt Oberkörper hoch.'):ok('Vertretbar');
    case 'ssl':return tief?ok('Vertretbar','Bewusstlos mit eigener Atmung: Seitenlage schützt vor Aspiration.'):no('Der Patient ist ansprechbar – die stabile Seitenlage ist nur für Bewusstlose mit erhaltener Atmung.');
    case 'flach':return konflikt?ok('Vertretbar',lage):V.spo2<92||V.af>24?no('Flachlagerung verschlechtert die Atemnot.'):ok('Vertretbar');
    case 'transport':return ok('Vertretbar');
  }
  return ok('Vertretbar');
}
function toCase(id,d,base){
  if(!d||typeof d!=='object')return null;
  const v=d.vitalwerte||{};const ph=d.phasen||{};const legacy=!d.phasen&&Array.isArray(d.schritte);
  const rol=v=>v==='rs'||v==='ns'?v:'';
  const mkQ=(f,acts)=>{if(!f||!f.frage||!f.richtig||!f.richtig.text)return null;const fs=arr(f.falsch).filter(o=>o&&o.text);if(!fs.length)return null;
    const n=String(f.nach||'');const hit=acts.find(a=>a.id===n||a.id==='e_'+n);
    return {nach:hit?hit.id:'',q:String(f.frage),finds:arr(f.befunde).map(String),rolle:rol(f.rolle),reg:!!f.regional,sh:!!f._sh,opts:[{t:String(f.richtig.text),why:String(f.richtig.warum||''),ok:1},...fs.map(o=>({t:String(o.text),why:String(o.warum||''),sev:SEV.includes(o.schwer)?o.schwer:''}))]};};
  /* Rollen-Felder: rolle (rs|ns|leer), typRS/warumRS/lwRS überschreiben für RS, med = Medikament nach SAA */
  const extra=(o,ns)=>({rolle:ns?'ns':rol(o.rolle),reg:!!o.regional||!!o.med||!!ns,sh:!!o._sh,mittel:arr(o.mittel).filter(m=>m&&MEDCAT[m.w]&&m.d),med:!!o.med,typRS:TYPES.includes(o.typRS)?o.typRS:'',warumRS:String(o.warumRS||''),lwRS:!!o.lwRS});
  const age=(String(d.patient||'').match(/(\d+)\s*(?:J\.|Jahre)/)||[])[1];const V0={kind:age!==undefined&&+age<12,gcs:num(v.gcs,15),spo2:num(v.spo2,97),sys:num(v.sys,120),af:num(v.af,14),bz:num(v.bz,100),temp:num(v.temp,36.8)};
  const phases=PH.map(p=>{
    const src=ph[p]||{};const ov=src.aktionen||{};
    const actions=CAT[p].map(([aid,text,zeigt,t,flag])=>{let o=ov[aid]||{};if(!TYPES.includes(o.typ)||(o.typ==='neutral'&&!o.warum)){const ar=autoRate(aid,V0);o={...o,typ:ar.typ,warum:o.warum||ar.warum,_nl:ar.nl,_auto:true};}return {id:aid,text,zeigt,t,typ:o.typ,nl:o._nl||(o.typ==='neutral'?'Ermessen':''),auto:!!o._auto,vital:!!o.lebenswichtig&&o.typ==='pflicht',ergebnis:String(o.ergebnis||''),warum:String(o.warum||''),fx:fxOf(o.danach),...extra(o,flag==='ns')};});
    arr(src.eigene).forEach((e,i)=>{if(e&&e.text)actions.push({id:'e_'+(e.id||i),text:String(e.text),zeigt:arr(e.zeigt).filter(k=>MONK.includes(k)),t:num(e.zeit,30),typ:TYPES.includes(e.typ)?e.typ:'neutral',vital:!!e.lebenswichtig&&e.typ==='pflicht',ergebnis:String(e.ergebnis||''),warum:String(e.warum||''),fx:fxOf(e.danach),...extra(e,false)});});
    let fragen=arr(src.fragen).map(f=>mkQ(f,actions)).filter(Boolean);
    if(legacy)fragen=fragen.concat(arr(d.schritte).filter(s=>s&&s.phase===p).map(s=>mkQ({nach:'',frage:s.frage,richtig:s.richtig,falsch:s.falsch,befunde:s.befunde},actions)).filter(Boolean));
    return {ph:p,eindruck:String(src.eindruck||''),actions,fragen};
  });
  const sb=d.steckbrief||{};
  const nP=phases.reduce((s,P)=>s+P.actions.filter(a=>a.typ==='pflicht').length,0),nQ=phases.reduce((s,P)=>s+P.fragen.length,0);
  return {id,title:String(d.titel||'Ohne Titel'),stw:String(d.stichwort||''),minLevel:Math.max(1,num(d.level,1)),pat:String(d.patient||''),situation:String(d.situation||''),
    status:d.status==='entwurf'?'entwurf':'aktiv',quelle:String(d.quelle||''),regional:String(d.regional||''),
    v:{hf:num(v.hf,80),sys:num(v.sys,120),dia:num(v.dia,80),spo2:num(v.spo2,97),af:num(v.af,14),gcs:num(v.gcs,15),bz:num(v.bz,100),temp:num(v.temp,36.8)},
    rhythm:RHY[d.rhythmus]?d.rhythmus:'sinus',phases,nP,nQ,
    card:{key:String(sb.kern||''),see:arr(sb.erkennen).map(String),doo:arr(sb.tun).map(String),dont:arr(sb.vermeiden).map(String),ns:arr(sb.ns).map(String)},raw:base||d,region:d._region||'saa',ohneAlg:!!d._ohneAlg,hasSH:!!(base||d).sh};
}
/* Fall für eine Rolle aufbereiten: RS sieht keine NotSan-Maßnahmen; die landen als Info in der Musterlösung */
function forRole(cs,r){
  const keep=x=>!x.rolle||x.rolle===r;
  const phases=cs.phases.map(P=>{
    const actions=[],hidden=[];
    P.actions.forEach(a=>{
      if(!keep(a)){if(a.typ==='pflicht'||a.typ==='sinnvoll')hidden.push(a);return;}
      if(r==='rs'&&(a.typRS||a.warumRS||a.lwRS)){const typ=a.typRS||a.typ;actions.push({...a,typ,warum:a.warumRS||a.warum,vital:typ==='pflicht'&&(a.lwRS||a.vital)});}
      else actions.push(a);});
    return {...P,actions,hidden,fragen:P.fragen.filter(keep)};});
  const nP=phases.reduce((s,P)=>s+P.actions.filter(a=>a.typ==='pflicht').length,0),nQ=phases.reduce((s,P)=>s+P.fragen.length,0);
  return {...cs,phases,nP,nQ,role:r};
}
let CASES_ALL=[],RAW=[];
function applyRole(){CASES=CASES_ALL.map(c=>forRole(c,ROLE));}
/* Regelwerk: Fall-Dokumente tragen unter "sh" die Abweichungen nach den SH-Handlungsempfehlungen.
   Ersetzte Elemente (Aktion, eigene Maßnahme, Frage) werden komplett übernommen und als SH markiert. */
function withRegion(d,R){
  if(R!=='sh'||!d||!d.sh||typeof d.sh!=='object')return d;
  const o=JSON.parse(JSON.stringify(d)),s=d.sh;
  ['regional','quelle','patient','situation'].forEach(k=>{if(typeof s[k]==='string')o[k]=s[k];});
  if(s.steckbrief&&typeof s.steckbrief==='object')o.steckbrief=Object.assign({},o.steckbrief||{},s.steckbrief);
  Object.entries(s.phasen||{}).forEach(([p,sp])=>{const P=(o.phasen=o.phasen||{})[p]=o.phasen[p]||{aktionen:{},eigene:[],fragen:[]};if(!sp)return;
    Object.entries(sp.aktionen||{}).forEach(([k,a])=>{P.aktionen=P.aktionen||{};if(a===null)delete P.aktionen[k];else P.aktionen[k]={...a,_sh:1};});
    const ev=sp.eigene||{};P.eigene=arr(P.eigene).filter(e=>ev[e.id]!==null).map(e=>ev[e.id]?{...ev[e.id],id:e.id,_sh:1}:e).concat(arr(sp.eigeneNeu).map(e=>({...e,_sh:1})));
    const fv=sp.fragen||{};P.fragen=arr(P.fragen).map((f,i)=>fv[i]===null?null:fv[i]?{...fv[i],_sh:1}:f).filter(Boolean).concat(arr(sp.fragenNeu).map(f=>({...f,_sh:1})));});
  o._region='sh';o._ohneAlg=!!s.ohneAlg;return o;
}
function rebuildCases(){CASES_ALL=RAW.map(r=>toCase(r.id,withRegion(r.data,REGION),r.data)).filter(Boolean);applyRole();}
function setRole(r){ROLE=r==='ns'?'ns':'rs';S.rolle=ROLE;save();applyRole();renderRoleBars();renderAll();renderFaelle();renderWissen();toast(ROLE==='ns'?'Du übst jetzt als Notfallsanitäter':'Du übst jetzt als Rettungssanitäter');}
function setRegion(r){REGION=r==='saa'?'saa':'sh';S.region=REGION;save();rebuildCases();renderRoleBars();renderFoots();renderAll();renderFaelle();renderWissen();toast(REGION==='sh'?'Regelwerk: Schleswig-Holstein':'Regelwerk: SAA/BPR (BW, BB, MV, NRW, SN, ST)');}
function renderRoleBars(){document.querySelectorAll('[data-rolebar] button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.rolle===ROLE?'true':'false'));
  document.querySelectorAll('[data-regionbar] button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.region===REGION?'true':'false'));}
document.querySelectorAll('[data-rolebar] button').forEach(b=>b.onclick=()=>{if(b.dataset.rolle!==ROLE)setRole(b.dataset.rolle);});
document.querySelectorAll('[data-regionbar] button').forEach(b=>b.onclick=()=>{if(b.dataset.region!==REGION)setRegion(b.dataset.region);});
renderRoleBars();
const badgeHTML=(a)=>`${a.rolle==='ns'?'<span class="badge b-ns">NotSan</span>':''}${a.sh?'<span class="badge b-sh">SH</span>':''}${a.reg?'<span class="badge b-reg">Regional</span>':''}`;
const FOOT={
  home:()=>`Lernhilfe, eigene Aufbereitung. Regelwerk <b>SH</b>: Handlungsempfehlungen für den Rettungsdienst in Schleswig-Holstein, V10.0, Stand 15.07.2025. Regelwerk <b>SAA/BPR</b>: ÄLRD BW, BB, MV, NRW, SN, ST, Stand 30.04.2025. <span class="badge b-sh">SH</span> zeigt, was in SH anders gilt, <span class="badge b-reg">Regional</span> was je nach Träger oder ÄLRD abweicht. Verbindlich ist das lokale Protokoll deines Trägers.`,
  faelle:()=>`Aktive Fälle kommen zufällig als Alarm. Als RS siehst du die Basismaßnahmen, als NotSan zusätzlich Medikamente und invasive Maßnahmen nach ${REGION==='sh'?'den SH-Handlungsempfehlungen (V10.0, 15.07.2025)':'SAA und BPR 2025 (ÄLRD BW, BB, MV, NRW, SN, ST)'}. Verbindlich ist das lokale Protokoll deines Trägers.`,
  wissen:()=>`Lernhilfe, kein Ersatz für Ausbildung und Leitlinien. Quelle: ${REGION==='sh'?'Handlungsempfehlungen für den RD in Schleswig-Holstein, V10.0 (15.07.2025); Einträge ohne SH-Bezug nach SAA/BPR 2025':'SAA und BPR 2025 (ÄLRD BW, BB, MV, NRW, SN, ST)'}, eigene Aufbereitung. <span class="badge b-reg">Regional</span> = weicht je nach Land oder ÄLRD ab.`};
function renderFoots(){const h=$('#foot-home');if(h)h.innerHTML=FOOT.home();const f=$('#foot-faelle');if(f)f.innerHTML=FOOT.faelle();const w=$('#foot-wissen');if(w)w.innerHTML=FOOT.wissen();}
const REGT=()=>REGION==='sh'?'SH-Handlungsempfehlungen':'SAA';
/* ---------- Medikamentenwahl: erst Wirkstoff, dann Dosis und Weg ---------- */
/* r: nur in diesem Regelwerk; d: Auswahl je Regelwerk (enthält richtige und falsche Dosierungen) */
const MEDCAT={
 adrenalin:{n:{saa:'Epinephrin',sh:'Adrenalin'},d:{saa:['0,5 mg i.m.','0,3 mg i.m.','0,15 mg i.m.','1 mg i.v. als Bolus','4 mg vernebelt','5 µg i.v. jede Minute'],sh:['0,5 mg i.m.','0,3 mg i.m.','0,15 mg i.m.','1 mg i.v. als Bolus','5 mg vernebelt','2–10 µg/min i.v.']}},
 amiodaron:{n:'Amiodaron',d:{saa:['300 mg i.v.','150 mg i.v.'],sh:['300 mg als Kurzinfusion','150 mg i.v. als Bolus']}},
 ass:{n:'ASS',d:['250 mg i.v.','500 mg i.v.','1.000 mg i.v.']},
 atropin:{n:'Atropin',d:['0,5 mg i.v.','0,1 mg i.v.','3 mg i.v. als Bolus']},
 butylscopolamin:{n:'Butylscopolamin',d:{saa:['0,3 mg/kg i.v.','40 mg i.v.'],sh:['20 mg i.v.','40 mg i.v.']}},
 clemastin:{n:'Clemastin',r:'sh',d:['2 mg i.v.','1 mg i.v.','4 mg i.v.']},
 diazepam:{n:'Diazepam rektal',r:'sh',d:['5 mg rektal','10 mg rektal']},
 dimenhydrinat:{n:'Dimenhydrinat',d:['62 mg i.v.','200 mg i.v.']},
 dimetinden:{n:'Dimetinden',d:{saa:['4–8 mg i.v.','1 mg i.v.','20 mg i.v.'],sh:['4 mg i.v.','1 mg i.v.','20 mg i.v.']}},
 esketamin:{n:'Esketamin',d:{saa:['0,125 mg/kg i.v. + Midazolam','1 mg/kg i.v.'],sh:['0,125–0,25 mg/kg i.v. + Midazolam','1 mg/kg i.v.','2 mg/kg i.v.']}},
 fentanyl:{n:'Fentanyl',r:'saa',d:['50 µg i.v., titriert','200 µg i.v. als Bolus','2 µg/kg nasal']},
 furosemid:{n:'Furosemid',d:{saa:['20 mg langsam i.v.','80 mg i.v.','250 mg i.v.'],sh:['40 mg i.v.','80 mg i.v.','250 mg i.v.']}},
 glucagon:{n:'Glucagon',d:{saa:['1 mg i.m.','0,5 mg i.m.','3 mg nasal'],sh:['1 mg i.m.','3 mg nasal','5 mg i.m.']}},
 heparin:{n:'Heparin',d:['5.000 I.E. i.v.','10.000 I.E. i.v.','25.000 I.E. i.v.']},
 ibuprofen:{n:'Ibuprofen',r:'saa',d:['400 mg p.o.','600 mg i.v.']},
 ipratropium:{n:'Ipratropium',d:{saa:['0,5 mg vernebelt','0,25 mg vernebelt','2 mg vernebelt'],sh:['500 µg vernebelt','250 µg vernebelt','2.000 µg vernebelt']}},
 lidocain:{n:'Lidocain',r:'saa',d:['100 mg i.v.','50 mg i.v.']},
 lorazepam:{n:'Lorazepam',r:'sh',d:['1 mg p.o.','5 mg p.o.']},
 metamizol:{n:'Metamizol',r:'sh',d:['1 g als Kurzinfusion','1 g als Bolus i.v.','2,5 g als Kurzinfusion']},
 metoprolol:{n:'Metoprolol',d:{saa:['2 mg i.v.','5 mg i.v. als Bolus'],sh:['1–2 mg langsam i.v.','10 mg als Bolus']}},
 midazolam:{n:'Midazolam',d:{saa:['0,1 mg/kg i.v.','10 mg nasal','2,5 mg buccal','5 mg buccal','10 mg buccal','2 mg i.v. (Analgosedierung)'],sh:['5 mg i.v.','10 mg nasal','2,5 mg buccal','5 mg buccal','10 mg buccal','15 mg i.v.']}},
 morphin:{n:'Morphin',d:['2 mg i.v., fraktioniert','10 mg i.v. als Bolus','20 mg i.v.']},
 nalbuphin:{n:'Nalbuphin',r:'saa',d:['0,2 mg/kg i.v.','2 mg/kg i.v.']},
 naloxon:{n:'Naloxon',d:['0,1 mg i.v., alle 2 Min','0,4 mg i.v. als Bolus','2 mg i.v. als Bolus']},
 nitro:{n:'Glyceroltrinitrat (Nitro)',d:{saa:['0,4 mg s.l. (1 Hub)','1,2 mg s.l. (3 Hübe)','2,4 mg s.l. (6 Hübe)'],sh:['0,4 mg s.l. (1 Hub)','0,8 mg s.l. (2 Hübe)','1,2 mg s.l. (3 Hübe)','2,4 mg s.l. (6 Hübe)']}},
 ondansetron:{n:'Ondansetron',r:'sh',d:['4 mg i.v.','16 mg i.v.']},
 paracetamol:{n:'Paracetamol',d:['1.000 mg als Kurzinfusion','125 mg rektal','250 mg rektal','500 mg rektal']},
 prednisolon:{n:'Prednisolon',d:{saa:['250 mg i.v.','80 mg i.v.','100 mg rektal','1.000 mg i.v.'],sh:['50–100 mg i.v.','250 mg i.v.','100 mg rektal','1.000 mg i.v.']}},
 salbutamol:{n:'Salbutamol',d:{saa:['2,5 mg vernebelt','1,25 mg vernebelt','10 mg vernebelt'],sh:['2,5–5 mg vernebelt','0,5 mg vernebelt','10 mg vernebelt']}},
 txa:{n:'Tranexamsäure',d:{saa:['15 mg/kg als Kurzinfusion (max. 1 g)','3 g als Bolus i.v.'],sh:['1 g als Kurzinfusion','3 g als Bolus i.v.']}},
 urapidil:{n:'Urapidil',d:{saa:['5 mg langsam i.v.','25 mg als Bolus','50 mg als Bolus'],sh:['5–10 mg langsam i.v.','50 mg als Bolus','100 mg als Bolus']}},
};
const regOf=()=>(M&&M.cs&&M.cs.region)||REGION;
const medName=k=>{const n=MEDCAT[k].n;return typeof n==='string'?n:(n[regOf()]||n.saa);};
const medKeys=()=>Object.keys(MEDCAT).filter(k=>!MEDCAT[k].r||MEDCAT[k].r===regOf()).sort((a,b)=>medName(a).localeCompare(medName(b),'de'));
const caseMeds=()=>{const o=[];M.cs.phases.forEach((P,pi)=>P.actions.forEach(a=>{if(a.med&&arr(a.mittel).length)o.push({a,pi});}));return o;};
function medDoses(k){const c=MEDCAT[k].d;const base=Array.isArray(c)?c:(c[regOf()]||c.saa||[]);
  const extra=caseMeds().flatMap(x=>x.a.mittel.filter(m=>m.w===k&&m.d!=='*').map(m=>m.d));return [...new Set([...base,...extra])];}
function medHTML(){
  if(!M.med)return `<button type="button" class="act medopen">${ic('bag')}<span>Medikament geben …</span></button>`;
  if(!M.med.k)return `<div class="medpick"><div class="medtop"><span class="ik">Welcher Wirkstoff?</span><button type="button" class="btn ghost sm" data-medx>Schließen</button></div><div class="medgrid">${medKeys().map(k=>`<button type="button" class="chipbtn" data-medk="${k}">${esc(medName(k))}</button>`).join('')}</div></div>`;
  return `<div class="medpick"><div class="medtop"><span class="ik">${esc(medName(M.med.k))} – Dosis und Weg?</span><button type="button" class="btn ghost sm" data-medback>Zurück</button></div><div class="opts">${M.med.opts.map((d,i)=>`<button type="button" class="opt" data-medd="${i}">${esc(d)}</button>`).join('')}</div></div>`;
}
function bindMed(){const box=$('#medslot');if(!box)return;
  box.onclick=e=>{const t=e.target.closest('button');if(!t||M.q||M.ended)return;
    if(t.classList.contains('medopen')){M.med={};renderPhase();$('#medslot').scrollIntoView({behavior:'smooth',block:'center'});return;}
    if(t.hasAttribute('data-medx')){M.med=null;renderPhase();return;}
    if(t.hasAttribute('data-medback')){M.med={};renderPhase();return;}
    if(t.dataset.medk){const k=t.dataset.medk;M.med={k,opts:shuffle(medDoses(k))};renderPhase();$('#medslot').scrollIntoView({behavior:'smooth',block:'center'});return;}
    if(t.dataset.medd!==undefined)giveMed(M.med.k,M.med.opts[+t.dataset.medd]);};}
function giveMed(k,dose){
  if(M.q||M.ended)return;
  const cm=caseMeds().filter(x=>x.a.mittel.some(m=>m.w===k));
  const hit=cm.find(x=>x.a.mittel.some(m=>m.w===k&&m.d===dose))||cm.find(x=>x.a.mittel.some(m=>m.w===k&&m.d==='*'));
  M.med=null;
  if(hit){if(M.done[hit.pi+':'+hit.a.id]){toast('Schon gegeben');renderPhase();return;}doAction(hit.a,hit.pi);return;}
  const right=cm.find(x=>x.a.typ==='pflicht'||x.a.typ==='sinnvoll');
  const why=right?`Dosis oder Applikationsweg passen nicht. Richtig wäre: ${right.a.text}.`:'Für dieses Medikament gibt es in diesem Fall keine Indikation.';
  const d={pi:M.pi,id:'mw'+M.order.length,text:`${medName(k)} ${dose}`,typ:'falsch',res:right?'Falsche Dosierung':'Nicht indiziert',why,med:true};
  M.order.push(d);(M.medWrong=M.medWrong||[]).push(d);M.mistakes++;M.t+=30;M.v.hf=Math.min(150,M.v.hf+3);
  chime([220],.18,'sawtooth');buzz([60,40,60]);renderVitals();renderPhase();
  const items=document.querySelectorAll('#qcard .alog li');if(items.length)items[items.length-1].scrollIntoView({behavior:'smooth',block:'center'});
}

const playable=()=>CASES.filter(c=>c.status==='aktiv'&&(c.nP+c.nQ)>0);

queueMicrotask(async()=>{
  const db=window.Store||null;
  if(!db){dbState='offline';wState='offline';renderAll();renderFaelle();renderWissen();return;}
  DB=db;
  try{CAN_EDIT=await db.canEdit();}catch(e){CAN_EDIT=false;}
  renderEditMode();
  db.collection('faelle').onSnapshot(snap=>{RAW=snap.docs.map(d=>({id:d.id,data:d.data()}));rebuildCases();dbState='ready';renderAll();renderFaelle();},
    ()=>{dbState='offline';renderAll();renderFaelle();});
  db.collection('wissen').onSnapshot(snap=>{WISSEN=snap.docs.map(d=>({id:d.id,...d.data()}));wState='ready';renderWissen();},
    ()=>{wState='offline';renderWissen();});
});

/* ---------- Ansichten ---------- */
const VIEWS={home:'#home',faelle:'#view-faelle',wissen:'#view-wissen'};
let VIEW='home';
function showView(v){VIEW=v;Object.entries(VIEWS).forEach(([k,sel])=>{$(sel).hidden=k!==v;});
  document.querySelectorAll('.tab').forEach(t=>t.setAttribute('aria-current',t.dataset.v===v?'page':'false'));
  try{localStorage.setItem('wachenalarm.tab',v);}catch(e){}
  window.scrollTo(0,0);if(v==='faelle')renderFaelle();if(v==='wissen')renderWissen();if(v==='home')renderAll();}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>showView(t.dataset.v));

/* ---------- Musterlösung ---------- */
function loesungHTML(cs,run){
  const vv={...cs.v};let rh=cs.rhythm;
  const body=cs.phases.map((P,pi)=>{
    const good=P.actions.filter(a=>a.typ==='pflicht'||a.typ==='sinnvoll'||(a.typ==='neutral'&&!a.auto&&a.warum));
    const bad=P.actions.filter(a=>BADT.includes(a.typ)&&(run||!a.auto));
    const items=good.map(a=>{
      const res=a.ergebnis||defaultResult(a.id,vv,rh);if(a.fx){const {rhythm,...r}=a.fx;Object.assign(vv,r);if(rhythm)rh=rhythm;}
      const did=run?!!run.done[pi+':'+a.id]:null;
      const mark=run?(did?`<span class="mk ok">${ic('check')}</span>`:a.typ==='pflicht'?`<span class="mk no">${ic('x')}</span>`:'<span class="mk skip">–</span>'):`<span class="mk ${a.typ==='pflicht'?'ok':'soft'}">${ic('check')}</span>`;
      return `<li class="la-${a.typ}${run&&!did&&a.typ==='pflicht'?' miss':''}">${mark}<div><p class="lat"><strong>${esc(a.text)}</strong>${a.typ==='pflicht'?'<span class="badge b-pflicht">Pflicht</span>':a.typ==='neutral'?'<span class="badge">Ermessen</span>':'<span class="badge b-sinnvoll">Sinnvoll</span>'}${a.vital?'<span class="badge b-abbruch">Lebenswichtig</span>':''}${badgeHTML(a)}${run&&!did&&a.typ==='pflicht'?'<span class="badge b-miss">verpasst</span>':''}</p><p class="lres">${esc(res)}</p>${a.warum?`<p class="lw">${esc(a.warum)}</p>`:''}</div></li>`;}).join('');
    const qs=P.fragen.map(f=>{const r=f.opts.find(o=>o.ok);const sv=f.opts.filter(o=>o.sev);return `<li class="la-q"><span class="mk q">?</span><div><p class="lat"><strong>${esc(f.q)}</strong>${f.sh?'<span class="badge b-sh">SH</span>':''}${f.reg?'<span class="badge b-reg">Regional</span>':''}</p><p class="lres ok">${esc(r.t)}</p>${r.why?`<p class="lw">${esc(r.why)}</p>`:''}${sv.map(o=>`<p class="lw"><span class="badge b-${o.sev}">${TYPN[o.sev]}</span> ${esc(o.t)}${o.why?' – '+esc(o.why):''}</p>`).join('')}</div></li>`;}).join('');
    const wrong=(run?bad.filter(a=>run.done[pi+':'+a.id]).concat(arr(run.medWrong).filter(w=>w.pi===pi).map(w=>({text:w.text,typ:'falsch',warum:w.why}))):bad);
    const ws=wrong.length?`<div class="lbad"><span class="ik">${run?'Von dir gewählt, aber falsch':'Nicht machen'}</span><ul>${wrong.map(a=>`<li><strong>${esc(a.text)}</strong>${a.typ!=='falsch'?` <span class="badge b-${a.typ}">${TYPN[a.typ]}</span>`:''}${a.warum?' – '+esc(a.warum):''}</li>`).join('')}</ul></div>`:'';
    const hid=arr(P.hidden);
    const nx=hid.length?`<div class="nsextra"><span class="ik">Übernimmt NotSan oder NA</span><ul>${hid.map(a=>`<li><strong>${esc(a.text)}</strong>${a.reg?' <span class="badge b-reg">Regional</span>':''}${a.warum?' – '+esc(a.warum):''}</li>`).join('')}</ul></div>`:'';
    if(!items&&!qs&&!ws&&!nx&&!P.eindruck)return '';
    return `<li class="lphase"><span class="lph">${P.ph}</span><div class="lbody">${P.eindruck?`<p class="lf">Eindruck: ${esc(P.eindruck)}</p>`:''}${items||qs?`<ul class="lacts">${items}${qs}</ul>`:'<p class="lf">Keine besonderen Maßnahmen nötig.</p>'}${ws}${nx}</div></li>`;
  }).join('');
  return `<section class="loesung"><div class="lhead"><span class="label">Musterlösung xABCDE · ${ROLN[cs.role||ROLE]} · ${cs.region==='sh'?'SH':'SAA/BPR'}</span><span class="label">${cs.nP} Pflicht · ${cs.nQ} Fragen</span></div>${cs.regional?`<div class="reginfo"><b>⚑ ${cs.region==='sh'?'SH':'Regional'}</b><span>${esc(cs.regional)}</span></div>`:''}<ol class="lsteps">${body}</ol></section>`;
}
function openLoesung(cs){
  $('#cardinner').innerHTML=`<div class="mtop"><div><span class="label">${esc(cs.stw)}</span><h1>${esc(cs.title)}</h1></div><button class="x" id="cardclose" aria-label="Schließen">${ic('x')}</button></div>
   <p class="patline">${ic('user')}<span>${esc(cs.pat)}${cs.situation?'<br>'+esc(cs.situation):''}</span></p>${loesungHTML(cs)}${cs.card.key||cs.card.see.length?cardHTML(cs):''}
   ${cs.quelle?`<p class="foot">Quelle: ${esc(cs.quelle)}</p>`:''}`;
  $('#cardview').hidden=false;$('#cardview').scrollTop=0;$('#cardclose').onclick=()=>$('#cardview').hidden=true;
}

/* ---------- Fallbibliothek ---------- */
let FFILTER='alle';
function renderFaelle(){
  const el=$('#faelle-list');if(!el)return;
  $('#faelle-actions').hidden=!CAN_EDIT;renderPending('#faelle-pending');
  const n=CASES.length,act=CASES.filter(c=>c.status==='aktiv').length;
  $('#faelle-count').textContent=dbState==='ready'?`${n} ${n===1?'Fall':'Fälle'} · ${act} aktiv`:'';
  document.querySelectorAll('#faelle-filter .chipbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===FFILTER?'true':'false'));
  if(dbState==='loading'){el.innerHTML='<p class="empty">Fallbibliothek wird geladen …</p>';return;}
  if(dbState==='offline'){el.innerHTML='<div class="emptybox"><h3>Fallbibliothek nicht erreichbar</h3><p>Die Fälle konnten nicht geladen werden. Prüfe die Internetverbindung und lade die Seite neu.</p></div>';return;}
  let list=CASES.slice().sort((a,b)=>a.minLevel-b.minLevel||a.title.localeCompare(b.title,'de'));
  if(FFILTER!=='alle')list=list.filter(c=>c.status===FFILTER);
  if(!list.length){el.innerHTML=`<div class="emptybox"><h3>Noch keine Fälle${FFILTER!=='alle'?' in diesem Filter':''}</h3><p>${CAN_EDIT?'Lege mit „Neuer Fall“ deinen ersten Fall an oder importiere mehrere auf einmal als JSON.':'Sobald Fälle angelegt sind, erscheinen sie hier.'}</p></div>`;return;}
  el.innerHTML=list.map(c=>`<article class="frow" data-id="${esc(c.id)}">
    <div class="frow-top"><span class="pill ${c.status}">${c.status==='entwurf'?'Entwurf':'Aktiv'}</span><span class="label">${esc(c.stw)}</span>${c.region==='sh'?(c.ohneAlg?'<span class="badge b-reg">SH: SAA-Basis</span>':'<span class="badge b-sh">SH</span>'):c.regional?'<span class="badge b-reg">Regional</span>':''}</div>
    <h3>${esc(c.title)}</h3>
    <div class="phasebar" aria-label="Abgedeckte Phasen">${PH.map(p=>`<span class="${(()=>{const P=c.phases.find(x=>x.ph===p);return P&&(P.actions.some(a=>a.typ!=='neutral'&&!a.auto)||P.fragen.length)?'on':''})()}">${p}</span>`).join('')}</div>
    <span class="meta">${c.nP} Pflichtmaßnahmen · ${c.nQ} Fragen · ab Level ${c.minLevel} · ${S.plays[c.id]||0}× gefahren</span>
    <div class="frow-act"><button class="btn acc sm" data-a="play" ${c.nP+c.nQ?'':'disabled'}>Fahren</button><button class="btn ghost sm" data-a="loesung" ${c.nP+c.nQ?'':'disabled'}>Musterlösung</button>${CAN_EDIT?'<button class="btn ghost sm" data-a="edit">Bearbeiten</button>':''}</div>
  </article>`).join('');
}
$('#faelle-list').addEventListener('click',e=>{
  const b=e.target.closest('button[data-a]');if(!b)return;const id=b.closest('.frow').dataset.id;const cs=CASES.find(c=>c.id===id);if(!cs)return;
  if(b.dataset.a==='play'){M={cs};showAlarm(cs);}
  if(b.dataset.a==='loesung')openLoesung(cs);
  if(b.dataset.a==='edit')openEditor(id,cs.raw);
});
document.querySelectorAll('#faelle-filter .chipbtn').forEach(b=>b.onclick=()=>{FFILTER=b.dataset.f;renderFaelle();});
$('#btn-neu').onclick=()=>openEditor(null,null);
$('#btn-import').onclick=()=>openImport();

/* ---------- Fall-Editor ---------- */
let ED=null,ED_ID=null;
const blankPhase=()=>({eindruck:'',aktionen:{},eigene:[],fragen:[]});
const blankQ=()=>({nach:'',frage:'',richtig:{text:'',warum:''},falsch:[{text:'',warum:''},{text:'',warum:''}]});
const blankCase=()=>({titel:'',stichwort:'',level:1,status:'entwurf',patient:'',situation:'',quelle:'',regional:'',vitalwerte:{hf:80,sys:120,dia:80,spo2:97,af:14,gcs:15,bz:100,temp:36.8},rhythmus:'sinus',phasen:Object.fromEntries(PH.map(p=>[p,blankPhase()])),steckbrief:{kern:'',erkennen:[],tun:[],vermeiden:[],ns:[]}});
function setPath(o,path,val){const ks=path.split('.');let cur=o;
  for(let i=0;i<ks.length-1;i++){const k=ks[i];if(cur[k]===undefined||cur[k]===null||typeof cur[k]!=='object')cur[k]=/^\d+$/.test(ks[i+1])?[]:{};cur=cur[k];}
  const last=ks[ks.length-1];if(val===undefined)delete cur[last];else cur[last]=val;}
const getPath=(o,path)=>path.split('.').reduce((c,k)=>c==null?undefined:c[k],o);
function slugify(t){return (t||'fall').toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'fall';}
function legacyToPhasen(o){if(Array.isArray(o.schritte)&&!o.phasen){o.phasen={};PH.forEach(p=>o.phasen[p]={eindruck:'',aktionen:{},eigene:[],fragen:o.schritte.filter(s=>s&&s.phase===p).map(s=>({nach:'',frage:s.frage||'',richtig:s.richtig||{text:'',warum:''},falsch:arr(s.falsch)}))});}delete o.schritte;return o;}
function cleanDn(d0){const dn={};d0=d0||{};VF.forEach(([k])=>{if(Number.isFinite(+d0[k])&&d0[k]!==''&&d0[k]!==null)dn[k]=+d0[k];});if(RHY[d0.rhythmus])dn.rhythmus=d0.rhythmus;return dn;}
function cleanCase(d){
  const o=legacyToPhasen(JSON.parse(JSON.stringify(d||{})));const t=v=>String(v??'').trim();
  ['titel','stichwort','patient','situation','quelle','regional'].forEach(k=>o[k]=t(o[k]));
  const roleX=a=>{const r={};if(a.rolle==='rs'||a.rolle==='ns')r.rolle=a.rolle;if(a.regional)r.regional=true;if(a.med)r.med=true;if(TYPES.includes(a.typRS))r.typRS=a.typRS;if(t(a.warumRS))r.warumRS=t(a.warumRS);if(a.lwRS)r.lwRS=true;const mi=arr(a.mittel).filter(m=>m&&m.w&&String(m.d||'').trim()).map(m=>({w:String(m.w),d:String(m.d).trim()}));if(mi.length)r.mittel=mi;return r;};
  o.level=Math.max(1,Math.min(8,Math.round(num(o.level,1))));o.status=o.status==='entwurf'?'entwurf':'aktiv';
  o.rhythmus=RHY[o.rhythmus]?o.rhythmus:'sinus';
  const v=o.vitalwerte||{};o.vitalwerte={};VF.forEach(([k])=>{if(Number.isFinite(+v[k])&&v[k]!==''&&v[k]!==null)o.vitalwerte[k]=+v[k];});
  const ph={};PH.forEach(p=>{const s=(o.phasen||{})[p]||{};const ak={};
    Object.entries(s.aktionen||{}).forEach(([k,a])=>{if(!a||!CAT[p].some(c=>c[0]===k))return;const typ=TYPES.includes(a.typ)?a.typ:'';const er=t(a.ergebnis),wa=t(a.warum),dn=cleanDn(a.danach);
      if(!typ&&!er&&!wa&&!Object.keys(dn).length)return;ak[k]={typ:typ||'neutral',ergebnis:er,warum:wa,danach:typ==='abbruch'?{}:dn,...roleX(a)};if(typ==='pflicht'&&a.lebenswichtig)ak[k].lebenswichtig=true;});
    const eig=arr(s.eigene).filter(e=>e&&t(e.text)).map((e,i)=>({id:t(e.id)||('eig'+i),text:t(e.text),typ:TYPES.includes(e.typ)?e.typ:'neutral',ergebnis:t(e.ergebnis),warum:t(e.warum),danach:cleanDn(e.danach),zeigt:arr(e.zeigt).filter(k=>MONK.includes(k)),...(e.typ==='pflicht'&&e.lebenswichtig?{lebenswichtig:true}:{}),...roleX(e)}));
    const ids=[...CAT[p].map(c=>c[0]),...eig.map(e=>e.id)];
    const fr=arr(s.fragen).map(f=>({nach:ids.includes(t(f?.nach))?t(f.nach):'',frage:t(f?.frage),richtig:{text:t(f?.richtig?.text),warum:t(f?.richtig?.warum)},falsch:arr(f?.falsch).filter(x=>x&&t(x.text)).map(x=>({text:t(x.text),warum:t(x.warum),...(SEV.includes(x.schwer)?{schwer:x.schwer}:{})})),...(f?.rolle==='rs'||f?.rolle==='ns'?{rolle:f.rolle}:{}),...(f?.regional?{regional:true}:{})}))
      .filter(f=>f.frage||f.richtig.text||f.falsch.length);
    ph[p]={eindruck:t(s.eindruck),aktionen:ak,eigene:eig,fragen:fr};});
  o.phasen=ph;
  const sb=o.steckbrief||{};o.steckbrief={kern:t(sb.kern),erkennen:arr(sb.erkennen).map(t).filter(Boolean),tun:arr(sb.tun).map(t).filter(Boolean),vermeiden:arr(sb.vermeiden).map(t).filter(Boolean),ns:arr(sb.ns).map(t).filter(Boolean)};
  delete o._shErr;if(o.sh&&(typeof o.sh!=='object'||!Object.keys(o.sh).length))delete o.sh;delete o.aktualisiert;return o;
}
function validateCase(o){const e=[];
  if(!o.titel)e.push('Titel fehlt');if(!o.stichwort)e.push('Einsatzstichwort fehlt');if(!o.patient)e.push('Patientenbeschreibung fehlt');
  let rated=0;
  PH.forEach(p=>{const s=o.phasen[p];
    Object.entries(s.aktionen).forEach(([k,a])=>{if(a.typ==='pflicht')rated++;if(BADT.includes(a.typ)&&!a.warum)e.push(`${p} · ${catName(p,k)}: Begründung, warum das falsch ist, fehlt`);});
    s.eigene.forEach(a=>{if(a.typ==='pflicht')rated++;if(BADT.includes(a.typ)&&!a.warum)e.push(`${p} · ${a.text}: Begründung, warum das falsch ist, fehlt`);});
    s.fragen.forEach((f,i)=>{rated++;const n=`${p} · Frage ${i+1}`;if(!f.frage)e.push(`${n}: Frage fehlt`);if(!f.richtig.text)e.push(`${n}: richtige Antwort fehlt`);if(!f.richtig.warum)e.push(`${n}: Begründung der richtigen Antwort fehlt`);if(!f.falsch.length)e.push(`${n}: mindestens eine falsche Antwort fehlt`);});});
  if(!rated)e.push('Mindestens eine Pflichtmaßnahme oder eine Frage fehlt');
  return e;}
function dbErr(e){const c=e&&e.code;
  if(c==='invalid_argument')return 'Speichern abgelehnt. Schalte unten auf der Wache den Bearbeitungsmodus ein.';
  if(c==='quota_exceeded')return 'Der Browserspeicher ist voll. Exportiere deine Änderungen und verwirf sie danach.';
  if(c==='resource_exhausted')return 'Zu viele Änderungen auf einmal. Warte kurz und speichere erneut.';
  return 'Speichern hat nicht geklappt. Prüfe deine Verbindung und versuche es erneut.';}

function openEditor(id,raw){
  ED_ID=id;ED=raw?legacyToPhasen(JSON.parse(JSON.stringify(raw))):blankCase();
  delete $('#edinner').dataset.mode;
  ED.phasen=ED.phasen||{};PH.forEach(p=>{const s=Object.assign(blankPhase(),ED.phasen[p]||{});s.aktionen=s.aktionen||{};s.eigene=arr(s.eigene);
    s.fragen=arr(s.fragen).map(f=>{f=Object.assign(blankQ(),f);f.falsch=arr(f.falsch).slice(0,3);while(f.falsch.length<2)f.falsch.push({text:'',warum:''});return f;});ED.phasen[p]=s;});
  ED.vitalwerte=ED.vitalwerte||{};ED.steckbrief=Object.assign({kern:'',erkennen:[],tun:[],vermeiden:[],ns:[]},ED.steckbrief||{});
  renderEditor();$('#editor').hidden=false;$('#editor').scrollTop=0;
}
const pid=path=>'ed-'+path.replace(/\./g,'-');
const fld=(label,path,attrs='',hint='')=>`<label class="fld"><span>${label}${hint?` <small>${hint}</small>`:''}</span><input id="${pid(path)}" data-f="${path}" value="${esc(getPath(ED,path)??'')}" ${attrs}></label>`;
const area=(label,path,rows=2,hint='',ph='')=>{const v=getPath(ED,path);return `<label class="fld"><span>${label}${hint?` <small>${hint}</small>`:''}</span><textarea id="${pid(path)}" rows="${rows}" data-f="${path}" ${Array.isArray(v)?'data-list="1"':''} placeholder="${esc(ph)}">${esc(Array.isArray(v)?v.join('\n'):(v??''))}</textarea></label>`;};
const dnGrid=(path,dn,lbl='Monitor danach')=>`<details ${Object.keys(dn||{}).length?'open':''}><summary>${lbl} <small>optional</small></summary><div class="vgrid">${VF.map(([k,l])=>`<label class="fld"><span>${l}</span><input id="${pid(path+'.'+k)}" type="number" step="any" inputmode="decimal" data-f="${path}.${k}" value="${esc((dn||{})[k]??'')}" placeholder="–"></label>`).join('')}
   <label class="fld"><span>Rhythmus</span><select id="${pid(path+'.rhythmus')}" data-f="${path}.rhythmus"><option value="">unverändert</option>${Object.entries(RHY).map(([k,l])=>`<option value="${k}" ${(dn||{}).rhythmus===k?'selected':''}>${l}</option>`).join('')}</select></label></div></details>`;
function actionRow(path,label,o,custom,p,i){
  const typ=o.typ||'';const open=custom||!!typ;
  const base=[['pflicht','Pflicht'],['sinnvoll','Sinnvoll'],['falsch','Falsch'],['gefahr','Gefährlich · Warnung'],['abbruch','Grober Fehler · Abbruch']];const opts=custom?[['neutral','Ohne Wertung'],...base]:[['','—'],...base,['neutral','Ohne Wertung']];const bad=BADT.includes(typ);
  return `<div class="arow t-${typ||'none'}">
    <div class="arow-h">${custom?`<input id="${pid(path+'.text')}" data-f="${path}.text" value="${esc(o.text||'')}" placeholder="Eigene Maßnahme, z. B. Wunde inspizieren" aria-label="Name der Maßnahme">`:`<span class="aname">${esc(label)}</span>`}
     <select id="${pid(path+'.typ')}" data-f="${path}.typ" data-rr="1" aria-label="Bewertung">${opts.map(([v,l])=>`<option value="${v}" ${(typ||(custom?'neutral':''))===v?'selected':''}>${l}</option>`).join('')}</select>
     ${custom?`<button type="button" class="btn ghost sm" data-ea="deleig" data-p="${p}" data-i="${i}" aria-label="Maßnahme entfernen">✕</button>`:''}</div>
    ${open?`<div class="arow-b">
      ${typ==='gefahr'?'<p class="sevnote">Stopp-Hinweis erscheint, zählt als grober Fehler. Der Einsatz läuft weiter.</p>':typ==='abbruch'?'<p class="sevnote">Der Einsatz endet sofort mit Auswertung.</p>':''}
      ${!bad?`<input id="${pid(path+'.ergebnis')}" data-f="${path}.ergebnis" value="${esc(o.ergebnis||'')}" placeholder="Ergebnis, das man bekommt${custom?'':' (leer = Standard)'}" aria-label="Ergebnis">`:''}
      <textarea id="${pid(path+'.warum')}" rows="2" data-f="${path}.warum" placeholder="${bad?'Warum ist das hier falsch oder gefährlich? (Pflicht)':'Warum ist das wichtig? (Lerntext)'}" aria-label="Begründung">${esc(o.warum||'')}</textarea>
      ${typ==='pflicht'?`<label class="chk"><input type="checkbox" id="${pid(path+'.lebenswichtig')}" data-f="${path}.lebenswichtig" ${o.lebenswichtig?'checked':''}> Lebenswichtig: fehlt sie beim Verlassen der Phase, endet der Einsatz</label>`:''}
      <div class="rolechk">${custom?`<label>Rolle <select id="${pid(path+'.rolle')}" data-f="${path}.rolle"><option value="">RS + NotSan</option><option value="rs" ${o.rolle==='rs'?'selected':''}>nur RS</option><option value="ns" ${o.rolle==='ns'?'selected':''}>nur NotSan</option></select></label><label><input type="checkbox" id="${pid(path+'.med')}" data-f="${path}.med" data-rr="1" ${o.med?'checked':''}> Medikament</label>${o.med?`<label>Wirkstoff <select id="${pid(path+'.mittel.0.w')}" data-f="${path}.mittel.0.w"><option value="">—</option>${Object.keys(MEDCAT).map(k=>`<option value="${k}" ${arr(o.mittel)[0]&&o.mittel[0].w===k?'selected':''}>${esc(typeof MEDCAT[k].n==='string'?MEDCAT[k].n:MEDCAT[k].n.saa+' / '+MEDCAT[k].n.sh)}</option>`).join('')}</select></label><label>Dosis <input id="${pid(path+'.mittel.0.d')}" data-f="${path}.mittel.0.d" value="${esc((arr(o.mittel)[0]||{}).d||'')}" placeholder="z. B. 5.000 I.E. i.v. oder *" style="width:150px"></label>`:''}`:(CAT[p].find(c=>c[0]===path.split('.').pop())||[])[4]==='ns'?'<span class="badge b-ns">nur NotSan</span>':''}<label><input type="checkbox" id="${pid(path+'.regional')}" data-f="${path}.regional" ${o.regional?'checked':''}> Regional unterschiedlich</label></div>
      ${!bad||typ==='gefahr'?dnGrid(path+'.danach',o.danach,typ==='gefahr'?'Folge für den Patienten':'Monitor danach'):''}</div>`:''}
  </div>`;
}
function frageHTML(p,i,f){
  const base=`phasen.${p}.fragen.${i}`;const P=ED.phasen[p];
  const trig=[['','Am Ende der Phase'],...CAT[p].map(c=>[c[0],'Nach: '+c[1]]),...P.eigene.filter(e=>e.text).map(e=>[e.id,'Nach: '+e.text])];
  return `<div class="qedit"><div class="arow-h"><span class="aname">Entscheidungsfrage ${i+1}</span><button type="button" class="btn ghost sm" data-ea="delq" data-p="${p}" data-i="${i}">Entfernen</button></div>
   <label class="fld"><span>Wann wird gefragt?</span><select id="${pid(base+'.nach')}" data-f="${base}.nach">${trig.map(([v,l])=>`<option value="${esc(v)}" ${f.nach===v?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
   <div class="rolechk"><label>Rolle <select id="${pid(base+'.rolle')}" data-f="${base}.rolle"><option value="">RS + NotSan</option><option value="rs" ${f.rolle==='rs'?'selected':''}>nur RS</option><option value="ns" ${f.rolle==='ns'?'selected':''}>nur NotSan</option></select></label><label><input type="checkbox" id="${pid(base+'.regional')}" data-f="${base}.regional" ${f.regional?'checked':''}> Regional unterschiedlich</label></div>
   <input id="${pid(base+'.frage')}" data-f="${base}.frage" value="${esc(f.frage)}" placeholder="Frage, z. B. Befund?" aria-label="Frage">
   <div class="ans ok"><span class="ansl">${ic('check')} Richtige Antwort</span><input id="${pid(base+'.richtig.text')}" data-f="${base}.richtig.text" value="${esc(f.richtig.text)}" aria-label="Richtige Antwort"><textarea id="${pid(base+'.richtig.warum')}" rows="2" data-f="${base}.richtig.warum" placeholder="Warum?" aria-label="Begründung">${esc(f.richtig.warum)}</textarea></div>
   ${[0,1,2].map(k=>`<div class="ans no"><span class="ansl">${ic('x')} Falsche Antwort ${k+1}${k===2?' · optional':''}</span><input id="${pid(base+'.falsch.'+k+'.text')}" data-f="${base}.falsch.${k}.text" value="${esc(f.falsch[k]?.text||'')}" aria-label="Falsche Antwort ${k+1}"><textarea id="${pid(base+'.falsch.'+k+'.warum')}" rows="2" data-f="${base}.falsch.${k}.warum" placeholder="Warum falsch?" aria-label="Begründung">${esc(f.falsch[k]?.warum||'')}</textarea><select id="${pid(base+'.falsch.'+k+'.schwer')}" data-f="${base}.falsch.${k}.schwer" aria-label="Schwere"><option value="">Normaler Fehler</option><option value="gefahr" ${f.falsch[k]?.schwer==='gefahr'?'selected':''}>Gefährlich · Warnung</option><option value="abbruch" ${f.falsch[k]?.schwer==='abbruch'?'selected':''}>Grober Fehler · Abbruch</option></select></div>`).join('')}
  </div>`;
}
function phaseHTML(p){
  const P=ED.phasen[p];const base=`phasen.${p}`;
  const nRated=Object.values(P.aktionen).filter(a=>a&&a.typ).length+P.eigene.length+P.fragen.length;
  return `<details class="estep phase" ${nRated||P.eindruck?'open':''} data-ph="${p}"><summary><span class="lph">${p}</span><span class="pname">${PHN[p]}</span><span class="pcount">${nRated?nRated+' bewertet':'leer'}</span></summary>
   ${area('Erster Eindruck',base+'.eindruck',2,'','Was sieht man sofort, ohne zu untersuchen?')}
   <div class="arows"><span class="sub">Maßnahmen bewerten <small>nur bewertete brauchen Text</small></span>${CAT[p].map(([aid,text])=>actionRow(`${base}.aktionen.${aid}`,text,P.aktionen[aid]||{},false,p)).join('')}
    ${P.eigene.map((e,i)=>actionRow(`${base}.eigene.${i}`,null,e,true,p,i)).join('')}</div>
   <div class="ebar"><button type="button" class="btn ghost sm" data-ea="addeig" data-p="${p}">Eigene Maßnahme</button><button type="button" class="btn ghost sm" data-ea="addq" data-p="${p}">Entscheidungsfrage</button></div>
   ${P.fragen.map((f,i)=>frageHTML(p,i,f)).join('')}
  </details>`;
}
function renderEditor(errs){
  const keepOpen=[...document.querySelectorAll('#edinner details.phase[open]')].map(d=>d.dataset.ph);
  $('#edinner').innerHTML=`<div class="mtop"><div><span class="label">Fallbibliothek</span><h1>${ED_ID?'Fall bearbeiten':'Neuer Fall'}</h1></div><button class="x" data-ea="cancel" aria-label="Editor schließen">${ic('x')}</button></div>
   ${errs&&errs.length?`<div class="fb no" id="ed-errs"><div><strong>Noch nicht speicherbar</strong><ul class="errl">${errs.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div></div>`:''}
   <section class="esec"><h2>Einsatz</h2>
    ${fld('Titel','titel','placeholder="z. B. Anaphylaxie nach Wespenstich"')}
    <div class="erow2">${fld('Einsatzstichwort','stichwort','placeholder="RD 2 · Atemnot"')}${fld('Ab Level','level','type="number" min="1" max="8" inputmode="numeric"')}</div>
    ${area('Patient bei Ankunft','patient',2,'was man sofort sieht','Frau, 34 J. · sitzt auf der Terrasse, Gesicht geschwollen')}
    ${area('Situation','situation',2,'optional · Einsatzort, Meldung, Angehörige','Ehemann: Sie wurde vor 10 Minuten gestochen.')}
    ${area('Regionaler Hinweis','regional',2,'optional · was je nach Land/ÄLRD abweicht','z. B. Medikamente nur nach Freigabe durch den ÄLRD')}
    <div class="erow2"><label class="fld"><span>Status</span><select id="ed-status" data-f="status"><option value="entwurf" ${ED.status!=='aktiv'?'selected':''}>Entwurf · nur in der Liste</option><option value="aktiv" ${ED.status==='aktiv'?'selected':''}>Aktiv · kommt als Alarm</option></select></label>${fld('Quelle','quelle','placeholder="z. B. SAA SH 2026, eigener Einsatz"')}</div>
   </section>
   <section class="esec"><h2>Echte Werte des Patienten</h2><p class="hint">Diese Werte sind am Monitor erst sichtbar, wenn die passende Maßnahme durchgeführt wurde.</p>
    <div class="vgrid">${VF.map(([k,l])=>`<label class="fld"><span>${l}</span><input id="ed-v-${k}" type="number" step="any" inputmode="decimal" data-f="vitalwerte.${k}" value="${esc(ED.vitalwerte[k]??'')}"></label>`).join('')}
     <label class="fld"><span>Rhythmus</span><select id="ed-rhythmus" data-f="rhythmus">${Object.entries(RHY).map(([k,l])=>`<option value="${k}" ${ED.rhythmus===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
   </section>
   <section class="esec"><h2>Ablauf xABCDE</h2><p class="hint">Pro Phase: erster Eindruck, dann bewertest du die Maßnahmen. Nicht bewertete Maßnahmen kann man trotzdem wählen; sie liefern das Standardergebnis aus den Werten oben.</p>
    ${PH.map(phaseHTML).join('')}
   </section>
   <section class="esec"><h2>Steckbrief</h2>
    ${fld('Kernaussage','steckbrief.kern','placeholder="z. B. Adrenalin i.m. zuerst"')}
    ${area('Erkennen','steckbrief.erkennen',3,'eine Zeile pro Punkt')}
    ${area('Tun','steckbrief.tun',3,'eine Zeile pro Schritt, in Reihenfolge')}
    ${area('Vermeiden','steckbrief.vermeiden',2,'eine Zeile pro Punkt')}
    ${area('NotSan nach SAA','steckbrief.ns',3,'eine Zeile pro Punkt · Medikamente, Dosierungen')}
   </section>
   <section class="esec"><h2>Abweichungen in SH</h2><p class="hint">Was im Regelwerk Schleswig-Holstein anders gilt. Ersetzte Aktionen, eigene Maßnahmen (nach id) und Fragen (nach Nummer) werden komplett übernommen. Leer lassen, wenn nichts abweicht.</p>
    <label class="fld"><span>SH-Overlay <small>JSON: regional, quelle, steckbrief, phasen.{x–E}.aktionen / eigene / fragen / eigeneNeu / fragenNeu</small></span><textarea id="ed-shjson" rows="6" class="mono" spellcheck="false">${ED.sh?esc(JSON.stringify(ED.sh,null,1)):''}</textarea></label>
   </section>
   <div class="ebar"><button type="button" class="btn acc" data-ea="save">Speichern</button><button type="button" class="btn ghost" data-ea="test">Probefahren</button>${ED_ID?'<button type="button" class="btn ghost danger" data-ea="delete">Löschen</button>':''}</div>
   <div id="ed-confirm"></div>`;
  keepOpen.forEach(p=>{const d=document.querySelector(`#edinner details.phase[data-ph="${p}"]`);if(d)d.open=true;});
}
function rerender(){const st=$('#editor').scrollTop;renderEditor();$('#editor').scrollTop=st;}
$('#edinner').addEventListener('input',e=>{
  const el=e.target;
  if(el.id==='ed-shjson'&&ED){const t=el.value.trim();if(!t){delete ED.sh;delete ED._shErr;return;}try{const v=JSON.parse(t);if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Objekt erwartet');ED.sh=v;delete ED._shErr;}catch(err){ED._shErr=err.message;}return;}
  const f=el.dataset&&el.dataset.f;const mode=$('#edinner').dataset.mode;if(!f||!ED||mode==='wissen'||mode==='import')return;
  let val=el.value;
  if(el.type==='checkbox')val=el.checked?true:undefined;
  else if(el.type==='number')val=el.value===''?undefined:Number(el.value);
  else if(el.dataset.list)val=el.value.split('\n').map(s=>s.trim()).filter(Boolean);
  else if(el.tagName==='SELECT'&&val==='')val=undefined;
  setPath(ED,f,val);
  if(el.dataset.rr){const keepFocus=el.id;rerender();const n=document.getElementById(keepFocus);if(n)n.focus({preventScroll:true});}
});
$('#edinner').addEventListener('click',async e=>{
  const b=e.target.closest('[data-ea]');if(!b)return;const mode=$('#edinner').dataset.mode;
  if(mode==='wissen')return wEditorAction(b);
  if(mode==='import')return importAction(b);
  const a=b.dataset.ea,p=b.dataset.p,i=+b.dataset.i;
  if(a==='cancel'){$('#editor').hidden=true;return;}
  if(a==='addeig'){ED.phasen[p].eigene.push({id:'eig'+Date.now().toString(36),text:'',typ:'pflicht',ergebnis:'',warum:''});rerender();return;}
  if(a==='deleig'){ED.phasen[p].eigene.splice(i,1);rerender();return;}
  if(a==='addq'){ED.phasen[p].fragen.push(blankQ());rerender();return;}
  if(a==='delq'){ED.phasen[p].fragen.splice(i,1);rerender();return;}
  const doc=cleanCase(ED);const errs=validateCase(doc);if(ED._shErr)errs.push('SH-Overlay ist kein gültiges JSON: '+ED._shErr);
  if(a==='test'){if(errs.length){renderEditor(errs);$('#editor').scrollTop=0;return;}const cs=forRole(toCase('probe',withRegion(doc,REGION),doc),ROLE);$('#editor').hidden=true;M={cs,probe:true};showAlarm(cs);return;}
  if(a==='save'){if(errs.length){renderEditor(errs);$('#editor').scrollTop=0;return;}
    if(!DB){toast('Keine Datenbank verbunden');return;}
    b.disabled=true;b.textContent='Speichert …';doc.aktualisiert=new Date().toISOString();
    const id=ED_ID||slugify(doc.titel)+'-'+Date.now().toString(36).slice(-4);
    try{await DB.collection('faelle').doc(id).set(doc);$('#editor').hidden=true;toast(ED_ID?'Fall gespeichert':'Fall angelegt');}
    catch(err){renderEditor([dbErr(err)]);$('#editor').scrollTop=0;}
    return;}
  if(a==='delete'){$('#ed-confirm').innerHTML=`<div class="fb no"><div style="flex:1"><strong>Fall endgültig löschen?</strong>„${esc(ED.titel)}“ verschwindet für alle aus der Bibliothek.<div class="ebar"><button type="button" class="btn danger-solid" data-ea="delyes">Löschen</button><button type="button" class="btn ghost" data-ea="delno">Behalten</button></div></div></div>`;$('#ed-confirm').scrollIntoView({behavior:'smooth'});return;}
  if(a==='delno'){$('#ed-confirm').innerHTML='';return;}
  if(a==='delyes'){try{await DB.collection('faelle').doc(ED_ID).delete();$('#editor').hidden=true;toast('Fall gelöscht');}catch(err){$('#ed-confirm').innerHTML=`<p class="hint">${esc(dbErr(err))}</p>`;}}
});

/* ---------- JSON-Import ---------- */
const TEMPLATE={titel:'Anaphylaxie nach Wespenstich',stichwort:'RD 2 · Atemnot',level:1,status:'entwurf',
  patient:'Frau, 34 J. · sitzt auf der Terrasse, Gesicht gerötet und geschwollen',situation:'Ehemann: Sie wurde vor 10 Minuten in den Hals gestochen.',quelle:'SAA und BPR 2025 · BPR Anaphylaxie',regional:'Medikamente nur nach Freigabe durch deinen ÄLRD.',
  vitalwerte:{hf:124,sys:88,dia:52,spo2:91,af:26,gcs:15,bz:105,temp:36.9},rhythmus:'sinus',
  phasen:{
    x:{eindruck:'Keine Blutung zu sehen.',aktionen:{tourniquet:{typ:'falsch',warum:'Keine Blutung – kein Tourniquet.'}},eigene:[],fragen:[]},
    A:{eindruck:'Sie spricht heiser.',aktionen:{ansprechen:{typ:'pflicht',ergebnis:'Heisere Stimme: „Mein Hals wird eng.“',warum:'Heiserkeit und Engegefühl zeigen eine drohende Atemwegsverlegung.'},mund:{typ:'sinnvoll',ergebnis:'Zunge und Lippen geschwollen',warum:''},guedel:{typ:'falsch',warum:'Bei wachen Patienten löst das Würgen aus.'}},
      eigene:[],fragen:[{nach:'',frage:'Wichtigste Maßnahme jetzt?',richtig:{text:'Adrenalin i.m. nach SAA',warum:'Adrenalin wirkt gegen Schwellung, Bronchospasmus und Schock.'},falsch:[{text:'Erst Antihistaminikum abwarten',warum:'Wirkt zu langsam und nicht auf Atemweg und Kreislauf.'},{text:'Kühlen und beobachten',warum:'Bei Atemwegsbeteiligung ist Abwarten gefährlich.'}]}]},
    B:{eindruck:'Atmet schnell.',aktionen:{spo2:{typ:'pflicht',warum:'Sättigung zeigt, wie stark die Atmung betroffen ist.'},o2:{typ:'pflicht',ergebnis:'O₂ über Maske',warum:'SpO₂ unter 94 % bei Anaphylaxie: Sauerstoff geben.',danach:{spo2:95}}},eigene:[],fragen:[]},
    C:{eindruck:'',aktionen:{rr:{typ:'pflicht',warum:'Hypotonie zeigt den anaphylaktischen Schock.'},na:{typ:'pflicht',warum:'Kritischer Notfall.',regional:true}},eigene:[{id:'adrenalin',text:'Epinephrin 0,5 mg i.m.',typ:'pflicht',warum:'Ab Grad II: Epinephrin i.m.',rolle:'ns',med:true,regional:true,lebenswichtig:true,danach:{sys:108}}],fragen:[{nach:'',rolle:'rs',frage:'Welches Medikament ist lebensrettend?',richtig:{text:'Epinephrin i.m.',warum:'Wirkt gegen Schwellung, Bronchospasmus und Schock.'},falsch:[{text:'Antihistaminikum',warum:'Wirkt zu langsam.'}]}]},
    D:{eindruck:'',aktionen:{},eigene:[],fragen:[]},
    E:{eindruck:'Quaddeln an Hals und Armen.',aktionen:{},eigene:[{id:'stachel',text:'Einstichstelle ansehen',typ:'sinnvoll',ergebnis:'Stachel steckt noch am Hals',warum:'Stachel vorsichtig entfernen.'}],fragen:[]}
  },
  steckbrief:{kern:'Adrenalin i.m. ist die wichtigste Maßnahme',erkennen:['Haut, Atemweg, Kreislauf nach Auslöser'],tun:['Auslöser stoppen','NA hinzuziehen','Liegend transportieren'],vermeiden:['Abwarten bei Atemwegsbeteiligung'],ns:['Epinephrin 0,5 mg i.m. (> 12 J)']}};
function openImport(){
  $('#edinner').dataset.mode='import';
  $('#edinner').innerHTML=`<div class="mtop"><div><span class="label">Fallbibliothek</span><h1>Fälle importieren</h1></div><button class="x" data-ea="cancel" aria-label="Import schließen">${ic('x')}</button></div>
   <p class="hint">Füge einen Fall oder eine Liste von Fällen im JSON-Format ein. So kannst du dir Fälle auch von Claude schreiben lassen und hier einfügen.</p>
   <label class="fld"><span>JSON</span><textarea id="imp-json" rows="12" spellcheck="false" class="mono" placeholder='[{"titel": "…", "schritte": […]}]'></textarea></label>
   <div id="imp-msg"></div>
   <div class="ebar"><button type="button" class="btn acc" data-ea="import">Importieren</button><button type="button" class="btn ghost" data-ea="tpl">Vorlage einfügen</button><button type="button" class="btn ghost" data-ea="copy">Vorlage kopieren</button></div>
   <details class="tplbox"><summary>Aufbau eines Falls</summary><pre class="mono" id="imp-tpl">${esc(JSON.stringify(TEMPLATE,null,2))}</pre></details>`;
  $('#editor').hidden=false;$('#editor').scrollTop=0;
}
async function importAction(b){
  const a=b.dataset.ea;const msg=$('#imp-msg');
  if(a==='cancel'){$('#editor').hidden=true;delete $('#edinner').dataset.mode;return;}
  if(a==='tpl'){$('#imp-json').value=JSON.stringify([TEMPLATE],null,2);return;}
  if(a==='copy'){const t=JSON.stringify(TEMPLATE,null,2);try{await navigator.clipboard.writeText(t);toast('Vorlage kopiert');}catch(e){const pre=$('#imp-tpl');pre.closest('details').open=true;const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);toast('Vorlage markiert – jetzt kopieren');}return;}
  if(a==='import'){
    let data;try{data=JSON.parse($('#imp-json').value);}catch(e){msg.innerHTML=`<div class="fb no"><div><strong>Kein gültiges JSON</strong>${esc(e.message)}</div></div>`;return;}
    const list=Array.isArray(data)?data:[data];const docs=list.map(cleanCase);
    const errs=[];docs.forEach((d,i)=>validateCase(d).forEach(x=>errs.push(`Fall ${i+1}${d.titel?' „'+d.titel+'“':''}: ${x}`)));
    if(errs.length){msg.innerHTML=`<div class="fb no"><div><strong>Bitte korrigieren</strong><ul class="errl">${errs.slice(0,12).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div>`;return;}
    if(!DB){msg.innerHTML='<p class="hint">Keine Datenbank verbunden.</p>';return;}
    b.disabled=true;let ok=0;
    for(const d of docs){d.aktualisiert=new Date().toISOString();const id=slugify(d.titel)+'-'+Date.now().toString(36).slice(-4)+ok;
      try{await DB.collection('faelle').doc(id).set(d);ok++;}catch(err){msg.innerHTML=`<div class="fb no"><div><strong>${ok} von ${docs.length} importiert</strong>${esc(dbErr(err))}</div></div>`;b.disabled=false;return;}}
    $('#editor').hidden=true;delete $('#edinner').dataset.mode;toast(`${ok} ${ok===1?'Fall':'Fälle'} importiert`);showView('faelle');
  }
}

/* ---------- Wissen ---------- */
let WCAT='Alle',WQ='';
const MODULES=[
  {id:'organe',cat:'Anatomie',title:'Wo liegt was?',sub:'Organe & Bauchquadranten',kw:'organe lage bauch quadrant leber milz niere herz lunge magen darm blinddarm appendix galle pankreas blase zwerchfell trachea'},
  {id:'zelle',cat:'Anatomie',title:'Die Zelle',sub:'Organellen & ihre Aufgaben',kw:'zelle mitochondrien zellkern membran ribosom golgi lysosom er atp zellatmung'},
  {id:'muskel',cat:'Anatomie',title:'Muskulatur',sub:'Drei Muskeltypen & Aufbau',kw:'muskel skelettmuskel herzmuskel glatte muskulatur sarkomer aktin myosin faser'},
  {id:'kreislauf',cat:'Physiologie',title:'Herz & Kreislauf',sub:'Blutfluss & Erregungsleitung',kw:'herz kreislauf blutfluss vorhof kammer klappe sinusknoten av-knoten erregungsleitung his tawara purkinje'},
  {id:'normwerte',cat:'Normwerte',title:'Normwerte',sub:'Erwachsene, Kinder, Säuglinge',kw:'normwerte vitalwerte herzfrequenz atemfrequenz blutdruck spo2 blutzucker kinder säugling temperatur'},
];
/* Wissen nach Regelwerk: nurRegion blendet aus, sh überlagert Kern, Punkte, Merke, Quelle */
const wView=w=>REGION==='sh'&&w.sh&&typeof w.sh==='object'?{...w,...w.sh,_sh:true}:w;
const wVisible=()=>WISSEN.filter(w=>!w.nurRegion||w.nurRegion===REGION).map(wView);
function renderWissen(){
  const box=$('#wissen-body');if(!box)return;const WV=wVisible();
  $('#wissen-actions').hidden=!CAN_EDIT;renderPending('#wissen-pending');
  const cats=['Alle',...WCATS.filter(c=>c==='Anatomie'||c==='Physiologie'||c==='Normwerte'||WV.some(w=>w.kategorie===c))];
  $('#wissen-cats').innerHTML=cats.map(c=>`<button type="button" class="chipbtn" data-c="${esc(c)}" aria-pressed="${c===WCAT}">${esc(c)}</button>`).join('');
  const q=WQ.trim().toLowerCase();
  const mods=MODULES.filter(m=>(WCAT==='Alle'||m.cat===WCAT)&&(!q||(m.title+' '+m.sub+' '+m.kw).toLowerCase().includes(q)));
  let ents=WV.filter(w=>(WCAT==='Alle'||w.kategorie===WCAT)&&(!q||[w.titel,w.kern,w.merke,...arr(w.punkte),...arr(w.tags)].join(' ').toLowerCase().includes(q)));
  ents.sort((a,b)=>String(a.kategorie).localeCompare(String(b.kategorie),'de')||String(a.titel).localeCompare(String(b.titel),'de'));
  let h='';
  if(mods.length)h+=`<div class="sectionhead"><h2>Interaktiv</h2><span class="label">antippen zum Erkunden</span></div><div class="mods">${mods.map(m=>`<button type="button" class="mod" data-m="${m.id}"><span class="modart" aria-hidden="true">${MODART[m.id]}</span><span class="modtxt"><span class="label">${esc(m.cat)}</span><strong>${esc(m.title)}</strong><span>${esc(m.sub)}</span></span></button>`).join('')}</div>`;
  h+=`<div class="sectionhead"><h2>Nachschlagen</h2><span class="label">${wState==='ready'?ents.length+' Einträge':''}</span></div>`;
  if(wState==='loading')h+='<p class="empty">Einträge werden geladen …</p>';
  else if(wState==='offline')h+='<div class="emptybox"><h3>Einträge nicht erreichbar</h3><p>Die Einträge konnten nicht geladen werden. Prüfe die Internetverbindung und lade die Seite neu.</p></div>';
  else if(!ents.length)h+=`<div class="emptybox"><h3>${q?'Nichts gefunden':'Noch keine Einträge'}</h3><p>${q?'Probier einen anderen Begriff.':CAN_EDIT?'Lege mit „Neuer Eintrag“ den ersten an.':'Sobald Einträge angelegt sind, erscheinen sie hier.'}</p></div>`;
  else h+=`<div class="wlist">${ents.map(w=>`<details class="wcard" data-id="${esc(w.id)}"><summary><span class="badges"><span class="pill cat">${esc(w.kategorie||'Sonstiges')}</span>${w.rolle==='ns'?'<span class="badge b-ns">NotSan</span>':''}${w._sh||w.nurRegion==='sh'?'<span class="badge b-sh">SH</span>':''}${w.nurRegion==='saa'?'<span class="badge b-reg">nur SAA/BPR</span>':''}${w.regional?'<span class="badge b-reg">Regional</span>':''}</span><h3>${esc(w.titel)}</h3>${w.kern?`<p class="wk">${esc(w.kern)}</p>`:''}</summary>
     ${arr(w.punkte).length?`<ul class="wp">${arr(w.punkte).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}
     ${w.merke?`<div class="merke"><strong>Merke</strong>${esc(w.merke)}</div>`:''}
     ${arr(w.tags).length?`<div class="chips">${arr(w.tags).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>`:''}
     ${w.quelle?`<p class="foot" style="margin:8px 0 0">Quelle: ${esc(w.quelle)}</p>`:''}
     ${CAN_EDIT?`<div class="ebar"><button type="button" class="btn ghost sm" data-we="${esc(w.id)}">Bearbeiten</button></div>`:''}</details>`).join('')}</div>`;
  box.innerHTML=h;
}
$('#wissen-q').addEventListener('input',e=>{WQ=e.target.value;renderWissen();});
$('#wissen-cats').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;WCAT=b.dataset.c;renderWissen();});
$('#wissen-body').addEventListener('click',e=>{
  const m=e.target.closest('[data-m]');if(m){openModule(m.dataset.m);return;}
  const w=e.target.closest('[data-we]');if(w){const ent=WISSEN.find(x=>x.id===w.dataset.we);if(ent)openWEditor(ent.id,ent);}
});
$('#btn-wneu').onclick=()=>openWEditor(null,null);

/* Wissen-Editor */
let WED=null,WED_ID=null;
function openWEditor(id,ent){
  WED_ID=id;WED=ent?{kategorie:ent.kategorie||'Sonstiges',titel:ent.titel||'',kern:ent.kern||'',punkte:arr(ent.punkte),merke:ent.merke||'',tags:arr(ent.tags),rolle:ent.rolle||'',regional:!!ent.regional,quelle:ent.quelle||'',nurRegion:ent.nurRegion||'',sh:ent.sh&&typeof ent.sh==='object'?ent.sh:null}:{kategorie:WCAT!=='Alle'?WCAT:'Leitsymptome',titel:'',kern:'',punkte:[],merke:'',tags:[],rolle:'',regional:false,quelle:'',nurRegion:'',sh:null};
  const ed=$('#edinner');ed.dataset.mode='wissen';
  ed.innerHTML=`<div class="mtop"><div><span class="label">Wissen</span><h1>${id?'Eintrag bearbeiten':'Neuer Eintrag'}</h1></div><button class="x" data-ea="cancel" aria-label="Editor schließen">${ic('x')}</button></div>
   <div id="we-err"></div>
   <section class="esec">
    <label class="fld"><span>Kategorie</span><select id="we-kategorie">${WCATS.map(c=>`<option ${c===WED.kategorie?'selected':''}>${c}</option>`).join('')}</select></label>
    <label class="fld"><span>Titel</span><input id="we-titel" value="${esc(WED.titel)}" placeholder="z. B. Hypertensiver Notfall"></label>
    <label class="fld"><span>Kernaussage <small>ein Satz, wird groß angezeigt</small></span><input id="we-kern" value="${esc(WED.kern)}"></label>
    <label class="fld"><span>Punkte <small>eine Zeile pro Punkt</small></span><textarea id="we-punkte" rows="6">${esc(WED.punkte.join('\n'))}</textarea></label>
    <label class="fld"><span>Merke <small>optional</small></span><textarea id="we-merke" rows="2">${esc(WED.merke)}</textarea></label>
    <label class="fld"><span>Suchbegriffe <small>durch Komma getrennt</small></span><input id="we-tags" value="${esc(WED.tags.join(', '))}"></label>
    <label class="fld"><span>Quelle <small>optional</small></span><input id="we-quelle" value="${esc(WED.quelle)}"></label>
    <div class="rolechk"><label>Zielgruppe <select id="we-rolle"><option value="">RS + NotSan</option><option value="ns" ${WED.rolle==='ns'?'selected':''}>NotSan (SAA)</option></select></label><label><input type="checkbox" id="we-regional" ${WED.regional?'checked':''}> Regional unterschiedlich</label><label>Regelwerk <select id="we-nurregion"><option value="">SH + SAA/BPR</option><option value="sh" ${WED.nurRegion==='sh'?'selected':''}>nur SH</option><option value="saa" ${WED.nurRegion==='saa'?'selected':''}>nur SAA/BPR</option></select></label></div>
    <label class="fld"><span>Abweichung in SH <small>optional · JSON mit kern, punkte, merke, quelle – überlagert die Felder oben im Regelwerk SH</small></span><textarea id="we-sh" rows="4" class="mono" spellcheck="false" placeholder='{"punkte": ["…"], "quelle": "…"}'>${WED.sh?esc(JSON.stringify(WED.sh,null,1)):''}</textarea></label>
   </section>
   <div class="ebar"><button type="button" class="btn acc" data-ea="save">Speichern</button>${id?'<button type="button" class="btn ghost danger" data-ea="delete">Löschen</button>':''}</div><div id="we-confirm"></div>`;
  $('#editor').hidden=false;$('#editor').scrollTop=0;
}
async function wEditorAction(b){
  const a=b.dataset.ea;const close=()=>{$('#editor').hidden=true;delete $('#edinner').dataset.mode;};
  if(a==='cancel')return close();
  if(a==='save'){
    const doc={kategorie:$('#we-kategorie').value,titel:$('#we-titel').value.trim(),kern:$('#we-kern').value.trim(),
      punkte:$('#we-punkte').value.split('\n').map(s=>s.trim()).filter(Boolean),merke:$('#we-merke').value.trim(),
      tags:$('#we-tags').value.split(',').map(s=>s.trim()).filter(Boolean),quelle:$('#we-quelle').value.trim(),rolle:$('#we-rolle').value,regional:$('#we-regional').checked,aktualisiert:new Date().toISOString()};
    const nr=$('#we-nurregion').value;if(nr)doc.nurRegion=nr;
    const shTxt=$('#we-sh').value.trim();if(shTxt){try{const v=JSON.parse(shTxt);if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Objekt erwartet');doc.sh=v;}catch(e){$('#we-err').innerHTML=`<div class="fb no"><div><strong>SH-Abweichung ist kein gültiges JSON</strong>${esc(e.message)}</div></div>`;return;}}
    if(!doc.titel){$('#we-err').innerHTML='<div class="fb no"><div><strong>Titel fehlt</strong>Gib dem Eintrag einen Titel.</div></div>';return;}
    if(!DB){toast('Keine Datenbank verbunden');return;}
    b.disabled=true;const id=WED_ID||slugify(doc.kategorie+'-'+doc.titel)+'-'+Date.now().toString(36).slice(-4);
    try{await DB.collection('wissen').doc(id).set(doc);close();toast('Eintrag gespeichert');}
    catch(err){b.disabled=false;$('#we-err').innerHTML=`<div class="fb no"><div><strong>Nicht gespeichert</strong>${esc(dbErr(err))}</div></div>`;}
    return;}
  if(a==='delete'){$('#we-confirm').innerHTML=`<div class="fb no"><div style="flex:1"><strong>Eintrag löschen?</strong>Er verschwindet für alle.<div class="ebar"><button type="button" class="btn danger-solid" data-ea="delyes">Löschen</button><button type="button" class="btn ghost" data-ea="delno">Behalten</button></div></div></div>`;return;}
  if(a==='delno'){$('#we-confirm').innerHTML='';return;}
  if(a==='delyes'){try{await DB.collection('wissen').doc(WED_ID).delete();close();toast('Eintrag gelöscht');}catch(err){$('#we-confirm').innerHTML=`<p class="hint">${esc(dbErr(err))}</p>`;}}
}

/* ---------- Interaktive Module ---------- */
const MODART={
 organe:`<svg viewBox="0 0 48 48"><path d="M17 4h14l1 6q8 2 9 8l-3 14q2 6 2 12H8q0-6 2-12L7 18q1-6 9-8z" fill="#f2d3bd" stroke="#8a6a58" stroke-width="1.2"/><path d="M23 12q-6-3-9 4-1 6 1 10 5 1 8-2z" fill="#e8a0a8"/><path d="M25 12q6-3 9 4 1 6-1 10-5 1-8-2z" fill="#e8a0a8"/><path d="M26 19q5-1 6 4-1 5-6 4-3-4 0-8z" fill="#c8323c"/><path d="M12 30q9-5 15 1-3 4-15 4z" fill="#8c4a3a"/></svg>`,
 zelle:`<svg viewBox="0 0 48 48"><ellipse cx="24" cy="24" rx="20" ry="16" fill="#dff0e6" stroke="#3f8a64" stroke-width="1.6"/><circle cx="21" cy="24" r="7" fill="#9b8fd8" stroke="#5a4aa8"/><circle cx="20" cy="23" r="2.2" fill="#5a4aa8"/><ellipse cx="35" cy="18" rx="5" ry="2.6" fill="#f2994a" stroke="#b85f1a"/><ellipse cx="33" cy="31" rx="4.5" ry="2.4" fill="#f2994a" stroke="#b85f1a"/></svg>`,
 muskel:`<svg viewBox="0 0 48 48"><path d="M6 30q10-16 36-12" stroke="#b8323c" stroke-width="12" stroke-linecap="round" fill="none"/>${[10,16,22,28,34].map(x=>`<path d="M${x} ${32-x*.3}l2-9" stroke="#f3c0c4" stroke-width="1.4"/>`).join('')}</svg>`,
 kreislauf:`<svg viewBox="0 0 48 48"><path d="M24 41C10 31 6 24 6 17a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 7-4 14-18 24z" fill="#d94a4a" stroke="#8c2020" stroke-width="1.4"/><path d="M24 14v26" stroke="#8c2020" stroke-width="1.2"/><path d="M8 22h32" stroke="#8c2020" stroke-width="1.2"/><circle cx="18" cy="14" r="2" fill="#ffd34a"/></svg>`,
 normwerte:`<svg viewBox="0 0 48 48"><rect x="5" y="9" width="38" height="30" rx="4" fill="#0b1a22" stroke="#2c4a5a"/><path d="M8 26h8l3-8 4 14 3-9 2 3h12" stroke="#3be38a" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>`,
};
const ORGANS={
 trachea:{n:'Luftröhre (Trachea)',lage:'Vor der Speiseröhre, vom Kehlkopf bis zur Gabelung (Carina) auf Höhe des 4. Brustwirbels.',fn:'Leitet die Atemluft in die Hauptbronchien.',rd:'Der rechte Hauptbronchus verläuft steiler. Fremdkörper, Aspiration und ein zu tiefer Tubus landen deshalb eher rechts.'},
 lunge_r:{n:'Rechte Lunge',lage:'Rechte Brusthöhle, drei Lappen.',fn:'Gasaustausch: Sauerstoff hinein, CO₂ hinaus über die Lungenbläschen (Alveolen).',rd:'Immer seitengleich auskultieren. Ein einseitig abgeschwächtes Atemgeräusch spricht für Pneumothorax, Erguss oder Fehlintubation.'},
 lunge_l:{n:'Linke Lunge',lage:'Linke Brusthöhle, zwei Lappen. Etwas kleiner, weil das Herz Platz braucht.',fn:'Gasaustausch wie rechts.',rd:'Beim Spannungspneumothorax: fehlendes Atemgeräusch, gestaute Halsvenen, Schock – sofort entlasten lassen.'},
 herz:{n:'Herz',lage:'Im Mittelfellraum hinter dem Brustbein, zu etwa zwei Dritteln links der Mittellinie. Die Herzspitze liegt im 5. Zwischenrippenraum links.',fn:'Muskelpumpe: rund 70 ml pro Schlag, in Ruhe etwa 5 Liter pro Minute.',rd:'Druckpunkt bei der Herzdruckmassage: Mitte des Brustkorbs, untere Hälfte des Brustbeins.'},
 zwerchfell:{n:'Zwerchfell',lage:'Kuppelförmige Muskelplatte zwischen Brust- und Bauchraum. Rechts steht es durch die Leber etwas höher.',fn:'Wichtigster Atemmuskel. Gesteuert vom N. phrenicus aus C3–C5.',rd:'Verletzung des Halsmarks oberhalb von C5 kann zur Atemlähmung führen.'},
 leber:{n:'Leber',lage:'Rechter Oberbauch, direkt unter dem Zwerchfell, reicht bis in den linken Oberbauch.',fn:'Größte Drüse (ca. 1,5 kg): Stoffwechsel, Entgiftung, Glykogenspeicher, Gerinnungsfaktoren.',rd:'Sehr stark durchblutet. Stumpfes Trauma rechts kann zu lebensbedrohlicher innerer Blutung führen.'},
 galle:{n:'Gallenblase',lage:'An der Unterseite der Leber, rechter Oberbauch.',fn:'Speichert und konzentriert Galle für die Fettverdauung.',rd:'Gallenkolik: krampfartiger Schmerz im rechten Oberbauch, oft nach fettem Essen, Ausstrahlung in die rechte Schulter.'},
 magen:{n:'Magen',lage:'Linker Oberbauch, unter dem Zwerchfell.',fn:'Speicher und Vorverdauung mit Salzsäure und Enzymen.',rd:'Ulkusblutung: Bluterbrechen oder Teerstuhl. Voller Magen erhöht die Aspirationsgefahr.'},
 milz:{n:'Milz',lage:'Linker Oberbauch, seitlich hinter dem Magen, unter der 9. bis 11. Rippe.',fn:'Teil des Immunsystems, baut alte rote Blutkörperchen ab.',rd:'Milzruptur nach Trauma links, auch zweizeitig Stunden später. Schmerz kann in die linke Schulter ausstrahlen (Kehr-Zeichen).'},
 pankreas:{n:'Bauchspeicheldrüse (Pankreas)',lage:'Quer im Oberbauch hinter dem Magen, hinter dem Bauchfell (retroperitoneal).',fn:'Verdauungsenzyme in den Darm, Insulin und Glukagon ins Blut.',rd:'Pankreatitis: gürtelförmiger Oberbauchschmerz, oft nach Alkohol oder bei Gallensteinen.'},
 niere_r:{n:'Rechte Niere',lage:'Hinter dem Bauchfell an der hinteren Bauchwand, etwa Höhe 12. Brust- bis 3. Lendenwirbel. Rechts etwas tiefer als links.',fn:'Bildet Urin, regelt Wasser, Elektrolyte, Säure-Basen-Haushalt und Blutdruck.',rd:'Nierenkolik: heftiger Flankenschmerz mit Ausstrahlung in Leiste und Genitale, Patient ist unruhig.'},
 niere_l:{n:'Linke Niere',lage:'Hinter dem Bauchfell links, etwas höher als die rechte.',fn:'Wie rechts.',rd:'Bei Flankentrauma an Nierenverletzung denken (Blut im Urin).'},
 duenndarm:{n:'Dünndarm',lage:'Mittel- und Unterbauch, vom Dickdarm umrahmt. 3–5 Meter lang.',fn:'Aufnahme der Nährstoffe.',rd:'Darmverschluss (Ileus): Erbrechen, aufgetriebener Bauch, kein Stuhlgang.'},
 dickdarm:{n:'Dickdarm',lage:'Umrahmt den Dünndarm: aufsteigend rechts, quer im Oberbauch, absteigend links, dann Sigma ins Becken.',fn:'Entzieht dem Stuhl Wasser und Salze.',rd:'Divertikulitis meist links unten. Blutung zeigt sich als frisches Blut im Stuhl.'},
 appendix:{n:'Wurmfortsatz (Appendix)',lage:'Rechter Unterbauch, am Anfang des Dickdarms.',fn:'Lymphatisches Gewebe.',rd:'Appendizitis: Schmerz beginnt oft um den Nabel und wandert in den rechten Unterbauch, dazu Übelkeit und Fieber.'},
 blase:{n:'Harnblase',lage:'Kleines Becken, hinter dem Schambein.',fn:'Speichert Urin, Fassungsvermögen etwa 300–500 ml.',rd:'Beckentrauma kann die Blase verletzen. Harnverhalt: tastbare, schmerzhafte Blase oberhalb des Schambeins.'},
};
const QUADS={
 ro:{n:'Rechter Oberbauch',o:['Leber','Gallenblase','Zwölffingerdarm','rechte Niere (hinten)','rechte Dickdarmbiegung']},
 lo:{n:'Linker Oberbauch',o:['Magen','Milz','Pankreasschwanz','linke Niere (hinten)','linke Dickdarmbiegung']},
 ru:{n:'Rechter Unterbauch',o:['Wurmfortsatz und Blinddarm','aufsteigender Dickdarm','rechter Eierstock und Eileiter','rechter Harnleiter']},
 lu:{n:'Linker Unterbauch',o:['absteigender Dickdarm und Sigma','linker Eierstock und Eileiter','linker Harnleiter']},
};
function organSVG(){
  const o=(id,d,fill,extra='')=>`<path data-o="${id}" d="${d}" fill="${fill}" stroke="rgba(40,20,20,.55)" stroke-width="1.2" ${extra}/>`;
  return `<svg class="bodysvg" viewBox="0 0 320 450" role="img" aria-label="Organe im Rumpf, Ansicht von vorne">
   <path d="M136 0H184L187 30Q250 38 281 60Q298 74 293 110L269 210Q258 250 251 300Q262 340 267 382L263 450H57L53 382Q58 340 69 300Q62 250 51 210L27 110Q22 74 39 60Q70 38 133 30Z" fill="#f4dcc8" stroke="#9c7a66" stroke-width="1.6"/>
   <g class="org">
   ${o('trachea','M152 0H168V92Q172 100 186 108L182 114Q168 106 160 100Q152 106 138 114L134 108Q148 100 152 92Z','#e6c6b4')}
   ${[12,24,36,48,60,72,84].map(y=>`<path d="M152 ${y}h16" stroke="rgba(40,20,20,.35)" stroke-width="1" pointer-events="none"/>`).join('')}
   ${o('lunge_r','M146 104Q118 78 84 104Q60 140 62 226Q100 244 150 220Q138 186 146 150Z','#eaa4ac')}
   ${o('lunge_l','M174 104Q202 78 236 104Q260 140 258 226Q232 238 212 232Q222 206 200 186Q178 168 174 140Z','#eaa4ac')}
   ${o('herz','M152 166Q176 144 206 168Q228 198 198 228Q178 244 160 234Q140 218 146 190Z','#c8323c')}
      ${o('pankreas','M150 300Q192 288 238 296Q240 308 226 311Q190 307 156 314Z','#e7c27a')}
   ${o('leber','M56 238Q160 210 206 238Q204 262 164 270Q112 288 70 294Q52 272 56 238Z','#8c4a3a')}
   ${o('galle','M106 280Q116 274 124 284Q126 300 114 302Q104 296 106 280Z','#5f9a4a')}
   ${o('magen','M186 242Q228 230 238 258Q242 298 216 312Q196 318 186 300Q202 294 206 280Q198 262 184 262Z','#e8a27a')}
   ${o('milz','M238 236Q258 240 258 266Q256 292 240 290Q230 262 238 236Z','#7a3b6a')}
   ${o('dickdarm','M100 404L92 334Q94 320 114 322L214 320Q236 320 236 338L238 394Q236 416 200 414Q182 412 176 428','none','stroke-width="22" stroke-linecap="round" stroke-linejoin="round" class="colon"')}
   ${o('duenndarm','M116 344Q160 334 214 344Q222 372 214 400Q170 410 120 400Q110 372 116 344Z','#f0b8a8')}
   <path d="M126 356q10 8 20 0t20 0 20 0 20 0M124 372q10 8 20 0t20 0 20 0 22 0M126 388q10 8 20 0t20 0 20 0 20 0" stroke="rgba(150,60,60,.5)" stroke-width="1.6" fill="none" pointer-events="none"/>
   ${o('appendix','M96 410Q94 428 84 434Q80 430 86 424Q92 418 90 408Z','#e0866e')}
   ${o('blase','M134 436Q134 420 160 420Q186 420 186 436L184 450H136Z','#e8d36a')}
   ${o('niere_r','M96 300Q112 296 116 316Q118 340 100 342Q84 336 86 318Q88 304 96 300Z','rgba(150,60,80,.35)','stroke-dasharray="4 3"')}
   ${o('niere_l','M224 290Q240 292 236 314Q232 334 218 332Q206 326 208 308Q212 292 224 290Z','rgba(150,60,80,.35)','stroke-dasharray="4 3"')}
   <path d="M60 232Q160 196 260 232" stroke="#7a5a4a" stroke-width="3" fill="none" data-o="zwerchfell" class="hitline"/>
   </g>
   <g class="quads" hidden="">
    <rect data-q="ro" x="54" y="236" width="106" height="110" fill="rgba(29,95,224,.08)"/><rect data-q="lo" x="160" y="236" width="106" height="110" fill="rgba(29,95,224,.14)"/>
    <rect data-q="ru" x="54" y="346" width="106" height="104" fill="rgba(29,95,224,.14)"/><rect data-q="lu" x="160" y="346" width="106" height="104" fill="rgba(29,95,224,.08)"/>
    <path d="M160 236V450M54 346H266" stroke="#1d5fe0" stroke-width="2" stroke-dasharray="6 4" pointer-events="none"/><circle cx="160" cy="346" r="4" fill="#1d5fe0" pointer-events="none"/>
    ${[['RO',106,258],['LO',214,258],['RU',106,440],['LU',214,440]].map(([t,x,y])=>`<text x="${x}" y="${y}" text-anchor="middle" class="qlab" pointer-events="none">${t}</text>`).join('')}
   </g>
   <text x="12" y="440" class="side">rechts</text><text x="308" y="440" text-anchor="end" class="side">links</text>
  </svg>`;
}
const CELL={
 membran:{n:'Zellmembran',fn:'Doppelschicht aus Fetten mit Kanälen und Pumpen. Sie entscheidet, was in die Zelle hinein- und herauskommt.',rd:'Die Natrium-Kalium-Pumpe hält das Ruhepotenzial. Kaliumstörungen verändern die Erregbarkeit von Herz und Muskeln – Rhythmusstörungen drohen.'},
 kern:{n:'Zellkern',fn:'Enthält die Erbinformation (DNA) und steuert die Zelle.',rd:'Rote Blutkörperchen haben keinen Kern – sie transportieren Sauerstoff, können sich aber nicht teilen oder reparieren.'},
 mito:{n:'Mitochondrien',fn:'Kraftwerke der Zelle: Sie gewinnen mit Sauerstoff Energie (ATP) aus Zucker und Fett.',rd:'Ohne Sauerstoff läuft die Energiegewinnung anaerob: wenig ATP, viel Laktat, Übersäuerung. Kohlenmonoxid und Cyanid blockieren die Zellatmung trotz normaler SpO₂-Anzeige.'},
 rer:{n:'Raues endoplasmatisches Retikulum',fn:'Membransystem mit Ribosomen besetzt – hier entstehen Proteine.',rd:''},
 ser:{n:'Glattes endoplasmatisches Retikulum',fn:'Fettstoffwechsel, Entgiftung und Calciumspeicher.',rd:'In Muskelzellen heißt es sarkoplasmatisches Retikulum und setzt das Calcium für die Kontraktion frei.'},
 golgi:{n:'Golgi-Apparat',fn:'Verpackt und verschickt Proteine an ihren Einsatzort.',rd:''},
 ribo:{n:'Ribosomen',fn:'Kleine Eiweißfabriken: setzen Aminosäuren nach Bauplan zusammen.',rd:''},
 lyso:{n:'Lysosomen',fn:'Bläschen mit Verdauungsenzymen: bauen Abfall und Erreger ab.',rd:''},
 plasma:{n:'Zytoplasma',fn:'Zellflüssigkeit, in der die Organellen schwimmen. Hier beginnt der Zuckerabbau (Glykolyse) – auch ohne Sauerstoff.',rd:'Die Glykolyse liefert ohne Sauerstoff nur 2 ATP pro Zuckermolekül, mit Mitochondrien rund 30.'},
};
function cellSVG(){
  const mito=(x,y,r)=>`<g data-c="mito" transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="24" ry="11" fill="#f2994a" stroke="#a8561a" stroke-width="1.4"/><path d="M-18 0l5-7 5 13 5-13 5 13 5-13 5 13 4-6" fill="none" stroke="#a8561a" stroke-width="1.2"/></g>`;
  return `<svg class="cellsvg" viewBox="0 0 340 250" role="img" aria-label="Aufbau einer Zelle">
   <ellipse data-c="plasma" cx="170" cy="125" rx="160" ry="112" fill="#e3f3e9"/>
   <ellipse data-c="membran" cx="170" cy="125" rx="160" ry="112" fill="none" stroke="#3f8a64" stroke-width="7"/>
   <ellipse cx="170" cy="125" rx="160" ry="112" fill="none" stroke="#e3f3e9" stroke-width="2" pointer-events="none"/>
   <g data-c="rer">${[0,1,2].map(i=>`<path d="M${206+i*12} ${70-i*4}q14 18 0 34t0 34 0 34" fill="none" stroke="#5a7fc8" stroke-width="5" stroke-linecap="round"/>`).join('')}${[0,1,2].map(i=>[0,1,2,3,4,5].map(k=>`<circle cx="${213+i*12+(k%2?-5:5)}" cy="${72-i*4+k*17}" r="2.2" fill="#2a3f8a"/>`).join('')).join('')}</g>
   <g data-c="kern"><circle cx="150" cy="125" r="46" fill="#a99ee0" stroke="#5a4aa8" stroke-width="2.5"/><circle cx="142" cy="118" r="14" fill="#5a4aa8"/>${[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return `<circle cx="${150+46*Math.cos(a)}" cy="${125+46*Math.sin(a)}" r="2.2" fill="#e3f3e9"/>`;}).join('')}</g>
   <g data-c="golgi" transform="translate(268 152)">${[0,1,2,3].map(i=>`<path d="M${-26+i*2} ${i*7}q26 -14 ${52-i*4} 0" fill="none" stroke="#d4a017" stroke-width="5" stroke-linecap="round"/>`).join('')}</g>
   ${mito(66,78,-20)}${mito(84,184,15)}${mito(240,214,-8)}
   <g data-c="ser"><path d="M50 128q14-10 28 0t28 0" fill="none" stroke="#7bb5d8" stroke-width="6" stroke-linecap="round"/><path d="M56 146q14-10 28 0t24 0" fill="none" stroke="#7bb5d8" stroke-width="6" stroke-linecap="round"/></g>
   <g data-c="lyso"><circle cx="196" cy="196" r="10" fill="#e86a8a" stroke="#a83a5a" stroke-width="1.4"/><circle cx="292" cy="96" r="8" fill="#e86a8a" stroke="#a83a5a" stroke-width="1.4"/><circle cx="118" cy="44" r="7" fill="#e86a8a" stroke="#a83a5a" stroke-width="1.4"/></g>
   <g data-c="ribo">${[[110,200],[124,210],[262,60],[250,52],[300,130],[60,104],[178,40],[190,48],[140,222]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="#2a3f8a"/>`).join('')}</g>
  </svg>`;
}
function infoHTML(t){return `<div class="oinfo"><h3>${esc(t.n)}</h3>${t.lage?`<p><span class="ik">Lage</span>${esc(t.lage)}</p>`:''}<p><span class="ik">Aufgabe</span>${esc(t.fn)}</p>${t.rd?`<p class="ird"><span class="ik">Im Einsatz</span>${esc(t.rd)}</p>`:''}</div>`;}
function openModule(id){
  const m=MODULES.find(x=>x.id===id);let body='';
  if(id==='organe'){body=`<div class="seg" role="group" aria-label="Ansicht"><button type="button" class="chipbtn" data-view="org" aria-pressed="true">Organe</button><button type="button" class="chipbtn" data-view="quad" aria-pressed="false">Quadranten</button></div>
    <div class="svgpanel">${organSVG()}</div><p class="hint">Ansicht von vorne: Die rechte Körperseite des Patienten ist im Bild links. Gestrichelte Organe liegen hinten.</p>
    <div id="minfo"><div class="oinfo muted"><h3>Tippe auf ein Organ</h3><p>Du siehst Lage, Aufgabe und worauf du im Einsatz achten musst.</p></div></div>`;}
  if(id==='zelle'){body=`<div class="svgpanel">${cellSVG()}</div><div class="legend">${Object.entries(CELL).map(([k,v])=>`<button type="button" class="chipbtn" data-cl="${k}">${esc(v.n.replace('endoplasmatisches Retikulum','ER'))}</button>`).join('')}</div>
    <div id="minfo"><div class="oinfo muted"><h3>Tippe auf einen Teil der Zelle</h3><p>Oder wähle ihn oben aus der Liste.</p></div></div>`;}
  if(id==='muskel'){body=`<div class="mtypes">
     <article class="mtype"><svg viewBox="0 0 160 70" aria-hidden="true"><rect width="160" height="70" rx="8" fill="#f6d2d2"/>${[12,30,48].map(y=>`<rect x="6" y="${y-8}" width="148" height="16" rx="8" fill="#d9646c"/>${Array.from({length:24},(_,i)=>`<path d="M${12+i*6} ${y-8}v16" stroke="#a83a44" stroke-width="1.4"/>`).join('')}<ellipse cx="${30+y}" cy="${y-6}" rx="5" ry="2" fill="#5a2a8a"/>`).join('')}<rect x="6" y="54" width="148" height="10" rx="5" fill="#d9646c"/></svg>
      <h3>Skelettmuskel</h3><div class="chips"><span class="chip">quergestreift</span><span class="chip">willkürlich</span><span class="chip">viele Zellkerne am Rand</span></div><p>Bewegt das Skelett. Ermüdet schnell. Wird über motorische Nerven gesteuert (Botenstoff Acetylcholin).</p><p class="ird"><span class="ik">Im Einsatz</span>Crush oder lange Liegezeit: Muskelzerfall (Rhabdomyolyse) setzt Kalium und Myoglobin frei – Gefahr für Herz und Nieren.</p></article>
     <article class="mtype"><svg viewBox="0 0 160 70" aria-hidden="true"><rect width="160" height="70" rx="8" fill="#f6d2d2"/><path d="M6 18H60L76 34H154M6 50H70L86 34M40 18L56 2M110 34L126 54H154" stroke="#c8424c" stroke-width="14" stroke-linecap="round" fill="none"/>${[22,46,96,132].map(x=>`<path d="M${x} 10v16M${x} 42v16" stroke="#7a1a24" stroke-width="2.4"/>`).join('')}<circle cx="34" cy="18" r="3" fill="#5a2a8a"/><circle cx="118" cy="34" r="3" fill="#5a2a8a"/><circle cx="40" cy="50" r="3" fill="#5a2a8a"/></svg>
      <h3>Herzmuskel</h3><div class="chips"><span class="chip">quergestreift</span><span class="chip">unwillkürlich</span><span class="chip">verzweigt, Glanzstreifen</span></div><p>Erzeugt seine Erregung selbst (Sinusknoten). Ermüdet nicht und hat eine lange Pause zwischen zwei Erregungen, damit er sich füllen kann.</p><p class="ird"><span class="ik">Im Einsatz</span>Die Glanzstreifen leiten die Erregung von Zelle zu Zelle – deshalb breitet sich Kammerflimmern über das ganze Herz aus.</p></article>
     <article class="mtype"><svg viewBox="0 0 160 70" aria-hidden="true"><rect width="160" height="70" rx="8" fill="#f6d2d2"/>${[[40,18],[100,16],[70,36],[130,38],[40,54],[100,56]].map(([x,y])=>`<path d="M${x-30} ${y}Q${x} ${y-9} ${x+30} ${y}Q${x} ${y+9} ${x-30} ${y}Z" fill="#e0868c" stroke="#a84a52" stroke-width="1"/><ellipse cx="${x}" cy="${y}" rx="5" ry="2.2" fill="#5a2a8a"/>`).join('')}</svg>
      <h3>Glatte Muskulatur</h3><div class="chips"><span class="chip">nicht quergestreift</span><span class="chip">unwillkürlich</span><span class="chip">spindelförmig, ein Kern</span></div><p>In Gefäßen, Bronchien, Darm und Blase. Gesteuert vom vegetativen Nervensystem. Langsam, aber ausdauernd.</p><p class="ird"><span class="ik">Im Einsatz</span>Beim Asthma verkrampft die glatte Muskulatur der Bronchien. Gefäßmuskeln regeln den Blutdruck – bei Anaphylaxie erschlaffen sie.</p></article>
    </div>
    <div class="sectionhead"><h2>Aufbau eines Skelettmuskels</h2></div>
    <ol class="chain">${[['Muskel','von Bindegewebe (Faszie) umhüllt'],['Faserbündel','mehrere Muskelfasern zusammen'],['Muskelfaser','eine lange Zelle mit vielen Kernen'],['Myofibrille','Fäden im Inneren der Faser'],['Sarkomer','kleinste Einheit: Aktin und Myosin gleiten ineinander']].map(([a,b],i)=>`<li><span class="cn">${i+1}</span><div><strong>${a}</strong><span>${b}</span></div></li>`).join('')}</ol>
    <div class="sarco" aria-hidden="true"><svg viewBox="0 0 300 70"><rect width="300" height="70" rx="8" fill="var(--surface-2)"/><path d="M20 8v54M280 8v54" stroke="var(--ink)" stroke-width="3"/>${[18,30,42,54].map(y=>`<path d="M20 ${y}h95M185 ${y}h95" stroke="#4a8fd8" stroke-width="3"/>`).join('')}${[24,36,48].map(y=>`<path d="M90 ${y}h120" stroke="#d9646c" stroke-width="6" stroke-linecap="round"/>`).join('')}<text x="56" y="68" class="sl">Aktin</text><text x="150" y="68" class="sl" text-anchor="middle">Myosin</text><text x="20" y="6" class="sl" text-anchor="middle">Z</text><text x="280" y="6" class="sl" text-anchor="middle">Z</text></svg><p class="hint">Calcium gibt die Bindungsstellen frei, ATP liefert die Energie für jeden Ruderschlag des Myosins.</p></div>`;}
  if(id==='kreislauf'){
    const flow=[['Hohlvenen','sauerstoffarm aus dem Körper','v'],['Rechter Vorhof','','v'],['Trikuspidalklappe','','v'],['Rechte Kammer','','v'],['Pulmonalklappe','','v'],['Lungenarterien','zur Lunge','v'],['Lunge','Gasaustausch','x'],['Lungenvenen','sauerstoffreich zurück','a'],['Linker Vorhof','','a'],['Mitralklappe','','a'],['Linke Kammer','dickste Wand, hoher Druck','a'],['Aortenklappe','','a'],['Aorta','in den Körper','a']];
    body=`<div class="heart4" aria-hidden="true"><svg viewBox="0 0 300 190"><rect x="20" y="20" width="125" height="64" rx="12" fill="#6b8fd8"/><rect x="155" y="20" width="125" height="64" rx="12" fill="#e06a6a"/><path d="M20 98h125v40q-20 40-62 46-63-10-63-46z" fill="#4a6fc0"/><path d="M155 98h125v40q0 36-63 46-42-6-62-46z" fill="#c8424c"/>
      ${[['Rechter Vorhof',82,57],['Linker Vorhof',217,57],['Rechte Kammer',82,138],['Linke Kammer',217,138]].map(([t,x,y])=>`<text x="${x}" y="${y}" text-anchor="middle" class="hl">${t}</text>`).join('')}
      <path d="M82 84v14M217 84v14" stroke="#fff" stroke-width="3"/><text x="150" y="13" text-anchor="middle" class="sl">von vorne gesehen</text></svg></div>
     <div class="sectionhead"><h2>Weg des Blutes</h2></div>
     <ol class="flow">${flow.map(([a,b,t])=>`<li class="f-${t}"><span class="fd"></span><div><strong>${a}</strong>${b?`<span>${b}</span>`:''}</div></li>`).join('')}</ol>
     <div class="sectionhead"><h2>Erregungsleitung</h2></div>
     <ol class="chain">${[['Sinusknoten','Taktgeber, 60–80/min'],['AV-Knoten','verzögert kurz, Ersatztakt 40–60/min'],['His-Bündel','Übergang in die Kammern'],['Tawara-Schenkel','rechter und linker Schenkel'],['Purkinje-Fasern','verteilen in der Kammerwand, Ersatztakt 20–40/min']].map(([a,b],i)=>`<li><span class="cn">${i+1}</span><div><strong>${a}</strong><span>${b}</span></div></li>`).join('')}</ol>
     <div class="merke"><strong>Merke</strong>Fällt ein Taktgeber aus, übernimmt der nächste – aber langsamer. Deshalb ist die Herzfrequenz ein Hinweis darauf, wo der Rhythmus entsteht.</div>`;}
  if(id==='normwerte'){
    const rows=[['Herzfrequenz','/min','120–160','110–160','80–140','70–120','60–100'],['Atemfrequenz','/min','40–60','30–50','20–40','18–30','12–20'],['RR systolisch','mmHg','60–80','70–90','80–100','90–110','100–140'],['SpO₂','%','≥ 95','≥ 95','≥ 95','≥ 95','≥ 95'],['Blutzucker','mg/dl','> 45','60–110','60–110','70–110','70–110'],['Temperatur','°C','36,5–37,5','36,5–37,5','36,5–37,5','36,5–37,5','36,5–37,5']];
    body=`<div class="tablewrap"><table class="nw"><thead><tr><th>Wert</th><th>Neugeb.</th><th>Säugling</th><th>Kleinkind</th><th>Schulkind</th><th>Erwachsen</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${r[0]}<small>${r[1]}</small></th>${r.slice(2).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
     <p class="hint">Richtwerte zur Orientierung. Je nach Lehrbuch und Leitlinie leicht unterschiedlich. Säugling: 1–12 Monate · Kleinkind: 1–5 Jahre · Schulkind: 6–12 Jahre.</p>
     <div class="nwfacts">${[['Schockindex','HF ÷ RR sys','über 1 → Verdacht auf Schock'],['Rekap-Zeit','am Nagelbett oder Brustbein','über 2 Sekunden → Zentralisation'],['GCS','3 bis 15 Punkte','≤ 8 → Atemweg gefährdet'],['Mittlerer Druck','(sys + 2 × dia) ÷ 3','unter 65 mmHg → Organe unterversorgt']].map(([a,b,c])=>`<div class="nwf"><span class="label">${a}</span><strong>${b}</strong><span>${c}</span></div>`).join('')}</div>`;}
  $('#wvinner').innerHTML=`<div class="mtop"><div><span class="label">${esc(m.cat)}</span><h1>${esc(m.title)}</h1></div><button class="x" id="wvclose" aria-label="Schließen">${ic('x')}</button></div>${body}`;
  $('#wview').hidden=false;$('#wview').scrollTop=0;
  $('#wvclose').onclick=()=>$('#wview').hidden=true;
}
$('#wvinner').addEventListener('click',e=>{
  const v=e.target.closest('[data-view]');
  if(v){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b===v?'true':'false'));const q=v.dataset.view==='quad';$('.quads').toggleAttribute('hidden',!q);$('.org').classList.toggle('dim',q);
    $('#minfo').innerHTML=q?'<div class="oinfo muted"><h3>Tippe auf einen Quadranten</h3><p>Die Linien kreuzen sich am Bauchnabel.</p></div>':'<div class="oinfo muted"><h3>Tippe auf ein Organ</h3><p>Du siehst Lage, Aufgabe und worauf du im Einsatz achten musst.</p></div>';return;}
  const q=e.target.closest('[data-q]');if(q){const d=QUADS[q.dataset.q];document.querySelectorAll('[data-q]').forEach(r=>r.classList.toggle('on',r===q));$('#minfo').innerHTML=`<div class="oinfo"><h3>${d.n}</h3><ul class="wp">${d.o.map(x=>`<li>${x}</li>`).join('')}</ul><p class="ird"><span class="ik">Im Einsatz</span>Schmerzort grob zuordnen, aber nicht festlegen: Herzinfarkt, Lungenentzündung und Gefäßnotfälle können sich ebenfalls als Bauchschmerz zeigen.</p></div>`;return;}
  const o=e.target.closest('[data-o]');if(o&&ORGANS[o.dataset.o]){document.querySelectorAll('[data-o]').forEach(p=>p.classList.toggle('on',p.dataset.o===o.dataset.o));$('#minfo').innerHTML=infoHTML(ORGANS[o.dataset.o]);$('#minfo').scrollIntoView({behavior:'smooth',block:'nearest'});return;}
  const c=e.target.closest('[data-c],[data-cl]');if(c){const k=c.dataset.c||c.dataset.cl;if(!CELL[k])return;document.querySelectorAll('[data-c]').forEach(p=>p.classList.toggle('on',p.dataset.c===k));document.querySelectorAll('[data-cl]').forEach(p=>p.setAttribute('aria-pressed',p.dataset.cl===k?'true':'false'));$('#minfo').innerHTML=infoHTML(CELL[k]);$('#minfo').scrollIntoView({behavior:'smooth',block:'nearest'});}
});

/* ---------- Reset ---------- */
$('#reset').onclick=e=>{
  const b=e.currentTarget;
  if(b.dataset.armed){S=fresh();save();renderAll();b.textContent='Fortschritt zurücksetzen';delete b.dataset.armed;toast('Fortschritt zurückgesetzt');return;}
  b.dataset.armed='1';b.textContent='Wirklich zurücksetzen? Nochmal tippen';setTimeout(()=>{if(b.dataset.armed){delete b.dataset.armed;b.textContent='Fortschritt zurücksetzen';}},4000);
};

syncCrew(false);renderFoots();renderAll();
{let t='home';try{t=localStorage.getItem('wachenalarm.tab')||'home';}catch(e){}if(VIEWS[t]&&t!=='home')showView(t);}
if(REDUCED)drawScene(performance.now());else requestAnimationFrame(loop);

/* ---------- Bearbeitungsmodus und lokale Änderungen ---------- */
function renderEditMode(){const b=$('#editmode');if(!b||!window.Store)return;b.textContent=Store.editing()?'Bearbeitungsmodus aus':'Bearbeitungsmodus an';}
function renderPending(sel){const box=$(sel);if(!box||!window.Store)return;const n=Store.pending();
  box.hidden=!CAN_EDIT||!n;if(!n){box.innerHTML='';return;}
  box.innerHTML=`<div class="fb warn"><div style="flex:1"><strong>${n} lokale Änderung${n===1?'':'en'}</strong>Gespeichert nur in diesem Browser. Exportiere sie als Datei und übernimm sie ins Repository (scripts/apply_export.py).<div class="ebar"><button type="button" class="btn acc sm" data-pend="export">Exportieren</button><button type="button" class="btn ghost sm danger" data-pend="discard">Verwerfen</button></div></div></div>`;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-pend]');if(!b)return;
  if(b.dataset.pend==='export'){Store.exportChanges();return;}
  if(b.dataset.pend==='discard'){if(b.dataset.armed){Store.discardChanges();toast('Lokale Änderungen verworfen');}else{b.dataset.armed='1';b.textContent='Wirklich verwerfen?';}}});
{const b=$('#editmode');if(b)b.onclick=()=>{Store.setEditing(!Store.editing());CAN_EDIT=Store.editing();renderEditMode();renderFaelle();renderWissen();toast(CAN_EDIT?'Bearbeitungsmodus an: Fälle und Wissen lassen sich lokal ändern':'Bearbeitungsmodus aus');};}
