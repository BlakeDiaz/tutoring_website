import { Link } from "react-router";

function SiteNavbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Yucheng's Tutoring</Link>
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
          <Link to="/dashboard">Dashboard</Link>
        </li>
      </ul>
    </nav>
  );
}

export default SiteNavbar;
