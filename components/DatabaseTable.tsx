import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import type { DatabaseTable, DatabaseField } from '../services/databaseService';

interface DatabaseTableProps {
  table: DatabaseTable;
  onRecordAdd?: (tableId: string, record: Record<string, any>) => void;
  onRecordUpdate?: (tableId: string, recordId: string, updates: Record<string, any>) => void;
  onRecordDelete?: (tableId: string, recordId: string) => void;
  onRefresh?: (tableId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const DatabaseTable: React.FC<DatabaseTableProps> = ({
  table,
  onRecordAdd,
  onRecordUpdate,
  onRecordDelete,
  onRefresh,
  isLoading = false,
  className = ''
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState<Record<string, any>>({});
  const [editRecord, setEditRecord] = useState<Record<string, any>>({});

  // Initialize new record with default values
  useEffect(() => {
    const defaults: Record<string, any> = {};
    table.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      } else if (field.type === 'boolean') {
        defaults[field.name] = false;
      } else if (field.type === 'number') {
        defaults[field.name] = 0;
      } else {
        defaults[field.name] = '';
      }
    });
    setNewRecord(defaults);
  }, [table.fields]);

  const handleAddRecord = () => {
    if (onRecordAdd) {
      onRecordAdd(table.id, newRecord);
      // Reset form
      const defaults: Record<string, any> = {};
      table.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        } else if (field.type === 'boolean') {
          defaults[field.name] = false;
        } else if (field.type === 'number') {
          defaults[field.name] = 0;
        } else {
          defaults[field.name] = '';
        }
      });
      setNewRecord(defaults);
      setShowAddForm(false);
    }
  };

  const handleUpdateRecord = (recordId: string) => {
    if (onRecordUpdate) {
      onRecordUpdate(table.id, recordId, editRecord);
      setEditingRecord(null);
      setEditRecord({});
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    if (onRecordDelete && window.confirm('Are you sure you want to delete this record?')) {
      onRecordDelete(table.id, recordId);
    }
  };

  const startEditing = (record: Record<string, any>) => {
    setEditingRecord(record.id);
    setEditRecord({ ...record });
  };

  const renderFieldInput = (field: DatabaseField, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={field.description || `Enter ${field.name}`}
          />
        );

      case 'date':
        return (
          <input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'text':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            placeholder={field.description || `Enter ${field.name}`}
          />
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(parsed);
              } catch {
                onChange(e.target.value);
              }
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
            rows={3}
            placeholder='{"key": "value"}'
          />
        );

      default: // string
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={field.description || `Enter ${field.name}`}
          />
        );
    }
  };

  const formatFieldValue = (field: DatabaseField, value: any): string => {
    if (value === null || value === undefined) return '';

    switch (field.type) {
      case 'boolean':
        return value ? '✓' : '✗';
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      case 'json':
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      default:
        return String(value);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Table Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="database" className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{table.name}</h3>
              {table.description && (
                <p className="text-sm text-gray-600">{table.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {table.records.length} records
            </span>

            <button
              onClick={() => onRefresh && onRefresh(table.id)}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <Icon name="refresh" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Icon name="plus" className="w-4 h-4 inline mr-1" />
              Add Record
            </button>
          </div>
        </div>
      </div>

      {/* Add Record Form */}
      {showAddForm && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {table.fields.map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  {field.unique && <Icon name="key" className="w-3 h-3 inline ml-1 text-yellow-500" />}
                </label>
                {renderFieldInput(field, newRecord[field.name], (value) =>
                  setNewRecord(prev => ({ ...prev, [field.name]: value }))
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRecord}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Record
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        {table.records.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Icon name="database" className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No records yet</p>
            <p className="text-sm">Add your first record to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {table.fields.map(field => (
                  <th
                    key={field.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1">
                      {field.name}
                      {field.required && <span className="text-red-500">*</span>}
                      {field.unique && <Icon name="key" className="w-3 h-3 text-yellow-500" />}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.records.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  {table.fields.map(field => (
                    <td key={field.id} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {editingRecord === record.id ? (
                        <div className="max-w-xs">
                          {renderFieldInput(field, editRecord[field.name], (value) =>
                            setEditRecord(prev => ({ ...prev, [field.name]: value }))
                          )}
                        </div>
                      ) : (
                        <span className="truncate block max-w-xs" title={formatFieldValue(field, record[field.name])}>
                          {formatFieldValue(field, record[field.name])}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-1">
                      {editingRecord === record.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateRecord(record.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Save changes"
                          >
                            <Icon name="check" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRecord(null);
                              setEditRecord({});
                            }}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Cancel editing"
                          >
                            <Icon name="close" className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(record)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit record"
                          >
                            <Icon name="edit" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete record"
                          >
                            <Icon name="trash" className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DatabaseTable;