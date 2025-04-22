document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "http://localhost:3000/auth/sedes";
    const tablaSedes = document.getElementById("tablaSedes");
    const sedesContainer = document.querySelector('.sedes-container');

    function mostrarMensaje(mensaje, esError = false) {
        const mensajeElement = document.createElement('div');
        mensajeElement.className = esError ? 'error-mensaje' : 'info-mensaje';
        mensajeElement.textContent = mensaje;
        const mensajeAnterior = sedesContainer.querySelector('.error-mensaje, .info-mensaje');
        if (mensajeAnterior) mensajeAnterior.remove();
        sedesContainer.prepend(mensajeElement);
    }

    function crearFilaSede(sede) {
        return `
            <tr id="sede-${sede.id}">
                <td>${sede.nombre}</td>
                <td>${sede.direccion || 'Sin dirección' }</td>
                <td>
                    <button class="btn-editar" data-id="${sede.id}">✏️ Editar</button>
                    <button class="btn-eliminar" data-id="${sede.id}">🗑️ Eliminar</button>
                </td>
            </tr>
        `;
    }

    async function cargarSedes() {
        //mostrarMensaje("Cargando sedes...", false);
        try {
            const response = await fetch(API_URL, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const sedes = await response.json(); // La respuesta es directamente el array
            console.log("Datos recibidos de la API:", sedes);

            if (!sedes || sedes.length === 0) {
                mostrarMensaje("No hay sedes registradas.");
                tablaSedes.innerHTML = '<tr><td colspan="3">No se encontraron sedes</td></tr>';
                return;
            }

            mostrarSedes(sedes);
        } catch (error) {
            console.error("Error al cargar sedes:", error);
            mostrarMensaje(`Error al cargar sedes: ${error.message}`, true);
            tablaSedes.innerHTML = '<tr><td colspan="3">Error al cargar datos</td></tr>';
        }
    }

    function mostrarSedes(sedes) {
        tablaSedes.innerHTML = sedes.map(crearFilaSede).join('');

        tablaSedes.addEventListener('click', async (event) => {
            const target = event.target;
            const idSede = target.dataset.id;

            if (target.classList.contains('btn-editar')) {
                window.location.href = `EditarSede.html?id=${idSede}`;
            } else if (target.classList.contains('btn-eliminar')) {
                if (confirm('¿Estás seguro de eliminar esta sede?')) {
                    await eliminarSede(idSede);
                }
            }
        });
    }

    async function eliminarSede(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData?.message || 'Error al eliminar la sede';
                throw new Error(errorMessage);
            }

            mostrarMensaje('Sede eliminada correctamente');
            const filaEliminada = document.getElementById(`sede-${id}`);
            if (filaEliminada) {
                filaEliminada.remove();
            } else {
                cargarSedes();
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            mostrarMensaje(`Error al eliminar sede: ${error.message}`, true);
        }
    }

    cargarSedes();
});