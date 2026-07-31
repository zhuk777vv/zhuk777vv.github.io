// Investigation v4: documentary artifacts, recovered conversation, sealed final evidence and cinematic epilogue.

// Replace the stock-photo modal with documentary evidence copies.
const artifactHost=document.querySelector('#modalArtifact');
document.querySelectorAll('.ev').forEach(ev=>ev.onclick=()=>{
  audio();
  artifactHost.innerHTML='';
  artifactHost.appendChild(ev.querySelector('.artifact').cloneNode(true));
  modalTitle.textContent=ev.dataset.title;
  modalText.textContent=ev.dataset.copy;
  modal.classList.add('open');
  if(!ev.classList.contains('seen')){
    ev.classList.add('seen');seen++;
    document.querySelector('#counter').textContent='ИЗУЧЕНО: '+Math.min(seen,4)+' / 4';
    tone(520+seen*40,.16);
    if(seen>=4){document.querySelector('#boardNext').disabled=false;notify('картина уже слишком понятна')}
  }
});

// Rebuild the personal ending so it sounds direct, not scripted.
const finalScene=document.querySelector('.scene[data-step="9"]');
finalScene.dataset.step='10';
finalScene.querySelector('h2').textContent='Ладно. По-честному.';
finalScene.querySelector('.letter p').innerHTML=`
  Мне не хочется прятать это за папками и красивыми формулировками.<br><br>
  С тобой мне реально легко и интересно. Я скучаю по ночным поездкам, разговорам обо всём, твоему голосу и тому, как рядом с тобой время просто исчезало.<br><br>
  Сейчас мы в разных городах. Меня это бесит, но ничего не отменяет.<br><br>
  <strong>Ты мне очень нравишься. Сильнее, чем я собирался это признавать.</strong><br><br>
  Я хочу увидеть тебя снова. Не когда-нибудь — как только сможем.
`;
finalScene.querySelector('.signature').textContent='Иван';

// Insert a hidden final evidence scene immediately before the personal message.
const sealedScene=document.createElement('section');
sealedScene.className='scene';
sealedScene.dataset.step='9';
sealedScene.innerHTML=`
  <div class="kicker">последняя улика · вне материалов дела</div>
  <h2>Остался один запечатанный конверт</h2>
  <p>Он не числится в архиве. Проведи по печати слева направо — и станет понятно, кто оставил его здесь.</p>
  <div class="sealed-evidence" id="sealedEvidence">
    <div class="envelope-shadow"></div>
    <div class="envelope-body">
      <div class="envelope-flap"></div>
      <div class="hidden-note"><small>ЛИЧНО · НЕ ПОДШИВАТЬ</small><b>Последняя улика</b><p>Эту часть система не нашла. Я оставил её сам.</p></div>
      <div class="seal-track"><span class="seal-line"></span><i id="waxSeal">4592</i><em>проведи →</em></div>
    </div>
  </div>
  <div class="actions"><button class="btn" disabled id="sealNext">Открыть личное сообщение</button></div>
`;
finalScene.before(sealedScene);
scenes.splice(9,0,sealedScene);

// Add a true final frame instead of a small toast.
const epilogue=document.createElement('div');
epilogue.className='case-epilogue';
epilogue.id='caseEpilogue';
epilogue.innerHTML=`
  <div class="epilogue-inner">
    <div class="epilogue-code">CASE 4592 · STATUS UPDATE</div>
    <div class="epilogue-stamp">ДЕЛО ОСТАВЛЕНО<br>ОТКРЫТЫМ</div>
    <p>Следующий материал появится только после нашей встречи.</p>
    <small>продолжение следует</small>
    <button id="epilogueBack">Вернуться в архив</button>
  </div>
`;
document.body.appendChild(epilogue);

