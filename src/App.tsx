import { useState } from 'react';
import { ClienteForm } from './components/ClienteForm/ClienteForm';
import type { ClienteFormData } from './types/cliente';
import { PlusCircle, Edit3, CheckCircle, Database } from 'lucide-react';
import styles from './App.module.css';

// Ejemplo de datos para modo edición (Persona Jurídica con relaciones)
const CLIENTE_EJEMPLO_JURIDICA: Partial<ClienteFormData> = {
  codigo: '1042',
  razonSocial: 'Katok & Asociados S.R.L.',
  tipo: 'juridica',
  cuit: '30-71458921-8',
  domicilio: 'Av. Corrientes 1250, Piso 4 Of. A, CABA',
  domicilioFiscal: 'Av. Corrientes 1250, Piso 4 Of. A, CABA',
  nroLegajo: 'L-1042',
  actividades: [
    '692000 - Servicios de contabilidad, auditoría y asesoría fiscal',
    '702000 - Servicios de consultoría en gestión empresarial',
    '',
  ],
  agencia: 'Agencia 50 AFIP',
  dgr: '901-28491823-1',
  provinciaSede: 'CABA',
  convenioMultilateralNro: '901-28491823-1',
  fechaAlta: '2020-03-15',
  fechaInicio: '2018-06-01',
  iva: 'SI',
  ingresosBrutos: true,
  municipal: true,
  publicidadPropaganda: false,
  ganancias: true,
  autonomos: false,
  bienesPersonales: false,
  balance: true,
  gananciaMinimaPresunta: false,
  categoria: 'Sociedad Comercial',
  catFacturacion: 'CAT-A1',
  cra: 'CRA-88',
  contr: 'CONTR-02',
  tedCla: 'CLA-01',
  redParaVep: 'Interbanking / Banelco',
  apo: 'Mariano Katok',
  retGanancias: true,
  retIngresosBrutos: true,
  retSuss: true,
  sueldos: true,
  facturaElectronica: true,
  periodicidad: 'Mensual',
  fac: 'F',
  cdor: 'MK',
  clienteParaCobroId: '',
  clienteParaCobroNombre: '',
  mesCierre: 12,
  telefonoFijo: '011 4371-8899',
  celularWhatsapp: '+54 9 11 4455-8899',
  email: 'administracion@katokasoc.com.ar',
  canalPreferido: 'ambos',
  relaciones: [
    {
      id: 'rel-1',
      clienteId: 'cli-002',
      clienteNombre: 'Mariano Javier Katok',
      clienteCuit: '20-28945612-4',
      clienteCodigo: '1043',
      tipoVinculo: 'apoderado',
    },
  ],
  esBaja: false,
  biblioratoCarpeta: 'Estante 2 - Bibliorato Jurídicas A-K',
};

// Ejemplo de persona física para probar
const CLIENTE_EJEMPLO_FISICA: Partial<ClienteFormData> = {
  codigo: '1044',
  razonSocial: 'Lucía Belén Gómez',
  tipo: 'fisica',
  cuit: '27-34567890-3',
  domicilio: 'Calle Florida 537, 2° B, CABA',
  domicilioFiscal: 'Calle Florida 537, 2° B, CABA',
  nroLegajo: 'L-1044',
  actividades: ['749000 - Actividades profesionales y técnicas n.c.p.', '', ''],
  agencia: 'Agencia 49',
  dgr: '27-34567890-3',
  provinciaSede: 'CABA',
  convenioMultilateralNro: '',
  fechaAlta: '2023-01-10',
  fechaNacimiento: '1989-07-22',
  fechaInicio: '2023-01-01',
  iva: 'SI',
  ingresosBrutos: true,
  municipal: false,
  publicidadPropaganda: false,
  ganancias: false,
  autonomos: false,
  bienesPersonales: false,
  balance: false,
  gananciaMinimaPresunta: false,
  categoria: 'Monotributo - Cat. C',
  retGanancias: false,
  retIngresosBrutos: false,
  retSuss: false,
  sueldos: false,
  facturaElectronica: true,
  periodicidad: 'Mensual',
  fac: 'F',
  cdor: 'MK',
  clienteParaCobroId: 'cli-006',
  clienteParaCobroNombre: 'Carlos Alberto Rodríguez',
  mesCierre: 12,
  telefonoFijo: '',
  celularWhatsapp: '+54 9 11 3344-5566',
  email: 'lucia.gomez@hotmail.com',
  canalPreferido: 'whatsapp',
  relaciones: [
    {
      id: 'rel-2',
      clienteId: 'cli-006',
      clienteNombre: 'Carlos Alberto Rodríguez',
      clienteCuit: '20-18765432-1',
      clienteCodigo: '1047',
      tipoVinculo: 'cliente_cobro',
    },
  ],
  esBaja: false,
  biblioratoCarpeta: 'Cajón 4 - Monotributistas G',
};

