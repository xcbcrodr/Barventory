// NuevoUsuario.js

document.addEventListener("DOMContentLoaded", async function () {
    const API_URL_ROLES = "http://localhost:3000/auth/usuarios/roles";
    const API_URL_SEDES = "http://localhost:3000/auth/usuarios/sedes";
    const API_URL_USUARIOS = "http://localhost:3000/auth/usuarios/";
  
    const rolSelect = document.getElementById("rol");
    const sedeSelect = document.getElementById("sede");
    const userForm = document.getElementById("userForm");
    const errorMessage = document.getElementById("errorMessage");
    const btnCrearUsuario = document.getElementById("btnCrearUsuario");
  
    // Función para cargar los roles desde la API
    async function cargarRoles() {
      try {
        const response = await fetch(API_URL_ROLES, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData?.error || `Error al cargar roles: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          data.data.forEach((rol) => {
            const option = document.createElement("option");
            option.value = rol.id_rol; // Usar el id_rol como valor
            option.textContent = rol.nombre_rol; // Mostrar el nombre del rol
            rolSelect.appendChild(option);
          });
        } else {
          throw new Error("Formato de respuesta de roles inválido");
        }
      } catch (error) {
        console.error("Error al cargar roles:", error);
        mostrarMensaje(error.message, true);
      }
    }
  
    // Función para cargar las sedes desde la API
    async function cargarSedes() {
      try {
        const response = await fetch(API_URL_SEDES, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData?.error || `Error al cargar sedes: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          data.data.forEach((sede) => {
            const option = document.createElement("option");
            option.value = sede.id_sede; // Usar el id_sede como valor
            option.textContent = sede.nombre_sede; // Mostrar el nombre de la sede
            sedeSelect.appendChild(option);
          });
        } else {
          throw new Error("Formato de respuesta de sedes inválido");
        }
      } catch (error) {
        console.error("Error al cargar sedes:", error);
        mostrarMensaje(error.message, true);
      }
    }
  
    // Función para mostrar mensajes al usuario
    function mostrarMensaje(mensaje, esError = false) {
      errorMessage.textContent = mensaje;
      errorMessage.style.color = esError ? "#e74c3c" : "#2ecc71";
      errorMessage.style.display = "block";
      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 3000);
    }
  
    // Evento para el botón de crear usuario
    btnCrearUsuario.addEventListener("click", async (event) => {
      event.preventDefault();
  
      const nombre = document.getElementById("name-user").value.trim();
      const identificacion = document.getElementById("identification").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const rolId = rolSelect.value;
      const sedeId = sedeSelect.value;
  
      if (!nombre || !identificacion || !email || !password || !rolId || !sedeId) {
        mostrarMensaje("Todos los campos son obligatorios", true);
        return;
      }
  
      try {
        const response = await fetch(API_URL_USUARIOS, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            nombre: nombre,
            identificacion: identificacion,
            email: email,
            contrasenia: password,
            rol: rolId, // Enviar el ID del rol seleccionado
            sede: sedeId, // Enviar el ID de la sede seleccionada
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData?.error || `Error al crear usuario: ${response.status}`);
        }
  
        const data = await response.json();
        mostrarMensaje("Usuario creado correctamente", false);
        userForm.reset();
        setTimeout(() => {
          window.location.href = "../admin/ModificacionUsuario.html";
        }, 2000);
      } catch (error) {
        console.error("Error al crear usuario:", error);
        mostrarMensaje(error.message, true);
      }
    });
  
    // Cargar los roles y las sedes al cargar la página
    cargarRoles();
    cargarSedes();
  });