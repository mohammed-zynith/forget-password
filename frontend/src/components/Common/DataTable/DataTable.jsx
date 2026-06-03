import React, { useState } from 'react';
import './DataTable.css';

const DataTable = ({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = "No records found",
  searchable = false,
  searchPlaceholder = "Search...",
  onRowClick,
  actions = [],
  className = '',
  keyField = "id"
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item =>
    columns.some(col => {
      const value = item[col.key];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  if (loading) {
    return (
      <div className={`data-table-container ${className}`}>
        {searchable && (
          <div className="table-search">
            <div className="search-placeholder common-loading-shimmer" style={{height: '40px'}}></div>
          </div>
        )}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, index) => (
                  <th key={index}>
                    <div className="common-loading-shimmer" style={{height: '20px'}}></div>
                  </th>
                ))}
                {actions.length > 0 && <th><div className="common-loading-shimmer" style={{height: '20px'}}></div></th>}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      <div className="common-loading-shimmer" style={{height: '20px'}}></div>
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td>
                      <div className="common-loading-shimmer" style={{height: '20px', width: '60px'}}></div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={`data-table-container ${className}`}>
      {searchable && (
        <div className="table-search">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      )}
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col.header}</th>
              ))}
              {actions.length > 0 && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="empty-state">
                  <div className="empty-message">{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr 
                  key={row[keyField] || rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? 'clickable-row' : ''}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td>
                      <div className="table-actions">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            className={`action-btn ${action.variant || ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            title={action.title}
                            disabled={action.disabled?.(row)}
                          >
                            {action.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;