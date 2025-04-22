document.addEventListener("DOMContentLoaded", () => {
    const formularioCrearSede = document.getElementById("sedeForm"); // Usamos el id "sedeForm" del formulario

    formularioCrearSede.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nuevaSede = {
            nombre: document.getElementById("nombre").value,
            direccion: document.getElementById("direccion").value
        };

        try {
            const response = await fetch("http://localhost:3000/sedes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nuevaSede)
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                throw new Error(`Error al crear la sede: ${response.status} - ${errorDetails.error || 'Detalles no disponibles'}`);
            }

            alert("Sede creada con éxito.");
            window.location.href = "sedesActuales.html"; // Redireccionar al listado
        } catch (error) {
            console.error("Error al crear la sede:", error);
            alert(error.message);
        }
    });

    // Función para el botón "Volver"
    window.volver = function() {
        window.location.href = "sedes.html"; // O puedes usar window.history.back();
    };
});