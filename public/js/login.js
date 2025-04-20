document.addEventListener("DOMContentLoaded", () => {
  fetch('/api/roles')
    .then(res => res.json())
    .then(data => {
      const rolSelect = document.getElementById('rol');
      data.forEach(r => {
        const option = document.createElement('option');
        option.value = r.nombre;
        option.textContent = r.nombre;
        rolSelect.appendChild(option);
      });
    });

  fetch('/api/sedes')
    .then(res => res.json())
    .then(data => {
      const sedeSelect = document.getElementById('sede');
      data.forEach(s => {
        const option = document.createElement('option');
        option.value = s.nombre;
        option.textContent = s.nombre;
        document.getElementById('sede').appendChild(option);
      });
    });
});
