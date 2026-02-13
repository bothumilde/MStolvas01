document.addEventListener('DOMContentLoaded', () => {
    const formContainer = document.getElementById('form-container');
    
    // Create form HTML
    formContainer.innerHTML = `
        <div class="form-container">
            <h2 class="form-title">Crear nueva unidad</h2>
            <form id="unidad-form">
                <div class="form-group">
                    <label for="estructura">Estructura:</label>
                    <input type="number" id="estructura" name="estructura" required class="form-input" placeholder="Ingrese el número de estructura">
                </div>
                
                <div class="form-group">
                    <label for="cliente">Cliente:</label>
                    <input type="text" id="cliente" name="cliente" required maxlength="1000" class="form-input" placeholder="Ingrese el nombre del cliente">
                </div>
                
                <div class="form-group">
                    <label for="tipo">Tipo:</label>
                    <select id="tipo" name="tipo" required class="form-select">
                        <option value="">Seleccione el tipo</option>
                        <option value="X1">X1</option>
                        <option value="SC">SC</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="chasis">Chasis:</label>
                    <select id="chasis" name="chasis" required class="form-select">
                        <option value="">Seleccione el chasis</option>
                        <option value="chasis4x2">4x2</option>
                        <option value="chasis6x4">6x4</option>
                        <option value="chasis8x4">8x4</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="compuerta">Compuerta:</label>
                    <select id="compuerta" name="compuerta" required class="form-select">
                        <option value="">Seleccione la compuerta</option>
                        <option value="CC">CC</option>
                        <option value="CHD">CHD</option>
                        <option value="BBC">BBC</option>
                        <option value="CDF">CDF</option>
                    </select>
                </div>
                
                <button type="submit" class="submit-btn">Registrar Unidad</button>
            </form>
            <div id="message" class="message"></div>
        </div>
    `;

    // Handle form submission
    const form = document.getElementById('unidad-form');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const estructura = document.getElementById('estructura').value;
        const cliente = document.getElementById('cliente').value;
        const tipo = document.getElementById('tipo').value;
        const chasis = document.getElementById('chasis').value;
        const compuerta = document.getElementById('compuerta').value;

        // Build data object with bit fields
        const formData = {
            estructura: parseInt(estructura),
            cliente: cliente,
            X1: tipo === 'X1' ? 1 : 0,
            SC: tipo === 'SC' ? 1 : 0,
            chasis4x2: chasis === 'chasis4x2' ? 1 : 0,
            chasis6x4: chasis === 'chasis6x4' ? 1 : 0,
            chasis8x4: chasis === 'chasis8x4' ? 1 : 0,
            CC: compuerta === 'CC' ? 1 : 0,
            CHD: compuerta === 'CHD' ? 1 : 0,
            BBC: compuerta === 'BBC' ? 1 : 0,
            CDF: compuerta === 'CDF' ? 1 : 0
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
        }
    });
});
