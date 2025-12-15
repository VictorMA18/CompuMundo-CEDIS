import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import './Home.css';

type ModuleInfo = {
  name: string;
  status: 'implementado' | 'pendiente';
  endpoints: string[];
};

const modules: ModuleInfo[] = [
  {
    name: 'Auth',
    status: 'implementado',
    endpoints: ['POST /api/auth/login'],
  },
  {
    name: 'Autores',
    status: 'implementado',
    endpoints: [
      'GET /api/autores',
      'GET /api/autores/desactivados',
      'POST /api/autores',
      'PATCH /api/autores/:id',
      'PATCH /api/autores/reactivar/:id',
      'DELETE /api/autores/:id',
    ],
  },
  {
    name: 'Material bibliográfico (Documentos)',
    status: 'implementado',
    endpoints: [
      'GET /api/material-bibliografico',
      'GET /api/material-bibliografico/desactivados',
      'POST /api/material-bibliografico',
      'PATCH /api/material-bibliografico/:id',
      'PATCH /api/material-bibliografico/reactivar/:id',
      'PATCH /api/material-bibliografico/recalcular-formato/:id',
      'DELETE /api/material-bibliografico/:id',
    ],
  },
  {
    name: 'Material físico',
    status: 'implementado',
    endpoints: [
      'GET /api/material-fisico',
      'GET /api/material-fisico/desactivados',
      'GET /api/material-fisico/material/:matBibId',
      'POST /api/material-fisico',
      'PATCH /api/material-fisico/:id',
      'PATCH /api/material-fisico/reactivar/:id',
      'DELETE /api/material-fisico/:id',
    ],
  },
  {
    name: 'Material virtual',
    status: 'implementado',
    endpoints: [
      'GET /api/material-virtual',
      'GET /api/material-virtual/desactivados',
      'GET /api/material-virtual/material/:matBibId',
      'POST /api/material-virtual',
      'PATCH /api/material-virtual/:id',
      'PATCH /api/material-virtual/reactivar/:id',
      'DELETE /api/material-virtual/:id',
    ],
  },
  {
    name: 'Categorías',
    status: 'implementado',
    endpoints: [
      'GET /api/categorias',
      'GET /api/categorias/desactivadas',
      'POST /api/categorias',
      'PATCH /api/categorias/:id',
      'PATCH /api/categorias/reactivar/:id',
      'DELETE /api/categorias/:id',
    ],
  },
  {
    name: 'Lectores',
    status: 'implementado',
    endpoints: [
      'GET /api/lectores',
      'GET /api/lectores/desactivados',
      'POST /api/lectores',
      'PATCH /api/lectores/:id',
      'PATCH /api/lectores/reactivar/:id',
      'DELETE /api/lectores/:id',
    ],
  },
  {
    name: 'Usuarios',
    status: 'implementado',
    endpoints: [
      'GET /api/usuarios',
      'GET /api/usuarios/desactivados',
      'POST /api/usuarios',
      'PATCH /api/usuarios/:id',
      'PATCH /api/usuarios/reactivar/:id',
      'DELETE /api/usuarios/:id',
    ],
  },
  {
    name: 'Préstamos',
    status: 'pendiente',
    endpoints: ['(No hay controller en backend aún)'],
  },
];

export default function Home() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();

  useEffect(() => {
    setTitle?.('Dashboard');
  }, [setTitle]);

  return (
    <div className="home-root">
      <h1 className="home-title">Panel de administración</h1>
      <p className="home-subtitle">Este panel muestra los módulos y sus endpoints reales del backend.</p>

      <div className="home-grid">
        {modules.map((m) => (
          <div className="home-card" key={m.name}>
            <div className="home-card-header">
              <h3>{m.name}</h3>
              <span className={`home-status ${m.status}`}>{m.status}</span>
            </div>

            <div className="home-endpoints">
              {m.endpoints.map((e) => (
                <div key={e} className="home-endpoint">
                  {e}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
