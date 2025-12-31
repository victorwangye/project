document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("guests-container");
    const template = document.getElementById("guest-card-template");
    const pagination = document.getElementById("pagination");
    const modalContainer = document.getElementById("modals-container");

    let invitados = [];
    let filteredInvitados = []; 
    let currentPage = 1;
    const perPage = 9; 
    const BIO_COLLAPSE_THRESHOLD = 300;

    // Función de ordenamiento
    function customSort(a, b) {
        const isALetter = /[a-zA-Z]/.test(a.id);
        const isBLetter = /[a-zA-Z]/.test(b.id);
        const idA = String(a.id);
        const idB = String(b.id);
        if (isALetter && !isBLetter) return -1;
        if (!isALetter && isBLetter) return 1;
        if (isALetter && isBLetter) {
            return idA.localeCompare(idB);
        } else {
            return Number(idA) - Number(idB);
        }
    }

    async function loadData() {
        try {
            const res = await fetch("invitados.json");
            if (!res.ok) throw new Error("No se pudo cargar invitados.json");
            invitados = await res.json();
            invitados.sort(customSort); 
            filteredInvitados = invitados;
            renderGuests();
        } catch (err) {
            if (container) {
                container.innerHTML = `<p class="text-danger text-center">Error cargando invitados: ${err.message}</p>`;
            }
            console.error(err);
        }
    }

    function renderGuests() {
        if (!container || !template) return;

        container.innerHTML = "";
        modalContainer.innerHTML = "";
        
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pagData = filteredInvitados.slice(start, end);

        if (pagData.length === 0) {
            container.innerHTML = `<p class="text-center text-secondary mt-5">No hay invitados disponibles.</p>`;
            pagination.innerHTML = "";
            return;
        }

        pagData.forEach(guest => {
            const card = template.cloneNode(true);
            const modalId = `modalGuest${String(guest.id).replace(/\./g, '_')}`; 
            card.id = "";
            card.style.display = "block";

            // Imagen
            const img = card.querySelector("img");
            if (img) {
                img.src = guest.imagen;
                img.alt = guest.nombre;
            }

            // Nombre y Título
            const title = card.querySelector(".card-title");
            if (title) title.textContent = guest.nombre;
            
            const text = card.querySelector(".card-text");
            if (text) text.textContent = guest.titulo;

            // Botón de Modal (Corregido para buscar por clase genérica o tipo)
            // Buscamos el botón que dice "Ver más" o el segundo botón del grupo
            const modalButton = card.querySelector("button.btn-accent") || card.querySelector("button");
            if (modalButton) {
                modalButton.setAttribute("data-bs-toggle", "modal");
                modalButton.setAttribute("data-bs-target", `#${modalId}`);
                modalButton.textContent = "Ver más";
            }

            // Botón de Escuchar
            const listenButton = card.querySelector("a.btn");
            if (listenButton) {
                listenButton.href = guest.episodio_link || "#"; 
                listenButton.target = "_blank";
            }

            container.appendChild(card);

            // Crear el modal
            const modalHTML = createModal(guest, modalId);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = modalHTML;
            modalContainer.appendChild(wrapper.firstChild);
        });

        initializeCollapseEvents();
        renderPagination();
    }

    function createModal(guest, modalId) {
        const getIconClass = (tipo, icono) => {
            if (tipo === "twitter" || tipo === "bluesky") return "bi bi-twitter-x";
            return `bi ${icono}`;
        };

        const socialLinksHTML = guest.links.map(link => {
            let contentHTML = `<i class="${getIconClass(link.tipo, link.icono)} fs-5"></i>`;
            if (link.tipo === "tekdi_logo") {
                contentHTML = `<img src="${link.icono}" alt="Logo" style="width: 24px; filter: invert(0.8); vertical-align: middle;">`;
            }

            return `
            <a href="${link.url}" class="btn btn-outline-info" target="_blank" rel="noopener noreferrer">
                ${contentHTML}
            </a>`;
        }).join('');

        const bioContent = guest.bio_completa || guest.bio_corta || "";
        const formattedBio = bioContent.replace(/\n/g, '<br>');
        let displayBio = `<p>${formattedBio}</p>`;
        let collapseToggle = '';

        if (formattedBio.length > BIO_COLLAPSE_THRESHOLD) {
            const shortBio = formattedBio.substring(0, BIO_COLLAPSE_THRESHOLD) + '...';
            displayBio = `
                <p id="short-bio-${guest.id}">${shortBio}</p>
                <div class="collapse" id="more-${guest.id}">
                    <p>${formattedBio}</p>
                </div>`;
            collapseToggle = `
                <button class="btn btn-primary btn-sm collapse-btn" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#more-${guest.id}" 
                        data-short="#short-bio-${guest.id}">
                    Ver más
                </button>`;
        }

        return `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-dark text-light border-secondary">
              <div class="modal-header border-0">
                <h5 class="modal-title text-info">${guest.nombre}</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <p class="fw-bold">${guest.titulo}</p>
                <hr class="border-secondary">
                ${displayBio}
                ${collapseToggle}
                <hr class="border-secondary">
                <p><strong>${guest.episodio_numero || "Episodio"}:</strong> ${guest.episodio_titulo}</p>
              </div>
              <div class="modal-footer flex-column border-0">
                <a href="${guest.episodio_link || "#"}" class="btn btn-accent w-100 mb-3" target="_blank">
                    <i class="bi bi-headphones"></i> Escuchar Episodio
                </a>
                <div class="d-flex gap-2">
                  ${socialLinksHTML}
                </div>
              </div>
            </div>
          </div>
        </div>`;
    }

    function initializeCollapseEvents() {
        document.querySelectorAll('.collapse-btn').forEach(btn => {
            const target = document.querySelector(btn.getAttribute('data-bs-target'));
            const shortBio = document.querySelector(btn.getAttribute('data-short'));
            if (target) {
                target.addEventListener('show.bs.collapse', () => {
                    btn.textContent = "Ocultar";
                    if (shortBio) shortBio.style.display = "none";
                });
                target.addEventListener('hide.bs.collapse', () => {
                    btn.textContent = "Ver más";
                    if (shortBio) shortBio.style.display = "block";
                });
            }
        });
    }

    function renderPagination() {
        const totalPages = Math.ceil(filteredInvitados.length / perPage);
        if (!pagination) return;
        pagination.innerHTML = "";
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement("li");
            li.className = `page-item ${i === currentPage ? "active" : ""}`;
            li.innerHTML = `<a class="page-link bg-dark text-white border-secondary" href="#">${i}</a>`;
            li.addEventListener("click", (e) => {
                e.preventDefault();
                currentPage = i;
                renderGuests();
                window.scrollTo(0, 0);
            });
            pagination.appendChild(li);
        }
    }

    loadData();
});
