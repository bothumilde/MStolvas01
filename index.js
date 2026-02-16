const express=require('express');
const sql=require('mssql');
const {DefaultAzureCredential}=require('@azure/identity');

const app=express();
const port=process.env.PORT || 3000;

app.use(express.static('.'));
app.use(express.json());

const credential = new DefaultAzureCredential();

const config={
    server:process.env.DB_SERVER,
    database:process.env.DB_DATABASE,
    port:1433,
    authentication:{
        type:'azure-active-directory-msi-app-service'
    },
    options:{
        encrypt:true,
        trustServerCertificate:false
    }
};

app.get('/', async(req,res)=>{
    let sqlStatus="";
    let sqlVersion="";

    try{
        let pool=await sql.connect(config);
        let result=await pool.request().query("SELECT @@VERSION as version");
        sqlVersion=result.recordset[0].version;
        sqlStatus="✅ Nexo con Azure SQL: OK";
    } catch(err){
        sqlStatus="❌ Error de conexión: " + err.message;
        sqlVersion="No disponible"
    }

    res.send(`
        <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Microservicio Tolvas</title>
                <link rel="stylesheet" href="styles.css">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
            </head>
            <h2 class="form-title">🤓 Panel principal</h2>
            <body>
                <!-- Loading Overlay -->
                <div id="loading-overlay">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Cargando...</div>
                </div>
                
                <div class="search-container">
                    <input type="text" id="search-input" class="search-input" placeholder="Buscar por estructura...">

                    <select id="month-filter" class="month-filter">
                        <option value="">Todos los meses</option>
                        <option value="1">Enero</option>
                        <option value="2">Febrero</option>
                        <option value="3">Marzo</option>
                        <option value="4">Abril</option>
                        <option value="5">Mayo</option>
                        <option value="6">Junio</option>
                        <option value="7">Julio</option>
                        <option value="8">Agosto</option>
                        <option value="9">Septiembre</option>
                        <option value="10">Octubre</option>
                        <option value="11">Noviembre</option>
                        <option value="12">Diciembre</option>
                    </select>
                </div>
                <button id="select-btn" class="select-btn">Seleccionar</button>

                <div id="cards-container"></div>
                <button id="export-btn" class="export-btn" style="display:none;">Exportar a Excel</button>
                <script src="material_plasma.js"></script>
                
                <!-- Floating Action Button -->
                <a href="agregar_unidad.html" class="floating-btn" id="fab-add" title="Agregar Unidad">+</a>
                
                <div class="footer-info">
                    <p class="status-badge">${sqlStatus}</p>
                    <p>Versión detectada: <br> ${sqlVersion}</p>
                </div>
            </body>
        </html>`);

    });

app.get('/api/capacidades', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT id, descripcion FROM capacidad ORDER BY id');
        res.json(result.recordset);
    } catch (err) {
        console.error("Error detallado:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/unidades', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query(`
            SELECT TOP 10 
            u.id, u.estructura, c.descripcion, 
            u.cliente, u.fecha, u.X1, u.SC, u.chasis4x2, 
            u.chasis6x4, u.chasis8x4, u.CC, 
            u.CHD, u.BBC, u.CDF
            FROM unidad u
            LEFT JOIN capacidad c ON u.capacidad = c.id
            ORDER BY u.id DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error detallado:", err);
    }
});


app.get('/api/unidades/search', async (req, res) => {
    const { estructura, mes } = req.query;
    try {
        let pool = await sql.connect(config);
        let query = `
            SELECT 
            u.id, u.estructura, c.descripcion, 
            u.cliente, u.fecha, u.X1, u.SC, u.chasis4x2, 
            u.chasis6x4, u.chasis8x4, u.CC, 
            u.CHD, u.BBC, u.CDF
            FROM unidad u
            LEFT JOIN capacidad c ON u.capacidad = c.id
            WHERE 1=1
        `;

        
        if (estructura) {
            query += ` AND u.estructura LIKE '%${estructura}%'`;
        }
        
        if (mes) {
            query += ` AND MONTH(u.fecha) = ${mes}`;
        }
        
        query += ` ORDER BY u.id DESC`;
        
        let result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error detallado:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/materiales/:unidadId', async (req, res) => {
    const unidadId = req.params.unidadId;
    try {
        let pool = await sql.connect(config);
        let unidadResult = await pool.request()
            .input('id', sql.Int, unidadId)
            .query('SELECT * FROM unidad WHERE id = @id');
        if (unidadResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Unidad not found' });
        }
        const unidad = unidadResult.recordset[0];
        let whereClauses = [];
        const bits = ['X1', 'SC', 'chasis4x2', 'chasis6x4', 'chasis8x4', 'CC', 'CHD', 'BBC', 'CDF'];
        bits.forEach(bit => {
            if (unidad[bit] === true || unidad[bit] === 1) {
                whereClauses.push(`${bit} = 1`);
            }
        });
        let query = 'SELECT * FROM material_plasma';
        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }
        let result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error detallado:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/unidades', async (req, res) => {
    try {
        const { estructura, cliente, capacidad, X1, SC, chasis4x2, chasis6x4, chasis8x4, CC, CHD, BBC, CDF } = req.body;
        
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('estructura', sql.Int, estructura)
            .input('cliente', sql.NVarChar(1000), cliente)
            .input('capacidad', sql.Int, capacidad)
            .input('X1', sql.Bit, X1)
            .input('SC', sql.Bit, SC)
            .input('chasis4x2', sql.Bit, chasis4x2)
            .input('chasis6x4', sql.Bit, chasis6x4)
            .input('chasis8x4', sql.Bit, chasis8x4)
            .input('CC', sql.Bit, CC)
            .input('CHD', sql.Bit, CHD)
            .input('BBC', sql.Bit, BBC)
            .input('CDF', sql.Bit, CDF)
            .query(`
                INSERT INTO unidad (estructura, cliente, capacidad, X1, SC, chasis4x2, chasis6x4, chasis8x4, CC, CHD, BBC, CDF)
                OUTPUT INSERTED.id
                VALUES (@estructura, @cliente, @capacidad, @X1, @SC, @chasis4x2, @chasis6x4, @chasis8x4, @CC, @CHD, @BBC, @CDF)
            `);
        
        res.status(201).json({ id: result.recordset[0].id, message: 'Unidad creada exitosamente' });
    } catch (err) {
        console.error("Error detallado:", err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});


app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});
