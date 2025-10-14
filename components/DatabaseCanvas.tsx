import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { supabaseService, DatabaseTable, DatabaseSchema } from '../services/supabaseService';
import { getSupabaseClient, isSupabaseConnected } from '../lib/supabase';

interface DatabaseCanvasProps {
  isVisible: boolean;
  onClose: () => void;
}

interface TableNode {
  id: string;
  table: DatabaseTable;
  x: number;
  y: number;
  width: number;
  height: number;
}

const DatabaseCanvas: React.FC<DatabaseCanvasProps> = ({ isVisible, onClose }) => {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'schema' | 'data'>('schema');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load database schema
  useEffect(() => {
    if (isVisible && isSupabaseConnected()) {
      loadSchema();
    }
  }, [isVisible]);

  const loadSchema = async () => {
    setLoading(true);
    try {
      const currentSchema = await supabaseService.getCurrentSchema();
      setSchema(currentSchema);
    } catch (error) {
      console.error('Failed to load schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = async (table: DatabaseTable) => {
    setSelectedTable(table);
    setViewMode('data');

    try {
      const data = await supabaseService.queryTable(table.name, 50);
      setTableData(data);
    } catch (error) {
      console.error('Failed to load table data:', error);
      setTableData([]);
    }
  };

  const handleAddSampleData = async () => {
    if (!selectedTable) return;

    const sampleData = generateSampleData(selectedTable);
    if (sampleData.length === 0) return;

    try {
      await supabaseService.insertSampleData(selectedTable.name, sampleData);
      // Reload data
      const data = await supabaseService.queryTable(selectedTable.name, 50);
      setTableData(data);
    } catch (error) {
      console.error('Failed to add sample data:', error);
    }
  };

  const generateSampleData = (table: DatabaseTable): any[] => {
    const sampleData: any[] = [];

    // Generate sample data based on table structure
    for (let i = 1; i <= 5; i++) {
      const row: any = {};

      table.columns.forEach(col => {
        if (col.primaryKey && col.type.includes('uuid')) {
          row[col.name] = `sample-uuid-${i}`;
        } else if (col.name.toLowerCase().includes('email')) {
          row[col.name] = `user${i}@example.com`;
        } else if (col.name.toLowerCase().includes('name')) {
          row[col.name] = `Sample ${col.name} ${i}`;
        } else if (col.type.includes('varchar') || col.type.includes('text')) {
          row[col.name] = `Sample ${col.name} ${i}`;
        } else if (col.type.includes('int') || col.type.includes('numeric')) {
          row[col.name] = i;
        } else if (col.type.includes('boolean')) {
          row[col.name] = i % 2 === 0;
        } else if (col.type.includes('timestamp')) {
          row[col.name] = new Date().toISOString();
        }
      });

      sampleData.push(row);
    }

    return sampleData;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="h-full flex flex-col bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Icon name="database" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Database Canvas</h2>
              <p className="text-sm text-gray-400">Visual database management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('schema')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewMode === 'schema'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Schema
            </button>
            <button
              onClick={() => setViewMode('data')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewMode === 'data'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Data
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading database schema...</p>
              </div>
            </div>
          ) : !isSupabaseConnected() ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Icon name="database" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Not Connected</h3>
                <p className="text-gray-400 mb-4">Please connect to your Supabase database first.</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : viewMode === 'schema' ? (
            <div className="h-full overflow-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schema?.tables.map((table) => (
                  <div
                    key={table.name}
                    onClick={() => handleTableClick(table)}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{table.name}</h3>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                        {table.rowCount || 0} rows
                      </span>
                    </div>

                    <div className="space-y-2">
                      {table.columns.slice(0, 5).map((col) => (
                        <div key={col.name} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300 font-mono">{col.name}</span>
                          <span className="text-gray-500 text-xs">{col.type}</span>
                        </div>
                      ))}
                      {table.columns.length > 5 && (
                        <div className="text-xs text-gray-500">
                          +{table.columns.length - 5} more columns
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {(!schema?.tables || schema.tables.length === 0) && (
                <div className="text-center py-12">
                  <Icon name="database" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Tables Found</h3>
                  <p className="text-gray-400">Your database doesn't have any tables yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Table Header */}
              {selectedTable && (
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{selectedTable.name}</h3>
                      <p className="text-gray-400">{tableData.length} rows</p>
                    </div>
                    <button
                      onClick={handleAddSampleData}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Icon name="plus" className="w-4 h-4" />
                      Add Sample Data
                    </button>
                  </div>
                </div>
              )}

              {/* Table Data */}
              <div className="flex-1 overflow-auto">
                {selectedTable && tableData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800">
                        <tr>
                          {selectedTable.columns.map((col) => (
                            <th key={col.name} className="px-4 py-3 text-left text-gray-300 font-medium border-b border-gray-700">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, index) => (
                          <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/50">
                            {selectedTable.columns.map((col) => (
                              <td key={col.name} className="px-4 py-3 text-gray-300">
                                {typeof row[col.name] === 'boolean'
                                  ? row[col.name] ? '✓' : '✗'
                                  : String(row[col.name] || '')
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : selectedTable ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="table" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Data</h3>
                      <p className="text-gray-400 mb-4">This table doesn't have any data yet.</p>
                      <button
                        onClick={handleAddSampleData}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Add Sample Data
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="table" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Select a Table</h3>
                      <p className="text-gray-400">Click on a table in the schema view to see its data.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseCanvas;