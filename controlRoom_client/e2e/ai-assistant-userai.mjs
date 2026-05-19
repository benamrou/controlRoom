/**
 * Smoke test: non-admin user (userai) must not see admin-only AI Assistant panels.
 * Uses in-app navigation (not full page reload) so UserService state is preserved.
 *
 * Run: node e2e/ai-assistant-userai.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.ICR_BASE_URL || 'http://localhost:4200';
const USER = process.env.ICR_USER || 'userai';
const PASS = process.env.ICR_PASS || 'test';

const ADMIN_ONLY_LABELS = [
  'Engine diagnostics',
  'Detailed results',
  'Evidence facts',
  'Adjust & extend',
  'Designer input required',
  'Requested SQL artifacts',
  'Real-time investigation timeline',
  'Routing confidence',
  'What we found',
];

function fail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

function pass(msg) {
  console.log('PASS:', msg);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('input[name="username"]', USER);
  await page.fill('input[name="password"]', PASS);
  await page.click('button.login-btn');
  await page.waitForURL(/\/dashboard/, { timeout: 120000 });
  const token = await page.evaluate(() => localStorage.getItem('ICRAuthToken'));
  if (!token) fail('No ICRAuthToken after login');
  pass(`Logged in as ${USER} (token present)`);
}

/** SPA navigation — avoids full reload that clears in-memory userInfo. */
async function openAssistant(page) {
  // Turn on AI sidebar if the header toggle is available (TECH_SERVICES profile).
  const aiToggle = page.locator('.ai-mode-btn');
  if (await aiToggle.count()) {
    const on = await page.locator('.ai-mode-btn--active').count();
    if (!on) {
      await aiToggle.click();
      await page.waitForTimeout(500);
      pass('AI menu mode enabled');
    }
  }

  const navigated = await page.evaluate(() => {
    const a = document.querySelector('a[href="/ai/assistant"]');
    if (!a) return false;
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return true;
  });
  if (!navigated) {
    fail('Could not find AI Assistant menu link — check profile menu grants for userai');
  }

  await page.waitForURL(/\/ai\/assistant/, { timeout: 60000 });
  await page.waitForSelector('ai-assistant-cmp', { timeout: 60000 });
  pass('AI Assistant route loaded (SPA navigation)');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  try {
    await login(page);
    await openAssistant(page);

    const bodyText = await page.locator('ai-assistant-cmp').innerText();
    for (const label of ADMIN_ONLY_LABELS) {
      if (bodyText.includes(label)) {
        fail(`Admin-only label visible for ${USER}: "${label}"`);
      }
    }
    pass(`No admin-only panel labels (${ADMIN_ONLY_LABELS.length} checks)`);

    const diagCard = await page.locator('.ai-diag-card').count();
    const resultsCard = await page.locator('.ai-results-card').count();
    if (diagCard > 0) fail(`.ai-diag-card count = ${diagCard} (expected 0)`);
    if (resultsCard > 0) fail(`.ai-results-card count = ${resultsCard} (expected 0)`);
    pass('No .ai-diag-card or .ai-results-card in DOM');

    // Analyst should still see the assistant shell (composer / retailer area).
    const shell = await page.locator('ai-assistant-cmp .ai-assistant, ai-assistant-cmp textarea, ai-assistant-cmp input').count();
    if (shell === 0) {
      fail('Assistant shell controls not found');
    }
    pass('Assistant shell is visible for analyst');

    console.log(`\nAll checks passed — ${USER} is non-admin (USERAIADMIN=0) and admin panels are hidden.`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
