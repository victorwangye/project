document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("cards-container");
    const template = document.getElementById("card-template");
    const pagination = document.getElementById("pagination");
    const categoriasBtns = document.querySelectorAll("#categorias button");
    const ordenamientoBtns = document.querySelectorAll("#ordenamiento button");
    const subcatContainer = document.getElementById("subcategorias"); // Se mantiene para consistencia, aunque no se usa para subcats

    let episodios = [];
    let filtrados = [];
    let currentPage = 1;
    const perPage = 9; // Reducido a 9 para mejor paginación visual
    let categoriaActiva = "all";
    let ordenActivo = "relevancia"; // Nuevo: Criterio de orden por defecto

    async function loadData() {
        try {
            const res = await fetch("./data.json");
            if (!res.ok) throw new Error("No se pudo cargar data.json");
            const data = await res.json();

            // Guardamos todos los episodios sin ordenar inicialmente
            episodios = data.episodios;

            // Inicializamos la lista filtrada y ordenamos por defecto
            applyFiltersAndSort();
        } catch (err) {
            container.innerHTML = `<p class="text-danger text-center">Error cargando episodios: ${err}</p>`;
            console.error(err);
        }
    }
    
    // Función central para aplicar filtros y ordenamiento
    function applyFiltersAndSort() {
        // 1. Filtrado por Categoría (permite múltiples categorías por episodio)
        if (categoriaActiva === "all") {
            filtrados = episodios;
        } else {
            // Filtra solo los episodios cuya lista de categorías incluya la categoría activa
            filtrados = episodios.filter(ep => ep.categorias?.includes(categoriaActiva));
        }

        // 2. Ordenamiento
        filtrados.sort((a, b) => {
            // Lógica de ordenamiento por Relevancia (Destacados)
            if (ordenActivo === "relevancia") {
                // Primero, si A es destacado y B no, A va primero
                if (a.destacado && !b.destacado) return -1;
                // Si B es destacado y A no, B va primero
                if (!a.destacado && b.destacado) return 1;
            } 
            
            // Si no hay diferencia de relevancia o si el orden NO es 'relevancia', ordenamos por número (fecha)
            
            if (ordenActivo === "mas_reciente" || ordenActivo === "relevancia") {
                // Mas reciente (número más alto) va primero: b.numero - a.numero (Descendente)
                return b.numero - a.numero; 
            }
            
            if (ordenActivo === "mas_antiguo") {
                // Mas antiguo (número más bajo) va primero: a.numero - b.numero (Ascendente)
                return a.numero - b.numero;
            }
            
            return 0; // Si no hay criterio, no cambia el orden
        });
        
        currentPage = 1;
        renderCards();
    }


    function renderCards() {
        container.querySelectorAll(".col-12:not(#card-template)").forEach(c => c.remove());
        const start = (currentPage-1)*perPage;
        const end = start + perPage;
        const pagData = filtrados.slice(start, end);

        if (pagData.length === 0) {
            container.innerHTML = `<p class="text-center text-light">No hay episodios disponibles.</p>`;
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
            card.querySelector(".categories-text").textContent = "Categorías: " + ep.categorias.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ");
            
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
            // Usamos las clases de centrado que definimos
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

    // Eventos para Botones de Categorías
    categoriasBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            categoriasBtns.forEach(b => b.classList.remove("active", "btn-outline-light", "btn-outline-info"));
            // Restablecer estilos
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
            
            // Reaplicar orden (los filtros no cambian, solo el orden)
            applyFiltersAndSort();
        });
    });

    loadData();
});
