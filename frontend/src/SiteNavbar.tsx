import { Link } from "react-router";
import "./SiteNavbar.css";
import { useState } from "react";

function SiteNavbar() {
  if (window.innerWidth >= 1200) {
    return <SiteNavbarDesktop></SiteNavbarDesktop>;
  } else {
    return <SiteNavbarMobile></SiteNavbarMobile>;
  }
}

function SiteNavbarDesktop() {
  return (
    <nav className="navbar-desktop">
      <ul>
        <li>
          <Link className="logo-link" to="/">
            YuCheng's Tutoring
          </Link>
        </li>
        <li>
          <Link to="/book">Book</Link>
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

function SiteNavbarMobile() {
  const [show_links, setShowLinks] = useState(false);

  function renderSubLinks() {
    if (show_links) {
      return (
        <div>
          <Link to="/book">Book</Link>
          <Link to="/login">Log In</Link>
          <Link to="/register">Sign Up</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      );
    }

    return <></>;
  }

  return (
    <div className="navbar-mobile">
      <Link className="logo-link" to="/">
        YuCheng's Tutoring
      </Link>
      {renderSubLinks()}
      <a className="icon" onClick={() => setShowLinks(!show_links)}>
        <i className="fa fa-bars"></i>
      </a>
    </div>
  );
}

export default SiteNavbar;
