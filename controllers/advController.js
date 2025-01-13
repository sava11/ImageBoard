const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const pool = require("../dataBase/db");

const advFolder = path.join(__dirname, "../imgs/advertisements");
if (!fs.existsSync(advFolder)) fs.mkdirSync(advFolder, { recursive: true });

// Конфигурация Multer для рекламных изображений
const advStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, advFolder),
    filename: (req, file, cb) => {
        const uniqueName = crypto.randomBytes(8).toString("hex") + path.extname(file.originalname);
        cb(null, uniqueName);
    },
}); const advUpload = multer({ storage: advStorage });

exports.uploadAdvImage = advUpload.single("image");

exports.uploadAdvertisementImage = (req, res) => {
    res.json({ message: "Рекламное изображение загружено.", filename: req.file.filename });
};

exports.getAdvertisementImage = (req, res) => {
    const { id } = req.params;
    const filePath = path.join(advFolder, id);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ message: "Изображение не найдено." });
    }
}

exports.getRandomAdvertisementImage = async (req, res) => {
    try {
        const [items] = await pool.promise().execute(`SELECT img_url_link as img_link, adv_url_link as link FROM advertisements WHERE avalible=TRUE;`);
        const data=items[Math.floor(Math.random()*items.length)];
        res.status(200).json({ data });
    } catch (err) {
        console.error("Ошибка при получении изображений:", err);
        res.status(500).json({ message: "Ошибка при получении изображений."});
    }
}