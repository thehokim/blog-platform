import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { BASE_URL } from "../utils/instance";
import MediumStyleTravelPage from "./MediumStyleTravelPage";

const ContentPage = () => {
  const { id } = useParams(); // Получаем ID поста из URL
  const { t } = useTranslation();
  const [post, setPost] = useState(null); // Состояние для поста
  const [loading, setLoading] = useState(true); // Состояние загрузки
  const [error, setError] = useState(null); // Состояние ошибки

  useEffect(() => {
    if (!id) {
      console.error("Ошибка: ID поста не найден!");
      return;
    }

    setLoading(true);
    const fetchPost = async () => {
      try {
        const response = await fetch(`${BASE_URL}/posts/${id}`);
        if (!response.ok) {
          throw new Error(t("Ошибка загрузки поста") + `: ${response.status}`);
        }
        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(t("Ошибка при загрузке поста."));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, t]);

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

  return (
    <div>
      <Navbar />
      <div className="bg-gray-50 min-h-screen flex justify-center px-4 sm:px-6 lg:px-8">
        <MediumStyleTravelPage data={post} />
      </div>
      <Footer />
    </div>
  );
};

export default ContentPage;
