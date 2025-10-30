# SoulSyncApp

SoulSyncApp is a full‑stack application built with a Node.js and TypeScript backend and a React/TypeScript frontend.  
The backend exposes a REST/GraphQL API for the core functionality (authentication, scheduling, messaging, AI insights) and uses PostgreSQL and Redis for persistence and caching.  
The frontend is built with Vite and provides a modern SPA that communicates with the backend.  Mobile builds for Android and iOS are produced using the same codebase and Fastlane.

## Features

- **Secure backend** – Express server with JWT authentication, rate limiting and Content Security Policy.  
- **Real‑time updates** – Socket.io or similar for live sessions and notifications.  
- **AI integration** – Optional AI services for PR review and user insights (requires API key).  
- **Monitoring and alerting** – Integration with Sentry, Slack and email alerting.  
- **CI/CD** – GitHub Actions workflows for linting, testing, code coverage, secret checks and automated releases.

## Environment variables

Configuration relies on environment variables defined in `.env` files.  Example values are provided in `.env.example` and `.env.production.example`.  Important variables include:

- `DATABASE_URL` – connection string for PostgreSQL database.  
- `REDIS_URL` – connection string for Redis cache.  
- `ADMIN_JWT_SECRET` and `ADMIN_JWT_KEYS` – secrets for signing administrator JWTs.  
- `AI_API_KEY` or `OPENAI_API_KEY` – API key for AI services.  
- `SLACK_WEBHOOK_URL` – Slack incoming webhook for notifications.  
- `GOOGLE_PLAY_JSON` and Apple store variables for mobile releases.  
- For a full list see `.env.example` and `.env.production.example`.

Never commit real secrets to the repository; instead set them in GitHub Secrets or your deployment environment.

## Development

1. Install dependencies:  
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set your local variables.  
3. Start the backend and frontend:  
   ```bash
   npm run dev
   ```
   This runs both the API and frontend with hot reload.

## Testing

Run unit tests and coverage with:  
```bash
npm test
```
Mutation testing and linting are part of the CI workflows.

## Deployment

Production builds are created via GitHub Actions and Fastlane.  To deploy locally or on a server:

1. Build the frontend:  
   ```bash
   npm run build
   ```
2. Configure environment variables for production (`.env.production`).  
3. Use a process manager like PM2 or a container orchestrator (Docker/Kubernetes) to run the backend and serve the static frontend.

## Contributing

Pull requests are welcome.  Please ensure your code passes linting and tests before opening a PR.  The repository uses CodeQL and dependency review to catch security issues automatically.

## License

This project is licensed under the MIT License – see the `LICENSE` file for details.
