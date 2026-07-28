# QR Code Outreach Cold Email Program

Updated: July 10, 2026

## Program Goal

Win QR-code users who are paying too much, are constrained by free-tier dynamic QR limits, or are worried about migration risk after printing or distributing codes.

Primary offer:

- Free or materially cheaper QR-code usage.
- Free white-glove migration from existing QR providers.
- Help preserving campaign continuity where possible, including destination mapping, redirects, exports, styling, analytics review, and custom-domain setup.

## Positioning Baseline

tqrco currently has three pricing tiers in `src/lib/billing-definitions.ts`:

- Free: unlimited QR codes, PNG/SVG downloads, 10 AI-generated QR codes per month, 30 days scan history.
- Creator: `$4.99/mo`, unlimited AI QR generation, uploads, custom domains, API access up to 5,000 requests/month, 180 days analytics, 3 seats.
- Growth: `$9.99/mo`, unlimited API requests, unlimited analytics history, 10 seats.

The strongest current wedge is not "we have every enterprise QR feature." It is:

> You should not need a $20-$65/month QR subscription, a scan cap, or a painful migration just to keep editable, trackable QR codes working.

Avoid overclaiming:

- Do not promise that existing printed QR codes can always be transferred. If the old provider controls the redirect domain and no custom domain was used, a printed dynamic QR code usually cannot be repointed away from that provider unless the provider supports export/redirect control.
- Do not claim feature parity with all enterprise suites unless verified account by account.
- Do not imply a prospect is being overcharged before confirming their actual plan and QR usage.

## Competitive Context

Use these facts as research-backed sales context, not as copy-pasted attack lines.

- QRCodeKIT lists a free plan with 2 dynamic QR codes and 100 scans per QR/month. Paid plans listed on its pricing page start at `$20/mo` billed yearly or `$25/mo` monthly for Starter, with Pro at `$50/mo` billed yearly or `$65/mo` monthly. Source: https://qrcodekit.com/pricing/
- QR Code Generator lists a 14-day free start, Starter with 2 dynamic QR codes and 10,000 scans, Advanced with 50 dynamic QR codes, and Professional with 250 dynamic QR codes. Its page shows prices dynamically by region, so quote limits unless current prices are visible for the recipient's market. Source: https://www.qr-code-generator.com/pricing/
- QR Code Generator support identifies `qrco.de` as one of its short domains for dynamic QR codes. Source: https://support.qr-code-generator.com/hc/en-us/articles/7664232533133-Why-did-a-QR-Code-or-link-bring-me-to-the-Help-Center
- QRCodeChimp's free tier indicates 10 dynamic QR codes and 1,000 total scans per month; scans pause after the monthly free scan limit until the next month. Source: https://www.qrcodechimp.com/pricing
- Hovercode is a cheaper/free competitor: free forever includes 3 dynamic QR codes, unlimited scans, logo support, form builder, and 3 months analytics; Pro is listed at `$12/mo`. Source: https://hovercode.com/pricing/

Practical implication:

- Against QRCodeKIT and QR Code Generator / `qrco.de`, lead with lower price and white-glove migration.
- Against Hovercode and QRCodeChimp, lead more carefully: compare based on API usage, custom-domain economics, analytics retention, seats, and migration support, not just "cheaper."

## Best Sending Channel

Use Resend for the cold email program. Use Zoho Mail only for founder-led, low-volume 1:1 replies and follow-ups.

Why Resend:

- It supports transactional and marketing email, contact management, broadcast analytics, webhooks for delivered/opened/clicked/bounced/complained events, suppression lists, domain authentication, DKIM/SPF, DMARC, and monitoring.
- Resend Broadcasts/Automations can automatically handle unsubscribes when the unsubscribe placeholder is included.
- The app is already a Next.js product, so Resend fits the stack if campaign data later needs to connect to app signups, migration requests, or billing.

Why not Zoho Mail for scale:

- The available Zoho Mail connector can send mail, but it is mailbox-oriented rather than a full cold-outbound system with built-in list hygiene, campaign analytics, warmup controls, suppression state, and deliverability monitoring.
- Zoho CRM mass email limits vary by edition and range from 250/day to 2,000/day per organization, with increases by request. Those limits are for CRM mass email, not a guarantee that cold outbound via Zoho Mail will protect sender reputation.

Recommended setup:

