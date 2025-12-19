import { useEffect, useMemo, useState } from "react";
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
import { apiUrl } from "../../config/apiUrl"; // <-- IMPORTANTE

// Registramos los componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Paleta de colores refinada
const CHART_COLORS = [
  "#B31818",
  "#2D3748",
  "#E53E3E",
  "#718096",
  "#F6AD55",
  "#4A5568",
  "#FC8181",
  "#CBD5E0",
];

export default function Dashboard() {
  const setTitle = useOutletContext<((title: string) => void) | undefined>();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalPrestamos: 0,
    totalLectores: 0,
    totalDocs: 0,
    tasaMorosidad: "0",
  });
  const [categoryColorMap, setCategoryColorMap] = useState<
    Record<string, string>
  >({});

  const [graphData, setGraphData] = useState({
    historial: { labels: [] as string[], data: [] as number[] },
    categorias: { labels: [] as string[], data: [] as number[] },
    topDocs: {
      labels: [] as string[],
      data: [] as number[],
      colors: [] as string[],
    },
  });

  useEffect(() => {
    setTitle?.("Panel de Control");
    calculateDashboardData();
  }, []);

  const calculateDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resPrestamos, resLectores, resMateriales] = await Promise.all([
        prestamosService.getAll(),
        fetch(apiUrl("/lectores"), { headers }).then((r) => r.json()),
        fetch(apiUrl("/material-bibliografico"), { headers }).then((r) =>
          r.json()
        ),
      ]);

      const prestamos = Array.isArray(resPrestamos) ? resPrestamos : [];
      const lectores = Array.isArray(resLectores) ? resLectores : [];
      const materiales = Array.isArray(resMateriales) ? resMateriales : [];

      // KPIs
      const totalPrestamos = prestamos.length;
      const totalLectores = lectores.length;
      const totalDocs = materiales.length;
      const vencidos = prestamos.filter((p: any) => p.PreEst === "VENCIDO")
        .length;
      const tasaMorosidad =
        totalPrestamos > 0
          ? ((vencidos / totalPrestamos) * 100).toFixed(1)
          : "0";

      setKpis({ totalPrestamos, totalLectores, totalDocs, tasaMorosidad });

      // Historial
      const historialMap: Record<string, number> = {};
      prestamos.forEach((p: any) => {
        const mes = p.PreFecPre.substring(0, 7);
        historialMap[mes] = (historialMap[mes] || 0) + 1;
      });
      const mesesOrdenados = Object.keys(historialMap).sort();

      // Categorías y Colores
      const catMap: Record<string, number> = {};
      prestamos.forEach((p: any) => {
        p.detalles.forEach((d: any) => {
          const catNombre =
            d.materialBibliografico?.categoria?.CatNom || "General";
          catMap[catNombre] = (catMap[catNombre] || 0) + 1;
        });
      });

      const catLabels = Object.keys(catMap);
      const newColorMap: Record<string, string> = {};
      catLabels.forEach((cat, index) => {
        newColorMap[cat] = CHART_COLORS[index % CHART_COLORS.length];
      });
      setCategoryColorMap(newColorMap);

      // Top Documentos
      const docMap: Record<string, { count: number; category: string }> = {};
      prestamos.forEach((p: any) => {
        p.detalles.forEach((d: any) => {
          const titulo = d.materialBibliografico?.MatBibTit || "Desconocido";
          const catNombre =
            d.materialBibliografico?.categoria?.CatNom || "General";
          if (!docMap[titulo])
            docMap[titulo] = { count: 0, category: catNombre };
          docMap[titulo].count += 1;
        });
      });

      const top5 = Object.entries(docMap)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5);
      const barColors = top5.map(
        ([, info]) => newColorMap[info.category] || "#ccc"
      );

      setGraphData({
        historial: {
          labels: mesesOrdenados,
          data: mesesOrdenados.map((m) => historialMap[m]),
        },
        categorias: { labels: catLabels, data: Object.values(catMap) },
        topDocs: {
          labels: top5.map(([k]) =>
            k.length > 20 ? k.substring(0, 20) + "..." : k
          ),
          data: top5.map(([, v]) => v.count),
          colors: barColors,
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="loading-container">Cargando estadísticas...</div>
    );

  return (
    <div
      className="dashboard-wrapper"
      style={{ padding: "24px", backgroundColor: "#f8f9fa" }}
    >
      {/* SECCIÓN DE CARDS KPI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <StatCard
          title="Total Préstamos"
          value={kpis.totalPrestamos}
          icon="📊"
          color="#B31818"
        />
        <StatCard
          title="Catálogo Actual"
          value={kpis.totalDocs}
          icon="📚"
          color="#2D3748"
        />
        <StatCard
          title="Usuarios Activos"
          value={kpis.totalLectores}
          icon="👤"
          color="#B31818"
        />
        <StatCard
          title="Tasa Morosidad"
          value={`${kpis.tasaMorosidad}%`}
          icon="⚠️"
          color="#E53E3E"
        />
      </div>

      {/* GRILLA DE GRÁFICOS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "24px",
        }}
      >
        {/* Línea de tiempo - Principal */}
        <ChartBox title="Tendencia de Préstamos" span="8">
          <Line
            data={{
              labels: graphData.historial.labels,
              datasets: [
                {
                  label: "Préstamos",
                  data: graphData.historial.data,
                  borderColor: "#B31818",
                  backgroundColor: "rgba(179, 24, 24, 0.05)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartBox>

        {/* Dona - Categorías */}
        <ChartBox title="Distribución por Categoría" span="4">
          <Doughnut
            data={{
              labels: graphData.categorias.labels,
              datasets: [
                {
                  data: graphData.categorias.data,
                  backgroundColor: graphData.categorias.labels.map(
                    (c) => categoryColorMap[c]
                  ),
                  hoverOffset: 10,
                },
              ],
            }}
            options={{
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { usePointStyle: true, padding: 20 },
                },
              },
              maintainAspectRatio: false,
              cutout: "75%",
            }}
          />
        </ChartBox>

        {/* Barras - Top Solicitados */}
        <ChartBox
          title="Documentos más solicitados (por categoría)"
          span="12"
        >
          <Bar
            data={{
              labels: graphData.topDocs.labels,
              datasets: [
                {
                  data: graphData.topDocs.data,
                  backgroundColor: graphData.topDocs.colors,
                  borderRadius: 8,
                  barThickness: 30,
                },
              ],
            }}
            options={{
              indexAxis: "y" as const,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { display: false } },
              },
              maintainAspectRatio: false,
            }}
          />
        </ChartBox>
      </div>
    </div>
  );
}

/* === COMPONENTES INTERNOS DE ESTILO === */

function StatCard({ title, value, icon, color }: any) {
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        borderLeft: `6px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            color: "#718096",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.025em",
          }}
        >
          {title}
        </p>
        <h3
          style={{
            margin: "4px 0 0 0",
            fontSize: "1.875rem",
            fontWeight: 700,
            color: "#1A202C",
          }}
        >
          {value}
        </h3>
      </div>
      <div
        style={{
          fontSize: "2rem",
          backgroundColor: "#F7FAFC",
          padding: "12px",
          borderRadius: "12px",
        }}
      >
        {icon}
      </div>
    </div>
  );
}

function ChartBox({ title, children, span }: any) {
  return (
    <div
      style={{
        gridColumn: `span ${span}`,
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        minHeight: "350px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h4
        style={{
          margin: "0 0 20px 0",
          color: "#2D3748",
          fontSize: "1.1rem",
          fontWeight: 600,
        }}
      >
        {title}
      </h4>
      <div style={{ flex: 1, position: "relative" }}>{children}</div>
    </div>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: "#EDF2F7" },
      border: { display: false },
    },
    x: {
      grid: { display: false },
      border: { display: false },
    },
  },
};