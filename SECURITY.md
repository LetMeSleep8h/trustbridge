# Security Policy

TrustBridge handles donations, wallet addresses and user accounts, so we take security reports seriously.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept
- The affected file, route or version if you know it

We aim to acknowledge reports within **72 hours** and to share a plan or fix within **14 days** for confirmed issues. We will credit you in the fix unless you prefer to stay anonymous.

## In scope

- Authentication and session handling (login, JWT, GitHub OAuth)
- Authorization (admin routes, campaign and comment ownership)
- Donation and transaction integrity (amount, destination and sender checks)
- Injection (SQL, HTML, CSV) and data exposure
- Anything that could move or misdirect funds

## Out of scope

- Findings that need a rooted device or a malicious browser extension
- Denial of service through sheer traffic volume
- Missing best-practice headers with no demonstrated impact
- Issues in third-party services (Stellar network, Resend, Cloudinary, GitHub)

## Never post secrets

Do not paste API keys, `JWT_SECRET`, tokens, private keys or database files into issues, pull requests or chats. If you find one committed to the repository, report it privately as above. Maintainers will rotate it.

## Supported versions

Only the `main` branch is supported. Fixes are released there.
