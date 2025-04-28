document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    const formularioEditar = document.getElementById("formularioEditar");
    const nombreSedeInput = document.getElementById("nombre_sede");
    const direccionInput = document.getElementById("direccion");
    const errorNombre = document.getElementById("error-nombre_sede");
    const errorDireccion = document.getElementById("error-direccion");

    if (!id) {
        console.warn("ID de sede no proporcionado en la URL.");
        alert("ID de sede no proporcionado.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/auth/sedes/${id}`);
        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(`Error al obtener datos de la sede: ${response.status} - ${errorDetails.error || 'Detalles no disponibles'}`);
        }
        const sede = await response.json();

        nombreSedeInput.value = sede.nombre_sede;
        direccionInput.value = sede.direccion;

    } catch (error) {
        console.error("Error al cargar la sede:", error);
        alert(error.message || "No se pudo cargar la sede. Por favor, inténtalo de nuevo.");
    }

    // Evento para guardar cambios
    formularioEditar.addEventListener("submit", async (e) => {
        e.preventDefault();

        let isValid = true;

        // Validar el nombre
        if (nombreSedeInput.value.trim() === "") {
            mostrarError(errorNombre, "El nombre es obligatorio.");
            isValid = false;
        } else if (nombreSedeInput.value.trim().length > 100) {
            mostrarError(errorNombre, "El nombre no puede tener más de 100 caracteres.");
            isValid = false;
        } else {
            limpiarError(errorNombre);
        }

        // Validar la dirección
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
            const nuevaSede = {
                nombre: nombreSedeInput.value,
                direccion: direccionInput.value
            };

            try {
                const response = await fetch(`http://localhost:3000/auth/sedes/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(nuevaSede)
                });

                if (!response.ok) {
                    const errorDetails = await response.json();
                    throw new Error(`Error al actualizar la sede: ${response.status} - ${errorDetails.error || 'Detalles no disponibles'}`);
                }

                alert("Sede actualizada con éxito.");
                window.location.href = "sedesActuales.html"; // Redireccionar al listado

            } catch (error) {
                console.error("Error al guardar los cambios:", error);
                alert(error.message || "No se pudo actualizar la sede. Por favor, inténtalo de nuevo.");
            }
        }
    });

    function mostrarError(element, message) {
        element.textContent = message;
    }

    function limpiarError(element) {
        element.textContent = "";
    }

    // Botón volver
    document.getElementById("volver").addEventListener("click", () => {
        window.history.back(); // O usa: window.location.href = "sedes.html";
    });
});