export class ObjectBorders {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    this.canvas = null;
    this.ctx = null;
    this.coordinates = null;
    this.bbox = null;
    this.size = null;
    this.opacity = 0;          
    this.animationFrame = null; 
  }

  initCanvas(imagePath, size) {
    this.size = size;

    this.container.innerHTML = `
      <div class="wms-container" style="position:relative; display:inline-block;">
        <img src="${imagePath}" 
            alt="WMS схема" 
            width="${size}" 
            height="${size}" 
            style="border:1px solid #ccc; border-radius:8px; display:block;">
        <canvas id="overlay" width="${size}" height="${size}"
            style="position:absolute; top:0; left:0; pointer-events:none;"></canvas>
      </div>
    `;

    this.canvas = this.container.querySelector("#overlay");
    this.ctx = this.canvas.getContext("2d");
  }

  setData(coordinates, bbox) {
    this.coordinates = coordinates;
    this.bbox = bbox;
    //this.fadeIn();
  }

  draw() {
    if (!this.ctx || !this.coordinates || !this.bbox) return;

    const styles = getComputedStyle(this.container);
    const strokeColor = styles.getPropertyValue("--wms-stroke-color") || "red";
    const fillColor = styles.getPropertyValue("--wms-fill-color") || "rgba(255,0,0,0.3)";

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.size, this.size);

    if (this.opacity <= 0) return; // ничего не рисуем при opacity 0

    ctx.globalAlpha = this.opacity;
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

  fadeIn(duration = 500) {
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

  fadeOut(duration = 500) {
    cancelAnimationFrame(this.animationFrame);
    const start = performance.now();
    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      this.opacity = 1 - progress;
      this.draw();
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.clear(); // полностью убираем canvas после анимации
      }
    };
    requestAnimationFrame(animate);
  }

  clear() {
    if (this.ctx) this.ctx.clearRect(0, 0, this.size, this.size);
    this.opacity = 0;
  }
}
