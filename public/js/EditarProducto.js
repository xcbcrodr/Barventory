document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    const API_URL_SEDES = "http://localhost:3000/auth/usuarios/sedes";
    const sedeSelect = document.getElementById("sede");
    const errorMessage = document.getElementById("errorMessage");
    const formularioEditarProducto = document.getElementById("formularioEditarProducto");
    const nombreProductoInput = document.getElementById("nombre_producto");
    const precioProductoInput = document.getElementById("precio_producto");
    const precioVentaProductoInput = document.getElementById("precio_venta");
    const cantidadProductoInput = document.getElementById("cantidad");
    const proveedorProductoInput = document.getElementById("nombre_proveedor");
    const btnActualizarProducto = document.getElementById("btnActualizarProducto");
    const errorNombre = document.getElementById("error-nombre");

    if (!id) {
        alert("ID de producto no proporcionado.");
        window.location.href = "../admin/ProductosCreados.html";
        return;
    }

    async function cargarSedes(sedeSeleccionadaId) {
        const API_URL_SEDES = "http://localhost:3000/auth/usuarios/sedes";
        const sedeSelect = document.getElementById("sede");
        const errorMessage = document.getElementById("errorMessage");

        try {
            const response = await fetch(API_URL_SEDES, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData?.error || `Error al cargar sedes: ${response.status}`
                );
            }
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                sedeSelect.innerHTML =
                    '<option value="" disabled selected>Seleccionar sede</option>';
                data.data.forEach((sede) => {
                    const option = document.createElement("option");
                    option.value = sede.id_sede;
                    option.textContent = sede.nombre_sede;
                    option.selected = sede.id_sede === sedeSeleccionadaId;
                    sedeSelect.appendChild(option);
                });
            } else {
                throw new Error("Formato de respuesta de sedes inválido");
            }
        } catch (error) {
            console.error("Error al cargar sedes:", error);
            if (errorMessage) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = "block";
            }
        }
    }

    function formatearPrecio(event) {
        const input = event.target;
        let value = input.value.trim();
        value = value.replace(',', '.');
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
            input.value = parseFloat(value).toFixed(2);
        } else if (value !== '') {
            alert('Por favor, ingrese un número válido para el precio.');
            input.value = '';
        }
    }

    function formatearPrecioEnTiempoReal(event) {
        const input = event.target;
        let value = input.value.trim();

        // Eliminar cualquier carácter que no sea número
        value = value.replace(/[^\d]/g, '');

        // Formatear con separadores de miles
        input.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    const cargarProducto = async () => {
        console.log("--> cargarProducto() se está ejecutando para el ID:", id);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No se encontró token de autenticación");
            }
            console.log("--> Token encontrado:", token.substring(0, 10) + "...");

            const response = await fetch(
                `http://localhost:3000/auth/productos/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("--> Respuesta de la API:", response);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("--> Error al obtener producto:", errorData);
                throw new Error(errorData.error || "Error al obtener producto");
            }

            const { data: producto } = await response.json();
            console.log("--> Datos del producto recibidos:", producto);

            nombreProductoInput.value = producto.nombre_p;
            precioProductoInput.dataset.valorOriginal = producto.precio_p; // Almacenar el valor original
            precioProductoInput.value = Number(producto.precio_p).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); // Formatear visualmente
            precioVentaProductoInput.dataset.valorOriginal = producto.precio_v; // Almacenar el valor original
            precioVentaProductoInput.value = Number(producto.precio_v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); // Formatear visualmente
            cantidadProductoInput.value = producto.cantidad_p;
            proveedorProductoInput.value = producto.proveedor_p;

            await cargarSedes(producto.id_sede);

            console.log("--> Datos asignados al formulario:", {
                nombre: nombreProductoInput.value,
                precio: precioProductoInput.value,
                venta: precioVentaProductoInput.value,
                cantidad: cantidadProductoInput.value,
                proveedor: proveedorProductoInput.value,
            });
        } catch (error) {
            console.error("--> Error en cargarProducto():", error);
            alert(`Error: ${error.message}`);
            window.location.href = "../admin/ProductosCreados.html";
        }
    };

    btnActualizarProducto.addEventListener("click", async (e) => {
        e.preventDefault();

        const nombreProductoActualizado = nombreProductoInput.value.trim();
        let precioProductoActualizado = precioProductoInput.value.trim();
        let precioVentaProductoActualizado = precioVentaProductoInput.value.trim();
        const cantidadProductoActualizado = cantidadProductoInput.value.trim();
        const proveedorProductoActualizado = proveedorProductoInput.value.trim();
        const sedeActualizadaId = sedeSelect.value;

        // Eliminar separadores de miles antes de enviar
        precioProductoActualizado = precioProductoActualizado.replace(/\./g, '');
        precioVentaProductoActualizado = precioVentaProductoActualizado.replace(/\./g, '');

        const productoActualizado = {
            nombre_p: nombreProductoActualizado,
            precio_p: precioProductoActualizado,
            precio_v: precioVentaProductoActualizado,
            cantidad_p: cantidadProductoActualizado,
            proveedor_p: proveedorProductoActualizado,
            sede: sedeActualizadaId,
        };

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No se encontró token de autenticación");
            }

            const response = await fetch(
                `http://localhost:3000/auth/productos/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(productoActualizado),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar producto");
            }

            alert("Producto actualizado con éxito!");
            window.location.href = "../admin/ProductosCreados.html";
        } catch (error) {
            console.error("Error al actualizar producto:", error);
            alert(`Error: ${error.message}`);
        }
    });

    precioProductoInput.addEventListener('input', formatearPrecioEnTiempoReal);
    precioVentaProductoInput.addEventListener('input', formatearPrecioEnTiempoReal);

    function mostrarError(element, message) {
        element.textContent = message;
        element.style.display = "block";
    }

    function limpiarError(element) {
        element.textContent = "";
        element.style.display = "none";
    }

    cargarProducto();
});