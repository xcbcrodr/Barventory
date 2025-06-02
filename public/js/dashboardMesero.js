const RUTAS = {
    LOGIN: "../index.html"
};

// ========================
// VARIABLES GLOBALES (Ajustadas para mejor manejo)
// ========================
let productosDisponibles = {}; // Objeto para almacenar productos por su ID { id: { ...datosProducto }, ... }
let pedidoActual = {}; // Objeto para almacenar el pedido actual { idProducto: { idProducto, nombre, cantidad, precioUnitario, precioTotalItem } }
let idMesaSeleccionada = null; // Para guardar la mesa activa

// Formateador de moneda (declarado globalmente para uso consistente)
const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

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
    try {
        const token = localStorage.getItem('token');
        if (!token) { /* ... redirigir al login ... */ return; }

        const response = await fetch('/auth/mesero/productos', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error status ${response.status}: ${errorData.error || 'Error desconocido al obtener productos.'}`);
        }
        const productosArray = await response.json();

        productosDisponibles = productosArray.reduce((acc, p) => {
            acc[p.id] = {
                ...p,
                precio: parseFloat(p.precio)
            };
            return acc;
        }, {});

        mostrarProductosEnTabla();
        return productosArray;
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        alert(`Error al cargar los productos: ${error.message}`);
        return [];
    }
}

// ========================
// FUNCIONES DE MANEJO DE TABLAS (FRONTEND)
// ========================

function mostrarProductosEnTabla() {
    const productosTableBody = document.getElementById('tablaProducto'); // ID CORREGIDO
    productosTableBody.innerHTML = '';

    const productosArray = Object.values(productosDisponibles);

    if (!productosArray || productosArray.length === 0) {
        productosTableBody.innerHTML = '<tr><td colspan="4">No hay productos disponibles.</td></tr>';
        return;
    }

    productosArray.forEach(producto => {
        const row = productosTableBody.insertRow();
        row.insertCell(0).textContent = producto.nombre;
        row.insertCell(1).textContent = producto.cantidad;
        row.insertCell(2).textContent = formatter.format(producto.precio);

        const addCell = row.insertCell(3);
        const addButton = document.createElement('button');
        addButton.textContent = '+';
        addButton.classList.add('btn', 'btn-success', 'btn-sm');
        addButton.onclick = () => agregarProductoAlPedido(producto.id, 1);
        addCell.appendChild(addButton);

        if (producto.cantidad <= 0) {
            addButton.disabled = true;
            row.classList.add('table-danger');
        } else {
            addButton.disabled = false;
            row.classList.remove('table-danger');
        }
    });
}

function mostrarPedidoActualEnTabla() {
    const pedidoTableBody = document.getElementById('tablaPedido'); // ID CORREGIDO
    pedidoTableBody.innerHTML = '';

    let totalPedido = 0;
    const productosEnPedido = Object.values(pedidoActual);

    if (productosEnPedido.length === 0) {
        pedidoTableBody.innerHTML = '<tr><td colspan="4">El pedido está vacío.</td></tr>'; // 4 columnas: Producto, Cantidad, Precio Total, Acciones
        // Si tienes el span del total, ahora lo puedes actualizar.
        document.getElementById('totalPedidoSpan').textContent = formatter.format(0);
        return;
    }

    productosEnPedido.forEach(item => {
        const row = pedidoTableBody.insertRow();
        row.insertCell(0).textContent = item.nombre;
        row.insertCell(1).textContent = item.cantidad;
        row.insertCell(2).textContent = formatter.format(item.cantidad * item.precioUnitario);

        const actionsCell = row.insertCell(3); // Añadida la celda para acciones
        const decrementButton = document.createElement('button');
        decrementButton.textContent = '-';
        decrementButton.classList.add('btn', 'btn-warning', 'btn-sm', 'me-2');
        decrementButton.onclick = () => quitarProductoDelPedido(item.idProducto, 1);
        actionsCell.appendChild(decrementButton);

        totalPedido += (item.cantidad * item.precioUnitario);
    });

    // Ahora este span EXISTE en tu HTML, así que se puede actualizar
    document.getElementById('totalPedidoSpan').textContent = formatter.format(totalPedido);
}

// ========================
// FUNCIONES DE LÓGICA DE PEDIDO (Adaptadas a tu estructura)
// ========================

function agregarProductoAlPedido(idProducto, cantidadAAgregar = 1) {
    const productoEnStock = productosDisponibles[idProducto];

    if (!productoEnStock) {
        mostrarMensaje('Error: Producto no encontrado en el stock disponible.', 'error');
        return;
    }

    if (productoEnStock.cantidad <= 0) {
        mostrarMensaje(`El producto ${productoEnStock.nombre} está agotado.`, 'error');
        return;
    }

    const cantidadEnPedidoActual = pedidoActual[idProducto] ? pedidoActual[idProducto].cantidad : 0;

    if (cantidadAAgregar > productoEnStock.cantidad) {
        mostrarMensaje(`Solo hay ${productoEnStock.cantidad} unidades disponibles de ${productoEnStock.nombre}.`, 'warning');
        return;
    }

    productosDisponibles[idProducto].cantidad -= cantidadAAgregar;

    if (pedidoActual[idProducto]) {
        pedidoActual[idProducto].cantidad += cantidadAAgregar;
    } else {
        pedidoActual[idProducto] = {
            idProducto: productoEnStock.id,
            nombre: productoEnStock.nombre,
            cantidad: cantidadAAgregar,
            precioUnitario: productoEnStock.precio
        };
    }

    actualizarTablas();
    mostrarMensaje(`${cantidadAAgregar} unidad(es) de ${productoEnStock.nombre} añadida(s) al pedido.`, 'success');
}


function quitarProductoDelPedido(idProducto, cantidadARemover = 1) {
    if (!pedidoActual[idProducto]) return;

    const itemEnPedido = pedidoActual[idProducto];
    const productoEnStock = productosDisponibles[idProducto];

    if (productoEnStock) {
        productoEnStock.cantidad += cantidadARemover;
    }

    itemEnPedido.cantidad -= cantidadARemover;

    if (itemEnPedido.cantidad <= 0) {
        delete pedidoActual[idProducto];
    }

    actualizarTablas();
    mostrarMensaje(`Producto ${itemEnPedido.nombre} actualizado en el pedido.`, 'info');
}

function actualizarTablas() {
    mostrarProductosEnTabla();
    mostrarPedidoActualEnTabla();
}

// ========================
// FUNCIONES DE CARGA Y EVENTOS INICIALES
// ========================

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
// NUEVA FUNCIÓN PARA REGISTRAR EL PEDIDO FINAL
// ========================
async function registrarPedidoFinal() {
    if (!idMesaSeleccionada) {
        mostrarMensaje('Por favor, selecciona una mesa antes de registrar el pedido.', 'warning');
        return;
    }

    const productosParaBackend = Object.values(pedidoActual).map(item => ({
        idProducto: item.idProducto,
        cantidad: item.cantidad
    }));

    if (productosParaBackend.length === 0) {
        mostrarMensaje('El pedido está vacío. Añade productos antes de registrar.', 'warning');
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const response = await fetch('/auth/mesero/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                idMesa: parseInt(idMesaSeleccionada),
                productos: productosParaBackend
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.message || 'Error en el servidor.'}`);
        }
        
        const resultado = await response.json();
        mostrarMensaje(resultado.message || 'Pedido registrado correctamente.', 'success');
        
        pedidoActual = {}; 
        
        await obtenerProductos();
        
        mostrarPedidoActualEnTabla();

    } catch (error) {
        console.error('Error al registrar el pedido:', error);
        mostrarMensaje(`Error al registrar el pedido: ${error.message || 'Inténtalo de nuevo.'}`, 'error');
    }
}


