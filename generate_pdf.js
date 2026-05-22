const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Use system Chrome to print to PDF via a temporary script approach
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlFile = path.resolve(__dirname, 'index.html');
const pdfFile = path.resolve(__dirname, 'Nova_Post_Dashboard.pdf');

// Write a small puppeteer-like script using chrome devtools protocol
const userDataDir = path.resolve(__dirname, '_chrome_temp');
if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir);

// Run chrome with remote debugging
const args = [
  `"${chromePath}"`,
  '--headless=new',
  '--disable-gpu',
  '--run-all-compositor-stages-before-draw',
  '--disable-dev-shm-usage',
  `--user-data-dir="${userDataDir}"`,
  `--print-to-pdf="${pdfFile}"`,
  '--no-pdf-header-footer',
  '--print-to-pdf-no-header',
  `"${htmlFile}"`
].join(' ');

console.log('Running:', args);
try {
  execSync(args, { stdio: 'inherit', shell: true });
  if (fs.existsSync(pdfFile)) {
    console.log('✅ PDF created:', pdfFile);
  } else {
    console.log('❌ PDF was not created');
  }
} catch(e) {
  console.error('Error:', e.message);
}
