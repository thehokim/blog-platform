import React, { useState, useEffect } from 'react';
import {
  YMaps,
  Map,
  Placemark,
  Button,
  ZoomControl,
  TypeSelector,
} from '@pbe/react-yandex-maps';
import { FiDelete, FiTrash } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '../utils/instance';

const YandexMap = ({ center = [41.2995, 69.2401], zoom = 13 }) => {
  const { t } = useTranslation();
  const [markers, setMarkers] = useState([]); // Состояние для меток
  const [mapState, setMapState] = useState({
    center,
    zoom,
    type: 'yandex#map',
  }); // Состояние карты
  const [isDarkMode, setIsDarkMode] = useState(false); // Темная тема

  // Определение темы по системным настройкам
  useEffect(() => {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    setIsDarkMode(prefersDark);
  }, []);

  // Обработчик клика по карте
  const handleMapClick = async (event) => {
    const coords = event.get('coords');
    try {
      await fetch(`${BASE_URL}/map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coords),
      });
    } catch (error) {
      console.error('Error:', error);
      alert(t('Ошибка при подключении к серверу.'));
    }
    setMarkers((prevMarkers) => [...prevMarkers, coords]);
  };

  // Обработчик смены типа карты
  const toggleMapType = () => {
    setMapState((prev) => ({
      ...prev,
      type: prev.type === 'yandex#map' ? 'yandex#satellite' : 'yandex#map',
    }));
  };

  // Обработчик переключения темы
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className='bg-gray-100 dark:bg-gray-300 rounded-lg shadow-md p-4'>
      <YMaps>
        <Map
          state={{
            center: mapState.center,
            zoom: mapState.zoom,
            type: mapState.type,
          }}
          width='99%'
          height='300px'
          onClick={handleMapClick}
          options={{
            suppressMapOpenBlock: true, // Убирает кнопки "Открыть в Яндекс.Картах"
            theme: isDarkMode ? 'dark' : 'light', // Автоматическая смена темы
          }}
        >
          {/* Отображение меток */}
          {markers.map((marker, index) => (
            <Placemark
              key={index}
              geometry={marker}
              properties={{
                hintContent: `Метка ${index + 1}`,
                balloonContent: `Координаты: [${marker[0].toFixed(
                  4
                )}, ${marker[1].toFixed(4)}]`,
              }}
            />
          ))}

          {/* Встроенные контролы */}
          <ZoomControl options={{ position: { right: 10, top: 10 } }} />
          <TypeSelector options={{ position: { left: 10, top: 10 } }} />
        </Map>
      </YMaps>

      {/* Панель управления */}
      <div className='flex flex-wrap gap-4 mt-4'>
        <button
          className='flex bg-red-500 text-white px-3 py-2 rounded-xl shadow hover:bg-red-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg'
          onClick={() => setMarkers([])}
        >
          <FiTrash className='mt-1 mr-1' />
          {t('Удалить метки')}
        </button>
      </div>
    </div>
  );
};

export default YandexMap;
