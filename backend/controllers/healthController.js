const catchAsync = require('../utils/catchAsync');

const healthCheck = catchAsync(async (req, res) => {
  res.json({ status: 'ok', service: 'z-mate-api' });
});

module.exports = { healthCheck };
