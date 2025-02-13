require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

async function runSqlFile() {
    try {
        // Подключение к базе данных
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log('Connected to the database.');

        // Чтение SQL-файла
        const sqlFilePath = './create_site.sql'; // Укажите путь к вашему .sql файлу
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        // Разделение SQL-запросов (если в файле несколько запросов)
        const statements = sql.split(/;$/m).filter(statement => statement.trim() !== '');

        for (const statement of statements) {
            await connection.execute(statement);
            console.log('Executed:', statement.trim().split('\n')[0]); // Вывод первого слова каждого запроса
        }

        console.log('SQL file executed successfully.');
    } catch (error) {
        console.error('Error executing SQL file:', error);
    } finally {
        process.exit();
    }
}

await runSqlFile();