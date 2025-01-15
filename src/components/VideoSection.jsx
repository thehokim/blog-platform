import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const VideoSection = ({ videoUrl, onChange }) => {
  const { t } = useTranslation();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const getEmbedUrl = (url) => {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // YouTube
        let videoId = '';
        if (url.includes('youtu.be')) {
          videoId = url.split('/').pop().split('?')[0];
        } else {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v');
        }
        return `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes('vimeo.com')) {
        // Vimeo
        const videoId = url.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}`;
      } else if (url.includes('instagram.com')) {
        // Instagram
        const postId = url.split('/p/')[1]?.split('/')[0];
        if (postId) {
          return `https://www.instagram.com/p/${postId}/embed`;
        }
      } else if (url.includes('t.me')) {
        // Telegram
        const parts = url.split('t.me/')[1];
        if (parts) {
          return `https://t.me/${parts}`;
        }
      } else if (url.includes('twitter.com')) {
        // Twitter
        return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
      } else if (url.includes('facebook.com')) {
        // Facebook
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
      }
    } catch (error) {
      console.error('Invalid URL:', url);
      return null;
    }
    return null;
  };
  

  const handleInputChange = (e) => {
    const url = e.target.value.trim(); // Удаляем лишние пробелы
    const embedUrl = getEmbedUrl(url);

    if (onChange) {
      onChange(embedUrl); // Передаем только embed URL
    }

    setIsVideoLoaded(!!embedUrl); // Устанавливаем состояние загрузки видео
  };

  return (
    <div className="dark:bg-gray-800 bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-md">
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('Enter VideoLink')}
          className="border-none py-2 px-4 w-full rounded dark:bg-gray-700 bg-gray-50 dark:text-gray-200 text-gray-700 dark:hover:bg-gray-800 focus:outline-none"
          value={videoUrl || ''}
          onChange={handleInputChange}
        />
      </div>
      {isVideoLoaded ? (
        <div className="flex flex-col items-center">
          <iframe
            className="w-full rounded shadow"
            height="300"
            src={videoUrl}
            title="Video Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 border border-px border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
        <p className="text-gray-500 px-4 dark:text-gray-400 text-center">
          {t('InvalidURLMessage')}
        </p>
      </div>
      )}
    </div>
  );
};

export default VideoSection;
