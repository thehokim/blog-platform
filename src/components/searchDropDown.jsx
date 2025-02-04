import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { BASE_URL } from "../utils/instance";

const SearchDropdown = ({ setPosts, allPosts }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
  
    if (!searchQuery.trim()) {
      console.warn("Поисковой запрос пуст, сбрасываем посты.");
      setPosts(allPosts); // Если запрос пуст — показываем все посты
      return;
    }
  
    const params = new URLSearchParams();
    params.append("search", searchQuery);
  
    const apiUrl = `${BASE_URL}/search?${params.toString()}`;
    console.log("Отправляем запрос:", apiUrl);
  
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
  
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
  
      let data = await response.json();
      console.log("🔍 Исходные данные поиска:", data);
  
      // Форматируем данные, чтобы соответствовали `saved`
      const formattedPosts = data.map((item) => {
        let formattedDate = "Unknown Date";
        const rawDate = item.date || item.Date || item.updated_at; // Используем доступное поле даты
      
        if (rawDate && typeof rawDate === "string") {
          try {
            const parsedDate = new Date(rawDate);
            if (!isNaN(parsedDate.getTime())) {
              formattedDate = new Intl.DateTimeFormat("ru-RU", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(parsedDate);
            } else {
              console.warn("⚠️ Некорректная дата:", rawDate);
            }
          } catch (error) {
            console.error("❌ Ошибка парсинга даты:", rawDate, error);
          }
        }
      
        console.log("✅ Отформатированная дата:", formattedDate);
      
        // ✅ Обрабатываем изображения (добавляем BASE_URL при необходимости)
        const images = Array.isArray(item.Images)
          ? item.Images.map((img) => ({
              url: img.url.startsWith("http") ? img.url : `${BASE_URL}${img.url}`,
            }))
          : [];
      
        // ✅ Обрабатываем автора (берем username и avatar)
        const author = {
          name: item.Author?.username || "Unknown Author",
          imageUrl: item.Author?.avatar
            ? item.Author.avatar.startsWith("http")
              ? item.Author.avatar
              : `${BASE_URL}${item.Author.avatar}`
            : "/default-avatar.png",
        };
      
        console.log("📌 Финальный объект поста:", {
          id: item.ID || item.id,
          title: item.title?.length > 50 ? item.title.slice(0, 50) + "..." : item.title || "Unknown Title",
          images: images,
          description: item.description || "No description available",
          date: formattedDate,
          author: author,
          tags: item.Tags || [],
          post_id: item.ID || item.id,
        });
      
        return {
          id: item.ID || item.id,
          title: item.title?.length > 50 ? item.title.slice(0, 50) + "..." : item.title || "Unknown Title",
          images: images,
          description: item.description || "No description available",
          date: formattedDate,
          author: author,
          tags: item.Tags || [],
          post_id: item.ID || item.id,
        };
      });
      
      
      console.log("✅ Отформатированные посты для поиска:", formattedPosts);
      
  
      // Если данные найдены — обновляем state, иначе сбрасываем
      setPosts(formattedPosts.length > 0 ? formattedPosts : []);
    } catch (error) {
      console.error("Ошибка запроса:", error);
    }
  };
  

  return (
    <form className="max-w-lg mx-auto" onSubmit={handleSearchSubmit}>
      <div className="relative w-full">
        <input
          type="search"
          id="search-dropdown"
          className="block p-2.5 w-full z-20 focus:outline-none text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300"
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          required
        />
        <button
          type="submit"
          className="absolute top-0 end-0 p-2.5 text-sm font-medium h-full text-white bg-blue-700 rounded-r-lg border border-blue-700 hover:bg-blue-800"
        >
          <svg
            className="w-4 h-4"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default SearchDropdown;
