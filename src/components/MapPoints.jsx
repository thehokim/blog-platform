import React, { useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useTranslation } from 'react-i18next';
import { FiTrash } from 'react-icons/fi';

const MapPoints = ({ mapPoints, setMapPoints }) => {
  const { t } = useTranslation(); // Add localization
  const [currentPosition] = useState({ lat: 41.2995, lng: 69.2401 }); // Center of the map


  // Handle map click to add markers
  const handleMapClick = (event) => {
    const latitude = event.latLng.lat();
    const longitude = event.latLng.lng();
    setMapPoints((prev) => [...prev, { latitude, longitude }]);
  };

  // Clear all markers
  const clearMarkers = () => {
    setMapPoints([]);
  };

  return (
    <div className="mb-4 bg-white border border-px border-gray-200 dark:border-gray-600 dark:bg-gray-800 shadow-md rounded-lg p-4">
      <LoadScript googleMapsApiKey="AIzaSyDTPAxfkG5cRQyIUrSHoRsXyHEC7LuKQU4">
        <GoogleMap
          mapContainerStyle={{
            width: '100%',
            height: '400px',
            borderRadius: '0.5rem',
            overflow: 'hidden',
          }}
          center={mapPoints[0] || currentPosition}
          zoom={12}
          onClick={handleMapClick}
        >
          {mapPoints.map((map, index) => (
            <Marker
              key={index}
              position={{
                lat: parseFloat(map.latitude),
                lng: parseFloat(map.longitude),
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>

      {mapPoints.length > 0 ? (
        <button
  onClick={clearMarkers}
  className="mt-4 px-5 py-3 flex items-center justify-center gap-2 text-sm font-medium bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
>
  <FiTrash className="w-5 h-5" />
  {t('Clear All Markers')}
</button>

      ) : (
        <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
          {t('No markers selected. Click on the map to add markers.')}
        </p>
      )}
    </div>
  );
};

export default MapPoints;
