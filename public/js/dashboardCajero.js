// public/js/dashboardCajero.js

const RUTAS = {
    LOGIN: "../index.html"
};

// ========================
// VARIABLES GLOBALES
// ========================
let pedidoActualDetalles = {}; // Objeto que contendrá los detalles del pedido cargado para la mesa seleccionada
let totalPedidoMesa = 0; // Almacenará el total a pagar del pedido seleccionado
let idPedidoSeleccionado = null; // Almacenará el ID del pedido pendiente de la mesa seleccionada

// Formateador de moneda
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

// 1. Obtener mesas con pedidos PENDIENTES
async function obtenerMesasPendientes() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch('/auth/cajero/mesas-pendientes', { // RUTA CORRECTA
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido al obtener mesas pendientes.' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.message || 'Error en el servidor.'}`);
        }
        const mesas = await response.json();
        console.log("DEBUG FRONTEND: Mesas con pedidos pendientes obtenidas:", mesas);
        return mesas; // Cada objeto de mesa ahora contendrá también 'idPedidoActual'
    } catch (error) {
        console.error('Error al obtener las mesas con pedidos pendientes:', error);
        mostrarMensaje(`Error al cargar las mesas: ${error.message || 'Inténtalo de nuevo.'}`, 'error');
        return [];
    }
}

// 2. Obtener los detalles de un pedido específico
async function obtenerDetallePedido(idPedido) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`/auth/cajero/pedido/${idPedido}`, { // RUTA CORRECTA
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido al obtener detalles del pedido.' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.message || 'Error en el servidor.'}`);
        }
        const detallePedido = await response.json();
        console.log("DEBUG FRONTEND: Detalles del pedido obtenidos:", detallePedido);
        return detallePedido;
    } catch (error) {
        console.error(`Error al obtener los detalles del pedido ${idPedido}:`, error);
        mostrarMensaje(`Error al cargar los detalles del pedido: ${error.message || 'Inténtalo de nuevo.'}`, 'error');
        return null;
    }
}

// 3. Obtener métodos de pago disponibles
async function obtenerMetodosPago() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch('/auth/cajero/metodos-pago', { // RUTA CORRECTA
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido al obtener métodos de pago.' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.message || 'Error en el servidor.'}`);
        }
        const metodos = await response.json();
        console.log("DEBUG FRONTEND: Métodos de pago obtenidos:", metodos);
        return metodos;
    } catch (error) {
        console.error('Error al obtener métodos de pago:', error);
        mostrarMensaje(`Error al cargar los métodos de pago: ${error.message || 'Inténtalo de nuevo.'}`, 'error');
        return [];
    }
}

// 4. Procesar y confirmar el pago
async function procesarPago(dataPago) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch('/auth/cajero/procesar-pago', { // RUTA CORRECTA
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dataPago)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido al procesar el pago.' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.message || 'Error en el servidor.'}`);
        }

        const resultado = await response.json();
        mostrarMensaje(resultado.message || 'Pago procesado correctamente.', 'success');
        return resultado;

    } catch (error) {
        console.error('Error al procesar el pago:', error);
        mostrarMensaje(`Error al procesar el pago: ${error.message || 'Inténtalo de nuevo.'}`, 'error');
        return null;
    }
}

// ========================
// FUNCIONES DE RENDERIZADO Y LÓGICA DE UI
// ========================

// Función adaptada para cargar mesas con pedidos pendientes
// ... (código anterior)

// Función adaptada para cargar mesas con pedidos pendientes
async function cargarMesasEnSelect() {
    const selectMesa = document.getElementById('mesa');
    if (!selectMesa) {
        console.error("DEBUG FRONTEND: El elemento SELECT con id 'mesa' no fue encontrado.");
        return;
    }

    const mesas = await obtenerMesasPendientes(); // Llamada a la nueva función
    selectMesa.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Selecciona la mesa";
    defaultOption.selected = true;
    defaultOption.disabled = true;
    selectMesa.appendChild(defaultOption);

    if (mesas.length === 0) {
        defaultOption.textContent = "No hay mesas con pedidos pendientes";
        document.getElementById('btnConfirmarPago').disabled = true;
    } else {
        mesas.forEach(mesa => {
            // ¡EL PUNTO CLAVE AQUÍ!
            // Asegúrate de que 'mesa.idPedidoActual' exista y tenga un valor válido.
            // Si el backend envía `null` o `undefined` para idPedidoActual, aquí está el problema.
            console.log(`DEBUG FRONTEND: Procesando mesa ${mesa.nombre}. idPedidoActual: ${mesa.idPedidoActual}`);
            if (mesa.idPedidoActual) { // Añadir una verificación para asegurar que idPedidoActual no sea undefined/null
                const option = document.createElement('option');
                option.value = mesa.idPedidoActual; // CAMBIO CLAVE: El valor de la opción es el id_pedido
                option.dataset.idMesa = mesa.id; // Guardamos el id_mesa en un dataset
                option.textContent = `Mesa ${mesa.nombre} (Pedido ID: ${mesa.idPedidoActual})`; // Mostrar número de mesa y ID de pedido
                selectMesa.appendChild(option);
            } else {
                console.warn(`DEBUG FRONTEND: La Mesa ${mesa.nombre} no tiene un idPedidoActual válido.`);
            }
        });
        document.getElementById('btnConfirmarPago').disabled = false;
    }
}

