import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, User, Building2 } from 'lucide-react';
import type { ClienteResumen } from '../../types/cliente';
import { clienteService } from '../../services/clienteService';
import styles from './ClienteSearchSelector.module.css';

interface ClienteSearchSelectorProps {
  value?: string;
  selectedName?: string;
  onSelect: (cliente: ClienteResumen) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  excludeId?: string;
}

/**
 * Función auxiliar para resaltar coincidencias en el texto de búsqueda
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className={styles.highlight}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export const ClienteSearchSelector: React.FC<ClienteSearchSelectorProps> = ({
  value,
  selectedName,
  onSelect,
  onClear,
  placeholder = 'Buscar por razón social, CUIT o código...',
  disabled = false,
  error,
  excludeId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [clientesList, setClientesList] = useState<ClienteResumen[]>(() => clienteService.getClientesResumen());
  const containerRef = useRef<HTMLDivElement>(null);

  // Escuchar actualizaciones de clienteService
  useEffect(() => {
    const updateList = () => {
      setClientesList(clienteService.getClientesResumen());
    };
    const unsubscribe = clienteService.subscribe(updateList);
    updateList();
    return () => unsubscribe();
  }, []);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableClientes = clientesList.filter(
    (c) => !excludeId || c.id !== excludeId
  );

  const filteredClientes = availableClientes.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');
    const matchCuit = qDigits ? c.cuit.replace(/\D/g, '').includes(qDigits) : c.cuit.toLowerCase().includes(q);
    return (
      c.razonSocial.toLowerCase().includes(q) ||
      matchCuit ||
      c.codigo.toLowerCase().includes(q)
    );
  });

  const selectedClient = clientesList.find((c) => c.id === value);


  return (
    <div className={styles.selectorWrapper} ref={containerRef}>
      {selectedClient || (value && selectedName) ? (
        <div className={`${styles.selectedCard} ${disabled ? styles.disabled : ''}`}>
          <div className={styles.selectedInfo}>
            <div className={styles.selectedIcon}>
              {(selectedClient?.tipo || 'fisica') === 'juridica' ? (
                <Building2 size={16} />
              ) : (
                <User size={16} />
              )}
            </div>
            <div className={styles.selectedDetails}>
              <span className={styles.selectedName}>
                {selectedClient?.razonSocial || selectedName}
              </span>
              <span className={styles.selectedMeta}>
                Cód. <span className={styles.monoText}>{selectedClient?.codigo || '—'}</span> | CUIT{' '}
                <span className={styles.monoText}>{selectedClient?.cuit || '—'}</span>
              </span>
            </div>
          </div>
          {!disabled && onClear && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setQuery('');
                onClear();
              }}
              title="Quitar cliente seleccionado"
              aria-label="Quitar selección"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className={styles.inputContainer}>
          <div className={styles.inputPrefix}>
            <Search size={16} />
          </div>
          <input
            type="text"
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            placeholder={placeholder}
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          {query && (
            <button
              type="button"
              className={styles.inputSuffixBtn}
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>{filteredClientes.length} clientes encontrados</span>
          </div>
          <div className={styles.dropdownList}>
            {filteredClientes.length > 0 ? (
              filteredClientes.map((cliente) => {
                const isSelected = cliente.id === value;
                return (
                  <button
                    key={cliente.id}
                    type="button"
                    className={`${styles.dropdownItem} ${
                      isSelected ? styles.dropdownItemSelected : ''
                    }`}
                    onClick={() => {
                      onSelect(cliente);
                      setIsOpen(false);
                      setQuery('');
                    }}
                  >
                    <div className={styles.itemIcon}>
                      {cliente.tipo === 'juridica' ? (
                        <Building2 size={16} />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitleRow}>
                        <span className={styles.itemName}>
                          <HighlightMatch text={cliente.razonSocial} query={query} />
                        </span>
                        <span
                          className={`${styles.typeBadge} ${
                            cliente.tipo === 'juridica'
                              ? styles.badgeJuridica
                              : styles.badgeFisica
                          }`}
                        >
                          {cliente.tipo === 'juridica' ? 'Jurídica' : 'Física'}
                        </span>
                      </div>
                      <div className={styles.itemMeta}>
                        <span>
                          Cód.{' '}
                          <strong className={styles.monoText}>
                            <HighlightMatch text={cliente.codigo} query={query} />
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          CUIT:{' '}
                          <strong className={styles.monoText}>
                            <HighlightMatch text={cliente.cuit} query={query} />
                          </strong>
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className={styles.checkIcon}>
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className={styles.noResults}>
                <p>No se encontraron clientes coincidentes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
