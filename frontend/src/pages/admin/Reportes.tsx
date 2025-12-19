import { useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './AdminCrud.css';
import { apiUrl } from '../../config/apiUrl';

export default function Reportes() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [docId, setDocId] = useState('');

  useEffect(() => {
    setTitle?.('Generación de Reportes');
  }, []);

  const downloadReport = async (
    tipo: 'morosos' | 'pendientes' | 'lectores-por-documento',
    formato: 'excel' | 'pdf'
  ) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (fechaInicio) params.append('inicio', fechaInicio);
      if (fechaFin) params.append('fin', fechaFin);

      if (tipo === 'lectores-por-documento') {
        if (!docId) {
          alert('Ingrese el ID del Material Bibliográfico para este reporte.');
          return;
        }
        params.append('MatBibId', docId);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';

      // USAR apiUrl PARA RESPETAR VITE_API_URL (PROD) Y PROXY (DEV)
      const url = apiUrl(`/reportes/${tipo}/${formato}${queryString}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorMsg = await response.json().catch(() => ({}));
        throw new Error(errorMsg.message || 'Error generando el reporte');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const extension = formato === 'excel' ? 'xlsx' : 'pdf';
      a.download = `Reporte_${tipo}_${
        new Date().toISOString().split('T')[0]
      }.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error(error);
      alert('Error al descargar: ' + error.message);
    }
  };

  return (
    <div className="table-card" style={{ padding: '1.5rem' }}>
      {/* BARRA SUPERIOR: TÍTULO Y FILTROS COMPACTOS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '15px',
        }}
      >
        <h3 style={{ margin: 0, color: '#333' }}>Seleccionar Reporte</h3>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>
            📅 Filtrar por fecha:
          </span>
          <input
            type="date"
            className="input"
            style={{ padding: '5px', height: '35px' }}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <span style={{ color: '#999' }}>-</span>
          <input
            type="date"
            className="input"
            style={{ padding: '5px', height: '35px' }}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          {(fechaInicio || fechaFin) && (
            <button
              className="btn secondary"
              style={{
                height: '35px',
                padding: '0 10px',
                fontSize: '0.85rem',
              }}
              onClick={() => {
                setFechaInicio('');
                setFechaFin('');
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* GRID DE TARJETAS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {/* TARJETA 1: MOROSOS */}
        <div className="card-report" style={cardStyle}>
          <div style={{ flex: 1 }}>
            <h4 style={titleStyle}>📉 Lectores Morosos</h4>
            <p style={descStyle}>
              Estudiantes y docentes con préstamos vencidos pendientes de
              devolución.
            </p>
          </div>
          <div style={btnContainerStyle}>
            <button
              className="btn"
              style={btnExcelStyle}
              onClick={() => downloadReport('morosos', 'excel')}
            >
              📗 Excel
            </button>
            <button
              className="btn"
              style={btnPdfStyle}
              onClick={() => downloadReport('morosos', 'pdf')}
            >
              📕 PDF
            </button>
          </div>
        </div>

        {/* TARJETA 2: PENDIENTES */}
        <div className="card-report" style={cardStyle}>
          <div style={{ flex: 1 }}>
            <h4 style={titleStyle}>📚 Documentos Pendientes</h4>
            <p style={descStyle}>
              Inventario de material que se encuentra actualmente fuera de la
              biblioteca.
            </p>
          </div>
          <div style={btnContainerStyle}>
            <button
              className="btn"
              style={btnExcelStyle}
              onClick={() => downloadReport('pendientes', 'excel')}
            >
              📗 Excel
            </button>
            <button
              className="btn"
              style={btnPdfStyle}
              onClick={() => downloadReport('pendientes', 'pdf')}
            >
              📕 PDF
            </button>
          </div>
        </div>

        {/* TARJETA 3: LECTORES POR DOCUMENTO */}
        <div className="card-report" style={cardStyle}>
          <div style={{ flex: 1 }}>
            <h4 style={titleStyle}>👥 Historial por Documento</h4>
            <p style={descStyle}>
              Consulte quiénes han solicitado un material específico.
            </p>
            <div style={{ marginTop: '10px' }}>
              <input
                type="number"
                placeholder="Ingrese ID del Documento"
                className="input"
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
              />
            </div>
          </div>
          <div style={btnContainerStyle}>
            <button
              className="btn"
              style={btnExcelStyle}
              onClick={() =>
                downloadReport('lectores-por-documento', 'excel')
              }
            >
              📗 Excel
            </button>
            <button
              className="btn"
              style={btnPdfStyle}
              onClick={() => downloadReport('lectores-por-documento', 'pdf')}
            >
              📕 PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ESTILOS EN LÍNEA
const cardStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s',
  minHeight: '200px',
};

const titleStyle: React.CSSProperties = {
  color: '#B31818',
  marginTop: 0,
  marginBottom: '10px',
  fontSize: '1.1rem',
};

const descStyle: React.CSSProperties = {
  color: '#555',
  fontSize: '0.9rem',
  lineHeight: '1.4',
  margin: 0,
};

const btnContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginTop: '20px',
};

const btnExcelStyle: React.CSSProperties = {
  backgroundColor: '#217346',
  borderColor: '#217346',
  flex: 1,
  fontSize: '0.9rem',
};

const btnPdfStyle: React.CSSProperties = {
  backgroundColor: '#D32F2F',
  borderColor: '#D32F2F',
  color: 'white',
  flex: 1,
  fontSize: '0.9rem',
};