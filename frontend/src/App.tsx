import { Link } from "react-router";
import "./App.css";
import SiteNavbar from "./SiteNavbar";
import study_image from "./assets/study_image.jpg";

function App() {
  return (
    <div>
      <SiteNavbar />
      <div className="homepage-wrapper">
        <div className="homepage-text">
          <h1 className="homepage-header">Learn. Understand. Succeed.</h1>
          <p className="homepage-paragraph">
            Take your next step towards success at YuCheng's Tutoring. We offer personalized tutoring sessions in a wide
            array of subjects, from Calculus to Organic Chemistry. Invest in your future today, and reap the rewards
            tomorrow.
          </p>
          <div className="links-wrapper">
            <Link className="button-link" to="/book">
              Book Today
            </Link>
            <Link className="redirect-link" to="/register">
              Sign Up
            </Link>
          </div>
        </div>
        <img className="homepage-image" src={study_image}></img>
      </div>
    </div>
  );
}

export default App;
