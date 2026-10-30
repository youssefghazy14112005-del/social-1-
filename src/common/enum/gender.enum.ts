export const GenderEnum = Object.freeze({ MALE: 0, FEMALE: 1, OTHER: 2 } as const);
export const genderValues = Object.values(GenderEnum);
export type Gender = (typeof GenderEnum)[keyof typeof GenderEnum];
