import { Parse } from "../core/parse_methods.js";

export class WMS {
  constructor(wmsResultId) {
    this.wmsResult = document.getElementById(wmsResultId);
    this.imagePath = null;
    this.bbox = null;
    this.size = null;
  }

  async render(cadastralNumber, radius, size) {
    try {
      const wmsUrl = await Parse.fetchWMS(cadastralNumber, radius, size);
      const filename = `kad_grid_r${radius}_s${size}`;

      // Проверка кеша
      const checkRes = await fetch("/wms/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, cadastralNumber }),
      });
      const checkData = await checkRes.json();

      if (checkData.exists && checkData.path) {
        this.imagePath = checkData.path;
      } else {
        const res = await fetch("/wms/kad_grid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wmsUrl, filename, cadastralNumber }),
        });
        const data = await res.json();
        if (data.path) this.imagePath = data.path;
        else return;
      }

      // bbox
      const bboxMatch = wmsUrl.match(/bbox=([\d.,]+)/i);
      if (!bboxMatch) return;
      this.bbox = bboxMatch[1].split(",").map(Number);
      this.size = size;

      return {
        imagePath: this.imagePath,
        bbox: this.bbox,
        size: this.size
      };

    } catch (err) {
      console.error("Ошибка WMS:", err);
    }
  }

  // === Обязательный метод clear ===
  clear() {
    if (this.wmsResult) this.wmsResult.innerHTML = "";
    this.imagePath = null;
    this.bbox = null;
    this.size = null;
  }
}
