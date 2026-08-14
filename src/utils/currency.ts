/**
 * Utilidades para inputs de dinero con formato local (es-AR):
 * separador de miles "." y separador decimal ",".
 */

/** Formatea el valor de un input de monto a medida que el usuario escribe. */
export function formatMontoInput(raw: string): string {
  let cleaned = raw.replace(/[^0-9,]/g, '');

  const firstComma = cleaned.indexOf(',');
  if (firstComma !== -1) {
    cleaned = cleaned.slice(0, firstComma + 1) + cleaned.slice(firstComma + 1).replace(/,/g, '');
  }

  if (cleaned === '') return '';

  let [intPart, decPart] = cleaned.split(',');
  intPart = intPart.replace(/^0+(?=\d)/, '');

  if (decPart !== undefined) {
    decPart = decPart.slice(0, 2);
    if (intPart === '') intPart = '0';
  }

  const intFormatted = intPart === '' ? '' : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart !== undefined ? `${intFormatted},${decPart}` : intFormatted;
}

/** Convierte el valor formateado ("1.234,56") a número (1234.56). */
export function parseMontoInput(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
