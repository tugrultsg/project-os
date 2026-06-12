# SEO Core Pack

Use this pack for projects where organic search and AI-search visibility matter
from the first version.

## Required Policy

- Core Web Vitals focus on LCP, INP, and CLS.
- `meta keywords` is not a ranking dependency.
- Every public page has an explicit index/noindex decision.
- Canonical, Open Graph, Twitter card, and sitemap behavior are required.
- `lastModified` reflects meaningful content changes, not deploy time.
- FAQPage schema is not promised for commercial rich results.
- AI-search readiness requires crawlable text, clear entity signals, and
  citable passages.
- Google Search Console verification and sitemap submission are launch gates for
  public sites.

## Setup Checklist

- [ ] Add `seo-policy.json`.
- [ ] Add `analytics-policy.json` for GA4 and Google Search Console.
- [ ] Add `docs/SEO-GUIDELINES.md` or equivalent.
- [ ] Add sitemap and robots decisions before public launch.
- [ ] Verify Google Search Console before public launch.
- [ ] Submit the production sitemap in Google Search Console.
- [ ] Add image alt text and dimension checks.
- [ ] Add schema validation for public templates.
- [ ] Decide whether `llms.txt` is useful for the project.
