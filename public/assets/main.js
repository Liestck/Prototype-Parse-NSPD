import { Parse } from "../core/parse_methods.js";
import { JsonPretty } from "./jsonPretty.js";
import { ObjectInfo } from "./objectInfo.js";
import { ObjectBorders } from "./objectBorders.js";
import { WMS } from "./WMS.js";

// =======================
// Элементы DOM
// =======================
const cadastralInput = document.getElementById("cadastralInput");
const radiusSlider = document.getElementById("radiusSlider");
const radiusValue = document.getElementById("radiusValue");
const fetchBtn = document.getElementById("fetchBtn");

// =======================
// Модалка JSON
// =======================
const jsonModal = new JsonPretty("jsonModal", "jsonViewer", ".close-btn");

// =======================
// Модули
// =======================
const objectInfo = new ObjectInfo("info", "showJsonBtn", jsonModal);
const wms = new WMS("wmsResult");
const borders = new ObjectBorders("wmsResult");

// =======================
// Обновление текста при движении ползунка
// =======================
radiusSlider.addEventListener("input", () => {
  radiusValue.textContent = radiusSlider.value;
});

// =======================
// Обработчик кнопки "Получить данные"
// =======================
fetchBtn.addEventListener("click", async () => {
  // =======================
  // 1. Получение значений с формы
  // =======================
  const cadastralNumber = cadastralInput.value.trim();
  const radius = parseInt(radiusSlider.value, 10);
  const size = parseInt(
    document.querySelector('input[name="imgSize"]:checked').value,
    10
  );

  // =======================
  // 2. Проверка введенных данных
  // =======================
  if (!cadastralNumber) {
    alert("Введите кадастровый номер!");
    return;
  }

  // =======================
  // 3. Основная логика: запрос данных и рендер
  // =======================
  // === Лоадер внутри кнопки ===
  const btnText = fetchBtn.querySelector(".btn-text");
  const btnLoader = fetchBtn.querySelector(".btn-loader");
  fetchBtn.classList.add("loading");
  btnText.textContent = "";
  btnLoader.style.display = "inline-block";

  try {
    // ---- 3.1 Получение данных кадастрового объекта ----
    const data = await Parse.fetchCadastralData(cadastralNumber);

    // ---- 3.2 Отображение информации об объекте ----
    objectInfo.render(data);

    // ---- 3.3 Отображение WMS схемы ----
    const wmsData = await wms.render(cadastralNumber, radius, size);

    // ---- 3.4 Выделение объекта ----
    const coordinates = data.data.features[0].geometry.coordinates[0];
    if (wmsData) {
      // Инициализируем canvas поверх WMS
      borders.initCanvas(wmsData.imagePath, wmsData.size);
      borders.setData(coordinates, wmsData.bbox);

      const highlightCheckbox = document.getElementById("highlightObject");

      // Показываем контур только если галочка включена
      if (highlightCheckbox.checked) {
        borders.fadeIn();
      } else {
        borders.clear(); // скрываем, если галочка выключена
      }

      // Подписка на динамическое переключение галочки
      highlightCheckbox.addEventListener("change", () => {
        if (highlightCheckbox.checked) borders.fadeIn();
        else borders.fadeOut();
      });
    }
  } catch (error) {
    // =======================
    // 4. Обработка ошибок
    // =======================
    objectInfo.clear();
    wms.clear();
    console.error("Ошибка:", error);
  } finally {
    // === Возвращаем кнопку в нормальное состояние ===
    fetchBtn.classList.remove("loading");
    btnText.textContent = "Получить схему";
    btnLoader.style.display = "none";
  }
});

// =======================
// Обработчик списка ОГРАНИЧЕНИЙ
// =======================
document.querySelectorAll(".collapsible-header").forEach(header => {
  header.addEventListener("click", () => {
    const content = header.nextElementSibling;
    const arrow = header.querySelector(".arrow");

    content.classList.toggle("open");
    arrow.textContent = content.classList.contains("open") ? "▴" : "▾";
  });
});
