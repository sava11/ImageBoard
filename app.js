require('dotenv').config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const homeRouter = require("./routes/homeRouter.js");
const userRouter = require("./routes/userRouter.js");
const imageRouter = require("./routes/imageRouter.js");
const postRouter = require("./routes/postRouter.js");
const advRouter = require("./routes/advRouter.js");
console.log(__dirname);
const hbs = require('hbs');

// Установка шаблонизатора HBS
hbs.registerPartials(path.resolve(__dirname, 'views/partials'));
app.set('views', path.resolve(__dirname, 'views')); // Укажите путь к папке views
app.set('view engine', 'hbs');
app.set('trust proxy', 1);

const key = process.env.SECRET_KEY;
app.use(cookieParser(key)); // Установите секретный ключ для подписанных кук
app.use(session({
    secret: key,
    resave: true,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, // Делаем куку HttpOnly
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 7 * 60 * 60 * 24, // Время жизни куки (например, 7 дней)
    }
}));

app.use(express.static(__dirname + '/imgs'));
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", homeRouter);
app.use("/user", userRouter);
app.use("/image", imageRouter);
app.use("/post", postRouter);
app.use("/adv", advRouter);


module.exports = app;

if (require.main === module) {
    app.listen(port, () => console.log(`Сервер запущен на порту: ${port} и ожидает подключений...`));
    const pool = require("../dataBase/db");

    async function checkDatabaseConnection() {
        try {
            // Выполняем простой запрос к базе данных
            const [rows] = await pool.promise().execute("SELECT 'привет мир!' AS greeting");

            // Выводим результат запроса
            console.log(rows[0].greeting); // Выведет: привет мир!
        } catch (error) {
            // Обработка ошибок
            console.error("Ошибка подключения к базе данных:", error.message);
        }
    }

    // Вызов функции
    checkDatabaseConnection();
}