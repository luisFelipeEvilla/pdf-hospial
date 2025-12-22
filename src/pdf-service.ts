import PDFDocument from 'pdfkit';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { FichaTecnica, ConfiguracionEntidad } from './types.js';

type PDFDoc = InstanceType<typeof PDFDocument>;

const BASE_IMAGE_URL = 'https://inventario-v3.mrconsulting.com.co/public/storage/fotos/';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PDFService {
  private doc: PDFDoc;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private lineHeight: number;
  private tableRowHeight: number;
  private config: ConfiguracionEntidad;

  // Colores modernos
  private readonly colors = {
    primary: '#2596be',
    primaryDark: '#1a7a9a',
    primaryLight: '#4db8d9',
    secondary: '#f8f9fa',
    accent: '#e3f2fd',
    text: '#212529',
    textLight: '#6c757d',
    border: '#dee2e6',
    borderLight: '#e9ecef',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    white: '#ffffff',
  };

  constructor(config: ConfiguracionEntidad) {
    this.config = config;
    this.doc = new PDFDocument({ 
      margin: 40, 
      size: 'LETTER',
      compress: true, // Habilitar compresión
      info: {
        Title: 'Ficha Técnica de Inventario',
        Author: this.config.nombre,
      }
    });
    this.pageWidth = 612; // Letter width in points
    this.pageHeight = 792; // Letter height in points
    this.margin = 40;
    this.currentY = this.margin;
    this.lineHeight = 20;
    this.tableRowHeight = 40; // Más espacio para mejor legibilidad
  }

  private formatCurrency(value: string | number | null): string {
    if (!value) return 'Sin registro';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'Sin registro';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  private getEstadoTexto(estado: string): string {
    const estadoNum = parseInt(estado);
    const estados = {
      1: 'Malo (1/5)',
      2: 'Regular (2/5)',
      3: 'Regular (3/5)',
      4: 'Bueno (4/5)',
      5: 'Muy Bueno (5/5)',
    };
    return estados[estadoNum as keyof typeof estados] || `Estado ${estado}`;
  }

  private getEstadoColor(estado: string): string {
    const estadoNum = parseInt(estado);
    const colors = {
      1: this.colors.danger,
      2: this.colors.warning,
      3: this.colors.warning,
      4: this.colors.success,
      5: this.colors.success,
    };
    return colors[estadoNum as keyof typeof colors] || this.colors.textLight;
  }

  private getTitularidadTexto(titularidad: string): string {
    return titularidad === '1' ? 'Propio' : 'Otro';
  }

  /**
   * Calcula la vida útil según el estado del producto
   * La vida útil base viene de grupo.vida_util_niif_dias
   * Cada estado representa un porcentaje de la vida útil original:
   * - Estado 1: 30% de la vida útil
   * - Estado 2: 50% de la vida útil
   * - Estado 3: 80% de la vida útil
   * - Estado 4: 90% de la vida útil
   * - Estado 5: 100% de la vida útil
   */
  private calcularVidaUtilSegunEstado(
    vidaUtilBase: string | null | undefined,
    estado: string
  ): string {
    if (!vidaUtilBase) {
      return 'Sin registro';
    }

    const vidaUtilDias = parseInt(vidaUtilBase);
    if (isNaN(vidaUtilDias) || vidaUtilDias <= 0) {
      return 'Sin registro';
    }

    const estadoNum = parseInt(estado);
    if (isNaN(estadoNum) || estadoNum < 1 || estadoNum > 5) {
      return `${vidaUtilDias} días`;
    }

    // Porcentajes de vida útil según el estado
    const porcentajesVidaUtil: Record<number, number> = {
      1: 0.3, // 30% de la vida útil
      2: 0.5, // 50% de la vida útil
      3: 0.8, // 80% de la vida útil
      4: 0.9, // 90% de la vida útil
      5: 1.0, // 100% de la vida útil
    };

    const porcentaje = porcentajesVidaUtil[estadoNum] || 0.5;
    const vidaUtilCalculada = Math.round(vidaUtilDias * porcentaje);

    return `${vidaUtilCalculada} días`;
  }

  private addHeader(): void {
    try {
      // Fondo decorativo sutil en la parte superior
      this.doc
        .rect(0, 0, this.pageWidth, 120)
        .fillColor(this.colors.accent)
        .opacity(0.3)
        .fill()
        .opacity(1);

      // Cargar el logo desde el archivo
      const logoPath = join(__dirname, '..', 'logo_hospital_3.png');
      const logoBuffer = readFileSync(logoPath);

      // Agregar el logo más pequeño, alineado a la derecha
      const logoHeight = 75;
      const logoWidth = 280;
      
      // Calcular posición X para alinear a la derecha
      const logoX = this.pageWidth - this.margin - logoWidth;
      const logoY = this.margin + 5;
      
      this.doc.image(logoBuffer, logoX, logoY, {
        width: logoWidth,
        height: logoHeight,
        fit: [logoWidth, logoHeight],
      });

      this.currentY += logoHeight - 20; // Reducido aún más el espacio entre logo y título

      // Título de la ficha con estilo moderno
      this.doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor(this.colors.text)
        .text('Ficha Técnica de Inventario', this.margin, this.currentY, {
          align: 'center',
          width: this.pageWidth - 2 * this.margin,
        });

      // Línea decorativa debajo del título
      const lineY = this.currentY + 30;
      const lineWidth = 200;
      const lineX = (this.pageWidth - lineWidth) / 2;
      
      this.doc
        .moveTo(lineX, lineY)
        .lineTo(lineX + lineWidth, lineY)
        .strokeColor(this.colors.primary)
        .lineWidth(3)
        .stroke();

      this.currentY = lineY + 20;
    } catch (error) {
      // Si no se puede cargar el logo, usar texto como fallback
      console.warn('No se pudo cargar el logo, usando texto como fallback:', error);
      this.doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#2E7D32') // Verde
        .text('ASBAMA', this.margin, this.currentY);
      this.currentY += 30;

      this.doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000') // Negro
        .text(
          'Asociación de Bananeros del Magdalena y La Guajira',
          this.margin,
          this.currentY
        );
      this.currentY += 25;

      // Título de la ficha alineado a la derecha
      this.doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Ficha Técnica de Inventario', this.pageWidth - this.margin, this.currentY - 55, {
          align: 'right',
          width: 250,
        });
      this.currentY += 20;
    }
  }

  private addTable(
    data: Array<{ label: string; value: string }>,
    columnWidths: [number, number] = [200, 350]
  ): void {
    const startX = this.margin;
    const tableWidth = columnWidths[0] + columnWidths[1];
    const rowHeight = 28;
    const borderRadius = 0; // No hay soporte nativo, pero mantenemos la estructura

    data.forEach((row, index) => {
      const y = this.currentY;

      // Fondo moderno para la etiqueta con gradiente sutil
      this.doc
        .rect(startX, y, columnWidths[0], rowHeight)
        .fillColor(this.colors.secondary)
        .fill();

      // Fondo blanco para el valor
      this.doc
        .rect(startX + columnWidths[0], y, columnWidths[1], rowHeight)
        .fillColor(this.colors.white)
        .fill();

      // Bordes sutiles y modernos
      this.doc
        .rect(startX, y, tableWidth, rowHeight)
        .strokeColor(this.colors.border)
        .lineWidth(0.5)
        .stroke();

      // Línea vertical sutil
      this.doc
        .moveTo(startX + columnWidths[0], y)
        .lineTo(startX + columnWidths[0], y + rowHeight)
        .strokeColor(this.colors.borderLight)
        .lineWidth(0.5)
        .stroke();

      // Calcular posición vertical centrada
      const textY = y + (rowHeight / 2) - 5;

      // Texto de la etiqueta con mejor tipografía
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(this.colors.text)
        .text(row.label, startX + 12, textY, {
          width: columnWidths[0] - 24,
          align: 'center',
        });

      // Texto del valor
      this.doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(this.colors.text)
        .text(row.value || 'Sin registro', startX + columnWidths[0] + 12, textY, {
          width: columnWidths[1] - 24,
          align: 'center',
        });

      this.currentY += rowHeight + 2; // Espaciado entre filas
    });
  }

  private addMultiColumnTable(
    headers: string[],
    rows: string[][],
    columnWidths: number[],
    customRowHeight?: number
  ): void {
    const startX = this.margin;
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const headerHeight = 38;
    const rowHeight = customRowHeight || this.tableRowHeight;

    // Encabezado moderno con gradiente sutil
    let x = startX;
    headers.forEach((header, index) => {
      // Fondo con gradiente sutil (simulado con color sólido más claro)
      this.doc
        .rect(x, this.currentY, columnWidths[index], headerHeight)
        .fillColor(this.colors.primary)
        .fill();

      // Borde sutil entre columnas
      if (index > 0) {
        this.doc
          .moveTo(x, this.currentY)
          .lineTo(x, this.currentY + headerHeight)
          .strokeColor(this.colors.primaryDark)
          .lineWidth(0.5)
          .stroke();
      }

      // Calcular posición vertical centrada para el header
      const headerTextY = this.currentY + (headerHeight / 2) - 5;
      
      this.doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(this.colors.white)
        .text(header, x + 5, headerTextY, {
          width: columnWidths[index] - 10,
          align: 'center',
        });

      x += columnWidths[index];
    });

    // Borde exterior del encabezado
    this.doc
      .rect(startX, this.currentY, tableWidth, headerHeight)
      .strokeColor(this.colors.primaryDark)
      .lineWidth(1)
      .stroke()
      .fillColor(this.colors.text); // Resetear color

    this.currentY += headerHeight;

    // Filas con estilo moderno
    rows.forEach((row, rowIndex) => {
      // Calcular la altura máxima necesaria para todas las celdas de esta fila
      let maxRowHeight = rowHeight;
      row.forEach((cell, index) => {
        const cellText = cell || 'Sin registro';
        const textHeight = this.doc.heightOfString(cellText, {
          width: columnWidths[index] - 20,
          align: 'center',
        });
        maxRowHeight = Math.max(maxRowHeight, textHeight + 20);
      });

      // Fondo alternado para mejor legibilidad
      const isEven = rowIndex % 2 === 0;
      const rowBgColor = isEven ? this.colors.white : this.colors.accent;

      x = startX;
      row.forEach((cell, index) => {
        // Fondo con color alternado
        this.doc
          .rect(x, this.currentY, columnWidths[index], maxRowHeight)
          .fillColor(rowBgColor)
          .fill();

        // Bordes sutiles
        this.doc
          .rect(x, this.currentY, columnWidths[index], maxRowHeight)
          .strokeColor(this.colors.border)
          .lineWidth(0.5)
          .stroke();

        if (index > 0) {
          this.doc
            .moveTo(x, this.currentY)
            .lineTo(x, this.currentY + maxRowHeight)
            .strokeColor(this.colors.borderLight)
            .lineWidth(0.5)
            .stroke();
        }

        // Calcular posición vertical centrada para el contenido mejorado
        const cellTextY = this.currentY + (maxRowHeight / 2) - 5;
        
        const cellValue = cell || 'Sin registro';
        
        // Texto centrado sin badges de color
        this.doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(this.colors.text)
          .text(cellValue, x + 10, cellTextY, {
            width: columnWidths[index] - 20,
            align: 'center',
          });

        x += columnWidths[index];
      });

      this.currentY += maxRowHeight + 1; // Espaciado sutil entre filas
    });
  }

  async generatePDF(ficha: FichaTecnica): Promise<PDFDoc> {
    // Resetear posición
    this.currentY = this.margin;

    // Encabezado
    this.addHeader();

    // Información de la entidad
    this.addTable([
      { label: 'ENTIDAD', value: this.config.nombre },
      { label: 'NIT', value: this.config.nit },
    ], [180, 372]);

    this.currentY += 15; // Espaciado mejorado

    // Información principal del inventario (con mayor altura de fila)
    this.addMultiColumnTable(
      ['CÓDIGO/PLACA', 'ELEMENTO', 'CATEGORÍA', 'DEPENDENCIA'],
      [
        [
          ficha.codigo || ficha.placa_actual || 'Sin registro',
          ficha.subcategoria.nombre,
          ficha.subcategoria?.categoria?.nombre || 'Sin registro',
          ficha.dependencia?.nombre || 'Sin registro',
        ],
      ],
      [138, 138, 138, 138], // Ancho original de columnas
      70 // Mayor altura para las filas de contenido
    );

    this.currentY += 8; // Reducido el margen vertical

    // Información secundaria
    this.addMultiColumnTable(
      ['MARCA', 'COLOR', 'ESTADO', 'UNIDAD FUNCIONAL'],
      [
        [
          ficha.marca || 'Sin registro',
          ficha.color || 'Sin registro',
          this.getEstadoTexto(ficha.estado),
          ficha.unidad_funcional?.nombre || 'Sin registro',
        ],
      ],
      [138, 138, 138, 138],
      70 // Mayor altura para las filas de contenido
    );

    this.currentY += 8; // Reducido el margen vertical

    // Información de responsable y titularidad
    this.addMultiColumnTable(
      ['RESPONSABLE', 'TITULARIDAD JURÍDICA', 'VIDA ÚTIL'],
      [
        [
          ficha.responsable?.nombre || 'Sin registro',
          this.getTitularidadTexto(ficha.titularidad),
          this.calcularVidaUtilSegunEstado(
            ficha.grupo?.vida_util_niif_dias || ficha.vida_util,
            ficha.estado
          ),
        ],
      ],
      [184, 184, 184]
    );

    this.currentY += 15;

    // Observación
    this.addTable([
      { label: 'OBSERVACIÓN', value: ficha.observacion || 'Sin observación' },
    ], [180, 372]);

    this.currentY += 10;

    // Sección de fotografías con estilo moderno
    // Siempre enviar las fotografías a la segunda página
    const pageCount = (this.doc as any).bufferedPageRange?.count || 1;
    if (pageCount < 2) {
      this.doc.addPage();
      this.currentY = this.margin;
    } else {
      this.currentY += 20;
    }
    
    // Encabezado moderno para fotografías
    const fotoHeaderHeight = 42;
    const fotoHeaderWidth = this.pageWidth - 2 * this.margin;
    
    // Fondo con gradiente sutil
    this.doc
      .rect(this.margin, this.currentY, fotoHeaderWidth, fotoHeaderHeight)
      .fillColor(this.colors.primary)
      .fill();
    
    // Línea decorativa superior
    this.doc
      .moveTo(this.margin, this.currentY)
      .lineTo(this.margin + fotoHeaderWidth, this.currentY)
      .strokeColor(this.colors.primaryLight)
      .lineWidth(3)
      .stroke();
    
    // Calcular posición vertical centrada para el header de fotografías
    const fotoHeaderTextY = this.currentY + (fotoHeaderHeight / 2) - 3;
    
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(this.colors.white)
      .text('FOTOGRAFÍAS', this.margin, fotoHeaderTextY, {
        width: fotoHeaderWidth,
        align: 'center',
      })
      .fillColor(this.colors.text); // Resetear color
    
    this.currentY += fotoHeaderHeight + 15;

    if (ficha.fotos && ficha.fotos.length > 0) {
      // Calcular dimensiones para imágenes en fila horizontal
      const availableWidth = this.pageWidth - 2 * this.margin;
      const imageCount = Math.min(ficha.fotos.length, 3); // Máximo 3 imágenes por fila
      const imageSpacing = 10; // Espaciado moderno entre imágenes
      const borderWidth = 3; // Ancho del borde
      const shadowOffset = 2; // Offset para sombra
      // Calcular ancho con espaciado y bordes
      const imageWidth = (availableWidth - (imageSpacing * (imageCount - 1)) - (borderWidth * 2 * imageCount)) / imageCount;
      const imageHeight = 240; // Altura aumentada para mejor visualización
      // Límites máximos para compresión (reducir tamaño de archivo)
      const maxImageWidth = 800;
      const maxImageHeight = 600;

      // Verificar si necesitamos una nueva página
      if (this.currentY + imageHeight > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      let currentX = this.margin;
      const startY = this.currentY;

      // Descargar todas las imágenes en paralelo para optimizar el rendimiento
      const imagePromises = ficha.fotos.map(async (foto) => {
        const imageUrl = `${BASE_IMAGE_URL}${foto.nombre}`;
        try {
          const response = await fetch(imageUrl, {
            signal: AbortSignal.timeout(10000), // Timeout de 10 segundos por imagen
          });
          if (response.ok) {
            const imageBuffer = await response.arrayBuffer();
            return {
              success: true,
              buffer: Buffer.from(imageBuffer),
              foto,
            };
          }
          return { success: false, foto };
        } catch (error) {
          return { success: false, foto, error };
        }
      });

      // Esperar todas las descargas en paralelo
      const imageResults = await Promise.all(imagePromises);

      // Procesar las imágenes descargadas
      for (let i = 0; i < imageResults.length; i++) {
        const result = imageResults[i];

        // Si hay más de 3 imágenes, crear nueva fila
        if (i > 0 && i % 3 === 0) {
          this.currentY += imageHeight + (borderWidth * 2) + imageSpacing + 10;
          currentX = this.margin;
          
          // Verificar si necesitamos nueva página
          if (this.currentY + imageHeight > this.pageHeight - this.margin) {
            this.doc.addPage();
            this.currentY = this.margin;
          }
        }

        if (result.success && result.buffer) {
          try {
            const buffer = result.buffer;

            // Sombra sutil detrás de la imagen
            this.doc
              .rect(currentX + shadowOffset, this.currentY + shadowOffset, 
                    imageWidth, imageHeight)
              .fillColor('#000000')
              .opacity(0.08)
              .fill()
              .opacity(1);
            
            // Borde decorativo alrededor de la imagen
            this.doc
              .rect(currentX - borderWidth, this.currentY - borderWidth, 
                    imageWidth + (borderWidth * 2), imageHeight + (borderWidth * 2))
              .strokeColor(this.colors.primary)
              .lineWidth(borderWidth)
              .stroke();

            // Agregar la imagen con compresión (ajustar tamaño si es muy grande)
            const finalImageWidth = Math.min(imageWidth, maxImageWidth);
            const finalImageHeight = Math.min(imageHeight, maxImageHeight);
            
            this.doc.image(buffer, currentX, this.currentY, {
              width: finalImageWidth,
              height: finalImageHeight,
              fit: [finalImageWidth, finalImageHeight],
              align: 'center',
            });

            currentX += imageWidth + imageSpacing;
          } catch (error) {
            // Si falla al procesar, mostrar placeholder
            this.doc
              .rect(currentX, this.currentY, imageWidth, imageHeight)
              .strokeColor('#CCCCCC')
              .lineWidth(1)
              .stroke();
            
            this.doc
              .fontSize(8)
              .font('Helvetica')
              .fillColor('#999999')
              .text(
                'Error al cargar',
                currentX,
                this.currentY + imageHeight / 2,
                {
                  width: imageWidth,
                  align: 'center',
                }
              )
              .fillColor('#000000');

            currentX += imageWidth + imageSpacing;
          }
        } else {
          // Si falla la carga, mostrar placeholder
          this.doc
            .rect(currentX, this.currentY, imageWidth, imageHeight)
            .strokeColor('#CCCCCC')
            .lineWidth(1)
            .stroke();
          
          this.doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#999999')
            .text(
              'No disponible',
              currentX,
              this.currentY + imageHeight / 2,
              {
                width: imageWidth,
                align: 'center',
              }
            )
            .fillColor('#000000');

          currentX += imageWidth + imageSpacing;
        }
      }

      // Actualizar posición Y después de todas las imágenes
      this.currentY += imageHeight;
    } else {
      this.doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Sin fotografías disponibles', this.margin, this.currentY);
      this.currentY += 20;
    }

    return this.doc;
  }

  getDocument(): PDFDoc {
    return this.doc;
  }
}

