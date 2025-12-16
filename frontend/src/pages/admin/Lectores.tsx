import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminCrud.css";

/* ================= FORMULARIO ================= */
function LectorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: any | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    LecNom: "",
    LecApe: "",
    LecDni: "",
    LecEma: "",
    LecTip: "estudiante",
  });

  useEffect(() => {
    if (!initial) return;
    setForm({
      LecNom: initial.LecNom ?? "",
      LecApe: initial.LecApe ?? "",
      LecDni: initial.LecDni ?? "",
      LecEma: initial.LecEma ?? "",
      LecTip: initial.LecTip ?? "estudiante",
    });
  }, [initial]);

  const submit = () => {
    if (!form.LecNom || !form.LecApe || !form.LecDni) return;

    onSave({
      LecNom: form.LecNom.trim(),
      LecApe: form.LecApe.trim(),
      LecDni: form.LecDni.trim(),
      LecEma: form.LecEma.trim() || undefined,
      LecTip: form.LecTip,
    });
  };

  return (
    <>
      <h3>{initial ? "Editar lector" : "Registrar lector"}</h3>

      <div className="form-grid">
        <input
          placeholder="Nombres"
          value={form.LecNom}
          onChange={(e) => setForm({ ...form, LecNom: e.target.value })}
        />
        <input
          placeholder="Apellidos"
          value={form.LecApe}
          onChange={(e) => setForm({ ...form, LecApe: e.target.value })}
        />
        <input
          placeholder="DNI"
          value={form.LecDni}
          onChange={(e) => setForm({ ...form, LecDni: e.target.value })}
        />
        <input
          placeholder="Correo"
          value={form.LecEma}
          onChange={(e) => setForm({ ...form, LecEma: e.target.value })}
        />
        <select
          value={form.LecTip}
          onChange={(e) => setForm({ ...form, LecTip: e.target.value })}
        >
          <option value="estudiante">Estudiante</option>
          <option value="docente">Docente</option>
          <option value="administrativo">Administrativo</option>
        </select>
      </div>

      <div className="modal-actions">
        <button className="btn" onClick={submit}>Guardar</button>
        <button className="btn secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </>
  );
}

/* ================= COMPONENTE PRINCIPAL ================= */
export default function Lectores() {
  const setTitle = useOutletContext<(title: string) => void>();
  const { authFetch } = useAuth();

  useEffect(() => {
    setTitle?.("Lectores");
  }, [setTitle]);

  /* ===== ESTADO ===== */
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [fecha, setFecha] = useState("");

  // modales
  const [modal, setModal] =
    useState<null | "view" | "edit" | "new" | "delete">(null);
  const [selected, setSelected] = useState<any | null>(null);

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== LOAD ===== */
  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/lectores");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudo cargar lectores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // reset página cuando cambian filtros
  useEffect(() => {
    setPage(1);
  }, [search, tipo, fecha, pageSize]);

  /* ===== FILTROS ===== */
  const filteredItems = useMemo(() => {
    return items.filter((l) => {
      const matchText =
        `${l.LecNom} ${l.LecApe}`.toLowerCase().includes(search.toLowerCase()) ||
        l.LecDni.includes(search) ||
        (l.LecEma ?? "").toLowerCase().includes(search.toLowerCase());

      const matchTipo = tipo ? l.LecTip === tipo : true;

      const matchFecha = fecha
        ? new Date(l.LecFecCre).toISOString().slice(0, 10) === fecha
        : true;

      return matchText && matchTipo && matchFecha;
    });
  }, [items, search, tipo, fecha]);

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
      ? `/api/lectores/${selected.LecId}`
      : "/api/lectores";

    await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setModal(null);
    setSelected(null);
    await load();
  };

  const remove = async () => {
    if (!selected) return;

    await authFetch(`/api/lectores/${selected.LecId}`, {
      method: "DELETE",
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
          placeholder="Buscar por nombre, DNI o correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          className="input"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />

        <select
          className="input"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="estudiante">Estudiante</option>
          <option value="docente">Docente</option>
          <option value="administrativo">Administrativo</option>
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
                <th>Nombre</th>
                <th>DNI</th>
                <th>Correo</th>
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
                  <td>{l.LecEma || "—"}</td>
                  <td>{l.LecTip}</td>
                  <td className="actions">
                    <button onClick={() => { setSelected(l); setModal("view"); }}>👁️</button>
                    <button onClick={() => { setSelected(l); setModal("edit"); }}>✏️</button>
                    <button onClick={() => { setSelected(l); setModal("delete"); }}>🗑️</button>
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

      {/* ===== MODALES ===== */}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            {modal === "view" && selected && (
              <>
                <h3>Detalle del lector</h3>
                <p><b>Nombre:</b> {selected.LecNom} {selected.LecApe}</p>
                <p><b>DNI:</b> {selected.LecDni}</p>
                <p><b>Correo:</b> {selected.LecEma || "—"}</p>
                <p><b>Tipo:</b> {selected.LecTip}</p>
                <button className="btn" onClick={() => setModal(null)}>Cerrar</button>
              </>
            )}

            {(modal === "new" || modal === "edit") && (
              <LectorForm
                initial={modal === "edit" ? selected : null}
                onSave={save}
                onCancel={() => setModal(null)}
              />
            )}

            {modal === "delete" && selected && (
              <>
                <h3>¿Eliminar lector?</h3>
                <p>Esta acción desactiva el registro</p>
                <button className="btn danger" onClick={remove}>Eliminar</button>
                <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

