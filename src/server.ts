import express, { Request, Response } from 'express';
import { createWriteStream, readFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PDFService } from './pdf-service.js';
import type { ConfiguracionEntidad } from './types.js';
import { fetchFichaTecnica } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Configuración de la entidad
const config: ConfiguracionEntidad = {
  nombre: 'E.S.E. Hospital Universitario Julio Méndez Barreneche',
  nit: '891.780.185-2',
};

// Endpoint para generar PDF
app.post('/api/generate-pdf', async (req: Request, res: Response) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({
        error: 'El código del producto es requerido',
      });
    }

    console.log(`Generando PDF para el código: ${codigo}`);

    // Obtener datos de la API
    const ficha = await fetchFichaTecnica(codigo);

    // Crear servicio PDF
    const pdfService = new PDFService(config);
    await pdfService.generatePDF(ficha);

    // Generar nombre de archivo temporal
    const filename = `ficha-tecnica-${ficha.codigo || ficha.id}-${Date.now()}.pdf`;
    const outputPath = join(__dirname, '..', 'temp', filename);

    // Asegurar que el directorio temp existe
    try {
      mkdirSync(join(__dirname, '..', 'temp'), { recursive: true });
    } catch (error) {
      // El directorio ya existe, ignorar
    }

    // Guardar el PDF
    const doc = pdfService.getDocument();
    const stream = createWriteStream(outputPath);

    doc.pipe(stream);
    doc.end();

    // Esperar a que se complete la escritura
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => {
        resolve();
      });
      stream.on('error', reject);
    });

    // Leer el archivo y enviarlo como respuesta
    const pdfBuffer = readFileSync(outputPath);

    // Eliminar el archivo temporal
    unlinkSync(outputPath);

    // Enviar el PDF como respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ficha-tecnica-${ficha.codigo || ficha.id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({
      error: 'Error al generar el PDF',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

// Endpoint GET alternativo
app.get('/api/generate-pdf/:codigo', async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;

    if (!codigo) {
      return res.status(400).json({
        error: 'El código del producto es requerido',
      });
    }

    console.log(`Generando PDF para el código: ${codigo}`);

    // Obtener datos de la API
    const ficha = await fetchFichaTecnica(codigo);

    // Crear servicio PDF
    const pdfService = new PDFService(config);
    await pdfService.generatePDF(ficha);

    // Generar nombre de archivo temporal
    const filename = `ficha-tecnica-${ficha.codigo || ficha.id}-${Date.now()}.pdf`;
    const outputPath = join(__dirname, '..', 'temp', filename);

    // Asegurar que el directorio temp existe
    try {
      mkdirSync(join(__dirname, '..', 'temp'), { recursive: true });
    } catch (error) {
      // El directorio ya existe, ignorar
    }

    // Guardar el PDF
    const doc = pdfService.getDocument();
    const stream = createWriteStream(outputPath);

    doc.pipe(stream);
    doc.end();

    // Esperar a que se complete la escritura
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => {
        resolve();
      });
      stream.on('error', reject);
    });

    // Leer el archivo y enviarlo como respuesta
    const pdfBuffer = readFileSync(outputPath);

    // Eliminar el archivo temporal
    unlinkSync(outputPath);

    // Enviar el PDF como respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ficha-tecnica-${ficha.codigo || ficha.id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({
      error: 'Error al generar el PDF',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

// Endpoint de salud
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'pdf-hospital-service' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor PDF ejecutándose en http://localhost:${PORT}`);
  console.log(`Endpoints disponibles:`);
  console.log(`  POST /api/generate-pdf - Body: { "codigo": "HUB-12325" }`);
  console.log(`  GET  /api/generate-pdf/:codigo`);
  console.log(`  GET  /health`);
});

