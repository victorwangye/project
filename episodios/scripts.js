document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("cards-container");
  const pagination = document.getElementById("pagination");
  const categoriasBtns = document.querySelectorAll("#categorias button");
  const subcatContainer = document.getElementById("subcategorias");

  let episodios = [];
  let filtrados = [];
  let currentPage = 1;
  const perPage = 12; // 12 episodios por página
  let categoriaActiva = "all";
  let subcategoriaActiva = null;

  // === CARGAR DATOS ===
  async function loadData() {
    try {
      const res = await fetch("data.json");
      const data = await res.json();

      // Orden: destacados primero, luego más recientes
      episodios = data.episodios.sort((a, b) => {
        if (a.destacado && !b.destacado) return -1;
        if (!a.destacado && b.destacado) return 1;
        return b.numero - a.numero;
      });

      filtrados = episodios;
      render();
    } catch (err) {
      container.innerHTML = `<p class="text-danger text-center">Error cargando episodios.</p>`;
      console.error(err);
    }
  }

  // === MOSTRAR EPISODIOS ===
  function render() {
    container.innerHTML = "";
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pagData = filtrados.slice(start, end);

    if (pagData.length === 0) {
      container.innerHTML = `<p class="text-center text-light">No hay episodios disponibles.</p>`;
      pagination.innerHTML = "";
      return;
    }

    pagData.forEach(ep => {
      const card = document.createElement("div");
      card.classList.add("card", "bg-secondary", "text-light");
      card.innerHTML = `
        <img src="${ep.imagen}" class="card-img-top" alt="${ep.titulo}">
        <div class="card-content">
          <h5>${ep.titulo}</h5>
          <p>${ep.descripcion}</p>
          <div class="mb-2">
            <button class="btn btn-sm btn-primary dropdown-toggle" data-bs-toggle="dropdown">🎧 Escuchar</button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="${ep.links.youtube}" target="_blank">YouTube</a></li>
              <li><a class="dropdown-item" href="${ep.links.spotify}" target="_blank">Spotify</a></li>
              <li><a class="dropdown-item" href="${ep.links.apple}" target="_blank">Apple</a></li>
            </ul>
          </div>
          <small class="text-info">Categorías: ${ep.categorias.join(", ")}</small>
        </div>`;
      container.appendChild(card);
    });

    renderPagination();
  }

  // === PAGINACIÓN ===
  function renderPagination() {
    const totalPages = Math.ceil(filtrados.length / perPage);
    pagination.innerHTML = "";

    if (totalPages <= 1) return;

    const addPage = (text, disabled, active, onClick) => {
      const li = document.createElement("li");
      li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
      if (!disabled) li.addEventListener("click", onClick);
      pagination.appendChild(li);
    };

    addPage("«", currentPage === 1, false, () => { currentPage--; render(); });

    for (let i = 1; i <= totalPages; i++) {
      addPage(i, false, i === currentPage, () => { currentPage = i; render(); });
    }

    addPage("»", currentPage === totalPages, false, () => { currentPage++; render(); });
  }

  // === FILTROS ===
  categoriasBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      categoriasBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      categoriaActiva = btn.dataset.category;
      subcategoriaActiva = null;
      currentPage = 1;

      if (categoriaActiva === "all") {
        filtrados = episodios;
        subcatContainer.classList.add("d-none");
      } else {
        filtrados = episodios.filter(ep => ep.categorias.includes(categoriaActiva));
        generarSubcategorias();
      }

      render();
    });
  });

  // === SUBCATEGORÍAS ===
  function generarSubcategorias() {
    const subcats = new Set();
    filtrados.forEach(ep => {
      if (ep.subcategorias) ep.subcategorias.forEach(s => subcats.add(s));
    });

    if (subcats.size === 0) {
      subcatContainer.classList.add("d-none");
      return;
    }

    subcatContainer.innerHTML = "";
    subcats.forEach(s => {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-info m-1";
      btn.textContent = s;
      btn.addEventListener("click", () => {
        if (subcategoriaActiva === s) {
          subcategoriaActiva = null;
          btn.classList.remove("active");
          filtrados = episodios.filter(ep => ep.categorias.includes(categoriaActiva));
        } else {
          subcategoriaActiva = s;
          document.querySelectorAll("#subcategorias button").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          filtrados = episodios.filter(ep =>
            ep.categorias.includes(categoriaActiva) && ep.subcategorias?.includes(s)
          );
        }
        currentPage = 1;
        render();
      });
      subcatContainer.appendChild(btn);
    });

    subcatContainer.classList.remove("d-none");
  }

  loadData();
});

