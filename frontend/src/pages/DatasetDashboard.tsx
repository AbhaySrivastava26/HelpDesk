import React from "react";
import {
  AlertTriangle,
  Building2,
  Clock3,
  Database,
  LayoutDashboard,
  MapPinned,
  Route,
  ShieldCheck,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";
import "./DatasetDashboard.css";

type BarItem = {
  label: string;
  value: number;
  pct: number;
};

type WorkloadItem = {
  team: string;
  technicians: number;
  tickets_handled: number;
  avg_resolution_hours: number;
};

type RecentTicket = {
  ticket_id: string;
  employee_id: string;
  actual_issue_type: string;
  assigned_team: string;
  priority: string;
  status: string;
  created_time: string;
};

const summaryCards = [
  {
    label: "Employees",
    value: "6000",
    note: "5 locations, enterprise-wide coverage",
    icon: Users,
  },
  {
    label: "Historical Tickets",
    value: "18000",
    note: "Across submission, assignment, and resolution lifecycle",
    icon: Ticket,
  },
  {
    label: "Misrouted Tickets",
    value: "15387",
    note: "Reported issue differs from actual issue",
    icon: Route,
  },
  {
    label: "Reassigned Tickets",
    value: "5000",
    note: "Tickets bounced between teams",
    icon: AlertTriangle,
  },
  {
    label: "Avg Assign Delay",
    value: "23.9h",
    note: "Mean time from creation to first assignment",
    icon: Clock3,
  },
  {
    label: "Avg Resolution",
    value: "60.3h",
    note: "Mean time from creation to resolution",
    icon: ShieldCheck,
  },
] as const;

const issueData: BarItem[] = [{'label': 'VPN Issue', 'value': 2614, 'pct': 100}, {'label': 'Software Issue', 'value': 2611, 'pct': 100}, {'label': 'Hardware Failure', 'value': 2596, 'pct': 99}, {'label': 'Email Problem', 'value': 2586, 'pct': 99}, {'label': 'Access Request', 'value': 2546, 'pct': 97}, {'label': 'Network Issue', 'value': 2534, 'pct': 97}, {'label': 'Printer Issue', 'value': 2513, 'pct': 96}];
const departmentData: BarItem[] = [{'label': 'Engineering', 'value': 2175, 'pct': 100}, {'label': 'Customer Support', 'value': 2110, 'pct': 97}, {'label': 'Marketing', 'value': 2093, 'pct': 96}, {'label': 'Finance', 'value': 2036, 'pct': 94}, {'label': 'HR', 'value': 1952, 'pct': 90}, {'label': 'Legal', 'value': 1944, 'pct': 89}];
const locationData: BarItem[] = [{'label': 'Delhi', 'value': 3678, 'pct': 100}, {'label': 'Hyderabad', 'value': 3629, 'pct': 99}, {'label': 'Bangalore', 'value': 3623, 'pct': 99}, {'label': 'Mumbai', 'value': 3553, 'pct': 97}, {'label': 'Pune', 'value': 3517, 'pct': 96}];
const teamData: BarItem[] = [{'label': 'Access Management', 'value': 3038, 'pct': 100}, {'label': 'Hardware Support', 'value': 3031, 'pct': 100}, {'label': 'Security Team', 'value': 3001, 'pct': 99}, {'label': 'Network Team', 'value': 2998, 'pct': 99}, {'label': 'Infrastructure Team', 'value': 2982, 'pct': 98}, {'label': 'Software Support', 'value': 2950, 'pct': 97}];
const workloadData: WorkloadItem[] = [{'team': 'Software Support', 'technicians': 23, 'tickets_handled': 1739, 'avg_resolution_hours': 21.9}, {'team': 'Hardware Support', 'technicians': 23, 'tickets_handled': 1530, 'avg_resolution_hours': 25.9}, {'team': 'Infrastructure Team', 'technicians': 24, 'tickets_handled': 1425, 'avg_resolution_hours': 23.2}, {'team': 'Network Team', 'technicians': 17, 'tickets_handled': 1269, 'avg_resolution_hours': 21.2}, {'team': 'Security Team', 'technicians': 19, 'tickets_handled': 1259, 'avg_resolution_hours': 20.5}, {'team': 'Access Management', 'technicians': 14, 'tickets_handled': 999, 'avg_resolution_hours': 18.7}];
const recentTickets: RecentTicket[] = [{'ticket_id': 'TKT-23575', 'employee_id': 'EMP-14233', 'actual_issue_type': 'Hardware Failure', 'assigned_team': 'Security Team', 'priority': 'Low', 'status': 'In Progress', 'created_time': '2026-03-30 23:00'}, {'ticket_id': 'TKT-29171', 'employee_id': 'EMP-13419', 'actual_issue_type': 'Email Problem', 'assigned_team': 'Software Support', 'priority': 'Low', 'status': 'Closed', 'created_time': '2026-03-30 22:00'}, {'ticket_id': 'TKT-24352', 'employee_id': 'EMP-14656', 'actual_issue_type': 'VPN Issue', 'assigned_team': 'Infrastructure Team', 'priority': 'Medium', 'status': 'Closed', 'created_time': '2026-03-30 22:00'}, {'ticket_id': 'TKT-27513', 'employee_id': 'EMP-15266', 'actual_issue_type': 'Printer Issue', 'assigned_team': 'Hardware Support', 'priority': 'Critical', 'status': 'In Progress', 'created_time': '2026-03-30 22:00'}, {'ticket_id': 'TKT-25030', 'employee_id': 'EMP-11451', 'actual_issue_type': 'Software Issue', 'assigned_team': 'Network Team', 'priority': 'High', 'status': 'In Progress', 'created_time': '2026-03-30 21:00'}, {'ticket_id': 'TKT-29543', 'employee_id': 'EMP-14413', 'actual_issue_type': 'Hardware Failure', 'assigned_team': 'Security Team', 'priority': 'Low', 'status': 'Closed', 'created_time': '2026-03-30 21:00'}, {'ticket_id': 'TKT-30449', 'employee_id': 'EMP-11067', 'actual_issue_type': 'Software Issue', 'assigned_team': 'Hardware Support', 'priority': 'Medium', 'status': 'Resolved', 'created_time': '2026-03-30 21:00'}, {'ticket_id': 'TKT-21964', 'employee_id': 'EMP-10473', 'actual_issue_type': 'Hardware Failure', 'assigned_team': 'Infrastructure Team', 'priority': 'High', 'status': 'In Progress', 'created_time': '2026-03-30 21:00'}];

function BarList({ title, subtitle, items, icon: Icon }: {
  title: string;
  subtitle: string;
  items: BarItem[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="dd-card">
      <div className="dd-card-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="dd-icon-box">
          <Icon className="dd-icon" />
        </div>
      </div>

      <div className="dd-bar-list">
        {items.map((item) => (
          <div key={item.label} className="dd-bar-item">
            <div className="dd-bar-meta">
              <span className="dd-bar-label">{item.label}</span>
              <span className="dd-bar-value">{item.value}</span>
            </div>
            <div className="dd-bar-track">
              <div className="dd-bar-fill" style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DatasetDashboard(): JSX.Element {
  return (
    <div className="dd-page">
      <header className="dd-header">
        <div className="dd-container dd-header-inner">
          <div>
            <p className="dd-brand">HELPIQ DATASET VIEW</p>
            <div className="dd-title-row">
              <LayoutDashboard className="dd-title-icon" />
              <h1>IT Helpdesk Dataset Dashboard</h1>
            </div>
            <p className="dd-subtitle">
              Built directly from the hackathon dataset so you can explain the data, the bottlenecks,
              and why AI triage matters.
            </p>
          </div>
        </div>
      </header>

      <main className="dd-container dd-main">
        <section className="dd-summary-grid">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div className="dd-card dd-summary-card" key={card.label}>
                <div className="dd-summary-top">
                  <div>
                    <p className="dd-summary-label">{card.label}</p>
                    <h2 className="dd-summary-value">{card.value}</h2>
                    <p className="dd-summary-note">{card.note}</p>
                  </div>
                  <div className="dd-icon-box">
                    <Icon className="dd-icon" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="dd-hero-grid">
          <div className="dd-card dd-hero-card">
            <div className="dd-card-header">
              <div>
                <h3>Dataset Story</h3>
                <p>What this data says about the current IT support process</p>
              </div>
              <div className="dd-icon-box">
                <Database className="dd-icon" />
              </div>
            </div>
            <ul className="dd-story-list">
              <li>The dataset contains <strong>6000</strong> employees, <strong>18000</strong> historical tickets, <strong>5000</strong> ticket reassignments, and <strong>120</strong> technician workload records.</li>
              <li><strong>15387</strong> tickets appear misrouted because the reported issue type differs from the actual issue type.</li>
              <li>The average first assignment delay is <strong>23.9 hours</strong>, showing why manual triage slows response.</li>
              <li>The average full resolution time is <strong>60.3 hours</strong>, which creates a strong case for AI-assisted routing and prioritization.</li>
              <li>This dashboard helps you explain the baseline problem before showing the AI solution.</li>
            </ul>
          </div>

          <div className="dd-card dd-hero-card">
            <div className="dd-card-header">
              <div>
                <h3>Coverage Snapshot</h3>
                <p>How broad the enterprise support footprint is</p>
              </div>
              <div className="dd-icon-box">
                <MapPinned className="dd-icon" />
              </div>
            </div>

            <div className="dd-mini-grid">
              <div className="dd-mini-stat">
                <span className="dd-mini-label">Locations</span>
                <strong>5</strong>
              </div>
              <div className="dd-mini-stat">
                <span className="dd-mini-label">IT Teams</span>
                <strong>6</strong>
              </div>
              <div className="dd-mini-stat">
                <span className="dd-mini-label">Open / In Progress</span>
                <strong>9083</strong>
              </div>
              <div className="dd-mini-stat">
                <span className="dd-mini-label">Resolved / Closed</span>
                <strong>8917</strong>
              </div>
            </div>

            <div className="dd-callout">
              This is perfect for telling judges: “We are not showing a fake app. We are analyzing a realistic enterprise helpdesk dataset and building AI on top of it.”
            </div>
          </div>
        </section>

        <section className="dd-chart-grid">
          <BarList
            title="Top Actual Issue Types"
            subtitle="Where the support volume is concentrated"
            items={issueData}
            icon={Wrench}
          />
          <BarList
            title="Tickets by Department"
            subtitle="Which business functions generate the most support demand"
            items={departmentData}
            icon={Building2}
          />
          <BarList
            title="Tickets by Location"
            subtitle="Geographic spread of operational demand"
            items={locationData}
            icon={MapPinned}
          />
          <BarList
            title="Assigned Team Distribution"
            subtitle="How tickets are currently being routed"
            items={teamData}
            icon={Route}
          />
        </section>

        <section className="dd-bottom-grid">
          <div className="dd-card">
            <div className="dd-card-header">
              <div>
                <h3>Technician Workload by Team</h3>
                <p>Use this to explain load balancing and smart routing</p>
              </div>
              <div className="dd-icon-box">
                <Users className="dd-icon" />
              </div>
            </div>

            <div className="dd-table-wrap">
              <table className="dd-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Technicians</th>
                    <th>Tickets Handled</th>
                    <th>Avg Resolution Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {workloadData.map((row) => (
                    <tr key={row.team}>
                      <td>{row.team}</td>
                      <td>{row.technicians}</td>
                      <td>{row.tickets_handled}</td>
                      <td>{row.avg_resolution_hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dd-card">
            <div className="dd-card-header">
              <div>
                <h3>Recent Ticket Sample</h3>
                <p>Pull a few ticket rows directly from the dataset for explanation</p>
              </div>
              <div className="dd-icon-box">
                <Ticket className="dd-icon" />
              </div>
            </div>

            <div className="dd-table-wrap">
              <table className="dd-table dd-table-tight">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Employee</th>
                    <th>Issue</th>
                    <th>Team</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((row) => (
                    <tr key={row.ticket_id}>
                      <td>{row.ticket_id}</td>
                      <td>{row.employee_id}</td>
                      <td>{row.actual_issue_type}</td>
                      <td>{row.assigned_team}</td>
                      <td>{row.priority}</td>
                      <td>{row.status}</td>
                      <td>{row.created_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DatasetDashboard;