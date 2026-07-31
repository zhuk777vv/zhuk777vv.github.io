const scenes=[...document.querySelectorAll('.scene')],bar=document.querySelector('#progress'),toast=document.querySelector('#toast');
let step=0,audioCtx,master,audioOn=false;
function audio(){if(audioCtx)return;audioCtx=new(window.AudioContext||window.webkitAudioContext)();master=audioCtx.createGain();master.gain.value=.11;master.connect(audioCtx.destination);audioOn=true;document.querySelector('#sound').textContent='♪'}
function tone(f=440,d=.12,type='triangle',v=.08){if(!audioOn)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+d);o.connect(g);g.connect(master);o.start();o.stop(audioCtx.currentTime+d)}
function vibe(v=14){if(navigator.vibrate)navigator.vibrate(v)}
function notify(t){toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1450)}
function go(n){scenes[step].classList.remove('active');step=n;scenes[step].classList.add('active');document.querySelector('#progress').style.width=(step/(scenes.length-1)*100)+'%';tone(460+step*30,.12);vibe(16);if(step===6)runAnalysis();if(step===7)runVerdict()}
document.querySelector('#sound').onclick=()=>{audio();tone(690,.13)}
document.querySelector('#openCase').onclick=()=>{audio();document.querySelector('#folder').classList.add('open');tone(180,.45,'sawtooth',.04);setTimeout(()=>go(1),900)}

const modal=document.querySelector('#modal'),modalImg=document.querySelector('#modalImg'),modalTitle=document.querySelector('#modalTitle'),modalText=document.querySelector('#modalText');
let seen=0;
document.querySelectorAll('.ev').forEach(ev=>ev.onclick=()=>{audio();modalImg.src=ev.querySelector('img').src;modalTitle.textContent=ev.dataset.title;modalText.textContent=ev.dataset.copy;modal.classList.add('open');if(!ev.classList.contains('seen')){ev.classList.add('seen');seen++;document.querySelector('#counter').textContent='ИЗУЧЕНО: '+Math.min(seen,4)+' / 4';tone(520+seen*40,.16);if(seen>=4){document.querySelector('#boardNext').disabled=false;notify('картина уже слишком понятна')}}});
document.querySelector('#modalClose').onclick=()=>modal.classList.remove('open');
document.querySelector('#boardNext').onclick=()=>go(2);

let order=[];
const labels={1:'Автомагазин',2:'Теремок',3:'Кататься и говорить'};
document.querySelectorAll('.route-item').forEach(it=>it.onclick=()=>{audio();if(it.classList.contains('chosen'))return;order.push(Number(it.dataset.order));it.classList.add('chosen');it.dataset.index=order.length;document.querySelector('#routeSeq').textContent=order.map((x,i)=>(i+1)+'. '+labels[x]).join(' → ');tone(470+order.length*45,.1);if(order.length===3){if(order.join()==='1,2,3'){document.querySelector('#routeNext').disabled=false;notify('маршрут подтверждён')}else{notify('детали не сходятся');setTimeout(()=>{order=[];document.querySelectorAll('.route-item').forEach(x=>{x.classList.remove('chosen');x.removeAttribute('data-index')});document.querySelector('#routeSeq').textContent='Первый пункт пока не выбран.'},850)}}});
document.querySelector('#routeNext').onclick=()=>go(3);

