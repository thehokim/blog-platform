import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useTranslation } from "react-i18next";
import { FiTrash } from "react-icons/fi";

const MapPoints = ({ mapPoints, setMapPoints }) => {
  const { t } = useTranslation();
  const defaultCenter = { lat: 41.2995, lng: 69.2401 };

  // Фильтрация и преобразование данных в числа
  const validMapPoints = Array.isArray(mapPoints)
    ? mapPoints
        .filter((point) => point && point.latitude && point.longitude)
        .map((point) => ({
          lat: parseFloat(point.latitude),
          lng: parseFloat(point.longitude),
        }))
    : [];

  // Центр карты
  const [currentPosition, setCurrentPosition] = useState(defaultCenter);
  const [mapKey, setMapKey] = useState(0); // Для форсированного ререндеринга карты

  useEffect(() => {
    if (validMapPoints.length > 0) {
      setCurrentPosition(validMapPoints[validMapPoints.length - 1]);
      setMapKey((prevKey) => prevKey + 1); // Форсируем перерисовку карты
    }
  }, [mapPoints]);

  // Функция добавления метки
  const handleMapClick = (event) => {
    const latitude = event.latLng.lat();
    const longitude = event.latLng.lng();
    const newPoint = { latitude, longitude };

    console.log("✅ Добавлена метка:", newPoint);

    // setMapPoints((prev) => [...prev, newPoint]);
    setMapPoints((prevMarkers) => [
      ...prevMarkers,
      {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      },
    ]);
  };

  // Очистить все метки
  const clearMarkers = () => {
    console.log("⚠️ Очистка всех меток");
    setMapPoints([]);
  };
  // console.log(mapPoints)
  return (
    <div className="mb-4 bg-white border border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg p-4">
      {/* Проверка API-ключа */}
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ""}
      >
        <GoogleMap
          key={mapKey} // 🔥 Добавили ключ, чтобы принудительно перерисовывать карту
          mapContainerStyle={{
            width: "100%",
            height: "400px",
            borderRadius: "0.5rem",
            overflow: "hidden",
          }}
          center={currentPosition}
          zoom={12}
          onClick={handleMapClick}
        >
          {/* Рендеринг меток */}
          {validMapPoints.map((point, index) => (
            <Marker key={index} position={point} />
          ))}
        </GoogleMap>
      </LoadScript>

      {/* Кнопка очистки меток */}
      {validMapPoints.length > 0 ? (
        <button
          onClick={clearMarkers}
          className="mt-4 px-5 py-3 flex items-center justify-center gap-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
        >
          <FiTrash className="w-5 h-5" />
          {t("Очистить все метки")}
        </button>
      ) : (
        <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
          {t("Нажмите на карту, чтобы добавить метку.")}
        </p>
      )}
    </div>
  );
};

export default MapPoints;
