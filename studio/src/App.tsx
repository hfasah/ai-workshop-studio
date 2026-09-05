import {NavLink, Outlet} from "react-router-dom";

export const App = () => (
  <>
    <header className="topbar">
      <NavLink to="/" className="wordmark">
        <span className="badge">H</span>
        AI Workshop Studio
      </NavLink>
      <nav>
        <NavLink to="/" end>
          Episodes
        </NavLink>
        <NavLink to="/new">New episode</NavLink>
      </nav>
    </header>
    <main className="page">
      <Outlet />
    </main>
  </>
);
