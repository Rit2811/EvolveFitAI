# Task 04 - AI Plan Generation

## Objective
Generate, validate, and save a complete seven-day workout and meal plan.

## Work
- Implement OpenAI service in the backend.
- Implement `POST /api/ai/generate-plan`.
- Request predictable JSON matching `docs/AI_CONTRACTS.md`.
- Add parser and validator.
- Add local fallback plan.
- Save active plan with version 1.
- Show generation loading UI.

## Acceptance criteria
- Valid profile produces seven workout days and seven meal days.
- Constraints are respected.
- Invalid/failed AI response returns fallback plan.
- API key remains backend-only.
- Saved plan can be reloaded after refresh.
