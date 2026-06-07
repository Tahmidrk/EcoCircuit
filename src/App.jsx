import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  BatteryCharging,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  ClipboardList,
  Clock3,
  Download,
  Factory,
  Filter,
  Fuel,
  Leaf,
  LocateFixed,
  LogOut,
  Map,
  MapPin,
  Menu,
  PackageCheck,
  Plus,
  Recycle,
  Route as RouteIcon,
  Search,
  ShieldCheck,
  Sparkles,
  TreePine,
  Truck,
  UserRound,
  Weight,
  X,
  Zap
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { api } from "./api";

const CATEGORIES = [
  "Mobile phones",
  "Batteries",
  "Chargers",
  "Circuit boards",
  "Keyboards & mice",
  "Cables",
  "Screens & monitors"
];
const STATUS_COLORS = ["#1b7f5a", "#f1a34f", "#4f8fba", "#d8c659"];
const CATEGORY_COLORS = ["#1b7f5a", "#7abf92", "#f1a34f", "#4f8fba", "#a986c8", "#e47e66", "#d8c659"];
const defaultCenter = [23.7808, 90.4071];

const markerIcon = (color = "#176b4d") =>
  L.divIcon({
    className: "custom-marker",
    html: `<span style="background:${color}"><i></i></span>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -37]
  });

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ecocircuit_user"));
    } catch {
      return null;
    }
  });

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
      <Route path="/*" element={user ? <Shell user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} />
    </Routes>
  );
}

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "admin@ecocircuit.local", password: "admin123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api("/auth/login", { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("ecocircuit_token", result.token);
      localStorage.setItem("ecocircuit_user", JSON.stringify(result.user));
      onLogin(result.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand brand-light"><BrandMark /><span>EcoCircuit</span></div>
        <div className="story-content">
          <span className="eyebrow light"><Sparkles size={15} /> Circular intelligence</span>
          <h1>Give every device<br />a better next chapter.</h1>
          <p>One connected workspace for responsible collection, transparent recycling, and smarter logistics.</p>
          <div className="story-stats">
            <div><strong>94%</strong><span>Landfill diversion</span></div>
            <div><strong>2.7x</strong><span>CO2 impact avoided</span></div>
            <div><strong>7</strong><span>Waste categories</span></div>
          </div>
        </div>
        <p className="story-foot">Built for cleaner cities and a circular future.</p>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="mobile-brand"><BrandMark /><span>EcoCircuit</span></div>
          <span className="eyebrow"><ShieldCheck size={15} /> Secure workspace</span>
          <h2>Welcome back</h2>
          <p>Sign in to manage your collection network.</p>
          {error && <div className="form-error"><AlertTriangle size={16} />{error}</div>}
          <label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          <button className="button primary wide" disabled={loading}>{loading ? "Signing in..." : "Sign in"}<ArrowRight size={17} /></button>
          <div className="demo-note">
            <span>Demo access</span>
            <div className="demo-account-buttons">
              <button type="button" onClick={() => setForm({ email: "admin@ecocircuit.local", password: "admin123" })}><ShieldCheck />Admin</button>
              <button type="button" onClick={() => setForm({ email: "collector@ecocircuit.local", password: "collect123" })}><Truck />Collector</button>
              <button type="button" onClick={() => setForm({ email: "user@ecocircuit.local", password: "user123" })}><UserRound />User</button>
            </div>
            <code>{form.email} / {form.password}</code>
          </div>
        </form>
      </section>
    </main>
  );
}

const adminNavItems = [
  { to: "/", label: "Overview", icon: CircleGauge, end: true },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/pickups", label: "Pickups", icon: Truck },
  { to: "/routes", label: "Route planner", icon: RouteIcon },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/centers", label: "Collection centers", icon: MapPin }
];

const collectorNavItems = [
  { to: "/", label: "My day", icon: CircleGauge, end: true },
  { to: "/inventory", label: "Record collection", icon: Boxes },
  { to: "/pickups", label: "My pickups", icon: Truck },
  { to: "/routes", label: "My route", icon: RouteIcon }
];

const userNavItems = [
  { to: "/", label: "My recycling", icon: Leaf, end: true },
  { to: "/pickups", label: "My requests", icon: Truck },
  { to: "/centers", label: "Drop-off centers", icon: MapPin }
];

function Shell({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navItems = user.role === "admin" ? adminNavItems : user.role === "collector" ? collectorNavItems : userNavItems;
  const title = navItems.find((item) => item.to === location.pathname)?.label || "Overview";

  function logout() {
    localStorage.removeItem("ecocircuit_token");
    localStorage.removeItem("ecocircuit_user");
    onLogout();
  }

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand"><BrandMark /><span>EcoCircuit</span><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)}><X /></button></div>
        <div className="workspace-label">Workspace</div>
        <nav>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? "active" : ""}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-impact">
          <div className="impact-icon"><Leaf size={20} /></div>
          <strong>{user.role === "admin" ? <>Small actions.<br />Measurable impact.</> : user.role === "collector" ? <>Field safety<br />comes first.</> : <>Recycle today.<br />Protect tomorrow.</>}</strong>
          <span>{user.role === "admin" ? "Keep valuable materials in circulation." : user.role === "collector" ? "Keep batteries sealed and high-risk items separated." : "Schedule safe collection instead of throwing electronics away."}</span>
        </div>
        <div className="sidebar-user">
          <div className="avatar">{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
          <div><strong>{user.name}</strong><span>{user.role}</span></div>
          <button className="icon-button" onClick={logout} title="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
      <div className="app-main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)}><Menu /></button>
          <div><span className="topbar-kicker">E-waste management</span><h1>{title}</h1></div>
          <div className="topbar-actions">
            <span className="live-indicator"><i />System online</span>
            <button className="icon-button notification"><Bell size={20} /><i /></button>
            <div className="avatar small">{user.name[0]}</div>
          </div>
        </header>
        <main className="page-content">
          <Routes>
            <Route path="/" element={user.role === "admin" ? <Overview /> : user.role === "collector" ? <CollectorOverview /> : <UserOverview user={user} />} />
            <Route path="/inventory" element={user.role !== "user" ? <Inventory user={user} /> : <Navigate to="/" replace />} />
            <Route path="/pickups" element={<Pickups user={user} />} />
            <Route path="/routes" element={user.role !== "user" ? <RoutePlanner user={user} /> : <Navigate to="/" replace />} />
            <Route path="/analytics" element={user.role === "admin" ? <Analytics /> : <Navigate to="/" replace />} />
            <Route path="/centers" element={user.role !== "collector" ? <Centers user={user} /> : <Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function UserOverview({ user }) {
  const { data, loading, error, reload } = useData("/user/overview");
  const navigate = useNavigate();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const latest = data.requests[0];

  return (
    <>
      <section className="user-hero">
        <div>
          <span className="eyebrow light">Personal recycling portal</span>
          <h2>Hi, {user.name.split(" ")[0]}. Ready to clear out responsibly?</h2>
          <p>Tell us what electronics you have, choose the pickup point on the map, and track every step to recycling.</p>
          <button className="button user-cta" onClick={() => navigate("/pickups?new=1")}><Plus size={17} />Request a pickup</button>
        </div>
        <div className="user-hero-art"><Recycle /><Leaf /><Sparkles /></div>
      </section>
      <section className="metric-grid user-metrics">
        <MetricCard icon={ClipboardList} label="Total requests" value={data.totals.requests} note="Pickup requests submitted" tone="green" trend="History" />
        <MetricCard icon={Truck} label="Active requests" value={data.totals.active} note="Pending or scheduled" tone="blue" trend="In progress" />
        <MetricCard icon={Weight} label="E-waste declared" value={`${data.totals.weight} kg`} note="Across your requests" tone="amber" trend="Impact" />
        <MetricCard icon={Leaf} label="CO2 avoided" value={`${data.impact.co2Avoided} kg`} note="From completed recycling" tone="green" trend="Estimate" />
      </section>
      <section className="user-home-grid">
        <div className="card">
          <CardHeader title="Latest pickup request" subtitle="Track your most recent request" action={<button className="text-button" onClick={() => navigate("/pickups")}>View all <ChevronRight size={16} /></button>} />
          {latest ? <div className="user-latest">
            <div className="user-latest-head"><span className="request-icon"><Truck /></span><div><span>{latest.id}</span><h3>{latest.location}</h3><p>{latest.address}</p></div><Status status={latest.status} /></div>
            <div className="request-timeline">
              {["Pending", "Scheduled", "Completed"].map((stage, index) => {
                const currentIndex = ["Pending", "Scheduled", "Completed"].indexOf(latest.status);
                return <div className={index <= currentIndex ? "done" : ""} key={stage}><i>{index < currentIndex ? <Check /> : index + 1}</i><span>{stage}</span></div>;
              })}
            </div>
            <div className="user-request-summary"><span><CalendarDays />{new Date(`${latest.preferredDate}T00:00:00`).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</span><span><Weight />{latest.estimatedWeight} kg</span><span><PackageCheck />{latest.category}</span></div>
          </div> : <div className="empty-inline"><Recycle /><strong>No pickup requests yet</strong><span>Create your first request to get started.</span></div>}
        </div>
        <div className="card user-guide">
          <CardHeader title="Prepare for collection" subtitle="Three simple safety steps" />
          <div className="guide-list">
            <div><span>1</span><div><strong>Keep items dry</strong><p>Store devices away from water and direct sunlight.</p></div></div>
            <div><span>2</span><div><strong>Separate batteries</strong><p>Do not mix damaged batteries with other electronics.</p></div></div>
            <div><span>3</span><div><strong>Do not dismantle</strong><p>Leave screens, boards, and batteries intact.</p></div></div>
          </div>
        </div>
      </section>
      <section className="user-impact-strip">
        <TreePine /><div><span>Your estimated contribution</span><strong>{data.impact.landfillAvoided} kg kept away from landfill</strong></div>
        <button className="button secondary" onClick={() => navigate("/centers")}><MapPin size={16} />Find a drop-off center</button>
      </section>
    </>
  );
}

function CollectorOverview() {
  const { data, loading, error, reload } = useData("/collector/overview");
  const navigate = useNavigate();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const nextPickup = data.active[0];

  return (
    <>
      <PageIntro
        eyebrow="Field operations"
        title="Your collection day."
        description="Assigned stops, expected load, and safety priorities in one place."
        actions={<button className="button primary" onClick={() => navigate("/routes")} disabled={!data.active.length}><RouteIcon size={17} />Open my route</button>}
      />
      <section className="metric-grid collector-metrics">
        <MetricCard icon={Truck} label="Assigned pickups" value={data.active.length} note="Active collection requests" tone="green" trend="My work" />
        <MetricCard icon={Weight} label="Expected load" value={`${data.totalLoad} kg`} note="Across assigned pickups" tone="blue" trend="Today" />
        <MetricCard icon={Check} label="Completed" value={data.completed} note="Collections completed" tone="amber" trend="Progress" />
        <MetricCard icon={AlertTriangle} label="High-risk batches" value={data.highRiskItems.length} note="Handle with extra care" tone="red" trend="Safety" />
      </section>
      <section className="collector-home-grid">
        <div className="card collector-next">
          <CardHeader title="Next assigned pickup" subtitle="Your highest-priority collection stop" />
          {nextPickup ? (
            <div className="next-stop">
              <div className="next-stop-marker"><MapPin /></div>
              <div className="next-stop-title"><span>{nextPickup.id}</span><h3>{nextPickup.requester}</h3><p>{nextPickup.address}</p></div>
              <Status status={nextPickup.status} />
              <div className="next-stop-details">
                <div><CalendarDays /><span>Collection date<strong>{new Date(`${nextPickup.preferredDate}T00:00:00`).toLocaleDateString("en", { month: "long", day: "numeric" })}</strong></span></div>
                <div><Weight /><span>Expected load<strong>{nextPickup.estimatedWeight} kg</strong></span></div>
                <div><PackageCheck /><span>Waste stream<strong>{nextPickup.category}</strong></span></div>
              </div>
              {nextPickup.notes && <div className="safety-note"><ShieldCheck /><span><strong>Collection note</strong>{nextPickup.notes}</span></div>}
              <button className="button primary" onClick={() => navigate("/pickups")}>View pickup details <ArrowRight size={16} /></button>
            </div>
          ) : <div className="empty-inline"><Check /><strong>No active pickups</strong><span>Your assigned work is complete.</span></div>}
        </div>
        <div className="card">
          <CardHeader title="Safety priorities" subtitle="High-risk inventory awaiting processing" />
          <div className="risk-list">
            {data.highRiskItems.map((item) => <div key={item.id}><span><AlertTriangle /></span><div><strong>{item.category}</strong><small>{item.id} · {item.location}</small></div><b>{item.weight} kg</b></div>)}
          </div>
          <div className="collector-center"><Factory /><div><span>Return hub</span><strong>{data.center.name}</strong><small>{data.center.address}</small></div></div>
        </div>
      </section>
    </>
  );
}

function BrandMark() {
  return <span className="brand-mark"><Recycle size={22} /></span>;
}

function PageIntro({ eyebrow, title, description, actions }) {
  return (
    <div className="page-intro">
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function Loading() {
  return <div className="loading-state"><Recycle className="spinner" /><strong>Gathering your data</strong><span>Just a moment...</span></div>;
}

function ErrorState({ message, onRetry }) {
  return <div className="empty-state"><AlertTriangle /><h3>We couldn't load this view</h3><p>{message}</p><button className="button secondary" onClick={onRetry}>Try again</button></div>;
}

function useData(path) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const load = async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setState({ data: await api(path), loading: false, error: "" });
    } catch (err) {
      setState({ data: null, loading: false, error: err.message });
    }
  };
  useEffect(() => { load(); }, [path]);
  return { ...state, reload: load };
}

function Overview() {
  const { data, loading, error, reload } = useData("/overview");
  const navigate = useNavigate();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { totals } = data.analytics;

  return (
    <>
      <PageIntro
        eyebrow="Saturday, June 6"
        title="Good afternoon, Ariana."
        description="Here’s how your collection network is performing today."
        actions={<><button className="button secondary" onClick={() => navigate("/routes")}><RouteIcon size={17} />Plan route</button><button className="button primary" onClick={() => navigate("/inventory")}><Plus size={17} />Add e-waste</button></>}
      />
      <section className="metric-grid">
        <MetricCard icon={Weight} label="E-waste recorded" value={`${totals.weight} kg`} note="Across all collection sources" tone="green" trend="+12.4%" />
        <MetricCard icon={Recycle} label="Recycling rate" value={`${totals.recoveryRate}%`} note={`${totals.recycledWeight} kg fully recycled`} tone="blue" trend="+4.2%" />
        <MetricCard icon={Truck} label="Active pickups" value={totals.activePickups} note="Across the next 4 days" tone="amber" trend="On track" />
        <MetricCard icon={AlertTriangle} label="Needs attention" value={totals.highRisk} note="High-risk pending batches" tone="red" trend="Review" />
      </section>
      <section className="dashboard-grid">
        <div className="card span-2">
          <CardHeader title="Collection trend" subtitle="Monthly weight recorded" action={<button className="text-button" onClick={() => navigate("/analytics")}>View analytics <ChevronRight size={16} /></button>} />
          <div className="chart-large">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.analytics.monthly} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs><linearGradient id="collectionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1b7f5a" stopOpacity={0.28} /><stop offset="100%" stopColor="#1b7f5a" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#e8ece7" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#7a847e", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#7a847e", fontSize: 12 }} unit=" kg" />
                <Tooltip content={<ChartTooltip unit=" kg" />} />
                <Area type="monotone" dataKey="weight" stroke="#1b7f5a" strokeWidth={3} fill="url(#collectionFill)" dot={{ r: 4, fill: "#fff", stroke: "#1b7f5a", strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <CardHeader title="By category" subtitle="Share of recorded weight" />
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart><Pie data={data.analytics.categories} dataKey="weight" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3}>{data.analytics.categories.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}</Pie><Tooltip content={<ChartTooltip unit=" kg" />} /></PieChart>
            </ResponsiveContainer>
            <div className="donut-center"><strong>{totals.weight}</strong><span>total kg</span></div>
          </div>
          <div className="mini-legend">
            {data.analytics.categories.slice(0, 4).map((item, i) => <div key={item.name}><i style={{ background: CATEGORY_COLORS[i] }} /><span>{item.name}</span><strong>{item.weight} kg</strong></div>)}
          </div>
        </div>
      </section>
      <section className="dashboard-grid lower">
        <div className="card span-2">
          <CardHeader title="Recent inventory" subtitle="Latest registered e-waste batches" action={<button className="text-button" onClick={() => navigate("/inventory")}>See all <ChevronRight size={16} /></button>} />
          <div className="table-wrap compact">
            <table><thead><tr><th>Batch</th><th>Category</th><th>Location</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>{data.recentItems.map((item) => <tr key={item.id}><td><strong>{item.id}</strong></td><td><CategoryCell category={item.category} /></td><td>{item.location}</td><td>{item.weight} kg</td><td><Status status={item.status} /></td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <CardHeader title="Next pickups" subtitle="Upcoming collection requests" />
          <div className="pickup-list">
            {data.pickups.slice(0, 3).map((pickup, i) => (
              <div className="pickup-mini" key={pickup.id}>
                <div className="date-block"><strong>{new Date(`${pickup.preferredDate}T00:00:00`).getDate()}</strong><span>{new Date(`${pickup.preferredDate}T00:00:00`).toLocaleString("en", { month: "short" })}</span></div>
                <div><strong>{pickup.location}</strong><span>{pickup.requester}</span></div>
                <span className={`priority-dot ${i === 0 ? "soon" : ""}`} />
              </div>
            ))}
          </div>
          <button className="button secondary wide" onClick={() => navigate("/pickups")}>Manage pickups <ArrowRight size={16} /></button>
        </div>
      </section>
      <section className="impact-banner">
        <div className="impact-art"><TreePine /><Leaf /><Recycle /></div>
        <div><span className="eyebrow light">Your environmental impact</span><h3>Materials deserve more than one life.</h3><p>Your recycling activity has kept valuable resources in circulation and harmful waste out of landfills.</p></div>
        <div className="impact-metrics">
          <div><strong>{data.analytics.impact.co2Avoided} kg</strong><span>CO2 emissions avoided</span></div>
          <div><strong>{data.analytics.impact.landfillAvoided} kg</strong><span>Landfill waste avoided</span></div>
          <div><strong>{data.analytics.impact.treesEquivalent}</strong><span>Trees equivalent</span></div>
        </div>
      </section>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone, trend }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={21} /></div><div className="metric-top"><span>{label}</span><span className={`trend ${tone}`}>{trend}</span></div><strong>{value}</strong><p>{note}</p></div>;
}

function CardHeader({ title, subtitle, action }) {
  return <div className="card-header"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function ChartTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span>{label || payload[0].name}</span><strong>{payload[0].value}{unit}</strong></div>;
}

function Inventory({ user }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [modal, setModal] = useState(false);
  const path = `/items?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&category=${encodeURIComponent(category)}`;
  const { data, loading, error, reload } = useData(path);

  async function updateStatus(id, nextStatus) {
    await api(`/items/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
    reload();
  }

  async function deleteItem(id) {
    await api(`/items/${id}`, { method: "DELETE" });
    reload();
  }

  function exportCsv() {
    const headers = ["ID", "Category", "Quantity", "Weight", "Location", "Condition", "Hazard", "Status", "Source"];
    const rows = data.map((item) => [item.id, item.category, item.quantity, item.weight, item.location, item.condition, item.hazard, item.status, item.source]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "ecocircuit-inventory.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <>
      <PageIntro eyebrow={user.role === "admin" ? "Waste registry" : "Field collection"} title={user.role === "admin" ? "Inventory" : "Record collection"} description={user.role === "admin" ? "Track every batch from collection through responsible recycling." : "Register collected e-waste and confirm pending batches at pickup."} actions={<>{user.role === "admin" && <button className="button secondary" onClick={exportCsv} disabled={!data}><Download size={17} />Export CSV</button>}<button className="button primary" onClick={() => setModal(true)}><Plus size={17} />Add record</button></>} />
      <div className="filter-bar">
        <div className="search-box"><Search size={18} /><input placeholder="Search by batch, category, location..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select value={category} onChange={setCategory} icon={Filter} options={["All", ...CATEGORIES]} />
        <Select value={status} onChange={setStatus} icon={Activity} options={["All", "Pending", "Collected", "Processing", "Recycled"]} />
      </div>
      <div className="card table-card">
        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : (
          <>
            <div className="table-summary"><span><strong>{data.length}</strong> records found</span><span>Updated just now</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Batch ID</th><th>Category</th><th>Source & location</th><th>Quantity</th><th>Weight</th><th>Hazard</th><th>Status</th>{user.role === "admin" && <th></th>}</tr></thead>
                <tbody>{data.map((item) => <tr key={item.id}>
                  <td><strong>{item.id}</strong><small>{new Date(item.createdAt).toLocaleDateString()}</small></td>
                  <td><CategoryCell category={item.category} /></td>
                  <td><strong className="cell-primary">{item.source}</strong><small><MapPin size={12} />{item.location}</small></td>
                  <td>{item.quantity} pcs</td><td><strong>{item.weight} kg</strong></td>
                  <td><Hazard level={item.hazard} /></td>
                  <td>{user.role === "admin" || item.status === "Pending" ? <InlineStatus status={item.status} options={user.role === "admin" ? ["Pending", "Collected", "Processing", "Recycled"] : ["Pending", "Collected"]} onChange={(value) => updateStatus(item.id, value)} /> : <Status status={item.status} />}</td>
                  {user.role === "admin" && <td className="delete-cell"><button className="icon-button danger" onClick={() => deleteItem(item.id)} title="Delete item"><X size={15} /></button></td>}
                </tr>)}</tbody>
              </table>
            </div>
            {!data.length && <div className="empty-inline"><Search /><strong>No matching records</strong><span>Try changing your search or filters.</span></div>}
          </>
        )}
      </div>
      {modal && <ItemModal onClose={() => setModal(false)} onCreated={() => { setModal(false); reload(); }} />}
    </>
  );
}

