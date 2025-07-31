/*
URL redirection is done with two search paramaters. The redirectTo paramater handles which route to redirect the user
to. Example values include 'dashboard' and 'book_new_appointment'. This is done, as opposed to a full URL, to prevent
URL redirection attacks. The redirectParams paramater encodes the search paramaters passed to the redirectTo route. For
example, 'book_new_appointment' uses the 'appointmentID' search paramater to keep track of which appointment is being
booked, so we need to store that for when the redirection occurs.
*/

const whitelisted_redirects = new Set<string>();
whitelisted_redirects.add(encodeURIComponent("/dashboard"));
whitelisted_redirects.add(encodeURIComponent("/book_new_appointment"));
whitelisted_redirects.add(encodeURIComponent("/book_existing_appointment"));

/**
 * Returns whether a local route can be redirected to.
 *
 * @param redirect_to Local route to be checked.
 * @returns True if the route can be redirected to, false otherwise.
 */
export const isValidRedirect = (redirect_to: string): boolean => {
  return whitelisted_redirects.has(redirect_to);
};

/**
 * Gets the URL to be redirected to based on the search paramaters. This URL can be directly passed to 'navigate' or an
 * equivalent function which brings the user to the URL.
 *
 * @param fallback_url URL returned if no redirect is present or if the redirect is invalid.
 * @param search_params The search paramaters for the current route.
 * @returns URL to be redirected to if the redirect is valid, and fallback_url otherwise.
 */
export const getRedirectURL = (fallback_url: string, search_params: URLSearchParams): string => {
  const redirect_to = search_params.get("redirectTo");
  if (redirect_to === null || !whitelisted_redirects.has(redirect_to)) {
    return fallback_url;
  }

  const url = decodeURIComponent(redirect_to);

  const redirect_params = search_params.get("redirectParams");
  if (redirect_params === null) {
    return url;
  }

  return `${url}?${decodeURIComponent(redirect_params)}`;
};

/**
 * Creates the search params needed to redirect the user to a specific page after visiting a given route.
 *
 * @param redirect_to Local route to be redirected to. Should not be encoded with encodeURIComponent.
 * @param search_params Search paramaters to pass to the local route.
 * @returns Search paramaters to pass to a route which causes it to later redirect to the "redirect_to" route.
 */
export const createRedirectSearchParams = (redirect_to: string, search_params?: URLSearchParams): URLSearchParams => {
  const redirect_search_params = new URLSearchParams();
  const redirect_to_encoded = encodeURIComponent(redirect_to);
  redirect_search_params.set("redirectTo", redirect_to_encoded);

  if (search_params !== undefined) {
    const params_encoded = encodeURIComponent(search_params.toString());
    redirect_search_params.set("redirectParams", params_encoded);
  }

  return redirect_search_params;
};
