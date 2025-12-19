import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { prestamosService } from '../../services/prestamosService';
import type { Prestamo, LectorSimple, MaterialFisicoSimple } from '../../types/prestamo';
import './Prestamos.css';

type ModalType = 'view' | 'new';

export default function Prestamos() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  
  // Estados de datos
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [lectores, setLectores] = useState<LectorSimple[]>([]);
  const [materiales, setMateriales] = useState<MaterialFisicoSimple[]>([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType | null>(null);
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);

  // Estados del Formulario Nuevo
  const [newPrestamoLector, setNewPrestamoLector] = useState<string>('');
  const [newPrestamoMaterial, setNewPrestamoMaterial] = useState<string>('');
  const [newPrestamoObs, setNewPrestamoObs] = useState('');
  // NUEVO: Estado para el texto de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: number; type: 'devolver' } | null>(null);

  // 1. Carga Inicial Segura
  useEffect(() => {
    setTitle?.('Gestión de Préstamos');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await prestamosService.getAll();
      console.log("Préstamos cargados:", data); // DEBUG
      setPrestamos(data);
    } catch (error) {
      console.error(error);
      // No mostramos alert en carga inicial para no ser invasivos
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = async () => {
    try {
      setLoading(true);

      const lectoresData = await prestamosService.getLectores();
      setLectores(lectoresData);

      try {
        const materialesData = await prestamosService.getMaterialesDisponibles();
        console.log("Materiales:", materialesData);
        setMateriales(materialesData);
      } catch (err) {
        console.error("Error cargando materiales", err);
        setMateriales([]);
        setErrorMsg("No hay materiales disponibles actualmente.");
      }

      setNewPrestamoLector('');
      setNewPrestamoMaterial('');
      setNewPrestamoObs('');
      setModal('new');

    } catch (error) {
      console.error("Error cargando lectores", error);
      setErrorMsg("Error cargando lectores.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 1. Validaciones UI
  if (!newPrestamoLector || !newPrestamoMaterial) {
    setErrorMsg('Por favor, seleccione un lector y un material válido.');
    return;
  }

  const materialSelected = materiales.find(m => m.MatFisId === Number(newPrestamoMaterial));

  if (!materialSelected || !materialSelected.materialBibliografico) {
    setErrorMsg("Error crítico: El material seleccionado no tiene datos bibliográficos.");
    return;
  }

  try {
    setLoading(true); // Opcional: bloqueo visual
    await prestamosService.create({
      LecId: Number(newPrestamoLector),
      PreObs: newPrestamoObs,
      detalles: [{
        MatFisId: materialSelected.MatFisId,
        MatBibId: materialSelected.materialBibliografico.MatBibId,
        PreTip: 'FISICO'
      }]
    });
    
    // ÉXITO
    setModal(null); // Cierra el formulario
    setSuccessMsg('¡Préstamo registrado exitosamente!');
    loadData();     // Recarga la tabla
  } catch (error: any) {
    // ERROR
    handleBackendError(error);
  } finally {
    setLoading(false);
  }
};

  const requestDevolucion = (detalleId: number) => {
    setConfirmAction({ id: detalleId, type: 'devolver' });
    console.log("Solicitud de devolución para detalle ID:", detalleId); 
  };
  const executeDevolucion = async () => {
    if (!confirmAction) return;

    try {
      await prestamosService.devolverDetalle(confirmAction.id);
      setConfirmAction(null); // Cierra confirmación
      setModal(null);         // Cierra detalle si estaba abierto
      setSuccessMsg('Libro devuelto correctamente.');
      loadData();
    } catch (error) {
      handleBackendError(error);
    }
  };

  const closeModal = () => {
    setModal(null);
    setSelectedPrestamo(null);
  };

  const renderEstado = (estado: string) => {
    const clase = estado === 'VIGENTE' ? 'vigente' : estado === 'VENCIDO' ? 'vencido' : 'devuelto';
    return <span className={`estado ${clase}`}>{estado}</span>;
  };
  // Lógica de filtrado
  const filteredPrestamos = prestamos.filter((p) => {
    const term = searchTerm.toLowerCase();
    
    // Unimos nombre y apellido para buscar completo
    const nombreLector = `${p.lector?.LecNom || ''} ${p.lector?.LecApe || ''}`.toLowerCase();
    const dniLector = (p.lector?.LecDni || '').toLowerCase();
    
    // Obtenemos el título del primer libro (con seguridad contra fallos)
    const tituloLibro = (p.detalles?.[0]?.materialBibliografico?.MatBibTit || '').toLowerCase();

    // Retornamos true si alguna de las condiciones coincide
    return nombreLector.includes(term) || dniLector.includes(term) || tituloLibro.includes(term);
  });
  const handleBackendError = (error: any) => {
    console.error("Error capturado:", error);
    // Intenta sacar el mensaje del backend (si usas axios o fetch con json)
    const mensaje = error.response?.data?.message || error.message || "Ocurrió un error inesperado en el servidor.";
    setErrorMsg(mensaje);
  };

  return (
    <>
      <div className="filters-card">
        <input 
          className="input" 
          placeholder="Buscar por Lector, DNI o Libro..." 
          value={searchTerm} // <--- Vinculamos valor
          onChange={(e) => setSearchTerm(e.target.value)} // <--- Actualizamos estado
        />
        <button className="btn-new" onClick={openNewModal}>
          ➕ Nuevo Préstamo
        </button>
      </div>

      <div className="table-card">
        {loading ? <p>Cargando...</p> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Lector</th>
                <th>Libros</th>
                <th>Estado General</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrestamos.map((p) => (
                <tr key={p.PreId}>
                  <td>{p.PreId}</td>
                  <td>
                    {new Date(p.PreFecPre).toLocaleDateString()}
                  </td>
                  <td>
                    {p.lector?.LecNom} {p.lector?.LecApe}
                    <div className="sub">{p.lector?.LecDni}</div>
                  </td>
                  <td>
                    {/* 3. USO DE OPTIONAL CHAINING (?.) PARA EVITAR PANTALLA BLANCA */}
                    {p.detalles?.[0]?.materialBibliografico?.MatBibTit || 'Sin Título'}
                    {p.detalles.length > 1 && <span className="sub"> (+{p.detalles.length - 1})</span>}
                  </td>
                  <td>{renderEstado(p.PreEst)}</td>
                  <td className="actions">
                    <button 
                      title="Ver Detalles" 
                      onClick={() => { setSelectedPrestamo(p); setModal('view'); }}
                    >
                      👁️ Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            
            {/* --- MODAL DETALLE --- */}
            {modal === 'view' && selectedPrestamo && (
              <>
                <h3>Detalle del Préstamo #{selectedPrestamo.PreId}</h3>
                <div className="grid">
                  <p><b>Lector:</b> {selectedPrestamo.lector?.LecNom} {selectedPrestamo.lector?.LecApe}</p>
                  <p><b>Vence:</b> {new Date(selectedPrestamo.PreFecVen).toLocaleDateString()}</p>
                  <p><b>Observación:</b> {selectedPrestamo.PreObs || '-'}</p>
                </div>

                {/* --- DENTRO DEL MODAL 'VIEW' --- */}
<h4>Libros Prestados:</h4>
<div className="detalles-list" style={{ marginTop: '10px', maxHeight: '300px', overflowY: 'auto' }}>
  {selectedPrestamo.detalles.map((det) => {
    
    // 1. LÓGICA DE RECUPERACIÓN DE DATOS MÁS ROBUSTA
    // Intentamos buscar el título directamente O dentro del material físico
    const tituloLibro = 
      det.materialBibliografico?.MatBibTit || 
      "⚠️ Título no encontrado";

    const codigoLibro = det.materialFisico?.MatFisCodEje || "S/C";

    return (
      <div 
        key={det.PreDetId} 
        className="detalle-item" 
        style={{
          borderBottom: '1px solid #eee', 
          padding: '12px 0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {/* COLUMNA IZQUIERDA: INFORMACIÓN DEL LIBRO */}
        <div style={{ flex: 1 }}> 
          <strong style={{ fontSize: '1.05rem', color: '#333', display: 'block' }}>
            {tituloLibro}
          </strong>
          <small style={{ color: '#666' }}>
            Cód. Ejemplar: <b>{codigoLibro}</b>
          </small>
          <div style={{ marginTop: '4px' }}>
            {renderEstado(det.PreEst)}
          </div>
        </div>
        
        {/* COLUMNA DERECHA: BOTÓN DE ACCIÓN */}
        {det.PreEst !== 'DEVUELTO' && (
          <button 
            className="btn-small" 
            style={{
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              padding: '8px 12px', 
              cursor: 'pointer', 
              borderRadius: '6px',
              fontWeight: '500',
              flexShrink: 0 /* Evita que el botón se aplaste */
            }}
            onClick={() => requestDevolucion(det.PreDetId)}
          >
            Devolver
          </button>
        )}
      </div>
    );
  })}
</div>

                <div className="modal-actions">
                  <button className="btn secondary" onClick={closeModal}>Cerrar</button>
                </div>
              </>
            )}

            {/* --- MODAL NUEVO --- */}
            {modal === 'new' && (
              <>
                <h3>Registrar Nuevo Préstamo</h3>
                <form className="form-grid" onSubmit={handleCreate}>
                  
                  <div className="form-group">
                    <label>Lector:</label>
                    <select 
                      required 
                      value={newPrestamoLector} 
                      onChange={(e) => setNewPrestamoLector(e.target.value)}
                      style={{width: '100%', padding: '8px'}}
                    >
                      <option value="">-- Seleccione Lector --</option>
                      {lectores.map(l => (
                        <option key={l.LecId} value={l.LecId}>
                          {l.LecDni} - {l.LecNom} {l.LecApe}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Material Físico Disponible:</label>
                    <select 
                      required
                      value={newPrestamoMaterial}
                      onChange={(e) => setNewPrestamoMaterial(e.target.value)}
                      style={{width: '100%', padding: '8px'}}
                    >
                      <option value="">-- Seleccione Libro --</option>
                      {materiales.map(m => {
                        // 5. AQUÍ OCURRÍA EL ERROR ANTES
                        // Usamos ?. para verificar si existe materialBibliografico antes de leer el título
                        const titulo = m.materialBibliografico?.MatBibTit || 'Sin Título (Error de Carga)';
                        return (
                          <option key={m.MatFisId} value={m.MatFisId}>
                            {m.MatFisCodEje} - {titulo}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Observaciones:</label>
                    <input 
                      type="text" 
                      placeholder="Opcional"
                      value={newPrestamoObs}
                      onChange={(e) => setNewPrestamoObs(e.target.value)}
                    />
                  </div>

                  <div className="modal-actions" style={{marginTop: '20px'}}>
                    <button type="submit" className="btn">Guardar Préstamo</button>
                    <button type="button" className="btn secondary" onClick={closeModal}>Cancelar</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      {confirmAction && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}> {/* <--- ESTO ES LA CLAVE */}
          <div className="modal modal-sm" style={{ textAlign: 'center' }}>
            <h3>¿Confirmar Devolución?</h3>
            <p>El libro cambiará a estado "DISPONIBLE".</p>
            
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              {/* Botón que ejecuta la acción real */}
              <button className="btn" onClick={executeDevolucion}>
                Sí, Devolver
              </button>
              
              {/* Botón para cancelar solo la confirmación */}
              <button className="btn secondary" onClick={() => setConfirmAction(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito (También con zIndex alto) */}
      {successMsg && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="modal modal-sm success-modal">
            <h3 className="success-title">✅ Operación Exitosa</h3>
            <p>{successMsg}</p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn" onClick={() => setSuccessMsg(null)}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error (También con zIndex alto) */}
      {errorMsg && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="modal modal-sm error-modal">
            <h3 className="error-title">❌ Error</h3>
            <p>{errorMsg}</p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn danger" onClick={() => setErrorMsg(null)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}