- Sending domain: use a closely related but isolated subdomain, for example `hello.theqrcode.co` or `try.theqrcode.co`.
- From address: `Kyle at The QR Code Co <kyle@hello.theqrcode.co>` or `migration@hello.theqrcode.co`.
- Reply-to: a monitored inbox, ideally a human mailbox.
- DNS: SPF, DKIM, DMARC with reporting, and aligned From domain.
- Tracking: start without click/open tracking for the first small batch if deliverability is weak; add tracking only after inbox placement looks stable.
- Unsubscribe: visible plain-language opt-out in every commercial outreach email plus one-click/List-Unsubscribe support where available.
- Suppression: never send again to bounced, complained, unsubscribed, or manually opted-out contacts.

## Compliance And Deliverability Gates

Minimum US CAN-SPAM requirements:

- Accurate From, Reply-To, routing, and subject lines.
- Clear commercial/ad nature where needed.
- Valid physical postal address.
- Clear opt-out mechanism.
- Honor opt-outs within 10 business days.

Mailbox-provider requirements to respect:

- Gmail recommends keeping spam rates below 0.30%, authenticating with SPF/DKIM, using DMARC alignment, and adding one-click unsubscribe for marketing and subscribed messages.
- Yahoo requires all senders to authenticate mail and keep spam complaints below 0.3%; bulk senders need SPF, DKIM, DMARC, visible unsubscribe, and list-unsubscribe support.

Operational rules:

- Do not buy broad email lists.
- Do not send to role accounts as the primary motion (`info@`, `support@`, `admin@`) unless there is a strong public business reason.
- Do not send more than 30 to 50 cold emails/day/domain during the first two weeks.
- Keep each sequence to 3 emails max unless the recipient engages.
- Stop the sequence on reply, unsubscribe, bounce, complaint, trial signup, or migration request.

## Ideal Customer Profiles

Tier 1: QR-dependent small businesses

- Restaurants, cafes, bars, salons, med spas, fitness studios, retail shops, real estate agents, event venues.
- Trigger: public QR link resolves through `qrco.de`, `qrcodekit.com`, `qrcg.com`, `qrcodechimp.com`, `qrfy.io`, `qrcode-tiger.com`, or similar.
- Pain: menus, booking, reviews, event pages, flyers, signage, and printed assets are costly to update if QR destinations break.

Tier 2: Marketing teams with QR sprawl

- Education, local government, nonprofits, agencies, franchises, multi-location operators, healthcare clinics.
- Trigger: many QR codes in PDFs, print collateral, product labels, event assets, or landing pages.
- Pain: team seats, scan caps, API limits, custom domains, analytics retention, migration complexity.

Tier 3: Developers and product teams

- SaaS teams, internal tools, events platforms, logistics/product-labeling tools, agencies that generate codes for clients.
- Trigger: public docs or product flows that mention QR generation, bulk creation, or API needs.
- Pain: API request pricing, SDK quality, custom branded redirect domains, white-label QR experiences.

## Prospect Discovery

Use public evidence, not invasive scraping.

Signals:

- Scan URLs on public menus, posters, flyers, websites, PDFs, and social profiles that resolve through known QR redirect domains.
- Search operators:
  - `"qrco.de" "menu" "restaurant"`
  - `"qrco.de" "book now"`
  - `"qrcodekit.com" "menu"`
  - `"qrco.de" site:.edu`
  - `"qrco.de" filetype:pdf`
  - `"qrcodechimp.com" "scan"`
- Google Maps/local directories for businesses that likely use menus, booking QR codes, event flyers, or review QR codes.
- Existing user signups who hit free limits or attempt custom domains/API access.

Minimum fields:

- Company
- Website
- Contact name
- Contact role
- Email
- Current QR provider signal
- Public QR URL observed
- Use case
- Estimated urgency
- Segment
- Source URL
- Outreach status
- Last touch
- Opt-out/suppression status

## Core Offers

Offer A: Migration audit

> Send me one QR link you use today and I will tell you what can be moved, what cannot, and how to avoid breaking anything already printed.

Offer B: Cost comparison

> If you are only using editable QR codes, analytics, custom domains, or API access, I can show whether your current plan is overkill.

Offer C: White-glove switch

> We will recreate the QR codes, match styling, set up branded redirects/custom domains, and help test scans before anything goes live.

Offer D: Safety-first fallback

