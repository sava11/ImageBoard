const request = require('supertest');
const app = require('../app'); // Подключаем приложение Express

describe('ImageBoard Application Tests', () => {

    // Тест 1: Неавторизованный пользователь на главной странице
    it('should display the home page for unauthenticated users', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });

    // Тест 2: Неавторизованный пользователь пытается перейти на /post/diagram
    it('should redirect unauthenticated users to /user/login when accessing /post/diagram', async () => {
        const response = await request(app).get('/post/diagram');
        expect(response.status).toBe(302); // Перенаправление
        expect(response.headers.location).toBe('/user/login');
    });

    // Тест 3: Авторизованный пользователь (email:"1@1", password:"1") пытается перейти на /post/diagram
    it('should return "нет доступа" for authenticated user with email "1@1"', async () => {
        const agent = request.agent(app);

        // Логин пользователя
        await agent.post('/user/login').send({ email: '1@1', password: '1' }).expect(302); // Проверяем перенаправление
        const response = await agent.get('/post/diagram').expect(500);
        expect(response.body.message).toBe('нет доступа');
    });

    // Тест 4: Авторизованный пользователь (email:"2@1", password:"1") пытается перейти на /post/diagram
    it('should return "нет доступа" for authenticated user with email "2@1"', async () => {
        const agent = request.agent(app);

        // Логин пользователя
        await agent.post('/user/login').send({ email: '2@1', password: '1' }).expect(302); // Проверяем перенаправление
        const response = await agent.get('/post/diagram').expect(500);
        expect(response.body.message).toBe('нет доступа');
    });

    // Тест 5: Авторизованный пользователь (email:"3@1", password:"1") успешно переходит на /post/diagram
    it('should load the diagram page for authenticated user with email "3@1"', async () => {
        const agent = request.agent(app);

        // Логин пользователя
        await agent.post('/user/login').send({ email: '3@1', password: '1' }).expect(302); // Проверяем перенаправление
        const response = await agent.get('/post/diagram').expect(200);
    });
});