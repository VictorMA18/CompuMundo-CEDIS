import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import "./Categorias.css";

const initialCategorias = [
  {
    id: 1,
    nombre: "Ingeniería de Software",
    descripcion: "Documentos relacionados al desarrollo de software",
  },
  {
    id: 2,
    nombre: "Redes",
    descripcion: "Material sobre redes de computadoras",
  },
];

export default function Categorias() {
  const setTitle = useOutletContext();
  if (setTitle) setTitle("Categorías");

  const [categorias, setCategorias] = useState(initialCategorias);
  const [modal, setModal] = useState(null); // new | edit | delete
  const [selected, setSelected] = useState(null);

  const openModal = (type, categoria = null) => {
    setSelected(categoria);
    setModal(type);
  };

  const closeModal = () => {
    setSelected(null);
    setModal(null);
  };

  const deleteCategoria = () => {
    setCategorias(categorias.filter(c => c.id !== selected.id));
    closeModal();
  };

  return (
    <>
      {/* HEADER CARD (como filtros pero sin filtros) */}
      <div className="filters-card">
        <h3 style={{ margin: 0 }}>Listado de Categorías</h3>
        <button className="btn" onClick={() => openModal("new")}>
          ➕ Registrar
        </button>
      </div>

      {/* TABLA */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Nro.</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c, i) => (
              <tr key={c.id}>
                <td>{i + 1}</td>
                <td>{c.nombre}</td>
                <td>{c.descripcion}</td>
                <td className="actions">
                  <button title="Editar" onClick={() => openModal("edit", c)}>✏️</button>
                  <button title="Eliminar" onClick={() => openModal("delete", c)}>🗑️</button>
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

            {/* NUEVO / EDITAR */}
            {(modal === "new" || modal === "edit") && (
              <>
                <h3>{modal === "new" ? "Registrar Categoría" : "Editar Categoría"}</h3>

                <form className="form-grid">
                  <input
                    placeholder="Nombre"
                    defaultValue={selected?.nombre}
                  />
                  <input
                    placeholder="Descripción"
                    defaultValue={selected?.descripcion}
                  />
                </form>

                <div className="modal-actions">
                  <button className="btn" onClick={closeModal}>Guardar</button>
                  <button className="btn secondary" onClick={closeModal}>Cancelar</button>
                </div>
              </>
            )}

            {/* ELIMINAR */}
            {modal === "delete" && (
              <>
                <h3>¿Eliminar categoría?</h3>
                <p>Esta acción no se puede deshacer.</p>

                <div className="modal-actions">
                  <button className="btn danger" onClick={deleteCategoria}>
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

