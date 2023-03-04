const pup = require('puppeteer');
const { Cluster } = require('puppeteer-cluster');

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

async function scrapping({ page, data: { link, count } }) {

    const indexadores = [
        {
            chave: 'title',
            selector: '.ui-pdp-title',
            itExists: true,
        },
        {
            chave: 'price',
            selector: '.andes-money-amount__fraction',
            itExists: true,
        },
        {
            chave: 'cents',
            selector: '.andes-money-amount__cents',
            itExists: true,
        },
        {
            chave: 'seller',
            selector: '.ui-pdp-seller__link-trigger',
            itExists: false,
        }
    ]

    const getInfo = async (selector) => await page.$eval(selector, element => element?.innerText); // usado quando sabemos que o seletor existe
    const tryGetInfo = async (selector) => await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText : '';
    }); // usado quando NÃO sabemos se o seletor existe

    const obj = { link, count };

    await page.goto(link);//, { waitUntil: 'networkidle2' });//aguarda o carregamento da página
    await page.waitForSelector(indexadores[0].selector);//aguardar o seletor
    
    for (const { chave, selector, itExists } of indexadores) {
        const value = itExists
            ? await getInfo(selector)
            : await tryGetInfo(selector);
        obj[chave] = value;
    };

    console.log(obj);

    return obj;
}

async function main() {

    const pid = process.pid;

    try {
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 15,
        });

        const browser = await pup.launch({
            headless: true //aqui é que exibe o navegador
        });
        const page = await browser.newPage();

        await page.goto(url);

        const selector = '.nav-search-input';
        const selectTorList = '.ui-search-result__content';

        await page.waitForSelector(selector);
        await clickNavegate(page, selector, searchFor);

        //OBS: $$eval, avalia vários seletores
        //ao passo que $eval, avalia somente um seletor
        const links = await page.$$eval(`${selectTorList}`
            , el => el
                .map(link => link.href))

        console.log(`Existem ${links.length} resultados`);
        let count = 1;
        for (const link of links) {
            await cluster.queue({ link, count });
            count++;
        }
        await cluster.task(scrapping);

        await cluster.idle(); //esperar todas as tarefas terminarem
        await cluster.close(); //finaliza o cluster
        await browser.close() //finaliza o browser

    }
    catch (err) {
        console.error(`${pid} has broken! ${err.stack}`);
    }

}

main();