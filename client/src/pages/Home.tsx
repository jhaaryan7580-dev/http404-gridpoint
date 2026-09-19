import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Cloud,
  Command,
  Download,
  GripVertical,
  Info,
  Layers3,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  MousePointer2,
  Navigation,
  PanelTop,
  Play,
  Plus,
  Printer,
  Search,
  Settings2,
  Sparkles,
  Sun,
  Table2,
  TriangleAlert,
  Trash2,
  Upload,
  UserRound,
  Warehouse,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETTE = ["#e87838", "#24a681", "#4a8bf5", "#b487d9", "#d1a72b", "#ef6f92"];
const EARTH_KM_PER_LAT = 111;

type Algorithm = "kmeans" | "kmedoids";
type Tab = "overview" | "assignments" | "hubs" | "curve";
type DatasetKey = "Bengaluru" | "Mumbai" | "Delhi" | "Custom";

type DemandNode = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  orders: number;
};

type Params = {
  k: number;
  algorithm: Algorithm;
  costPerKm: number;
  fixedCost: number;
  useVehicles: boolean;
  useCapacity: boolean;
  capacity: number;
  useRadius: boolean;
  radius: number;
  surge: number;
};

type Point = { lat: number; lon: number };
type ScenarioNode = DemandNode & { adjustedOrders: number };
type Assignment = ScenarioNode & {
  hubId: number;
  distance: number;
  cost: number;
  vehicle: string;
  withinRadius: boolean;
};
type Hub = Point & {
  hubId: number;
  load: number;
  nodeCount: number;
  utilization: number | null;
  overCapacity: boolean;
};

type NetworkResult = {
  scenarioNodes: ScenarioNode[];
  hubs: Hub[];
  assignments: Assignment[];
  deliveryCost: number;
  infraCost: number;
  totalCost: number;
  baselineCost: number;
  savings: number;
  savingsPercent: number;
  totalOrders: number;
  weightedDistance: number;
  totalDistance: number;
  coverage: number;
  uncovered: Assignment[];
  radiusViolations: number;
};

type ThemeAccent = "orange" | "teal" | "violet";
type SavedScenarioRow = { id: number; name: string; dataset: string; payload: string; updatedAt: Date | string };
type SavedSnapshot = { version: 1; nodes: DemandNode[]; params: Params; manualHubs: Point[] | null };

const BENGALURU: DemandNode[] = [
  { id: "indiranagar", name: "Indiranagar", lat: 12.9719, lon: 77.6412, orders: 420 },
  { id: "koramangala", name: "Koramangala", lat: 12.9352, lon: 77.6245, orders: 610 },
  { id: "whitefield", name: "Whitefield", lat: 12.9698, lon: 77.75, orders: 380 },
  { id: "electronic-city", name: "Electronic City", lat: 12.8452, lon: 77.6602, orders: 340 },
  { id: "jayanagar", name: "Jayanagar", lat: 12.925, lon: 77.5938, orders: 290 },
  { id: "malleshwaram", name: "Malleshwaram", lat: 13.0035, lon: 77.5709, orders: 260 },
  { id: "hsr-layout", name: "HSR Layout", lat: 12.9116, lon: 77.6389, orders: 470 },
  { id: "marathahalli", name: "Marathahalli", lat: 12.9569, lon: 77.7011, orders: 410 },
  { id: "basavanagudi", name: "Basavanagudi", lat: 12.9422, lon: 77.576, orders: 220 },
  { id: "yelahanka", name: "Yelahanka", lat: 13.1007, lon: 77.5963, orders: 180 },
  { id: "btm-layout", name: "BTM Layout", lat: 12.9166, lon: 77.6101, orders: 350 },
  { id: "hebbal", name: "Hebbal", lat: 13.0358, lon: 77.597, orders: 240 },
  { id: "rt-nagar", name: "RT Nagar", lat: 13.018, lon: 77.594, orders: 150 },
  { id: "banashankari", name: "Banashankari", lat: 12.925, lon: 77.554, orders: 200 },
  { id: "bellandur", name: "Bellandur", lat: 12.9257, lon: 77.6761, orders: 330 },
];

const MUMBAI: DemandNode[] = [
  { id: "andheri-west", name: "Andheri West", lat: 19.1364, lon: 72.8296, orders: 620 },
  { id: "andheri-east", name: "Andheri East", lat: 19.1197, lon: 72.8468, orders: 520 },
  { id: "bandra-west", name: "Bandra West", lat: 19.0596, lon: 72.8295, orders: 590 },
  { id: "powai", name: "Powai", lat: 19.1176, lon: 72.906, orders: 410 },
  { id: "ghatkopar", name: "Ghatkopar", lat: 19.0862, lon: 72.9081, orders: 390 },
  { id: "chembur", name: "Chembur", lat: 19.0522, lon: 72.8995, orders: 320 },
  { id: "worli", name: "Worli", lat: 19.0176, lon: 72.8164, orders: 440 },
  { id: "lower-parel", name: "Lower Parel", lat: 18.9988, lon: 72.8308, orders: 470 },
  { id: "dadar", name: "Dadar", lat: 19.0181, lon: 72.8428, orders: 360 },
  { id: "vile-parle", name: "Vile Parle", lat: 19.1003, lon: 72.8419, orders: 340 },
  { id: "malad", name: "Malad", lat: 19.1862, lon: 72.8487, orders: 380 },
  { id: "borivali", name: "Borivali", lat: 19.2307, lon: 72.8567, orders: 260 },
  { id: "mulund", name: "Mulund", lat: 19.1726, lon: 72.9562, orders: 230 },
  { id: "kurla", name: "Kurla", lat: 19.0726, lon: 72.8826, orders: 300 },
];

const DELHI: DemandNode[] = [
  { id: "connaught-place", name: "Connaught Place", lat: 28.6315, lon: 77.2167, orders: 610 },
  { id: "hauz-khas", name: "Hauz Khas", lat: 28.5494, lon: 77.2001, orders: 430 },
  { id: "saket", name: "Saket", lat: 28.5245, lon: 77.2066, orders: 410 },
  { id: "dwarka", name: "Dwarka", lat: 28.5921, lon: 77.046, orders: 470 },
  { id: "rohini", name: "Rohini", lat: 28.7495, lon: 77.0565, orders: 350 },
  { id: "pitampura", name: "Pitampura", lat: 28.7037, lon: 77.132, orders: 290 },
  { id: "karol-bagh", name: "Karol Bagh", lat: 28.6517, lon: 77.1907, orders: 370 },
  { id: "lajpat-nagar", name: "Lajpat Nagar", lat: 28.5677, lon: 77.2432, orders: 390 },
  { id: "mayur-vihar", name: "Mayur Vihar", lat: 28.6083, lon: 77.2965, orders: 340 },
  { id: "preet-vihar", name: "Preet Vihar", lat: 28.6405, lon: 77.2949, orders: 250 },
  { id: "shahdara", name: "Shahdara", lat: 28.6733, lon: 77.289, orders: 280 },
  { id: "janakpuri", name: "Janakpuri", lat: 28.6219, lon: 77.0878, orders: 330 },
  { id: "vasant-kunj", name: "Vasant Kunj", lat: 28.5284, lon: 77.1517, orders: 300 },
  { id: "model-town", name: "Model Town", lat: 28.7041, lon: 77.1908, orders: 240 },
  { id: "nizamuddin", name: "Nizamuddin", lat: 28.591, lon: 77.2446, orders: 310 },
];

const DATASETS: Record<Exclude<DatasetKey, "Custom">, DemandNode[]> = { Bengaluru: BENGALURU, Mumbai: MUMBAI, Delhi: DELHI };

