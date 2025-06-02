const RUTAS = {
    LOGIN: "../index.html" // Ruta al login
};

let productosDisponibles = [];
let pedidoActual = [];

// ========================
// FUNCIONES DE NAVEGACIÓN
// ========================
function redirigirA(ruta) {
    window.location.href = ruta;
}

function salir() {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("idSede"); 
    redirigirA(RUTAS.LOGIN);
}

// ========================
// FUNCIONES PARA INTERACTUAR CON EL BACKEND
// ========================
async function obtenerMesas() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch('/auth/mesero/mesas', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido al obtener mesas.' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.message || 'Error en el servidor.'}`);
        }
        const mesas = await response.json();
        console.log("DEBUG FRONTEND: Mesas obtenidas del backend:", mesas);
        return mesas;
    } catch (error) {
        console.error('Error al obtener las mesas:', error);
        mostrarMensaje(`Error al cargar las mesas: ${error.message || 'Inténtalo de nuevo.'}`, 'error');
        return [];
    }
}

async function obtenerProductos() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch('/auth/mesero/productos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido al obtener productos.' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.message || 'Error en el servidor.'}`);
        }
        const productos = await response.json();
        console.log("DEBUG FRONTEND: Productos obtenidos del backend:", productos);
        productosDisponibles = productos; 
        return productos;
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        mostrarMensaje(`Error al cargar los productos: ${error.message || 'Inténtalo de nuevo.'}`, 'error');
        return [];
    }
}

// public/js/dashboardMesero.js

// ... (código existente) ...

function mostrarProductosEnTabla(productos) {
    const tablaProductoBody = document.getElementById("tablaProducto");
    tablaProductoBody.innerHTML = '';

    // Configuración para el formato de moneda (COP - pesos colombianos, sin decimales)
    // Usamos 'es-CO' para español de Colombia, que usa '.' como separador de miles.
    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP', // Moneda colombiana
        minimumFractionDigits: 0, // No mostrar decimales si son .00
        maximumFractionDigits: 0 // No mostrar decimales si son .00
    });

    if (!productos || productos.length === 0) {
        const row = tablaProductoBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4;
        cell.textContent = "No hay productos disponibles para esta sede o hubo un error al cargarlos.";
        cell.style.textAlign = 'center';
        cell.style.color = '#777';
        return;
    }

    productos.forEach(producto => {
        const row = tablaProductoBody.insertRow();
        row.dataset.productId = producto.id;
        const nombreCell = row.insertCell();
        const cantidadStockCell = row.insertCell();
        const precioCell = row.insertCell();
        const agregarCell = row.insertCell();

        nombreCell.textContent = producto.nombre;

        cantidadStockCell.textContent = producto.cantidad !== undefined && producto.cantidad !== null ? producto.cantidad : 'N/A';

        let precioNumerico = parseFloat(producto.precio);
        if (!isNaN(precioNumerico)) {
            // *** CAMBIO AQUÍ para formatear el precio del producto ***
            precioCell.textContent = formatter.format(precioNumerico);
        } else {
            precioCell.textContent = 'N/A';
            console.warn(`DEBUG FRONTEND: Precio inválido (no numérico) para el producto ${producto.nombre}:`, producto.precio);
        }

        const inputCantidad = document.createElement('input');
        inputCantidad.type = 'number';
        inputCantidad.min = '1';
        inputCantidad.value = '1';
        inputCantidad.classList.add('cantidad-input');
        inputCantidad.style.width = '60px';

        const btnAgregar = document.createElement('button');
        btnAgregar.textContent = '+';
        btnAgregar.classList.add('btn-agregar-pedido');
        btnAgregar.addEventListener('click', () => {
            const cantidad = parseInt(inputCantidad.value);
            agregarProductoAlPedido(producto, cantidad);
        });

        agregarCell.appendChild(inputCantidad);
        agregarCell.appendChild(btnAgregar);

        if (producto.cantidad <= 0) {
            inputCantidad.disabled = true;
            btnAgregar.disabled = true;
            row.classList.add('agotado');
            cantidadStockCell.textContent = 'Agotado';
            inputCantidad.value = 0;
            inputCantidad.min = 0;
        }
    });
}

function mostrarPedidoActualEnTabla() {
    const tablaPedidoBody = document.getElementById('tablaPedido');
    tablaPedidoBody.innerHTML = '';

    // Reutilizamos el mismo formateador para la tabla de pedidos
    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    if (pedidoActual.length === 0) {
        const row = tablaPedidoBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3;
        cell.textContent = "El pedido está vacío.";
        cell.style.textAlign = 'center';
        cell.style.color = '#777';
        return;
    }

    pedidoActual.forEach(item => {
        const row = tablaPedidoBody.insertRow();
        row.dataset.itemId = item.id;
        const nombreCell = row.insertCell();
        const cantidadCell = row.insertCell();
        const precioCell = row.insertCell();

        nombreCell.textContent = item.nombre;
        cantidadCell.textContent = item.cantidad;
        // *** CAMBIO AQUÍ para formatear el precio total del item en el pedido ***
        precioCell.textContent = formatter.format(item.precio * item.cantidad);
    });
}

// ... (resto del código sin cambios) ...

function agregarProductoAlPedido(producto, cantidad) {
    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarMensaje('La cantidad debe ser un número positivo.', 'warning');
        return;
    }

    const productoEnStock = productosDisponibles.find(p => p.id === producto.id);

    // Si el producto no se encontró en el stock de frontend (caso raro pero posible si los datos no se cargan bien)
    if (!productoEnStock) {
        mostrarMensaje('Error: Producto no encontrado en el stock disponible.', 'error');
        return;
    }

    // Calcular la cantidad total que este producto tendría en el pedido si se añade la nueva cantidad
    const productoExistenteEnPedido = pedidoActual.find(item => item.id === producto.id);
    const cantidadYaEnPedido = productoExistenteEnPedido ? productoExistenteEnPedido.cantidad : 0;
    const cantidadTotalEnPedidoPropuesta = cantidadYaEnPedido + cantidad;

    // ----- NUEVA LÓGICA DE VALIDACIÓN MEJORADA -----

    // 1. Si el stock DISPONIBLE actual del producto es 0 o menos, ya no se puede añadir nada.
    // Este es el caso para cuando el producto ya se agotó previamente.
    if (productoEnStock.cantidad <= 0) {
        mostrarMensaje(`El producto ${producto.nombre} está agotado.`, 'error');
        return;
    }

    // 2. Si la cantidad total que se propone en el pedido excede el stock actual del producto.
    if (cantidadTotalEnPedidoPropuesta > productoEnStock.cantidad + cantidadYaEnPedido) { // Pequeño ajuste aquí
        // La cantidad que *realmente* se puede añadir es el stock actual del producto menos lo que ya está en el pedido
        const cantidadQueSePuedeAñadir = productoEnStock.cantidad - cantidadYaEnPedido;

        if (cantidadQueSePuedeAñadir > 0) {
            mostrarMensaje(`Solo puedes añadir ${cantidadQueSePuedeAñadir} unidad(es) de ${producto.nombre}.`, 'warning');
        } else {
            // Este caso debería ser capturado por la primera validación si el stock ya es 0
            // Pero como fallback, si la lógica se torciera, se asegura el mensaje correcto.
            mostrarMensaje(`El producto ${producto.nombre} está agotado.`, 'error');
        }
        return;
    }
    // ----- FIN NUEVA LÓGICA DE VALIDACIÓN MEJORADA -----


    // Si llegamos aquí, la cantidad a añadir es válida.
    // Procedemos a añadir al pedido.
    if (productoExistenteEnPedido) {
        productoExistenteEnPedido.cantidad += cantidad;
    } else {
        pedidoActual.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio, // Ya es numérico por parseFloat en mostrarProductosEnTabla
            cantidad: cantidad
        });
    }

    // *** Actualizar stock en el frontend ***
    // Disminuir la cantidad disponible en el array global productosDisponibles
    const indexProductoStock = productosDisponibles.findIndex(p => p.id === producto.id);
    if (indexProductoStock !== -1) {
        productosDisponibles[indexProductoStock].cantidad -= cantidad;
    }

    // *** Volver a mostrar la tabla de productos para reflejar el stock actualizado
    // y aplicar la lógica de deshabilitación si el stock llegó a 0. ***
    mostrarProductosEnTabla(productosDisponibles);


    mostrarPedidoActualEnTabla();
    mostrarMensaje(`${cantidad} unidad(es) de ${producto.nombre} añadida(s) al pedido.`, 'success');
}

function quitarProductoDelPedido(productoId, cantidadARemover) {
    const itemIndex = pedidoActual.findIndex(item => item.id === productoId);

    if (itemIndex !== -1) {
        const item = pedidoActual[itemIndex];
        const cantidadActual = item.cantidad;

        if (cantidadARemover >= cantidadActual) {
            // Remover el item completo del pedido
            pedidoActual.splice(itemIndex, 1);
            // Restaurar stock en productosDisponibles
            const productoEnStock = productosDisponibles.find(p => p.id === productoId);
            if (productoEnStock) {
                productoEnStock.cantidad += cantidadActual;
            }
        } else {
            // Reducir la cantidad del item en el pedido
            item.cantidad -= cantidadARemover;
            // Restaurar stock en productosDisponibles
            const productoEnStock = productosDisponibles.find(p => p.id === productoId);
            if (productoEnStock) {
                productoEnStock.cantidad += cantidadARemover;
            }
        }
        mostrarPedidoActualEnTabla();
        mostrarProductosEnTabla(productosDisponibles); // Actualizar tabla de stock
        mostrarMensaje(`Producto ${item.nombre} actualizado en el pedido.`, 'info');
    }
}

async function cargarMesasEnSelect() {
    console.log("DEBUG FRONTEND: Intentando cargar mesas en el select.");
    const selectMesa = document.getElementById('mesa');
    if (!selectMesa) {
        console.error("DEBUG FRONTEND: El elemento SELECT con id 'mesa' no fue encontrado.");
        return; 
    }
    console.log("DEBUG FRONTEND: Elemento select de mesa encontrado:", selectMesa);

    const mesas = await obtenerMesas();
    console.log("DEBUG FRONTEND: Mesas obtenidas del backend:", mesas); 
    
    selectMesa.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Selecciona la mesa";
    defaultOption.selected = true; 
    defaultOption.disabled = true; 
    selectMesa.appendChild(defaultOption);

    if (mesas.length === 0) {
        console.warn("DEBUG FRONTEND: No se obtuvieron mesas del backend o el array está vacío.");
        defaultOption.textContent = "No hay mesas disponibles"; 
    } else {
        mesas.forEach(mesa => {
            const option = document.createElement('option');
            option.value = mesa.id; 
            option.textContent = mesa.nombre;
            selectMesa.appendChild(option);
        });
    }
    console.log("DEBUG FRONTEND: Mesas añadidas al select.");
}

function mostrarMensaje(mensaje, tipo) {
    console.log(`[${tipo.toUpperCase()}]: ${mensaje}`);
    alert(mensaje); 
}

document.addEventListener("DOMContentLoaded", async function() {
    const nombreUsuario = localStorage.getItem("nombreUsuario");
    if (nombreUsuario) {
        document.getElementById("usuarioNombre").textContent = nombreUsuario;
    }

    await cargarMesasEnSelect();

    const seccionProductosPedidos = document.getElementById('seccionProductosPedidos');
    if (seccionProductosPedidos) {
        seccionProductosPedidos.style.display = 'none';
    }

    document.getElementById("btnSalir").addEventListener("click", salir);

    const selectMesa = document.getElementById('mesa');
    if (selectMesa) {
        selectMesa.addEventListener('change', async function() {
            const idMesaSeleccionada = this.value;
            console.log('Mesa seleccionada:', idMesaSeleccionada);

            if (idMesaSeleccionada) {
                if (seccionProductosPedidos) {
                    seccionProductosPedidos.style.display = 'block';
                }

                // Asegúrate de que productosDisponibles se inicialice aquí
                const productos = await obtenerProductos();
                productosDisponibles = productos; // Establece los productos iniciales
                mostrarProductosEnTabla(productosDisponibles); // Pasa la variable global

                pedidoActual = [];
                mostrarPedidoActualEnTabla();
            } else {
                if (seccionProductosPedidos) {
                    seccionProductosPedidos.style.display = 'none';
                }
                document.getElementById("tablaProducto").innerHTML = '';
                document.getElementById("tablaPedido").innerHTML = '';
            }
        });
    }

    const btnRegistrarPedido = document.getElementById('btnRegistrarPedido');
    if (btnRegistrarPedido) {
        btnRegistrarPedido.addEventListener('click', async () => {
            const mesaSeleccionada = document.getElementById('mesa').value;
            if (!mesaSeleccionada || mesaSeleccionada === "") {
                mostrarMensaje('Por favor, selecciona una mesa antes de registrar el pedido.', 'warning');
                return;
            }
            if (pedidoActual.length === 0) {
                mostrarMensaje('El pedido actual está vacío.', 'warning');
                return;
            }
            const pedidoParaEnviar = {
                idMesa: parseInt(mesaSeleccionada),
                productos: pedidoActual.map(item => ({
                    idProducto: item.id,
                    cantidad: item.cantidad
                }))
            };
            console.log('Pedido a enviar:', pedidoParaEnviar);
            try {
                const token = localStorage.getItem("token");
                const response = await fetch('/auth/mesero/pedidos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(pedidoParaEnviar)
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
                    throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Error en el servidor.'}`);
                }
                const resultado = await response.json();
                mostrarMensaje(resultado.message || 'Pedido registrado correctamente.', 'success');
                pedidoActual = [];
                mostrarPedidoActualEnTabla();

                // *** IMPORTANTE: Después de un pedido, recargar los productos COMPLETOS de la DB
                // Esto es crucial para que el stock se refleje correctamente si otros meseros
                // o procesos también actualizan el stock.
                const productosActualizados = await obtenerProductos();
                productosDisponibles = productosActualizados; // Actualiza la variable global
                mostrarProductosEnTabla(productosDisponibles); // Vuelve a renderizar con datos frescos
            } catch (error) {
                console.error('Error al registrar el pedido:', error);
                mostrarMensaje(`Error al registrar el pedido: ${error.message || 'Inténtalo de nuevo.'}`, 'error');
            }
        });
    }

    mostrarPedidoActualEnTabla();
});