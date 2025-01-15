import React, { useState, useEffect } from "react";
import { BASE_URL } from "../utils/instance";

const LikeButton = ({ postId }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const fetchLikeData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
          console.error("Токен или userId отсутствует");
          return;
        }

        const response = await fetch(`${BASE_URL}/posts/${postId}/likes?user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Ошибка получения данных лайков: ${response.status}`);
        }

        const data = await response.json();

        // Проверяем, что сервер вернул ожидаемые поля
        if (typeof data.likes === "number" && typeof data.isLiked === "boolean") {
          setLikeCount(data.likes);
          setIsLiked(data.isLiked);
        } else {
          console.error("Некорректный формат данных от сервера:", data);
        }
      } catch (error) {
        console.error("Ошибка получения данных лайков:", error);
      }
    };

    fetchLikeData();
  }, [postId]);

  const handleLikeClick = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        console.error("Токен или userId отсутствует");
        return;
      }

      const method = isLiked ? "DELETE" : "POST";
      const url = `${BASE_URL}/posts/${postId}/like?user_id=${userId}`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка сервера:", errorText);
        throw new Error(`Ошибка обновления лайка: ${response.status} - ${errorText}`);
      }

      // Успешное обновление
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      console.error("Ошибка обновления статуса лайка:", error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={handleLikeClick}
        className="transition-transform duration-300 ease-in-out transform active:scale-110"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={isLiked ? "red" : "#fff"}
          stroke="black"
          strokeWidth="2"
          className="w-6 h-6 transition-all duration-300 ease-in-out hover:fill-red-600 transform hover:-translate-y-0.5"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
      <span>{likeCount}</span>
    </div>
  );
};

export default LikeButton;
