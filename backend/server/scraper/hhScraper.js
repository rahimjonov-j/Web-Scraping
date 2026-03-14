import { getBrowser } from "./browser.js";

const SEARCH_MAP = {
  frontend: "frontend developer",
  backend: "backend developer",
  "web-design": "web designer",
};

const SEARCH_URL_MAP = {
  frontend: "https://tashkent.hh.uz/search/vacancy?text=frontend",
  backend: "https://tashkent.hh.uz/search/vacancy?text=backend",
  "web-design": "https://tashkent.hh.uz/search/vacancy?text=web%20designer",
};

const MAX_RESULTS = 10;
const PAGES_TO_SCRAPE = 5;
const RETRIES = 3;
const EXTRA_WAIT_MS = 2500;

export function getSearchUrl(type) {
  return SEARCH_URL_MAP[type];
}

export function getSearchQuery(type) {
  return SEARCH_MAP[type];
}

export async function fetchJobs(type) {
  const query = getSearchQuery(type);
  if (!query) {
    const error = new Error("Unsupported job type.");
    error.statusCode = 400;
    throw error;
  }

  const scrapeResult = await scrapeWithRetries(type, RETRIES);
  if (scrapeResult.length > 0) {
    return scrapeResult;
  }

  const apiResult = await fetchFromApi(query);
  return apiResult;
}

async function scrapeWithRetries(type, retriesLeft) {
  try {
    return await scrapeWithPuppeteer(type);
  } catch {
    if (retriesLeft <= 1) {
      return [];
    }
    await delay(1500);
    return scrapeWithRetries(type, retriesLeft - 1);
  }
}

async function scrapeWithPuppeteer(type) {
  const browser = await getBrowser();
  const baseUrl = getSearchUrl(type);

  const pageTasks = Array.from({ length: PAGES_TO_SCRAPE }, (_, index) =>
    scrapePage(browser, `${baseUrl}&page=${index}`),
  );

  const results = await Promise.all(pageTasks);
  const flattened = results.flat().filter((job) => job.title && job.link);

  const unique = new Map();
  for (const job of flattened) {
    if (!unique.has(job.link)) {
      unique.set(job.link, job);
    }
    if (unique.size >= MAX_RESULTS * PAGES_TO_SCRAPE) {
      break;
    }
  }

  return Array.from(unique.values()).slice(0, MAX_RESULTS * PAGES_TO_SCRAPE);
}

async function scrapePage(browser, url) {
  const page = await browser.newPage();
  try {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    );

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "font", "media", "stylesheet"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const jobs = await scrapeOnce(page, url);
    if (jobs.length > 0) return jobs;

    await page.reload({ waitUntil: "networkidle2" });
    return await scrapeOnce(page, url);
  } finally {
    await page.close();
  }
}

async function scrapeOnce(page, url) {
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForSelector('[data-qa="vacancy-serp__vacancy"]', {
    timeout: 30000,
  });
  await page.waitForTimeout(EXTRA_WAIT_MS);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(1000);

  return await page.evaluate(() => {
    const cards = Array.from(
      document.querySelectorAll('[data-qa="vacancy-serp__vacancy"]'),
    );

    return cards.map((card) => {
      const titleEl =
        card.querySelector('[data-qa="serp-item__title"]') ||
        card.querySelector('a[data-qa="vacancy-serp__vacancy-title"]');
      const companyEl =
        card.querySelector('[data-qa="vacancy-serp__vacancy-employer"]') ||
        card.querySelector('a[data-qa="vacancy-serp__vacancy-employer"]');
      const salaryEl = card.querySelector(
        '[data-qa="vacancy-serp__vacancy-compensation"]',
      );
      const locationEl = card.querySelector(
        '[data-qa="vacancy-serp__vacancy-address"]',
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
}

async function fetchFromApi(query) {
  const url = `https://api.hh.ru/vacancies?text=${encodeURIComponent(
    query,
  )}&area=97&per_page=${MAX_RESULTS}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data.items)) return [];

    return data.items.slice(0, MAX_RESULTS).map((item) => ({
      title: item.name ?? "",
      company: item.employer?.name ?? "",
      salary: formatSalary(item.salary),
      location: item.area?.name ?? "",
      link: item.alternate_url ?? "",
    }));
  } catch {
    return [];
  }
}

function formatSalary(salary) {
  if (!salary) return "";
  const from = salary.from ? `${salary.from}` : "";
  const to = salary.to ? `${salary.to}` : "";
  const currency = salary.currency ? ` ${salary.currency}` : "";
  if (from && to) return `${from} - ${to}${currency}`;
  if (from) return `from ${from}${currency}`;
  if (to) return `up to ${to}${currency}`;
  return "";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
