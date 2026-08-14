import React, { useState } from 'react';
import type { Cliente, ItemDesgloseMovimiento } from '../../types/cliente';
import { clienteService } from '../../services/clienteService';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  History,
  CheckCircle2,
  Receipt,
  MessageSquare,
  Plus,
  Trash2,
  AlertTriangle,
  ListPlus,
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

interface FormItemState {
  id: string;
  motivo: string;
  monto: string;
  periodoDetalle: string;
}

export const ClienteCuentaModal: React.FC<ClienteCuentaModalProps> = ({
  cliente,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ingreso' | 'egreso' | 'historial'>('ingreso');

  // --- Form 1: Ingresar Dinero (Monto Global sin conceptos fijos) ---
  const [ingresoMonto, setIngresoMonto] = useState<string>('');
  const [ingresoFecha, setIngresoFecha] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [ingresoComprobante, setIngresoComprobante] = useState<string>('');
  const [ingresoComentarios, setIngresoComentarios] = useState<string>('');

  // --- Form 2: Egreso / Pago (Monto Total + Desglose 1 a N de Conceptos) ---
  const [egresoMontoTotal, setEgresoMontoTotal] = useState<string>('');
  const [egresoFecha, setEgresoFecha] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [egresoComprobanteVEP, setEgresoComprobanteVEP] = useState<string>('');
  const [egresoComentarios, setEgresoComentarios] = useState<string>('');
  const [egresoItems, setEgresoItems] = useState<FormItemState[]>([
    { id: `item-${Date.now()}-1`, motivo: 'Honorarios', monto: '', periodoDetalle: '' },
  ]);

  // Mensaje de éxito
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const saldoActual = cliente.saldoCuenta || 0;
  const movimientos = cliente.movimientosCuenta || [];

  // --- Helpers de validación para Ingreso ---
  const totalIngresoOperacion = parseFloat(ingresoMonto) || 0;
  const isIngresoValido = totalIngresoOperacion > 0;

  // --- Helpers de cálculo y validación de desglosado para Egreso ---
  const sumaEgresoItems = egresoItems.reduce(
    (acc, it) => acc + (parseFloat(it.monto) || 0),
    0
  );
  const totalEgresoOperacion = parseFloat(egresoMontoTotal) || 0;
  const difEgreso = Math.abs(totalEgresoOperacion - sumaEgresoItems);
  const isEgresoValido =
    totalEgresoOperacion > 0 &&
    egresoItems.length > 0 &&
    difEgreso < 0.01 &&
    egresoItems.every((i) => parseFloat(i.monto) > 0);

  // Manipulación de filas desglosadas en Egreso
  const handleAddEgresoItem = () => {
    setEgresoItems((prev) => [
      ...prev,
      { id: `item-${Date.now()}-${prev.length + 1}`, motivo: 'IVA', monto: '', periodoDetalle: '' },
    ]);
  };

  const handleRemoveEgresoItem = (id: string) => {
    if (egresoItems.length <= 1) return;
    setEgresoItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateEgresoItem = (
    id: string,
    field: keyof FormItemState,
    value: string
  ) => {
    setEgresoItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Submit Ingreso (Entrada Global)
  const handleSubmitedIngreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isIngresoValido) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    clienteService.registrarMovimientoCuenta(cliente.id, {
      fecha: ingresoFecha,
      tipo: 'ingreso',
      monto: totalIngresoOperacion,
      concepto: 'Ingreso de fondos / Depósito',
      nroComprobanteVEP: ingresoComprobante || undefined,
      observaciones: ingresoComentarios || undefined,
    });

    setIngresoMonto('');
    setIngresoComprobante('');
    setIngresoComentarios('');
    setMensajeExito(`¡Ingreso de dinero por ${formatCurrency(totalIngresoOperacion)} registrado exitosamente!`);
    setTimeout(() => setMensajeExito(null), 3500);
  };

  // Submit Egreso (Salida con Desglose 1-N)
  const handleSubmitedEgreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEgresoValido) {
      alert('La suma de los conceptos desglosados debe ser exactamente igual al monto total del egreso.');
      return;
    }

    const itemsDesglose: ItemDesgloseMovimiento[] = egresoItems.map((it) => ({
      id: it.id,
      motivo: it.motivo,
      monto: parseFloat(it.monto) || 0,
      periodoDetalle: it.periodoDetalle || undefined,
    }));

    const motivosResumen = Array.from(new Set(itemsDesglose.map((i) => i.motivo))).join(', ');
    const conceptoTexto = `Egreso: ${motivosResumen}`;

    clienteService.registrarMovimientoCuenta(cliente.id, {
      fecha: egresoFecha,
      tipo: 'egreso_impuesto',
      monto: totalEgresoOperacion,
      concepto: conceptoTexto,
      items: itemsDesglose,
      nroComprobanteVEP: egresoComprobanteVEP || undefined,
      observaciones: egresoComentarios || undefined,
    });

    setEgresoMontoTotal('');
    setEgresoComprobanteVEP('');
    setEgresoComentarios('');
    setEgresoItems([
      { id: `item-${Date.now()}-1`, motivo: 'Honorarios', monto: '', periodoDetalle: '' },
    ]);
    setMensajeExito(`¡Egreso por ${formatCurrency(totalEgresoOperacion)} registrado exitosamente!`);
    setTimeout(() => setMensajeExito(null), 3500);
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
          {/* TAB 1: INGRESAR DINERO (Ingreso Global) */}
          {activeTab === 'ingreso' && (
            <form onSubmit={handleSubmitedIngreso} className={styles.formGrid}>
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
                  placeholder="Comentarios o aclaraciones sobre el depósito de dinero..."
                  value={ingresoComentarios}
                  onChange={(e) => setIngresoComentarios(e.target.value)}
                />
              </div>

              <div className={styles.fullWidth}>
                <button
                  type="submit"
                  className={styles.submitBtnIngreso}
                  disabled={!isIngresoValido}
                  style={{
                    opacity: isIngresoValido ? 1 : 0.5,
                    cursor: isIngresoValido ? 'pointer' : 'not-allowed',
                  }}
                >
                  <ArrowDownRight size={18} />
                  <span>Confirmar Ingreso a Cuenta</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: EGRESO / PAGO DE IMPUESTOS (Monto Total + Desglose 1-N) */}
          {activeTab === 'egreso' && (
            <form onSubmit={handleSubmitedEgreso} className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Monto Total del Egreso ($) *</label>
                <div className={styles.amountWrapper}>
                  <span className={styles.currencyPrefix}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`${styles.fieldInput} ${styles.amountInput}`}
                    placeholder="0.00"
                    value={egresoMontoTotal}
                    onChange={(e) => setEgresoMontoTotal(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
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

              {/* SECCIÓN DESGLOSE DE CONCEPTOS / IMPUESTOS (1 a N) */}
              <div className={styles.desgloseSection}>
                <div className={styles.desgloseHeader}>
                  <h4 className={styles.desgloseTitle}>
                    <ListPlus size={16} /> Desglose de Conceptos / Impuestos (1 a N)
                  </h4>
                  <button
                    type="button"
                    className={styles.btnAgregarItem}
                    onClick={handleAddEgresoItem}
                  >
                    <Plus size={14} />
                    <span>Agregar Concepto</span>
                  </button>
                </div>

                {egresoItems.map((item) => (
                  <div key={item.id} className={styles.desgloseRow}>
                    <select
                      className={styles.fieldSelect}
                      value={item.motivo}
                      onChange={(e) =>
                        handleUpdateEgresoItem(item.id, 'motivo', e.target.value)
                      }
                      required
                    >
                      {MOTIVOS_CUENTA_LIST.map((m) => (
                        <option key={`egr-${item.id}-${m.value}`} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>

                    <div className={styles.amountWrapper}>
                      <span className={styles.currencyPrefix}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className={`${styles.fieldInput} ${styles.amountInput}`}
                        placeholder="Monto"
                        value={item.monto}
                        onChange={(e) =>
                          handleUpdateEgresoItem(item.id, 'monto', e.target.value)
                        }
                        required
                      />
                    </div>

                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="Período/Detalle (ej: 07/2026)"
                      value={item.periodoDetalle}
                      onChange={(e) =>
                        handleUpdateEgresoItem(item.id, 'periodoDetalle', e.target.value)
                      }
                    />

                    {egresoItems.length > 1 && (
                      <button
                        type="button"
                        className={styles.btnRemoveItem}
                        onClick={() => handleRemoveEgresoItem(item.id)}
                        title="Eliminar concepto"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* BANNER DE VALIDACIÓN DE SUMA */}
              {totalEgresoOperacion > 0 && (
                <div
                  className={`${styles.validationBanner} ${
                    isEgresoValido
                      ? styles.validationSuccess
                      : styles.validationError
                  }`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isEgresoValido ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                    <span>
                      {isEgresoValido
                        ? '¡El desglose coincide perfectamente con el Monto Total!'
                        : `La suma de conceptos (${formatCurrency(
                            sumaEgresoItems
                          )}) no coincide con el Monto Total (${formatCurrency(
                            totalEgresoOperacion
                          )})`}
                    </span>
                  </div>
                  {!isEgresoValido && (
                    <span>Diferencia: {formatCurrency(difEgreso)}</span>
                  )}
                </div>
              )}

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
                  placeholder="Comentarios o aclaraciones sobre el egreso..."
                  value={egresoComentarios}
                  onChange={(e) => setEgresoComentarios(e.target.value)}
                />
              </div>

              <div className={styles.fullWidth}>
                <button
                  type="submit"
                  className={styles.submitBtnEgreso}
                  disabled={!isEgresoValido}
                  style={{
                    opacity: isEgresoValido ? 1 : 0.5,
                    cursor: isEgresoValido ? 'pointer' : 'not-allowed',
                  }}
                >
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
                        <th>Concepto / Desglose de Impuestos</th>
                        <th>Comprobante / VEP</th>
                        <th>Comentarios</th>
                        <th style={{ textAlign: 'right' }}>Monto Total</th>
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
                            {mov.tipo === 'ingreso' ? (
                              <strong>Ingreso de Fondos / Depósito</strong>
                            ) : mov.items && mov.items.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {mov.items.map((it) => (
                                  <div key={it.id} style={{ fontSize: '0.78125rem' }}>
                                    <span className={styles.itemBadgePill}>{it.motivo}</span>
                                    <strong>{formatCurrency(it.monto)}</strong>
                                    {it.periodoDetalle && (
                                      <span style={{ color: '#64748b', marginLeft: '0.35rem' }}>
                                        ({it.periodoDetalle})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <strong>{mov.concepto}</strong>
                            )}
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
