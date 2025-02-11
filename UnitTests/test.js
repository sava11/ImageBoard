const request = require("supertest");
const app = require("../app");

const users = {
    user: { id: 1, login: "user1", email: "1@1", status: 1 },
    editor: { id: 2, login: "editor1", email: "2@1", status: 2 },
    admin: { id: 3, login: "admin1", email: "3@1", status: 3 }
};

const loginAs = async (user) => {
    const agent = request.agent(app);
    await agent.post("/user/login").send({ email: user.email, password: "1" });
    return agent;
};

describe("Access control tests", () => {
    test("Unauthorized user should be redirected from protected routes", async () => {
        const res = await request(app).get("/post/diagram");
        expect(res.status).toBe(302); // Redirect to login
    });

    test("User should NOT access admin-only routes", async () => {
        const agent = await loginAs(users.user);
        const res = await agent.get("/post/diagram");
        expect(res.status).toBe(500); // No access
    });

    test("Editor should NOT access admin-only routes", async () => {
        const agent = await loginAs(users.editor);
        const res = await agent.get("/post/diagram");
        expect(res.status).toBe(500); // No access
    });

    test("Admin should access admin-only routes", async () => {
        const agent = await loginAs(users.admin);
        const res = await agent.get("/post/diagram");
        expect(res.status).toBe(200); // Success
    });
});