// ... (resto del código de dashboardCajero.js)
// Función para mostrar los detalles del pedido en la tabla
function mostrarDetallePedidoEnTabla(detallePedido) {
    const tablaPedidoBody = document.getElementById('tablaPedido');
    tablaPedidoBody.innerHTML = ''; // Limpiar la tabla

    if (!detallePedido || !detallePedido.productos || detallePedido.productos.length === 0) {
        tablaPedidoBody.innerHTML = '<tr><td colspan="3">No hay productos en este pedido.</td></tr>';
        return;
    }

    detallePedido.productos.forEach(item => {
        const row = tablaPedidoBody.insertRow();
        row.insertCell(0).textContent = item.nombreProducto;
        row.insertCell(1).textContent = item.cantidad;
        row.insertCell(2).textContent = formatter.format(item.subtotal);
    });
}

// Función para cargar los métodos de pago en el select
async function cargarMetodosPagoEnSelect() {
    const selectMetodoPago = document.getElementById('metodoPago');
    if (!selectMetodoPago) {
        console.error("DEBUG FRONTEND: El elemento SELECT con id 'metodoPago' no fue encontrado.");
        return;
    }

    const metodos = await obtenerMetodosPago();
    selectMetodoPago.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Selecciona método de pago";
    defaultOption.selected = true;
    defaultOption.disabled = true;
    selectMetodoPago.appendChild(defaultOption);

    metodos.forEach(metodo => {
        const option = document.createElement('option');
        option.value = metodo.id;
        option.textContent = metodo.nombre;
        option.dataset.nombreMetodo = metodo.nombre; 
        selectMetodoPago.appendChild(option);
    });
}

// Función para mostrar/ocultar los checkboxes de billetera digital
function manejarBilleteraDigital() {
    const metodoPagoSelect = document.getElementById('metodoPago');
    const billeteraDigitalOptionsDiv = document.getElementById('billeteraDigitalOptions'); 
    
    if (!billeteraDigitalOptionsDiv) {
        console.error("DEBUG FRONTEND: El div 'billeteraDigitalOptions' no fue encontrado.");
        return;
    }

    const selectedOption = metodoPagoSelect.options[metodoPagoSelect.selectedIndex];
    const nombreMetodo = selectedOption ? selectedOption.dataset.nombreMetodo : '';

    if (nombreMetodo === 'Billetera Digital') { 
        billeteraDigitalOptionsDiv.style.display = 'block';
    } else {
        billeteraDigitalOptionsDiv.style.display = 'none';
        // Deseleccionar los checkboxes si se ocultan
        const nequiCheckbox = document.getElementById('nequi');
        const daviplataCheckbox = document.getElementById('daviplata');
        if (nequiCheckbox) nequiCheckbox.checked = false;
        if (daviplataCheckbox) daviplataCheckbox.checked = false;
    }
}

function calcularCambio() {
    const montoPagadoInput = document.getElementById('montoPagado');
    const cambioInput = document.getElementById('cambio');
    const totalPedidoInput = document.getElementById('totalPedido'); // Ahora es un INPUT de texto

    const totalPedidoValor = parseFloat(totalPedidoInput.value.replace(/[^0-9,-]+/g, "").replace(",", ".")); // Limpiar formato de moneda
    const montoPagadoValor = parseFloat(montoPagadoInput.value);

    let cambio = 0;
    if (!isNaN(montoPagadoValor) && montoPagadoValor >= totalPedidoValor) {
        cambio = montoPagadoValor - totalPedidoValor;
    } else if (isNaN(montoPagadoValor)) {
        // Si el monto pagado no es un número, el cambio es 0
        cambio = 0;
    } else if (montoPagadoValor < totalPedidoValor) {
        // Si el monto pagado es menor, el cambio es negativo (muestra cuánto falta por pagar)
        cambio = montoPagadoValor - totalPedidoValor;
    }
    
    cambioInput.value = formatter.format(cambio);
}

function mostrarMensaje(mensaje, tipo) {
    const errorMessageElement = document.getElementById('errorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = mensaje;
        errorMessageElement.style.color = tipo === 'error' ? '#e74c3c' : (tipo === 'warning' ? '#f39c12' : '#2ecc71');
        errorMessageElement.style.display = 'block';
        // Ocultar después de unos segundos
        setTimeout(() => {
            errorMessageElement.style.display = 'none';
        }, 5000);
    } else {
        console.log(`[${tipo.toUpperCase()}]: ${mensaje}`);
        alert(mensaje); // Fallback si el elemento no existe
    }
}

