const puppeteer = require('puppeteer');

const PAGE = 'https://montevideo.gub.uy/aplicacion/reserva-de-hora-para-tramites-de-contralor-y-registro-de-vehiculos';
const TIMEOUT = 500;

exports.handler = async (event) => {
  console.log('.::. Hello there...');
  let execute = true;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(PAGE);
  const frame = await loadFrameContent(page, browser);

  while (execute) {
    const cell = await findEmptyDay(frame);
    const {month, year} = await getShowingDate(frame);
    if (year === '2021') {
      execute = false;
    } else {
      console.log(`.::. Looking into ${month} - ${year}`)
      if (cell) {
        console.log('.::. We found a free spot !!! :) .::.');
        execute = false;
      } else {
        console.log('.::. Bad luck, no days found... :( .::.');
        await nextClick(frame);
        wait(page);
      }
    }
  }

  await browser.close();
};

async function loadFrameContent(page) {
  await page.waitForSelector('iframe');
  const elementHandle = await page.$('#content iframe');
  const frame = await elementHandle.contentFrame();
  return frame;
}

// Scraps & returns the current date
async function getShowingDate(page) {
  try {
    // const element = await page.$('td.rich-calendar-month div.rich-calendar-tool-btn'); 
    const element = await page.$('#calendarioHeader > table > tbody > tr > td:nth-child(3) > div'); 
    const text = await page.evaluate(element => element.textContent, element);
    const [month, year] = text.split(',').map(el => el.trim());
    return { month, year };
  } catch (error) {
    console.error(error);
  }
}

// Waits for page to load
async function wait(page) {
  await page.waitForTimeout(TIMEOUT);
}

// Clicks next button
async function nextClick(page) {
  const button = await page.evaluateHandle(() => document.querySelector('#calendarioHeader > table > tbody > tr > td:nth-child(4) > div'));
  await button.click();
  await wait(page);
}

// Looks for a 'conCupo' cell
async function findEmptyDay(page) {
  try {
    const foundCell = await page.$('td.diaConCupo');
    return foundCell;
  } catch (error) {
    console.error(error);
  }
}

this.handler();