import React, { useState } from 'react';
import type { Cliente } from '../../types/cliente';
import { clienteService } from '../../services/clienteService';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  History,
  CheckCircle2,
  Receipt,
  MessageSquare,
} from 'lucide-react';
import styles from './ClienteCuentaModal.module.css';

interface ClienteCuentaModalProps {
  cliente: Cliente;
  onClose: () => void;
}

export const MOTIVOS_CUENTA_LIST = [
  { value: 'Honorarios', label: 'Honorarios Profesionales Estudio' },
  { value: 'IVA', label: 'IVA (Débito/Crédito)' },
  { value: 'IIBB / Convenio', label: 'Ingresos Brutos / Convenio Multilateral' },
  { value: 'Monotributo', label: 'Monotributo (Cuota unificada)' },
  { value: 'Ganancias', label: 'Impuesto a las Ganancias' },
  { value: 'Autónomos', label: 'Autónomos / Jubilación' },
  { value: 'Sueldos 931', label: 'Sueldos / Cargas Sociales (F.931)' },
  { value: 'Bienes Personales', label: 'Bienes Personales' },
  { value: 'Tasas Municipales', label: 'Tasas Municipales / Seguridad e Higiene' },
  { value: 'Varios', label: 'Varios (Gastos Varios / Provisión General)' },
  { value: 'Otro', label: 'Otro Concepto / Impuesto' },
];

