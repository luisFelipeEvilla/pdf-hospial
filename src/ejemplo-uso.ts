import { createWriteStream } from 'fs';
import { PDFService } from './pdf-service.js';
import type { FichaTecnica, ConfiguracionEntidad } from './types.js';

/**
 * Ejemplo de uso del servicio de generación de PDFs
 */
export async function ejemploUso() {
  // Configuración de la entidad
  const config: ConfiguracionEntidad = {
    nombre: 'Asociación de Bananeros del Magdalena y La Guajira',
    nit: '891.780.185-2',
  };

  // Ejemplo de datos de ficha técnica
  const ficha: FichaTecnica = {
    id: '45537',
    codigo: 'HUB-12325',
    codigo_antiguo: 'No Registra',
    placa_actual: null,
    ubicacion: 'Hospitalizacion Medicina Interna 5°Piso',
    estado: '5', // 1-5, donde 5 es muy bueno
    titularidad: '1', // 1 = Propio
    numero_factura: null,
    factura_escaneada: null,
    mes: '11',
    anio: '2025',
    costo: null,
    vida_util: null,
    avaluo: null,
    marca: 'No Registra',
    modelo: 'No Registra',
    serial: 'No Registra',
    color: 'Negro',
    proveedor: null,
    cilindraje: null,
    placa_vehicular: null,
    numero_motor: null,
    numero_chasis: null,
    observacion: 'En Cuerina',
    nombre_general: 'Sofa Reclinable',
    fecha_adquisicion: null,
    valor_adquisicion: null,
    funcionamiento: null,
    id_dependencia: '1065',
    id_unidad_funcional: '4',
    id_centro_costo: '80',
    id_responsable: null,
    id_subcategoria: '485',
    id_usuario_creacion: '271',
    created_at: '2025-11-28 15:44:31',
    updated_at: '2025-11-28 16:58:11',
    deleted_at: null,
    contable: '1',
    id_linea: '4',
    id_grupo: '5',
    id_subgrupo: '19',
    fecha_puesta_servicio: null,
    maneja_iva: '0',
    porcentaje_iva: null,
    numero_garantia: null,
    aplica_depreciacion: '1',
    vida_util_niif: null,
    valor_salvamento_niif: null,
    depreciacion_por_componentes: '0',
    importado: '0',
    cotizado: '0',
    subcategoria: {
      id: '485',
      id_categoria: '13',
      nombre: 'Sofa Reclinable',
      codigo_sub_categoria: '212-0073',
      categoria: {
        id: '13',
        nombre: 'EQUIPOS Y MAQ. DE OFICINA',
        id_cliente: '131',
      },
    },
    responsable: {
      id: '123',
      nombre: 'Jose Francisco Zuñiga Cotes',
    },
    fotos: [
      {
        id: '37567',
        nombre: '53020.jpg',
        id_producto: '45537',
      },
      {
        id: '37568',
        nombre: '53021.jpg',
        id_producto: '45537',
      },
    ],
    cotizaciones: [
      {
        id: '1',
        numero_cotizacion: '1',
        avaluo: '459900',
      },
      {
        id: '2',
        numero_cotizacion: '2',
        avaluo: '326059',
      },
      {
        id: '3',
        numero_cotizacion: '3',
        avaluo: '291029',
      },
    ],
    grupo: {
      id: '5',
      nombre: 'MUEBLES Y ENCERES Y EQUIPO DE OFICINA',
      id_linea: '4',
      codigo_linea: '03',
      vida_util_niif_dias: '3650',
    },
    dependencia: {
      id: '1065',
      nombre: 'HOSPITALIZACION MEDICINA INTERNA 5°PISO HUJMB',
      video: null,
      id_piso: '5',
      id_sucursal: '3',
      id_consecutivo_codigo: '1',
      deleted_at: null,
      id_unidad_funcional: null,
    },
  };

  // Crear instancia del servicio
  const pdfService = new PDFService(config);

  // Generar el PDF
  await pdfService.generatePDF(ficha);

  // Guardar el PDF
  const outputPath = `ejemplo-ficha-${ficha.codigo}.pdf`;
  const doc = pdfService.getDocument();
  const stream = createWriteStream(outputPath);

  doc.pipe(stream);
  doc.end();

  return new Promise<void>((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`PDF generado: ${outputPath}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

// Ejecutar ejemplo si se llama directamente
if (import.meta.url.endsWith(process.argv[1] || '')) {
  ejemploUso().catch(console.error);
}

