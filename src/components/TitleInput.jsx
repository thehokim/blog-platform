import { SquareChartGantt } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { FiBold } from "react-icons/fi";

const TitleInput = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <label className="block mb-6">
      <span className="text-lg font-semibold text-gray-800 flex mb-2">
        <SquareChartGantt className="w-5 h-5 mr-2 mt-1" /> {t("Title")}
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="mt-1 block w-full px-4 py-3 text-gray-700 bg-white 
                   border border-gray-300 rounded-lg 
                   focus:outline-none
                   sm:text-base md:text-lg lg:text-xl
                   placeholder-gray-400"
        placeholder={t("Enter the title here")}
      />
    </label>
  );
};

export default TitleInput;
