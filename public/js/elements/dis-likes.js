const likeButton = document.getElementById("likeButton");
const dislikeButton = document.getElementById("dislikeButton");

if ({{ isAuthenticated }}) {
    // Добавляем обработчики событий для кнопок
    likeButton.addEventListener("click", () => handleVote(1));
    dislikeButton.addEventListener("click", () => handleVote(0));

    // Форматирование числа голосов
    function formatVotes(votes) {
        if (votes >= 1000000) {
            return (votes / 1000000).toFixed(1).replace(/\.0$/, "") + "м";
        } else if (votes >= 1000) {
            return (votes / 1000).toFixed(1).replace(/\.0$/, "") + "т";
        }
        return votes.toString();
    }

    // Функция для отправки голосов
    async function handleVote(vote) {
        try {
            const response = await fetch("/post/vote", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-type": "application/json; charset=UTF-8",
                },
                body: JSON.stringify({
                    post: "{{documentId}}",
                    vote_type: vote,
                }),
                credentials: "include",
            });

            if (!response.ok) throw new Error("Ошибка при голосовании");

            const data = await response.json();

            // Обновляем интерфейс в зависимости от типа голоса
            updateVoteUI(vote);
            console.log(data);
        } catch (error) {
            console.error(error);
            alert("Ошибка при голосовании.");
        }
    }

    // Обновление пользовательского интерфейса
    function updateVoteUI(vote) {
        const likeCountElement = document.getElementById("likeCount");
        const dislikeCountElement = document.getElementById("dislikeCount");
        let likeCount = parseInt(likeCountElement.innerText.replace(/[^\d]/g, ""), 10);
        let dislikeCount = parseInt(dislikeCountElement.innerText.replace(/[^\d]/g, ""), 10);

        if (vote === 1) {
            if (!likeButton.classList.contains("active")) {
                likeCount += 1;
                if (dislikeButton.classList.contains("active")) {
                    dislikeCount -= 1;
                }
            } else {
                likeCount -= 1;
            }
            likeButton.classList.toggle("active");
            dislikeButton.classList.remove("active");
        } else {
            if (!dislikeButton.classList.contains("active")) {
                dislikeCount += 1;
                if (likeButton.classList.contains("active")) {
                    likeCount -= 1;
                }
            } else {
                dislikeCount -= 1;
            }
            dislikeButton.classList.toggle("active");
            likeButton.classList.remove("active");
        }

        likeCountElement.innerText = formatVotes(likeCount);
        dislikeCountElement.innerText = formatVotes(dislikeCount);
    }
} else {
    // Если пользователь не аутентифицирован, перенаправляем на страницу входа
    likeButton.addEventListener("click", () => window.location.replace("/user/login"));
    dislikeButton.addEventListener("click", () => window.location.replace("/user/login"));
}