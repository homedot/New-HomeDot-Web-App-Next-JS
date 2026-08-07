const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

  await page.goto('http://localhost:3000/scratch-preview-tmp', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);

  await page.locator('select').first().selectOption({ index: 1 }); // Professional Type
  await page.fill('input[placeholder="Your Name"]', 'Test Professional');
  await page.locator('input[type="tel"]').fill('9847011223');
  await page.keyboard.press('Escape');
  await page.locator('h1').click(); // click somewhere neutral to close any dropdown

  const categorySelect = page.locator('select').nth(1);
  await categorySelect.selectOption({ index: 1 });
  await page.waitForTimeout(1200);

  const subCategorySelect = page.locator('select').nth(2);
  await subCategorySelect.selectOption({ index: 1 });
  await page.waitForTimeout(1500);

  await page.getByRole('button', { name: 'Home Interior', exact: false }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/pro-4b-skill-selected.png', fullPage: true });

  await page.fill('input[placeholder="Experience"]', '5');

  const submitBtn = page.getByRole('button', { name: /Submit/i });
  await submitBtn.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/pro-4c-before-submit.png', fullPage: true });
  await submitBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/pro-5-submitted.png', fullPage: true });

  const resultText = await page.locator('#submit-result').textContent().catch(() => null);
  console.log('SUBMIT_RESULT', resultText);
  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors));

  await browser.close();
})().catch((e) => {
  console.error('SCRIPT_FAILED', e.message);
  process.exit(1);
});
