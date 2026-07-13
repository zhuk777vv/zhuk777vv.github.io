(()=>{
'use strict';
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const rub=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n/1000)*1000)+' ₽';
const range=(a,b)=>`${rub(a)} — ${rub(b)}`;
const scrollbar=$('#scrollbar'),mobileCta=$('#mobileCta');let scrollRaf=0;
function scrollUpdate(){if(scrollRaf)return;scrollRaf=requestAnimationFrame(()=>{scrollRaf=0;const h=document.documentElement.scrollHeight-innerHeight;if(scrollbar)scrollbar.style.width=(h>0?scrollY/h*100:0)+'%';mobileCta?.classList.toggle('show',scrollY>520);updateLoss();});}
addEventListener('scroll',scrollUpdate,{passive:true});addEventListener('resize',scrollUpdate,{passive:true});
function animateMoney(el,to,duration=560){if(!el)return;const from=Number(el.dataset.current||String(el.textContent).replace(/\D/g,'')||0),start=performance.now();cancelAnimationFrame(el._raf);function tick(now){const t=Math.min(1,(now-start)/duration),v=Math.round(from+(to-from)*(1-Math.pow(1-t,3)));el.textContent=rub(v);if(t<1)el._raf=requestAnimationFrame(tick);else el.dataset.current=String(to)}el._raf=requestAnimationFrame(tick)}

const canvas=$('#damageCanvas'),demo=$('#glassDemo');
function drawDamage(){
  if(!canvas||!demo)return;
  const rect=demo.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
  canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));
  canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';
  const c=canvas.getContext('2d');c.scale(dpr,dpr);const W=rect.width,H=rect.height;
  let seed=918273;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<92;i++){
    const x=W*(.05+rnd()*.76),y=H*(.78+rnd()*.19),rad=.6+rnd()*4.2;
    c.beginPath();c.ellipse(x,y,rad*(.7+rnd()*.9),rad*(.45+rnd()*.8),rnd()*Math.PI,0,Math.PI*2);
    const palette=['rgba(245,242,232,.82)','rgba(219,214,200,.66)','rgba(235,231,218,.72)','rgba(169,161,145,.42)'];
    c.fillStyle=palette[Math.floor(rnd()*palette.length)];c.fill();
  }
  c.lineCap='round';
  for(let i=0;i<7;i++){
    const x=W*(.08+rnd()*.62),y=H*(.81+rnd()*.12),len=W*(.035+rnd()*.09);
    c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+len*.28,y+(rnd()-.5)*9,x+len*.72,y+(rnd()-.5)*7,x+len,y+(rnd()-.5)*5);
    c.strokeStyle=`rgba(226,221,207,${.28+rnd()*.28})`;c.lineWidth=2+rnd()*6;c.stroke();
  }
  const dirt=c.createLinearGradient(0,H*.7,0,H);dirt.addColorStop(0,'rgba(72,64,53,0)');dirt.addColorStop(.7,'rgba(72,64,53,.06)');dirt.addColorStop(1,'rgba(72,64,53,.24)');
  c.fillStyle=dirt;c.fillRect(0,H*.7,W,H*.3);
}

async function loadLocalImages(){
  const imgs=[...document.querySelectorAll('img[data-b64]')];
  await Promise.all(imgs.map(async img=>{
    try{const parts=await Promise.all([1,2,3,4].map(i=>fetch(img.dataset.b64+i+'.b64',{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()})));img.src='data:image/webp;base64,'+parts.join('').replace(/\s+/g,'');}catch(e){console.error('image load failed',e);}
  }));
  drawDamage();
}
loadLocalImages();
addEventListener('resize',()=>{clearTimeout(window.__dmg);window.__dmg=setTimeout(drawDamage,120)},{passive:true});

