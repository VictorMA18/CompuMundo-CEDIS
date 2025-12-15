import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminCrud.css';

type ApiError = { message?: string | string[] };

type MaterialFisico = {
  MatFisId: number;
  MatBibId: number;
  MatFisCodEje: string;
  MatFisEst: 'disponible' | 'prestado' | 'dañado' | string;
  MatFisUbi: string;
  MatFisAct: boolean;
  MatFisFecCre?: string;
  MatFisFecAct?: string;
};

type FormState = {
  MatBibId: string;
  MatFisCodEje: string;
  MatFisEst: 'disponible' | 'prestado' | 'dañado';
  MatFisUbi: string;
};

function errorMessage(data: unknown, fallback: string) {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(', ');
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

const estados: Array<FormState['MatFisEst']> = ['disponible', 'prestado', 'dañado'];

function isEstado(value: string): value is FormState['MatFisEst'] {
  return estados.includes(value as FormState['MatFisEst']);
}

type View = 'activos' | 'desactivados';

export default function MaterialFisicoPage() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  const [view, setView] = useState<View>('activos');
  const [items, setItems] = useState<MaterialFisico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterMatBibId, setFilterMatBibId] = useState('');

  const [editing, setEditing] = useState<MaterialFisico | null>(null);
  const [form, setForm] = useState<FormState>({
    MatBibId: '',
    MatFisCodEje: '',
    MatFisEst: 'disponible',
    MatFisUbi: '',
  });

  useEffect(() => {
    setTitle?.('Material Físico');
  }, [setTitle]);

  useEffect(() => {
    if (!editing) {
      setForm({ MatBibId: '', MatFisCodEje: '', MatFisEst: 'disponible', MatFisUbi: '' });
      return;
    }
    setForm({
      MatBibId: String(editing.MatBibId),
      MatFisCodEje: editing.MatFisCodEje,
      MatFisEst: isEstado(editing.MatFisEst) ? editing.MatFisEst : 'disponible',
      MatFisUbi: editing.MatFisUbi,
    });
  }, [editing]);

  const endpoints = useMemo(
    () => [
      { method: 'GET', path: '/api/material-fisico', note: 'Listar activos' },
      { method: 'GET', path: '/api/material-fisico/desactivados', note: 'Listar desactivados' },
      { method: 'GET', path: '/api/material-fisico/:id', note: 'Detalle' },
      { method: 'GET', path: '/api/material-fisico/material/:matBibId', note: 'Listar por MatBibId' },
      { method: 'POST', path: '/api/material-fisico', note: 'Crear' },
      { method: 'PATCH', path: '/api/material-fisico/:id', note: 'Actualizar' },
      { method: 'PATCH', path: '/api/material-fisico/reactivar/:id', note: 'Reactivar' },
      { method: 'DELETE', path: '/api/material-fisico/:id', note: 'Desactivar (soft delete)' },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);
    setError(null);

    let url: string;
    if (filterMatBibId.trim()) {
      url = `/api/material-fisico/material/${encodeURIComponent(filterMatBibId.trim())}`;
    } else {
      url = view === 'activos' ? '/api/material-fisico' : '/api/material-fisico/desactivados';
    }

    const res = await authFetch(url);
    const data = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo cargar material físico'));
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data as MaterialFisico[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const submit = async () => {
    setLoading(true);
    setError(null);

    const matBibId = Number(form.MatBibId);
    const payload = {
      MatBibId: matBibId,
      MatFisCodEje: form.MatFisCodEje,
      MatFisEst: form.MatFisEst,
      MatFisUbi: form.MatFisUbi,
    };

    const url = editing ? `/api/material-fisico/${editing.MatFisId}` : '/api/material-fisico';
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

    const res = await authFetch(`/api/material-fisico/${id}`, { method: 'DELETE' });
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

    const res = await authFetch(`/api/material-fisico/reactivar/${id}`, { method: 'PATCH' });
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
          placeholder="Código ejemplar (MatFisCodEje)"
          value={form.MatFisCodEje}
          onChange={(e) => setForm((s) => ({ ...s, MatFisCodEje: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />
        <select
          className="input"
          value={form.MatFisEst}
          onChange={(e) => setForm((s) => ({ ...s, MatFisEst: e.target.value as FormState['MatFisEst'] }))}
          disabled={loading || view === 'desactivados'}
        >
          {estados.map((est) => (
            <option key={est} value={est}>
              {est}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Ubicación (MatFisUbi)"
          value={form.MatFisUbi}
          onChange={(e) => setForm((s) => ({ ...s, MatFisUbi: e.target.value }))}
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

      <div className="table-card">
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
            {items.map((m) => (
              <tr key={m.MatFisId}>
                <td>{m.MatFisId}</td>
                <td>{m.MatBibId}</td>
                <td>{m.MatFisCodEje}</td>
                <td>{m.MatFisEst}</td>
                <td>{m.MatFisUbi}</td>
                <td>{m.MatFisAct ? 'Sí' : 'No'}</td>
                <td className="actions">
                  <button title="Editar" onClick={() => setEditing(m)} disabled={loading || view === 'desactivados'}>
                    ✏️
                  </button>
                  {view === 'activos' ? (
                    <button title="Desactivar" onClick={() => void deactivate(m.MatFisId)} disabled={loading}>
                      🗑️
                    </button>
                  ) : (
                    <button title="Reactivar" onClick={() => void reactivate(m.MatFisId)} disabled={loading}>
                      ♻️
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7}>Sin registros</td>
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
