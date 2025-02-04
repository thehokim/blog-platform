import React, { useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import backgroundImage from "../images/background.png";
import SearchDropdown from "./searchDropDown";
import BlogCard from "./BlogCard";
import { useTranslation } from "react-i18next";
import { BASE_URL } from "../utils/instance";

const Blogs = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]); // текущие посты
  const [allPosts, setAllPosts] = useState([]); // все посты для сброса
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const authToken = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/posts`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const postsData = Array.isArray(data) ? data : [];
        setPosts(postsData);
        setAllPosts(postsData);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [authToken]);

  // Скелетоны для загрузки
  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="relative max-w-4xl flex-col items-start justify-between bg-gray-50 rounded-lg h-full p-6"
      >
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
          <div className="flex flex-col gap-y-1 text-sm">
            <Skeleton width={100} height={16} />
            <Skeleton width={150} height={16} />
          </div>
        </div>
      </div>
    ));
  };

  // Гарантируем, что для рендера используем массив
  const safePosts = Array.isArray(posts) ? posts : [];

  return (
    <div className="bg-white min-h-[calc(100vh-309px)] pb-24">
      <div className="relative">
        <img
          src={backgroundImage}
          alt="Background"
          className="w-full h-64 object-cover -mb-16"
        />
        {/* Оверлей для затемнения */}
        <div className="absolute top-0 left-0 w-full h-full bg-gray-900 opacity-50" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
          <h1 className="text-4xl font-bold">{t("Блоги")}</h1>
          <p className="text-lg mt-2">
            {t("Исследуйте и учитесь с нашими экспертами")}
          </p>
        </div>
      </div>

      {/* Передаём setPosts в SearchDropdown */}
      <SearchDropdown setPosts={setPosts} allPosts={allPosts} />

      <div className="mx-auto max-w-screen-2xl lg:px-8">
        {loading && (
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-16 gap-y-16 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            {renderSkeletons()}
          </div>
        )}
        {error && (
          <div className="text-center py-10 text-red-600">
            <p>
              {t("Ошибка загрузки данных")}: {error}
            </p>
          </div>
        )}
        {!loading && !error && safePosts.length === 0 && (
          <div className="text-center py-10">
            <p>{t("Блоги не найдены")}</p>
          </div>
        )}
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-x-16 gap-y-16 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-48 xl:gap-x-64">
          {safePosts.map((post) => (
            <BlogCard key={post.id} post={post} authToken={authToken} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blogs;