function Select({ value, onChange, options, icon: Icon }) {
  return <label className="select-box">{Icon && <Icon size={16} />}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} /></label>;
}

function ItemModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    wasteItems: [{ category: "Mobile phones", quantity: 1, weight: "", condition: "Used", hazard: "Medium" }],
    location: "",
    lat: "23.7808",
    lng: "90.4071",
    source: ""
  });
  return <Modal title="Register e-waste" subtitle="Add a traceable batch to your inventory." onClose={onClose}><FormSubmit endpoint="/items" form={form} onSuccess={onCreated} onCancel={onClose}>
    <div className="form-grid">
      <Field label="Source"><input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g. Campus laboratory" required /></Field>
      <Field label="Location" wide><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Area or neighborhood" required /></Field>
      <Field label="Waste types" wide><WasteItemsEditor value={form.wasteItems} onChange={(wasteItems) => setForm({ ...form, wasteItems })} detailed /></Field>
      <Field label="Choose collection point on map" wide><LocationPicker lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => setForm({ ...form, lat, lng, location: form.location || "Selected map location" })} /></Field>
    </div>
  </FormSubmit></Modal>;
}

function Pickups({ user }) {
  const { data, loading, error, reload } = useData("/pickups");
  const collectorsState = useData(user.role === "admin" ? "/collectors" : "/pickups");
  const [modal, setModal] = useState(false);
  const location = useLocation();
  useEffect(() => {
    if (user.role === "user" && new URLSearchParams(location.search).get("new") === "1") setModal(true);
  }, [location.search, user.role]);
  async function updateStatus(id, status) {
    await api(`/pickups/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    reload();
  }
  async function assign(id, collectorId) {
    await api(`/pickups/${id}/assignment`, { method: "PATCH", body: JSON.stringify({ collectorId }) });
    reload();
  }
  async function cancelRequest(id) {
    await api(`/pickups/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: "Cancelled" }) });
    reload();
  }
  async function deletePickup(id) {
    await api(`/pickups/${id}`, { method: "DELETE" });
    reload();
  }
  return (
    <>
      <PageIntro eyebrow={user.role === "user" ? "Responsible disposal" : "Collection operations"} title={user.role === "admin" ? "Pickup requests" : user.role === "collector" ? "My assigned pickups" : "My pickup requests"} description={user.role === "admin" ? "Schedule, assign, coordinate, and complete e-waste collections." : user.role === "collector" ? "Follow your assigned collection schedule and mark completed stops." : "Request collection and follow its progress from submission to recycling."} actions={user.role !== "collector" && <button className="button primary" onClick={() => setModal(true)}><Plus size={17} />Request pickup</button>} />
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="pickup-board">
          {(user.role === "user" ? ["Pending", "Scheduled", "Completed", "Cancelled"] : ["Pending", "Scheduled", "Completed"]).map((group) => (
            <section className="pickup-column" key={group}>
              <div className="column-head"><div><i className={group.toLowerCase()} /><h3>{group}</h3></div><span>{data.filter((x) => x.status === group).length}</span></div>
              <div className="column-list">
                {data.filter((x) => x.status === group).map((pickup) => (
                  <article className="pickup-card" key={pickup.id}>
                    <div className="pickup-card-top"><span>{pickup.id}</span>{user.role === "admin" ? <InlineStatus status={pickup.status} options={["Pending", "Scheduled", "Completed", "Cancelled"]} onChange={(value) => updateStatus(pickup.id, value)} compact /> : <Status status={pickup.status} />}</div>
                    <h4>{pickup.requester}</h4><p><MapPin size={14} />{pickup.address}</p>
                    <div className="pickup-data"><div><CalendarDays /><span>Preferred date<strong>{new Date(`${pickup.preferredDate}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</strong></span></div><div><Weight /><span>Estimated load<strong>{pickup.estimatedWeight} kg</strong></span></div></div>
                    <div className="pickup-category"><PackageCheck size={15} />{pickup.category}</div>
                    {pickup.wasteItems?.length > 0 && <div className="pickup-waste-list">{pickup.wasteItems.map((item) => <span key={item.category}><strong>{item.category}</strong>{item.quantity} pcs · {item.weight} kg</span>)}</div>}
                    {pickup.notes && <p className="pickup-note">{pickup.notes}</p>}
                    {user.role === "admin" && <label className="assignment-control"><span>Assigned collector</span><select value={pickup.assignedTo || ""} onChange={(e) => assign(pickup.id, e.target.value)}><option value="">Unassigned</option>{(collectorsState.data || []).map((collector) => <option value={collector.id} key={collector.id}>{collector.name}</option>)}</select></label>}
                    {user.role === "admin" && <button className="button danger-outline wide" onClick={() => deletePickup(pickup.id)} style={{marginTop: 8}}><X size={15} />Delete pickup</button>}
                    {user.role === "collector" && pickup.status === "Scheduled" && <button className="button primary wide collector-complete" onClick={() => updateStatus(pickup.id, "Completed")}><Check size={16} />Mark pickup complete</button>}
                    {user.role === "user" && pickup.status === "Pending" && <button className="button danger-outline wide collector-complete" onClick={() => cancelRequest(pickup.id)}><X size={15} />Cancel request</button>}
                  </article>
                ))}
                {!data.some((x) => x.status === group) && <div className="column-empty"><Check /><span>Nothing here</span></div>}
              </div>
            </section>
          ))}
        </div>
      )}
      {user.role !== "collector" && modal && <PickupModal user={user} onClose={() => setModal(false)} onCreated={() => { setModal(false); reload(); }} />}
    </>
  );
}

function PickupModal({ user, onClose, onCreated }) {
  const [form, setForm] = useState({
    requester: user?.role === "user" ? user.name : "",
    phone: "",
    address: "",
    location: "",
    lat: "23.7808",
    lng: "90.4071",
    preferredDate: "2026-06-08",
    wasteItems: [{ category: "Mobile phones", quantity: 1, weight: "" }],
    notes: ""
  });
  return <Modal title="Request a pickup" subtitle="Tell the collection team what, where, and when." onClose={onClose}><FormSubmit endpoint="/pickups" form={form} onSuccess={onCreated} onCancel={onClose}>
    <div className="form-grid">
      <Field label="Requester / organization"><input value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} required /></Field>
      <Field label="Phone number"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
      <Field label="Full address" wide><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></Field>
      <Field label="Area"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required /></Field>
      <Field label="Preferred date"><input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} required /></Field>
      <Field label="Waste types" wide><WasteItemsEditor value={form.wasteItems} onChange={(wasteItems) => setForm({ ...form, wasteItems })} /></Field>
      <Field label="Choose pickup point on map" wide><LocationPicker lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => setForm({ ...form, lat, lng, location: form.location || "Selected map location" })} /></Field>
      <Field label="Collection notes" wide><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Access details, packaging, safety notes..." /></Field>
    </div>
  </FormSubmit></Modal>;
}

function WasteItemsEditor({ value, onChange, detailed = false }) {
  function update(index, field, fieldValue) {
    onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: fieldValue } : item));
  }
  function add() {
    onChange([...value, { category: "Mobile phones", quantity: 1, weight: "", ...(detailed ? { condition: "Used", hazard: "Medium" } : {}) }]);
  }
  function remove(index) {
    if (value.length > 1) onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }
  const totalWeight = value.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

  return <div className="waste-editor">
    <div className="waste-editor-head"><span>Add every type collected from this location.</span><strong>{totalWeight.toFixed(1)} kg total</strong></div>
    {value.map((item, index) => <div className={`waste-row ${detailed ? "detailed" : ""}`} key={index}>
      <select aria-label={`Waste category ${index + 1}`} value={item.category} onChange={(e) => update(index, "category", e.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select>
      <input aria-label={`Quantity ${index + 1}`} type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => update(index, "quantity", e.target.value)} required />
      <input aria-label={`Weight ${index + 1}`} type="number" min="0.1" step="0.1" placeholder="Weight kg" value={item.weight} onChange={(e) => update(index, "weight", e.target.value)} required />
      {detailed && <select aria-label={`Condition ${index + 1}`} value={item.condition} onChange={(e) => update(index, "condition", e.target.value)}>{["Used", "Obsolete", "Damaged", "Broken", "Mixed", "Leaking risk"].map((condition) => <option key={condition}>{condition}</option>)}</select>}
      {detailed && <select aria-label={`Hazard ${index + 1}`} value={item.hazard} onChange={(e) => update(index, "hazard", e.target.value)}>{["Low", "Medium", "High"].map((hazard) => <option key={hazard}>{hazard}</option>)}</select>}
      <button type="button" className="remove-waste" onClick={() => remove(index)} disabled={value.length === 1} aria-label={`Remove waste type ${index + 1}`}><X size={15} /></button>
    </div>)}
    <button type="button" className="add-waste" onClick={add}><Plus size={15} />Add another waste type</button>
  </div>;
}

function MapClickHandler({ onChange }) {
  useMapEvents({
    click(event) {
      onChange({
        lat: event.latlng.lat.toFixed(6),
        lng: event.latlng.lng.toFixed(6)
      });
    }
  });
  return null;
}

function LocationPicker({ lat, lng, onChange }) {
  const latitude = Number(lat) || defaultCenter[0];
  const longitude = Number(lng) || defaultCenter[1];
  return <div className="location-picker">
    <div className="location-map">
      <MapContainer center={[latitude, longitude]} zoom={12} scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler onChange={onChange} />
        <Marker position={[latitude, longitude]} icon={markerIcon("#e98552")} />
      </MapContainer>
    </div>
    <div className="coordinate-readout"><MapPin size={15} /><span>Click the map to move the collection pin.</span><strong>{latitude.toFixed(5)}, {longitude.toFixed(5)}</strong></div>
  </div>;
}

function FormSubmit({ endpoint, form, children, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError("");
    try { await api(endpoint, { method: "POST", body: JSON.stringify(form) }); onSuccess(); }
    catch (err) { setError(err.message); setLoading(false); }
  }
  return <form onSubmit={submit}>{error && <div className="form-error"><AlertTriangle size={16} />{error}</div>}{children}<div className="modal-actions"><button type="button" className="button secondary" onClick={onCancel}>Cancel</button><button className="button primary" disabled={loading}>{loading ? "Saving..." : "Save record"}<ArrowRight size={16} /></button></div></form>;
}

function Field({ label, children, wide }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span>{children}</label>;
}

function Modal({ title, subtitle, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal"><div className="modal-head"><div><h3>{title}</h3><p>{subtitle}</p></div><button className="icon-button" onClick={onClose}><X /></button></div>{children}</div></div>;
}

function RoutePlanner({ user }) {
  const pickupsState = useData("/pickups");
  const centersState = useData("/centers");
  const [selected, setSelected] = useState([]);
  const [centerId, setCenterId] = useState("");
  const [result, setResult] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (pickupsState.data) setSelected(pickupsState.data.filter((x) => !["Completed", "Cancelled"].includes(x.status)).map((x) => x.id));
  }, [pickupsState.data]);
  useEffect(() => { if (centersState.data?.length) setCenterId(centersState.data[0].id); }, [centersState.data]);

  async function optimize() {
    setLoadingRoute(true);
    try { setResult(await api("/routes/optimize", { method: "POST", body: JSON.stringify({ centerId, pickupIds: selected }) })); }
    finally { setLoadingRoute(false); }
  }
  if (pickupsState.loading || centersState.loading) return <Loading />;
  if (pickupsState.error || centersState.error) return <ErrorState message={pickupsState.error || centersState.error} onRetry={() => { pickupsState.reload(); centersState.reload(); }} />;
  const active = pickupsState.data.filter((x) => !["Completed", "Cancelled"].includes(x.status));
  const mapPoints = result?.route || [];

  return (
    <>
      <PageIntro eyebrow="Logistics intelligence" title={user.role === "admin" ? "Route planner" : "My collection route"} description={user.role === "admin" ? "Build a shorter collection route, reduce fuel use, and keep every stop visible." : "Optimize only the pickup stops assigned to your collector account."} actions={<button className="button primary" onClick={optimize} disabled={!selected.length || loadingRoute}><Zap size={17} />{loadingRoute ? "Optimizing..." : "Optimize route"}</button>} />
      <div className="route-layout">
        <aside className="route-controls card">
          <div className="route-section"><span className="step-label">01 / STARTING POINT</span><h3>Choose a collection hub</h3><select value={centerId} onChange={(e) => { setCenterId(e.target.value); setResult(null); }}>{centersState.data.map((center) => <option value={center.id} key={center.id}>{center.name}</option>)}</select></div>
          <div className="route-section"><div className="section-row"><div><span className="step-label">02 / PICKUP STOPS</span><h3>Select requests</h3></div><button className="text-button" onClick={() => setSelected(selected.length === active.length ? [] : active.map((x) => x.id))}>{selected.length === active.length ? "Clear" : "Select all"}</button></div>
            <div className="stop-list">{active.map((pickup) => <label className={`stop-option ${selected.includes(pickup.id) ? "selected" : ""}`} key={pickup.id}><input type="checkbox" checked={selected.includes(pickup.id)} onChange={() => { setSelected(selected.includes(pickup.id) ? selected.filter((id) => id !== pickup.id) : [...selected, pickup.id]); setResult(null); }} /><span className="check-box"><Check /></span><span className="stop-number">{pickup.location[0]}</span><span><strong>{pickup.location}</strong><small>{pickup.estimatedWeight} kg · {pickup.category}</small></span></label>)}</div>
          </div>
        </aside>
        <section className="route-map card">
          <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom className="map">
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mapPoints.map((point, index) => <Marker key={`${point.id}-${index}`} position={[point.lat, point.lng]} icon={markerIcon(index === 0 || index === mapPoints.length - 1 ? "#0d3b2e" : "#e98552")}><Popup><strong>{point.name || point.requester}</strong><br />{point.address || point.location}</Popup></Marker>)}
            {mapPoints.length > 1 && <Polyline positions={mapPoints.map((x) => [x.lat, x.lng])} color="#176b4d" weight={5} opacity={0.85} dashArray="1 9" lineCap="round" />}
          </MapContainer>
          {!result && <div className="map-overlay"><div><RouteIcon /><strong>Your optimized route will appear here</strong><span>Select pickup stops, then optimize.</span></div></div>}
          {result && <div className="route-result">
            <div><RouteIcon /><span>Route distance<strong>{result.distance} km</strong></span></div>
            <div><Clock3 /><span>Estimated time<strong>{result.estimatedMinutes} min</strong></span></div>
            <div><Fuel /><span>Estimated fuel<strong>{result.fuelLiters} L</strong></span></div>
            <div><ArrowDownRight /><span>Distance saved<strong>{result.savings} km</strong></span></div>
          </div>}
        </section>
      </div>
      {result && <section className="card route-itinerary"><CardHeader title="Collection itinerary" subtitle={`${selected.length} pickups · ${result.totalLoad} kg expected load`} /><div className="itinerary-list">{result.route.map((point, index) => <div key={`${point.id}-${index}`}><span className={index === 0 || index === result.route.length - 1 ? "depot" : ""}>{index === result.route.length - 1 ? <Check /> : index + 1}</span><div><strong>{index === 0 ? "Depart: " : index === result.route.length - 1 ? "Return: " : ""}{point.name || point.requester}</strong><small>{point.address || point.location}</small></div>{point.estimatedWeight && <b>{point.estimatedWeight} kg</b>}</div>)}</div></section>}
    </>
  );
}

function Analytics() {
  const { data, loading, error, reload } = useData("/analytics");
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <PageIntro eyebrow="Performance & impact" title="Analytics" description="Turn collection activity into practical recycling insight." actions={<button className="button secondary" onClick={() => window.print()}><Download size={17} />Print report</button>} />
      <section className="insight-grid">
        <div className="insight-card green"><Leaf /><span>Recovered materials</span><strong>{data.impact.recoveredMaterials} kg</strong><p>Estimated reusable material from recorded batches.</p></div>
        <div className="insight-card blue"><Factory /><span>CO2 emissions avoided</span><strong>{data.impact.co2Avoided} kg</strong><p>Estimated compared with virgin material production.</p></div>
        <div className="insight-card amber"><TreePine /><span>Landfill diversion</span><strong>{data.impact.landfillAvoided} kg</strong><p>Hazardous and valuable waste kept in circulation.</p></div>
      </section>
      <section className="dashboard-grid analytics-grid">
        <div className="card span-2"><CardHeader title="Category performance" subtitle="Weight and item count by waste stream" /><div className="chart-large taller"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.categories} margin={{ left: -10, right: 10, bottom: 30 }}><CartesianGrid vertical={false} stroke="#e8ece7" /><XAxis dataKey="name" angle={-18} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: "#67736c" }} axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#7a847e" }} /><Tooltip content={<ChartTooltip unit=" kg" />} /><Bar dataKey="weight" radius={[7, 7, 0, 0]}>{data.categories.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i]} />)}</Bar></BarChart></ResponsiveContainer></div></div>
        <div className="card"><CardHeader title="Processing status" subtitle="Recorded weight by stage" /><div className="donut-wrap analytics-donut"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data.statuses} dataKey="value" innerRadius={70} outerRadius={105} paddingAngle={4}>{data.statuses.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}</Pie><Tooltip content={<ChartTooltip unit=" kg" />} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{data.totals.recoveryRate}%</strong><span>recycled</span></div></div><div className="status-legend">{data.statuses.map((item, i) => <div key={item.name}><i style={{ background: STATUS_COLORS[i] }} /><span>{item.name}</span><strong>{item.value} kg</strong></div>)}</div></div>
      </section>
      <section className="card insight-callout"><div className="insight-callout-icon"><Sparkles /></div><div><span className="eyebrow">Operational insight</span><h3>Batteries and circuit boards need priority handling.</h3><p>These high-risk categories represent a meaningful share of pending inventory. Schedule sealed transport and route them directly to the central processing hub.</p></div><a href="/routes" className="button primary">Plan priority route <ArrowRight size={16} /></a></section>
    </>
  );
}

function Centers({ user }) {
  const { data, loading, error, reload } = useData("/centers");
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <PageIntro eyebrow="Collection network" title={user?.role === "user" ? "Drop-off centers" : "Collection centers"} description={user?.role === "user" ? "Find a nearby location for safe e-waste drop-off." : "Monitor capacity and find the best destination for incoming e-waste."} />
      <div className="centers-layout">
        <div className="centers-list">{data.map((center) => { const hasCapacity = Number.isFinite(center.currentLoad) && Number.isFinite(center.capacity); const percent = hasCapacity ? Math.round(center.currentLoad / center.capacity * 100) : 0; return <article className="center-card card" key={center.id}><div className="center-icon"><Factory /></div><div className="center-main"><div className="center-title"><div><span>{center.id}</span><h3>{center.name}</h3></div><Status status={hasCapacity && percent > 80 ? "Near capacity" : "Accepting"} /></div><p><MapPin />{center.address}</p><p><UserRound />{center.phone}</p>{hasCapacity && <><div className="capacity-row"><span>Storage utilization</span><strong>{center.currentLoad} / {center.capacity} kg</strong></div><div className="progress"><i style={{ width: `${percent}%` }} /></div><small>{100 - percent}% capacity available</small></>}</div></article>; })}</div>
        <div className="card centers-map"><MapContainer center={defaultCenter} zoom={12} scrollWheelZoom className="map"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{data.map((center) => <Marker key={center.id} position={[center.lat, center.lng]} icon={markerIcon()}><Popup><strong>{center.name}</strong><br />{center.address}{Number.isFinite(center.capacity) && Number.isFinite(center.currentLoad) && <><br />{center.capacity - center.currentLoad} kg available</>}</Popup></Marker>)}</MapContainer><div className="map-label"><LocateFixed /><span><strong>{data.length} active centers</strong> across Dhaka</span></div></div>
      </div>
    </>
  );
}

function CategoryCell({ category }) {
  const iconMap = { "Mobile phones": Zap, Batteries: BatteryCharging, Chargers: Activity, "Circuit boards": Recycle, "Keyboards & mice": ClipboardList, Cables: Boxes, "Screens & monitors": CircleGauge };
  const Icon = iconMap[category] || Recycle;
  return <div className="category-cell"><span><Icon size={15} /></span><strong>{category}</strong></div>;
}

function Status({ status }) {
  return <span className={`status status-${status.toLowerCase().replaceAll(" ", "-")}`}><i />{status}</span>;
}

function Hazard({ level }) {
  return <span className={`hazard hazard-${level.toLowerCase()}`}><AlertTriangle size={14} />{level}</span>;
}

function InlineStatus({ status, options, onChange, compact }) {
  return <label className={`inline-status ${compact ? "compact" : ""}`}><Status status={status} /><select value={status} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={13} /></label>;
}

export default App;
