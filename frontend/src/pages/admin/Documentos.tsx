import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminCrud.css";

/* ================= TIPOS ================= */
type AutorRef = { AutId: number; AutNom: string; AutApe: string; AutDoc: string };
type ApiError = { message?: string | string[] };
type Categoria = { CatId: number; CatNom: string }; // Nueva Interfaz de Categoría

type MaterialBibliografico = {
  MatBibId: number;
  MatBibCod: string;
  MatBibTit: string;
  MatBibAno: boolean;
  CatId: number;
  MatBibFor: "FISICO" | "VIRTUAL" | "MIXTO" | "NINGUNO" | string;
  MatBibAct: boolean;
  MatBibFecPub: string | null;
  autoresMaterial?: Array<{ autor: AutorRef }>;
  totalFisicos?: number;
  disponiblesFisicos?: number;
  tieneVirtual?: boolean;
};

type View = "activos" | "desactivados";
type ModalState =
  | null
  | "view"
  | "new"
  | "edit"
  | "delete"
  | "reactivate"
  | "recalculate";

function errorMessage(data: unknown, fallback: string) {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(", ");
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return fallback;
}

/* ================= HOOKS DE DATOS RELACIONADOS ================= */

// SIMULACIÓN de un hook para obtener categorías (necesario para el select)
const useCategories = (authFetch: any) => {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await authFetch("/api/categorias"); // Asumiendo este endpoint
        if (res.ok) {
          const data = await res.json();
          setCategories(data || []);
        }
      } catch (e) {
        console.error("No se pudieron cargar las categorías:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { categories, loading };
};


/* ================= FORMULARIO CORREGIDO ================= */
function DocumentoForm({
  initial,
  onSave,
  onCancel,
  categories,
}: {
  initial: MaterialBibliografico | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  categories: Categoria[];
}) {
  const [form, setForm] = useState({
    MatBibCod: "",
    MatBibTit: "",
    CatId: categories.length > 0 ? categories[0].CatId : 0, // Establecer el primer ID como valor inicial
  });

  useEffect(() => {
    if (initial) {
        setForm({
            MatBibCod: initial.MatBibCod ?? "",
            MatBibTit: initial.MatBibTit ?? "",
            CatId: initial.CatId,
        });
    } else if (categories.length > 0 && form.CatId === 0) {
        // Inicializar CatId si es un formulario nuevo y se cargan las categorías
        setForm(f => ({ ...f, CatId: categories[0].CatId }));
    }
  }, [initial, categories]);

  const submit = () => {
    // Verificar que los campos obligatorios estén presentes
    if (!form.MatBibCod || !form.MatBibTit || !form.CatId) return;

    onSave({
      MatBibCod: form.MatBibCod.trim(),
      MatBibTit: form.MatBibTit.trim(),
      CatId: form.CatId, // ¡Añadido el campo CatId!
      // Nota: Si es nuevo, MatBibAno, MatBibFor y MatBibAct podrían ser necesarios
      // Si el backend los maneja por defecto, no hace falta.
    });
  };

  const isCategoryLoading = categories.length === 0 && initial === null;

  return (
    <>
      <h3>{initial ? "Editar Documento" : "Registrar Documento"}</h3>

      <div className="form-grid">
        {/* INPUT: Código */}
        <input
          placeholder="Código"
          value={form.MatBibCod}
          onChange={(e) => setForm({ ...form, MatBibCod: e.target.value })}
        />
        {/* INPUT: Título */}
        <input
          placeholder="Título"
          value={form.MatBibTit}
          onChange={(e) => setForm({ ...form, MatBibTit: e.target.value })}
        />
        
        {/* SELECT: Categoría (Solución al error CatId) */}
        <select
            className="input"
            value={form.CatId}
            onChange={(e) => setForm({ ...form, CatId: Number(e.target.value) })}
            disabled={isCategoryLoading}
        >
            {isCategoryLoading && <option>Cargando categorías...</option>}
            {categories.map(cat => (
                <option key={cat.CatId} value={cat.CatId}>
                    {cat.CatNom}
                </option>
            ))}
        </select>
        {/* Aquí iría la gestión de Autores */}
      </div>

      <div className="modal-actions">
        <button className="btn" onClick={submit} disabled={isCategoryLoading}>
          Guardar
        </button>
        <button className="btn secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </>
  );
}

/* ================= COMPONENTE PRINCIPAL ================= */
export default function Documentos() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const { authFetch } = useAuth();
  
  // Nuevo: Cargar categorías
  const { categories } = useCategories(authFetch);

  useEffect(() => {
    setTitle?.("Documentos");
  }, [setTitle]);

  /* ===== ESTADO ===== */
  const [items, setItems] = useState<MaterialBibliografico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("activos");

  // modales
  const [modal, setModal] = useState<ModalState>(null);
  const [selected, setSelected] = useState<MaterialBibliografico | null>(null);

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===== LOAD ===== */
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        view === "activos"
          ? "/api/material-bibliografico"
          : "/api/material-bibliografico/desactivados";
      const res = await authFetch(url);
      const data = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        setError(errorMessage(data, "No se pudo cargar documentos"));
        setItems([]);
        return;
      }

      setItems((data as MaterialBibliografico[]) || []);
    } catch {
      setError("No se pudo conectar para cargar documentos");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [view]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  /* ===== FILTROS ===== */
  const filteredItems = useMemo(() => {
    return items.filter(
      (m) =>
        m.MatBibTit.toLowerCase().includes(search.toLowerCase()) ||
        m.MatBibCod.includes(search) ||
        (m.autoresMaterial || []).some((x) =>
          `${x.autor.AutNom} ${x.autor.AutApe}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
    );
  }, [items, search]);

  /* ===== PAGINACIÓN ===== */
  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  /* ===== CRUD ACTIONS ===== */
  const save = async (payload: any) => {
    const isEdit = modal === "edit" && selected;
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? `/api/material-bibliografico/${selected!.MatBibId}`
      : "/api/material-bibliografico";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          errorMessage(data, `Error al ${isEdit ? "actualizar" : "crear"} documento`)
        );
      }

      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido al guardar");
    }
  };

  const deactivate = async () => {
    if (!selected) return;
    try {
      await authFetch(`/api/material-bibliografico/${selected.MatBibId}`, {
        method: "DELETE",
      });
      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      setError("Error al desactivar el documento");
    }
  };

  const reactivate = async () => {
    if (!selected) return;
    try {
      await authFetch(
        `/api/material-bibliografico/reactivar/${selected.MatBibId}`,
        {
          method: "PATCH",
        }
      );
      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      setError("Error al reactivar el documento");
    }
  };

  const recalculateFormat = async () => {
    if (!selected) return;
    try {
      await authFetch(
        `/api/material-bibliografico/recalcular-formato/${selected.MatBibId}`,
        {
          method: "PATCH",
        }
      );
      setModal(null);
      setSelected(null);
      await load();
    } catch (e) {
      setError("Error al recalcular el formato del documento");
    }
  };

  /* ===== UI ===== */
  return (
    <>
      {error && <div className="error">{error}</div>}
      
      {/* ===== FILTROS... (omitiendo por brevedad, no hay cambios aquí) ===== */}

      <div className="filters-card">
        <h3 className="card-title">Filtros</h3>
        <input
          className="input"
          placeholder="Buscar por código, título o autor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={view}
          onChange={(e) => setView(e.target.value as View)}
          disabled={loading}
        >
          <option value="activos">Activos</option>
          <option value="desactivados">Desactivados</option>
        </select>
        <button 
          className="btn-new"
          onClick={() => {
            setSelected(null);
            setModal("new");
          }}
          disabled={loading || categories.length === 0}
        >
          ➕ Nuevo
        </button>
      </div>

      {/* ===== TABLA... (omitiendo por brevedad) ===== */}

      <div className="table-card">
        <h3 className="card-title">Listado de Documentos</h3>
        <div className="table-toolbar">
          <span>Mostrar</span>
          <select
            className="input-small"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <span>registros</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Título</th>
                <th>Categoría</th> {/* Cambio de CatId a Categoría para mejor UX */}
                <th>Formato</th>
                <th>Físicos</th>
                <th>Virtual</th>
                <th>Autores</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((m, i) => {
                const autores = (m.autoresMaterial || []).map(
                  (x) => `${x.autor.AutNom} ${x.autor.AutApe}`
                );
                const fis =
                  typeof m.totalFisicos === "number"
                    ? `${m.disponiblesFisicos ?? 0}/${m.totalFisicos}`
                    : "N/A";
                const vir =
                  typeof m.tieneVirtual === "boolean"
                    ? m.tieneVirtual
                      ? "Sí"
                      : "No"
                    : "N/A";
                const categoryName = categories.find(c => c.CatId === m.CatId)?.CatNom || m.CatId;

                return (
                  <tr key={m.MatBibId}>
                    <td>{m.MatBibId}</td>
                    <td>{m.MatBibCod}</td>
                    <td>{m.MatBibTit}</td>
                    <td>{categoryName}</td>
                    <td>{m.MatBibFor}</td>
                    <td>{fis}</td>
                    <td>{vir}</td>
                    <td
                      style={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={autores.join(", ")}
                    >
                      {autores.join(", ")}
                    </td>
                    <td>{m.MatBibAct ? "Sí" : "No"}</td>
                    <td className="actions">
                      <button onClick={() => { setSelected(m); setModal("view"); }}>👁️</button>
                      <button onClick={() => { setSelected(m); setModal("edit"); }}>✏️</button>
                      <button title="Recalcular Formato" onClick={() => { setSelected(m); setModal("recalculate"); }}>🔄</button>
                      {view === "activos" ? (
                        <button onClick={() => { setSelected(m); setModal("delete"); }}>🗑️</button>
                      ) : (
                        <button onClick={() => { setSelected(m); setModal("reactivate"); }}>♻️</button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={10}>Sin registros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PAGINACIÓN... (omitiendo por brevedad) ===== */}

      <div className="pagination">
        <button
          className="btn-secondary"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ⬅ Anterior
        </button>
        <span>
          Página {page} de {totalPages || 1}
        </span>
        <button
          className="btn-secondary"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente ➡
        </button>
      </div>

      {/* ===== MODALES CORREGIDOS ===== */}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            {/* View Modal (omitiendo por brevedad) */}
            {modal === "view" && selected && (
              <>
                <h3>Detalle del Documento</h3>
                <p><b>Título:</b> {selected.MatBibTit}</p>
                <p><b>Categoría:</b> {categories.find(c => c.CatId === selected.CatId)?.CatNom || selected.CatId}</p>
                <button className="btn" onClick={() => setModal(null)}>Cerrar</button>
              </>
            )}

            {(modal === "new" || modal === "edit") && (
              <DocumentoForm
                initial={modal === "edit" ? selected : null}
                onSave={save}
                onCancel={() => setModal(null)}
                categories={categories} // Pasando la lista de categorías
              />
            )}

            {/* Delete, Reactivate, Recalculate Modals (omitiendo por brevedad) */}
            {modal === "delete" && (
                <>
                <h3>¿Desactivar documento?</h3>
                <p>
                    **Documento:** {selected?.MatBibTit} ({selected?.MatBibCod})
                </p>
                <button className="btn danger" onClick={deactivate}>
                    Desactivar
                </button>
                <button className="btn secondary" onClick={() => setModal(null)}>
                    Cancelar
                </button>
                </>
            )}
            {modal === "reactivate" && (
                <>
                <h3>¿Reactivar documento?</h3>
                <p>
                    **Documento:** {selected?.MatBibTit} ({selected?.MatBibCod})
                </p>
                <button className="btn" onClick={reactivate}>
                    Reactivar
                </button>
                <button className="btn secondary" onClick={() => setModal(null)}>
                    Cancelar
                </button>
                </>
            )}
            {modal === "recalculate" && (
                <>
                <h3>¿Recalcular formato?</h3>
                <p>
                    Esto actualizará el campo `MatBibFor` basado en la existencia
                    de copias físicas y recursos virtuales.
                </p>
                <p>
                    **Documento:** {selected?.MatBibTit} ({selected?.MatBibCod})
                </p>
                <button className="btn" onClick={recalculateFormat}>
                    Recalcular
                </button>
                <button className="btn secondary" onClick={() => setModal(null)}>
                    Cancelar
                </button>
                </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
