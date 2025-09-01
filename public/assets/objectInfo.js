import { BBox } from "../core/bbox_methods.js";

export class ObjectInfo {
  constructor(infoBoxId, showJsonBtnId, jsonModal) {
    this.infoBox = document.getElementById(infoBoxId);
    this.showJsonBtn = document.getElementById(showJsonBtnId);
    this.jsonModal = jsonModal;
    this.lastJsonData = null;

    this.#initEvents();
  }

  render(data) {
    this.lastJsonData = data;

    const feature = data?.data?.features?.[0];
    const props = feature?.properties?.options;
    const geometry = feature?.geometry;

    if (props && geometry) {
        // вычисляем центральную точку bbox и конвертируем в lon/lat
        const polygonCoords = geometry.coordinates[0];
        const bbox = BBox.getPoints(polygonCoords);
        let coordsText = "—";
        if (bbox?.center) {
        const [lon, lat] = BBox.toLonLat(bbox.center);
        coordsText = `${lat.toFixed(6)}, ${lon.toFixed(6)}`; // шесть знаков после запятой
        }

        let areaText = "—";
        if (props.specified_area) {
        const sqMeters = props.specified_area;
        const sotkas = (sqMeters / 100).toFixed(1);
        areaText = `${sqMeters} м² (${sotkas} сот)`;
        }

        if (bbox?.center) {
            const [lon, lat] = BBox.toLonLat(bbox.center);

            // формируем ссылку на Яндекс.Карты
            const yandexUrl = `https://yandex.ru/maps/?ll=${lon}%2C${lat}&mode=search&sll=${lon}%2C${lat}&text=${lat}%2C${lon}&z=18`;

            coordsText = `<a href="${yandexUrl}" target="_blank" style="color:#A52A2A; text-decoration:underline;">${lat.toFixed(6)}, ${lon.toFixed(6)}</a>`;
        }

        this.infoBox.innerHTML = `
            <p><b>Кадастровый номер:</b><br>${props.cad_num}</p>
            <p><b>Адрес:</b><br>${props.readable_address || "—"}</p>
            <p><b>Площадь:</b><br>${areaText}</p>
            <p><b>Назначение:</b><br>${props.permitted_use_established_by_document || "—"}</p>
            <p><b>Кадастровая стоимость:</b><br>${
                props.cost_value 
                    ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(props.cost_value)
                    : "—"
            }</p>
            <p><b>Координаты:</b><br>${coordsText}</p>
            `;
            this.showJsonBtn.style.display = "inline-block";
    } else {
        this.infoBox.innerHTML = `<p style="color:red;">Нет данных по объекту</p>`;
        this.showJsonBtn.style.display = "none";
    }
}

  clear() {
    this.infoBox.innerHTML = "";
    this.showJsonBtn.style.display = "none";
    this.lastJsonData = null;
  }

  #initEvents() {
    if (this.showJsonBtn) {
      this.showJsonBtn.addEventListener("click", () => {
        if (this.lastJsonData) {
          this.jsonModal.show(this.lastJsonData);
        }
      });
    }
  }
}
