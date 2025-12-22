export interface Foto {
  id: string;
  nombre: string;
  id_producto: string;
}

export interface Cotizacion {
  id?: string;
  numero_cotizacion?: string;
  avaluo?: string | number;
  numero?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  id_cliente: string;
}

export interface Subcategoria {
  id: string;
  id_categoria: string;
  nombre: string;
  codigo_sub_categoria: string;
  categoria: Categoria;
}

export interface Responsable {
  id?: string;
  nombre?: string;
}

export interface Grupo {
  id: string;
  nombre: string;
  id_linea: string;
  codigo_linea: string;
  vida_util_niif_dias: string;
}

export interface Dependencia {
  id: string;
  nombre: string;
  video: string | null;
  id_piso: string;
  id_sucursal: string;
  id_consecutivo_codigo: string;
  deleted_at: string | null;
  id_unidad_funcional: string | null;
}

export interface UnidadFuncional {
  id: string;
  nombre: string;
}

export interface FichaTecnica {
  id: string;
  codigo: string;
  codigo_antiguo: string;
  placa_actual: string | null;
  ubicacion: string;
  estado: string; // "1" a "5"
  titularidad: string; // "1" = Propio
  numero_factura: string | null;
  factura_escaneada: string | null;
  mes: string;
  anio: string;
  costo: string | null;
  vida_util: string | null;
  avaluo: string | null;
  marca: string;
  modelo: string;
  serial: string;
  color: string;
  proveedor: string | null;
  cilindraje: string | null;
  placa_vehicular: string | null;
  numero_motor: string | null;
  numero_chasis: string | null;
  observacion: string;
  nombre_general: string;
  fecha_adquisicion: string | null;
  valor_adquisicion: string | null;
  funcionamiento: string | null;
  id_dependencia: string;
  id_unidad_funcional: string;
  id_centro_costo: string;
  id_responsable: string | null;
  id_subcategoria: string;
  id_usuario_creacion: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  contable: string;
  id_linea: string;
  id_grupo: string;
  id_subgrupo: string;
  fecha_puesta_servicio: string | null;
  maneja_iva: string;
  porcentaje_iva: string | null;
  numero_garantia: string | null;
  aplica_depreciacion: string;
  vida_util_niif: string | null;
  valor_salvamento_niif: string | null;
  depreciacion_por_componentes: string;
  importado: string;
  cotizado: string;
  subcategoria: Subcategoria;
  responsable: Responsable | null;
  fotos: Foto[];
  cotizaciones: Cotizacion[];
  grupo: Grupo;
  dependencia: Dependencia;
  unidad_funcional?: UnidadFuncional;
  subgrupo?: {
    id: string;
    nombre: string;
    id_grupo: string;
  };
}

export interface ConfiguracionEntidad {
  nombre: string;
  nit: string;
}

