# Implementation Plan

## Delivery philosophy
Build the smallest polished product that proves personalization and adaptation. Complete P0 before adding P1. Feature freeze should begin once the core demo flow works.

## Phase sequence
1. Foundation and connections
2. Authentication and application shell
3. Onboarding and profile persistence
4. AI plan generation
5. Plan experience
6. Daily check-in and adaptation
7. Dashboard and progress
8. AI coach and profile
9. Release polish and demo preparation

## Suggested time budget
- Foundation: 35 minutes
- Authentication and shell: 40 minutes
- Onboarding: 55 minutes
- AI generation: 60 minutes
- Plan UI: 55 minutes
- Check-in and adaptation: 65 minutes
- Dashboard and progress: 50 minutes
- Coach and profile: 35 minutes
- QA, README, demo: 45 minutes

## Critical gates
### Gate 1 - Core connectivity
Frontend loads, Express health endpoint responds, Supabase client connects.

### Gate 2 - Profile complete
A signed-in user can save onboarding data and reload it.

### Gate 3 - AI generation complete
A valid seven-day plan is generated or a fallback plan is returned.

### Gate 4 - Adaptation complete
A check-in is saved and a new plan version is created with an explanation.

### Gate 5 - Demo freeze
Production build succeeds and the main demo flow works without code edits.

## Scope-cut order
When time is short, remove in this order:
1. Chat persistence
2. Advanced profile settings
3. Secondary charts
4. Decorative animations
5. Password recovery
6. Landing-page extras

Never cut plan generation, check-in, adaptation, or the adaptation explanation.
