import { useState, type JSX } from "react";
import SiteNavbar from "./SiteNavbar";
import { useNavigate, useSearchParams } from "react-router";
import { getRedirectURL } from "./redirects";

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [search_params, _setSearchParams] = useSearchParams();

  function doCancelClick(): void {
    navigate("/");
  }

  function doRegisterClick(): void {
    if (name === "" || email === "" || password === "") {
      return;
    }

    const body = {
      name: name,
      email: email,
      password: password,
    };
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(doRegisterResp)
      .catch(doRegisterError);
  }

  function doRegisterResp(res: Response): void {
    if (res.status === 200) {
      localStorage.setItem("logged_in", "true");
      const redirect_url = getRedirectURL("/", search_params);
      navigate(redirect_url);
    } else if (res.status === 400) {
      const p = res.text();
      p.then(setError);
      p.catch((ex) => doRegisterError("400 response is not text", ex));
    } else if (res.status === 409) {
      const p = res.text();
      p.then(setError);
      p.catch((ex) => doRegisterError("409 response is not text", ex));
    } else {
      doRegisterError(`Bad status code: ${res.status}`);
    }
  }

  function doRegisterError(msg: string, ex?: unknown): void {
    console.error(`fetch of /api/auth/register failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  return (
    <div>
      <SiteNavbar />
      <div className="login-form">
        <h1>Sign Up</h1>
        {renderError(error)}
        <ul>
          <li>
            <div className="login-input">
              <label htmlFor="name">Name:</label>
              <br />
              <input type="text" id="name" name="name" required onChange={(evt) => setName(evt.target.value)} />
            </div>
          </li>
          <li>
            <div className="login-input">
              <label htmlFor="email">Email Address:</label>
              <br />
              <input type="text" id="email" name="email" required onChange={(evt) => setEmail(evt.target.value)} />
            </div>
          </li>
          <li>
            <div className="login-input">
              <label htmlFor="password">Password:</label>
              <br />
              <input
                type="text"
                id="password"
                name="password"
                required
                onChange={(evt) => setPassword(evt.target.value)}
              />
            </div>
          </li>
          <li>
            <div className="login-buttons">
              <button onClick={doCancelClick}>Cancel</button>
              <button onClick={doRegisterClick}>Register</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

const renderError = (error: string): JSX.Element => {
  if (error === "") {
    return <></>;
  } else {
    return (
      <>
        <p className="form-error">{error}</p>
      </>
    );
  }
};

export default RegisterForm;
