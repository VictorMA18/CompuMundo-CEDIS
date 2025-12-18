import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Usuario } from "../../types/usuario";
import "../admin/AdminCrud.css";

export default function Usuarios() {
  const setTitle = useOutletContext<(title: string) => void>();
  const { authFetch } = useAuth();

  useEffect(() => {
    setTitle?.("Usuarios");
  }, [setTitle]);

  /* ===== ESTADO ===== */
  const [items, setItems] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [rol, setRol] = useState("");

  // Modales y Selección
  const [modal, setModal] = useState<null | "view">(null);
  const [selected, setSelected] = useState<Usuario | null>(null);

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== CARGA DE DATOS ===== */
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/usuarios");
      if (!res.ok) {
        throw new Error(`No se pudo cargar: ${res.status}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar usuarios");
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
  }, [search, rol, pageSize]);

  /* ===== LÓGICA DE FILTRADO Y PAGINACIÓN ===== */
  const filteredItems = useMemo(() => {
    return items.filter((u) => {
      const matchText =
        u.UsuNom.toLowerCase().includes(search.toLowerCase()) ||
        u.UsuEma.toLowerCase().includes(search.toLowerCase());

      const matchRol = rol ? u.UsuTip === rol : true;

      return matchText && matchRol;
    });
  }, [items, search, rol]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  return (
    <>
      {error && <div className="error">{error}</div>}

      {/* ===== FILTROS (Solo búsqueda y rol) ===== */}
      <div className="filters-card">
        <h3 className="card-title">Filtros</h3>
        <input
          className="input"
          placeholder="Buscar por nombre o correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        >
          <option value="">Todos los roles</option>
          <option value="administrador">Administrador</option>
          <option value="bibliotecario">Bibliotecario</option>
          <option value="consultor">Consultor</option>
        </select>
      </div>

      {/* ===== TABLA ===== */}
      <div className="table-card">
        <h3 className="card-title">Listado de Usuarios</h3>

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
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((u, i) => (
                <tr key={u.UsuId}>
                  <td>{(page - 1) * pageSize + i + 1}</td>
                  <td>{u.UsuNom}</td>
                  <td>{u.UsuEma}</td>
                  <td>{u.UsuTip}</td>
                  <td className="actions">
                    <button 
                      title="Ver detalle"
                      onClick={() => { setSelected(u); setModal("view"); }}
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
            <h3>Detalle del usuario</h3>
            <div className="detail-grid" style={{ marginBottom: '20px' }}>
              <p><b>Nombre:</b> {selected.UsuNom}</p>
              <p><b>Correo:</b> {selected.UsuEma}</p>
              <p><b>Rol:</b> {selected.UsuTip}</p>
              <p><b>Activo:</b> {selected.UsuAct ? "Sí" : "No"}</p>
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
