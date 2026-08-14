import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Building2,
  Calendar,
  DollarSign,
  Receipt,
  Phone,
  Users,
  Archive,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  Layers,
  Copy,
} from 'lucide-react';
import type { ClienteFormData } from '../../types/cliente';
import { clienteSchema, formatCuit, validarCuit } from '../../schemas/clienteSchema';
import { ClienteSearchSelector } from '../ClienteSearchSelector/ClienteSearchSelector';
import styles from './ClienteForm.module.css';

interface ClienteFormProps {
  initialData?: Partial<ClienteFormData>;
  onSubmit: (data: ClienteFormData) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

type TabKey =
  | 'general'
  | 'fechas'
  | 'impositivo'
  | 'facturacion'
  | 'contacto'
  | 'relaciones'
  | 'baja';

const DEFAULT_FORM_VALUES: ClienteFormData = {
  codigo: '',
  razonSocial: '',
  tipo: 'fisica',
  cuit: '',
  domicilio: '',
  domicilioFiscal: '',
  nroLegajo: '',
  actividades: ['', '', ''],
  agencia: '',
  dgr: '',
  provinciaSede: 'Buenos Aires',
  convenioMultilateralNro: '',

  fechaAlta: new Date().toISOString().split('T')[0],
  fechaNacimiento: '',
  fechaInicio: '',

  iva: 'SI',
  ingresosBrutos: true,
  municipal: false,
  publicidadPropaganda: false,
  ganancias: true,
  autonomos: false,
  bienesPersonales: false,
  balance: false,
  gananciaMinimaPresunta: false,
  categoria: 'Monotributo - Cat. C',
  catFacturacion: '',
  cra: '',
  contr: '',
  tedCla: '',
  redParaVep: '',
  apo: '',

  retGanancias: false,
  retIngresosBrutos: false,
  retSuss: false,
  sueldos: false,
  facturaElectronica: true,

  periodicidad: 'Mensual',
  fac: 'F',
  cdor: '',
  clienteParaCobroId: '',
  clienteParaCobroNombre: '',
  mesCierre: 12,

  telefonoFijo: '',
  celularWhatsapp: '',
  email: '',
  canalPreferido: 'ambos',

  relaciones: [],

  esBaja: false,
  fechaBaja: '',
  motivoBaja: '',
  biblioratoCarpeta: '',
};

export const ClienteForm: React.FC<ClienteFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema) as any,
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      ...initialData,
      actividades: initialData?.actividades || ['', '', ''],
      relaciones: initialData?.relaciones || [],
    },
    mode: 'onTouched',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'relaciones',
  });

  const tipoCliente = watch('tipo');
  const cuitValue = watch('cuit');
  const esBajaValue = watch('esBaja');
  const ivaValue = watch('iva');
  const razonSocialValue = watch('razonSocial');
  const codigoValue = watch('codigo');
  const relacionesValue = watch('relaciones');

  const isCuitValid = validarCuit(cuitValue);

  const handleFormSubmit = (data: ClienteFormData) => {
    // TODO: En una próxima fase implementar la bidireccionalidad automática de relaciones (ej: Padre <-> Hijo).
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
    onSubmit(data);
  };

  const copyDomicilio = () => {
    const dom = watch('domicilio');
    if (dom) {
      setValue('domicilioFiscal', dom, { shouldValidate: true, shouldDirty: true });
    }
  };

  // Conteo de errores por pestaña para indicadores visuales
  const getTabErrors = (tab: TabKey): number => {
    let count = 0;
    if (tab === 'general') {
      if (errors.codigo) count++;
      if (errors.razonSocial) count++;
      if (errors.tipo) count++;
      if (errors.cuit) count++;
      if (errors.domicilio) count++;
      if (errors.domicilioFiscal) count++;
    } else if (tab === 'fechas') {
      if (errors.fechaAlta) count++;
      if (errors.fechaNacimiento) count++;
      if (errors.fechaInicio) count++;
    } else if (tab === 'impositivo') {
      if (errors.iva) count++;
      if (errors.categoria) count++;
    } else if (tab === 'facturacion') {
      if (errors.periodicidad) count++;
      if (errors.fac) count++;
      if (errors.mesCierre) count++;
    } else if (tab === 'contacto') {
      if (errors.email) count++;
      if (errors.canalPreferido) count++;
    } else if (tab === 'relaciones') {
      if (errors.relaciones) count++;
    } else if (tab === 'baja') {
      if (errors.fechaBaja) count++;
      if (errors.motivoBaja) count++;
    }
    return count;
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'Identificación', icon: <Layers size={18} /> },
    { key: 'fechas', label: 'Fechas', icon: <Calendar size={18} /> },
    { key: 'impositivo', label: 'Impuestos & Ret.', icon: <DollarSign size={18} /> },
    { key: 'facturacion', label: 'Facturación', icon: <Receipt size={18} /> },
    { key: 'contacto', label: 'Contacto & Envíos', icon: <Phone size={18} /> },
    { key: 'relaciones', label: 'Relaciones & Vínculos', icon: <Users size={18} /> },
    { key: 'baja', label: 'Baja & Archivo', icon: <Archive size={18} /> },
  ];

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit(handleFormSubmit)}>
      {/* Encabezado Superior / Barra de Resumen */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            {tipoCliente === 'juridica' ? (
              <Building2 size={24} />
            ) : (
              <User size={24} />
            )}
          </div>
          <div>
            <div className={styles.headerBadgeRow}>
              <span className={styles.badgeCategory}>
                {isEditing ? 'Edición de Cliente' : 'Alta de Cliente'}
              </span>
              <span
                className={`${styles.typeBadge} ${
                  tipoCliente === 'juridica' ? styles.badgeJuridica : styles.badgeFisica
                }`}
              >
                {tipoCliente === 'juridica' ? 'Persona Jurídica' : 'Persona Física'}
              </span>
              {esBajaValue && <span className={styles.badgeBaja}>Inactivo / Baja</span>}
            </div>
            <h2 className={styles.headerTitle}>
              {razonSocialValue.trim() || 'Nuevo Cliente'}
            </h2>
            <div className={styles.headerSubtitle}>
              <span>
                Cód. <strong className={styles.monoText}>{codigoValue || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                CUIT: <strong className={styles.monoText}>{cuitValue || '—'}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {onCancel && (
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className={styles.buttonPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Dar de Alta'}
          </button>
        </div>
      </header>

      {/* Alerta de éxito */}
      {savedSuccess && (
        <div className={styles.alertSuccess} role="alert">
          <CheckCircle2 size={20} />
          <span>¡Cliente guardado exitosamente en el sistema!</span>
        </div>
      )}

      {/* Alertas globales de validación */}
      {Object.keys(errors).length > 0 && (
        <div className={styles.alertWarning} role="alert">
          <AlertCircle size={20} />
          <div className={styles.alertText}>
            <strong>Hay campos con errores que requieren corrección:</strong>
            <ul>
              {errors.relaciones && <li>{errors.relaciones.message as string}</li>}
              {errors.cuit && <li>{errors.cuit.message}</li>}
              {errors.codigo && <li>{errors.codigo.message}</li>}
              {errors.razonSocial && <li>{errors.razonSocial.message}</li>}
              {errors.fechaBaja && <li>{errors.fechaBaja.message}</li>}
              {errors.motivoBaja && <li>{errors.motivoBaja.message}</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Navegación por pestañas (Mobile-First scrollable) */}
      <nav className={styles.tabsNav} aria-label="Secciones del formulario">
        {tabs.map((tab) => {
          const tabErrors = getTabErrors(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
              {tabErrors > 0 && (
                <span className={styles.tabErrorBadge} data-tooltip={`${tabErrors} errores en esta sección`}>
                  {tabErrors}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: IDENTIFICACIÓN Y DATOS GENERALES */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleBlock}>
              <h3 className={styles.sectionTitle}>Identificación del Cliente</h3>
              <p className={styles.sectionSubtitle}>
                Datos principales de registro, CUIT, domicilios y actividades económicas.
              </p>
            </div>
            <div className={styles.tipoPersonaToggle}>
              <button
                type="button"
                className={`${styles.toggleOption} ${
                  tipoCliente === 'fisica' ? styles.toggleOptionActive : ''
                }`}
                onClick={() => setValue('tipo', 'fisica', { shouldValidate: true })}
              >
                <User size={16} />
                <span>Persona Física</span>
              </button>
              <button
                type="button"
                className={`${styles.toggleOption} ${
                  tipoCliente === 'juridica' ? styles.toggleOptionActive : ''
                }`}
                onClick={() => setValue('tipo', 'juridica', { shouldValidate: true })}
              >
                <Building2 size={16} />
                <span>Persona Jurídica</span>
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {/* Código de Cliente */}
            <div className={styles.col4}>
              <label className={styles.label} htmlFor="codigo">
                Código de Cliente <span className={styles.required}>*</span>
              </label>
              <input
                id="codigo"
                type="text"
                className={`${styles.input} ${styles.monoInput} ${
                  errors.codigo ? styles.inputError : ''
                }`}
                placeholder="Ej: 1050"
                {...register('codigo')}
              />
              {errors.codigo && (
                <span className={styles.errorText}>{errors.codigo.message}</span>
              )}
              <span className={styles.helperText}>Código numérico único en el sistema.</span>
            </div>

            {/* CUIT con formateador automático */}
            <div className={styles.col4}>
              <label className={styles.label} htmlFor="cuit">
                C.U.I.T. <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="cuit"
                  type="text"
                  className={`${styles.input} ${styles.monoInput} ${
                    errors.cuit ? styles.inputError : isCuitValid ? styles.inputSuccess : ''
                  }`}
                  placeholder="20-12345678-9"
                  value={cuitValue}
                  onChange={(e) => {
                    const formatted = formatCuit(e.target.value);
                    setValue('cuit', formatted, { shouldValidate: true, shouldDirty: true });
                  }}
                />
                {isCuitValid && (
                  <span className={styles.cuitValidBadge} data-tooltip="Dígito verificador válido">
                    <CheckCircle2 size={16} />
                  </span>
                )}
              </div>
              {errors.cuit && (
                <span className={styles.errorText}>{errors.cuit.message}</span>
              )}
              <span className={styles.helperText}>Validado por algoritmo de AFIP módulo 11.</span>
            </div>

            {/* N° Legajo */}
            <div className={styles.col4}>
              <label className={styles.label} htmlFor="nroLegajo">
                N° de Legajo
              </label>
              <input
                id="nroLegajo"
                type="text"
                className={`${styles.input} ${styles.monoInput}`}
                placeholder="Ej: L-480"
                {...register('nroLegajo')}
              />
              <span className={styles.helperText}>Referencia documental interna.</span>
            </div>

            {/* Razón Social / Nombre Completo */}
            <div className={styles.col12}>
              <label className={styles.label} htmlFor="razonSocial">
                Razón Social / Apellido y Nombre <span className={styles.required}>*</span>
              </label>
              <input
                id="razonSocial"
                type="text"
                className={`${styles.input} ${errors.razonSocial ? styles.inputError : ''}`}
                placeholder="Ej: Pérez Juan Carlos o Distribuidora Andina S.A."
                {...register('razonSocial')}
              />
              {errors.razonSocial && (
                <span className={styles.errorText}>{errors.razonSocial.message}</span>
              )}
            </div>

            {/* Domicilio Real / Comercial */}
            <div className={styles.col6}>
              <label className={styles.label} htmlFor="domicilio">
                Domicilio Real / Comercial <span className={styles.required}>*</span>
              </label>
              <input
                id="domicilio"
                type="text"
                className={`${styles.input} ${errors.domicilio ? styles.inputError : ''}`}
                placeholder="Calle, Número, Piso, Localidad"
                {...register('domicilio')}
              />
              {errors.domicilio && (
                <span className={styles.errorText}>{errors.domicilio.message}</span>
              )}
            </div>

            {/* Domicilio Fiscal */}
            <div className={styles.col6}>
              <div className={styles.labelWithAction}>
                <label className={styles.label} htmlFor="domicilioFiscal">
                  Domicilio Fiscal <span className={styles.required}>*</span>
                </label>
                <button
                  type="button"
                  className={styles.inlineActionBtn}
                  onClick={copyDomicilio}
                  data-tooltip="Copiar domicilio real"
                >
                  <Copy size={13} />
                  <span>Igual al real</span>
                </button>
              </div>
              <input
                id="domicilioFiscal"
                type="text"
                className={`${styles.input} ${errors.domicilioFiscal ? styles.inputError : ''}`}
                placeholder="Domicilio registrado ante AFIP / DGR"
                {...register('domicilioFiscal')}
              />
              {errors.domicilioFiscal && (
                <span className={styles.errorText}>{errors.domicilioFiscal.message}</span>
              )}
            </div>

            {/* Actividades Económicas (Array de hasta 3 actividades) */}
            <div className={styles.col12}>
              <div className={styles.fieldHeaderBlock}>
                <label className={styles.label}>
                  Actividades Económicas (Principal y Secundarias)
                </label>
                <span className={styles.helperBadge}>Hasta 3 actividades registradas</span>
              </div>
              <div className={styles.activitiesContainer}>
                <div className={styles.activityRow}>
                  <span className={styles.activityBadgePrimary}>Principal</span>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Actividad económica principal (ej. Servicios de consultoría informática)"
                    {...register('actividades.0')}
                  />
                </div>
                <div className={styles.activityRow}>
                  <span className={styles.activityBadgeSecondary}>Secundaria 1</span>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Actividad secundaria 1 (opcional)"
                    {...register('actividades.1')}
                  />
                </div>
                <div className={styles.activityRow}>
                  <span className={styles.activityBadgeSecondary}>Secundaria 2</span>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Actividad secundaria 2 (opcional)"
                    {...register('actividades.2')}
                  />
                </div>
              </div>
            </div>

            {/* Jurisdicciones y Registros */}
            <div className={styles.col3}>
              <label className={styles.label} htmlFor="agencia">
                Agencia AFIP
              </label>
              <input
                id="agencia"
                type="text"
                className={styles.input}
                placeholder="Ej: Agencia 49"
                {...register('agencia')}
              />
            </div>

            <div className={styles.col3}>
              <label className={styles.label} htmlFor="dgr">
                DGR / Ingresos Brutos
              </label>
              <input
                id="dgr"
                type="text"
                className={styles.input}
                placeholder="N° inscripción DGR"
                {...register('dgr')}
              />
            </div>

            <div className={styles.col3}>
              <label className={styles.label} htmlFor="provinciaSede">
                Provincia / Sede
              </label>
              <input
                id="provinciaSede"
                type="text"
                className={styles.input}
                placeholder="Ej: CABA / Buenos Aires"
                {...register('provinciaSede')}
              />
            </div>

            <div className={styles.col3}>
              <label className={styles.label} htmlFor="convenioMultilateralNro">
                Conv. Multilateral N°
              </label>
              <input
                id="convenioMultilateralNro"
                type="text"
                className={`${styles.input} ${styles.monoInput}`}
                placeholder="N° de inscripción CM"
                {...register('convenioMultilateralNro')}
              />
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 2: FECHAS */}
      {/* ========================================================================= */}
      {activeTab === 'fechas' && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitleBlock}>
            <h3 className={styles.sectionTitle}>Fechas Relevantes</h3>
            <p className={styles.sectionSubtitle}>
              Fechas de alta en el estudio, nacimiento (para personas físicas) e inicio de actividades.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.col4}>
              <label className={styles.label} htmlFor="fechaAlta">
                Fecha de Alta en el Estudio <span className={styles.required}>*</span>
              </label>
              <input
                id="fechaAlta"
                type="date"
                className={`${styles.input} ${errors.fechaAlta ? styles.inputError : ''}`}
                {...register('fechaAlta')}
              />
              {errors.fechaAlta && (
                <span className={styles.errorText}>{errors.fechaAlta.message}</span>
              )}
            </div>

            {/* Fecha de Nacimiento condicional: solo para persona física */}
            {tipoCliente === 'fisica' ? (
              <div className={styles.col4}>
                <label className={styles.label} htmlFor="fechaNacimiento">
                  Fecha de Nacimiento
                </label>
                <input
                  id="fechaNacimiento"
                  type="date"
                  className={`${styles.input} ${
                    errors.fechaNacimiento ? styles.inputError : ''
                  }`}
                  {...register('fechaNacimiento')}
                />
                {errors.fechaNacimiento && (
                  <span className={styles.errorText}>{errors.fechaNacimiento.message}</span>
                )}
                <span className={styles.helperText}>Aplica únicamente a personas físicas.</span>
              </div>
            ) : (
              <div className={styles.col4}>
                <label className={styles.label}>Fecha de Nacimiento</label>
                <div className={styles.disabledNotice}>
                  <Info size={16} />
                  <span>No aplica para personas jurídicas</span>
                </div>
              </div>
            )}

            <div className={styles.col4}>
              <label className={styles.label} htmlFor="fechaInicio">
                Fecha de Inicio de Actividades
              </label>
              <input
                id="fechaInicio"
                type="date"
                className={styles.input}
                {...register('fechaInicio')}
              />
              <span className={styles.helperText}>Inicio según constancia de inscripción AFIP.</span>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 3: IMPOSITIVO Y RETENCIONES */}
      {/* ========================================================================= */}
      {activeTab === 'impositivo' && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitleBlock}>
            <h3 className={styles.sectionTitle}>Datos Impositivos y Retenciones</h3>
            <p className={styles.sectionSubtitle}>
              Configuración de tributos activos, régimen de IVA, categorías y retenciones asociadas.
            </p>
          </div>

          {/* Control de 3 estados para IVA */}
          <div className={styles.ivaControlBlock}>
            <div className={styles.ivaLabelWrapper}>
              <label className={styles.label}>
                Condición frente al I.V.A. <span className={styles.required}>*</span>
              </label>
              <span className={styles.helperText}>
                Seleccione el estado impositivo correspondiente para liquidaciones.
              </span>
            </div>

            <div className={styles.ivaSegmentedControl}>
              <button
                type="button"
                className={`${styles.ivaSegmentBtn} ${
                  ivaValue === 'SI' ? styles.ivaSegmentBtnActivePrimary : ''
                }`}
                onClick={() => setValue('iva', 'SI', { shouldValidate: true })}
              >
                <span className={styles.ivaTag}>SÍ</span>
                <span className={styles.ivaDesc}>Responsable Inscripto</span>
              </button>

              <button
                type="button"
                className={`${styles.ivaSegmentBtn} ${
                  ivaValue === 'NO' ? styles.ivaSegmentBtnActiveSecondary : ''
                }`}
                onClick={() => setValue('iva', 'NO', { shouldValidate: true })}
              >
                <span className={styles.ivaTag}>NO</span>
                <span className={styles.ivaDesc}>Exento / No Alcanzado</span>
              </button>

              <button
                type="button"
                className={`${styles.ivaSegmentBtn} ${
                  ivaValue === 'DDJJ' ? styles.ivaSegmentBtnActiveAccent : ''
                }`}
                onClick={() => setValue('iva', 'DDJJ', { shouldValidate: true })}
              >
                <span className={styles.ivaTag}>DDJJ</span>
                <span className={styles.ivaDesc}>Presentación Informativa</span>
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {/* Categoría Impositiva */}
            <div className={styles.col6}>
              <label className={styles.label} htmlFor="categoria">
                Categoría Impositiva / Régimen <span className={styles.required}>*</span>
              </label>
              <select
                id="categoria"
                className={`${styles.select} ${errors.categoria ? styles.inputError : ''}`}
                {...register('categoria')}
              >
                <optgroup label="Monotributo">
                  <option value="Monotributo - Cat. A">Monotributo — Categoría A</option>
                  <option value="Monotributo - Cat. B">Monotributo — Categoría B</option>
                  <option value="Monotributo - Cat. C">Monotributo — Categoría C</option>
                  <option value="Monotributo - Cat. D">Monotributo — Categoría D</option>
                  <option value="Monotributo - Cat. E">Monotributo — Categoría E</option>
                  <option value="Monotributo - Cat. F">Monotributo — Categoría F</option>
                  <option value="Monotributo - Cat. G">Monotributo — Categoría G</option>
                  <option value="Monotributo - Cat. H">Monotributo — Categoría H</option>
                  <option value="Monotributo - Cat. I">Monotributo — Categoría I</option>
                  <option value="Monotributo - Cat. J">Monotributo — Categoría J</option>
                  <option value="Monotributo - Cat. K">Monotributo — Categoría K</option>
                </optgroup>
                <optgroup label="Régimen General / Autónomos">
                  <option value="Autónomos - Cat. T1">Autónomos — Tabla I</option>
                  <option value="Autónomos - Cat. T2">Autónomos — Tabla II</option>
                  <option value="Autónomos - Cat. T3">Autónomos — Tabla III</option>
                  <option value="Autónomos - Cat. T4">Autónomos — Tabla IV</option>
                  <option value="Autónomos - Cat. T5">Autónomos — Tabla V</option>
                </optgroup>
                <optgroup label="Otros">
                  <option value="Sociedad Comercial">Sociedad Comercial (Jurídica)</option>
                  <option value="Exento">Exento</option>
                  <option value="No Categorizado">No Categorizado</option>
                </optgroup>
              </select>
              {errors.categoria && (
                <span className={styles.errorText}>{errors.categoria.message}</span>
              )}
            </div>

            {/* Cat Facturación */}
            <div className={styles.col6}>
              <label className={styles.label} htmlFor="catFacturacion">
                Cat. Facturación (Adicional)
              </label>
              <input
                id="catFacturacion"
                type="text"
                className={styles.input}
                placeholder="Categoría diferenciada para facturación"
                {...register('catFacturacion')}
              />
              <span className={styles.helperText}>
                Nota: Campo proveniente de la sección de facturación del sistema DOS.
              </span>
            </div>
          </div>

          {/* Grilla de Switches Impositivos */}
          <div className={styles.switchesBlock}>
            <h4 className={styles.subBlockTitle}>Impuestos y Obligaciones Periódicas</h4>
            <div className={styles.switchesGrid}>
              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('ingresosBrutos')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Ingresos Brutos (IIBB)</span>
              </label>

              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('ganancias')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Impuesto a las Ganancias</span>
              </label>

              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('autonomos')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Autónomos</span>
              </label>

              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('bienesPersonales')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Bienes Personales / Activo</span>
              </label>

              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('balance')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Presenta Balance Anual</span>
              </label>

              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('municipal')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Tasa Municipal</span>
              </label>

              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('publicidadPropaganda')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Publicidad y Propaganda</span>
              </label>

              <label className={styles.switchCard}>
                <input
                  type="checkbox"
                  className={styles.switchInput}
                  {...register('gananciaMinimaPresunta')}
                />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Gcia. Mínima Presunta</span>
              </label>
            </div>
          </div>

          {/* Grilla de Retenciones y Regímenes Especiales */}
          <div className={styles.switchesBlock}>
            <h4 className={styles.subBlockTitle}>Regímenes de Retención, Nómina y Facturación</h4>
            <div className={styles.switchesGrid}>
              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('retGanancias')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Agente Ret. Ganancias</span>
              </label>

              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('retIngresosBrutos')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Agente Ret. IIBB</span>
              </label>

              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('retSuss')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Agente Ret. SUSS</span>
              </label>

              <label className={styles.switchCard}>
                <input type="checkbox" className={styles.switchInput} {...register('sueldos')} />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Liquidación de Sueldos (F.931)</span>
              </label>

              <label className={styles.switchCard}>
                <input
                  type="checkbox"
                  className={styles.switchInput}
                  {...register('facturaElectronica')}
                />
                <span className={styles.switchSlider}></span>
                <span className={styles.switchLabel}>Factura Electrónica Habilitada</span>
              </label>
            </div>
          </div>

          {/* Parámetros técnicos del sistema viejo */}
          <div className={styles.technicalSection}>
            <h4 className={styles.subBlockTitle}>Parámetros Técnicos y Enlaces</h4>
            <div className={styles.grid}>
              <div className={styles.col3}>
                <label className={styles.label} htmlFor="cra">
                  CRA
                </label>
                <input id="cra" type="text" className={styles.input} {...register('cra')} />
              </div>
              <div className={styles.col3}>
                <label className={styles.label} htmlFor="contr">
                  Contr.
                </label>
                <input id="contr" type="text" className={styles.input} {...register('contr')} />
              </div>
              <div className={styles.col3}>
                <label className={styles.label} htmlFor="tedCla">
                  TED: CLA
                </label>
                <input id="tedCla" type="text" className={styles.input} {...register('tedCla')} />
              </div>
              <div className={styles.col3}>
                <label className={styles.label} htmlFor="redParaVep">
                  Red para VEP
                </label>
                <input
                  id="redParaVep"
                  type="text"
                  className={styles.input}
                  placeholder="Link / Banelco / Interbanking"
                  {...register('redParaVep')}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 4: FACTURACIÓN Y COBRANZA */}
      {/* ========================================================================= */}
      {activeTab === 'facturacion' && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitleBlock}>
            <h3 className={styles.sectionTitle}>Condiciones de Facturación y Cobro</h3>
            <p className={styles.sectionSubtitle}>
              Periodicidad de abonos, tipo de comprobante emitido, contador asignado y pagador.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.col4}>
              <label className={styles.label} htmlFor="periodicidad">
                Periodicidad de Honorarios <span className={styles.required}>*</span>
              </label>
              <select id="periodicidad" className={styles.select} {...register('periodicidad')}>
                <option value="Mensual">Mensual</option>
                <option value="Bimestral">Bimestral</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Semestral">Semestral</option>
                <option value="Anual">Anual</option>
                <option value="Por Trámite">Por Trámite / Eventual</option>
              </select>
            </div>

            <div className={styles.col4}>
              <label className={styles.label} htmlFor="fac">
                Tipo Comprobante (FAC) <span className={styles.required}>*</span>
              </label>
              <select id="fac" className={styles.select} {...register('fac')}>
                <option value="F">Factura (F)</option>
                <option value="R">Recibo Provisorio (R)</option>
              </select>
            </div>

            <div className={styles.col4}>
              <label className={styles.label} htmlFor="mesCierre">
                Mes de Cierre de Ejercicio
              </label>
              <select
                id="mesCierre"
                className={styles.select}
                {...register('mesCierre', { valueAsNumber: true })}
              >
                <option value={1}>Enero (1)</option>
                <option value={2}>Febrero (2)</option>
                <option value={3}>Marzo (3)</option>
                <option value={4}>Abril (4)</option>
                <option value={5}>Mayo (5)</option>
                <option value={6}>Junio (6)</option>
                <option value={7}>Julio (7)</option>
                <option value={8}>Agosto (8)</option>
                <option value={9}>Septiembre (9)</option>
                <option value={10}>Octubre (10)</option>
                <option value={11}>Noviembre (11)</option>
                <option value={12}>Diciembre (12)</option>
              </select>
            </div>

            <div className={styles.col4}>
              <label className={styles.label} htmlFor="cdor">
                Contador / Responsable Interno (CDOR)
              </label>
              <input
                id="cdor"
                type="text"
                className={styles.input}
                placeholder="Iniciales o código de profesional"
                {...register('cdor')}
              />
            </div>

            {/* Cliente para Cobro (Relación pagador con autocompletado) */}
            <div className={styles.col8}>
              <div className={styles.labelWithBadge}>
                <label className={styles.label}>Cliente para Cobro (Pagador)</label>
                <span className={styles.helperBadge}>Receptor de facturación</span>
              </div>
              <Controller
                control={control}
                name="clienteParaCobroId"
                render={({ field }) => (
                  <ClienteSearchSelector
                    value={field.value}
                    selectedName={watch('clienteParaCobroNombre')}
                    onSelect={(cliente) => {
                      field.onChange(cliente.id);
                      setValue('clienteParaCobroNombre', cliente.razonSocial);
                    }}
                    onClear={() => {
                      field.onChange('');
                      setValue('clienteParaCobroNombre', '');
                    }}
                    placeholder="Buscar si la factura se emite a nombre de otro cliente..."
                  />
                )}
              />
              <span className={styles.helperText}>
                Dejar vacío si el titular del servicio es el mismo que abona los honorarios.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 5: CONTACTO Y NOTIFICACIONES */}
      {/* ========================================================================= */}
      {activeTab === 'contacto' && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitleBlock}>
            <h3 className={styles.sectionTitle}>Contacto y Envío de Resúmenes</h3>
            <p className={styles.sectionSubtitle}>
              Canales de comunicación directa y preferencias para el envío masivo mensual de novedades.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.col6}>
              <label className={styles.label} htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="ejemplo@cliente.com"
                {...register('email')}
              />
              {errors.email && (
                <span className={styles.errorText}>{errors.email.message}</span>
              )}
            </div>

            <div className={styles.col3}>
              <label className={styles.label} htmlFor="celularWhatsapp">
                Celular / WhatsApp <span className={styles.badgeHighlight}>Recomendado</span>
              </label>
              <input
                id="celularWhatsapp"
                type="tel"
                className={`${styles.input} ${styles.monoInput}`}
                placeholder="+54 9 11 1234-5678"
                {...register('celularWhatsapp')}
              />
              <span className={styles.helperText}>Canal para avisos y resúmenes automáticos.</span>
            </div>

            <div className={styles.col3}>
              <label className={styles.label} htmlFor="telefonoFijo">
                Teléfono Fijo (Opcional)
              </label>
              <input
                id="telefonoFijo"
                type="tel"
                className={`${styles.input} ${styles.monoInput}`}
                placeholder="011 4444-5555"
                {...register('telefonoFijo')}
              />
            </div>

            {/* Selector de Canal Preferido */}
            <div className={styles.col12}>
              <label className={styles.label}>
                Canal Preferido de Envío del Resumen Mensual
              </label>
              <div className={styles.channelCardsGrid}>
                <label
                  className={`${styles.channelCard} ${
                    watch('canalPreferido') === 'email' ? styles.channelCardActive : ''
                  }`}
                >
                  <input
                    type="radio"
                    value="email"
                    className={styles.hiddenRadio}
                    {...register('canalPreferido')}
                  />
                  <span className={styles.channelTitle}>Solo Correo Electrónico</span>
                  <span className={styles.channelDesc}>
                    El resumen se enviará en formato PDF por email.
                  </span>
                </label>

                <label
                  className={`${styles.channelCard} ${
                    watch('canalPreferido') === 'whatsapp' ? styles.channelCardActive : ''
                  }`}
                >
                  <input
                    type="radio"
                    value="whatsapp"
                    className={styles.hiddenRadio}
                    {...register('canalPreferido')}
                  />
                  <span className={styles.channelTitle}>Solo WhatsApp</span>
                  <span className={styles.channelDesc}>
                    Mensaje automatizado directo al celular del titular o pagador.
                  </span>
                </label>

                <label
                  className={`${styles.channelCard} ${
                    watch('canalPreferido') === 'ambos' ? styles.channelCardActive : ''
                  }`}
                >
                  <input
                    type="radio"
                    value="ambos"
                    className={styles.hiddenRadio}
                    {...register('canalPreferido')}
                  />
                  <span className={styles.channelTitle}>Ambos Canales (Recomendado)</span>
                  <span className={styles.channelDesc}>
                    Mayor tasa de lectura y recepción oportuna de liquidaciones y vencimientos.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 6: RELACIONES ENTRE CLIENTES */}
      {/* ========================================================================= */}
      {activeTab === 'relaciones' && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleBlock}>
              <h3 className={styles.sectionTitle}>Relaciones y Vínculos entre Clientes</h3>
              <p className={styles.sectionSubtitle}>
                Vincule este cliente con apoderados, pagadores, familiares o socios ya registrados.
              </p>
            </div>
            <button
              type="button"
              className={styles.buttonOutline}
              onClick={() =>
                append({
                  id: `rel-${Date.now()}`,
                  clienteId: '',
                  clienteNombre: '',
                  tipoVinculo: tipoCliente === 'juridica' ? 'apoderado' : 'padre_madre',
                  detalleOtro: '',
                })
              }
            >
              <Plus size={16} />
              <span>Agregar Vínculo</span>
            </button>
          </div>

          {/* Alerta si es Persona Jurídica y no tiene Apoderado */}
          {tipoCliente === 'juridica' &&
            !relacionesValue.some((r) => r.tipoVinculo === 'apoderado' && r.clienteId) && (
              <div className={styles.alertJuridicaRequired}>
                <AlertCircle size={18} />
                <span>
                  <strong>Obligatorio para Personas Jurídicas:</strong> Debe agregar al menos un
                  vínculo con rol <strong>"Apoderado"</strong> asociado a una persona física.
                </span>
              </div>
            )}

          {fields.length === 0 ? (
            <div className={styles.emptyRelationsState}>
              <Users size={36} className={styles.emptyIcon} />
              <p className={styles.emptyText}>No hay relaciones o vínculos registrados todavía.</p>
              <button
                type="button"
                className={styles.buttonPrimarySm}
                onClick={() =>
                  append({
                    id: `rel-${Date.now()}`,
                    clienteId: '',
                    clienteNombre: '',
                    tipoVinculo: tipoCliente === 'juridica' ? 'apoderado' : 'cliente_cobro',
                    detalleOtro: '',
                  })
                }
              >
                <Plus size={14} />
                <span>Agregar Primer Vínculo</span>
              </button>
            </div>
          ) : (
            <div className={styles.relationsList}>
              {fields.map((fieldItem, index) => {
                const tipoVinculo = watch(`relaciones.${index}.tipoVinculo`);
                return (
                  <div key={fieldItem.id} className={styles.relationRowCard}>
                    <div className={styles.relationHeader}>
                      <span className={styles.relationIndexBadge}>Vínculo #{index + 1}</span>
                      <button
                        type="button"
                        className={styles.deleteRelationBtn}
                        onClick={() => remove(index)}
                        data-tooltip="Eliminar este vínculo"
                      >
                        <Trash2 size={16} />
                        <span>Quitar</span>
                      </button>
                    </div>

                    <div className={styles.grid}>
                      <div className={styles.col6}>
                        <label className={styles.label}>
                          Cliente Relacionado <span className={styles.required}>*</span>
                        </label>
                        <Controller
                          control={control}
                          name={`relaciones.${index}.clienteId`}
                          render={({ field }) => (
                            <ClienteSearchSelector
                              value={field.value}
                              selectedName={watch(`relaciones.${index}.clienteNombre`)}
                              onSelect={(c) => {
                                field.onChange(c.id);
                                setValue(`relaciones.${index}.clienteNombre`, c.razonSocial);
                                setValue(`relaciones.${index}.clienteCuit`, c.cuit);
                                setValue(`relaciones.${index}.clienteCodigo`, c.codigo);
                              }}
                              onClear={() => {
                                field.onChange('');
                                setValue(`relaciones.${index}.clienteNombre`, '');
                                setValue(`relaciones.${index}.clienteCuit`, '');
                                setValue(`relaciones.${index}.clienteCodigo`, '');
                              }}
                              error={errors.relaciones?.[index]?.clienteId?.message}
                            />
                          )}
                        />
                      </div>

                      <div className={styles.col6}>
                        <label className={styles.label}>
                          Tipo de Vínculo <span className={styles.required}>*</span>
                        </label>
                        <select
                          className={styles.select}
                          {...register(`relaciones.${index}.tipoVinculo`)}
                        >
                          <option value="apoderado">Apoderado (Persona Física)</option>
                          <option value="cliente_cobro">Cliente para Cobro / Pagador</option>
                          <option value="padre_madre">Padre / Madre</option>
                          <option value="hijo_a">Hijo / Hija</option>
                          <option value="conyuge">Cónyuge</option>
                          <option value="socio">Socio / Accionista</option>
                          <option value="otro">Otro (especificar)</option>
                        </select>
                      </div>

                      {tipoVinculo === 'otro' && (
                        <div className={styles.col12}>
                          <label className={styles.label}>
                            Especifique el tipo de vínculo <span className={styles.required}>*</span>
                          </label>
                          <input
                            type="text"
                            className={`${styles.input} ${
                              errors.relaciones?.[index]?.detalleOtro ? styles.inputError : ''
                            }`}
                            placeholder="Ej: Representante legal sustituto / Garante / Hermano"
                            {...register(`relaciones.${index}.detalleOtro`)}
                          />
                          {errors.relaciones?.[index]?.detalleOtro && (
                            <span className={styles.errorText}>
                              {errors.relaciones?.[index]?.detalleOtro?.message}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 7: BAJA Y ARCHIVO FÍSICO */}
      {/* ========================================================================= */}
      {activeTab === 'baja' && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitleBlock}>
            <h3 className={styles.sectionTitle}>Estado de Baja y Archivo Físico</h3>
            <p className={styles.sectionSubtitle}>
              Control de estado activo/inactivo, motivos de cese y ubicación del legajo en papel.
            </p>
          </div>

          <div className={styles.grid}>
            {/* Switch de Estado Activo / Inactivo */}
            <div className={styles.col12}>
              <label
                className={`${styles.statusToggleCard} ${
                  esBajaValue ? styles.statusToggleCardBaja : styles.statusToggleCardActivo
                }`}
              >
                <input type="checkbox" className={styles.switchInput} {...register('esBaja')} />
                <span className={styles.switchSlider}></span>
                <div className={styles.statusToggleText}>
                  <strong className={styles.statusTitle}>
                    {esBajaValue ? 'Cliente en Estado de BAJA (Inactivo)' : 'Cliente ACTIVO'}
                  </strong>
                  <span className={styles.statusDescription}>
                    {esBajaValue
                      ? 'El cliente no figurará en las liquidaciones periódicas ni en los envíos de resúmenes.'
                      : 'El cliente se encuentra operativo y habilitado para todas las gestiones contables.'}
                  </span>
                </div>
              </label>
            </div>

            {/* Campos condicionales si es baja */}
            {esBajaValue && (
              <>
                <div className={styles.col4}>
                  <label className={styles.label} htmlFor="fechaBaja">
                    Fecha de Baja <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="fechaBaja"
                    type="date"
                    className={`${styles.input} ${errors.fechaBaja ? styles.inputError : ''}`}
                    {...register('fechaBaja')}
                  />
                  {errors.fechaBaja && (
                    <span className={styles.errorText}>{errors.fechaBaja.message}</span>
                  )}
                </div>

                <div className={styles.col8}>
                  <label className={styles.label} htmlFor="motivoBaja">
                    Motivo de Baja <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="motivoBaja"
                    type="text"
                    className={`${styles.input} ${errors.motivoBaja ? styles.inputError : ''}`}
                    placeholder="Ej: Cese de actividades comerciales / Cambio de estudio contable"
                    {...register('motivoBaja')}
                  />
                  {errors.motivoBaja && (
                    <span className={styles.errorText}>{errors.motivoBaja.message}</span>
                  )}
                </div>
              </>
            )}

            {/* Ubicación física del legajo */}
            <div className={styles.col12}>
              <label className={styles.label} htmlFor="biblioratoCarpeta">
                Bibliorato / Carpeta Física (Archivo del Estudio)
              </label>
              <input
                id="biblioratoCarpeta"
                type="text"
                className={styles.input}
                placeholder="Ej: Estante B - Bibliorato 14 (Sociedades Comerciales)"
                {...register('biblioratoCarpeta')}
              />
              <span className={styles.helperText}>
                Ubicación del legajo en papel para consulta rápida en el archivo físico.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Barra de Acciones Inferior Sticky para Mobile y Desktop */}
      <footer className={styles.stickyFooter}>
        <div className={styles.footerInfo}>
          {isDirty ? (
            <span className={styles.unsavedChangesBadge}>● Cambios pendientes de guardar</span>
          ) : (
            <span className={styles.savedStatusBadge}>✓ Sin cambios pendientes</span>
          )}
        </div>
        <div className={styles.footerActions}>
          {onCancel && (
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className={styles.buttonPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Dar de Alta'}
          </button>
        </div>
      </footer>
    </form>
  );
};
