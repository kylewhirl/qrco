# Security Policy

## Reporting a Vulnerability

Please do not open a public GitHub issue for a vulnerability.

Email `hello@tqrco.de` with:

- Affected area or endpoint
- Steps to reproduce
- Potential impact
- Any relevant logs, screenshots, or proof-of-concept details

If GitHub private vulnerability reporting is enabled for the repository, you can use that instead.

## Secret Handling

Never commit:

- `.env.local` or other real environment files
- `.vercel`
- Private keys or certificates
- Production database exports
- Generated build output

Use `.env.example` to document required configuration without secret values.
