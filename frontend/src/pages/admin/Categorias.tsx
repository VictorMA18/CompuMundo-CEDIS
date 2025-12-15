import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Categoria } from "../../types/categoria";
import "./AdminCrud.css";

/* ================= FORMULARIO ================= */
function CategoriaForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Categoria | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    CatNom: "",
    CatDes: "",
  });

  useEffect(() => {
    if (!initial) return;
    setForm({
      CatNom: initial.CatNom ?? "",
      CatDes: initial.CatDes ?? "",
    });
  }, [initial]);

  const submit = () => {
    if (!form.CatNom.trim()) return;

    onSave({
      CatNom: form.CatNom.trim(),
      CatDes: form.CatDes.trim() || undefined,
    });
  };

  return (
    <>
      <h3>{initial ? "Editar categoría" : "Registrar categoría"}</h3>

      <div className="form-grid">
        <input
          placeholder="Nombre de la categoría"
          value={form.CatNom}
          onChange={(e) => setForm({ ...form, CatNom: e.target.value })}
        />
        <input
          placeholder="Descripción (opcional)"
          value={form.CatDes}
          onChange={(e) => setForm({ ...form, CatDes: e.target.value })}
        />
      </div>

      <div className="modal-actions">
        <button className="btn" onClick={submit}>
          Guardar
        </button>
        <button className="btn secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </>
  );
}

/* ================= COMPONENTE PRINCIPAL ================= */
export default function Categorias() {
  const setTitle = useOutletContext<(title: string) => void>();
  const { authFetch } = useAuth();

  useEffect(() => {
    setTitle?.("Categorías");
  }, [setTitle]);

  /* ===== ESTADO ===== */
  const [items, setItems] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"activos" | "desactivadas">("activos");

  // modales
  const [modal, setModal] =
    useState<null | "view" | "new" | "edit" | "delete" | "reactivate">(null);
  const [selected, setSelected] = useState<Categoria | null>(null);

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== LOAD ===== */
  const load = async () => {
    setLoading(true);
    try {
      const url =
        view === "activos"
          ? "/api/categorias"
          : "/api/categorias/desactivadas";

      const res = await authFetch(url);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudo cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [view]);

  // reset página
  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  /* ===== FILTROS ===== */
  const filteredItems = useMemo(() => {
    return items.filter((c) =>
      c.CatNom.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  /* ===== PAGINACIÓN ===== */
  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  /* ===== CRUD ===== */
  const save = async (payload: any) => {
    const isEdit = modal === "edit" && selected;

    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? `/api/categorias/${selected!.CatId}`
      : "/api/categorias";

    await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setModal(null);
    setSelected(null);
    await load();
  };

  const deactivate = async () => {
    if (!selected) return;
    await authFetch(`/api/categorias/${selected.CatId}`, { method: "DELETE" });
    setModal(null);
    setSelected(null);
    await load();
  };

  const reactivate = async () => {
    if (!selected) return;
    await authFetch(`/api/categorias/reactivar/${selected.CatId}`, {
      method: "PATCH",
    });
    setModal(null);
    setSelected(null);
    await load();
  };

  /* ===== UI ===== */
  return (
    <>
      {error && <div className="error">{error}</div>}

      {/* ===== FILTROS ===== */}
      <div className="filters-card">
        <h3 className="card-title">Filtros</h3>

        <input
          className="input"
          placeholder="Buscar por nombre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="input"
          value={view}
          onChange={(e) => setView(e.target.value as any)}
        >
          <option value="activos">Activas</option>
          <option value="desactivadas">Desactivadas</option>
        </select>

        <button
          className="btn-new"
          onClick={() => {
            setSelected(null);
            setModal("new");
          }}
        >
          ➕ Nuevo
        </button>
      </div>

      {/* ===== TABLA ===== */}
      <div className="table-card">
        <h3 className="card-title">Listado de Categorías</h3>

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
                <th>Descripción</th>
                <th>Activa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((c, i) => (
                <tr key={c.CatId}>
                  <td>{(page - 1) * pageSize + i + 1}</td>
                  <td>{c.CatNom}</td>
                  <td>{c.CatDes || "—"}</td>
                  <td>{c.CatAct ? "Sí" : "No"}</td>
                  <td className="actions">
                    <button onClick={() => { setSelected(c); setModal("view"); }}>👁️</button>
                    <button onClick={() => { setSelected(c); setModal("edit"); }}>✏️</button>
                    {view === "activos" ? (
                      <button onClick={() => { setSelected(c); setModal("delete"); }}>🗑️</button>
                    ) : (
                      <button onClick={() => { setSelected(c); setModal("reactivate"); }}>♻️</button>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={5}>Sin registros</td>
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

        <span>
          Página {page} de {totalPages || 1}
        </span>

        <button
          className="btn-secondary"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente ➡
        </button>
      </div>

      {/* ===== MODALES ===== */}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            {modal === "view" && selected && (
              <>
                <h3>Detalle de la categoría</h3>
                <p><b>Nombre:</b> {selected.CatNom}</p>
                <p><b>Descripción:</b> {selected.CatDes || "—"}</p>
                <p><b>Activa:</b> {selected.CatAct ? "Sí" : "No"}</p>
                <button className="btn" onClick={() => setModal(null)}>Cerrar</button>
              </>
            )}

            {(modal === "new" || modal === "edit") && (
              <CategoriaForm
                initial={modal === "edit" ? selected : null}
                onSave={save}
                onCancel={() => setModal(null)}
              />
            )}

            {modal === "delete" && (
              <>
                <h3>¿Desactivar categoría?</h3>
                <p>No estará disponible para selección</p>
                <button className="btn danger" onClick={deactivate}>Desactivar</button>
                <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              </>
            )}

            {modal === "reactivate" && (
              <>
                <h3>¿Reactivar categoría?</h3>
                <button className="btn" onClick={reactivate}>Reactivar</button>
                <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

