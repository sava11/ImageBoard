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

// Установка шаблонизатора HBS
const hbs = require('hbs');
hbs.registerPartials(path.resolve(__dirname, 'views/partials'));
app.set('views', path.resolve(__dirname, 'views')); // Указан путь к папке views
app.set('view engine', 'hbs');
app.set('trust proxy', 1);

const key = process.env.SECRET_KEY;
app.use(cookieParser(key)); // Установлен секретный ключ для подписанных кук
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
}