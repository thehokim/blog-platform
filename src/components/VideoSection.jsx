import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const VideoSection = ({ videoUrl, onChange }) => {
  const { t } = useTranslation();
  const [inputUrl, setInputUrl] = useState(videoUrl || ""); // Локальное состояние для ввода
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [embedUrl, setEmbedUrl] = useState(videoUrl || ""); // Сохранение embed-ссылки

  const getEmbedUrl = (url) => {
    try {
      if (!url) return null; // Если пустая строка - возвращаем null

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("youtu.be")) {
          videoId = url.split("/").pop().split("?")[0];
        } else {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get("v");
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (url.includes("vimeo.com")) {
        const videoId = url.split("/").pop();
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
      }

      if (url.includes("instagram.com")) {
        const postId = url.split("/p/")[1]?.split("/")[0];
        return postId ? `https://www.instagram.com/p/${postId}/embed` : null;
      }

      if (url.includes("t.me")) {
        const parts = url.split("t.me/")[1];
        return parts ? `https://t.me/${parts}` : null;
      }

      if (url.includes("twitter.com")) {
        return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
      }

      if (url.includes("facebook.com")) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
          url
        )}`;
      }

      return null; // Если URL не соответствует известным платформам
    } catch (error) {
      console.error("Invalid URL:", url);
      return null;
    }
  };

  const handleInputChange = (e) => {
    const url = e.target.value.trim(); // Удаляем пробелы
    setInputUrl(url); // Обновляем локальное состояние ввода

    const embed = getEmbedUrl(url);
    setEmbedUrl(embed); // Обновляем ссылку для iframe
    setIsVideoLoaded(!!embed); // Проверяем, загрузилось ли видео

    if (onChange) {
      onChange(embed); // Передаем embed URL в родительский компонент
    }
  };

  return (
    <div className="dark:bg-gray-800 bg-white p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-600">
      <div className="mb-4">
        <input
          type="text"
          placeholder={t("Enter VideoLink")}
          className="border-none py-2 px-4 w-full rounded dark:bg-gray-700 bg-gray-50 dark:text-gray-200 text-gray-700 dark:hover:bg-gray-800 focus:outline-none"
          value={inputUrl}
          onChange={handleInputChange}
        />
      </div>

      {isVideoLoaded ? (
        <div className="flex flex-col items-center">
          <iframe
            className="w-full rounded shadow"
            height="300"
            src={embedUrl}
            title="Video Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 border border-px border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
          <p className="text-gray-500 px-4 dark:text-gray-400 text-center">
            {t("InvalidURLMessage")}
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoSection;
