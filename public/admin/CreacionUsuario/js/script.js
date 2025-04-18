document.addEventListener('DOMContentLoaded', () => {
    const createUserForm = document.getElementById('createUserForm');
    const documentIdInput = document.getElementById('documentId');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const roleSelect = document.getElementById('role');
    const sedeSelect = document.getElementById('sede');
    const btnCancel = document.querySelector('.btn-cancel');

    // Validación de solo números en el campo de documento
    documentIdInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Validación de nombre de usuario (sin espacios y caracteres especiales)
    usernameInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    });

    // Función para mostrar mensajes de error
    function showError(element, message) {
        // Eliminar mensaje de error anterior si existe
        const existingError = element.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Crear y mostrar nuevo mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ff3333';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '0.3rem';
        element.parentElement.appendChild(errorDiv);
        element.style.borderColor = '#ff3333';
    }

    // Función para limpiar mensajes de error
    function clearError(element) {
        const errorDiv = element.parentElement.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
        element.style.borderColor = '';
    }

    // Validaciones en tiempo real
    const validateField = (element, condition, message) => {
        if (!condition) {
            showError(element, message);
            return false;
        }
        clearError(element);
        return true;
    };

    // Validaciones específicas para cada campo
    documentIdInput.addEventListener('blur', () => {
        validateField(
            documentIdInput,
            documentIdInput.value.length >= 8,
            'El número de identidad debe tener al menos 8 dígitos'
        );
    });

    usernameInput.addEventListener('blur', () => {
        validateField(
            usernameInput,
            usernameInput.value.length >= 4,
            'El nombre de usuario debe tener al menos 4 caracteres'
        );
    });

    passwordInput.addEventListener('blur', () => {
        validateField(
            passwordInput,
            passwordInput.value.length >= 6,
            'La contraseña debe tener al menos 6 caracteres'
        );
    });

    // Manejar el envío del formulario
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar todos los campos antes de enviar
        const isDocumentValid = validateField(
            documentIdInput,
            documentIdInput.value.length >= 8,
            'El número de identidad debe tener al menos 8 dígitos'
        );

        const isUsernameValid = validateField(
            usernameInput,
            usernameInput.value.length >= 4,
            'El nombre de usuario debe tener al menos 4 caracteres'
        );

        const isPasswordValid = validateField(
            passwordInput,
            passwordInput.value.length >= 6,
            'La contraseña debe tener al menos 6 caracteres'
        );

        const isRoleValid = validateField(
            roleSelect,
            roleSelect.value !== '',
            'Debe seleccionar un rol'
        );

        const isSedeValid = validateField(
            sedeSelect,
            sedeSelect.value !== '',
            'Debe seleccionar una sede'
        );

        if (isDocumentValid && isUsernameValid && isPasswordValid && isRoleValid && isSedeValid) {
            try {
                // Crear objeto con los datos del usuario
                const userData = {
                    documentId: documentIdInput.value,
                    username: usernameInput.value,
                    password: passwordInput.value,
                    role: roleSelect.value,
                    sede: sedeSelect.value
                };

                // Aquí iría la llamada a tu API para crear el usuario
                // Por ahora solo mostraremos los datos en consola
                console.log('Datos del usuario a crear:', userData);

                // Simulación de respuesta exitosa
                showSuccessMessage();
                
                // Limpiar el formulario
                createUserForm.reset();
                
                // Redirigir después de 2 segundos (ajusta la URL según tu necesidad)
                setTimeout(() => {
                    window.location.href = '/admin/users';
                }, 2000);

            } catch (error) {
                console.error('Error al crear usuario:', error);
                showError(createUserForm, 'Error al crear el usuario. Por favor, intente nuevamente.');
            }
        }
    });

    // Función para mostrar mensaje de éxito
    function showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = 'Usuario creado exitosamente';
        successDiv.style.backgroundColor = '#4CAF50';
        successDiv.style.color = 'white';
        successDiv.style.padding = '1rem';
        successDiv.style.borderRadius = '4px';
        successDiv.style.marginTop = '1rem';
        successDiv.style.textAlign = 'center';
        
        createUserForm.appendChild(successDiv);
    }

    // Manejar el botón de cancelar
    btnCancel.addEventListener('click', () => {
        // Redirigir a la página anterior o a la lista de usuarios
        window.location.href = '/admin/users';
    });

    // Prevenir el envío del formulario al presionar Enter
    createUserForm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });
}); 