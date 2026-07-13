# Demo and Release Checklist

## Demo account
Prepare a profile with:
- Goal: Build muscle
- Experience: Beginner
- Four workout days
- Home environment
- Dumbbells and resistance bands
- Vegetarian diet
- Peanut allergy
- 45-minute sessions

## Five-minute demo
1. Open landing/login.
2. Sign in.
3. Show profile/onboarding values.
4. Generate or open the active plan.
5. Show workout constraints are respected.
6. Show meals are vegetarian and peanut-free.
7. Submit check-in: low sleep, low energy, high soreness.
8. Adapt the plan.
9. Show lighter training/recovery change.
10. Show adaptation message and reasons.
11. Open progress.
12. Ask the coach why the plan changed.

## Release checks
- `npm run build` succeeds for the client.
- Server starts without syntax errors.
- `/api/health` responds.
- No secrets are committed.
- Browser console has no blocking errors.
- Protected routes redirect correctly.
- Refreshing a protected page does not permanently break session handling.
- Empty states render when no plan/check-in exists.
- AI failure returns fallback data.
- All visible buttons have working actions.
- Mobile width remains usable.
- Disclaimer is visible in profile/footer or relevant screens.

## Presentation talking points
- Problem: static plans do not respond to daily recovery or adherence.
- Solution: profile-aware weekly planning plus check-in-based adaptation.
- AI role: composition and explanation.
- Safety role: backend validation and fixed constraints.
- Future scope: wearables, verified knowledge retrieval, meal database, notifications.
