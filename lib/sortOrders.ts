// lib/sortOrders.ts
export const DRAW_SORT_ORDER: { [key: string]: number } = {
    // Pro
    "Men's Doubles": 1,
    "Women's Doubles": 2,
    "Mixed Doubles": 3,
    "Men's Singles": 4,
    "Women's Singles": 5,
    // Senior Pro
    "Senior Men's Doubles": 10,
    "Senior Women's Doubles": 11,
    "Senior Mixed Doubles": 12,
    "Senior Men's Singles": 13,
    "Senior Women's Singles": 14,
    // Champions Pro
    "Champions Men's Doubles": 20,
    "Champions Women's Doubles": 21,
    "Champions Mixed Doubles": 22,
    "Champions Men's Singles": 23,
    "Champions Women's Singles": 24,
    // Masters Pro
    "Masters Men's Doubles": 30,
    "Masters Women's Doubles": 31,
    "Masters Mixed Doubles": 32,
    "Masters Men's Singles": 33,
    "Masters Women's Singles": 34,
    // Default fallback
    'default': 99,
  };
  
  export function sortDrawsByHierarchy(drawNames: string[]): string[] {
    return drawNames.sort((a, b) => {
      const priorityA = DRAW_SORT_ORDER[a] || DRAW_SORT_ORDER['default'];
      const priorityB = DRAW_SORT_ORDER[b] || DRAW_SORT_ORDER['default'];
      return priorityA - priorityB;
    });
  }