document.addEventListener("DOMContentLoaded", async () => {
    const container  = document.getElementById("cards-container");
    const template   = document.getElementById("card-template");
    const pagination = document.getElementById("pagination");
    const resultsMeta = document.getElementById("results-meta");
    const categoriasBtns = document.querySelectorAll("#categorias button");
    const searchInput    = document.getElementById("episodeSearch");
    const sortDropdown   = document.getElementById("sortDropdown");

    let episodios = [];
    let filtrados = [];
    let currentPage = 1;
    const perPage = 12;
    let categoriaActiva  = "all";
    let ordenActivo      = sortDropdown ? sortDropdown.value : "aleatorio";
    let terminoBusqueda  = "";

    const pilarLabels = {
        think:   "🧠 Think",
        tech:    "🤖 Tech",
        planet:  "🌍 Planet",
        move:    "🚀 Move",
        general: "Mentes404"
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
            container.innerHTML = `<p class="text-danger text-center mt-5">Error al cargar los episodios.</p>`;
        }
    }

    function getMatchScore(ep, query) {
        let score = 0;
        const q = query.toLowerCase();
        if (ep.titulo.toLowerCase().includes(q))                    score += 10;
        if (ep.descripcion.toLowerCase().includes(q))               score += 5;
        if (ep.categorias?.some(c => c.toLowerCase().includes(q)))  score += 15;
        return score;
    }

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function applyFiltersAndSort() {
        let lista = [...episodios];

        if (categoriaActiva !== "all") {
            lista = lista.filter(ep => ep.categorias?.includes(categoriaActiva));
        }

        if (terminoBusqueda) {
            lista = lista
                .map(ep => ({ ...ep, _score: getMatchScore(ep, terminoBusqueda) }))
                .filter(ep => ep._score > 0);
        }

        // Ordenar — si hay búsqueda activa siempre por score primero
        if (terminoBusqueda) {
            lista.sort((a, b) => {
                if (b._score !== a._score) return b._score - a._score;
                return b.numero - a.numero; // desempate: más reciente
            });
        } else {
            if (ordenActivo === "aleatorio") {
                lista = shuffle(lista);
            } else if (ordenActivo === "mas_reciente") {
                lista.sort((a, b) => b.numero - a.numero);
            } else if (ordenActivo === "mas_antiguo") {
                lista.sort((a, b) => a.numero - b.numero);
            }
        }

        filtrados   = lista;
        currentPage = 1;
        renderCards();
    }

    function renderCards() {
        container.querySelectorAll("[data-ep-card]").forEach(el => el.remove());
        container.querySelectorAll(".empty-state").forEach(el => el.remove());

        const start   = (currentPage - 1) * perPage;
        const pagData = filtrados.slice(start, start + perPage);

        if (resultsMeta) {
            resultsMeta.textContent = filtrados.length > 0
                ? `${filtrados.length} episodio${filtrados.length !== 1 ? "s" : ""} encontrado${filtrados.length !== 1 ? "s" : ""}`
                : "";
        }

        if (!pagData.length) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.innerHTML = `<i class="bi bi-search"></i><p>No hay episodios que coincidan con tu búsqueda.</p>`;
            container.appendChild(empty);
            pagination.innerHTML = "";
            return;
        }

        pagData.forEach(ep => {
            const cat = ep.categorias?.[0] || "general";

            const wrapper = document.createElement("div");
            wrapper.dataset.epCard = "1";

            const cardNode = template.querySelector(".episode-card-new").cloneNode(true);

            cardNode.querySelector(".card-img-top-new").src = ep.imagen;
            cardNode.querySelector(".card-img-top-new").alt = ep.titulo.split(" | ")[0];

            const stripe = cardNode.querySelector(".cat-stripe");
            if (stripe) stripe.className = `cat-stripe ${cat}`;

            const badge = cardNode.querySelector(".category-badge-new");
            if (badge) badge.textContent = cat.toUpperCase();

            const pilar = cardNode.querySelector(".card-pilar");
            if (pilar) {
                pilar.textContent = pilarLabels[cat] || "Mentes404";
                pilar.className   = `card-pilar ${cat}`;
            }

            cardNode.querySelector(".card-title-new").textContent = ep.titulo.split(" | ")[0];

            const desc = ep.descripcion.length > 150
                ? ep.descripcion.slice(0, 150).trim() + "…"
                : ep.descripcion;
            cardNode.querySelector(".card-text-new").textContent = desc;

            cardNode.querySelector(".youtube").href = ep.links.youtube;
            cardNode.querySelector(".spotify").href = ep.links.spotify;
            cardNode.querySelector(".apple").href   = ep.links.apple;

            wrapper.appendChild(cardNode);
            container.appendChild(wrapper);
        });

        renderPagination();
    }

    function renderPagination() {
        const totalPages = Math.ceil(filtrados.length / perPage);
        pagination.innerHTML = "";
        if (totalPages <= 1) return;

        const addPage = (text, disabled, active, onClick) => {
            const li = document.createElement("li");
            li.className = `page-item${disabled ? " disabled" : ""}${active ? " active" : ""}`;
            li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
            if (!disabled) li.addEventListener("click", e => {
                e.preventDefault();
                onClick();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
            pagination.appendChild(li);
        };

        addPage("«", currentPage === 1, false, () => { currentPage--; renderCards(); });

        let lastRendered = 0;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                if (lastRendered && i - lastRendered > 1) {
                    const li = document.createElement("li");
                    li.className = "page-item disabled";
                    li.innerHTML = `<a class="page-link">…</a>`;
                    pagination.appendChild(li);
                }
                const idx = i;
                addPage(i, false, i === currentPage, () => { currentPage = idx; renderCards(); });
                lastRendered = i;
            }
        }

        addPage("»", currentPage === totalPages, false, () => { currentPage++; renderCards(); });
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
