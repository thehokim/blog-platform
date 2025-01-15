import { useState, useCallback, useEffect } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import Cropper from 'react-easy-crop';
import { FiLoader, FiSave, FiCamera } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '../utils/instance';
import { useNavigate } from 'react-router-dom';

function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
        } else {
          resolve(blob);
        }
      }, 'image/jpeg');
    };
    image.onerror = (error) => reject(error);
  });
}

function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userId, setUserId] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [croppedPhoto, setCroppedPhoto] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    website: '',
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      fetchProfileData(storedUserId); // Загружаем данные профиля
    } else {
      alert('Не удалось найти идентификатор пользователя. Пожалуйста, войдите снова.');
      navigate('/signin');
    }
  }, [navigate]);

  const fetchProfileData = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/users/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log(data.avatar) // open this image (check)

        setProfileData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          bio: data.bio || '',
          website: data.website || '',
        });
        setCroppedPhoto(data.avatar); // Устанавливаем URL фото
      } else {
        console.error('Ошибка загрузки профиля:', await response.text());
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  };
  

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0]; // Получаем файл
    if (file) {
      setProfilePhoto(URL.createObjectURL(file)); // Устанавливаем превью
      setIsCropping(true); // Переходим в режим обрезки
    } else {
      console.error('Файл не выбран');
    }
  };
  

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = async () => {
    if (!profilePhoto || !croppedAreaPixels) {
      console.error('Необходимо фото для сохранения');
      return;
    }
  
    try {
      const blob = await getCroppedImg(profilePhoto, croppedAreaPixels);
      setCroppedPhoto(blob); // Сохраняем обрезанное фото
      setIsCropping(false);
    } catch (error) {
      console.error('Ошибка обработки фото:', error);
    }
  };
  

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
  
    const formData = new FormData();
    formData.append('first_name', profileData.first_name);
    formData.append('last_name', profileData.last_name);
    formData.append('bio', profileData.bio);
    formData.append('website', profileData.website);
  
    if (croppedPhoto instanceof Blob) {
      formData.append('avatar', croppedPhoto, 'avatar.jpg');
    }
  
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
  
      if (response.ok) {
        alert(t('Данные профиля успешно сохранены.'));
        fetchProfileData(userId); // Перезагружаем профиль
      } else {
        const errorText = await response.text();
        console.error('Ошибка сервера:', errorText);
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const updateField = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className='min-h-screen flex flex-col dark:bg-gradient-to-br from-gray-200 via-gray-500 to-gray-700 text-white bg-gray-50'>
      <Navbar />
      <div className='flex-grow flex items-center justify-center px-4 py-10'>
        <form
          onSubmit={handleProfileSubmit}
          className='max-w-4xl w-full p-8 dark:bg-gray-900 bg-gray-200 bg-opacity-75 dark:text-white text-gray-900 rounded-xl shadow-2xl'
        >
          <div className="mb-8 flex flex-col items-center">
          <label htmlFor="profile-photo" className="block text-sm font-medium mb-2">
            {t('Фото профиля')}
          </label>
          <div className="relative w-36 h-36 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-md -mb-10">
            {isCropping ? (
              <Cropper
                image={profilePhoto}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : croppedPhoto ? (
              <img
                src={croppedPhoto instanceof Blob ? URL.createObjectURL(croppedPhoto) : croppedPhoto}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-36 w-36 text-gray-400" />
            )}
          </div>

          {isCropping ? (
            <button
              type="button"
              onClick={async () => {
                await saveCroppedImage(); // Сохраняем обрезанное изображение
                setIsCropping(false); // Завершаем режим обрезки
                setProfilePhoto(null); // Удаляем оригинальное фото
              }}
              className="relative -top-1 -right-12 cursor-pointer mt-4 bg-blue-700 text-white px-2 py-2 rounded-full shadow-md font-semibold transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              {loading ? <FiLoader className="animate-spin" /> : <FiSave />}
            </button>
          ) : (
            <label
              htmlFor="profile-photo-upload"
              className="relative -top-1 -right-12 cursor-pointer mt-4 bg-blue-700 text-white px-2 py-2 rounded-full shadow-md font-semibold transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              <FiCamera />
              <input
                id="profile-photo-upload"
                type="file"
                className="sr-only"
                onChange={handlePhotoUpload}
              />
            </label>
          )}
        </div>

          {/* Остальная форма */}
          <div className='grid grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium mb-2'>{t('Имя')}</label>
              <input
                type='text'
                value={profileData.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                className='w-full px-4 py-2 rounded-lg bg-gray-100'
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>{t('Фамилия')}</label>
              <input
                type='text'
                value={profileData.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                className='w-full px-4 py-2 rounded-lg bg-gray-100'
              />
            </div>
          </div>
          <div className='mt-4'>
            <label className='block text-sm font-medium mb-2'>{t('О себе')}</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-gray-100'
            />
          </div>
          <div className='mt-4'>
            <label className='block text-sm font-medium mb-2'>{t('Веб-сайт')}</label>
            <input
              type='url'
              value={profileData.website}
              onChange={(e) => updateField('website', e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-gray-100'
            />
          </div>
          <div className='mt-6 flex justify-center'>
            <button
              type='submit'
              disabled={loading}
              className='bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md'
            >
              {loading ? t('Сохранение...') : t('Сохранить')}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;
