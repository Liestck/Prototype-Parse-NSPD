import express from "express";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import https from "https";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

const cacheDir = path.join(process.cwd(), "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

// Раздаём кеш как статические файлы
app.use("/cache", express.static(cacheDir));

app.post("/download-image", async (req, res) => {
    const { wmsUrl, filename, headers } = req.body;

    if (!wmsUrl || !filename) {
        return res.json({
            message: `Сервер получил: URL=${wmsUrl || "пусто"}, filename=${filename || "пусто"}`
        });
    }

    try {
        const timestamp = Date.now();
        const ext = path.extname(filename) || ".png";
        const baseName = path.basename(filename, ext);
        const uniqueName = `${baseName}_${timestamp}${ext}`;
        const filePath = path.join(cacheDir, uniqueName);

        // https.Agent для отключения проверки сертификата (если нужно)
        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await fetch(wmsUrl, {
            method: "GET",
            headers: {
                "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                "priority": "i",
                "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "image",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "cookie": "_ym_uid=1756462943209331712; _ym_d=1756462943; _ym_isad=1; _ym_visorc=b",
                "Referer": "https://nspd.gov.ru/map?thematic=PKK&zoom=17.194654682049404&coordinate_x=4422317.082201003&coordinate_y=5957149.848713932&baseLayerId=235&theme_id=1&is_copy_url=true&active_layers=37578%2C37577%2C36048"
            },
            agent
        });

        if (!response.ok) throw new Error(`Ошибка при скачивании: ${response.statusText}`);

        const buffer = await response.buffer();

        // Проверка на HTML вместо изображения
        const textCheck = buffer.toString("utf8", 0, 15);
        if (textCheck.startsWith("<!DOCTYPE") || textCheck.startsWith("<html")) {
            console.log("Получен HTML вместо изображения:");
            console.log(buffer.toString("utf8"));
            return res.json({ message: "Сервер получил HTML вместо изображения. Проверьте ссылку WMS" });
        }

        fs.writeFileSync(filePath, buffer);

        // Возвращаем путь для frontend
        res.json({ message: `Файл сохранён как ${uniqueName}`, path: `/cache/${uniqueName}` });
    } catch (err) {
        console.error("Ошибка на сервере:", err.message);
        res.json({ message: `Ошибка на сервере: ${err.message}` });
    }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));