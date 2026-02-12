async function loadUnidades() {
    try {
        const response = await fetch('/api/unidades');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const unidades = await response.json();
        const container = document.getElementById('cards-container');

        if (!Array.isArray(unidades)) {
            throw new Error('Expected an array of unidades, got: ' + JSON.stringify(unidades));
        }

        unidades.forEach(unidad => {
            const card = document.createElement('div');
            card.className = 'card';

            const idDiv = document.createElement('div');
            idDiv.className = 'id-large';
            idDiv.textContent = unidad.id;

            const titleDiv = document.createElement('div');
            titleDiv.className = 'title';
            let title = `${unidad.estructura} ${unidad.descripcion}`;
            const bits = [];
            if (unidad.X1) bits.push('X1');
            if (unidad.SC) bits.push('SC');
            if (unidad.chasis4x2) bits.push('4x2');
            if (unidad.chasis6x4) bits.push('6x4');
            if (unidad.chasis8x4) bits.push('8x4');
            if (unidad.CC) bits.push('CC');
            if (unidad.CHD) bits.push('CHD');
            if (unidad.BBC) bits.push('BBC');
            if (unidad.CDF) bits.push('CDF');
            if (bits.length > 0) title += ' ' + bits.join(' ');
            titleDiv.textContent = title;

            const clienteDiv = document.createElement('div');
            clienteDiv.className = 'cliente';
            clienteDiv.textContent = unidad.cliente;

            card.appendChild(idDiv);
            card.appendChild(titleDiv);
            card.appendChild(clienteDiv);

            // Add click event to show matching materials
            card.addEventListener('click', async () => {
                // Remove any existing materials display
                const existingMaterials = card.querySelector('.materials-list');
                if (existingMaterials) {
                    existingMaterials.remove();
                }

                try {
                    const response = await fetch(`/api/materiales/${unidad.id}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const materiales = await response.json();

                    const materialsDiv = document.createElement('div');
                    materialsDiv.className = 'materials-list';
                    if (materiales.length === 0) {
                        materialsDiv.textContent = 'No matching materials found.';
                    } else {
                        const ul = document.createElement('ul');
                        materiales.forEach(material => {
                            const li = document.createElement('li');
                            li.textContent = material.nombre;
                            ul.appendChild(li);
                        });
                        materialsDiv.appendChild(ul);
                    }
                    card.appendChild(materialsDiv);
                } catch (error) {
                    console.error('Error loading materials:', error);
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error';
                    errorDiv.textContent = 'Error loading materials: ' + error.message;
                    card.appendChild(errorDiv);
                }
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading unidades:', error);
        const container = document.getElementById('cards-container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = 'Error loading unidades: ' + error.message;
        container.appendChild(errorDiv);
    }
}

document.addEventListener('DOMContentLoaded', loadUnidades);
