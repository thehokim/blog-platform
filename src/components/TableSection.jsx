import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const TableSection = ({ tableData, onChange, onAddRow, onAddColumn, onRemoveRow, onRemoveColumn }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-4 mt-4 bg-white dark:bg-gray-800 p-4 border border-px border-gray-200 dark:border-gray-600 rounded-lg shadow-md overflow-auto">
      <table className="w-full border border-gray-300 dark:border-gray-600 rounded-lg">
        <thead>
          <tr>
            {tableData[0].map((_, colIndex) => (
              <th
                key={colIndex}
                className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left relative"
              >
                <input
                  type="text"
                  placeholder={t('Column Title')}
                  className="w-full bg-transparent border-none text-sm focus:outline-none dark:text-white"
                />
                {/* Remove Column Button */}
                <button
                  onClick={() => onRemoveColumn(colIndex)}
                  className="absolute top-1/2 right-1 transform -translate-y-1/2 text-red-500 hover:text-red-700 focus:outline-none"
                  title={t('Remove Column')}
                >
                  <FiX size={12} />
                </button>
              </th>
            ))}
            {/* Add Column Button */}
            <th className="px-2 py-1 text-center">
              <button
                onClick={onAddColumn}
                className="text-blue-500 hover:text-blue-700 focus:outline-none "
                title={t('Add Column')}
              >
                <FiPlus size={16} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border border-gray-300 dark:border-gray-600 px-2 py-1"
                >
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => onChange(e, rowIndex, cellIndex)}
                    className="w-full bg-transparent border-none text-sm focus:outline-none dark:text-white"
                    placeholder={t('Enter value')}
                  />
                </td>
              ))}
              {/* Remove Row Button */}
              <td className="px-2 py-1 text-center">
                <button
                  onClick={() => onRemoveRow(rowIndex)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  title={t('Remove Row')}
                >
                  <FiX size={12} />
                </button>
              </td>
            </tr>
          ))}
          {/* Add Row Button */}
          <tr>
            <td colSpan={tableData[0].length + 1} className="text-left py-2 pl-2">
              <button
                onClick={onAddRow}
                className="text-blue-500 hover:text-blue-700 focus:outline-none"
                title={t('Add Row')}
              >
                <FiPlus size={16} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TableSection;
