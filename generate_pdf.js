const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotFile = path.resolve(__dirname, 'Nova_Post_Dashboard_screenshot.png');
const pdfFile = path.resolve(__dirname, 'Nova_Post_Dashboard.pdf');

// Convert PNG screenshot to PDF by loading it in a blank HTML page
const pngBase64 = fs.readFileSync(screenshotFile).toString('base64');
const img = `<img src="data:image/png;base64,${pngBase64}" style="width:100%;display:block;margin:0;padding:0;">`;
const html = `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}</style></head><body>${img}</body></html>`;
const tempHtml = path.resolve(__dirname, '_temp_pdf.html');
fs.writeFileSync(tempHtml, html);

(async () => {
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Load the temp HTML with the screenshot embedded
    await page.goto('file:///' + tempHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

    const imgHeight = await page.evaluate(() => document.querySelector('img').naturalHeight);
    const imgWidth = await page.evaluate(() => document.querySelector('img').naturalWidth);
    const scale = 1440 / imgWidth;
    const pdfHeight = Math.round(imgHeight * scale);

    console.log(`Image: ${imgWidth}x${imgHeight}, PDF: 1440x${pdfHeight}`);

    await page.pdf({
        path: pdfFile,
        width: '1440px',
        height: pdfHeight + 'px',
        printBackground: true,
        pageRanges: '1',
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();
    fs.unlinkSync(tempHtml);
    
    const size = fs.statSync(pdfFile).size;
    console.log('✅ PDF збережено:', pdfFile);
    console.log('Розмір:', (size / 1024 / 1024).toFixed(2), 'МБ');
})().catch(err => {
    console.error('❌ Помилка:', err.message);
    process.exit(1);
});
