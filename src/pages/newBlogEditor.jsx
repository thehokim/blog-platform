import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import TitleInput from "../components/TitleInput";
import DescriptionInput from "../components/DescriptionInput";
import TagsInput from "../components/TagsInput";
import ImageUpload from "../components/ImageUpload";
import MapPoints from "../components/MapPoints";
import VideoSection from "../components/VideoSection";
import TableSection from "../components/TableSection";
import SubmitButton from "../components/SubmitButton";
import { useTranslation } from "react-i18next";
import { FiImage, FiPenTool, FiTrash } from "react-icons/fi";
import { Map, Table, Video } from "lucide-react";
import { BASE_URL } from "../utils/instance";
import { useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const BlogEditor = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const initialColumns = [t("Column 1"), t("Column 2"), t("Column 3")];

  const [blogData, setBlogData] = useState({
    title: "",
    description: "",
    tags: [],
    images: [],
    maps: [],
    videos: [],
    tables: {
      columns: initialColumns, // Три локализованных столбца
      rows: Array.from({ length: 3 }).map(() => ({
        [initialColumns[0]]: "",
        [initialColumns[1]]: "",
        [initialColumns[2]]: "",
      })), // Три строки
    },
  });

  // Состояние для маркеров карты
  const [markerPositions, setMarkerPositions] = useState([]);
  // Состояние для загрузки карты Google
  const [isLoaded, setIsLoaded] = useState(false);

  // Добавление маркера по клику на карту
  const handleClick = (event) => {
    setMarkerPositions((prevMarkers) => [
      ...prevMarkers,
      {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      },
    ]);
  };

  // При изменении маркеров обновляем данные блога
  useEffect(() => {
    setBlogData((prev) => ({
      ...prev,
      maps: markerPositions,
    }));
  }, [markerPositions]);

  // Обработчик изменений полей ввода
  const handleInputChange = (e, key) => {
    setBlogData({ ...blogData, [key]: e.target.value });
  };

  // Обработчик загрузки изображений
  const handleFileUpload = (files) => {
    setBlogData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  // Обработчик изменения видео
  const handleVideoChange = (embedUrl) => {
    setBlogData((prev) => ({
      ...prev,
      videos: [{ url: embedUrl, caption: "Video 1" }],
    }));
  };

  // Обработчик точек на карте (если требуется отдельно)
  const handleMapPoints = (points) => {
    setBlogData((prev) => ({
      ...prev,
      maps: points,
    }));
  };

  // Очистка всех маркеров
  const clearMarkers = () => {
    console.log("⚠️ Очистка всех меток");
    setMarkerPositions([]);
  };

  // Обработчик изменений в таблице
  const handleTableChange = (e, rowIndex, column) => {
    setBlogData((prev) => {
      const updatedRows = [...prev.tables.rows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [column]: e.target.value,
      };
      return { ...prev, tables: { ...prev.tables, rows: updatedRows } };
    });
  };

  // Обработчик изменения заголовков столбцов
  const handleHeaderChange = (e, colIndex) => {
    setBlogData((prev) => {
      const updatedColumns = [...prev.tables.columns];
      updatedColumns[colIndex] = e.target.value;

      // Обновляем ключи в каждой строке
      const updatedRows = prev.tables.rows.map((row) => {
        const newRow = { ...row };
        const oldKey = prev.tables.columns[colIndex];
        newRow[e.target.value] = newRow[oldKey] || "";
        delete newRow[oldKey];
        return newRow;
      });

      return {
        ...prev,
        tables: { columns: updatedColumns, rows: updatedRows },
      };
    });
  };

  // Добавление строки в таблицу
  const addRow = () => {
    setBlogData((prev) => {
      const newRow = prev.tables.columns.reduce((acc, col) => {
        acc[col] = "";
        return acc;
      }, {});
      return {
        ...prev,
        tables: {
          ...prev.tables,
          rows: [...prev.tables.rows, newRow],
        },
      };
    });
  };

  // Удаление строки из таблицы
  const removeRow = (rowIndex) => {
    setBlogData((prev) => {
      const updatedRows = prev.tables.rows.filter((_, i) => i !== rowIndex);
      return { ...prev, tables: { ...prev.tables, rows: updatedRows } };
    });
  };

  // Добавление столбца в таблицу
  const addColumn = () => {
    setBlogData((prev) => {
      const existingColumns = prev.tables.columns;
      const columnBaseName = t("Column");
      let columnIndex = 1;
      let newColumn;
      do {
        newColumn = `${columnBaseName} ${columnIndex}`;
        columnIndex++;
      } while (existingColumns.includes(newColumn));

      console.log(`🆕 Добавление новой колонки: ${newColumn}`);

      return {
        ...prev,
        tables: {
          columns: [...existingColumns, newColumn],
          rows: prev.tables.rows.map((row) => ({
            ...row,
            [newColumn]: "",
          })),
        },
      };
    });
  };

  // Удаление столбца из таблицы
  const removeColumn = (colIndex) => {
    setBlogData((prev) => {
      if (prev.tables.columns.length === 1) return prev;
      const updatedColumns = [...prev.tables.columns];
      const removedColumn = updatedColumns[colIndex];
      updatedColumns.splice(colIndex, 1);
      return {
        ...prev,
        tables: {
          columns: updatedColumns,
          rows: prev.tables.rows.map((row) => {
            const newRow = { ...row };
            delete newRow[removedColumn];
            return newRow;
          }),
        },
      };
    });
  };

  // Обработчик отправки формы
  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("title", blogData.title);
    formData.append("description", blogData.description.trim());
    formData.append("tags", JSON.stringify(blogData.tags));

    blogData.images.forEach((file) => {
      formData.append("images", file);
    });

    const formattedMaps = blogData.maps.map((point) => ({
      latitude: point.lat,
      longitude: point.lng,
    }));
    formData.append("maps", JSON.stringify(formattedMaps));
    formData.append("videos", JSON.stringify(blogData.videos));

    const formattedTables = [
      {
        columns: blogData.tables.columns,
        rows: blogData.tables.rows.map((row) => {
          return blogData.tables.columns.reduce((acc, col) => {
            acc[col] = row[col] || "";
            return acc;
          }, {});
        }),
      },
    ];
    formData.append("tables", JSON.stringify(formattedTables));

    console.log("📤 Отправляемые данные:", {
      title: blogData.title,
      description: blogData.description,
      tags: blogData.tags,
      images: blogData.images.map((file) => file.name || file),
      maps: formattedMaps,
      videos: blogData.videos,
      tables: formattedTables,
    });

    for (let pair of formData.entries()) {
      console.log(`🔹 ${pair[0]}:`, pair[1]);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/posts/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        navigate("/");
      } else {
        const errorData = await response.json();
        console.error("❌ Server Error:", errorData);
        alert(
          t("Ошибка при добавлении поста: ") +
            (errorData.message || t("Неизвестная ошибка"))
        );
      }
    } catch (error) {
      console.error("❌ Network Error:", error);
      alert(t("Ошибка сети"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-screen-lg">
        <div className="bg-white shadow-sm rounded-xl p-8">
          <h2 className="text-3xl text-center font-bold mb-12 text-gray-900 flex items-center justify-center gap-2">
            {t("Создать блог")}
            <FiPenTool className="w-6 h-6" />
          </h2>

          {/* Ввод заголовка */}
          <TitleInput
            value={blogData.title}
            onChange={(e) => handleInputChange(e, "title")}
          />

          {/* Загрузка изображений */}
          <h1 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <FiImage className="w-5 h-5" /> {t("Image")}
          </h1>
          <ImageUpload onFilesSelected={handleFileUpload} />

          {/* Описание */}
          <DescriptionInput
            value={blogData.description}
            onChange={(e) => handleInputChange(e, "description")}
          />

          {/* Карта */}
          <h1 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <Map className="w-5 h-5" /> {t("Карта")}
          </h1>

          <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
            <LoadScript
              googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            >
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "400px" }}
                center={{ lat: 41.2995, lng: 69.2401 }}
                zoom={10}
                onClick={handleClick}
              >
                {markerPositions.map((position, index) => (
                  <Marker key={index} position={position} />
                ))}
              </GoogleMap>
            </LoadScript>

            {markerPositions.length > 0 ? (
              <button
                onClick={clearMarkers}
                className="mt-4 px-5 py-3 flex items-center justify-center gap-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
              >
                <FiTrash className="w-5 h-5" />
                {t("Clear All Markers")}
              </button>
            ) : (
              <p className="mt-4 text-center text-gray-500">
                {t("No markers selected. Click on the map to add markers.")}
              </p>
            )}
          </div>

          {/* Видео */}
          <h1 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5" /> {t("Видео")}
          </h1>
          <VideoSection
            videoUrl={blogData.videos.length > 0 ? blogData.videos[0]?.url : ""}
            onChange={handleVideoChange}
          />

          {/* Таблицы */}
          <h1 className="text-lg font-semibold mb-4 mt-2 text-gray-900 flex items-center gap-2">
            <Table className="w-5 h-5" /> {t("Таблица")}
          </h1>
          <TableSection
            tableData={blogData.tables}
            onChange={handleTableChange}
            onHeaderChange={handleHeaderChange}
            onAddRow={addRow}
            onAddColumn={addColumn}
            onRemoveRow={removeRow}
            onRemoveColumn={removeColumn}
          />

          {/* Теги */}
          <TagsInput
            tags={Array.isArray(blogData.tags) ? blogData.tags : []}
            setTags={(updatedTags) =>
              setBlogData((prev) => ({ ...prev, tags: updatedTags }))
            }
          />

          {/* Кнопка отправки */}
          <SubmitButton onSubmit={handleSubmit} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogEditor;
