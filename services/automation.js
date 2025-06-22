import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import cron from 'node-cron';
import * as sqsService from './sqsService.js';
import * as productService from './productService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

chromium.use(stealth());

const screenshotsDir = path.join(__dirname, '../screenshots');
fs.ensureDirSync(screenshotsDir);

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function autoAcceptCookies(page) {
  const selectors = [
    'button[aria-label*="accept"]',
    'button[aria-label*="cookie"]',
    'button[title*="Accept"]',
    'button:has-text("Accept")',
    'button:has-text("I agree")',
    'button:has-text("Got it")',
    'button:has-text("Allow all")',
    'button:has-text("Accept all")',
    'button:has-text("OK")',
    '[id*="accept"]',
    '[id*="cookie"]',
    '[class*="accept"]',
    '[class*="cookie"]'
  ];

  for (const selector of selectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        await el.click();
        console.log(`Clicked cookie banner with selector: ${selector}`);
        return true;
      }
    } catch (e) {
      console.log("🚀 ~ autoAcceptCookies ~ e:", e);
      // Ignore errors and try next selector
    }
  }

  // Try by visible text (Playwright 1.17+ supports :has-text)
  const texts = [
    'Accept', 'I agree', 'Got it', 'Allow all', 'Accept all', 'OK'
  ];
  for (const text of texts) {
    try {
      const el = await page.$(`button:has-text(\"${text}\")`);
      if (el) {
        await el.click();
        console.log(`Clicked cookie banner with text: ${text}`);
        return true;
      }
    } catch (ex) {
      console.log("🚀 ~ autoAcceptCookies ~ ex:", ex);
    }
  }
  console.log('No cookie banner found or auto-accept failed.');
  return false;
}

// Main automation function for a single product
async function automateProduct(product) {
  const { url, vendor_name, id, name, quantity } = product;
  console.log('Processing product:', { url, vendor_name, id, name, quantity });
  
  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.setViewportSize({ 
      width: 1280 + Math.floor(Math.random()*100), 
      height: 800 + Math.floor(Math.random()*100) 
    });
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(2000 + Math.random()*2000);
    await autoAcceptCookies(page);

    let screenshotPath = '';
    let status = 'completed';

    switch ((vendor_name || '').toLowerCase()) {
      case 'asda':
        screenshotPath = await automateAsda(page, product);
        break;
      case "sainsbury's":
        screenshotPath = await automateSainsburys(page, product);
        break;
      case 'amazon uk':
        screenshotPath = await automateAmazon(page, product);
        break;
      default:
        console.log(`No automation implemented for vendor: ${vendor_name}`);
        status = 'vendor_not_supported';
    }

    // Update database record by removing the processed vendor from the list
    await productService.updateProductDetails(id, { vendor_name: vendor_name });

    // Delete message from SQS
    await sqsService.deleteMessage(product.ReceiptHandle);

  } catch (err) {
    console.error(`Error processing ${url}:`, err);
    // On failure, we no longer update the database.
    // The SQS message will not be deleted, so it will become visible again for a retry.
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function automateAsda(page, product) {
  const screenshotPath = path.join(screenshotsDir, `${product.id}_Asda.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('ASDA screenshot saved:', screenshotPath);
  return screenshotPath;
}

async function automateSainsburys(page, product) {
  const screenshotPath = path.join(screenshotsDir, `${product.id}_Sainsburys.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("Sainsbury's screenshot saved:", screenshotPath);
  return screenshotPath;
}

async function automateAmazon(page, product) {
  const screenshotPath = path.join(screenshotsDir, `${product.id}_AmazonUK.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Amazon UK screenshot saved:', screenshotPath);
  return screenshotPath;
}

const runAutomation = async () => {
  console.log('Cron job triggered: checking for SQS messages...');
  
  try {
    const products = await sqsService.getMessages(3);
    
    if (products.length === 0) {
      console.log('No products in queue. Waiting for next schedule.');
      return;
    }

    console.log(`Found ${products.length} products to process.`);
    
    for (const product of products) {
      await automateProduct(product);
      await sleep(2000 + Math.random() * 2000); // Keep a small delay between automations
    }
  } catch (error) {
    console.error('Error in cron job execution:', error);
  }
};

export const startAutomation = () => {
  // Schedule the automation to run every 5 minutes
  cron.schedule('*/5 * * * *', runAutomation);
  console.log('Automation service started. Cron job scheduled to run every 5 minutes.');
}; 