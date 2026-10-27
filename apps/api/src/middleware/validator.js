import { AppError } from './errorHandler.js';

export function validateRequest({ body, query, params }) {
  return (req, res, next) => {
    try {
      if (body) {
        const parsedBody = body.safeParse(req.body);
        if (!parsedBody.success) {
          throw new AppError('Invalid request payload', 400, parsedBody.error.format());
        }
        req.body = parsedBody.data;
      }

      if (query) {
        const parsedQuery = query.safeParse(req.query);
        if (!parsedQuery.success) {
          throw new AppError('Invalid query parameters', 400, parsedQuery.error.format());
        }
        req.query = parsedQuery.data;
      }

      if (params) {
        const parsedParams = params.safeParse(req.params);
        if (!parsedParams.success) {
          throw new AppError('Invalid route parameters', 400, parsedParams.error.format());
        }
        req.params = parsedParams.data;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
