import { Parse } from "../core/parse_methods.js";

export class WMS {
  // ===========================
  // Конструктор класса WMS
  // ===========================
  constructor(wmsResultId) {
    this.wmsResult = document.getElementById(wmsResultId);
    this.imagePath = [];
    this.bbox = null;
    this.size = null;
  }

  // ===========================
  // Основной метод render
  // ===========================
  async render(cadastralNumber, radius, size, layers) {
    try {
      

      for (const layer of layers) {
        console.log(`Включен слой: ${layer}`)

        // ---------------------------
        // Получение WMS URL через Parse.fetchWMS
        // ---------------------------
        const wmsUrl = await Parse.fetchWMS(cadastralNumber, radius, size, layer);

        const filename = `wms_l${layer}_r${radius}_s${size}`;

        // ---------------------------
        // Проверка кеша на сервере
        // ---------------------------
        const checkRes = await fetch("/wms/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename, cadastralNumber }),
        });
        const checkData = await checkRes.json();

        if (checkData.exists && checkData.path) {
          // Если изображение уже есть на сервере, используем его
          this.imagePath.push(checkData.path);
        } else {
          // ---------------------------
          // Если изображения нет, запрос нового слоя
          // ---------------------------
          const res = await fetch("/wms/get_layer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wmsUrl, filename, cadastralNumber, layer }),
          });
          const data = await res.json();
          if (data.path) this.imagePath.push(data.path);
          else return; // Если путь не пришёл, выходим
        }

        // ---------------------------
        // Извлечение bbox из URL WMS
        // ---------------------------
        const bboxMatch = wmsUrl.match(/bbox=([\d.,]+)/i);
        if (!bboxMatch) return; // Если bbox не найден, выходим
        this.bbox = bboxMatch[1].split(",").map(Number);
        this.size = size;
      };

      // ---------------------------
      // Возвращаем результат
      // ---------------------------
      return {
        imagePath: this.imagePath,
        bbox: this.bbox,
        size: this.size
      };

    } catch (err) {
      console.error("Ошибка WMS:", err);
    }
  }

  // ===========================
  // Метод очистки
  // ===========================
  clear() {
    if (this.wmsResult) this.wmsResult.innerHTML = ""; // Очистка HTML
    this.imagePath = [];   // Сброс пути к изображению
    this.bbox = null;      // Сброс bbox
    this.size = null;      // Сброс размера
  }
}
