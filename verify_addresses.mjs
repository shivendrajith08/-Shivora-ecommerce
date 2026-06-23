import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:5173';
const results = [];

function log(emoji, label, detail = '') {
  const line = `${emoji} ${label}${detail ? ': ' + detail : ''}`;
  console.log(line);
  results.push(line);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();

// Capture console errors
const consoleErrors = [];
context.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

// Capture network responses
const networkLog = [];
context.on('response', resp => {
  if (resp.url().includes('/api/')) {
    networkLog.push({ url: resp.url(), status: resp.status() });
  }
});

const page = await context.newPage();

// ── LOGIN FIRST ──────────────────────────────────────────────────────────────
log('🔐', 'Navigating to login page');
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'ss_01_login.png' });

// Try to fill login form
const emailInput = page.locator('input[type="email"], input[name="email"]').first();
const passInput  = page.locator('input[type="password"]').first();
await emailInput.fill('shivendrajith@gmail.com');
await passInput.fill('test123');
await page.screenshot({ path: 'ss_02_login_filled.png' });
await page.locator('button[type="submit"]').first().click();
await page.waitForTimeout(2000);
await page.screenshot({ path: 'ss_03_after_login.png' });
log('🔐', 'Login submitted', `URL: ${page.url()}`);

// ── CHECK 1: Navbar dropdown → My Addresses ───────────────────────────────────
log('', '--- CHECK 1: Navbar dropdown My Addresses link ---');
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'ss_04_home.png' });

// Find the avatar/initials button in the navbar
const avatarBtn = page.locator('header button').filter({ hasText: /^[A-Z]$/ }).first();
const avatarVisible = await avatarBtn.isVisible().catch(() => false);
if (avatarVisible) {
  await avatarBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'ss_05_dropdown_open.png' });
  const myAddressesLink = page.locator('text=My Addresses').first();
  const linkVisible = await myAddressesLink.isVisible().catch(() => false);
  if (linkVisible) {
    log('✅', 'CHECK 1a', 'My Addresses link visible in dropdown');
    await myAddressesLink.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'ss_06_address_book.png' });
    const url = page.url();
    if (url.includes('/profile/addresses')) {
      log('✅', 'CHECK 1b', `/profile/addresses loaded (URL: ${url})`);
    } else {
      log('❌', 'CHECK 1b', `Wrong URL after click: ${url}`);
    }
  } else {
    log('❌', 'CHECK 1a', 'My Addresses link NOT found in dropdown');
    await page.screenshot({ path: 'ss_05_dropdown_open.png' });
  }
} else {
  // Maybe not logged in — check current state
  await page.screenshot({ path: 'ss_05_not_logged_in.png' });
  log('❌', 'CHECK 1', `Avatar button not found — possibly not logged in. URL: ${page.url()}`);
}

// ── CHECK 2: Empty state + Add New Address button ─────────────────────────────
log('', '--- CHECK 2: Empty state ---');
await page.goto(`${BASE}/profile/addresses`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'ss_07_address_page.png' });

const addBtn = page.locator('button', { hasText: /Add New Address|Add Your First/i }).first();
const addBtnVisible = await addBtn.isVisible().catch(() => false);

const emptyHeading = page.locator('text=No saved addresses').first();
const emptyVisible = await emptyHeading.isVisible().catch(() => false);

if (emptyVisible) {
  log('✅', 'CHECK 2a', 'Empty state "No saved addresses" visible');
} else {
  // might already have addresses from a previous run
  const cards = await page.locator('.card').count();
  if (cards > 0) {
    log('⚠️', 'CHECK 2a', `Already has ${cards} address card(s) — empty state skipped`);
  } else {
    log('❌', 'CHECK 2a', 'Neither empty state nor cards found');
  }
}

if (addBtnVisible) {
  log('✅', 'CHECK 2b', '"+ Add New Address" button visible');
} else {
  log('❌', 'CHECK 2b', '"+ Add New Address" button NOT found');
}

