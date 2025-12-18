import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../admin/AdminCrud.css";

/* ================= TIPOS ================= */
type Autor = {
  AutId: number;
  AutNom: string;
  AutApe: string;
  AutDoc: string;
  AutEma: string | null;
  AutAct: boolean;
};

/* ================= COMPONENTE PRINCIPAL ================= */
export default function Autores() {
  const setTitle = useOutletContext<(title: string) => void>();
  const { authFetch } = useAuth();

  useEffect(() => {
    setTitle?.("Autores");
  }, [setTitle]);

  /* ===== ESTADO ===== */
  const [items, setItems] = useState<Autor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");

  // Modales y Selección
  const [modal, setModal] = useState<null | "view">(null);
  const [selected, setSelected] = useState<Autor | null>(null);

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== CARGA DE DATOS ===== */
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/autores");
      if (!res.ok) {
        throw new Error(`No se pudo cargar: ${res.status}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el listado de autores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Reset página al buscar
  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  /* ===== FILTRADO Y PAGINACIÓN ===== */
  const filteredItems = useMemo(() => {
    return items.filter((a) =>
      `${a.AutNom} ${a.AutApe}`.toLowerCase().includes(search.toLowerCase()) ||
      a.AutDoc.includes(search) ||
      (a.AutEma ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  return (
    <>
      {error && <div className="error">{error}</div>}

      {/* ===== FILTROS ===== */}
      <div className="filters-card">
        <h3 className="card-title">Filtros</h3>
        <input
          className="input"
          placeholder="Buscar por nombre, documento o correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ===== TABLA ===== */}
      <div className="table-card">
        <h3 className="card-title">Listado de Autores</h3>

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
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Documento</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((a, i) => (
                <tr key={a.AutId}>
                  <td>{(page - 1) * pageSize + i + 1}</td>
                  <td>{a.AutNom}</td>
                  <td>{a.AutApe}</td>
                  <td>{a.AutDoc}</td>
                  <td>{a.AutEma || "—"}</td>
                  <td className="actions">
                    <button 
                      title="Ver detalle"
                      onClick={() => { setSelected(a); setModal("view"); }}
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={6}>Sin registros encontrados</td>
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
            <h3>Detalle del Autor</h3>
            <div className="detail-grid" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <p><b>Nombres:</b> {selected.AutNom}</p>
              <p><b>Apellidos:</b> {selected.AutApe}</p>
              <p><b>Documento:</b> {selected.AutDoc}</p>
              <p><b>Correo:</b> {selected.AutEma || "No registrado"}</p>
              <p><b>Estado:</b> {selected.AutAct ? "Activo" : "Inactivo"}</p>
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
