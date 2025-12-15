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
  MatFisFecCre?: string;
  MatFisFecAct?: string;
};

type MaterialFisicoFormState = {
  MatBibId: string;
  MatFisCodEje: string;
  MatFisEst: MaterialFisico['MatFisEst'];
  MatFisUbi: string;
};

type View = 'activos' | 'desactivados';

type ApiError = { message?: string | string[] };

function errorMessage(data: unknown, fallback: string) {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(', ');
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

const estados: Array<MaterialFisico['MatFisEst']> = ['disponible', 'prestado', 'dañado'];

function isEstado(value: string): value is MaterialFisico['MatFisEst'] {
  return estados.includes(value as MaterialFisico['MatFisEst']);
}

/* ================= FORMULARIO ================= */
function MaterialFisicoForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: MaterialFisico | null;
  onSave: (data: MaterialFisicoFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<MaterialFisicoFormState>({
    MatBibId: '',
    MatFisCodEje: '',
    MatFisEst: 'disponible',
    MatFisUbi: '',
  });

  useEffect(() => {
    if (!initial) return;
    setForm({
      MatBibId: String(initial.MatBibId),
      MatFisCodEje: initial.MatFisCodEje,
      MatFisEst: isEstado(initial.MatFisEst) ? initial.MatFisEst : 'disponible',
      MatFisUbi: initial.MatFisUbi,
    });
  }, [initial]);

  const submit = () => {
    if (!form.MatBibId || !form.MatFisCodEje || !form.MatFisUbi) return;
    onSave({
      ...form,
      MatBibId: form.MatBibId.trim(),
      MatFisCodEje: form.MatFisCodEje.trim(),
      MatFisUbi: form.MatFisUbi.trim(),
    });
  };

  return (
    <>
      <h3>{initial ? 'Editar material físico' : 'Registrar material físico'}</h3>

      <div className="form-grid">
        <input
          placeholder="ID Material Bibliográfico *"
          value={form.MatBibId}
          onChange={(e) => setForm({ ...form, MatBibId: e.target.value })}
        />
        <input
          placeholder="Código ejemplar *"
          value={form.MatFisCodEje}
          onChange={(e) => setForm({ ...form, MatFisCodEje: e.target.value })}
        />
        <select
          value={form.MatFisEst}
          onChange={(e) =>
            setForm({ ...form, MatFisEst: e.target.value as MaterialFisico['MatFisEst'] })
          }
        >
          {estados.map((est) => (
            <option key={est} value={est}>
              {est.charAt(0).toUpperCase() + est.slice(1)}
            </option>
          ))}
        </select>
        <input
          placeholder="Ubicación *"
          value={form.MatFisUbi}
          onChange={(e) => setForm({ ...form, MatFisUbi: e.target.value })}
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
export default function MaterialFisicoPage() {
  const setTitle = useOutletContext<(title: string) => void>();
  const { authFetch } = useAuth();

  const [items, setItems] = useState<MaterialFisico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('activos');

  // modal y selección
  const [modal, setModal] = useState<null | 'view' | 'new' | 'edit' | 'delete' | 'reactivate'>(null);
  const [selected, setSelected] = useState<MaterialFisico | null>(null);

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== LOAD ===== */
  const load = async () => {
    setLoading(true);
    setError(null);

    let url = view === 'activos' ? '/api/material-fisico' : '/api/material-fisico/desactivados';

    if (search.trim()) {
      url += `?search=${encodeURIComponent(search.trim())}`;
    }

    try {
      const res = await authFetch(url);
      const data = await res.json();
      if (!res.ok) throw data;
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo cargar material físico'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTitle?.('Material Físico');
  }, [setTitle]);

  useEffect(() => {
    void load();
  }, [view]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  /* ===== FILTROS ===== */
  const filteredItems = useMemo(() => {
    return items.filter(
      (m) =>
        m.MatFisCodEje.toLowerCase().includes(search.toLowerCase()) ||
        String(m.MatBibId).includes(search)
    );
  }, [items, search]);

  /* ===== PAGINACIÓN ===== */
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  /* ===== CRUD ===== */
  const save = async (formData: MaterialFisicoFormState) => {
    if (!formData.MatBibId || !formData.MatFisCodEje || !formData.MatFisUbi) return;

    const payload = {
      MatBibId: Number(formData.MatBibId),
      MatFisCodEje: formData.MatFisCodEje,
      MatFisEst: formData.MatFisEst,
      MatFisUbi: formData.MatFisUbi,
    };

    const url = modal === 'edit' && selected ? `/api/material-fisico/${selected.MatFisId}` : '/api/material-fisico';
    const method = modal === 'edit' && selected ? 'PATCH' : 'POST';

    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setModal(null);
      setSelected(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, modal === 'edit' ? 'No se pudo actualizar' : 'No se pudo crear'));
    }
  };

  const deactivate = async () => {
    if (!selected) return;
    try {
      const res = await authFetch(`/api/material-fisico/${selected.MatFisId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw data;
      setModal(null);
      setSelected(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo desactivar'));
    }
  };

  const reactivate = async () => {
    if (!selected) return;
    try {
      const res = await authFetch(`/api/material-fisico/reactivar/${selected.MatFisId}`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw data;
      setModal(null);
      setSelected(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo reactivar'));
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
          placeholder="Buscar por código de ejemplar o MatBibId"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
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
          onClick={() => { setSelected(null); setModal('new'); }}
          disabled={loading || view === 'desactivados'}
        >
          ➕ Nuevo
        </button>
      </div>

      {/* ===== TABLA ===== */}
      <div className="table-card">
        <h3 className="card-title">Listado de Material Físico</h3>

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
                <th>Código</th>
                <th>Estado</th>
                <th>Ubicación</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((m, i) => (
                <tr key={m.MatFisId}>
                  <td>{(page - 1) * pageSize + i + 1}</td>
                  <td>{m.MatBibId}</td>
                  <td>{m.MatFisCodEje}</td>
                  <td>{m.MatFisEst}</td>
                  <td>{m.MatFisUbi}</td>
                  <td>{m.MatFisAct ? 'Sí' : 'No'}</td>
                  <td className="actions">
                    <button
                      title="Editar"
                      onClick={() => { setSelected(m); setModal('edit'); }}
                      disabled={loading || view === 'desactivados'}
                    >
                      ✏️
                    </button>
                    {view === 'activos' ? (
                      <button
                        title="Desactivar"
                        onClick={() => { setSelected(m); setModal('delete'); }}
                        disabled={loading}
                      >
                        🗑️
                      </button>
                    ) : (
                      <button
                        title="Reactivar"
                        onClick={() => { setSelected(m); setModal('reactivate'); }}
                        disabled={loading}
                      >
                        ♻️
                      </button>
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

      {/* ===== MODALES ===== */}
      {modal && selected && modal === 'view' && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Detalle Material Físico</h3>
            <p><b>MatBibId:</b> {selected.MatBibId}</p>
            <p><b>Código:</b> {selected.MatFisCodEje}</p>
            <p><b>Estado:</b> {selected.MatFisEst}</p>
            <p><b>Ubicación:</b> {selected.MatFisUbi}</p>
            <p><b>Activo:</b> {selected.MatFisAct ? 'Sí' : 'No'}</p>
            <button className="btn" onClick={() => setModal(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {(modal === 'new' || modal === 'edit') && (
        <div className="modal-backdrop">
          <div className="modal">
            <MaterialFisicoForm
              initial={modal === 'edit' ? selected : null}
              onSave={save}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}

      {modal === 'delete' && selected && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>¿Desactivar material físico?</h3>
            <button className="btn danger" onClick={() => void deactivate()}>Desactivar</button>
            <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {modal === 'reactivate' && selected && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>¿Reactivar material físico?</h3>
            <button className="btn" onClick={() => void reactivate()}>Reactivar</button>
            <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </>
  );
}

