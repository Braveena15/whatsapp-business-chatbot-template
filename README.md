# WhatsApp information-gathering backend

A reusable Node.js/Express backend for collecting customer information through the official Meta WhatsApp Cloud API. It provides webhook verification, an interactive registration conversation, in-memory demo repositories, and customer/health endpoints. Meta API calls remain isolated in `src/services/whatsappService.js`.

## Prerequisites

- Node.js 20 or later
- npm
- A Meta developer app with WhatsApp Cloud API enabled (for real messages)
- ngrok or another HTTPS tunnel for local webhook testing

## Clone and install

```bash
git clone https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
npm install
copy .env.example .env
```

On macOS/Linux, use `cp .env.example .env`. Edit `.env` locally; it is ignored by Git.

## Configuration

`.env.example` is intentionally placeholders only. Set these values in your local `.env`:

- `DATABASE_URL`, `JWT_SECRET`, and `ADMIN_SECRET`: reserved for database/auth features if your deployment uses them. This demo currently uses in-memory repositories.
- `VERIFY_TOKEN`: a private value you choose; it must exactly match the value entered in Meta's webhook settings.
- `WHATSAPP_ACCESS_TOKEN`: your Meta temporary or system-user access token.
- `WHATSAPP_PHONE_NUMBER_ID`: the Phone Number ID from Meta API Setup.
- `WHATSAPP_BUSINESS_ACCOUNT_ID`: the WABA ID from Meta API Setup.
- `GRAPH_API_VERSION`: `v25.0` by default; use a currently supported version required by Meta.
- `PORT`: `5000` by default.

Never commit `.env`, access tokens, passwords, secret values, or customer data.

## Start and test

```bash
npm start
npm run dev
npm test
```

Development and tests can start without WhatsApp credentials so local routes and automated tests work. Production and staging reject startup when required Meta values are missing.

Useful routes:

- `GET /` application status
- `GET /health` health check
- `GET /api/customers` list demo customers
- `GET /api/customers/:customerId` fetch one customer
- `DELETE /api/demo-data` clear in-memory demo data
- `GET` and `POST /webhook` Meta webhook verification and delivery

## ngrok and Meta webhook setup

1. Start the backend with `npm start`.
2. In another terminal, run `ngrok http 5000` (use your configured `PORT` if different).
3. Copy the HTTPS forwarding URL, then in Meta for Developers open your app's WhatsApp webhook configuration.
4. Set the callback URL to `https://YOUR-NGROK-DOMAIN/webhook`.
5. Set the verify token to the exact `VERIFY_TOKEN` from your local `.env`.
6. Subscribe to WhatsApp message events and complete Meta verification.

For a verification check, Meta sends a GET request containing `hub.mode`, `hub.verify_token`, and `hub.challenge`. The app returns the challenge only when the token matches.

## Adapting for another business

1. Update `src/config/businessConfig.js` to replace the business name, company description, hours, services, menu labels, and chatbot prompts/questions. Keep reply `id` values stable unless you also update `conversationService.js`.
2. Replace the service list with the new business's offerings.
3. Tailor the chatbot questions and collected fields in `conversationService.js` and `sessionRepository.js`; preserve customer/repository compatibility if existing data matters.
4. Create a new `.env` using that business's own WhatsApp credentials and secrets.
5. Use that business's own database configuration if you replace the in-memory repositories.
6. Configure that business's own Meta webhook callback URL and verify token.

The current schema is unchanged and all demo data remains in memory, so it is cleared when the process restarts. If adding persistent storage later, implement it behind the existing repository interfaces.

## Security and deployment notes

The app does not log incoming webhook payloads, avoiding accidental customer-data logging. Before production, add Meta `X-Hub-Signature-256` verification, restrictive CORS, rate limiting, durable storage, backups, monitoring, and an appropriate privacy/retention policy. Do not put secrets in `businessConfig.js`, source code, tests, or documentation.