> If your printed code is locked to the old provider, we will tell you plainly and only migrate what can be moved safely.

## Sequence

Use plain text. Keep the call to action low-friction. Do not include images or attachments in cold email.

Email 1: migration/cost wedge

Subject options:

- Quick QR migration question
- Is this QR code still on purpose?
- QR costs + printed-code risk

Body:

```text
Hi {{first_name}},

I noticed {{company}} appears to use {{provider_signal}} for at least one public QR flow.

We are building The QR Code Co, a cheaper QR-code platform with free white-glove migration. The basic idea is simple: if you are paying for editable QR codes, analytics, custom domains, or API usage, we will help move what can be moved safely and tell you plainly what cannot be moved without risking printed codes.

Worth sending me one QR link you use today? I can do a quick migration readout and cost comparison.

{{sender_name}}

If this is not relevant, reply "no" and I will not follow up.
{{postal_address}}
```

Email 2: specific risk

Send 3 to 4 business days later.

```text
Hi {{first_name}},

One reason I asked: dynamic QR codes often depend on the provider's redirect domain. If that QR is already printed and the provider controls the short link, migration needs to be handled carefully.

We offer a free migration audit before asking anyone to switch:

- which QR codes can be recreated now
- which printed codes are locked to the old provider
- what custom-domain or redirect setup would reduce lock-in next time
- whether your current subscription is more than you need

Should I take a look at one QR link for {{company}}?

{{sender_name}}

Reply "no" and I will close the loop.
{{postal_address}}
```

Email 3: close loop

Send 5 to 7 business days later.

```text
Hi {{first_name}},

I will close this out after this note.

If QR codes are a meaningful part of {{company}}'s menus, signage, events, packaging, booking, reviews, or campaigns, we can usually save money and simplify the setup. If the existing printed codes are locked to a provider, we will say that instead of pushing a risky switch.

Useful if I send over a no-cost migration checklist?

{{sender_name}}

Reply "no" and I will not contact you again.
{{postal_address}}
```

## Segment Variants

Restaurants:

> You should not need a premium QR subscription just to keep menus editable and avoid reprinting table tents.

Education/nonprofit:

> We can help preserve existing flyers and resource links while reducing QR subscription overhead.

Agencies:

> We can migrate client QR portfolios, set up branded domains, and give you a lower-cost platform for ongoing client work.

Developers:

> If QR generation is embedded in your product, the strongest angle is lower API cost, TypeScript SDK support, and branded redirect control.

## Landing Page Requirements

Create a dedicated migration page before sending at scale:

- URL: `/qr-migration` or `/switch-from-qrcodekit`
- Above the fold: "Move your QR codes without breaking printed campaigns."
- CTA: "Request free migration audit."
- Fields: name, email, company, current QR provider, one QR link, number of QR codes, custom domain yes/no.
- Trust copy: "We will tell you if a printed QR code cannot be moved safely."
- Pricing comparison table with current tqrco prices.
- Compliance: privacy note and no resale of submitted links/emails.

## Pilot Plan

Week 1:

- Configure Resend on a subdomain.
- Build the migration landing page and form.
- Create suppression table or a simple Airtable/Sheet.
- Manually source 100 prospects across 3 segments.
- Send 20/day max, no automation beyond mail merge.

Week 2:

- Review replies, bounces, complaints, and conversions.
- Rewrite based on real objections.
- Increase to 30 to 50/day only if complaint rate stays near zero.
- Add one vertical-specific variant.

Week 3:

- Add second domain only if needed.
- Start tracking source/provider/segment conversion.
- Build reusable migration checklist and audit template.

## Metrics

Track:

- Delivery rate: target 95%+
- Bounce rate: keep below 3%; stop a data source if it exceeds 5%
- Complaint rate: keep below 0.1%, hard stop at 0.3%
- Reply rate: target 5%+
- Positive reply rate: target 1% to 3%
- Migration audit requests
- Trial signups
- Paid conversions
- Average monthly savings claimed
- Provider moved from

## Next Build Tasks

1. Add a `/qr-migration` landing page.
2. Add a migration request form and database table.
3. Add Resend integration for internal lead notification only, not bulk sends from the app yet.
4. Create a prospect tracker schema.
5. Create a migration audit checklist template.
6. Add a pricing comparison block driven by `BILLING_PLANS`.
