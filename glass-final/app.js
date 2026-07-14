(()=>{
  'use strict';
  const $=(s,c=document)=>c.querySelector(s);
  const pageProgress=$('#pageProgress');
  const mobileActions=$('#mobileActions');
  let scrollRaf=0;
  function updateScroll(){
    if(scrollRaf)return;
    scrollRaf=requestAnimationFrame(()=>{
      scrollRaf=0;
      const max=document.documentElement.scrollHeight-innerHeight;
      if(pageProgress)pageProgress.style.width=`${max>0?scrollY/max*100:0}%`;
      mobileActions?.classList.toggle('show',scrollY>520);
    });
  }
  addEventListener('scroll',updateScroll,{passive:true});
  addEventListener('resize',updateScroll,{passive:true});
  const compare=$('#compare'),after=$('#compareAfter'),line=$('#compareLine'),handle=$('#compareHandle');
  let split=50,dragging=false,startX=0,startY=0,horizontal=false;
  function setSplit(value){
    if(!compare)return;
    split=Math.max(0,Math.min(100,value));
    compare.style.setProperty('--split',`${split}%`);
    if(after)after.style.clipPath=`inset(0 0 0 ${split}%)`;
    if(line)line.style.left=`${split}%`;
    handle?.setAttribute('aria-valuenow',String(Math.round(split)));
  }
  function splitFromX(x){const rect=compare.getBoundingClientRect();setSplit((x-rect.left)/rect.width*100)}
  if(compare){
    setSplit(50);
    compare.addEventListener('pointerdown',event=>{dragging=true;horizontal=false;startX=event.clientX;startY=event.clientY;compare.setPointerCapture?.(event.pointerId)});
    compare.addEventListener('pointermove',event=>{if(!dragging)return;const dx=event.clientX-startX,dy=event.clientY-startY;if(!horizontal&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy))horizontal=true;if(horizontal){event.preventDefault();splitFromX(event.clientX)}});
    const finish=event=>{dragging=false;horizontal=false;compare.releasePointerCapture?.(event.pointerId)};
    compare.addEventListener('pointerup',finish);compare.addEventListener('pointercancel',finish);
    handle?.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){setSplit(split-5);event.preventDefault()}if(event.key==='ArrowRight'){setSplit(split+5);event.preventDefault()}});
  }
  updateScroll();
})();