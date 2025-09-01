import { Parse } from "../core/parse_methods.js";

export class WMS {
  constructor(wmsResultId) {
    this.wmsResult = document.getElementById(wmsResultId);
  }

  /**
   * Отображаем WMS-схему
   * @param {string} cadastralNumber
   * @param {number} radius
   * @param {number} size
   */
  async render(cadastralNumber, radius, size) {
    try {
      const wmsUrl = await Parse.fetchWMS(cadastralNumber, radius, size);
      const filename = `${cadastralNumber.replace(/:/g, "")}_r${radius}_s${size}`;

      const res = await fetch('/download-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wmsUrl, filename })
      });

      const data = await res.json();
      console.log(data.message || data.error);

      // Используем путь к сохранённому файлу
      if (data.path) {
        this.wmsResult.innerHTML = `
          <img src="${data.path}" 
              alt="WMS схема" 
              width="${size}" 
              height="${size}" 
              style="border:1px solid #ccc; border-radius:8px;">
        `;
      } else {
        this.clear();
      }
    } catch (error) {
      console.error("Ошибка WMS:", error);
      this.clear();
    }
  }

  clear() {
    this.wmsResult.innerHTML = "";
  }
}
