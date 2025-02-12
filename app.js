const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const app = express();

const homeRouter = require("./routes/homeRouter.js");
const userRouter = require("./routes/userRouter.js");
const imageRouter = require("./routes/imageRouter.js");
const postRouter = require("./routes/postRouter.js");
const advRouter = require("./routes/advRouter.js");
console.log(__dirname);
const hbs = require('hbs');
const path = require('path');

// Установка шаблонизатора HBS
hbs.registerPartials(path.resolve(__dirname, 'views/partials'));
app.set('views', path.resolve(__dirname, 'views')); // Укажите путь к папке views
app.set('view engine', 'hbs');
app.set("view engine", "hbs");
app.set('trust proxy', 1);

const key="12453613euqdhfw81eqdls3";
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
    app.listen(3000, () => console.log("Сервер запущен и ожидает подключения..."));
}