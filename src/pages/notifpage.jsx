import React, { useEffect, useState } from 'react';
import Navbar from '../components/navbar'; // Предполагаем, что у вас уже есть Navbar
import Footer from '../components/footer'; // И Footer
import notif from '../images/notif.png';
import { useTranslation } from 'react-i18next';
import { SaveAllIcon, SendHorizonal } from 'lucide-react';
import DvdScreenNotif from '../components/dvdnotif';
import { BASE_URL } from '../utils/instance';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);  // Состояние загрузки
  const [error, setError] = useState(null); 

  const [replyText, setReplyText] = useState('');
  const [editReplyText, setEditReplyText] = useState(''); // Для редактирования
  const [activeReplyId, setActiveReplyId] = useState(null); // ID для ответа
  const [editingReplyId, setEditingReplyId] = useState(null); // ID для редактирования
  const currentUser = t('Вы'); // Текущий пользователь
  const [showAllReplies, setShowAllReplies] = useState({});
  const MAX_REPLY_LENGTH = 100; // Максимальная длина текста для обрезки
  const [expandedReplies, setExpandedReplies] = useState({});
  const MAX_WORDS = 100; // Максимальное количество слов
  const CENSORED_WORDS = [
    'fuck',
    'shit',
    'damn',
    'bitch',
    'asshole',
    'bastard',
    'dick',
    'pussy',
    'cunt',
    'slut',
    'whore',
    'fag',
    'nigger',
    'nigga',
    'cock',
    'motherfucker',
    'bullshit',
    'crap',
    'hell',
    'suck',
    'twat',
    'jerk',
    'wanker',
    'prick',
    'arse',
    'bollocks',
    'bugger',
    'bloody',
    'jala',
    'jalab',
    'jalap',
    'dalbayop',
    'dalbayob',
    'yeban',
    'yiban',
    'yibansan',
    'yibanakansan',
    'dabba',
    'cort',
    'chort',
    'chortsan',
    'chortla',
    'blya',
    'zaebal',
    'zaybal',
    'pidr',
    'pidor',
    'pidoraz',
    'pidaraz',
    'pidaras',
    'pizdes',
    'pizdesu',
    'pizdeku',
    'yeblan',
    'uyeban',
    'qoto',
    'qotoq',
    'tasho',
    'tashoq',
    'bich',
    'bic',
    'kot',
    "ko't",
    'suka',
    'sucka',
    'suchka',
    'shluxa',
    'shlyuxa',
    'wluxa',
    'wlyuxa',
    'oneni ami',
    'qotagim',
    "qo'tagim",
    "qo'tag'im",
  ];

  useEffect(() => {
    // Функция для загрузки данных с бэкенда
    const fetchNotifications = async () => {
      setLoading(true);  // Включаем индикатор загрузки
      try {
        const response = await fetch(`${BASE_URL}/notifications`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(t('Ошибка при загрузке уведомлений.')); // Показываем сообщение об ошибке
      } finally {
        setLoading(false);  // Выключаем индикатор загрузки
      }
    };

    fetchNotifications();

    // Очистка состояния при размонтировании компонента
    return () => {
      setNotifications([]);
      setError(null);
    };
  }, []);  // Пустой массив зависимостей - запрос будет выполнен только один раз

  if (loading) {
    return <div>{t('Загрузка...')}</div>;  // Показываем индикатор загрузки
  }

  if (error) {
    return <div>{error}</div>;  // Показываем сообщение об ошибке
  }

  const censorText = (text) => {
    const regex = new RegExp(`\\b(${CENSORED_WORDS.join('|')})\\b`, 'giu');
    return text.replace(regex, '****');
  };

  // Подсчёт слов
  const countWords = (text) => {
    return text.trim().split(/\s+/).length;
  };

  const toggleReplyExpansion = (notificationId, replyId) => {
    const key = `${notificationId}-${replyId}`;
    setExpandedReplies((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Форматирование времени
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Добавление ответа
  const handleAddReply = (notificationId) => {
    if (replyText.trim() === '') return;

    if (countWords(replyText) > MAX_WORDS) {
      alert(t('MaxWords', { count: MAX_WORDS }));
      return;
    }

    const censoredReply = censorText(replyText);

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              replies: [
                ...notification.replies,
                {
                  id: Date.now(),
                  user: currentUser,
                  comment: censoredReply,
                  timestamp: new Date().toISOString(),
                  likes: [],
                },
              ],
            }
          : notification
      )
    );
    setReplyText('');
    setActiveReplyId(null);
  };

  // Лайк/анлайк для комментария, ответа или уведомления
  const handleLike = async (notificationId, replyId = null) => {
    try {
      // Отправка запроса на сервер
      const response = await fetch(`${BASE_URL}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          replyId,
          user: currentUser,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update like');
      }
  
      const data = await response.json(); // Получаем обновленные данные (например, счетчик лайков)
  
      // Обновление состояния уведомлений с учетом полученных данных
      setNotifications((prev) =>
        prev.map((notification) => {
          if (notification.id === notificationId) {
            if (replyId === null) {
              // Лайк для самого уведомления
              const isLiked = notification.likes.includes(currentUser);
              return {
                ...notification,
                likes: isLiked
                  ? notification.likes.filter((user) => user !== currentUser)
                  : [...notification.likes, currentUser],
              };
            } else {
              // Лайк для ответа
              return {
                ...notification,
                replies: notification.replies.map((reply) =>
                  reply.id === replyId
                    ? {
                        ...reply,
                        likes: reply.likes.includes(currentUser)
                          ? reply.likes.filter((user) => user !== currentUser)
                          : [...reply.likes, currentUser],
                      }
                    : reply
                ),
              };
            }
          }
          return notification;
        })
      );
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };
  

  // Удаление ответа
  const handleDeleteReply = (notificationId, replyId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              replies: notification.replies.filter(
                (reply) => reply.id !== replyId
              ),
            }
          : notification
      )
    );
  };

  // Сохранение отредактированного ответа
  const handleSaveEditReply = (notificationId, replyId) => {
    if (editReplyText.trim() === '') return;

    if (countWords(editReplyText) > MAX_WORDS) {
      alert(t('MaxWords', { count: MAX_WORDS }));
      return;
    }

    const censoredEditReply = censorText(editReplyText);

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              replies: notification.replies.map((reply) =>
                reply.id === replyId
                  ? { ...reply, comment: censoredEditReply }
                  : reply
              ),
            }
          : notification
      )
    );

    setEditingReplyId(null);
    setEditReplyText('');
  };

  return (
    <div className='min-h-screen flex flex-col bg-gray-50 dark:bg-gradient-to-br from-gray-200 via-gray-500 to-gray-700 text-gray-900 dark:text-gray-100'>
      <Navbar />
      <div className='dark:bg-gradient-to-br from-gray-100 via-gray-500 to-gray-700 bg-white pb-24'>
        <div className='relative w-screen'>
          <img
            src={notif}
            alt='Background'
            className='w-full h-64 object-cover -mb-16 justify-start'
          />
          <div className='absolute top-0 left-0 w-full h-full bg-gray-900 opacity-45 dark:bg-gray-900 dark:opacity-50' />
          <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center'>
            <h1 className='text-4xl font-bold'>{t('Уведомлении')}</h1>
          </div>
        </div>
        <div className='flex-grow container mx-auto p-6 mt-28'>
          {notifications.length === 0 ? (
            <div className='flex w-screen -ml-24 -mt-28 justify-center'>
              <DvdScreenNotif /> {/* Отображение, если уведомлений нет */}
            </div>
          ) : (
            <div className='space-y-5'>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className='p-4 border rounded-lg shadow-md bg-white dark:bg-gray-700 dark:border-gray-700 max-w-full'
                >
                  <div className='flex items-center space-x-4'>
                    <div className='flex-grow'>
                      {notification.type === 'like' && (
                        <div className='flex items-center space-x-2'>
                          <svg
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill={'red'} // Динамический цвет
                            stroke='#424242'
                            strokeWidth='1.5'
                            className='w-6 h-6'
                          >
                            <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' />
                          </svg>

                          <p>
                            <strong>{notification.user}</strong>{' '}
                            {t('понравился ваш пост:')}{' '}
                            <span className='text-gray-900 dark:text-gray-200 mr-20'>
                              {notification.postTitle}
                            </span>
                          </p>
                        </div>
                      )}
                      {notification.type === 'comment' && (
                        <div className='flex items-center space-x-2'>
                          <svg
                            width='24'
                            height='24'
                            viewBox='0 0 122.97 122.88'
                            className='fill-gray-800 dark:fill-gray-200 mr-1'
                          >
                            <path d='M61.44,0a61.46,61.46,0,0,1,54.91,89l6.44,25.74a5.83,5.83,0,0,1-7.25,7L91.62,115A61.43,61.43,0,1,1,61.44,0ZM96.63,26.25a49.78,49.78,0,1,0-9,77.52A5.83,5.83,0,0,1,92.4,103L109,107.77l-4.5-18a5.86,5.86,0,0,1,.51-4.34,49.06,49.06,0,0,0,4.62-11.58,50,50,0,0,0-13-47.62Z' />
                          </svg>
                          <p>
                            <strong>{notification.user}</strong>{' '}
                            {t('прокомментировал ваш пост:')}{' '}
                            <span className='text-gray-900 dark:text-gray-200'>
                              {notification.postTitle}
                            </span>
                            <br />
                            <span className='text-gray-700 dark:text-gray-300'>
                              "{notification.comment}"
                            </span>
                          </p>
                        </div>
                      )}
                      {notification.type === 'reply' && (
                        <div className='flex items-center space-x-2'>
                          <svg
                            width='24'
                            height='24'
                            xmlns='http://www.w3.org/2000/svg'
                            x='0px'
                            y='0px'
                            viewBox='0 0 122.88 98.86'
                            className='fill-gray-800 dark:fill-gray-200 mr-1'
                          >
                            <path d='M122.88,49.43L73.95,98.86V74.23C43.01,67.82,18.56,74.89,0,98.42c3.22-48.4,36.29-71.76,73.95-73.31l0-25.11 L122.88,49.43L122.88,49.43z' />
                          </svg>
                          <p>
                            <strong>{notification.user}</strong>{' '}
                            {t('ответил на ваш комментарий:')}{' '}
                            <span className='text-gray-700 dark:text-gray-300'>
                              "{notification.originalComment}"
                            </span>
                            <br />
                            <span className='text-gray-700 dark:text-gray-300'>
                              "{notification.comment}"
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Реакции */}
                    <div className='flex items-center space-x-2'>
                      <button
                        className={`text-lg ${
                          notification.likes.includes(currentUser)
                            ? 'text-red-500'
                            : 'text-gray-400'
                        }`}
                        onClick={() => handleLike(notification.id)}
                      >
                        <svg
                          width='24'
                          height='24'
                          viewBox='0 0 24 24'
                          fill={
                            notification.likes.includes(currentUser)
                              ? 'red'
                              : 'white'
                          }
                          stroke='#424242'
                          strokeWidth='1.5'
                          className='w-6 h-6 transition-all duration-300 ease-in-out hover:fill-red-600 transform hover:-translate-y-0.5'
                        >
                          <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' />
                        </svg>
                      </button>
                      <span className='text-gray-600 dark:text-gray-300'>
                        {notification.likes.length}
                      </span>
                    </div>
                  </div>
                  <div className='text-gray-500 text-sm'>
                    {new Date(notification.timestamp).toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
