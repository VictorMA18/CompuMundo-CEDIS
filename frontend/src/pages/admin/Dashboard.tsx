import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { prestamosService } from "../../services/prestamosService";
import "./AdminCrud.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// 1. DEFINIMOS LA PALETA DE COLORES GLOBAL PARA QUE SIEMPRE SEA IGUAL
const CHART_COLORS = [
  "#B31818", // Rojo (Institucional)
  "#404040", // Gris Oscuro
  "#AE6060", // Rojo Claro
  "#808080", // Gris Medio
  "#D9D9D9", // Gris Claro
  "#000000", // Negro
  "#FFCD56", // Amarillo (Extra)
  "#36A2EB", // Azul (Extra)
];

export default function Dashboard() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const [loading, setLoading] = useState(true);

  const [kpis, setKpis] = useState({ totalPrestamos: 0, totalLectores: 0, totalDocs: 0, tasaMorosidad: "0" });

  // Modificamos el estado para guardar también los colores de las barras
  const [graphData, setGraphData] = useState({
    historial: { labels: [] as string[], data: [] as number[] },
    categorias: { labels: [] as string[], data: [] as number[] },
    topDocs: {
      labels: [] as string[],
      data: [] as number[],
      colors: [] as string[], // <--- Nuevo campo para guardar el color correcto
    },
  });

  // Estado auxiliar para mapear "Nombre Categoría" -> "Color"
  const [categoryColorMap, setCategoryColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setTitle?.("Dashboard General");
    calculateDashboardData();
  }, []);

  const calculateDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resPrestamos, resLectores, resMateriales] = await Promise.all([
        prestamosService.getAll(),
        fetch("/api/lectores", { headers }).then((r) => r.json()),
        fetch("/api/material-bibliografico", { headers }).then((r) => r.json()),
      ]);

      const prestamos = Array.isArray(resPrestamos) ? resPrestamos : [];
      const lectores = Array.isArray(resLectores) ? resLectores : [];
      const materiales = Array.isArray(resMateriales) ? resMateriales : [];

      // --- A. KPIs ---
      const totalPrestamos = prestamos.length;
      const totalLectores = lectores.length;
      const totalDocs = materiales.length;
      const vencidos = prestamos.filter((p: any) => p.PreEst === "VENCIDO").length;
      const tasaMorosidad = totalPrestamos > 0 ? ((vencidos / totalPrestamos) * 100).toFixed(1) : "0";

      setKpis({ totalPrestamos, totalLectores, totalDocs, tasaMorosidad });

      // --- B. Historial ---
      const historialMap: Record<string, number> = {};
      prestamos.forEach((p: any) => {
        const mes = p.PreFecPre.substring(0, 7);
        historialMap[mes] = (historialMap[mes] || 0) + 1;
      });
      const mesesOrdenados = Object.keys(historialMap).sort();

      // --- C. Categorías (Dona) Y Mapeo de Colores ---
      const catMap: Record<string, number> = {};

      prestamos.forEach((p: any) => {
        p.detalles.forEach((d: any) => {
          const catNombre = d.materialBibliografico?.categoria?.CatNom || "General";
          catMap[catNombre] = (catMap[catNombre] || 0) + 1;
        });
      });

      const catLabels = Object.keys(catMap);
      const catData = Object.values(catMap);

      // MAGIA 1: Asignar un color fijo a cada categoría encontrada
      const newColorMap: Record<string, string> = {};
      catLabels.forEach((cat, index) => {
        // Usamos el operador módulo (%) para rotar colores si hay muchas categorías
        newColorMap[cat] = CHART_COLORS[index % CHART_COLORS.length];
      });
      setCategoryColorMap(newColorMap);

      // --- D. Top Documentos (Barras) con Color de Categoría ---
      // Guardamos { count, category }
      const docMap: Record<string, { count: number; category: string }> = {};

      prestamos.forEach((p: any) => {
        p.detalles.forEach((d: any) => {
          const titulo = d.materialBibliografico?.MatBibTit || "Desconocido";
          const catNombre = d.materialBibliografico?.categoria?.CatNom || "General";

          if (!docMap[titulo]) {
            docMap[titulo] = { count: 0, category: catNombre };
          }
          docMap[titulo].count += 1;
        });
      });

      const top5 = Object.entries(docMap)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5);

      // MAGIA 2: Extraemos los colores basados en la categoría del libro
      const barColors = top5.map(([, info]) => {
        // Buscamos el color que le asignamos a esa categoría antes
        return newColorMap[info.category] || "#ccc";
      });

      setGraphData({
        historial: { labels: mesesOrdenados, data: mesesOrdenados.map((m) => historialMap[m]) },
        categorias: { labels: catLabels, data: catData },
        topDocs: {
          labels: top5.map(([k]) => k.substring(0, 15) + "..."),
          data: top5.map(([, v]) => v.count),
          colors: barColors, // <--- Guardamos los colores sincronizados
        },
      });
    } catch (error) {
      console.error("Error calculando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-container">Cargando...</div>;

  // --- CONFIGURACIÓN DE GRÁFICOS ---

  const lineChartData = {
    labels: graphData.historial.labels,
    datasets: [
      {
        label: "Préstamos Mensuales",
        data: graphData.historial.data,
        borderColor: "#B31818",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(179, 24, 24, 0.4)");
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          return gradient;
        },
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#B31818",
      },
    ],
  };

  const doughnutChartData = {
    labels: graphData.categorias.labels,
    datasets: [
      {
        data: graphData.categorias.data,
        // Usamos el mismo mapa de colores para asegurar coincidencia
        backgroundColor: graphData.categorias.labels.map((cat) => categoryColorMap[cat] || "#ccc"),
        borderWidth: 0,
      },
    ],
  };

  const barChartData = {
    labels: graphData.topDocs.labels,
    datasets: [
      {
        label: "Solicitudes",
        data: graphData.topDocs.data,
        // AQUI APLICAMOS LOS COLORES SINCRONIZADOS
        backgroundColor: graphData.topDocs.colors,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "25px", marginBottom: "30px" }}>
        <RedCard title="PRÉSTAMOS TOTALES" value={kpis.totalPrestamos} icon="📈" />
        <RedCard title="TÍTULOS EN CATÁLOGO" value={kpis.totalDocs} icon="📚" />
        <RedCard title="LECTORES REGISTRADOS" value={kpis.totalLectores} icon="👥" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "25px" }}>
        <div
          className="chart-container"
          style={{ gridColumn: "span 8", backgroundColor: "white", padding: "20px", borderRadius: "8px", border: "1px solid #eee" }}
        >
          <h4 style={{ margin: "0 0 15px 0", color: "#444" }}>Evolución Histórica</h4>
          <div style={{ height: "300px" }}>
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false } } },
              }}
            />
          </div>
        </div>

        <div
          className="chart-container"
          style={{ gridColumn: "span 4", backgroundColor: "white", padding: "20px", borderRadius: "8px", border: "1px solid #eee" }}
        >
          <h4 style={{ margin: "0 0 15px 0", color: "#444" }}>Por Categoría</h4>
          <div style={{ height: "250px", display: "flex", justifyContent: "center", marginTop: "20px" }}>
            <Doughnut data={doughnutChartData} options={{ cutout: "70%", plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } } }} />
          </div>
        </div>

        <div
          className="chart-container"
          style={{ gridColumn: "span 12", backgroundColor: "white", padding: "20px", borderRadius: "8px", border: "1px solid #eee" }}
        >
          <h4 style={{ margin: "0 0 15px 0", color: "#444" }}>Documentos Más Solicitados (Color por Categoría)</h4>
          <div style={{ height: "250px" }}>
            <Bar
              data={barChartData}
              options={{
                indexAxis: "y",
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false } } },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RedCard({ title, value, icon }: any) {
  return (
    <div
      style={{
        backgroundColor: "#B31818",
        borderRadius: "12px",
        padding: "25px",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "140px",
        boxShadow: "0 10px 20px rgba(179, 24, 24, 0.2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "100px",
          height: "100px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
        }}
      ></div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.9 }}>{title}</span>
        <span style={{ fontSize: "1.5rem", opacity: 0.8 }}>{icon}</span>
      </div>
      <div style={{ fontSize: "3rem", fontWeight: 700, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
