import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icon';
import type { DatabaseTable, DatabaseField } from '../services/databaseService';

interface TableNode {
  id: string;
  table: DatabaseTable;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RelationshipLine {
  id: string;
  fromTable: string;
  toTable: string;
  fromField: string;
  toField: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

interface DatabaseCanvasProps {
  tables: DatabaseTable[];
  relationships?: RelationshipLine[];
  onTableSelect?: (table: DatabaseTable) => void;
  onTableMove?: (tableId: string, x: number, y: number) => void;
  selectedTable?: string;
  className?: string;
}

const DatabaseCanvas: React.FC<DatabaseCanvasProps> = ({
  tables,
  relationships = [],
  onTableSelect,
  onTableMove,
  selectedTable,
  className = ''
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tableNodes, setTableNodes] = useState<TableNode[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 1500 });

  // Initialize table positions
  useEffect(() => {
    const nodes: TableNode[] = tables.map((table, index) => {
      // Calculate table dimensions based on fields
      const headerHeight = 40;
      const fieldHeight = 30;
      const padding = 20;
      const width = Math.max(250, table.name.length * 10 + 100);
      const height = headerHeight + (table.fields.length * fieldHeight) + padding;

      // Position tables in a grid layout
      const cols = Math.ceil(Math.sqrt(tables.length));
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * (width + 50) + 50;
      const y = row * (height + 50) + 50;

      return {
        id: table.id,
        table,
        x,
        y,
        width,
        height
      };
    });

    setTableNodes(nodes);
  }, [tables]);

  // Handle mouse down on table
  const handleMouseDown = useCallback((e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const node = tableNodes.find(n => n.id === tableId);
    if (!node) return;

    setIsDragging(true);
    setDraggedTable(tableId);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y
    });
  }, [tableNodes]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedTable) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setTableNodes(prev => prev.map(node =>
      node.id === draggedTable
        ? { ...node, x: newX, y: newY }
        : node
    ));
  }, [isDragging, draggedTable, dragOffset]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (draggedTable) {
      const node = tableNodes.find(n => n.id === draggedTable);
      if (node && onTableMove) {
        onTableMove(draggedTable, node.x, node.y);
      }
    }

    setIsDragging(false);
    setDraggedTable(null);
    setDragOffset({ x: 0, y: 0 });
  }, [draggedTable, tableNodes, onTableMove]);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Render relationship lines
  const renderRelationshipLines = () => {
    return relationships.map(rel => {
      const fromNode = tableNodes.find(n => n.id === rel.fromTable);
      const toNode = tableNodes.find(n => n.id === rel.toTable);

      if (!fromNode || !toNode) return null;

      const fromX = fromNode.x + fromNode.width / 2;
      const fromY = fromNode.y + fromNode.height / 2;
      const toX = toNode.x + toNode.width / 2;
      const toY = toNode.y + toNode.height / 2;

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
            stroke="#6366f1"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
          <text
            x={midX}
            y={midY - 10}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {rel.type.replace('-', ' ')}
          </text>
        </g>
      );
    });
  };

  return (
    <div className={`relative overflow-auto bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      <svg
        className="absolute inset-0 pointer-events-none"
        width={canvasSize.width}
        height={canvasSize.height}
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
              fill="#6366f1"
            />
          </marker>
        </defs>
        {renderRelationshipLines()}
      </svg>

      <div
        ref={canvasRef}
        className="relative"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          minWidth: '100%',
          minHeight: '100%'
        }}
      >
        {tableNodes.map(node => (
          <div
            key={node.id}
            className={`absolute bg-white border-2 rounded-lg shadow-lg cursor-move transition-all duration-200 ${
              selectedTable === node.id
                ? 'border-blue-500 shadow-blue-200'
                : 'border-gray-300 hover:border-gray-400 hover:shadow-xl'
            }`}
            style={{
              left: node.x,
              top: node.y,
              width: node.width,
              minHeight: node.height,
              zIndex: draggedTable === node.id ? 10 : 2
            }}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onClick={() => onTableSelect && onTableSelect(node.table)}
          >
            {/* Table Header */}
            <div className="bg-gray-100 px-3 py-2 rounded-t-lg border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="database" className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-gray-800 text-sm">{node.table.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  {node.table.records.length} records
                </span>
              </div>
            </div>

            {/* Table Fields */}
            <div className="p-2">
              {node.table.fields.slice(0, 8).map(field => (
                <div
                  key={field.id}
                  className="flex items-center justify-between py-1 px-2 rounded text-xs hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      field.type === 'string' ? 'bg-blue-400' :
                      field.type === 'number' ? 'bg-green-400' :
                      field.type === 'boolean' ? 'bg-yellow-400' :
                      field.type === 'date' ? 'bg-purple-400' :
                      'bg-gray-400'
                    }`} />
                    <span className="font-medium text-gray-700">{field.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">{field.type}</span>
                    {field.required && <span className="text-red-500">*</span>}
                    {field.unique && <Icon name="key" className="w-3 h-3 text-yellow-500" />}
                  </div>
                </div>
              ))}

              {node.table.fields.length > 8 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{node.table.fields.length - 8} more fields
                </div>
              )}
            </div>

            {/* Table Description */}
            {node.table.description && (
              <div className="px-3 pb-2">
                <p className="text-xs text-gray-600 line-clamp-2">{node.table.description}</p>
              </div>
            )}
          </div>
        ))}

        {/* Canvas Instructions */}
        {tableNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Icon name="database" className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Database Tables</h3>
              <p className="text-sm">Connect to MominAI Cloud to see your database schema</p>
            </div>
          </div>
        )}

        {tableNodes.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Icon name="info" className="w-4 h-4" />
              <span>Drag tables to reposition • Click to select</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseCanvas;