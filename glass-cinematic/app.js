(()=>{
  'use strict';

  const $=(selector,context=document)=>context.querySelector(selector);
  const $$=(selector,context=document)=>[...context.querySelectorAll(selector)];
  const rub=value=>new Intl.NumberFormat('ru-RU').format(Math.round(value/1000)*1000)+' ₽';
  const range=(low,high)=>`${rub(low)} — ${rub(high)}`;
  const numeric=value=>Math.max(0,parseFloat(String(value??'').replace(',','.'))||0);

  const progress=$('#pageProgress');
  const nav=$('#nav');
  const mobileActions=$('#mobileActions');
  const heroPhoto=$('#heroPhoto');
  const heroWrap=$('#heroPhotoWrap');

  let scrollRaf=0;
  function updateScroll(){
    if(scrollRaf)return;
    scrollRaf=requestAnimationFrame(()=>{
      scrollRaf=0;
      const max=document.documentElement.scrollHeight-innerHeight;
      if(progress)progress.style.width=`${max>0?scrollY/max*100:0}%`;
      nav?.classList.toggle('scrolled',scrollY>24);
      mobileActions?.classList.toggle('show',scrollY>540);
    });
  }
  addEventListener('scroll',updateScroll,{passive:true});
  addEventListener('resize',updateScroll,{passive:true});

  if(heroWrap&&heroPhoto&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    heroWrap.addEventListener('pointermove',event=>{
      if(innerWidth<800)return;
      const rect=heroWrap.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width-.5;
      const y=(event.clientY-rect.top)/rect.height-.5;
      heroPhoto.style.transform=`translate3d(${x*10}px,${y*8}px,0) scale(1.045)`;
    });
    heroWrap.addEventListener('pointerleave',()=>{heroPhoto.style.transform='scale(1.03)'});
  }

  async function loadComparisonImages(){
    const images=$$('img[data-b64]');
    await Promise.all(images.map(async image=>{
      try{
        const response=await fetch(image.dataset.b64,{cache:'force-cache'});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const base64=(await response.text()).replace(/\s+/g,'');
        image.src=`data:image/webp;base64,${base64}`;
        await image.decode?.();
        image.classList.add('loaded');
      }catch(error){
        console.error('Не удалось загрузить фотографию сравнения:',error);
        image.alt='Фотография сравнения временно недоступна';
      }
    }));
  }
  loadComparisonImages();

  const compare=$('#compare');
  const compareAfter=$('#compareAfter');
  const compareLine=$('#compareLine');
  const compareHandle=$('#compareHandle');
  const compareButtons=$$('[data-compare-state]');
  let compareSplit=50;
  let compareDragging=false;
  let compareStartX=0;
  let compareStartY=0;
  let horizontalGesture=false;

  function setCompare(value){
    if(!compare)return;
    compareSplit=Math.max(0,Math.min(100,value));
    compare.style.setProperty('--split',`${compareSplit}%`);
    if(compareAfter)compareAfter.style.clipPath=`inset(0 0 0 ${compareSplit}%)`;
    if(compareLine)compareLine.style.left=`${compareSplit}%`;
    compareHandle?.setAttribute('aria-valuenow',String(Math.round(compareSplit)));

    compareButtons.forEach(button=>{
      const state=button.dataset.compareState;
      const active=(state==='before'&&compareSplit>=96)||(state==='after'&&compareSplit<=4)||(state==='half'&&compareSplit>4&&compareSplit<96);
      button.classList.toggle('active',active);
    });
  }

  function compareFromX(clientX){
    const rect=compare.getBoundingClientRect();
    setCompare((clientX-rect.left)/rect.width*100);
  }

  if(compare){
    setCompare(50);
    compare.addEventListener('pointerdown',event=>{
      compareDragging=true;
      horizontalGesture=false;
      compareStartX=event.clientX;
      compareStartY=event.clientY;
      compare.setPointerCapture?.(event.pointerId);
    });
    compare.addEventListener('pointermove',event=>{
      if(!compareDragging)return;
      const dx=event.clientX-compareStartX;
      const dy=event.clientY-compareStartY;
      if(!horizontalGesture&&Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy))horizontalGesture=true;
      if(horizontalGesture){
        event.preventDefault();
        compareFromX(event.clientX);
      }
    });
    const finish=event=>{
      compareDragging=false;
      horizontalGesture=false;
      compare.releasePointerCapture?.(event.pointerId);
    };
    compare.addEventListener('pointerup',finish);
    compare.addEventListener('pointercancel',finish);
    compareHandle?.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'){setCompare(compareSplit-5);event.preventDefault()}
      if(event.key==='ArrowRight'){setCompare(compareSplit+5);event.preventDefault()}
      if(event.key==='Home'){setCompare(0);event.preventDefault()}
      if(event.key==='End'){setCompare(100);event.preventDefault()}
    });
    compareButtons.forEach(button=>button.addEventListener('click',()=>{
      const state=button.dataset.compareState;
      setCompare(state==='before'?100:state==='after'?0:50);
    }));
  }

  const area=$('#area');
  const pieces=$('#pieces');
  const damage=$('#damage');
  const access=$('#access');
  const replacementRange=$('#replacementRange');
  const restorationRange=$('#restorationRange');
  const savingMoney=$('#savingMoney');
  const savingPercent=$('#savingPercent');
  const restorationTime=$('#restorationTime');

  function calculate(){
    const areaValue=Math.max(.2,numeric(area?.value)||.2);
    const piecesValue=Math.max(1,Math.round(numeric(pieces?.value)||1));
    const damageFactor=numeric(damage?.value)||1;
    const accessFactor=numeric(access?.value)||1;

    const restorationBase=Math.max(15000,(6200*areaValue+1800*piecesValue)*damageFactor*accessFactor);
    const restorationLow=restorationBase*.88;
    const restorationHigh=restorationBase*1.16;

    const replacementBase=(14800*areaValue+23500*piecesValue+42000)*Math.max(1,.94*accessFactor);
    const replacementLow=replacementBase*.90;
    const replacementHigh=replacementBase*1.14;

    const savingLow=Math.max(0,replacementLow-restorationHigh);
    const savingHigh=Math.max(0,replacementHigh-restorationLow);
    const percentLow=replacementLow?Math.max(0,Math.round(savingLow/replacementLow*100)):0;
    const percentHigh=replacementHigh?Math.max(percentLow,Math.round(savingHigh/replacementHigh*100)):0;

    if(replacementRange)replacementRange.textContent=range(replacementLow,replacementHigh);
    if(restorationRange)restorationRange.textContent=range(restorationLow,restorationHigh);
    if(savingMoney)savingMoney.textContent=range(savingLow,savingHigh);
    if(savingPercent)savingPercent.textContent=`ориентировочно ${percentLow}–${Math.min(87,percentHigh)}% относительно замены`;
    if(restorationTime)restorationTime.textContent=areaValue<=6?'от нескольких часов':areaValue<=20?'ориентир: 1–3 дня':'ориентир: от 3 дней';

    return{
      area:areaValue,
      pieces:piecesValue,
      damage:damage?.options[damage.selectedIndex]?.text||'',
      access:access?.options[access.selectedIndex]?.text||'',
      replacement:replacementRange?.textContent||'',
      restoration:restorationRange?.textContent||'',
      saving:savingMoney?.textContent||'',
      savingPercent:savingPercent?.textContent||''
    };
  }

  [area,pieces,damage,access].forEach(control=>{
    control?.addEventListener('input',calculate);
    control?.addEventListener('change',calculate);
  });
  calculate();

  async function copyText(text){
    try{
      if(navigator.clipboard&&window.isSecureContext){
        await navigator.clipboard.writeText(text);
        return true;
      }
    }catch(error){console.warn('Clipboard API недоступен:',error)}

    try{
      const textarea=document.createElement('textarea');
      textarea.value=text;
      textarea.setAttribute('readonly','');
      textarea.style.position='fixed';
      textarea.style.opacity='0';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0,textarea.value.length);
      const result=document.execCommand('copy');
      textarea.remove();
      return result;
    }catch(error){
      console.warn('Резервное копирование недоступно:',error);
      return false;
    }
  }

  const sendCalc=$('#sendCalc');
  const telegramStatus=$('#telegramStatus');
  sendCalc?.addEventListener('click',async()=>{
    const data=calculate();
    const text=[
      'Здравствуйте. Хочу получить оценку восстановления стекла.',
      '',
      `Площадь повреждения: ${data.area} м²`,
      `Количество элементов: ${data.pieces}`,
      `Тип повреждения: ${data.damage}`,
      `Доступ: ${data.access}`,
      '',
      `Предварительный ориентир полной замены: ${data.replacement}`,
      `Предварительный ориентир восстановления: ${data.restoration}`,
      `Потенциальная экономия: ${data.saving}`,
      `${data.savingPercent}.`,
      '',
      'Готов отправить фотографии объекта.'
    ].join('\n');

    const copied=await copyText(text);
    if(telegramStatus){
      telegramStatus.textContent=copied
        ?'Расчёт скопирован. Открываем чат — вставьте сообщение и приложите фото.'
        :'Открываем чат. Приложите фотографии и укажите параметры из калькулятора.';
      telegramStatus.classList.add('success');
    }

    const popup=window.open('https://t.me/zhukov_boss','_blank','noopener,noreferrer');
    if(!popup)setTimeout(()=>{location.href='https://t.me/zhukov_boss'},100);
  });

  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -40px'});
    $$('.motion-reveal').forEach(element=>observer.observe(element));
  }else{
    $$('.motion-reveal').forEach(element=>element.classList.add('visible'));
  }

  updateScroll();
})();
