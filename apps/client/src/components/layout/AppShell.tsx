import { NavLink, Outlet } from "react-router-dom";
import { SummaryToggle } from "./SummaryToggle";

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="brand-org">Mantra4Change</p>
            <h1>PBL Dashboard</h1>
          </div>
        </div>
        <nav className="app-nav" aria-label="Main">
          <NavLink to="/program-review" className={({ isActive }) => (isActive ? "active" : "")}>
            Program Review
          </NavLink>
          <NavLink to="/grants" className={({ isActive }) => (isActive ? "active" : "")}>
            Grants
          </NavLink>
          <NavLink to="/about-assumptions" className={({ isActive }) => (isActive ? "active" : "")}>
            Assumptions
          </NavLink>
        </nav>
        <div className="header-status">
          <SummaryToggle />
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
