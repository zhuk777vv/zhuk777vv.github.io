(()=>{
  'use strict';
  const $=(s,c=document)=>c.querySelector(s);
  const $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const rub=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n/1000)*1000)+' ₽';
  const range=(a,b)=>`${rub(a)} — ${rub(b)}`;

  const progress=$('#progress');
  const mobileCta=$('#mobileCta');
  let raf=0;
  function updateScroll(){
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const total=document.documentElement.scrollHeight-innerHeight;
      if(progress)progress.style.width=(total>0?scrollY/total*100:0)+'%';
      mobileCta?.classList.toggle('show',scrollY>520);
      updateEconomy();
    });
  }
  addEventListener('scroll',updateScroll,{passive:true});
  addEventListener('resize',updateScroll,{passive:true});

  function animateMoney(el,to,duration=520){
    if(!el)return;
    const from=Number(el.dataset.current||String(el.textContent).replace(/\D/g,'')||0);
    const start=performance.now();
    cancelAnimationFrame(el._raf);
    const tick=now=>{
      const t=Math.min(1,(now-start)/duration);
      const value=Math.round(from+(to-from)*(1-Math.pow(1-t,3)));
      el.textContent=rub(value);
      if(t<1)el._raf=requestAnimationFrame(tick);else el.dataset.current=String(to);
    };
    el._raf=requestAnimationFrame(tick);
  }

  const economy=$('#economy');
  const costSteps=$$('#costChain article');
  const lossMoney=$('#lossMoney');
  const lossDays=$('#lossDays');
  const lossLabel=$('#lossLabel');
  const lossBar=$('#lossBar');
  function updateEconomy(){
    if(!economy||!costSteps.length)return;
    const rect=economy.getBoundingClientRect();
    if(rect.top>innerHeight*.9||rect.bottom<innerHeight*.1)return;
    const marker=innerHeight*.68;
    let active=-1;
    costSteps.forEach((step,index)=>{if(step.getBoundingClientRect().top<marker)active=index});
    active=Math.max(0,Math.min(costSteps.length-1,active));
    costSteps.forEach((step,index)=>step.classList.toggle('active',index<=active));
    let money=0,days=0;
    for(let i=0;i<=active;i++){
      money+=Number(costSteps[i].dataset.money||0);
      days+=Number(costSteps[i].dataset.days||0);
    }
    if(Number(lossMoney?.dataset.value||-1)!==money){
      if(lossMoney)lossMoney.dataset.value=String(money);
      animateMoney(lossMoney,money);
    }
    if(lossDays)lossDays.textContent=`${days} ${days===1?'день':days<5?'дня':'дней'}`;
    if(lossLabel)lossLabel.textContent=costSteps[active]?.dataset.label||'Расчёт';
    if(lossBar)lossBar.style.width=((active+1)/costSteps.length*100)+'%';
  }

  async function loadLocalImages(){
    const images=$$('img[data-b64]');
    await Promise.all(images.map(async image=>{
      try{
        const response=await fetch(image.dataset.b64,{cache:'force-cache'});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const base64=(await response.text()).replace(/\s+/g,'');
        image.src='data:image/webp;base64,'+base64;
      }catch(error){
        console.error('Не удалось загрузить изображение сравнения',error);
        image.closest('.compare-side')?.classList.add('image-fallback');
      }
    }));
  }
  loadLocalImages();

  const compare=$('#compare');
  const afterSide=$('#afterSide');
  const divider=$('#compareDivider');
  const handle=$('#compareHandle');
  let split=52,dragging=false,startX=0,startY=0,horizontal=false;
  function setSplit(value){
    if(!compare)return;
    split=Math.max(0,Math.min(100,value));
    compare.style.setProperty('--split',split+'%');
    afterSide?.style.setProperty('clip-path',`inset(0 ${100-split}% 0 0)`);
    if(divider)divider.style.left=split+'%';
    handle?.setAttribute('aria-valuenow',String(Math.round(split)));
    $$('[data-state]').forEach(button=>{
      const active=(button.dataset.state==='before'&&split<8)||(button.dataset.state==='after'&&split>92)||(button.dataset.state==='compare'&&split>=8&&split<=92);
      button.classList.toggle('active',active);
    });
  }
  function splitFromX(x){const rect=compare.getBoundingClientRect();setSplit((x-rect.left)/rect.width*100)}
  if(compare){
    setSplit(52);
    compare.addEventListener('pointerdown',event=>{dragging=true;horizontal=false;startX=event.clientX;startY=event.clientY;compare.setPointerCapture?.(event.pointerId)});
    compare.addEventListener('pointermove',event=>{
      if(!dragging)return;
      const dx=event.clientX-startX,dy=event.clientY-startY;
      if(!horizontal&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy))horizontal=true;
      if(horizontal){event.preventDefault();splitFromX(event.clientX)}
    });
    const end=event=>{dragging=false;horizontal=false;compare.releasePointerCapture?.(event.pointerId)};
    compare.addEventListener('pointerup',end);compare.addEventListener('pointercancel',end);
    handle?.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'){setSplit(split-5);event.preventDefault()}
      if(event.key==='ArrowRight'){setSplit(split+5);event.preventDefault()}
    });
    $$('[data-state]').forEach(button=>button.addEventListener('click',()=>setSplit(button.dataset.state==='before'?0:button.dataset.state==='after'?100:52)));
  }

  const area=$('#area'),pieces=$('#pieces'),damage=$('#damage'),access=$('#access');
  const replacementRange=$('#replacementRange'),restorationRange=$('#restorationRange'),savingMoney=$('#savingMoney'),savingPercent=$('#savingPercent'),restorationTime=$('#restorationTime');
  function calculate(){
    const a=Math.max(.2,Number(area?.value)||.2),p=Math.max(1,Number(pieces?.value)||1),d=Number(damage?.value||1),x=Number(access?.value||1);
    const restoration=Math.max(4000,(6200*a+1800*p)*d*x);
    const restLow=restoration*.88,restHigh=restoration*1.16;
    const replacement=(14800*a+23500*p+42000)*Math.max(1,.94*x);
    const replLow=replacement*.9,replHigh=replacement*1.14;
    const saveLow=Math.max(0,replLow-restHigh),saveHigh=Math.max(0,replHigh-restLow);
    const pctLow=replLow?Math.max(0,Math.round(saveLow/replLow*100)):0;
    const pctHigh=replHigh?Math.max(pctLow,Math.round(saveHigh/replHigh*100)):0;
    if(replacementRange)replacementRange.textContent=range(replLow,replHigh);
    if(restorationRange)restorationRange.textContent=range(restLow,restHigh);
    if(savingMoney)savingMoney.textContent=range(saveLow,saveHigh);
    if(savingPercent)savingPercent.textContent=`≈ ${pctLow}–${Math.min(67,pctHigh)}% относительно замены`;
    if(restorationTime)restorationTime.textContent=a<=6?'от нескольких часов':a<=20?'1–3 дня':'от 3 дней';
    return{a,p,damage:damage?.options[damage.selectedIndex]?.text||'',access:access?.options[access.selectedIndex]?.text||''};
  }
  [area,pieces,damage,access].forEach(control=>control?.addEventListener('input',calculate));
  calculate();

  const sendCalc=$('#sendCalc'),telegramStatus=$('#telegramStatus');
  sendCalc?.addEventListener('click',async()=>{
    const data=calculate();
    const text=`Здравствуйте. Хочу получить предварительную оценку восстановления стекла.\n\nПлощадь: ${data.a} м²\nКоличество элементов: ${data.p}\nПовреждение: ${data.damage}\nДоступ: ${data.access}\n\nПолная замена: ${replacementRange.textContent}\nВосстановление: ${restorationRange.textContent}\nПотенциальная экономия: ${savingMoney.textContent}\n\nГотов отправить фотографии.`;
    let copied=false;
    try{await navigator.clipboard.writeText(text);copied=true}catch(error){console.warn('Буфер обмена недоступен',error)}
    if(telegramStatus){telegramStatus.textContent=copied?'Расчёт скопирован. Открываем чат — вставьте текст в сообщение.':'Открываем чат. Данные расчёта можно отправить вместе с фотографиями.';telegramStatus.classList.add('success')}
    const popup=window.open('https://t.me/zhukov_boss','_blank','noopener,noreferrer');
    if(!popup)setTimeout(()=>{location.href='https://t.me/zhukov_boss'},120);
  });

  updateScroll();updateEconomy();
})();
