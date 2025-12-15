import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import './Prestamos.css';

type Prestamo = {
  id: number;
  fecha: string;
  hora: string;
  lector: string;
  dni: string;
  bibliografia: string;
  codigo: string;
  estado: string;
};

type ModalType = 'view' | 'edit' | 'new' | 'delete';

const initialPrestamos: Prestamo[] = [
  {
    id: 1,
    fecha: '2023-07-09',
    hora: '14:30',
    lector: 'Jose Luis Carpio Gomez',
    dni: '74425242',
    bibliografia: 'Código Infinito: Explorando el Desarrollo de Software',
    codigo: '1805-002-01',
    estado: 'Vigente',
  },
  {
    id: 2,
    fecha: '2023-07-09',
    hora: '14:30',
    lector: 'Jose Luis Carpio Gomez',
    dni: '74425242',
    bibliografia: 'Código Infinito: Explorando el Desarrollo de Software',
    codigo: '1805-002-01',
    estado: 'Vencido',
  },
];

export default function Prestamos() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  setTitle?.('Préstamos');

  const [prestamos, setPrestamos] = useState<Prestamo[]>(initialPrestamos);
  const [modal, setModal] = useState<ModalType | null>(null);
  const [selected, setSelected] = useState<Prestamo | null>(null);

  const openModal = (type: ModalType, prestamo: Prestamo | null = null) => {
    setSelected(prestamo);
    setModal(type);
  };

  const closeModal = () => {
    setSelected(null);
    setModal(null);
  };

  const deletePrestamo = () => {
    if (!selected) return;
    setPrestamos(prestamos.filter((p) => p.id !== selected.id));
    closeModal();
  };

  return (
    <>
      <div className="filters-card">
        <input className="input" placeholder="Buscar por lector o bibliografía" />
        <input className="input" type="date" />
        <select className="input">
          <option value="">Estado</option>
          <option value="Vigente">Vigente</option>
          <option value="Vencido">Vencido</option>
          <option value="Devuelto">Devuelto</option>
        </select>
        <button className="btn-new" onClick={() => openModal('new')}>
          ➕ Nuevo
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Nro.</th>
              <th>Fecha de solicitud</th>
              <th>Lector</th>
              <th>Bibliografía</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prestamos.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>
                  {p.fecha}, {p.hora}
                </td>
                <td>
                  {p.lector}
                  <div className="sub">DNI: {p.dni}</div>
                </td>
                <td>
                  {p.bibliografia}
                  <div className="sub">ID: {p.codigo}</div>
                </td>
                <td>
                  <span className={`estado ${p.estado.toLowerCase()}`}>{p.estado}</span>
                </td>
                <td className="actions">
                  <button title="Ver" onClick={() => openModal('view', p)}>
                    👁️
                  </button>
                  <button title="Editar" onClick={() => openModal('edit', p)}>
                    ✏️
                  </button>
                  <button title="Eliminar" onClick={() => openModal('delete', p)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            {modal === 'view' && selected && (
              <>
                <h3>Detalle del Préstamo</h3>
                <div className="grid">
                  <p>
                    <b>Lector:</b> {selected.lector}
                  </p>
                  <p>
                    <b>DNI:</b> {selected.dni}
                  </p>
                  <p>
                    <b>Bibliografía:</b> {selected.bibliografia}
                  </p>
                  <p>
                    <b>Código:</b> {selected.codigo}
                  </p>
                  <p>
                    <b>Fecha:</b> {selected.fecha} {selected.hora}
                  </p>
                  <p>
                    <b>Estado:</b> {selected.estado}
                  </p>
                </div>
                <button className="btn" onClick={closeModal}>
                  Cerrar
                </button>
              </>
            )}

            {(modal === 'new' || modal === 'edit') && (
              <>
                <h3>{modal === 'new' ? 'Registrar Préstamo' : 'Editar Préstamo'}</h3>
                <form className="form-grid">
                  <input placeholder="Lector" defaultValue={selected?.lector} />
                  <input placeholder="DNI" defaultValue={selected?.dni} />
                  <input placeholder="Bibliografía" defaultValue={selected?.bibliografia} />
                  <input placeholder="Código" defaultValue={selected?.codigo} />
                  <input type="date" defaultValue={selected?.fecha} />
                  <select defaultValue={selected?.estado || 'Vigente'}>
                    <option>Vigente</option>
                    <option>Vencido</option>
                    <option>Devuelto</option>
                  </select>
                </form>
                <div className="modal-actions">
                  <button className="btn" onClick={closeModal}>
                    Guardar
                  </button>
                  <button className="btn secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {modal === 'delete' && (
              <>
                <h3>¿Eliminar préstamo?</h3>
                <p>Esta acción no se puede deshacer.</p>
                <div className="modal-actions">
                  <button className="btn danger" onClick={deletePrestamo}>
                    Eliminar
                  </button>
                  <button className="btn secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
