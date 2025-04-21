document.addEventListener("DOMContentLoaded", () => {
  // Cargar roles
  fetch("/auth/roles")
    .then((res) => res.json())
    .then((data) => {
      const rolSelect = document.getElementById("rol");
      data.forEach((r) => {
        const option = document.createElement("option");
        option.value = r.id; // ← id del rol
        option.textContent = r.nombre; // ← nombre visible
        rolSelect.appendChild(option);
      });
    });

  // Cargar sedes
  fetch("/auth/sedes")
    .then((res) => res.json())
    .then((data) => {
      const sedeSelect = document.getElementById("sede");
      data.forEach((s) => {
        const option = document.createElement("option");
        option.value = s.id; // ← id de la sede
        option.textContent = s.nombre; // ← nombre visible
        sedeSelect.appendChild(option);
        //document.getElementById("sede").appendChild(option);
      });
    });
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const rol = parseInt(document.getElementById('rol').value);
  const sede = parseInt(document.getElementById('sede').value);

  try {
    const response = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, rol, sede }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("rol", data.user.rol); // "admin", "mesero", etc.
      localStorage.setItem("nombreUsuario", data.user.nombre);

      



      // Redirige según el rol
      if (
        /* `data.user.rol` is accessing the `rol` property of the `user` object within the `data`
      object. This property likely contains the role of the user who is logging in, such as
      "Administrador", "Mesero", or "Cajero". This role is then used to determine which
      dashboard page to redirect the user to after a successful login based on their role. */
        data.user.rol === "Administrador"
      ) {
        window.location.href = "/admin/dashboardAdmin.html";
      } else if (data.user.rol === "Mesero") {
        window.location.href = "/mesero/dashboardMesero.html";
      } else if (data.user.rol === "Cajero") {
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