import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import LikeButton from './likebutton';
import SaveButton from './savebutton';
import Share from './share';
import { useNavigate } from 'react-router-dom';

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

  // Отображаем пост, если данные загружены
  const handleNavigateToPost = () => {
    navigate(`/content/${post.id}`);
  };

  const handleNavigateToCategory = (e) => {
    e.preventDefault();
    if (post.category && post.category.href) {
      navigate(post.category.href);
    }
  };

  return (
    <article className="relative max-w-2xl flex-col items-start justify-between transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-lg dark:bg-gray-300 bg-gray-50 rounded-lg h-full">
      <div className="flex items-center gap-x-4 text-xs">
        <time
          dateTime={post.datetime}
          className="text-gray-500 dark:text-gray-700 ml-8 mt-5 mb-4"
        >
          {post.date || 'Unknown Date'}
        </time>
        {post.category?.title && (
          <button
            onClick={handleNavigateToCategory}
            className="relative rounded-full bg-white dark:bg-gray-200 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100 mt-0.5 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
          >
            {post.category.title}
          </button>
        )}
      </div>

      <div className="flex items-center mt-3">
        {/* Если изображение поста отсутствует, показываем SVG */}
        {post.imageUrl ? (
          <img
            alt={post.title}
            src={post.imageUrl}
            className="size-40 mr-6 rounded-lg bg-gray-200 ml-8"
          />
        ) : (
          <svg 
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
        )}
        <div className="group relative">
          <h3
            className="text-lg/6 font-semibold text-gray-900 group-hover:text-gray-600 cursor-pointer"
            onClick={handleNavigateToPost}
          >
            {post.title || 'Untitled'}
          </h3>
          <p
            className="mt-5 line-clamp-3 text-sm/6 text-gray-600 mr-3"
            onClick={handleNavigateToPost}
          >
            {post.description || 'No description available.'}
          </p>
        </div>
      </div>

      <div className="relative mt-8 flex items-center gap-x-4 ml-8 mb-5">
        {/* Если у автора отсутствует изображение, показываем SVG */}
        {post.author?.imageUrl ? (
          <img
            alt={post.author.name || 'Author'}
            src={post.author.imageUrl}
            className="size-10 rounded-full bg-gray-50"
          />
        ) : (
          <svg 
          xmlns="http://www.w3.org/2000/svg" 
          shape-rendering="geometricPrecision" 
          text-rendering="geometricPrecision" 
          image-rendering="optimizeQuality" 
          fill-rule="evenodd" 
          clip-rule="evenodd" 
          viewBox="0 0 512 512"
          className='w-10 h-10'
          >
            <path fill="#A7A9AE" fill-rule="nonzero" d="M256 0c68 0 132.89 26.95 180.96 75.04C485.05 122.99 512 188.11 512 256c0 68-26.95 132.89-75.04 180.96-23.49 23.56-51.72 42.58-83.15 55.6C323.59 505.08 290.54 512 256 512c-34.55 0-67.6-6.92-97.83-19.44l-.07-.03c-31.25-12.93-59.42-31.93-83.02-55.54l-.07-.07C26.9 388.82 0 324.03 0 256 0 116.78 112.74 0 256 0zm-52.73 332.87a67.668 67.668 0 01-5.6-6.74c-10.84-14.83-20.55-31.61-30.32-47.22-7.06-10.41-10.78-19.71-10.78-27.14 0-7.95 4.22-17.23 12.64-19.34-1.11-15.99-1.49-31.77-.74-48.88.37-4.08 1.12-8.17 2.23-12.27 4.84-17.1 16.73-30.86 31.61-40.15 5.2-3.35 10.78-5.94 17.1-8.18 10.78-4.09 5.57-20.45 17.48-20.82 27.88-.74 73.61 23.06 91.46 42.38 10.41 11.16 17.1 26.03 18.22 45.74l-1.12 44.03c5.2 1.49 8.55 4.84 10.04 10.04 1.49 5.95 0 14.13-5.2 25.67 0 .36-.38.36-.38.74-11.47 18.91-23.39 40.77-36.57 58.33-6.63 8.83-12.07 7.26-6.42 15.74 26.88 36.96 79.9 31.82 112.61 56.44 35.73-40.16 55.15-91.48 55.15-145.24 0-58.34-22.8-113.35-64.07-154.61v-.08C369.44 60.1 314.23 37.32 256 37.32 134.4 37.32 37.32 135.83 37.32 256c0 53.85 19.41 105.03 55.15 145.24 32.72-24.62 85.73-19.48 112.61-56.44 4.68-7.01 3.48-6.33-1.81-11.93z"/>
            </svg>
        )}
        <div className="text-sm/6">
          <p className="font-semibold text-gray-900">
            {post.author?.name || 'Unknown Author'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <LikeButton postId={post.id} authToken={authToken} />
          <SaveButton postId={post.id} />
          <Share postUrl={`/content/${post.id}`} />
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
