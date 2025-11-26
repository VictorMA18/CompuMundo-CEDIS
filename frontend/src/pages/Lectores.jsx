import { useState } from "react";
import "./Lectores.css";

export default function Lectores() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");

  // Ejemplo de datos (luego los reemplazas con tu backend)
  const lectores = [
    { id: 1, fecha: "2024-10-15", nombres: "Juan Pérez", dni: "12345678", correo: "juan@example.com", tipo: "Estudiante" },
    { id: 2, fecha: "2024-10-16", nombres: "María López", dni: "87654321", correo: "maria@example.com", tipo: "Docente" },
  ];

  const filteredLectores = lectores.filter((l) => {
    const matchSearch =
      l.nombres.toLowerCase().includes(search.toLowerCase()) ||
      l.dni.includes(search) ||
      l.correo.toLowerCase().includes(search.toLowerCase());

    const matchDate = date ? l.fecha === date : true;
    const matchType = type ? l.tipo.toLowerCase() === type.toLowerCase() : true;

    return matchSearch && matchDate && matchType;
  });

  return (
    <div className="lectores-page">
      <div className="filters">
        <input
          type="text"
          placeholder="Buscar por nombre, DNI o correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos</option>
          <option value="Estudiante">Estudiante</option>
          <option value="Docente">Docente</option>
          <option value="Administrativo">Administrativo</option>
        </select>
      </div>

      <div className="page-title">
        <h1>Lectores</h1>
      </div>

      <table className="lectores-table">
        <thead>
          <tr>
            <th>N°</th>
            <th>Fecha de registro</th>
            <th>Nombres y Apellidos</th>
            <th>DNI</th>
            <th>Correo</th>
            <th>Tipo</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {filteredLectores.length > 0 ? (
            filteredLectores.map((l, index) => (
              <tr key={l.id}>
                <td>{index + 1}</td>
                <td>{l.fecha}</td>
                <td>{l.nombres}</td>
                <td>{l.dni}</td>
                <td>{l.correo}</td>
                <td>{l.tipo}</td>
                <td className="acciones">
                  <button className="edit">Editar</button>
                  <button className="delete">Eliminar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="no-data">
                No se encontraron resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

