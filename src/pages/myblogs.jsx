import { useState } from 'react';
import Footer from '../components/footer';
import Navbar from '../components/navbar';
import BlogCard from '../components/BlogCard';
import myb from '../images/myb.png';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import DvdScreenSaver from '../components/dvd';
import { BASE_URL } from '../utils/instance';

const initialPosts = [
  {
    id: 1,
    title: 'Базовый курс по ГИС',
    imageUrl:
      'https://eos.com/wp-content/uploads/2022/12/data-manager-gis-agriculture.jpg.webp',
    href: '/content/1',
    description:
      'Данный курс обучает анализу и принятию объективных решений с помощью программ ГИС (геоинформационных систем). Курс включает изучение методов сбора, управления и анализа географических данных для решения реальных задач.',
    date: 'Nov 11, 2024',
    datetime: '2024-11-11',
    category: { title: 'GIS', href: '#' },
    author: {
      name: 'Michael Foster',
      href: '#',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
  // More posts...
];

function MyBlogs() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);

  const deletePost = async (postId) => {
    try {
      const response = await fetch(`${BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Удаление поста из состояния при успешном удалении
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        Swal.fire('Удалено!', 'Блог был успешно удалён.', 'success');
      } else {
        throw new Error(`Ошибка при удалении поста: ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка при удалении поста:', error);
      Swal.fire('Ошибка', 'Не удалось удалить блог.', 'error');
    }
  };

  return (
    <div className='bg-white dark:bg-gradient-to-br from-gray-200 via-gray-500 to-gray-700'>
      <Navbar />
      <div className='dark:bg-gray-200  bg-white pb-20'>
        <div className='relative w-screen'>
          <img
            src={myb}
            alt='Background'
            className='w-full h-64 object-cover -mb-16 justify-start'
          />
          <div className='absolute top-0 left-0 w-full h-full bg-gray-900 opacity-45 dark:bg-gray-900 dark:opacity-50' />
          <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center'>
            <h1 className='text-4xl font-bold'>{t('Мои блоги')}</h1>
          </div>
        </div>

        {/* Условный рендеринг */}
        {posts.length > 0 ? (
          <div className='mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-16 gap-y-16 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:px-24 px-6'>
            {posts.map((post) => (
              <div key={post.id} className='relative'>
                <BlogCard post={post} />
                <button
                  className='absolute -top-2 -right-2 h-7 w-7 bg-red-600 rounded-full transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out'
                  onClick={() => deletePost(post.id)}
                >
                  <svg
                    id='Layer_1'
                    data-name='Layer 1'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 110.61 122.88'
                    className='fill-gray-300 ml-1.5 w-4 h-4 transition-all duration-300 ease-in-out hover:fill-black transform hover:-translate-y-0'
                  >
                    <path d='M39.27,58.64a4.74,4.74,0,1,1,9.47,0V93.72a4.74,4.74,0,1,1-9.47,0V58.64Zm63.6-19.86L98,103a22.29,22.29,0,0,1-6.33,14.1,19.41,19.41,0,0,1-13.88,5.78h-45a19.4,19.4,0,0,1-13.86-5.78l0,0A22.31,22.31,0,0,1,12.59,103L7.74,38.78H0V25c0-3.32,1.63-4.58,4.84-4.58H27.58V10.79A10.82,10.82,0,0,1,38.37,0H72.24A10.82,10.82,0,0,1,83,10.79v9.62h23.35a6.19,6.19,0,0,1,1,.06A3.86,3.86,0,0,1,110.59,24c0,.2,0,.38,0,.57V38.78Zm-9.5.17H17.24L22,102.3a12.82,12.82,0,0,0,3.57,8.1l0,0a10,10,0,0,0,7.19,3h45a10.06,10.06,0,0,0,7.19-3,12.8,12.8,0,0,0,3.59-8.1L93.37,39ZM71,20.41V12.05H39.64v8.36ZM61.87,58.64a4.74,4.74,0,1,1,9.47,0V93.72a4.74,4.74,0,1,1-9.47,0V58.64Z' />
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
