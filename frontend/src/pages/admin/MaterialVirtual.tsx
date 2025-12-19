import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminCrud.css';

/* ================= TIPOS ================= */
type MaterialVirtual = {
  MatVirId: number;
  MatBibId: number;
  MatVirUrlAcc: string;
  MatVirForArc: string;
  MatVirAct: boolean;
  materialBibliografico?: { MatBibTit: string; MatBibCod: string };
};

type MaterialBibRef = { MatBibId: number; MatBibTit: string; MatBibCod: string };

type View = 'activos' | 'desactivados';
type ModalState = null | 'view' | 'new' | 'edit' | 'delete' | 'reactivate';

/* ================= HOOKS DE DATOS RELACIONADOS ================= */
const useBibliograficos = (authFetch: any) => {
  const [data, setData] = useState<MaterialBibRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await authFetch('/api/material-bibliografico');
        if (res.ok) {
          const json = await res.json();
          setData(json || []);
        }
      } catch (e) {
        console.error("Error al cargar bibliográficos:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetchDocs();
  }, [authFetch]);
  return { bibliograficos: data, loading };
};

/* ================= COMPONENTE DE FORMULARIO ================= */
function MaterialVirtualForm({
  initial,
  onSave,
  onCancel,
  bibliograficos,
}: {
  initial: MaterialVirtual | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  bibliograficos: MaterialBibRef[];
}) {
  const [form, setForm] = useState({
    MatBibId: 0,
    MatVirUrlAcc: '',
    MatVirForArc: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        MatBibId: initial.MatBibId,
        MatVirUrlAcc: initial.MatVirUrlAcc || "",
        MatVirForArc: initial.MatVirForArc || "",
      });
    }
    setValidationError(null);
  }, [initial]);

  const handleInputChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (validationError) setValidationError(null);
  };

  const validate = () => {
    if (!form.MatBibId || form.MatBibId === 0) {
      setValidationError("Debe seleccionar un material bibliográfico.");
      return false;
    }
    if (!form.MatVirUrlAcc.trim()) {
      setValidationError("La URL de acceso es obligatoria.");
      return false;
    }
    if (!form.MatVirForArc.trim()) {
      setValidationError("El formato de archivo es obligatorio.");
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        ...form,
        MatVirUrlAcc: form.MatVirUrlAcc.trim(),
        MatVirForArc: form.MatVirForArc.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <h3>{initial ? "Editar Material Virtual" : "Registrar Material Virtual"}</h3>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="MatBibId">Documento Bibliográfico</label>
          <select
            className="input"
            value={form.MatBibId}
            onChange={(e) => handleInputChange("MatBibId", Number(e.target.value))}
            disabled={isSaving}
          >
            <option value={0}>Seleccione Documento Padre...</option>
            {bibliograficos.map(b => (
              <option key={b.MatBibId} value={b.MatBibId}>
                {b.MatBibTit} ({b.MatBibCod})
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="MatVirUrlAcc">URL de Acceso</label>
          <input
            className="input"
            placeholder="URL de Acceso (http://...)"
            value={form.MatVirUrlAcc}
            onChange={(e) => handleInputChange("MatVirUrlAcc", e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="form-field">
          <label htmlFor="MatVirForArc">Formato del Archivo</label>
          <input
            className="input"
            placeholder="Formato (PDF, EPUB, etc.)"
            value={form.MatVirForArc}
            onChange={(e) => handleInputChange("MatVirForArc", e.target.value)}
            disabled={isSaving}
          />
        </div>
      </div>

      {validationError && (
        <p style={{ color: "#dc3545", fontSize: "0.9em", fontWeight: "bold", textAlign: "center", margin: "10px 0" }}>
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
export default function MaterialVirtual() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();
  const { bibliograficos, loading: loadingBib } = useBibliograficos(authFetch);

  useEffect(() => { setTitle?.("Material Virtual"); }, [setTitle]);

  const [items, setItems] = useState<MaterialVirtual[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("activos");
  const [modal, setModal] = useState<ModalState>(null);
  const [selected, setSelected] = useState<MaterialVirtual | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<string | null>(null);

  const handleBackendError = async (res: Response) => {
    if (!res.ok) {
      let errorMessage = `Error ${res.status}: Operación fallida.`;
      try {
        const resClone = res.clone();
        const errorData = await resClone.json();
        let rawMessage = errorData.message || errorData.error?.message;
        if (Array.isArray(rawMessage)) errorMessage = rawMessage.join(" | ");
        else if (rawMessage) errorMessage = rawMessage;
      } catch {
        errorMessage = `Error ${res.status}: Error de servidor.`;
      }
      setErrorModal(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const url = view === "activos" ? "/api/material-virtual" : "/api/material-virtual/desactivados";
      const res = await authFetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data || []);
    } catch {
      setItems([]);
      setLoadError("No se pudieron cargar los materiales virtuales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [view]);

  const filteredItems = useMemo(() => {
    return items.filter(m =>
      m.MatVirForArc.toLowerCase().includes(search.toLowerCase()) ||
      m.materialBibliografico?.MatBibTit.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const save = async (payload: any) => {
    const isEdit = modal === "edit" && selected;
    const url = isEdit ? `/api/material-virtual/${selected.MatVirId}` : "/api/material-virtual";
    try {
      const res = await authFetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await handleBackendError(res);
      setSuccessModal(isEdit ? "Registro actualizado correctamente" : "Registro creado correctamente");
      setModal(null); 
      await load();
    } catch (e) { console.error(e); }
  };

  return (
    <>
      {loadError && <div className="error">{loadError}</div>}
      
      <div className="filters-card">
        <h3 className="card-title">Filtros</h3>
        <input className="input" placeholder="Buscar por título o formato..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={view} onChange={(e) => setView(e.target.value as View)}>
          <option value="activos">Activos</option>
          <option value="desactivados">Desactivados</option>
        </select>
        <button className="btn-new" onClick={() => { setSelected(null); setModal("new"); }} disabled={loadingBib}>
          ➕ Nuevo
        </button>
      </div>

      <div className="table-card">
        <h3 className="card-title">Listado de Material Virtual</h3>
        <div className="table-toolbar">
          <span>Mostrar</span>
          <select className="input-small" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
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
                <th>Documento</th> {/* Cambio de ID a Título */}
                <th>URL de Acceso</th>
                <th>Formato</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((m, index) => (
                <tr key={m.MatVirId}>
                  <td>{(page - 1) * pageSize + index + 1}</td>
                  <td>{m.materialBibliografico?.MatBibTit || m.MatBibId}</td>
                  <td className="text-ellipsis" title={m.MatVirUrlAcc}>{m.MatVirUrlAcc}</td>
                  <td>{m.MatVirForArc}</td>
                  <td>
                    <span className={`status-badge ${m.MatVirAct ? 'disponible' : 'dañado'}`}>
                      {m.MatVirAct ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="actions">
                    <button onClick={() => { setSelected(m); setModal("view"); }}>👁️</button>
                    {/* Botón editar siempre disponible */}
                    <button onClick={() => { setSelected(m); setModal("edit"); }}>✏️</button>
                    {view === "activos" ? (
                      <button onClick={() => { setSelected(m); setModal("delete"); }}>🗑️</button>
                    ) : (
                      <button onClick={() => { setSelected(m); setModal("reactivate"); }}>♻️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination">
        <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>⬅ Anterior</button>
        <span>Página {page} de {totalPages || 1}</span>
        <button className="btn-secondary" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>Siguiente ➡</button>
      </div>

      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            {modal === "view" && selected && (
              <>
                <h3>Detalle de Material</h3>
                <p><b>Documento:</b> {selected.materialBibliografico?.MatBibTit || "N/A"}</p>
                <p><b>URL Acceso:</b> {selected.MatVirUrlAcc}</p>
                <p><b>Formato:</b> {selected.MatVirForArc}</p>
                <p><b>Estado:</b> {selected.MatVirAct ? "Activo" : "Desactivado"}</p>
                <button className="btn" onClick={() => setModal(null)}>Cerrar</button>
              </>
            )}

            {(modal === "new" || modal === "edit") && (
              <MaterialVirtualForm
                initial={selected}
                onSave={save}
                onCancel={() => setModal(null)}
                bibliograficos={bibliograficos}
              />
            )}

            {modal === "delete" && selected && (
              <>
                <h3>¿Desactivar material?</h3>
                <p>Confirme si desea desactivar: <b>{selected.materialBibliografico?.MatBibTit}</b></p>
                <div className="modal-actions">
                  <button className="btn danger" onClick={async () => {
                    try {
                      const res = await authFetch(`/api/material-virtual/${selected.MatVirId}`, { method: "DELETE" });
                      await handleBackendError(res);
                      setSuccessModal("Material desactivado con éxito");
                      setModal(null); load();
                    } catch (e) {}
                  }}>Desactivar</button>
                  <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
                </div>
              </>
            )}

            {modal === "reactivate" && selected && (
              <>
                <h3>¿Reactivar material?</h3>
                <p>Confirme si desea reactivar: <b>{selected.materialBibliografico?.MatBibTit}</b></p>
                <div className="modal-actions">
                  <button className="btn" onClick={async () => {
                    try {
                      const res = await authFetch(`/api/material-virtual/reactivar/${selected.MatVirId}`, { method: "PATCH" });
                      await handleBackendError(res);
                      setSuccessModal("Material reactivado con éxito");
                      setModal(null); load();
                    } catch (e) {}
                  }}>Reactivar</button>
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

      {errorModal && (
        <div className="modal-backdrop">
          <div className="modal error-modal">
            <h3 className="error-title">❌ Error en la Operación</h3>
            <p>{errorModal}</p>
            <button className="btn" onClick={() => setErrorModal(null)}>Aceptar</button>
          </div>
        </div>
      )}
    </>
  );
}
