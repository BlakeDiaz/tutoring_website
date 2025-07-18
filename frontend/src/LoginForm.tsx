import { useState, type JSX } from "react";
import SiteNavbar from "./SiteNavbar";
import { useNavigate, useSearchParams } from "react-router";
import { getRedirectURL } from "./redirects";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [search_params, _setSearchParams] = useSearchParams();

  function doLoginClick(): void {
    if (email === "" || password === "") {
      return;
    }

    const body = {
      email: email,
      password: password,
    };
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(doLoginResp)
      .catch(doLoginError);
  }

  function doLoginResp(res: Response): void {
    if (res.status === 200) {
      const redirect_url = getRedirectURL("/", search_params);
      navigate(redirect_url);
    } else if (res.status === 400) {
      const p = res.text();
      p.then(setError);
      p.catch((ex) => doLoginError("400 response is not text", ex));
    } else {
      doLoginError(`Bad status code: ${res.status}`);
    }
  }

  function doLoginError(msg: string, ex?: unknown): void {
    console.error(`fetch of /api/auth/login failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  return (
    <div>
      <SiteNavbar />
      <div>
        <h1>Log In</h1>
        <label htmlFor="email">Email Address:</label>
        <br />
        <input type="text" id="email" name="email" required onChange={(evt) => setEmail(evt.target.value)} />
        <br />
        <label htmlFor="password">Password:</label>
        <br />
        <input type="text" id="password" name="password" required onChange={(evt) => setPassword(evt.target.value)} />
        <br />
        <button onClick={doLoginClick}>Login</button>
        {renderError(error)}
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
        <br />
        <p>{error}</p>
      </>
    );
  }
};

export default LoginForm;
