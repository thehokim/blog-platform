import React, { useState } from 'react';
import { FiPlusCircle, FiTag } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';


const TagsInput = ({ tags, setTags, availableTags, setAvailableTags }) => {
  const [newTag, setNewTag] = useState('');
    const { t } = useTranslation();

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !availableTags.includes(trimmedTag)) {
      setAvailableTags([...availableTags, trimmedTag]);
      setNewTag('');
    }
  };

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  return (
    <div className="mt-6">
      {/* Добавить новый тег */}
      <h3 className="text-lg font-bold flex text-gray-900 dark:text-gray-100 mb-3">
      <Tag className='w-5 h-5 mt-1 mr-2'/>{t('Добавить новый тег')}
      </h3>
      <div className="relative flex items-center gap-2 mb-6">
        <input
            type="text"
            placeholder={t('EnterTag')}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="w-full px-4 py-3 text-xl rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none "
        />
        <button
            onClick={addTag}
            className="absolute right-0 px-5 py-4 bg-blue-700 text-white rounded-r-lg shadow hover:bg-blue-800 transition duration-200 flex items-center"
        >
            <FiTag className="w-6 h-5" />
        </button>
        </div>


      {/* Доступные теги */}
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <div key={tag} className="relative flex items-center">
            {/* Кнопка удаления */}
            <button
              onClick={() =>
                setAvailableTags(availableTags.filter((t) => t !== tag))
              }
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs shadow hover:bg-red-700 transition duration-200"
              aria-label={`Удалить тег ${tag}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3 h-3"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2a10 10 0 100 20 10 10 0 000-20zM8.47 8.47a.75.75 0 011.06 0L12 10.94l2.47-2.47a.75.75 0 111.06 1.06L13.06 12l2.47 2.47a.75.75 0 11-1.06 1.06L12 13.06l-2.47 2.47a.75.75 0 11-1.06-1.06L10.94 12 8.47 9.53a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Кнопка выбора тега */}
            <button
              onClick={() => toggleTag(tag)}
              className={`px-4 py-2 rounded-full text-sm ${
                tags.includes(tag)
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-blue-100'
              } transition-all duration-300`}
            >
              {tag}
            </button>
          </div>
        ))}
      </div>

      {/* Выбранные теги */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
        {t('Выбранные теги')}:
        </h4>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-700 text-white text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagsInput;
