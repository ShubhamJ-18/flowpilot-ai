import { NODE_REGISTRY } from './registry.js';

export const MAX_GRAPH_NODES = 50;
export const MAX_GRAPH_EDGES = 100;

/**
 * Validates a workflow graph definition.
 * @param {object} definition - { nodes: Array, edges: Array }
 * @returns {{ isValid: boolean, errors: Array<{ nodeId?: string, edgeId?: string, message: string }>, executionOrder: string[] }}
 */
export function validateWorkflowGraph(definition) {
  const errors = [];
  const executionOrder = [];

  if (!definition || typeof definition !== 'object') {
    return {
      isValid: false,
      errors: [{ message: 'Workflow definition must be an object with nodes and edges.' }],
      executionOrder: [],
    };
  }

  const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
  const edges = Array.isArray(definition.edges) ? definition.edges : [];

  if (nodes.length === 0) {
    errors.push({ message: 'Workflow must contain at least one trigger node.' });
    return { isValid: false, errors, executionOrder: [] };
  }

  if (nodes.length > MAX_GRAPH_NODES) {
    errors.push({ message: `Workflow exceeds maximum node limit of ${MAX_GRAPH_NODES} (found ${nodes.length}).` });
  }

  if (edges.length > MAX_GRAPH_EDGES) {
    errors.push({ message: `Workflow exceeds maximum edge limit of ${MAX_GRAPH_EDGES} (found ${edges.length}).` });
  }

  // 1. Verify Node ID uniqueness and valid types
  const nodeMap = new Map();
  let triggerCount = 0;
  let triggerNodeId = null;

  for (const node of nodes) {
    if (!node.id || typeof node.id !== 'string') {
      errors.push({ message: 'Every node must have a unique string id.' });
      continue;
    }

    if (nodeMap.has(node.id)) {
      errors.push({ nodeId: node.id, message: `Duplicate node ID detected: "${node.id}".` });
    }
    nodeMap.set(node.id, node);

    const registrySpec = NODE_REGISTRY[node.type];
    if (!registrySpec) {
      errors.push({ nodeId: node.id, message: `Unknown or unapproved node type: "${node.type}".` });
      continue;
    }

    if (registrySpec.isTrigger) {
      triggerCount++;
      triggerNodeId = node.id;
    }

    // Validate node configuration against schema
    if (registrySpec.configSchema) {
      const parsedConfig = registrySpec.configSchema.safeParse(node.config || {});
      if (!parsedConfig.success) {
        const issues = parsedConfig.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        errors.push({ nodeId: node.id, message: `Configuration error for node "${node.id}": ${issues}` });
      }
    }
  }

  if (triggerCount === 0) {
    errors.push({ message: 'Workflow must have at least one trigger node (e.g. MANUAL_TRIGGER).' });
  } else if (triggerCount > 1) {
    errors.push({ message: `Workflow contains multiple trigger nodes (${triggerCount}). Only one trigger is permitted.` });
  }

  // 2. Build Adjacency List & Validate Edges
  const adjList = new Map(); // source -> Array<{ target, handle }>
  const inDegree = new Map(); // node -> count of incoming edges
  const edgeSet = new Set();

  for (const node of nodes) {
    adjList.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const edgeKey = `${edge.source}->${edge.target}:${edge.sourceHandle || 'default'}`;
    if (edgeSet.has(edgeKey)) {
      errors.push({ message: `Duplicate edge detected from "${edge.source}" to "${edge.target}".` });
    }
    edgeSet.add(edgeKey);

    if (!nodeMap.has(edge.source)) {
      errors.push({ message: `Edge source "${edge.source}" does not exist in graph nodes.` });
      continue;
    }
    if (!nodeMap.has(edge.target)) {
      errors.push({ message: `Edge target "${edge.target}" does not exist in graph nodes.` });
      continue;
    }

    if (edge.source === edge.target) {
      errors.push({ nodeId: edge.source, message: `Self-referential loop detected on node "${edge.source}".` });
      continue;
    }

    // Trigger node cannot have incoming edges
    if (edge.target === triggerNodeId) {
      errors.push({ nodeId: triggerNodeId, message: `Trigger node "${triggerNodeId}" cannot receive incoming connections.` });
    }

    adjList.get(edge.source).push({ target: edge.target, handle: edge.sourceHandle });
    inDegree.set(edge.target, inDegree.get(edge.target) + 1);
  }

  // 3. Cycle Detection using DFS with 3-color state
  // 0: Unvisited, 1: Visiting (in current recursion stack), 2: Visited
  const visitState = new Map();
  for (const node of nodes) {
    visitState.set(node.id, 0);
  }

  let hasCycle = false;
  function dfsCycle(nodeId) {
    visitState.set(nodeId, 1);

    const neighbors = adjList.get(nodeId) || [];
    for (const edge of neighbors) {
      const neighborState = visitState.get(edge.target);
      if (neighborState === 1) {
        hasCycle = true;
        errors.push({ nodeId, message: `Cycle detected involving connection to "${edge.target}".` });
      } else if (neighborState === 0) {
        dfsCycle(edge.target);
      }
    }

    visitState.set(nodeId, 2);
  }

  for (const node of nodes) {
    if (visitState.get(node.id) === 0) {
      dfsCycle(node.id);
    }
  }

  // 4. Reachability from Trigger (if single trigger and no cycles)
  if (triggerNodeId && !hasCycle && nodes.length > 1) {
    const reachable = new Set();
    const queue = [triggerNodeId];
    reachable.add(triggerNodeId);

    while (queue.length > 0) {
      const curr = queue.shift();
      const neighbors = adjList.get(curr) || [];
      for (const edge of neighbors) {
        if (!reachable.has(edge.target)) {
          reachable.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        errors.push({ nodeId: node.id, message: `Node "${node.id}" is unreachable from trigger node "${triggerNodeId}".` });
      }
    }
  }

  // 5. Compute Topological Execution Order (Kahn's Algorithm)
  if (!hasCycle && errors.length === 0) {
    const inDegreeCopy = new Map(inDegree);
    const zeroQueue = [];

    for (const [id, deg] of inDegreeCopy.entries()) {
      if (deg === 0) {
        zeroQueue.push(id);
      }
    }

    while (zeroQueue.length > 0) {
      const curr = zeroQueue.shift();
      executionOrder.push(curr);

      const neighbors = adjList.get(curr) || [];
      for (const edge of neighbors) {
        const nextDeg = inDegreeCopy.get(edge.target) - 1;
        inDegreeCopy.set(edge.target, nextDeg);
        if (nextDeg === 0) {
          zeroQueue.push(edge.target);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    executionOrder,
  };
}
