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


// ======================================
// Загрузка кадастровой сетки
// ======================================
app.post("/wms/get_layer", async (req, res) => {
    const { wmsUrl, filename, cadastralNumber, layer } = req.body;

    if (!wmsUrl || !filename || !cadastralNumber) {
        return res.json({ message: "Не хватает данных для сохранения" });
    }

    try {
        // папка = cache/{cadastralNumber без :}
        const safeCadastral = cadastralNumber.replace(/:/g, "");
        const dirPath = path.join(cacheDir, safeCadastral);
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

        const ext = path.extname(filename) || ".png";
        const baseName = path.basename(filename, ext);
        const uniqueName = `${baseName}${ext}`; // фиксированное имя
        const filePath = path.join(dirPath, uniqueName);

        // https.Agent для отключения проверки сертификата (если нужно)
        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await fetch(wmsUrl, {
            method: "GET",
            headers: {
                "Referer": `https://nspd.gov.ru/map?thematic=PKK&zoom=17.194654682049404&coordinate_x=4422317.082201003&coordinate_y=5957149.848713932&baseLayerId=235&theme_id=1&is_copy_url=true&active_layers=37578%2C37577%2C${layer}`
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
        res.json({
            message: `Файл сохранён как ${safeCadastral}/${uniqueName}`,
            path: `/cache/${safeCadastral}/${uniqueName}`
        });
    } catch (err) {
        console.error("Ошибка на сервере:", err.message);
        res.json({ message: `Ошибка на сервере: ${err.message}` });
    }
});

// ======================================
// Оптимизация: Проверка наличия в кеше
// ======================================
app.post("/wms/check", async (req, res) => {
    const { cadastralNumber, filename } = req.body;

    if (!cadastralNumber || !filename) {
        return res.json({ exists: false });
    }

    try {
        const safeCadastral = cadastralNumber.replace(/:/g, "");
        const filePath = path.join(cacheDir, safeCadastral, `${filename}.png`);

        if (fs.existsSync(filePath)) {
            return res.json({
                exists: true,
                path: `/cache/${safeCadastral}/${filename}.png`
            });
        } else {
            return res.json({ exists: false });
        }
    } catch (err) {
        console.error("Ошибка при проверке кеша:", err.message);
        return res.json({ exists: false });
    }
});

// ======================================
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
