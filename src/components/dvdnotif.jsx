import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";


const DvdScreenNotif = () => {
  const { t } = useTranslation();
  const [elements, setElements] = useState([]);

  useEffect(() => {

  
    const bounds = {
        top: 0, // Верхняя граница
        bottom: window.innerHeight - 400, // Нижняя граница на 80px выше нижнего края
      };
  
    const numberOfElements = 1;
    const initialElements = Array.from({ length: numberOfElements }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * (bounds.bottom - bounds.top) + bounds.top,
      dx: Math.random() < 0.5 ? 2 : -2,
      dy: Math.random() < 0.5 ? 2 : -2,
    }));
  
    setElements(initialElements);
  
    const interval = setInterval(() => {
      setElements((prevElements) =>
        prevElements.map((el) => {
          let newX = el.x + el.dx;
          let newY = el.y + el.dy;
  
          // Проверка на столкновение с границами
          if (newX <= 0 || newX + 130 >= window.innerWidth) {
            el.dx = -el.dx; // Меняем направление по X
          }
          if (newY <= bounds.top || newY + 90 >= bounds.bottom) {
            el.dy = -el.dy; // Меняем направление по Y
          }
  
          return { ...el, x: newX, y: newY };
        })
      );
    }, 16);
  
    return () => clearInterval(interval);
  }, []);
  

  return (
    <div className="relative h-96 mt-20 w-screen bg-white dark:bg-gray-200 overflow-hidden">
      {/* Плавающие логотипы */}
      {elements.map((el, index) => (
        <svg
          key={index}
          className="absolute w-60 h-60"
          width="90"
          height="60"
          viewBox="0 0 135 90"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            left: el.x,
            top: el.y,
            transition: "transform 0.1s linear",
          }}
        >
            <path
              d='M21.2287 48.305C18.0741 52.1619 15.362 58.4225 22.2434 58.4225H23.6433C34.5695 58.4225 56.7423 45.1298 63.4578 40.3189C60.9493 40.2018 59.484 41.5091 57.53 42.6147C55.656 43.6754 53.9666 44.5814 52.0171 45.5065C48.1682 47.3332 44.2785 49.1555 40.0432 50.5596C29.3582 54.1022 20.3029 53.4992 28.4583 42.7049C29.0434 41.9306 29.9404 41.0368 30.3104 40.3244C29.0139 40.2643 28.502 40.9927 27.7414 41.7534C24.9429 44.5523 25.0606 43.6196 21.2287 48.305Z'
              fill='#0550B2'
            />
            <path
              d='M37.5177 29.1374C37.0134 30.8368 34.9294 37.1992 34.9268 38.4895L40.3232 38.4858L43.4045 27.2814C44.1138 28.0396 47.5569 34.9425 48.6368 36.926C49.322 38.1846 50.0107 38.8002 51.8722 38.7801C54.8558 38.7479 55.4971 35.9056 56.6525 33.8027C57.7308 31.8405 59.3276 29.1322 60.0339 27.1169C60.1585 27.2849 60.1713 27.2701 60.3011 27.5843L60.88 29.808C61.1577 30.8619 61.3958 31.7355 61.6671 32.7473C62.0561 34.1987 62.7954 37.4272 63.3469 38.4895H68.802C68.8217 37.3725 66.7215 30.7304 66.2598 29.1169C65.5523 26.643 64.5031 21.4486 62.9763 20.2569C61.5041 19.1078 59.4869 19.6548 58.5089 20.7318C57.3354 22.0242 52.535 31.4668 51.8738 32.2515C51.1425 31.0507 50.5086 29.6004 49.7629 28.3376C48.8922 26.8626 46.0808 21.5318 45.2947 20.6719C44.2383 19.5165 42.222 19.2682 40.7817 20.2706C39.413 21.2232 38.1926 26.8624 37.5177 29.1374Z'
              fill='#0550B2'
            />
            <path
              d='M89.1998 38.5006C90.3829 38.3963 92.9293 34.8322 93.4576 33.727C90.0174 33.727 86.5768 33.7254 83.1367 33.727C79.4453 33.7287 76.7317 33.7229 75.4581 30.8703C74.0613 27.7416 76.8777 25.1985 79.4297 24.8453C82.0959 24.4764 86.987 24.7696 89.8887 24.7655C90.9581 23.2572 92.5586 21.5669 93.5062 19.9199C89.1092 19.9199 79.9723 19.4368 76.2858 20.5481C65.4472 23.816 67.6807 38.0763 80.3337 38.4766C82.7286 38.5525 86.9261 38.7014 89.1998 38.5006Z'
              fill='#0550B2'
            />
            <path
              d='M10.0089 28.8992C13.6489 33.1392 23.9082 29.5624 27.8609 31.5031L27.8851 33.2237C26.0117 34.2653 15.0071 33.7272 11.9596 33.7272C11.4328 34.4888 10.7775 35.2267 10.1593 36.0718C9.71687 36.6766 8.69505 38.0986 8.40039 38.4364L26.4321 38.4567C35.6522 37.9774 34.011 30.311 32.0445 28.7922C28.5868 26.1218 17.985 28.0114 15.4378 27.2157C14.1361 26.8091 14.0852 25.0903 15.7148 24.8175C16.8081 24.6348 19.1571 24.7665 20.3777 24.7665C23.2177 24.7665 26.6068 24.933 29.3797 24.7255L32.969 19.9465C28.5764 19.7667 23.8715 19.9211 19.4445 19.9201C15.2023 19.9191 10.6169 20.0029 9.31863 23.5641C8.63293 25.4451 8.93977 27.654 10.0089 28.8992Z'
              fill='#0550B2'
            />
            <path
              d='M65.1994 11.5505C61.5564 13.6412 61.8437 13.9792 58.8453 12.4132C59.1783 15.6151 57.6899 15.9752 55.7148 17.2356L55.6376 17.2846C54.6945 17.8863 51.5201 19.9107 50.8809 20.6547C55.554 18.5811 58.504 13.8225 61.5855 17.0638C61.2701 13.6137 62.2104 13.7411 64.6732 12.4255C70.1808 9.48388 75.6988 6.74793 81.8429 4.86962C84.7302 3.98676 93.4264 1.5814 94.6376 5.3977C95.7792 8.99374 90.3892 14.4166 89.1281 16.1947C90.0186 15.7105 92.6286 12.6622 93.4335 11.557C101.056 1.09249 93.9432 0.0769454 83.9191 3.21013C77.9782 5.06732 70.5483 8.48043 65.1994 11.5505Z'
              fill='#0550B2'
            />
        </svg>
      ))}

      {/* Текст и кнопка */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-black z-0">
        <p className="text-lg">{t("Уведомлений пока нет, мы сообщим когда появится важная новость.")}</p> 
        <p className="text-lg mb-6">{t("Cледуйте за интересном контентом вместе с нами.")}</p>
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg"
        >
          {t("Блоги")}
        </Link>
      </div>
    </div>
  );
};

export default DvdScreenNotif;
