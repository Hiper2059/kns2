const { z } = require('zod');

const objectIdSchema = z
  .string({ error: 'id phai la chuoi.' })
  .regex(/^[0-9a-fA-F]{24}$/, 'id khong hop le.');

const requiredTrimmedString = (field, max) => z
  .string({ error: `${field} phai la chuoi.` })
  .trim()
  .min(1, `${field} khong duoc rong.`)
  .max(max, `${field} toi da ${max} ky tu.`);

const optionalTrimmedString = (field, max) => z
  .string({ error: `${field} phai la chuoi.` })
  .trim()
  .max(max, `${field} toi da ${max} ky tu.`)
  .optional();

const courseBodySchema = z.object({
  title: requiredTrimmedString('title', 120),
  category: requiredTrimmedString('category', 80),
  description: optionalTrimmedString('description', 2000),
  imageUrl: optionalTrimmedString('imageUrl', 1000),
  status: z.enum(['draft', 'published']).optional()
}).strict();

const createCourseSchema = {
  body: courseBodySchema
};

const updateCourseSchema = {
  params: z.object({
    courseId: objectIdSchema
  }).strict(),
  body: courseBodySchema
    .partial()
    .refine(value => Object.keys(value).length > 0, {
      message: 'Can it nhat mot truong de cap nhat.'
    })
};

module.exports = {
  createCourseSchema,
  updateCourseSchema
};
