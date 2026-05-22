const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlFile = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const screenshotFile = path.resolve(__dirname, 'Nova_Post_Dashboard_screenshot.png');
const pdfFile = path.resolve(__dirname, 'Nova_Post_Dashboard.pdf');

const SCALE = 2; // 2x Retina — вдвічі більша роздільна здатність
const WIDTH = 1440;

(async () => {
    // ── КРОК 1: Скріншот у high resolution ──
    console.log('Запуск браузера для скріншоту...');
    let browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--window-size=1440,900']
    });

    let page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: 900, deviceScaleFactor: SCALE });

    await page.goto(htmlFile, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 3000));

    await page.evaluate(() => {
        document.querySelectorAll('.jtbd-tooltip').forEach(el => el.style.display = 'none');
        document.body.style.background = '#ffffff';
        document.documentElement.style.background = '#ffffff';
    });

    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({
        path: screenshotFile,
        fullPage: true,
        type: 'png',
        captureBeyondViewport: true
    });

    await browser.close();
    const imgSize = fs.statSync(screenshotFile).size;
    console.log(`✅ Скріншот: ${(imgSize/1024/1024).toFixed(2)} МБ`);

    // ── КРОК 2: Вбудовуємо PNG у PDF ──
    console.log('Конвертую PNG → PDF...');
    const pngBase64 = fs.readFileSync(screenshotFile).toString('base64');

    // Отримуємо розміри зображення
    const sizeOf = (buf) => {
        // PNG: width at offset 16, height at offset 20
        return {
            w: buf.readUInt32BE(16),
            h: buf.readUInt32BE(20)
        };
    };
    const imgBuf = fs.readFileSync(screenshotFile);
    const { w: imgW, h: imgH } = sizeOf(imgBuf);
    // PDF розміри: відображаємо на WIDTH пунктів, зберігаємо пропорції
    const pdfH = Math.round(imgH * WIDTH / imgW);

    console.log(`Зображення: ${imgW}x${imgH}px → PDF: ${WIDTH}x${pdfH}pt`);

    const tempHtml = path.resolve(__dirname, '_temp_pdf.html');
    fs.writeFileSync(tempHtml, `<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${WIDTH}px; background: #fff; }
img { width: ${WIDTH}px; display: block; }
</style>
</head>
<body>
<img src="data:image/png;base64,${pngBase64}">
</body>
</html>`);

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
    console.log(`✅ PDF збережено: ${(pdfSize/1024/1024).toFixed(2)} МБ`);
    console.log('Файл:', pdfFile);
})().catch(err => {
    console.error('❌ Помилка:', err.message);
    process.exit(1);
});
