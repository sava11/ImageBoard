const pool = require("../dataBase/db.js");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
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

exports.savePostData = async (req, res) => {
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
            `INSERT INTO images (id, user_id, date, ext, status, \`desc\`) VALUES (?, ?, NOW(), ?, ?, ?)`,
            [imageId, userId, path.extname(req.file.filename).slice(1), status, description || null]
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
        res.status(200).json({ message: "изображение сохранено.", id: imageId });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Ошибка сохранения изображения." });
    }
};

exports.uploadPost = (req, res) => {
    res.render("upload.hbs", {
        userName: req.session.user ? req.session.user.login : "Войти",
        isAuthenticated: !!req.session.user, // true, если пользователь вошёл
    }); // Отображаем форму загрузки
};

exports.getPostById = async (req, res) => {
    const { id } = req.params;
    try {
        const isAuthenticated = !!req.session.user; // true, если пользователь вошёл
        const curUserID = (isAuthenticated ? req.session.user.id : 0);
        const query = `
            SELECT 
                i.id,
                i.ext,
                i.desc,
                i.status,
                u.login AS author_name,
                u.id AS author_id,
                GROUP_CONCAT(t.id SEPARATOR ', ') AS tag_ids,
                GROUP_CONCAT(t.name SEPARATOR ', ') AS tags,
                (
                    SELECT COUNT(v.image_id) 
                    FROM votes v 
                    WHERE v.type = 1 AND v.image_id = i.id
                ) AS likes,
                (
                    SELECT COUNT(v.image_id) 
                    FROM votes v 
                    WHERE v.type = 0 AND v.image_id = i.id
                ) AS dislikes,
                (
                    SELECT v.type
                    FROM votes v
                    WHERE v.image_id = i.id AND v.user_id = ${curUserID}
                    LIMIT 1
                ) AS action
            FROM 
                images i
            LEFT JOIN 
                trusted_tags_connections tc ON i.id = tc.image_id
            LEFT JOIN 
                trusted_tags t ON tc.tag_id = t.id
            LEFT JOIN 
                users u ON i.user_id = u.id
            WHERE 
                i.id = "${id}";`;

        const [data] = await pool.promise().execute(query);

        // Проверяем, есть ли данные
        if (data.length === 0) {
            return res.status(404).send('Пост не найден');
        }

        // Извлекаем теги и их идентификаторы
        const tags = data[0].tags ? data[0].tags.split(', ') : [];
        const tag_ids = data[0].tag_ids ? data[0].tag_ids.split(', ') : [];

        // Создаем массив объектов тегов
        const _tags = [];
        for (let i = 0; i < tags.length; i++) { // Используем длину массива tags
            _tags.push({
                id: tag_ids[i],
                name: tags[i]
            });
        }

        // Создаем объект поста
        const post = {
            id: data[0].id,
            description: data[0].desc,
            status: data[0].status,
            author_id: data[0].author_id,
            author_name: data[0].author_name,
            tags: _tags,
            postAction: data[0].action,
            likes: data[0].likes,
            dislikes: data[0].dislikes
        };
        const userName = req.session.user ? req.session.user.login : "Войти";
        const isOwner = (isAuthenticated && (req.session.user.id == post.author_id));
        function isInt(value) {
            return !isNaN(value) && (function (x) { return (x | 0) === x; })(parseFloat(value))
        }
        res.render("post.hbs", {
            documentId: post.id,
            userName,
            curUserID,
            isAuthenticated,
            isOwner,
            voted: isInt(data[0].action),
            postAction: post.postAction,
            isNotOwner: !isOwner,
            isDraft: post.status == 1,
            isPublished: post.status == 2,
            imageUrl: data[0].ext,
            description: post.description,
            author_id: post.author_id,
            author_name: post.author_name,
            tags: post.tags,
            likes: post.likes,
            dislikes: post.dislikes
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
};

exports.deletePostById = (req, res) => {
    const { id } = req.params;

    // Получаем информацию о посте из базы данных
    pool.query(`SELECT ext FROM images WHERE id = ?`, [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ message: "Пост не найден или ошибка базы данных" });
        }

        const fileExtension = results[0].ext;
        const filePath = path.join(__dirname, "../imgs/uploads", `${id}.${fileExtension}`);

        // Удаляем файл из хранилища
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error(`Ошибка удаления файла: ${unlinkErr.message}`);
                return res.status(500).json({ message: "Ошибка удаления файла" });
            }

            // Удаляем запись из базы данных
            pool.query(`DELETE FROM images WHERE id = ?`, [id], (deleteErr) => {
                if (deleteErr) {
                    console.error(`Ошибка удаления записи: ${deleteErr.message}`);
                    return res.status(500).json({ message: "Ошибка удаления записи из базы данных" });
                }

                res.status(200).json({ message: "Пост и файл успешно удалены" });
            });
        });
    });
};

