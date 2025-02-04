import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ImageIcon,
  Map,
  Table,
  Tag,
  Video,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { BASE_URL } from "../utils/instance";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { MarkerF } from "@react-google-maps/api";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import CommentSection from "../components/CommentSection";
import CommentSectionOld from "../components/comment";

const MediumStyleTravelPage = ({ data }) => {
  const token = localStorage.getItem("token"); // Проверяем, есть ли токен
  const userId = localStorage.getItem("userId") || null;
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log("📥 Полученные данные:", data);
    console.log("Данные карт перед обработкой:", data.maps);
    console.log("Обработанные координаты:", markerPositions);
  }, [data.maps]);
  const { t } = useTranslation();
  const defaultCenter = { lat: 41.2995, lng: 69.2401 };

  // Обрабатываем теги
  const safeTags = Array.isArray(data.tags)
    ? data.tags.map((tag) => (tag.Name ? tag.Name : tag))
    : [];

  // Обрабатываем маркеры на карте
  const markerPositions =
    Array.isArray(data.maps) && data.maps.length > 0
      ? data.maps
          .filter(
            (point) =>
              typeof point.latitude === "number" &&
              typeof point.longitude === "number"
          )
          .map(({ latitude, longitude }) => ({
            lat: latitude,
            lng: longitude,
          }))
      : [];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formattedDate = data.date
    ? format(new Date(data.date), "d MMMM yyyy, HH:mm", { locale: ru })
    : t("Дата неизвестна");

  return (
    <div className="max-w-5xl w-full mx-auto px-8 py-12 mt-10 mb-10 bg-white dark:bg-gray-200 border border-px border-[#f1f1f3] rounded-lg">
      {/* Заголовок */}
      {data?.title && (
        <header className="mb-8">
          <h1 className="text-4xl tracking-wide font-light text-gray-800 mb-12 text-center leading-relaxed">
            {data.title}
          </h1>
          <div className="flex flex-wrap items-center space-x-4 text-gray-600">
            {data.author && (
              <div className="flex items-center space-x-2">
                {data.author?.imageUrl ? (
                  <img
                    alt={data.author?.name || "Author"}
                    src={
                      data.author.imageUrl.startsWith("http")
                        ? data.author.imageUrl
                        : `${BASE_URL}${data.author.imageUrl}`
                    }
                    className="size-16 -mt-1 mr-4 rounded-full bg-gray-50"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                    }}
                  />
                ) : (
                  <div className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                    <svg
                      className="absolute w-12 h-12 text-gray-400 -left-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                )}
                <span className="flex tracking-wide items-center gap-2 font-semibold text-gray-700 text-xl transition-all duration-300 hover:text-gray-900">
                  {data.author?.name || t("Автор неизвестен")}
                </span>
              </div>
            )}
            {data.date && (
              <span className="flex items-center gap-2 text-gray-500 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-4 h-4 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
                  />
                </svg>
                {formattedDate}
              </span>
            )}
            <div>
              {safeTags.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-6">
                  {safeTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex"
                    >
                      <Tag className="w-3 h-3 mt-1 mr-1" /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Теги */}
        </header>
      )}

      {/* Изображения */}
      {Array.isArray(data.images) && data.images.length > 0 && (
        <div>
          <h2 className="flex text-2xl font-semibold tracking-wide text-gray-900 mt-8 mb-4">
            <ImageIcon className="mr-2 mt-1" />
            {t("Image")}
          </h2>
          <div className="relative group">
            <Swiper
              spaceBetween={20}
              slidesPerView={1}
              navigation={{
                prevEl: ".swiper-button-prev",
                nextEl: ".swiper-button-next",
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              loop={true}
              autoplay={{
                delay: 10000,
                disableOnInteraction: false,
              }}
              modules={[Navigation, Pagination, Autoplay]}
              className="w-full max-w-[800px] mx-auto rounded-lg overflow-hidden" // Ограничиваем максимальную ширину
            >
              {data.images.map((img, index) => (
                <SwiperSlide key={index} className="relative">
                  <div className="relative w-full h-0 pb-[56.25%]">
                    {/* 16:9 соотношение сторон для адаптивности */}
                    <img
                      src={`${BASE_URL}${img.url}`}
                      alt={img.alt_text || data.title || t("Изображение")}
                      className="absolute top-0 left-0 w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </SwiperSlide>
              ))}

              {/* Custom Navigation Buttons */}
              <button className="swiper-button-prev absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center  transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"></button>
              <button className="swiper-button-next absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"></button>
            </Swiper>
          </div>
        </div>
      )}

      {/* Описание */}
      {data?.description && (
        <section className="relative group mt-4 max-w-5xl mx-auto bg-white p-6 rounded-lg border border-px border-[#f1f1f3]">
          <p className="text-lg text-gray-800 leading-relaxed break-words whitespace-pre-line">
            {data.description}
          </p>

          {/* Кнопка копирования (скрытая по умолчанию, появляется при наведении) */}
          <button
            onClick={() => copyToClipboard(data.description)}
            className="absolute top-4 right-4 flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium py-2 px-4 rounded-md transition-all active:scale-95 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 duration-300"
          >
            <Copy className="w-5 h-5" /> Copy
          </button>
        </section>
      )}

      {/* Карта */}
      {markerPositions.length > 0 && (
        <section className="mb-8">
          <h2 className="flex text-2xl font-semibold tracking-wide text-gray-900 mt-8 mb-4">
            <Map className="mr-2 mt-1" />
            {t("Карта")}
          </h2>
          <LoadScript
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            onLoad={() => setIsLoaded(true)}
          >
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{
                  width: "100%",
                  height: "400px",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                }}
                center={markerPositions[0] || defaultCenter}
                zoom={11}
              >
                {markerPositions.map((position, index) => (
                  <MarkerF key={index} position={position} />
                ))}
              </GoogleMap>
            )}
          </LoadScript>
        </section>
      )}

      {Array.isArray(data.tables) &&
        data.tables.length > 0 &&
        Array.isArray(data.tables[0].columns) &&
        data.tables[0].columns.length > 0 &&
        Array.isArray(data.tables[0].rows) &&
        data.tables[0].rows.some((row) =>
          Object.values(row).some((value) => value !== "")
        ) && (
          <section className="mb-8">
            <h2 className="flex text-2xl font-semibold tracking-wide text-gray-900 mt-8 mb-4">
              <Table className="mr-2 mt-1" />
              {t("Таблица")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-px border-[#f1f1f3] mb-6">
                <thead className="bg-[#fef5f5] text-gray-600">
                  <tr>
                    {data.tables[0].columns.map((col, colIndex) => (
                      <th key={colIndex} className="px-6 py-3 border">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.tables[0].rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b hover:bg-gray-50">
                      {data.tables[0].columns.map((col, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 border">
                          {row[col] ?? ""}
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
      {Array.isArray(data.videos) && data.videos.length > 0 && (
        <section className="mb-8">
          <h2 className="flex text-2xl tracking-wide font-semibold text-gray-900 mt-8 mb-4">
            <Video className="mr-2 mt-1" />
            {t("Видео")}
          </h2>
          <div className="flex flex-col gap-4">
            {data.videos.map((video, index) => {
              let embedUrl = video.url;

              // Автоматически заменяем YouTube-ссылки на embed-формат
              if (video.url.includes("youtube.com/watch")) {
                embedUrl = video.url.replace("watch?v=", "embed/");
              } else if (video.url.includes("youtu.be/")) {
                embedUrl = video.url.replace(
                  "youtu.be/",
                  "www.youtube.com/embed/"
                );
              }

              return (
                <iframe
                  key={index}
                  src={embedUrl}
                  className="w-full h-[500px] rounded-lg"
                  title={video.caption || `Video ${index + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={(e) => {
                    console.error("Ошибка загрузки видео:", embedUrl);
                    e.target.style.display = "none"; // Скрываем, если видео не загружается
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Комментарии */}
      {/* <section className="relative mt-8">
        {token ? (
          <CommentSectionOld
            commentsData={data.comments}
            currentUser={data.currentUser}
            postId={data.id}
            token={token}
            blogAuthor={data.author}
          />
        ) : (
          <p className="text-gray-500">бы оставить комментарий.</p>
        )}
      </section> */}

<section className="relative mt-8">
  {token ? (
    <CommentSection
      userId={userId} // ID текущего пользователя
      postId={data.id} // ID поста
      token={token}
      blogAuthorId={data.author.id} // ✅ Передаем ID автора поста
    />
  ) : (
    <p className="text-gray-500">Войдите, чтобы оставить комментарий.</p>
  )}
</section>
    </div>
  );
};

export default MediumStyleTravelPage;
