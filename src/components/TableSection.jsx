import { useTranslation } from "react-i18next";
import { FiPlus, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";

const TableSection = ({
  tableData,
  onChange,
  onHeaderChange,
  onAddRow,
  onAddColumn,
  onRemoveRow,
  onRemoveColumn,
}) => {
  const { t } = useTranslation();
  const [safeTableData, setSafeTableData] = useState({ columns: [], rows: [] });

  useEffect(() => {
    if (!tableData || !tableData.columns || tableData.columns.length === 0) {
      setSafeTableData({
        columns: [t("Column 1"), t("Column 2"), t("Column 3")],
        rows: [
          { [t("Column 1")]: "", [t("Column 2")]: "", [t("Column 3")]: "" },
          { [t("Column 1")]: "", [t("Column 2")]: "", [t("Column 3")]: "" },
          { [t("Column 1")]: "", [t("Column 2")]: "", [t("Column 3")]: "" },
        ],
      });
    } else {
      setSafeTableData({
        columns: tableData.columns,
        rows: tableData.rows.length > 0 ? tableData.rows : [{ [tableData.columns[0]]: "" }],
      });
    }
  }, [tableData, t]); // Локализация заголовков

  return (
    <div className="mb-6 mt-6 bg-white p-6 border border-[#f1f1f3] rounded-lg overflow-auto">
      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-gray-800">
          <tr>
            {safeTableData.columns.map((col, colIndex) => (
              <th
                key={colIndex}
                className="border border-gray-300 px-4 py-2 text-center font-semibold"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => onHeaderChange(e, colIndex)}
                    placeholder={t("Column Title")}
                    className="w-full bg-transparent border-none text-sm text-center font-bold focus:outline-none placeholder-gray-500"
                  />
                  <button
                    onClick={() => onRemoveColumn(colIndex)}
                    className="text-red-500 hover:text-red-700 focus:outline-none transition-transform transform scale-100 hover:scale-110"
                    title={t("Remove Column")}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              </th>
            ))}
            <th className="px-4 py-2 text-center">
              <button
                onClick={onAddColumn}
                className="text-blue-500 hover:text-blue-700 focus:outline-none transition-transform transform scale-100 hover:scale-110"
                title={t("Add Column")}
              >
                <FiPlus size={18} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {safeTableData.rows.length > 0 ? (
            safeTableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition">
                {safeTableData.columns.map((col, cellIndex) => (
                  <td key={cellIndex} className="border border-gray-300 px-4 py-2 text-center">
                    <input
                      type="text"
                      value={row[col] || ""}
                      onChange={(e) => onChange(e, rowIndex, col)}
                      className="w-full bg-transparent border-none text-sm text-center focus:outline-none placeholder-gray-500"
                      placeholder={t("Enter value")}
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => onRemoveRow(rowIndex)}
                    className="text-red-500 hover:text-red-700 focus:outline-none transition-transform transform scale-100 hover:scale-110"
                    title={t("Remove Row")}
                  >
                    <FiX size={14} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={safeTableData.columns.length + 1}
                className="text-center py-4 text-gray-500"
              >
                {t("No data available")}
              </td>
            </tr>
          )}
          <tr>
            <td colSpan={safeTableData.columns.length + 1} className="text-left py-3 pl-3">
              <button
                onClick={onAddRow}
                className="text-blue-500 hover:text-blue-700 focus:outline-none transition-transform transform scale-100 hover:scale-110"
                title={t("Add Row")}
              >
                <FiPlus size={18} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TableSection;
