// Оптимизированный контроллер постов
const pool = require("../dataBase/db.js");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// Настройки загрузки файлов
const uploadFolder = path.join(__dirname, "../imgs/uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadFolder),
    filename: (_, file, cb) => {
        const uniqueName = crypto.randomBytes(16).toString("hex") + path.extname(file.originalname);
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });
exports.uploadImage = upload.single("image");

// Сохранение поста
exports.savePostData = async (req, res) => {
    const { description, tags, status } = req.body;
    if (!req.file || !req.session.user) {
        return res.status(400).json({ message: "Нет изображения или неавторизован." });
    }

    const userId = req.session.user.id;
    const imageId = path.basename(req.file.filename,path.extname(req.file.filename));
    const fileExt = path.extname(req.file.filename).slice(1);
    try {
        pool.execute(
            `INSERT INTO images (id, user_id, date, ext, status, \`desc\`) VALUES (?, ?, NOW(), ?, ?, ?)`,
            [imageId, userId, fileExt, status, description]
        );
        if (tags && tags.length > 0) {
            const tagIds = JSON.parse(tags);
            for (const tagId of tagIds) {
                await pool.promise().execute(
                    `INSERT INTO trusted_tags_connections (image_id, tag_id) VALUES (?, ?)`,
                    [imageId, tagId]
                );
            }
        }
        res.status(200).json({ message: "Изображение сохранено.", id: imageId });
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

// Получение данных поста
exports.getPostById = async (req, res) => {
    const { id } = req.params;
    try {
        const isAuthenticated = !!req.session.user;
        const curUserID = isAuthenticated ? req.session.user.id : 0;
        const [data] = await pool.promise().execute(
            `SELECT i.id, i.ext, i.desc, i.status, u.login AS author_name, u.id AS author_id,
            COALESCE(GROUP_CONCAT(DISTINCT t.id ORDER BY t.id ASC), '') AS tag_ids,
            COALESCE(GROUP_CONCAT(DISTINCT t.name ORDER BY t.id ASC), '') AS tags,
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
            MAX(CASE WHEN v.user_id = ? THEN v.type ELSE NULL END) AS action
            FROM images i
            LEFT JOIN trusted_tags_connections tc ON i.id = tc.image_id
            LEFT JOIN trusted_tags t ON tc.tag_id = t.id
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN votes v ON v.image_id = i.id
            WHERE i.id = ? GROUP BY i.id;`,
            [curUserID, id]
        );
        const [isEditorData] = await pool.promise().execute(
            `SELECT id from users where id = ? and status=2`,
            [curUserID]
        );
        if (!data.length) return res.status(404).send("Пост не найден");
        const post = data[0];
        const isOwner = isAuthenticated && curUserID === post.author_id || isEditorData.length;

        res.render("post.hbs", {
            documentId: post.id,
            userName: req.session.user ? req.session.user.login : "Войти",
            curUserID,
            isAuthenticated,
            isOwner,
            isNotOwner: !isOwner,
            voted: Number.isInteger(post.action),
            postAction: post.action,
            isDraft: post.status === 1,
            isPublished: post.status === 2,
            imageUrl: post.ext,
            description: post.desc,
            author_id: post.author_id,
            author_name: post.author_name,
            tags: post.tags ? post.tags.split(',').map((name, i) => ({ id: post.tag_ids.split(',')[i], name })) : [],
            likes: post.likes,
            dislikes: post.dislikes
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Ошибка сервера");
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

exports.showEditPost = async (req, res) => {
    const { id } = req.params;
    try {
        const isAuthenticated = !!req.session.user;
        if (!isAuthenticated){
            return res.status(403).json({ message: "Неавторизованный доступ." });
        }
        const curUserID = isAuthenticated ? req.session.user.id : 0;
        const [data] = await pool.promise().execute(
            `SELECT i.id, i.ext, i.desc,
            COALESCE(GROUP_CONCAT(DISTINCT t.id ORDER BY t.id ASC), '') AS tag_ids,
            COALESCE(GROUP_CONCAT(DISTINCT t.name ORDER BY t.id ASC), '') AS tags
            FROM images i
            LEFT JOIN trusted_tags_connections tc ON i.id = tc.image_id
            LEFT JOIN trusted_tags t ON tc.tag_id = t.id
            WHERE i.id = ? GROUP BY i.id;`,
            [id]
        );
        const [isEditorData] = await pool.promise().execute(
            `SELECT id from users where id = ? and status=2`,
            [curUserID]
        );
        if (!data.length) return res.status(404).send("Пост не найден");
        const post = data[0];
        const isOwner = isAuthenticated && curUserID === post.author_id || isEditorData.length;

        res.render("edit_post.hbs", {
            documentId: post.id,
            userName: req.session.user ? req.session.user.login : "Войти",
            curUserID,
            isAuthenticated,
            isOwner,
            isNotOwner: !isOwner,
            imageUrl: post.ext,
            description: post.desc,
            tags: post.tags ? post.tags.split(',').map((name, i) => ({ id: post.tag_ids.split(',')[i], name })) : []
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Ошибка сервера");
    }
};

exports.editPostById = async (req, res) => {
    const { id } = req.params;
    const { description, tags } = req.body;
    const userId = req.session.user ? req.session.user.id : null;

    if (!userId) {
        return res.status(403).json({ message: "Неавторизованный доступ." });
    }

    try {
        const [post] = await pool.promise().execute(
            `SELECT user_id FROM images WHERE user_id = (select id from users where status=2 and id=3) or user_id=3;`,
        );

        if (post[0].user_id !== userId) {
            return res.status(403).json({ message: "Нет прав на редактирование." });
        }

        if (post.length === 0) {
            return res.status(404).json({ message: "Пост не найден." });
        }
        await pool.promise().execute(
            `UPDATE images SET \`desc\` = ? WHERE id = ?`,
            [description, id]
        );

        await pool.promise().execute(
            `DELETE FROM trusted_tags_connections WHERE image_id = ?`,
            [id]
        );

        if (tags && tags.length > 0) {
            for (const tagId of tags) {
                await pool.promise().execute(
                    `INSERT INTO trusted_tags_connections (image_id, tag_id) VALUES (?, ?)`,
                    [id, tagId]
                );
            }
        }

        res.status(200).json({ message: "Пост обновлён." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Ошибка при обновлении поста." });
    }
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
    const fromDate = req.query.fromData ? req.query.fromData : '2024-01-01';
    const toDate = req.query.toData ? req.query.toData : '2025-12-31';
    const querry = `select id,date from images where date between '${fromDate}' and '${toDate}';`;
    pool.query(querry, (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({});
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
            csvContent += `${date},${ids.join(",")}"\n`; // Записываем строку
        });

        // Генерируем путь к файлу
        const filePath = path.join(__dirname, "../exports", `posts_per_day_${Date.now()}.csv`);
        const fpath = path.join(__dirname, "../exports");
        if (!fs.existsSync(fpath)) fs.mkdirSync(fpath, { recursive: true });
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

