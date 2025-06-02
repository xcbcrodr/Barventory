document.addEventListener("DOMContentLoaded", function () {
  const API_URL_USUARIOS = "http://localhost:3000/auth/usuarios/";
  const API_URL_ROLES = "http://localhost:3000/auth/usuarios/roles";
  const API_URL_SEDES = "http://localhost:3000/auth/usuarios/sedes";
  const tablaUsuarios = document.getElementById("tablaUsuario");
  const usuariosContainer = document.querySelector(".usuarios-container");
  let listaDeUsuarios = [];

  function mostrarMensaje(mensaje, esError = false) {
      const mensajeElement = document.createElement("div");
      mensajeElement.className = esError ? "error-mensaje fade-in" : "info-mensaje fade-in";
      mensajeElement.textContent = mensaje;
      mensajeElement.style.position = "absolute";
      mensajeElement.style.top = "20px";
      mensajeElement.style.left = "50%";
      mensajeElement.style.transform = "translateX(-50%)";
      mensajeElement.style.zIndex = "10";
      mensajeElement.style.opacity = "0";
      mensajeElement.style.transition = "opacity 0.3s ease-in-out";

      usuariosContainer.appendChild(mensajeElement);
      setTimeout(() => {
          mensajeElement.style.opacity = "1";
      }, 10);
      setTimeout(() => {
          mensajeElement.style.opacity = "0";
          setTimeout(() => {
              usuariosContainer.removeChild(mensajeElement);
          }, 300);
      }, 3000);
  }

  function crearFilaUsuario(usuario) {
      return `
          <tr id="usuario-${usuario.id}">
              <td>${usuario.nombre}</td>
              <td>${usuario.rol}</td>
              <td>${usuario.sede}</td>
              <td>
                  <button class="btn-editar" data-id="${usuario.id}" aria-label="Editar usuario ${usuario.nombre}"
                          onclick="window.location.href='EditarUsuario.html?id=${usuario.id}'">✏️ Editar</button>
                  <button class="btn-eliminar" data-id="${usuario.id}" aria-label="Eliminar usuario ${usuario.nombre}">🗑️ Eliminar</button>
              </td>
          </tr>
      `;
  }

  async function cargarUsuarios() {
      try {
          const response = await fetch(API_URL_USUARIOS, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData?.error || `Error HTTP: ${response.status}`);
          }

          const responseData = await response.json();
          console.log("Datos de usuarios recibidos:", responseData);

          if (!responseData.success || !Array.isArray(responseData.data)) {
              throw new Error("Formato de respuesta de usuarios inválido");
          }

          listaDeUsuarios = responseData.data;
          mostrarUsuarios(listaDeUsuarios);
          // agregarEventListeners se llama en mostrarUsuarios después de la primera carga
      } catch (error) {
          console.error("Error al cargar usuarios:", error);
          mostrarMensaje(
              `Error al cargar usuarios: ${error.message}. Por favor recarga la página.`,
              true
          );
      }
  }

  function mostrarUsuarios(usuarios) {
      tablaUsuarios.innerHTML = usuarios.map(crearFilaUsuario).join("");
      // Adjuntar listeners solo si no se han adjuntado antes
      if (!tablaUsuarios.dataset.listenersAttached) {
          agregarEventListeners();
          tablaUsuarios.dataset.listenersAttached = true;
      }
  }

  function agregarEventListeners() {
    tablaUsuarios.addEventListener("click", async (event) => {
        const target = event.target.closest("button");
        if (!target || !target.dataset.id) return;
        const idUsuario = target.dataset.id;
        if (target.classList.contains("btn-editar")) {
            window.location.href = `EditarUsuario.html?id=${idUsuario}`;
        } else if (target.classList.contains("btn-eliminar")) {
            if (confirm("¿Estás seguro de eliminar este usuario?")) {
                await eliminarUsuario(idUsuario, target);
            }
        }
    });

    // Obtener la referencia al input de búsqueda
    const buscarUsuarioInput = document.getElementById("buscarUsuario");

    // Agregar el event listener para el input de búsqueda
    buscarUsuarioInput.addEventListener("input", () => {
        const terminoBusqueda = buscarUsuarioInput.value.toLowerCase().trim();
        const usuariosFiltrados = listaDeUsuarios.filter(
            (usuario) =>
                usuario.nombre.toLowerCase().includes(terminoBusqueda) ||
                usuario.rol.toLowerCase().includes(terminoBusqueda) ||
                usuario.sede.toLowerCase().includes(terminoBusqueda)
        );
        mostrarUsuarios(usuariosFiltrados);
    });
}

  async function eliminarUsuario(id, boton) {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("No se encontró token de autenticación");
        }

        // Construye la URL de forma segura, asegurándote de que solo haya una barra entre la base y el ID
        const url = `${API_URL_USUARIOS.replace(/\/$/, "")}/${id}`;

        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("Respuesta completa del fetch:", response);

        const responseText = await response.text();
        console.log("Cuerpo de la respuesta como texto:", responseText);

        try {
            const responseData = JSON.parse(responseText);
            console.log("Respuesta parseada como JSON:", responseData);

            if (!response.ok || !responseData.success) {
                throw new Error(responseData?.error || `Error al eliminar usuario (HTTP ${response.status})`);
            }

            mostrarMensaje("Usuario eliminado correctamente");
            boton.closest("tr").classList.add("fade-out");
            setTimeout(() => {
                boton.closest("tr").remove();
            }, 300);

            listaDeUsuarios = listaDeUsuarios.filter(
                (usuario) => usuario.id !== parseInt(id)
            );

        } catch (jsonError) {
            console.error("Error al parsear la respuesta JSON:", jsonError);
            console.error("Texto de la respuesta que falló el parseo:", responseText);
            mostrarMensaje(`Error al eliminar: Respuesta del servidor inválida`, true);
        }

    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        mostrarMensaje(`Error al eliminar: ${error.message}`, true);
    }
}

  cargarUsuarios();
});