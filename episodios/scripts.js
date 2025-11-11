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
    const perPage = 12; // 4 filas de 3 tarjetas
    let categoriaActiva = "all";
    let ordenActivo = "relevancia_reciente"; // Criterio de orden por defecto AHORA ES RECIENTE
    let terminoBusqueda = "";

    async function loadData() {
        try {
            const res = await fetch("./data.json");
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

        // Si el título contiene la consulta
        if (episode.titulo.toLowerCase().includes(q)) {
            score += 10;
        }
        // Si la descripción contiene la consulta
        if (episode.descripcion.toLowerCase().includes(q)) {
            score += 5;
        }
        // Si alguna categoría coincide exactamente
        if (episode.categorias.some(c => c.toLowerCase().includes(q))) { // Uso includes para categorías parciales
            score += 15;
        }
        // Si es un episodio destacado, añade un bono (solo en búsqueda)
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
                .filter(ep => ep.score > 0); // Solo incluye si hay coincidencia
        }
        
        // 3. Ordenamiento (Aplica relevancia, fecha y puntuación de búsqueda)
        listaFiltrada.sort((a, b) => {
            
            // PRIORIDAD 1: Ordenamiento por puntuación de búsqueda (solo si hay término de búsqueda)
            if (terminoBusqueda.length > 0) {
                if (b.score !== a.score) {
                    return b.score - a.score; // Mayor puntuación primero
                }
            }
            
            // PRIORIDAD 2: Lógica de Relevancia (Aplica para ambos modos "relevancia_...")
            if (ordenActivo.startsWith('relevancia')) {
                // 1. Prioridad: destacado true va primero
                if (a.destacado && !b.destacado) return -1;
                if (!a.destacado && b.destacado) return 1;
            }
            
            // PRIORIDAD 3: Desempate o Modo Fecha Pura (si no hay búsqueda o puntuaciones iguales)
            
            // Más Reciente (Default para Relevancia y modo fecha pura)
            if (ordenActivo === "mas_reciente" || ordenActivo === "relevancia_reciente") {
                return b.numero - a.numero; // Descendente por número
            }
            
            // Más Antiguo (Default para Relevancia antigua y modo fecha pura)
            if (ordenActivo === "mas_antiguo" || ordenActivo === "relevancia_antigua") {
                return a.numero - b.numero; // Ascendente por número
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
            // MENSAJE DE NO ENCONTRADO PERSONALIZADO
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
            
            const card = cardWrapper.querySelector(".episode-card");

            // Rellenar datos
            card.querySelector("img").src = ep.imagen;
            card.querySelector("img").alt = ep.titulo;
            card.querySelector(".card-title").textContent = `#${ep.numero}: ${ep.titulo}`;
            card.querySelector(".card-text").textContent = ep.descripcion;
            
            // Enlaces de Podcast
            card.querySelector(".youtube").href = ep.links.youtube;
            card.querySelector(".spotify").href = ep.links.spotify;
            card.querySelector(".apple").href = ep.links.apple;
            
            // Categorías
            const categoriesDiv = cardWrapper.querySelector(".categories-text");
            if (categoriesDiv) {
                categoriesDiv.innerHTML = "Categorías: " + ep.categorias.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ");
            }
            
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
            categoriasBtns.forEach(b => b.classList.remove("active", "btn-outline-light", "btn-outline-info"));
            
            // Restablecer estilos de botones
            categoriasBtns.forEach(b => {
                if (b.dataset.category === "all") {
                    b.classList.add("btn-outline-light");
                } else {
                    b.classList.add("btn-outline-info");
                }
            });
            
            btn.classList.add("active");
            categoriaActiva = btn.dataset.category;
            
            // Reaplicar filtros y orden
            applyFiltersAndSort();
        });
    });

    // Eventos para Botones de Ordenamiento
    ordenamientoBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            ordenamientoBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            ordenActivo = btn.dataset.sort;
            
            // Reaplicar orden 
            applyFiltersAndSort();
        });
    });

    loadData();
});