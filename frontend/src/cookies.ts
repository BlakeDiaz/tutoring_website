/**
 * Gets a cookie from a name.
 *
 * @param name Name of the cookie.
 * @returns The value of the cookie if the cookie is present, and "" otherwise.
 */
export const getCookie = (name: string): string => {
  const cookie = getCookieHelper(name);

  if (cookie === undefined) {
    return "";
  }

  return cookie;
};

// See https://flask-jwt-extended.readthedocs.io/en/stable/token_locations.html#cookies
const getCookieHelper = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift();
  }

  return undefined;
};