exports.editPostById = (req, res) => {

};

exports.download = (req, res) => {
    const { id } = req.params;

    pool.query(`SELECT ext FROM images WHERE id = ?`, [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: "Файл не найден." });
        }

        const fileExtension = results[0].ext;
        const filePath = path.join(__dirname, "../imgs/uploads", `${id}.${fileExtension}`);

        if (fs.existsSync(filePath)) {
            res.setHeader("Content-Disposition", `attachment; filename=${id}.${fileExtension}`);
            res.setHeader("Content-Type", "application/octet-stream");
            res.download(filePath);
        } else {
            res.status(404).json({ message: "Файл не существует." });
        }
    });
};
exports.drawPostsPerDayDiagram = (req, res) => {
    const userName = req.session.user ? req.session.user.login : "Войти";
    const isAuthenticated = !!req.session.user; // true, если пользователь вошёл
    res.status(200).render("postDiagram.hbs", { 
        userName,
        isAuthenticated,

    });
}

exports.getPostsPerDayDiagramData = (req, res) => {
    const fromDate = req.query.fromData?req.query.fromData:'2024-01-01';
    const toDate = req.query.toData?req.query.toData:'2025-12-31';
    const querry = `select id,date from images where date between '${fromDate}' and '${toDate}';`;
    pool.query(querry, (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ });
        }
        res.status(200).json(results);
    });
}


exports.downloadPostsPerDayCSV = (req, res) => {
    const fromDate = req.query.fromData || "2024-01-01";
    const toDate = req.query.toData || "2025-12-31";

    const query = `SELECT id, date FROM images WHERE date BETWEEN ? AND ? ORDER BY date;`;
    pool.query(query, [fromDate, toDate], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Ошибка базы данных", error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Нет данных для экспорта." });
        }

        // Группируем данные по датам
        const groupedData = {};
        results.forEach(row => {
            const date = row.date.toISOString().split("T")[0]; // Форматируем дату
            if (!groupedData[date]) groupedData[date] = [];
            groupedData[date].push(row.id);
        });

        // Создаём CSV-данные
        let csvContent = "Дата,ID изображений\n"; // Заголовки
        Object.entries(groupedData).forEach(([date, ids]) => {
            csvContent += `${date},"${ids.join(",")}"\n`; // Записываем строку
        });

        // Генерируем путь к файлу
        const filePath = path.join(__dirname, "../exports", `posts_per_day_${Date.now()}.csv`);
        
        // Записываем CSV-файл
        fs.writeFileSync(filePath, csvContent, "utf8");

        // Отправляем файл клиенту
        res.download(filePath, "posts_per_day.csv", err => {
            if (err) {
                console.error("Ошибка при отправке файла:", err);
                res.status(500).json({ message: "Ошибка загрузки файла" });
            }
            // Удаляем файл после отправки
            setTimeout(() => fs.unlinkSync(filePath), 10000);
        });
    });
};



exports.vote = async (req, res) => {
    const { post, vote_type } = req.body;
    try {
        let querry = `call makeVote(${req.session.user.id},"${post}",${vote_type});`;
        const [tt] = await pool.promise().execute(querry);
        res.status(200).json({ message: "проголосовано" });
    } catch (err) {
        res.status(500).json({ message: "Ошибка голосовния:", m: err.message });
    }
};

