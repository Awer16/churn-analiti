export function getStoredToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem("cv_token") ?? "";
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem("cv_token");
  window.localStorage.removeItem("cv_company_name");
  window.localStorage.removeItem("cv_email");
}
