# TODO List - APP WEB 02 Modifications

## Tasks:
- [x] 1. Fix materials_list_show toggle behavior - prevent hiding when clicking on materials list or li elements
- [x] 2. Fix card_checkbox to only add materials to array (not unidad itself)
- [x] 3. Add "cliente" column to export data next to ESTRUCTURA
- [x] 4. Add fecha attribute to card (top right corner) - requires API update
- [x] 5. Create dynamic search endpoint and implement search bar with month filter

## Files Modified:
- [x] material_plasma.js
- [x] index.js
- [x] styles.css

## Summary of Changes:

### 1. materials_list_show toggle behavior (material_plasma.js)
- Added `e.target.closest('.materials-list')` check to prevent toggling when clicking on materials list or its children (li elements)

### 2. card_checkbox materials only (material_plasma.js)
- Modified card checkbox change handler to only add materials to selectedItems array
- Removed logic that added the unidad itself to the array
- Updated uncheck logic to only remove materials, not unidad

### 3. CLIENTE column in export (material_plasma.js)
- Modified `const data` in `exportToExcel()` to include `CLIENTE: item.cliente || ''` field
- Updated all selectedItems.push() calls to include cliente property

### 4. Fecha attribute on card (index.js, material_plasma.js, styles.css)
- Updated `/api/unidades` query to include `u.fecha` column
- Added fecha display in card creation (top right corner with absolute positioning)
- Added CSS styling for fecha with background color and positioning

### 5. Dynamic search with bar and month filter (index.js, material_plasma.js, styles.css)
- Created new API endpoint `/api/unidades/search` with estructura and mes parameters
- Added search input and month dropdown to HTML body
- Modified `loadUnidades()` to accept search parameters and use search endpoint when needed
- Added debounce function to limit API calls during typing
- Added event listeners for search input and month filter
- Added CSS styling for search container, input, and dropdown
