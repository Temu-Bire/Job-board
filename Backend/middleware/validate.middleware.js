import { z } from 'zod';

/**
 * Generic request validation middleware.
 * Usage: validate({ body: schema, query: schema, params: schema })
 */
export const validate = (schemas = {}) => (req, res, next) => {
  try {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

