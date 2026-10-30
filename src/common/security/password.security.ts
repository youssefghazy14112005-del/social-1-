import bcrypt from 'bcrypt';
export const hash = (value: string, saltRounds = 12) => bcrypt.hash(value, saltRounds);
export const compare = (value: string, hashedValue: string) => bcrypt.compare(value, hashedValue);
