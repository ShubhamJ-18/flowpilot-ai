# FlowPilot AI — Workflow Engine & Node Registry

## 1. Node Registry

Each node in FlowPilot AI is registered with a strict configuration schema, execution handler, input requirements, and timeout policy.

| Node Type | Category | Description |
|---|---|---|
| `MANUAL_TRIGGER` | Trigger | Entry point accepting user-supplied JSON or form inputs |
| `TEXT_INPUT` | Input | Static text definition or extracted parameter from workflow input |
| `TEXT_TEMPLATE` | Transform | Safe template interpolation (`{{variable}}` syntax, no JavaScript execution) |
| `CONDITION` | Logic | Declarative conditional evaluation (`equals`, `not_equals`, `contains`, `gt`, `lt`, `in`) with `true`/`false` branching |
| `AI_SUMMARIZE` | AI | Summarizes provided text via FastAPI AI service with custom length/tone parameters |
| `AI_CLASSIFY` | AI | Classifies input into predefined categories with structured JSON response |
| `AI_EXTRACT` | AI | Extracts structured JSON attributes according to a predefined JSON schema |
| `JSON_TRANSFORM` | Transform | Deterministic object mapping, picking, and key renaming without `eval` |
| `DELAY` | Utility | Pauses execution for a bounded duration (max 300s) |
| `APPROVAL_GATE` | Human-in-the-Loop | Pauses run in `WAITING_FOR_APPROVAL` state until authorized user approval |
| `REPORT_OUTPUT` | Output | Collects upstream outputs into an aggregated final report |
| `WEBHOOK_ACTION` | Integration | Dispatches an HTTP request with SSRF protection and destination allowlisting |

## 2. Graph Validation Engine

Validation occurs prior to saving or execution:
1. **Cycle Detection**: Directed graph cycles are detected using depth-first search (DFS) with node state coloring (`UNVISITED`, `VISITING`, `VISITED`).
2. **Trigger Verification**: Graph must contain exactly one valid trigger node without incoming edges.
3. **Connectivity & Reachability**: All executable nodes must be reachable from the trigger.
4. **Node Configuration**: Node configs are validated against Zod schemas matching their respective registry specifications.
5. **Edge Integrity**: Edges must point to existing node IDs and use valid source/target handles.

## 3. Execution Semantics

- **Topological Traversal**: Node dependencies are computed dynamically. A node becomes eligible for execution once all active ancestor nodes have succeeded.
- **Conditional Branching**: When a `CONDITION` node executes, it emits a boolean result. Outgoing edges matching the selected branch (`true` or `false`) are marked active; non-matching branches are skipped.
- **Data Flow**: Outputs from upstream nodes are indexed by node ID (`nodeOutputs[nodeId]`) and forwarded to downstream nodes via templating or explicit property references.
