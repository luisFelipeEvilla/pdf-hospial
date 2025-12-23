import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFService } from './pdf-service.js';
import type { FichaTecnica, ConfiguracionEntidad } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE_URL = 'https://inventario-v3.mrconsulting.com.co/public/fichatecnica/generate';

export interface LaravelSession {
  xsrfToken?: string;
  laravelSession?: string;
}

export async function fetchFichaTecnica(
  codigo: string,
  session?: LaravelSession
): Promise<FichaTecnica> {
  const url = `${API_BASE_URL}?codigo=${encodeURIComponent(codigo)}`;
  
  // Cookies hardcodeadas según el curl proporcionado
  const xsrfToken = session?.xsrfToken || 'yJpdiI6IlNVOEZETkw5UTZIcXNkV0tsXC9pbHFBPT0iLCJ2YWx1ZSI6IkRWRnNmc2hVejJXcld2N05PQm1RWXQwVHlJUmd3YWduRzFiM2VKVTljTUNJUk5VQ0lMM2phQWNZWUhoZWx0S2YxeFcyUjJzZldBNHJLbmxOUTBWVmhBPT0iLCJtYWMiOiI4NjI4NWZlMDNmYWNmM2E5NjZkYzhlOWQxMTNiZjM1YmQzZmU5ZDNiNDkzYTM5NTY5YzhlOTZkMWU5ZDY3NWM5In0%3D';
  const laravelSession = session?.laravelSession || 'eyJpdiI6IkpYZWhqQU1kaDhuYmo5Y2ZxbVNFZEE9PSIsInZhbHVlIjoiSzR6d3htTkJSRHc0a2JuT3FVek5GQVFremRWXC9UQmh2K25yRndRXC93YjlDSUxwc2g2eFI1RkowTWZlVFY1c3VmVmVlSVFcL1FCU0craUY0aDg0cU13Unc9PSIsIm1hYyI6ImVhNjhlMDg4YmMwMzc3M2JmNjE3NzJjNmE0YWM2M2ZhNzIxZGU2ZmNiM2NiZTE1YTJlMDM1OWNjZWFhOTM4MjkifQ%3D%3D';
  
  // Construir el header de cookies
  const cookies = [
    `XSRF-TOKEN=${xsrfToken}`,
    `laravel_session=${laravelSession}`
  ];
  
  try {
    const headers: Record<string, string> = {
      'accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    };
    
    if (cookies.length > 0) {
      headers['cookie'] = cookies.join('; ');
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Si la respuesta es un array, tomar el primer elemento
    if (Array.isArray(data)) {
      if (data.length === 0) {
        throw new Error(`No se encontraron datos para el código: ${codigo}`);
      }
      return data[0] as FichaTecnica;
    }
    
    // Si es un objeto directo, retornarlo
    return data as FichaTecnica;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al obtener datos de la API: ${error.message}`);
    }
    throw error;
  }
}

async function main() {
  // Obtener el código del producto desde los argumentos de línea de comandos
  const codigo = process.argv[2];
  
  if (!codigo) {
    console.error('Error: Debes proporcionar un código de producto');
    console.error('Uso: pnpm run dev <codigo>');
    console.error('Ejemplo: pnpm run dev HUB-12325');
    process.exit(1);
  }

  console.log(`Obteniendo datos para el código: ${codigo}...`);

  try {
    // Obtener datos de la API (las cookies se obtienen de variables de entorno)
    const ficha = await fetchFichaTecnica(codigo);

    // Configuración de la entidad
    const config: ConfiguracionEntidad = {
      nombre: 'E.S.E. Hospital Universitario Julio Méndez Barreneche',
      nit: '891.780.185-2',
    };

    // Crear servicio PDF
    const pdfService = new PDFService(config);

    // Generar PDF
    await pdfService.generatePDF(ficha);

    // Guardar el PDF
    const outputPath = join(
      __dirname,
      '..',
      `ficha-tecnica-${ficha.codigo || ficha.id}.pdf`
    );
    const doc = pdfService.getDocument();
    const stream = createWriteStream(outputPath);

    doc.pipe(stream);
    doc.end();

    stream.on('finish', () => {
      console.log(`PDF generado exitosamente: ${outputPath}`);
    });

    stream.on('error', (error) => {
      console.error('Error al generar PDF:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Función para generar PDF desde código de producto
export async function generarPDFPorCodigo(
  codigo: string,
  config: ConfiguracionEntidad,
  outputPath: string,
  session?: LaravelSession
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Obtener datos de la API
      const ficha = await fetchFichaTecnica(codigo, session);

      const pdfService = new PDFService(config);
      await pdfService.generatePDF(ficha);

      const doc = pdfService.getDocument();
      const stream = createWriteStream(outputPath);

      doc.pipe(stream);
      doc.on('end', () => {
        resolve();
      });
      doc.on('error', (error) => {
        reject(error);
      });
      stream.on('error', (error) => {
        reject(error);
      });
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Función para generar PDF desde datos externos (mantener compatibilidad)
export async function generarPDF(
  ficha: FichaTecnica,
  config: ConfiguracionEntidad,
  outputPath: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfService = new PDFService(config);
      await pdfService.generatePDF(ficha);

      const doc = pdfService.getDocument();
      const stream = createWriteStream(outputPath);

      doc.pipe(stream);
      doc.on('end', () => {
        resolve();
      });
      doc.on('error', (error) => {
        reject(error);
      });
      stream.on('error', (error) => {
        reject(error);
      });
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('index.ts')) {
  main();
}