function App() {
  const [modo, setModo] = useState<'alta' | 'editar_juridica' | 'editar_fisica'>('alta');
  const [submittedPayload, setSubmittedPayload] = useState<ClienteFormData | null>(null);

  const handleSubmitForm = (data: ClienteFormData) => {
    setSubmittedPayload(data);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <Database size={22} />
          </div>
          <div>
            <span className={styles.brandTitle}>Estudio Katok</span>
            <span className={styles.brandSubtitle}>Sistema de Gestión Contable</span>
          </div>
          <span className={styles.brandBadge}>Maestro de Clientes v2.0</span>
        </div>

        {/* Selector de modo para demostración y testing interactivo */}
        <div className={styles.demoBar}>
          <span className={styles.demoLabel}>Probar vista:</span>
          <button
            type="button"
            className={`${styles.demoBtn} ${modo === 'alta' ? styles.demoBtnActive : ''}`}
            onClick={() => {
              setModo('alta');
              setSubmittedPayload(null);
            }}
          >
            <PlusCircle size={14} />
            <span>Alta Nueva</span>
          </button>
          <button
            type="button"
            className={`${styles.demoBtn} ${
              modo === 'editar_juridica' ? styles.demoBtnActive : ''
            }`}
            onClick={() => {
              setModo('editar_juridica');
              setSubmittedPayload(null);
            }}
          >
            <Edit3 size={14} />
            <span>Editar Jurídica</span>
          </button>
          <button
            type="button"
            className={`${styles.demoBtn} ${
              modo === 'editar_fisica' ? styles.demoBtnActive : ''
            }`}
            onClick={() => {
              setModo('editar_fisica');
              setSubmittedPayload(null);
            }}
          >
            <Edit3 size={14} />
            <span>Editar Física</span>
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Renderizado dinámico del formulario según el modo */}
        {modo === 'alta' && (
          <ClienteForm
            key="form-alta"
            onSubmit={handleSubmitForm}
            onCancel={() => alert('Operación cancelada')}
            isEditing={false}
          />
        )}

        {modo === 'editar_juridica' && (
          <ClienteForm
            key="form-juridica"
            initialData={CLIENTE_EJEMPLO_JURIDICA}
            onSubmit={handleSubmitForm}
            onCancel={() => setModo('alta')}
            isEditing={true}
          />
        )}

        {modo === 'editar_fisica' && (
          <ClienteForm
            key="form-fisica"
            initialData={CLIENTE_EJEMPLO_FISICA}
            onSubmit={handleSubmitForm}
            onCancel={() => setModo('alta')}
            isEditing={true}
          />
        )}

        {/* Modal / Panel de Datos Guardados para verificar la estructura */}
        {submittedPayload && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleRow}>
                  <CheckCircle size={24} className={styles.successIcon} />
                  <h3 className={styles.modalTitle}>Payload de Cliente Procesado</h3>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setSubmittedPayload(null)}
                >
                  ✕
                </button>
              </div>
              <p className={styles.modalDescription}>
                Estructura de datos tipada (<code>ClienteFormData</code>) validada por el esquema Zod:
              </p>
              <pre className={styles.codePreview}>
                {JSON.stringify(submittedPayload, null, 2)}
              </pre>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => setSubmittedPayload(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
