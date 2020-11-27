const puppeteer = require('puppeteer');
const _ = require('underscore');

// Add list of map services to extract
const mapServices = [
    'https://<host>/arcgis/rest/services/<folder>/<service>/MapServer/',
];

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let allItems = [];
    for (const service of mapServices) {
        const legendUrl = service + 'legend';
        await page.goto(legendUrl);

        const items = await page.evaluate(sel => {
            // As not all labels are present, use the group heading instead
            const formTable = document.querySelector(sel);

            const items = [];
            let heading;
            for (const el of formTable.children) {
                if (el.tagName === 'B') { // group heading
                    heading = el.textContent;
                    // Strip out layer id
                    const parenIndex = heading.indexOf('(');
                    if (parenIndex > 0) {
                        heading = heading.substring(0, parenIndex - 1);
                    }
                }
                if (el.tagName === 'TABLE') {
                    const $trs = Array.from(el.querySelectorAll('tr'));
                    for (const $tr of $trs) {
                        const label = $tr.children[1].textContent || heading
                        const imgSrc = $tr.children[0].firstChild.src;
                        items.push({label, imgSrc});
                    }
                }
            }

            return items;
        }, '.formTable td');

        allItems = allItems.concat(items);
    }

    console.log('<html><body><table border=1>')

    const uniqueItems = _.uniq(allItems, x => x.label + x.imgSrc);
    const sortedItems = _.sortBy(uniqueItems, x => x.label);
    for (const item of sortedItems) {
        console.log(`<tr><td>${item.label}</td><td><img src="${item.imgSrc}"></td></tr>`)
    };

    console.log('</table></body></html>')

    await browser.close();
})();

