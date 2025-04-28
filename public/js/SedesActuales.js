document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "http://localhost:3000/auth/sedes";
    const tablaSedes = document.getElementById("tablaSedes");
    const sedesContainer = document.querySelector(".sedes-container"); // Asegúrate de que existe en tu HTML
  
    // Muestra mensajes al usuario
    function mostrarMensaje(mensaje, esError = false) {
      const mensajeElement = document.createElement("div");
      mensajeElement.className = esError ? "error-mensaje" : "info-mensaje";
      mensajeElement.textContent = mensaje;
  
      // Limpia mensajes anteriores
      const mensajeAnterior = sedesContainer.querySelector(
        ".error-mensaje, .info-mensaje"
      );
      if (mensajeAnterior) mensajeAnterior.remove();
  
      sedesContainer.prepend(mensajeElement);
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
  
    // Modifica cargarSedes para manejar mejor los errores
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
  
        mostrarSedes(data);
      } catch (error) {
        console.error("Error al cargar sedes:", error);
        mostrarMensaje(
          `Error al cargar datos: ${error.message}. Por favor recarga la página.`,
          true
        );
      }
    }
  
    // Renderiza las sedes en la tabla
    function mostrarSedes(sedes) {
      tablaSedes.innerHTML = sedes.map(crearFilaSede).join("");
      agregarEventListeners();
    }
  
    // Configura los eventos de los botones
    function agregarEventListeners() {
      tablaSedes.addEventListener("click", async (event) => {
        const target = event.target.closest("button"); // Maneja clicks en botones hijos
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
    }
  
    // Elimina una sede
    async function eliminarSede(id, boton) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData?.error || `Error al eliminar (HTTP ${response.status})`);
        }
  
        mostrarMensaje("Sede eliminada correctamente");
        boton.closest("tr").classList.add("fade-out");
  
        // Elimina la fila después de la animación
        setTimeout(() => {
          boton.closest("tr").remove();
        }, 300);
      } catch (error) {
        console.error("Error al eliminar sede:", error);
        mostrarMensaje(`Error al eliminar: ${error.message}`, true);
      }
    }
  
    // Inicia la carga
    cargarSedes();
  });