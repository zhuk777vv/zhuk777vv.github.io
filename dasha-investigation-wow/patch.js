// Investigation v3 patch: documentary artifacts + conversation evidence.
const originalGo=go;
go=function(n){
  scenes[step].classList.remove('active');
  step=n;
  scenes[step].classList.add('active');
  document.querySelector('#progress').style.width=(step/(scenes.length-1)*100)+'%';
  tone(460+step*30,.12);vibe(16);
  if(step===6)runAnalysis();
  if(step===8)runVerdict();
};
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
document.querySelector('#verdictNext').onclick=()=>go(9);
document.querySelector('#closeCase').onclick=()=>{tone(280,.5,'sine',.06);notify('оставлено открытым до нашей следующей встречи')};

const conversationWave=document.querySelector('#conversationWave');
if(conversationWave){
  for(let i=0;i<38;i++){
    const bar=document.createElement('i');
    bar.style.setProperty('--i',i);
    bar.style.setProperty('--h',(18+((i*17)%68))+'px');
    conversationWave.appendChild(bar);
  }
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
