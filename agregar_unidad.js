// Loading Overlay Functions
function showLoading(text = 'Cargando...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = overlay.querySelector('.loading-text');
    if (loadingText) loadingText.textContent = text;
    overlay.classList.add('active');
    document.body.classList.add('loading');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
    document.body.classList.remove('loading');
}

// Floating Button - Always Visible
function initFloatingButton() {
    const fab = document.getElementById('fab-add');
    if (!fab) return;
    
    // Ensure FAB is always visible
    fab.classList.remove('hidden');
}


// HTML inline para el formulario de agregar unidad
const formHTML = `
    <div class="form-container">
        <h2 class="form-title"> 📖 Registrar unidad</h2>
        <form id="unidad-form">
            <div class="form-group">
                <label for="estructura">Estructura:</label>
                <input type="number" id="estructura" name="estructura" min="1" step "1" required class="form-input" placeholder="Ingrese el número de estructura">
            </div>
            
            <div class="form-group">
                <label for="cliente">Cliente:</label>
                <input type="text" id="cliente" name="cliente" required maxlength="1000" class="form-input" placeholder="Ingrese el nombre del cliente">
            </div>
            
            <div class="form-group">
                <label for="capacidad">Capacidad:</label>
                <select id="capacidad" name="capacidad" required class="form-select">
                    <option value="">--Seleccione la capacidad--</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="tipo">Tipo:</label>

                <select id="tipo" name="tipo" required class="form-select">
                    <option value="">--Seleccione el tipo--</option>
                    <option value="X1">X1</option>
                    <option value="SC">SC</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="chasis">Chasis:</label>
                <select id="chasis" name="chasis" required class="form-select">
                    <option value="">--Seleccione el chasis--</option>
                    <option value="chasis4x2">4x2</option>
                    <option value="chasis6x4">6x4</option>
                    <option value="chasis8x4">8x4</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="compuerta">Compuerta:</label>
                <select id="compuerta" name="compuerta" required class="form-select">
                    <option value="">--Seleccione la compuerta--</option>
                    <option value="CC">CC</option>
                    <option value="CHD">CHD</option>
                    <option value="BBC">BBC</option>
                    <option value="CDF">CDF</option>
                </select>
            </div>
            
            <button type="submit" class="submit-btn">💾Grabar</button>
        </form>
        <div id="message" class="message"></div>
    </div>
`;

document.addEventListener('DOMContentLoaded', () => {
    const formContainer = document.getElementById('form-container');
    
    // Insertar HTML inline
    formContainer.innerHTML = formHTML;

    // Cargar capacidades desde la API
    async function loadCapacidades() {
        showLoading('Cargando...');
        try {
            const response = await fetch('/api/capacidades');

            if (response.ok) {
                const capacidades = await response.json();
                const select = document.getElementById('capacidad');
                capacidades.forEach(cap => {
                    const option = document.createElement('option');
                    option.value = cap.id;
                    option.textContent = cap.descripcion;
                    select.appendChild(option);
                });
            }
        } catch (err) {
            console.error('Error cargando capacidades:', err);
        } finally {
            hideLoading();
        }
    }

    
    loadCapacidades();

    // Configurar el manejador del formulario

    const form = document.getElementById('unidad-form');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading('Guardando unidad...');
        
        const estructura = document.getElementById('estructura').value;

        const cliente = document.getElementById('cliente').value;
        const capacidad = document.getElementById('capacidad').value;
        const tipo = document.getElementById('tipo').value;
        const chasis = document.getElementById('chasis').value;
        const compuerta = document.getElementById('compuerta').value;

        const formData = {
            estructura: parseInt(estructura),
            cliente: cliente,
            capacidad: parseInt(capacidad),
            X1: tipo === 'X1' ? 1 : null,
            SC: tipo === 'SC' ? 1 : null,
            chasis4x2: chasis === 'chasis4x2' ? 1 : null,
            chasis6x4: chasis === 'chasis6x4' ? 1 : null,
            chasis8x4: chasis === 'chasis8x4' ? 1 : null,
            CC: compuerta === 'CC' ? 1 : null,
            CHD: compuerta === 'CHD' ? 1 : null,
            BBC: compuerta === 'BBC' ? 1 : null,
            CDF: compuerta === 'CDF' ? 1 : null
        };



        try {
            const response = await fetch('/api/unidades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                messageDiv.textContent = '✅ Unidad agregada exitosamente con ID: ' + result.id;
                messageDiv.className = 'message success';
                form.reset();
            } else {
                const error = await response.json();
                messageDiv.textContent = '❌ Error: ' + (error.message || 'No se pudo agregar la unidad');
                messageDiv.className = 'message error';
            }
        } catch (err) {
            messageDiv.textContent = '❌ Error de conexión: ' + err.message;
            messageDiv.className = 'message error';
        } finally {
            hideLoading();
        }
    });
    
    // Initialize floating button
    initFloatingButton();
});