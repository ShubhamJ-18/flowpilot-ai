import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { hashToken } from '../services/crypto.js';
import { AppError } from './errorHandler.js';

export async function requireAuth(req, res, next) {
  try {
    const rawToken = req.cookies?.[env.SESSION_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!rawToken) {
      throw new AppError('Authentication required. No session token provided.', 401);
    }

    const tokenHash = hashToken(rawToken);

    const session = await prisma.session.findUnique({
      where: { sessionTokenHash: tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Invalid or expired session. Please log in again.', 401);
    }

    if (new Date() > new Date(session.expiresAt)) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      throw new AppError('Session expired. Please log in again.', 401);
    }

    req.user = session.user;
    req.session = session;
    req.rawSessionToken = rawToken;

    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuth(req, res, next) {
  const rawToken = req.cookies?.[env.SESSION_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!rawToken) {
    return next();
  }

  const tokenHash = hashToken(rawToken);
  prisma.session
    .findUnique({
      where: { sessionTokenHash: tokenHash },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })
    .then((session) => {
      if (session && new Date() <= new Date(session.expiresAt)) {
        req.user = session.user;
        req.session = session;
      }
      next();
    })
    .catch(() => next());
}
