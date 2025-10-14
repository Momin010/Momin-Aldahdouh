import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  BackgroundVariant,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Database Table Node Component
const DatabaseTableNode = ({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-white border-2 rounded-lg shadow-lg transition-all duration-300 min-w-[250px] ${
      selected ? 'border-blue-500 scale-105' : 'border-gray-300 hover:border-gray-500'
    }`}>
      {/* Table Header */}
      <div className="bg-gray-100 px-3 py-2 rounded-t-lg border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <span className="font-semibold text-black text-sm">{data.table.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
            {data.table.rowCount} rows
          </span>
          {data.onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newName = prompt('Enter new table name:', data.table.name);
                if (newName && newName !== data.table.name) {
                  data.onEdit({ ...data.table, name: newName });
                }
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Edit table"
            >
              <svg className="w-3 h-3 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {data.onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the "${data.table.name}" table?`)) {
                  data.onDelete(data.table.id);
                }
              }}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Delete table"
            >
              <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table Columns */}
      <div className="p-2">
        {data.table.columns.slice(0, 8).map((column: any) => (
          <div
            key={column.name}
            className="flex items-center justify-between py-1 px-2 rounded text-xs hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                column.primaryKey ? 'bg-yellow-500' :
                column.type === 'string' ? 'bg-blue-500' :
                column.type === 'number' ? 'bg-green-500' :
                column.type === 'boolean' ? 'bg-yellow-500' :
                column.type === 'date' ? 'bg-purple-500' :
                'bg-gray-500'
              }`} />
              <span className="font-medium text-gray-900">{column.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-700">{column.type}</span>
              {column.primaryKey && (
                <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              )}
              {!column.nullable && <span className="text-red-600">*</span>}
            </div>
          </div>
        ))}

        {data.table.columns.length > 8 && (
          <div className="text-xs text-gray-700 text-center py-1">
            +{data.table.columns.length - 8} more columns
          </div>
        )}
      </div>
    </div>
  );
};

// Node types for React Flow
const nodeTypes = {
  databaseTable: DatabaseTableNode,
};

interface DatabaseCanvasProps {
  tables: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    columns: Array<{
      name: string;
      type: string;
      primaryKey?: boolean;
      nullable?: boolean;
    }>;
    rowCount: number;
  }>;
  relationships?: Array<{
    id: string;
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  }>;
  onTableSelect?: (table: any) => void;
  onTableMove?: (tableId: string, x: number, y: number) => void;
  onTableEdit?: (table: any) => void;
  onTableDelete?: (tableId: string) => void;
  onAddTable?: () => void;
  selectedTable?: string;
  onToggleFullscreen?: () => void;
}

const DatabaseCanvas: React.FC<DatabaseCanvasProps> = ({
  tables,
  relationships = [],
  onTableSelect,
  onTableMove,
  onTableEdit,
  onTableDelete,
  onAddTable,
  selectedTable,
  onToggleFullscreen
}) => {
  // Convert tables to React Flow nodes
  const initialNodes: Node[] = useMemo(() =>
    tables.map((table) => ({
      id: table.id,
      type: 'databaseTable',
      position: { x: table.x, y: table.y },
      data: {
        table,
        onEdit: onTableEdit,
        onDelete: onTableDelete,
      },
      selected: selectedTable === table.id,
    })), [tables, selectedTable, onTableEdit, onTableDelete]
  );

  // Convert relationships to React Flow edges
  const initialEdges: Edge[] = useMemo(() =>
    relationships.map((rel) => ({
      id: rel.id,
      source: rel.fromTable,
      target: rel.toTable,
      type: 'smoothstep',
      animated: true,
      label: rel.type.replace('-', ' '),
      style: { stroke: '#ffffff', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#ffffff' },
      labelStyle: { color: '#ffffff', fontSize: 12 },
    })), [relationships]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node position changes
  const onNodeDragStop = useCallback((event: any, node: Node) => {
    if (onTableMove) {
      onTableMove(node.id, node.position.x, node.position.y);
    }
  }, [onTableMove]);

  // Handle node selection
  const onNodeClick = useCallback((event: any, node: Node) => {
    if (onTableSelect) {
      onTableSelect(node.data.table);
    }
  }, [onTableSelect]);

  return (
    <div className="h-full w-full bg-black" style={{ backgroundColor: 'black' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        style={{ backgroundColor: 'black' }}
      >
        {/* Background with white dots on black background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={50}
          size={3}
          color="#ffffff"
        />

        {/* Built-in controls */}
        <Controls className="bg-gray-800 border-gray-600 shadow-lg" />

        {/* Smaller Mini map */}
        <MiniMap
          nodeColor={(node) => selectedTable === node.id ? '#3b82f6' : '#ffffff'}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="bg-gray-900 border border-gray-600"
          style={{ height: 120, width: 200 }}
          position="bottom-right"
        />

        {/* Custom control panel */}
        <Panel position="top-left">
          <div className="flex gap-2 p-2 bg-gray-800 rounded-lg border border-gray-600">
            {onAddTable && (
              <button
                onClick={onAddTable}
                className="p-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors border border-green-500"
                title="Add Table"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-2 bg-gray-700 text-gray-200 rounded-lg shadow-lg hover:bg-gray-600 transition-colors border border-gray-500"
                title="Toggle Fullscreen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default DatabaseCanvas;