import { BBox } from './bbox_methods.js';

export class Parse {
    /**
     * Получаем данные по кадастровому номеру
     * @param {string} cadastralNumber - кадастровый номер
     * @returns {Promise<Object>} - объект с данными
     */
    static async fetchCadastralData(cadastralNumber) {
        const url = `https://nspd.gov.ru/api/geoportal/v2/search/geoportal?thematicSearchId=1&query=${encodeURIComponent(cadastralNumber)}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`[Parse|fetchCadastralData] Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[Parse|fetchCadastralData] Ошибка при получении данных:', error);
            throw error;
        }
    }

    /**
     * Получаем ссылку на WMS-схему по кадастровому номеру и радиусу
     * @param {string} cadastralNumber - кадастровый номер
     * @param {number} radius - радиус вокруг центра bbox (метры)
     * @returns {Promise<string>} - URL изображения WMS
     */
    static async fetchWMS(cadastralNumber, radius = 1000, size = 512) {
        try {
            const data = await this.fetchCadastralData(cadastralNumber);
            const polygonCoords = data.data.features[0].geometry.coordinates[0];
            const bbox = BBox.getPoints(polygonCoords);
            const bboxString = BBox.getPointsOffset(bbox.center, radius);

            const wmsUrl = `https://nspd.gov.ru/api/aeggis/v3/36048/wms?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=&TRANSPARENT=true&LAYERS=36048&RANDOM=${Math.random()}&WIDTH=${size}&HEIGHT=${size}&CRS=EPSG:3857&BBOX=${bboxString}`;

            return wmsUrl;  
        } catch (error) {
            console.error('[Parse|fetchWMS] Ошибка при формировании WMS ссылки:', error);
            throw error;
        }
    }
}
