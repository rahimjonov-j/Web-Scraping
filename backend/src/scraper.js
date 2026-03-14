import puppeteer from "puppeteer";

const SEARCH_URLS = {
  frontend: "https://tashkent.hh.uz/search/vacancy?text=frontend%20developer",
  backend: "https://tashkent.hh.uz/search/vacancy?text=backend%20developer",
  "web-design": "https://tashkent.hh.uz/search/vacancy?text=web%20designer",
};

export function getSearchUrl(type) {
  return SEARCH_URLS[type];
}

export async function scrapeJobs(type) {
  const url = getSearchUrl(type);
  if (!url) {
    const error = new Error("Unsupported job type.");
    error.statusCode = 400;
    throw error;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(45000);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    );

    await page.goto(url, { waitUntil: "domcontentloaded" });

    try {
      await page.waitForSelector('[data-qa="vacancy-serp__vacancy"]', {
        timeout: 30000,
      });
    } catch {
      const hasTitle = await page.$('a[data-qa="vacancy-serp__vacancy-title"]');
      if (!hasTitle) {
        return [];
      }
    }

    const jobs = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll('[data-qa="vacancy-serp__vacancy"]'),
      ).slice(0, 10);

      return cards.map((card) => {
        const titleEl = card.querySelector(
          'a[data-qa="vacancy-serp__vacancy-title"]',
        );
        const companyEl =
          card.querySelector('a[data-qa="vacancy-serp__vacancy-employer"]') ||
          card.querySelector('div[data-qa="vacancy-serp__vacancy-employer"]');
        const salaryEl = card.querySelector(
          'span[data-qa="vacancy-serp__vacancy-compensation"]',
        );
        const locationEl = card.querySelector(
          'span[data-qa="vacancy-serp__vacancy-address"]',
        );

        return {
          title: titleEl?.textContent?.trim() ?? "",
          company: companyEl?.textContent?.trim() ?? "",
          salary: salaryEl?.textContent?.trim() ?? "",
          location: locationEl?.textContent?.trim() ?? "",
          link: titleEl?.href ?? "",
        };
      });
    });

    return jobs.filter((job) => job.title && job.link).slice(0, 20);
  } finally {
    await browser.close();
  }
}
