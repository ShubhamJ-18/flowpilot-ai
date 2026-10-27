import { prisma } from '../config/prisma.js';
import { AppError } from './errorHandler.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient privileges for this action', 403));
    }

    next();
  };
}

export function enforceOwnership(modelName, idParam = 'id', ownerField = 'ownerId') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const resourceId = req.params[idParam];
      if (!resourceId) {
        throw new AppError('Missing resource ID parameter', 400);
      }

      const record = await prisma[modelName].findUnique({
        where: { id: resourceId },
      });

      if (!record) {
        throw new AppError(`Resource not found`, 404);
      }

      // Allow ADMIN or Owner
      const isOwner = record[ownerField] === req.user.id || (modelName === 'workflowRun' && record.triggeredBy === req.user.id);
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        throw new AppError('Access denied: You do not have permission to access this resource', 403);
      }

      req.resource = record;
      next();
    } catch (err) {
      next(err);
    }
  };
}