// Final-scene styles are injected here so the existing page URL can be upgraded atomically.
const finalStyle=document.createElement('style');
finalStyle.textContent=`
.sealed-evidence{margin-top:22px;min-height:360px;position:relative;display:grid;place-items:center;perspective:900px}
.envelope-shadow{position:absolute;width:min(88%,480px);height:52%;bottom:12%;border-radius:50%;background:rgba(0,0,0,.6);filter:blur(26px)}
.envelope-body{position:relative;width:min(92%,500px);height:270px;background:linear-gradient(145deg,#c8b89d,#e4d8c3 55%,#b9a487);box-shadow:0 28px 70px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.12);overflow:hidden;transform:rotate(-1deg);transition:.85s cubic-bezier(.2,.8,.2,1)}
.envelope-body:before,.envelope-body:after{content:"";position:absolute;bottom:-2px;width:72%;height:68%;background:linear-gradient(145deg,#bdaa8b,#d7c7aa);z-index:2}
.envelope-body:before{left:-22%;clip-path:polygon(0 100%,100% 0,100% 100%)}
.envelope-body:after{right:-22%;clip-path:polygon(0 0,100% 100%,0 100%)}
.envelope-flap{position:absolute;z-index:4;left:0;right:0;top:0;height:72%;background:linear-gradient(165deg,#e1d5c1,#bca98a);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top center;transition:1s cubic-bezier(.2,.85,.25,1)}
.hidden-note{position:absolute;z-index:3;left:8%;right:8%;top:26%;padding:20px 18px 28px;background:#eee5d6;color:#211d17;box-shadow:0 8px 20px rgba(0,0,0,.18);transform:translateY(50px);transition:1s cubic-bezier(.2,.85,.25,1)}
.hidden-note small{display:block;font:800 8px/1 ui-monospace,Menlo,monospace;letter-spacing:.16em;color:#8b332d}.hidden-note b{display:block;margin-top:11px;font:700 29px/.95 Georgia,serif}.hidden-note p{color:#423a30;font:16px/1.42 Georgia,serif;margin:12px 0 0}
.seal-track{position:absolute;z-index:7;left:11%;right:11%;top:50%;height:64px;transform:translateY(-50%);border-top:1px dashed rgba(75,49,31,.35);border-bottom:1px dashed rgba(75,49,31,.25)}
.seal-line{position:absolute;left:0;right:0;top:50%;height:2px;background:rgba(120,48,38,.25)}
.seal-track i{position:absolute;left:0;top:50%;width:62px;height:62px;margin-top:-31px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,#ca6557,#7f2722 64%,#571915);color:#eac2a9;border:3px double rgba(255,218,194,.35);box-shadow:0 10px 20px rgba(0,0,0,.35),inset 0 0 14px rgba(0,0,0,.35);font:900 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.08em;touch-action:none;user-select:none;transition:transform .12s}
.seal-track em{position:absolute;right:0;top:50%;transform:translateY(-50%);font:800 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.13em;color:#6f5b46;font-style:normal}
.sealed-evidence.opened .envelope-body{transform:rotate(0deg) translateY(8px)}
.sealed-evidence.opened .envelope-flap{transform:rotateX(168deg);z-index:1}
.sealed-evidence.opened .hidden-note{transform:translateY(-30px);z-index:6}
.sealed-evidence.opened .seal-track{opacity:0;transition:.35s}
.case-epilogue{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:28px;background:radial-gradient(circle at 50% 40%,rgba(83,30,27,.22),transparent 36%),#050607;opacity:0;pointer-events:none;transition:.8s}
.case-epilogue.show{opacity:1;pointer-events:auto}
.epilogue-inner{text-align:center;max-width:520px;transform:scale(.94);opacity:0;transition:.8s .25s}
.case-epilogue.show .epilogue-inner{transform:none;opacity:1}
.epilogue-code{font:800 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.24em;color:#a99b82;margin-bottom:28px}
.epilogue-stamp{display:inline-block;padding:22px 24px;border:5px double rgba(198,74,65,.72);color:#d15a50;font:900 clamp(28px,8vw,46px)/.94 ui-monospace,Menlo,monospace;letter-spacing:.06em;transform:rotate(-5deg);text-shadow:0 0 24px rgba(209,90,80,.18);animation:epStamp .52s .55s cubic-bezier(.15,1.5,.3,1) both}
@keyframes epStamp{from{transform:rotate(-5deg) scale(1.7);opacity:0}to{transform:rotate(-5deg) scale(1);opacity:1}}
.epilogue-inner p{margin:34px auto 0;color:#e8e3da;font:22px/1.5 Georgia,serif;max-width:440px}.epilogue-inner small{display:block;margin-top:18px;color:#827f79;font:800 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.19em;text-transform:uppercase}
#epilogueBack{margin-top:34px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#b8b3aa;border-radius:15px;padding:13px 18px;font-weight:700}
@media(max-height:720px){.sealed-evidence{min-height:300px}.envelope-body{height:225px}.letter{min-height:450px}.letter p{font-size:17px;line-height:1.48}}
`;
document.head.appendChild(finalStyle);

