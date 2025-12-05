document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("cards-container");
    const template = document.getElementById("card-template");
    const pagination = document.getElementById("pagination");
    const categoriasBtns = document.querySelectorAll("#categorias button");
    const ordenamientoBtns = document.querySelectorAll("#ordenamiento button");
    const searchInput = document.getElementById("episodeSearch"); 

    let episodios = []; 
    let filtrados = []; 
    let currentPage = 1;
    const perPage = 12; // Mantiene 12 elementos por página
    let categoriaActiva = "all";
    let ordenActivo = "relevancia_reciente"; // Criterio de orden por defecto 
    let terminoBusqueda = "";

    // Mapeo para asignar clases de color a los badges
    const categoryColorMap = {
        'think': 'bg-think',
        'tech': 'bg-tech',
        'planet': 'bg-planet',
        'move': 'bg-move'
    };
    
    // Función auxiliar para obtener el título corto para el overlay (texto grande sobre la imagen)
    function getOverlayTitle(fullTitle) {
        // Busca el separador común (| o -) para usar la primera parte como título de impacto
        const separatorIndex = fullTitle.indexOf('|');
        if (separatorIndex !== -1) {
            return fullTitle.substring(0, separatorIndex).trim();
        }
        // Si no hay separador, usa el título completo o lo trunca si es muy largo
        return fullTitle.length > 50 ? fullTitle.substring(0, 50).trim() + '...' : fullTitle;
    }


    async function loadData() {
        try {
            const res = await fetch("data.json"); 
            if (!res.ok) throw new Error("No se pudo cargar data.json");
            const data = await res.json();

            episodios = data.episodios;

            // Inicializamos la lista filtrada y ordenamos por defecto
            applyFiltersAndSort();
        } catch (err) {
            container.innerHTML = `<p class="text-danger text-center">Error al cargar los datos del podcast. Asegúrese de que 'data.json' existe y es accesible.</p>`;
            console.error(err);
        }
    }
    
    // Función de puntuación de coincidencia para la búsqueda
    function getMatchScore(episode, query) {
        let score = 0;
        const q = query.toLowerCase();

        if (episode.titulo.toLowerCase().includes(q)) {
            score += 10;
        }
        if (episode.descripcion.toLowerCase().includes(q)) {
            score += 5;
        }
        if (episode.categorias.some(c => c.toLowerCase().includes(q))) { 
            score += 15;
        }
        if (episode.destacado) {
            score += 2;
        }
        return score;
    }

    // Función central para aplicar búsqueda, filtros y ordenamiento
    function applyFiltersAndSort() {
        let listaFiltrada = episodios;

        // 1. Filtrado por CATEGORÍA
        if (categoriaActiva !== "all") {
            listaFiltrada = listaFiltrada.filter(ep => ep.categorias?.includes(categoriaActiva));
        }

        // 2. Filtrado y Puntuación por BÚSQUEDA
        if (terminoBusqueda.length > 0) {
            const query = terminoBusqueda;
            
            // Filtra y adjunta la puntuación de coincidencia
            listaFiltrada = listaFiltrada
                .map(ep => ({ ...ep, score: getMatchScore(ep, query) }))
                .filter(ep => ep.score > 0); 
        }
        
        // 3. Ordenamiento
        listaFiltrada.sort((a, b) => {
            
            if (terminoBusqueda.length > 0) {
                if (b.score !== a.score) {
                    return b.score - a.score; 
                }
            }
            
            if (ordenActivo.startsWith('relevancia')) {
                if (a.destacado && !b.destacado) return -1;
                if (!a.destacado && b.destacado) return 1;
            }
            
            if (ordenActivo === "mas_reciente" || ordenActivo === "relevancia_reciente") {
                return b.numero - a.numero; 
            }
            
            if (ordenActivo === "mas_antiguo" || ordenActivo === "relevancia_antigua") {
                return a.numero - b.numero; 
            }
            
            return 0;
        });
        
        filtrados = listaFiltrada;
        currentPage = 1;
        renderCards();
    }

    function handleSearch() {
        terminoBusqueda = searchInput.value.toLowerCase().trim();
        applyFiltersAndSort();
    }


    function renderCards() {
        // Elimina las tarjetas existentes, excepto la plantilla
        container.querySelectorAll(".col-12:not(#card-template)").forEach(c => c.remove());
        
        const start = (currentPage-1)*perPage;
        const end = start + perPage;
        const pagData = filtrados.slice(start, end);

        if (pagData.length === 0) {
            const mensaje = terminoBusqueda.length > 0 
                ? `vaya parece ser que te encontraste un 404, solicita el episodio mandando un mensaje a <a href="mailto:hola@mentes404.studio" class="text-info">hola@mentes404.studio</a>`
                : `No hay episodios disponibles.`;
            container.innerHTML = `<p class="text-center text-secondary mt-5">${mensaje}</p>`;
            pagination.innerHTML = "";
            return;
        }

        pagData.forEach(ep => {
            const cardWrapper = template.cloneNode(true);
            cardWrapper.id = "";
            cardWrapper.style.display = "block";
            
            const card = cardWrapper.querySelector(".episode-card-new");
            
            // --- CUBIERTA DE IMAGEN Y TEXTO OVERLAY ---
            
            // Imagen
            card.querySelector(".card-img-top-new").src = ep.imagen;
            card.querySelector(".card-img-top-new").alt = ep.titulo;
            
            // Texto Overlay
            card.querySelector(".overlay-small-text").textContent = `Mentes404 | #${ep.numero}`;
            card.querySelector(".overlay-large-title").textContent = getOverlayTitle(ep.titulo);
            
            // Badge de Categoría
            const mainCategory = ep.categorias[0]; // Usamos la primera categoría para el badge
            const categoryBadge = card.querySelector(".category-badge-new");
            
            // Limpia clases anteriores y aplica la clase de color y texto
            categoryBadge.className = 'category-badge-new badge'; // Reset
            categoryBadge.classList.add(categoryColorMap[mainCategory] || 'bg-secondary');
            categoryBadge.textContent = mainCategory.toUpperCase();

            
            // --- CUERPO DE LA TARJETA ---
            
            // Título completo (limpio)
            const fullTitle = ep.titulo;
            const cleanTitle = fullTitle.split(' | ')[0]; // Limpia el sufijo | Mentes404 #XX
            card.querySelector(".card-title-new").textContent = cleanTitle;
            
            // Descripción truncada (para que coincida con el estilo de la imagen)
            const fullDescription = ep.descripcion;
            const displayDescription = fullDescription.length > 150 
                ? fullDescription.substring(0, 150).trim() + '...' 
                : fullDescription;
            card.querySelector(".card-text-new").textContent = displayDescription;
            
            // Enlaces de Podcast
            card.querySelector(".youtube").href = ep.links.youtube;
            card.querySelector(".spotify").href = ep.links.spotify;
            card.querySelector(".apple").href = ep.links.apple;
            
            container.appendChild(cardWrapper);
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
            li.innerHTML = `<a class="page-link bg-dark text-white border-secondary d-flex justify-content-center align-items-center" href="#">${text}</a>`;
            if(!disabled) li.addEventListener("click", onClick);
            pagination.appendChild(li);
        };

        addPage("«", currentPage===1,false, ()=>{currentPage--; renderCards();});
        for(let i=1;i<=totalPages;i++){
            addPage(i,false,i===currentPage, ()=>{currentPage=i; renderCards();});
        }
        addPage("»", currentPage===totalPages,false, ()=>{currentPage++; renderCards();});
    }

    // === Event Listeners ===

    // Evento para el Buscador
    if (searchInput) {
        searchInput.addEventListener("input", handleSearch);
    }

    // Eventos para Botones de Categorías
    categoriasBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            categoriasBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            categoriaActiva = btn.dataset.category;
            applyFiltersAndSort();
        });
    });

    // Eventos para Botones de Ordenamiento
    ordenamientoBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            ordenamientoBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            ordenActivo = btn.dataset.sort;
            applyFiltersAndSort();
        });
    });

    loadData();
});
