import React, { useEffect, useState } from 'react';
import type { Cliente, ItemDesgloseMovimiento } from '../../types/cliente';
import { clienteService } from '../../services/clienteService';
import { formatMontoInput, parseMontoInput } from '../../utils/currency';
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
  Loader2,
} from 'lucide-react';
import styles from './ClienteCuentaModal.module.css';

interface ClienteCuentaModalProps {
  cliente: Cliente;
  onClose: () => void;
}

export const MEDIOS_PAGO_LIST = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'debito_automatico', label: 'Débito Automático' },
];

export const CUENTAS_LIST = [
  { value: 'caja_estudio', label: 'Caja Estudio', medios: ['efectivo'] },
  { value: 'caja_cristina', label: 'Caja Cristina', medios: ['efectivo'] },
  {
    value: 'banco_provincia_cc',
    label: 'Banco Provincia - Cta. Cte.',
    medios: ['transferencia', 'cheque', 'debito_automatico'],
  },
  {
    value: 'icbc_ca',
    label: 'ICBC - Caja de Ahorro',
    medios: ['transferencia', 'debito_automatico'],
  },
];

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
  const [activeTab, setActiveTab] = useState<'ingreso' | 'egreso' | 'historial'>('historial');

  const saldoActual = cliente.saldoCuenta || 0;
  const movimientos = cliente.movimientosCuenta || [];

  // Conceptos que ya tienen al menos un ingreso cargado en el historial
  // (se usa para restringir el desglose de egresos a esos conceptos)
  const conceptosConIngresoSet = new Set<string>();
  movimientos.forEach((mov) => {
    if (mov.tipo === 'ingreso' && mov.items) {
      mov.items.forEach((it) => conceptosConIngresoSet.add(it.motivo));
    }
  });
  const conceptosConIngreso = MOTIVOS_CUENTA_LIST.filter((m) =>
    conceptosConIngresoSet.has(m.value)
  );

  // --- Form 1: Ingresar Dinero (Monto Total + Desglose 1 a N de Conceptos) ---
  const [ingresoMonto, setIngresoMonto] = useState<string>('');
  const [ingresoMedioPago, setIngresoMedioPago] = useState<string>('efectivo');
  const cuentasDisponibles = CUENTAS_LIST.filter((c) =>
    c.medios.includes(ingresoMedioPago)
  );
  const [ingresoCuenta, setIngresoCuenta] = useState<string>(
    cuentasDisponibles[0]?.value || ''
  );
  const [ingresoFecha, setIngresoFecha] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [ingresoComprobante, setIngresoComprobante] = useState<string>('');
  const [ingresoComentarios, setIngresoComentarios] = useState<string>('');
  const [ingresoItems, setIngresoItems] = useState<FormItemState[]>([
    { id: `item-ing-${Date.now()}-1`, motivo: 'Honorarios', monto: '', periodoDetalle: '' },
  ]);

  // --- Form 2: Egreso / Pago (Monto Total + Desglose 1 a N de Conceptos) ---
  const [egresoMontoTotal, setEgresoMontoTotal] = useState<string>('');
  const [egresoMedioPago, setEgresoMedioPago] = useState<string>('efectivo');
  const cuentasDisponiblesEgreso = CUENTAS_LIST.filter((c) =>
    c.medios.includes(egresoMedioPago)
  );
  const [egresoCuenta, setEgresoCuenta] = useState<string>(
    cuentasDisponiblesEgreso[0]?.value || ''
  );
  const [egresoFecha, setEgresoFecha] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [egresoComprobanteVEP, setEgresoComprobanteVEP] = useState<string>('');
  const [egresoComentarios, setEgresoComentarios] = useState<string>('');
  const [egresoItems, setEgresoItems] = useState<FormItemState[]>([
    {
      id: `item-egr-${Date.now()}-1`,
      motivo: conceptosConIngreso[0]?.value || '',
      monto: '',
      periodoDetalle: '',
    },
  ]);

  // Si un ítem quedó con motivo vacío (porque al agregarlo aún no había
  // conceptos con ingreso disponibles) y luego se habilita alguno, el
  // <select> controlado no tiene forma de reflejar ese '' en el DOM y el
  // navegador muestra la primera opción como si estuviera seleccionada,
  // aunque el estado siga vacío. Esto rompía la validación de la suma de
  // conceptos aun cuando los montos coincidían. Se resincroniza acá.
  const conceptosConIngresoKey = conceptosConIngreso.map((c) => c.value).join('|');
  useEffect(() => {
    if (!conceptosConIngreso.length) return;
    setEgresoItems((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        const motivoValido = it.motivo && conceptosConIngreso.some((c) => c.value === it.motivo);
        if (motivoValido) return it;
        changed = true;
        return { ...it, motivo: conceptosConIngreso[0].value };
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptosConIngresoKey]);

  // Mensaje de éxito
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados de carga (spinner en botón de confirmar mientras se procesa el movimiento)
  const [isSubmittingIngreso, setIsSubmittingIngreso] = useState(false);
  const [isSubmittingEgreso, setIsSubmittingEgreso] = useState(false);

  // --- Helper para obtener saldo de ingresos por concepto ---
  const getSaldoPorConcepto = (concept: string) => {
    let totalIngresos = 0;
    let totalEgresos = 0;
    movimientos.forEach((mov) => {
      if (mov.items && mov.items.length > 0) {
        mov.items.forEach((it) => {
          if (it.motivo === concept) {
            if (mov.tipo === 'ingreso') {
              totalIngresos += it.monto;
            } else {
              totalEgresos += it.monto;
            }
          }
        });
      }
    });
    return totalIngresos - totalEgresos;
  };

  // --- Helpers de cálculo y validación de desglosado para Ingreso ---
  const sumaIngresoItems = ingresoItems.reduce(
    (acc, it) => acc + parseMontoInput(it.monto),
    0
  );
  const totalIngresoOperacion = parseMontoInput(ingresoMonto);
  const difIngreso = Math.abs(totalIngresoOperacion - sumaIngresoItems);
  const isIngresoValido =
    totalIngresoOperacion > 0 &&
    ingresoItems.length > 0 &&
    difIngreso < 0.01 &&
    ingresoItems.every((i) => parseMontoInput(i.monto) > 0);

  const handleChangeIngresoMedioPago = (value: string) => {
    setIngresoMedioPago(value);
    const opciones = CUENTAS_LIST.filter((c) => c.medios.includes(value));
    setIngresoCuenta(opciones[0]?.value || '');
  };

  // Manipulación de filas desglosadas en Ingreso
  const handleAddIngresoItem = () => {
    setIngresoItems((prev) => [
      ...prev,
      { id: `item-ing-${Date.now()}-${prev.length + 1}`, motivo: 'IVA', monto: '', periodoDetalle: '' },
    ]);
  };

  const handleRemoveIngresoItem = (id: string) => {
    if (ingresoItems.length <= 1) return;
    setIngresoItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateIngresoItem = (
    id: string,
    field: keyof FormItemState,
    value: string
  ) => {
    const finalValue = field === 'monto' ? formatMontoInput(value) : value;
    setIngresoItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: finalValue } : it))
    );
  };

  // --- Helpers de cálculo y validación de desglosado para Egreso ---
  const sumaEgresoItems = egresoItems.reduce(
    (acc, it) => acc + parseMontoInput(it.monto),
    0
  );
  const totalEgresoOperacion = parseMontoInput(egresoMontoTotal);
  const difEgreso = Math.abs(totalEgresoOperacion - sumaEgresoItems);
  const isEgresoValido =
    totalEgresoOperacion > 0 &&
    egresoItems.length > 0 &&
    difEgreso < 0.01 &&
    egresoItems.every((i) => parseMontoInput(i.monto) > 0 && i.motivo);

  const handleChangeEgresoMedioPago = (value: string) => {
    setEgresoMedioPago(value);
    const opciones = CUENTAS_LIST.filter((c) => c.medios.includes(value));
    setEgresoCuenta(opciones[0]?.value || '');
  };

  // Manipulación de filas desglosadas en Egreso
  const handleAddEgresoItem = () => {
    setEgresoItems((prev) => [
      ...prev,
      {
        id: `item-egr-${Date.now()}-${prev.length + 1}`,
        motivo: conceptosConIngreso[0]?.value || '',
        monto: '',
        periodoDetalle: '',
      },
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
    const finalValue = field === 'monto' ? formatMontoInput(value) : value;
    setEgresoItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: finalValue } : it))
    );
  };

  // Submit Ingreso (Entrada con Desglose 1-N)
  const handleSubmitedIngreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingIngreso) return;
    if (!isIngresoValido) {
      alert('La suma de los conceptos desglosados debe ser exactamente igual al monto total del ingreso.');
      return;
    }

    setIsSubmittingIngreso(true);

    const itemsDesglose: ItemDesgloseMovimiento[] = ingresoItems.map((it) => ({
      id: it.id,
      motivo: it.motivo,
      monto: parseMontoInput(it.monto),
      periodoDetalle: it.periodoDetalle || undefined,
    }));

    const motivosResumen = Array.from(new Set(itemsDesglose.map((i) => i.motivo))).join(', ');
    const conceptoTexto = `Ingreso: ${motivosResumen}`;

    setTimeout(() => {
      clienteService.registrarMovimientoCuenta(cliente.id, {
        fecha: ingresoFecha,
        tipo: 'ingreso',
        monto: totalIngresoOperacion,
        concepto: conceptoTexto,
        items: itemsDesglose,
        nroComprobanteVEP: ingresoComprobante || undefined,
        observaciones: ingresoComentarios || undefined,
        medioPago: ingresoMedioPago,
        cuentaId: ingresoCuenta,
      });

      setIngresoMonto('');
      setIngresoComprobante('');
      setIngresoComentarios('');
      setIngresoItems([
        { id: `item-ing-${Date.now()}-1`, motivo: 'Honorarios', monto: '', periodoDetalle: '' },
      ]);
      handleChangeIngresoMedioPago('efectivo');
      setIsSubmittingIngreso(false);
      setMensajeExito(`¡Ingreso de dinero por ${formatCurrency(totalIngresoOperacion)} registrado exitosamente!`);
      setTimeout(() => setMensajeExito(null), 3500);
    }, 500);
  };

  // Submit Egreso (Salida con Desglose 1-N y validación contra saldo de ingresos)
  const handleSubmitedEgreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingEgreso) return;
    if (!isEgresoValido) {
      alert('La suma de los conceptos desglosados debe ser exactamente igual al monto total del egreso.');
      return;
    }

    // Verificar si hay desvíos con respecto a los saldos por concepto
    const desvios = egresoItems
      .map((it) => {
        const montoConcepto = parseMontoInput(it.monto);
        const saldoConcepto = getSaldoPorConcepto(it.motivo);
        if (Math.abs(montoConcepto - saldoConcepto) >= 0.01) {
          return {
            motivo: it.motivo,
            monto: montoConcepto,
            saldo: saldoConcepto,
          };
        }
        return null;
      })
      .filter((d) => d !== null);

    if (desvios.length > 0) {
      const msg = desvios
        .map(
          (d) =>
            `- ${d!.motivo}: Egreso de ${formatCurrency(d!.monto)} vs Ingreso de ${formatCurrency(d!.saldo)}`
        )
        .join('\n');
      const confirmar = window.confirm(
        `Advertencia: Hay conceptos cuyos montos no coinciden con el ingreso acumulado registrado:\n\n${msg}\n\n¿Desea registrar el egreso de todas formas?`
      );
      if (!confirmar) {
        return;
      }
    }

    setIsSubmittingEgreso(true);

    const itemsDesglose: ItemDesgloseMovimiento[] = egresoItems.map((it) => ({
      id: it.id,
      motivo: it.motivo,
      monto: parseMontoInput(it.monto),
      periodoDetalle: it.periodoDetalle || undefined,
    }));

    const motivosResumen = Array.from(new Set(itemsDesglose.map((i) => i.motivo))).join(', ');
    const conceptoTexto = `Egreso: ${motivosResumen}`;

    setTimeout(() => {
      clienteService.registrarMovimientoCuenta(cliente.id, {
        fecha: egresoFecha,
        tipo: 'egreso_impuesto',
        monto: totalEgresoOperacion,
        concepto: conceptoTexto,
        items: itemsDesglose,
        nroComprobanteVEP: egresoComprobanteVEP || undefined,
        observaciones: egresoComentarios || undefined,
        medioPago: egresoMedioPago,
        cuentaId: egresoCuenta,
      });

      setEgresoMontoTotal('');
      setEgresoComprobanteVEP('');
      setEgresoComentarios('');
      setEgresoItems([
        {
          id: `item-egr-${Date.now()}-1`,
          motivo: conceptosConIngreso[0]?.value || '',
          monto: '',
          periodoDetalle: '',
        },
      ]);
      handleChangeEgresoMedioPago('efectivo');
      setIsSubmittingEgreso(false);
      setMensajeExito(`¡Egreso por ${formatCurrency(totalEgresoOperacion)} registrado exitosamente!`);
      setTimeout(() => setMensajeExito(null), 3500);
    }, 500);
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
              activeTab === 'historial' ? styles.tabBtnActiveHistorial : ''
            }`}
            onClick={() => setActiveTab('historial')}
          >
            <History size={16} />
            <span>Historial ({movimientos.length})</span>
          </button>

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
          {/* TAB 1: INGRESAR DINERO (Ingreso con Desglose 1-N) */}
          {activeTab === 'ingreso' && (
            <form onSubmit={handleSubmitedIngreso} className={styles.formGrid}>
              <div className={styles.ingresoTopRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Monto Total del Ingreso ($) *</label>
                  <div className={styles.amountWrapper}>
                    <span className={styles.currencyPrefix}>$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`${styles.fieldInput} ${styles.amountInput}`}
                      placeholder="0,00"
                      value={ingresoMonto}
                      onChange={(e) => setIngresoMonto(formatMontoInput(e.target.value))}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Medio de Pago *</label>
                  <select
                    className={styles.fieldSelect}
                    value={ingresoMedioPago}
                    onChange={(e) => handleChangeIngresoMedioPago(e.target.value)}
                    required
                  >
                    {MEDIOS_PAGO_LIST.map((m) => (
                      <option key={`medio-${m.value}`} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Cuenta / Caja de Destino *</label>
                  <select
                    className={styles.fieldSelect}
                    value={ingresoCuenta}
                    onChange={(e) => setIngresoCuenta(e.target.value)}
                    required
                    disabled={cuentasDisponibles.length === 0}
                  >
                    {cuentasDisponibles.map((c) => (
                      <option key={`cuenta-${c.value}`} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
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
              </div>

              {/* SECCIÓN DESGLOSE DE CONCEPTOS / IMPUESTOS (1 a N) PARA INGRESO */}
              <div className={styles.desgloseSection}>
                <div className={styles.desgloseHeader}>
                  <h4 className={styles.desgloseTitle}>
                    <ListPlus size={16} /> Desglose de Conceptos / Impuestos (1 a N)
                  </h4>
                  <button
                    type="button"
                    className={styles.btnAgregarItem}
                    onClick={handleAddIngresoItem}
                  >
                    <Plus size={14} />
                    <span>Agregar Concepto</span>
                  </button>
                </div>

                {ingresoItems.map((item) => (
                  <div key={item.id} className={styles.desgloseRow}>
                    <select
                      className={styles.fieldSelect}
                      value={item.motivo}
                      onChange={(e) =>
                        handleUpdateIngresoItem(item.id, 'motivo', e.target.value)
                      }
                      required
                    >
                      {MOTIVOS_CUENTA_LIST.map((m) => (
                        <option key={`ing-${item.id}-${m.value}`} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>

                    <div className={styles.amountWrapper}>
                      <span className={styles.currencyPrefix}>$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`${styles.fieldInput} ${styles.amountInput}`}
                        placeholder="0,00"
                        value={item.monto}
                        onChange={(e) =>
                          handleUpdateIngresoItem(item.id, 'monto', e.target.value)
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
                        handleUpdateIngresoItem(item.id, 'periodoDetalle', e.target.value)
                      }
                    />

                    {ingresoItems.length > 1 && (
                      <button
                        type="button"
                        className={styles.btnRemoveItem}
                        onClick={() => handleRemoveIngresoItem(item.id)}
                        data-tooltip="Eliminar concepto"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* BANNER DE VALIDACIÓN DE SUMA PARA INGRESO */}
              {totalIngresoOperacion > 0 && (
                <div
                  className={`${styles.validationBanner} ${
                    isIngresoValido
                      ? styles.validationSuccess
                      : styles.validationError
                  }`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isIngresoValido ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                    <span>
                      {isIngresoValido
                        ? '¡El desglose coincide perfectamente con el Monto Total!'
                        : `La suma de conceptos (${formatCurrency(
                            sumaIngresoItems
                          )}) no coincide con el Monto Total (${formatCurrency(
                            totalIngresoOperacion
                          )})`}
                    </span>
                  </div>
                  {!isIngresoValido && (
                    <span>Diferencia: {formatCurrency(difIngreso)}</span>
                  )}
                </div>
              )}

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
                  disabled={!isIngresoValido || isSubmittingIngreso}
                  style={{
                    opacity: isIngresoValido && !isSubmittingIngreso ? 1 : 0.5,
                    cursor: isIngresoValido && !isSubmittingIngreso ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isSubmittingIngreso ? (
                    <Loader2 size={18} className={styles.spinnerIcon} />
                  ) : (
                    <ArrowDownRight size={18} />
                  )}
                  <span>{isSubmittingIngreso ? 'Procesando...' : 'Confirmar Ingreso a Cuenta'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: EGRESO / PAGO DE IMPUESTOS (Monto Total + Desglose 1-N) */}
          {activeTab === 'egreso' && (
            <form onSubmit={handleSubmitedEgreso} className={styles.formGrid}>
              <div className={styles.ingresoTopRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Monto Total del Egreso ($) *</label>
                  <div className={styles.amountWrapper}>
                    <span className={styles.currencyPrefix}>$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`${styles.fieldInput} ${styles.amountInput}`}
                      placeholder="0,00"
                      value={egresoMontoTotal}
                      onChange={(e) => setEgresoMontoTotal(formatMontoInput(e.target.value))}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Medio de Pago *</label>
                  <select
                    className={styles.fieldSelect}
                    value={egresoMedioPago}
                    onChange={(e) => handleChangeEgresoMedioPago(e.target.value)}
                    required
                  >
                    {MEDIOS_PAGO_LIST.map((m) => (
                      <option key={`medio-egr-${m.value}`} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Cuenta / Caja de Origen *</label>
                  <select
                    className={styles.fieldSelect}
                    value={egresoCuenta}
                    onChange={(e) => setEgresoCuenta(e.target.value)}
                    required
                    disabled={cuentasDisponiblesEgreso.length === 0}
                  >
                    {cuentasDisponiblesEgreso.map((c) => (
                      <option key={`cuenta-egr-${c.value}`} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
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
                    disabled={conceptosConIngreso.length === 0}
                    style={
                      conceptosConIngreso.length === 0
                        ? { opacity: 0.5, cursor: 'not-allowed' }
                        : undefined
                    }
                  >
                    <Plus size={14} />
                    <span>Agregar Concepto</span>
                  </button>
                </div>

                {conceptosConIngreso.length === 0 ? (
                  <div className={styles.emptyState}>
                    <AlertTriangle size={28} className={styles.emptyIcon} />
                    <p style={{ fontWeight: 600, color: '#334155', margin: 0 }}>
                      Aún no hay conceptos disponibles para egreso
                    </p>
                    <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      Registra primero un ingreso con el concepto correspondiente para poder
                      habilitar su egreso.
                    </p>
                  </div>
                ) : (
                  egresoItems.map((item) => {
                  const itemMontoNum = parseMontoInput(item.monto);
                  const saldoConcepto = getSaldoPorConcepto(item.motivo);
                  const coinciden = itemMontoNum > 0 ? Math.abs(itemMontoNum - saldoConcepto) < 0.01 : true;

                  return (
                    <div key={item.id} className={styles.desgloseRowWrapper}>
                      <div className={styles.desgloseRow}>
                        <select
                          className={styles.fieldSelect}
                          value={item.motivo}
                          onChange={(e) =>
                            handleUpdateEgresoItem(item.id, 'motivo', e.target.value)
                          }
                          required
                        >
                          {conceptosConIngreso.map((m) => (
                            <option key={`egr-${item.id}-${m.value}`} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>

                        <div className={styles.amountWrapper}>
                          <span className={styles.currencyPrefix}>$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`${styles.fieldInput} ${styles.amountInput}`}
                            placeholder="0,00"
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
                            data-tooltip="Eliminar concepto"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      {!coinciden && (
                        <div className={styles.conceptWarning}>
                          <AlertTriangle size={14} />
                          <span>
                            No coincide con el saldo de ingreso acumulado para este concepto ({formatCurrency(saldoConcepto)})
                          </span>
                        </div>
                      )}
                    </div>
                  );
                  })
                )}
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
                  disabled={!isEgresoValido || isSubmittingEgreso}
                  style={{
                    opacity: isEgresoValido && !isSubmittingEgreso ? 1 : 0.5,
                    cursor: isEgresoValido && !isSubmittingEgreso ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isSubmittingEgreso ? (
                    <Loader2 size={18} className={styles.spinnerIcon} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                  <span>{isSubmittingEgreso ? 'Procesando...' : 'Registrar Egreso de Cuenta'}</span>
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
                        <th>Medio de Pago / Cuenta</th>
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
                            {mov.items && mov.items.length > 0 ? (
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
                              <strong>{mov.concepto || (mov.tipo === 'ingreso' ? 'Ingreso de fondos / Depósito' : 'Egreso de fondos')}</strong>
                            )}
                          </td>
                          <td>
                            {mov.medioPago ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                <span>
                                  {MEDIOS_PAGO_LIST.find((m) => m.value === mov.medioPago)?.label ||
                                    mov.medioPago}
                                </span>
                                {mov.cuentaId && (
                                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                    {CUENTAS_LIST.find((c) => c.value === mov.cuentaId)?.label ||
                                      mov.cuentaId}
                                  </span>
                                )}
                              </div>
                            ) : (
                              '—'
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
