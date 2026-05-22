const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlFile = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const pdfFile = path.resolve(__dirname, 'Nova_Post_Dashboard.pdf');

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

    // Встановлюємо viewport як широкий монітор (1440px) — як у браузері
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    console.log('Відкриваю сторінку:', htmlFile);
    await page.goto(htmlFile, { waitUntil: 'networkidle0', timeout: 30000 });

    // Чекаємо завантаження шрифтів
    await page.evaluateHandle('document.fonts.ready');
    
    // Додаткова пауза для анімацій
    await new Promise(r => setTimeout(r, 2000));

    // Отримуємо реальну висоту сторінки
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log('Висота сторінки:', bodyHeight, 'px');

    console.log('Генерую PDF...');
    await page.pdf({
        path: pdfFile,
        width: '1440px',
        height: bodyHeight + 'px',
        printBackground: true,
        pageRanges: '1',
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();
    console.log('✅ PDF збережено:', pdfFile);
})().catch(err => {
    console.error('❌ Помилка:', err.message);
    process.exit(1);
});
