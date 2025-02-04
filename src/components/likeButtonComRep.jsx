import React, { useState, useEffect } from "react";
import { BASE_URL } from "../utils/instance";

const LikeButtonComRep = ({ id, type }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Загружаем сохраненные лайки из localStorage при монтировании
  useEffect(() => {
    const storedLikes = JSON.parse(localStorage.getItem("likedPosts")) || {};
    if (storedLikes[id]) {
      setIsLiked(storedLikes[id].isLiked);
      setLikeCount(storedLikes[id].likeCount);
    }
  }, [id]);

  useEffect(() => {
    const fetchLikeData = async () => {
      try {
        if (!id) {
          console.warn("⚠ `id` отсутствует, запрос не выполнен.");
          return;
        }

        console.log(`🔍 Запрос лайков для: ${type} (ID: ${id})`);

        const token = localStorage.getItem("token");
        let userId = localStorage.getItem("userId");

        if (!token || !userId) {
          console.error("❌ Токен или userId отсутствует.");
          return;
        }

        userId = parseInt(userId, 10);
        if (isNaN(userId)) {
          console.error("❌ Ошибка: `userId` имеет неверный формат.");
          return;
        }

        let url = type === "comment"
          ? `${BASE_URL}/comments/${id}/like?user_id=${userId}`
          : `${BASE_URL}/replies/${id}/likes?user_id=${userId}`;

        const response = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          console.warn(`⚠ Ошибка ${response.status}: запись не найдена.`);
          return;
        }

        const data = await response.json();
        console.log("📌 Данные с сервера:", data);

        // Выбираем правильные поля для комментария и ответа
        const likedStatus = type === "comment" ? data.is_liked : data.isReplyLiked;
        const count = type === "comment" ? data.like_count || 0 : data.likes || 0;

        if (typeof count === "number" && typeof likedStatus === "boolean") {
          setLikeCount(count);
          setIsLiked(likedStatus);

          // Сохраняем в localStorage
          const storedLikes = JSON.parse(localStorage.getItem("likedPosts")) || {};
          storedLikes[id] = { isLiked: likedStatus, likeCount: count };
          localStorage.setItem("likedPosts", JSON.stringify(storedLikes));
        } else {
          console.error("❌ Некорректный формат данных:", data);
        }

      } catch (error) {
        console.error("❌ Ошибка при получении лайков:", error);
      }
    };

    fetchLikeData();
  }, [id, type]);

  const handleLikeClick = async () => {
    try {
      if (!id) {
        console.warn("⚠ `id` отсутствует, лайк не выполнен.");
        return;
      }

      console.log(`🔍 Обновление лайка для: ${type} (ID: ${id})`);

      const token = localStorage.getItem("token");
      let userId = localStorage.getItem("userId");

      if (!token || !userId) {
        console.error("❌ Токен или userId отсутствует.");
        return;
      }

      userId = parseInt(userId, 10);
      if (isNaN(userId)) {
        console.error("❌ Ошибка: `userId` имеет неверный формат.");
        return;
      }

      let url = type === "comment"
        ? `${BASE_URL}/comments/${id}/like?user_id=${userId}`
        : `${BASE_URL}/replies/${id}/like?user_id=${userId}`;

      const method = isLiked ? "DELETE" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 409) {
        console.warn("⚠ Лайк уже существует, обновляем статус.");
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      } else if (!response.ok) {
        console.error(`❌ Ошибка сервера: ${response.status}`);
        return;
      } else {
        setIsLiked(!isLiked);
        setLikeCount(prev => (isLiked ? Math.max(0, prev - 1) : prev + 1));
      }

      // Обновляем localStorage
      const storedLikes = JSON.parse(localStorage.getItem("likedPosts")) || {};
      storedLikes[id] = { isLiked: !isLiked, likeCount: isLiked ? Math.max(0, likeCount - 1) : likeCount + 1 };
      localStorage.setItem("likedPosts", JSON.stringify(storedLikes));

    } catch (error) {
      console.error("❌ Ошибка обновления лайка:", error);
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
          stroke="gray"
          strokeWidth="1"
          className="w-5 h-5 transition-all duration-300 ease-in-out hover:fill-red-600 transform hover:-translate-y-0.5"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
      <span>{likeCount}</span>
    </div>
  ); 
};

export default LikeButtonComRep;
