import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';

const base='http://127.0.0.1:8080/premium-v14/';
const viewports=[
  {name:'iphone-se',width:360,height:800},
  {name:'iphone-14',width:390,height:844},
  {name:'large-mobile',width:430,height:932},
  {name:'desktop',width:1440,height:1000},
];
await fs.mkdir('audit-output',{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[],notes=[];

for(const viewport of viewports){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const runtimeErrors=[];
  page.on('pageerror',e=>runtimeErrors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')runtimeErrors.push(`console: ${m.text()}`)});
  const response=await page.goto(base,{waitUntil:'networkidle',timeout:60000});
  if(!response?.ok())failures.push(`${viewport.name}: page status is not OK`);

  const state=await page.evaluate(()=>({
    h1:document.querySelector('h1')?.textContent?.trim(),
    brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),
    proofImages:[...document.querySelectorAll('#beforeAfter img')].map(i=>({w:i.naturalWidth,h:i.naturalHeight,src:i.getAttribute('src')})),
    telegram:[...document.querySelectorAll('a[href*="t.me/"]')].map(a=>({href:a.href,target:a.target})),
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
  }));
  if(state.h1!=='Не меняйте стекло из-за царапин')failures.push(`${viewport.name}: unexpected H1`);
  if(state.brokenImages.length)failures.push(`${viewport.name}: broken images ${state.brokenImages.join(', ')}`);
  if(state.proofImages.some(i=>i.w<2000||i.h<1200))failures.push(`${viewport.name}: proof image resolution ${JSON.stringify(state.proofImages)}`);
  if(state.telegram.length<7||state.telegram.some(x=>x.href!=='https://t.me/zhukov_boss'||x.target))failures.push(`${viewport.name}: Telegram links ${JSON.stringify(state.telegram)}`);
  if(state.overflow>2)failures.push(`${viewport.name}: horizontal overflow ${state.overflow}px`);

  await page.locator('[data-state="before"]').click();await page.waitForTimeout(800);
  const beforeSplit=await page.locator('#splitHandle').getAttribute('aria-valuenow');
  await page.locator('[data-state="after"]').click();await page.waitForTimeout(800);
  const afterSplit=await page.locator('#splitHandle').getAttribute('aria-valuenow');
  if(Number(beforeSplit)<92||Number(afterSplit)>8)failures.push(`${viewport.name}: before/after controls failed`);
  await page.locator('[data-state="compare"]').click();await page.waitForTimeout(500);
  await page.locator('#proof').screenshot({path:`audit-output/${viewport.name}-proof.png`});

  await page.locator('[data-mode="replace"]').click();await page.waitForTimeout(550);
  const replacementMoney=(await page.locator('#decisionMoney').textContent())?.replace(/\s/g,'');
  await page.locator('[data-mode="restore"]').click();await page.waitForTimeout(550);
  const restorationMoney=(await page.locator('#decisionMoney').textContent())?.replace(/\s/g,'');
  if(!replacementMoney?.includes('312000')||!restorationMoney?.includes('96000'))failures.push(`${viewport.name}: scenario switch failed`);

  await page.locator('input[name="area"]').fill('14');await page.locator('input[name="pieces"]').fill('5');
  const calc=await page.evaluate(()=>({replacement:document.querySelector('#replacementRange')?.textContent,restoration:document.querySelector('#restorationRange')?.textContent,saving:document.querySelector('#savingMoney')?.textContent}));
  if(Object.values(calc).some(v=>!v||v==='—'))failures.push(`${viewport.name}: calculator did not update`);

  await page.locator('#economics').scrollIntoViewIfNeeded();await page.waitForTimeout(300);
  await page.locator('#lossSteps article').nth(2).scrollIntoViewIfNeeded();await page.waitForTimeout(650);
  const economics=await page.evaluate(()=>({loss:document.querySelector('#lossMoney')?.textContent,strip:document.querySelector('.loss-strip')?{display:getComputedStyle(document.querySelector('.loss-strip')).display,visibility:getComputedStyle(document.querySelector('.loss-strip')).visibility,money:document.querySelector('.loss-strip strong')?.textContent}:null}));
  if(!economics.loss||economics.loss==='0 ₽')failures.push(`${viewport.name}: money counter did not update`);
  if(viewport.width<=760&&(economics.strip?.display==='none'||economics.strip?.visibility!=='visible'))failures.push(`${viewport.name}: mobile economics strip is not visible ${JSON.stringify(economics.strip)}`);
  await page.screenshot({path:`audit-output/${viewport.name}-economics.png`});

  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
  for(const v of axe.violations.filter(v=>['serious','critical'].includes(v.impact??''))){failures.push(`${viewport.name}: accessibility ${v.id} — ${v.nodes.slice(0,5).flatMap(n=>n.target).join(' | ')}`);}
  if(runtimeErrors.length)failures.push(`${viewport.name}: ${runtimeErrors.join(' | ')}`);
  notes.push(`${viewport.name}: overflow=${state.overflow}px, telegram=${state.telegram.length}, images=${JSON.stringify(state.proofImages)}, economics=${JSON.stringify(economics)}, calc=${JSON.stringify(calc)}`);
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);await page.screenshot({path:`audit-output/${viewport.name}-full.png`,fullPage:true});
  await context.close();
}
await browser.close();
const report=['PREMIUM V14 AUDIT','',...notes,'',failures.length?'FAILURES':'RESULT: PASSED',...failures.map(f=>`- ${f}`)].join('\n');
await fs.writeFile('audit-output/report.txt',report,'utf8');console.log(report);if(failures.length)process.exit(1);
