import { useEffect, useState } from 'react';
import BlogCard from '../components/BlogCard';
import DvdScreenSave from '../components/dvdsave';
import Footer from '../components/footer';
import Navbar from '../components/navbar';
import savedb from '../images/savedb.png';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '../utils/instance';

const Saved = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          console.error('Токен или userId отсутствует');
          setLoading(false);
          return;
        }

          const response = await fetch(`${BASE_URL}/posts/saved-blogs?user_id=${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

        if (!response.ok) {
          throw new Error(`Failed to fetch saved posts: ${response.status}`);
        }

        const data = await response.json();
        
        console.log(data, 'saved BLOG'); // Для проверки структуры данных

        // Форматируем данные перед их использованием
        const formattedPosts = data.map((item) => ({
          id: item.post?.id || item.id,
          title: item.post?.title || 'Unknown Title',
          imageUrl: item.post?.imageUrl || <svg 
          version="1.1" 
          id="Layer_1" 
          xmlns="http://www.w3.org/2000/svg" 
          x="0px" y="0px" 
          viewBox="0 0 122.88 122.14"
          className='w-auto h-36 fill-gray-300 px-8 '
          >
            <g>
              <path d="M8.69,0h105.5c2.39,0,4.57,0.98,6.14,2.55c1.57,1.57,2.55,3.75,2.55,6.14v104.76c0,2.39-0.98,4.57-2.55,6.14 c-1.57,1.57-3.75,2.55-6.14,2.55H8.69c-2.39,0-4.57-0.98-6.14-2.55C0.98,118.02,0,115.84,0,113.45V8.69C0,6.3,0.98,4.12,2.55,2.55 C4.12,0.98,6.3,0,8.69,0L8.69,0z M7.02,88.3l37.51-33.89c1.43-1.29,3.64-1.18,4.93,0.25c0.03,0.03,0.05,0.06,0.08,0.09l0.01-0.01 l31.45,37.22l4.82-29.59c0.31-1.91,2.11-3.2,4.02-2.89c0.75,0.12,1.4,0.47,1.9,0.96l24.15,23.18V8.69c0-0.46-0.19-0.87-0.49-1.18 c-0.3-0.3-0.72-0.49-1.18-0.49H8.69c-0.46,0-0.87,0.19-1.18,0.49c-0.3,0.3-0.49,0.72-0.49,1.18V88.3L7.02,88.3z M115.86,93.32 L91.64,70.07l-4.95,30.41c-0.11,0.83-0.52,1.63-1.21,2.22c-1.48,1.25-3.68,1.06-4.93-0.41L46.52,62.02L7.02,97.72v15.73 c0,0.46,0.19,0.87,0.49,1.18c0.31,0.31,0.72,0.49,1.18,0.49h105.5c0.46,0,0.87-0.19,1.18-0.49c0.3-0.3,0.49-0.72,0.49-1.18V93.32 L115.86,93.32z M92.6,19.86c3.48,0,6.62,1.41,8.9,3.69c2.28,2.28,3.69,5.43,3.69,8.9s-1.41,6.62-3.69,8.9 c-2.28,2.28-5.43,3.69-8.9,3.69c-3.48,0-6.62-1.41-8.9-3.69c-2.28-2.28-3.69-5.43-3.69-8.9s1.41-6.62,3.69-8.9 C85.98,21.27,89.12,19.86,92.6,19.86L92.6,19.86z M97.58,27.47c-1.27-1.27-3.03-2.06-4.98-2.06c-1.94,0-3.7,0.79-4.98,2.06 c-1.27,1.27-2.06,3.03-2.06,4.98c0,1.94,0.79,3.7,2.06,4.98c1.27,1.27,3.03,2.06,4.98,2.06c1.94,0,3.7-0.79,4.98-2.06 c1.27-1.27,2.06-3.03,2.06-4.98C99.64,30.51,98.85,28.75,97.58,27.47L97.58,27.47z"/>
              </g>
              </svg>
              ,
          description: item.post?.description || 'No description available',
          date: item.post?.Date
            ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(item.post.Date))
            : 'Unknown Date',
          author: {
            name: item.post?.author?.name || 'Unknown Author',
            avatar: item.post?.author?.imageUrl || 'https://via.placeholder.com/50',
          },
          post_id: item.post?.id || item.id, // Добавьте это поле
        }));
        
        // shottami?

        setPosts(formattedPosts); // Устанавливаем отформатированные посты
      } catch (error) {
        console.error('Error fetching saved blogs:', error);
      } finally {
        setLoading(false); // Отключаем загрузку
      }
    };

    fetchSavedPosts();
  }, []);
  
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <h1 className="text-lg font-bold text-gray-700 dark:text-white">
          {t('Загрузка...')}
        </h1>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gradient-to-br from-gray-200 via-gray-500 to-gray-700">
      <Navbar />
      <div className="dark:bg-gradient-to-br from-gray-100 via-gray-500 to-gray-700 bg-white pb-24">
        <div className="relative w-screen">
          <img
            src={savedb}
            alt="Background"
            className="w-full h-64 object-cover -mb-16 justify-start"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gray-900 opacity-35 dark:bg-gray-900 dark:opacity-50" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
            <h1 className="text-4xl font-bold">{t('Сохраненные блоги')}</h1>
          </div>
        </div>
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-16 gap-y-16 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:px-24 px-6">
          {posts.length > 0 ? (
            posts.map((post) => <BlogCard key={post.id} post={post} />)
          ) : (
            <div className="flex w-screen -ml-24 -mt-28 justify-center">
              <DvdScreenSave /> {/* Отображаем компонент, если постов нет */}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Saved;
