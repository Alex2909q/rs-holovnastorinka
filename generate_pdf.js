const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlFile = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const screenshotFile = path.resolve(__dirname, 'Nova_Post_Dashboard_screenshot.png');
const pdfFile = path.resolve(__dirname, 'Nova_Post_Dashboard.pdf');

const WIDTH = 1440;
const SCALE = 2;

(async () => {
    console.log('Запуск браузера...');
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', `--window-size=${WIDTH},900`]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: 900, deviceScaleFactor: SCALE });

    await page.goto(htmlFile, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 3000));

    // Фікс: перетворюємо всі fixed/sticky елементи на absolute/static
    // щоб вони не дублювались при fullPage скріншоті
    await page.evaluate(() => {
        // Змінюємо position:fixed → position:absolute для всіх елементів
        const allEls = document.querySelectorAll('*');
        allEls.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed') {
                el.style.position = 'absolute';
            }
        });

        // Ховаємо вспливашки
        document.querySelectorAll('.jtbd-tooltip').forEach(el => {
            el.style.display = 'none';
        });

        // Скролимо вниз і назад для ініціалізації lazy елементів
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 0);
    });

    await new Promise(r => setTimeout(r, 1000));

    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log('Висота сторінки:', bodyHeight, 'px');

    console.log('Роблю fullPage скріншот...');
    await page.screenshot({
        path: screenshotFile,
        fullPage: true,
        type: 'png',
        captureBeyondViewport: true
    });

    await browser.close();

    const imgSize = fs.statSync(screenshotFile).size;
    console.log(`✅ Скріншот: ${(imgSize/1024/1024).toFixed(2)} МБ`);

    // ── PNG → PDF ──
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

    const browser2 = await puppeteer.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page2 = await browser2.newPage();
    await page2.goto('file:///' + tempHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await page2.pdf({
        path: pdfFile,
        width: WIDTH + 'px',
        height: pdfH + 'px',
        printBackground: true,
        pageRanges: '1',
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    await browser2.close();
    fs.unlinkSync(tempHtml);

    const pdfSize = fs.statSync(pdfFile).size;
    console.log(`✅ PDF: ${(pdfSize/1024/1024).toFixed(2)} МБ`);
})().catch(err => {
    console.error('❌ Помилка:', err.message);
    process.exit(1);
});
