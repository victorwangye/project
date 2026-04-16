document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("guests-container");
    const template = document.getElementById("guest-card-template");
    const pagination = document.getElementById("pagination");
    const modalContainer = document.getElementById("modals-container");

    let invitados = [];
    let currentPage = 1;
    const perPage = 9;

    async function loadData() {
        try {
            const res = await fetch("invitados.json");
            if (!res.ok) throw new Error("No se pudo cargar el JSON");
            const data = await res.json();
            
            // Mezcla aleatoria para que todos los invitados tengan la misma oportunidad
            invitados = data.sort(() => Math.random() - 0.5);
            
            renderGuests();
        } catch (err) {
            console.error("Error al cargar invitados:", err);
        }
    }

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
            const modalId = `modalGuest_${guest.id}`.replace(/\./g, '_');

            card.querySelector("img").src = guest.imagen;
            card.querySelector(".card-title").textContent = guest.nombre;
            card.querySelector(".card-text").textContent = guest.titulo;

            const listenBtn = card.querySelector(".btn-listen");
            if (!guest.episodio_link || guest.episodio_link === "#") {
                listenBtn.classList.add("disabled");
            } else {
                listenBtn.href = guest.episodio_link;
                listenBtn.target = "_blank";
            }

            const moreBtn = card.querySelector(".btn-more");
            moreBtn.setAttribute("data-bs-toggle", "modal");
            moreBtn.setAttribute("data-bs-target", `#${modalId}`);

            container.appendChild(card);
            renderModal(guest, modalId);
        });
        renderPagination();
    }

    function renderModal(guest, modalId) {
        const socialLinksHTML = guest.links.map(link => {
            const isImagePath = link.icono.includes('.') || link.icono.includes('/');
            const iconContent = isImagePath 
                ? `<img src="${link.icono}" style="width:22px; filter: brightness(0) invert(1);" alt="${link.tipo}">`
                : `<i class="bi ${link.icono}"></i>`;
            return `<a href="${link.url}" class="btn btn-outline-info d-inline-flex align-items-center justify-content-center" target="_blank" style="width:42px; height:42px; border-radius:50%;">${iconContent}</a>`;
        }).join(' ');

        const bioTexto = guest.bio_completa || guest.bio_corta || "";
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content bg-dark text-light border-secondary">
                        <div class="modal-header border-0">
                            <h5 class="modal-title fw-bold">${guest.nombre}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="fw-bold text-white mb-1">${guest.titulo}</p>
                            <hr class="border-secondary opacity-50">
                            <div class="bio-container mb-4">${bioTexto.replace(/\n/g, '<br>')}</div>
                            <div class="d-flex flex-wrap gap-3">${socialLinksHTML}</div>
                        </div>
                        <div class="modal-footer border-0">
                            <a href="${guest.episodio_link}" target="_blank" class="btn btn-primary w-100 ${(!guest.episodio_link || guest.episodio_link === "#") ? "disabled" : ""}" style="background-color: #2093cc; border: none; border-radius: 50px;">
                                <i class="bi bi-headphones me-2"></i> Escuchar Episodio
                            </a>
                        </div>
                    </div>
                </div>
            </div>`;
        modalContainer.insertAdjacentHTML('beforeend', modalHtml);
    }

    function renderPagination() {
        const totalPages = Math.ceil(invitados.length / perPage);
        if (!pagination || totalPages <= 1) return;
        pagination.innerHTML = "";

        const addPageItem = (text, enabled, onClick, active = false) => {
            const li = document.createElement("li");
            li.className = `page-item ${enabled ? "" : "disabled"} ${active ? "active" : ""}`;
            const a = document.createElement("a");
            a.className = "page-link"; a.href = "#"; a.innerHTML = text;
            a.onclick = (e) => { e.preventDefault(); if (enabled) onClick(); };
            li.appendChild(a);
            pagination.appendChild(li);
        };

        addPageItem("«", currentPage > 1, () => { currentPage--; renderGuests(); window.scrollTo(0,0); });
        for (let i = 1; i <= totalPages; i++) {
            addPageItem(i, true, () => { currentPage = i; renderGuests(); window.scrollTo(0,0); }, i === currentPage);
        }
        addPageItem("»", currentPage < totalPages, () => { currentPage++; renderGuests(); window.scrollTo(0,0); });
    }

    loadData();
});
