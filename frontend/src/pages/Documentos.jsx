import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./Documentos.css";

const initialDocs = [
  {
    id: 1,
    fechaRegistro: "2024-06-10",
    titulo: "Ingeniería de Software Moderna",
    publicacion: "2022-01-01",
    categoria: "Libro",
    autores: "Pressman, Sommerville",
    actual: 3,
    total: 5,
  },
  {
    id: 2,
    fechaRegistro: "2024-06-12",
    titulo: "Arquitectura de Computadoras",
    publicacion: "2021-01-01",
    categoria: "Tesis",
    autores: "Stallings",
    actual: 1,
    total: 2,
  },
];

export default function Documentos() {
  const setTitle = useOutletContext();
  if (setTitle) setTitle("Documentos");

  const [docs, setDocs] = useState(initialDocs);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // view | edit | create | delete

  const closeModal = () => {
    setModal(null);
    setSelected(null);
  };

  return (
    <>
      {/* FILTROS */}
      <div className="filters-card">
        <input className="input" placeholder="Buscar por título o ID" />
        <input className="input" type="date" />
        <select className="input">
          <option value="">Categoría</option>
          <option>Libro</option>
          <option>Tesis</option>
          <option>Revista</option>
        </select>

        <button className="btn" onClick={() => setModal("create")}>
          ➕ Registrar
        </button>
      </div>

      {/* TABLA */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Nro.</th>
              <th>Fecha registro</th>
              <th>Título</th>
              <th>Publicación</th>
              <th>Categoría</th>
              <th>Autores</th>
              <th>Disponibles</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {docs.map((d, i) => (
              <tr key={d.id}>
                <td>{i + 1}</td>
                <td>{d.fechaRegistro}</td>
                <td>{d.titulo}</td>
                <td>{d.publicacion}</td>
                <td>{d.categoria}</td>
                <td>{d.autores}</td>
                <td>
                  <b>{d.actual}</b> / {d.total}
                </td>
                <td className="actions">
                  <button onClick={() => { setSelected(d); setModal("view"); }}>👁️
                  </button>
                  <button onClick={() => { setSelected(d); setModal("edit"); }}>
                    ✏️
                  </button>
                  <button onClick={() => { setSelected(d); setModal("delete"); }}>🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL VER */}
      {modal === "view" && selected && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Detalle del Documento</h3>

            <div className="grid">
              <p><b>Título:</b> {selected.titulo}</p>
              <p><b>Autores:</b> {selected.autores}</p>
              <p><b>Categoría:</b> {selected.categoria}</p>
              <p><b>Publicación:</b> {selected.publicacion}</p>
              <p><b>Disponibles:</b> {selected.actual} / {selected.total}</p>
              <p><b>Registro:</b> {selected.fechaRegistro}</p>
            </div>

            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR / EDITAR */}
      {(modal === "create" || modal === "edit") && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{modal === "create" ? "Registrar Documento" : "Editar Documento"}</h3>

            <div className="form-grid">
              <input placeholder="Título" defaultValue={selected?.titulo} />
              <input placeholder="Autores" defaultValue={selected?.autores} />
              <input type="date" defaultValue={selected?.publicacion} />
              <select defaultValue={selected?.categoria || ""}>
                <option value="">Categoría</option>
                <option>Libro</option>
                <option>Tesis</option>
                <option>Revista</option>
              </select>
              <input type="number" placeholder="Cantidad total" />
              <input type="number" placeholder="Disponibles" />
            </div>

            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cancelar
              </button>
              <button className="btn">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modal === "delete" && selected && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Eliminar Documento</h3>
            <p>
              ¿Seguro que deseas eliminar <b>{selected.titulo}</b>?
            </p>

            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cancelar
              </button>
              <button className="btn danger">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

