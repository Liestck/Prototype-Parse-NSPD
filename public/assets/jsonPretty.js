/**
 * Модуль для отображения JSON в модальном окне
 */
export class JsonPretty {
  constructor(modalId, viewerId, closeBtnSelector) {
    this.modal = document.getElementById(modalId);
    this.viewer = document.getElementById(viewerId);
    this.closeBtn = document.querySelector(closeBtnSelector);

    this.#initEvents();
  }

  /**
   * Показывает JSON в модальном окне
   * @param {Object} jsonData 
   */
  show(jsonData) {
    if (!jsonData) return;
    this.viewer.innerHTML = this.#syntaxHighlight(JSON.stringify(jsonData, null, 2));
    this.modal.style.display = "flex";
  }

  /**
   * Закрывает модальное окно
   */
  hide() {
    this.modal.style.display = "none";
  }

  /**
   * Вешает обработчики для закрытия окна
   */
  #initEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.hide());
    }
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.hide();
        }
      });
    }
  }

  /**
   * Подсветка синтаксиса JSON
   */
  #syntaxHighlight(json) {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "number";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "key";
          } else {
            cls = "string";
          }
        } else if (/true|false/.test(match)) {
          cls = "boolean";
        } else if (/null/.test(match)) {
          cls = "null";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }
}
