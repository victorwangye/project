document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("cards-container");
    const template = document.getElementById("card-template");
    const pagination = document.getElementById("pagination");
    const categoriasBtns = document.querySelectorAll("#categorias button");
    const searchInput = document.getElementById("episodeSearch");
    const sortDropdown = document.getElementById("sortDropdown");

    let episodios = [];
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
            applyFiltersAndSort();
        } catch (err) {
            console.error(err);
            container.innerHTML = `
                <p class="text-danger text-center">
                    Error al cargar los episodios.
                </p>`;
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
        let lista = [...episodios];

        if (categoriaActiva !== "all") {
            lista = lista.filter(ep => ep.categorias?.includes(categoriaActiva));
        }

        if (terminoBusqueda) {
            lista = lista
                .map(ep => ({ ...ep, score: getMatchScore(ep, terminoBusqueda) }))
                .filter(ep => ep.score > 0);
        }

        lista.sort((a, b) => {
            if (terminoBusqueda && b.score !== a.score) {
                return b.score - a.score;
            }
            if (ordenActivo.startsWith("relevancia")) {
                if (a.destacado && !b.destacado) return -1;
                if (!a.destacado && b.destacado) return 1;
            }
            if (ordenActivo.includes("reciente")) return b.numero - a.numero;
            if (ordenActivo.includes("antiguo")) return a.numero - b.numero;
            return 0;
        });

        filtrados = lista;
        currentPage = 1;
        renderCards();
    }

    function renderCards() {
        // Limpiar contenedor manteniendo el template
        container.querySelectorAll(".col-12:not(#card-template)").forEach(el => el.remove());

        const start = (currentPage - 1) * perPage;
        const pagData = filtrados.slice(start, start + perPage);

        if (!pagData.length) {
            container.innerHTML = `
                <p class="text-center text-secondary mt-5">
                    No hay episodios disponibles.
                </p>`;
            pagination.innerHTML = "";
            return;
        }

        pagData.forEach(ep => {
            const cardWrapper = template.cloneNode(true);
            cardWrapper.id = "";
            cardWrapper.style.display = "block";

            const card = cardWrapper.querySelector(".episode-card-new");
            card.querySelector(".card-img-top-new").src = ep.imagen;
            card.querySelector(".card-img-top-new").alt = ep.titulo;

            // El badge de categoría se mantiene en el DOM pero el CSS que pasaste lo oculta
            const badge = card.querySelector(".category-badge-new");
            const cat = ep.categorias?.[0] || "general";
            badge.className = `category-badge-new badge ${categoryColorMap[cat] || "bg-secondary"}`;
            badge.textContent = cat.toUpperCase();

            card.querySelector(".card-title-new").textContent = ep.titulo.split(" | ")[0];

            card.querySelector(".card-text-new").textContent =
                ep.descripcion.length > 150
                    ? ep.descripcion.slice(0, 150) + "..."
                    : ep.descripcion;

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
            // Se añade la clase 'disabled' para aplicar el efecto visual de bloqueo
            li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
            li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
            
            if (!disabled) {
                li.addEventListener("click", e => {
                    e.preventDefault();
                    onClick();
                    // Efecto de subida suave al cambiar de página
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }
            pagination.appendChild(li);
        };

        // Botón Anterior (Atrás)
        addPage("«", currentPage === 1, false, () => {
            currentPage--;
            renderCards();
        });

        // Lógica de números de página
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);

        for (let i = start; i <= end; i++) {
            addPage(i, false, i === currentPage, () => {
                currentPage = i;
                renderCards();
            });
        }

        // Botón Siguiente
        addPage("»", currentPage === totalPages, false, () => {
            currentPage++;
            renderCards();
        });
    }

    // Listeners para filtros y búsqueda
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
