import { runsService } from './runs.service.js';

export const runsController = {
  async trigger(req, res, next) {
    try {
      const run = await runsService.triggerRun(req.user.id, req.body);
      res.status(201).json({ success: true, data: { run } });
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const { workflowId, status } = req.query;

      const result = await runsService.listRuns(req.user.id, {
        workflowId,
        status,
        page,
        limit,
      });

      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const run = await runsService.getRunDetails(req.user.id, req.params.id);
      res.status(200).json({ success: true, data: { run } });
    } catch (err) {
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const run = await runsService.cancelRun(req.user.id, req.params.id);
      res.status(200).json({ success: true, data: { run } });
    } catch (err) {
      next(err);
    }
  },

  async retry(req, res, next) {
    try {
      const run = await runsService.retryRun(req.user.id, req.params.id);
      res.status(201).json({ success: true, data: { run } });
    } catch (err) {
      next(err);
    }
  },
};
