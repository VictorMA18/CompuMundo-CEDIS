import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminCrud.css';

type ApiError = { message?: string | string[] };

type MaterialVirtual = {
  MatVirId: number;
  MatBibId: number;
  MatVirUrlAcc: string;
  MatVirForArc: string;
  MatVirAct: boolean;
  MatVirFecCre?: string;
  MatVirFecAct?: string;
};

type FormState = {
  MatBibId: string;
  MatVirUrlAcc: string;
  MatVirForArc: string;
};

function errorMessage(data: unknown, fallback: string) {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(', ');
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

type View = 'activos' | 'desactivados';

export default function MaterialVirtualPage() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  const [view, setView] = useState<View>('activos');
  const [items, setItems] = useState<MaterialVirtual[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterMatBibId, setFilterMatBibId] = useState('');

  const [editing, setEditing] = useState<MaterialVirtual | null>(null);
  const [form, setForm] = useState<FormState>({ MatBibId: '', MatVirUrlAcc: '', MatVirForArc: '' });

  useEffect(() => {
    setTitle?.('Material Virtual');
  }, [setTitle]);

  useEffect(() => {
    if (!editing) {
      setForm({ MatBibId: '', MatVirUrlAcc: '', MatVirForArc: '' });
      return;
    }
    setForm({
      MatBibId: String(editing.MatBibId),
      MatVirUrlAcc: editing.MatVirUrlAcc,
      MatVirForArc: editing.MatVirForArc,
    });
  }, [editing]);

  const endpoints = useMemo(
    () => [
      { method: 'GET', path: '/api/material-virtual', note: 'Listar activos' },
      { method: 'GET', path: '/api/material-virtual/desactivados', note: 'Listar desactivados' },
      { method: 'GET', path: '/api/material-virtual/:id', note: 'Detalle' },
      { method: 'GET', path: '/api/material-virtual/material/:matBibId', note: 'Listar por MatBibId' },
      { method: 'POST', path: '/api/material-virtual', note: 'Crear' },
      { method: 'PATCH', path: '/api/material-virtual/:id', note: 'Actualizar' },
      { method: 'PATCH', path: '/api/material-virtual/reactivar/:id', note: 'Reactivar' },
      { method: 'DELETE', path: '/api/material-virtual/:id', note: 'Desactivar (soft delete)' },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);
    setError(null);

    let url: string;
    if (filterMatBibId.trim()) {
      url = `/api/material-virtual/material/${encodeURIComponent(filterMatBibId.trim())}`;
    } else {
      url = view === 'activos' ? '/api/material-virtual' : '/api/material-virtual/desactivados';
    }

    const res = await authFetch(url);
    const data = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo cargar material virtual'));
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data as MaterialVirtual[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const submit = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      MatBibId: Number(form.MatBibId),
      MatVirUrlAcc: form.MatVirUrlAcc,
      MatVirForArc: form.MatVirForArc,
    };

    const url = editing ? `/api/material-virtual/${editing.MatVirId}` : '/api/material-virtual';
    const res = await authFetch(url, {
      method: editing ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      setError(errorMessage(data, editing ? 'No se pudo actualizar' : 'No se pudo crear'));
      setLoading(false);
      return;
    }

    setEditing(null);
    setFilterMatBibId('');
    await load();
  };

  const deactivate = async (id: number) => {
    setLoading(true);
    setError(null);

    const res = await authFetch(`/api/material-virtual/${id}`, { method: 'DELETE' });
    const data = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo desactivar'));
      setLoading(false);
      return;
    }

    await load();
  };

  const reactivate = async (id: number) => {
    setLoading(true);
    setError(null);

    const res = await authFetch(`/api/material-virtual/reactivar/${id}`, { method: 'PATCH' });
    const data = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo reactivar'));
      setLoading(false);
      return;
    }

    await load();
  };

  return (
    <>
      {error && <div className="error">{error}</div>}

      <div className="filters-card">
        <select className="input" value={view} onChange={(e) => setView(e.target.value as View)} disabled={loading}>
          <option value="activos">Activos</option>
          <option value="desactivados">Desactivados</option>
        </select>

        <input
          className="input"
          placeholder="Filtrar por MatBibId (opcional)"
          value={filterMatBibId}
          onChange={(e) => setFilterMatBibId(e.target.value)}
          disabled={loading}
        />

        <button className="btn secondary" onClick={() => void load()} disabled={loading}>
          Buscar
        </button>

        <input
          className="input"
          placeholder="MatBibId"
          value={form.MatBibId}
          onChange={(e) => setForm((s) => ({ ...s, MatBibId: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />
        <input
          className="input"
          placeholder="URL acceso (MatVirUrlAcc)"
          value={form.MatVirUrlAcc}
          onChange={(e) => setForm((s) => ({ ...s, MatVirUrlAcc: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />
        <input
          className="input"
          placeholder="Formato archivo (MatVirForArc)"
          value={form.MatVirForArc}
          onChange={(e) => setForm((s) => ({ ...s, MatVirForArc: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />

        <button className="btn" onClick={() => void submit()} disabled={loading || view === 'desactivados'}>
          {editing ? 'Guardar' : 'Crear'}
        </button>

        {editing && (
          <button className="btn secondary" onClick={() => setEditing(null)} disabled={loading}>
            Cancelar
          </button>
        )}
      </div>

      <div className="notice">
        El backend define MatVirId y MatBibId como 1:1 (MatBibId es único). Si ya existe un virtual para ese MatBibId, el POST fallará.
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>MatBibId</th>
              <th>URL</th>
              <th>Formato</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.MatVirId}>
                <td>{m.MatVirId}</td>
                <td>{m.MatBibId}</td>
                <td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.MatVirUrlAcc}
                </td>
                <td>{m.MatVirForArc}</td>
                <td>{m.MatVirAct ? 'Sí' : 'No'}</td>
                <td className="actions">
                  <button title="Editar" onClick={() => setEditing(m)} disabled={loading || view === 'desactivados'}>
                    ✏️
                  </button>
                  {view === 'activos' ? (
                    <button title="Desactivar" onClick={() => void deactivate(m.MatVirId)} disabled={loading}>
                      🗑️
                    </button>
                  ) : (
                    <button title="Reactivar" onClick={() => void reactivate(m.MatVirId)} disabled={loading}>
                      ♻️
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6}>Sin registros</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="endpoints">
        <h3>Endpoints</h3>
        {endpoints.map((e) => (
          <div className="endpoint-row" key={`${e.method}-${e.path}`}>
            <span className={`badge ${e.method.toLowerCase()}`}>{e.method}</span>
            <span className="code">{e.path}</span>
            <span style={{ marginLeft: 'auto', color: '#555' }}>{e.note}</span>
          </div>
        ))}
      </div>
    </>
  );
}
