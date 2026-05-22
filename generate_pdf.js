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
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--font-render-hinting=none'
        ]
    });

    const page = await browser.newPage();

    // Широкий монітор 1440px
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    console.log('Відкриваю сторінку:', htmlFile);
    await page.goto(htmlFile, { waitUntil: 'networkidle0', timeout: 30000 });

    // Чекаємо шрифти
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 2000));

    // Отримуємо розміри
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log('Висота сторінки:', bodyHeight, 'px');

    // Оновлюємо viewport на повну висоту щоб нічого не обрізалось
    await page.setViewport({ width: 1440, height: bodyHeight, deviceScaleFactor: 1.5 });
    await new Promise(r => setTimeout(r, 500));

    console.log('Роблю скріншот...');
    await page.screenshot({
        path: screenshotFile,
        fullPage: true,
        type: 'png'
    });

    await browser.close();
    console.log('✅ Скріншот збережено:', screenshotFile);
    console.log('Розмір файлу:', fs.statSync(screenshotFile).size, 'bytes');
})().catch(err => {
    console.error('❌ Помилка:', err.message);
    process.exit(1);
});
