const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlFile = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const screenshotFile = path.resolve(__dirname, 'Nova_Post_Dashboard_screenshot.png');

(async () => {
    console.log('Запуск браузера...');
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,  // Запуск у видимому режимі для коректного рендерингу
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--start-maximized',
            '--disable-infobars',
            '--window-size=1440,900'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Відкриваю сторінку...');
    await page.goto(htmlFile, { waitUntil: 'networkidle0', timeout: 30000 });

    // Дочекуємось шрифтів
    await page.evaluateHandle('document.fonts.ready');
    
    // Чекаємо довше щоб всі анімації та стилі застосувались
    await new Promise(r => setTimeout(r, 3000));

    // Прибираємо scrollbar та фіксований хедер для чистого скрінота
    await page.evaluate(() => {
        // Приховати вспливашки та анімаційні елементи
        document.querySelectorAll('.jtbd-tooltip').forEach(el => el.style.display = 'none');
        // Встановити білий фон
        document.body.style.background = '#ffffff';
        document.documentElement.style.background = '#ffffff';
    });

    await new Promise(r => setTimeout(r, 500));

    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log('Висота сторінки:', bodyHeight, 'px');

    console.log('Роблю скріншот...');
    await page.screenshot({
        path: screenshotFile,
        fullPage: true,
        type: 'png',
        captureBeyondViewport: true
    });

    await browser.close();
    console.log('✅ Скріншот збережено:', screenshotFile);
    const size = fs.statSync(screenshotFile).size;
    console.log('Розмір:', (size / 1024 / 1024).toFixed(2), 'МБ');
})().catch(err => {
    console.error('❌ Помилка:', err.message);
    process.exit(1);
});
