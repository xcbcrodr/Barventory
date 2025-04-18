document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const usersTableBody = document.getElementById('usersTableBody');
    const searchInput = document.getElementById('searchInput');
    const roleFilter = document.getElementById('roleFilter');
    const sedeFilter = document.getElementById('sedeFilter');
    const addUserBtn = document.getElementById('addUserBtn');
    const userModal = document.getElementById('userModal');
    const userForm = document.getElementById('userForm');
    const closeModal = document.querySelector('.close-modal');
    const btnCancel = document.querySelector('.btn-cancel');

    // Datos de ejemplo (reemplazar con llamadas a la API)
    let users = [
        { id: 1, name: 'Juan Pérez', role: 'admin', sede: 'chia' },
        { id: 2, name: 'María García', role: 'cajero', sede: 'bogota' },
        { id: 3, name: 'Carlos López', role: 'mesero', sede: 'cota' }
    ];

    // Función para renderizar la tabla de usuarios
    function renderUsersTable(filteredUsers = users) {
        usersTableBody.innerHTML = '';
        filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${getRoleName(user.role)}</td>
                <td>${getSedeName(user.sede)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    }

    // Función para obtener el nombre del rol
    function getRoleName(role) {
        const roles = {
            'admin': 'Administrador',
            'cajero': 'Cajero',
            'mesero': 'Mesero'
        };
        return roles[role] || role;
    }

    // Función para obtener el nombre de la sede
    function getSedeName(sede) {
        const sedes = {
            'chia': 'Chía',
            'bogota': 'Bogotá',
            'cota': 'Cota'
        };
        return sedes[sede] || sede;
    }

    // Función para filtrar usuarios
    function filterUsers() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedRole = roleFilter.value;
        const selectedSede = sedeFilter.value;

        const filteredUsers = users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm);
            const matchesRole = !selectedRole || user.role === selectedRole;
            const matchesSede = !selectedSede || user.sede === selectedSede;
            return matchesSearch && matchesRole && matchesSede;
        });

        renderUsersTable(filteredUsers);
    }

    // Función para abrir el modal
    function openModal(user = null) {
        const modalTitle = document.getElementById('modalTitle');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const userSede = document.getElementById('userSede');

        if (user) {
            modalTitle.textContent = 'Editar Usuario';
            userName.value = user.name;
            userRole.value = user.role;
            userSede.value = user.sede;
        } else {
            modalTitle.textContent = 'Nuevo Usuario';
            userName.value = '';
            userRole.value = '';
            userSede.value = '';
        }

        userModal.style.display = 'block';
    }

    // Función para cerrar el modal
    function closeModalHandler() {
        userModal.style.display = 'none';
    }

    // Función para editar usuario
    window.editUser = function(id) {
        const user = users.find(u => u.id === id);
        if (user) {
            openModal(user);
        }
    };

    // Función para eliminar usuario
    window.deleteUser = function(id) {
        if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
            users = users.filter(user => user.id !== id);
            renderUsersTable();
        }
    };

    // Event Listeners
    searchInput.addEventListener('input', filterUsers);
    roleFilter.addEventListener('change', filterUsers);
    sedeFilter.addEventListener('change', filterUsers);
    addUserBtn.addEventListener('click', () => openModal());
    closeModal.addEventListener('click', closeModalHandler);
    btnCancel.addEventListener('click', closeModalHandler);

    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (event) => {
        if (event.target === userModal) {
            closeModalHandler();
        }
    });

    // Manejar el envío del formulario
    userForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const userName = document.getElementById('userName').value;
        const userRole = document.getElementById('userRole').value;
        const userSede = document.getElementById('userSede').value;
        
        // Aquí iría la lógica para guardar/actualizar el usuario
        // Por ahora solo actualizamos el array local
        const userId = document.getElementById('modalTitle').textContent === 'Nuevo Usuario' 
            ? users.length + 1 
            : users.find(u => u.name === userName)?.id;

        if (userId) {
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex] = { id: userId, name: userName, role: userRole, sede: userSede };
            } else {
                users.push({ id: userId, name: userName, role: userRole, sede: userSede });
            }
        }

        renderUsersTable();
        closeModalHandler();
    });

    // Renderizar la tabla inicial
    renderUsersTable();
}); 