import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Categoria } from "../../types/categoria";
import "./AdminCrud.css"; // Asegúrate de que este archivo CSS existe

/* ================= FORMULARIO ================= */
function CategoriaForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Categoria | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    CatNom: "",
    CatDes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!initial) {
      setForm({ CatNom: "", CatDes: "" });
      return;
    }
    setForm({
      CatNom: initial.CatNom ?? "",
      CatDes: initial.CatDes ?? "",
    });
  }, [initial]);

  const submit = async () => {
    // Validar que el nombre no esté vacío
    if (isSaving || !form.CatNom.trim()) return; 

    setIsSaving(true);
    try {
      await onSave({
        CatNom: form.CatNom.trim(),
        CatDes: form.CatDes.trim() || undefined,
      });
    } finally {
      // Si onSave falla (y muestra el modal de error), isSaving se desactiva
      setIsSaving(false); 
    }
  };

  return (
    <>
      <h3>{initial ? "Editar categoría" : "Registrar categoría"}</h3>

      <div className="form-grid">
        <input
          placeholder="Nombre de la categoría"
          value={form.CatNom}
          onChange={(e) => setForm({ ...form, CatNom: e.target.value })}
          disabled={isSaving}
        />
        <input
          placeholder="Descripción (opcional)"
          value={form.CatDes}
          onChange={(e) => setForm({ ...form, CatDes: e.target.value })}
          disabled={isSaving}
        />
      </div>

      <div className="modal-actions">
        <button className="btn" onClick={submit} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
        <button className="btn secondary" onClick={onCancel} disabled={isSaving}>
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
  const [errorModal, setErrorModal] = useState<string | null>(null); 

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== LOAD (Cargar datos) ===== */
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        view === "activos"
          ? "/api/categorias"
          : "/api/categorias/desactivadas";

      const res = await authFetch(url);
      if (!res.ok) {
        throw new Error(`No se pudo cargar: ${res.status}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
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

  /* ===== FILTROS / PAGINACIÓN ===== */
  const filteredItems = useMemo(() => {
    return items.filter((c) =>
      c.CatNom.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  /* ===== MANEJO DE ERRORES DEL BACKEND (Versión Final Optimizada) ===== */
  const handleBackendError = async (res: Response) => {
    if (!res.ok) {
      let errorMessage = `Error ${res.status}: Operación fallida.`;
      let textBody = '';

      try {
        const resClone = res.clone();
        textBody = await resClone.text();
        const errorData = JSON.parse(textBody);

        let rawMessage = null;

        // 1. Intentar obtener el mensaje del campo 'message' principal (Formato estándar de NestJS)
        if (errorData && errorData.message) {
            rawMessage = errorData.message;
        }

        // 2. Si el mensaje principal no es descriptivo, buscar en el objeto 'error' anidado
        if (!rawMessage && errorData.error && errorData.error.message) {
             rawMessage = errorData.error.message;
        }
        
        // 3. Si encontramos un mensaje descriptivo, lo formateamos
        if (rawMessage) {
            errorMessage = Array.isArray(rawMessage) 
                ? rawMessage.join(", ") 
                : rawMessage;
        } else {
            // Mensaje de respaldo si el JSON es válido pero no tiene el campo 'message' esperado
            errorMessage = `Error ${res.status}: ${errorData.error || errorData.statusCode || 'Respuesta desconocida'}.`;
        }

      } catch (e) {
          // Si falla al parsear el JSON
          if (textBody) {
               errorMessage = `Error ${res.status}: ${textBody}`;
          } else {
               errorMessage = `Error ${res.status}: Error de conexión o servidor.`;
          }
      }
      
      // Mostrar SOLO el mensaje descriptivo
      setErrorModal(errorMessage);
      
      // Lanzamos para detener la ejecución de la función CRUD
      throw new Error(errorMessage);
    }
  };

  /* ===== CRUD ===== */
  const save = async (payload: any) => {
    const isEdit = modal === "edit" && selected;

    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? `/api/categorias/${selected!.CatId}`
      : "/api/categorias";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await handleBackendError(res); 

      // Si todo va bien
      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      console.error("Error en la operación SAVE:", e);
    }
  };

  const deactivate = async () => {
    if (!selected) return;
    try {
      const res = await authFetch(`/api/categorias/${selected.CatId}`, { method: "DELETE" });
      
      await handleBackendError(res); 

      // Si todo va bien
      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      console.error("Error en la operación DEACTIVATE:", e);
    }
  };

  const reactivate = async () => {
    if (!selected) return;
    try {
      const res = await authFetch(`/api/categorias/reactivar/${selected.CatId}`, {
        method: "PATCH",
      });

      await handleBackendError(res);
      
      // Si todo va bien
      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      console.error("Error en la operación REACTIVATE:", e);
    }
  };

  const closeErrorModal = () => {
    setErrorModal(null);
  }

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

      {/* ===== MODALES DE OPERACIÓN ===== */}
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

      {/* ===== MODAL DE ERROR ===== */}
      {errorModal && (
        <div className="modal-backdrop">
          <div className="modal error-modal">
            <h3 className="error-title">❌ Error en la Operación</h3>
            <p>{errorModal}</p>
            <button className="btn" onClick={closeErrorModal}>Aceptar</button>
          </div>
        </div>
      )}
    </>
  );
}
