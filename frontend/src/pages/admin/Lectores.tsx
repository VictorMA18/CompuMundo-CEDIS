import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminCrud.css";

// Definición simple del tipo para Lectores
interface Lector {
  LecId: number;
  LecDni: string;
  LecNom: string;
  LecApe: string;
  LecTip: 'estudiante' | 'docente' | 'administrativo';
  LecEma: string | null;
  LecFecCre: string;
  LecAct: boolean;
}

/* ================= FORMULARIO (ACTUALIZADO CON VALIDACIÓN FRONTEND) ================= */
function LectorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Lector | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    LecNom: "",
    LecApe: "",
    LecDni: "",
    LecEma: "",
    LecTip: "estudiante" as Lector['LecTip'], // Aseguramos el tipo
  });
  const [isSaving, setIsSaving] = useState(false);
  // Estado para mostrar errores de validación del frontend
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      setForm({ LecNom: "", LecApe: "", LecDni: "", LecEma: "", LecTip: "estudiante" });
      setValidationError(null);
      return;
    }
    setForm({
      LecNom: initial.LecNom ?? "",
      LecApe: initial.LecApe ?? "",
      LecDni: initial.LecDni ?? "",
      LecEma: initial.LecEma ?? "",
      LecTip: initial.LecTip ?? "estudiante",
    });
    setValidationError(null);
  }, [initial]);

  // Manejador genérico que limpia el error al escribir y maneja inputs/selects
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value as any });
    if (validationError) {
      setValidationError(null);
    }
  };

  // Función de validación de campos obligatorios
  const validate = () => {
    if (!form.LecNom.trim()) {
      setValidationError("El nombre del lector es obligatorio.");
      return false;
    }
    if (!form.LecApe.trim()) {
      setValidationError("El apellido del lector es obligatorio.");
      return false;
    }
    if (!form.LecDni.trim()) {
      setValidationError("El DNI es obligatorio.");
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
            LecNom: form.LecNom.trim(),
            LecApe: form.LecApe.trim(),
            LecDni: form.LecDni.trim(),
            // Enviar undefined si el correo está vacío para que el backend lo maneje correctamente como NULL
            LecEma: form.LecEma.trim() || undefined, 
            LecTip: form.LecTip,
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <h3>{initial ? "Editar lector" : "Registrar lector"}</h3>

      <div className="form-grid">
        <div className='form-field'>
          <label htmlFor="LecNom">Nombres</label>
          <input
            placeholder="Nombres (obligatorio)"
            name="LecNom" // Añadido name
            value={form.LecNom}
            onChange={handleChange} // Usando handleChange genérico
            disabled={isSaving}
          />
        </div>
        <div className='form-field'>
          <label htmlFor="LecApe">Apellidos</label>
          <input
            placeholder="Apellidos (obligatorio)"
            name="LecApe" // Añadido name
            value={form.LecApe}
            onChange={handleChange} // Usando handleChange genérico
            disabled={isSaving}
          />
        </div>
        <div className='form-field'>
          <label htmlFor="LecDni">DNI</label>
          <input
            placeholder="DNI (obligatorio)"
            name="LecDni" // Añadido name
            value={form.LecDni}
            onChange={handleChange} // Usando handleChange genérico
            disabled={isSaving}
          />
         </div>
         <div className='form-field'>
          <label htmlFor="LecEma">Correo</label>
          <input
            placeholder="Correo (opcional)"
            name="LecEma" // Añadido name
            value={form.LecEma}
            onChange={handleChange} // Usando handleChange genérico
            disabled={isSaving}
          />
        </div>
        <div className='form-field'>
          <label htmlFor="LecTip">Tipo</label>
          <select
            name="LecTip" // Añadido name
            value={form.LecTip}
            onChange={handleChange} // Usando handleChange genérico
            disabled={isSaving}
          >
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
            <option value="administrativo">Administrativo</option>
          </select>
        </div>
      </div>
      
      {/* ERROR DE VALIDACIÓN DEL FRONTEND */}
      {validationError && (
        <p
          style={{
            color: "#dc3545", // Rojo (Danger)
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
export default function Lectores() {
  const setTitle = useOutletContext<(title: string) => void>();
  const { authFetch } = useAuth();

  useEffect(() => {
    setTitle?.("Lectores");
  }, [setTitle]);

  /* ===== ESTADO ===== */
  const [items, setItems] = useState<Lector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null); 
  const [successModal, setSuccessModal] = useState<string | null>(null);

  // filtros
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [fecha, setFecha] = useState("");
  const [view, setView] = useState<"activos" | "desactivados">("activos"); // Nuevo filtro de estado

  // modales
  const [modal, setModal] =
    useState<null | "view" | "edit" | "new" | "delete" | "reactivate">(null);
  const [selected, setSelected] = useState<Lector | null>(null);

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

        if (errorData && errorData.message) {
            rawMessage = errorData.message;
        } else if (errorData.error && errorData.error.message) {
             rawMessage = errorData.error.message;
        }
        
        if (Array.isArray(rawMessage)) {
            // Reglas de traducción/personalización para Lectores
            const translateValidationMessage = (msg: string) => {
                const messages: { [key: string]: string } = {
                    'LecDni must be a number string': 'El DNI debe contener solo números.',
                    'LecDni must be a valid DNI': 'El formato del DNI no es válido.',
                    'LecDni should not be empty': 'El DNI no puede estar vacío.',
                    'LecNom should not be empty': 'El nombre no puede estar vacío.',
                    'LecApe should not be empty': 'El apellido no puede estar vacío.',
                    'LecEma must be an email': 'El correo electrónico no tiene un formato válido.',
                    'already exists': 'ya está registrado/a.',
                };

                for (const pattern in messages) {
                    if (msg.includes(pattern)) {
                        return messages[pattern];
                    }
                }
                return msg;
            };

            errorMessage = rawMessage.map(translateValidationMessage).join(" | ");

        } else if (rawMessage) {
            errorMessage = rawMessage;
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
          ? "/api/lectores"
          : "/api/lectores/desactivados";

      const res = await authFetch(url);
      if (!res.ok) {
        throw new Error(`No se pudo cargar: ${res.status}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar lectores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [view]); // Dependencia del filtro VIEW

  // reset página cuando cambian filtros
  useEffect(() => {
    setPage(1);
  }, [search, tipo, fecha, pageSize, view]);

  /* ===== FILTROS / PAGINACIÓN ===== */
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
      ? `/api/lectores/${selected!.LecId}`
      : "/api/lectores";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await handleBackendError(res);
      setSuccessModal(isEdit ? "Lector actualizado correctamente" : "Lector registrado correctamente");
      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      console.error("Error en SAVE:", e);
    }
  };

  const remove = async () => {
    if (!selected) return;

    try {
      const res = await authFetch(`/api/lectores/${selected.LecId}`, { method: "DELETE" });

      await handleBackendError(res);
      setSuccessModal("Lector desactivado con éxito");
      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      console.error("Error en REMOVE:", e);
    }
  };

  const reactivate = async () => {
    if (!selected) return;
    try {
      const res = await authFetch(`/api/lectores/reactivar/${selected.LecId}`, {
        method: "PATCH",
      });

      await handleBackendError(res);
      setSuccessModal("Lector reactivado con éxito");
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
          <option value="">Todos los tipos</option>
          <option value="estudiante">Estudiante</option>
          <option value="docente">Docente</option>
          <option value="administrativo">Administrativo</option>
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
                <th>Nombre Completo</th>
                <th>DNI</th>
                <th>Correo</th>
                <th>Tipo</th>
                <th>Activo</th>
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
                  <td>{l.LecAct ? "Sí" : "No"}</td>
                  <td className="actions">
                    <button onClick={() => { setSelected(l); setModal("view"); }}>👁️</button>
                    <button onClick={() => { setSelected(l); setModal("edit"); }}>✏️</button>
                    {view === "activos" ? (
                      <button onClick={() => { setSelected(l); setModal("delete"); }}>🗑️</button>
                    ) : (
                      <button onClick={() => { setSelected(l); setModal("reactivate"); }}>♻️</button>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={7}>Sin registros</td>
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
                <h3>Detalle del lector</h3>
                <p><b>Nombre:</b> {selected.LecNom} {selected.LecApe}</p>
                <p><b>DNI:</b> {selected.LecDni}</p>
                <p><b>Correo:</b> {selected.LecEma || "—"}</p>
                <p><b>Tipo:</b> {selected.LecTip}</p>
                <p><b>Activo:</b> {selected.LecAct ? "Sí" : "No"}</p>
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
                <h3>¿Desactivar lector?</h3>
                <p>El lector <b>{selected.LecNom} {selected.LecApe}</b> será marcado como inactivo.</p>
                <div className="modal-actions">
                  <button className="btn danger" onClick={remove}>Desactivar</button>
                  <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
                </div>
              </>
            )}

            {modal === "reactivate" && selected && (
              <>
                <h3>¿Reactivar lector?</h3>
                <p>El lector <b>{selected.LecNom} {selected.LecApe}</b> volverá a estar activo en el sistema.</p>
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