const DEFAULT_PARAMS: Params = {
  k: 3,
  algorithm: "kmeans",
  costPerKm: 2,
  fixedCost: 500,
  useVehicles: false,
  useCapacity: false,
  capacity: 1800,
  useRadius: true,
  radius: 8,
  surge: 0,
};

const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const oneDecimal = (value: number) => Number(value.toFixed(1));
const cloneNodes = (nodes: DemandNode[]) => nodes.map((node) => ({ ...node }));

function distanceKm(a: Point, b: Point) {
  const latKm = (a.lat - b.lat) * EARTH_KM_PER_LAT;
  const lonKm = (a.lon - b.lon) * EARTH_KM_PER_LAT * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return Math.sqrt(latKm * latKm + lonKm * lonKm);
}

function weightedCentroid(nodes: Array<DemandNode & { adjustedOrders?: number }>): Point {
  const total = nodes.reduce((sum, node) => sum + (node.adjustedOrders ?? node.orders), 0) || 1;
  return {
    lat: nodes.reduce((sum, node) => sum + node.lat * (node.adjustedOrders ?? node.orders), 0) / total,
    lon: nodes.reduce((sum, node) => sum + node.lon * (node.adjustedOrders ?? node.orders), 0) / total,
  };
}

function buildCenters(nodes: ScenarioNode[], k: number, algorithm: Algorithm) {
  const count = Math.max(1, Math.min(k, nodes.length));
  const ranked = [...nodes].sort((a, b) => b.adjustedOrders - a.adjustedOrders);
  const centers: Point[] = [{ lat: ranked[0].lat, lon: ranked[0].lon }];
  while (centers.length < count) {
    let candidate = ranked[0];
    let score = -Infinity;
    for (const node of nodes) {
      const nearest = Math.min(...centers.map((center) => distanceKm(node, center)));
      const nextScore = nearest * nearest * node.adjustedOrders;
      if (nextScore > score) { score = nextScore; candidate = node; }
    }
    centers.push({ lat: candidate.lat, lon: candidate.lon });
  }
  for (let iteration = 0; iteration < 32; iteration += 1) {
    const clusters = centers.map(() => [] as ScenarioNode[]);
    nodes.forEach((node) => {
      const nearestId = centers.reduce((best, center, idx) => distanceKm(node, center) < distanceKm(node, centers[best]) ? idx : best, 0);
      clusters[nearestId].push(node);
    });
    centers.forEach((center, idx) => {
      if (clusters[idx].length) Object.assign(center, weightedCentroid(clusters[idx]));
    });
  }
  if (algorithm === "kmedoids") {
    const used = new Set<string>();
    return centers.map((center) => {
      const available = nodes.filter((node) => !used.has(node.id));
      const closest = available.reduce((best, node) => distanceKm(node, center) < distanceKm(best, center) ? node : best, available[0]);
      used.add(closest.id);
      return { lat: closest.lat, lon: closest.lon };
    });
  }
  return centers;
}

function solveNetwork(nodes: DemandNode[], params: Params, centerOverride: Point[] | null = null): NetworkResult {
  const scenarioNodes = nodes.map((node) => ({ ...node, adjustedOrders: Math.round(node.orders * (1 + params.surge / 100)) }));
  const useOverride = centerOverride && centerOverride.length === Math.min(params.k, nodes.length);
  const centers = useOverride ? centerOverride!.map((center) => ({ ...center })) : buildCenters(scenarioNodes, params.k, params.algorithm);
  const loads = centers.map(() => 0);
  const assignments: Assignment[] = [];
  [...scenarioNodes].sort((a, b) => b.adjustedOrders - a.adjustedOrders).forEach((node) => {
    const ranked = centers.map((center, hubId) => ({ hubId, distance: distanceKm(node, center) })).sort((a, b) => a.distance - b.distance);
    const eligible = params.useCapacity ? ranked.find((choice) => loads[choice.hubId] + node.adjustedOrders <= params.capacity) : ranked[0];
    const chosen = eligible || ranked[0];
    loads[chosen.hubId] += node.adjustedOrders;
    const withinRadius = !params.useRadius || chosen.distance <= params.radius;
    const vehicle = params.useVehicles ? chosen.distance <= 5 ? "Bike" : chosen.distance <= 15 ? "Van" : "Truck" : "Standard";
    const rate = params.useVehicles ? vehicle === "Bike" ? 4 : vehicle === "Van" ? 7 : 12 : params.costPerKm;
    assignments.push({ ...node, hubId: chosen.hubId, distance: chosen.distance, cost: chosen.distance * rate * node.adjustedOrders, vehicle, withinRadius });
  });
  assignments.sort((a, b) => nodes.findIndex((node) => node.id === a.id) - nodes.findIndex((node) => node.id === b.id));
  const hubs: Hub[] = centers.map((center, hubId) => ({
    ...center,
    hubId,
    load: loads[hubId],
    nodeCount: assignments.filter((assignment) => assignment.hubId === hubId).length,
    utilization: params.useCapacity ? (loads[hubId] / params.capacity) * 100 : null,
    overCapacity: params.useCapacity && loads[hubId] > params.capacity,
  }));
  const deliveryCost = assignments.reduce((sum, assignment) => sum + assignment.cost, 0);
  const infraCost = params.fixedCost * centers.length;
  const totalOrders = scenarioNodes.reduce((sum, node) => sum + node.adjustedOrders, 0);
  const weightedDistance = assignments.reduce((sum, assignment) => sum + assignment.distance * assignment.adjustedOrders, 0) / totalOrders;
  const baselineCenter = weightedCentroid(scenarioNodes);
  const baselineDelivery = scenarioNodes.reduce((sum, node) => {
    const distance = distanceKm(node, baselineCenter);
    const rate = params.useVehicles ? distance <= 5 ? 4 : distance <= 15 ? 7 : 12 : params.costPerKm;
    return sum + distance * rate * node.adjustedOrders;
  }, 0);
  const baselineCost = baselineDelivery + params.fixedCost;
  const totalCost = deliveryCost + infraCost;
  const uncovered = assignments.filter((assignment) => !assignment.withinRadius);
  return {
    scenarioNodes, hubs, assignments, deliveryCost, infraCost, totalCost, baselineCost,
    savings: baselineCost - totalCost,
    savingsPercent: baselineCost ? ((baselineCost - totalCost) / baselineCost) * 100 : 0,
    totalOrders,
    weightedDistance,
    totalDistance: assignments.reduce((sum, assignment) => sum + assignment.distance, 0),
    coverage: params.useRadius ? ((assignments.length - uncovered.length) / assignments.length) * 100 : 100,
    uncovered,
    radiusViolations: uncovered.length,
  };
}

function buildCurve(nodes: DemandNode[], params: Params) {
  const maximum = Math.min(6, nodes.length);
  return Array.from({ length: maximum }, (_, index) => {
    const result = solveNetwork(nodes, { ...params, k: index + 1, useCapacity: false, useRadius: false });
    return { k: index + 1, delivery: Math.round(result.deliveryCost), infrastructure: Math.round(result.infraCost), total: Math.round(result.totalCost) };
  });
}

function Metric({ label, value, detail, tone = "", tooltip }: { label: string; value: string; detail: string; tone?: string; tooltip?: string }) {
  return <div className={`metric ${tone}`}><span>{label}{tooltip && <i className="metric-info" tabIndex={0} aria-label={tooltip}><Info size={11} /><em>{tooltip}</em></i>}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function normalizeCsvHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseCsvMatrix(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(cell); cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else {
      cell += character;
    }
  }
  if (cell || row.length) { row.push(cell); if (row.some((value) => value.trim())) rows.push(row); }
  return rows;
}