const after=$('#afterScene'),split=$('#split'),handle=$('#splitHandle');let splitPos=52,drag=false,startX=0,startY=0,horizontal=false,userChanged=false;
function setSplit(pos,instant=false){if(!demo)return;splitPos=Math.max(0,Math.min(100,pos));demo.style.setProperty('--split',splitPos+'%');if(after)after.style.width=splitPos+'%';if(split)split.style.left=splitPos+'%';handle?.setAttribute('aria-valuenow',String(Math.round(splitPos)));if(instant){after?.style.setProperty('transition','none');split?.style.setProperty('transition','none');requestAnimationFrame(()=>{after?.style.removeProperty('transition');split?.style.removeProperty('transition')})}$$('[data-state]').forEach(b=>b.classList.toggle('active',(b.dataset.state==='before'&&splitPos<8)||(b.dataset.state==='after'&&splitPos>92)||(b.dataset.state==='compare'&&splitPos>=8&&splitPos<=92)));}
function splitFromX(x){const r=demo.getBoundingClientRect();setSplit((x-r.left)/r.width*100,true)}
if(demo){setSplit(52,true);demo.addEventListener('pointerdown',e=>{userChanged=true;drag=true;horizontal=false;startX=e.clientX;startY=e.clientY;demo.setPointerCapture?.(e.pointerId)});demo.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(!horizontal&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy))horizontal=true;if(horizontal){e.preventDefault();splitFromX(e.clientX)}});const end=e=>{drag=false;horizontal=false;demo.releasePointerCapture?.(e.pointerId)};demo.addEventListener('pointerup',end);demo.addEventListener('pointercancel',end);handle?.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){userChanged=true;setSplit(splitPos-5);e.preventDefault()}if(e.key==='ArrowRight'){userChanged=true;setSplit(splitPos+5);e.preventDefault()}});$$('[data-state]').forEach(b=>b.addEventListener('click',()=>{userChanged=true;setSplit(b.dataset.state==='before'?0:b.dataset.state==='after'?100:52)}));if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){io.disconnect();if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;setTimeout(()=>{if(!userChanged)setSplit(12)},250);setTimeout(()=>{if(!userChanged)setSplit(88)},1200);setTimeout(()=>{if(!userChanged)setSplit(52)},2800)}},{threshold:.42});io.observe(demo)}}

const loss=$('#loss'),steps=$$('#lossSteps article'),lossMoney=$('#lossMoney'),lossDays=$('#lossDays'),lossLabel=$('#lossLabel'),lossBar=$('#lossBar');
function updateLoss(){if(!loss||!steps.length)return;const rect=loss.getBoundingClientRect();if(rect.top>innerHeight*.85||rect.bottom<innerHeight*.15)return;const marker=innerHeight*.67;let idx=-1;steps.forEach((step,i)=>{if(step.getBoundingClientRect().top<marker)idx=i});idx=Math.max(0,Math.min(steps.length-1,idx));steps.forEach((step,i)=>step.classList.toggle('active',i<=idx));let total=0,days=0;for(let i=0;i<=idx;i++){total+=Number(steps[i].dataset.money||0);days+=Number(steps[i].dataset.days||0)}if(Number(lossMoney?.dataset.value||0)!==total){lossMoney.dataset.value=String(total);animateMoney(lossMoney,total,460)}if(lossDays)lossDays.textContent=days+' '+(days===1?'день':days<5?'дня':'дней');if(lossLabel)lossLabel.textContent=steps[idx]?.dataset.label||'Расчёт';if(lossBar)lossBar.style.width=((idx+1)/steps.length*100)+'%';}

