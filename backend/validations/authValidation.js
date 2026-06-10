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

const registerSchema = {
  body: z.object({
    username: usernameSchema,
    password: passwordSchema
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
