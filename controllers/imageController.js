const pool = require("../dataBase/db");
const path = require("path");
const fs = require("fs");
const uploadFolder = path.join(__dirname, "../imgs/uploads");
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

exports.getAuthorAnalitic=async (req,res)=>{
    const {userId}=req.params;
    // pool.query("")
}

// Получить все изображения с их тегами и пользователями
exports.getSimpleImages = async (req, res) => {
    const positive = String(req.query.pos);
    const negative = String(req.query.neg);
    const sort=String(req.query.sort);
    const page = (req.query.page ? req.query.page : 0);
    try {
        const [images1] = await pool.promise()
            .execute(`call search_images(${page},${100},'',
            '${positive}','${negative}',${sort},
            '2020-01-01',date_add(CURDATE(), INTERVAL 1 day));`);
        const images = images1[0];
        res.status(200).json({ images });

    } catch (err) {
        console.error("Ошибка при получении изображений:", err);
        res.status(500).json({ message: "Ошибка при получении изображений.", m: err.message });
    }
};

exports.getSimpleUserImages = async (req, res) => {
    try {
        const { id } = req.params;

        const [images1] = await pool.promise().execute(`
        call getAllImagesIfOwner(${id},${(!!req.session.user ? req.session.user.id : 0)});`);
        const images = images1[0];
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