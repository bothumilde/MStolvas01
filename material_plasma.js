    function showLoading(text = 'Cargando...') {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    const loadingText = overlay.querySelector('.loading-text');
    if (loadingText) loadingText.textContent = text;
    overlay.classList.add('active');
    document.body.classList.add('loading');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
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


let selectMode = false;
let selectedItems = [];

async function loadUnidades(searchParams = {}) {
    showLoading('Cargando unidades...');
    try {
        let url = '/api/unidades';

        if (searchParams.estructura || searchParams.mes) {
            const queryParams = new URLSearchParams();
            if (searchParams.estructura) queryParams.append('estructura', searchParams.estructura);
            if (searchParams.mes) queryParams.append('mes', searchParams.mes);
            url = `/api/unidades/search?${queryParams.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const unidades = await response.json();
        const container = document.getElementById('cards-container');
        container.innerHTML = '';

        if (!Array.isArray(unidades)) {
            throw new Error('Expected an array of unidades, got: ' + JSON.stringify(unidades));
        }

        unidades.forEach(unidad => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.unidadId = unidad.id;
            card.dataset.estructura = unidad.estructura;
            card.dataset.cliente = unidad.cliente;

            const idDiv = document.createElement('div');
            idDiv.className = 'id-large';
            idDiv.textContent = unidad.id;

            const fechaDiv = document.createElement('div');
            fechaDiv.className = 'fecha';
            fechaDiv.textContent = unidad.fecha ? new Date(unidad.fecha).toLocaleDateString('es-ES') : '';

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
            card.appendChild(fechaDiv);
            card.appendChild(titleDiv);
            card.appendChild(clienteDiv);

            card.addEventListener('click', async (e) => {
                if (e.target.type === 'checkbox') return; // Don't toggle materials if clicking checkbox
                
                // Don't toggle if clicking on materials list or its children
                if (e.target.closest('.materials-list')) return;

                if (card.isLoadingMaterials) return; // Prevent multiple simultaneous loads

                const existingMaterials = card.querySelector('.materials-list');
                if (existingMaterials) {
                    existingMaterials.remove();
                } else {
                    card.isLoadingMaterials = true;
                    showLoading('Cargando materiales...');
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
                            materialsDiv.classList.add('show');
                        } else {
                            const ul = document.createElement('ul');
                            materiales.forEach(material => {
                                const li = document.createElement('li');
                                li.textContent = material.nombre;
                                if (selectMode) {
                                    const cb = document.createElement('input');
                                    cb.type = 'checkbox';
                                    cb.className = 'material-checkbox';
                                    cb.addEventListener('change', (e) => {
                                        e.stopPropagation();
                                        const materialName = li.textContent;
                                        const unidadId = card.dataset.unidadId;
                                        const estructura = card.dataset.estructura;
                                        const cliente = card.dataset.cliente;
                                        if (e.target.checked) {
                                            selectedItems.push({ type: 'material', name: materialName, unidadId: unidadId, estructura: estructura, cliente: cliente });
                                        } else {
                                            selectedItems = selectedItems.filter(item => !(item.type === 'material' && item.name === materialName && item.unidadId === unidadId));
                                        }
                                    });
                                    li.insertBefore(cb, li.firstChild);
                                }
                                ul.appendChild(li);
                            });
                            materialsDiv.appendChild(ul);
                            setTimeout(() => {
                                materialsDiv.classList.add('show');
                            }, 10);
                        }
                        card.appendChild(materialsDiv);
                    } catch (error) {
                        console.error('Error loading materials:', error);
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error';
                        errorDiv.textContent = 'Error loading materials: ' + error.message;
                        card.appendChild(errorDiv);
                    } finally {
                        card.isLoadingMaterials = false;
                        hideLoading();
                    }
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
    } finally {
        hideLoading();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    loadUnidades();
    initFloatingButton();

    const selectBtn = document.getElementById('select-btn');

    const exportBtn = document.getElementById('export-btn');
    const searchInput = document.getElementById('search-input');
    const monthFilter = document.getElementById('month-filter');

    selectBtn.addEventListener('click', () => {
        selectMode = !selectMode;
        selectedItems = [];
        selectBtn.textContent = selectMode ? 'Cancelar Selección' : 'Seleccionar';
        exportBtn.style.display = selectMode ? 'block' : 'none';
        updateCheckboxes();
    });

    exportBtn.addEventListener('click', exportToExcel);

    // Search functionality
    function performSearch() {
        const searchParams = {
            estructura: searchInput.value.trim(),
            mes: monthFilter.value
        };
        loadUnidades(searchParams);
    }

    searchInput.addEventListener('input', debounce(performSearch, 300));
    monthFilter.addEventListener('change', performSearch);
});

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function updateCheckboxes() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const checkbox = card.querySelector('.card-checkbox');
        if (selectMode) {
            if (!checkbox) {
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.className = 'card-checkbox';
                cb.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const unidadId = card.dataset.unidadId;
                    const estructura = card.dataset.estructura;
                    const cliente = card.dataset.cliente;
                    if (e.target.checked) {
                        // Only add materials, not the unidad itself
                        const materialsList = card.querySelector('.materials-list');
                        if (materialsList) {
                            const matCheckboxes = materialsList.querySelectorAll('.material-checkbox');
                            matCheckboxes.forEach(cb => {
                                cb.checked = true;
                                const materialName = cb.parentElement.textContent;
                                selectedItems.push({ type: 'material', name: materialName, unidadId: unidadId, estructura: estructura, cliente: cliente });
                            });
                        }
                    } else {
                        // Only remove materials when unchecking, not unidad
                        selectedItems = selectedItems.filter(item => !(item.type === 'material' && item.unidadId === unidadId));
                        const materialsList = card.querySelector('.materials-list');
                        if (materialsList) {
                            const matCheckboxes = materialsList.querySelectorAll('.material-checkbox');
                            matCheckboxes.forEach(cb => cb.checked = false);
                        }
                    }
                });
                card.insertBefore(cb, card.firstChild);
            }
        } else {
            if (checkbox) {
                checkbox.remove();
            }
        }

        const materialsList = card.querySelector('.materials-list');
        if (materialsList) {
            const lis = materialsList.querySelectorAll('li');
            lis.forEach(li => {
                const matCheckbox = li.querySelector('.material-checkbox');
                if (selectMode) {
                    if (!matCheckbox) {
                        const cb = document.createElement('input');
                        cb.type = 'checkbox';
                        cb.className = 'material-checkbox';
                        cb.addEventListener('change', (e) => {
                            e.stopPropagation();
                            const materialName = li.textContent;
                            const unidadId = card.dataset.unidadId;
                            const estructura = card.dataset.estructura;
                            const cliente = card.dataset.cliente;
                            if (e.target.checked) {
                                selectedItems.push({ type: 'material', name: materialName, unidadId: unidadId, estructura: estructura, cliente: cliente });
                            } else {
                                selectedItems = selectedItems.filter(item => !(item.type === 'material' && item.name === materialName && item.unidadId === unidadId));
                            }
                        });
                        li.insertBefore(cb, li.firstChild);
                    }
                } else {
                    if (matCheckbox) {
                        matCheckbox.remove();
                    }
                }
            });
        }
    });
}

function exportToExcel() {
    if (selectedItems.length === 0) {
        alert('No hay elementos seleccionados para exportar.');
        return;
    }

    const data = selectedItems.map(item => ({
        ID: item.id || item.unidadId,
        ESTRUCTURA: item.estructura,
        CLIENTE: item.cliente || '',
        ITEM: item.name || item.data || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'output');
    XLSX.writeFile(wb, 'output.xlsx');
}