const DataTable = ({ title, columns, data, onFilter, activeFilter, filterable }) => {
  const isActive = (col, row) => {
    if (!activeFilter || activeFilter.key !== col.field && activeFilter.key !== col.accessor) return false;
    const v = row[col.field || col.accessor];
    return v !== undefined && String(activeFilter.value).toLowerCase() === String(v).toLowerCase();
  };

  const handleClick = (col, row) => {
    const v = row[col.field || col.accessor];
    if (onFilter && v !== undefined && v !== null && v !== '') {
      onFilter(col.field || col.accessor, v);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      {title && (
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border">
          <h3 className="text-sm md:text-lg font-medium text-white">{title}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-3 md:px-6 py-3 font-medium tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 md:px-6 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border hover:bg-gray-800/30 transition-colors">
                  {columns.map((col, colIndex) => {
                    const active = isActive(col, row);
                    const clickable = filterable === true && col.field !== undefined;
                    const content = col.render ? col.render(row) : row[col.accessor];
                    return (
                      <td
                        key={colIndex}
                        className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap"
                        style={active ? { color: '#3B82F6', fontWeight: 600 } : undefined}
                      >
                        {clickable && col.field ? (
                          <span
                            className="inline-block cursor-pointer transition-colors hover:text-primary"
                            onClick={() => handleClick(col, row)}
                            title={row[col.field] !== undefined ? `Click to show all matching "${row[col.field]}"` : undefined}
                          >{content}</span>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}
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
