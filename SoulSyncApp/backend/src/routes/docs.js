const express = require('express');
const router = express.Router();
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const openapiPath = path.join(__dirname, '../../openapi.yml');
const openapiDoc = YAML.load(openapiPath);

router.use('/swagger', swaggerUi.serve, swaggerUi.setup(openapiDoc));

router.get('/redoc', (req,res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SoulSync API Docs</title>
        <meta charset="utf-8"/>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </head>
      <body>
        <redoc spec-url='/openapi.yml'></redoc>
      </body>
    </html>`);
});



// Serve auto-generated OpenAPI spec
router.get('/openapi.json',(req,res)=>{
  res.sendFile(path.join(__dirname,'../../openapi.json'));
});

module.exports = router;
