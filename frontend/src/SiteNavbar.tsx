import { Link } from "react-router";
import "./SiteNavbar.css";

function SiteNavbar() {
  return (
    <nav className="navbar">
      <ul>
        <li>
          <Link to="/" className="title">
            Yucheng's Tutoring
          </Link>
        </li>
        <li>
          <Link to="/book">Book</Link>
        </li>
        <li>
          <Link to="/">About</Link>
        </li>
        <li>
          <Link to="/login">Log In</Link>
        </li>
        <li>
          <Link to="/register">Sign Up</Link>
        </li>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
      </ul>
    </nav>
  );
}

export default SiteNavbar;
