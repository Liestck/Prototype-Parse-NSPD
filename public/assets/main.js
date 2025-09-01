import { Parse } from "../core/parse_methods.js";
import { JsonPretty } from "./jsonPretty.js";
import { ObjectInfo } from "./objectInfo.js";
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
  try {
    // ---- 3.1 Получение данных кадастрового объекта ----
    const data = await Parse.fetchCadastralData(cadastralNumber);

    // ---- 3.2 Отображение информации об объекте ----
    objectInfo.render(data);

    // ---- 3.3 Отображение WMS схемы ----
    await wms.render(cadastralNumber, radius, size);

  } catch (error) {
    // =======================
    // 4. Обработка ошибок
    // =======================
    objectInfo.clear();
    wms.clear();
    console.error("Ошибка:", error);
  }
});
