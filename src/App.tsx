import { useState, useEffect } from 'react';
import { ClienteForm } from './components/ClienteForm/ClienteForm';
import { ClienteList } from './components/ClienteList/ClienteList';
import type { Cliente, ClienteFormData } from './types/cliente';
import { clienteService } from './services/clienteService';
import { PlusCircle, ListFilter, CheckCircle, Database, ArrowLeft } from 'lucide-react';
import styles from './App.module.css';

export function App() {
  const [vista, setVista] = useState<'listado' | 'formulario'>('listado');
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>(() => clienteService.getClientes());
  const [submittedPayload, setSubmittedPayload] = useState<Cliente | null>(null);

  // Escuchar cambios en clienteService (guardados, bajas, resets)
  useEffect(() => {
    const syncClientes = () => {
      setClientes(clienteService.getClientes());
    };
    const unsubscribe = clienteService.subscribe(syncClientes);
    syncClientes();
    return () => unsubscribe();
  }, []);

  // Handler para guardar desde el formulario
  const handleSubmitForm = (formData: ClienteFormData) => {
    const guardado = clienteService.saveCliente({
      ...formData,
      id: clienteAEditar?.id,
    });
    setSubmittedPayload(guardado);
  };

  // Navegar a edición de cliente
  const handleSelectEditar = (cliente: Cliente) => {
    setClienteAEditar(cliente);
    setVista('formulario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navegar a alta nueva
  const handleNuevoCliente = () => {
    setClienteAEditar(null);
    setVista('formulario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cambiar estado baja
  const handleToggleBaja = (id: string) => {
    clienteService.toggleEstadoBaja(id);
  };

  // Restablecer mock data de 20 clientes
  const handleResetMockData = () => {
    if (
      window.confirm(
        '¿Desea restablecer la nómina a los 20 clientes ficticios originales?'
      )
    ) {
      clienteService.resetToMockData();
    }
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

        {/* Barra de navegación principal */}
        <div className={styles.demoBar}>
          <button
            type="button"
            className={`${styles.demoBtn} ${
              vista === 'listado' ? styles.demoBtnActive : ''
            }`}
            onClick={() => {
              setVista('listado');
              setClienteAEditar(null);
            }}
          >
            <ListFilter size={15} />
            <span>Nómina de Clientes ({clientes.length})</span>
          </button>

          <button
            type="button"
            className={`${styles.demoBtn} ${
              vista === 'formulario' ? styles.demoBtnActive : ''
            }`}
            onClick={handleNuevoCliente}
          >
            <PlusCircle size={15} />
            <span>
              {clienteAEditar ? `Editando: ${clienteAEditar.codigo}` : 'Nuevo Cliente'}
            </span>
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Vista 1: Listado de Clientes con Tabla y Filtros */}
        {vista === 'listado' && (
          <ClienteList
            clientes={clientes}
            onSelectEditar={handleSelectEditar}
            onNuevoCliente={handleNuevoCliente}
            onToggleBaja={handleToggleBaja}
            onResetMockData={handleResetMockData}
          />
        )}

        {/* Vista 2: Formulario completo de Alta / Edición */}
        {vista === 'formulario' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={styles.actionButton}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#475569',
                }}
                onClick={() => {
                  setVista('listado');
                  setClienteAEditar(null);
                }}
              >
                <ArrowLeft size={16} />
                <span>Volver al Listado de Clientes</span>
              </button>
            </div>

            <ClienteForm
              key={clienteAEditar ? `edit-${clienteAEditar.id}` : 'alta-nueva'}
              initialData={clienteAEditar || undefined}
              nextCodigo={clienteService.getNextCodigo()}
              onSubmit={handleSubmitForm}
              onCancel={() => {
                setVista('listado');
                setClienteAEditar(null);
              }}
              isEditing={!!clienteAEditar}
            />
          </div>
        )}

        {/* Modal de confirmación y datos guardados */}
        {submittedPayload && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleRow}>
                  <CheckCircle size={26} className={styles.successIcon} />
                  <div>
                    <h3 className={styles.modalTitle}>
                      ¡Cliente Guardado Exitosamente!
                    </h3>
                    <span className={styles.modalDescription}>
                      Razón Social: <strong>{submittedPayload.razonSocial}</strong> | CUIT: <strong>{submittedPayload.cuit}</strong>
                    </span>
                  </div>
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
                El cliente ha sido procesado y persistido en la nómina del estudio:
              </p>

              <pre className={styles.codePreview}>
                {JSON.stringify(submittedPayload, null, 2)}
              </pre>

              <div className={styles.modalFooter} style={{ gap: '0.75rem' }}>
                <button
                  type="button"
                  className={styles.actionButton}
                  style={{ backgroundColor: '#0f172a' }}
                  onClick={() => {
                    setSubmittedPayload(null);
                    setVista('listado');
                    setClienteAEditar(null);
                  }}
                >
                  Volver al Listado
                </button>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => setSubmittedPayload(null)}
                >
                  Seguir Editando
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
