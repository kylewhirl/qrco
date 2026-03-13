Subject: Domain Connect onboarding for theqrcode.co

Hello Cloudflare team,

I’m setting up Domain Connect support for `theqrcode.co`, so customers using Cloudflare DNS can approve the required DNS record changes for our QR redirect product through Cloudflare’s synchronous Domain Connect flow.

Prepared service details:

- Provider ID: `theqrcode.co`
- Provider name: `the qr code co.`
- Product URL: `https://theqrcode.co`
- Logo asset: `https://theqrcode.co/logo.svg`
- Sync public key domain: `dc.theqrcode.co`
- Cloudflare Sync UX URL discovered from provider settings: `https://dash.cloudflare.com/domainconnect`
- Service templates:
  - `vercel-qr-a`
  - `vercel-qr-cname`

Template files are ready:

- [`theqrcode.co.vercel-qr-a.json`](/Users/kyle/tqrco/domain-connect/theqrcode.co.vercel-qr-a.json)
- [`theqrcode.co.vercel-qr-cname.json`](/Users/kyle/tqrco/domain-connect/theqrcode.co.vercel-qr-cname.json)
- Signing key publication instructions: [`cloudflare-onboarding.md`](/Users/kyle/tqrco/docs/domain-connect/cloudflare-onboarding.md)

The signing public key will be published at:

- `_dcpubkeyv1.dc.theqrcode.co`

Please let me know the remaining onboarding steps needed on Cloudflare’s side, including:

1. Whether these template definitions are acceptable as submitted after they are opened as a PR against `Domain-Connect/Templates`.
2. Whether you want any Cloudflare-specific adjustments beyond the public documentation and the `dc-template-linter -cloudflare` guidance.
3. Whether there is anything else you want included alongside the public key TXT publication and template PR for final review.

Thanks,

Kyle
