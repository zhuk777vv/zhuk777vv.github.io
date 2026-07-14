import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';

const base = 'http://127.0.0.1:8080/premium-v14/';
const viewports = [
  { name: 'iphone-se', width: 360, height: 800 },
  { name: 'iphone-14', width: 390, height: 844 },
  { name: 'large-mobile', width: 430, height: 932 },
  { name: 'desktop', width: 1440, height: 1000 },
];

await fs.mkdir('audit-output', { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const notes = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
  });

  const response = await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  if (!response || !response.ok()) failures.push(`${viewport.name}: page status is not OK`);

  const pageState = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim(),
    brokenImages: [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    linksWithoutHref: [...document.querySelectorAll('a')].filter(a => !a.getAttribute('href')).length,
  }));

  if (pageState.h1 !== 'Не меняйте стекло из-за царапин') failures.push(`${viewport.name}: unexpected H1`);
  if (pageState.brokenImages.length) failures.push(`${viewport.name}: broken images ${pageState.brokenImages.join(', ')}`);
  if (pageState.overflow > 2) failures.push(`${viewport.name}: horizontal overflow ${pageState.overflow}px`);
  if (pageState.linksWithoutHref) failures.push(`${viewport.name}: links without href ${pageState.linksWithoutHref}`);

  await page.locator('[data-state="before"]').click();
  await page.waitForTimeout(850);
  const beforeSplit = await page.locator('#splitHandle').getAttribute('aria-valuenow');
  await page.locator('[data-state="after"]').click();
  await page.waitForTimeout(850);
  const afterSplit = await page.locator('#splitHandle').getAttribute('aria-valuenow');
  if (Number(beforeSplit) > 8 || Number(afterSplit) < 92) failures.push(`${viewport.name}: before/after controls failed`);
  await page.locator('[data-state="compare"]').click();
  await page.waitForTimeout(850);

  await page.locator('[data-mode="replace"]').click();
  await page.waitForTimeout(650);
  const replacementMoney = (await page.locator('#decisionMoney').textContent())?.replace(/\s/g, '');
  await page.locator('[data-mode="restore"]').click();
  await page.waitForTimeout(650);
  const restorationMoney = (await page.locator('#decisionMoney').textContent())?.replace(/\s/g, '');
  if (!replacementMoney?.includes('312000') || !restorationMoney?.includes('96000')) failures.push(`${viewport.name}: scenario switch failed`);

  await page.locator('input[name="area"]').fill('14');
  await page.locator('input[name="pieces"]').fill('5');
  const calcValues = await page.evaluate(() => ({
    replacement: document.querySelector('#replacementRange')?.textContent,
    restoration: document.querySelector('#restorationRange')?.textContent,
    saving: document.querySelector('#savingMoney')?.textContent,
  }));
  if (Object.values(calcValues).some(value => !value || value === '—')) failures.push(`${viewport.name}: calculator did not update`);

  const targetY = await page.locator('#economics').evaluate(el => el.offsetTop + el.offsetHeight * 0.7);
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), targetY);
  await page.waitForTimeout(800);
  const lossMoney = (await page.locator('#lossMoney').textContent())?.replace(/\s/g, '');
  if (!lossMoney || lossMoney === '0₽') failures.push(`${viewport.name}: scrolling money counter did not update`);

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = axe.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? ''));
  if (serious.length) {
    for (const violation of serious) {
      const targets = violation.nodes.slice(0, 5).flatMap(node => node.target).join(' | ');
      failures.push(`${viewport.name}: accessibility ${violation.id} — ${targets}`);
    }
  }

  if (runtimeErrors.length) failures.push(`${viewport.name}: ${runtimeErrors.join(' | ')}`);
  notes.push(`${viewport.name}: overflow=${pageState.overflow}px, loss=${lossMoney}, calc=${JSON.stringify(calcValues)}`);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `audit-output/${viewport.name}.png`, fullPage: true });
  await context.close();
}

await browser.close();
const report = [
  'PREMIUM V14 AUDIT',
  '',
  ...notes,
  '',
  failures.length ? 'FAILURES' : 'RESULT: PASSED',
  ...failures.map(f => `- ${f}`),
].join('\n');
await fs.writeFile('audit-output/report.txt', report, 'utf8');
console.log(report);
if (failures.length) process.exit(1);
