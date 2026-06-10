const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Yêu cầu không hợp lệ.';

  if (error.code === 11000) {
    statusCode = 409;
    message = 'Dữ liệu đã tồn tại.';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Dữ liệu không hợp lệ.';
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Dữ liệu không hợp lệ.';
  }

  const responseMessage = statusCode >= 500
    ? 'Lỗi hệ thống. Vui lòng thử lại sau.'
    : message;

  console.error('Backend error:', {
    statusCode,
    method: req.method,
    path: req.originalUrl || req.url,
    message: error.message,
    stack: error.stack
  });

  return res.status(statusCode).json({ message: responseMessage });
};

module.exports = errorHandler;
