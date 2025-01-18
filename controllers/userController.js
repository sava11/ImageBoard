const bcrypt = require("bcrypt");
const pool = require("../dataBase/db.js");

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
        res.render("auth/login", { documentName: "Вход" });
    } else {
        res.redirect(`/user/${req.session.user.id}`);
    }
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    pool.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).send("Неверный логин или пароль (jncendbct)");
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

exports.user = (req, res) => {
    const { id } = req.params;
    const userName = req.session.user ? req.session.user.login : "Войти";
    pool.query("SELECT id,login FROM users WHERE id = ?", [id],
        async (err, results) => {
            if (err || results.length == 0) {
                return res.status(404).send("такой страницы нет");
            }
            const user = results[0];
            const authenticated= !!req.session.user;
            res.render("profile/profile", {
                documentName: "Профиль " + user.login,
                user: user,
                userName: userName,
                // displayUpload:authenticated ? user.id==req.session.user.id : false,
                isAuthenticated: authenticated,
            });

        });

};

exports.userSettingsForm = (req, res) => {
    if (!req.session.user) {
        res.render("auth/login", { documentName: "Вход" });
    }
    const userName = req.session.user ? req.session.user.login : "Войти";
    res.render("profile/settings", { 
        documentName: "Настройки",
        user:req.session.user,
        userName: userName,
        isAuthenticated: !!req.session.user,
    });

};

exports.userSettings = (req, res) => {

};

exports.edituser = async (req, res) => {
    const { login, email} = req.body;//password, new_password 
    const userId = req.session.user.id;
    // const hashedPassword = await bcrypt.hash(password, 10);
    pool.query("UPDATE users SET login = ?, email = ? WHERE id = ?", [login, email, userId], (err) => {
        if (err) return res.status(500).send("Ошибка редактирования профиля");
        req.session.user.login = login;
        req.session.user.email = email;
        res.redirect(`/user/${userId}`);
    });
};

exports.deleteuser = (req, res) => {
    const userId = req.session.user.id;

    pool.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
        if (err) return res.status(500).send("Ошибка удаления профиля");
        req.session.destroy();
        res.redirect("/");
    });
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