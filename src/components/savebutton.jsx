import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../utils/instance';

const SaveButton = ({ postId }) => {
  const [isSaved, setIsSaved] = useState(false);

  // Проверяем статус сохранения поста при загрузке компонента
  useEffect(() => {
    const fetchSaveStatus = async () => {
      try {
        const token = localStorage.getItem('token'); // Получаем токен из localStorage
        const userId = localStorage.getItem('userId'); // Получаем userId

        if (!token || !userId) {
          console.error('Токен или userId отсутствует');
          return;
        }
        // http://192.168.20.29:8080/posts/saved-blogs?user_id=56
        // Проверяем статус сохранения поста
        const response = await fetch(`${BASE_URL}/posts/${postId}/save-status?user_id=${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Добавляем токен
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setIsSaved(false); // Если пост не найден в сохранённых
            return;
          }
          throw new Error(`Ошибка получения статуса сохранения: ${response.status}`);
        }

        const data = await response.json();
        setIsSaved(data.isSaved); // Устанавливаем статус на основе поля isSaved
      } catch (error) {
        console.error('Ошибка получения статуса сохранения:', error);
      }
    };

    fetchSaveStatus();
  }, [postId]);

  // Обработка клика на кнопку "Сохранить"
  const handleSaveClick = async () => {
    try {
      const token = localStorage.getItem('token'); // Получаем токен
      const userId = localStorage.getItem('userId'); // Получаем userId

      if (!token || !userId) {
        console.error('Токен или userId отсутствует');
        return;
      }

      const method = isSaved ? 'DELETE' : 'POST'; // Выбираем метод запроса
      const url = `${BASE_URL}/posts/${postId}/save?user_id=${userId}`; // URL с user_id

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Добавляем токен
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка сервера:', errorText);
        throw new Error(`Ошибка обновления статуса сохранения: ${response.status} - ${errorText}`);
      }

      setIsSaved(!isSaved); // Переключаем статус
    } catch (error) {
      console.error('Ошибка обновления статуса сохранения:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSaveClick}
      className="transition-transform duration-300 ease-in-out transform active:scale-110"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={isSaved ? 'black' : '#fff'}
        stroke="black"
        strokeWidth="2"
        className="w-6 h-6 transition-all duration-300 ease-in-out hover:fill-black transform hover:-translate-y-0.5"
      >
        <path d="M6 2a2 2 0 0 0-2 2v18l8-4 8 4V4a2 2 0 0 0-2-2H6z" />
      </svg>
    </button>
  );
};

export default SaveButton;
