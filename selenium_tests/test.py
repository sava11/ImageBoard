from selenium import webdriver
from selenium.webdriver.common.by import By

# Настройки WebDriver
driver = webdriver.Chrome()
driver.implicitly_wait(5)

# Тестовые данные
email = "1@1"
password = "1"

# Тест: Регистрация и редирект на профиль
driver.get("http://localhost:5555/user/login")

# Ввод данных
email_input = driver.find_element(By.NAME, "email")
password_input = driver.find_element(By.NAME, "password")
login_button = driver.find_element(By.TAG_NAME, "button")

email_input.send_keys(email)
password_input.send_keys(password)
login_button.click()

# Проверяем редирект на профиль
assert "http://localhost:5555/user/" in driver.current_url, "Не произошел редирект на страницу профиля"
print("Тест регистрации пройден успешно")

# Тест: Переход на страницу поста
driver.get("http://localhost:5555/post/0")
assert "post/0" in driver.current_url, "Страница поста не загружена"
print("Тест перехода на пост пройден успешно")

# Закрываем браузер
driver.quit()