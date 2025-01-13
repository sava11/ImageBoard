exports.index = (req, res) => {
    const userName = req.session.user ? req.session.user.login : "Войти";
    const isAuthenticated = !!req.session.user; // true, если пользователь вошёл
    res.render("data", { 
        documentName: 'main', 
        userName,
        isAuthenticated,
    });
};