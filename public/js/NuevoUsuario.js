document.addEventListener("DOMContentLoaded", () => {
    const formularioCrearUsuario = document.getElementById("usuarioForm");
    const nombreInput = document.getElementById("nombre");
    const identificacionInput = document.getElementById("identificacion");
    const contrasenaInput = document.getElementById("contrasenia");
    /*const errorNombre = document.getElementById("error-nombre");
    const errorDireccion = document.getElementById("error-direccion");*/

    formularioCrearUsuario.addEventListener("submit", async (e) => {
        e.preventDefault();

        let isValid = true;

        // Validar el nombre
        if (nombreInput.value.trim() === "") {
            mostrarError(errorNombre, "El nombre es obligatorio.");
            isValid = false;
        } else if (nombreInput.value.trim().length > 100) {
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
                nombre: nombreInput.value,
                direccion: direccionInput.value
            };

            try {
                const response = await fetch("http://localhost:3000/auth/usuarios", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(nuevoUsuario)
                });

                if (!response.ok) {
                    const errorDetails = await response.json();
                    throw new Error(`Error al crear la sede: ${response.status} - ${errorDetails.error || 'Detalles no disponibles'}`);
                }

                alert("Usuario creada con éxito.");
                window.location.href = "ModificacionUsuario.html"; // Redireccionar al listado
            } catch (error) {
                console.error("Error al crear la sede:", error);
                alert(error.message);
            }
        }
    });

    function mostrarError(element, message) {
        element.textContent = message;
    }

    function limpiarError(element) {
        element.textContent = "";
    }

    // Función para el botón "Volver" pendiente comprobar funcionalidad
    window.volver = function() {
        window.location.href = "usuarios.html"; // O puedes usar window.history.back();
    };
});