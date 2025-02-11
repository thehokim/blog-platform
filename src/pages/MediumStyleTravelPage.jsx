import React from 'react';
import { Map, Table, Tag, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CommentSection from '../components/comment';
import DefaultImage from '../images/GIS.png'; // Импорт дефолтного изображения

const MediumStyleTravelPage = ({ data }) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl w-full mx-auto px-8 py-12 mt-10 mb-10 bg-white dark:bg-gray-200 border rounded-lg">
      {/* Заголовок */}
      {data.title && (
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-10 justify-center flex">
            {data.title}
          </h1>
          <div className="flex items-center space-x-4 text-gray-600">
            {data.author && (
              <div className="flex items-center space-x-2">
                {data.author.imageUrl ? (
                  <img
                    alt={data.author.name || t('Автор')}
                    src={data.author.imageUrl}
                    className="size-10 rounded-full bg-gray-50"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DefaultImage; // Подстановка дефолтного изображения
                    }}
                  />
                ) : (
                    <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    shape-rendering="geometricPrecision" 
                    text-rendering="geometricPrecision" 
                    image-rendering="optimizeQuality" 
                    fill-rule="evenodd" 
                    clip-rule="evenodd" 
                    viewBox="0 0 512 512"
                    className='w-10 h-10'
                    >
                      <path fill="#A7A9AE" fill-rule="nonzero" d="M256 0c68 0 132.89 26.95 180.96 75.04C485.05 122.99 512 188.11 512 256c0 68-26.95 132.89-75.04 180.96-23.49 23.56-51.72 42.58-83.15 55.6C323.59 505.08 290.54 512 256 512c-34.55 0-67.6-6.92-97.83-19.44l-.07-.03c-31.25-12.93-59.42-31.93-83.02-55.54l-.07-.07C26.9 388.82 0 324.03 0 256 0 116.78 112.74 0 256 0zm-52.73 332.87a67.668 67.668 0 01-5.6-6.74c-10.84-14.83-20.55-31.61-30.32-47.22-7.06-10.41-10.78-19.71-10.78-27.14 0-7.95 4.22-17.23 12.64-19.34-1.11-15.99-1.49-31.77-.74-48.88.37-4.08 1.12-8.17 2.23-12.27 4.84-17.1 16.73-30.86 31.61-40.15 5.2-3.35 10.78-5.94 17.1-8.18 10.78-4.09 5.57-20.45 17.48-20.82 27.88-.74 73.61 23.06 91.46 42.38 10.41 11.16 17.1 26.03 18.22 45.74l-1.12 44.03c5.2 1.49 8.55 4.84 10.04 10.04 1.49 5.95 0 14.13-5.2 25.67 0 .36-.38.36-.38.74-11.47 18.91-23.39 40.77-36.57 58.33-6.63 8.83-12.07 7.26-6.42 15.74 26.88 36.96 79.9 31.82 112.61 56.44 35.73-40.16 55.15-91.48 55.15-145.24 0-58.34-22.8-113.35-64.07-154.61v-.08C369.44 60.1 314.23 37.32 256 37.32 134.4 37.32 37.32 135.83 37.32 256c0 53.85 19.41 105.03 55.15 145.24 32.72-24.62 85.73-19.48 112.61-56.44 4.68-7.01 3.48-6.33-1.81-11.93z"/>
                      </svg>
                )}
                <span>{data.author.name || t('Автор неизвестен')}</span>
              </div>
            )}
            {data.date && (
              <>
                <span>•</span>
                <span>{data.date}</span>
              </>
            )}
            {data.tags &&
              data.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex"
                >
                  <Tag className="w-3 h-3 mt-1 mr-1" />
                  {tag}
                </span>
              ))}
          </div>
        </header>
      )}

      {/* Изображение */}
      <div className="mb-8">
        <img
          src={data.imageUrl || DefaultImage} // Использование дефолтного изображения при отсутствии URL
          alt={data.title || t('Изображение')}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DefaultImage; // Дефолтное изображение
          }}
          className="w-full h-[500px] object-cover rounded-lg shadow-md"
        />
      </div>

      {/* Описание */}
      {data.description && (
        <section className="prose lg:prose-xl text-gray-800 mb-8">
          <p className="text-xl text-gray-700 mb-6 leading-relaxed">
            {data.description}
          </p>
        </section>
      )}

      {/* Встроенная карта */}
      {data.mapUrl && (
        <section className="mb-8">
          <h2 className="flex text-2xl font-semibold text-gray-900 mt-8 mb-4">
            <Map className="mr-2 mt-1" />
            {t('Карта')}
          </h2>
          <div className="mt-8 rounded-lg overflow-hidden shadow-md">
            <iframe
              src={data.mapUrl}
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </section>
      )}

      {/* Таблица */}
      {data.tableData && data.tableData.length > 0 && (
        <section className="mb-8">
          <h2 className="flex text-2xl font-semibold text-gray-900 mt-8 mb-4">
            <Table className="mr-2 mt-1" />
            {t('Таблица')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  {Object.keys(data.tableData[0]).map((header) => (
                    <th key={header} className="px-6 py-3 border">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.tableData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {Object.values(row).map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 border">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Видео */}
      {data.videoUrl && (
        <section className="mb-8">
          <h2 className="flex text-2xl font-semibold text-gray-900 mt-8 mb-4">
            <Video className="mr-2 mt-1" />
            {t('Видео')}
          </h2>
          <iframe
            src={data.videoUrl}
            className="w-full h-[500px] rounded-lg shadow-md"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </section>
      )}

      {/* Секция комментариев */}
      <section className="relative mt-8">
        <CommentSection />
      </section>
    </div>
  );
};

export default MediumStyleTravelPage;
