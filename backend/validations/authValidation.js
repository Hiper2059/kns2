const { z } = require('zod');

const usernameSchema = z
  .string({ error: 'username phai la chuoi.' })
  .trim()
  .min(1, 'username khong duoc rong.')
  .max(64, 'username toi da 64 ky tu.');

const passwordSchema = z
  .string({ error: 'password phai la chuoi.' })
  .min(6, 'password can toi thieu 6 ky tu.')
  .max(128, 'password toi da 128 ky tu.');

const displayNameSchema = z
  .string({ error: 'displayName phai la chuoi.' })
  .trim()
  .max(100, 'displayName toi da 100 ky tu.')
  .optional();

const registerSchema = {
  body: z.object({
    username: usernameSchema,
    password: passwordSchema,
    displayName: displayNameSchema
  }).strict()
};

const loginSchema = {
  body: z.object({
    username: usernameSchema,
    password: passwordSchema,
    loginAs: z.enum(['admin', 'teacher', 'student']).optional()
  }).strict()
};

module.exports = {
  registerSchema,
  loginSchema
};
