document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("guests-container");
  const template = document.getElementById("guest-card-template");
  const pagination = document.getElementById("pagination");
  const modalContainer = document.getElementById("modals-container");

  let invitados = [];
  let currentPage = 1;
  const perPage = 9; // Se muestran 9 invitados por página

  async function loadData() {
    try {
      // Usar rutas relativas adecuadas
      const res = await fetch("./invitados.json");
      if (!res.ok) throw new Error("No se pudo cargar invitados.json");
      invitados = await res.json();
      
      // Ordenar por ID o número de episodio si está disponible (descendente)
      invitados.sort((a, b) => b.id - a.id); 
      
      renderGuests();
    } catch (err) {
      container.innerHTML = `<p class="text-danger text-center">Error cargando invitados: ${err}</p>`;
      console.error(err);
    }
  }

  function renderGuests() {
    container.innerHTML = "";
    modalContainer.innerHTML = "";
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pagData = invitados.slice(start, end);

    if (pagData.length === 0) {
      container.innerHTML = `<p class="text-center text-light">No hay invitados disponibles.</p>`;
      pagination.innerHTML = "";
      return;
    }

    pagData.forEach(guest => {
      // 1. Crear la Card (estilo episodio)
      const card = template.cloneNode(true);
      const modalId = `modalGuest${guest.id}`;
      card.id = "";
      card.style.display = "block"; 
      
      // Contenido de la Card
      card.querySelector("img").src = guest.imagen;
      card.querySelector("img").alt = guest.nombre;
      card.querySelector("h5").textContent = guest.nombre;
      card.querySelector("p.card-text").textContent = guest.titulo;
      
      // Configurar botón para abrir el modal
      const modalButton = card.querySelector(".btn-secondary");
      modalButton.setAttribute("data-bs-toggle", "modal");
      modalButton.setAttribute("data-bs-target", `#${modalId}`);
      modalButton.textContent = "Ver más";

      // Botón de Escuchar
      const listenButton = card.querySelector(".btn-dark");
      listenButton.href = guest.episodio_link || "#";

      container.appendChild(card);
      
      // 2. Crear el Modal
      const modalHTML = createModal(guest, modalId);
      modalContainer.innerHTML += modalHTML;
    });

    renderPagination();
  }
  
  function createModal(guest, modalId) {
      // Generar dinámicamente los botones de redes sociales
      const socialLinksHTML = guest.links.map(link => {
          // Usar clase de Bootstrap para el icono si es bi-algo, sino usar un logo si es específico (como 'osompress' o 'empresa')
          let iconClass = `bi ${link.icono} fs-5`;
          if (link.tipo === "osompress") {
             // Este icono no existe en bi, se puede usar un icono de código genérico o un div con una imagen si se cargara
             iconClass = "bi bi-code-square fs-5"; 
          } else if (link.tipo === "empresa") {
             iconClass = "bi bi-building fs-5";
          }
          
          return `
            <a href="${link.url}" class="btn btn-outline-info" target="_blank" aria-label="${link.tipo}" rel="noopener noreferrer">
                <i class="${iconClass}"></i>
            </a>
          `;
      }).join('');
      
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
                <p><strong>Bio:</strong> ${guest.bio_corta}</p>
                <p><strong>${guest.episodio_numero}:</strong> ${guest.episodio_titulo}</p>
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

  function renderPagination() {
    const totalPages = Math.ceil(invitados.length / perPage);
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const addPage = (text, disabled, active, onClick) => {
      const li = document.createElement("li");
      li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
      li.innerHTML = `<a class="page-link bg-dark text-white border-secondary" href="#">${text}</a>`;
      if (!disabled) li.addEventListener("click", onClick);
      pagination.appendChild(li);
    };

    addPage("«", currentPage === 1, false, () => { currentPage--; renderGuests(); });
    for (let i = 1; i <= totalPages; i++) {
      addPage(i, false, i === currentPage, () => { currentPage = i; renderGuests(); });
    }
    addPage("»", currentPage === totalPages, false, () => { currentPage++; renderGuests(); });
  }

  loadData();
});