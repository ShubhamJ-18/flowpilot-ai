import { prisma } from '../../config/prisma.js';
import { encryptCredential } from '../../services/crypto.js';
import { AppError } from '../../middleware/errorHandler.js';

export const integrationsController = {
  async list(req, res, next) {
    try {
      const integrations = await prisma.integration.findMany({
        where: { ownerId: req.user.id },
        select: {
          id: true,
          provider: true,
          displayName: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          // Never return encryptedCredentials in list responses!
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: { integrations } });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { provider, displayName, credentials } = req.body;

      // Encrypt credentials at rest using AES-256-GCM
      const encrypted = encryptCredential(credentials);

      const integration = await prisma.integration.create({
        data: {
          ownerId: req.user.id,
          provider: provider.toUpperCase(),
          displayName: displayName.trim(),
          encryptedCredentials: encrypted,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          provider: true,
          displayName: true,
          status: true,
          createdAt: true,
        },
      });

      res.status(201).json({ success: true, data: { integration } });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.integration.findFirst({
        where: { id: req.params.id, ownerId: req.user.id },
      });

      if (!existing) {
        throw new AppError('Integration not found or access denied', 404);
      }

      await prisma.integration.delete({
        where: { id: req.params.id },
      });

      res.status(200).json({ success: true, message: 'Integration revoked and removed.' });
    } catch (err) {
      next(err);
    }
  },
};
