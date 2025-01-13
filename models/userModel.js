const pool = require("../dataBase/db.js");

exports.findByEmail = (email, callback) => {
    pool.query("SELECT * FROM users WHERE email = ?", [email], callback);
};

exports.createUser = (login, email, password, callback) => {
    pool.query("INSERT INTO users (login, email, password) VALUES (?, ?, ?)", [login, email, password], callback);
};
