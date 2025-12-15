import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UsuTip } from '../../types/auth';
import type { Usuario, UsuarioForm, UsuarioView } from '../../types/usuario';
import './AdminCrud.css';

type ApiError = { message?: string | string[] };

function errorMessage(data: unknown, fallback: string) {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(', ');
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

const roles: UsuTip[] = ['administrador', 'bibliotecario', 'consultor'];

export default function Usuarios() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  const [view, setView] = useState<UsuarioView>('activos');
  const [items, setItems] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<UsuarioForm>({ UsuNom: '', UsuEma: '', UsuTip: 'consultor', UsuCon: '' });

  useEffect(() => {
    setTitle?.('Usuarios');
  }, [setTitle]);

  useEffect(() => {
    if (!editing) {
      setForm({ UsuNom: '', UsuEma: '', UsuTip: 'consultor', UsuCon: '' });
      return;
    }
    setForm({ UsuNom: editing.UsuNom, UsuEma: editing.UsuEma, UsuTip: editing.UsuTip, UsuCon: '' });
  }, [editing]);

  const endpoints = useMemo(
    () => [
      { method: 'GET', path: '/api/usuarios', note: 'Listar activos' },
      { method: 'GET', path: '/api/usuarios/desactivados', note: 'Listar desactivados (solo admin)' },
      { method: 'GET', path: '/api/usuarios/:id', note: 'Detalle' },
      { method: 'POST', path: '/api/usuarios', note: 'Crear (solo admin)' },
      { method: 'PATCH', path: '/api/usuarios/:id', note: 'Editar (solo admin)' },
      { method: 'PATCH', path: '/api/usuarios/reactivar/:id', note: 'Reactivar (solo admin)' },
      { method: 'DELETE', path: '/api/usuarios/:id', note: 'Desactivar (solo admin)' },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);
    setError(null);

    const listUrl = view === 'activos' ? '/api/usuarios' : '/api/usuarios/desactivados';
    const res = await authFetch(listUrl);
    const data: unknown = await res.json().catch(() => ([] as unknown));

    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo cargar usuarios'));
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(Array.isArray(data) ? (data as Usuario[]) : []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const submit = async () => {
    setLoading(true);
    setError(null);

    const basePayload: Record<string, unknown> = {
      UsuNom: form.UsuNom.trim(),
      UsuEma: form.UsuEma.trim(),
      UsuTip: form.UsuTip,
    };

    if (!editing) {
      basePayload.UsuCon = form.UsuCon;
    } else if (form.UsuCon.trim()) {
      basePayload.UsuCon = form.UsuCon;
    }

    const url = editing ? `/api/usuarios/${editing.UsuId}` : '/api/usuarios';
    const method = editing ? 'PATCH' : 'POST';

    const res = await authFetch(url, { method, body: JSON.stringify(basePayload) });
    const data: unknown = await res.json().catch(() => ({} as unknown));
    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo guardar el usuario'));
      setLoading(false);
      return;
    }

    setEditing(null);
    setForm({ UsuNom: '', UsuEma: '', UsuTip: 'consultor', UsuCon: '' });
    await load();
  };

  const deactivate = async (id: number) => {
    setLoading(true);
    setError(null);
    const res = await authFetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    const data: unknown = await res.json().catch(() => ({} as unknown));
    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo desactivar el usuario'));
      setLoading(false);
      return;
    }
    await load();
  };

  const reactivate = async (id: number) => {
    setLoading(true);
    setError(null);
    const res = await authFetch(`/api/usuarios/reactivar/${id}`, { method: 'PATCH' });
    const data: unknown = await res.json().catch(() => ({} as unknown));
    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo reactivar el usuario'));
      setLoading(false);
      return;
    }
    await load();
  };

  return (
    <>
      {error && <div className="error">{error}</div>}

      <div className="filters-card">
        <select className="input" value={view} onChange={(e) => setView(e.target.value as UsuarioView)} disabled={loading}>
          <option value="activos">Activos</option>
          <option value="desactivados">Desactivados</option>
        </select>

        <input
          className="input"
          placeholder="Nombre (UsuNom)"
          value={form.UsuNom}
          onChange={(e) => setForm((f) => ({ ...f, UsuNom: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />
        <input
          className="input"
          placeholder="Correo (UsuEma)"
          value={form.UsuEma}
          onChange={(e) => setForm((f) => ({ ...f, UsuEma: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />
        <select
          className="input"
          value={form.UsuTip}
          onChange={(e) => setForm((f) => ({ ...f, UsuTip: e.target.value as UsuTip }))}
          disabled={loading || view === 'desactivados'}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="password"
          placeholder={editing ? 'Nueva contraseña (opcional)' : 'Contraseña (UsuCon)'}
          value={form.UsuCon}
          onChange={(e) => setForm((f) => ({ ...f, UsuCon: e.target.value }))}
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
        Algunas rutas son solo admin (por ejemplo: desactivados/crear/editar/reactivar/desactivar).
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.UsuId}>
                <td>{u.UsuId}</td>
                <td>{u.UsuNom}</td>
                <td>{u.UsuEma}</td>
                <td>{u.UsuTip}</td>
                <td>{u.UsuAct ? 'Sí' : 'No'}</td>
                <td className="actions">
                  <button
                    title="Editar"
                    onClick={() => setEditing(u)}
                    disabled={loading || view === 'desactivados'}
                  >
                    ✏️
                  </button>
                  {view === 'activos' ? (
                    <button title="Desactivar" onClick={() => void deactivate(u.UsuId)} disabled={loading}>
                      🗑️
                    </button>
                  ) : (
                    <button title="Reactivar" onClick={() => void reactivate(u.UsuId)} disabled={loading}>
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
