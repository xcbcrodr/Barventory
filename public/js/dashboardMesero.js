// public/js/dashboardMesero.js
// ========================
// CONSTANTES Y CONFIGURACIÓN
// ========================
const RUTAS = {
    LOGIN: "../index.html" // Ruta al login
};

// ========================
// VARIABLES GLOBALES
// ========================
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

function mostrarProductosEnTabla(productos) {
    const tablaProductoBody = document.getElementById("tablaProducto");
    tablaProductoBody.innerHTML = ''; 

    if (!productos || productos.length === 0) {
        const row = tablaProductoBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4; 
        cell.textContent = "No hay productos disponibles para esta sede o hubo un error al cargarlos.";
        cell.style.textAlign = 'center';
        return;
    }

    productos.forEach(producto => {
        const row = tablaProductoBody.insertRow();
        const nombreCell = row.insertCell();
        const cantidadStockCell = row.insertCell();
        const precioCell = row.insertCell();
        const agregarCell = row.insertCell();

        nombreCell.textContent = producto.nombre; 
        // ¡CORRECCIÓN CLAVE! Usamos producto.cantidad
        cantidadStockCell.textContent = producto.cantidad !== undefined && producto.cantidad !== null ? producto.cantidad : 'N/A'; 
        precioCell.textContent = `$${producto.precio.toFixed(2)}`; 

        const inputCantidad = document.createElement('input');
        inputCantidad.type = 'number';
        inputCantidad.min = '1';
        inputCantidad.value = '1';
        inputCantidad.classList.add('cantidad-input'); 

        const btnAgregar = document.createElement('button');
        btnAgregar.textContent = '+';
        btnAgregar.classList.add('btn-agregar-pedido');
        btnAgregar.addEventListener('click', () => {
            const cantidad = parseInt(inputCantidad.value);
            agregarProductoAlPedido(producto, cantidad);
        });

        agregarCell.appendChild(inputCantidad);
        agregarCell.appendChild(btnAgregar);
    });
}

function mostrarPedidoActualEnTabla() {
    const tablaPedidoBody = document.getElementById('tablaPedido'); 
    tablaPedidoBody.innerHTML = ''; 

    if (pedidoActual.length === 0) {
        const row = tablaPedidoBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3; 
        cell.textContent = "El pedido está vacío.";
        cell.style.textAlign = 'center';
        return;
    }

    pedidoActual.forEach(item => {
        const row = tablaPedidoBody.insertRow();
        const nombreCell = row.insertCell();
        const cantidadCell = row.insertCell();
        const precioCell = row.insertCell();

        nombreCell.textContent = item.nombre; 
        cantidadCell.textContent = item.cantidad; 
        precioCell.textContent = `$${(item.precio * item.cantidad).toFixed(2)}`; 
    });
}

function agregarProductoAlPedido(producto, cantidad) {
    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarMensaje('La cantidad debe ser un número positivo.', 'warning');
        return;
    }

    const productoEnStock = productosDisponibles.find(p => p.id === producto.id);

    // ¡CORRECCIÓN CLAVE! Usamos productoEnStock.cantidad
    if (!productoEnStock || productoEnStock.cantidad === undefined || productoEnStock.cantidad < cantidad) {
        mostrarMensaje(`No hay suficiente stock de ${producto.nombre}. Cantidad disponible: ${productoEnStock ? productoEnStock.cantidad : 'N/A'}`, 'error');
        return;
    }

    const productoExistenteEnPedido = pedidoActual.find(item => item.id === producto.id);

    if (productoExistenteEnPedido) {
        // ¡CORRECCIÓN CLAVE! Usamos productoEnStock.cantidad
        if (productoExistenteEnPedido.cantidad + cantidad > productoEnStock.cantidad) {
            mostrarMensaje(`No puedes añadir más de ${productoEnStock.cantidad - productoExistenteEnPedido.cantidad} unidad(es) de ${producto.nombre}.`, 'warning');
            return;
        }
        productoExistenteEnPedido.cantidad += cantidad;
    } else {
        pedidoActual.push({
            id: producto.id,
            nombre: producto.nombre, 
            precio: producto.precio, 
            cantidad: cantidad
        });
    }
    mostrarPedidoActualEnTabla();
    mostrarMensaje(`${cantidad} unidad(es) de ${producto.nombre} añadida(s) al pedido.`, 'success');
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

// ========================
// INICIALIZACIÓN
// ========================
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

                const productos = await obtenerProductos();
                mostrarProductosEnTabla(productos);

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
                
                const productosActualizados = await obtenerProductos();
                mostrarProductosEnTabla(productosActualizados);

            } catch (error) {
                console.error('Error al registrar el pedido:', error);
                mostrarMensaje(`Error al registrar el pedido: ${error.message || 'Inténtalo de nuevo.'}`, 'error');
            }
        });
    }

    mostrarPedidoActualEnTabla();
});