const modes={replace:{label:'Сценарий A · Полная замена',title:'Разбираем готовую конструкцию и собираем процесс заново',money:312000,days:'18–21 день',result:'Риск переноса сроков',text:'Пять этапов и несколько исполнителей',active:['measure','production','delivery','dismantle','finish']},restore:{label:'Сценарий B · Восстановление',title:'Работаем с установленным стеклом прямо на объекте',money:96000,days:'около 2 дней',result:'Потенциальная экономия — 216 000 ₽',text:'Без производства, логистики и демонтажа',active:['measure','finish']}};
const decisionLabel=$('#decisionLabel'),decisionTitle=$('#decisionTitle'),decisionMoney=$('#decisionMoney'),decisionDays=$('#decisionDays'),decisionResult=$('#decisionResult'),decisionResultText=$('#decisionResultText'),timeline=$$('#timeline>div');let decisionTouched=false;
function setMode(name,user=false){const m=modes[name];if(!m)return;if(user)decisionTouched=true;$$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===name));decisionLabel.textContent=m.label;decisionTitle.textContent=m.title;animateMoney(decisionMoney,m.money,650);decisionDays.textContent=m.days;decisionResult.textContent=m.result;decisionResultText.textContent=m.text;timeline.forEach(el=>el.classList.toggle('off',!m.active.includes(el.dataset.step)))}
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode,true)));setMode('replace');const board=$('#decisionBoard');if(board&&'IntersectionObserver'in window){const io=new IntersectionObserver(e=>{if(e[0].isIntersecting){io.disconnect();setTimeout(()=>{if(!decisionTouched)setMode('restore')},1050)}},{threshold:.4});io.observe(board)}

const form=$('#calculator'),replacementRange=$('#replacementRange'),restorationRange=$('#restorationRange'),savingMoney=$('#savingMoney'),savingPercent=$('#savingPercent'),calcVerdict=$('#calcVerdict'),replacementTime=$('#replacementTime'),restorationTime=$('#restorationTime');
function calculate(){if(!form)return null;const d=new FormData(form),object=Number(d.get('object')),area=Math.max(.2,Number(d.get('area'))||.2),pieces=Math.max(1,Number(d.get('pieces'))||1),damage=Number(d.get('damage')),access=Number(d.get('access')),urgency=Number(d.get('urgency')),known=Number(d.get('known'))||0;let restoration=Math.max(4000,(6200*area+1800*pieces)*object*damage*access*urgency);const restLow=Math.round(restoration*.88),restHigh=Math.round(restoration*1.16);let replacement=known;if(!replacement){replacement=(14800*area+23500*pieces+42000)*object*Math.max(1,.94*access);if(urgency>1.25)replacement*=1.08}const replLow=Math.round(replacement*.9),replHigh=Math.round(replacement*1.14),saveLow=Math.max(0,replLow-restHigh),saveHigh=Math.max(0,replHigh-restLow),pctLow=replLow?Math.max(0,Math.round(saveLow/replLow*100)):0,pctHigh=replHigh?Math.max(pctLow,Math.round(saveHigh/replHigh*100)):0;replacementRange.textContent=range(replLow,replHigh);restorationRange.textContent=range(restLow,restHigh);savingMoney.textContent=range(saveLow,saveHigh);savingPercent.textContent=`≈ ${pctLow}–${Math.min(67,pctHigh)}% относительно замены`;const restDays=urgency>=1.35?'день в день':area<=6?'от нескольких часов':area<=20?'1–3 дня':'от 3 дней';restorationTime.textContent=restDays;replacementTime.textContent=area>20?'18–28 дней':'14–21 день';calcVerdict.textContent=saveHigh>90000?'Высокий потенциал экономии':'Восстановление имеет смысл рассмотреть';return{d,replLow,replHigh,restLow,restHigh,saveLow,saveHigh,restDays}}
form?.addEventListener('input',calculate);calculate();$('#sendCalc')?.addEventListener('click',()=>{const r=calculate(),d=r.d,object=form.object.options[form.object.selectedIndex].text,damage=form.damage.options[form.damage.selectedIndex].text,access=form.access.options[form.access.selectedIndex].text,urgency=form.urgency.options[form.urgency.selectedIndex].text,text=`Здравствуйте. Хочу получить оценку восстановления стекла.\n\nОбъект: ${object}\nПлощадь: ${d.get('area')} м²\nЭлементов: ${d.get('pieces')}\nПовреждение: ${damage}\nДоступ: ${access}\nСрочность: ${urgency}\n\nЗамена: ${replacementRange.textContent}\nВосстановление: ${restorationRange.textContent}\nПотенциальная экономия: ${savingMoney.textContent}\n\nГотов отправить фотографии.`;window.open('https://t.me/zhukov_boss?text='+encodeURIComponent(text),'_blank','noopener')});
scrollUpdate();updateLoss();
})();