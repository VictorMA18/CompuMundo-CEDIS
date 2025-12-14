import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./Documentos.css";

const initialDocs = [
  {
    id: 1,
    fecha: "2024-06-10",
    titulo: "Ingeniería de Software Moderna",
    publicacion: "2022",
    categoria: "Libro",
    autores: "Pressman, Sommerville",
    actual: 3,
    total: 5,
  },
  {
    id: 2,
    fecha: "2024-06-12",
    titulo: "Arquitectura de Computadoras",
    publicacion: "2021",
    categoria: "Tesis",
    autores: "Stallings",
    actual: 1,
    total: 2,
  },
];

export default function Documentos() {
  const setTitle = useOutletContext();
  if (setTitle) setTitle("Documentos");

  const [docs] = useState(initialDocs);

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
      </div>

      {/* TABLA */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Nro.</th>
              <th>Fecha de registro</th>
              <th>Título</th>
              <th>Publicación</th>
              <th>Categoría</th>
              <th>Autores</th>
              <th>Disponibles</th>
            </tr>
          </thead>

          <tbody>
            {docs.map((d, i) => (
              <tr key={d.id}>
                <td>{i + 1}</td>
                <td>{d.fecha}</td>
                <td>{d.titulo}</td>
                <td>{d.publicacion}</td>
                <td>{d.categoria}</td>
                <td>{d.autores}</td>
                <td>
                  <b>{d.actual}</b> / {d.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

