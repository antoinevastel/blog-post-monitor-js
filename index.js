const puppeteer = require('puppeteer');
const detectFingerprinting = require('./monitorExecution').detectFingerprinting;

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(detectFingerprinting);

    await page.goto('https://antoinevastel.com/bots');

    const evalResult = await page.evaluate(() => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(navigator.monitorFingerprinting);
            }, 200);
        });
    });

    console.log(evalResult);

    await browser.close();
})();