import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

function setSessionCookie(res, token, expiresAt) {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.SESSION_SECURE_COOKIE,
    sameSite: env.SESSION_SAME_SITE,
    expires: expiresAt,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: env.SESSION_SECURE_COOKIE,
    sameSite: env.SESSION_SAME_SITE,
    path: '/',
  });
}

export const authController = {
  async register(req, res, next) {
    try {
      const { user, rawToken, expiresAt } = await authService.register(req.body);
      setSessionCookie(res, rawToken, expiresAt);
      res.status(201).json({
        success: true,
        data: { user, token: rawToken },
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];
      const { user, rawToken, expiresAt } = await authService.login({
        ...req.body,
        ipAddress,
        userAgent,
      });

      setSessionCookie(res, rawToken, expiresAt);
      res.status(200).json({
        success: true,
        data: { user, token: rawToken },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const rawToken = req.cookies?.[env.SESSION_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
      await authService.logout(rawToken);
      clearSessionCookie(res);
      res.status(200).json({
        success: true,
        message: 'Successfully logged out.',
      });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.requestPasswordReset(req.body.email);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
};
