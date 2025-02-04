import { useState, useEffect } from "react";
import BlogCard from "../components/BlogCard";
import DvdScreenSave from "../components/dvdsave";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import savedb from "../images/savedb.png";
import { useTranslation } from "react-i18next";
import { BASE_URL } from "../utils/instance";

const Saved = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
          console.error("❌ Токен или userId отсутствует");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${BASE_URL}/posts/saved-blogs?user_id=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`⚠️ Ошибка загрузки: ${response.status}`);
        }

        const data = await response.json();
        console.log("📢 Данные с сервера (до форматирования):", data);

        // Форматирование даты и изображений
        const formattedPosts = data.map((item) => {
          console.log("🔍 Исходные данные из API:", item);
          let formattedDate = "Unknown Date";
          if (item.date && typeof item.date === "string") {
            try {
              const parsedDate = new Date(item.date);
              if (!isNaN(parsedDate.getTime())) {
                formattedDate = new Intl.DateTimeFormat("ru-RU", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(parsedDate);
              } else {
                console.warn("⚠️ Некорректная дата:", item.date);
              }
            } catch (error) {
              console.error("❌ Ошибка парсинга даты:", item.date, error);
            }
          }

          const images = Array.isArray(item.imageUrl)
            ? item.imageUrl.map((img) => ({
                url: img.startsWith("http") ? img : `${BASE_URL}${img}`,
              }))
            : [];

          console.log("✅ Сформированные images для всех страниц:", images);

          return {
            id: item.post_id || item.id,
            title:
              item.title?.length > 50
                ? item.title.slice(0, 50) + "..."
                : item.title || "Unknown Title",
            images: images,
            description: item.description || "No description available",
            date: formattedDate,
            author: {
              name: item.author?.name || "Unknown Author",
              imageUrl: item.author?.imageUrl
                ? item.author.imageUrl.startsWith("http")
                  ? item.author.imageUrl
                  : `${BASE_URL}${item.author.imageUrl}`
                : null,
            },
            tags: item.tags || [],
            post_id: item.post_id || item.id,
          };
        });

        setPosts(formattedPosts);
      } catch (error) {
        console.error("❌ Ошибка при загрузке сохраненных блогов:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <svg
          className="animate-spin h-10 w-10 text-gray-700"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      </div>
    );
  }

  // Если постов нет — показываем компонент DvdScreenSave
  const content = posts.length > 0 ? (
    posts.map((post) => <BlogCard key={post.id} post={post} />)
  ) : (
    <div className="flex w-screen -ml-24 -mt-28 justify-center">
      <DvdScreenSave />
    </div>
  );

  return (
    <div className="bg-white">
      <Navbar />
      <div className="bg-white pb-24">
        <div className="relative w-screen">
          <img
            src={savedb}
            alt="Background"
            className="w-full h-64 object-cover -mb-16"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gray-900 opacity-35" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
            <h1 className="text-4xl font-bold">{t("Сохраненные блоги")}</h1>
          </div>
        </div>
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-16 gap-y-16 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:px-24 px-6">
          {content}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Saved;
