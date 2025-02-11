import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

const RussiaFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 513 357.071" className="w-6 h-5">
    <rect y="0" width="600" height="200" fill="#FFFFFF" />
    <rect y="120" width="600" height="200" fill="#0039A6" />
    <rect y="240" width="600" height="120" fill="#D52B1E" />
  </svg>
);

const UzbekFlag = () => (
<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 513 357.071" className='w-6 h-5'>
<path fill="#1EB53A" fill-rule="nonzero" d="M28.477.32h456.044c15.488 0 28.159 12.672 28.159 28.16v300.111c0 15.488-12.671 28.16-28.159 28.16H28.477c-15.486 0-28.157-12.672-28.157-28.16V28.48C.32 12.992 12.991.32 28.477.32z"/>
<path fill="#0099B5" fill-rule="nonzero" d="M512.68 178.536H.32V28.48C.32 12.992 12.991.32 28.477.32h456.044c15.488 0 28.159 12.672 28.159 28.16v150.056z"/>
<path fill="#CE1126" fill-rule="nonzero" d="M.32 114.377h512.36v128.317H.32z"/>
<path fill="#fff" fill-rule="nonzero" d="M.32 121.505h512.36v114.06H.32z"/>
<path fill="#fff" d="M96.068 14.574c2.429 0 4.81.206 7.129.596-20.218 3.398-35.644 20.998-35.644 42.177 0 21.178 15.426 38.778 35.644 42.176-2.319.39-4.7.596-7.129.596-23.607 0-42.772-19.165-42.772-42.772 0-23.608 19.165-42.773 42.772-42.773zm94.1 68.437l-1.921 5.91h-6.216l5.029 3.654-1.92 5.911 5.028-3.654 5.028 3.654-1.921-5.911 5.029-3.654h-6.216l-1.92-5.91zm-39.247-18.743l1.921-5.911-5.028-3.654h6.215l1.92-5.911 1.921 5.911h6.216l-5.029 3.654 1.92 5.911-5.028-3.654-5.028 3.654zm0 34.218l1.921-5.911-5.028-3.654h6.215l1.92-5.91 1.921 5.91h6.216l-5.029 3.654 1.92 5.911-5.028-3.654-5.028 3.654zm-34.217 0l1.92-5.911-5.028-3.654h6.216l1.919-5.91 1.921 5.91h6.216l-5.029 3.654 1.92 5.911-5.028-3.654-5.027 3.654zm136.872-68.437l1.921-5.91-5.03-3.654h6.216l1.921-5.911 1.921 5.911h6.215l-5.029 3.654 1.921 5.91-5.028-3.653-5.028 3.653zm0 34.219l1.921-5.911-5.03-3.654h6.216l1.921-5.911 1.921 5.911h6.215l-5.029 3.654 1.921 5.911-5.028-3.654-5.028 3.654zm0 34.218l1.921-5.911-5.03-3.654h6.216l1.921-5.91 1.921 5.91h6.215l-5.029 3.654 1.921 5.911-5.028-3.654-5.028 3.654zm-34.218-68.437l1.92-5.91-5.029-3.654h6.216l1.921-5.911 1.92 5.911h6.216l-5.029 3.654 1.92 5.91-5.027-3.653-5.028 3.653zm0 34.219l1.92-5.911-5.029-3.654h6.216l1.921-5.911 1.92 5.911h6.216l-5.029 3.654 1.92 5.911-5.027-3.654-5.028 3.654zm0 34.218l1.92-5.911-5.029-3.654h6.216l1.921-5.91 1.92 5.91h6.216l-5.029 3.654 1.92 5.911-5.027-3.654-5.028 3.654zM185.14 30.049l1.92-5.91-5.029-3.654h6.216l1.921-5.911 1.92 5.911h6.216l-5.029 3.654 1.921 5.91-5.028-3.653-5.028 3.653zm0 34.219l1.92-5.911-5.029-3.654h6.216l1.921-5.911 1.92 5.911h6.216l-5.029 3.654 1.921 5.911-5.028-3.654-5.028 3.654z"/>
<path fill="#CCC" fill-rule="nonzero" d="M28.48 0h456.04c7.833 0 14.953 3.204 20.115 8.365C509.796 13.527 513 20.647 513 28.479v300.112c0 7.832-3.204 14.953-8.365 20.115-5.162 5.161-12.282 8.365-20.115 8.365H28.48c-7.833 0-14.953-3.204-20.115-8.365C3.204 343.544 0 336.423 0 328.591V28.479c0-7.832 3.204-14.952 8.365-20.114C13.527 3.204 20.647 0 28.48 0zm456.04.641H28.48c-7.656 0-14.616 3.132-19.661 8.178C3.773 13.864.641 20.824.641 28.479v300.112c0 7.656 3.132 14.616 8.178 19.661 5.045 5.046 12.005 8.178 19.661 8.178h456.04c7.656 0 14.616-3.132 19.661-8.178 5.046-5.045 8.178-12.005 8.178-19.661V28.479c0-7.655-3.132-14.615-8.178-19.66C499.136 3.773 492.176.641 484.52.641z"/>
</svg>
);

const CyrillicFlag = UzbekFlag; // Если Кириллический флаг совпадает

const EnglishFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className="w-6 h-5">
    <rect width="60" height="40" fill="#012169" />
    <path fill="#FFF" d="M0 0l60 40h-10L0 5zM60 0L0 40h10L60 5z" />
    <path fill="#C8102E" d="M0 0l60 40h-5L0 2.5zM60 0L0 40h5L60 2.5z" />
    <path fill="#FFF" d="M26 0h8v40h-8zM0 16h60v8H0z" />
    <path fill="#C8102E" d="M28 0h4v40h-4zM0 18h60v4H0z" />
  </svg>
);

// Вынести массив языков за пределы компонента, чтобы он не пересоздавался
const languages = [
  { code: 'ru', name: 'Русский', Flag: RussiaFlag },
  { code: 'uz', name: "O'zbek", Flag: UzbekFlag },
  { code: 'cyr', name: 'Кирилл', Flag: CyrillicFlag },
  { code: 'en', name: 'English', Flag: EnglishFlag },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Инициализация языка из localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage && languages.some((lang) => lang.code === savedLanguage)) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('appLanguage', lng);
    setIsOpen(false);
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];
  const CurrentFlag = currentLanguage.Flag;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-700 hover:bg-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
      >
        <CurrentFlag />
      </button>

      {isOpen && (
        <div className="absolute -right-20 top-14 w-48 bg-gray-100 rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-down z-20">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-7 py-3 hover:bg-gray-200 transition-colors duration-200 ${
                i18n.language === lang.code ? 'bg-blue-100' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <lang.Flag />
                <span className="text-sm font-medium text-gray-800">{lang.name}</span>
              </div>
              {i18n.language === lang.code && <Check className="w-5 h-5 text-blue-600" />}
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSwitcher;