import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Lector, LectorForm, LectorTipo, LectorView } from '../../types/lector';
import './AdminCrud.css';

type ApiError = { message?: string | string[] };

function errorMessage(data: unknown, fallback: string) {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(', ');
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

const lectorTipos: LectorTipo[] = ['estudiante', 'docente', 'administrativo'];

export default function Lectores() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  const [view, setView] = useState<LectorView>('activos');
  const [items, setItems] = useState<Lector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Lector | null>(null);
  const [form, setForm] = useState<LectorForm>({
    LecDni: '',
    LecNom: '',
    LecApe: '',
    LecTip: 'estudiante',
    LecEma: '',
  });

  useEffect(() => {
    setTitle?.('Lectores');
  }, [setTitle]);

  useEffect(() => {
    if (!editing) {
      setForm({ LecDni: '', LecNom: '', LecApe: '', LecTip: 'estudiante', LecEma: '' });
      return;
    }
    setForm({
      LecDni: editing.LecDni,
      LecNom: editing.LecNom,
      LecApe: editing.LecApe,
      LecTip: editing.LecTip,
      LecEma: editing.LecEma ?? '',
    });
  }, [editing]);

  const endpoints = useMemo(
    () => [
      { method: 'GET', path: '/api/lectores', note: 'Listar activos' },
      { method: 'GET', path: '/api/lectores/desactivados', note: 'Listar desactivados' },
      { method: 'GET', path: '/api/lectores/:id', note: 'Detalle' },
      { method: 'POST', path: '/api/lectores', note: 'Crear' },
      { method: 'PATCH', path: '/api/lectores/:id', note: 'Editar' },
      { method: 'PATCH', path: '/api/lectores/reactivar/:id', note: 'Reactivar' },
      { method: 'DELETE', path: '/api/lectores/:id', note: 'Desactivar' },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);
    setError(null);

    const listUrl = view === 'activos' ? '/api/lectores' : '/api/lectores/desactivados';
    const res = await authFetch(listUrl);
    const data: unknown = await res.json().catch(() => ([] as unknown));

    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo cargar lectores'));
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(Array.isArray(data) ? (data as Lector[]) : []);
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
      LecDni: form.LecDni.trim(),
      LecNom: form.LecNom.trim(),
      LecApe: form.LecApe.trim(),
      LecTip: form.LecTip,
      LecEma: form.LecEma.trim() ? form.LecEma.trim() : undefined,
    };

    const url = editing ? `/api/lectores/${editing.LecId}` : '/api/lectores';
    const method = editing ? 'PATCH' : 'POST';

    const res = await authFetch(url, { method, body: JSON.stringify(payload) });
    const data: unknown = await res.json().catch(() => ({} as unknown));
    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo guardar el lector'));
      setLoading(false);
      return;
    }

    setEditing(null);
    await load();
  };

  const deactivate = async (id: number) => {
    setLoading(true);
    setError(null);
    const res = await authFetch(`/api/lectores/${id}`, { method: 'DELETE' });
    const data: unknown = await res.json().catch(() => ({} as unknown));
    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo desactivar el lector'));
      setLoading(false);
      return;
    }
    await load();
  };

  const reactivate = async (id: number) => {
    setLoading(true);
    setError(null);
    const res = await authFetch(`/api/lectores/reactivar/${id}`, { method: 'PATCH' });
    const data: unknown = await res.json().catch(() => ({} as unknown));
    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo reactivar el lector'));
      setLoading(false);
      return;
    }
    await load();
  };

  return (
    <>
      {error && <div className="error">{error}</div>}

      <div className="filters-card">
        <select className="input" value={view} onChange={(e) => setView(e.target.value as LectorView)} disabled={loading}>
          <option value="activos">Activos</option>
          <option value="desactivados">Desactivados</option>
        </select>

        <input
          className="input"
          placeholder="DNI (LecDni)"
          value={form.LecDni}
          onChange={(e) => setForm((f) => ({ ...f, LecDni: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />

        <select
          className="input"
          value={form.LecTip}
          onChange={(e) => setForm((f) => ({ ...f, LecTip: e.target.value as LectorTipo }))}
          disabled={loading || view === 'desactivados'}
        >
          {lectorTipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          className="input"
          placeholder="Nombres (LecNom)"
          value={form.LecNom}
          onChange={(e) => setForm((f) => ({ ...f, LecNom: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />
        <input
          className="input"
          placeholder="Apellidos (LecApe)"
          value={form.LecApe}
          onChange={(e) => setForm((f) => ({ ...f, LecApe: e.target.value }))}
          disabled={loading || view === 'desactivados'}
        />
        <input
          className="input"
          placeholder="Correo (opcional)"
          value={form.LecEma}
          onChange={(e) => setForm((f) => ({ ...f, LecEma: e.target.value }))}
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
              <th>DNI</th>
              <th>Tipo</th>
              <th>Correo</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.LecId}>
                <td>{l.LecId}</td>
                <td>{`${l.LecNom} ${l.LecApe}`}</td>
                <td>{l.LecDni}</td>
                <td>{l.LecTip}</td>
                <td>{l.LecEma || '—'}</td>
                <td>{l.LecAct ? 'Sí' : 'No'}</td>
                <td className="actions">
                  <button
                    title="Editar"
                    onClick={() => setEditing(l)}
                    disabled={loading || view === 'desactivados'}
                  >
                    ✏️
                  </button>
                  {view === 'activos' ? (
                    <button title="Desactivar" onClick={() => void deactivate(l.LecId)} disabled={loading}>
                      🗑️
                    </button>
                  ) : (
                    <button title="Reactivar" onClick={() => void reactivate(l.LecId)} disabled={loading}>
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
