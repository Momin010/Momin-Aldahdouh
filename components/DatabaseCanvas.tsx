import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { supabaseService, DatabaseTable, DatabaseSchema } from '../services/supabaseService';
import { getSupabaseClient, isSupabaseConnected } from '../lib/supabase';
import type { AppState } from '../types';

interface DatabaseCanvasProps {
  isVisible: boolean;
  onClose: () => void;
  appState: AppState;
  onUpdateAppState: (updater: (prevState: AppState) => AppState) => void;
}

interface TableNode {
  id: string;
  table: DatabaseTable;
  x: number;
  y: number;
  width: number;
  height: number;
}

const DatabaseCanvas: React.FC<DatabaseCanvasProps> = ({ isVisible, onClose, appState, onUpdateAppState }) => {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'schema' | 'data'>('schema');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load database schema from project state or Supabase
  useEffect(() => {
    if (isVisible) {
      if (appState.databaseSchema) {
        setSchema(appState.databaseSchema);
      } else if (isSupabaseConnected()) {
        loadSchema();
      }
    }
  }, [isVisible, appState.databaseSchema]);

  const loadSchema = async () => {
    setLoading(true);
    try {
      const currentSchema = await supabaseService.getCurrentSchema();
      setSchema(currentSchema);
      // Save to project state
      onUpdateAppState(prevState => ({
        ...prevState,
        databaseSchema: currentSchema
      }));
    } catch (error) {
      console.error('Failed to load schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = async (table: DatabaseTable) => {
    setSelectedTable(table);
    setViewMode('data');

    // Load from project state first, then fallback to Supabase
    const projectData = appState.databaseData?.[table.name];
    if (projectData) {
      setTableData(projectData);
    } else if (isSupabaseConnected()) {
      try {
        const data = await supabaseService.queryTable(table.name, 50);
        setTableData(data);
        // Save to project state
        onUpdateAppState(prevState => ({
          ...prevState,
          databaseData: {
            ...prevState.databaseData,
            [table.name]: data
          }
        }));
      } catch (error) {
        console.error('Failed to load table data:', error);
        setTableData([]);
      }
    } else {
      setTableData([]);
    }
  };

  const handleAddSampleData = async () => {
    if (!selectedTable) return;

    const sampleData = generateSampleData(selectedTable);
    if (sampleData.length === 0) return;

    // Add to project state
    const currentData = appState.databaseData?.[selectedTable.name] || [];
    const newData = [...currentData, ...sampleData];

    setTableData(newData);
    onUpdateAppState(prevState => ({
      ...prevState,
      databaseData: {
        ...prevState.databaseData,
        [selectedTable.name]: newData
      }
    }));

    // Also try to insert into Supabase if connected
    if (isSupabaseConnected()) {
      try {
        await supabaseService.insertSampleData(selectedTable.name, sampleData);
      } catch (error) {
        console.error('Failed to add sample data to Supabase:', error);
      }
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
      <div
        className="h-full flex flex-col bg-gray-900 relative"
        style={{
          backgroundImage: `url('https://i.pinimg.com/1200x/39/63/1b/39631bc198243a44d3032af50503897f.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Blur overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Icon name="database" className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Database Canvas</h2>
                <p className="text-sm text-white/70">Visual database management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('schema')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === 'schema'
                    ? 'bg-blue-600 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Schema
              </button>
              <button
                onClick={() => setViewMode('data')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === 'data'
                    ? 'bg-blue-600 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Data
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
                <p className="text-white/70">Loading database schema...</p>
              </div>
            </div>
          ) : !isSupabaseConnected() && !appState.databaseSchema ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Icon name="database" className="w-16 h-16 text-white/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Not Connected</h3>
                <p className="text-white/70 mb-4">Please connect to your Supabase database first.</p>
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
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-white/20 transition-all duration-300 shadow-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{table.name}</h3>
                      <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
                        {appState.databaseData?.[table.name]?.length || table.rowCount || 0} rows
                      </span>
                    </div>

                    <div className="space-y-2">
                      {table.columns.slice(0, 5).map((col) => (
                        <div key={col.name} className="flex items-center justify-between text-sm">
                          <span className="text-white/90 font-mono">{col.name}</span>
                          <span className="text-white/60 text-xs">{col.type}</span>
                        </div>
                      ))}
                      {table.columns.length > 5 && (
                        <div className="text-xs text-white/60">
                          +{table.columns.length - 5} more columns
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {(!schema?.tables || schema.tables.length === 0) && (
                <div className="text-center py-12">
                  <Icon name="database" className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Tables Found</h3>
                  <p className="text-white/70">Your database doesn't have any tables yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Table Header */}
              {selectedTable && (
                <div className="p-4 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{selectedTable.name}</h3>
                      <p className="text-white/70">{tableData.length} rows</p>
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
                    <table
                      className="w-full text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      <thead
                        className="bg-white/20"
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <tr>
                          {selectedTable.columns.map((col) => (
                            <th key={col.name} className="px-4 py-3 text-left text-white font-medium border-b border-white/20">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, index) => (
                          <tr
                            key={index}
                            className="border-b border-white/10 hover:bg-white/10 transition-colors"
                            style={{
                              background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                            }}
                          >
                            {selectedTable.columns.map((col) => (
                              <td key={col.name} className="px-4 py-3 text-white">
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
                      <Icon name="table" className="w-16 h-16 text-white/50 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Data</h3>
                      <p className="text-white/70 mb-4">This table doesn't have any data yet.</p>
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
                      <Icon name="table" className="w-16 h-16 text-white/50 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Select a Table</h3>
                      <p className="text-white/70">Click on a table in the schema view to see its data.</p>
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