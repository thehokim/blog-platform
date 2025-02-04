import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/instance";
import LikeButtonComRep from "./likeButtonComRep";
import Share from "./share";
import { useParams } from "react-router-dom";
import {
  Edit,
  Edit2,
  Reply,
  ReplyAll,
  ReplyIcon,
  Save,
  SendHorizonal,
  SendHorizontal,
  Trash2,
} from "lucide-react";
import LikeButton from "./likebutton";
import SaveButton from "./savebutton";
import { useTranslation } from "react-i18next"; // ✅ Импорт локализации

const CommentSection = ({ postId, userId }) => {
  const { t } = useTranslation(); // ✅ Используем локализацию
  const params = useParams();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingReply, setEditingReply] = useState(null);
  const [editedReplyContent, setEditedReplyContent] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false); // Добавляем состояние для ответов
  const visibleComments = 3; // Количество комментариев, отображаемых по умолчанию
  const visibleReplies = 2;

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/posts/${postId}/comments`);

      if (Array.isArray(response.data)) {
        setComments(response.data);
      } else {
        setComments([]);
      }
    } catch (error) {
      setComments([]); // Гарантируем, что `comments` не станет `undefined`
    }
  };

  const toggleComments = () => {
    setShowComments((prev) => !prev);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `${BASE_URL}/posts/${postId}/comments?user_id=${userId}`,
        { content: newComment }
      );

      if (Array.isArray(comments)) {
        setComments([...comments, response.data]);
      } else {
        setComments([response.data]); // Создаем новый массив, если `comments` не определен
      }

      setNewComment("");
    } catch (error) {
      console.error("Ошибка при отправке комментария:", error);
    }
  };

  const handleReplySubmit = async (commentId) => {
    if (!replyContent.trim()) return;

    try {
      const response = await axios.post(
        `${BASE_URL}/comments/${commentId}/replies?user_id=${userId}`,
        { content: replyContent }
      );
      fetchComments();
      setReplyingTo(null);
      setReplyContent("");
    } catch (error) {
      console.error("Ошибка при отправке ответа:", error);
    }
  };

  const handleEdit = (comment) => {
    setEditingComment(comment.id);
    setEditedContent(comment.content);
  };

  const handleEditSubmit = async (commentId) => {
    try {
      if (!postId || !commentId || !userId || !editedContent.trim()) {
        console.error("❌ Ошибка: Отсутствуют необходимые данные", {
          postId,
          commentId,
          userId,
          content: editedContent,
        });
        return;
      }

      console.log("📢 Отправка запроса на редактирование:", {
        url: `${BASE_URL}/posts/${postId}/comments/${commentId}?user_id=${userId}`,
        content: editedContent,
      });

      const response = await axios.put(
        `${BASE_URL}/posts/${postId}/comments/${commentId}?user_id=${userId}`,
        { content: editedContent }, // Тело запроса должно быть JSON
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Комментарий успешно обновлен:", response.data);

      setEditingComment(null);
      fetchComments(); // Перезагрузка комментариев
    } catch (error) {
      console.error(
        "❌ Ошибка при редактировании комментария:",
        error.response?.data || error
      );
    }
  };

  const handleEditReply = (reply) => {
    setEditingReply(reply.id);
    setEditedReplyContent(reply.Content);
  };

  const handleEditReplySubmit = async (commentId, replyId) => {
    try {
      if (!commentId || !replyId || !userId || !editedReplyContent.trim()) {
        console.error("❌ Ошибка: отсутствуют данные для редактирования", {
          commentId,
          replyId,
          userId,
          content: editedReplyContent,
        });
        return;
      }

      console.log("📢 Отправка запроса на редактирование ответа:", {
        url: `${BASE_URL}/comments/${commentId}/replies/${replyId}?user_id=${userId}`,
        content: editedReplyContent,
      });

      await axios.put(
        `${BASE_URL}/comments/${commentId}/replies/${replyId}?user_id=${userId}`,
        { content: editedReplyContent },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✅ Ответ успешно обновлен");
      setEditingReply(null);
      fetchComments(); // Перезагрузка комментариев
    } catch (error) {
      console.error(
        "❌ Ошибка при редактировании ответа:",
        error.response?.data || error
      );
    }
  };

  const handleDeleteReply = async (replyId, commentId) => {
    try {
      if (!replyId || !userId || !commentId) {
        console.error("❌ Ошибка: отсутствуют данные для удаления", {
          replyId,
          userId,
          commentId,
        });
        return;
      }

      console.log(`📢 Отправка запроса на удаление ответа ID: ${replyId}`);

      await axios.delete(
        `${BASE_URL}/comments/${commentId}/replies/${replyId}`,
        {
          params: { user_id: userId },
        }
      );

      console.log("✅ Ответ успешно удален");
      fetchComments(); // Перезагрузка комментариев
    } catch (error) {
      console.error(
        "❌ Ошибка при удалении ответа:",
        error.response?.data || error
      );
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`${BASE_URL}/posts/${postId}/comments/${commentId}`, {
        data: { user_id: userId },
      });
      fetchComments();
    } catch (error) {
      console.error("Ошибка при удалении комментария:", error);
    }
  };

  return (
    <div>
      <div className="flex gap-4">
        {/* SVG кнопка для открытия/закрытия комментариев */}
        <LikeButton postId={params?.id} />
        <button
          onClick={toggleComments}
          className="focus:outline-none transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 122.97 122.88"
            className="w-5 h-5 text-gray-600 hover:text-blue-600 transition duration-300"
          >
            <path d="M61.44,0a61.46,61.46,0,0,1,54.91,89l6.44,25.74a5.83,5.83,0,0,1-7.25,7L91.62,115A61.43,61.43,0,1,1,61.44,0ZM96.63,26.25a49.78,49.78,0,1,0-9,77.52A5.83,5.83,0,0,1,92.4,103L109,107.77l-4.5-18a5.86,5.86,0,0,1,.51-4.34,49.06,49.06,0,0,0,4.62-11.58,50,50,0,0,0-13-47.62Z" />
          </svg>
        </button>
        <SaveButton postId={params?.id} />
        <Share />
      </div>

      {showComments && (
        <div className="max-w-full mx-auto p-6 bg-white border border-px border-[#f1f1f3] rounded-lg mt-6">
          <form onSubmit={handleCommentSubmit} className="mb-6 flex">
            <textarea
              className="w-full focus:outline-none px-3 py-2 h-12 min-h-12 border border-px border-[#f1f1f3] rounded-l-lg"
              rows="3"
              placeholder={t("Напишите комментарий...")}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-12 p-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
            >
              <SendHorizonal />
            </button>
          </form>

          {/* Отображение комментариев */}
          <div className="space-y-6">
            {Array.isArray(comments) && comments.length > 0 ? (
              comments
                .slice(0, showAllComments ? comments.length : visibleComments)
                .map((comment) => {
                  const rawAvatar = comment.author?.imageUrl; // Аватар, который пришел с API

                  const authorAvatar = rawAvatar
                    ? rawAvatar.startsWith("http")
                      ? rawAvatar
                      : `${BASE_URL}${rawAvatar}` // ✅ Добавляем BASE_URL, если путь относительный
                    : "https://cdn-icons-png.flaticon.com/512/847/847969.png"; // Заглушка, если нет аватара

                  const authorName = comment.author?.name
                    ? `${comment.author?.name}`
                    : "Неизвестный автор";

                  const formattedDate = new Date(
                    comment.created_at
                  ).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={comment.id}
                      className="p-4 bg-[#f5f5fa] rounded-lg"
                    >
                      <div className="flex items-start">
                        {/* Аватар автора */}
                        <img
                          src={authorAvatar}
                          alt="Аватар"
                          onError={(e) => {
                            console.error(
                              "❌ Ошибка загрузки аватара:",
                              e.target.src
                            );
                            e.target.src =
                              "https://cdn-icons-png.flaticon.com/512/847/847969.png"; // Фолбэк
                          }}
                          className="w-10 h-10 rounded-full mr-3 border border-gray-300"
                        />

                        <div className="flex-1">
                          {/* Имя автора */}
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">
                              {authorName}
                            </span>
                            {/* Кнопки редактирования и удаления */}
                            <div className="flex justify-between items-center">
                              {/* Левая часть: кнопки редактирования и удаления (если пользователь автор) */}
                              <div className="flex space-x-3 mr-3">
                                {parseInt(comment.author_id) ===
                                  parseInt(userId) && (
                                  <>
                                    <span className="text-gray-500 mt-0.5 text-sm">
                                      {formattedDate}
                                    </span>

                                    <button
                                      onClick={() =>
                                        setEditingComment(
                                          editingComment === comment.id
                                            ? null
                                            : comment.id
                                        )
                                      }
                                      className="text-gray-500 hover:text-blue-600 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
                                    >
                                      <Edit2 className="w-5 h-5" />
                                    </button>

                                    <button
                                      onClick={() => handleDelete(comment.id)}
                                      className="text-gray-500 hover:text-red-500 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
                                    >
                                      <Trash2 className="w-6 h-5" />
                                    </button>
                                  </>
                                )}
                              </div>

                              {/* Правая часть: кнопка лайка (всегда отображается) */}
                              <LikeButtonComRep
                                id={comment.id}
                                type="comment"
                              />
                            </div>
                          </div>

                          {/* Поле редактирования комментария */}
                          {editingComment === comment.id ? (
                            <div className="mt-2 flex">
                              <textarea
                                className="focus:outline-none w-full min-h-12 h-12 py-2 px-3 border border-px border-[#f1f1f3] rounded-l-lg"
                                rows="2"
                                value={editedContent}
                                onChange={(e) =>
                                  setEditedContent(e.target.value)
                                }
                              />
                              <button
                                onClick={() => handleEditSubmit(comment.id)}
                                className="w-12 p-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition duration-300"
                              >
                                <Save />
                              </button>
                            </div>
                          ) : (
                            <p className="text-gray-700 whitespace-pre-wrap mt-1">
                              {comment.content}
                            </p>
                          )}

                          {/* Лайки и кнопка "Ответить" */}
                          <div className="flex items-center space-x-4 mt-2">
                            <button
                              onClick={() =>
                                setReplyingTo(
                                  replyingTo === comment.id ? null : comment.id
                                )
                              }
                              className="text-gray-500 flex transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:text-blue-600"
                            >
                              <ReplyAll className="w-4 h-4 mr-2 mt-1" />{" "}
                              {replyingTo === comment.id
                                ? t("Отмена")
                                : t("Ответить")}
                            </button>
                          </div>

                          {/* Поле ввода ответа */}
                          {replyingTo === comment.id && (
                            <div className="mt-2 flex">
                              <textarea
                                className="focus:outline-none w-full py-2 px-3 min-h-12 h-12 border border-px border-[#f1f1f3] rounded-l-lg"
                                rows="2"
                                placeholder="Ваш ответ..."
                                value={replyContent}
                                onChange={(e) =>
                                  setReplyContent(e.target.value)
                                }
                              />
                              <button
                                onClick={() => handleReplySubmit(comment.id)}
                                className="w-12 p-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition duration-300"
                              >
                                <SendHorizontal />
                              </button>
                            </div>
                          )}

                          {/* Отображение ответов */}
                          {comment.replies?.length > 0 && (
                            <div className="mt-4 space-y-3 border-l-2 border-blue-500 pl-4">
                              {(showAllReplies
                                ? comment.replies
                                : comment.replies.slice(0, visibleReplies)
                              ).map((reply) => {
                                const rawReplyAvatar = reply.author?.imageUrl; // Аватар, который пришел с API

                                const replyAvatar = rawReplyAvatar
                                  ? rawReplyAvatar.startsWith("http")
                                    ? rawReplyAvatar
                                    : `${BASE_URL}${rawReplyAvatar}` // ✅ Добавляем BASE_URL, если путь относительный
                                  : "https://cdn-icons-png.flaticon.com/512/847/847969.png"; // Заглушка, если нет аватара

                                const replyName =
                                  reply.author?.name || "Неизвестный автор";

                                const formattedReplyDate = new Date(
                                  reply.created_at
                                ).toLocaleDateString("ru-RU", {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });

                                return (
                                  <div
                                    key={reply.id}
                                    className="flex items-start"
                                  >
                                    <img
                                      src={replyAvatar}
                                      alt="Аватар"
                                      className="w-8 h-8 rounded-full mr-2 border border-gray-300"
                                      onError={(e) => {
                                        console.error(
                                          "❌ Ошибка загрузки аватара:",
                                          e.target.src
                                        );
                                        e.target.src =
                                          "https://cdn-icons-png.flaticon.com/512/847/847969.png"; // Подмена
                                      }}
                                    />

                                    <div className="flex-1">
                                      <span className="font-semibold text-gray-900">
                                        {replyName}
                                      </span>
                                      <p className="text-gray-700 mt-1">
                                        {reply.content}
                                      </p>

                                      <div className="flex items-center space-x-3 mt-2">
                                        <LikeButtonComRep
                                          id={reply.id}
                                          type="reply"
                                        />

                                        {reply?.author_id &&
                                          parseInt(reply.author_id) ===
                                            parseInt(userId) && (
                                            <div className="ml-2 flex space-x-3">
                                              <button
                                                onClick={() =>
                                                  setEditingReply(
                                                    editingReply === reply.id
                                                      ? null
                                                      : reply.id
                                                  )
                                                }
                                                className="text-gray-500 hover:text-blue-500 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
                                              >
                                                <Edit2 className="w-4 h-4" />
                                              </button>

                                              <button
                                                onClick={() =>
                                                  handleDeleteReply(
                                                    reply.id,
                                                    comment.id
                                                  )
                                                }
                                                className="text-gray-500 hover:text-red-500 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
                                              >
                                                <Trash2 className="w-5 h-4" />
                                              </button>
                                              <span className="text-gray-500 text-sm">
                                                {formattedReplyDate}
                                              </span>
                                            </div>
                                          )}
                                      </div>

                                      {/* Поле редактирования ответа */}
                                      {editingReply === reply.id && (
                                        <div className="mt-2 flex">
                                          <textarea
                                            className="focus:outline-none w-full py-2 px-3 h-12 min-h-12 border border-px border-[#f1f1f3] rounded-l-lg"
                                            rows="2"
                                            value={editedReplyContent}
                                            onChange={(e) =>
                                              setEditedReplyContent(
                                                e.target.value
                                              )
                                            }
                                          />
                                          <button
                                            onClick={() =>
                                              handleEditReplySubmit(
                                                comment.id,
                                                reply.id
                                              )
                                            }
                                            className="w-12 p-2 border border-px border-[#f1f1f3] bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition duration-300"
                                          >
                                            <Save />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {comment.replies.length > visibleReplies && (
                                <button
                                  onClick={() =>
                                    setShowAllReplies(!showAllReplies)
                                  }
                                  className="w-full mt-4 p-2 text-sm text-blue-600 hover:text-blue-800 transition duration-300"
                                >
                                  {showAllReplies
                                    ? t("Скрыть комментарии")
                                    : t("Показать ещё")}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-gray-500 text-center">
                Пока нет комментариев.
              </p>
            )}
          </div>
          <div>
            {comments.length > visibleComments && (
              <button
                onClick={() => setShowAllComments(!showAllComments)}
                className="w-full mt-4 p-2 text-sm text-blue-600 hover:text-blue-800 transition duration-300"
              >
                {showAllComments ? t("Скрыть комментарии") : t("Показать ещё")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
