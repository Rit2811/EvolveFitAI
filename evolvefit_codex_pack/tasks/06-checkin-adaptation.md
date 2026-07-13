# Task 06 - Check-in and Adaptation

## Objective
Collect daily recovery/adherence data and create a new adapted plan version.

## Work
- Attractive check-in form using sliders/segmented controls.
- Calculate readiness score.
- Save check-in.
- Implement `POST /api/ai/adapt-plan`.
- Validate adapted output.
- Save new active plan and deactivate prior plan.
- Display adaptation message and 2-4 reasons.

## Acceptance criteria
- Check-in persists.
- Readiness score is visible.
- Low sleep/high soreness produces a reasonable lighter plan or recovery change.
- Plan version increments.
- Hard dietary/equipment constraints remain unchanged.
- Failed AI adaptation uses a safe fallback adaptation.
