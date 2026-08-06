import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Case = { title: string; problem: string; replace: string; restore: string; save: string; result: string };
type Service = { title: string; text: string; tags: string[] };

const phone = '+7 (991) 991-79-91';
const telegram = 'https://t.me/zhukov_boss';

const costs = ['Повреждение стекла', 'Производство нового', 'Доставка и подъём', 'Демонтаж конструкции', 'Повторный монтаж', 'Простой объекта'];
const services: Service[] = [
  { title: 'Восстановление стекла', text: 'Убираем царапины, потёртости, следы скребков, окалину, помутнение, клей, краску, цемент и силикон.', tags: ['Витрины, окна, двери, фасады', 'Предварительная оценка по фото'] },
  { title: 'Финальная подготовка объекта', text: 'Закрываем локальные отделочные замечания, выполняем финальный клининг, наносим защитные и декоративные плёнки.', tags: ['Один подрядчик вместо нескольких', 'Подготовка к сдаче или открытию'] },
  { title: 'Автомобильные стёкла', text: 'Работаем с мелкими царапинами, следами дворников и помутнением, если состояние стекла допускает полировку.', tags: ['Трещины и сколы не устраняем'] },
  { title: 'Юридически удобно', text: 'Работаем с физическими и юридическими лицами, готовим документы для закрытия задачи.', tags: ['Договор, счёт, акт, безнал', 'Москва, Санкт-Петербург, Екатеринбург и другие города'] },
];
const cases: Case[] = [
  { title: 'Витрина перед открытием магазина', problem: 'Царапины после строительной уборки грозили переносом открытия и заменой крупного стеклопакета.', replace: '312 000 ₽', restore: '96 000 ₽', save: '216 000 ₽', result: 'ориентировочно 2 дня вместо 18–21 дня ожидания новой витрины.' },
  { title: 'Фасад и перегородки бизнес-центра', problem: 'Повреждения на нескольких стеклянных элементах мешали закрыть финальные замечания.', replace: '468 000 ₽', restore: '164 000 ₽', save: '304 000 ₽', result: 'около 3 дней работы вместо 2–3 недель поставки и монтажа.' },
  { title: 'Объект полностью зафиналили перед передачей', problem: 'Восстановили стекло, закрыли локальные отделочные замечания и выполнили финальный клининг.', replace: '733 000 ₽', restore: '305 000 ₽', save: '428 000 ₽', result: 'объект доведён до готовности за 4 дня и подготовлен к передаче.' },
];
const audiences = ['Витрины', 'Бизнес-центры', 'Девелоперы', 'Управляющие компании', 'Рестораны и гостиницы', 'Частные клиенты', 'Автомобили', 'Объекты под сдачу'];

