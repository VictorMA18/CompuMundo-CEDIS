import { useState } from "react";
import "./Lectores.css";
import { useOutletContext } from "react-router-dom";

const initialLectores = [
  { id: 1, fecha: "2024-10-15", nombres: "Juan Pérez", dni: "12345678", correo: "juan@example.com", tipo: "Estudiante" },
  { id: 2, fecha: "2024-10-16", nombres: "María López", dni: "87654321", correo: "maria@example.com", tipo: "Docente" },
];

export default function Lectores() {
  const setTitle = useOutletContext();
  if (setTitle) setTitle("Lectores");

  const [lectores, setLectores] = useState(initialLectores);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");

  const [modal, setModal] = useState(null); // view | edit | new | delete
  const [selected, setSelected] = useState(null);

  const openModal = (type, lector = null) => {
    setSelected(lector);
    setModal(type);
  };

  const closeModal = () => {
    setSelected(null);
    setModal(null);
  };

  const deleteLector = () => {
    setLectores(lectores.filter(l => l.id !== selected.id));
    closeModal();
  };

  const filteredLectores = lectores.filter((l) => {
    const matchSearch =
      l.nombres.toLowerCase().includes(search.toLowerCase()) ||
      l.dni.includes(search) ||
      l.correo.toLowerCase().includes(search.toLowerCase());

    const matchDate = date ? l.fecha === date : true;
    const matchType = type ? l.tipo === type : true;

    return matchSearch && matchDate && matchType;
  });

  return (
    <>
      {/* Filtros */}
      <div className="filters">
        <input placeholder="Buscar por nombre, DNI o correo" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos</option>
          <option value="Estudiante">Estudiante</option>
          <option value="Docente">Docente</option>
          <option value="Administrativo">Administrativo</option>
        </select>
        <button className="btn-new" onClick={() => openModal("new")}>➕ Nuevo</button>
      </div>

      {/* Tabla */}
      <div className="table-card">
        <table className="lectores-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Fecha</th>
              <th>Nombres</th>
              <th>DNI</th>
              <th>Correo</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredLectores.length > 0 ? (
              filteredLectores.map((l, i) => (
                <tr key={l.id}>
                  <td>{i + 1}</td>
                  <td>{l.fecha}</td>
                  <td>{l.nombres}</td>
                  <td>{l.dni}</td>
                  <td>{l.correo}</td>
                  <td>{l.tipo}</td>
                  <td className="actions">
                    <button onClick={() => openModal("view", l)}>👁️</button>
                    <button onClick={() => openModal("edit", l)}>✏️</button>
                    <button onClick={() => openModal("delete", l)}>🗑️</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">No se encontraron resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODALES */}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            {modal === "view" && (
              <>
                <h3>Detalle del Lector</h3>
                <div className="grid">
                  <p><b>Nombre:</b> {selected.nombres}</p>
                  <p><b>DNI:</b> {selected.dni}</p>
                  <p><b>Correo:</b> {selected.correo}</p>
                  <p><b>Tipo:</b> {selected.tipo}</p>
                  <p><b>Fecha registro:</b> {selected.fecha}</p>
                </div>
                <button className="btn" onClick={closeModal}>Cerrar</button>
              </>
            )}

            {(modal === "new" || modal === "edit") && (
              <>
                <h3>{modal === "new" ? "Registrar Lector" : "Editar Lector"}</h3>
                <form className="form-grid">
                  <input placeholder="Nombres y Apellidos" defaultValue={selected?.nombres} />
                  <input placeholder="DNI" defaultValue={selected?.dni} />
                  <input placeholder="Correo" defaultValue={selected?.correo} />
                  <select defaultValue={selected?.tipo || "Estudiante"}>
                    <option>Estudiante</option>
                    <option>Docente</option>
                    <option>Administrativo</option>
                  </select>
                </form>
                <div className="modal-actions">
                  <button className="btn" onClick={closeModal}>Guardar</button>
                  <button className="btn secondary" onClick={closeModal}>Cancelar</button>
                </div>
              </>
            )}

            {modal === "delete" && (
              <>
                <h3>¿Eliminar lector?</h3>
                <p>Esta acción no se puede deshacer.</p>
                <div className="modal-actions">
                  <button className="btn danger" onClick={deleteLector}>Eliminar</button>
                  <button className="btn secondary" onClick={closeModal}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

