export const RoleEnum = Object.freeze({ USER: 0, ADMIN: 1 } as const);
export type Role = (typeof RoleEnum)[keyof typeof RoleEnum];
