fetch('/image')
  .then(response => response.json())
  .then(data => {
    console.log(data);
    //style="object-position: -${item.cut_pos_x}px ${item.cut_pos_y}px;" />
    const container = document.getElementById("item-container");
    data.images.forEach(item => {
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