import React from 'react';

const DataTable = ({ title, columns, data }) => {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      {title && (
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-3 font-medium tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border hover:bg-gray-800/30 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
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
