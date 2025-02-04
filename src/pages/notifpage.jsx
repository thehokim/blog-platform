import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import notif from "../images/notif.png";
import { useTranslation } from "react-i18next";
import DvdScreenNotif from "../components/dvdnotif";
import { BASE_URL } from "../utils/instance";

const NotificationsPage = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Состояние для показа всех уведомлений (кнопка "Показать все / Скрыть уведомления")
  const [showAll, setShowAll] = useState(false);
  const currentUserId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUserId) {
        console.error("❌ Ошибка: userId отсутствует в localStorage");
        return;
      }
      try {
        const response = await fetch(
          `${BASE_URL}/notifications?userId=${currentUserId}`
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ошибка ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log("Данные с сервера:", data);
        // Сортируем уведомления по дате (новейшие в начале)
        const sortedData = data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        // Если уведомлений больше 50, оставляем только первые 50 (новейшие)
        const limitedData =
          sortedData.length > 50 ? sortedData.slice(0, 50) : sortedData;
        setNotifications(limitedData);
      } catch (err) {
        console.error("❌ Ошибка при загрузке уведомлений:", err);
        setError(t("Ошибка при загрузке уведомлений."));
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUserId, t]);

  // Функция для определения текста уведомления и содержимого в зависимости от его типа
  const getNotificationDetails = (notification) => {
    let typeText = "";
    let contentText = "";

    switch (notification.type) {
      case "comment":
        typeText = t("прокомментировал ваш пост:");
        contentText =
          notification.comment_content || t("Комментарий отсутствует");
        break;
      case "reply":
        typeText = t("ответил на ваш комментарий:");
        contentText = notification.reply_content || t("Ответ отсутствует");
        break;
      case "like_post":
        typeText = t("поставил лайк вашему посту:");
        break;
      case "like_reply":
        typeText = t("поставил лайк на ваш ответ:");
        contentText = notification.reply_content || t("Ответ отсутствует");
        break;
      case "like_comment":
        typeText = t("поставил лайк на ваш комментарий:");
        contentText =
          notification.comment_content || t("Комментарий отсутствует");
        break;
      default:
        typeText = notification.message || "";
        break;
    }
    return { typeText, contentText };
  };

  // Если не показываем все уведомления, отображаем только первые 6
  const displayedNotifications = showAll
    ? notifications
    : notifications.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <div className="bg-white dark:bg-gray-800 pb-24">
        {/* Герой с фоновым изображением */}
        <div className="relative w-full">
          <img
            src={notif}
            alt="Background"
            className="w-full h-72 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white">
              {t("Уведомлении")}
            </h1>
          </div>
        </div>

        <div className="container mx-auto p-4 sm:p-6 mt-20">
          {loading ? (
            <div className="min-h-screen flex justify-center items-center">
              <svg
                className="animate-spin h-10 w-10 text-gray-700 dark:text-gray-300"
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
          ) : error ? (
            <div className="text-center text-red-500 text-lg">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="flex justify-center">
              <DvdScreenNotif />
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {displayedNotifications.map((notification) => {
                  const { typeText, contentText } =
                    getNotificationDetails(notification);
                  const author = notification.author;
                  const avatarUrl =
                    author?.imageUrl && !author.imageUrl.includes("undefined")
                      ? author.imageUrl.startsWith("http")
                        ? author.imageUrl
                        : `${BASE_URL}${author.imageUrl}`
                      : "https://cdn-icons-png.flaticon.com/512/847/847969.png";

                  return (
                    <div
                      key={notification.id}
                      className="p-6 bg-[#f7f7fc] dark:bg-gray-700 rounded-lg border border-[#f1f1f3] dark:border-gray-600 transition transform "
                    >
                      <div className="flex items-center">
                        {/* Левая часть: все элементы уведомления */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={avatarUrl}
                            alt={author?.name || t("Пользователь")}
                            className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                            }}
                          />
                          <span className="font-semibold whitespace-nowrap">
                            {author?.name || t("Неизвестный пользователь")}
                          </span>
                          <span className="text-gray-600 whitespace-nowrap">
                            {typeText}
                          </span>
                          {contentText && (
                            <span className="font-bold whitespace-nowrap">
                              "{contentText}"
                            </span>
                          )}
                          {notification.post_title && (
                            <span className="text-gray-500 whitespace-nowrap font-mono">
                              {t("Пост:")}{" "}
                              <strong>{notification.post_title}</strong>
                            </span>
                          )}
                        </div>
                        {/* Правая часть: время уведомления */}
                        <div className="ml-auto">
                          <span className="text-gray-500 text-xs whitespace-nowrap">
                            {new Date(notification.created_at).toLocaleString(
                              "ru-RU",
                              {
                                year: "numeric",
                                month: "numeric",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {notifications.length > 6 && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="px-2 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                  >
                    {showAll ? (
                      // Стрелка вверх
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    ) : (
                      // Стрелка вниз
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
