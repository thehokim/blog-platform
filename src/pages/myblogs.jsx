import { useState, useEffect } from "react";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import BlogCard from "../components/BlogCard";
import myb from "../images/myb.png";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import DvdScreenSaver from "../components/dvd";
import { BASE_URL } from "../utils/instance";

function MyBlogs() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  // Функция загрузки блогов
  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Токен отсутствует. Пользователь не аутентифицирован.");
      }

      const response = await fetch(`${BASE_URL}/posts/myblogs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Ошибка аутентификации. Пожалуйста, войдите заново.");
        }
        throw new Error(`Ошибка при загрузке блогов: ${response.status}`);
      }

      const data = await response.json();
      console.log("Ответ API:", data);

      if (!Array.isArray(data)) {
        throw new Error("Некорректный формат данных от сервера.");
      }

      const userId = localStorage.getItem("userId");
      console.log("Текущий userId:", userId);

      if (!userId) {
        throw new Error("Не найден userId в localStorage.");
      }

      // Форматируем посты
      const formattedPosts = data.map((item) => {
        console.log("🔍 Исходные данные из API:", item);

        // Универсальная обработка даты
        let formattedDate = "Unknown Date";
        const rawDate = item.date || item.Date || item.updated_at;
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

        // Универсальная обработка изображений
        const images = Array.isArray(item.Images)
          ? item.Images.map((img) => ({
              url: img.url.startsWith("http") ? img.url : `${BASE_URL}${img.url}`,
            }))
          : [];

        console.log("✅ Сформированные images для 'Мои блоги':", images);

        return {
          id: item.ID || item.id || item.post_id,
          title:
            item.title?.length > 50
              ? item.title.slice(0, 50) + "..."
              : item.title || "Unknown Title",
          images: images,
          description: item.description || "No description available",
          date: formattedDate,
          author: {
            name: item.Author?.username || "Unknown Author",
            imageUrl: item.Author?.avatar
              ? item.Author.avatar.startsWith("http")
                ? item.Author.avatar
                : `${BASE_URL}${item.Author.avatar}`
              : `${BASE_URL}/default-avatar.png`,
          },
          tags: item.Tags || [],
          post_id: item.ID || item.id || item.post_id,
        };
      });

      console.log("Formatted posts:", formattedPosts);
      setPosts(formattedPosts);
    } catch (error) {
      console.error("Ошибка:", error);
      Swal.fire("Ошибка", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Загружаем блоги при монтировании
  useEffect(() => {
    fetchPosts();
  }, []);

  // Функция удаления блога
  const deletePost = async (postId) => {
    const confirmation = await Swal.fire({
      title: "Вы действительно хотите удалить пост?",
      text: "Это действие нельзя отменить!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Да, удалить!",
      cancelButtonText: "Отмена",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log(`Удаление поста ${postId}, токен: ${token}`);

      if (!token) {
        throw new Error("Ошибка: Токен отсутствует");
      }

      const response = await fetch(`${BASE_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let responseData = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      console.log("Ответ сервера при удалении:", responseData);

      if (response.ok) {
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        Swal.fire("Удалено!", "Блог был успешно удалён.", "success");
      } else {
        throw new Error(
          `Ошибка при удалении поста: ${response.status}, ${responseData}`
        );
      }
    } catch (error) {
      console.error("Ошибка при удалении поста:", error);
      Swal.fire("Ошибка", "Не удалось удалить блог. " + error.message, "error");
    }
  };

  return (
    <div className="bg-white">
      <Navbar />
      <div className="bg-white pb-20 min-h-[calc(100vh-309px)]">
        <div className="relative max-w-screen">
          <img
            src={myb}
            alt="Background"
            className="w-full h-64 object-cover -mb-16"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gray-900 opacity-45" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
            <h1 className="text-4xl font-bold">{t("Мои блоги")}</h1>
          </div>
        </div>

        {posts.length > 0 ? (
          <div
          className="
            mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-16 gap-y-16 pt-10 
            sm:mt-16 sm:pt-16 
            lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:px-24 
            px-6 
            2k:gap-x-36 4k:gap-x-64
            2k:mx-auto 2k:max-w-screen-2k 
            4k:mx-auto 4k:max-w-screen-4k
          "
        >
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative max-w-2xl 2k:w-2xl 4k:w-2xl"
            >
              <BlogCard post={post} />
              <button
                className="
                  absolute -top-2 -right-2 h-7 w-7 bg-red-600 rounded-full 
                  transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out
                "
                onClick={() => deletePost(post.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 110.61 122.88"
                  className="
                    fill-gray-300 ml-1.5 w-4 h-4 
                    transition-all duration-300 ease-in-out hover:fill-black
                  "
                >
                  <path d="M39.27,58.64a4.74,4.74,0,1,1,9.47,0V93.72a4.74,4.74,0,1,1-9.47,0V58.64Zm63.6-19.86L98,103a22.29,22.29,0,0,1-6.33,14.1,19.41,19.41,0,0,1-13.88,5.78h-45a19.4,19.4,0,0,1-13.86-5.78l0,0A22.31,22.31,0,0,1,12.59,103L7.74,38.78H0V25c0-3.32,1.63-4.58,4.84-4.58H27.58V10.79A10.82,10.82,0,0,1,38.37,0H72.24A10.82,10.82,0,0,1,83,10.79v9.62h23.35a6.19,6.19,0,0,1,1,.06A3.86,3.86,0,0,1,110.59,24c0,.2,0,.38,0,.57V38.78Zm-9.5.17H17.24L22,102.3a12.82,12.82,0,0,0,3.57,8.1l0,0a10,10,0,0,0,7.19,3h45a10.06,10.06,0,0,0,7.19-3,12.8,12.8,0,0,0,3.59-8.1L93.37,39ZM71,20.41V12.05H39.64v8.36ZM61.87,58.64a4.74,4.74,0,1,1,9.47,0V93.72a4.74,4.74,0,1,1-9.47,0V58.64Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        

        ) : (
          <div>
            <DvdScreenSaver />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default MyBlogs;