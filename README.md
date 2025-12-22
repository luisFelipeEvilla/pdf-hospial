# Servicio de Generación de PDFs - Fichas Técnicas de Inventario

Servicio Node.js con TypeScript y Express para generar fichas técnicas de inventario en formato PDF.

## Características

- Generación de PDFs con estructura de tablas profesional
- API REST para generar PDFs mediante HTTP
- Soporte para múltiples fotografías
- Formateo automático de estados (1-5) y moneda colombiana
- Configuración personalizable de entidad y NIT
- Integración con API de Laravel

## Instalación

```bash
pnpm install
```

## Uso

### Como Servicio HTTP (Recomendado)

Inicia el servidor:

```bash
# Modo desarrollo
pnpm run server

# Modo producción (después de compilar)
pnpm run build
pnpm run server:prod
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto definido en `PORT`).

#### Endpoints Disponibles

**POST /api/generate-pdf**
```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"codigo": "HUB-12325"}' \
  --output ficha-tecnica.pdf
```

**GET /api/generate-pdf/:codigo**
```bash
curl http://localhost:3000/api/generate-pdf/HUB-12325 \
  --output ficha-tecnica.pdf
```

**GET /health**
```bash
curl http://localhost:3000/health
```

### Como Script de Línea de Comandos

```bash
pnpm run dev HUB-12325
```

Esto generará un PDF basado en los datos obtenidos de la API.

### Uso Programático

```typescript
import { generarPDFPorCodigo } from './src/index.js';
import type { ConfiguracionEntidad } from './src/types.js';

const config: ConfiguracionEntidad = {
  nombre: 'E.S.E. Hospital Universitario Julio Méndez Barreneche',
  nit: '891.780.185-2',
};

await generarPDFPorCodigo('HUB-12325', config, 'output.pdf');
```

## Estructura de Datos

El servicio obtiene los datos automáticamente desde la API de Laravel. La estructura esperada se define en `src/types.ts`:

- **Información básica**: código, nombre general, categoría, dependencia
- **Características**: marca, color, estado (1-5), ubicación
- **Responsabilidad**: responsable, titularidad jurídica, vida útil
- **Observaciones**: campo de texto libre
- **Fotografías**: array de objetos con información de fotos

## Estados

Los estados se mapean de la siguiente manera:
- `1` → "Malo (1/5)"
- `2` → "Regular (2/5)"
- `3` → "Regular (3/5)"
- `4` → "Bueno (4/5)"
- `5` → "Muy Bueno (5/5)"

## Configuración

### Variables de Entorno

- `PORT`: Puerto del servidor (default: 3000)

### Cookies de Sesión

Las cookies de sesión de Laravel están hardcodeadas en el código. Si necesitas actualizarlas, edita `src/index.ts`.

## Compilación

```bash
pnpm run build
```

El código compilado se generará en la carpeta `dist/`.

## Scripts

- `pnpm run dev <codigo>` - Genera un PDF desde línea de comandos
- `pnpm run server` - Inicia el servidor HTTP en modo desarrollo
- `pnpm run server:prod` - Inicia el servidor HTTP en modo producción
- `pnpm run build` - Compila TypeScript a JavaScript
- `pnpm start` - Ejecuta el código compilado (script CLI)

## Dependencias

- **express**: Framework web para Node.js
- **pdfkit**: Librería para generación de PDFs
- **typescript**: Compilador TypeScript
- **tsx**: Ejecutor de TypeScript para desarrollo

## Notas

- Las imágenes de fotografías se cargan automáticamente desde la URL base configurada
- Los valores monetarios se formatean en pesos colombianos (COP)
- El formato del PDF está optimizado para tamaño Letter (8.5" x 11")
- Los archivos temporales se eliminan automáticamente después de generar el PDF
