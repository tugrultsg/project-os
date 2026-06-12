# Analytics And Search Instrumentation Pack

Use this pack when a project has any public web surface.

## Required Policy

- GA4 is required before public launch.
- Google Search Console is required before public launch.
- Production and staging analytics properties must not be mixed.
- GA4 consent mode is required when the project has consent obligations.
- GA4 events must not include raw email, phone, address, names, or other PII.
- GSC should use a domain property by default.
- Sitemap submission is part of launch readiness, not a later cleanup item.

## Setup Checklist

- [ ] Add `analytics-policy.json`.
- [ ] Create or assign the production GA4 property.
- [ ] Decide whether staging needs a separate GA4 property.
- [ ] Add the GA4 measurement ID through the app's public config path.
- [ ] Define conversion events before paid or SEO launch.
- [ ] Verify GSC with DNS TXT or the chosen project method.
- [ ] Submit the production sitemap in GSC.
- [ ] Decide whether GA4/GSC API access is needed for automated monitoring.
- [ ] If API access is needed, add service-account secret names to `secrets.manifest.json`.
- [ ] Smoke-test page views, conversion events, sitemap discovery, and robots behavior after deploy.
