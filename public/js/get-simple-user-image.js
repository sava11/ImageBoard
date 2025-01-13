fetch('/image/from-user/{{ user.id }}')
  .then(response => response.json())
  .then(data => {
    console.log(data);
    //style="object-position: -${item.cut_pos_x}px ${item.cut_pos_y}px;" />
    const container = document.getElementById("tag-container");
    data.images.forEach(item => {
      const card = `
      <a class="card-item" href="/post/${item.id}">
      <div class="thumbnail">
          <img src="/uploads/${item.id}.${item.ext}"/>
      </div>
      <div class="controls">
          <p class="likes">${item.likes}</p>
          <p class="dislikes">${item.dislikes}</p>
      </div>
      ${this.date}
      </a>`;
      container.innerHTML += card;
    });
  })
  .catch(err => console.error("Ошибка загрузки изображений:", err));