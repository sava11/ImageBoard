async function search(page,sort) {
  // Получаем контейнер с тегами
  const tagContainer = document.getElementById("tag-list");

  // Получаем все теги
  const tags = tagContainer.querySelectorAll(".tag");

  // Массивы для хранения ID позитивных и негативных тегов
  const positiveTags = [];
  const negativeTags = [];

  // Проходим по всем тегам
  tags.forEach(tag => {
    // Получаем ID тега
    const id = tag.id.replace("tag-id-", ""); // Убираем "tag-id-" из ID

    // Проверяем состояние чекбокса
    const checkbox = tag.querySelector("input[type='checkbox']");
    if (checkbox) {
      if (checkbox.checked) {
        negativeTags.push(id); // Если включен, это негативный тег
      } else {
        positiveTags.push(id); // Если выключен, это позитивный тег
      }
    }
  });
  await fetch(`/image?page=${page.toString()}&pos=${positiveTags.toString()}&neg=${negativeTags.toString()}&sort=${sort}`)
  .then(response => response.json())
  .then(images => {
    //style="object-position: -${item.cut_pos_x}px ${item.cut_pos_y}px;" />
    const container = document.getElementById("item-container");
    container.innerHTML='';
    images.images.forEach(item => {
      const card = `
      <div class="card-item" data-href="/post/${item.id}">
        <div class="thumbnail">
          <img src="uploads/${item.id}.${item.ext}" 
          style="object-position: -${item.cut_pos_x}px ${item.cut_pos_y}px;"/>
        </div>
        <div class="controls"><div style="display:flex;">
          <p class="likes">${item.likes}</p>
          <p class="dislikes">${item.dislikes}</p></div>
          <a href="/user/${item.user_id}">${item.user_login}</a>
        </div>
      </div>`;container.innerHTML += card;
    });
    const cards = document.querySelectorAll('.card-item');
    cards.forEach(card => {
      card.addEventListener('click', event => {
        const href = card.getAttribute('data-href');
        if (href) {window.location.href = href;}
      });
    });
  }).catch(err => console.error("Ошибка загрузки изображений:", err));
}
search(0,0);