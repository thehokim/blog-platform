import React, { useState } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import TitleInput from '../components/TitleInput';
import DescriptionInput from '../components/DescriptionInput';
import TagsInput from '../components/TagsInput';
import ImageUpload from '../components/ImageUpload';
import MapPoints from '../components/MapPoints';
import VideoSection from '../components/VideoSection';
import TableSection from '../components/TableSection';
import SubmitButton from '../components/SubmitButton';
import { useTranslation } from 'react-i18next';
import { FiImage, FiPenTool } from 'react-icons/fi';
import { Map, Table, Video } from 'lucide-react';
import { BASE_URL } from '../utils/instance';
import { useNavigate } from 'react-router-dom';

const BlogEditor = () => {
  const navigate = useNavigate()
  const { t } = useTranslation();
  const [blogData, setBlogData] = useState({
    title: '',
    description: '',
    tags: [],
    imageUrl: [],
    mapUrl: [],
    videoUrl: '',
    tableData: [['', '']],
  });

  const [mapPoints, setMapPoints] = useState([]);

  const handleInputChange = (e, key) => {
    setBlogData({ ...blogData, [key]: e.target.value });
  };

  const handleFileUpload = (files) => {
    setBlogData((prev) => ({
      ...prev,
      imageUrl: files,
    }));
  };

  const handleVideoChange = (embedUrl) => {
    setBlogData((prev) => ({
      ...prev,
      videoUrl: embedUrl,
    }));
  };

  const handleTableChange = (e, rowIndex, cellIndex) => {
    const value = e.target.value;
    const updatedTable = [...blogData.tableData];
    updatedTable[rowIndex][cellIndex] = value;
    setBlogData({ ...blogData, tableData: updatedTable });
  };

  const addRow = () => {
    setBlogData((prev) => ({
      ...prev,
      tableData: [...prev.tableData, Array(prev.tableData[0].length).fill('')],
    }));
  };

  const addColumn = () => {
    setBlogData((prev) => ({
      ...prev,
      tableData: prev.tableData.map((row) => [...row, '']),
    }));
  };

  const removeRow = () => {
    if (blogData.tableData.length > 1) {
      setBlogData((prev) => ({
        ...prev,
        tableData: prev.tableData.slice(0, -1),
      }));
    }
  };

  const removeColumn = () => {
    if (blogData.tableData[0].length > 1) {
      setBlogData((prev) => ({
        ...prev,
        tableData: prev.tableData.map((row) => row.slice(0, -1)),
      }));
    }
  };

  const handleSubmit = async () => {
    const payload = {
      title: blogData.title,
      description: blogData.description,
      tags: blogData.tags,
      imageUrl: blogData.imageUrl.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
      mapUrl: mapPoints.map(({ latitude, longitude }) => ({ latitude, longitude })),
      videoUrl: blogData.videoUrl,
      tableDate: [{ data: JSON.stringify({ rows: blogData.tableData }) }],
    };

    // console.log('Payload:', JSON.stringify(payload, null, 2));

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${BASE_URL}/posts/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', // multipart/form-data
              'Authorization': `Bearer ${token}`,  // Добавляем токен в заголовок запроса
            },
            body: JSON.stringify(payload),
          });
    
          if (response.ok) {
            navigate('/');
          } else {
            const errorData = await response.json();
            console.error('Error Response:', errorData);
            alert(t('Ошибка при добавлении поста: ') + (errorData?.message || errorData?.error || t('Unknown error')));
          }
        } catch (error) {
          console.error('Network Error:', error);
          alert(t('Network error!'));
        }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-700">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-screen-lg">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-8">
          <h2 className="text-3xl text-center font-bold mb-12 text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
            {t('Создать блог')}
            <FiPenTool className="w-6 h-6" />
          </h2>
          <TitleInput value={blogData.title} onChange={(e) => handleInputChange(e, 'title')} />
          <h1 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiImage className="w-5 h-5" /> {t('Image')}
          </h1>
          <ImageUpload
            onChange={(e) => handleFileUpload(e, 'files')}
            onFilesSelected={(files) => setBlogData((prev) => ({ ...prev, imageUrl: files }))}
          />
          <DescriptionInput
            value={blogData.description}
            onChange={(e) => handleInputChange(e, 'description')}
          />
          <h1 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Map className="w-5 h-5" /> {t('Карта')}
          </h1>
          <MapPoints mapPoints={mapPoints} setMapPoints={setMapPoints} />
          <h1 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Video className="w-5 h-5" /> {t('Видео')}
          </h1>
          <VideoSection videoUrl={blogData.videoUrl} onChange={handleVideoChange} />
          <h1 className="text-lg font-semibold mb-4 mt-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Table className="w-5 h-5" /> {t('Таблица')}
          </h1>
          <TableSection
            tableData={blogData.tableData}
            onChange={handleTableChange}
            onAddRow={addRow}
            onAddColumn={addColumn}
            onRemoveRow={removeRow}
            onRemoveColumn={removeColumn}
          />
          <TagsInput
            tags={blogData.tags}
            setTags={(updatedTags) =>
              setBlogData((prev) => ({ ...prev, tags: updatedTags }))
            }
            availableTags={blogData.availableTags || ['React', 'JavaScript', 'CSS']}
            setAvailableTags={(updatedAvailableTags) =>
              setBlogData((prev) => ({ ...prev, availableTags: updatedAvailableTags }))
            }
          />
          <SubmitButton onSubmit={handleSubmit} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogEditor;
