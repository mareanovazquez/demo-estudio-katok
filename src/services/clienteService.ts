import type { Cliente, ClienteFormData, ClienteResumen } from '../types/cliente';
import { MOCK_CLIENTES_COMPLETOS } from '../data/mockClientes';

const STORAGE_KEY = 'katok_maestro_clientes_v2';

/**
 * Servicio de gestión de clientes para el Estudio Katok.
 * Mantiene la lista en localStorage con fallback inicial a los 20 clientes mock.
 */
class ClienteService {
  private listeners: Set<() => void> = new Set();

  /**
   * Obtiene la lista completa de clientes.
   */
  public getClientes(): Cliente[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error leyendo clientes de localStorage:', e);
    }

    // Si no hay datos en localStorage, inicializar con los 20 mock
    this.saveAllToStorage(MOCK_CLIENTES_COMPLETOS);
    return MOCK_CLIENTES_COMPLETOS;
  }

  /**
   * Obtiene un cliente por su ID.
   */
  public getClienteById(id: string): Cliente | undefined {
    const clientes = this.getClientes();
    return clientes.find((c) => c.id === id);
  }

  /**
   * Obtiene el resumen de clientes para autocompletado y selectores.
   */
  public getClientesResumen(): ClienteResumen[] {
    return this.getClientes().map((c) => ({
      id: c.id,
      codigo: c.codigo,
      razonSocial: c.razonSocial,
      cuit: c.cuit,
      tipo: c.tipo,
      email: c.email,
      celularWhatsapp: c.celularWhatsapp,
    }));
  }

  /**
   * Guarda o actualiza un cliente.
   * Retorna el cliente guardado con su ID asignado.
   */
  public saveCliente(data: ClienteFormData & { id?: string }): Cliente {
    const clientes = this.getClientes();
    let clienteGuardado: Cliente;

    if (data.id) {
      // Edición de cliente existente
      const index = clientes.findIndex((c) => c.id === data.id);
      if (index !== -1) {
        clienteGuardado = {
          ...data,
          id: data.id,
        };
        clientes[index] = clienteGuardado;
      } else {
        clienteGuardado = {
          ...data,
          id: data.id,
        };
        clientes.push(clienteGuardado);
      }
    } else {
      // Alta de nuevo cliente
      const nextId = `cli-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
      clienteGuardado = {
        ...data,
        id: nextId,
      };
      clientes.unshift(clienteGuardado);
    }

    this.saveAllToStorage(clientes);
    this.notifyListeners();
    return clienteGuardado;
  }

  /**
   * Cambia el estado de un cliente a baja o lo reactiva.
   */
  public toggleEstadoBaja(id: string, motivoBaja?: string): Cliente | undefined {
    const clientes = this.getClientes();
    const cliente = clientes.find((c) => c.id === id);
    if (!cliente) return undefined;

    const fechaHoy = new Date().toISOString().split('T')[0];
    cliente.esBaja = !cliente.esBaja;
    if (cliente.esBaja) {
      cliente.fechaBaja = fechaHoy;
      cliente.motivoBaja = motivoBaja || 'Baja procesada manualmente desde la nómina de clientes.';
    } else {
      cliente.fechaBaja = '';
      cliente.motivoBaja = '';
    }

    this.saveAllToStorage(clientes);
    this.notifyListeners();
    return cliente;
  }

  /**
   * Restablece los datos de clientes al dataset original de 20 clientes mock.
   */
  public resetToMockData(): Cliente[] {
    this.saveAllToStorage(MOCK_CLIENTES_COMPLETOS);
    this.notifyListeners();
    return MOCK_CLIENTES_COMPLETOS;
  }

  /**
   * Permite suscribirse a cambios de datos.
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private saveAllToStorage(clientes: Cliente[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const clienteService = new ClienteService();
