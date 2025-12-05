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
    // Inicializa el orden con el valor por defecto del select
    let ordenActivo = sortDropdown ? sortDropdown.value : "relevancia_reciente";
    let terminoBusqueda = "";

    // Mapeo (ya no se usa para el badge, pero se mantiene si se necesita para otras partes del sitio)
    const categoryColorMap = {
        'think': 'bg-think',
        'tech': 'bg-tech',
        'planet': 'bg-planet',
        'move': 'bg-move'
    };
    
    // Función auxiliar para obtener el título corto para el overlay (ya no se usa el título, solo se necesita el número)
    function getOverlayText(epNumero) {
        return `Mentes404 | #${epNumero.toString().padStart(2, '0')}`;
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
    
    // Función de puntuación de coincidencia para la búsqueda (se mantiene)
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

    // Función central para aplicar búsqueda, filtros y ordenamiento (se mantiene)
    function applyFiltersAndSort() {
        let listaFiltrada = episodios;

        // 1. Filtrado por CATEGORÍA
        if (categoriaActiva !== "all") {
            listaFiltrada = listaFiltrada.filter(ep => ep.categorias?.includes(categoriaActiva));
        }

        // 2. Filtrado y Puntuación por BÚSQUEDA
        if (terminoBusqueda.length > 0) {
            const query = terminoBusqueda;
            
            listaFiltrada = listaFiltrada
                .map(ep => ({ ...ep, score: getMatchScore(ep, query) }))
                .filter(ep => ep.score > 0); 
        }
        
        // 3. Ordenamiento (se mantiene)
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
            
            // Texto Overlay (Solo el texto pequeño de Mentes404 | #XX)
            card.querySelector(".overlay-small-text").textContent = getOverlayText(ep.numero);

            
            // --- CUERPO DE LA TARJETA ---
            
            // Título (el título que se muestra debajo de la imagen)
            const fullTitle = ep.titulo;
            const cleanTitle = fullTitle.split(' | ')[0]; 
            card.querySelector(".card-title-new").textContent = cleanTitle;
            
            // Descripción (Truncamiento a 150 caracteres + ...)
            const fullDescription = ep.descripcion;
            const maxChars = 150;
            const displayDescription = fullDescription.length > maxChars 
                ? fullDescription.substring(0, maxChars).trim() + '...' 
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

    if (searchInput) {
        searchInput.addEventListener("input", handleSearch);
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
        sortDropdown.addEventListener("change", (e) => {
            ordenActivo = e.target.value;
            applyFiltersAndSort();
        });
    }

    loadData();
});
