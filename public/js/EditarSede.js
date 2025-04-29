document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    const formularioEditar = document.getElementById("formularioEditar");
    const nombreSedeInput = document.getElementById("nombre"); // Cambiado a "nombre"
    const direccionInput = document.getElementById("direccion");
    const btnActualizarSede = document.getElementById("btnActualizarSede");
    const errorNombre = document.getElementById("error-nombre"); // Cambiado a "error-nombre"
    const errorDireccion = document.getElementById("error-direccion");

    if (!id) {
        alert("ID de sede no proporcionado.");
        window.location.href = "../admin/SedesActuales.html";
        return;
    }

    // Cargar datos de la sede
    const cargarSede = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No se encontró token de autenticación");
            }

            const response = await fetch(`http://localhost:3000/auth/sedes/${id}`, { 
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al obtener sede");
            }

            const { data: sede } = await response.json();

            nombreSedeInput.value = sede.nombre_sede || sede.nombre;
            direccionInput.value = sede.direccion;

        } catch (error) {
            console.error("Error al cargar sede:", error);
            alert(`Error: ${error.message}`);
            window.location.href = "../admin/SedesActuales.html";
        }
    };

    // Manejador para actualizar
    btnActualizarSede.addEventListener("click", async (e) => {
        e.preventDefault();

        let isValid = true;

        // Validaciones
        if (nombreSedeInput.value.trim() === "") {
            mostrarError(errorNombre, "El nombre es obligatorio.");
            isValid = false;
        } else if (nombreSedeInput.value.trim().length > 100) {
            mostrarError(errorNombre, "El nombre no puede tener más de 100 caracteres.");
            isValid = false;
        } else {
            limpiarError(errorNombre);
        }

        if (direccionInput.value.trim() === "") {
            mostrarError(errorDireccion, "La dirección es obligatoria.");
            isValid = false;
        } else if (direccionInput.value.trim().length > 255) {
            mostrarError(errorDireccion, "La dirección no puede tener más de 255 caracteres.");
            isValid = false;
        } else {
            limpiarError(errorDireccion);
        }

        if (isValid) {
            const sedeActualizada = {
                nombre_sede: nombreSedeInput.value.trim(), // Asegúrate que coincida con el backend
                direccion: direccionInput.value.trim()
            };

            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("No se encontró token de autenticación");
                }

                const response = await fetch(`http://localhost:3000/auth/sedes/${id}`, { 
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(sedeActualizada)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Error al actualizar sede");
                }

                alert("Sede actualizada con éxito!");
                window.location.href = "../admin/SedesActuales.html";

            } catch (error) {
                console.error("Error al actualizar sede:", error);
                alert(`Error: ${error.message}`);
            }
        }
    });

    // Funciones auxiliares
    function mostrarError(element, message) {
        element.textContent = message;
        element.style.display = "block";
    }

    function limpiarError(element) {
        element.textContent = "";
        element.style.display = "none";
    }

    // Cargar datos al iniciar
    cargarSede();
});