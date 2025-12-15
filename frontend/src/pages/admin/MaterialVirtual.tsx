import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminCrud.css";

/* ================= TIPOS ================= */
type ApiError = { message?: string | string[] };

type MaterialVirtual = {
  MatVirId: number;
  MatBibId: number;
  MatVirUrlAcc: string;
  MatVirForArc: string;
  MatVirAct: boolean;
  MatVirFecCre?: string;
  MatVirFecAct?: string;
};

type FormState = {
  MatBibId: string;
  MatVirUrlAcc: string;
  MatVirForArc: string;
};

type View = "activos" | "desactivados";

/* ================= FUNCIONES AUX ================= */
function errorMessage(data: unknown, fallback: string) {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(", ");
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return fallback;
}

/* ================= FORMULARIO MODAL ================= */
function MaterialVirtualForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: MaterialVirtual | null;
  onSave: (data: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    MatBibId: "",
    MatVirUrlAcc: "",
    MatVirForArc: "",
  });

  useEffect(() => {
    if (!initial) {
      setForm({ MatBibId: "", MatVirUrlAcc: "", MatVirForArc: "" });
      return;
    }
    setForm({
      MatBibId: String(initial.MatBibId),
      MatVirUrlAcc: initial.MatVirUrlAcc,
      MatVirForArc: initial.MatVirForArc,
    });
  }, [initial]);

  const submit = () => {
    if (!form.MatBibId || !form.MatVirUrlAcc || !form.MatVirForArc) return;
    onSave({
      MatBibId: form.MatBibId.trim(),
      MatVirUrlAcc: form.MatVirUrlAcc.trim(),
      MatVirForArc: form.MatVirForArc.trim(),
    });
  };

  return (
    <>
      <h3>{initial ? "Editar Material Virtual" : "Registrar Material Virtual"}</h3>
      <div className="form-grid">
        <input
          placeholder="MatBibId"
          value={form.MatBibId}
          onChange={(e) => setForm({ ...form, MatBibId: e.target.value })}
        />
        <input
          placeholder="URL de acceso"
          value={form.MatVirUrlAcc}
          onChange={(e) => setForm({ ...form, MatVirUrlAcc: e.target.value })}
        />
        <input
          placeholder="Formato de archivo"
          value={form.MatVirForArc}
          onChange={(e) => setForm({ ...form, MatVirForArc: e.target.value })}
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
export default function MaterialVirtualPage() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  /* ===== ESTADOS ===== */
  const [items, setItems] = useState<MaterialVirtual[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchMatBibId, setSearchMatBibId] = useState("");
  const [view, setView] = useState<View>("activos");

  const [modal, setModal] = useState<null | "view" | "new" | "edit" | "delete" | "reactivate">(null);
  const [selected, setSelected] = useState<MaterialVirtual | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== LOAD ===== */
  const load = async () => {
    setLoading(true);
    setError(null);
    let url = view === "activos" ? "/api/material-virtual" : "/api/material-virtual/desactivados";
    if (searchMatBibId.trim()) url = `/api/material-virtual/material/${encodeURIComponent(searchMatBibId.trim())}`;

    try {
      const res = await authFetch(url);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudo cargar material virtual");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTitle?.("Material Virtual");
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    setPage(1);
  }, [searchMatBibId, pageSize]);

  /* ===== FILTROS ===== */
  const filteredItems = useMemo(() => {
    return items.filter((m) => String(m.MatBibId).includes(searchMatBibId));
  }, [items, searchMatBibId]);

  /* ===== PAGINACIÓN ===== */
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  /* ===== CRUD ===== */
  const save = async (payload: FormState) => {
    const isEdit = modal === "edit" && selected;
    const url = isEdit ? `/api/material-virtual/${selected!.MatVirId}` : "/api/material-virtual";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, MatBibId: Number(payload.MatBibId) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(errorMessage(data, "Error al guardar material virtual"));
      }
    } catch {
      setError("Error al guardar material virtual");
    } finally {
      setModal(null);
      setSelected(null);
      await load();
    }
  };

  const deactivate = async () => {
    if (!selected) return;
    try {
      const res = await authFetch(`/api/material-virtual/${selected.MatVirId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(errorMessage(data, "No se pudo desactivar"));
      }
    } catch {
      setError("No se pudo desactivar");
    } finally {
      setModal(null);
      await load();
    }
  };

  const reactivate = async () => {
    if (!selected) return;
    try {
      const res = await authFetch(`/api/material-virtual/reactivar/${selected.MatVirId}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json();
        setError(errorMessage(data, "No se pudo reactivar"));
      }
    } catch {
      setError("No se pudo reactivar");
    } finally {
      setModal(null);
      await load();
    }
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
          placeholder="Buscar por MatBibId"
          value={searchMatBibId}
          onChange={(e) => setSearchMatBibId(e.target.value)}
        />

        <select className="input" value={view} onChange={(e) => setView(e.target.value as View)}>
          <option value="activos">Activos</option>
          <option value="desactivados">Desactivados</option>
        </select>

        <button className="btn-new" onClick={() => { setSelected(null); setModal("new"); }}>
          ➕ Nuevo
        </button>
      </div>

      {/* ===== TABLA ===== */}
      <div className="table-card">
        <h3 className="card-title">Listado de Material Virtual</h3>
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
                <th>ID</th>
                <th>MatBibId</th>
                <th>URL</th>
                <th>Formato</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((m) => (
                <tr key={m.MatVirId}>
                  <td>{m.MatVirId}</td>
                  <td>{m.MatBibId}</td>
                  <td className="text-ellipsis">{m.MatVirUrlAcc}</td>
                  <td>{m.MatVirForArc}</td>
                  <td>{m.MatVirAct ? "Sí" : "No"}</td>
                  <td className="actions">
                    <button onClick={() => { setSelected(m); setModal("view"); }}>👁️</button>
                    <button onClick={() => { setSelected(m); setModal("edit"); }}>✏️</button>
                    {view === "activos" ? (
                      <button onClick={() => { setSelected(m); setModal("delete"); }}>🗑️</button>
                    ) : (
                      <button onClick={() => { setSelected(m); setModal("reactivate"); }}>♻️</button>
                    )}
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


      {/* ===== MODALES ===== */}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            {modal === "view" && selected && (
              <>
                <h3>Detalle Material Virtual</h3>
                <p><b>MatVirId:</b> {selected.MatVirId}</p>
                <p><b>MatBibId:</b> {selected.MatBibId}</p>
                <p><b>URL:</b> {selected.MatVirUrlAcc}</p>
                <p><b>Formato:</b> {selected.MatVirForArc}</p>
                <p><b>Activo:</b> {selected.MatVirAct ? "Sí" : "No"}</p>
                <button className="btn" onClick={() => setModal(null)}>Cerrar</button>
              </>
            )}

            {(modal === "new" || modal === "edit") && (
              <MaterialVirtualForm
                initial={modal === "edit" ? selected : null}
                onSave={save}
                onCancel={() => setModal(null)}
              />
            )}

            {modal === "delete" && (
              <>
                <h3>¿Desactivar material virtual?</h3>
                <button className="btn danger" onClick={deactivate}>Desactivar</button>
                <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              </>
            )}

            {modal === "reactivate" && (
              <>
                <h3>¿Reactivar material virtual?</h3>
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

