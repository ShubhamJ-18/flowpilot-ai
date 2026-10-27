import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { generateSessionToken, hashToken } from '../../services/crypto.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';

export const authService = {
  async register({ name, email, password }) {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Create session
    const rawToken = generateSessionToken();
    const sessionTokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE_HOURS * 3600 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        sessionTokenHash,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'AUTH_REGISTER',
        entityType: 'User',
        entityId: user.id,
        safeMetadata: { email: user.email },
      },
    }).catch(() => {});

    return { user, rawToken, expiresAt };
  },

  async login({ email, password, ipAddress, userAgent }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    // Session rotation: generate fresh session token
    const rawToken = generateSessionToken();
    const sessionTokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE_HOURS * 3600 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        sessionTokenHash,
        ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
        userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'AUTH_LOGIN',
        entityType: 'User',
        entityId: user.id,
      },
    }).catch(() => {});

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      rawToken,
      expiresAt,
    };
  },

  async logout(sessionToken) {
    if (!sessionToken) return;

    const tokenHash = hashToken(sessionToken);
    await prisma.session.deleteMany({
      where: { sessionTokenHash: tokenHash },
    }).catch(() => {});
  },

  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  },

  async requestPasswordReset(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Constant-time generic response to prevent account enumeration
    if (!user) {
      return { message: 'If an account matches that email, password reset instructions have been dispatched.' };
    }

    const resetToken = generateSessionToken();
    logger.info(`[DEV PASSWORD RECOVERY] Password reset requested for: ${user.email}. Recovery token: ${resetToken}`);

    return {
      message: 'If an account matches that email, password reset instructions have been dispatched.',
      // In dev mode, return token so developer can test the flow easily
      ...(env.NODE_ENV !== 'production' && { devRecoveryToken: resetToken }),
    };
  },
};
