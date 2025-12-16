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
      // 2. Cargamos listas y hacemos DEBUG de lo que llega
      const [lectoresData, materialesData] = await Promise.all([
        prestamosService.getLectores(),
        prestamosService.getMaterialesDisponibles()
      ]);

      console.log("Materiales Disponibles (Raw):", materialesData); // <--- MIRA ESTO EN LA CONSOLA F12
      
      setLectores(lectoresData);
      setMateriales(materialesData);
      
      // Reset form
      setNewPrestamoLector('');
      setNewPrestamoMaterial('');
      setNewPrestamoObs('');
      
      setModal('new');
    } catch (error) {
      alert('Error cargando listas. Revisa la consola.');
      console.error(error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrestamoLector || !newPrestamoMaterial) {
      alert('Seleccione un lector y un material');
      return;
    }

    // Buscamos el objeto completo basado en el ID seleccionado
    const materialSelected = materiales.find(m => m.MatFisId === Number(newPrestamoMaterial));
    
    // Validación extra por si algo falla
    if (!materialSelected || !materialSelected.materialBibliografico) {
        alert("Error: El material seleccionado no tiene datos bibliográficos válidos.");
        return;
    }

    try {
      await prestamosService.create({
        LecId: Number(newPrestamoLector),
        PreObs: newPrestamoObs,
        detalles: [
          {
            MatFisId: materialSelected.MatFisId,
            MatBibId: materialSelected.materialBibliografico.MatBibId,
            PreTip: 'FISICO'
          }
        ]
      });
      alert('Préstamo registrado con éxito');
      setModal(null);
      loadData(); 
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDevolucion = async (detalleId: number) => {
    if (!confirm('¿Confirmar devolución de este libro?')) return;
    try {
      await prestamosService.devolverDetalle(detalleId);
      alert('Libro devuelto correctamente');
      setModal(null);
      loadData();
    } catch (error) {
      alert('Error al procesar devolución');
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

  return (
    <>
      <div className="filters-card">
        <input className="input" placeholder="Buscar..." />
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
              {prestamos.map((p) => (
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

                <h4>Libros Prestados:</h4>
                <div className="detalles-list" style={{marginTop: '10px', maxHeight: '200px', overflowY: 'auto'}}>
                  {selectedPrestamo.detalles.map(det => (
                    <div key={det.PreDetId} className="detalle-item" style={{border: '1px solid #ddd', padding: '10px', marginBottom: '5px', borderRadius: '4px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        {/* 4. MÁS PROTECCIÓN CONTRA UNDEFINED */}
                        <strong>{det.materialBibliografico?.MatBibTit || '(Título no disponible)'}</strong>
                        <br />
                        <small>Cód: {det.materialFisico?.MatFisCodEje || 'S/C'}</small>
                        <br />
                        {renderEstado(det.PreEst)}
                      </div>
                      
                      {det.PreEst !== 'DEVUELTO' && (
                        <button 
                          className="btn-small" 
                          style={{backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px'}}
                          onClick={() => handleDevolucion(det.PreDetId)}
                        >
                          Devolver
                        </button>
                      )}
                    </div>
                  ))}
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
    </>
  );
}