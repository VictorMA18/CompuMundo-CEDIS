import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UsuTip } from "../../types/auth";
import type { Usuario } from "../../types/usuario";
import "./AdminCrud.css"; // Asegúrate de que este archivo CSS existe

/* ================= FORMULARIO ================= */
function UsuarioForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Usuario | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    UsuNom: "",
    UsuEma: "",
    UsuTip: "consultor" as UsuTip,
    UsuCon: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  useEffect(() => {
    if (!initial) {
        setForm({ UsuNom: "", UsuEma: "", UsuTip: "consultor", UsuCon: "" });
        return;
    }
    setForm({
      UsuNom: initial.UsuNom,
      UsuEma: initial.UsuEma,
      UsuTip: initial.UsuTip,
      UsuCon: "",
    });
  }, [initial]);

  const submit = async () => {
    // Validaciones básicas de campos requeridos
    if (isSaving || !form.UsuNom.trim() || !form.UsuEma.trim() || (!initial && !form.UsuCon.trim())) return;

    setIsSaving(true);
    const payload: any = {
      UsuNom: form.UsuNom.trim(),
      UsuEma: form.UsuEma.trim(),
      UsuTip: form.UsuTip,
    };

    // La contraseña solo se envía si es nuevo o si se modificó
    if (!initial || form.UsuCon.trim()) {
      payload.UsuCon = form.UsuCon;
    }

    try {
        await onSave(payload);
    } finally {
        setIsSaving(false); 
    }
  };

  return (
    <>
      <h3>{initial ? "Editar usuario" : "Registrar usuario"}</h3>

      <div className="form-grid">
        <input
          placeholder="Nombre"
          value={form.UsuNom}
          onChange={(e) => setForm({ ...form, UsuNom: e.target.value })}
          disabled={isSaving}
        />
        <input
          placeholder="Correo"
          value={form.UsuEma}
          onChange={(e) => setForm({ ...form, UsuEma: e.target.value })}
          disabled={isSaving}
        />
        <select
          value={form.UsuTip}
          onChange={(e) => setForm({ ...form, UsuTip: e.target.value as UsuTip })}
          disabled={isSaving}
        >
          <option value="administrador">Administrador</option>
          <option value="bibliotecario">Bibliotecario</option>
          <option value="consultor">Consultor</option>
        </select>
        
        {/* Campo de Contraseña con el botón "ojo" */}
        <div className="password-container"> 
          <input
            type={showPassword ? "text" : "password"}
            placeholder={initial ? "Nueva contraseña (opcional)" : "Contraseña"}
            value={form.UsuCon}
            onChange={(e) => setForm({ ...form, UsuCon: e.target.value })}
            disabled={isSaving}
          />
          <button 
            type="button" 
            className="toggle-password-btn" 
            onClick={() => setShowPassword(p => !p)}
            disabled={isSaving}
          >
            {showPassword ? "👁️" : "🔒"} 
          </button>
        </div>

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
  const [errorModal, setErrorModal] = useState<string | null>(null); 

  // filtros
  const [search, setSearch] = useState("");
  const [rol, setRol] = useState("");
  const [view, setView] = useState<"activos" | "desactivados">("activos");

  // modales
  const [modal, setModal] =
    useState<null | "view" | "edit" | "new" | "delete" | "reactivate">(null);
  const [selected, setSelected] = useState<Usuario | null>(null);

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
                    'UsuEma must be an email': 'El correo electrónico no tiene un formato válido.',
                    'UsuCon must be longer than or equal to 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
                    'UsuNom should not be empty': 'El nombre del usuario no puede estar vacío.',
                    'UsuEma should not be empty': 'El correo del usuario no puede estar vacío.',
                    // Agrega aquí más patrones de error de validación que encuentres
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
            // 3. Si es un string simple (errores lanzados manualmente en el backend, ej. "El email ya está registrado")
            errorMessage = rawMessage;
        } else {
            // 4. Mensaje de respaldo si el JSON es válido pero sin campos 'message' útiles
            errorMessage = `Error ${res.status}: ${errorData.error || errorData.statusCode || 'Respuesta desconocida'}.`;
        }

      } catch (e) {
          // 5. Si falla al parsear el JSON (cuerpo vacío o no JSON)
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
        view === "activos"
          ? "/api/usuarios"
          : "/api/usuarios/desactivados";

      const res = await authFetch(url);
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
  }, [view]);

  // reset página
  useEffect(() => {
    setPage(1);
  }, [search, rol, pageSize]);

  /* ===== FILTROS / PAGINACIÓN ===== */
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

  /* ===== CRUD ===== */
  const save = async (payload: any) => {
    const isEdit = modal === "edit" && selected;

    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? `/api/usuarios/${selected!.UsuId}`
      : "/api/usuarios";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await handleBackendError(res);

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
      const res = await authFetch(`/api/usuarios/${selected.UsuId}`, { method: "DELETE" });

      await handleBackendError(res);

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
      const res = await authFetch(`/api/usuarios/reactivar/${selected.UsuId}`, {
        method: "PATCH",
      });

      await handleBackendError(res);

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
                <th>Activo</th>
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
                  <td>{u.UsuAct ? "Sí" : "No"}</td>
                  <td className="actions">
                    <button onClick={() => { setSelected(u); setModal("view"); }}>👁️</button>
                    <button onClick={() => { setSelected(u); setModal("edit"); }}>✏️</button>
                    {view === "activos" ? (
                      <button onClick={() => { setSelected(u); setModal("delete"); }}>🗑️</button>
                    ) : (
                      <button onClick={() => { setSelected(u); setModal("reactivate"); }}>♻️</button>
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
                <h3>Detalle del usuario</h3>
                <p><b>Nombre:</b> {selected.UsuNom}</p>
                <p><b>Correo:</b> {selected.UsuEma}</p>
                <p><b>Rol:</b> {selected.UsuTip}</p>
                <p><b>Activo:</b> {selected.UsuAct ? "Sí" : "No"}</p>
                <button className="btn" onClick={() => setModal(null)}>Cerrar</button>
              </>
            )}

            {(modal === "new" || modal === "edit") && (
              <UsuarioForm
                initial={modal === "edit" ? selected : null}
                onSave={save}
                onCancel={() => setModal(null)}
              />
            )}

            {modal === "delete" && (
              <>
                <h3>¿Desactivar usuario?</h3>
                <p>El usuario no podrá acceder al sistema</p>
                <button className="btn danger" onClick={deactivate}>Desactivar</button>
                <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              </>
            )}

            {modal === "reactivate" && (
              <>
                <h3>¿Reactivar usuario?</h3>
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
