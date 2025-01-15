import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useState } from "react";

function Footer() {
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <footer class="bg-blue-700 border-gray-200 dark:bg-gray-900">
            <div class="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8 text-white">
            <div className="flex flex-wrap justify-between items-center space-y-4 lg:space-y-0">
                <Link to="/" className="flex items-center">
                    <svg width="105" height="60" viewBox="0 0 105 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.2287 48.305C18.0741 52.1619 15.362 58.4225 22.2434 58.4225H23.6433C34.5695 58.4225 56.7423 45.1298 63.4578 40.3189C60.9493 40.2018 59.484 41.5091 57.53 42.6147C55.656 43.6754 53.9666 44.5814 52.0171 45.5065C48.1682 47.3332 44.2785 49.1555 40.0432 50.5596C29.3582 54.1022 20.3029 53.4992 28.4583 42.7049C29.0434 41.9306 29.9404 41.0368 30.3104 40.3244C29.0139 40.2643 28.502 40.9927 27.7414 41.7534C24.9429 44.5523 25.0606 43.6196 21.2287 48.305Z" fill="white"/>
                        <path d="M37.5177 29.1374C37.0134 30.8368 34.9294 37.1992 34.9268 38.4895L40.3232 38.4858L43.4045 27.2814C44.1138 28.0396 47.5569 34.9425 48.6368 36.926C49.322 38.1846 50.0107 38.8002 51.8722 38.7801C54.8558 38.7479 55.4971 35.9056 56.6525 33.8027C57.7308 31.8405 59.3276 29.1322 60.0339 27.1169C60.1585 27.2849 60.1713 27.2701 60.3011 27.5843L60.88 29.808C61.1577 30.8619 61.3958 31.7355 61.6671 32.7473C62.0561 34.1987 62.7954 37.4272 63.3469 38.4895H68.802C68.8217 37.3725 66.7215 30.7304 66.2598 29.1169C65.5523 26.643 64.5031 21.4486 62.9763 20.2569C61.5041 19.1078 59.4869 19.6548 58.5089 20.7318C57.3354 22.0242 52.535 31.4668 51.8738 32.2515C51.1425 31.0507 50.5086 29.6004 49.7629 28.3376C48.8922 26.8626 46.0808 21.5318 45.2947 20.6719C44.2383 19.5165 42.222 19.2682 40.7817 20.2706C39.413 21.2232 38.1926 26.8624 37.5177 29.1374Z" fill="white"/>
                        <path d="M89.1998 38.5006C90.3829 38.3963 92.9293 34.8322 93.4576 33.727C90.0174 33.727 86.5768 33.7254 83.1367 33.727C79.4453 33.7287 76.7317 33.7229 75.4581 30.8703C74.0613 27.7416 76.8777 25.1985 79.4297 24.8453C82.0959 24.4764 86.987 24.7696 89.8887 24.7655C90.9581 23.2572 92.5586 21.5669 93.5062 19.9199C89.1092 19.9199 79.9723 19.4368 76.2858 20.5481C65.4472 23.816 67.6807 38.0763 80.3337 38.4766C82.7286 38.5525 86.9261 38.7014 89.1998 38.5006Z" fill="white"/>
                        <path d="M10.0089 28.8992C13.6489 33.1392 23.9082 29.5624 27.8609 31.5031L27.8851 33.2237C26.0117 34.2653 15.0071 33.7272 11.9596 33.7272C11.4328 34.4888 10.7775 35.2267 10.1593 36.0718C9.71687 36.6766 8.69505 38.0986 8.40039 38.4364L26.4321 38.4567C35.6522 37.9774 34.011 30.311 32.0445 28.7922C28.5868 26.1218 17.985 28.0114 15.4378 27.2157C14.1361 26.8091 14.0852 25.0903 15.7148 24.8175C16.8081 24.6348 19.1571 24.7665 20.3777 24.7665C23.2177 24.7665 26.6068 24.933 29.3797 24.7255L32.969 19.9465C28.5764 19.7667 23.8715 19.9211 19.4445 19.9201C15.2023 19.9191 10.6169 20.0029 9.31863 23.5641C8.63293 25.4451 8.93977 27.654 10.0089 28.8992Z" fill="white"/>
                        <path d="M65.1994 11.5509C61.5564 13.6417 61.8437 13.9797 58.8453 12.4137C59.1783 15.6156 57.6899 15.9757 55.7148 17.2361L55.6376 17.2851C54.6945 17.8868 51.5201 19.9112 50.8809 20.6552C55.554 18.5816 58.504 13.823 61.5855 17.0643C61.2701 13.6142 62.2104 13.7416 64.6732 12.426C70.1808 9.48437 75.6988 6.74842 81.8429 4.87011C84.7302 3.98725 93.4264 1.58189 94.6376 5.39819C95.7792 8.99423 90.3892 14.4171 89.1281 16.1951C90.0186 15.7109 92.6286 12.6627 93.4335 11.5575C101.056 1.09298 93.9432 0.0774337 83.9191 3.21062C77.9782 5.0678 70.5483 8.48092 65.1994 11.5509Z" fill="white"/>
                        </svg>
                    </Link>
                    {/* Кнопка-гамбургер */}
          <button
            className="block lg:hidden text-white focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
                    <nav
            className={`${
              menuOpen ? "block" : "hidden"
            } lg:flex space-x-6 text-white font-medium`}
          >
            <a href="#" className="hover:underline">
              {t("Курсы")}
            </a>
            <a href="#" className="hover:underline">
              {t("Статьи")}
            </a>
            <a href="#" className="hover:underline">
              {t("Видео")}
            </a>
            <a href="#" className="hover:underline">
              {t("Книги")}
            </a>
            <a href="#" className="hover:underline">
              {t("Молодёжные проекты")}
            </a>
            <a href="#" className="hover:underline">
              {t("О нас")}
            </a>
            <Link to="/" className="text-white hover:underline">
              {t("Блоги")}
            </Link>
          </nav>
                </div>
                <hr class="my-6 border-gray-300" />
                <div class="flex justify-between items-center">
                    <span class="text-sm">© SMC 2024. {t("Все права защищены")}</span>
                    <div class="flex space-x-6">
                        <a href="#" class="hover:text-gray-300">
                            <i class="fab fa-youtube text-xl">
                                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="44" height="44" rx="22" fill="white"/>
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9104 16.2359C11.2427 17.1773 11.1819 18.196 11.0601 20.2336C11.0231 20.8517 11 21.456 11 22C11 22.544 11.0231 23.1483 11.0601 23.7664C11.1819 25.804 11.2427 26.8227 11.9104 27.7641C12.1017 28.0337 12.4213 28.3725 12.6793 28.5791C13.5802 29.3006 14.5924 29.4206 16.6169 29.6605C18.2232 29.851 20.0319 30 21.7586 30C23.4853 30 25.294 29.851 26.9004 29.6605C28.9248 29.4206 29.9371 29.3006 30.8379 28.5791C31.096 28.3725 31.4155 28.0337 31.6068 27.7641C32.2745 26.8227 32.3354 25.804 32.4572 23.7664C32.4941 23.1483 32.5172 22.544 32.5172 22C32.5172 21.456 32.4941 20.8517 32.4572 20.2336C32.3354 18.196 32.2745 17.1773 31.6068 16.2359C31.4155 15.9663 31.096 15.6275 30.8379 15.4209C29.9371 14.6994 28.9248 14.5794 26.9004 14.3395C25.294 14.149 23.4853 14 21.7586 14C20.0319 14 18.2232 14.149 16.6169 14.3395C14.5924 14.5794 13.5802 14.6994 12.6793 15.4209C12.4213 15.6275 12.1017 15.9663 11.9104 16.2359ZM25.1872 21.4575C24.9692 20.8466 24.1115 20.4178 22.3961 19.5601C20.9687 18.8464 20.2551 18.4896 19.6807 18.6293C19.3486 18.7101 19.0508 18.8941 18.8301 19.155C18.4483 19.6063 18.4483 20.4042 18.4483 22C18.4483 23.5958 18.4483 24.3937 18.8301 24.845C19.0508 25.1059 19.3486 25.2899 19.6807 25.3707C20.2551 25.5104 20.9687 25.1536 22.3961 24.4399C24.1115 23.5822 24.9692 23.1533 25.1872 22.5425C25.3124 22.1917 25.3124 21.8083 25.1872 21.4575Z" fill="#3D424D"/>
                            </svg>
                            </i>
                        </a>
                        <a href="#" class="hover:text-gray-300">
                            <i class="fab fa-instagram text-xl">
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="44" height="44" rx="22" fill="white"/>
                                <path d="M21.999 25.3323C23.8399 25.3323 25.3323 23.8399 25.3323 21.999C25.3323 20.158 23.8399 18.6656 21.999 18.6656C20.158 18.6656 18.6656 20.158 18.6656 21.999C18.6656 23.8399 20.158 25.3323 21.999 25.3323Z" fill="#3D424D"/>
                                <path d="M26.1658 12H17.8325C14.6167 12 12 14.6175 12 17.8342V26.1675C12 29.3833 14.6175 32 17.8342 32H26.1675C29.3833 32 32 29.3825 32 26.1658V17.8325C32 14.6167 29.3825 12 26.1658 12ZM22 27C19.2425 27 17 24.7575 17 22C17 19.2425 19.2425 17 22 17C24.7575 17 27 19.2425 27 22C27 24.7575 24.7575 27 22 27ZM27.8333 17C27.3733 17 27 16.6267 27 16.1667C27 15.7067 27.3733 15.3333 27.8333 15.3333C28.2933 15.3333 28.6667 15.7067 28.6667 16.1667C28.6667 16.6267 28.2933 17 27.8333 17Z" fill="#3D424D"/>
                                </svg>
                            </i>
                        </a>
                        <a href="#" class="hover:text-gray-300">
                            <i class="fab fa-telegram text-xl">
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="44" height="44" rx="22" fill="white"/>
                                <path d="M30.9593 14.3452C30.9433 14.2714 30.9079 14.2032 30.8568 14.1475C30.8058 14.0919 30.7409 14.0507 30.6687 14.0283C30.4061 13.9766 30.1344 13.996 29.8818 14.0846C29.8818 14.0846 12.3587 20.3827 11.358 21.0802C11.1418 21.2302 11.0699 21.3171 11.0343 21.4202C10.8612 21.9165 11.3999 22.1352 11.3999 22.1352L15.9162 23.6071C15.9925 23.6203 16.0708 23.6156 16.1449 23.5934C17.1724 22.9446 26.4818 17.0659 27.02 16.8684C27.1043 16.8427 27.1668 16.8684 27.1531 16.9309C26.9331 17.6846 18.8937 24.829 18.8493 24.8728C18.8277 24.8904 18.8108 24.9131 18.7999 24.9388C18.789 24.9645 18.7845 24.9924 18.7868 25.0203L18.3668 29.4271C18.3668 29.4271 18.1906 30.8021 19.5631 29.4271C20.5362 28.4528 21.4699 27.6465 21.9381 27.2546C23.4912 28.3265 25.1624 29.5121 25.8831 30.1296C26.004 30.2471 26.1473 30.3389 26.3045 30.3997C26.4618 30.4605 26.6296 30.489 26.7981 30.4834C27.4856 30.4571 27.6731 29.7053 27.6731 29.7053C27.6731 29.7053 30.8656 16.8584 30.9731 15.1365C30.9831 14.9677 30.9975 14.8596 30.9987 14.744C31.0044 14.6099 30.9912 14.4756 30.9593 14.3452Z" fill="#3D424D"/>
                                </svg>
                            </i>
                        </a>
                        <a href="#" class="hover:text-gray-300">
                            <i class="fab fa-facebook text-xl">
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="44" height="44" rx="22" fill="white"/>
                                <path d="M18.9748 32V23.3333H16V19.3333H18.9748V16.54C18.9748 13.4972 20.9011 12 23.6155 12C24.9157 12 26.0332 12.0968 26.3589 12.1401V15.32L24.4763 15.3208C23 15.3208 22.6667 16.0223 22.6667 17.0517V19.3333H26.6667L25.3333 23.3333H22.6667V32H18.9748Z" fill="#3D424D"/>
                                </svg>
                            </i>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