export const ClienteCuentaModal: React.FC<ClienteCuentaModalProps> = ({
  cliente,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ingreso' | 'egreso' | 'historial'>('ingreso');

  // Form para Ingreso (Entrada)
  const [ingresoMotivo, setIngresoMotivo] = useState<string>('Honorarios');
  const [ingresoMonto, setIngresoMonto] = useState<string>('');
  const [ingresoFecha, setIngresoFecha] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [ingresoPeriodo, setIngresoPeriodo] = useState<string>('');
  const [ingresoComprobante, setIngresoComprobante] = useState<string>('');
  const [ingresoComentarios, setIngresoComentarios] = useState<string>('');

  // Form para Egreso (Salida / Pago)
  const [egresoMotivo, setEgresoMotivo] = useState<string>('Honorarios');
  const [egresoMonto, setEgresoMonto] = useState<string>('');
  const [egresoFecha, setEgresoFecha] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [egresoPeriodo, setEgresoPeriodo] = useState<string>('');
  const [egresoComprobanteVEP, setEgresoComprobanteVEP] = useState<string>('');
  const [egresoComentarios, setEgresoComentarios] = useState<string>('');

  // Mensaje de éxito
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const saldoActual = cliente.saldoCuenta || 0;
  const movimientos = cliente.movimientosCuenta || [];

  const handleSubmitedIngreso = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(ingresoMonto);
    if (!montoNum || montoNum <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    const conceptoTexto = `Ingreso: ${ingresoMotivo}${ingresoPeriodo ? ` (${ingresoPeriodo})` : ''}`;

    clienteService.registrarMovimientoCuenta(cliente.id, {
      fecha: ingresoFecha,
      tipo: 'ingreso',
      monto: montoNum,
      concepto: conceptoTexto,
      impuestoNombre: ingresoMotivo,
      nroComprobanteVEP: ingresoComprobante || undefined,
      observaciones: ingresoComentarios || undefined,
    });

    setIngresoMonto('');
    setIngresoPeriodo('');
    setIngresoComprobante('');
    setIngresoComentarios('');
    setMensajeExito(`¡Ingreso por "${ingresoMotivo}" registrado exitosamente!`);
    setTimeout(() => setMensajeExito(null), 3000);
  };

  const handleSubmitedEgreso = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(egresoMonto);
    if (!montoNum || montoNum <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    const conceptoTexto = `Egreso: ${egresoMotivo}${egresoPeriodo ? ` (${egresoPeriodo})` : ''}`;

    clienteService.registrarMovimientoCuenta(cliente.id, {
      fecha: egresoFecha,
      tipo: 'egreso_impuesto',
      monto: montoNum,
      concepto: conceptoTexto,
      impuestoNombre: egresoMotivo,
      nroComprobanteVEP: egresoComprobanteVEP || undefined,
      observaciones: egresoComentarios || undefined,
    });

    setEgresoMonto('');
    setEgresoPeriodo('');
    setEgresoComprobanteVEP('');
    setEgresoComentarios('');
    setMensajeExito(`¡Egreso por "${egresoMotivo}" registrado exitosamente!`);
    setTimeout(() => setMensajeExito(null), 3000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div className={styles.modalIcon}>
              <Wallet size={24} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Cuenta Corriente & Impuestos</h3>
              <span className={styles.modalSubtitle}>
                Cliente: <strong>{cliente.razonSocial}</strong> | CUIT: {cliente.cuit}
              </span>
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Balance Banner */}
        <div className={styles.balanceBanner}>
          <span className={styles.balanceLabel}>Saldo de Cuenta Corriente:</span>
          <div className={styles.balanceValueRow}>
            <span className={styles.balanceAmount}>{formatCurrency(saldoActual)}</span>
            {saldoActual > 0 ? (
              <span className={styles.badgePositivo}>A favor del cliente</span>
            ) : saldoActual < 0 ? (
              <span className={styles.badgeNegativo}>Saldo Deudor</span>
            ) : (
              <span className={styles.badgeCero}>Sin saldo</span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabsBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${
              activeTab === 'ingreso' ? styles.tabBtnActiveIngreso : ''
            }`}
            onClick={() => setActiveTab('ingreso')}
          >
            <ArrowDownRight size={16} />
            <span>Ingresar Dinero</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${
              activeTab === 'egreso' ? styles.tabBtnActiveEgreso : ''
            }`}
            onClick={() => setActiveTab('egreso')}
          >
            <ArrowUpRight size={16} />
            <span>Egreso / Pago Impuesto</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${
              activeTab === 'historial' ? styles.tabBtnActiveHistorial : ''
            }`}
            onClick={() => setActiveTab('historial')}
          >
            <History size={16} />
            <span>Historial ({movimientos.length})</span>
          </button>
        </div>

        {/* Toast / Mensaje Exito */}
        {mensajeExito && (
          <div
            style={{
              padding: '0.625rem 1.5rem',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderBottom: '1px solid #a7f3d0',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* TAB 1: INGRESAR DINERO */}
          {activeTab === 'ingreso' && (
            <form onSubmit={handleSubmitedIngreso} className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Motivo de Ingreso *</label>
                <select
                  className={styles.fieldSelect}
                  value={ingresoMotivo}
                  onChange={(e) => setIngresoMotivo(e.target.value)}
                  required
                >
                  {MOTIVOS_CUENTA_LIST.map((m) => (
                    <option key={`ing-${m.value}`} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Monto a Ingresar ($) *</label>
                <div className={styles.amountWrapper}>
                  <span className={styles.currencyPrefix}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`${styles.fieldInput} ${styles.amountInput}`}
                    placeholder="0.00"
                    value={ingresoMonto}
                    onChange={(e) => setIngresoMonto(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Período / Detalle (opcional)</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Ej: Periodo 07/2026 u Honorarios Mes"
                  value={ingresoPeriodo}
                  onChange={(e) => setIngresoPeriodo(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Fecha de Movimiento *</label>
                <input
                  type="date"
                  className={styles.fieldInput}
                  value={ingresoFecha}
                  onChange={(e) => setIngresoFecha(e.target.value)}
                  required
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>
                  N° Comprobante / Recibo / Transferencia (opcional)
                </label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Ej: TRX-9823410 o Recibo #0012"
                  value={ingresoComprobante}
                  onChange={(e) => setIngresoComprobante(e.target.value)}
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>
                  Comentarios / Observaciones asociadas (opcional)
                </label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Escriba aquí cualquier comentario o aclaración sobre este ingreso..."
                  value={ingresoComentarios}
                  onChange={(e) => setIngresoComentarios(e.target.value)}
                />
              </div>

              <div className={styles.fullWidth}>
                <button type="submit" className={styles.submitBtnIngreso}>
                  <ArrowDownRight size={18} />
                  <span>Confirmar Ingreso a Cuenta</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PAGO / EGRESO */}
          {activeTab === 'egreso' && (
            <form onSubmit={handleSubmitedEgreso} className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Motivo de Egreso / Pago *</label>
                <select
                  className={styles.fieldSelect}
                  value={egresoMotivo}
                  onChange={(e) => setEgresoMotivo(e.target.value)}
                  required
                >
                  {MOTIVOS_CUENTA_LIST.map((m) => (
                    <option key={`egr-${m.value}`} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Monto del Egreso ($) *</label>
                <div className={styles.amountWrapper}>
                  <span className={styles.currencyPrefix}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`${styles.fieldInput} ${styles.amountInput}`}
                    placeholder="0.00"
                    value={egresoMonto}
                    onChange={(e) => setEgresoMonto(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Período / Detalle (opcional)</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Ej: Periodo 07/2026 o Cuota 2"
                  value={egresoPeriodo}
                  onChange={(e) => setEgresoPeriodo(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Fecha de Movimiento *</label>
                <input
                  type="date"
                  className={styles.fieldInput}
                  value={egresoFecha}
                  onChange={(e) => setEgresoFecha(e.target.value)}
                  required
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>
                  N° de VEP / Comprobante de Pago (opcional)
                </label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Ej: VEP N° 458912389 o Ticket de Pago"
                  value={egresoComprobanteVEP}
                  onChange={(e) => setEgresoComprobanteVEP(e.target.value)}
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>
                  Comentarios / Observaciones asociadas (opcional)
                </label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Escriba aquí cualquier comentario o aclaración sobre este egreso..."
                  value={egresoComentarios}
                  onChange={(e) => setEgresoComentarios(e.target.value)}
                />
              </div>

              <div className={styles.fullWidth}>
                <button type="submit" className={styles.submitBtnEgreso}>
                  <ArrowUpRight size={18} />
                  <span>Registrar Egreso de Cuenta</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: HISTORIAL DE MOVIMIENTOS */}
          {activeTab === 'historial' && (
            <div>
              {movimientos.length > 0 ? (
                <div className={styles.historyTableWrapper}>
                  <table className={styles.historyTable}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Motivo / Detalle</th>
                        <th>Comprobante / VEP</th>
                        <th>Comentarios</th>
                        <th style={{ textAlign: 'right' }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.map((mov) => (
                        <tr key={mov.id}>
                          <td>{mov.fecha}</td>
                          <td>
                            {mov.tipo === 'ingreso' ? (
                              <span className={styles.typeBadgeIngreso}>
                                <ArrowDownRight size={12} /> Ingreso
                              </span>
                            ) : (
                              <span className={styles.typeBadgeEgreso}>
                                <ArrowUpRight size={12} /> Egreso
                              </span>
                            )}
                          </td>
                          <td>
                            <strong>{mov.concepto}</strong>
                          </td>
                          <td>{mov.nroComprobanteVEP || '—'}</td>
                          <td>
                            {mov.observaciones ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  color: '#475569',
                                  fontSize: '0.78125rem',
                                }}
                              >
                                <MessageSquare size={12} />
                                {mov.observaciones}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td
                            style={{ textAlign: 'right' }}
                            className={
                              mov.tipo === 'ingreso'
                                ? styles.amountCellIngreso
                                : styles.amountCellEgreso
                            }
                          >
                            {mov.tipo === 'ingreso' ? '+' : '-'} {formatCurrency(mov.monto)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Receipt size={36} className={styles.emptyIcon} />
                  <p style={{ fontWeight: 600, color: '#334155', margin: 0 }}>
                    Sin movimientos registrados
                  </p>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                    Utiliza los botones superiores para registrar ingresos o egresos en esta cuenta.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
