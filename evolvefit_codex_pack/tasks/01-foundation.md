# Task 01 - Foundation

## Objective
Create or repair the project foundation so React, Express, and Supabase can communicate.

## Work
- Inspect existing repository and package files.
- Ensure client is React + Vite.
- Ensure server is Node + Express.
- Configure CORS and JSON body parsing.
- Add `GET /api/health`.
- Add frontend and backend `.env.example` files.
- Configure Supabase client in the frontend.
- Create route placeholders for all application pages.
- Add a basic app shell or minimal navigation placeholder.

## Acceptance criteria
- Client starts.
- Server starts.
- Health endpoint returns 200.
- Frontend can call health endpoint.
- Supabase client initializes without exposing private credentials.
- Production client build succeeds.

## Codex prompt
```text
Implement Task 01 exactly. Reuse existing setup where possible. Do not implement later features. Run startup/build checks and stop only when acceptance criteria pass.
```
