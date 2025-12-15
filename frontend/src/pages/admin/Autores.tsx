import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminCrud.css';

type ApiError = { message?: string | string[] };

type Autor = {
  AutId: number;
  AutNom: string;
  AutApe: string;
  AutDoc: string;
  AutEma: string | null;
  AutAct: boolean;
  AutFecCre?: string;
  AutFecAct?: string;
};

type AutorForm = {
  AutNom: string;
  AutApe: string;
  AutDoc: string;
  AutEma: string;
};

type View = 'activos' | 'desactivados';

function errorMessage(data: unknown, fallback: string) {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(', ');
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

export default function Autores() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  const [view, setView] = useState<View>('activos');
  const [items, setItems] = useState<Autor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Autor | null>(null);
  const [form, setForm] = useState<AutorForm>({ AutNom: '', AutApe: '', AutDoc: '', AutEma: '' });

  useEffect(() => {
    setTitle?.('Autores');
  }, [setTitle]);

  useEffect(() => {
    if (!editing) {
      setForm({ AutNom: '', AutApe: '', AutDoc: '', AutEma: '' });
      return;
    }
    setForm({
      AutNom: editing.AutNom,
      AutApe: editing.AutApe,
      AutDoc: editing.AutDoc,
      AutEma: editing.AutEma ?? '',
    });
  }, [editing]);

  const endpoints = useMemo(
    () => [
      { method: 'GET', path: '/api/autores', note: 'Listar activos' },
      { method: 'GET', path: '/api/autores/desactivados', note: 'Listar desactivados' },
      { method: 'GET', path: '/api/autores/:id', note: 'Detalle' },
      { method: 'POST', path: '/api/autores', note: 'Crear' },
      { method: 'PATCH', path: '/api/autores/:id', note: 'Actualizar' },
      { method: 'PATCH', path: '/api/autores/reactivar/:id', note: 'Reactivar' },
      { method: 'DELETE', path: '/api/autores/:id', note: 'Desactivar (soft delete)' },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);
    setError(null);

    const url = view === 'activos' ? '/api/autores' : '/api/autores/desactivados';
    const res = await authFetch(url);
    const data = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo cargar autores'));
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data as Autor[]) || []);
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
      AutNom: form.AutNom,
      AutApe: form.AutApe,
      AutDoc: form.AutDoc,
      AutEma: form.AutEma ? form.AutEma : undefined,
    };

    const res = await authFetch(editing ? `/api/autores/${editing.AutId}` : '/api/autores', {
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
    await load();
  };

  const deactivate = async (id: number) => {
    setLoading(true);
    setError(null);

    const res = await authFetch(`/api/autores/${id}`, { method: 'DELETE' });
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

    const res = await authFetch(`/api/autores/reactivar/${id}`, { method: 'PATCH' });
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
          placeholder="Nombre"
          value={form.AutNom}
          onChange={(e) => setForm((s) => ({ ...s, AutNom: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />
        <input
          className="input"
          placeholder="Apellido"
          value={form.AutApe}
          onChange={(e) => setForm((s) => ({ ...s, AutApe: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />
        <input
          className="input"
          placeholder="Documento (AutDoc)"
          value={form.AutDoc}
          onChange={(e) => setForm((s) => ({ ...s, AutDoc: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />
        <input
          className="input"
          placeholder="Email (opcional)"
          value={form.AutEma}
          onChange={(e) => setForm((s) => ({ ...s, AutEma: e.target.value }))}
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
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Documento</th>
              <th>Email</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.AutId}>
                <td>{a.AutId}</td>
                <td>{a.AutNom}</td>
                <td>{a.AutApe}</td>
                <td>{a.AutDoc}</td>
                <td>{a.AutEma ?? ''}</td>
                <td>{a.AutAct ? 'Sí' : 'No'}</td>
                <td className="actions">
                  <button title="Editar" onClick={() => setEditing(a)} disabled={loading || view === 'desactivados'}>
                    ✏️
                  </button>
                  {view === 'activos' ? (
                    <button title="Desactivar" onClick={() => void deactivate(a.AutId)} disabled={loading}>
                      🗑️
                    </button>
                  ) : (
                    <button title="Reactivar" onClick={() => void reactivate(a.AutId)} disabled={loading}>
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
