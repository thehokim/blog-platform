import React, { useState } from "react";
import { FaUser, FaBookmark, FaPen } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const SpeedDialMenu = () => {
  const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
  
    const toggleMenu = () => {
      setIsOpen(!isOpen);
    };
  
    return (
      <div className="relative">
        {/* Dropdown Menu */}
        {isOpen && (
          <div
          className="absolute -right-16 top-14
          w-44 bg-white
          rounded-xl shadow-2xl
          border border-gray-100
          overflow-hidden
          animate-fade-in-down z-10 p-2"
        >
          <ul className="text-sm text-gray-700 dark:text-gray-300">
            <li className="w-full">
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 w-full hover:bg-gray-100 hover:rounded-lg dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              >
                <FaUser className="mr-2 text-blue-600" />
                {t("Профиль")}
              </Link>
            </li>
            <li className="w-full">
              <Link
                to="/saved"
                className="flex items-center px-4 py-2 w-full hover:bg-gray-100 hover:rounded-lg dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              >
                <FaBookmark className="mr-2 text-blue-600" />
                {t("Сохраненные")}
              </Link>
            </li>
            <li className="w-full">
              <Link
                to="/myblogs"
                className="flex items-center px-4 py-2 w-full hover:bg-gray-100 hover:rounded-lg dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              >
                <FaPen className="mr-2 text-blue-600" />
                {t("Мои блоги")}
              </Link>
            </li>
          </ul>
        </div>
        )}
  
        {/* Speed Dial Button */}
        <button
          onClick={toggleMenu}
          className="flex items-center justify-center w-10 h-10 text-white bg-blue-700 rounded-full shadow-lg hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-700 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg z-10"
        >
          <svg 
          version="1.1" 
          id="Layer_1" 
          xmlns="http://www.w3.org/2000/svg" 
          x="0px" y="0px" viewBox="0 0 95.06 122.88" 
          className="w-6 h-6 fill-white"
          >
          <path class="st0" d="M47.48,108.43c2.21,0,4,1.79,4,4c0,2.21-1.79,4-4,4c-2.21,0-4-1.79-4-4 C43.48,110.22,45.27,108.43,47.48,108.43L47.48,108.43z M21.64,67.48c-0.06-0.12-0.13-0.23-0.21-0.34 c-0.35-0.57-0.7-1.14-1.05-1.79c-0.35-0.7-0.7-1.36-1.01-1.97c-0.31-0.66-0.61-1.36-0.87-2.06c-0.22-0.61-0.48-1.31-0.74-2.14 c-0.39-1.18-1.49-1.92-2.67-1.92H7.52c-0.26,0-0.52-0.04-0.7-0.13c-0.17-0.09-0.39-0.22-0.52-0.39c-0.17-0.18-0.31-0.35-0.39-0.52 c-0.09-0.17-0.13-0.44-0.13-0.7v-9.54c0-0.26,0.04-0.48,0.09-0.66c0.09-0.18,0.22-0.39,0.44-0.61c0.17-0.17,0.35-0.31,0.52-0.35 c0.18-0.09,0.44-0.13,0.7-0.13h6.95c1.4,0,2.54-1.01,2.8-2.32c0.17-0.74,0.35-1.44,0.52-2.06c0.22-0.7,0.44-1.36,0.7-2.06 c0.26-0.66,0.52-1.36,0.87-2.01c0.31-0.7,0.66-1.31,0.96-1.92c0.61-1.14,0.39-2.45-0.48-3.32l-5.42-5.47 c-0.04-0.04-0.04-0.04-0.09-0.04c-0.17-0.17-0.31-0.35-0.39-0.52c-0.09-0.17-0.09-0.35-0.09-0.61c0-0.26,0.04-0.48,0.13-0.66 c0.09-0.22,0.22-0.39,0.44-0.61l6.69-6.65c0.22-0.22,0.39-0.35,0.61-0.44c0.18-0.09,0.39-0.13,0.66-0.13 c0.26,0,0.48,0.04,0.66,0.13c0.18,0.09,0.39,0.22,0.57,0.39h0.04l4.94,4.94c0.96,0.96,2.49,1.09,3.59,0.31 c0.57-0.35,1.14-0.7,1.79-1.05c0.7-0.35,1.36-0.7,1.97-1.01c0.66-0.31,1.36-0.61,2.06-0.87c0.61-0.22,1.31-0.48,2.14-0.74 c1.18-0.39,1.92-1.49,1.92-2.67V7.26c0-0.26,0.04-0.52,0.13-0.7c0.09-0.17,0.22-0.35,0.35-0.52c0.18-0.17,0.35-0.31,0.52-0.35 c0.17-0.09,0.44-0.13,0.7-0.13h6.72h0.08h0.69c0.26,0,0.52,0.04,0.7,0.13c0.17,0.04,0.35,0.18,0.52,0.35 c0.13,0.17,0.26,0.35,0.35,0.52c0.09,0.17,0.13,0.44,0.13,0.7v7.57c0,1.18,0.74,2.27,1.92,2.67c0.83,0.26,1.53,0.52,2.14,0.74 c0.7,0.26,1.4,0.57,2.06,0.87c0.61,0.31,1.27,0.66,1.97,1.01c0.66,0.35,1.22,0.7,1.79,1.05c1.09,0.79,2.62,0.66,3.59-0.31 l4.94-4.94h0.04c0.17-0.17,0.39-0.31,0.57-0.39c0.17-0.09,0.39-0.13,0.66-0.13c0.26,0,0.48,0.04,0.66,0.13 c0.22,0.09,0.39,0.22,0.61,0.44l6.69,6.65c0.22,0.22,0.35,0.39,0.44,0.61c0.09,0.17,0.13,0.39,0.13,0.66c0,0.26,0,0.44-0.09,0.61 c-0.09,0.18-0.22,0.35-0.39,0.52c-0.04,0-0.04,0-0.09,0.04l-5.42,5.47c-0.87,0.87-1.09,2.19-0.48,3.32 c0.31,0.61,0.66,1.22,0.96,1.92c0.35,0.66,0.61,1.36,0.87,2.01c0.26,0.7,0.48,1.36,0.7,2.06c0.17,0.61,0.35,1.31,0.52,2.06 c0.26,1.31,1.4,2.32,2.8,2.32h6.95c0.26,0,0.52,0.04,0.7,0.13c0.17,0.04,0.35,0.17,0.52,0.35c0.22,0.22,0.35,0.44,0.44,0.61 c0.04,0.17,0.09,0.39,0.09,0.66v9.54c0,0.26-0.04,0.52-0.13,0.7c-0.09,0.18-0.22,0.35-0.39,0.52c-0.13,0.17-0.35,0.31-0.52,0.39 c-0.18,0.09-0.44,0.13-0.7,0.13h-7.57c-1.18,0-2.27,0.74-2.67,1.92c-0.26,0.83-0.52,1.53-0.74,2.14c-0.26,0.7-0.57,1.4-0.87,2.06 c-0.31,0.61-0.66,1.27-1.01,1.97c-0.35,0.66-0.7,1.23-1.05,1.79c-0.08,0.11-0.15,0.22-0.21,0.34h6.62 c0.28-0.56,0.56-1.16,0.85-1.78c0.35-0.79,0.7-1.57,1.01-2.36c0.04-0.13,0.13-0.31,0.18-0.44h5.6c1.01,0,1.97-0.17,2.84-0.52 c0.87-0.35,1.71-0.92,2.41-1.62c0.7-0.7,1.27-1.49,1.62-2.41c0.35-0.92,0.52-1.84,0.52-2.84v-9.53c0-0.96-0.22-1.92-0.57-2.8 c-0.35-0.87-0.87-1.66-1.57-2.36l-0.04-0.04c-0.7-0.7-1.49-1.27-2.36-1.62c-0.87-0.39-1.84-0.57-2.84-0.57l-4.77,0 c0-0.13-0.04-0.22-0.09-0.35c-0.26-0.83-0.52-1.66-0.83-2.45c-0.35-0.83-0.66-1.62-1.01-2.36c-0.04-0.09-0.13-0.22-0.17-0.35 l3.94-3.98c0.74-0.66,1.27-1.44,1.66-2.32c0.35-0.87,0.57-1.84,0.57-2.84c0-1.01-0.17-1.92-0.57-2.84 c-0.39-0.87-0.92-1.66-1.62-2.36h-0.04l-6.69-6.65c-0.7-0.7-1.49-1.22-2.41-1.62c-0.92-0.39-1.84-0.57-2.84-0.57 c-0.96,0-1.92,0.17-2.84,0.57c-0.92,0.35-1.71,0.92-2.41,1.62l-3.41,3.37l-0.26-0.13c-0.7-0.39-1.49-0.74-2.32-1.14 c-0.79-0.35-1.57-0.7-2.36-1.01c-0.13-0.04-0.31-0.13-0.44-0.18v-5.6c0-1.01-0.17-1.97-0.52-2.84c-0.35-0.88-0.92-1.71-1.62-2.41 c-0.74-0.7-1.53-1.27-2.41-1.62C53.29,0.17,52.37,0,51.36,0h-3.45h-0.77h-3.45c-1.01,0-1.92,0.17-2.84,0.52 c-0.87,0.35-1.66,0.92-2.41,1.62c-0.7,0.7-1.27,1.53-1.62,2.41c-0.35,0.87-0.52,1.84-0.52,2.84v5.6c-0.13,0.04-0.31,0.13-0.44,0.18 c-0.79,0.31-1.57,0.66-2.36,1.01c-0.83,0.39-1.62,0.74-2.32,1.14l-0.26,0.13l-3.41-3.37c-0.7-0.7-1.49-1.27-2.41-1.62 c-0.92-0.39-1.88-0.57-2.84-0.57c-1.01,0-1.92,0.17-2.84,0.57c-0.92,0.39-1.71,0.92-2.41,1.62l-6.69,6.65h-0.04 c-0.7,0.7-1.22,1.49-1.62,2.36C8.27,22,8.09,22.92,8.09,23.92c0,1.01,0.22,1.97,0.57,2.84c0.39,0.87,0.92,1.66,1.66,2.32l3.94,3.98 c-0.04,0.13-0.13,0.26-0.17,0.35c-0.35,0.74-0.66,1.53-1.01,2.36c-0.31,0.79-0.57,1.62-0.83,2.45c-0.04,0.13-0.09,0.22-0.09,0.35 l-4.77,0c-1.01,0-1.97,0.18-2.84,0.57c-0.87,0.35-1.66,0.92-2.36,1.62l-0.04,0.04c-0.7,0.7-1.22,1.49-1.57,2.36 C0.22,44.04,0,45.01,0,45.97v9.53c0,1.01,0.17,1.92,0.52,2.84c0.35,0.92,0.92,1.71,1.62,2.41c0.7,0.7,1.53,1.27,2.41,1.62 c0.87,0.35,1.84,0.52,2.84,0.52h5.6c0.04,0.13,0.13,0.31,0.18,0.44c0.31,0.79,0.66,1.57,1.01,2.36c0.3,0.63,0.57,1.23,0.85,1.78 H21.64L21.64,67.48z M32.47,58.63c-0.83,0.03-1.47,0.2-1.9,0.5c-0.25,0.17-0.43,0.38-0.54,0.63c-0.13,0.28-0.19,0.62-0.18,1.01 c0.03,1.14,0.63,2.64,1.79,4.37l0.02,0.02l3.76,5.99c1.51,2.4,3.09,4.85,5.06,6.64c1.89,1.73,4.18,2.9,7.22,2.91 c3.28,0.01,5.69-1.21,7.64-3.03c2.03-1.9,3.63-4.5,5.2-7.1l4.24-6.98c0.79-1.8,1.08-3.01,0.9-3.72c-0.11-0.42-0.57-0.63-1.37-0.67 c-0.17-0.01-0.34-0.01-0.52-0.01c-0.19,0.01-0.39,0.02-0.59,0.04c-0.11,0.01-0.22,0-0.33-0.02c-0.38,0.02-0.77-0.01-1.16-0.06 l1.45-6.43c-10.77,1.7-18.83-6.3-30.22-1.6l0.82,7.57C33.31,58.7,32.87,58.69,32.47,58.63L32.47,58.63L32.47,58.63L32.47,58.63z M65.76,57.28c1.04,0.32,1.71,0.98,1.99,2.05c0.3,1.19-0.03,2.86-1.03,5.14l0,0c-0.02,0.04-0.04,0.08-0.06,0.12l-4.29,7.06 c-1.65,2.72-3.33,5.45-5.57,7.55l-0.11,0.1c0.21,0.31,0.45,0.65,0.69,1.01c0.74,1.09,1.59,2.34,2.38,3.31 c4.66,2.9,14.91,3.68,18.92,5.91c10.2,5.69,6.48,19.51,7.22,29.45c-0.22,2.35-1.55,3.7-4.17,3.9h-2.83l3.11-23.57 c0.24-1.84-1.06-3.34-2.67-3.34H57.47c0.54-3.85,0.93-7.53,1.12-10.31c-1.02-1.13-2.11-2.73-3.05-4.11c-0.21-0.3-0.41-0.6-0.6-0.87 c-1.97,1.32-4.31,2.14-7.24,2.13c-3.27-0.01-5.82-1.13-7.93-2.84c-0.59,1.77-1.46,4.21-2.3,5.38c-0.07,0.1-0.16,0.19-0.26,0.26 c0.36,2.87,0.86,6.55,1.45,10.37h-22.4c-1.6,0-2.91,1.5-2.67,3.34l3.11,23.57h-2.84c-2.62-0.2-3.95-1.55-4.17-3.9 c0.13-10.53-3.87-23.27,7.22-29.45c4.06-2.27,14.53-3.04,19.1-6.03c0.7-1.31,1.47-3.67,1.94-5.07c0.05-0.16-0.03,0.1,0.05-0.13 c-1.68-1.8-3.05-3.93-4.37-6.03l-3.76-5.98c-1.38-2.05-2.09-3.93-2.14-5.47c-0.02-0.72,0.1-1.38,0.37-1.96 c0.28-0.6,0.71-1.11,1.29-1.5c0.27-0.18,0.58-0.34,0.91-0.47c-0.24-3.25-0.34-7.34-0.18-10.76c0.08-0.81,0.24-1.63,0.46-2.44 c1.38-4.92,5.61-8.47,10.44-10.14c2.34-0.81,1.44-2.74,3.81-2.61c5.62,0.31,14.28,3.93,17.61,7.77 C67.12,44.09,65.91,50.71,65.76,57.28L65.76,57.28L65.76,57.28L65.76,57.28z M40.04,90.19c-1.9-2.16-2.06-4.42,0-6.81 c2.38,0.6,4.56,1.63,6.57,3.02c0.43-0.19,0.94-0.27,1.43-0.23c2.09-1.48,4.75-2.08,7.08-3.19c2.78,2.71,2.48,5.2-0.25,7.51 c-1.53-0.35-2.98-0.89-4.37-1.6c-0.04,0.36-0.13,0.75-0.3,1.17l0.71,5.91h-5.67l0.71-5.91c-0.44-0.75-0.61-1.39-0.6-1.92 C43.7,89.13,41.91,89.77,40.04,90.19L40.04,90.19L40.04,90.19z"/>
          </svg>
          <span className="sr-only">Открыть меню действий</span>
        </button>
      </div>
    );
  };
  
  export default SpeedDialMenu;
  