document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("cards-container");
  const template = document.getElementById("card-template");
  const pagination = document.getElementById("pagination");
  const categoriasBtns = document.querySelectorAll("#categorias button");
  const subcatContainer = document.getElementById("subcategorias");

  let episodios = [];
  let filtrados = [];
  let currentPage = 1;
  const perPage = 12;
  let categoriaActiva = "all";
  let subcategoriaActiva = null;

  async function loadData() {
    try {
      const res = await fetch("./data.json");
      if (!res.ok) throw new Error("No se pudo cargar data.json");
      const data = await res.json();

      episodios = data.episodios.sort((a,b) => {
        if (a.destacado && !b.destacado) return -1;
        if (!a.destacado && b.destacado) return 1;
        return b.numero - a.numero;
      });

      filtrados = episodios;
      renderCards();
    } catch (err) {
      container.innerHTML = `<p class="text-danger text-center">Error cargando episodios: ${err}</p>`;
      console.error(err);
    }
  }

  function renderCards() {
    container.querySelectorAll(".card:not(#card-template)").forEach(c => c.remove());
    const start = (currentPage-1)*perPage;
    const end = start + perPage;
    const pagData = filtrados.slice(start, end);

    if (pagData.length === 0) {
      container.innerHTML = `<p class="text-center text-light">No hay episodios disponibles.</p>`;
      pagination.innerHTML = "";
      return;
    }

    pagData.forEach(ep => {
      const card = template.cloneNode(true);
      card.id = "";
      card.style.display = "";
      card.querySelector("img").src = ep.imagen;
      card.querySelector("img").alt = ep.titulo;
      card.querySelector("h5").textContent = ep.titulo;
      card.querySelector("p").textContent = ep.descripcion;
      card.querySelectorAll(".dropdown-item")[0].href = ep.links.youtube;
      card.querySelectorAll(".dropdown-item")[1].href = ep.links.spotify;
      card.querySelectorAll(".dropdown-item")[2].href = ep.links.apple;
      card.querySelector("small").textContent = "Categorías: " + ep.categorias.join(", ");
      container.appendChild(card);
    });

    renderPagination();
  }

  function renderPagination() {
    const totalPages = Math.ceil(filtrados.length/perPage);
    pagination.innerHTML = "";
    if(totalPages <= 1) return;

    const addPage = (text, disabled, active, onClick) => {
      const li = document.createElement("li");
      li.className = `page-item ${disabled?"disabled":""} ${active?"active":""}`;
      li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
      if(!disabled) li.addEventListener("click", onClick);
      pagination.appendChild(li);
    };

    addPage("«", currentPage===1,false, ()=>{currentPage--; renderCards();});
    for(let i=1;i<=totalPages;i++){
      addPage(i,false,i===currentPage, ()=>{currentPage=i; renderCards();});
    }
    addPage("»", currentPage===totalPages,false, ()=>{currentPage++; renderCards();});
  }

  categoriasBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      categoriasBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      categoriaActiva = btn.dataset.category;
      subcategoriaActiva = null;
      currentPage = 1;
      filtrados = categoriaActiva==="all" ? episodios : episodios.filter(ep => ep.categorias.includes(categoriaActiva));
      generarSubcategorias();
      renderCards();
    });
  });

  function generarSubcategorias() {
    const subcats = new Set();
    filtrados.forEach(ep => ep.subcategorias?.forEach(s=>subcats.add(s)));
    if(subcats.size===0){subcatContainer.classList.add("d-none"); return;}
    subcatContainer.innerHTML="";
    subcats.forEach(s=>{
      const btn = document.createElement("button");
      btn.className="btn btn-sm btn-outline-info m-1";
      btn.textContent = s;
      btn.addEventListener("click", ()=>{
        if(subcategoriaActiva===s){
          subcategoriaActiva=null;
          btn.classList.remove("active");
          filtrados = episodios.filter(ep=> ep.categorias.includes(categoriaActiva));
        } else {
          subcategoriaActiva=s;
          document.querySelectorAll("#subcategorias button").forEach(b=>b.classList.remove("active"));
          btn.classList.add("active");
          filtrados = episodios.filter(ep=> ep.categorias.includes(categoriaActiva) && ep.subcategorias?.includes(s));
        }
        currentPage=1;
        renderCards();
      });
      subcatContainer.appendChild(btn);
    });
    subcatContainer.classList.remove("d-none");
  }

  loadData();
});