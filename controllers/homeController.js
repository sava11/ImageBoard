exports.index = (req, res) => {
    const userName = req.session.user ? req.session.user.login : "Войти";
    const isAuthenticated = !!req.session.user; // true, если пользователь вошёл
    res.render("data.hbs", { 
        documentName: 'main', 
        userName,
        isAuthenticated,
    });
};

exports.about = (req, res) => {
    const userName = req.session.user ? req.session.user.login : "Войти";
    const isAuthenticated = !!req.session.user; // true, если пользователь вошёл
    res.render("about.hbs", {
        userName,
        isAuthenticated,
        userName: userName,
    });
};