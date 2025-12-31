document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("guests-container");
    const template = document.getElementById("guest-card-template");
    const pagination = document.getElementById("pagination");
    const modalContainer = document.getElementById("modals-container");

    let invitados = [];
    let currentPage = 1;
    const perPage = 9; // Cuadrícula de 3x3 (9 invitados por página)

    // 1. ORDENAMIENTO PERSONALIZADO: IDs con letras (1a, 2a...) primero
    function customSort(a, b) {
        const isALetter = /[a-zA-Z]/.test(a.id);
        const isBLetter = /[a-zA-Z]/.test(b.id);
        
        if (isALetter && !isBLetter) return -1;
        if (!isALetter && isBLetter) return 1;
        
        // Ordenación natural (maneja 1, 2, 10 correctamente)
        return String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' });
    }

    // 2. CARGA DE DATOS
    async function loadData() {
        try {
            const res = await fetch("invitados.json");
            if (!res.ok) throw new Error("No se pudo cargar el JSON de invitados");
            invitados = await res.json();
            
            // Aplicamos el ordenamiento estratégico
            invitados.sort(customSort);
            
            renderGuests();
        } catch (err) {
            console.error(err);
            if (container) container.innerHTML = `<p class="text-center text-danger">Error al cargar los invitados.</p>`;
        }
    }

    // 3. RENDERIZADO DE TARJETAS
    function renderGuests() {
        if (!container || !template) return;
        container.innerHTML = "";
        modalContainer.innerHTML = "";
        
        const start = (currentPage - 1) * perPage;
        const pagData = invitados.slice(start, start + perPage);

        pagData.forEach(guest => {
            const card = template.cloneNode(true);
            card.style.display = "block";
            card.id = "";
            
            const modalId = `modalGuest_${guest.id}`.replace(/\./g, '_');

            // Datos de la card
            card.querySelector("img").src = guest.imagen;
            card.querySelector(".card-title").textContent = guest.nombre;
            card.querySelector(".card-text").textContent = guest.titulo;

            // Enlace de escucha (YouTube)
            const listenBtn = card.querySelector(".btn-listen");
            if (guest.episodio_link === "#") {
                listenBtn.classList.add("disabled");
                listenBtn.href = "javascript:void(0)";
            } else {
                listenBtn.href = guest.episodio_link;
            }

            // Botón de modal
            const moreBtn = card.querySelector(".btn-more");
            moreBtn.setAttribute("data-bs-toggle", "modal");
            moreBtn.setAttribute("data-bs-target", `#${modalId}`);

            container.appendChild(card);
            
            // Generar el modal del invitado
            createGuestModal(guest, modalId);
        });

        renderPagination();
    }

    // 4. GENERACIÓN DINÁMICA DE MODAL
    function createGuestModal(guest, modalId) {
        // Procesar redes sociales
        const socialLinksHTML = guest.links.map(link => {
            // Detectar si el icono es una ruta de imagen o una clase de Bootstrap Icons
            const isImagePath = link.icono.includes('.') || link.icono.includes('/');
            const iconContent = isImagePath 
                ? `<img src="${link.icono}" style="width:20px; height:20px; filter: brightness(0) invert(1);" alt="${link.tipo}">`
                : `<i class="bi ${link.icono}"></i>`;

            return `
                <a href="${link.url}" class="btn btn-outline-info d-inline-flex align-items-center justify-content-center" 
                   target="_blank" rel="noopener" style="width:40px; height:40px; border-radius:50%; font-size:1.2rem;">
                    ${iconContent}
                </a>`;
        }).join('');

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark text-light border-secondary shadow-lg" style="border-radius: 15px;">
                        <div class="modal-header border-0">
                            <h5 class="modal-title fw-bold" style="color: #2093cc;">${guest.nombre}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="fw-bold text-white mb-1">${guest.titulo}</p>
                            <p class="small text-info mb-3">${guest.episodio_numero || ""}</p>
                            <hr class="border-secondary">
                            <p class="text-secondary" style="font-size: 0.95rem; line-height: 1.6;">
                                ${guest.bio_completa || guest.bio_corta}
                            </p>
                            <hr class="border-secondary">
                            <div class="mt-3">
                                <p class="small mb-2 fw-bold text-uppercase" style="letter-spacing: 1px; color: #fff;">Redes del invitado</p>
                                <div class="d-flex flex-wrap gap-2">
                                    ${socialLinksHTML}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-0">
                            <a href="${guest.episodio_link}" target="_blank" 
                               class="btn btn-primary w-100 fw-bold py-2 ${guest.episodio_link === "#" ? "disabled" : ""}" 
                               style="background-color: #2093cc; border: none; border-radius: 50px;">
                                <i class="bi bi-headphones me-2"></i> Escuchar Episodio completo
                            </a>
                        </div>
                    </div>
                </div>
            </div>`;
        
        modalContainer.insertAdjacentHTML('beforeend', modalHtml);
    }

    // 5. RENDERIZADO DE PAGINACIÓN (CON FLECHAS)
    function renderPagination() {
        const totalPages = Math.ceil(invitados.length / perPage);
        if (!pagination) return;
        pagination.innerHTML = "";
        
        if (totalPages <= 1) return;

        // Botón Anterior («)
        addPageItem("«", currentPage > 1, () => {
            currentPage--;
            renderGuests();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Números
        for (let i = 1; i <= totalPages; i++) {
            addPageItem(i, true, () => {
                currentPage = i;
                renderGuests();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, i === currentPage);
        }

        // Botón Siguiente (»)
        addPageItem("»", currentPage < totalPages, () => {
            currentPage++;
            renderGuests();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function addPageItem(text, enabled, onClick, active = false) {
        const li = document.createElement("li");
        li.className = `page-item ${enabled ? "" : "disabled"} ${active ? "active" : ""}`;
        
        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "#";
        a.innerHTML = text;
        
        a.addEventListener("click", (e) => {
            e.preventDefault();
            if (enabled) onClick();
        });

        li.appendChild(a);
        pagination.appendChild(li);
    }

    loadData();
});
