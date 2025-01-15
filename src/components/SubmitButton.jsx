import React from 'react';
import { FiArrowRight } from 'react-icons/fi'; // Иконка стрелки вправо
import { useTranslation } from 'react-i18next'; // Подключение перевода

const SubmitButton = ({ onSubmit }) => {
  const { t } = useTranslation(); // Инициализация перевода

  return (
    <div className="flex justify-end mt-6">
      <button
        onClick={onSubmit}
        className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:bg-blue-800 transition-all duration-300 transform hover:scale-105"
      >
        {t('Далее')}
        <FiArrowRight className="w-5 h-5" /> {/* Иконка стрелки вправо */}
      </button>
    </div>
  );
};

export default SubmitButton;
