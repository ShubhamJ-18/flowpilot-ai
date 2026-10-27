import { workflowsService } from './workflows.service.js';

export const workflowsController = {
  async list(req, res, next) {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const { search, status } = req.query;

      const result = await workflowsService.listWorkflows(req.user.id, {
        search,
        status,
        page,
        limit,
      });

      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const workflow = await workflowsService.createWorkflow(req.user.id, req.body);
      res.status(201).json({ success: true, data: { workflow } });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const workflow = await workflowsService.getWorkflow(req.user.id, req.params.id);
      res.status(200).json({ success: true, data: { workflow } });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const workflow = await workflowsService.updateWorkflow(req.user.id, req.params.id, req.body);
      res.status(200).json({ success: true, data: { workflow } });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await workflowsService.deleteWorkflow(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async validate(req, res, next) {
    try {
      const result = await workflowsService.validateGraph(req.body.definition);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async generate(req, res, next) {
    try {
      const result = await workflowsService.generateFromNaturalLanguage(req.user.id, req.body.prompt);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async listVersions(req, res, next) {
    try {
      const versions = await workflowsService.listVersions(req.user.id, req.params.id);
      res.status(200).json({ success: true, data: { versions } });
    } catch (err) {
      next(err);
    }
  },
};
