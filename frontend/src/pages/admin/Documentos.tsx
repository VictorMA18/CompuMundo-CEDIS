import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminCrud.css";

/* ================= TIPOS ================= */
type AutorRef = { AutId: number; AutNom: string; AutApe: string; AutDoc: string };
type Categoria = { CatId: number; CatNom: string };
type Autor = { AutId: number; AutNom: string; AutApe: string; AutDoc: string };

type MaterialBibliografico = {
  MatBibId: number;
  MatBibCod: string;
  MatBibTit: string;
  MatBibAno: boolean;
  CatId: number;
  MatBibFor: "FISICO" | "VIRTUAL" | "MIXTO" | "NINGUNO" | string;
  MatBibAct: boolean;
  MatBibFecPub: string | null;
  autoresMaterial?: Array<{ autor: AutorRef }>;
  totalFisicos?: number;
  disponiblesFisicos?: number;
  tieneVirtual?: boolean;
};

type View = "activos" | "desactivados";
type ModalState =
  | null
  | "view"
  | "new"
  | "edit"
  | "delete"
  | "reactivate"
  | "recalculate";

/* ================= HOOKS DE DATOS RELACIONADOS ================= */

const useCategories = (authFetch: any) => {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await authFetch("/api/categorias");
        if (res.ok) {
          const data = await res.json();
          setCategories(data || []);
        }
      } catch (e) {
        console.error("No se pudieron cargar las categorías:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { categories, loading };
};

const useAutores = (authFetch: any) => {
  const [autores, setAutores] = useState<Autor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAutores = async () => {
      try {
        const res = await authFetch("/api/autores");
        if (res.ok) {
          const data = await res.json();
          setAutores(data || []);
        }
      } catch (e) {
        console.error("No se pudieron cargar los autores:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetchAutores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { autores, loading };
};


/* ================= COMPONENTES DE FORMULARIO ================= */

function AutorSelector({
  allAutores,
  selectedIds,
  onChange,
}: {
  allAutores: Autor[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const availableAutores = useMemo(() => {
    return allAutores.filter(aut => !selectedIds.includes(aut.AutId));
  }, [allAutores, selectedIds]);

  const selectedAutores = useMemo(() => {
    return allAutores.filter(aut => selectedIds.includes(aut.AutId));
  }, [allAutores, selectedIds]);

  const [tempSelectedId, setTempSelectedId] = useState(
    availableAutores.length > 0 ? availableAutores[0].AutId : 0
  );

  useEffect(() => {
    if (!availableAutores.some(aut => aut.AutId === tempSelectedId) && availableAutores.length > 0) {
      setTempSelectedId(availableAutores[0].AutId);
    } else if (availableAutores.length === 0) {
      setTempSelectedId(0);
    }
  }, [availableAutores, tempSelectedId]);


  const addAutor = () => {
    if (tempSelectedId !== 0 && !selectedIds.includes(tempSelectedId)) {
      onChange([...selectedIds, tempSelectedId]);
    }
  };

  const removeAutor = (idToRemove: number) => {
    onChange(selectedIds.filter(id => id !== idToRemove));
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        Autores
      </label>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
        <select
          className="input"
          value={tempSelectedId}
          onChange={(e) => setTempSelectedId(Number(e.target.value))}
          disabled={availableAutores.length === 0}
          style={{ flexGrow: 1 }}
        >
          {availableAutores.length === 0 ? (
            <option value={0}>No hay más autores disponibles</option>
          ) : (
            availableAutores.map(aut => (
              <option key={aut.AutId} value={aut.AutId}>
                {`${aut.AutNom} ${aut.AutApe} (${aut.AutDoc})`}
              </option>
            ))
          )}
        </select>
        <button
          className="btn-new"
          onClick={addAutor}
          disabled={tempSelectedId === 0}
          style={{ whiteSpace: 'nowrap' }}
        >
          + Agregar
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', minHeight: '30px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
        {selectedAutores.length === 0 ? (
          <span style={{ color: '#888' }}>Sin autores seleccionados (Documento anónimo si se deja vacío)</span>
        ) : (
          selectedAutores.map(aut => (
            <span
              key={aut.AutId}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '15px',
                padding: '5px 10px',
                fontSize: '0.85em',
              }}
            >
              {`${aut.AutNom} ${aut.AutApe}`}
              <button
                type="button"
                onClick={() => removeAutor(aut.AutId)}
                style={{
                  marginLeft: '5px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1em',
                  padding: '0 2px',
                }}
              >
                &times;
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function DocumentoForm({
  initial,
  onSave,
  onCancel,
  categories,
  autores,
}: {
  initial: MaterialBibliografico | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  categories: Categoria[];
  autores: Autor[];
}) {
  const [form, setForm] = useState({
    MatBibCod: "",
    MatBibTit: "",
    CatId: categories.length > 0 ? categories[0].CatId : 0,
    selectedAutoresIds: [] as number[],
  });
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (initial) {
      setForm({
        MatBibCod: initial.MatBibCod ?? "",
        MatBibTit: initial.MatBibTit ?? "",
        CatId: initial.CatId,
        selectedAutoresIds: (initial.autoresMaterial || []).map(a => a.autor.AutId),
      });
    } else if (categories.length > 0 && form.CatId === 0) {
      setForm(f => ({ ...f, CatId: categories[0].CatId }));
    }
  }, [initial, categories]);

  const handleAutorIdsChange = (ids: number[]) => {
    setForm(f => ({ ...f, selectedAutoresIds: ids }));
  };

  const submit = async () => {
    if (isSaving || !form.MatBibCod || !form.MatBibTit || !form.CatId) return;

    const selectedAutores = autores.filter(aut =>
      form.selectedAutoresIds.includes(aut.AutId)
    );

    const autoresPayload = selectedAutores.map(aut => ({
      AutDoc: aut.AutDoc,
    }));
    
    setIsSaving(true);
    try {
      await onSave({
        MatBibCod: form.MatBibCod.trim(),
        MatBibTit: form.MatBibTit.trim(),
        CatId: form.CatId,
        autores: autoresPayload.length > 0 ? autoresPayload : null,
        MatBibAno: autoresPayload.length === 0,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isCategoryLoading = categories.length === 0 && initial === null;
  const isAutoresLoading = autores.length === 0 && initial === null;

  const isDisabled = isCategoryLoading || isAutoresLoading || isSaving;

  return (
    <>
      <h3>{initial ? "Editar Documento" : "Registrar Documento"}</h3>

      <div className="form-grid">
        <input
          placeholder="Código"
          value={form.MatBibCod}
          onChange={(e) => setForm({ ...form, MatBibCod: e.target.value })}
          disabled={isDisabled}
        />
        <input
          placeholder="Título"
          value={form.MatBibTit}
          onChange={(e) => setForm({ ...form, MatBibTit: e.target.value })}
          disabled={isDisabled}
        />

        <select
          className="input"
          value={form.CatId}
          onChange={(e) => setForm({ ...form, CatId: Number(e.target.value) })}
          disabled={isCategoryLoading || isSaving}
        >
          {isCategoryLoading && <option value={0}>Cargando categorías...</option>}
          {categories.map(cat => (
            <option key={cat.CatId} value={cat.CatId}>
              {cat.CatNom}
            </option>
          ))}
        </select>
        <div></div>

        <div style={{ gridColumn: 'span 2' }}>
          <AutorSelector
            allAutores={autores}
            selectedIds={form.selectedAutoresIds}
            onChange={handleAutorIdsChange}
          />
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn" onClick={submit} disabled={isDisabled}>
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
export default function Documentos() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  const { categories, loading: loadingCategories } = useCategories(authFetch);
  const { autores, loading: loadingAutores } = useAutores(authFetch);

  useEffect(() => {
    setTitle?.("Documentos");
  }, [setTitle]);

  /* ===== ESTADO Y FILTROS ===== */
  const [items, setItems] = useState<MaterialBibliografico[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("activos");
  const [modal, setModal] = useState<ModalState>(null);
  const [selected, setSelected] = useState<MaterialBibliografico | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);


  /* ===== MANEJO DE ERRORES DEL BACKEND (Lógica robusta) ===== */
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
            // Función de traducción/personalización para Documentos
            const translateValidationMessage = (msg: string) => {
                const messages: { [key: string]: string } = {
                    'MatBibCod should not be empty': 'El Código del Documento no puede estar vacío.',
                    'MatBibTit should not be empty': 'El Título del Documento no puede estar vacío.',
                    'CatId must be a number': 'Debe seleccionar una Categoría válida.',
                };

                for (const pattern in messages) {
                    if (msg.includes(pattern)) {
                        return messages[pattern];
                    }
                }
                return msg;
            };

            // Formatear el mensaje traducido, uniéndolos con un separador claro
            errorMessage = rawMessage.map(translateValidationMessage).join(" | ");

        } else if (rawMessage) {
            // 3. Si es un string simple
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
      // Lanzamos un error para que el catch de la operación lo capture y detenga el flujo
      throw new Error(errorMessage); 
    }
  };

  const closeErrorModal = () => {
    setErrorModal(null);
  }
  
  /* ===== LOAD DATA ===== */
  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const url =
        view === "activos"
          ? "/api/material-bibliografico"
          : "/api/material-bibliografico/desactivados";
      const res = await authFetch(url);
      
      if (!res.ok) {
        throw new Error(`Error al cargar documentos (${res.status})`);
      }

      const data = (await res.json()) as MaterialBibliografico[];
      setItems(data || []);
    } catch(e) {
      console.error("No se pudo conectar para cargar documentos", e);
      setItems([]);
      setLoadError("No se pudieron cargar los documentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  /* ===== FILTRADO Y PAGINACIÓN ===== */
  const filteredItems = useMemo(() => {
    return items.filter(
      (m) =>
        m.MatBibTit.toLowerCase().includes(search.toLowerCase()) ||
        m.MatBibCod.includes(search) ||
        (m.autoresMaterial || []).some((x) =>
          `${x.autor.AutNom} ${x.autor.AutApe}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
    );
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  /* ===== CRUD ACTIONS (Usando handleBackendError) ===== */

  const save = async (payload: any) => {
    const isEdit = modal === "edit" && selected;
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? `/api/material-bibliografico/${selected!.MatBibId}`
      : "/api/material-bibliografico";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await handleBackendError(res); // Si hay error, lanza la excepción y muestra el modal.

      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      // El error ya fue manejado y mostrado en el modal.
      console.error("Error en SAVE:", e);
    }
  };

  const deactivate = async () => {
    if (!selected) return;
    try {
      const res = await authFetch(`/api/material-bibliografico/${selected.MatBibId}`, {
        method: "DELETE",
      });
      
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
      const res = await authFetch(
        `/api/material-bibliografico/reactivar/${selected.MatBibId}`,
        {
          method: "PATCH",
        }
      );

      await handleBackendError(res);

      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      console.error("Error en REACTIVATE:", e);
    }
  };

  const recalculateFormat = async () => {
    if (!selected) return;
    try {
      const res = await authFetch(
        `/api/material-bibliografico/recalcular-formato/${selected.MatBibId}`,
        {
          method: "PATCH",
        }
      );

      await handleBackendError(res);

      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      console.error("Error en RECALCULATE:", e);
    }
  };

  /* ===== UI DE TABLA ===== */
  return (
    <>
      {loadError && <div className="error">{loadError}</div>}
      
      <div className="filters-card">
        <h3 className="card-title">Filtros</h3>
        <input
          className="input"
          placeholder="Buscar por código, título o autor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={view}
          onChange={(e) => setView(e.target.value as View)}
          disabled={loading}
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
          disabled={loading || loadingCategories || loadingAutores}
        >
          ➕ Nuevo
        </button>
      </div>

      <div className="table-card">
        <h3 className="card-title">Listado de Documentos</h3>
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
                <th>Físicos</th>
                <th>Virtual</th>
                <th>Autores</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((m, index) => {
                const itemIndex = (page - 1) * pageSize + index + 1;

                const autoresList = (m.autoresMaterial || []).map(
                  (x) => `${x.autor.AutNom} ${x.autor.AutApe}`
                );
                const fis =
                  typeof m.totalFisicos === "number"
                    ? `${m.disponiblesFisicos ?? 0}/${m.totalFisicos}`
                    : "N/A";
                const vir =
                  typeof m.tieneVirtual === "boolean"
                    ? m.tieneVirtual
                      ? "Sí"
                      : "No"
                    : "N/A";
                const categoryName = categories.find(c => c.CatId === m.CatId)?.CatNom || m.CatId;

                return (
                  <tr key={m.MatBibId}>
                    <td>{itemIndex}</td>
                    <td>{m.MatBibCod}</td>
                    <td>{m.MatBibTit}</td>
                    <td>{categoryName}</td>
                    <td>{m.MatBibFor}</td>
                    <td>{fis}</td>
                    <td>{vir}</td>
                    <td
                      style={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={autoresList.join(", ")}
                    >
                      {autoresList.join(", ")}
                    </td>
                    <td>{m.MatBibAct ? "Sí" : "No"}</td>
                    <td className="actions">
                      <button onClick={() => { setSelected(m); setModal("view"); }}>👁️</button>
                      <button onClick={() => { setSelected(m); setModal("edit"); }}>✏️</button>
                      <button title="Recalcular Formato" onClick={() => { setSelected(m); setModal("recalculate"); }}>🔄</button>
                      {view === "activos" ? (
                        <button onClick={() => { setSelected(m); setModal("delete"); }}>🗑️</button>
                      ) : (
                        <button onClick={() => { setSelected(m); setModal("reactivate"); }}>♻️</button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={10}>Sin registros</td>
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
      
      {/* ===== MODALES DE OPERACIÓN ===== */}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            {/* View Modal */}
            {modal === "view" && selected && (
              <>
                <h3>Detalle del Documento</h3>
                <p><b>Título:</b> {selected.MatBibTit}</p>
                <p><b>Categoría:</b> {categories.find(c => c.CatId === selected.CatId)?.CatNom || selected.CatId}</p>
                <p><b>Autores:</b> {(selected.autoresMaterial || []).map(a => `${a.autor.AutNom} ${a.autor.AutApe}`).join(', ') || '—'}</p>
                <button className="btn" onClick={() => setModal(null)}>Cerrar</button>
              </>
            )}

            {/* Formulario (New/Edit) */}
            {(modal === "new" || modal === "edit") && (
              <DocumentoForm
                initial={modal === "edit" ? selected : null}
                onSave={save}
                onCancel={() => setModal(null)}
                categories={categories}
                autores={autores}
              />
            )}
            
            {/* Delete Modal */}
            {modal === "delete" && selected && (
              <>
                <h3>¿Desactivar documento?</h3>
                <p>
                  **Documento:** {selected.MatBibTit} ({selected.MatBibCod})
                </p>
                <div className="modal-actions">
                  <button className="btn danger" onClick={deactivate}>
                    Desactivar
                  </button>
                  <button className="btn secondary" onClick={() => setModal(null)}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
            
            {/* Reactivate Modal */}
            {modal === "reactivate" && selected && (
              <>
                <h3>¿Reactivar documento?</h3>
                <p>
                  **Documento:** {selected.MatBibTit} ({selected.MatBibCod}) volverá a estar activo.
                </p>
                <div className="modal-actions">
                  <button className="btn" onClick={reactivate}>
                    Reactivar
                  </button>
                  <button className="btn secondary" onClick={() => setModal(null)}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
            
            {/* Recalculate Modal */}
            {modal === "recalculate" && selected && (
              <>
                <h3>¿Recalcular formato?</h3>
                <p>
                  Esto actualizará el campo `MatBibFor` basado en la existencia
                  de copias físicas y recursos virtuales.
                </p>
                <p>
                  **Documento:** {selected.MatBibTit} ({selected.MatBibCod})
                </p>
                <div className="modal-actions">
                  <button className="btn" onClick={recalculateFormat}>
                    Recalcular
                  </button>
                  <button className="btn secondary" onClick={() => setModal(null)}>
                    Cancelar
                  </button>
                </div>
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
            {/* Mensaje detallado y parseado del backend */}
            <p>{errorModal}</p>
            <button className="btn" onClick={closeErrorModal}>Aceptar</button>
          </div>
        </div>
      )}
    </>
  );
}
