document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("guests-container");
    const template = document.getElementById("guest-card-template");
    const pagination = document.getElementById("pagination");
    const modalContainer = document.getElementById("modals-container");

    let invitados = [];
    let currentPage = 1;
    const perPage = 9; // Cuadrícula 3x3

    /**
     * Ordenamiento: IDs con letras primero (1a, 2a), luego numéricos.
     * Esto asegura que los invitados con 'a' aparezcan al principio.
     */
    function customSort(a, b) {
        const isALetter = /[a-zA-Z]/.test(a.id);
        const isBLetter = /[a-zA-Z]/.test(b.id);
        
        // Si uno tiene letra y el otro no, el de la letra va primero
        if (isALetter && !isBLetter) return -1;
        if (!isALetter && isBLetter) return 1;
        
        // Si ambos son del mismo tipo, orden natural
        return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
    }

    /**
     * Carga el archivo JSON local
     */
    async function loadData() {
        try {
            const res = await fetch("invitados.json");
            if (!res.ok) throw new Error("No se pudo cargar el JSON");
            invitados = await res.json();
            
            // Aplicar el orden estratégico antes de renderizar
            invitados.sort(customSort);
            
            renderGuests();
        } catch (err) {
            console.error("Error al cargar invitados:", err);
            if (container) {
                container.innerHTML = `<p class="text-center text-danger">Error cargando invitados: ${err.message}</p>`;
            }
        }
    }

    /**
     * Limpia y dibuja las tarjetas en el contenedor según la página actual
     */
    function renderGuests() {
        if (!container || !template) return;
        
        container.innerHTML = "";
        if (modalContainer) modalContainer.innerHTML = "";
        
        const start = (currentPage - 1) * perPage;
        const pagData = invitados.slice(start, start + perPage);

        pagData.forEach(guest => {
            const card = template.cloneNode(true);
            card.style.display = "block";
            card.id = "";
            
            // Creamos un ID único para el modal evitando puntos conflictivos
            const modalId = `modalGuest_${guest.id}`.replace(/\./g, '_');

            // Asignación de datos a la tarjeta (Card)
            card.querySelector("img").src = guest.imagen;
            card.querySelector(".card-title").textContent = guest.nombre;
            card.querySelector(".card-text").textContent = guest.titulo;

            // Lógica del botón escuchar
            const listenBtn = card.querySelector(".btn-listen");
            if (!guest.episodio_link || guest.episodio_link === "#") {
                listenBtn.href = "javascript:void(0)";
                listenBtn.classList.add("disabled");
            } else {
                listenBtn.href = guest.episodio_link;
                listenBtn.target = "_blank";
            }

            // Lógica del botón modal
            const moreBtn = card.querySelector(".btn-more");
            moreBtn.setAttribute("data-bs-toggle", "modal");
            moreBtn.setAttribute("data-bs-target", `#${modalId}`);

            container.appendChild(card);
            
            // Generamos el modal para este invitado
            renderModal(guest, modalId);
        });
        
        renderPagination();
    }

    /**
     * Crea el HTML del modal y lo inyecta en el DOM
     */
    function renderModal(guest, modalId) {
        // Renderizado de iconos sociales
        const socialLinksHTML = guest.links.map(link => {
            // Detectar si el icono es una ruta de imagen (ej: .svg o .webp) o una clase de Bootstrap Icons
            const isImagePath = link.icono.includes('.') || link.icono.includes('/');
            const iconContent = isImagePath 
                ? `<img src="${link.icono}" style="width:22px; height:22px; filter: brightness(0) invert(1);" alt="${link.tipo}">`
                : `<i class="bi ${link.icono}"></i>`;

            return `
                <a href="${link.url}" class="btn btn-outline-info d-inline-flex align-items-center justify-content-center" 
                   target="_blank" rel="noopener" style="width:42px; height:42px; border-radius:50%; font-size:1.2rem;">
                    ${iconContent}
                </a>`;
        }).join(' ');

        // Saltos de línea en la biografía
        const bioTexto = guest.bio_completa || guest.bio_corta || "";
        const bioFormateada = bioTexto.replace(/\n/g, '<br>');

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content bg-dark text-light border-secondary shadow-lg" style="border-radius: 15px;">
                        <div class="modal-header border-0">
                            <h5 class="modal-title fw-bold" style="color: #2093cc; font-size: 1.6rem;">${guest.nombre}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" style="padding: 2rem;">
                            <p class="fw-bold text-white mb-1" style="font-size: 1.1rem;">${guest.titulo}</p>
                            <p class="small text-info mb-4">${guest.episodio_numero || ""}</p>
                            <hr class="border-secondary opacity-50">
                            <div class="bio-container mb-4" style="line-height: 1.7; color: #eee7d5; font-size:0.95rem;">
                                ${bioFormateada}
                            </div>
                            <hr class="border-secondary opacity-50">
                            <div class="mt-4">
                                <p class="small mb-3 fw-bold text-uppercase" style="letter-spacing: 1px; color: #2093cc;">Redes y Enlaces</p>
                                <div class="d-flex flex-wrap gap-3">
                                    ${socialLinksHTML}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-0">
                            <a href="${guest.episodio_link}" target="_blank" 
                               class="btn btn-primary w-100 fw-bold py-3 ${(!guest.episodio_link || guest.episodio_link === "#") ? "disabled" : ""}" 
                               style="background-color: #2093cc; border: none; border-radius: 50px; font-size: 1rem;">
                                <i class="bi bi-headphones me-2"></i> Escuchar Episodio Completo
                            </a>
                        </div>
                    </div>
                </div>
            </div>`;
        
        modalContainer.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * Crea la lista de números de página y flechas
     */
    function renderPagination() {
        const totalPages = Math.ceil(invitados.length / perPage);
        if (!pagination) return;
        pagination.innerHTML = "";
        
        if (totalPages <= 1) return;

        // Flecha Anterior «
        addPageItem("«", currentPage > 1, () => { 
            currentPage--; 
            renderGuests(); 
            window.scrollTo({top: 0, behavior: 'smooth'}); 
        });

        // Números de página
        for (let i = 1; i <= totalPages; i++) {
            addPageItem(i, true, () => { 
                currentPage = i; 
                renderGuests(); 
                window.scrollTo({top: 0, behavior: 'smooth'}); 
            }, i === currentPage);
        }

        // Flecha Siguiente »
        addPageItem("»", currentPage < totalPages, () => { 
            currentPage++; 
            renderGuests(); 
            window.scrollTo({top: 0, behavior: 'smooth'}); 
        });
    }

    /**
     * Helper para construir cada <li> de la paginación
     */
    function addPageItem(text, enabled, onClick, active = false) {
        const li = document.createElement("li");
        li.className = `page-item ${enabled ? "" : "disabled"} ${active ? "active" : ""}`;
        
        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "#";
        a.innerHTML = text;
        
        a.onclick = (e) => { 
            e.preventDefault(); 
            if (enabled) onClick(); 
        };
        
        li.appendChild(a);
        pagination.appendChild(li);
    }

    loadData();
});
