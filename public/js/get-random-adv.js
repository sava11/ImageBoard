fetch("/adv/random")
      .then(response => response.json())
      .then(data => {
        const link = document.getElementById("advertisement-image-top-a");
        const img = document.getElementById("advertisement-image-top");
        // console.log(data);
        img.src = data.data.img_link;
        link.href = data.data.link;
      })
      .catch(err => console.error("Ошибка загрузки рекламы", err));