import { useState, useCallback, useEffect } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import Cropper from "react-easy-crop";
import { FiLoader, FiSave, FiCamera } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { BASE_URL } from "../utils/instance";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Функция для обрезки изображения, возвращает Blob
function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

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
          reject(new Error("Canvas is empty"));
        } else {
          resolve(blob);
        }
      }, "image/jpeg");
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
    first_name: "",
    last_name: "",
    bio: "",
    website: "",
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchProfileData(storedUserId);
    } else {
      navigate("/signin");
    }
  }, [navigate]);

  const fetchProfileData = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/users/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          bio: data.bio || "",
          website: data.website || "",
        });
        // Устанавливаем текущий аватар
        setCroppedPhoto(`${BASE_URL}${data.avatar}`);
      } else {
        console.error("Ошибка загрузки профиля:", await response.text());
      }
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePhoto(URL.createObjectURL(file));
      setIsCropping(true);
      setCroppedPhoto(null); // Убираем старое фото
    } else {
      console.error("Файл не выбран");
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = async () => {
    if (!profilePhoto || !croppedAreaPixels) {
      console.error("Необходимо фото для сохранения");
      return;
    }

    try {
      const blob = await getCroppedImg(profilePhoto, croppedAreaPixels);
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");

      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCroppedPhoto(`${BASE_URL}${data.avatar}`);
        setIsCropping(false);
        setProfilePhoto(null); // Сбрасываем временное изображение
        toast.success(t("Аватар успешно обновлён."), {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        console.error("Ошибка загрузки аватара:", await response.text());
      }
    } catch (error) {
      console.error("Ошибка обработки фото:", error);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    const formData = new FormData();
    formData.append("first_name", profileData.first_name);
    formData.append("last_name", profileData.last_name);
    formData.append("bio", profileData.bio);
    formData.append("website", profileData.website);

    // Если croppedPhoto уже является Blob (например, после кропа), можно добавить его,
    // иначе сервер будет использовать ранее сохранённое изображение
    if (croppedPhoto instanceof Blob) {
      formData.append("avatar", croppedPhoto, "avatar.jpg");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success(t("Данные профиля успешно сохранены."), {
          position: "top-right",
          autoClose: 3000,
        });
        fetchProfileData(userId);
      } else {
        console.error("Ошибка сервера:", await response.text());
      }
    } catch (error) {
      console.error("Ошибка сохранения профиля:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-10">
        <form
          onSubmit={handleProfileSubmit}
          className="max-w-4xl w-full p-8 bg-gray-200 bg-opacity-75 text-gray-900 rounded-xl"
        >
          <div className="mb-8 flex flex-col items-center">
            <label htmlFor="profile-photo" className="block text-sm font-medium mb-2">
              {t("Фото профиля")}
            </label>
            <div className="relative w-36 h-36 rounded-full overflow-hidden bg-gray-200 -mb-10">
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
              ) : croppedPhoto && !croppedPhoto.includes("undefined") ? (
                <img
                  src={croppedPhoto}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={(e) =>
                    (e.target.src =
                      "https://cdn-icons-png.flaticon.com/512/847/847969.png")
                  }
                />
              ) : profilePhoto && !profilePhoto.includes("undefined") ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={(e) =>
                    (e.target.src =
                      "https://cdn-icons-png.flaticon.com/512/847/847969.png")
                  }
                />
              ) : (
                <UserCircleIcon className="h-36 w-36 text-gray-400" />
              )}
            </div>

            {isCropping ? (
              <button
                type="button"
                onClick={saveCroppedImage}
                className="relative -top-1 -right-12 cursor-pointer mt-4 bg-blue-700 text-white px-2 py-2 rounded-full font-semibold transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
              >
                {loading ? <FiLoader className="animate-spin" /> : <FiSave />}
              </button>
            ) : (
              <label
                htmlFor="profile-photo-upload"
                className="relative -top-1 -right-12 cursor-pointer mt-4 bg-blue-700 text-white px-2 py-2 rounded-full font-semibold transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
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

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Имя")}
              </label>
              <input
                type="text"
                value={profileData.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Фамилия")}
              </label>
              <input
                type="text"
                value={profileData.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-100"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              {t("О себе")}
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              {t("Веб-сайт")}
            </label>
            <input
              type="url"
              value={profileData.website}
              onChange={(e) => updateField("website", e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100"
            />
          </div>
          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              {loading ? t("Сохранение...") : t("Сохранить")}
            </button>
          </div>
        </form>
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
}

export default Profile;
