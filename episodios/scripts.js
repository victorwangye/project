document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("cards-container");
    const template = document.getElementById("card-template");
    const pagination = document.getElementById("pagination");
    const categoriasBtns = document.querySelectorAll("#categorias button");
    const searchInput = document.getElementById("episodeSearch");
    const sortDropdown = document.getElementById("sortDropdown");

    let episodios = [];
    let episodiosMezclados = []; // Para el orden aleatorio inicial
    let filtrados = [];
    let currentPage = 1;
    const perPage = 12;
    let categoriaActiva = "all";
    let ordenActivo = sortDropdown ? sortDropdown.value : "relevancia_reciente";
    let terminoBusqueda = "";

    const categoryColorMap = {
        think: "bg-think",
        tech: "bg-tech",
        planet: "bg-planet",
        move: "bg-move"
    };

    async function loadData() {
        try {
            const res = await fetch("data.json");
            if (!res.ok) throw new Error("No se pudo cargar data.json");
            const data = await res.json();
            episodios = data.episodios || [];
            
            // Creamos una copia aleatoria inicial para dar oportunidad a todos
            episodiosMezclados = [...episodios].sort(() => Math.random() - 0.5);
            
            applyFiltersAndSort();
        } catch (err) {
            console.error(err);
            container.innerHTML = `<p class="text-danger text-center">Error al cargar los episodios.</p>`;
        }
    }

    function getMatchScore(ep, query) {
        let score = 0;
        const q = query.toLowerCase();
        if (ep.titulo.toLowerCase().includes(q)) score += 10;
        if (ep.descripcion.toLowerCase().includes(q)) score += 5;
        if (ep.categorias?.some(c => c.toLowerCase().includes(q))) score += 15;
        if (ep.destacado) score += 2;
        return score;
    }

    function applyFiltersAndSort() {
        // Si el usuario no está buscando ni ha cambiado el orden, usamos la lista aleatoria
        const esEstadoInicial = (ordenActivo === "relevancia_reciente" && !terminoBusqueda);
        let lista = esEstadoInicial ? [...episodiosMezclados] : [...episodios];

        if (categoriaActiva !== "all") {
            lista = lista.filter(ep => ep.categorias?.includes(categoriaActiva));
        }

        if (terminoBusqueda) {
            lista = lista
                .map(ep => ({ ...ep, score: getMatchScore(ep, terminoBusqueda) }))
                .filter(ep => ep.score > 0);
        }

        // Solo ordenamos si NO estamos en el modo aleatorio inicial o si hay búsqueda
        if (!esEstadoInicial || terminoBusqueda) {
            lista.sort((a, b) => {
                if (terminoBusqueda && b.score !== a.score) return b.score - a.score;
                if (ordenActivo.includes("reciente")) return b.numero - a.numero;
                if (ordenActivo.includes("antiguo")) return a.numero - b.numero;
                if (ordenActivo.startsWith("relevancia")) {
                    if (a.destacado && !b.destacado) return -1;
                    if (!a.destacado && b.destacado) return 1;
                }
                return 0;
            });
        }

        filtrados = lista;
        currentPage = 1;
        renderCards();
    }

    function renderCards() {
        container.querySelectorAll(".col-12:not(#card-template)").forEach(el => el.remove());
        const start = (currentPage - 1) * perPage;
        const pagData = filtrados.slice(start, start + perPage);

        if (!pagData.length) {
            container.innerHTML = `<p class="text-center text-secondary mt-5">No hay episodios.</p>`;
            pagination.innerHTML = "";
            return;
        }

        pagData.forEach(ep => {
            const cardWrapper = template.cloneNode(true);
            cardWrapper.id = "";
            cardWrapper.style.display = "block";
            const card = cardWrapper.querySelector(".episode-card-new");
            card.querySelector(".card-img-top-new").src = ep.imagen;
            const badge = card.querySelector(".category-badge-new");
            const cat = ep.categorias?.[0] || "general";
            badge.className = `category-badge-new badge ${categoryColorMap[cat] || "bg-secondary"}`;
            badge.textContent = cat.toUpperCase();
            card.querySelector(".card-title-new").textContent = ep.titulo.split(" | ")[0];
            card.querySelector(".card-text-new").textContent = ep.descripcion.slice(0, 150) + "...";
            card.querySelector(".youtube").href = ep.links.youtube;
            card.querySelector(".spotify").href = ep.links.spotify;
            card.querySelector(".apple").href = ep.links.apple;
            container.appendChild(cardWrapper);
        });
        renderPagination();
    }

    function renderPagination() {
        const totalPages = Math.ceil(filtrados.length / perPage);
        pagination.innerHTML = "";
        if (totalPages <= 1) return;

        const addPage = (text, disabled, active, onClick) => {
            const li = document.createElement("li");
            li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
            li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
            if (!disabled) li.addEventListener("click", e => { e.preventDefault(); onClick(); });
            pagination.appendChild(li);
        };

        addPage("«", currentPage === 1, false, () => { currentPage--; renderCards(); window.scrollTo(0,0); });
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                addPage(i, false, i === currentPage, () => { currentPage = i; renderCards(); window.scrollTo(0,0); });
            }
        }
        addPage("»", currentPage === totalPages, false, () => { currentPage++; renderCards(); window.scrollTo(0,0); });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            terminoBusqueda = searchInput.value.trim().toLowerCase();
            applyFiltersAndSort();
        });
    }

    categoriasBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            categoriasBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            categoriaActiva = btn.dataset.category;
            applyFiltersAndSort();
        });
    });

    if (sortDropdown) {
        sortDropdown.addEventListener("change", e => {
            ordenActivo = e.target.value;
            applyFiltersAndSort();
        });
    }

    loadData();
});
