import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ru from "./locales/ru.json";
import uz from "./locales/uz.json";
import cyr from "./locales/cyr.json";
import en from "./locales/en.json";

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    uz: { translation: uz },
    cyr: { translation: cyr },
    en: { translation: en },
  },
  lng: localStorage.getItem('appLanguage') || 'ru', // Берем язык из localStorage или ставим русский по умолчанию
  fallbackLng: "ru", // Резервный язык
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
