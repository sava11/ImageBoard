const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const pool = require("../dataBase/db");
// Папки для хранения изображений
const uploadFolder = path.join(__dirname, "../imgs/uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

// Конфигурация Multer для обычных изображений
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadFolder),
    filename: (req, file, cb) => {
        const uniqueName = crypto.randomBytes(16).toString("hex") + path.extname(file.originalname);
        cb(null, uniqueName);
    },
}); const upload = multer({ storage });

exports.uploadImage = upload.single("image");

exports.saveImageData = async (req, res) => {
    const { description, tags, status } = req.body;
    if (!req.file || !req.session.user) {
        return res.status(400).json({ message: "нет изображения." });
    }

    const userId = req.session.user.id;
    const imageId = path.basename(req.file.filename).split(".")[0];
    const today = new Date().toISOString().split("T")[0];

    try {
        // Сохранение изображения
        await pool.promise().execute(
            `INSERT INTO images (id, user_id, date, ext, status, \`desc\`) VALUES (?, ?, ?, ?, ?, ?)`,
            [imageId, userId, today, path.extname(req.file.filename).slice(1), status, description || null]
        );

        // Сохранение тегов
        if (tags && tags.length > 0) {
            const tagIds = JSON.parse(tags);
            for (const tagId of tagIds) {
                await pool.promise().execute(
                    `INSERT INTO trusted_tags_connections (image_id, tag_id) VALUES (?, ?)`,
                    [imageId, tagId]
                );
            }
        }
        res.status(200).json({ message: "изображение сохранено.", id:imageId });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Ошибка сохранения изображения." });
    }
};

exports.getImageById = async (req, res) => {
    const { id } = req.params;
    const [image_data] = await pool.promise().execute(`
        SELECT ext FROM images WHERE id=\"${id}\";`);
    if (Object.keys(image_data).length > 0) {
        const ext = image_data[0].ext

        const filePath = path.join(uploadFolder, id + "." + ext);

        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ message: "Изображение не найдено." });
        }
    } else {
        res.status(404).json({ message: "Изображение не найдено." });
    }
};

// Получить все изображения с их тегами и пользователями
exports.getSimpleImages = async (req, res) => {
    const page=0;
    try {
        const [images1] = await pool.promise()
        .execute(`call search_images(${page},${100},'','');`);
        const images=images1[0];
        res.status(200).json({ images });

    } catch (err) {
        console.error("Ошибка при получении изображений:", err);
        res.status(500).json({ message: "Ошибка при получении изображений.", m: err.m });
    }
};

exports.getSimpleUserImages = async (req, res) => {
    try {
        const { id } = req.params;

        const [images1] = await pool.promise().execute(`
        call getAllImagesIfOwner(${id},${(!!req.session.user ? req.session.user.id : 0)});`);
        const images=images1[0];
        res.status(200).json({ images });
    } catch (err) {
        console.error("Ошибка при получении изображений:", err);
        res.status(500).json({ message: "Ошибка при получении изображений.", m: err.message });
    }
};

exports.getImage = async (req, res) => {
    try {
        const [images] = await pool.execute(`
        SELECT 
            i.id,
            i.ext,
            (
                SELECT COUNT(v.image_id) 
                FROM votes v 
                WHERE v.type = 1 AND v.image_id = i.id
            ) AS likes,
            (
                SELECT COUNT(v.image_id) 
                FROM votes v 
                WHERE v.type = 0 AND v.image_id = i.id
            ) AS dislikes
        FROM 
            images i;`);
        // Преобразование массива изображений в нужный формат
        const formattedImages = images.map(image => ({
            id: image.id,
            ext: image.ext,
            likes: image.likes,
            dislikes: image.dislikes
        }));
        res.status(200).json({ images: formattedImages });
    } catch (err) {
        console.error("Ошибка при получении изображений:", err);
        res.status(500).json({ message: "Ошибка при получении изображений.", m: err.m });
    }
};

exports.getTags = async (req, res) => {
    try {
        const { q } = req.query;
        // if (!q) return res.json([]);

        const [results] = await pool.promise().execute(`
          SELECT id,name FROM trusted_tags WHERE name LIKE CONCAT('%', ?, '%')
        `, [q]);
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Ошибка отправки поиска", m: err.message });

    }
}
// exports.addTags = async (req, res) => {
//     const { tagName } = req.body;

//     if (!tagName) return res.status(400).json({ message: "Тег не может быть пустым" });

//     // Проверяем, существует ли тег в trusted_tags
//     const [trusted] = await pool.promise().execute(`
//         SELECT id FROM trusted_tags WHERE name = ?
//       `, [tagName]);

//     if (trusted.length > 0) {
//         return res.json({ message: "Тег уже добавлен как доверенный" });
//     }

//     // Если не существует, добавляем в untrusted_tags
//     const [untrusted] = await pool.promise().execute(`
//         SELECT id FROM untrusted_tags WHERE name = ?
//       `, [tagName]);

//     if (untrusted.length === 0) {
//         await pool.promise().execute(`
//           INSERT INTO untrusted_tags (name) VALUES (?)
//         `, [tagName]);

//         return res.json({ message: "Тег добавлен в список недоверенных" });
//     }

//     res.json({ message: "Тег уже существует в недоверенных" });
// }