// ========================
// EVENT LISTENERS PRINCIPALES
// ========================
document.addEventListener("DOMContentLoaded", async function() {
    // Estas líneas se mueven aquí, dentro del DOMContentLoaded, 
    // para asegurar que los elementos estén disponibles.
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
            idMesaSeleccionada = this.value;
            console.log('Mesa seleccionada:', idMesaSeleccionada);

            if (idMesaSeleccionada) {
                if (seccionProductosPedidos) {
                    seccionProductosPedidos.style.display = 'block';
                }
                
                pedidoActual = {}; 

                await obtenerProductos();
                
                actualizarTablas();

            } else {
                if (seccionProductosPedidos) {
                    seccionProductosPedidos.style.display = 'none';
                }
                document.getElementById("tablaProducto").innerHTML = '<tr><td colspan="4">Selecciona una mesa para ver los productos.</td></tr>';
                document.getElementById("tablaPedido").innerHTML = '<tr><td colspan="4">El pedido está vacío.</td></tr>'; // Columnas 4 por el botón '-'
                document.getElementById('totalPedidoSpan').textContent = formatter.format(0); // Reiniciar el total
            }
        });
    }

    const btnRegistrarPedido = document.getElementById('btnRegistrarPedido'); // ID CORREGIDO
    if (btnRegistrarPedido) {
        btnRegistrarPedido.addEventListener('click', registrarPedidoFinal);
    }

    // Inicializar la tabla de pedido vacía al cargar la página (ahora con los IDs correctos)
    // Se ejecuta aquí y como la sección está display:none, no causará un error visible,
    // pero asegura que las variables internas de JS estén listas.
    mostrarPedidoActualEnTabla(); 
});