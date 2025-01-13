const { Types } = require("mysql2");
const pool = require("../dataBase/db.js");
exports.uploadPost = (req, res) => {
    res.render("upload"); // Отображаем форму загрузки
}
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
            postAction:data[0].action,
            likes: data[0].likes,
            dislikes: data[0].dislikes
        };
        const userName = req.session.user ? req.session.user.login : "Войти";
        const isOwner = (isAuthenticated && (req.session.user.id == post.author_id));
        function isInt(value) {
            return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
          }
        res.render("post.hbs", {
            documentId: post.id,
            userName,
            curUserID,
            isAuthenticated,
            isOwner,
            voted:isInt(data[0].action),
            postAction:post.postAction,
            isNotOwner: !isOwner,
            isDraft: post.status == 1,
            isPublished: post.status == 2,
            imageUrl: data[0].ext, // Не забудьте добавить ссылку на изображение
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
    // pool.query("UPDATE users SET login = ?, email = ? WHERE id = ?", [login, email, userId], (err) => {
    //     if (err) return res.status(500).send("Ошибка редактирования профиля");
    //     req.session.user.login = login;
    //     req.session.user.email = email;
    //     res.redirect(`/user/${userId}`);
    // });
}

exports.editPostById = (req, res) => {

}

exports.vote = async (req, res) => {
    const { post, vote_type } = req.body;
    try {
        let querry=`call makeVote(${req.session.user.id},"${post}",${vote_type});`;
        const[tt]=await pool.promise().execute(querry);
        res.status(200).json({ message : "проголосовано" });
    } catch (err) {
        res.status(500).json({ message: "Ошибка голосовния:", m: err.message });
    }
}