function App() {
  return <>
    <nav className="nav"><div className="wrap nav__inner"><a className="brand" href="#top"><span>glass restoration team</span><b>Восстановление стекла • Финальная подготовка объекта</b></a><div className="links"><a href="#economy">Экономика</a><a href="#services">Услуги</a><a href="#cases">Сценарии</a><a href="#how">Как работаем</a></div><a className="phone" href="tel:+79919917991">{phone}</a><a className="btn btn--dark" href={telegram}>Telegram</a></div></nav>
    <header className="hero" id="top"><div className="wrap hero__box"><div className="hero__content"><p className="eyebrow">профессиональное восстановление стекла без замены</p><h1>Не заказывайте новое стекло, пока не узнаете, можно ли сохранить текущее</h1><p className="lead">Оцениваем царапины, следы скребков, сварочную окалину, помутнение и строительные загрязнения. В подходящих случаях сохраняем стекло, бюджет и сроки объекта — без лишнего демонтажа.</p><div className="actions"><a className="btn btn--dark" href={telegram}>Отправить фото в Telegram</a><a className="btn btn--light" href="#economy">Посмотреть экономику</a></div><div className="metrics"><Metric value="до 67%" label="потенциальной экономии"/><Metric value="1 день" label="оценка по фото"/><Metric value="от 4 000 ₽" label="локальные работы"/></div></div><div className="glass"><div className="glass__clean"/><span>До: царапины и помутнение</span><span>После: восстановленная прозрачность</span></div></div></header>
    <Section id="economy" title="Один дефект может превратиться в цепочку ненужных расходов" intro="При автоматической замене вы платите не только за новое стекло, но и за производство, доставку, демонтаж, монтаж, отделку и простой объекта."><div className="costs">{costs.map((c, i)=><article className="card" key={c}><b>{i+1}</b><h3>{c}</h3><p>Проверяем, можно ли исключить этот этап за счёт восстановления установленного стекла.</p></article>)}</div><p className="quote">Правильный первый шаг — сначала проверить, можно ли восстановить установленное стекло.</p></Section>
    <section className="section dark"><div className="wrap split"><h2>Мы продаём не полировку. Мы продаём сохранённый бюджет, сроки и контроль результата.</h2><div className="panel"><h3>Что получает клиент</h3><ul><li>меньше затрат на замену;</li><li>быстрее закрытые замечания;</li><li>минимум вмешательства в конструкцию;</li><li>одного ответственного подрядчика.</li></ul></div></div></section>
    <Section id="services" title="Главная компетенция — стекло. Дополнительная сила — можем зафиналить объект целиком."><div className="services">{services.map(s=><article className="service" key={s.title}><h3>{s.title}</h3><p>{s.text}</p>{s.tags.map(t=><span key={t}>{t}</span>)}</article>)}</div></Section>
    <section className="section dark" id="cases"><div className="wrap"><h2>Расчётные сценарии: где клиент сохраняет деньги благодаря восстановлению</h2><p className="intro">Цифры показывают типовую экономику задачи. Фактическая стоимость определяется после диагностики.</p><div className="cases">{cases.map((item, i)=><article className="case" key={item.title}><div className={`case__art case__art--${i+1}`}/><div><h3>{item.title}</h3><p>{item.problem}</p><div className="numbers"><Metric value={item.replace} label="замена"/><Metric value={item.restore} label="восстановление"/><Metric value={item.save} label="экономия"/></div><p><b>Результат:</b> {item.result}</p></div></article>)}</div><p className="note">Сценарии расчётные и не являются подтверждёнными публичными кейсами.</p></div></section>
    <Section id="how" title="Как мы работаем"><div className="steps">{['Фото','Оценка','Выезд','Работа','Сдача'].map((s,i)=><article className="step" key={s}><b>{i+1}</b><strong>{s}</strong><p>{['Вы отправляете фотографии и описание задачи.','Говорим, есть ли смысл в восстановлении.','Подтверждаем решение на объекте.','Восстанавливаем стекло и сопутствующие зоны.','Контролируем результат и закрываем документы.'][i]}</p></article>)}</div></Section>
    <Section title="Где услуга особенно выгодна"><div className="audiences">{audiences.map(a=><article className="aud" key={a}><h3>{a}</h3><p>Сохраняйте сроки, внешний вид и бюджет без автоматической замены.</p></article>)}</div></Section>
    <section className="section"><div className="wrap cta"><div><p className="eyebrow">следующий шаг</p><h2>Перед тем как оплачивать замену, пришлите фото</h2><p>В день обращения дадим предварительный ответ, ориентир по стоимости и скажем, какой путь рациональнее.</p><div className="actions"><a className="btn btn--gold" href={telegram}>Отправить фото</a><a className="btn btn--light" href="tel:+79919917991">Позвонить</a></div></div><address><b>Контакт:</b> Иван<br/><b>Телефон:</b> {phone}<br/><b>Telegram:</b> @zhukov_boss<br/><b>E-mail:</b> zhukov_boss@mail.ru<br/><b>География:</b> Москва, Санкт-Петербург, Екатеринбург, другие города по согласованию</address></div></section>
    <footer className="footer"><div className="wrap">Информация не является публичной офертой. Возможность восстановления и итоговая стоимость определяются после диагностики или осмотра.</div></footer><div className="sticky"><a href={telegram}>Отправить фото</a><a href="tel:+79919917991">☎</a></div>
  </>;
}
function Metric({value,label}:{value:string;label:string}){return <div className="metric"><strong>{value}</strong><span>{label}</span></div>}
function Section({id,title,intro,children}:{id?:string;title:string;intro?:string;children:React.ReactNode}){return <section className="section" id={id}><div className="wrap"><h2>{title}</h2>{intro && <p className="intro">{intro}</p>}{children}</div></section>}

createRoot(document.getElementById('root')!).render(<App />);
