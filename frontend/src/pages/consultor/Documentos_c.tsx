import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../admin/AdminCrud.css";

/* ================= TIPOS ================= */
type AutorRef = { AutId: number; AutNom: string; AutApe: string; AutDoc: string };
type Categoria = { CatId: number; CatNom: string };

type MaterialBibliografico = {
  MatBibId: number;
  MatBibCod: string;
  MatBibTit: string;
  CatId: number;
  MatBibFor: string;
  MatBibAct: boolean;
  autoresMaterial?: Array<{ autor: AutorRef }>;
  totalFisicos?: number;
  disponiblesFisicos?: number;
  tieneVirtual?: boolean;
};

/* ================= COMPONENTE PRINCIPAL ================= */
export default function Documentos() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  useEffect(() => {
    setTitle?.("Documentos");
  }, [setTitle]);

  /* ===== ESTADO ===== */
  const [items, setItems] = useState<MaterialBibliografico[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");

  // Modales y Selección
  const [modal, setModal] = useState<null | "view">(null);
  const [selected, setSelected] = useState<MaterialBibliografico | null>(null);

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== CARGA DE DATOS ===== */
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar Documentos y Categorías en paralelo
      const [resDocs, resCats] = await Promise.all([
        authFetch("/api/material-bibliografico"),
        authFetch("/api/categorias")
      ]);

      if (!resDocs.ok || !resCats.ok) throw new Error("Error al obtener datos");

      const [dataDocs, dataCats] = await Promise.all([
        resDocs.json(),
        resCats.json()
      ]);

      setItems(dataDocs || []);
      setCategories(dataCats || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los documentos bibliográficos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  /* ===== FILTRADO Y PAGINACIÓN ===== */
  const filteredItems = useMemo(() => {
    return items.filter((m) =>
      m.MatBibTit.toLowerCase().includes(search.toLowerCase()) ||
      m.MatBibCod.toLowerCase().includes(search.toLowerCase()) ||
      (m.autoresMaterial || []).some((x) =>
        `${x.autor.AutNom} ${x.autor.AutApe}`.toLowerCase().includes(search.toLowerCase())
      )
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
          placeholder="Buscar por código, título o autor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ===== TABLA ===== */}
      <div className="table-card">
        <h3 className="card-title">Listado de Material Bibliográfico</h3>

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
                <th>Código</th>
                <th>Título</th>
                <th>Categoría</th>
                <th>Formato</th>
                <th>Stock (Disp/Total)</th>
                <th>Virtual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((m, index) => {
                const categoryName = categories.find(c => c.CatId === m.CatId)?.CatNom || "Cargando...";
                return (
                  <tr key={m.MatBibId}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>{m.MatBibCod}</td>
                    <td style={{ fontWeight: '500' }}>{m.MatBibTit}</td>
                    <td>{categoryName}</td>
                    <td>{m.MatBibFor}</td>
                    <td>
                      {typeof m.totalFisicos === "number" 
                        ? `${m.disponiblesFisicos}/${m.totalFisicos}` 
                        : "—"}
                    </td>
                    <td>{m.tieneVirtual ? "✅" : "❌"}</td>
                    <td className="actions">
                      <button 
                        title="Ver detalle"
                        onClick={() => { setSelected(m); setModal("view"); }}
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && paginatedItems.length === 0 && (
                <tr><td colSpan={8}>No se encontraron documentos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PAGINACIÓN ===== */}
      <div className="pagination">
        <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>⬅ Anterior</button>
        <span>Página {page} de {totalPages || 1}</span>
        <button className="btn-secondary" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>Siguiente ➡</button>
      </div>

      {/* ===== MODAL DE DETALLE ===== */}
      {modal === "view" && selected && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Detalle del Documento</h3>
            <div className="detail-grid" style={{ textAlign: 'left', marginBottom: '20px', display: 'grid', gap: '10px' }}>
              <p><b>Código:</b> {selected.MatBibCod}</p>
              <p><b>Título:</b> {selected.MatBibTit}</p>
              <p><b>Categoría:</b> {categories.find(c => c.CatId === selected.CatId)?.CatNom || "—"}</p>
              <p><b>Formato actual:</b> {selected.MatBibFor}</p>
              <p><b>Autores:</b> {
                (selected.autoresMaterial || []).length > 0 
                ? (selected.autoresMaterial || []).map(a => `${a.autor.AutNom} ${a.autor.AutApe}`).join(', ')
                : "Anónimo / Sin autores registrados"
              }</p>
              <p><b>Estado:</b> {selected.MatBibAct ? "Activo" : "Inactivo"}</p>
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
