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
      this.wmsResult.innerHTML = `
        <img src="${wmsUrl}" 
            alt="WMS схема" 
            width="${size}" 
            height="${size}" 
            style="border:1px solid #ccc; border-radius:8px;">
      `;
    } catch (error) {
      console.error("Ошибка WMS:", error);
      this.clear();
    }
  }

  clear() {
    this.wmsResult.innerHTML = "";
  }
}
