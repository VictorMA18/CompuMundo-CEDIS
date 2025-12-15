import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import "./Usuarios.css";

const initialUsuarios = [
  {
    id: 1,
    fecha: "2024-06-12",
    nombre: "Jose Godoy",
    correo: "jgodoy@unsa.edu.pe",
    tipo: "Administrador",
  },
  {
    id: 2,
    fecha: "2024-07-01",
    nombre: "María López",
    correo: "mlopez@unsa.edu.pe",
    tipo: "Bibliotecario",
  },
  {
    id: 3,
    fecha: "2024-07-10",
    nombre: "Carlos Rivas",
    correo: "crivas@unsa.edu.pe",
    tipo: "Consultor",
  },
];

export default function Usuarios() {
  const setTitle = useOutletContext();
  if (setTitle) setTitle("Usuarios");

  const [usuarios, setUsuarios] = useState(initialUsuarios);
  const [modal, setModal] = useState(null); // view | new | edit | delete
  const [selected, setSelected] = useState(null);

  const openModal = (type, usuario = null) => {
    setSelected(usuario);
    setModal(type);
  };

  const closeModal = () => {
    setSelected(null);
    setModal(null);
  };

  const deleteUsuario = () => {
    setUsuarios(usuarios.filter(u => u.id !== selected.id));
    closeModal();
  };

  return (
    <>
      {/* FILTROS */}
      <div className="filters-card">
        <input
          className="input"
          placeholder="Buscar por nombre o correo"
        />

        <input
          className="input"
          type="date"
        />

        <select className="input">
          <option value="">Tipo</option>
          <option value="Administrador">Administrador</option>
          <option value="Bibliotecario">Bibliotecario</option>
          <option value="Consultor">Consultor</option>
        </select>

        <button className="btn-new" onClick={() => openModal("new")}>
          ➕ Registrar
        </button>
      </div>

      {/* TABLA */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Nro.</th>
              <th>Fecha de registro</th>
              <th>Nombre de usuario</th>
              <th>Correo electrónico</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((u, i) => (
              <tr key={u.id}>
                <td>{i + 1}</td>
                <td>{u.fecha}</td>
                <td>{u.nombre}</td>
                <td>{u.correo}</td>
                <td>{u.tipo}</td>
                <td className="actions">
                  <button title="Ver" onClick={() => openModal("view", u)}>👁️</button>
                  <button title="Editar" onClick={() => openModal("edit", u)}>✏️</button>
                  <button title="Eliminar" onClick={() => openModal("delete", u)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALES */}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal">

            {/* VER */}
            {modal === "view" && (
              <>
                <h3>Detalle del Usuario</h3>
                <div className="grid">
                  <p><b>Nombre:</b> {selected.nombre}</p>
                  <p><b>Correo:</b> {selected.correo}</p>
                  <p><b>Tipo:</b> {selected.tipo}</p>
                  <p><b>Fecha registro:</b> {selected.fecha}</p>
                </div>
                <button className="btn" onClick={closeModal}>Cerrar</button>
              </>
            )}

            {/* NUEVO / EDITAR */}
            {(modal === "new" || modal === "edit") && (
              <>
                <h3>
                  {modal === "new" ? "Registrar Usuario" : "Editar Usuario"}
                </h3>

                <form className="form-grid">
                  <input
                    placeholder="Nombre de usuario"
                    defaultValue={selected?.nombre}
                  />
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    defaultValue={selected?.correo}
                  />
                  <select defaultValue={selected?.tipo || ""}>
                    <option value="">Tipo</option>
                    <option>Administrador</option>
                    <option>Bibliotecario</option>
                    <option>Consultor</option>
                  </select>
                  <input
                    type="password"
                    placeholder="Contraseña"
                  />
                </form>

                <div className="modal-actions">
                  <button className="btn" onClick={closeModal}>Guardar</button>
                  <button className="btn secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {/* ELIMINAR */}
            {modal === "delete" && (
              <>
                <h3>¿Eliminar usuario?</h3>
                <p>Esta acción no se puede deshacer.</p>

                <div className="modal-actions">
                  <button className="btn danger" onClick={deleteUsuario}>
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

