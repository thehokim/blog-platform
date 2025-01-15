import React, { useEffect, useState } from 'react';
import LikeButton from './likebutton';
import SaveButton from './savebutton';
import Share from './share';
import { SaveAllIcon, SendHorizonal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '../utils/instance';

const CommentSection = ({ commentsData, currentUser, blogAuthor }) => {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [expandedComments, setExpandedComments] = useState(false);
  const [comments, setComments] = useState(commentsData || []);
  const [newComment, setNewComment] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showAllReplies, setShowAllReplies] = useState({}); // Tracks which comments/replies are expanded

  useEffect(() => {
    // Функция для загрузки данных с бэкенда
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/comments`, {
          params: '?like=likeValue&edit=editValue&delete=deleteValue',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setComments(data);
      } catch (err) {
        console.error('Error fetching blogs:', err);
      }
    };

    // fetchPosts();
  }, []);

  const CENSORED_WORDS = ['fuck','shit','damn','bitch','asshole','bastard','dick','pussy','cunt','slut','whore','fag','nigger',
    'nigga','cock','motherfucker','bullshit','crap','hell','suck','twat','jerk','wanker','prick','arse',
    'bollocks','bugger','bloody','jala','jalab','jalap','dalbayop','dalbayob','yeban','yiban',
    'yibansan','yibanakansan','dabba','cort','chort','chortsan','chortla','blya','zaebal','zaybal',
    'pidr','pidor','pidoraz','pidaraz','pidaras','pizdes','pizdesu','pizdeku','yeblan','uyeban','qoto','qotoq',
    'tasho','tashoq','bich','bic','kot',"ko't",'suka','sucka','suchka','shluxa',
    'shlyuxa','wluxa','wlyuxa','oneni ami','qotagim',"qo'tagim","qo'tag'im",
  ];

  const censorText = (text) => {
    const regex = new RegExp(`\\b(${CENSORED_WORDS.join('|')})\\b`, 'giu');
    return text.replace(regex, '****');
  };

  const toggleComments = () => setShowComments(!showComments);

  const addComment = () => {
    try {
      const response = fetch(`${BASE_URL}/posts/comments`, {
        method: 'POST',
        body: {
          comments: comments,
        },
      });
      if (!response.ok) {
        throw new Error(`Error fetching like status: ${response.status}`);
      }
      const data = response.json();
    } catch (error) {
      console.error('Error fetching like status:', error);
    }

    if (newComment.trim()) {
      setComments([
        ...comments,
        {
          id: Date.now(),
          text: censorText(newComment), // Фильтруем текст
          authorName: currentUser || t('Вы'),
          date: new Date().toLocaleString(),
          likes: [],
          replies: [],
        },
      ]);
      setNewComment('');
    }
  };

  // Рекурсивная функция для обработки лайков
  const updateLikes = (id, replies = []) =>
    replies.map((reply) =>
      reply.id === id
        ? {
            ...reply,
            likes: reply.likes.includes(currentUser)
              ? reply.likes.filter((user) => user !== currentUser) // Удаляем лайк
              : [...reply.likes, currentUser], // Добавляем лайк
          }
        : { ...reply, replies: updateLikes(id, reply.replies) }
    );

  const handleLike = (id) => {
    setComments(
      comments.map((comment) =>
        comment.id === id
          ? {
              ...comment,
              likes: comment.likes.includes(currentUser)
                ? comment.likes.filter((user) => user !== currentUser)
                : [...comment.likes, currentUser],
            }
          : { ...comment, replies: updateLikes(id, comment.replies) }
      )
    );
  };

  const addReplyToCommentOrReply = (id, text, replies = []) =>
    replies.map((reply) =>
      reply.id === id
        ? {
            ...reply,
            replies: [
              ...reply.replies,
              {
                id: Date.now(),
                text: censorText(text), // Применяем цензуру к тексту
                authorName: currentUser || t('Вы'),
                date: new Date().toLocaleString(),
                likes: [],
                replies: [],
              },
            ],
          }
        : {
            ...reply,
            replies: addReplyToCommentOrReply(
              id,
              censorText(text),
              reply.replies
            ),
          }
    );

  const addReply = (id) => {
    if (replyText.trim()) {
      setComments(
        comments.map((comment) =>
          comment.id === id
            ? {
                ...comment,
                replies: [
                  ...comment.replies,
                  {
                    id: Date.now(),
                    text: censorText(replyText), // Фильтруем текст
                    authorName: currentUser || t('Вы'),
                    date: new Date().toLocaleString(),
                    likes: [],
                    replies: [],
                  },
                ],
              }
            : {
                ...comment,
                replies: addReplyToCommentOrReply(
                  id,
                  censorText(replyText),
                  comment.replies
                ),
              }
        )
      );
      setReplyText('');
      setActiveReplyId(null);
    }
  };

  const handleDelete = (id) => {
    const deleteReplies = (id, replies) =>
      replies
        .filter((reply) => reply.id !== id)
        .map((reply) => ({
          ...reply,
          replies: deleteReplies(id, reply.replies),
        }));

    setComments(
      comments
        .filter((comment) => comment.id !== id)
        .map((comment) => ({
          ...comment,
          replies: deleteReplies(id, comment.replies),
        }))
    );
  };

  const startEditingComment = (id, text) => {
    setEditingCommentId(id);
    setEditCommentText(text);
  };

  const saveEditedComment = (id) => {
    const editReplies = (id, text, replies = []) =>
      replies.map((reply) =>
        reply.id === id
          ? { ...reply, text: censorText(text) } // Фильтруем текст
          : { ...reply, replies: editReplies(id, text, reply.replies) }
      );

    setComments(
      comments.map((comment) =>
        comment.id === id
          ? { ...comment, text: censorText(editCommentText) } // Фильтруем текст
          : {
              ...comment,
              replies: editReplies(id, editCommentText, comment.replies),
            }
      )
    );
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const renderReplies = (replies, level = 1) => {
    if (!replies || replies.length === 0) return null;

    const isExpanded = showAllReplies[level] || false;
    const visibleReplies = isExpanded ? replies : replies.slice(0, 3);

    return (
      <div
        className={`mt-4 ml-${
          level * 4
        } space-y-2 border-l-2 border-gray-300 pl-4`}
      >
        {visibleReplies.map((reply) => (
          <div key={reply.id} className='flex flex-col'>
            <div className='flex justify-between items-start'>
              <div>
                <p className='font-semibold'>{reply.authorName}</p>
                <p className='text-sm text-gray-500'>{reply.date}</p>
                {editingCommentId === reply.id ? (
                  <>
                    <textarea
                      className='w-full h-11 p-2 border rounded-lg dark:bg-gray-400 dark:placeholder-gray-700 dark:border-gray-400'
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                    ></textarea>
                    <button
                      className='mt-2 mr-5 px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all duration-300 transform hover:scale-105'
                      onClick={() => saveEditedComment(reply.id)}
                    >
                      <SaveAllIcon className='w-5 h-5' />
                    </button>
                    <button
                      className='mt-2 mr-5 px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all duration-300 transform hover:scale-105'
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditCommentText('');
                      }}
                    >
                      <X className='w-5 h-5' />
                    </button>
                  </>
                ) : (
                  <p className='mt-2'>{reply.text}</p>
                )}
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  className={`text-lg ${
                    reply.likes.includes(currentUser)
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}
                  onClick={() => handleLike(reply.id)}
                >
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill={reply.likes.includes(currentUser) ? 'red' : 'white'}
                    stroke='#424242'
                    strokeWidth='1.5'
                    className='w-4 h-4 transition-all dark:fill-gray-300 duration-300 ease-in-out hover:fill-red-600 transform hover:-translate-y-0.5'
                  >
                    <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' />
                  </svg>
                </button>
                <span className='text-gray-600 dark:text-gray-600'>
                  {reply.likes.length}
                </span>
                {(reply.authorName === currentUser ||
                  blogAuthor === currentUser) && (
                  <>
                    <button onClick={() => handleDelete(reply.id)}>
                      <svg
                        id='Layer_1'
                        data-name='Layer 1'
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 110.61 122.88'
                        className='fill-gray-800  ml-3 mr-3 w-3.5 h-3.5 transition-all duration-300 ease-in-out hover:fill-red-600 transform hover:-translate-y-0.5'
                      >
                        <path d='M39.27,58.64a4.74,4.74,0,1,1,9.47,0V93.72a4.74,4.74,0,1,1-9.47,0V58.64Zm63.6-19.86L98,103a22.29,22.29,0,0,1-6.33,14.1,19.41,19.41,0,0,1-13.88,5.78h-45a19.4,19.4,0,0,1-13.86-5.78l0,0A22.31,22.31,0,0,1,12.59,103L7.74,38.78H0V25c0-3.32,1.63-4.58,4.84-4.58H27.58V10.79A10.82,10.82,0,0,1,38.37,0H72.24A10.82,10.82,0,0,1,83,10.79v9.62h23.35a6.19,6.19,0,0,1,1,.06A3.86,3.86,0,0,1,110.59,24c0,.2,0,.38,0,.57V38.78Zm-9.5.17H17.24L22,102.3a12.82,12.82,0,0,0,3.57,8.1l0,0a10,10,0,0,0,7.19,3h45a10.06,10.06,0,0,0,7.19-3,12.8,12.8,0,0,0,3.59-8.1L93.37,39ZM71,20.41V12.05H39.64v8.36ZM61.87,58.64a4.74,4.74,0,1,1,9.47,0V93.72a4.74,4.74,0,1,1-9.47,0V58.64Z' />
                      </svg>
                    </button>
                    <button
                      className='text-green-500'
                      onClick={() => startEditingComment(reply.id, reply.text)}
                    >
                      <svg
                        version='1.1'
                        id='Layer_1'
                        xmlns='http://www.w3.org/2000/svg'
                        x='0px'
                        y='0px'
                        viewBox='0 0 121.48 122.88'
                        className='fill-gray-800  mr-3 w-3.5 h-3.5 transition-all duration-300 ease-in-out hover:fill-blue-500 transform hover:-translate-y-0.5'
                      >
                        <path
                          class='st0'
                          d='M96.84,2.22l22.42,22.42c2.96,2.96,2.96,7.8,0,10.76l-12.4,12.4L73.68,14.62l12.4-12.4 C89.04-0.74,93.88-0.74,96.84,2.22L96.84,2.22z M70.18,52.19L70.18,52.19l0,0.01c0.92,0.92,1.38,2.14,1.38,3.34 c0,1.2-0.46,2.41-1.38,3.34v0.01l-0.01,0.01L40.09,88.99l0,0h-0.01c-0.26,0.26-0.55,0.48-0.84,0.67h-0.01 c-0.3,0.19-0.61,0.34-0.93,0.45c-1.66,0.58-3.59,0.2-4.91-1.12h-0.01l0,0v-0.01c-0.26-0.26-0.48-0.55-0.67-0.84v-0.01 c-0.19-0.3-0.34-0.61-0.45-0.93c-0.58-1.66-0.2-3.59,1.11-4.91v-0.01l30.09-30.09l0,0h0.01c0.92-0.92,2.14-1.38,3.34-1.38 c1.2,0,2.41,0.46,3.34,1.38L70.18,52.19L70.18,52.19L70.18,52.19z M45.48,109.11c-8.98,2.78-17.95,5.55-26.93,8.33 C-2.55,123.97-2.46,128.32,3.3,108l9.07-32v0l-0.03-0.03L67.4,20.9l33.18,33.18l-55.07,55.07L45.48,109.11L45.48,109.11z M18.03,81.66l21.79,21.79c-5.9,1.82-11.8,3.64-17.69,5.45c-13.86,4.27-13.8,7.13-10.03-6.22L18.03,81.66L18.03,81.66z'
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className='flex space-x-4 mt-2'>
              <button
                className='text-blue-700 hover:underline'
                onClick={() =>
                  setActiveReplyId(activeReplyId === reply.id ? null : reply.id)
                }
              >
                {t('Ответить')}
              </button>
            </div>
            {activeReplyId === reply.id && (
              <div className='mt-2'>
                <textarea
                  className='w-2/4 h-11 p-2 border rounded-lg dark:bg-gray-400 dark:placeholder-gray-700 dark:border-gray-400'
                  placeholder={t('writeYourReply')}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>
                <br />
                <button
                  className='mt-2 mr-5 px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all duration-300 transform hover:scale-105'
                  onClick={() => addReply(reply.id)}
                >
                  <SendHorizonal className='w-5 h-5' />
                </button>
              </div>
            )}
            {renderReplies(reply.replies, level + 1)}
          </div>
        ))}
        {replies.length > 3 && (
          <button
            className='text-blue-700 hover:underline'
            onClick={() =>
              setShowAllReplies((prev) => ({
                ...prev,
                [level]: !prev[level],
              }))
            }
          >
            {isExpanded ? 'Скрыть ответы' : 'Показать все ответы'}
          </button>
        )}
      </div>
    );
  };

  const renderComments = () => {
    const visibleComments = expandedComments ? comments : comments.slice(0, 3);

    return (
      <div className='space-y-4 mt-4'>
        {visibleComments.map((comment) => (
          <div
            key={comment.id}
            className='border p-4 rounded-md shadow-md w-[960px] dark:bg-gray-300 dark:border-gray-300'
          >
            <div className='flex justify-between items-center'>
              <div>
                <p className='font-semibold'>{comment.authorName}</p>
                <p className='text-sm text-gray-500'>{comment.date}</p>
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  className={`text-lg ${
                    comment.likes.includes(currentUser)
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}
                  onClick={() => handleLike(comment.id)}
                >
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill={comment.likes.includes(currentUser) ? 'red' : 'white'}
                    stroke='#424242'
                    strokeWidth='1.5'
                    className='w-5 h-5 transition-all dark:fill-gray-300 duration-300 ease-in-out hover:fill-red-600 transform hover:-translate-y-0.5'
                  >
                    <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' />
                  </svg>
                </button>
                <span className='text-gray-600 dark:text-gray-600'>
                  {comment.likes.length}
                </span>
                {(comment.authorName === currentUser ||
                  blogAuthor === currentUser) && (
                  <>
                    <button onClick={() => handleDelete(comment.id)}>
                      <svg
                        id='Layer_1'
                        data-name='Layer 1'
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 110.61 122.88'
                        className='fill-gray-800 ml-3 mr-3 w-4 h-4 transition-all duration-300 ease-in-out hover:fill-red-600 transform hover:-translate-y-0.5'
                      >
                        <path d='M39.27,58.64a4.74,4.74,0,1,1,9.47,0V93.72a4.74,4.74,0,1,1-9.47,0V58.64Zm63.6-19.86L98,103a22.29,22.29,0,0,1-6.33,14.1,19.41,19.41,0,0,1-13.88,5.78h-45a19.4,19.4,0,0,1-13.86-5.78l0,0A22.31,22.31,0,0,1,12.59,103L7.74,38.78H0V25c0-3.32,1.63-4.58,4.84-4.58H27.58V10.79A10.82,10.82,0,0,1,38.37,0H72.24A10.82,10.82,0,0,1,83,10.79v9.62h23.35a6.19,6.19,0,0,1,1,.06A3.86,3.86,0,0,1,110.59,24c0,.2,0,.38,0,.57V38.78Zm-9.5.17H17.24L22,102.3a12.82,12.82,0,0,0,3.57,8.1l0,0a10,10,0,0,0,7.19,3h45a10.06,10.06,0,0,0,7.19-3,12.8,12.8,0,0,0,3.59-8.1L93.37,39ZM71,20.41V12.05H39.64v8.36ZM61.87,58.64a4.74,4.74,0,1,1,9.47,0V93.72a4.74,4.74,0,1,1-9.47,0V58.64Z' />
                      </svg>
                    </button>
                    <button
                      className='text-green-500'
                      onClick={() =>
                        startEditingComment(comment.id, comment.text)
                      }
                    >
                      <svg
                        version='1.1'
                        id='Layer_1'
                        xmlns='http://www.w3.org/2000/svg'
                        x='0px'
                        y='0px'
                        viewBox='0 0 121.48 122.88'
                        className='fill-gray-800  mr-3 w-4 h-4 transition-all duration-300 ease-in-out hover:fill-blue-500 transform hover:-translate-y-0.5'
                      >
                        <path
                          class='st0'
                          d='M96.84,2.22l22.42,22.42c2.96,2.96,2.96,7.8,0,10.76l-12.4,12.4L73.68,14.62l12.4-12.4 C89.04-0.74,93.88-0.74,96.84,2.22L96.84,2.22z M70.18,52.19L70.18,52.19l0,0.01c0.92,0.92,1.38,2.14,1.38,3.34 c0,1.2-0.46,2.41-1.38,3.34v0.01l-0.01,0.01L40.09,88.99l0,0h-0.01c-0.26,0.26-0.55,0.48-0.84,0.67h-0.01 c-0.3,0.19-0.61,0.34-0.93,0.45c-1.66,0.58-3.59,0.2-4.91-1.12h-0.01l0,0v-0.01c-0.26-0.26-0.48-0.55-0.67-0.84v-0.01 c-0.19-0.3-0.34-0.61-0.45-0.93c-0.58-1.66-0.2-3.59,1.11-4.91v-0.01l30.09-30.09l0,0h0.01c0.92-0.92,2.14-1.38,3.34-1.38 c1.2,0,2.41,0.46,3.34,1.38L70.18,52.19L70.18,52.19L70.18,52.19z M45.48,109.11c-8.98,2.78-17.95,5.55-26.93,8.33 C-2.55,123.97-2.46,128.32,3.3,108l9.07-32v0l-0.03-0.03L67.4,20.9l33.18,33.18l-55.07,55.07L45.48,109.11L45.48,109.11z M18.03,81.66l21.79,21.79c-5.9,1.82-11.8,3.64-17.69,5.45c-13.86,4.27-13.8,7.13-10.03-6.22L18.03,81.66L18.03,81.66z'
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
            {editingCommentId === comment.id ? (
              <div className='mt-2'>
                <textarea
                  className='w-2/4 h-11 p-2 border rounded-lg dark:bg-gray-400 dark:placeholder-gray-700 dark:border-gray-400'
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                ></textarea>
                <br />
                <button
                  className='mt-2 mr-5 px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all duration-300 transform hover:scale-105'
                  onClick={() => saveEditedComment(comment.id)}
                >
                  <SaveAllIcon className='w-5 h-5' />
                </button>
                <button
                  className='mt-2 px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all duration-300 transform hover:scale-105'
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditCommentText('');
                  }}
                >
                  <X className='w-5 h-5' />
                </button>
              </div>
            ) : (
              <p className='mt-2'>{comment.text}</p>
            )}
            <div className='flex space-x-4 mt-2'>
              <button
                className='text-blue-700 hover:underline'
                onClick={() =>
                  setActiveReplyId(
                    activeReplyId === comment.id ? null : comment.id
                  )
                }
              >
                {t('Ответить')}
              </button>
            </div>
            {activeReplyId === comment.id && (
              <div className='mt-2'>
                <textarea
                  className='w-2/4 h-11 p-2 border rounded-lg dark:bg-gray-400 dark:placeholder-gray-700 dark:border-gray-400'
                  placeholder={t('writeYourReply')}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>
                <br />
                <button
                  className='mt-2 mr-5 px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all duration-300 transform hover:scale-105'
                  onClick={() => addReply(comment.id)}
                >
                  <SendHorizonal className='w-5 h-5' />
                </button>
              </div>
            )}
            {renderReplies(comment.replies)}
          </div>
        ))}
        {comments.length > 3 && !expandedComments && (
          <button
            className='text-blue-700 hover:underline'
            onClick={() => setExpandedComments(true)}
          >
            {t('Показать еще')}
          </button>
        )}
        {expandedComments && (
          <button
            className='text-blue-700 hover:underline'
            onClick={() => setExpandedComments(false)}
          >
            {t('Скрыть')}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className='max-w-2xl mx-auto mr-72'>
      {/* Блок с кнопками действий */}
      <div className='flex items-center justify-start space-x-4'>
        <LikeButton />
        <SaveButton />
        <button
          className={`text-gray-500 ${
            showComments
              ? 'bg-white transition-all duration-300 ease-in-out transform hover:-translate-y-0.5'
              : 'bg-white transition-all duration-300 ease-in-out transform hover:-translate-y-0.5'
          } rounded-full`}
          onClick={toggleComments}
        >
          <svg
            width='22'
            height='22'
            fill={'red'}
            viewBox='0 0 122.97 122.88'
            className='fill-gray-700 transition-all duration-300 ease-in-out hover:fill-gray-800 transform hover:-translate-y-0.5'
          >
            <path d='M61.44,0a61.46,61.46,0,0,1,54.91,89l6.44,25.74a5.83,5.83,0,0,1-7.25,7L91.62,115A61.43,61.43,0,1,1,61.44,0ZM96.63,26.25a49.78,49.78,0,1,0-9,77.52A5.83,5.83,0,0,1,92.4,103L109,107.77l-4.5-18a5.86,5.86,0,0,1,.51-4.34,49.06,49.06,0,0,0,4.62-11.58,50,50,0,0,0-13-47.62Z' />
          </svg>
        </button>
        <Share />
      </div>

      {/* Блок с комментариями */}
      {showComments && (
        <div className='mt-4'>
          {renderComments()}
          <div className='mt-4'>
            <textarea
              className='w-[960px] h-11 p-2 border rounded-xl dark:bg-gray-400 dark:placeholder-gray-700 dark:border-gray-400'
              rows='3'
              placeholder={t('writeYourComment')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            ></textarea>
            <br />
            <button
              className='mt-2 mr-5 px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all duration-300 transform hover:scale-105'
              onClick={addComment}
            >
              <SendHorizonal className='w-5 h-5' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
