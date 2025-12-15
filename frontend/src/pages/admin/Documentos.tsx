import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminCrud.css';

type ApiError = { message?: string | string[] };

type AutorRef = { AutId: number; AutNom: string; AutApe: string; AutDoc: string };

type MaterialBibliografico = {
  MatBibId: number;
  MatBibCod: string;
  MatBibTit: string;
  MatBibAno: boolean;
  CatId: number;
  MatBibFor: 'FISICO' | 'VIRTUAL' | 'MIXTO' | 'NINGUNO' | string;
  MatBibAct: boolean;
  MatBibFecPub: string | null;
  autoresMaterial?: Array<{ autor: AutorRef }>;
  totalFisicos?: number;
  disponiblesFisicos?: number;
  tieneVirtual?: boolean;
};

type View = 'activos' | 'desactivados';

function errorMessage(data: unknown, fallback: string) {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(', ');
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

export default function Documentos() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();

  const [view, setView] = useState<View>('activos');
  const [items, setItems] = useState<MaterialBibliografico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoints = useMemo(
    () => [
      { method: 'GET', path: '/api/material-bibliografico', note: 'Listar activos' },
      { method: 'GET', path: '/api/material-bibliografico/desactivados', note: 'Listar desactivados' },
      { method: 'GET', path: '/api/material-bibliografico/:id', note: 'Detalle' },
      { method: 'POST', path: '/api/material-bibliografico', note: 'Crear (requiere CatId y opcional autores)' },
      { method: 'PATCH', path: '/api/material-bibliografico/:id', note: 'Actualizar' },
      { method: 'PATCH', path: '/api/material-bibliografico/reactivar/:id', note: 'Reactivar' },
      { method: 'PATCH', path: '/api/material-bibliografico/recalcular-formato/:id', note: 'Recalcular formato' },
      { method: 'DELETE', path: '/api/material-bibliografico/:id', note: 'Desactivar (soft delete)' },
    ],
    [],
  );

  useEffect(() => {
    setTitle?.('Documentos');
  }, [setTitle]);

  const load = async () => {
    setLoading(true);
    setError(null);

    const url = view === 'activos' ? '/api/material-bibliografico' : '/api/material-bibliografico/desactivados';
    const res = await authFetch(url);
    const data = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      setError(errorMessage(data, 'No se pudo cargar documentos'));
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data as MaterialBibliografico[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return (
    <>
      {error && <div className="error">{error}</div>}

      <div className="notice">
        UI de registro/edición de documentos está pendiente (requiere categorías y autores). Por ahora, esta vista refleja los endpoints reales y lista los datos.
      </div>

      <div className="filters-card">
        <select
          className="input"
          value={view}
          onChange={(e) => setView(e.target.value === 'desactivados' ? 'desactivados' : 'activos')}
          disabled={loading}
        >
          <option value="activos">Activos</option>
          <option value="desactivados">Desactivados</option>
        </select>

        <button className="btn secondary" onClick={() => void load()} disabled={loading}>
          Refrescar
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Título</th>
              <th>CatId</th>
              <th>Formato</th>
              <th>Físicos</th>
              <th>Virtual</th>
              <th>Autores</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => {
              const autores = (m.autoresMaterial || []).map((x) => `${x.autor.AutNom} ${x.autor.AutApe}`);
              const fis = typeof m.totalFisicos === 'number' ? `${m.disponiblesFisicos ?? 0}/${m.totalFisicos}` : '';
              const vir = typeof m.tieneVirtual === 'boolean' ? (m.tieneVirtual ? 'Sí' : 'No') : '';
              return (
                <tr key={m.MatBibId}>
                  <td>{m.MatBibId}</td>
                  <td>{m.MatBibCod}</td>
                  <td>{m.MatBibTit}</td>
                  <td>{m.CatId}</td>
                  <td>{m.MatBibFor}</td>
                  <td>{fis}</td>
                  <td>{vir}</td>
                  <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {autores.join(', ')}
                  </td>
                  <td>{m.MatBibAct ? 'Sí' : 'No'}</td>
                </tr>
              );
            })}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={9}>Sin registros</td>
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
