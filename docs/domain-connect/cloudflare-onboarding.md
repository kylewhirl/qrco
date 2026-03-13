# Cloudflare Domain Connect Onboarding

This project is prepared for Cloudflare Domain Connect, but Cloudflare review and template publication are still required before the one-click flow can be enabled.

## Prepared service details

- Provider ID: `theqrcode.co`
- Provider name: `the qr code co.`
- A-record service ID: `vercel-qr-a`
- CNAME service ID: `vercel-qr-cname`
- Sync public key domain: `dc.theqrcode.co`
- Sync public key host: `_dcpubkeyv1`
- Logo URL: `https://theqrcode.co/logo.svg`
- Cloudflare Sync UX URL: `https://dash.cloudflare.com/domainconnect`
- Cloudflare API URL: `https://api.cloudflare.com/client/v4/dns/domainconnect`
- Private signing key file: `.secrets/domain-connect/cloudflare-sync-private-key.pem`
- Public templates:
  - [`theqrcode.co.vercel-qr-a.json`](/Users/kyle/tqrco/domain-connect/theqrcode.co.vercel-qr-a.json)
  - [`theqrcode.co.vercel-qr-cname.json`](/Users/kyle/tqrco/domain-connect/theqrcode.co.vercel-qr-cname.json)
- Upstream PR:
  - [Domain-Connect/Templates#857](https://github.com/Domain-Connect/Templates/pull/857)

## DNS TXT records to publish

Publish these TXT records at `_dcpubkeyv1.dc.theqrcode.co`:

```text
p=1,a=RS256,d=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1deJZnCrWY7AipC8yXl/fHeolYuvGFhUe1OGxV1hsqPl9QJob+Xw/6S280cugmTX9UvmsLukvZxTiIv8keYRsaUGX4Jebk1wXlkB1FJTfWkaMBP27YPH3ZwI5NuMLohG3ctNs0mO
p=2,a=RS256,d=LfxU1/Fob2mmnt5nmniuVtd0/pJs0VgGo/XfVqv0pqVH0sTDp57jBS6ss+YFL2+EkeeXZ8qqCh97UoDLNDoZyPyC6DtzkV1SV4U7Y9XvgEkqcy7RZbNasJS+w30LxebaM2vDae/x9/wjUlQmkiM1a2TCB8p+qR4VjvOR0ebcMAE/MWOVzeM1
p=3,a=RS256,d=GX58aEPYkUisC/bfBu316oWQMwIDAQAB
```

## Cloudflare notes

- Cloudflare documents Domain Connect here: [Cloudflare Domain Connect](https://developers.cloudflare.com/dns/reference/domain-connect/)
- Cloudflare supports the synchronous flow only.
- Cloudflare requires the templates to be submitted through the public `Domain-Connect/Templates` repository.
- Cloudflare requires signed requests and the public key TXT record above to be published before review can complete.
- Cloudflare’s discovery/settings endpoints already resolve for `theqrcode.co`:
  - `_domainconnect.theqrcode.co TXT "api.cloudflare.com/client/v4/dns/domainconnect"`
  - `GET https://api.cloudflare.com/client/v4/dns/domainconnect/v2/theqrcode.co/settings`
- If publishing the TXT records through the Cloudflare API instead of the dashboard UI, the token must include `Zone DNS Edit` / `DNS Write`. Wrangler OAuth login with `workers:write` and `zone:read` is not sufficient for the DNS records API.

## App configuration already prepared

These values are already staged in `.env.local`:

```env
DOMAIN_CONNECT_CLOUDFLARE_PROVIDER_ID=theqrcode.co
DOMAIN_CONNECT_CLOUDFLARE_SYNC_PUBKEY_HOST=_dcpubkeyv1
DOMAIN_CONNECT_CLOUDFLARE_SYNC_PRIVATE_KEY_FILE=.secrets/domain-connect/cloudflare-sync-private-key.pem
DOMAIN_CONNECT_CLOUDFLARE_SERVICE_ID_A=vercel-qr-a
DOMAIN_CONNECT_CLOUDFLARE_SERVICE_ID_CNAME=vercel-qr-cname
DOMAIN_CONNECT_CLOUDFLARE_TARGET_VARIABLE=value
```

The one-click button is intentionally hidden until the TXT key is published, the templates are accepted upstream, and Cloudflare review is complete.
