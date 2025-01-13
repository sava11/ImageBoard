const mysql = require('mysql2');
const pool = mysql.createPool({
    connectionLimit: 5,
    host: 'localhost',
    user: 'root',
    database: 'site',
    password: 'Saveliyano!1'
});

module.exports = pool;