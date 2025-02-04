import { FileCodeIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { FaAudioDescription } from "react-icons/fa";

const DescriptionInput = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <label className="block mb-6">
      <span className="text-lg font-semibold text-gray-800 mb-2 flex">
        <FileCodeIcon className="w-5 h-5 mt-1 mr-2" />
        {t("Description")}
      </span>
      <textarea
        value={value}
        onChange={onChange}
        className="mt-1 block w-full px-4 py-3 text-gray-700 bg-white 
                   border border-px border-gray-200 rounded-lg 
                   focus:outline-none
                   sm:text-base md:text-lg lg:text-xl 
                   placeholder-gray-400 resize-none"
        rows="4"
        placeholder={t("Enter the description here")}
      />
    </label>
  );
};

export default DescriptionInput;
