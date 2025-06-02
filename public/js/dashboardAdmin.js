// ========================
// CONSTANTES Y CONFIGURACIÓN
// ========================
const RUTAS = {
  USUARIOS: "ModificacionUsuario.html",
  SEDES: "SedesActuales.html",
  MESAS: "MesasCreadas.html",
  INVENTARIO: "ProductosCreados.html",
  REPORTES: "GeneraReportes.html",
  LOGIN: "../index.html" 
};

// ========================
// FUNCIONES DE NAVEGACIÓN
// ========================
function redirigirA(ruta) {
  window.location.href = ruta;
}

function salir() {
  // Limpiar datos sensibles (opcional para MVP)
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
  redirigirA(RUTAS.LOGIN);
}

// ========================
// INICIALIZACIÓN
// ========================
document.addEventListener("DOMContentLoaded", function() {
  // 1. Mostrar nombre de usuario
  const nombreUsuario = localStorage.getItem("nombreUsuario");
  if (nombreUsuario) {
    document.getElementById("usuarioNombre").textContent = nombreUsuario;
  }

  // 2. Asignar eventos a los botones
  document.getElementById("btnUsuarios").addEventListener("click", () => redirigirA(RUTAS.USUARIOS));
  document.getElementById("btnSedes").addEventListener("click", () => redirigirA(RUTAS.SEDES));
  document.getElementById("btnMesas").addEventListener("click", () => redirigirA(RUTAS.MESAS));
  document.getElementById("btnInventario").addEventListener("click", () => redirigirA(RUTAS.INVENTARIO));
  document.getElementById("btnReportes").addEventListener("click", () => redirigirA(RUTAS.REPORTES));
  document.getElementById("btnSalir").addEventListener("click", salir);

  // 3. (Opcional) Restringir acceso a módulos por rol
  const rol = localStorage.getItem("rol");
  if (rol !== "Administrador") {
    document.getElementById("btnUsuarios").style.display = "none";
    
    if (rol === "Cajero") {
      document.getElementById("btnInventario").style.display = "none";
    }
  }
});