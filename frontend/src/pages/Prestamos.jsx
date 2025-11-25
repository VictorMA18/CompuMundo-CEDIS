import AdminLayout from "../layout/AdminLayout";
import "./Prestamos.css";

export default function Prestamos() {
  const prestamos = [
    {
      id: 1,
      fecha: "9 de julio de 2023, 14:30",
      lector: "Jose Luis Carpio Gomez",
      bibliografia: "Código Infinito: Explorando el Desarrollo de Software",
      estado: "Vigente",
    },
    {
      id: 2,
      fecha: "9 de julio de 2023, 14:30",
      lector: "Jose Luis Carpio Gomez",
      bibliografia: "Código Infinito: Explorando el Desarrollo de Software",
      estado: "Vencido",
    },
    {
      id: 3,
      fecha: "9 de julio de 2023, 14:30",
      lector: "Jose Luis Carpio Gomez",
      bibliografia: "Código Infinito: Explorando el Desarrollo de Software",
      estado: "Devuelto",
    },
  ];

  return (
    <AdminLayout title="Préstamos">
      <div className="filters-card">
        <input className="input" placeholder="Buscar por lector o bibliografía" />
        <input className="input" type="date" />
        <select className="input">
          <option value="">Estado</option>
          <option value="Vigente">Vigente</option>
          <option value="Vencido">Vencido</option>
          <option value="Devuelto">Devuelto</option>
        </select>

        <button className="btn">➕ Nuevo</button>
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
            {prestamos.map((p, index) => (
              <tr key={p.id}>
                <td>{index + 1}</td>
                <td>{p.fecha}</td>
                <td>{p.lector}</td>
                <td>{p.bibliografia}</td>

                <td>
                  <span className={`estado ${p.estado.toLowerCase()}`}>
                    {p.estado}
                  </span>
                </td>

                <td className="actions">
                  <button>✏️</button>
                  <button>👁️</button>
                  <button>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

