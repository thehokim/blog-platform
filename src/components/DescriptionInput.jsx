import { FileCodeIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { FaAudioDescription } from "react-icons/fa";

const DescriptionInput = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <label className="block mb-6">
      <span className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-2 flex">
        <FileCodeIcon className="w-5 h-5 mt-1 mr-2" />
        {t("Description")}
      </span>
      <textarea
        value={value}
        onChange={onChange}
        className="mt-1 block w-full px-4 py-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 
                   border border-px border-gray-200 dark:border-gray-600 rounded-lg 
                   focus:outline-none
                   sm:text-base md:text-lg lg:text-xl 
                   placeholder-gray-400 dark:placeholder-gray-600 resize-none"
        rows="4"
        placeholder={t("Enter the description here")}
      />
    </label>
  );
};

export default DescriptionInput;
