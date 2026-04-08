export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Zod errors (validation)
  if (err?.name === 'ZodError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.issues?.map((i) => ({
        path: i.path?.join('.'),
        message: i.message,
      })),
    });
  }

  res.status(statusCode).json({
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