let holdTimer,start,driveDone=false;
const hold=document.querySelector('#holdDrive'),meter=document.querySelector('#driveMeter'),clock=document.querySelector('#clock'),drive=document.querySelector('#drive');
function driveProgress(p){meter.style.width=p*100+'%';let mins=Math.round(419*p),total=22*60+41+mins;if(total>=1440)total-=1440;clock.textContent=String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');if(p>.74)drive.classList.add('dawn')}
function holdStart(e){e.preventDefault();audio();if(driveDone)return;start=Date.now();clearInterval(holdTimer);holdTimer=setInterval(()=>{let p=Math.min((Date.now()-start)/3000,1);driveProgress(p);if(p>=1){clearInterval(holdTimer);driveDone=true;document.querySelector('#clockLabel').textContent='РАССВЕТ';document.querySelector('#driveText').textContent='Именно так и проходили встречи: ночь заканчивалась раньше, чем разговор.';document.querySelector('#driveNext').disabled=false;notify('ночь восстановлена');vibe([20,35,20])}},30)}
function holdEnd(){if(driveDone)return;clearInterval(holdTimer);meter.style.width='0';clock.textContent='22:41';drive.classList.remove('dawn')}
hold.addEventListener('pointerdown',holdStart);hold.addEventListener('pointerup',holdEnd);hold.addEventListener('pointerleave',holdEnd);hold.addEventListener('pointercancel',holdEnd);
document.querySelector('#driveNext').onclick=()=>go(4);

let parkStartX=0,parkLit=false;const park=document.querySelector('#park');
park.addEventListener('pointerdown',e=>{audio();parkStartX=e.clientX});
park.addEventListener('pointerup',e=>{if(parkLit)return;if(Math.abs(e.clientX-parkStartX)>35||true){parkLit=true;park.classList.add('lit');document.querySelector('#parkText').textContent='Место можно было выбрать любое. Но запомнилось именно это — потому что рядом была ты.';document.querySelector('#parkNext').disabled=false;tone(720,.22);notify('огни включены')}});
document.querySelector('#parkNext').onclick=()=>go(5);

const box=document.querySelector('#distance'),a=document.querySelector('#pointA'),b=document.querySelector('#pointB'),line=document.querySelector('#liveLine');
let dragging=false,connected=false;
function pos(el){const r=el.getBoundingClientRect(),q=box.getBoundingClientRect();return{x:r.left+r.width/2-q.left,y:r.top+r.height/2-q.top}}
function draw(x,y){const s=pos(a);line.setAttribute('d',`M ${s.x} ${s.y} C ${s.x+75} ${s.y+45} ${x-75} ${y-45} ${x} ${y}`)}
a.addEventListener('pointerdown',e=>{audio();if(connected)return;dragging=true;a.setPointerCapture(e.pointerId)});
a.addEventListener('pointermove',e=>{if(!dragging||connected)return;const r=box.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;draw(x,y);const rb=b.getBoundingClientRect(),dx=e.clientX-(rb.left+rb.width/2),dy=e.clientY-(rb.top+rb.height/2);if(Math.hypot(dx,dy)<42){connected=true;dragging=false;const p=pos(b);draw(p.x,p.y);document.querySelector('#dragHint').textContent='Связь не прервалась. Расстояние — только временная помеха.';document.querySelector('#distanceNext').disabled=false;notify('нить дотянулась');tone(760,.2);vibe([20,35,20])}});
a.addEventListener('pointerup',()=>{if(!connected){dragging=false;const p=pos(a);draw(p.x,p.y)}});
setTimeout(()=>{const p=pos(a);draw(p.x,p.y)},100);
document.querySelector('#distanceNext').onclick=()=>go(6);

let analyzed=false;
function runAnalysis(){if(analyzed)return;analyzed=true;const checks=[...document.querySelectorAll('.check')];checks.forEach((c,i)=>{c.style.opacity='0';setTimeout(()=>{c.style.transition='.3s';c.style.opacity='1';tone(350+i*45,.08,'square',.035)},i*260)});setTimeout(()=>{document.querySelector('#stamp').classList.add('show');document.querySelector('#analysisNext').disabled=false;notify('официальная версия отклонена');vibe([30,50,30])},checks.length*260+250)}
document.querySelector('#analysisNext').onclick=()=>go(7);

let verdictRun=false;
function runVerdict(){if(verdictRun)return;verdictRun=true;const lines=[...document.querySelectorAll('.verdict-line')];lines.forEach((l,i)=>setTimeout(()=>{l.classList.add('show');tone(430+i*60,.1)},i*520));setTimeout(()=>{document.querySelector('#verdictNext').disabled=false},lines.length*520+250)}
document.querySelector('#verdictNext').onclick=()=>go(8);
document.querySelector('#closeCase').onclick=()=>{tone(280,.5,'sine',.06);notify('дело не закрыто. просто временно отложено ♥')}