(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const money=n=>`${Math.round(n).toLocaleString('ru-RU')} ₽`;
const progress=$('#progress');
const sticky=$('#stickyCta');
const hero=$('.hero');
const car=$('#heroCar');
const updateScroll=()=>{
const max=document.documentElement.scrollHeight-innerHeight;
if(progress)progress.style.width=`${Math.max(0,Math.min(1,max?scrollY/max:0))*100}%`;
sticky?.classList.toggle('visible',scrollY>innerHeight*.85);
if(!reduced && hero && car && innerWidth>759){
const rect=hero.getBoundingClientRect();
const p=Math.max(0,Math.min(1,-rect.top/Math.max(1,hero.offsetHeight-innerHeight*.45)));
car.style.transform=`translate3d(${p*12}px,${p*-8}px,0) scale(${1+p*.018})`;
}
};
addEventListener('scroll',updateScroll,{passive:true});
addEventListener('resize',updateScroll,{passive:true});
updateScroll();
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}
}),{threshold:.12,rootMargin:'0px 0px -50px'});
$$('.reveal').forEach(el=>reduced?el.classList.add('visible'):observer.observe(el));
setTimeout(()=>$('#heroScene')?.classList.add('active'),320);
const mobileMenu=$('#mobileMenu');
const setMenu=open=>{
mobileMenu?.classList.toggle('open',open);
mobileMenu?.setAttribute('aria-hidden',String(!open));
document.body.classList.toggle('lock',open);
(open?$('#menuClose'):$('#menuOpen'))?.focus();
};
$('#menuOpen')?.addEventListener('click',()=>setMenu(true));
$('#menuClose')?.addEventListener('click',()=>setMenu(false));
$$('#mobileMenu a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
const modal=$('#modal');
let previousFocus=null;
const setModal=open=>{
if(!modal)return;
if(open)previousFocus=document.activeElement;
modal.classList.toggle('open',open);
modal.setAttribute('aria-hidden',String(!open));
document.body.classList.toggle('lock',open);
if(open)$('#modalClose')?.focus(); else previousFocus?.focus?.();
};
$$('.js-contact').forEach(b=>b.addEventListener('click',()=>setModal(true)));
$('#modalClose')?.addEventListener('click',()=>setModal(false));
modal?.addEventListener('mousedown',e=>{if(e.target===modal)setModal(false)});
addEventListener('keydown',e=>{if(e.key==='Escape'){setModal(false);setMenu(false)}});
$('#demo')?.addEventListener('click',()=>$('#losses')?.scrollIntoView({behavior:reduced?'auto':'smooth'}));
const heroStatus=$('#heroStatus');
const lossPanels=$$('.loss-panel');
lossPanels.forEach(panel=>{
const activate=()=>{if(heroStatus)heroStatus.textContent=panel.dataset.status||''};
panel.addEventListener('mouseenter',activate);
panel.addEventListener('focusin',activate);
panel.addEventListener('click',activate);
});
const chats=[
{
car:'Audi S8 · 2021',next:'Запись создана · Вт 14:30',
messages:[
['client','Добрый вечер. Хочу записаться на плановое ТО. Audi S8, 2021 год.'],
['master','Подберу удобное окно. Подскажите текущий пробег.'],
['client','74 800 км.'],
['master','Свободно: вторник 14:30 или четверг 11:00. Какое окно закрепить?'],
['client','Давайте вторник.'],
['system','Запись создана · Audi S8 · Вторник, 14:30']
]
},
{
car:'G-Class · 2020',next:'Диагностика · завтра 10:30',
messages:[
['client','Появилась вибрация и загорелся чек. Можно понять стоимость?'],
['master','Точную стоимость без диагностики обещать неправильно. Какая машина и когда появилась проблема?'],
['client','G-Class 2020. После трассы. VIN могу прислать.'],
['master','Пришлите VIN и фото панели — добавлю всё в обращение.'],
['system','VIN, фото и описание прикреплены к обращению'],
['master','Есть окно завтра в 10:30 или 17:00.']
]
},
{
car:'Porsche 911 · 2022',next:'Профильный мастер подключён',
messages:[
['client','После замены блока нужен точный ответ по программированию системы.'],
['master','Уточню год автомобиля и какой блок был заменён.'],
['client','Porsche 911, 2022. Блок управления подвеской.'],
['master','Здесь нужен профильный мастер по электронике и конфигурации автомобиля.'],
['master','Подключаю специалиста. Все данные уже передал.'],
['system','Профильный мастер подключён · история передана']
]
}
];
const renderChat=i=>{
const d=chats[i];
const box=$('#chatBox');
if(!box)return;
box.innerHTML=d.messages.map((m,n)=>`<div class="msg ${m[0]}" style="animation-delay:${n*.045}s">${m[1]}</div>`).join('');
$('#bookCar').textContent=d.car;
$('#bookNext').textContent=d.next;
$$('#chatTabs button').forEach((b,n)=>b.classList.toggle('active',n===i));
};
$$('#chatTabs button').forEach((b,i)=>b.addEventListener('click',()=>renderChat(i)));
renderChat(0);
const periods={
day:{revenue:718000,delta:'−11% к прошлому вторнику',alerts:['08:10 · Выручка ниже нормы','10:42 · Пост 02 простаивает 2,1 часа','12:05 · 4 заказа задержаны на согласовании','14:18 · На завтра свободно 6 окон']},
week:{revenue:4316000,delta:'+4% к прошлой неделе',alerts:['Пн · Средний чек выше нормы','Вт · Недогруз второй смены','Ср · База дала 7 записей','Пт · План выполнен на 103%']},
month:{revenue:18340000,delta:'+7% к прошлому месяцу',alerts:['Неделя 1 · Перегрузка в пиковые часы','Неделя 2 · База дала 18 записей','Неделя 3 · Меньше вечерних потерь','Неделя 4 · План выполнен на 107%']}
};
const renderPeriod=key=>{
const d=periods[key];
$('#revenueValue').textContent=money(d.revenue);
const delta=$('#delta');delta.textContent=d.delta;delta.style.color=d.delta.startsWith('−')?'#ff8a82':'#67d58a';
$('#alerts').innerHTML=d.alerts.map(x=>`<p>${x}</p>`).join('');
$$('#periods button').forEach(b=>b.classList.toggle('active',b.dataset.period===key));
};
$$('#periods button').forEach(b=>b.addEventListener('click',()=>renderPeriod(b.dataset.period)));
renderPeriod('day');
$$('.bay').forEach(b=>b.addEventListener('click',()=>{
const text={work:'Автомобиль в работе. Система контролирует этап и время.',idle:'Пост простаивает. Руководитель получает уведомление, пока окно ещё можно загрузить.',wait:'Заказ задержан на согласовании. Нужна реакция сотрудника.'}[b.dataset.state];
$('#bayInfo').textContent=text;
$$('.bay').forEach(x=>x.style.outline='');
b.style.outline='2px solid rgba(255,255,255,.9)';
}));
$('#task')?.addEventListener('click',e=>{
const btn=e.currentTarget;
btn.textContent='✓ Задача сотруднику создана';
btn.classList.add('done');
setTimeout(()=>{btn.textContent='Создать задачу сотруднику →';btn.classList.remove('done')},2600);
});
const brandRange=$('#brandRange'),brandAfter=$('#brandAfter'),brandDivider=$('#brandDivider');
const updateBrand=()=>{
const v=Number(brandRange?.value||50);
if(brandAfter)brandAfter.style.clipPath=`inset(0 0 0 ${v}%)`;
if(brandDivider)brandDivider.style.left=`${v}%`;
};
brandRange?.addEventListener('input',updateBrand);
updateBrand();
const avg=$('#avg'),extra=$('#extra');
const calculate=()=>{
const a=Number(avg?.value||0),e=Number(extra?.value||0);
$('#avgValue').textContent=money(a);
$('#extraValue').textContent=String(e);
$('#formula').textContent=`${e} заказ-нарядов × ${money(a)}`;
$('#total').textContent=money(a*e);
};
avg?.addEventListener('input',calculate);extra?.addEventListener('input',calculate);calculate();
})();