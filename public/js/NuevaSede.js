document.addEventListener("DOMContentLoaded", () => {
    const nuevaSedeForm = document.getElementById("sedeForm"); // ID del formulario
    const nombreInput = document.getElementById("nombre"); // Cambiado a "nombre"
    const direccionInput = document.getElementById("direccion");
    const btnCrearSede = document.getElementById("btnCrearSede");
    const errorNombre = document.getElementById("error-nombre"); // Cambiado a "error-nombre"
    const errorDireccion = document.getElementById("error-direccion");
    const API_URL = "http://localhost:3000/auth/sedes";

    function mostrarError(element, message) {
        element.textContent = message;
        element.style.display = "block";
    }

    function limpiarError(element) {
        element.textContent = "";
        element.style.display = "none";
    }

    btnCrearSede.addEventListener("click", async (e) => {
        e.preventDefault();

        let isValid = true;

        if (nombreInput.value.trim() === "") {
            mostrarError(errorNombre, "El nombre es obligatorio.");
            isValid = false;
        } else if (nombreInput.value.trim().length > 100) {
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
            const nuevaSede = {
                nombre_sede: nombreInput.value.trim(),
                direccion: direccionInput.value.trim(),
            };

            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("No se encontró token de autenticación");
                }

                console.log("Token enviado:", token);

                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(nuevaSede),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Error al crear la sede");
                }

                alert("Sede creada con éxito!");
                window.location.href = "SedesActuales.html";

            } catch (error) {
                console.error("Error al crear sede:", error);
                alert(`Error: ${error.message}`);
            }
        }
    });
});