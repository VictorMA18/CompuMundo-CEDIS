import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminCrud.css"; // Asegúrate de que este archivo CSS existe

/* ================= TIPOS ================= */
type Autor = {
  AutId: number;
  AutNom: string;
  AutApe: string;
  AutDoc: string;
  AutEma: string | null;
  AutAct: boolean;
  AutFecCre?: string;
};

/* ================= FORMULARIO ================= */
function AutorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Autor | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    AutNom: "",
    AutApe: "",
    AutDoc: "",
    AutEma: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!initial) {
        setForm({ AutNom: "", AutApe: "", AutDoc: "", AutEma: "" });
        return;
    }
    setForm({
      AutNom: initial.AutNom ?? "",
      AutApe: initial.AutApe ?? "",
      AutDoc: initial.AutDoc ?? "",
      AutEma: initial.AutEma ?? "",
    });
  }, [initial]);

  const submit = async () => {
    // Validaciones básicas de campos requeridos
    if (isSaving || !form.AutNom.trim() || !form.AutApe.trim() || !form.AutDoc.trim()) return;

    setIsSaving(true);
    try {
        await onSave({
            AutNom: form.AutNom.trim(),
            AutApe: form.AutApe.trim(),
            AutDoc: form.AutDoc.trim(),
            // Enviar undefined si el correo está vacío para que el backend lo maneje como NULL
            AutEma: form.AutEma.trim() || undefined, 
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <h3>{initial ? "Editar autor" : "Registrar autor"}</h3>

      <div className="form-grid">
        <input
          placeholder="Nombres"
          value={form.AutNom}
          onChange={(e) => setForm({ ...form, AutNom: e.target.value })}
          disabled={isSaving}
        />
        <input
          placeholder="Apellidos"
          value={form.AutApe}
          onChange={(e) => setForm({ ...form, AutApe: e.target.value })}
          disabled={isSaving}
        />
        <input
          placeholder="Documento"
          value={form.AutDoc}
          onChange={(e) => setForm({ ...form, AutDoc: e.target.value })}
          disabled={isSaving}
        />
        <input
          placeholder="Correo (opcional)"
          value={form.AutEma}
          onChange={(e) => setForm({ ...form, AutEma: e.target.value })}
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
  const [errorModal, setErrorModal] = useState<string | null>(null); // Estado para errores de CRUD

  // filtros
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"activos" | "desactivados">("activos");

  // modales
  const [modal, setModal] =
    useState<null | "view" | "new" | "edit" | "delete" | "reactivate">(null);
  const [selected, setSelected] = useState<Autor | null>(null);

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== MANEJO DE ERRORES DEL BACKEND (Personalización y Traducción) ===== */
  const handleBackendError = async (res: Response) => {
    if (!res.ok) {
      let errorMessage = `Error ${res.status}: Operación fallida.`;
      let textBody = '';

      try {
        const resClone = res.clone();
        textBody = await resClone.text();
        const errorData = JSON.parse(textBody);

        let rawMessage = null;

        // 1. Obtener el mensaje del campo 'message' principal o anidado
        if (errorData && errorData.message) {
            rawMessage = errorData.message;
        } else if (errorData.error && errorData.error.message) {
             rawMessage = errorData.error.message;
        }
        
        // 2. Personalizar o traducir el mensaje si es un Array de errores de validación
        if (Array.isArray(rawMessage)) {
            // Función de traducción/personalización
            const translateValidationMessage = (msg: string) => {
                const messages: { [key: string]: string } = {
                    'AutDoc should not be empty': 'El documento no puede estar vacío.',
                    'AutNom should not be empty': 'El nombre no puede estar vacío.',
                    'AutApe should not be empty': 'El apellido no puede estar vacío.',
                    'AutEma must be an email': 'El correo electrónico no tiene un formato válido.',
                    // Asegúrate de agregar cualquier otro error de validación que encuentres
                };

                // Busca por inclusión de substring
                for (const pattern in messages) {
                    if (msg.includes(pattern)) {
                        return messages[pattern];
                    }
                }
                // Si no se encuentra traducción, devuelve el mensaje original
                return msg;
            };

            // Formatear el mensaje traducido, uniéndolos con un separador claro
            errorMessage = rawMessage.map(translateValidationMessage).join(" | ");

        } else if (rawMessage) {
            // 3. Si es un string simple (errores lanzados manualmente en el backend, ej. "El correo ya está en uso")
            errorMessage = rawMessage;
        } else {
            // 4. Mensaje de respaldo
            errorMessage = `Error ${res.status}: ${errorData.error || errorData.statusCode || 'Respuesta desconocida'}.`;
        }

      } catch (e) {
          // 5. Si falla al parsear el JSON
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

  const closeErrorModal = () => {
    setErrorModal(null);
  }


  /* ===== LOAD ===== */
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        view === "activos" ? "/api/autores" : "/api/autores/desactivados";
      
      const res = await authFetch(url);
      if (!res.ok) {
        throw new Error(`No se pudo cargar: ${res.status}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar autores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [view]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, view]);

  /* ===== FILTROS / PAGINACIÓN ===== */
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

  /* ===== CRUD ===== */
  const save = async (payload: any) => {
    const isEdit = modal === "edit" && selected;
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? `/api/autores/${selected!.AutId}`
      : "/api/autores";

    try {
        const res = await authFetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        await handleBackendError(res); // Manejo de errores

        setModal(null);
        setSelected(null);
        await load();
    } catch (e) {
        console.error("Error en SAVE:", e);
    }
  };

  const deactivate = async () => {
    if (!selected) return;
    try {
        const res = await authFetch(`/api/autores/${selected.AutId}`, { method: "DELETE" });
        await handleBackendError(res); // Manejo de errores
        
        setModal(null);
        setSelected(null);
        await load();
    } catch (e) {
        console.error("Error en DEACTIVATE:", e);
    }
  };

  const reactivate = async () => {
    if (!selected) return;
    try {
        const res = await authFetch(`/api/autores/reactivar/${selected.AutId}`, {
            method: "PATCH",
        });
        await handleBackendError(res); // Manejo de errores

        setModal(null);
        setSelected(null);
        await load();
    } catch (e) {
        console.error("Error en REACTIVATE:", e);
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
          placeholder="Buscar por nombre, documento o correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="input"
          value={view}
          onChange={(e) => setView(e.target.value as any)}
        >
          <option value="activos">Activos</option>
          <option value="desactivados">Desactivados</option>
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
                <th>Nombre</th>
                <th>Documento</th>
                <th>Correo</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((a, i) => (
                <tr key={a.AutId}>
                  <td>{(page - 1) * pageSize + i + 1}</td>
                  <td>{a.AutNom} {a.AutApe}</td>
                  <td>{a.AutDoc}</td>
                  <td>{a.AutEma || "—"}</td>
                  <td>{a.AutAct ? "Sí" : "No"}</td>
                  <td className="actions">
                    <button onClick={() => { setSelected(a); setModal("view"); }}>👁️</button>
                    <button onClick={() => { setSelected(a); setModal("edit"); }}>✏️</button>
                    {view === "activos" ? (
                      <button onClick={() => { setSelected(a); setModal("delete"); }}>🗑️</button>
                    ) : (
                      <button onClick={() => { setSelected(a); setModal("reactivate"); }}>♻️</button>
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

      {/* ===== MODALES DE OPERACIÓN ===== */}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            {modal === "view" && selected && (
              <>
                <h3>Detalle del autor</h3>
                <p><b>Nombre:</b> {selected.AutNom} {selected.AutApe}</p>
                <p><b>Documento:</b> {selected.AutDoc}</p>
                <p><b>Correo:</b> {selected.AutEma || "—"}</p>
                <p><b>Activo:</b> {selected.AutAct ? "Sí" : "No"}</p>
                <button className="btn" onClick={() => setModal(null)}>Cerrar</button>
              </>
            )}

            {(modal === "new" || modal === "edit") && (
              <AutorForm
                initial={modal === "edit" ? selected : null}
                onSave={save}
                onCancel={() => setModal(null)}
              />
            )}

            {modal === "delete" && selected && (
              <>
                <h3>¿Desactivar autor?</h3>
                <p>El autor **{selected.AutNom} {selected.AutApe}** será marcado como inactivo.</p>
                <button className="btn danger" onClick={deactivate}>Desactivar</button>
                <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              </>
            )}

            {modal === "reactivate" && selected && (
              <>
                <h3>¿Reactivar autor?</h3>
                <p>El autor **{selected.AutNom} {selected.AutApe}** volverá a estar activo en el sistema.</p>
                <button className="btn" onClick={reactivate}>Reactivar</button>
                <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* ===== MODAL DE ERROR (Muestra solo el mensaje descriptivo) ===== */}
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
