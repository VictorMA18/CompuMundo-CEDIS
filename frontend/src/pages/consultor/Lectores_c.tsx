import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../admin/AdminCrud.css";

// Definición de tipo para Lectores
interface Lector {
  LecId: number;
  LecDni: string;
  LecNom: string;
  LecApe: string;
  LecTip: 'estudiante' | 'docente' | 'administrativo';
  LecEma: string | null;
  LecFecCre: string;
  LecAct: boolean;
}

export default function Lectores() {
  const setTitle = useOutletContext<(title: string) => void>();
  const { authFetch } = useAuth();

  useEffect(() => {
    setTitle?.("Lectores");
  }, [setTitle]);

  /* ===== ESTADO ===== */
  const [items, setItems] = useState<Lector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");

  // Modales y Selección
  const [modal, setModal] = useState<null | "view">(null);
  const [selected, setSelected] = useState<Lector | null>(null);

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== CARGA DE DATOS ===== */
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/lectores");
      if (!res.ok) {
        throw new Error(`No se pudo cargar: ${res.status}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar lectores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Reset página al filtrar
  useEffect(() => {
    setPage(1);
  }, [search, tipo, pageSize]);

  /* ===== LÓGICA DE FILTRADO Y PAGINACIÓN ===== */
  const filteredItems = useMemo(() => {
    return items.filter((l) => {
      const matchText =
        `${l.LecNom} ${l.LecApe}`.toLowerCase().includes(search.toLowerCase()) ||
        l.LecDni.includes(search) ||
        (l.LecEma ?? "").toLowerCase().includes(search.toLowerCase());

      const matchTipo = tipo ? l.LecTip === tipo : true;

      return matchText && matchTipo;
    });
  }, [items, search, tipo]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  return (
    <>
      {error && <div className="error">{error}</div>}

      {/* ===== FILTROS (Búsqueda y Tipo) ===== */}
      <div className="filters-card">
        <h3 className="card-title">Filtros</h3>
        <input
          className="input"
          placeholder="Buscar por nombre, DNI o correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="estudiante">Estudiante</option>
          <option value="docente">Docente</option>
          <option value="administrativo">Administrativo</option>
        </select>
      </div>

      {/* ===== TABLA ===== */}
      <div className="table-card">
        <h3 className="card-title">Listado de Lectores</h3>

        <div className="table-toolbar">
          <span>Mostrar</span>
          <select
            className="input-small"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <span>registros</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre Completo</th>
                <th>DNI</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((l, i) => (
                <tr key={l.LecId}>
                  <td>{(page - 1) * pageSize + i + 1}</td>
                  <td>{l.LecNom} {l.LecApe}</td>
                  <td>{l.LecDni}</td>
                  <td>{l.LecTip}</td>
                  <td className="actions">
                    <button 
                      title="Ver detalle"
                      onClick={() => { setSelected(l); setModal("view"); }}
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={6}>Sin registros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PAGINACIÓN ===== */}
      <div className="pagination">
        <button
          className="btn-secondary"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ⬅ Anterior
        </button>
        <span>Página {page} de {totalPages || 1}</span>
        <button
          className="btn-secondary"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente ➡
        </button>
      </div>

      {/* ===== MODAL DE DETALLE ===== */}
      {modal === "view" && selected && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Detalle del lector</h3>
            <div className="detail-grid" style={{ marginBottom: '20px' }}>
              <p><b>Nombre:</b> {selected.LecNom} {selected.LecApe}</p>
              <p><b>DNI:</b> {selected.LecDni}</p>
              <p><b>Correo:</b> {selected.LecEma || "—"}</p>
              <p><b>Tipo:</b> {selected.LecTip}</p>
              <p><b>Fecha Registro:</b> {new Date(selected.LecFecCre).toLocaleDateString()}</p>
              <p><b>Activo:</b> {selected.LecAct ? "Sí" : "No"}</p>
            </div>
            <button className="btn" onClick={() => { setModal(null); setSelected(null); }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
