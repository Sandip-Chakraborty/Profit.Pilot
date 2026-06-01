const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to login page...");
    await page.goto('https://wealthtrading.xyz/admin', { waitUntil: 'networkidle' });
    
    console.log("Filling login form...");
    await page.fill('input[name="username"]', 'Testing1');
    await page.fill('input[name="password"]', '654321');
    
    console.log("Clicking submit...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log("Successfully logged in. URL is now:", page.url());
    
    // Save screenshot
    await page.screenshot({ path: 'dashboard_screenshot.png', fullPage: true });
    console.log("Saved dashboard_screenshot.png");
    
    // Save HTML
    const html = await page.content();
    fs.writeFileSync('dashboard_reference.html', html);
    console.log("Saved dashboard_reference.html");
    
  } catch (err) {
    console.error("Error during automation:", err);
  } finally {
    await browser.close();
  }
})();
