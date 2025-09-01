export class BBox {
    /**
     * Вычисляем bbox полигона и центр
     * @param {Array} coords - массив точек полигона, каждая точка [x, y]
     * @returns {Object} - объект с:
     *   leftTop: [x, y] - координаты левого верхнего угла bbox
     *   rightBottom: [x, y] - координаты правого нижнего угла bbox
     *   center: [x, y] - координаты центра bbox
     */
    static getPoints(coords) {
        if (!coords || coords.length === 0) return null;

        let minX = coords[0][0],
            maxX = coords[0][0],
            minY = coords[0][1],
            maxY = coords[0][1];

        coords.forEach(([x, y]) => {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });

        const center = [(minX + maxX) / 2, (minY + maxY) / 2];

        return {
            leftTop: [minX, maxY],
            rightBottom: [maxX, minY],
            center: center
        };
    }

    /**
     * Строим bbox вокруг центра с радиусом
     * @param {Array} center - массив [x, y]
     * @param {number} radius - радиус в метрах (по умолчанию 1000)
     * @returns {string} - строка "minX,minY,maxX,maxY"
     */
    static getPointsOffset(center, radius = 1000) {
        const [x, y] = center;

        const minX = x - radius;
        const maxX = x + radius;
        const minY = y - radius;
        const maxY = y + radius;

        return `${minX},${minY},${maxX},${maxY}`;
    }

    /**
     * Конвертируем координату из Web Mercator (EPSG:3857) в географические координаты
     * @param {Array} center - [x, y] в метрах
     * @returns {Array} [lon, lat] в градусах
     */
    static toLonLat(center) {
        if (!center || center.length !== 2) return [0, 0];
        const [x, y] = center;
        const R = 6378137; // радиус Земли
        const lon = (x / R) * (180 / Math.PI);
        const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
        return [lon, lat];
    }
}
