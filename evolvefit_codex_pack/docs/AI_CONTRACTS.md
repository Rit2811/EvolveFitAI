# AI Contracts

## Generation output
```json
{
  "summary": "Short weekly strategy.",
  "workoutPlan": [
    {
      "day": "Monday",
      "title": "Upper Body Strength",
      "type": "Strength",
      "duration": 40,
      "intensity": "Moderate",
      "isRestDay": false,
      "exercises": [
        {
          "name": "Dumbbell Floor Press",
          "sets": 3,
          "reps": "10-12",
          "restSeconds": 60,
          "instruction": "Use controlled repetitions."
        }
      ]
    }
  ],
  "mealPlan": [
    {
      "day": "Monday",
      "breakfast": "Oats with banana and seeds",
      "lunch": "Paneer rice bowl with vegetables",
      "dinner": "Dal, roti and mixed vegetables",
      "snack": "Yogurt with fruit",
      "estimatedCalories": 2200,
      "estimatedProtein": 110
    }
  ],
  "adaptationMessage": "Initial plan created from the profile.",
  "adaptationReasons": []
}
```

## Validation rules
- Workout and meal arrays contain exactly seven days.
- Every day name is present once.
- Number of non-rest workout days matches the selected workout days.
- Non-rest days contain at least one exercise.
- Workout duration does not exceed user availability.
- Exercises use available equipment.
- Meals match diet type.
- Plan text contains none of the declared allergens or disliked foods.
- Summary and adaptation message are non-empty strings.

## Adaptation rules
- High soreness: reduce sets, intensity, impact, or add recovery.
- Low sleep/energy: lighter session or recovery emphasis.
- High stress: avoid maximal intensity.
- Strong recovery and adherence: small progression only.
- Low diet adherence: simplify meals, do not make them more complex.
- Diet, allergies, disliked foods, and equipment remain hard constraints.

## Fallback behavior
If model output is invalid or unavailable:
1. Return a complete local sample plan.
2. Mark response with `source: "fallback"`.
3. Display a non-alarming UI label: “Demo plan generated using the local fallback.”
4. Never leave the user on a permanent loading screen.
