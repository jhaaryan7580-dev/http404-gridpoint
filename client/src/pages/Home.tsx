import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Check,
  ChevronRight,
  CircleGauge,
  FileUp,
  Info,
  MapPin,
  Navigation,
  Play,
  Plus,
  Route,
  ShieldCheck,
  Sparkles,
  Table2,
  TriangleAlert,
  Upload,
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
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETTE = ["#e87838", "#24a681", "#4a8bf5", "#b487d9", "#d1a72b", "#ef6f92"];
const EARTH_KM_PER_LAT = 111;

type Algorithm = "kmeans" | "kmedoids";
type Tab = "overview" | "assignments" | "hubs" | "curve";

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
type Assignment = DemandNode & {
  adjustedOrders: number;
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

const DEFAULT_NODES: DemandNode[] = [
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

const DEFAULT_PARAMS: Params = {
  k: 3,
  algorithm: "kmeans",
  costPerKm: 2,
  fixedCost: 500,
  useVehicles: false,
  useCapacity: false,
  capacity: 1800,
  useRadius: false,
  radius: 10,
  surge: 0,
};

const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const oneDecimal = (value: number) => Number(value.toFixed(1));

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

function buildCenters(nodes: Array<DemandNode & { adjustedOrders: number }>, k: number, algorithm: Algorithm) {
  const count = Math.max(1, Math.min(k, nodes.length));
  const ranked = [...nodes].sort((a, b) => b.adjustedOrders - a.adjustedOrders);
  const centers: Point[] = [ranked[0]];
  while (centers.length < count) {
    let candidate = ranked[0];
    let score = -Infinity;
    for (const node of nodes) {
      const nearest = Math.min(...centers.map((center) => distanceKm(node, center)));
      const nextScore = nearest * nearest * node.adjustedOrders;
      if (nextScore > score) {
        score = nextScore;
        candidate = node;
      }
    }
    centers.push({ lat: candidate.lat, lon: candidate.lon });
  }
  for (let iteration = 0; iteration < 30; iteration += 1) {
    const clusters = centers.map(() => [] as Array<DemandNode & { adjustedOrders: number }>);
    nodes.forEach((node) => {
      const nearestId = centers.reduce((best, center, idx) => distanceKm(node, center) < distanceKm(node, centers[best]) ? idx : best, 0);
      clusters[nearestId].push(node);
    });
    centers.forEach((center, idx) => {
      if (clusters[idx].length) {
        const next = weightedCentroid(clusters[idx]);
        center.lat = next.lat;
        center.lon = next.lon;
      }
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

function solveNetwork(nodes: DemandNode[], params: Params) {
  const scenarioNodes = nodes.map((node) => ({ ...node, adjustedOrders: Math.round(node.orders * (1 + params.surge / 100)) }));
  const centers = buildCenters(scenarioNodes, params.k, params.algorithm);
  const loads = centers.map(() => 0);
  const assignments: Assignment[] = [];
  [...scenarioNodes]
    .sort((a, b) => b.adjustedOrders - a.adjustedOrders)
    .forEach((node) => {
      const ranked = centers.map((center, hubId) => ({ hubId, distance: distanceKm(node, center) })).sort((a, b) => a.distance - b.distance);
      const eligible = params.useCapacity
        ? ranked.find((choice) => loads[choice.hubId] + node.adjustedOrders <= params.capacity)
        : ranked[0];
      const chosen = eligible || ranked[0];
      loads[chosen.hubId] += node.adjustedOrders;
      const withinRadius = !params.useRadius || chosen.distance <= params.radius;
      const vehicle = params.useVehicles ? chosen.distance <= 5 ? "Bike" : chosen.distance <= 15 ? "Van" : "Truck" : "Standard";
      const rate = params.useVehicles ? vehicle === "Bike" ? 4 : vehicle === "Van" ? 7 : 12 : params.costPerKm;
      assignments.push({
        ...node,
        hubId: chosen.hubId,
        distance: chosen.distance,
        cost: chosen.distance * rate * node.adjustedOrders,
        vehicle,
        withinRadius,
      });
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
  const savings = baselineCost - totalCost;
  return {
    scenarioNodes,
    hubs,
    assignments,
    deliveryCost,
    infraCost,
    totalCost,
    baselineCost,
    savings,
    savingsPercent: baselineCost ? (savings / baselineCost) * 100 : 0,
    totalOrders,
    weightedDistance,
    totalDistance: assignments.reduce((sum, assignment) => sum + assignment.distance, 0),
    coverage: (assignments.filter((assignment) => assignment.withinRadius).length / assignments.length) * 100,
    uncovered: assignments.filter((assignment) => !assignment.withinRadius),
  };
}

function buildCurve(nodes: DemandNode[], params: Params) {
  const maximum = Math.min(6, nodes.length);
  return Array.from({ length: maximum }, (_, index) => {
    const result = solveNetwork(nodes, { ...params, k: index + 1, useCapacity: false, useRadius: false });
    return { k: index + 1, delivery: Math.round(result.deliveryCost), infrastructure: Math.round(result.infraCost), total: Math.round(result.totalCost) };
  });
}

function Metric({ label, value, detail, tone = "" }: { label: string; value: string; detail: string; tone?: string }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function MapPlot({ nodes, hubs, assignments, radius }: { nodes: DemandNode[]; hubs: Hub[]; assignments: Assignment[]; radius: number | null }) {
  const lats = nodes.map((node) => node.lat);
  const lons = nodes.map((node) => node.lon);
  const minLat = Math.min(...lats) - 0.02;
  const maxLat = Math.max(...lats) + 0.02;
  const minLon = Math.min(...lons) - 0.02;
  const maxLon = Math.max(...lons) + 0.02;
  const locate = (point: Point) => ({
    x: 7 + ((point.lon - minLon) / (maxLon - minLon)) * 86,
    y: 92 - ((point.lat - minLat) / (maxLat - minLat)) * 84,
  });
  const maxOrders = Math.max(...nodes.map((node) => node.orders));
  return <div className="map-shell">
    <div className="map-grid map-grid-a" /><div className="map-grid map-grid-b" /><div className="map-label north">NORTH BENGALURU</div><div className="map-label south">SOUTH CORRIDOR</div><div className="map-label east">EAST TECH BELT</div>
    <svg className="network-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Demand nodes and proposed warehouse hubs">
      {radius && hubs.map((hub) => {
        const { x, y } = locate(hub);
        const radiusPercent = (radius / (maxLat - minLat) / EARTH_KM_PER_LAT) * 84;
        return <circle key={`ring-${hub.hubId}`} cx={x} cy={y} r={radiusPercent} className="radius-ring" style={{ stroke: PALETTE[hub.hubId % PALETTE.length] }} />;
      })}
      {assignments.map((assignment) => {
        const node = locate(assignment);
        const hub = locate(hubs[assignment.hubId]);
        return <line key={`route-${assignment.id}`} x1={node.x} y1={node.y} x2={hub.x} y2={hub.y} className={assignment.withinRadius ? "route-line" : "route-line out-of-range"} style={{ stroke: PALETTE[assignment.hubId % PALETTE.length] }} />;
      })}
      {nodes.map((node) => {
        const { x, y } = locate(node);
        const assignment = assignments.find((item) => item.id === node.id);
        const radius = 1.2 + (node.orders / maxOrders) * 2.25;
        return <g key={node.id}><circle cx={x} cy={y} r={radius + .65} className="node-halo" /><circle cx={x} cy={y} r={radius} className="demand-node" style={{ fill: assignment ? PALETTE[assignment.hubId % PALETTE.length] : "#e87838" }} /><title>{node.name}: {node.orders} orders/day</title></g>;
      })}
      {hubs.map((hub) => {
        const { x, y } = locate(hub);
        return <g key={`hub-${hub.hubId}`}><rect x={x - 2.5} y={y - 2.5} width="5" height="5" rx=".8" className="hub-marker" style={{ fill: PALETTE[hub.hubId % PALETTE.length] }} /><text x={x} y={y + .65} className="hub-text">H{hub.hubId + 1}</text></g>;
      })}
    </svg>
    <div className="map-compass"><Navigation size={15} /> <span>City-scale planning plot</span></div>
    <div className="map-legend"><span><i className="legend-node" /> Demand node</span><span><i className="legend-hub" /> Proposed hub</span>{radius && <span><i className="legend-radius" /> Radius</span>}</div>
  </div>;
}

export default function Home() {
  const [nodes, setNodes] = useState<DemandNode[]>(DEFAULT_NODES);
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [runStamp, setRunStamp] = useState(() => new Date());
  const fileRef = useRef<HTMLInputElement>(null);
  const result = useMemo(() => solveNetwork(nodes, params), [nodes, params]);
  const curve = useMemo(() => buildCurve(nodes, params), [nodes, params]);
  const optimalCurve = curve.reduce((best, point) => point.total < best.total ? point : best, curve[0]);

  const updateParams = (patch: Partial<Params>) => setParams((current) => ({ ...current, ...patch }));
  const updateNode = (id: string, patch: Partial<DemandNode>) => setNodes((current) => current.map((node) => node.id === id ? { ...node, ...patch } : node));
  const addNode = () => setNodes((current) => [...current, { id: `node-${Date.now()}`, name: `New node ${current.length + 1}`, lat: 12.97, lon: 77.61, orders: 100 }]);
  const removeNode = (id: string) => setNodes((current) => current.length > 2 ? current.filter((node) => node.id !== id) : current);
  const runModel = () => setRunStamp(new Date());

  const uploadCsv = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const rows = text.trim().split(/\r?\n/);
      const headers = rows.shift()?.split(",").map((header) => header.trim().toLowerCase()) || [];
      const nameIndex = headers.indexOf("name"); const latIndex = headers.indexOf("lat"); const lonIndex = headers.indexOf("lon"); const orderIndex = headers.indexOf("orders");
      if ([nameIndex, latIndex, lonIndex, orderIndex].every((index) => index >= 0)) {
        const parsed = rows.map((row, index) => {
          const values = row.split(",").map((value) => value.trim());
          return { id: `upload-${Date.now()}-${index}`, name: values[nameIndex], lat: Number(values[latIndex]), lon: Number(values[lonIndex]), orders: Number(values[orderIndex]) };
        }).filter((row) => row.name && Number.isFinite(row.lat) && Number.isFinite(row.lon) && Number.isFinite(row.orders));
        if (parsed.length >= 2) setNodes(parsed);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return <div className="site-shell">
    <aside className="control-rail">
      <div className="rail-top">
        <a href="#top" className="brand" aria-label="GridPoint home"><span className="brand-sigil">⌁</span><span><b>GRIDPOINT</b><small>NETWORK DESIGN LAB</small></span></a>
        <span className="version-chip">LIVE</span>
      </div>
      <div className="rail-intro"><span className="eyebrow">MODEL CONTROLS</span><p>Build an explainable network plan from raw demand data.</p></div>

      <section className="rail-section">
        <div className="section-title"><span>01 / demand map</span><h2>Demand nodes</h2></div>
        <div className="rail-stats"><div><b>{nodes.length}</b><span>nodes</span></div><div><b>{Math.round(nodes.reduce((sum, node) => sum + node.orders, 0)).toLocaleString()}</b><span>orders/day</span></div></div>
        <input className="sr-only" ref={fileRef} type="file" accept=".csv" onChange={uploadCsv} />
        <button className="upload-button" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload CSV <small>name · lat · lon · orders</small></button>
        <div className="node-table-wrap"><table className="node-table"><thead><tr><th>node</th><th>lat</th><th>lon</th><th>orders</th><th /></tr></thead><tbody>{nodes.map((node) => <tr key={node.id}><td><input aria-label={`${node.name} name`} value={node.name} onChange={(event) => updateNode(node.id, { name: event.target.value })} /></td><td><input aria-label={`${node.name} latitude`} value={node.lat} onChange={(event) => updateNode(node.id, { lat: Number(event.target.value) || 0 })} /></td><td><input aria-label={`${node.name} longitude`} value={node.lon} onChange={(event) => updateNode(node.id, { lon: Number(event.target.value) || 0 })} /></td><td><input aria-label={`${node.name} orders`} value={node.orders} onChange={(event) => updateNode(node.id, { orders: Number(event.target.value) || 0 })} /></td><td><button className="remove-node" onClick={() => removeNode(node.id)} aria-label={`Remove ${node.name}`}><X size={12} /></button></td></tr>)}</tbody></table></div>
        <button className="add-node" onClick={addNode}><Plus size={13} /> Add demand node</button>
      </section>

      <section className="rail-section">
        <div className="section-title"><span>02 / network</span><h2>Hub strategy</h2></div>
        <label className="control-label">Number of warehouses <b>{params.k}</b></label>
        <input className="range-control" type="range" min="1" max={Math.min(8, nodes.length)} value={params.k} onChange={(event) => updateParams({ k: Number(event.target.value) })} />
        <div className="range-labels"><span>1 hub</span><span>{Math.min(8, nodes.length)} hubs</span></div>
        <label className="control-label top-gap">Placement logic</label>
        <select value={params.algorithm} onChange={(event) => updateParams({ algorithm: event.target.value as Algorithm })}><option value="kmeans">Optimal point · weighted k-means</option><option value="kmedoids">Existing node · weighted k-medoids</option></select>
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
        <label className="toggle-control"><input type="checkbox" checked={params.useRadius} onChange={(event) => updateParams({ useRadius: event.target.checked })} /><span><b>Maximum service radius</b><small>Flag nodes outside the ring</small></span></label>
        {params.useRadius && <label className="reveal-field"><span>Maximum radius (km)</span><input type="number" min="1" value={params.radius} onChange={(event) => updateParams({ radius: Number(event.target.value) || 1 })} /></label>}
      </section>

      <section className="rail-section">
        <div className="section-title"><span>05 / scenario</span><h2>Demand stress test</h2></div>
        <div className="scenario-switcher">{[0, 15, 30].map((value) => <button key={value} className={params.surge === value ? "active" : ""} onClick={() => updateParams({ surge: value })}>{value === 0 ? "Base" : `+${value}%`}</button>)}</div>
        <p className="helper-copy">Apply a peak-day profile without changing the geography.</p>
      </section>

      <div className="run-area"><button className="run-button" onClick={runModel}><span><Play size={14} fill="currentColor" /> Run optimization</span><ChevronRight size={18} /></button><p>Pure client-side model · no API required</p></div>
    </aside>

    <main id="top" className="workspace">
      <header className="topbar"><div className="crumb"><span className="desktop-only">GRIDPOINT</span><ChevronRight size={12} /><span>NETWORK DESIGN</span></div><div className="status"><i /> Permanent public app <span /> <time>{runStamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} model run</time></div></header>
      <div className="hero">
        <div><span className="eyebrow">WAREHOUSE NETWORK PLANNER <b>•</b> DECISION COCKPIT</span><h1>Find the lowest-friction<br />delivery network.</h1><p>Place hubs where demand is dense, keep the last mile short, and make every infrastructure trade-off visible before you commit.</p></div>
        <div className="scenario-card"><div><Activity size={14} /><span>{params.surge ? `Peak demand +${params.surge}%` : "Baseline demand"}</span></div><b>{nodes.length} neighborhoods · {Math.round(result.totalOrders).toLocaleString()} orders/day</b></div>
      </div>

      <section className="metrics-grid">
        <div className="recommendation"><span>RECOMMENDATION</span><b>{result.hubs.length} hubs</b><p>cuts delivery friction</p></div>
        <Metric label="Total cost" value={money(result.totalCost)} detail={`${money(result.deliveryCost)} delivery + ${money(result.infraCost)} infra`} tone="accent" />
        <Metric label="vs. single hub" value={`${result.savingsPercent >= 0 ? "−" : "+"}${Math.abs(oneDecimal(result.savingsPercent))}%`} detail={`${money(Math.abs(result.savings))} modeled impact`} tone={result.savingsPercent >= 0 ? "good" : "warn"} />
        <Metric label="Weighted avg. leg" value={`${oneDecimal(result.weightedDistance)} km`} detail={`${oneDecimal(result.totalDistance)} km total network`} />
        <Metric label="Service level" value={`${oneDecimal(result.coverage)}%`} detail={`${Math.round(result.totalOrders).toLocaleString()} orders/day`} tone={result.coverage === 100 ? "good" : "warn"} />
      </section>

      {result.uncovered.length > 0 && <div className="model-alert"><TriangleAlert size={15} /><b>{result.uncovered.length} nodes are outside the max radius</b><span>{result.uncovered.map((node) => node.name).join(", ")}</span></div>}
      {result.hubs.some((hub) => hub.overCapacity) && <div className="model-alert capacity"><TriangleAlert size={15} /><b>Capacity limit exceeded</b><span>Increase the hub count or adjust the load limit.</span></div>}

      <section className="map-card">
        <div className="card-header"><div><span className="eyebrow">LIVE NETWORK MODEL</span><h2>Demand & proposed hubs</h2></div><div className="map-summary"><MapPin size={13} /> Bengaluru · planning coordinate view</div></div>
        <MapPlot nodes={result.scenarioNodes} hubs={result.hubs} assignments={result.assignments} radius={params.useRadius ? params.radius : null} />
      </section>

      <section className="results-card">
        <nav className="tab-bar">{([ ["overview", Sparkles, "Decision brief"], ["assignments", Table2, "Assignments"], ["hubs", CircleGauge, "Hub loads"], ["curve", BarChart3, "Cost curve"] ] as const).map(([id, Icon, label]) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}><Icon size={13} /> {label}</button>)}</nav>
        <div className="tab-content">
          {activeTab === "overview" && <div className="overview-grid">
            <div className="brief-main"><span className="eyebrow">MODEL READOUT</span><h2>A practical network for the current demand profile.</h2><p>GridPoint weights busy neighborhoods more heavily than low-volume zones, then assigns each node to the nearest feasible hub. The result is a network plan that can be inspected—not just a single score.</p><div className="insight-callout"><Zap size={18} /><div><b>{result.savings >= 0 ? "Why this layout wins" : "Trade-off to review"}</b><p>{result.savings >= 0 ? `The proposed network saves ${money(result.savings)} per modeled day versus a single hub, while holding the weighted last-mile leg to ${oneDecimal(result.weightedDistance)} km.` : "At this hub count, fixed infrastructure cost is outweighing delivery savings. Check the cost curve for a leaner option."}</p></div></div></div>
            <div className="brief-score"><span>MODELED SAVING</span><b className={result.savings >= 0 ? "positive" : "negative"}>{result.savings >= 0 ? `${oneDecimal(result.savingsPercent)}%` : "—"}</b><p>against the<br />single-hub baseline</p></div>
            <div className="brief-cards"><article><span>Daily demand modeled</span><b>{Math.round(result.totalOrders).toLocaleString()}</b><p>{nodes.length} Bengaluru neighborhoods</p></article><article><span>Recommended layout</span><b>{result.hubs.length} hubs</b><p>{oneDecimal(result.coverage)}% within guardrails</p></article><article><span>Weighted last mile</span><b>{oneDecimal(result.weightedDistance)} km</b><p>average leg, demand-weighted</p></article><article><span>Baseline comparison</span><b>{money(result.baselineCost)}</b><p>one hub vs {money(result.totalCost)}</p></article></div>
            <div className="method-footnote"><Info size={14} /><span><b>Model notes.</b> Weighted {params.algorithm === "kmeans" ? "k-means" : "k-medoids"}, local coordinate distance, order volume as demand weight, and fixed cost per hub. This is a planning model—not a road-routing quote.</span></div>
          </div>}

          {activeTab === "assignments" && <div><div className="tab-heading"><div><span className="eyebrow">AUDIT TRAIL</span><h2>Where every node is served</h2></div><span>{result.assignments.length} assignments</span></div><div className="table-scroll"><table className="result-table"><thead><tr><th>Demand node</th><th>Orders/day</th><th>Hub</th><th>Leg</th><th>Vehicle</th><th>Delivery cost</th><th>Status</th></tr></thead><tbody>{result.assignments.map((assignment) => <tr key={assignment.id}><td><b>{assignment.name}</b></td><td>{assignment.adjustedOrders.toLocaleString()}</td><td><span className="hub-badge" style={{ background: PALETTE[assignment.hubId] }}>H{assignment.hubId + 1}</span></td><td>{oneDecimal(assignment.distance)} km</td><td>{assignment.vehicle}</td><td>{money(assignment.cost)}</td><td><span className={assignment.withinRadius ? "status-good" : "status-warn"}>{assignment.withinRadius ? <><Check size={12} /> In range</> : <><TriangleAlert size={12} /> Beyond range</>}</span></td></tr>)}</tbody></table></div></div>}

          {activeTab === "hubs" && <div><div className="tab-heading"><div><span className="eyebrow">CAPACITY PULSE</span><h2>Hub loads & utilization</h2></div><span>{result.hubs.length} active hubs</span></div><div className="hub-grid">{result.hubs.map((hub) => <article className="hub-panel" key={hub.hubId}><div className="hub-panel-top"><span className="large-hub-badge" style={{ background: PALETTE[hub.hubId] }}><Warehouse size={16} /> H{hub.hubId + 1}</span><div><b>{hub.nodeCount} nodes served</b><span>{hub.lat.toFixed(4)}, {hub.lon.toFixed(4)}</span></div></div><div className="hub-line"><span>Demand load</span><b>{Math.round(hub.load).toLocaleString()} orders</b></div>{hub.utilization !== null ? <><div className="utilization"><i style={{ width: `${Math.min(100, hub.utilization)}%`, background: hub.overCapacity ? "#c9575f" : PALETTE[hub.hubId] }} /></div><div className="hub-line muted"><span>Capacity utilization</span><b className={hub.overCapacity ? "over" : ""}>{oneDecimal(hub.utilization)}%</b></div></> : <p className="no-constraint">No capacity constraint applied</p>}</article>)}</div></div>}

          {activeTab === "curve" && <div><div className="tab-heading"><div><span className="eyebrow">SCENARIO ECONOMICS</span><h2>Find the cost-efficient hub count</h2><p>Delivery cost declines as hubs increase, while infrastructure cost rises. The lowest total cost is the point to take to a network decision.</p></div><div className="best-curve"><span>LOWEST TOTAL</span><b>{optimalCurve.k} hubs · {money(optimalCurve.total)}</b></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={curve}><defs><linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e87838" stopOpacity={.28} /><stop offset="100%" stopColor="#e87838" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#dce1da" strokeDasharray="3 3" /><XAxis dataKey="k" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#778179" }} label={{ value: "warehouses (k)", position: "insideBottom", offset: -2, style: { fill: "#778179", fontSize: 10 } }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#778179" }} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} /><Tooltip formatter={(value: number) => money(value)} contentStyle={{ borderRadius: 10, border: "1px solid #dce1da", boxShadow: "0 10px 30px rgba(29, 45, 35, .1)", fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} /><Area type="monotone" dataKey="total" name="Total cost" stroke="#e87838" strokeWidth={2.6} fill="url(#totalFill)" /><Line type="monotone" dataKey="delivery" name="Delivery cost" stroke="#4a8bf5" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="infrastructure" name="Infrastructure cost" stroke="#b487d9" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div></div>}
        </div>
      </section>

      <footer className="site-footer"><span><Sparkles size={14} /> GridPoint is fully client-side and ready to share.</span><a href="#top">Back to top ↑</a></footer>
    </main>
  </div>;
}
