document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("guests-container");
    const template = document.getElementById("guest-card-template");
    const pagination = document.getElementById("pagination");
    const modalContainer = document.getElementById("modals-container");
    const searchInput = document.getElementById("guestSearch"); // Elemento del buscador

    let invitados = [];
    let filteredInvitados = []; // Nueva lista para resultados filtrados
    let currentPage = 1;
    const perPage = 9;
    const BIO_COLLAPSE_THRESHOLD = 300;

    // Función de ordenamiento personalizado
    function customSort(a, b) {
        // Expresión regular para detectar cualquier letra (carácter no numérico) en el ID
        const isALetter = /[a-zA-Z]/.test(a.id);
        const isBLetter = /[a-zA-Z]/.test(b.id);
        const idA = a.id;
        const idB = b.id;

        // 1. Prioridad: IDs con letra vienen ANTES de IDs solo numéricos.
        if (isALetter && !isBLetter) {
            return -1; // A (con letra) viene antes que B (sin letra)
        }
        if (!isALetter && isBLetter) {
            return 1; // B (con letra) viene antes que A (sin letra)
        }

        // 2. Si ambos tienen letra o ambos no tienen letra:

        if (isALetter && isBLetter) {
            // Si ambos tienen letra (ej. "1A" y "2A"): ordenación lexicográfica (alfabética)
            return String(idA).localeCompare(String(idB));
        } else {
            // Si ambos son puramente numéricos (ej. 3 y 4): ordenación numérica ascendente
            return Number(idA) - Number(idB);
        }
    }

    async function loadData() {
        try {
            const res = await fetch("invitados.json");
            if (!res.ok) throw new Error("No se pudo cargar invitados.json");
            invitados = await res.json();

            // Aplicar el nuevo ordenamiento personalizado aquí
            invitados.sort(customSort); 
            
            // Inicializar la lista filtrada con todos los invitados
            filteredInvitados = invitados;
            renderGuests();
        } catch (err) {
            container.innerHTML = `<p class="text-danger text-center">Error cargando invitados: ${err.message}</p>`;
            console.error(err);
        }
    }

    function filterGuests() {
        const query = searchInput.value.toLowerCase().trim();
        currentPage = 1; // Resetear a la primera página al buscar

        if (query === "") {
            filteredInvitados = invitados;
        } else {
            filteredInvitados = invitados.filter(guest => 
                guest.nombre.toLowerCase().includes(query) ||
                guest.titulo.toLowerCase().includes(query)
            );
        }
        renderGuests();
    }

    function renderGuests() {
        container.innerHTML = "";
        modalContainer.innerHTML = "";
        
        // Usar filteredInvitados para la paginación
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pagData = filteredInvitados.slice(start, end);

        if (pagData.length === 0) {
            container.innerHTML = `<p class="text-center text-secondary mt-5">No se encontraron invitados que coincidan con la búsqueda.</p>`;
            pagination.innerHTML = "";
            return;
        }

        pagData.forEach(guest => {
            const card = template.cloneNode(true);
            const modalId = `modalGuest${guest.id}`;
            card.id = "";
            card.style.display = "block";

            card.querySelector("img").src = guest.imagen;
            card.querySelector("img").alt = guest.nombre;
            card.querySelector("h5").textContent = guest.nombre;
            card.querySelector("p.card-text").textContent = guest.titulo;

            const modalButton = card.querySelector(".btn-secondary");
            modalButton.setAttribute("data-bs-toggle", "modal");
            modalButton.setAttribute("data-bs-target", `#${modalId}`);
            modalButton.textContent = "Ver más";

            const listenButton = card.querySelector(".btn-dark");
            listenButton.href = guest.episodio_link || "#";
            listenButton.target = "_blank";

            container.appendChild(card);

            const modalHTML = createModal(guest, modalId);
            modalContainer.innerHTML += modalHTML;
        });

        initializeCollapseEvents();
        renderPagination();
    }

    function createModal(guest, modalId) {
        // ... (La función createModal queda igual que la última vez, omitida para brevedad) ...
        const getIconClass = (tipo, icono) => {
            if (tipo === "empresa" && icono === "bi-code-slash") return "bi bi-code-slash fs-5";
            if (tipo === "empresa" && icono === "bi-building") return "bi bi-building fs-5";
            if (tipo === "empresa" && icono === "bi-award") return "bi bi-award fs-5";
            if (tipo === "osompress") return "bi bi-code-square fs-5";
            if (tipo === "academia") return "bi bi-mortarboard fs-5";
            if (tipo === "bluesky") return "bi bi-twitter-x fs-5";
            return `bi ${icono} fs-5`;
        };

        const socialLinksHTML = guest.links.map(link => {
            const iconClass = getIconClass(link.tipo, link.icono);

            return `
            <a href="${link.url}" class="btn btn-outline-info" target="_blank" aria-label="${link.tipo}" rel="noopener noreferrer">
                <i class="${iconClass}"></i>
            </a>
          `;
        }).join('');

        let bioContent = guest.bio_completa;
        let displayBio;
        let collapseToggle = '';

        const formattedBio = bioContent.replace(/\n/g, '<br>');

        if (formattedBio.length > BIO_COLLAPSE_THRESHOLD) {
            const shortBio = formattedBio.substring(0, formattedBio.lastIndexOf(' ', BIO_COLLAPSE_THRESHOLD)) + '...';
            const hiddenBio = formattedBio.substring(formattedBio.lastIndexOf(' ', BIO_COLLAPSE_THRESHOLD));

            displayBio = `
              <p>${shortBio}<span id="dots-${guest.id}"></span></p>
              <div class="collapse" id="more-${guest.id}">
                  <p style="margin-top: -1rem;">${hiddenBio}</p>
              </div>
          `;
            collapseToggle = `
              <button class="btn btn-primary btn-sm mt-2 collapse-btn" 
                      type="button" 
                      data-bs-toggle="collapse" 
                      data-bs-target="#more-${guest.id}" 
                      aria-expanded="false" 
                      aria-controls="more-${guest.id}" 
                      data-dots="#dots-${guest.id}">
                  Ver más
              </button>
          `;
        } else {
            displayBio = `<p>${formattedBio}</p>`;
        }

        return `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-dark text-white border-0">
                <h5 class="modal-title" id="${modalId}Label">${guest.nombre}</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body bg-dark text-light">
                <p><strong>${guest.titulo}</strong></p>
                <hr class="text-secondary">
                <p><strong>Bio:</strong></p>
                ${displayBio}
                ${collapseToggle}
                <hr class="text-secondary">
                <p><strong>${guest.episodio_numero || "Episodio pendiente"}:</strong> ${guest.episodio_titulo}</p>
              </div>
              <div class="modal-footer flex-column align-items-center bg-dark border-0">
                <div class="d-grid gap-2 col-10 col-md-8 mb-3">
                  <a href="${guest.episodio_link || "#"}" class="btn btn-accent btn-lg w-100" target="_blank" rel="noopener noreferrer"><i class="bi bi-headphones"></i> Escuchar Episodio</a>
                </div>
                <div class="d-flex flex-wrap gap-3 justify-content-center text-center">
                  ${socialLinksHTML}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function initializeCollapseEvents() {
        document.querySelectorAll('.collapse-btn').forEach(btn => {
            const targetId = btn.getAttribute('data-bs-target');
            const collapseElement = document.querySelector(targetId);
            const dotsElement = document.querySelector(btn.getAttribute('data-dots'));

            if (collapseElement) {
                collapseElement.addEventListener('show.bs.collapse', () => {
                    btn.textContent = "Ocultar";
                    if (dotsElement) dotsElement.style.display = "none";
                });
                collapseElement.addEventListener('hide.bs.collapse', () => {
                    btn.textContent = "Ver más";
                    if (dotsElement) dotsElement.style.display = "inline";
                });
            }
        });
    }

    function renderPagination() {
        // Usar filteredInvitados.length para calcular las páginas
        const totalPages = Math.ceil(filteredInvitados.length / perPage); 
        pagination.innerHTML = "";
        if (totalPages <= 1) return;

        const addPage = (text, disabled, active, onClick) => {
            const li = document.createElement("li");
            li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
            li.innerHTML = `<a class="page-link bg-dark text-white border-secondary d-flex justify-content-center align-items-center" href="#">${text}</a>`;
            if (!disabled) li.addEventListener("click", onClick);
            pagination.appendChild(li);
        };

        addPage("«", currentPage === 1, false, () => { currentPage--; renderGuests(); });
        for (let i = 1; i <= totalPages; i++) {
            addPage(i, false, i === currentPage, () => { currentPage = i; renderGuests(); });
        }
        addPage("»", currentPage === totalPages, false, () => { currentPage++; renderGuests(); });
    }

    // Escuchar cambios en el input de búsqueda
    searchInput.addEventListener("input", filterGuests);

    loadData();
});
