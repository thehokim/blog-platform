import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import LikeButton from "./likebutton";
import SaveButton from "./savebutton";
import Share from "./share";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/instance";
import { Tag } from "lucide-react";

const BlogCard = ({ post, authToken }) => {
  const navigate = useNavigate();
  // Если данных пока нет, показываем скелетоны
  if (!post) {
    return (
      <article className="relative max-w-2xl flex-col items-start justify-between dark:bg-gray-300 bg-gray-50 rounded-lg h-full p-6">
        <div className="flex items-center gap-x-4 text-xs">
          <Skeleton width={80} height={16} />
          <Skeleton width={100} height={20} />
        </div>

        <div className="flex items-center mt-3">
          <Skeleton width={120} height={120} className="mr-6 rounded-lg" />
          <div className="flex flex-col gap-y-2">
            <Skeleton width={200} height={20} />
            <Skeleton width={250} height={16} count={3} />
          </div>
        </div>

        <div className="relative mt-8 flex items-center gap-x-4">
          <Skeleton circle={true} height={40} width={40} />
          <div className="text-sm/6 flex flex-col gap-y-1">
            <Skeleton width={100} height={16} />
            <Skeleton width={150} height={16} />
          </div>
        </div>
      </article>
    );
  }

  // Функция перехода на страницу поста
  const handleNavigateToPost = () => {
    navigate(`/content/${post.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Дата неизвестна";

    let parsedDate;

    // Если формат ISO с пробелом, заменяем пробел на T
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
      parsedDate = new Date(dateString.replace(" ", "T"));
    }
    // Если формат DD.MM.YYYY, HH:MM
    else if (/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/.test(dateString)) {
      const [datePart, timePart] = dateString.split(", ");
      const [day, month, year] = datePart.split(".");
      parsedDate = new Date(`${year}-${month}-${day}T${timePart}`);
    }
    // Если уже валидный ISO
    else {
      parsedDate = new Date(dateString);
    }

    return !isNaN(parsedDate.getTime())
      ? new Intl.DateTimeFormat("ru-RU", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(parsedDate)
      : "Дата неизвестна";
  };

  return (
    <article className="relative max-w-2xl flex flex-col items-start justify-between transition-all duration-200 ease-in-out transform border border-px border-[#f1f1f3]  dark:bg-gray-300 bg-white rounded-lg p-6">
      {/* Дата и теги */}
      <div className="flex items-center justify-between w-full text-xs text-gray-500 dark:text-gray-700">
        <time dateTime={post.date}>
          {post.date ? formatDate(post.date) : "Дата неизвестна"}
        </time>

        <div className="flex flex-wrap gap-1">
          {Array.isArray(post.tags) &&
            post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag.Name}
              </span>
            ))}
        </div>
      </div>

      {/* Контент */}
      <div className="flex w-full mt-3">
        {/* Изображение поста */}
        <div className="w-1/3">
        {Array.isArray(post.images) && post.images.length > 0 ? (
  <div className="w-full h-48 relative overflow-hidden rounded-lg bg-gray-100">
    <img
      alt={post.title}
      src={
        post.images[0]?.url.startsWith("http")
          ? post.images[0]?.url
          : `${BASE_URL}${post.images[0]?.url}`
      }
      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
      onClick={handleNavigateToPost}
      onError={(e) => {
        console.error("❌ Ошибка загрузки изображения:", e.target.src);
        e.target.src = "/placeholder.png"; // Заглушка, если картинка не загружается
      }}
    />
  </div>
          ) : (
            <svg
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              viewBox="0 0 122.88 122.14"
              className="fill-gray-400 w-full h-36"
            >
              <g>
                <path d="M8.69,0h105.5c2.39,0,4.57,0.98,6.14,2.55c1.57,1.57,2.55,3.75,2.55,6.14v104.76c0,2.39-0.98,4.57-2.55,6.14 c-1.57,1.57-3.75,2.55-6.14,2.55H8.69c-2.39,0-4.57-0.98-6.14-2.55C0.98,118.02,0,115.84,0,113.45V8.69C0,6.3,0.98,4.12,2.55,2.55 C4.12,0.98,6.3,0,8.69,0L8.69,0z M7.02,88.3l37.51-33.89c1.43-1.29,3.64-1.18,4.93,0.25c0.03,0.03,0.05,0.06,0.08,0.09l0.01-0.01 l31.45,37.22l4.82-29.59c0.31-1.91,2.11-3.2,4.02-2.89c0.75,0.12,1.4,0.47,1.9,0.96l24.15,23.18V8.69c0-0.46-0.19-0.87-0.49-1.18 c-0.3-0.3-0.72-0.49-1.18-0.49H8.69c-0.46,0-0.87,0.19-1.18,0.49c-0.3,0.3-0.49,0.72-0.49,1.18V88.3L7.02,88.3z M115.86,93.32 L91.64,70.07l-4.95,30.41c-0.11,0.83-0.52,1.63-1.21,2.22c-1.48,1.25-3.68,1.06-4.93-0.41L46.52,62.02L7.02,97.72v15.73 c0,0.46,0.19,0.87,0.49,1.18c0.31,0.31,0.72,0.49,1.18,0.49h105.5c0.46,0,0.87-0.19,1.18-0.49c0.3-0.3,0.49-0.72,0.49-1.18V93.32 L115.86,93.32z M92.6,19.86c3.48,0,6.62,1.41,8.9,3.69c2.28,2.28,3.69,5.43,3.69,8.9s-1.41,6.62-3.69,8.9 c-2.28,2.28-5.43,3.69-8.9,3.69c-3.48,0-6.62-1.41-8.9-3.69c-2.28-2.28-3.69-5.43-3.69-8.9s1.41-6.62,3.69-8.9 C85.98,21.27,89.12,19.86,92.6,19.86L92.6,19.86z M97.58,27.47c-1.27-1.27-3.03-2.06-4.98-2.06c-1.94,0-3.7,0.79-4.98,2.06 c-1.27,1.27-2.06,3.03-2.06,4.98c0,1.94,0.79,3.7,2.06,4.98c1.27,1.27,3.03,2.06,4.98,2.06c1.94,0,3.7-0.79,4.98-2.06 c1.27-1.27,2.06-3.03,2.06-4.98C99.64,30.51,98.85,28.75,97.58,27.47L97.58,27.47z" />
              </g>
            </svg>
          )}
        </div>

        {/* Текстовая информация */}
        <div className="w-2/3 pl-4 mt-8">
          <h3
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate cursor-pointer"
            onClick={handleNavigateToPost}
          >
            {post.title || "Untitled"}
          </h3>
          <p
            className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3 overflow-hidden text-ellipsis"
            onClick={handleNavigateToPost}
          >
            {typeof post.description === "string"
              ? post.description
              : JSON.stringify(post.description)}
          </p>
        </div>
      </div>

      {/* Автор и кнопки */}
      <div className="relative mt-5 flex items-center justify-between">
        <div className="flex items-center">
          {/* Аватар автора */}
          {post.author?.imageUrl ? (
            <img
              alt={post.author?.name || "Author"}
              src={
                post.author.imageUrl.startsWith("http")
                  ? post.author.imageUrl
                  : `${BASE_URL}${post.author.imageUrl}`
              }
              className="size-10 rounded-full bg-gray-50"
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

          {/* Имя автора */}
          <div className="ml-3 text-sm">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {post.author?.name || "Unknown Author"}
            </p>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex ml-5 items-center space-x-4">
          <LikeButton postId={post.id} authToken={authToken} />
          <SaveButton postId={post.id} />
          <Share postUrl={`/content/${post.id}`} />
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
