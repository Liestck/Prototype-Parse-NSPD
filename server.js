import express from "express";
import fetch from "node-fetch";
import https from "https";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// Для корректного __dirname в ES-модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Папка кеша
const CACHE_DIR = path.join(__dirname, "cache");
// создаем папку кеша, если нет
await fs.mkdir(CACHE_DIR, { recursive: true });

// Раздача статических файлов
app.use(express.static(path.join(__dirname)));

app.get("/wms", async (req, res) => {
  try {
    const { cadastralNumber, radius = 1000, size = 512 } = req.query;

    if (!cadastralNumber || !size) {
      return res.status(400).send("Missing parameters");
    }

    const cacheFile = path.join(CACHE_DIR, `${cadastralNumber}_${radius}_${size}.png`);

    // Проверяем кеш
    try {
      const cached = await fs.readFile(cacheFile);
      console.log("Используем кеш:", cacheFile);
      res.set("Content-Type", "image/png");
      return res.send(cached);
    } catch {
      // файл в кеше не найден, идем дальше
    }

    // Получаем URL WMS через Parse
    const { Parse } = await import("./core/parse_methods.js");
    const wmsUrl = await Parse.fetchWMS(cadastralNumber, parseInt(radius), parseInt(size));

    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await fetch(wmsUrl, {
      method: "GET",
      headers: {
        "Accept": "image/png",
        "Referer": "https://nspd.gov.ru/map",
      },
      agent,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.buffer();

    // сохраняем в кеш
    await fs.writeFile(cacheFile, buffer);

    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("Ошибка /wms:", err);
    res.status(500).send("Ошибка получения WMS");
  }
});

// Старт сервера
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