// ========================
// NUEVA FUNCIÓN PARA CONFIRMAR EL PAGO FINAL
// ========================
async function confirmarPagoFinal() {
    if (!idPedidoSeleccionado) {
        mostrarMensaje('Por favor, selecciona una mesa con un pedido pendiente.', 'warning');
        return;
    }

    const metodoPagoSelect = document.getElementById('metodoPago');
    const idMetodoPagoSeleccionado = metodoPagoSelect.value;
    const nombreMetodoSeleccionado = metodoPagoSelect.options[metodoPagoSelect.selectedIndex].dataset.nombreMetodo;

    const montoPagadoInput = document.getElementById('montoPagado');
    const montoPagado = parseFloat(montoPagadoInput.value);

    if (!idMetodoPagoSeleccionado || !montoPagado || isNaN(montoPagado) || montoPagado <= 0) {
        mostrarMensaje('Por favor, selecciona un método de pago e ingresa un monto válido.', 'warning');
        return;
    }

    const totalPedido = parseFloat(document.getElementById('totalPedido').value.replace(/[^0-9,-]+/g, "").replace(",", "."));

    if (montoPagado < totalPedido) {
        mostrarMensaje('El monto pagado es menor que el total del pedido. Por favor, ajusta el monto o considera múltiples pagos.', 'warning');
        return;
    }

    let detalleMetodoPago = null;
    let referenciaTransaccion = null; // Para pagos con datáfono o billetera digital

    // Lógica para billetera digital
    if (nombreMetodoSeleccionado === 'Billetera Digital') {
        const nequiCheckbox = document.getElementById('nequi');
        const daviplataCheckbox = document.getElementById('daviplata');

        if (nequiCheckbox.checked && daviplataCheckbox.checked) {
            mostrarMensaje('Por favor, selecciona solo Nequi o Daviplata, no ambos.', 'warning');
            return;
        } else if (nequiCheckbox.checked) {
            detalleMetodoPago = 'Nequi';
        } else if (daviplataCheckbox.checked) {
            detalleMetodoPago = 'Daviplata';
        } else {
            mostrarMensaje('Por favor, selecciona si es Nequi o Daviplata.', 'warning');
            return;
        }
    }
    // Podrías añadir lógica similar para 'Datáfono' si necesitas una referencia específica.
    // if (nombreMetodoSeleccionado === 'Datáfono') {
    //     referenciaTransaccion = prompt('Ingresa la referencia de la transacción del datáfono:');
    //     if (!referenciaTransaccion) {
    //         mostrarMensaje('La referencia de la transacción es obligatoria para pagos con datáfono.', 'warning');
    //         return;
    //     }
    // }

    const dataPago = {
        idPedido: idPedidoSeleccionado,
        pagos: [ // Esto permite manejar múltiples pagos si fuera necesario, pero por ahora solo 1
            {
                idMetodoPago: parseInt(idMetodoPagoSeleccionado),
                monto: montoPagado,
                detalleMetodoPago: detalleMetodoPago,
                referenciaTransaccion: referenciaTransaccion
            }
        ]
    };

    const resultadoPago = await procesarPago(dataPago);

    if (resultadoPago) {
        // Limpiar y resetear la interfaz después de un pago exitoso
        idPedidoSeleccionado = null;
        totalPedidoMesa = 0;
        pedidoActualDetalles = {};

        document.getElementById('totalPedido').value = formatter.format(0);
        document.getElementById('montoPagado').value = '';
        document.getElementById('cambio').value = formatter.format(0);
        document.getElementById('metodoPago').value = ''; // Resetear el select
        document.getElementById('tablaPedido').innerHTML = '<tr><td colspan="3">Selecciona una mesa para ver los productos.</td></tr>';
        
        // Ocultar la sección de opciones de billetera digital
        const billeteraDigitalOptionsDiv = document.getElementById('billeteraDigitalOptions');
        if (billeteraDigitalOptionsDiv) {
            billeteraDigitalOptionsDiv.style.display = 'none';
            document.getElementById('nequi').checked = false;
            document.getElementById('daviplata').checked = false;
        }

        // Volver a cargar las mesas disponibles (para reflejar que un pedido ha sido pagado)
        await cargarMesasEnSelect();
        
        // Opcional: Ocultar la sección de detalles de pago si no hay más pedidos pendientes
        const seccionProductosPedidos = document.getElementById('seccionProductosPedidos');
        if (seccionProductosPedidos) {
             const mesasDisponibles = await obtenerMesasPendientes(); // Re-checar si quedan mesas
             if (mesasDisponibles.length === 0) {
                 seccionProductosPedidos.style.display = 'none';
             }
        }
    }
}


