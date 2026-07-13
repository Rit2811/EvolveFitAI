# Design System

## Experience goals
- Calm, premium, energetic, trustworthy
- Dense enough to feel useful, but not cluttered
- Consistent across desktop and mobile

## Color tokens
```js
const colors = {
  background: '#F5F7F2',
  surface: '#FFFFFF',
  primary: '#166534',
  accent: '#84CC16',
  text: '#18201B',
  muted: '#6B746D',
  border: '#E4E8E2',
  warning: '#D97706',
  danger: '#DC2626'
}
```

## Layout
- Desktop app shell with left sidebar
- Mobile bottom navigation or compact menu
- Main content max width around 1400px
- Page spacing: 24-32px desktop, 16px mobile
- Card padding: 20-24px
- Grid gap: 16-20px

## Typography
Use Inter, Manrope, or Plus Jakarta Sans.
- Page title: 28-34px, semibold/bold
- Section title: 18-22px, semibold
- Body: 14-16px
- Metadata: 12-14px

## Component rules
- Buttons have consistent height and radius.
- Use icons only when they aid recognition.
- Use skeletons during plan generation.
- Show meaningful empty states.
- Use tabs for workout and meal plans.
- Rest days must look intentional.
- AI explanations should appear in a distinct adaptation card.

## Dashboard hierarchy
1. Welcome and goal
2. Readiness
3. Today's workout and meals
4. Weekly consistency
5. Latest adaptation
6. Quick actions

Avoid duplicate data and unnecessary widgets.
