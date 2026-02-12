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
            </head>
            <body>
                <div id="cards-container"></div>
                <script src="material_plasma.js"></script>
                <div class="footer-info">
                    <p class="status-badge">${sqlStatus}</p>
                    <p>Versión detectada: <br> ${sqlVersion}</p>
                </div>
            </body>
        </html>`);
    });

app.get('/api/unidades', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query(`
            SELECT u.id, u.estructura, c.descripcion, u.cliente, u.X1, u.SC, u.chasis4x2, u.chasis6x4, u.chasis8x4, u.CC, u.CHD, u.BBC, u.CDF
            FROM unidad u
            JOIN capacidad c ON u.capacidad = c.id
            ORDER BY u.id DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error detallado:", err);
    }
});

app.get('/api/materiales/:unidadId', async (req, res) => {
    const unidadId = req.params.unidadId;
    try {
        let pool = await sql.connect(config);
        // Get the unidad
        let unidadResult = await pool.request()
            .input('id', sql.Int, unidadId)
            .query('SELECT * FROM unidad WHERE id = @id');
        if (unidadResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Unidad not found' });
        }
        const unidad = unidadResult.recordset[0];
        // Build where clauses for matching
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
app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});