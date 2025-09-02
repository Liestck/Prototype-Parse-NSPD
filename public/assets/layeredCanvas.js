import { config } from "/config.js";

export class LayeredCanvas {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    this.canvas = null;
    this.ctx = null;
    this.coordinates = null;
    this.bbox = null;
    this.size = null;
    this.opacity = 0;
    this.animationFrame = null;
    this.images = [];
    this.imageLayers = [];
  }

  getLayerIdFromPath(path) {
    const match = path.match(/l(\d+)_/);
    return match ? match[1] : null;
  }

  initCanvas(imagePaths, size) {
    this.size = size;

    this.container.innerHTML = `
      <canvas id="overlay" width="${size}" height="${size}"
          style="border:1px solid #ccc; border-radius:8px; display:block;"></canvas>
    `;

    this.canvas = this.container.querySelector("#overlay");
    this.ctx = this.canvas.getContext("2d");

    // Извлекаем layerId для каждого изображения
    this.imageLayers = imagePaths.map((path) => this.getLayerIdFromPath(path));

    // Если object_borders нет в списке, добавляем его
    if (!this.imageLayers.includes("object_borders")) {
      this.imageLayers.push("object_borders");
      imagePaths.push(null); // null для placeholder, изображение для object_borders не требуется
    }

    // Сортируем изображения по приоритету из конфига
    const sorted = imagePaths
      .map((path, i) => ({ path, layer: this.imageLayers[i] }))
      .sort((a, b) => {
        const priorityA = config.layersPriority[a.layer] ?? 999;
        const priorityB = config.layersPriority[b.layer] ?? 999;
        return priorityA - priorityB; // меньше = рисуется раньше
    });

    const sortedPaths = sorted.map((item) => item.path);
    this.imageLayers = sorted.map((item) => item.layer);

    // Загружаем изображения (кроме object_borders)
    this.images = sortedPaths.map((src, i) => {
      if (this.imageLayers[i] === "object_borders") return null;
      const img = new Image();
      img.src = src;
      return img;
    });

    let loadedCount = 0;
    const totalImages = this.images.filter((img) => img !== null).length;

    if (totalImages === 0) {
      // Нет фоновых изображений, сразу рисуем контур
      this.draw();
      return;
    }

    this.images.forEach((img) => {
      if (!img) return;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          this.draw();
        }
      };
    });
  }

  setData(coordinates, bbox) {
    this.coordinates = coordinates;
    this.bbox = bbox;
  }

  draw() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.size, this.size);

    // Рисуем все фоновые слои
    this.images.forEach((img, i) => {
      if (img) {
        ctx.globalAlpha = 1;
        ctx.drawImage(img, 0, 0, this.size, this.size);
      }
    });

    // Рисуем контур (object_borders)
    const borderIndex = this.imageLayers.indexOf("object_borders");
    if (borderIndex >= 0 && this.coordinates && this.bbox && this.opacity > 0) {
      ctx.globalAlpha = this.opacity;
      const styles = getComputedStyle(this.container);
      const strokeColor = styles.getPropertyValue("--wms-stroke-color") || "red";
      const fillColor = styles.getPropertyValue("--wms-fill-color") || "rgba(255,0,0,0.3)";
      ctx.strokeStyle = strokeColor.trim();
      ctx.fillStyle = fillColor.trim();
      ctx.lineWidth = 2;

      ctx.beginPath();
      this.coordinates.forEach(([x, y], i) => {
        const px = ((x - this.bbox[0]) / (this.bbox[2] - this.bbox[0])) * this.size;
        const py = this.size - ((y - this.bbox[1]) / (this.bbox[3] - this.bbox[1])) * this.size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  fadeIn(duration = 200) {
    cancelAnimationFrame(this.animationFrame);
    const start = performance.now();
    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      this.opacity = progress;
      this.draw();
      if (progress < 1) this.animationFrame = requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  fadeOut(duration = 200) {
    cancelAnimationFrame(this.animationFrame);
    const start = performance.now();
    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      this.opacity = 1 - progress;
      this.draw();
      if (progress < 1) this.animationFrame = requestAnimationFrame(animate);
      else this.clear();
    };
    requestAnimationFrame(animate);
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.size, this.size);
    this.opacity = 0;

    // Рисуем только фоновые слои
    this.images.forEach((img) => {
      if (img) {
        this.ctx.globalAlpha = 1;
        this.ctx.drawImage(img, 0, 0, this.size, this.size);
      }
    });
  }
}
