import { Link } from "react-router";

function AdminNavbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/admin">Admin</Link>
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

export default AdminNavbar;
