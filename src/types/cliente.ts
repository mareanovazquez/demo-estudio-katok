/**
 * Tipos de datos para el modelo de Cliente del Estudio Contable Katok.
 * Reemplazo moderno del "Maestro de Clientes" del sistema DOS.
 */

export type TipoPersona = 'fisica' | 'juridica';

export type EstadoIva = 'SI' | 'NO' | 'DDJJ';

export type CanalContactoPreferido = 'email' | 'whatsapp' | 'ambos';

export type PeriodicidadFacturacion =
  | 'Mensual'
  | 'Bimestral'
  | 'Trimestral'
  | 'Semestral'
  | 'Anual'
  | 'Por Trámite';

export type TipoComprobanteFac = 'F' | 'R';

export type TipoVinculo =
  | 'apoderado'
  | 'cliente_cobro'
  | 'padre_madre'
  | 'hijo_a'
  | 'conyuge'
  | 'socio'
  | 'otro';

export interface ClienteRelacion {
  id: string;
  clienteId: string;
  clienteCodigo?: string;
  clienteNombre: string;
  clienteCuit?: string;
  tipoVinculo: TipoVinculo;
  detalleOtro?: string;
}

export interface ClienteFormData {
  // --- 1. Identificación ---
  codigo: string;
  razonSocial: string;
  tipo: TipoPersona;
  cuit: string;
  domicilio: string;
  domicilioFiscal: string;
  nroLegajo?: string;
  actividades: string[]; // Hasta 3 actividades: [Principal, Sec. 1, Sec. 2]
  agencia?: string;
  dgr?: string;
  provinciaSede?: string;
  convenioMultilateralNro?: string;

  // --- 2. Fechas ---
  fechaAlta: string;
  fechaNacimiento?: string; // Solo aplica si tipo === 'fisica'
  fechaInicio?: string;

  // --- 3. Datos Impositivos ---
  iva: EstadoIva;
  ingresosBrutos: boolean;
  municipal: boolean;
  publicidadPropaganda: boolean;
  ganancias: boolean;
  autonomos: boolean;
  bienesPersonales: boolean; // Activo/Bs. Personales
  balance: boolean;
  gananciaMinimaPresunta: boolean;
  categoria: string; // Categoría monotributo/autónomos
  catFacturacion?: string; // Cat adicional de facturación
  cra?: string;
  contr?: string;
  tedCla?: string;
  redParaVep?: string;
  apo?: string; // Apoderado en sistema viejo / abreviatura

  // --- 4. Retenciones y Laboral ---
  retGanancias: boolean;
  retIngresosBrutos: boolean;
  retSuss: boolean;
  sueldos: boolean;
  facturaElectronica: boolean;

  // --- 5. Facturación y Cobranza ---
  periodicidad: PeriodicidadFacturacion;
  fac: TipoComprobanteFac;
  cdor?: string;
  clienteParaCobroId?: string;
  clienteParaCobroNombre?: string;
  mesCierre?: number;

  // --- 6. Contacto y Notificaciones (Campos nuevos) ---
  telefonoFijo?: string;
  celularWhatsapp?: string;
  email?: string;
  canalPreferido: CanalContactoPreferido;

  // --- 7. Relaciones entre Clientes (Familiares, Apoderado, Pagador) ---
  relaciones: ClienteRelacion[];

  // --- 8. Baja y Archivo Físico ---
  esBaja: boolean;
  fechaBaja?: string;
  motivoBaja?: string;
  biblioratoCarpeta?: string;
}

/** Resumen de cliente para búsquedas y autocompletado en relaciones */
export interface ClienteResumen {
  id: string;
  codigo: string;
  razonSocial: string;
  cuit: string;
  tipo: TipoPersona;
  email?: string;
  celularWhatsapp?: string;
}

/** Entidad completa de cliente persistida con identificador único */
export interface Cliente extends ClienteFormData {
  id: string;
}