// ========================
// EVENT LISTENERS PRINCIPALES
// ========================
document.addEventListener("DOMContentLoaded", async function() {
    // Cargar nombre de usuario
    const nombreUsuario = localStorage.getItem("nombreUsuario");
    if (nombreUsuario) {
        document.getElementById("usuarioNombre").textContent = nombreUsuario;
    }

    // Ocultar la sección de detalles del pedido y pago al inicio
    const seccionProductosPedidos = document.getElementById('seccionProductosPedidos');
    if (seccionProductosPedidos) {
        seccionProductosPedidos.style.display = 'none';
    }

    // Ocultar la sección de opciones de billetera digital al inicio
    const billeteraDigitalOptionsDiv = document.createElement('div');
    billeteraDigitalOptionsDiv.id = 'billeteraDigitalOptions';
    billeteraDigitalOptionsDiv.style.display = 'none'; // Inicialmente oculto
    billeteraDigitalOptionsDiv.innerHTML = `
        <label>
            <input type="checkbox" id="nequi" name="billetera" value="nequi"> Nequi
        </label>
        <label>
            <input type="checkbox" id="daviplata" name="billetera" value="daviplata"> Daviplata
        </label>
    `;
    // Insertar este nuevo div DENTRO del form-group del método de pago, o justo después
    const metodoPagoGroup = document.querySelector('.form-group .material-icons ~ select#metodoPago').closest('.form-group');
    if (metodoPagoGroup) {
        metodoPagoGroup.insertAdjacentElement('afterend', billeteraDigitalOptionsDiv);
    }


    // 1. Cargar mesas con pedidos pendientes
    await cargarMesasEnSelect();

    // 2. Cargar métodos de pago
    await cargarMetodosPagoEnSelect();

    // Event listener para salir
    document.getElementById("btnSalir").addEventListener("click", salir);

    // Event listener para la selección de mesa
    const selectMesa = document.getElementById('mesa');
    if (selectMesa) {
        selectMesa.addEventListener('change', async function() {
            // El valor de la opción es ahora el id_pedido, no el id_mesa
            idPedidoSeleccionado = this.value; 
            console.log('ID de Pedido seleccionado:', idPedidoSeleccionado);

            if (idPedidoSeleccionado) {
                // Mostrar la sección de detalles del pedido y pago
                if (seccionProductosPedidos) {
                    seccionProductosPedidos.style.display = 'block';
                }
                
                // Obtener y mostrar detalles del pedido
                const detalle = await obtenerDetallePedido(idPedidoSeleccionado);
                if (detalle) {
                    pedidoActualDetalles = detalle.productos; // Guardar los productos del pedido
                    totalPedidoMesa = detalle.totalPedido; // Guardar el total
                    document.getElementById('totalPedido').value = formatter.format(totalPedidoMesa); // Actualizar el input total
                    mostrarDetallePedidoEnTabla(detalle); // Renderizar la tabla de productos

                    // Resetear monto pagado y cambio
                    document.getElementById('montoPagado').value = '';
                    document.getElementById('cambio').value = formatter.format(0);
                    // Ocultar opciones de billetera digital si estaban visibles
                    document.getElementById('metodoPago').value = ''; // Resetear el select
                    manejarBilleteraDigital(); // Ocultar si es necesario
                } else {
                    // Si no se pudieron obtener los detalles, ocultar la sección
                    if (seccionProductosPedidos) {
                        seccionProductosPedidos.style.display = 'none';
                    }
                    mostrarMensaje('No se pudieron cargar los detalles del pedido para la mesa seleccionada.', 'error');
                }

            } else {
                if (seccionProductosPedidos) {
                    seccionProductosPedidos.style.display = 'none';
                }
                document.getElementById('tablaPedido').innerHTML = '<tr><td colspan="3">Selecciona una mesa para ver los productos.</td></tr>';
                document.getElementById('totalPedido').value = formatter.format(0);
                document.getElementById('montoPagado').value = '';
                document.getElementById('cambio').value = formatter.format(0);
                idPedidoSeleccionado = null; // Reiniciar el ID del pedido seleccionado
                totalPedidoMesa = 0; // Reiniciar el total
                pedidoActualDetalles = {}; // Limpiar detalles
            }
        });
    }

    // Event listener para el método de pago
    document.getElementById('metodoPago').addEventListener('change', manejarBilleteraDigital);

    // Event listener para el monto pagado (para calcular el cambio)
    document.getElementById('montoPagado').addEventListener('input', calcularCambio);

    // Event listener para el botón de confirmar pago
    document.getElementById('btnConfirmarPago').addEventListener('click', confirmarPagoFinal);

    calcularCambio(); 
});