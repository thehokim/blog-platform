import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { BASE_URL } from '../utils/instance';
import MediumStyleTravelPage from './MediumStyleTravelPage';

const ContentPage = () => {
  const { id } = useParams(); // Получаем ID поста из URL
  const { t } = useTranslation();
  const [post, setPost] = useState(null); // Состояние для поста
  const [loading, setLoading] = useState(true); // Состояние загрузки
  const [error, setError] = useState(null); // Состояние ошибки

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/posts/${id}`);
        if (!response.ok) {
          throw new Error(t('Ошибка загрузки поста') + `: ${response.status}`);
        }
        const data = await response.json();
        setPost(data); // Сохраняем данные поста
      } catch (err) {
        setError(t('Ошибка при загрузке поста.'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, t]);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex justify-center items-center">
  //       <p className="text-lg text-gray-700">{t('Загрузка...')}</p>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-lg text-gray-700">{t('Пост не найден')}</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="bg-gray-50 dark:bg-gradient-to-br from-gray-200 via-gray-500 to-gray-700 min-h-screen flex justify-center">
        <MediumStyleTravelPage data={post} />
      </div>
      <Footer />
    </div>
  );
};

export default ContentPage;
