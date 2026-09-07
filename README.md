# EvolveFit AI

EvolveFit AI is a fitness and nutrition coach that creates a seven-day plan from a saved user profile, records weekly recovery and adherence, visualizes progress, and applies user-requested AI plan adjustments.

## Stack

- React, Vite, JavaScript, Tailwind CSS, and React Router
- Express authentication and a persistent server-side data store
- Node.js and the Google GenAI SDK
- Lucide React and Recharts

Gemini is called only by Express, the API key stays in the ignored `server/.env` file, and every AI endpoint requires a signed account session. Plan generation, explicit plan tuning, and coaching have local fallbacks when Gemini is unavailable. Check-ins never alter a plan automatically.

## Setup and run

Requirements: Node.js 20 or newer and npm.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `client/.env.example` to `client/.env`. Keep `VITE_API_URL=http://localhost:3001` for local development.

3. Copy `server/.env.example` to `server/.env`. Set a long random `AUTH_SECRET` before deployment. `GEMINI_API_KEY` is optional; the local fallback works without it.

4. Run both applications:

   ```bash
   npm run dev
   ```

Open `http://localhost:5173`. The API runs at `http://localhost:3001`.

## Useful commands

```bash
npm run lint
npm test
npm run build
npm run verify
npm run release:preflight
```

Accounts, password hashes, profiles, plans, and check-ins are stored persistently in `server/data/evolvefit.json`. The file is excluded from Git. Passwords use salted scrypt hashes, signed sessions expire after seven days, and every account has the same permissions. Coach conversations are stored locally per account in the browser.

The development account is an ordinary user named **Admin**:

```text
Email: admin@evolvefit.local
Password: admin123
```

The server recreates this ordinary Admin seed when the local data file does not exist, including after a fresh GitHub clone. Change these intentionally simple demo credentials and `AUTH_SECRET` before deploying publicly.

EvolveFit AI provides general fitness and nutrition guidance and is not a substitute for medical advice, diagnosis, or professional treatment.
