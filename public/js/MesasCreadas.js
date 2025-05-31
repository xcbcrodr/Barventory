document.addEventListener("DOMContentLoaded", function () {
  const sedeSelect = document.getElementById("sede");
  const mesasContainer = document.getElementById("mesas-container");
  const btnAgregarMesa = document.getElementById("btnAgregarMesa");
  const btnEliminarMesas = document.getElementById("btnEliminarMesas");

  // Función para cargar las sedes desde la API

  function cargarSedes() {
    const token = localStorage.getItem("authToken");
    console.log("cargarSedes - Token recuperado:", token);

    const sedeSelect = document.getElementById("sede");
    console.log("cargarSedes - Elemento sedeSelect:", sedeSelect);

    fetch("/auth/mesas/sedes", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        console.log("cargarSedes - Respuesta del servidor:", response);
        if (!response.ok) {
          // Verificar si la respuesta no fue exitosa (ej: 401, 403)
          console.error(
            "cargarSedes - Error en la respuesta:",
            response.status
          );
          if (response.status === 401 || response.status === 403) {
            alert(
              "Tu sesión ha expirado o no tienes permiso para ver esta página. Por favor, inicia sesión nuevamente."
            );
            window.location.href = "/index.html"; // Redirigir solo en caso de error de autenticación
            throw new Error("Error de autenticación"); // Detener la cadena de promesas
          } else {
            return response.json(); // Intentar parsear el JSON para otros errores
          }
        }
        return response.json();
      })
      .then((data) => {
        console.log("cargarSedes - Datos JSON recibidos:", data);
        if (data.success) {
          sedeSelect.innerHTML =
            '<option value="" disabled selected>Selecciona la sede</option>';
          data.data.forEach((sede) => {
            console.log("cargarSedes - Sede individual:", sede);
            const option = document.createElement("option");
            option.value = sede.id;
            option.textContent = sede.nombre;
            sedeSelect.appendChild(option);
            console.log("cargarSedes - Opción añadida al select:", option);
          });
          console.log(
            "cargarSedes - Contenido del select después de añadir opciones:",
            sedeSelect.innerHTML
          );
        } else {
          console.error("cargarSedes - Error al cargar las sedes:", data.error);
          const mesasContainer = document.getElementById("mesas-container");
          if (mesasContainer) {
            mesasContainer.innerHTML =
              '<p class="error-message">Error al cargar las sedes: ' +
              data.error +
              "</p>";
          }
        }
      })
      .catch((error) => {
        console.error("cargarSedes - Error de red:", error);
        const mesasContainer = document.getElementById("mesas-container");
        if (mesasContainer) {
          mesasContainer.innerHTML =
            '<p class="error-message">Error de red al cargar las sedes.</p>';
        }
      });
  }

  document.addEventListener("DOMContentLoaded", cargarSedes);

  // Función para cargar las mesas de la sede seleccionada desde la API
  function cargarMesasPorSede(idSede) {
    mesasContainer.innerHTML = "<p>Cargando mesas...</p>";
    fetch(`/auth/mesas/sedes/${idSede}/mesas`, {
      // Añade el prefijo /auth/mesas
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Asegúrate de tener esto si la ruta está protegida
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        mesasContainer.innerHTML = "";
        if (data.success) {
            if (data.data && data.data.length > 0) {
                const fieldset = document.createElement("fieldset");
                fieldset.classList.add("mesas-fieldset");
                const legend = document.createElement("legend");
                legend.textContent = "Mesas Disponibles";
                fieldset.appendChild(legend);
    
                data.data.forEach((mesa) => {
                    // Crear el div contenedor para cada item de mesa
                    const mesaItemDiv = document.createElement("div");
                    mesaItemDiv.classList.add("mesa-item");
    
                    // Crear el checkbox
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = mesa.id_mesa;
                    checkbox.id = `mesa-${mesa.id_mesa}`;
    
                    // Crear la label
                    const label = document.createElement("label");
                    label.textContent = `Mesa ${mesa.numero_mesa}`;
                    label.htmlFor = `mesa-${mesa.id_mesa}`;
    
                    // Insertar el checkbox y la label dentro del div contenedor
                    mesaItemDiv.appendChild(checkbox);
                    mesaItemDiv.appendChild(label);
    
                    // Insertar el div contenedor dentro del fieldset
                    fieldset.appendChild(mesaItemDiv);
                });
                mesasContainer.appendChild(fieldset);
            } else {
                mesasContainer.innerHTML =
                    "<p>No hay mesas creadas para esta sede.</p>";
            }
        } else {
            console.error("Error al cargar las mesas:", data.error);
            mesasContainer.innerHTML = `<p class="error-message">Error al cargar las mesas: ${data.error}</p>`;
        }
    })
      .catch((error) => {
        console.error("Error de red al cargar las mesas:", error);
        mesasContainer.innerHTML =
          '<p class="error-message">Error de red al cargar las mesas.</p>';
      });
  }

  // Evento al cambiar la selección de la sede
  sedeSelect.addEventListener("change", function () {
    const idSedeSeleccionada = this.value;
    if (idSedeSeleccionada) {
      cargarMesasPorSede(idSedeSeleccionada);
      mesasContainer.style.display = "block"; // Mostrar el contenedor al seleccionar una sede
    } else {
      mesasContainer.innerHTML = "Selecciona una sede para ver las mesas.";
      mesasContainer.style.display = "none"; // Ocultar si no se selecciona una sede
    }
  });

  // Evento para añadir una mesa
  // Evento para añadir una mesa
  // Evento para añadir una mesa
  btnAgregarMesa.addEventListener("click", function () {
    const idSedeSeleccionada = sedeSelect.value;
    if (idSedeSeleccionada) {
      const numeroMesa = prompt("Ingrese el número de la nueva mesa:");
      if (numeroMesa) {
        fetch(`/auth/mesas/sedes/${idSedeSeleccionada}/mesas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ numero_mesa: parseInt(numeroMesa) }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              cargarMesasPorSede(idSedeSeleccionada); // Recargar las mesas
              alert(`Mesa Mesa ${data.data.numero_mesa} añadida.`);
            } else {
              alert(`Error al añadir la mesa: ${data.error}`);
            }
          })
          .catch((error) => {
            console.error("Error de red al añadir la mesa:", error);
            alert("Error de red al añadir la mesa.");
          });
      }
    } else {
      alert("Por favor, selecciona una sede antes de añadir una mesa.");
    }
  });

  // Evento para eliminar las mesas seleccionadas
  btnEliminarMesas.addEventListener("click", function () {
    const mesasSeleccionadas = Array.from(
      mesasContainer.querySelectorAll('input[type="checkbox"]:checked')
    ).map((checkbox) => checkbox.value);

    if (mesasSeleccionadas.length > 0) {
      const idSedeSeleccionada = sedeSelect.value;
      if (
        confirm(
          `¿Seguro que deseas eliminar ${mesasSeleccionadas.length} mesas?`
        )
      ) {
        Promise.all(
          mesasSeleccionadas.map((idMesa) =>
            fetch(`/auth/mesas/mesas/${idMesa}`, { // <--- Asegúrate de que sea así
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`
                }
            }).then((response) => response.json())
          )
        )
          .then((responses) => {
            const successfulDeletions = responses.filter((res) => res.success);
            if (successfulDeletions.length === mesasSeleccionadas.length) {
              alert("Mesas eliminadas correctamente.");
              cargarMesasPorSede(idSedeSeleccionada); // Recargar las mesas
            } else {
              alert("Algunas mesas no se pudieron eliminar.");
              cargarMesasPorSede(idSedeSeleccionada); // Recargar las mesas para reflejar los cambios
            }
          })
          .catch((error) => {
            console.error("Error de red al eliminar las mesas:", error);
            alert("Error de red al eliminar las mesas.");
          });
      }
    } else {
      alert("Por favor, selecciona al menos una mesa para eliminar.");
    }
  });

  // Cargar las sedes al cargar la página
  cargarSedes();
  mesasContainer.style.display = "none";
});
