import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const AI_BASE = env.AI_SERVICE_URL.replace(/\/+$/, '');

export const aiClient = {
  async generateWorkflow(prompt, maxNodes = 15) {
    try {
      const res = await fetch(`${AI_BASE}/api/v1/ai/generate-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxNodes }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`AI Service error (${res.status}): ${errBody}`);
      }

      return await res.json();
    } catch (err) {
      logger.error('Failed to communicate with AI generation service', err);
      throw new Error(`AI Workflow Generation unavailable: ${err.message}`);
    }
  },

  async summarize(text, maxLength = 'concise', tone = 'professional') {
    try {
      const res = await fetch(`${AI_BASE}/api/v1/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, maxLength, tone }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`AI Service error (${res.status}): ${errBody}`);
      }

      return await res.json();
    } catch (err) {
      logger.error('Failed to call AI summarize', err);
      throw new Error(`AI Summarization failed: ${err.message}`);
    }
  },

  async classify(text, categories, instruction = '') {
    try {
      const res = await fetch(`${AI_BASE}/api/v1/ai/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, categories, instruction }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`AI Service error (${res.status}): ${errBody}`);
      }

      return await res.json();
    } catch (err) {
      logger.error('Failed to call AI classify', err);
      throw new Error(`AI Classification failed: ${err.message}`);
    }
  },

  async extract(text, schemaFields) {
    try {
      const res = await fetch(`${AI_BASE}/api/v1/ai/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, schemaFields }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`AI Service error (${res.status}): ${errBody}`);
      }

      return await res.json();
    } catch (err) {
      logger.error('Failed to call AI extract', err);
      throw new Error(`AI Extraction failed: ${err.message}`);
    }
  },
};
