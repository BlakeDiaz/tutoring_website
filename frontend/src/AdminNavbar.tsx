import { Link } from "react-router";
import "./SiteNavbar.css";
import { useState } from "react";

function AdminNavbar() {
  if (window.innerWidth >= 1200) {
    return <AdminNavbarDesktop></AdminNavbarDesktop>;
  } else {
    return <AdminNavbarMobile></AdminNavbarMobile>;
  }
}

function AdminNavbarDesktop() {
  return (
    <nav className="navbar-desktop">
      <ul>
        <li>
          <Link className="logo-link" to="/admin">
            Admin
          </Link>
        </li>
        <li>
          <Link to="/admin_appointment_panel">Appointment Panel</Link>
        </li>
        <li>
          <Link to="/admin_add_appointment">Add Appointment</Link>
        </li>
      </ul>
    </nav>
  );
}

function AdminNavbarMobile() {
  const [show_links, setShowLinks] = useState(false);

  function renderSubLinks() {
    if (show_links) {
      return (
        <div>
          <Link to="/admin_appointment_panel">Appointment Panel</Link>
          <Link to="/admin_add_appointment">Add Appointment</Link>
        </div>
      );
    }

    return <></>;
  }

  return (
    <div className="navbar-mobile">
      <Link className="logo-link" to="/admin">
        Admin
      </Link>
      {renderSubLinks()}
      <a className="icon" onClick={() => setShowLinks(!show_links)}>
        <i className="fa fa-bars"></i>
      </a>
    </div>
  );
}

export default AdminNavbar;
