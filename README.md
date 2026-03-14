# HH Job Finder

Minimal full-stack job finder that scrapes hh.uz using Puppeteer with an API fallback.

## Run locally

1. Install dependencies:
   - `npm install` in the repo root
   - `npm install` in `backend`
   - `npm install` in `frontend`

2. Start both servers:
   - `npm run dev` (from the repo root)

Frontend runs on `http://localhost:5173` and the API on `http://localhost:3000`.

## API

`GET /api/jobs?type=frontend|backend|web-design`

Returns an array of job objects:

```
[
  {
    "title": "Frontend Developer",
    "company": "Company Name",
    "salary": "1000$",
    "location": "Tashkent",
    "link": "https://tashkent.hh.uz/vacancy/..."
  }
]
```

## Notes

- Puppeteer runs in non-headless mode with anti-bot measures.
- If scraping fails, the service falls back to the HH API.
- Results are cached in memory for 5 minutes per category.
