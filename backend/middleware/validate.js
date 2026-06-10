const validate = schema => async (req, res, next) => {
  const targets = ['body', 'query', 'params'];
  const parsed = {};
  const errors = [];

  for (const target of targets) {
    if (!schema[target]) {
      continue;
    }

    const result = await schema[target].safeParseAsync(req[target]);
    if (result.success) {
      parsed[target] = result.data;
      continue;
    }

    errors.push(
      ...result.error.issues.map(issue => ({
        field: [target, ...issue.path].join('.'),
        message: issue.message
      }))
    );
  }

  if (errors.length) {
    return res.status(400).json({
      message: 'Du lieu gui len khong hop le.',
      errors
    });
  }

  Object.entries(parsed).forEach(([target, value]) => {
    req[target] = value;
  });

  return next();
};

module.exports = validate;
