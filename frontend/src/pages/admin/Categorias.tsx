import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Categoria } from "../../types/categoria";
import "./AdminCrud.css";

/* ================= FORMULARIO (ACTUALIZADO CON ESTILO INLINE) ================= */
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
  // Estado único para mostrar errores en la parte inferior del modal
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      setForm({ CatNom: "", CatDes: "" });
      setValidationError(null); // Limpiar error al cambiar a nuevo
      return;
    }
    setForm({
      CatNom: initial.CatNom ?? "",
      CatDes: initial.CatDes ?? "",
    });
    setValidationError(null); // Limpiar error al cambiar a edición
  }, [initial]);

  // Manejador genérico que limpia el error al escribir
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (validationError) {
      setValidationError(null); // Limpiar el error cuando el usuario interactúa
    }
  };

  const validate = () => {
    if (!form.CatNom.trim()) {
      setValidationError("El nombre de la categoría es obligatorio.");
      return false;
    }
    setValidationError(null);
    return true;
  }

  const submit = async () => {
    // 1. Validar en el frontend
    if (!validate()) {
      return;
    }

    if (isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        CatNom: form.CatNom.trim(),
        CatDes: form.CatDes.trim() || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <h3>{initial ? "Editar categoría" : "Registrar categoría"}</h3>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="CatNom">Nombre de la Categoría</label>
          {/* Campo de Nombre (obligatorio) */}
          <input
            placeholder="Nombre de la categoría (Obligatorio)"
            name="CatNom"
            value={form.CatNom}
            onChange={handleChange}
            disabled={isSaving}
          />
        </div>
        <div className="form-field">
          <label htmlFor="CatDes">Descripción (Opcional)</label>
          {/* Campo de Descripción */}
          <input
            placeholder="Descripción (opcional)"
            name="CatDes"
            value={form.CatDes}
            onChange={handleChange}
            disabled={isSaving}
          />
        </div>
      </div>
      {validationError && (
        <p
          style={{
            color: "#dc3545", 
            fontSize: "0.9em",
            fontWeight: "bold",
            textAlign: "center", 
            marginTop: "5px", 
            marginBottom: "5px", 
          }}
        >
          {validationError}
        </p>
      )}


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
  const [successModal, setSuccessModal] = useState<string | null>(null);

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

  /* ===== MANEJO DE ERRORES DEL BACKEND (Mantiene el modal de error general para fallos de servidor o duplicidad) ===== */
  const handleBackendError = async (res: Response) => {
    if (!res.ok) {
      let errorMessage = `Error ${res.status}: Operación fallida.`;
      let textBody = '';

      try {
        const resClone = res.clone();
        textBody = await resClone.text();
        const errorData = JSON.parse(textBody);

        let rawMessage = null;

        if (errorData && errorData.message) {
            rawMessage = errorData.message;
        }

        if (!rawMessage && errorData.error && errorData.error.message) {
             rawMessage = errorData.error.message;
        }

        if (rawMessage) {
            errorMessage = Array.isArray(rawMessage)
                ? rawMessage.join(", ")
                : rawMessage;
        } else {
            errorMessage = `Error ${res.status}: ${errorData.error || errorData.statusCode || 'Respuesta desconocida'}.`;
        }

      } catch (e) {
          if (textBody) {
             errorMessage = `Error ${res.status}: ${textBody}`;
          } else {
             errorMessage = `Error ${res.status}: Error de conexión o servidor.`;
          }
      }

      setErrorModal(errorMessage);
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
      setSuccessModal(isEdit ? "Categoría actualizada correctamente" : "Categoría registrada correctamente");
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
      setSuccessModal("Categoría desactivada con éxito");
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
      setSuccessModal("Categoría reactivada con éxito");
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

  /* ===== UI (Misma que antes) ===== */
  return (
    <>
      {error && <div className="error">{error}</div>}

      {/* ... (Filtros y Tabla) ... */}
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
      {/* ... (Fin de Filtros y Tabla) ... */}

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

            {modal === "delete" && selected && (
              <>
                <h3>¿Desactivar categoría?</h3>
                <p>No estará disponible para selección</p>
                <div className="modal-actions">
                  <button className="btn danger" onClick={deactivate}>Desactivar</button>
                  <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
                </div>              
              </>
            )}

            {modal === "reactivate" && selected && (
              <>
                <h3>¿Reactivar categoría?</h3>
                <p>Volverá a estar disponible para selección</p>
                <div className="modal-actions">
                  <button className="btn" onClick={reactivate}>Reactivar</button>
                  <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {successModal && (
        <div className="modal-backdrop">
          <div className="modal success-modal">
            <h3 className="success-title">✅ Operación Exitosa</h3>
            <p>{successModal}</p>
            <button className="btn" onClick={() => setSuccessModal(null)}>Aceptar</button>
          </div>
        </div>
      )}
      {/* ===== MODAL DE ERROR (Backend) ===== */}
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
