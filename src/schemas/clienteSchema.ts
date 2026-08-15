import { z } from 'zod';

/**
 * Validador de CUIT/CUIL argentino con algoritmo de dígito verificador módulo 11
 */
export function validarCuit(cuitStr: string): boolean {
  if (!cuitStr) return false;

  // Limpiar guiones y espacios
  const clean = cuitStr.replace(/\D/g, '');
  if (clean.length !== 11) return false;

  const validPrefixes = ['20', '23', '24', '27', '30', '33', '34'];
  const prefix = clean.substring(0, 2);
  if (!validPrefixes.includes(prefix)) return false;

  const digits = clean.split('').map(Number);
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * multipliers[i];
  }

  const remainder = sum % 11;
  let checkDigit = 11 - remainder;

  if (checkDigit === 11) checkDigit = 0;
  if (checkDigit === 10) checkDigit = 9;

  return checkDigit === digits[10];
}

/** Formateador automático de CUIT: XX-XXXXXXXX-X */
export function formatCuit(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 2) return clean;
  if (clean.length <= 10) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10, 11)}`;
}

export const clienteRelacionSchema = z
  .object({
    id: z.string(),
    clienteId: z.string().min(1, 'Debe seleccionar un cliente relacionado'),
    clienteCodigo: z.string().optional(),
    clienteNombre: z.string().min(1, 'El nombre del cliente es obligatorio'),
    clienteCuit: z.string().optional(),
    tipoVinculo: z.enum([
      'apoderado',
      'cliente_cobro',
      'padre_madre',
      'hijo_a',
      'conyuge',
      'socio',
      'otro',
    ]),
    detalleOtro: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tipoVinculo === 'otro') {
        return !!data.detalleOtro && data.detalleOtro.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Debe especificar el detalle del vínculo cuando selecciona "Otro"',
      path: ['detalleOtro'],
    }
  );

export const clienteSchema = z
  .object({
    // 1. Identificación
    codigo: z
      .string()
      .min(1, 'El código de cliente es obligatorio')
      .regex(/^\d+$/, 'El código debe ser numérico'),
    razonSocial: z
      .string()
      .min(2, 'La razón social o nombre debe tener al menos 2 caracteres')
      .max(120, 'Máximo 120 caracteres'),
    tipo: z.enum(['fisica', 'juridica']),
    cuit: z
      .string()
      .min(1, 'El C.U.I.T. es obligatorio')
      .refine(validarCuit, {
        message: 'C.U.I.T. inválido o dígito verificador incorrecto (formato: XX-XXXXXXXX-X)',
      }),
    domicilio: z.string().min(1, 'El domicilio es obligatorio'),
    domicilioFiscal: z.string().min(1, 'El domicilio fiscal es obligatorio'),
    actividades: z
      .array(z.string())
      .max(3, 'Máximo 3 actividades')
      .default(['', '', '']),
    agencia: z.string().optional().default(''),
    dgr: z.string().optional().default(''),
    provinciaSede: z.string().optional().default(''),
    convenioMultilateralNro: z.string().optional().default(''),

    // 2. Fechas
    fechaAlta: z.string().min(1, 'La fecha de alta es obligatoria'),
    fechaNacimiento: z.string().optional().default(''),
    fechaInicio: z.string().optional().default(''),

    // 3. Datos Impositivos
    iva: z.enum(['SI', 'NO', 'DDJJ']),
    ingresosBrutos: z.boolean().default(false),
    municipal: z.boolean().default(false),
    publicidadPropaganda: z.boolean().default(false),
    ganancias: z.boolean().default(false),
    autonomos: z.boolean().default(false),
    bienesPersonales: z.boolean().default(false),
    balance: z.boolean().default(false),
    gananciaMinimaPresunta: z.boolean().default(false),
    categoria: z.string().min(1, 'Seleccione una categoría impositiva'),
    catFacturacion: z.string().optional().default(''),
    cra: z.string().optional().default(''),
    contr: z.string().optional().default(''),
    tedCla: z.string().optional().default(''),
    redParaVep: z.string().optional().default(''),
    apo: z.string().optional().default(''),

    // 4. Retenciones y Laboral
    retGanancias: z.boolean().default(false),
    retIngresosBrutos: z.boolean().default(false),
    retSuss: z.boolean().default(false),
    sueldos: z.boolean().default(false),
    facturaElectronica: z.boolean().default(false),

    // 5. Facturación y Cobranza
    periodicidad: z.enum([
      'Mensual',
      'Bimestral',
      'Trimestral',
      'Semestral',
      'Anual',
      'Por Trámite',
    ]),
    fac: z.enum(['F', 'R']),
    cdor: z.string().optional().default(''),
    clienteParaCobroId: z.string().optional().default(''),
    clienteParaCobroNombre: z.string().optional().default(''),
    mesCierre: z
      .number()
      .min(1, 'Mes entre 1 y 12')
      .max(12, 'Mes entre 1 y 12')
      .optional()
      .nullable(),

    // 6. Contacto y Notificaciones
    telefonoFijo: z.string().optional().default(''),
    celularWhatsapp: z.string().optional().default(''),
    email: z
      .string()
      .email('Formato de correo electrónico inválido')
      .or(z.literal(''))
      .optional()
      .default(''),
    canalPreferido: z.enum(['email', 'whatsapp', 'ambos']).default('email'),

    // 7. Relaciones entre Clientes
    relaciones: z.array(clienteRelacionSchema).default([]),

    // 8. Estado y Baja
    esBaja: z.boolean().default(false),
    fechaBaja: z.string().optional().default(''),
    motivoBaja: z.string().optional().default(''),
    biblioratoCarpeta: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    // Si es Persona Jurídica, es obligatorio tener un Apoderado asignado en las relaciones
    if (data.tipo === 'juridica') {
      const tieneApoderado = data.relaciones.some(
        (rel) => rel.tipoVinculo === 'apoderado' && rel.clienteId
      );
      if (!tieneApoderado) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Para personas jurídicas es obligatorio asignar al menos un Apoderado en la sección de Relaciones.',
          path: ['relaciones'],
        });
      }
    }

    // Si es Persona Física y se especificó fecha de nacimiento, verificar formato/coherencia
    if (data.tipo === 'fisica' && data.fechaNacimiento) {
      const birthDate = new Date(data.fechaNacimiento);
      const today = new Date();
      if (birthDate > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de nacimiento no puede ser futura.',
          path: ['fechaNacimiento'],
        });
      }
    }

    // Si está dado de baja, la fecha y motivo de baja son requeridos
    if (data.esBaja) {
      if (!data.fechaBaja || data.fechaBaja.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de baja es requerida cuando el cliente se marca como inactivo / baja.',
          path: ['fechaBaja'],
        });
      }
      if (!data.motivoBaja || data.motivoBaja.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El motivo de baja es obligatorio.',
          path: ['motivoBaja'],
        });
      }
    }
  });

export type ClienteSchemaType = z.infer<typeof clienteSchema>;
