// Кнопка выхода
document.getElementById("user-exit").addEventListener("click", async () => {
    try {
        const response = await fetch("/user/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
            alert("Вы успешно вышли из системы.");
            window.location.href = "/"; // Перенаправление на главную
        } else {
            const error = await response.json();
            alert(`Ошибка: ${error.message}`);
        }
    } catch (err) {
        console.error("Ошибка при выходе:", err);
        alert("Произошла ошибка при выходе.");
    }
});
const menuButton = document.querySelector('.menu-button');
const dropdownMenu = document.querySelector('.dropdown-menu');

menuButton.addEventListener('click', () => {
    dropdownMenu.classList.toggle('hidden'); // Показать или скрыть меню
});

// Закрыть меню при клике вне его
document.addEventListener('click', (event) => {
    if (!menuButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.add('hidden');
    }
});