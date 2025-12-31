document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("guests-container");
    const template = document.getElementById("guest-card-template");
    const pagination = document.getElementById("pagination");
    const modalContainer = document.getElementById("modals-container");

    let invitados = [];
    let currentPage = 1;
    const perPage = 9; // Configurado para mostrar 3 filas de 3 columnas

    // 1. Cargar los datos desde el JSON
    async function loadData() {
        try {
            const res = await fetch("invitados.json");
            if (!res.ok) throw new Error("No se pudo cargar el archivo JSON");
            invitados = await res.json();
            
            // Opcional: Ordenar invitados por ID o nombre si es necesario
            // invitados.sort((a, b) => String(a.id).localeCompare(String(b.id)));

            renderGuests();
        } catch (err) {
            console.error("Error cargando invitados:", err);
            if (container) {
                container.innerHTML = `<p class="text-center text-danger">Error al cargar invitados. Revisa la consola.</p>`;
            }
        }
    }

    // 2. Renderizar las tarjetas de invitados
    function renderGuests() {
        if (!container || !template) return;

        container.innerHTML = "";
        if (modalContainer) modalContainer.innerHTML = "";
        
        // Calcular rango de paginación
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pagData = invitados.slice(start, end);

        pagData.forEach(guest => {
            const card = template.cloneNode(true);
            card.style.display = "block";
            card.id = ""; // Limpiar el ID del clon

            // Crear un ID único para el modal basado en el ID del invitado
            const modalId = `modalGuest_${guest.id}`.replace(/\./g, '_');

            // Asignar Imagen
            const img = card.querySelector("img");
            if (img) {
                img.src = guest.imagen;
                img.alt = guest.nombre;
            }

            // Asignar Nombre y Título
            const title = card.querySelector(".card-title");
            if (title) title.textContent = guest.nombre;
            
            const text = card.querySelector(".card-text");
            if (text) text.textContent = guest.titulo;

            // Configurar Botón "Escuchar" (el enlace <a>)
            const listenBtn = card.querySelector(".btn-listen") || card.querySelector("a.btn");
            if (listenBtn) {
                listenBtn.href = guest.episodio_link || "#";
                listenBtn.target = "_blank";
            }

            // Configurar Botón "Ver más" (el <button>)
            const moreBtn = card.querySelector(".btn-more") || card.querySelector("button");
            if (moreBtn) {
                moreBtn.setAttribute("data-bs-toggle", "modal");
                moreBtn.setAttribute("data-bs-target", `#${modalId}`);
            }

            container.appendChild(card);

            // Generar el Modal correspondiente
            if (modalContainer) {
                renderModal(guest, modalId);
            }
        });

        renderPagination();
    }

    // 3. Generar el HTML de los modales dinámicamente
    function renderModal(guest, modalId) {
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark text-light border-secondary shadow-lg">
                        <div class="modal-header border-0">
                            <h5 class="modal-title text-info fw-bold">${guest.nombre}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="fw-bold">${guest.titulo}</p>
                            <hr class="border-secondary">
                            <p>${guest.bio_completa || guest.bio_corta || "Sin biografía disponible."}</p>
                            <hr class="border-secondary">
                            <p class="small"><strong>Episodio:</strong> ${guest.episodio_titulo || "Pendiente"}</p>
                        </div>
                        <div class="modal-footer border-0 justify-content-center">
                            <a href="${guest.episodio_link || '#'}" target="_blank" class="btn btn-primary w-100">
                                <i class="bi bi-headphones"></i> Escuchar Episodio completo
                            </a>
                        </div>
                    </div>
                </div>
            </div>`;
        modalContainer.insertAdjacentHTML('beforeend', modalHtml);
    }

    // 4. Renderizar Paginación con flechas
    function renderPagination() {
        if (!pagination) return;
        const totalPages = Math.ceil(invitados.length / perPage);
        pagination.innerHTML = "";

        if (totalPages <= 1) return;

        // Botón Anterior («)
        createPageItem("«", currentPage > 1, () => {
            currentPage--;
            renderGuests();
            window.scrollTo(0, 0);
        });

        // Números de página
        for (let i = 1; i <= totalPages; i++) {
            createPageItem(i, true, () => {
                currentPage = i;
                renderGuests();
                window.scrollTo(0, 0);
            }, i === currentPage);
        }

        // Botón Siguiente (»)
        createPageItem("»", currentPage < totalPages, () => {
            currentPage++;
            renderGuests();
            window.scrollTo(0, 0);
        });
    }

    // Función auxiliar para crear elementos de paginación
    function createPageItem(text, enabled, onClick, active = false) {
        const li = document.createElement("li");
        li.className = `page-item ${enabled ? "" : "disabled"} ${active ? "active" : ""}`;
        
        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "#";
        a.textContent = text;
        
        a.addEventListener("click", (e) => {
            e.preventDefault();
            if (enabled) onClick();
        });

        li.appendChild(a);
        pagination.appendChild(li);
    }

    // Iniciar carga
    loadData();
});
