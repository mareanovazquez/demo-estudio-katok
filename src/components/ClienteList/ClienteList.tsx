import React, { useState, useEffect } from 'react';
import type { Cliente } from '../../types/cliente';
import {
  Search,
  Filter,
  User,
  Building2,
  Edit3,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Archive,
  RefreshCw,
  Eye,
  FileText,
  X,
  Wallet,
} from 'lucide-react';
import { ClienteCuentaModal } from '../ClienteCuentaModal/ClienteCuentaModal';
import styles from './ClienteList.module.css';

interface ClienteListProps {
  clientes: Cliente[];
  onSelectEditar: (cliente: Cliente) => void;
  onNuevoCliente: () => void;
  onToggleBaja: (id: string) => void;
  onResetMockData: () => void;
}

export const ClienteList: React.FC<ClienteListProps> = ({
  clientes,
  onSelectEditar,
  onNuevoCliente,
  onToggleBaja,
  onResetMockData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'fisica' | 'juridica'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'bajas'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [clienteDetalle, setClienteDetalle] = useState<Cliente | null>(null);
  const [clienteCuenta, setClienteCuenta] = useState<Cliente | null>(null);

  // Métricas rápidas
  const totalClientes = clientes.length;
  const activosCount = clientes.filter((c) => !c.esBaja).length;
  const bajasCount = clientes.filter((c) => c.esBaja).length;
  const fisicasCount = clientes.filter((c) => c.tipo === 'fisica').length;
  const juridicasCount = clientes.filter((c) => c.tipo === 'juridica').length;

  // Filtrado dinámico corregido
  const clientesFiltrados = clientes.filter((cliente) => {
    // 1. Filtro por tipo
    if (filtroTipo === 'fisica' && cliente.tipo !== 'fisica') return false;
    if (filtroTipo === 'juridica' && cliente.tipo !== 'juridica') return false;

    // 2. Filtro por estado (activo / baja)
    if (filtroEstado === 'activos' && cliente.esBaja) return false;
    if (filtroEstado === 'bajas' && !cliente.esBaja) return false;

    // 3. Filtro por categoría impositiva
    if (filtroCategoria !== 'todos') {
      const catLower = cliente.categoria.toLowerCase();
      if (filtroCategoria === 'monotributo' && !catLower.includes('monotributo')) return false;
      if (
        filtroCategoria === 'responsable_inscripto' &&
        !catLower.includes('responsable inscripto') &&
        !catLower.includes('ri-')
      )
        return false;
      if (
        filtroCategoria === 'sociedad' &&
        !catLower.includes('sociedad') &&
        !catLower.includes('s.r.l.') &&
        !catLower.includes('s.a.') &&
        !catLower.includes('s.a.s.')
      )
        return false;
    }

    // 4. Buscador por texto
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const qDigits = q.replace(/\D/g, '');

      const matchRazon = cliente.razonSocial.toLowerCase().includes(q);
      const matchCodigo = cliente.codigo.toLowerCase().includes(q);
      const matchLegajo = (cliente.nroLegajo || '').toLowerCase().includes(q);
      const matchEmail = (cliente.email || '').toLowerCase().includes(q);

      // CORRECCIÓN CRÍTICA: solo comparar CUIT por dígitos si el usuario ingresó números
      const matchCuit = qDigits
        ? cliente.cuit.replace(/\D/g, '').includes(qDigits)
        : cliente.cuit.toLowerCase().includes(q);

      return matchRazon || matchCuit || matchCodigo || matchLegajo || matchEmail;
    }

    return true;
  });

  const hasFiltrosActivos =
    searchTerm !== '' ||
    filtroTipo !== 'todos' ||
    filtroEstado !== 'todos' ||
    filtroCategoria !== 'todos';

  const resetAllFilters = () => {
    setSearchTerm('');
    setFiltroTipo('todos');
    setFiltroEstado('todos');
    setFiltroCategoria('todos');
  };

  // Abrir modal solo si la búsqueda/filtro arroja exactamente 1 resultado al presionar Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && clienteDetalle) {
        setClienteDetalle(null);
        return;
      }

      if (e.key === 'Enter' && clientesFiltrados.length === 1 && !clienteDetalle) {
        const activeEl = document.activeElement;
        const tagName = activeEl?.tagName.toUpperCase();

        // Si el usuario está sobre un botón explícito, no interferir con la acción del botón
        if (tagName === 'BUTTON') return;

        e.preventDefault();
        setClienteDetalle(clientesFiltrados[0]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clientesFiltrados, clienteDetalle]);

  return (
    <div className={styles.container}>
      {/* 1. Tarjetas KPI de Métricas Interactivos */}
      <div className={styles.kpiGrid}>
        <button
          type="button"
          className={`${styles.kpiCard} ${
            filtroTipo === 'todos' && filtroEstado === 'todos' ? styles.kpiCardActive : ''
          }`}
          onClick={() => {
            setFiltroTipo('todos');
            setFiltroEstado('todos');
          }}
        >
          <div className={`${styles.kpiIcon} ${styles.iconTotal}`}>
            <Users size={20} />
          </div>
          <div>
            <span className={styles.kpiValue}>{totalClientes}</span>
            <span className={styles.kpiLabel}>Total Clientes</span>
          </div>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${
            filtroEstado === 'activos' ? styles.kpiCardActive : ''
          }`}
          onClick={() => {
            setFiltroEstado(filtroEstado === 'activos' ? 'todos' : 'activos');
          }}
        >
          <div className={`${styles.kpiIcon} ${styles.iconActivos}`}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className={styles.kpiValue}>{activosCount}</span>
            <span className={styles.kpiLabel}>Activos</span>
          </div>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${
            filtroTipo === 'juridica' ? styles.kpiCardActive : ''
          }`}
          onClick={() => {
            setFiltroTipo(filtroTipo === 'juridica' ? 'todos' : 'juridica');
          }}
        >
          <div className={`${styles.kpiIcon} ${styles.iconJuridicas}`}>
            <Building2 size={20} />
          </div>
          <div>
            <span className={styles.kpiValue}>{juridicasCount}</span>
            <span className={styles.kpiLabel}>Personas Jurídicas</span>
          </div>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${
            filtroTipo === 'fisica' ? styles.kpiCardActive : ''
          }`}
          onClick={() => {
            setFiltroTipo(filtroTipo === 'fisica' ? 'todos' : 'fisica');
          }}
        >
          <div className={`${styles.kpiIcon} ${styles.iconFisicas}`}>
            <User size={20} />
          </div>
          <div>
            <span className={styles.kpiValue}>{fisicasCount}</span>
            <span className={styles.kpiLabel}>Personas Físicas</span>
          </div>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${
            filtroEstado === 'bajas' ? styles.kpiCardActive : ''
          }`}
          onClick={() => {
            setFiltroEstado(filtroEstado === 'bajas' ? 'todos' : 'bajas');
          }}
        >
          <div className={`${styles.kpiIcon} ${styles.iconBajas}`}>
            <XCircle size={20} />
          </div>
          <div>
            <span className={styles.kpiValue}>{bajasCount}</span>
            <span className={styles.kpiLabel}>Dados de Baja</span>
          </div>
        </button>
      </div>

      {/* 2. Barra de Herramientas, Buscador y Filtros */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por Razón Social, CUIT, Código o Legajo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {clientesFiltrados.length === 1 && !clienteDetalle && (
            <span
              className={styles.enterHintBadge}
              style={{ right: searchTerm ? '2.35rem' : '0.75rem' }}
              data-tooltip="Presiona Enter para abrir la ficha de este cliente"
            >
              ↵ Enter
            </span>
          )}
          {searchTerm && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchTerm('')}
              data-tooltip="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.filtersWrapper}>
          <div className={styles.filterGroup}>
            <Filter size={16} className={styles.filterIcon} />
            <select
              className={styles.selectFilter}
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
            >
              <option value="todos">Todos los tipos</option>
              <option value="juridica">Personas Jurídicas</option>
              <option value="fisica">Personas Físicas</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              className={styles.selectFilter}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo Activos</option>
              <option value="bajas">Solo Dados de Baja</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              className={styles.selectFilter}
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="todos">Todas las categorías</option>
              <option value="monotributo">Monotributo</option>
              <option value="responsable_inscripto">Responsables Inscriptos</option>
              <option value="sociedad">Sociedades Comercial / S.A. / S.R.L.</option>
            </select>
          </div>

          {hasFiltrosActivos && (
            <button
              type="button"
              className={styles.resetFiltersPill}
              onClick={resetAllFilters}
              data-tooltip="Limpiar todos los filtros"
            >
              <X size={14} />
              <span>Limpiar Filtros</span>
            </button>
          )}

          <button
            type="button"
            className={styles.resetBtn}
            onClick={onResetMockData}
            data-tooltip="Restablecer los 20 clientes iniciales"
          >
            <RefreshCw size={14} />
            <span>Restablecer Demo</span>
          </button>

          <button type="button" className={styles.btnNuevo} onClick={onNuevoCliente}>
            <Plus size={16} />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Indicador de Filtros Aplicados */}
      <div className={styles.resultsSummaryBar}>
        <div className={styles.summaryLeftGroup}>
          <span>
            Mostrando <strong>{clientesFiltrados.length}</strong> de <strong>{totalClientes}</strong> clientes
          </span>
          {clientesFiltrados.length === 1 && !clienteDetalle && (
            <span className={styles.singleResultNotice}>
              ↵ Presiona <strong>Enter</strong> para ver ficha
            </span>
          )}
        </div>
        {hasFiltrosActivos && (
          <div className={styles.activePillsRow}>
            {searchTerm && (
              <span className={styles.activePill}>
                Búsqueda: "{searchTerm}"
                <X size={12} onClick={() => setSearchTerm('')} />
              </span>
            )}
            {filtroTipo !== 'todos' && (
              <span className={styles.activePill}>
                Tipo: {filtroTipo === 'juridica' ? 'Jurídicas' : 'Físicas'}
                <X size={12} onClick={() => setFiltroTipo('todos')} />
              </span>
            )}
            {filtroEstado !== 'todos' && (
              <span className={styles.activePill}>
                Estado: {filtroEstado === 'activos' ? 'Activos' : 'En Baja'}
                <X size={12} onClick={() => setFiltroEstado('todos')} />
              </span>
            )}
            {filtroCategoria !== 'todos' && (
              <span className={styles.activePill}>
                Régimen: {filtroCategoria}
                <X size={12} onClick={() => setFiltroCategoria('todos')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Tabla Principal de Clientes */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cód / Legajo</th>
              <th>Razón Social / Tipo</th>
              <th>C.U.I.T.</th>
              <th>Condición Impositiva</th>
              <th>Domicilio / Sede</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th className={styles.thAcciones}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map((cliente) => (
                <tr
                  key={cliente.id}
                  className={`${cliente.esBaja ? styles.rowBaja : ''}`}
                >
                  <td className={styles.tdCodigo}>
                    <span className={styles.codeBadge}>#{cliente.codigo}</span>
                    {cliente.nroLegajo && (
                      <span className={styles.legajoText}>{cliente.nroLegajo}</span>
                    )}
                  </td>

                  <td className={styles.tdRazonSocial}>
                    <div className={styles.razonSocialRow}>
                      <span className={styles.razonText}>{cliente.razonSocial}</span>
                      <span
                        className={`${styles.typeBadge} ${
                          cliente.tipo === 'juridica'
                            ? styles.badgeJuridica
                            : styles.badgeFisica
                        }`}
                      >
                        {cliente.tipo === 'juridica' ? (
                          <>
                            <Building2 size={12} /> Jurídica
                          </>
                        ) : (
                          <>
                            <User size={12} /> Física
                          </>
                        )}
                      </span>
                    </div>
                  </td>

                  <td className={styles.tdCuit}>
                    <code className={styles.cuitCode}>{cliente.cuit}</code>
                  </td>

                  <td>
                    <div className={styles.impositivoStack}>
                      <span className={styles.categoriaTag}>{cliente.categoria}</span>
                      <div className={styles.impuestosBadges}>
                        <span
                          className={`${styles.miniBadge} ${
                            cliente.iva === 'SI' ? styles.badgeActive : ''
                          }`}
                        >
                          IVA: {cliente.iva}
                        </span>
                        {cliente.ingresosBrutos && (
                          <span className={`${styles.miniBadge} ${styles.badgeActive}`}>
                            IIBB
                          </span>
                        )}
                        {cliente.ganancias && (
                          <span className={`${styles.miniBadge} ${styles.badgeActive}`}>
                            Ganancias
                          </span>
                        )}
                        {cliente.sueldos && (
                          <span className={`${styles.miniBadge} ${styles.badgeActive}`}>
                            Sueldos
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className={styles.tdDomicilio}>
                    <span className={styles.domicilioText}>{cliente.domicilio}</span>
                    {cliente.provinciaSede && (
                      <span className={styles.provinciaSub}>
                        {cliente.provinciaSede}
                      </span>
                    )}
                  </td>

                  <td className={styles.tdContacto}>
                    {cliente.email && (
                      <div className={styles.contactItem} data-tooltip={cliente.email}>
                        <Mail size={13} />
                        <span className={styles.contactText}>{cliente.email}</span>
                      </div>
                    )}
                    {cliente.celularWhatsapp && (
                      <div className={styles.contactItem} data-tooltip={cliente.celularWhatsapp}>
                        <Phone size={13} />
                        <span className={styles.contactText}>
                          {cliente.celularWhatsapp}
                        </span>
                      </div>
                    )}
                  </td>

                  <td>
                    {cliente.esBaja ? (
                      <span className={`${styles.statusBadge} ${styles.statusBaja}`}>
                        Baja
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.statusActivo}`}>
                        Activo
                      </span>
                    )}
                  </td>

                  <td className={styles.tdAcciones}>
                    <div className={styles.accionesRow}>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.btnVer}`}
                        onClick={() => setClienteDetalle(cliente)}
                        data-tooltip="Ver Ficha Completa"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.btnCuenta}`}
                        onClick={() => setClienteCuenta(cliente)}
                        data-tooltip="Cuenta Corriente & Pago de Impuestos"
                      >
                        <Wallet size={15} />
                                              </button>

                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.btnEditar}`}
                        onClick={() => onSelectEditar(cliente)}
                        data-tooltip="Editar cliente en el formulario"
                        data-tooltip-pos="left"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        className={`${styles.actionBtn} ${
                          cliente.esBaja ? styles.btnReactivar : styles.btnBaja
                        }`}
                        onClick={() => onToggleBaja(cliente.id)}
                        data-tooltip={
                          cliente.esBaja
                            ? 'Reactivar cliente'
                            : 'Marcar como baja en el sistema'

                        }
                        data-tooltip-pos="left"
                      >
                        <Archive size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className={styles.emptyTd}>
                  <div className={styles.emptyContainer}>
                    <Users size={36} className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>No se encontraron clientes</p>
                    <p className={styles.emptySub}>
                      Prueba modificando la búsqueda o ajustando los filtros seleccionados.
                    </p>
                    <button
                      type="button"
                      className={styles.resetFiltersBtn}
                      onClick={resetAllFilters}
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Modal / Drawer para Ver Ficha Completa del Cliente */}
      {clienteDetalle && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                {clienteDetalle.tipo === 'juridica' ? (
                  <Building2 size={24} className={styles.modalIcon} />
                ) : (
                  <User size={24} className={styles.modalIcon} />
                )}
                <div>
                  <h3 className={styles.modalTitle}>{clienteDetalle.razonSocial}</h3>
                  <span className={styles.modalSubtitle}>
                    Cód. #{clienteDetalle.codigo} | CUIT: {clienteDetalle.cuit}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setClienteDetalle(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.infoSection}>
                <h4><FileText size={16} /> Identificación y Fechas</h4>
                <div className={styles.infoGrid}>
                  <div><strong>Tipo:</strong> {clienteDetalle.tipo === 'juridica' ? 'Persona Jurídica' : 'Persona Física'}</div>
                  <div><strong>Legajo:</strong> {clienteDetalle.nroLegajo || '—'}</div>
                  <div><strong>Fecha Alta:</strong> {clienteDetalle.fechaAlta}</div>
                  <div><strong>Fecha Inicio Actividad:</strong> {clienteDetalle.fechaInicio || '—'}</div>
                  {clienteDetalle.fechaNacimiento && <div><strong>Fecha Nacimiento:</strong> {clienteDetalle.fechaNacimiento}</div>}
                  <div><strong>Agencia AFIP:</strong> {clienteDetalle.agencia || '—'}</div>
                  <div><strong>Domicilio Fiscal:</strong> {clienteDetalle.domicilioFiscal}</div>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h4><CheckCircle2 size={16} /> Encuadre Impositivo & Facturación</h4>
                <div className={styles.infoGrid}>
                  <div><strong>Categoría:</strong> {clienteDetalle.categoria}</div>
                  <div><strong>Estado IVA:</strong> {clienteDetalle.iva}</div>
                  <div><strong>Periodicidad Fact.:</strong> {clienteDetalle.periodicidad}</div>
                  <div><strong>Tipo Comprobante:</strong> Comprobante '{clienteDetalle.fac}'</div>
                  <div><strong>Sueldos / Empleador:</strong> {clienteDetalle.sueldos ? 'Sí' : 'No'}</div>
                  <div><strong>Factura Electrónica:</strong> {clienteDetalle.facturaElectronica ? 'Sí' : 'No'}</div>
                  <div><strong>Bibliorato / Archivo:</strong> {clienteDetalle.biblioratoCarpeta || '—'}</div>
                </div>
              </div>

              {clienteDetalle.relaciones && clienteDetalle.relaciones.length > 0 && (
                <div className={styles.infoSection}>
                  <h4><Users size={16} /> Relaciones / Apoderados</h4>
                  <div className={styles.relacionesList}>
                    {clienteDetalle.relaciones.map((rel) => (
                      <div key={rel.id} className={styles.relItem}>
                        <span className={styles.relNombre}>{rel.clienteNombre}</span>
                        <span className={styles.relType}>Vínculo: <strong>{rel.tipoVinculo}</strong></span>
                        {rel.clienteCuit && <span className={styles.relCuit}>CUIT: {rel.clienteCuit}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {clienteDetalle.esBaja && (
                <div className={`${styles.infoSection} ${styles.infoBaja}`}>
                  <h4><Archive size={16} /> Información de Baja</h4>
                  <p><strong>Fecha Baja:</strong> {clienteDetalle.fechaBaja}</p>
                  <p><strong>Motivo:</strong> {clienteDetalle.motivoBaja}</p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalBtnEditar}
                onClick={() => {
                  const target = clienteDetalle;
                  setClienteDetalle(null);
                  onSelectEditar(target);
                }}
              >
                <Edit3 size={16} />
                <span>Editar este Cliente</span>
              </button>
              <button
                type="button"
                className={styles.modalBtnCerrar}
                onClick={() => setClienteDetalle(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal de Cuenta Corriente e Ingresos / Pago de Impuestos */}
      {clienteCuenta && (
        <ClienteCuentaModal
          cliente={clienteCuenta}
          onClose={() => setClienteCuenta(null)}
        />
      )}
    </div>
  );
};
