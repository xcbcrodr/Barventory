document.addEventListener("DOMContentLoaded", function () {
  // Obtener las sedes desde el servidor
  fetch("http://localhost:3000/sedes")
    .then((response) => response.json())
    .then((data) => {
      const tablaSedes = document.getElementById("tablaSedes");
      const buscarSedeInput = document.getElementById("buscarSede");

      // Función para mostrar las sedes en la tabla
      function mostrarSedes(sedes) {
        tablaSedes.innerHTML = ""; // Limpiar la tabla antes de agregar las nuevas filas
        sedes.forEach((sede) => {
          const fila = document.createElement("tr");
          fila.id = `sede-${sede.id_sede}`; // Asignar un ID único a cada fila

          const celdaNombre = document.createElement("td");
          celdaNombre.textContent = sede.nombre_sede;

          const celdaDireccion = document.createElement("td");
          celdaDireccion.textContent = sede.direccion;

          const celdaAcciones = document.createElement("td");
          const botonEditar = document.createElement("button");
          botonEditar.textContent = "✏️";
          botonEditar.classList.add("btn-editar");
          botonEditar.onclick = function () {
            // Redirigir a la página de edición de sede
            window.location.href = `EditarSede.html?id=${sede.id_sede}`;
          };

          const botonEliminar = document.createElement("button");
          botonEliminar.textContent = "🗑️";
          botonEliminar.classList.add("btn-eliminar");
          botonEliminar.onclick = function () {
            eliminarSede(sede.id_sede);
          };

          celdaAcciones.appendChild(botonEditar);
          celdaAcciones.appendChild(botonEliminar);

          fila.appendChild(celdaNombre);
          fila.appendChild(celdaDireccion);
          fila.appendChild(celdaAcciones);

          tablaSedes.appendChild(fila);
        });
      }

      // Mostrar todas las sedes inicialmente
      mostrarSedes(data);

      // Función de filtro para buscar sedes
      buscarSedeInput.addEventListener("input", function () {
        const searchTerm = buscarSedeInput.value.toLowerCase();

        // Filtrar las sedes que coincidan con el término de búsqueda
        const filteredSedes = data.filter((sede) => {
          return (
            sede.nombre_sede.toLowerCase().includes(searchTerm) ||
            sede.direccion.toLowerCase().includes(searchTerm)
          );
        });

        // Mostrar las sedes filtradas
        mostrarSedes(filteredSedes);
      });
    })
    .catch((error) => {
      console.error("Error al cargar las sedes:", error);
    });
});

function eliminarSede(id_sede) {
  console.log("Eliminando sede con ID:", id_sede);
  const confirmar = confirm("¿Estás seguro de que deseas eliminar esta sede?");

  if (confirmar) {
    fetch(`http://localhost:3000/sedes/${id_sede}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Respuesta del servidor:", data);
        alert(data.message);
        if (data.message === "Sede eliminada correctamente") {
          const fila = document.querySelector(`#sede-${id_sede}`);
          if (fila) fila.remove();
        }
      })
      .catch((error) => {
        console.error("Error al eliminar la sede:", error);
        alert("Hubo un error al eliminar la sede.");
      });
  }
}
