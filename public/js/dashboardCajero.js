// public/js/dashboardCajero.js

const RUTAS = {
    LOGIN: "../index.html"
};

const API_URL = 'http://localhost:3000'; // Ajusta esto a la URL base de tu backend si es diferente

// ========================
// VARIABLES GLOBALES
// ========================
let pedidoActualDetalles = {};
let totalPedidoMesa = 0;
let idPedidoSeleccionado = null;

const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CO', {
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

async function obtenerMesasPendientes() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/auth/cajero/mesas-pendientes`, {
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
        return mesas;
    } catch (error) {
        console.error('Error al obtener las mesas con pedidos pendientes:', error);
        mostrarMensaje(`Error al cargar las mesas: ${error.message || 'Inténtalo de nuevo.'}`, 'error');
        return [];
    }
}

async function obtenerDetallePedido(idPedido) {
    console.log('DEBUG FRONTEND: Intentando obtener detalles para idPedido:', idPedido);

    if (!idPedido || isNaN(parseInt(idPedido))) {
        console.error('DEBUG FRONTEND: ID de pedido es nulo, undefined o no numérico antes de la llamada a la API.');
        return null;
    }

    try {
        const token = localStorage.getItem('token');
        console.log('DEBUG FRONTEND: Token obtenido:', token ? 'sí' : 'no', 'para pedido:', idPedido);
        const requestUrl = `${API_URL}/auth/cajero/pedidos/${idPedido}`;
        console.log(`DEBUG FRONTEND: URL de la API a la que se hará fetch: ${requestUrl}`);

        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('DEBUG FRONTEND: Respuesta recibida del servidor. Status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DEBUG FRONTEND: Error RAW del servidor al obtener detalle del pedido. Cuerpo:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: `Respuesta no JSON o inválida: ${errorText.substring(0, 100)}...` };
            }
            throw new Error(errorData.error || `HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        console.log('DEBUG FRONTEND: Datos parseados del pedido recibidos del servidor:', data);
        return data;
    } catch (error) {
        console.error('DEBUG FRONTEND: Error CATCHED al obtener los detalles del pedido:', error);
        throw error;
    }
}

async function obtenerMetodosPago() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/auth/cajero/metodos-pago`, {
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

async function procesarPago(dataPago) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/auth/cajero/procesar-pago`, {
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

async function cargarMesasEnSelect() {
    const selectMesa = document.getElementById('mesa');
    if (!selectMesa) {
        console.error("DEBUG FRONTEND: El elemento SELECT con id 'mesa' no fue encontrado.");
        return;
    }

    const mesas = await obtenerMesasPendientes();
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
            console.log(`DEBUG FRONTEND: Procesando mesa ${mesa.nombre}. idPedidoActual del backend: ${mesa.idPedidoActual}`);
            if (mesa.idPedidoActual) {
                const option = document.createElement('option');
                option.value = mesa.idPedidoActual;
                option.dataset.idMesa = mesa.id;
                option.textContent = `Mesa ${mesa.nombre} (Pedido ID: ${mesa.idPedidoActual})`;
                selectMesa.appendChild(option);
            } else {
                console.warn(`DEBUG FRONTEND: La Mesa ${mesa.nombre} no tiene un idPedidoActual válido o está vacío. No se añadirá al select.`);
            }
        });
        document.getElementById('btnConfirmarPago').disabled = false;
    }
}

function mostrarDetallePedidoEnTabla(detallePedido) {
    const tablaPedidoBody = document.getElementById('tablaPedido');
    tablaPedidoBody.innerHTML = '';

    if (!detallePedido || !detallePedido.productos || detallePedido.productos.length === 0) {
        tablaPedidoBody.innerHTML = '<tr><td colspan="3">No hay productos en este pedido.</td></tr>';
        return;
    }

    detallePedido.productos.forEach(item => {
        console.log("DEBUG FRONTEND: Item de producto en mostrarDetallePedidoEnTabla:", item);
        const nombreProducto = item.nombreproducto || 'Nombre no disponible';
        const row = tablaPedidoBody.insertRow();
        row.insertCell(0).textContent = nombreProducto;
        row.insertCell(1).textContent = item.cantidad;
        row.insertCell(2).textContent = formatter.format(item.subtotal);
    });
}

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

function manejarBilleteraDigital() {
    const metodoPagoSelect = document.getElementById('metodoPago');
    const billeteraDigitalOptionsDiv = document.getElementById('billeteraDigitalOptions');
    const montoPagadoInput = document.getElementById('montoPagado');

    if (!billeteraDigitalOptionsDiv) {
        console.error("DEBUG FRONTEND: El div 'billeteraDigitalOptions' no fue encontrado.");
        return;
    }
    if (!montoPagadoInput) {
        console.error("DEBUG FRONTEND: El input 'montoPagado' no fue encontrado.");
        return;
    }

    const selectedOption = metodoPagoSelect.options[metodoPagoSelect.selectedIndex];
    const nombreMetodo = selectedOption ? selectedOption.dataset.nombreMetodo : '';

    const nequiCheckbox = document.getElementById('nequi');
    const daviplataCheckbox = document.getElementById('daviplata');

    // Lógica para billetera digital
    if (nombreMetodo === 'Billetera Digital') {
        billeteraDigitalOptionsDiv.style.display = 'block';
        montoPagadoInput.disabled = true; // Deshabilitar monto pagado para billetera digital
        montoPagadoInput.value = ''; // Limpiar el valor si se deshabilita
        document.getElementById('cambio').value = formatter.format(0); // Resetear el cambio

        // IMPORTANTE: Los listeners de los checkboxes para desmarcar el otro
        if (nequiCheckbox && daviplataCheckbox) {
            nequiCheckbox.onchange = function() {
                if (this.checked) {
                    daviplataCheckbox.checked = false;
                }
            };
            daviplataCheckbox.onchange = function() {
                if (this.checked) {
                    nequiCheckbox.checked = false;
                }
            };
        }
    } else {
        billeteraDigitalOptionsDiv.style.display = 'none';
        if (nequiCheckbox) nequiCheckbox.checked = false;
        if (daviplataCheckbox) daviplataCheckbox.checked = false;
        // Quitar los event listeners para evitar comportamiento no deseado cuando no es billetera digital
        if (nequiCheckbox) nequiCheckbox.onchange = null;
        if (daviplataCheckbox) daviplataCheckbox.onchange = null;
    }

    // Lógica para habilitar/deshabilitar el campo de monto pagado para 'Efectivo'
    if (nombreMetodo === 'Efectivo') {
        montoPagadoInput.disabled = false; // Habilitar el campo
    } else if (nombreMetodo !== 'Billetera Digital') {
        montoPagadoInput.disabled = true;
        montoPagadoInput.value = '';
        document.getElementById('cambio').value = formatter.format(0);
    }
    // Si no hay método seleccionado (opción por defecto), también deshabilitar
    if (!selectedOption || selectedOption.value === "") {
        montoPagadoInput.disabled = true;
        montoPagadoInput.value = '';
        document.getElementById('cambio').value = formatter.format(0);
    }

    // Controlar el botón de Confirmar Pago basado en la selección del método
    const btnConfirmarPago = document.getElementById('btnConfirmarPago');
    if (btnConfirmarPago) {
        if (idPedidoSeleccionado && nombreMetodo !== "") {
            btnConfirmarPago.disabled = false;
        } else {
            btnConfirmarPago.disabled = true;
        }
    }
}


function calcularCambio() {
    const montoPagadoInput = document.getElementById('montoPagado');
    const cambioInput = document.getElementById('cambio');
    const totalPedidoInput = document.getElementById('totalPedido');

    if (montoPagadoInput.disabled) {
        cambioInput.value = formatter.format(0);
        return;
    }

    const rawMontoPagado = montoPagadoInput.value.replace(/[^0-9]/g, '');
    const montoPagadoValor = parseFloat(rawMontoPagado);

    if (!isNaN(montoPagadoValor) && rawMontoPagado !== '') {
        montoPagadoInput.value = numberFormatter.format(montoPagadoValor);
    } else if (rawMontoPagado === '') {
        montoPagadoInput.value = '';
    }

    const totalPedidoValor = parseFloat(totalPedidoInput.value.replace(/[^0-9,-]+/g, "").replace(",", "."));

    let cambio = 0;
    if (!isNaN(montoPagadoValor) && montoPagadoValor >= totalPedidoValor) {
        cambio = montoPagadoValor - totalPedidoValor;
    } else if (isNaN(montoPagadoValor) || rawMontoPagado === '') {
        cambio = 0;
    } else if (montoPagadoValor < totalPedidoValor) {
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
        setTimeout(() => {
            errorMessageElement.style.display = 'none';
        }, 5000);
    } else {
        console.log(`[${tipo.toUpperCase()}]: ${mensaje}`);
        alert(mensaje);
    }
}

async function confirmarPagoFinal() {
    if (!idPedidoSeleccionado) {
        mostrarMensaje('Por favor, selecciona una mesa con un pedido pendiente.', 'warning');
        return;
    }

    const metodoPagoSelect = document.getElementById('metodoPago');
    const idMetodoPagoSeleccionado = metodoPagoSelect.value;
    const nombreMetodoSeleccionado = metodoPagoSelect.options[metodoPagoSelect.selectedIndex]?.dataset.nombreMetodo;

    const montoPagadoInput = document.getElementById('montoPagado');
    let montoPagadoParaEnvio = 0;
    const totalPedido = parseFloat(document.getElementById('totalPedido').value.replace(/[^0-9,-]+/g, "").replace(",", "."));

    if (!idMetodoPagoSeleccionado || idMetodoPagoSeleccionado === "") {
        mostrarMensaje('Por favor, selecciona un método de pago.', 'warning');
        return;
    }

    let detalleMetodoPago = null;
    let referenciaTransaccion = null; // Si implementas un campo para esto en el futuro

    if (nombreMetodoSeleccionado === 'Efectivo') {
        const montoIngresadoPorCajero = parseFloat(montoPagadoInput.value.replace(/[^0-9]/g, ''));
        if (isNaN(montoIngresadoPorCajero) || montoIngresadoPorCajero <= 0) {
            mostrarMensaje('Para pago en Efectivo, por favor ingresa un monto válido.', 'warning');
            return;
        }
        if (montoIngresadoPorCajero < totalPedido) {
            mostrarMensaje('El monto pagado en Efectivo es menor que el total del pedido.', 'warning');
            return;
        }
        montoPagadoParaEnvio = montoIngresadoPorCajero;
        detalleMetodoPago = 'Efectivo';
    } else if (nombreMetodoSeleccionado === 'Billetera Digital') {
        const nequiCheckbox = document.getElementById('nequi');
        const daviplataCheckbox = document.getElementById('daviplata');

        if (!nequiCheckbox.checked && !daviplataCheckbox.checked) {
            mostrarMensaje('Para Billetera Digital, por favor selecciona Nequi o Daviplata.', 'warning');
            return;
        }
        // Ya validamos que solo uno esté marcado en manejarBilleteraDigital, pero por seguridad, re-validamos.
        if (nequiCheckbox.checked && daviplataCheckbox.checked) {
            mostrarMensaje('Por favor, selecciona solo Nequi o Daviplata, no ambos.', 'warning');
            return;
        }

        montoPagadoParaEnvio = totalPedido; // Para billetera digital, el monto es el total del pedido
        if (nequiCheckbox.checked) {
            detalleMetodoPago = 'Nequi';
        } else if (daviplataCheckbox.checked) {
            detalleMetodoPago = 'Daviplata';
        }
    } else {
        // Para cualquier otro método de pago (ej. PSE, Tarjeta de Crédito, etc.)
        montoPagadoParaEnvio = totalPedido;
        detalleMetodoPago = nombreMetodoSeleccionado; // Usar el nombre del método seleccionado
    }


    const dataPago = {
        idPedido: idPedidoSeleccionado,
        pagos: [
            {
                idMetodoPago: parseInt(idMetodoPagoSeleccionado),
                monto: montoPagadoParaEnvio,
                detalleMetodoPago: detalleMetodoPago,
                referenciaTransaccion: referenciaTransaccion
            }
        ]
    };

    const resultadoPago = await procesarPago(dataPago);

    if (resultadoPago) {
        idPedidoSeleccionado = null;
        totalPedidoMesa = 0;
        pedidoActualDetalles = {};

        document.getElementById('totalPedido').value = formatter.format(0);
        document.getElementById('montoPagado').value = '';
        document.getElementById('cambio').value = formatter.format(0);
        document.getElementById('metodoPago').value = '';
        document.getElementById('tablaPedido').innerHTML = '<tr><td colspan="3">Selecciona una mesa para ver los productos.</td></tr>';

        const billeteraDigitalOptionsDiv = document.getElementById('billeteraDigitalOptions');
        if (billeteraDigitalOptionsDiv) {
            billeteraDigitalOptionsDiv.style.display = 'none';
            document.getElementById('nequi').checked = false;
            document.getElementById('daviplata').checked = false;
            // Remover los onchange events para evitar fugas de memoria o comportamientos inesperados
            document.getElementById('nequi').onchange = null;
            document.getElementById('daviplata').onchange = null;
        }

        await cargarMesasEnSelect();

        const seccionProductosPedidos = document.getElementById('seccionProductosPedidos');
        if (seccionProductosPedidos) {
            const mesasDisponibles = await obtenerMesasPendientes();
            if (mesasDisponibles.length === 0) {
                seccionProductosPedidos.style.display = 'none';
            }
        }
        const montoPagadoInput = document.getElementById('montoPagado');
        if (montoPagadoInput) {
            montoPagadoInput.disabled = true;
        }
        // Deshabilitar botón de confirmar pago después de un pago exitoso
        const btnConfirmarPago = document.getElementById('btnConfirmarPago');
        if (btnConfirmarPago) {
            btnConfirmarPago.disabled = true;
        }
    }
}


// ========================
// EVENT LISTENERS PRINCIPALES
// ========================
document.addEventListener("DOMContentLoaded", async function() {
    const nombreUsuario = localStorage.getItem("nombreUsuario");
    if (nombreUsuario) {
        document.getElementById("usuarioNombre").textContent = nombreUsuario;
    }

    const seccionProductosPedidos = document.getElementById('seccionProductosPedidos');
    if (seccionProductosPedidos) {
        seccionProductosPedidos.style.display = 'none';
    }

    let billeteraDigitalOptionsDiv = document.getElementById('billeteraDigitalOptions');
    if (!billeteraDigitalOptionsDiv) {
        billeteraDigitalOptionsDiv = document.createElement('div');
        billeteraDigitalOptionsDiv.id = 'billeteraDigitalOptions';
        billeteraDigitalOptionsDiv.innerHTML = `
            <label>
                <input type="checkbox" id="nequi" name="billetera" value="nequi"> Nequi
            </label>
            <label>
                <input type="checkbox" id="daviplata" name="daviplata" value="daviplata"> Daviplata
            </label>
        `;
        const metodoPagoSelect = document.getElementById('metodoPago');
        if (metodoPagoSelect && metodoPagoSelect.parentNode) {
            metodoPagoSelect.parentNode.appendChild(billeteraDigitalOptionsDiv);
        } else {
            console.warn("DEBUG FRONTEND: No se pudo encontrar el elemento padre del select 'metodoPago' para insertar 'billeteraDigitalOptionsDiv'.");
            document.body.appendChild(billeteraDigitalOptionsDiv);
        }
    }
    billeteraDigitalOptionsDiv.style.display = 'none';

    const montoPagadoInput = document.getElementById('montoPagado');
    if (montoPagadoInput) {
        montoPagadoInput.disabled = true;
    }

    // Deshabilitar el botón de confirmar pago al inicio
    const btnConfirmarPago = document.getElementById('btnConfirmarPago');
    if (btnConfirmarPago) {
        btnConfirmarPago.disabled = true;
    }


    await cargarMesasEnSelect();
    await cargarMetodosPagoEnSelect();

    document.getElementById("btnSalir").addEventListener("click", salir);

    const selectMesa = document.getElementById('mesa');
    if (selectMesa) {
        selectMesa.addEventListener('change', async function() {
            idPedidoSeleccionado = this.value;
            console.log('DEBUG FRONTEND: ID de Pedido seleccionado del dropdown:', idPedidoSeleccionado);

            if (idPedidoSeleccionado) {
                if (seccionProductosPedidos) {
                    seccionProductosPedidos.style.display = 'block';
                }

                try {
                    const detalle = await obtenerDetallePedido(idPedidoSeleccionado);
                    if (detalle) {
                        pedidoActualDetalles = detalle.productos;
                        totalPedidoMesa = detalle.totalPedido;
                        document.getElementById('totalPedido').value = formatter.format(totalPedidoMesa);
                        mostrarDetallePedidoEnTabla(detalle);

                        document.getElementById('montoPagado').value = '';
                        document.getElementById('cambio').value = formatter.format(0);
                        document.getElementById('metodoPago').value = '';
                        manejarBilleteraDigital(); // Re-evaluar el estado del campo de monto pagado y opciones de billetera
                    } else {
                        console.warn("DEBUG FRONTEND: La función obtenerDetallePedido devolvió null o un objeto vacío.");
                        if (seccionProductosPedidos) {
                            seccionProductosPedidos.style.display = 'none';
                        }
                        mostrarMensaje('No se pudieron cargar los detalles del pedido para la mesa seleccionada.', 'error');
                    }
                } catch (error) {
                    console.error("DEBUG FRONTEND: Error al obtener o procesar el detalle del pedido en el listener:", error);
                    mostrarMensaje(`Error al cargar los detalles del pedido: ${error.message || 'Error desconocido.'}`, 'error');
                    if (seccionProductosPedidos) {
                        seccionProductosPedidos.style.display = 'none';
                    }
                }

            } else {
                if (seccionProductosPedidos) {
                    seccionProductosPedidos.style.display = 'none';
                }
                document.getElementById('tablaPedido').innerHTML = '<tr><td colspan="3">Selecciona una mesa para ver los productos.</td></tr>';
                document.getElementById('totalPedido').value = formatter.format(0);
                document.getElementById('montoPagado').value = '';
                document.getElementById('cambio').value = formatter.format(0);
                idPedidoSeleccionado = null;
                totalPedidoMesa = 0;
                pedidoActualDetalles = {};
                if (montoPagadoInput) {
                    montoPagadoInput.disabled = true;
                }
            }
            // Controlar el botón de Confirmar Pago al cambiar la mesa
            manejarBilleteraDigital(); // Llama esto para que evalúe también el botón de pago al cambiar la mesa.
        });
    }

    document.getElementById('metodoPago').addEventListener('change', manejarBilleteraDigital);

    if (montoPagadoInput) {
        montoPagadoInput.addEventListener('input', calcularCambio);
    } else {
        console.error("DEBUG FRONTEND: El input con id 'montoPagado' no fue encontrado.");
    }

    document.getElementById('btnConfirmarPago').addEventListener('click', confirmarPagoFinal);

    calcularCambio(); // Realiza un cálculo inicial para asegurar que el cambio se muestre como 0
});