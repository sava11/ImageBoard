const bcrypt = require("bcrypt");
const pool = require("../dataBase/db.js");
const path = require("path");
const fs = require("fs");

exports.registerForm = (req, res) => {
    res.render("auth/register", { documentName: "Регистрация" });
};

exports.register = async (req, res) => {
    const { login, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    pool.query("INSERT INTO users (login, email, password, status) VALUES (?, ?, ?, 1)", [login, email, hashedPassword],
        (err) => {
            console.log(err);
            if (err) return res.status(500).send("Ошибка регистрации");
            res.redirect("/user/login");
        });
};

exports.loginForm = (req, res) => {
    if (!req.session.user) {
        res.render("auth/login.hbs", { documentName: "Вход" });
    } else {
        res.redirect(`/user/${req.session.user.id}`);
    }
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    pool.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).send("Неверный логин или пароль. Возможно сервер недоступен.");
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send("Неверная почта или пароль");
        }

        req.session.user = { id: user.id, login: user.login, email: user.email };
        res.cookie("userSession", req.session.user, {
            httpOnly: true,
            signed: true, // Подписанная кука
            secure: false, // Установите true при HTTPS
            maxAge: 1000 * 60 * 60 * 24,
        });
        res.redirect(`/user/${req.session.user.id}`);
    });
};

exports.isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/user/login");
    }
    next();
};
exports.userHasStatus = (req, res, next) => {
    pool.query(`SELECT id,login,status FROM users WHERE id=${req.session.user.id} and status>2`, async (err, results) => {
        if (err || results.length === 0) {
            res.status(500).json({ message: "нет доступа" });
        } else {
            next();
        }
    });
};

exports.user = async (req, res) => {
    const { id } = req.params;
    const userName = req.session.user ? req.session.user.login : "Войти";
    const isAuthenticated = !!req.session.user;
    const curUserID = isAuthenticated ? req.session.user.id : 0;
    const [isEditorData] = await pool.promise().execute(
        `SELECT id from users where id = ? and status=2`,
        [curUserID]
    );
    const isEditor = isAuthenticated && curUserID !== parseInt(id) && isEditorData.length;
    pool.query("SELECT id,login FROM users WHERE id = ?", [id],
        async (err, results) => {
            if (err || results.length == 0) {
                return res.status(404).send("такой страницы нет");
            }
            const user = results[0];
            const authenticated = !!req.session.user;
            let dict = {
                documentName: "Профиль " + user.login,
                user: user,
                userName: userName,
                isAdmin: false,
                isEditor,
                isAuthenticated: authenticated,
            }
            if (authenticated) {
                const [isAdmin] = await pool.promise().execute(`select id from users where id =${req.session.user.id} and status=3`);
                dict.isAdmin = isAdmin[0] ? true : false;
            }
            res.render("profile/profile.hbs", dict);

        });

};

exports.userSettingsForm = (req, res) => {

    if (!req.session.user) {
        res.render("auth/login.hbs", { documentName: "Вход" });
    }
    const userName = req.session.user ? req.session.user.login : "Войти";
    res.render("profile/settings.hbs", {
        documentName: "Настройки",
        user: req.session.user,
        userName: userName,
        isAuthenticated: !!req.session.user,
    });

};

exports.userSettings = (req, res) => {

};

exports.editUser = async (req, res) => {
    const { login, email, password, new_password } = req.body;
    const userId = req.session.user.id;

    try {
        // Получаем текущий хеш пароля
        const [users] = await pool.promise().execute("SELECT password FROM users WHERE id = ?", [userId]);

        if (users.length === 0) {
            return res.status(404).send("Пользователь не найден");
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).send("Неверный текущий пароль");
        }

        let query, params;

        if (new_password) {
            const hashedNewPassword = await bcrypt.hash(new_password, 10);
            query = "UPDATE users SET login = ?, email = ?, password = ? WHERE id = ?";
            params = [login, email, hashedNewPassword, userId];
        } else {
            query = "UPDATE users SET login = ?, email = ? WHERE id = ?";
            params = [login, email, userId];
        }

        await pool.promise().execute(query, params);

        // Обновляем сессию
        req.session.user.login = login;
        req.session.user.email = email;

        res.redirect(`/user/${userId}`);
    } catch (err) {
        console.error("Ошибка редактирования профиля:", err);
        res.status(500).send("Ошибка редактирования профиля");
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const isAuthenticated = !!req.session.user;
        const curUserID = isAuthenticated ? req.session.user.id : 0;

        // Проверяем, есть ли права у пользователя на удаление
        const [isEditorData] = await pool.promise().execute(
            `SELECT id FROM users WHERE id = ? AND status = 2`,
            [curUserID]
        );

        const isEditor = isAuthenticated && curUserID !== parseInt(id) && isEditorData.length > 0;
        if (!isEditor && curUserID !== parseInt(id)) {
            return res.status(403).json({ message: "Нет прав на удаление" });
        }

        // Получаем список изображений пользователя
        const [images] = await pool.promise().execute(
            `SELECT id, ext FROM images WHERE user_id = ?`,
            [id]
        );

        // Удаляем файлы изображений
        for (const image of images) {
            const filePath = path.join(__dirname, "../imgs/uploads", `${image.id}.${image.ext}`);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr && unlinkErr.code !== "ENOENT") {
                    console.error(`Ошибка удаления файла: ${unlinkErr.message}`);
                }
            });
        }

        // Удаляем пользователя
        await pool.promise().execute("DELETE FROM users WHERE id = ?", [id]);

        // Завершаем сессию, если пользователь удаляет себя
        if (curUserID === parseInt(id)) {
            req.session.destroy();
        }

        res.redirect("/");
    } catch (err) {
        console.error("Ошибка удаления пользователя:", err);
        res.status(500).send("Ошибка удаления профиля");
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Ошибка при выходе из системы");
        }
        res.clearCookie("userSession");
        res.redirect("/");
    });
};


exports.getUserSimpleImages = async (req, res) => {
    try {
        const { id } = req.params;
        const [images] = await pool.promise().execute(`SELECT 
                id,
                ext,
                image_cut_pos_x AS cut_pos_x,
                image_cut_pos_y AS cut_pos_y,
                up_vote AS likes,
                down_vote AS dislikes
            FROM images where user_id=${id};
        `);

        res.status(200).json({ images });

    } catch (err) {
        console.error("Ошибка при получении изображений:", err);
        res.status(500).json({ message: "Ошибка при получении изображений.", m: err.m });
    }
};