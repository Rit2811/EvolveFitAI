const day = { type: 'string', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }
const text = { type: 'string' }
const number = { type: 'number' }

export const planResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'workoutPlan', 'mealPlan', 'adaptationMessage', 'adaptationReasons'],
  properties: {
    summary: text,
    adaptationMessage: text,
    adaptationReasons: { type: 'array', maxItems: 4, items: text },
    workoutPlan: {
      type: 'array', minItems: 7, maxItems: 7,
      items: {
        type: 'object', additionalProperties: false,
        required: ['day', 'title', 'type', 'duration', 'intensity', 'isRestDay', 'exercises'],
        properties: {
          day, title: text, type: text, duration: number, intensity: text, isRestDay: { type: 'boolean' },
          exercises: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false,
              required: ['name', 'equipment', 'sets', 'reps', 'restSeconds', 'instruction'],
              properties: { name: text, equipment: text, sets: number, reps: text, restSeconds: number, instruction: text },
            },
          },
        },
      },
    },
    mealPlan: {
      type: 'array', minItems: 7, maxItems: 7,
      items: {
        type: 'object', additionalProperties: false,
        required: ['day', 'breakfast', 'lunch', 'dinner', 'snack', 'estimatedCalories', 'estimatedProtein'],
        properties: { day, breakfast: text, lunch: text, dinner: text, snack: text, estimatedCalories: number, estimatedProtein: number },
      },
    },
  },
}