function parseDemandCsv(text: string): DemandNode[] {
  const rows = parseCsvMatrix(text);
  const headers = rows.shift()?.map(normalizeCsvHeader) || [];
  const findColumn = (aliases: string[]) => aliases.map((alias) => headers.indexOf(alias)).find((index) => index >= 0) ?? -1;
  const nameIndex = findColumn(["name", "neighborhood", "neighbourhood", "node", "location", "demand_node"]);
  const latIndex = findColumn(["lat", "latitude"]);
  const lonIndex = findColumn(["lon", "lng", "longitude"]);
  const orderIndex = findColumn(["orders", "daily_orders", "orders_day", "demand", "volume"]);
  if ([nameIndex, latIndex, lonIndex, orderIndex].some((index) => index < 0)) return [];
  return rows.map((values, index) => {
    const numberValue = (column: number) => Number((values[column] || "").trim().replace(/,/g, ""));
    return { id: `upload-${Date.now()}-${index}`, name: (values[nameIndex] || "").trim(), lat: numberValue(latIndex), lon: numberValue(lonIndex), orders: numberValue(orderIndex) };
  }).filter((row) => row.name && Number.isFinite(row.lat) && Number.isFinite(row.lon) && Number.isFinite(row.orders) && row.orders >= 0);
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = href; anchor.download = filename; anchor.click(); URL.revokeObjectURL(href);
}

