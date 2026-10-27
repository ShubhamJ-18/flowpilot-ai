/**
 * Safely resolves a nested dot-delimited path from a context object.
 * e.g. getByPath({ a: { b: 123 } }, "a.b") => 123
 */
export function getByPath(obj, path) {
  if (!obj || typeof obj !== 'object' || !path || typeof path !== 'string') {
    return undefined;
  }

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Safely interpolates {{path.to.variable}} within a string template.
 * Avoids any eval() or JavaScript execution.
 * @param {string} template - Raw template string
 * @param {Record<string, any>} context - Context object containing node outputs
 * @returns {string} Interpolated string
 */
export function interpolateTemplate(template, context = {}) {
  if (typeof template !== 'string') {
    return String(template || '');
  }

  // Regex matches {{ path.to.variable }} or {{path.to.variable}}
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, path) => {
    const val = getByPath(context, path);
    if (val === undefined || val === null) {
      return '';
    }
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  });
}

/**
 * Evaluates a declarative condition rule without executing user code.
 * @param {string} fieldRef - Dot path to the field in context (e.g. "classify_1.category")
 * @param {string} operator - One of 'equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'is_empty'
 * @param {any} targetValue - Value to compare against
 * @param {Record<string, any>} context - Execution context
 * @returns {boolean} Result of condition
 */
export function evaluateCondition(fieldRef, operator, targetValue, context = {}) {
  const actualValue = getByPath(context, fieldRef);

  switch (operator) {
    case 'equals':
      return String(actualValue ?? '').toLowerCase() === String(targetValue ?? '').toLowerCase();

    case 'not_equals':
      return String(actualValue ?? '').toLowerCase() !== String(targetValue ?? '').toLowerCase();

    case 'contains':
      if (typeof actualValue === 'string') {
        return actualValue.toLowerCase().includes(String(targetValue ?? '').toLowerCase());
      }
      if (Array.isArray(actualValue)) {
        return actualValue.includes(targetValue);
      }
      return false;

    case 'greater_than': {
      const numActual = Number(actualValue);
      const numTarget = Number(targetValue);
      if (isNaN(numActual) || isNaN(numTarget)) return false;
      return numActual > numTarget;
    }

    case 'less_than': {
      const numActual = Number(actualValue);
      const numTarget = Number(targetValue);
      if (isNaN(numActual) || isNaN(numTarget)) return false;
      return numActual < numTarget;
    }

    case 'in': {
      if (Array.isArray(targetValue)) {
        return targetValue.map(v => String(v).toLowerCase()).includes(String(actualValue ?? '').toLowerCase());
      }
      if (typeof targetValue === 'string') {
        const list = targetValue.split(',').map(s => s.trim().toLowerCase());
        return list.includes(String(actualValue ?? '').toLowerCase());
      }
      return false;
    }

    case 'is_empty':
      return actualValue === undefined || actualValue === null || actualValue === '' || (Array.isArray(actualValue) && actualValue.length === 0);

    default:
      return false;
  }
}

/**
 * Deterministic JSON transformation without code execution.
 * @param {Record<string, string>} mappings - Map of targetKey -> sourcePath
 * @param {string[]} pickKeys - Optional list of keys to retain
 * @param {Record<string, any>} context - Source context
 * @returns {Record<string, any>} Transformed object
 */
export function transformJson(mappings = {}, pickKeys = null, context = {}) {
  const result = {};

  for (const [targetKey, sourcePath] of Object.entries(mappings)) {
    result[targetKey] = getByPath(context, sourcePath);
  }

  if (Array.isArray(pickKeys) && pickKeys.length > 0) {
    const filtered = {};
    for (const key of pickKeys) {
      if (key in result) {
        filtered[key] = result[key];
      }
    }
    return filtered;
  }

  return result;
}
