import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Categoria, CategoriaForm, CategoriaView } from '../../types/categoria';
import './AdminCrud.css';

type ApiError = { message?: string | string[] };

function errorMessage(data: unknown, fallback: string) {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(', ');
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

export default function Categorias() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  const [view, setView] = useState<CategoriaView>('activos');
  const [items, setItems] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Categoria | null>(null);
  const [form, setForm] = useState<CategoriaForm>({ CatNom: '', CatDes: '' });

  useEffect(() => {
    setTitle?.('Categorías');
  }, [setTitle]);

  useEffect(() => {
    if (!editing) {
      setForm({ CatNom: '', CatDes: '' });
      return;
    }
    setForm({ CatNom: editing.CatNom, CatDes: editing.CatDes ?? '' });
  }, [editing]);

  const endpoints = useMemo(
    () => [
      { method: 'GET', path: '/api/categorias', note: 'Listar activas' },
      { method: 'GET', path: '/api/categorias/desactivadas', note: 'Listar desactivadas' },
      { method: 'GET', path: '/api/categorias/:id', note: 'Detalle' },
      { method: 'POST', path: '/api/categorias', note: 'Crear' },
      { method: 'PATCH', path: '/api/categorias/:id', note: 'Editar' },
      { method: 'PATCH', path: '/api/categorias/reactivar/:id', note: 'Reactivar' },
      { method: 'DELETE', path: '/api/categorias/:id', note: 'Desactivar' },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);
    setError(null);

    const listUrl = view === 'activos' ? '/api/categorias' : '/api/categorias/desactivadas';
    const res = await authFetch(listUrl);
    const data: unknown = await res.json().catch(() => ([] as unknown));

    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo cargar categorías'));
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(Array.isArray(data) ? (data as Categoria[]) : []);
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
      CatNom: form.CatNom.trim(),
      CatDes: form.CatDes.trim() ? form.CatDes.trim() : undefined,
    };

    const url = editing ? `/api/categorias/${editing.CatId}` : '/api/categorias';
    const method = editing ? 'PATCH' : 'POST';

    const res = await authFetch(url, { method, body: JSON.stringify(payload) });
    const data: unknown = await res.json().catch(() => ({} as unknown));
    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo guardar la categoría'));
      setLoading(false);
      return;
    }

    setEditing(null);
    await load();
  };

  const deactivate = async (id: number) => {
    setLoading(true);
    setError(null);
    const res = await authFetch(`/api/categorias/${id}`, { method: 'DELETE' });
    const data: unknown = await res.json().catch(() => ({} as unknown));
    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo desactivar la categoría'));
      setLoading(false);
      return;
    }
    await load();
  };

  const reactivate = async (id: number) => {
    setLoading(true);
    setError(null);
    const res = await authFetch(`/api/categorias/reactivar/${id}`, { method: 'PATCH' });
    const data: unknown = await res.json().catch(() => ({} as unknown));
    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo reactivar la categoría'));
      setLoading(false);
      return;
    }
    await load();
  };

  return (
    <>
      {error && <div className="error">{error}</div>}

      <div className="filters-card">
        <select
          className="input"
          value={view}
          onChange={(e) => setView(e.target.value as CategoriaView)}
          disabled={loading}
        >
          <option value="activos">Activas</option>
          <option value="desactivadas">Desactivadas</option>
        </select>

        <input
          className="input"
          placeholder="Nombre (CatNom)"
          value={form.CatNom}
          onChange={(e) => setForm((f) => ({ ...f, CatNom: e.target.value }))}
          disabled={loading || view === 'desactivadas'}
        />
        <input
          className="input"
          placeholder="Descripción (opcional)"
          value={form.CatDes}
          onChange={(e) => setForm((f) => ({ ...f, CatDes: e.target.value }))}
          disabled={loading || view === 'desactivadas'}
        />

        <button className="btn" onClick={() => void submit()} disabled={loading || view === 'desactivadas'}>
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
              <th>Descripción</th>
              <th>Activa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.CatId}>
                <td>{c.CatId}</td>
                <td>{c.CatNom}</td>
                <td>{c.CatDes || '—'}</td>
                <td>{c.CatAct ? 'Sí' : 'No'}</td>
                <td className="actions">
                  <button
                    title="Editar"
                    onClick={() => setEditing(c)}
                    disabled={loading || view === 'desactivadas'}
                  >
                    ✏️
                  </button>
                  {view === 'activos' ? (
                    <button title="Desactivar" onClick={() => void deactivate(c.CatId)} disabled={loading}>
                      🗑️
                    </button>
                  ) : (
                    <button title="Reactivar" onClick={() => void reactivate(c.CatId)} disabled={loading}>
                      ♻️
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5}>Sin registros</td>
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