function MapPlot({
  nodes, hubs, assignments, radius, locationName, dragHubId, onHubDrag, onHubDragEnd, isRecalculating, showRoutes, showZones,
}: {
  nodes: ScenarioNode[]; hubs: Hub[]; assignments: Assignment[]; radius: number | null; locationName: string;
  dragHubId: number | null; onHubDrag: (hubId: number, point: Point) => void; onHubDragEnd: () => void; isRecalculating: boolean; showRoutes: boolean; showZones: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lats = nodes.map((node) => node.lat); const lons = nodes.map((node) => node.lon);
  const minLat = Math.min(...lats) - 0.02; const maxLat = Math.max(...lats) + 0.02;
  const minLon = Math.min(...lons) - 0.02; const maxLon = Math.max(...lons) + 0.02;
  const locate = (point: Point) => ({ x: 7 + ((point.lon - minLon) / (maxLon - minLon)) * 86, y: 92 - ((point.lat - minLat) / (maxLat - minLat)) * 84 });
  const maxOrders = Math.max(...nodes.map((node) => node.adjustedOrders));
  const toPoint = (event: Pick<ReactPointerEvent<SVGSVGElement>, "clientX" | "clientY">): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { lat: minLat, lon: minLon };
    const x = Math.max(7, Math.min(93, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(8, Math.min(92, ((event.clientY - rect.top) / rect.height) * 100));
    return { lon: minLon + ((x - 7) / 86) * (maxLon - minLon), lat: minLat + ((92 - y) / 84) * (maxLat - minLat) };
  };
  const hubRadius = (hubId: number) => Math.max(3, ...assignments.filter((assignment) => assignment.hubId === hubId).map((assignment) => assignment.distance + 1));
  return <div className="map-shell">
    <div className="map-grid map-grid-a" /><div className="map-grid map-grid-b" /><div className="map-label north">NORTH DISTRICT</div><div className="map-label south">SOUTH CORRIDOR</div><div className="map-label east">EAST DEMAND BELT</div>
    <div className="drag-hint"><MousePointer2 size={13} /><span>Drag a hub to test sensitivity</span></div>
    {isRecalculating && <div className="recalculating"><Activity size={13} /><span>Recalculating…</span></div>}
    <svg ref={svgRef} className="network-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Demand nodes and proposed warehouse hubs" onPointerMove={(event) => { if (dragHubId !== null) onHubDrag(dragHubId, toPoint(event)); }} onPointerUp={onHubDragEnd} onPointerCancel={onHubDragEnd}>
      {showZones && hubs.map((hub) => {
        const { x, y } = locate(hub); const maxDistance = hubRadius(hub.hubId);
        const rx = Math.min(26, (maxDistance / (maxLon - minLon) / (EARTH_KM_PER_LAT * Math.cos(hub.lat * Math.PI / 180))) * 86 * 1.14);
        const ry = Math.min(26, (maxDistance / (maxLat - minLat) / EARTH_KM_PER_LAT) * 84 * 1.14);
        return <ellipse key={`zone-${hub.hubId}`} cx={x} cy={y} rx={rx} ry={ry} className="catchment-zone" style={{ fill: PALETTE[hub.hubId % PALETTE.length] }} />;
      })}
      {radius && hubs.map((hub) => { const { x, y } = locate(hub); const radiusPercent = (radius / (maxLat - minLat) / EARTH_KM_PER_LAT) * 84; return <circle key={`ring-${hub.hubId}`} cx={x} cy={y} r={radiusPercent} className="radius-ring" style={{ stroke: PALETTE[hub.hubId % PALETTE.length] }} />; })}
      {showRoutes && assignments.map((assignment) => { const node = locate(assignment); const hub = locate(hubs[assignment.hubId]); return <line key={`route-${assignment.id}`} x1={node.x} y1={node.y} x2={hub.x} y2={hub.y} className={assignment.withinRadius ? "route-line" : "route-line out-of-range"} style={{ stroke: PALETTE[assignment.hubId % PALETTE.length] }} />; })}
      {nodes.map((node) => { const { x, y } = locate(node); const assignment = assignments.find((item) => item.id === node.id); const nodeRadius = 1.2 + (node.adjustedOrders / maxOrders) * 2.25; return <g key={node.id}><circle cx={x} cy={y} r={nodeRadius + .75} className={assignment?.withinRadius ? "node-halo" : "node-halo violation-halo"} /><circle cx={x} cy={y} r={nodeRadius} className={assignment?.withinRadius ? "demand-node" : "demand-node violation-node"} style={{ fill: assignment?.withinRadius ? PALETTE[assignment.hubId % PALETTE.length] : "#c9575f" }} /><title>{node.name}: {node.adjustedOrders} orders/day · H{(assignment?.hubId || 0) + 1}</title></g>; })}
      {hubs.map((hub) => { const { x, y } = locate(hub); return <g key={`hub-${hub.hubId}`} className={`draggable-hub ${dragHubId === hub.hubId ? "dragging" : ""}`} onPointerDown={(event) => { event.stopPropagation(); try { svgRef.current?.setPointerCapture(event.pointerId); } catch { /* synthetic pointer events do not have captureable hardware pointers */ } onHubDrag(hub.hubId, toPoint(event)); }}><rect x={x - 2.75} y={y - 2.75} width="5.5" height="5.5" rx=".85" className="hub-marker" style={{ fill: PALETTE[hub.hubId % PALETTE.length] }} /><GripVertical x={x - 1.25} y={y - 1.1} width="2.5" height="2.5" className="hub-grip" /><text x={x} y={y + .7} className="hub-text">H{hub.hubId + 1}</text><title>Drag H{hub.hubId + 1} to reposition this warehouse</title></g>; })}
    </svg>
    <div className="map-compass"><Navigation size={15} /> <span>{locationName} · local planning grid</span></div>
    <div className="map-legend"><span><i className="legend-node" /> Assigned demand</span><span><i className="legend-hub" /> Draggable hub</span>{radius && <span><i className="legend-radius" /> {radius} km radius</span>}</div>
  </div>;
}

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();

  const [nodes, setNodes] = useState<DemandNode[]>(cloneNodes(BENGALURU));
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [dataset, setDataset] = useState<DatasetKey>("Bengaluru");
  const [manualHubs, setManualHubs] = useState<Point[] | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [runStamp, setRunStamp] = useState(() => new Date());
  const [dragHubId, setDragHubId] = useState<number | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [accent, setAccent] = useState<ThemeAccent>(() => (localStorage.getItem("gridpoint-accent") as ThemeAccent) || "orange");
  const [isTourOpen, setIsTourOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recalculationTimer = useRef<number | null>(null);
  const scenarioQuery = trpc.scenario.list.useQuery(undefined, { enabled: isAuthenticated, retry: false, refetchOnWindowFocus: false });
  const saveScenarioMutation = trpc.scenario.save.useMutation({ onSuccess: () => { utils.scenario.list.invalidate(); toast.success("Scenario saved to your cloud workspace"); setScenarioName(""); }, onError: () => toast.error("Unable to save this scenario. Please try again.") });
  const deleteScenarioMutation = trpc.scenario.delete.useMutation({ onSuccess: () => { utils.scenario.list.invalidate(); toast.success("Scenario removed"); }, onError: () => toast.error("Unable to remove this scenario. Please try again.") });
  const result = useMemo(() => solveNetwork(nodes, params, manualHubs), [nodes, params, manualHubs]);
  const curve = useMemo(() => buildCurve(nodes, params), [nodes, params]);
  const scenarioComparison = useMemo(() => [0, 15, 30].map((surge) => ({ surge, ...solveNetwork(nodes, { ...params, surge }, manualHubs) })), [nodes, params, manualHubs]);
  const optimalCurve = curve.reduce((best, point) => point.total < best.total ? point : best, curve[0]);
  const activeRadius = params.useRadius ? params.radius : null;
  const highestCostNode = useMemo(() => [...result.assignments].sort((a, b) => b.cost - a.cost)[0], [result.assignments]);
  const readinessScore = Math.max(0, Math.min(100, Math.round(result.coverage - (result.hubs.some((hub) => hub.overCapacity) ? 15 : 0) + Math.min(10, Math.max(0, result.savingsPercent / 8)))));
  const savedRows = (scenarioQuery.data ?? []) as SavedScenarioRow[];

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    localStorage.setItem("gridpoint-accent", accent);
  }, [accent]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); }
      if (event.key === "Escape") { setCommandOpen(false); setWorkspaceOpen(false); setSettingsOpen(false); setIsTourOpen(false); }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const updateParams = (patch: Partial<Params>) => setParams((current) => ({ ...current, ...patch }));
  const updateNode = (id: string, patch: Partial<DemandNode>) => { setDataset("Custom"); setManualHubs(null); setNodes((current) => current.map((node) => node.id === id ? { ...node, ...patch } : node)); };
  const addNode = () => { setDataset("Custom"); setManualHubs(null); setNodes((current) => [...current, { id: `node-${Date.now()}`, name: `New node ${current.length + 1}`, lat: 12.97, lon: 77.61, orders: 100 }]); };
  const removeNode = (id: string) => { setDataset("Custom"); setManualHubs(null); setNodes((current) => current.length > 2 ? current.filter((node) => node.id !== id) : current); };
  const runModel = () => { setManualHubs(null); setRunStamp(new Date()); };
  const finishRecalculation = () => { setDragHubId(null); window.setTimeout(() => setIsRecalculating(false), 180); };
  const moveHub = (hubId: number, point: Point) => {
    setDragHubId(hubId); setIsRecalculating(true);
    setManualHubs((current) => {
      const base = current && current.length === result.hubs.length ? current : result.hubs.map((hub) => ({ lat: hub.lat, lon: hub.lon }));
      return base.map((hub, index) => index === hubId ? point : hub);
    });
    if (recalculationTimer.current) window.clearTimeout(recalculationTimer.current);
    recalculationTimer.current = window.setTimeout(() => setIsRecalculating(false), 260);
    setRunStamp(new Date());
  };

  const loadPreset = (name: Exclude<DatasetKey, "Custom">) => {
    const next = cloneNodes(DATASETS[name]);
    setNodes(next); setDataset(name); setManualHubs(null); setParams((current) => ({ ...current, k: Math.min(3, next.length), surge: 0 })); setRunStamp(new Date());
  };

  const uploadCsv = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseDemandCsv(String(reader.result || ""));
      if (parsed.length < 2) {
        toast.error("CSV needs at least two valid rows with name, lat, lon, and orders columns.");
        return;
      }
      setNodes(parsed); setDataset("Custom"); setManualHubs(null); setParams((current) => ({ ...current, k: Math.min(current.k, parsed.length) })); setRunStamp(new Date());
      toast.success(`Loaded ${parsed.length} demand nodes from ${file.name}`);
    };
    reader.onerror = () => toast.error("Could not read that CSV file. Please try again.");
    reader.readAsText(file); event.target.value = "";
  };

  const exportAssignments = () => downloadCsv("gridpoint-assignments.csv", ["Neighborhood", "Lat", "Lon", "Orders", "Assigned Hub", "Distance to Hub"], result.assignments.map((assignment) => [assignment.name, assignment.lat, assignment.lon, assignment.adjustedOrders, `H${assignment.hubId + 1}`, oneDecimal(assignment.distance)]));
  const exportCostSummary = () => downloadCsv("gridpoint-cost-summary.csv", ["Metric", "Value"], [["Dataset", dataset], ["Demand scenario", params.surge ? `+${params.surge}%` : "Base"], ["Number of hubs", result.hubs.length], ["Total cost", money(result.totalCost)], ["Delivery cost", money(result.deliveryCost)], ["Infrastructure / fixed cost", money(result.infraCost)], ["Single hub baseline", money(result.baselineCost)], ["Savings vs. single hub", `${oneDecimal(result.savingsPercent)}%`], ["Weighted average leg", `${oneDecimal(result.weightedDistance)} km`], ["Max service radius", `${params.radius} km`], ["Radius violations", result.radiusViolations], ["Service level", `${oneDecimal(result.coverage)}%`]]);
  const generateReport = () => {
    const report = window.open("", "_blank", "noopener,noreferrer"); if (!report) return;
    const rows = result.assignments.map((assignment) => `<tr><td>${assignment.name}</td><td>H${assignment.hubId + 1}</td><td>${oneDecimal(assignment.distance)} km</td><td>${assignment.adjustedOrders.toLocaleString()}</td></tr>`).join("");
    report.document.write(`<!doctype html><html><head><title>HTTP 404 decision report</title><style>body{font-family:Arial,sans-serif;color:#1d2b24;margin:42px}h1{font-size:30px;margin:0 0 6px}p{color:#64736a}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0}.card{border:1px solid #dbe1da;border-radius:9px;padding:15px}.label{color:#778179;font-size:11px;text-transform:uppercase;letter-spacing:.08em}.value{font-size:23px;font-weight:700;margin-top:5px}table{width:100%;border-collapse:collapse;margin-top:22px}th,td{padding:9px;border-bottom:1px solid #dbe1da;text-align:left;font-size:12px}th{color:#778179;font-size:10px;text-transform:uppercase}@media print{body{margin:24px}}</style></head><body><div class="label">HTTP 404 · DECISION REPORT</div><h1>${dataset} warehouse network</h1><p>${params.surge ? `Peak demand +${params.surge}%` : "Base demand"} · ${result.totalOrders.toLocaleString()} daily orders · ${result.hubs.length} hubs</p><section class="grid"><div class="card"><div class="label">Total cost</div><div class="value">${money(result.totalCost)}</div></div><div class="card"><div class="label">Modeled savings</div><div class="value">${oneDecimal(result.savingsPercent)}%</div></div><div class="card"><div class="label">Service level</div><div class="value">${oneDecimal(result.coverage)}%</div></div><div class="card"><div class="label">Delivery cost</div><div class="value">${money(result.deliveryCost)}</div></div><div class="card"><div class="label">Infrastructure</div><div class="value">${money(result.infraCost)}</div></div><div class="card"><div class="label">Weighted avg. leg</div><div class="value">${oneDecimal(result.weightedDistance)} km</div></div></section><h2>Assignment audit</h2><table><thead><tr><th>Neighborhood</th><th>Assigned hub</th><th>Distance</th><th>Orders</th></tr></thead><tbody>${rows}</tbody></table><p>Model assumptions: weighted k-means, local Euclidean distance, fixed cost per hub, and daily order volume as demand weight.</p></body></html>`);
    report.document.close(); window.setTimeout(() => report.print(), 250);
  };

  const currentSnapshot = (): SavedSnapshot => ({ version: 1, nodes: cloneNodes(nodes), params: { ...params }, manualHubs: manualHubs?.map((hub) => ({ ...hub })) ?? null });
  const saveScenario = () => {
    if (!isAuthenticated) { toast.info("Sign in to save this network across devices"); startLogin(); return; }
    const name = scenarioName.trim() || `${dataset} · ${params.surge ? `+${params.surge}% demand` : "Base network"}`;
    saveScenarioMutation.mutate({ name, dataset, snapshot: currentSnapshot() });
  };
  const restoreScenario = (row: SavedScenarioRow) => {
    try {
      const snapshot = JSON.parse(row.payload) as SavedSnapshot;
      if (snapshot.version !== 1 || !Array.isArray(snapshot.nodes) || !snapshot.params) throw new Error("Unsupported scenario");
      setNodes(snapshot.nodes); setParams(snapshot.params); setManualHubs(snapshot.manualHubs); setDataset(["Bengaluru", "Mumbai", "Delhi"].includes(row.dataset) ? row.dataset as DatasetKey : "Custom"); setRunStamp(new Date()); setWorkspaceOpen(false);
      toast.success(`Loaded “${row.name}”`);
    } catch { toast.error("This saved scenario cannot be restored"); }
  };
  const handleLogout = async () => { await logout(); toast.success("Signed out of HTTP 404"); };
  const openCommand = (action: () => void) => { action(); setCommandOpen(false); };

  return <div className="site-shell" data-accent={accent}>
    <aside className="control-rail">
      <div className="rail-top"><a href="#top" className="brand" aria-label="HTTP 404 home"><span className="brand-sigil">⌁</span><span><b>HTTP 404</b><small>NETWORK DESIGN LAB</small></span></a><div className="rail-actions"><button className="icon-button" aria-label="Open command search" onClick={() => setCommandOpen(true)}><Search size={14} /></button><button className="avatar-button" aria-label="Open workspace" onClick={() => setWorkspaceOpen(true)}>{isAuthenticated ? (user?.name?.slice(0, 1).toUpperCase() || "U") : <UserRound size={14} />}</button></div></div>
      <div className="rail-intro"><span className="eyebrow">MODEL CONTROLS</span><p>Build an explainable network plan from raw demand data.</p></div>
      <section className="rail-section">
        <div className="section-title"><span>01 / demand map</span><h2>Demand nodes</h2></div>
        <div className="rail-stats"><div><b>{nodes.length}</b><span>nodes</span></div><div><b>{Math.round(nodes.reduce((sum, node) => sum + node.orders, 0)).toLocaleString()}</b><span>orders/day</span></div></div>
        <div className="preset-row" aria-label="Sample dataset presets">{(["Bengaluru", "Mumbai", "Delhi"] as const).map((name) => <button key={name} className={dataset === name ? "active" : ""} onClick={() => loadPreset(name)}>Load {name}</button>)}</div>
        <input className="sr-only" ref={fileRef} type="file" accept=".csv" onChange={uploadCsv} />
        <button className="upload-button" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload CSV <small>name · lat · lon · orders</small></button>
        <div className="node-table-wrap"><table className="node-table"><thead><tr><th>node</th><th>lat</th><th>lon</th><th>orders</th><th /></tr></thead><tbody>{nodes.map((node) => <tr key={node.id}><td><input aria-label={`${node.name} name`} value={node.name} onChange={(event) => updateNode(node.id, { name: event.target.value })} /></td><td><input aria-label={`${node.name} latitude`} value={node.lat} onChange={(event) => updateNode(node.id, { lat: Number(event.target.value) || 0 })} /></td><td><input aria-label={`${node.name} longitude`} value={node.lon} onChange={(event) => updateNode(node.id, { lon: Number(event.target.value) || 0 })} /></td><td><input aria-label={`${node.name} orders`} value={node.orders} onChange={(event) => updateNode(node.id, { orders: Number(event.target.value) || 0 })} /></td><td><button className="remove-node" onClick={() => removeNode(node.id)} aria-label={`Remove ${node.name}`}><X size={12} /></button></td></tr>)}</tbody></table></div>
        <button className="add-node" onClick={addNode}><Plus size={13} /> Add demand node</button>
      </section>
      <section className="rail-section">
        <div className="section-title"><span>02 / network</span><h2>Hub strategy</h2></div>
        <label className="control-label">Number of warehouses <b>{params.k}</b></label>
        <input className="range-control" type="range" min="1" max={Math.min(8, nodes.length)} value={Math.min(params.k, nodes.length)} onChange={(event) => { setManualHubs(null); updateParams({ k: Number(event.target.value) }); }} />
        <div className="range-labels"><span>1 hub</span><span>{Math.min(8, nodes.length)} hubs</span></div>
        <label className="control-label top-gap">Placement logic</label>
        <select value={params.algorithm} onChange={(event) => { setManualHubs(null); updateParams({ algorithm: event.target.value as Algorithm }); }}><option value="kmeans">Optimal point · weighted k-means</option><option value="kmedoids">Existing node · weighted k-medoids</option></select>
        {manualHubs && <div className="manual-mode"><MousePointer2 size={12} /><span>Manual hub positions active</span><button onClick={runModel}>Reset</button></div>}
      </section>
      <section className="rail-section">
        <div className="section-title"><span>03 / economics</span><h2>Cost model</h2></div>
        <div className="inline-controls"><label><span>Delivery ₹ / km / order</span><input type="number" min="0" step=".5" value={params.costPerKm} onChange={(event) => updateParams({ costPerKm: Number(event.target.value) || 0 })} /></label><label><span>Fixed ₹ / hub</span><input type="number" min="0" step="100" value={params.fixedCost} onChange={(event) => updateParams({ fixedCost: Number(event.target.value) || 0 })} /></label></div>
        <label className="toggle-control"><input type="checkbox" checked={params.useVehicles} onChange={(event) => updateParams({ useVehicles: event.target.checked })} /><span><b>Use vehicle mix</b><small>Bike, van, and truck rate selection</small></span></label>
      </section>
      <section className="rail-section">
        <div className="section-title"><span>04 / resilience</span><h2>Guardrails</h2></div>
        <label className="toggle-control"><input type="checkbox" checked={params.useCapacity} onChange={(event) => updateParams({ useCapacity: event.target.checked })} /><span><b>Warehouse capacity</b><small>Keep demand within hub limits</small></span></label>
        {params.useCapacity && <label className="reveal-field"><span>Maximum orders / hub</span><input type="number" min="1" step="50" value={params.capacity} onChange={(event) => updateParams({ capacity: Number(event.target.value) || 1 })} /></label>}
        <label className="toggle-control"><input type="checkbox" checked={params.useRadius} onChange={(event) => updateParams({ useRadius: event.target.checked })} /><span><b>Service radius analysis</b><small>Highlight nodes outside the ring</small></span></label>
        <label className="radius-slider"><span>Max Service Radius (km)</span><b>{params.radius} km</b><input className="range-control" type="range" min="3" max="15" value={params.radius} onChange={(event) => updateParams({ radius: Number(event.target.value) })} /><small>3 km</small><small>15 km</small></label>
      </section>
      <section className="rail-section">
        <div className="section-title"><span>05 / scenario</span><h2>Demand stress test</h2></div>
        <div className="scenario-switcher">{[0, 15, 30].map((value) => <button key={value} className={params.surge === value ? "active" : ""} onClick={() => updateParams({ surge: value })}>{value === 0 ? "Base" : `+${value}%`}</button>)}</div>
        <p className="helper-copy">Apply a peak-day profile without changing the geography.</p>
      </section>
      <section className="rail-section workspace-rail"><div className="section-title"><span>06 / workspace</span><h2>Cloud decisions</h2></div><p className="helper-copy">{isAuthenticated ? `Signed in as ${user?.name || "your team account"}` : "Sign in to preserve scenarios across devices."}</p><button className="workspace-button" onClick={() => isAuthenticated ? setWorkspaceOpen(true) : startLogin()}>{isAuthenticated ? <><Cloud size={13} /> Open scenario library</> : <><LogIn size={13} /> Sign in to save work</>}</button><div className="layer-toggle-row"><span><Layers3 size={12} /> Map layers</span><button className={showRoutes ? "active" : ""} onClick={() => setShowRoutes((current) => !current)}>Routes</button><button className={showZones ? "active" : ""} onClick={() => setShowZones((current) => !current)}>Zones</button></div></section>
      <section className="rail-section export-section"><div className="section-title"><span>07 / handoff</span><h2>Exports</h2></div><button className="export-button" onClick={exportAssignments}><Download size={13} /> Download Assignments CSV</button><button className="export-button" onClick={exportCostSummary}><Download size={13} /> Download Cost Summary CSV</button><button className="export-button report" onClick={generateReport}><Printer size={13} /> Generate Decision Report</button></section>
      <div className="run-area"><button className="run-button" onClick={runModel}><span><Play size={14} fill="currentColor" /> Run optimization</span><ChevronRight size={18} /></button><button className="tour-link" onClick={() => setIsTourOpen(true)}><Sparkles size={12} /> 90-second decision playbook</button></div>
    </aside>
    <main id="top" className="workspace">
      <header className="topbar"><div className="crumb"><span className="desktop-only">HTTP 404</span><ChevronRight size={12} /><span>NETWORK DESIGN</span></div><div className="topbar-tools"><button className="command-button" onClick={() => setCommandOpen(true)}><Search size={13} /><span>Search actions</span><kbd>⌘ K</kbd></button><button className="icon-button" aria-label="Toggle dark or light mode" onClick={toggleTheme}>{theme === "light" ? <Moon size={14} /> : <Sun size={14} />}</button><button className="account-button" onClick={() => isAuthenticated ? setWorkspaceOpen(true) : startLogin()}>{authLoading ? "Checking account…" : isAuthenticated ? <><span className="account-initial">{user?.name?.slice(0, 1).toUpperCase() || "U"}</span>{user?.name || "Workspace"}</> : <><LogIn size={13} /> Sign in</>}</button><div className="status"><i /><span className="status-label desktop-only">Live model</span><span className="status-separator" aria-hidden="true" /><time>{runStamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></div></header>
      <div className="hero"><div><span className="eyebrow">WAREHOUSE NETWORK PLANNER <b>•</b> DECISION COCKPIT</span><h1>Find the lowest-friction<br />delivery network.</h1><p>Place hubs where demand is dense, keep the last mile short, and make every infrastructure trade-off visible before you commit.</p></div><div className="scenario-card"><div><Activity size={14} /><span>{params.surge ? `Peak demand +${params.surge}%` : "Baseline demand"}</span></div><b>{nodes.length} {dataset} neighborhoods · {Math.round(result.totalOrders).toLocaleString()} orders/day</b></div></div>
      <section className="metrics-grid">
        <div className="recommendation"><span>RECOMMENDATION</span><b>{result.hubs.length} hubs</b><p>{manualHubs ? "manual sensitivity layout" : "optimizer-selected layout"}</p></div>
        <Metric label="Total cost" value={money(result.totalCost)} detail={`${money(result.deliveryCost)} delivery + ${money(result.infraCost)} fixed`} tone="accent" tooltip="Sum of (distance × daily orders × cost per km) + fixed cost per hub" />
        <Metric label="Modeled impact" value={`${result.savingsPercent >= 0 ? "−" : "+"}${Math.abs(oneDecimal(result.savingsPercent))}%`} detail={`${money(Math.abs(result.savings))} vs. one hub`} tone={result.savingsPercent >= 0 ? "good" : "warn"} tooltip="Percentage reduction in total cost compared to a single central hub" />
        <Metric label="Weighted avg. leg" value={`${oneDecimal(result.weightedDistance)} km`} detail={`${oneDecimal(result.totalDistance)} km total network`} tooltip="Demand-weighted average distance from each neighborhood to its assigned hub" />
        <Metric label="Service level" value={`${oneDecimal(result.coverage)}%`} detail={params.useRadius ? `${result.radiusViolations} violations @ ${params.radius} km` : "radius analysis off"} tone={result.coverage === 100 ? "good" : "warn"} tooltip="Percentage of demand nodes that fall within the maximum service radius" />
      </section>
      {result.uncovered.length > 0 && <div className="model-alert"><TriangleAlert size={15} /><b>{result.uncovered.length} nodes are outside the {params.radius} km radius</b><span>{result.uncovered.map((node) => node.name).join(", ")}</span></div>}
      {result.hubs.some((hub) => hub.overCapacity) && <div className="model-alert capacity"><TriangleAlert size={15} /><b>Capacity limit exceeded</b><span>Increase the hub count or adjust the load limit.</span></div>}
      <section className="readiness-strip"><div><span className="eyebrow">NETWORK READINESS</span><b>{readinessScore}/100</b><small>{readinessScore >= 85 ? "Decision-ready" : readinessScore >= 70 ? "Good with watchpoints" : "Needs a stronger plan"}</small></div><div className="readiness-meter"><i style={{ width: `${readinessScore}%` }} /></div><p><CheckCircle2 size={14} /> {result.coverage === 100 ? "All demand nodes meet the modeled service threshold." : `${result.radiusViolations} service exception${result.radiusViolations > 1 ? "s" : ""} to resolve before launch.`}</p><p><MapPin size={14} /> Highest delivery exposure: <b>{highestCostNode?.name}</b> · {money(highestCostNode?.cost || 0)}/day</p></section>
      <section className="map-card"><div className="card-header"><div><span className="eyebrow">LIVE NETWORK MODEL</span><h2>Demand, assignments & proposed hubs</h2></div><div className="card-actions"><div className="map-summary"><MapPin size={13} /> {dataset} · drag hubs to reassign</div><button className={showRoutes ? "layer-pill active" : "layer-pill"} onClick={() => setShowRoutes((current) => !current)}>Routes</button><button className={showZones ? "layer-pill active" : "layer-pill"} onClick={() => setShowZones((current) => !current)}>Zones</button></div></div><MapPlot nodes={result.scenarioNodes} hubs={result.hubs} assignments={result.assignments} radius={activeRadius} locationName={dataset} dragHubId={dragHubId} onHubDrag={moveHub} onHubDragEnd={finishRecalculation} isRecalculating={isRecalculating} showRoutes={showRoutes} showZones={showZones} /></section>
      <section className="results-card">
        <nav className="tab-bar">{([ ["overview", Sparkles, "Decision brief"], ["assignments", Table2, "Assignments"], ["hubs", CircleGauge, "Hub loads"], ["curve", BarChart3, "Cost curve"] ] as const).map(([id, Icon, label]) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}><Icon size={13} /> {label}</button>)}</nav>
        <div className="tab-content">
          {activeTab === "overview" && <div className="overview-grid">
            <div className="brief-main"><span className="eyebrow">MODEL READOUT</span><h2>A practical network for the current demand profile.</h2><p>HTTP 404 weights busy neighborhoods more heavily than low-volume zones, then assigns each node to the nearest feasible hub. Drag a hub on the map to run an immediate sensitivity analysis on the live network.</p><div className="insight-callout"><Zap size={18} /><div><b>{result.savings >= 0 ? "Why this layout wins" : "Trade-off to review"}</b><p>{result.savings >= 0 ? `The proposed network saves ${money(result.savings)} per modeled day versus a single hub, while holding the weighted last-mile leg to ${oneDecimal(result.weightedDistance)} km.` : "At this hub count, fixed infrastructure cost is outweighing delivery savings. Check the cost curve for a leaner option."}</p></div></div></div>
            <div className="brief-score"><span>MODELED SAVING</span><b className={result.savings >= 0 ? "positive" : "negative"}>{result.savings >= 0 ? `${oneDecimal(result.savingsPercent)}%` : "—"}</b><p>against the<br />single-hub baseline</p></div>
            <div className="brief-cards"><article><span>Daily demand modeled</span><b>{Math.round(result.totalOrders).toLocaleString()}</b><p>{nodes.length} {dataset} neighborhoods</p></article><article><span>Radius violations</span><b className={result.radiusViolations ? "warning-value" : ""}>{result.radiusViolations}</b><p>{params.useRadius ? `${params.radius} km service threshold` : "analysis disabled"}</p></article><article><span>Weighted last mile</span><b>{oneDecimal(result.weightedDistance)} km</b><p>average leg, demand-weighted</p></article><article><span>Single-hub baseline</span><b>{money(result.baselineCost)}</b><p>vs. {money(result.totalCost)} optimized</p></article></div>
            <div className="cost-breakdown"><div><span>Cost breakdown</span><b>Total cost {money(result.totalCost)}</b></div><p><i className="delivery-dot" /> Delivery / variable <strong>{money(result.deliveryCost)}</strong></p><p><i className="infra-dot" /> Infrastructure / fixed <strong>{money(result.infraCost)}</strong></p><p className="cost-footnote">Fixed cost is modeled at {money(params.fixedCost)} per active hub per day.</p></div>
            <div className="scenario-comparison"><div className="comparison-title"><span className="eyebrow">SCENARIO COMPARISON</span><b>Stress-test the same network</b></div><div className="comparison-scroll"><table><thead><tr><th>Scenario</th><th>Total cost</th><th>Hubs</th><th>Weighted avg. leg</th><th>Radius violations</th><th>Savings vs. single hub</th></tr></thead><tbody>{scenarioComparison.map((scenario) => <tr key={scenario.surge} className={scenario.surge === params.surge ? "current-scenario" : ""}><td>{scenario.surge ? `+${scenario.surge}%` : "Base"}</td><td>{money(scenario.totalCost)}</td><td>{scenario.hubs.length}</td><td>{oneDecimal(scenario.weightedDistance)} km</td><td>{scenario.radiusViolations}</td><td className={scenario.savingsPercent >= 0 ? "positive" : "negative"}>{oneDecimal(scenario.savingsPercent)}%</td></tr>)}</tbody></table></div></div>
            <details className="assumptions"><summary><Info size={14} /> Model assumptions <ChevronRight size={14} /></summary><p>Hub locations use weighted k-means unless existing-node placement is selected. Distances are calculated on a local Euclidean planning grid. Daily demand is used as the assignment weight, and a fixed cost per hub is added to variable delivery cost.</p></details>
          </div>}
          {activeTab === "assignments" && <div><div className="tab-heading"><div><span className="eyebrow">AUDIT TRAIL</span><h2>Where every node is served</h2></div><button className="small-export" onClick={exportAssignments}><Download size={12} /> Assignments CSV</button></div><div className="table-scroll"><table className="result-table"><thead><tr><th>Demand node</th><th>Orders/day</th><th>Hub</th><th>Leg</th><th>Vehicle</th><th>Delivery cost</th><th>Status</th></tr></thead><tbody>{result.assignments.map((assignment) => <tr key={assignment.id}><td><b>{assignment.name}</b></td><td>{assignment.adjustedOrders.toLocaleString()}</td><td><span className="hub-badge" style={{ background: PALETTE[assignment.hubId] }}>H{assignment.hubId + 1}</span></td><td>{oneDecimal(assignment.distance)} km</td><td>{assignment.vehicle}</td><td>{money(assignment.cost)}</td><td><span className={assignment.withinRadius ? "status-good" : "status-warn"}>{assignment.withinRadius ? <><Check size={12} /> In range</> : <><TriangleAlert size={12} /> Beyond range</>}</span></td></tr>)}</tbody></table></div></div>}
          {activeTab === "hubs" && <div><div className="tab-heading"><div><span className="eyebrow">CAPACITY PULSE</span><h2>Hub loads & utilization</h2></div><span>{result.hubs.length} active hubs</span></div><div className="hub-grid">{result.hubs.map((hub) => <article className="hub-panel" key={hub.hubId}><div className="hub-panel-top"><span className="large-hub-badge" style={{ background: PALETTE[hub.hubId] }}><Warehouse size={16} /> H{hub.hubId + 1}</span><div><b>{hub.nodeCount} nodes served</b><span>{hub.lat.toFixed(4)}, {hub.lon.toFixed(4)}</span></div></div><div className="hub-line"><span>Demand load</span><b>{Math.round(hub.load).toLocaleString()} orders</b></div>{hub.utilization !== null ? <><div className="utilization"><i style={{ width: `${Math.min(100, hub.utilization)}%`, background: hub.overCapacity ? "#c9575f" : PALETTE[hub.hubId] }} /></div><div className="hub-line muted"><span>Capacity utilization</span><b className={hub.overCapacity ? "over" : ""}>{oneDecimal(hub.utilization)}%</b></div></> : <p className="no-constraint">No capacity constraint applied</p>}</article>)}</div></div>}
          {activeTab === "curve" && <div><div className="tab-heading"><div><span className="eyebrow">SCENARIO ECONOMICS</span><h2>Find the cost-efficient hub count</h2><p>Delivery cost declines as hubs increase, while infrastructure cost rises. The lowest total cost is the point to take to a network decision.</p></div><div className="best-curve"><span>LOWEST TOTAL</span><b>{optimalCurve.k} hubs · {money(optimalCurve.total)}</b></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={curve}><defs><linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e87838" stopOpacity={.28} /><stop offset="100%" stopColor="#e87838" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#dce1da" strokeDasharray="3 3" /><XAxis dataKey="k" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#778179" }} label={{ value: "warehouses (k)", position: "insideBottom", offset: -2, style: { fill: "#778179", fontSize: 10 } }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#778179" }} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} /><Tooltip formatter={(value: number) => money(value)} contentStyle={{ borderRadius: 10, border: "1px solid #dce1da", boxShadow: "0 10px 30px rgba(29, 45, 35, .1)", fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} /><Area type="monotone" dataKey="total" name="Total cost" stroke="#e87838" strokeWidth={2.6} fill="url(#totalFill)" /><Line type="monotone" dataKey="delivery" name="Delivery cost" stroke="#4a8bf5" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="infrastructure" name="Infrastructure cost" stroke="#b487d9" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div></div>}
        </div>
      </section>
      <footer className="site-footer"><span><Cloud size={14} /> {isAuthenticated ? "Cloud workspace connected · scenarios are private to your account." : "Sign in to unlock private cloud scenarios and cross-device continuity."}</span><a href="#top">Back to top ↑</a></footer>
    </main>
    {commandOpen && <div className="overlay-shell" role="dialog" aria-modal="true" aria-label="Command search" onMouseDown={() => setCommandOpen(false)}><section className="command-palette" onMouseDown={(event) => event.stopPropagation()}><div className="command-title"><Command size={15} /><div><b>HTTP 404 command search</b><span>Jump to a decision action</span></div><kbd>ESC</kbd></div><button onClick={() => openCommand(() => loadPreset("Bengaluru"))}><MapPin size={14} /><span>Load Bengaluru starter network</span><small>Dataset</small></button><button onClick={() => openCommand(() => loadPreset("Mumbai"))}><MapPin size={14} /><span>Load Mumbai starter network</span><small>Dataset</small></button><button onClick={() => openCommand(() => loadPreset("Delhi"))}><MapPin size={14} /><span>Load Delhi starter network</span><small>Dataset</small></button><button onClick={() => openCommand(() => generateReport())}><Printer size={14} /><span>Generate printable decision report</span><small>Export</small></button><button onClick={() => openCommand(() => setWorkspaceOpen(true))}><Cloud size={14} /><span>{isAuthenticated ? "Open cloud scenario library" : "Sign in to cloud workspace"}</span><small>Workspace</small></button><button onClick={() => openCommand(() => setSettingsOpen(true))}><Settings2 size={14} /><span>Open appearance settings</span><small>Theme</small></button></section></div>}
    {workspaceOpen && <div className="overlay-shell" role="dialog" aria-modal="true" aria-label="HTTP 404 workspace" onMouseDown={() => setWorkspaceOpen(false)}><section className="workspace-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setWorkspaceOpen(false)} aria-label="Close workspace"><X size={16} /></button>{isAuthenticated ? <><div className="modal-heading"><span className="modal-avatar">{user?.name?.slice(0, 1).toUpperCase() || "U"}</span><div><span className="eyebrow">PRIVATE WORKSPACE</span><h2>{user?.name || "Your HTTP 404 workspace"}</h2><p>Saved scenarios are tied to this signed-in account.</p></div></div><div className="save-current"><div><Cloud size={15} /><span><b>Save this decision state</b><small>Capture nodes, guardrails, costs and manual hub edits.</small></span></div><div><input value={scenarioName} maxLength={120} placeholder={`${dataset} · Base network`} onChange={(event) => setScenarioName(event.target.value)} /><button disabled={saveScenarioMutation.isPending} onClick={saveScenario}>{saveScenarioMutation.isPending ? "Saving…" : "Save scenario"}</button></div></div><div className="scenario-library"><div className="library-title"><span>YOUR SCENARIOS</span><small>{savedRows.length} saved</small></div>{scenarioQuery.isLoading ? <div className="empty-library">Loading private scenarios…</div> : scenarioQuery.isError ? <div className="empty-library"><TriangleAlert size={17} /><b>Private storage is temporarily unavailable</b><span>Your scenario has not been changed. Try again in a moment.</span><button onClick={() => scenarioQuery.refetch()}>Retry</button></div> : savedRows.length ? savedRows.map((scenario) => <article key={scenario.id}><div><b>{scenario.name}</b><span>{scenario.dataset} · updated {new Date(scenario.updatedAt).toLocaleDateString()}</span></div><div><button onClick={() => restoreScenario(scenario)}>Load</button><button className="danger-icon" aria-label={`Delete ${scenario.name}`} onClick={() => deleteScenarioMutation.mutate({ id: scenario.id })}><Trash2 size={14} /></button></div></article>) : <div className="empty-library"><Cloud size={17} /><b>No cloud scenarios yet</b><span>Save this plan to build a reusable decision library.</span></div>}</div><div className="workspace-footer"><button onClick={() => setSettingsOpen(true)}><Settings2 size={13} /> Appearance settings</button><button onClick={handleLogout}><LogOut size={13} /> Sign out</button></div></> : <div className="signed-out-workspace"><span className="workspace-logo"><Cloud size={23} /></span><span className="eyebrow">HTTP 404 WORKSPACE</span><h2>Save the network, not just the screenshot.</h2><p>Sign in to keep private scenario snapshots, continue a decision on another device, and give your team a reliable starting point.</p><button className="primary-modal-button" onClick={startLogin}><LogIn size={15} /> Continue with secure sign in</button><small>Powered by managed Manus OAuth. No separate password is stored by HTTP 404.</small></div>}</section></div>}
    {settingsOpen && <div className="overlay-shell" role="dialog" aria-modal="true" aria-label="Appearance settings" onMouseDown={() => setSettingsOpen(false)}><section className="settings-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSettingsOpen(false)} aria-label="Close appearance settings"><X size={16} /></button><span className="eyebrow">APPEARANCE</span><h2>Make the cockpit yours.</h2><p>Preferences stay on this browser and carry across HTTP 404 sessions.</p><div className="setting-group"><span>Color mode</span><div className="setting-options"><button className={theme === "light" ? "selected" : ""} onClick={() => theme === "dark" && toggleTheme?.()}><Sun size={15} /> Light</button><button className={theme === "dark" ? "selected" : ""} onClick={() => theme === "light" && toggleTheme?.()}><Moon size={15} /> Dark</button></div></div><div className="setting-group"><span>Accent</span><div className="accent-options">{(["orange", "teal", "violet"] as ThemeAccent[]).map((color) => <button key={color} className={`${color} ${accent === color ? "selected" : ""}`} onClick={() => setAccent(color)}><i /> {color}</button>)}</div></div><div className="settings-note"><PanelTop size={15} /><span>Command search is always one keystroke away with <kbd>⌘ K</kbd> or <kbd>Ctrl K</kbd>.</span></div></section></div>}
    {isTourOpen && <div className="overlay-shell" role="dialog" aria-modal="true" aria-label="HTTP 404 decision playbook" onMouseDown={() => setIsTourOpen(false)}><section className="tour-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setIsTourOpen(false)} aria-label="Close playbook"><X size={16} /></button><span className="tour-spark"><Sparkles size={18} /></span><span className="eyebrow">90-SECOND PLAYBOOK</span><h2>Move from demand map to board-ready recommendation.</h2><ol><li><b>Load or upload demand.</b><span>Start with a city preset or add your own CSV rows.</span></li><li><b>Set guardrails, then drag.</b><span>Pick hub count and service radius; test sensitive hub moves directly on the map.</span></li><li><b>Check readiness and save.</b><span>Resolve red exceptions, export a report, and save the winning scenario to your cloud workspace.</span></li></ol><button className="primary-modal-button" onClick={() => { setIsTourOpen(false); setWorkspaceOpen(true); }}><Cloud size={15} /> Open workspace</button></section></div>}
  </div>;
}
