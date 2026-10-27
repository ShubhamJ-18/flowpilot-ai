'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from '@xyflow/react';
import {
  Save,
  Play,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  History,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import CustomNode from './CustomNode';
import NodeConfigDrawer from './NodeConfigDrawer';
import NodePalette from './NodePalette';
import AiGeneratorModal from './AiGeneratorModal';
import TestRunModal from './TestRunModal';
import { NODE_REGISTRY, validateWorkflowGraph } from '@flowpilot/shared';
import { api } from '@/lib/api';

const nodeTypes = {
  custom: CustomNode,
};

export default function WorkflowEditor({ workflow, onSaveSuccess }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [testRunModalOpen, setTestRunModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationState, setValidationState] = useState({ isValid: true, errors: [] });
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeRunId, setActiveRunId] = useState(null);

  // Initialize nodes and edges from workflow definition
  useEffect(() => {
    if (workflow?.definition) {
      const defNodes = workflow.definition.nodes || [];
      const defEdges = workflow.definition.edges || [];

      const initialNodes = defNodes.map((n) => ({
        id: n.id,
        type: 'custom',
        position: n.position || { x: 100, y: 100 },
        data: {
          id: n.id,
          type: n.type,
          label: n.label || NODE_REGISTRY[n.type]?.displayName || n.type,
          config: n.config || {},
          status: 'idle',
        },
      }));

      const initialEdges = defEdges.map((e, idx) => ({
        id: e.id || `e_${e.source}_${e.target}_${idx}`,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
        animated: true,
      }));

      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [workflow, setNodes, setEdges]);

  // Connect handler
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );

  // Node selection handler
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Add new node from palette
  function handleAddNode(type) {
    const spec = NODE_REGISTRY[type];
    const newId = `${type.toLowerCase()}_${Date.now().toString().slice(-4)}`;

    const newNode = {
      id: newId,
      type: 'custom',
      position: { x: 250 + nodes.length * 30, y: 150 + nodes.length * 20 },
      data: {
        id: newId,
        type,
        label: spec?.displayName || type,
        config: spec?.defaultConfig ? JSON.parse(JSON.stringify(spec.defaultConfig)) : {},
        status: 'idle',
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newId);
    setPaletteOpen(false);
  }

  // Update node data from drawer
  function handleUpdateNode(nodeId, newData) {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: newData,
          };
        }
        return n;
      })
    );
  }

  // Delete node
  function handleDeleteNode(nodeId) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }

  // Validate graph
  function handleValidateGraph() {
    const currentDef = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.type,
        label: n.data.label,
        config: n.data.config,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
      })),
    };

    const res = validateWorkflowGraph(currentDef);
    setValidationState(res);

    if (res.isValid) {
      setStatusMessage({ type: 'success', text: 'Graph structure is fully valid!' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  }

  // Apply AI Generated Proposal
  function handleApplyAiProposal(proposal) {
    const mappedNodes = proposal.nodes.map((n, idx) => ({
      id: n.id,
      type: 'custom',
      position: n.position || { x: 100 + idx * 260, y: 180 },
      data: {
        id: n.id,
        type: n.type,
        label: n.label || NODE_REGISTRY[n.type]?.displayName || n.type,
        config: n.config || {},
        status: 'idle',
      },
    }));

    const mappedEdges = proposal.edges.map((e, idx) => ({
      id: e.id || `e_${e.source}_${e.target}_${idx}`,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || null,
      animated: true,
    }));

    setNodes(mappedNodes);
    setEdges(mappedEdges);
    setValidationState({ isValid: true, errors: [] });
    setStatusMessage({ type: 'success', text: `AI proposal applied: "${proposal.name}"` });
    setTimeout(() => setStatusMessage(null), 4000);
  }

  // Save workflow definition to API
  async function handleSave() {
    setSaving(true);
    setStatusMessage(null);

    const definition = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.type,
        label: n.data.label,
        config: n.data.config,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
      })),
    };

    // Pre-validate before save
    const val = validateWorkflowGraph(definition);
    if (!val.isValid) {
      setValidationState(val);
      setSaving(false);
      return;
    }

    try {
      const res = await api.updateWorkflow(workflow.id, {
        definition,
      });

      setStatusMessage({ type: 'success', text: `Saved version v${res.data.workflow.version} successfully!` });
      if (onSaveSuccess) onSaveSuccess(res.data.workflow);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save workflow.' });
    } finally {
      setSaving(false);
    }
  }

  // Poll active run execution state for live visualization
  useEffect(() => {
    if (!activeRunId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getRun(activeRunId);
        const run = res.data.run;

        // Update step states on nodes
        if (run.stepRuns) {
          setNodes((nds) =>
            nds.map((node) => {
              const step = run.stepRuns.find((s) => s.nodeId === node.id);
              if (step) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    status: step.status.toLowerCase(),
                    error: step.errorSummary,
                  },
                };
              }
              return node;
            })
          );
        }

        if (['SUCCEEDED', 'FAILED', 'CANCELLED', 'WAITING_FOR_APPROVAL'].includes(run.status)) {
          clearInterval(interval);
          setStatusMessage({
            type: run.status === 'SUCCEEDED' ? 'success' : 'error',
            text: `Run finished with status: ${run.status}`,
          });
          setTimeout(() => setStatusMessage(null), 5000);
        }
      } catch {
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [activeRunId, setNodes]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      {/* Top Toolbar */}
      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
        <Link
          href="/workflows"
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 shadow hover:bg-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <button
          onClick={() => setPaletteOpen(!paletteOpen)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow hover:border-indigo-500"
        >
          <Plus className="h-3.5 w-3.5 text-indigo-400" />
          Add Node
        </button>

        <button
          onClick={() => setAiModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-indigo-300 shadow hover:bg-indigo-900/60"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Generate with AI
        </button>

        <button
          onClick={handleValidateGraph}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 shadow hover:bg-slate-800"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Validate
        </button>

        <button
          onClick={() => setTestRunModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/50 px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow hover:bg-emerald-900/50"
        >
          <Play className="h-3.5 w-3.5 text-emerald-400" />
          Test Run
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </button>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-xl border px-4 py-2 text-xs font-medium shadow-xl backdrop-blur-md ${
            statusMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-300'
              : 'border-rose-500/30 bg-rose-950/90 text-rose-300'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Validation Errors Overlay */}
      {!validationState.isValid && (
        <div className="absolute bottom-4 left-4 z-10 max-w-md rounded-xl border border-rose-500/30 bg-rose-950/90 p-3 text-xs shadow-2xl backdrop-blur">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            Validation Issues Detected:
          </div>
          <ul className="list-disc space-y-0.5 pl-4 text-rose-200">
            {validationState.errors.map((err, idx) => (
              <li key={idx}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#1e293b" gap={20} size={1.5} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.status === 'running') return '#818cf8';
            if (node.data?.status === 'succeeded') return '#10b981';
            if (node.data?.status === 'failed') return '#f43f5e';
            return '#475569';
          }}
          className="!border-slate-800 !bg-slate-900"
        />
      </ReactFlow>

      {/* Node Palette Drawer */}
      <NodePalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAddNode={handleAddNode}
      />

      {/* Node Config Drawer */}
      <NodeConfigDrawer
        selectedNode={selectedNode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onClose={() => setSelectedNodeId(null)}
      />

      {/* AI Generator Modal */}
      <AiGeneratorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApplyProposal={handleApplyAiProposal}
      />

      {/* Test Run Modal */}
      <TestRunModal
        isOpen={testRunModalOpen}
        onClose={() => setTestRunModalOpen(false)}
        workflowId={workflow?.id}
        onRunStarted={(runId) => {
          setActiveRunId(runId);
          // Set nodes to running initially
          setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'running' } })));
        }}
      />
    </div>
  );
}
