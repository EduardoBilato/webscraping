const pup = require('puppeteer');

const url = 'http://www.mercadolivre.com.br';
const searchFor = 'macbook';

async function clickNavegate(page, selector, searchFor) {
    const searchButton = '.nav-search-btn';
    await page.type(selector, searchFor);
    return await Promise.all([
        page.waitForNavigation(),
        await page.click(searchButton),
    ]);
}

async function extractInfo(page, selector) {
    await page.waitForSelector(selector);
    const valor = await page.$eval(selector, element => element?.innerText);
    return valor;
}

// entrada: lista de objetos com nome e seletor
// saída: agrega uma propriedade "valor" para cada elemento da lista
async function extractListInfo(page, list) {
    const newList = [];

    await list.forEach(async ({ chave, selector }, idx) => {
        // const valor = await extractInfo(page, selector);

        await page.waitForSelector(selector);
        const valor = await page.$eval(selector, element => element?.innerText);

        const obj = { chave, valor };
        console.log(`Pagina ${idx}`, obj);//teste
        newList.push(obj);
    });

    console.log('======> newlist', newList);//teste
    return newList;
}

(async () => {
    const browser = await pup.launch({
        headless: false //aqui é que exibe o navegador
    });
    const page = await browser.newPage();

    await page.goto(url);

    const selector = '.nav-search-input';
    const selectTorList = '.ui-search-result__content';
    // const selectTorList = '.ui-search-layout__item';
    //  ui-search-link

    await page.waitForSelector(selector);
    await clickNavegate(page, selector, searchFor);

    const links = await page.$$eval(`${selectTorList}`
        , el => el
            .map(link => link.href))

    for (const link of links) {

        await page.goto(link);

        const indexadores = [{
            chave: 'title',
            selector: '.ui-pdp-title',
        },
        {
            chave: 'price',
            selector: '.andes-money-amount__fraction',
        },
        {
            chave: 'cents',
            selector: '.andes-money-amount__cents',
        },
        ]

        // const lista = await extractListInfo(page, indexadores)
        //     .then((data) => console.log('data', data))//teste
        const selector1 = indexadores[0].selector;
        const selector2 = indexadores[1].selector;
        const selector3 = indexadores[2].selector;


        await page.waitForSelector(selector1);
        const chave = await page.$eval(selector1, element => element?.innerText);
        const price = await page.$eval(selector2, element => element?.innerText);
        const cents = await page.$eval(selector3, element => element?.innerText);
        const seller = await page.evaluate(() => {
            const el = document.querySelector('.ui-pdp-seller__link-trigger');
            return el ? el.innerText : '';
        });

        const obj = { chave, price, cents, seller, link }

        console.log('\n\n===> obj', obj);//teste
    }

    // await browser.close();

})();