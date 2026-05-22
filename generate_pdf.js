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
    console.log('Запуск браузера (headless mode)...');
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: 900, deviceScaleFactor: SCALE });

    await page.goto(htmlFile, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 3000));

    // Клієнтська логіка підготовки сторінки для ідеального знімку
    await page.evaluate(() => {
        // 1. Заморожуємо висоту Hero-секції в пікселях, щоб при зміні висоти viewport вона не розтягувалася (vh -> px)
        const hero = document.querySelector('.hero-section');
        if (hero) {
            hero.style.height = hero.clientHeight + 'px';
        }

        // 2. Змінюємо position:fixed -> position:absolute для уникнення дублювання при склеюванні
        const allEls = document.querySelectorAll('*');
        allEls.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed') {
                el.style.position = 'absolute';
            }
        });

        // 3. Ховаємо спливаючі підказки
        document.querySelectorAll('.jtbd-tooltip').forEach(el => {
            el.style.display = 'none';
        });

        // 4. Відкриваємо всі акордеони (FAQ та Internal FAQ)
        document.querySelectorAll('.accordion-item').forEach(item => {
            item.classList.add('active');
            const icon = item.querySelector('.icon');
            if (icon) {
                icon.textContent = '−';
            }
        });

        // 5. Заморожуємо CSS-анімації в поточному стані та відкриваємо контент акордеонів повністю
        const style = document.createElement('style');
        style.textContent = `
            * {
                animation-play-state: paused !important;
                transition: none !important;
            }
            .accordion-content {
                max-height: none !important;
                padding-bottom: 22px !important;
            }
        `;
        document.head.appendChild(style);
    });

    // 5. Прокрутка для завантаження лінивих зображень та ініціалізації елементів
    console.log('Прокручую сторінку для завантаження ресурсів...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    window.scrollTo(0, 0);
                    resolve();
                }
            }, 50);
        });
    });

    await new Promise(r => setTimeout(r, 2000));

    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log('Виміряна висота сторінки:', bodyHeight, 'px');

    console.log('Встановлюю висоту viewport для знімку...');
    await page.setViewport({
        width: WIDTH,
        height: bodyHeight,
        deviceScaleFactor: SCALE
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('Емулюю медіа-тип "screen"...');
    await page.emulateMediaType('screen');

    console.log('Генерую PDF безпосередньо (векторний метод)...');
    await page.pdf({
        path: pdfFile,
        width: WIDTH + 'px',
        height: (bodyHeight + 150) + 'px',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    const pdfSize = fs.statSync(pdfFile).size;
    console.log(`✅ PDF: ${(pdfSize/1024/1024).toFixed(2)} МБ`);
})().catch(err => {
    console.error('❌ Помилка:', err.message);
    process.exit(1);
});
