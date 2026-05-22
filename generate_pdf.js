const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlFile = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const screenshotFile = path.resolve(__dirname, 'Nova_Post_Dashboard_screenshot.png');
const pdfFile = path.resolve(__dirname, 'Nova_Post_Dashboard.pdf');

const WIDTH = 1440;
const SCALE = 2; // 2x Retina

(async () => {
    // ── КРОК 1: Визначаємо висоту сторінки ──
    console.log('Запуск браузера...');
    let browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', `--window-size=${WIDTH},900`]
    });

    let page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: 900, deviceScaleFactor: 1 });
    await page.goto(htmlFile, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 2000));

    const bodyHeight = await page.evaluate(() => {
        // Прибираємо фіксовані елементи з підрахунку
        return Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );
    });
    console.log('Реальна висота сторінки:', bodyHeight, 'px');

    await browser.close();

    // ── КРОК 2: Скріншот з viewport = вся висота сторінки (без fullPage!) ──
    console.log('Робимо скріншот в 2x Retina...');
    browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', `--window-size=${WIDTH},${bodyHeight}`]
    });

    page = await browser.newPage();
    // Viewport = повна висота сторінки → НЕ потрібно скролити
    await page.setViewport({ width: WIDTH, height: bodyHeight, deviceScaleFactor: SCALE });
    await page.goto(htmlFile, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 2000));

    // Приховуємо фіксовані/абсолютні анімаційні елементи що можуть дублюватись
    await page.evaluate(() => {
        // Ховаємо вспливашки
        document.querySelectorAll('.jtbd-tooltip').forEach(el => el.style.display = 'none');
        // Ховаємо анімаційні іконки хіро (truck, box, plane) що мають position:fixed/absolute
        document.querySelectorAll('.logistics-anim').forEach(el => el.style.display = 'none');
        document.body.style.background = '#ffffff';
        document.documentElement.style.background = '#ffffff';
    });

    await new Promise(r => setTimeout(r, 500));

    // fullPage: FALSE — viewport вже відповідає повній висоті
    await page.screenshot({
        path: screenshotFile,
        fullPage: false,
        type: 'png'
    });

    await browser.close();
    const imgSize = fs.statSync(screenshotFile).size;
    console.log(`✅ Скріншот: ${(imgSize/1024/1024).toFixed(2)} МБ`);

    // ── КРОК 3: PNG → PDF ──
    console.log('Конвертую PNG → PDF...');
    const imgBuf = fs.readFileSync(screenshotFile);
    const imgW = imgBuf.readUInt32BE(16);
    const imgH = imgBuf.readUInt32BE(20);
    const pdfH = Math.round(imgH * WIDTH / imgW);
    console.log(`Зображення: ${imgW}x${imgH}px → PDF: ${WIDTH}x${pdfH}pt`);

    const pngBase64 = imgBuf.toString('base64');
    const tempHtml = path.resolve(__dirname, '_temp_pdf.html');
    fs.writeFileSync(tempHtml, `<!DOCTYPE html>
<html><head>
<style>* { margin:0; padding:0; } html,body { width:${WIDTH}px; background:#fff; }
img { width:${WIDTH}px; display:block; }</style>
</head><body>
<img src="data:image/png;base64,${pngBase64}">
</body></html>`);

    browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.goto('file:///' + tempHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.pdf({
        path: pdfFile,
        width: WIDTH + 'px',
        height: pdfH + 'px',
        printBackground: true,
        pageRanges: '1',
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();
    fs.unlinkSync(tempHtml);

    const pdfSize = fs.statSync(pdfFile).size;
    console.log(`✅ PDF: ${(pdfSize/1024/1024).toFixed(2)} МБ → ${pdfFile}`);
})().catch(err => {
    console.error('❌ Помилка:', err.message);
    process.exit(1);
});
