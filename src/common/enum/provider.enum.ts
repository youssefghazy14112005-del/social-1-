export const ProviderEnum = Object.freeze({ SYSTEM: 'system', GOOGLE: 'google', FACEBOOK: 'facebook' } as const);
export type Provider = (typeof ProviderEnum)[keyof typeof ProviderEnum];
