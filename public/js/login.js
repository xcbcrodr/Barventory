document.addEventListener("DOMContentLoaded", () => {
  // **COMENTA O ELIMINA LA LÓGICA DE CARGA DE ROLES** (Correctamente comentado para el login actual)
  /* fetch("/auth/roles") ... */

  // **COMENTA O ELIMINA LA LÓGICA DE CARGA DE SEDES** (Correctamente comentado para el login actual)
  /* fetch("/auth/sedes") ... */
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const identificacion = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identificacion, password }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("rol", data.rol); // CAMBIO: era data.user.rol
      localStorage.setItem("nombreUsuario", data.nombreUsuario); // CAMBIO: era data.user.nombre

      // Redirige según el rol
      if (data.rol === "Administrador") { // CAMBIO: era data.user.rol
        window.location.href = "/admin/dashboardAdmin.html";
      } else if (data.rol === "Mesero") { // CAMBIO: era data.user.rol
        window.location.href = "/mesero/dashboardMesero.html";
      } else if (data.rol === "Cajero") { // CAMBIO: era data.user.rol
        window.location.href = "/cajero/dashboardCajero.html";
      } else {
        alert("Rol no autorizado");
      }
    } else {
      alert(data.message || "Login incorrecto");
    }
  } catch (error) {
    console.error("Error en el login:", error);
    alert("Error al conectar con el servidor.");
  }
});