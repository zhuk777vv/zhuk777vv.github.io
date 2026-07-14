(()=>{
  'use strict';

  const $=(selector,context=document)=>context.querySelector(selector);
  const $$=(selector,context=document)=>[...context.querySelectorAll(selector)];

  const heroMedia=$('#heroMedia');
  const pageProgress=$('#pageProgress');
  const mobileActions=$('#mobileActions');
  const costItems=$$('#costList article');
  const stepCount=$('#stepCount');
  const stepSummary=$('#stepSummary');
  const statusLine=$('#statusLine');

  async function loadLocalImages(){
    const images=$$('img[data-b64]');
    await Promise.all(images.map(async image=>{
      try{
        const response=await fetch(image.dataset.b64,{cache:'force-cache'});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const base64=(await response.text()).replace(/\s+/g,'');
        image.src=`data:image/webp;base64,${base64}`;
        await image.decode?.();
      }catch(error){
        console.error('Не удалось загрузить изображение:',error);
        image.closest('.hero-image')?.classList.add('image-error');
      }
    }));
    requestAnimationFrame(()=>setTimeout(()=>heroMedia?.classList.add('ready'),180));
  }

  function updatePage(){
    const max=document.documentElement.scrollHeight-innerHeight;
    if(pageProgress)pageProgress.style.width=`${max>0?scrollY/max*100:0}%`;
    mobileActions?.classList.toggle('show',scrollY>520);
  }

  function setActiveStep(index){
    const safe=Math.max(0,Math.min(costItems.length-1,index));
    costItems.forEach((item,itemIndex)=>item.classList.toggle('active',itemIndex<=safe));
    if(stepCount)stepCount.textContent=`${safe+1} из ${costItems.length} расходов`;
    if(stepSummary)stepSummary.textContent=costItems[safe]?.dataset.summary||'';
    if(statusLine)statusLine.style.width=`${(safe+1)/costItems.length*100}%`;
  }

  function updateEconomy(){
    if(!costItems.length)return;
    const marker=innerHeight*.66;
    let active=0;
    costItems.forEach((item,index)=>{
      if(item.getBoundingClientRect().top<marker)active=index;
    });
    setActiveStep(active);
  }

  let raf=0;
  function onScroll(){
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      updatePage();
      updateEconomy();
    });
  }

  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll,{passive:true});

  loadLocalImages();
  setActiveStep(0);
  updatePage();
})();