// Override navigation after the new scene is inserted.
go=function(n){
  scenes[step].classList.remove('active');
  step=n;
  scenes[step].classList.add('active');
  document.querySelector('#progress').style.width=(step/(scenes.length-1)*100)+'%';
  tone(460+step*30,.12);vibe(16);
  if(step===6)runAnalysis();
  if(step===8)runVerdict();
};

// Reconstructed conversation evidence.
const conversationWave=document.querySelector('#conversationWave');
for(let i=0;i<38;i++){
  const bar=document.createElement('i');
  bar.style.setProperty('--i',i);
  bar.style.setProperty('--h',(18+((i*17)%68))+'px');
  conversationWave.appendChild(bar);
}
let conversationPlayed=false;
const playConversation=document.querySelector('#playConversation');
playConversation.onclick=()=>{
  audio();if(conversationPlayed)return;conversationPlayed=true;
  conversationWave.classList.add('playing');
  playConversation.querySelector('span').textContent='Фрагмент восстанавливается…';
  [...document.querySelectorAll('#transcript p')].forEach((p,i)=>setTimeout(()=>{p.classList.add('show');tone(390+i*75,.12,'triangle',.045)},550+i*850));
  setTimeout(()=>{
    conversationWave.classList.remove('playing');
    document.querySelector('#audioResult').classList.add('show');
    document.querySelector('#conversationNext').disabled=false;
    playConversation.querySelector('span').textContent='Фрагмент восстановлен';
    notify('разговор сохранён в материалах дела');vibe([18,35,18]);
  },3300);
};
document.querySelector('#conversationNext').onclick=()=>go(8);
document.querySelector('#verdictNext').onclick=()=>go(9);

// Wax-seal drag interaction.
const sealedEvidence=document.querySelector('#sealedEvidence');
const waxSeal=document.querySelector('#waxSeal');
const sealNext=document.querySelector('#sealNext');
let sealDragging=false,sealOpened=false,sealOffset=0;
waxSeal.addEventListener('pointerdown',e=>{
  audio();if(sealOpened)return;
  sealDragging=true;
  const r=waxSeal.getBoundingClientRect();
  sealOffset=e.clientX-r.left;
  waxSeal.setPointerCapture(e.pointerId);
  tone(210,.18,'sawtooth',.035);
});
waxSeal.addEventListener('pointermove',e=>{
  if(!sealDragging||sealOpened)return;
  const track=waxSeal.parentElement.getBoundingClientRect();
  const max=track.width-waxSeal.offsetWidth;
  const x=Math.max(0,Math.min(max,e.clientX-track.left-sealOffset));
  waxSeal.style.transform='translateX('+x+'px)';
  if(x>max*.78){
    sealOpened=true;sealDragging=false;
    waxSeal.style.transform='translateX('+max+'px) scale(.82)';
    sealedEvidence.classList.add('opened');
    sealNext.disabled=false;
    tone(145,.48,'sawtooth',.055);setTimeout(()=>tone(620,.22,'triangle',.08),300);
    vibe([24,45,24]);notify('печать сорвана');
  }
});
function resetSeal(){if(sealOpened)return;sealDragging=false;waxSeal.style.transform='translateX(0)'}
waxSeal.addEventListener('pointerup',resetSeal);
waxSeal.addEventListener('pointercancel',resetSeal);
sealNext.onclick=()=>go(10);

// Cinematic final status frame.
document.querySelector('#closeCase').onclick=()=>{
  tone(220,.6,'sine',.06);vibe([25,60,30]);epilogue.classList.add('show');
};
document.querySelector('#epilogueBack').onclick=()=>epilogue.classList.remove('show');
