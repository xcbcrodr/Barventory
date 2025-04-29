document.addEventListener("DOMContentLoaded", function () {
  const API_URL = "http://localhost:3000/auth/sedes";
  const tablaSedes = document.getElementById("tablaSedes");
  const sedesContainer = document.querySelector(".sedes-container");
  const buscarSedeInput = document.getElementById("buscarSede"); // Obtener el input de búsqueda
  let listaDeSedes = []; // Variable para almacenar todas las sedes cargadas

  // Muestra mensajes al usuario (sin cambios)
  function mostrarMensaje(mensaje, esError = false) {
    const mensajeElement = document.createElement("div");
    mensajeElement.className = esError ? "error-mensaje fade-in" : "info-mensaje fade-in"; // Añadimos fade-in

    mensajeElement.textContent = mensaje;
    mensajeElement.style.position = "absolute"; // Para que no afecte el flujo normal
    mensajeElement.style.top = "20px";        // Ajusta la posición vertical
    mensajeElement.style.left = "50%";       // Centra horizontalmente
    mensajeElement.style.transform = "translateX(-50%)";
    mensajeElement.style.zIndex = "10";       // Asegura que esté por encima de otros elementos
    mensajeElement.style.opacity = "0";       // Inicialmente invisible
    mensajeElement.style.transition = "opacity 0.3s ease-in-out"; // Transición para el desvanecido

    sedesContainer.appendChild(mensajeElement);

    // Fuerza un reflow para activar la transición
    setTimeout(() => {
        mensajeElement.style.opacity = "1";
    }, 10);

    // Desvanecer y eliminar después de un tiempo
    setTimeout(() => {
        mensajeElement.style.opacity = "0";
        setTimeout(() => {
            sedesContainer.removeChild(mensajeElement);
        }, 300); // Duración de la transición
    }, 3000); // Tiempo que el mensaje estará visible
}

  function crearFilaSede(sede) {
      return `
          <tr id="sede-${sede.id}">
              <td>${sede.nombre}</td>
              <td>${sede.direccion || "Dirección no disponible"}</td>
              <td>
                  <button class="btn-editar" data-id="${sede.id}" aria-label="Editar sede ${sede.nombre}">✏️ Editar</button>
                  <button class="btn-eliminar" data-id="${sede.id}" aria-label="Eliminar sede ${sede.nombre}">🗑️ Eliminar</button>
              </td>
          </tr>
      `;
  }

  async function cargarSedes() {
      try {
          const response = await fetch(API_URL, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData?.error || `Error HTTP: ${response.status}`);
          }

          const data = await response.json();
          console.log("Datos recibidos:", data);

          if (!Array.isArray(data)) {
              throw new Error("Formato de respuesta inválido");
          }

          listaDeSedes = data; // Almacenar todas las sedes cargadas
          mostrarSedes(listaDeSedes); // Mostrar la lista completa inicialmente

      } catch (error) {
          console.error("Error al cargar sedes:", error);
          mostrarMensaje(
              `Error al cargar datos: ${error.message}. Por favor recarga la página.`,
              true
          );
      }
  }

  // Renderiza las sedes en la tabla (ahora puede recibir un array filtrado)
  function mostrarSedes(sedes) {
      tablaSedes.innerHTML = sedes.map(crearFilaSede).join("");
      agregarEventListeners();
  }

  function agregarEventListeners() {
      tablaSedes.addEventListener("click", async (event) => {
          const target = event.target.closest("button");
          if (!target || !target.dataset.id) return;

          const idSede = target.dataset.id;

          if (target.classList.contains("btn-editar")) {
              window.location.href = `EditarSede.html?id=${idSede}`;
          } else if (target.classList.contains("btn-eliminar")) {
              if (confirm("¿Estás seguro de eliminar esta sede?")) {
                  await eliminarSede(idSede, target);
              }
          }
      });

      // Event listener para el campo de búsqueda
      buscarSedeInput.addEventListener("input", () => {
          const terminoBusqueda = buscarSedeInput.value.toLowerCase().trim();
          const sedesFiltradas = listaDeSedes.filter(sede =>
              sede.nombre.toLowerCase().includes(terminoBusqueda)
          );
          mostrarSedes(sedesFiltradas);
      });
  }

  async function eliminarSede(id, boton) {
      const API_URL = "http://localhost:3000/auth/sedes";
      try {
          const token = localStorage.getItem("token");
          if (!token) {
              throw new Error("No se encontró token de autenticación");
          }

          const response = await fetch(`${API_URL}/${id}`, {
              method: "DELETE",
              headers: {
                  Authorization: `Bearer ${token}`,
              },
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Error al eliminar (HTTP ${response.status})`);
          }

          mostrarMensaje("Sede eliminada correctamente");
          boton.closest("tr").classList.add("fade-out");
          setTimeout(() => {
              boton.closest("tr").remove();
          }, 300);

          // Actualizar la lista de sedes después de eliminar
          listaDeSedes = listaDeSedes.filter(sede => sede.id !== parseInt(id));
          // No es necesario llamar a mostrarSedes aquí, ya que la fila se eliminó visualmente

      } catch (error) {
          console.error("Error al eliminar sede:", error);
          mostrarMensaje(`Error al eliminar: ${error.message}`, true);
      }
  }

  // Inicia la carga
  cargarSedes();
});