// ── CHECK 3: Open modal, fill form, save ─────────────────────────────────────
log('', '--- CHECK 3: Modal + form submission ---');
const addBtnForModal = page.locator('button', { hasText: /\+ Add New Address/i }).first();
const addBtnForModalVisible = await addBtnForModal.isVisible().catch(() => false);
if (!addBtnForModalVisible) {
  // try top-right button
  await page.locator('button').filter({ hasText: /Add/i }).first().click().catch(() => {});
} else {
  await addBtnForModal.click();
}
await page.waitForTimeout(800);
await page.screenshot({ path: 'ss_08_modal_open.png' });

const modalTitle = page.locator('text=Add Address').first();
const modalVisible = await modalTitle.isVisible().catch(() => false);
if (modalVisible) {
  log('✅', 'CHECK 3a', 'Modal opened with title "Add Address"');
} else {
  log('❌', 'CHECK 3a', 'Modal did NOT open');
}

// Fill the form
await page.locator('input[name="full_name"]').fill('Test User').catch(() => {});
await page.locator('input[name="phone"]').fill('9876543210').catch(() => {});
await page.locator('input[name="address_line1"]').fill('123 Main Street').catch(() => {});
await page.locator('input[name="city"]').fill('Bengaluru').catch(() => {});
await page.locator('input[name="state"]').fill('Karnataka').catch(() => {});
await page.locator('input[name="pincode"]').fill('560001').catch(() => {});
await page.screenshot({ path: 'ss_09_modal_filled.png' });

// Track POST /api/addresses response
let postAddressStatus = null;
let postAddressBody   = null;
const responsePromise = page.waitForResponse(
  r => r.url().includes('/api/addresses') && r.request().method() === 'POST',
  { timeout: 8000 }
).catch(() => null);

// Click Save Address
await page.locator('button[type="submit"]', { hasText: /Save Address/i }).first().click();
const resp = await responsePromise;
if (resp) {
  postAddressStatus = resp.status();
  try { postAddressBody = await resp.json(); } catch {}
}

await page.waitForTimeout(2000);
await page.screenshot({ path: 'ss_10_after_save.png' });

// Check card appeared
const defaultBadge = page.locator('text=Default').first();
const defaultBadgeVisible = await defaultBadge.isVisible().catch(() => false);
const cardName = page.locator('text=Test User').first();
const cardVisible = await cardName.isVisible().catch(() => false);

if (cardVisible) {
  log('✅', 'CHECK 3b', 'Address card with "Test User" appeared after save');
} else {
  log('❌', 'CHECK 3b', 'Address card NOT found after save');
}
if (defaultBadgeVisible) {
  log('✅', 'CHECK 3c', 'DEFAULT badge visible on card');
} else {
  log('❌', 'CHECK 3c', 'DEFAULT badge NOT found');
}

// ── CHECK 4: Network — POST /api/addresses status ─────────────────────────────
log('', '--- CHECK 4: Network response ---');
if (postAddressStatus !== null) {
  if (postAddressStatus === 201) {
    log('✅', 'CHECK 4', `POST /api/addresses → ${postAddressStatus} with address JSON`);
    log('   body', JSON.stringify(postAddressBody).slice(0, 200));
  } else {
    log('❌', 'CHECK 4', `POST /api/addresses → ${postAddressStatus} (expected 201). Body: ${JSON.stringify(postAddressBody)}`);
  }
} else {
  log('❌', 'CHECK 4', 'POST /api/addresses response not captured');
}

// ── Console errors ─────────────────────────────────────────────────────────────
log('', '--- Console errors ---');
if (consoleErrors.length === 0) {
  log('✅', 'No console errors');
} else {
  consoleErrors.forEach(e => log('⚠️', 'Console error', e));
}

await browser.close();

console.log('\n=== SUMMARY ===');
results.forEach(r => console.log(r));
