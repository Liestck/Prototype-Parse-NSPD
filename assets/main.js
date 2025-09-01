import { Parse } from "../core/parse_methods.js";
import { JsonPretty } from "./jsonPretty.js";
import { ObjectInfo } from "./objectInfo.js";
import { WMS } from "./WMS.js";

// элементы
const cadastralInput = document.getElementById("cadastralInput");
const radiusSlider = document.getElementById("radiusSlider");
const radiusValue = document.getElementById("radiusValue");
const fetchBtn = document.getElementById("fetchBtn");

// модалка JSON
const jsonModal = new JsonPretty("jsonModal", "jsonViewer", ".close-btn");

// модули
const objectInfo = new ObjectInfo("info", "showJsonBtn", jsonModal);
const wms = new WMS("wmsResult");

// обновляем текст при движении ползунка
radiusSlider.addEventListener("input", () => {
  radiusValue.textContent = radiusSlider.value;
});

// обработчик кнопки
fetchBtn.addEventListener("click", async () => {
  const cadastralNumber = cadastralInput.value.trim();
  const radius = parseInt(radiusSlider.value, 10);
  const size = parseInt(
    document.querySelector('input[name="imgSize"]:checked').value,
    10
  );

  if (!cadastralNumber) {
    alert("Введите кадастровый номер!");
    return;
  }

  try {
    // получаем данные
    const data = await Parse.fetchCadastralData(cadastralNumber);

    // секция "Информация"
    objectInfo.render(data);

    // WMS схема
    await wms.render(cadastralNumber, radius, size);
  } catch (error) {
    objectInfo.clear();
    wms.clear();
    console.error("Ошибка:", error);
  }
});
