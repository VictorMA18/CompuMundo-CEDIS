import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminCrud.css';

/* ================= TIPOS ================= */
type MaterialFisico = {
  MatFisId: number;
  MatBibId: number;
  MatFisCodEje: string;
  MatFisEst: 'disponible' | 'prestado' | 'dañado';
  MatFisUbi: string;
  MatFisAct: boolean;
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
  }, []);
  return { bibliograficos: data, loading };
};

/* ================= COMPONENTE DE FORMULARIO (ESTILO DOCUMENTOS) ================= */
function MaterialFisicoForm({
  initial,
  onSave,
  onCancel,
  bibliograficos,
}: {
  initial: MaterialFisico | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  bibliograficos: MaterialBibRef[];
}) {
  const [form, setForm] = useState({
    MatBibId: 0,
    MatFisCodEje: '',
    MatFisEst: 'disponible' as MaterialFisico['MatFisEst'],
    MatFisUbi: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        MatBibId: initial.MatBibId,
        MatFisCodEje: initial.MatFisCodEje || "",
        MatFisEst: initial.MatFisEst,
        MatFisUbi: initial.MatFisUbi || "",
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
    if (!form.MatFisCodEje.trim()) {
      setValidationError("El código del ejemplar es obligatorio.");
      return false;
    }
    if (!form.MatFisUbi.trim()) {
      setValidationError("La ubicación física es obligatoria.");
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
        MatFisCodEje: form.MatFisCodEje.trim(),
        MatFisUbi: form.MatFisUbi.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <h3>{initial ? "Editar Ejemplar" : "Registrar Ejemplar"}</h3>

      <div className="form-grid">
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

        <input
          placeholder="Código Ejemplar (obligatorio)"
          value={form.MatFisCodEje}
          onChange={(e) => handleInputChange("MatFisCodEje", e.target.value)}
          disabled={isSaving}
        />

        <select
          className="input"
          value={form.MatFisEst}
          onChange={(e) => handleInputChange("MatFisEst", e.target.value)}
          disabled={isSaving}
        >
          <option value="disponible">Disponible</option>
          <option value="prestado">Prestado</option>
          <option value="dañado">Dañado</option>
        </select>

        <input
          placeholder="Ubicación (obligatorio)"
          value={form.MatFisUbi}
          onChange={(e) => handleInputChange("MatFisUbi", e.target.value)}
          disabled={isSaving}
        />
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
export default function MaterialFisico() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  const { bibliograficos, loading: loadingBib } = useBibliograficos(authFetch);

  useEffect(() => { setTitle?.("Material Físico"); }, [setTitle]);

  const [items, setItems] = useState<MaterialFisico[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("activos");
  const [modal, setModal] = useState<ModalState>(null);
  const [selected, setSelected] = useState<MaterialFisico | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<string | null>(null); // Nuevo estado

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
      const url = view === "activos" ? "/api/material-fisico" : "/api/material-fisico/desactivados";
      const res = await authFetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data || []);
    } catch {
      setItems([]);
      setLoadError("No se pudieron cargar los ejemplares.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [view]);

  const filteredItems = useMemo(() => {
    return items.filter(m =>
      m.MatFisCodEje.toLowerCase().includes(search.toLowerCase()) ||
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
    const url = isEdit ? `/api/material-fisico/${selected.MatFisId}` : "/api/material-fisico";
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
        <input className="input" placeholder="Buscar por código o título..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={view} onChange={(e) => setView(e.target.value as View)}>
          <option value="activos">Activos</option>
          <option value="desactivados">Desactivados</option>
        </select>
        <button className="btn-new" onClick={() => { setSelected(null); setModal("new"); }} disabled={loadingBib}>
          ➕ Nuevo
        </button>
      </div>

      <div className="table-card">
        <h3 className="card-title">Listado de Material Físico</h3>
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
                <th>Código</th>
                <th>Documento</th>
                <th>Estado</th>
                <th>Ubicación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((m, index) => (
                <tr key={m.MatFisId}>
                  <td>{(page - 1) * pageSize + index + 1}</td>
                  <td>{m.MatFisCodEje}</td>
                  <td>{m.materialBibliografico?.MatBibTit || m.MatBibId}</td>
                  <td><span className={`status-badge ${m.MatFisEst}`}>{m.MatFisEst}</span></td>
                  <td>{m.MatFisUbi}</td>
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
                <p><b>Código:</b> {selected.MatFisCodEje}</p>
                <p><b>Ubicación:</b> {selected.MatFisUbi}</p>
                <p><b>Estado:</b> {selected.MatFisEst}</p>
                <button className="btn" onClick={() => setModal(null)}>Cerrar</button>
              </>
            )}

            {(modal === "new" || modal === "edit") && (
              <MaterialFisicoForm
                initial={selected}
                onSave={save}
                onCancel={() => setModal(null)}
                bibliograficos={bibliograficos}
              />
            )}

            {modal === "delete" && selected && (
              <>
                <h3>¿Desactivar ejemplar?</h3>
                <p>Confirme si desea desactivar: <b>{selected.materialBibliografico?.MatBibTit}</b> ({selected.MatFisCodEje}) </p>
                <div className="modal-actions">
                  <button className="btn danger" onClick={async () => {
                    try {
                      const res = await authFetch(`/api/material-fisico/${selected.MatFisId}`, { method: "DELETE" });
                      await handleBackendError(res);
                      setSuccessModal("Ejemplar desactivado con éxito");
                      setModal(null); load();
                    } catch (e) {}
                  }}>Desactivar</button>
                  <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
                </div>
              </>
            )}

            {modal === "reactivate" && selected && (
              <>
                <h3>¿Reactivar ejemplar?</h3>
                <p>Confirme si desea reactivar: <b>{selected.materialBibliografico?.MatBibTit}</b> ({selected.MatFisCodEje})</p>
                <div className="modal-actions">
                  <button className="btn" onClick={async () => {
                    try {
                      const res = await authFetch(`/api/material-fisico/reactivar/${selected.MatFisId}`, { method: "PATCH" });
                      await handleBackendError(res);
                      setSuccessModal("Ejemplar reactivado con éxito");
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

      {/* MODAL ÉXITO (Simétrico al de Error) */}
      {successModal && (
        <div className="modal-backdrop">
          <div className="modal success-modal">
            <h3 className="success-title">✅ Operación Exitosa</h3>
            <p>{successModal}</p>
            <button className="btn" onClick={() => setSuccessModal(null)}>Aceptar</button>
          </div>
        </div>
      )}

      {/* MODAL ERROR BACKEND */}
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
