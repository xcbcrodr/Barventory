document.addEventListener("DOMContentLoaded", async function () {
  const API_URL_SEDES = "http://localhost:3000/auth/usuarios/sedes";
  const API_URL_PRODUCTOS = "http://localhost:3000/auth/productos/";
  const sedeSelect = document.getElementById("sede");
  const productForm = document.getElementById("productForm"); 
  const errorMessage = document.getElementById("errorMessage");
  const btnCrearProducto = document.getElementById("btnCrearProducto"); 

  // Función para formatear números con separadores de miles (COP)
  function formatCOP(input) {
    let value = input.value.replace(/[^\d]/g, '');
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    input.value = value;
  }

  // Función para validar que la cantidad no sea negativa
  function validateCantidad(input) {
    input.value = input.value.replace(/[^\d]/g, '');
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
        // =====> COLOCA EL CÓDIGO AQUÍ <=====
        data.data.forEach((sede) => {
          const option = document.createElement("option");
          option.value = sede.id_sede; // <--- Asegúrate de que el 'value' sea el ID
          option.textContent = sede.nombre_sede;
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

  // Agregar event listeners para el formato de precio y validación de cantidad
  const precioProductoInput = document.getElementById('precio_producto');
  const precioVentaInput = document.getElementById('precio_venta');
  const cantidadInput = document.getElementById('cantidad');

  if (precioProductoInput) {
    precioProductoInput.addEventListener('input', function() {
      formatCOP(this);
    });
  }

  if (precioVentaInput) {
    precioVentaInput.addEventListener('input', function() {
      formatCOP(this);
    });
  }

  if (cantidadInput) {
    cantidadInput.addEventListener('input', function() {
      validateCantidad(this);
    });
  }

  // Evento para el botón de crear producto
  btnCrearProducto.addEventListener("click", async (event) => {
    event.preventDefault();

    const nombre_p = document.getElementById("nombre_producto").value.trim();
    const precio_p = document.getElementById("precio_producto").value.trim().replace(/\./g, ''); // Eliminar separadores para enviar al API
    const precio_v = document.getElementById("precio_venta").value.trim().replace(/\./g, ''); // Eliminar separadores para enviar al API
    const cantidad_p = document.getElementById("cantidad").value.trim();
    const proveedor_p = document.getElementById("nombre_proveedor").value.trim();
    const sedeId = sedeSelect.value;

    if (!nombre_p || !precio_p || !precio_v || !cantidad_p || !proveedor_p || !sedeId) {
      mostrarMensaje("Todos los campos son obligatorios", true);
      return;
    }

    // Adicional: Validar que precio y cantidad sean números válidos
    if (isNaN(precio_p)) {
      mostrarMensaje("El precio debe ser un número válido", true);
      return;
    }
    if (isNaN(precio_v)) {
      mostrarMensaje("El precio de venta debe ser un número válido", true);
      return;
    }
    if (isNaN(cantidad_p) || parseInt(cantidad_p) < 0) {
      mostrarMensaje("La cantidad debe ser un número mayor o igual a 0", true);
      return;
    }

    try {
      const response = await fetch(API_URL_PRODUCTOS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          nombre_p: nombre_p,
          precio_p: precio_p,
          precio_v: precio_v,
          cantidad_p: cantidad_p,
          proveedor_p: proveedor_p,
          sede: sedeId, // Enviar el ID de la sede seleccionada
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || `Error al crear producto: ${response.status}`);
      }

      const data = await response.json();
      mostrarMensaje("Producto creado correctamente", false);
      productForm.reset();
      setTimeout(() => {
        window.location.href = "../admin/ProductosCreados.html";
      }, 2000);
    } catch (error) {
      console.error("Error al crear producto:", error);
      mostrarMensaje(error.message, true);
    }
  });

  cargarSedes();
});