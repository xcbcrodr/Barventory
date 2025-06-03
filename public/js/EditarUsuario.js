document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOMContentLoaded ejecutado");
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");

  console.log("ID de usuario:", userId);

  if (userId) {
    const API_URL_USUARIO = `http://localhost:3000/auth/usuarios/${userId}`;
    const API_URL_ROLES = "http://localhost:3000/auth/usuarios/roles";
    const API_URL_SEDES = "http://localhost:3000/auth/usuarios/sedes";

    const nombreInput = document.getElementById("nombre");
    const identificacionInput = document.getElementById("identification");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const rolSelect = document.getElementById("rol");
    const sedeSelect = document.getElementById("sede");
    const botonActualizar = document.getElementById("btnActualizarUsuario");

    async function cargarDatosUsuario() {
      try {
        const token = localStorage.getItem("token");
        console.log("Token:", token);
        console.log("URL de usuario:", API_URL_USUARIO); 
        const response = await fetch(API_URL_USUARIO, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Estado de la respuesta:", response.status); 

        const data = await response.json(); 
        console.log("Datos recibidos:", data);

        if (response.ok && data.success && data.data) {
          nombreInput.value = data.data.nombre;
          identificacionInput.value = data.data.identificacion;
          emailInput.value = data.data.email;
          cargarRoles(data.data.idrol);
          cargarSedes(data.data.idsede);
        } else {
          const errorMessage =
            data?.error ||
            `Error al cargar datos del usuario: ${response.status}`;
          throw new Error(
            "Formato de respuesta de datos de usuario inválido: " + errorMessage
          );
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
        const errorMessageElement = document.getElementById("error-message");
        if (errorMessageElement) {
          errorMessageElement.textContent = error.message;
          errorMessageElement.style.display = "block";
        }
      }
    }

    async function cargarRoles(rolSeleccionadoId) {
      try {
        const response = await fetch(API_URL_ROLES, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData?.error || `Error al cargar roles: ${response.status}`
          );
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Limpiar las opciones existentes
          rolSelect.innerHTML =
            '<option value="" disabled selected>Seleccionar rol</option>';
          data.data.forEach((rol) => {
            const option = document.createElement("option");
            option.value = rol.id_rol;
            option.textContent = rol.nombre_rol;
            option.selected = rol.id_rol === rolSeleccionadoId;
            rolSelect.appendChild(option);
          });
        } else {
          console.log("No se encontró ID de usuario en la URL.");
          alert("ID de usuario no proporcionado.");
          window.location.href = "../admin/ModificacionUsuario.html";
          return;
        }
      } catch (error) {
        console.error("Error al cargar roles:", error);
        const errorMessageElement = document.getElementById("errorMessage");
        if (errorMessageElement) {
          errorMessageElement.textContent = error.message;
          errorMessageElement.style.display = "block";
        }
      }
    }

    async function cargarSedes(sedeSeleccionadaId) {
      try {
        const response = await fetch(API_URL_SEDES, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData?.error || `Error al cargar sedes: ${response.status}`
          );
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Limpiar las opciones existentes
          sedeSelect.innerHTML =
            '<option value="" disabled selected>Seleccionar sede</option>';
          data.data.forEach((sede) => {
            const option = document.createElement("option");
            option.value = sede.id_sede;
            option.textContent = sede.nombre_sede;
            option.selected = sede.id_sede === sedeSeleccionadaId;
            sedeSelect.appendChild(option);
          });
        } else {
          throw new Error("Formato de respuesta de sedes inválido");
        }
      } catch (error) {
        console.error("Error al cargar sedes:", error);
        const errorMessageElement = document.getElementById("errorMessage");
        if (errorMessageElement) {
          errorMessageElement.textContent = error.message;
          errorMessageElement.style.display = "block";
        }
      }
    }

    // Cargar los datos del usuario al cargar la página
    cargarDatosUsuario();

    // Lógica para el botón de actualizar usuario
    if (botonActualizar) {
      botonActualizar.addEventListener("click", async (event) => {
        event.preventDefault(); // Evita la recarga de la página
    
        const nombre = nombreInput.value;
        const identificacion = identificacionInput.value;
        const email = emailInput.value;
        const password = passwordInput.value; // Considera si siempre envías la contraseña
        const rolId = rolSelect.value;
        const sedeId = sedeSelect.value;
    
        const datosActualizados = {
            nombre: nombre,
            identificacion: identificacion,
            email: email,
            rol: rolId,
            sede: sedeId,
            ...(password && { contrasenia: password }), // Incluye contraseña solo si se modificó
        };
    
        const API_URL_ACTUALIZAR = `http://localhost:3000/auth/usuarios/${userId}`;
        const token = localStorage.getItem("token");
    
        try {
            const response = await fetch(API_URL_ACTUALIZAR, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(datosActualizados),
            });
    
            const data = await response.json();
    
            if (response.ok && data.success) {
                console.log("Usuario actualizado correctamente:", data);
                mostrarMensaje("Usuario actualizado correctamente"); // Función para mostrar mensaje
                setTimeout(() => {
                    window.location.href = "ModificacionUsuario.html"; // Redirigir después de un breve tiempo
                }, 1500); // Espera 1.5 segundos
            } else {
                console.error("Error al actualizar usuario:", data?.error || `HTTP error: ${response.status}`);
                mostrarMensaje(`Error al actualizar: ${data?.error || `HTTP error: ${response.status}`}`, true); // Mostrar mensaje de error
            }
    
        } catch (error) {
            console.error("Error al enviar la actualización:", error);
            mostrarMensaje(`Error al enviar la actualización: ${error.message}`, true); // Mostrar mensaje de error
        }
    });
    
    // Asegúrate de tener una función mostrarMensaje en EditarUsuario.js
    function mostrarMensaje(mensaje, esError = false) {
        const mensajeElement = document.getElementById("mensaje-edicion"); // Asegúrate de tener este elemento en tu HTML
        if (mensajeElement) {
            mensajeElement.textContent = mensaje;
            mensajeElement.className = esError ? "error-mensaje fade-in" : "info-mensaje fade-in";
            mensajeElement.style.display = "block";
            setTimeout(() => {
                mensajeElement.style.display = "none";
            }, 3000); // Ocultar el mensaje después de 3 segundos
        } else {
            alert(mensaje); // Fallback si no encuentras el elemento para el mensaje
        }
    }
    }
  }
});
