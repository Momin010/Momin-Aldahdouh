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
  const isEditing = data.editingTableId === data.table.id;
  const [editingColumn, setEditingColumn] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<{[key: string]: {name: string, type: string}}>({});

  const handleColumnEdit = (columnName: string, field: 'name' | 'type', value: string) => {
    setEditValues(prev => ({
      ...prev,
      [columnName]: {
        ...prev[columnName],
        [field]: value
      }
    }));
    // Immediately save the edit to the table
    const currentEdits = editValues[columnName] || {};
    const updatedEdits = { ...currentEdits, [field]: value };
    if (updatedEdits.name !== undefined || updatedEdits.type !== undefined) {
      const updatedColumns = data.table.columns.map((col: any) =>
        col.name === columnName
          ? { ...col, name: updatedEdits.name || col.name, type: updatedEdits.type || col.type }
          : col
      );
      data.onEdit({ ...data.table, columns: updatedColumns });
      console.log('Column edited immediately:', columnName, updatedEdits);
    }
  };

  const saveColumnEdit = (columnName: string) => {
    const edits = editValues[columnName];
    if (edits && (edits.name !== data.table.columns.find((c: any) => c.name === columnName)?.name ||
                  edits.type !== data.table.columns.find((c: any) => c.name === columnName)?.type)) {
      const updatedColumns = data.table.columns.map((col: any) =>
        col.name === columnName
          ? { ...col, name: edits.name || col.name, type: edits.type || col.type }
          : col
      );
      data.onEdit({ ...data.table, columns: updatedColumns });
      console.log('Column edited:', columnName, edits);
    }
    setEditingColumn(null);
    setEditValues(prev => {
      const newState = {...prev};
      delete newState[columnName];
      return newState;
    });
  };

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
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing) {
                data.onStopEditing?.();
              } else {
                data.onStartEditing?.(data.table.id);
              }
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Edit table structure"
          >
            <svg className="w-3 h-3 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {data.onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the "${data.table.name}" table? This cannot be undone!`)) {
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
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing) {
                setEditingColumn(column.name);
              }
            }}
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
              {editingColumn === column.name ? (
                <input
                  type="text"
                  value={editValues[column.name]?.name || column.name}
                  onChange={(e) => handleColumnEdit(column.name, 'name', e.target.value)}
                  onBlur={() => saveColumnEdit(column.name)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveColumnEdit(column.name);
                    }
                  }}
                  className="font-medium text-gray-900 bg-white border border-gray-300 rounded px-1"
                  autoFocus
                />
              ) : (
                <span className="font-medium text-gray-900">{column.name}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {editingColumn === column.name ? (
                <select
                  value={editValues[column.name]?.type || column.type}
                  onChange={(e) => handleColumnEdit(column.name, 'type', e.target.value)}
                  onBlur={() => saveColumnEdit(column.name)}
                  className="text-gray-700 bg-white border border-gray-300 rounded px-1 text-xs"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="date">date</option>
                  <option value="uuid">uuid</option>
                  <option value="text">text</option>
                  <option value="varchar(255)">varchar(255)</option>
                  <option value="timestamp">timestamp</option>
                </select>
              ) : (
                <span className="text-gray-700">{column.type}</span>
              )}
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

        {isEditing && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => {
                // Save any pending edits before stopping editing
                if (editingColumn) {
                  saveColumnEdit(editingColumn);
                }
                data.onStopEditing?.();
              }}
              className="w-full py-1 px-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Done Editing
            </button>
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
  editingTableId?: string | null;
  onStartEditing?: (tableId: string) => void;
  onStopEditing?: () => void;
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
  onToggleFullscreen,
  editingTableId,
  onStartEditing,
  onStopEditing
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
        editingTableId,
        onStartEditing,
        onStopEditing,
      },
      selected: selectedTable === table.id,
      style: { zIndex: 1 },
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
      style: {
        stroke: '#ffffff',
        strokeWidth: 4,
        zIndex: 9999,
      },
      markerEnd: {
        type: 'arrowclosed',
        color: '#ffffff',
        width: 25,
        height: 25,
        strokeWidth: 3,
      },
      labelStyle: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 600,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '4px 8px',
        borderRadius: '4px',
      },
      zIndex: 9999,
    })), [relationships]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when initialNodes changes (e.g., when tables are edited or added)
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when initialEdges changes
  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

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
    <div className="database-canvas-container h-full w-full bg-black" style={{ backgroundColor: 'black' }}>
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
        proOptions={{ hideAttribution: true }}
        edgesUpdatable={true}
        edgesFocusable={true}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        {/* Background with white dots on black background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={50}
          size={3}
          color="#ffffff"
        />

        {/* Debug: Show edges and coordinates */}
        <div className="absolute top-0 left-0 z-50 bg-red-500 text-white p-2 text-xs max-w-md">
          <div>Edges: {edges.length} | Nodes: {nodes.length}</div>
          <div className="mt-1">Tables: {tables.length}</div>
          {tables.map((table, index) => (
            <div key={table.id} className="text-xs">
              {table.name}: ({Math.round(table.x)}, {Math.round(table.y)})
              {table.x < 0 || table.y < 0 ? ' ⚠️ INVALID COORDS' : ''}
            </div>
          ))}
          {tables.some(t => t.x < 0 || t.y < 0) && (
            <div className="text-yellow-300 font-bold mt-1">
              ⚠️ COORDINATE ERROR: Some tables have invalid positions!
            </div>
          )}
        </div>

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
            <button
              onClick={() => {
                const element = document.querySelector('.database-canvas-container');
                if (element) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    element.requestFullscreen();
                  }
                }
              }}
              className="p-2 bg-gray-700 text-gray-200 rounded-lg shadow-lg hover:bg-gray-600 transition-colors border border-gray-500"
              title="Toggle Fullscreen Database Canvas"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default DatabaseCanvas;