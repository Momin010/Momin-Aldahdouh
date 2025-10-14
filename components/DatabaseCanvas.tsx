import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon';

interface TableNode {
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
}

interface Relationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

interface DatabaseCanvasProps {
  tables: TableNode[];
  relationships?: Relationship[];
  onTableSelect?: (table: TableNode) => void;
  onTableMove?: (tableId: string, x: number, y: number) => void;
  onTableEdit?: (table: TableNode) => void;
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showRelationships, setShowRelationships] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize table positions
  useEffect(() => {
    if (tables.length === 0) {
      // Create initial table positions
      const initialTables = tables.map((table, index) => {
        const cols = Math.ceil(Math.sqrt(tables.length));
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = col * 300 + 100;
        const y = row * 200 + 100;

        return {
          ...table,
          x,
          y,
          width: 250,
          height: 150 + (table.columns.length * 25)
        };
      });
    }
  }, [tables]);

  // Handle mouse down on table
  const handleMouseDown = useCallback((e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    setIsDragging(true);
    setDraggedTable(tableId);
    setDragOffset({
      x: e.clientX - table.x,
      y: e.clientY - table.y
    });
  }, [tables]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && draggedTable) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Update table position
      const updatedTables = tables.map(table =>
        table.id === draggedTable
          ? { ...table, x: newX, y: newY }
          : table
      );

      // Call onTableMove if provided
      if (onTableMove) {
        onTableMove(draggedTable, newX, newY);
      }
    }

    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPan({ x: deltaX, y: deltaY });
    }
  }, [isDragging, draggedTable, dragOffset, isPanning, panStart, tables, onTableMove]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedTable(null);
    setIsPanning(false);
  }, []);

  // Handle canvas pan
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning if clicking on empty canvas space, not on tables
    if (e.target === e.currentTarget) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);


  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging || isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isPanning, handleMouseMove, handleMouseUp]);

  // Render relationship lines
  const renderRelationshipLines = () => {
    if (!showRelationships) return null;

    return relationships.map(rel => {
      const fromTable = tables.find(t => t.id === rel.fromTable);
      const toTable = tables.find(t => t.id === rel.toTable);

      if (!fromTable || !toTable) return null;

      const fromX = fromTable.x + fromTable.width / 2;
      const fromY = fromTable.y + fromTable.height / 2;
      const toX = toTable.x + toTable.width / 2;
      const toY = toTable.y + toTable.height / 2;

      // Calculate control points for curved line
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
      const curvature = Math.min(distance * 0.3, 100);

      const pathData = `M ${fromX} ${fromY} Q ${midX + curvature} ${midY} ${toX} ${toY}`;

      return (
        <g key={rel.id}>
          <path
            d={pathData}
            stroke="#60a5fa"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
          <text
            x={midX}
            y={midY - 10}
            textAnchor="middle"
            className="text-xs fill-gray-400"
          >
            {rel.type.replace('-', ' ')}
          </text>
        </g>
      );
    });
  };

  // Render grid dots
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridSize = 50;
    const dots = [];

    for (let x = 0; x < 2000; x += gridSize) {
      for (let y = 0; y < 1500; y += gridSize) {
        dots.push(
          <circle
            key={`dot-${x}-${y}`}
            cx={x}
            cy={y}
            r="1"
            fill="#000000"
          />
        );
      }
    }

    return dots;
  };

  return (
    <div className="relative h-full bg-white overflow-hidden">
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button
          onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
          className="p-2 bg-gray-100 text-gray-800 rounded-lg shadow-lg hover:bg-gray-200 transition-colors border border-gray-300"
          title="Zoom In"
        >
          <Icon name="zoom-in" className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(0.1, prev - 0.2))}
          className="p-2 bg-gray-100 text-gray-800 rounded-lg shadow-lg hover:bg-gray-200 transition-colors border border-gray-300"
          title="Zoom Out"
        >
          <Icon name="zoom-out" className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-2 bg-gray-100 text-gray-800 rounded-lg shadow-lg hover:bg-gray-200 transition-colors border border-gray-300"
          title="Reset View"
        >
          <Icon name="refresh" className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg shadow-lg transition-colors border ${
            showGrid ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300'
          }`}
          title="Toggle Grid"
        >
          <Icon name="grid" className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowRelationships(!showRelationships)}
          className={`p-2 rounded-lg shadow-lg transition-colors border ${
            showRelationships ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300'
          }`}
          title="Toggle Relationships"
        >
          <Icon name="link" className="w-4 h-4" />
        </button>
        {onToggleFullscreen && (
          <button
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              onToggleFullscreen();
            }}
            className="p-2 bg-gray-100 text-gray-800 rounded-lg shadow-lg hover:bg-gray-200 transition-colors border border-gray-300"
            title="Toggle Fullscreen"
          >
            <Icon name={isFullscreen ? "fullscreen-exit" : "fullscreen"} className="w-4 h-4" />
          </button>
        )}
        {onAddTable && (
          <button
            onClick={onAddTable}
            className="p-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors border border-green-500"
            title="Add Table"
          >
            <Icon name="plus" className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 right-4 z-20 bg-gray-100/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg border border-gray-300">
        <span className="text-sm text-gray-800">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="h-full w-full relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onWheel={(e) => {
          e.preventDefault();
          const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
          setZoom(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)));
        }}
      >
        <div
          className="relative"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            width: 2000,
            height: 1500
          }}
        >
          {/* Grid */}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {renderGrid()}
          </svg>

          {/* Relationship Lines */}
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            style={{ zIndex: 1 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#60a5fa"
                />
              </marker>
            </defs>
            {renderRelationshipLines()}
          </svg>

          {/* Tables */}
          {tables.map(table => (
            <div
              key={table.id}
              className={`absolute bg-black border-2 rounded-lg shadow-lg cursor-move transition-all duration-300 ${
                selectedTable === table.id
                  ? 'border-blue-500 shadow-blue-200 scale-105'
                  : 'border-gray-400 hover:border-gray-600 hover:shadow-xl hover:scale-102'
              }`}
              style={{
                left: table.x,
                top: table.y,
                width: table.width,
                minHeight: table.height,
                zIndex: draggedTable === table.id ? 10 : 2
              }}
              onMouseDown={(e) => handleMouseDown(e, table.id)}
              onClick={() => onTableSelect && onTableSelect(table)}
            >
              {/* Table Header */}
              <div className="bg-gray-100 px-3 py-2 rounded-t-lg border-b border-gray-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="database" className="w-4 h-4 text-gray-800" />
                  <span className="font-semibold text-black text-sm">{table.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                    {table.rowCount} rows
                  </span>
                  {onTableEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Create editable table name
                        const newName = prompt('Enter new table name:', table.name);
                        if (newName && newName !== table.name) {
                          const updatedTable = { ...table, name: newName };
                          onTableEdit(updatedTable);
                        }
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Edit table"
                    >
                      <Icon name="edit" className="w-3 h-3 text-gray-800" />
                    </button>
                  )}
                  {onTableDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete the "${table.name}" table?`)) {
                          onTableDelete(table.id);
                        }
                      }}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Delete table"
                    >
                      <Icon name="trash" className="w-3 h-3 text-red-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table Columns */}
              <div className="p-2">
                {table.columns.slice(0, 8).map(column => (
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
                      <span className="font-medium text-gray-800">{column.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">{column.type}</span>
                      {column.primaryKey && <Icon name="key" className="w-3 h-3 text-yellow-600" />}
                      {!column.nullable && <span className="text-red-600">*</span>}
                    </div>
                  </div>
                ))}

                {table.columns.length > 8 && (
                  <div className="text-xs text-gray-600 text-center py-1">
                    +{table.columns.length - 8} more columns
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-600">
                <Icon name="database" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Database Tables</h3>
                <p className="text-sm">Create your first table to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseCanvas;