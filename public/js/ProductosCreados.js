document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "http://localhost:3000/auth/productos";
    const tablaProducto = document.getElementById("tablaProducto");
    const productosContainer = document.querySelector('.productos-container');
    const searchInput = document.getElementById('buscarProducto');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim(); 
        filtrarProductos(searchTerm);
    });
    console.log("--> productosCreados.js: DOMContentLoaded ejecutado.");

    function mostrarMensaje(mensaje, esError = false) {
                const mensajeElement = document.createElement('div');
                mensajeElement.className = esError ? 'error-mensaje' : 'info-mensaje';
                mensajeElement.textContent = mensaje;
                const mensajeAnterior = productosContainer.querySelector('.error-mensaje, .info-mensaje');
                if (mensajeAnterior) mensajeAnterior.remove();
                productosContainer.prepend(mensajeElement);
        
                // Hacer que el mensaje desaparezca después de 3 segundos (3000 milisegundos)
                setTimeout(() => {
                    if (productosContainer.contains(mensajeElement)) {
                        mensajeElement.remove();
                    }
                }, 3000);
            }

        let listaProductos = []; 

        async function cargarProductos() {
            console.log("--> cargarProductos: Iniciando la petición GET.");
            try {
                const response = await fetch(API_URL, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                console.log("--> cargarProductos: Respuesta recibida:", response);
                const responseData = await response.json();
                console.log("--> cargarProductos: Datos JSON recibidos:", responseData);
        
                if (responseData && responseData.success && Array.isArray(responseData.data)) {
                    listaProductos = responseData.data; // Almacenar la lista de productos
                    mostrarProductos(listaProductos); // Mostrar todos los productos inicialmente
                } else {
                    console.error("--> cargarProductos: Formato de respuesta incorrecto:", responseData);
                    mostrarMensaje("Error al cargar productos: Formato de respuesta incorrecto", true);
                    tablaProducto.innerHTML = '<tr><td colspan="6">Error al cargar datos</td></tr>'; // Ajustar colspan según el número de columnas
                }
        
            } catch (error) {
                console.error("--> cargarProductos: Error en la petición:", error);
                mostrarMensaje(`Error al cargar productos: ${error.message}`, true);
                tablaProducto.innerHTML = '<tr><td colspan="6">Error al cargar datos</td></tr>'; // Ajustar colspan según el número de columnas
            }
        }
        
        function filtrarProductos(searchTerm) {
            const productosFiltrados = listaProductos.filter(producto => {
                // Verificar si el término de búsqueda coincide con alguna propiedad del producto (nombre, proveedor, etc.)
                return (
                    producto.nombre_p.toLowerCase().includes(searchTerm) ||
                    producto.proveedor_p.toLowerCase().includes(searchTerm) ||
                    String(producto.cantidad_p).toLowerCase().includes(searchTerm) ||
                    String(Number(producto.precio_p).toFixed(0)).toLowerCase().includes(searchTerm) ||
                    String(Number(producto.precio_v).toFixed(0)).toLowerCase().includes(searchTerm)
                    // Puedes agregar más propiedades aquí si deseas filtrar por ellas
                );
            });
            mostrarProductos(productosFiltrados); // Mostrar solo los productos filtrados
        }
      
      function mostrarProductos(productos) {
        console.log("--> mostrarProductos: Recibiendo productos:", productos); 
        tablaProducto.innerHTML = productos.map(crearFilaProducto).join('');
      
        tablaProducto.addEventListener('click', async (event) => {
                      const target = event.target;
                      const idProducto = target.dataset.id;
                  
                      if (target.classList.contains('btn-editar')) {
                        window.location.href = `EditarProducto.html?id=${idProducto}`;
                      } else if (target.classList.contains('btn-eliminar')) {
                        if (confirm('¿Estás seguro de eliminar esta producto?')) {
                          await eliminarProducto(idProducto, target); // <---- ¡Pasamos 'target' como 'botonEliminar'!
                        }
                      }
                    });
      }

      async function eliminarProducto(id, botonEliminar) {
        try {
          const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData?.error || 'Error al eliminar la producto';
            throw new Error(errorMessage);
          }
    
          mostrarMensaje('Producto eliminado correctamente');
    
          // Encuentra la fila del botón
          const filaEliminada = botonEliminar.closest("tr");
          if (filaEliminada) {
            filaEliminada.classList.add('fade-out');
            setTimeout(() => filaEliminada.remove(), 300);
          }
        } catch (error) {
          console.error("Error al eliminar:", error);
          mostrarMensaje(`Error al eliminar producto: ${error.message}`, true);
        }
      }
    
      cargarProductos();
    });

    function crearFilaProducto(producto) {
        const precioFormateado = Number(producto.precio_p).toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP', // Puedes cambiar a 'USD' u otra moneda si es necesario
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      
        const precioVentaFormateado = Number(producto.precio_v).toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      
        return `
        <tr id="producto-${producto.id}">
            <td>${producto.nombre_p}</td>
            <td>${precioFormateado}</td>
            <td>${precioVentaFormateado}</td>
            <td>${producto.cantidad_p}</td>
            <td>${producto.proveedor_p}</td>
            <td>${producto.nombre_sede}</td> <td>
                <button class="btn-editar" data-id="${producto.id}">✏️ Editar</button>
                <button class="btn-eliminar" data-id="${producto.id}">🗑️ Eliminar</button>
            </td>
        </tr>
    `;
      }