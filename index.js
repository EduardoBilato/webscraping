const pup = require('puppeteer');

const url = 'http://www.mercadolivre.com.br';
const searchFor = 'macbook';

(async () => {
    const browser = await pup.launch({
        headless: false //aqui é que exibe o navegador
    });
    const page = await browser.newPage();

    await page.goto(url);

    const selector = '.nav-search-input';
    const searchButton = 'nav-search-btn';

    await page.waitForSelector(selector);
    await page.type(selector, searchFor);

    await Promise.all([
        page.waitForNavigation(),
        await page.click(searchButton),
    ]);


    await setTimeout(() => {
        console.log('foi')
    }, 3000);

    // await browser.close();

})();