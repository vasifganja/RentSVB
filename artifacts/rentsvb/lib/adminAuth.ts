const ADMIN_SESSION_KEY = "rentsvb_admin_session";

export function saveAdminSession(username: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify({
      username,
      loggedIn: true,
      time: Date.now(),
    })
  );
}

export function getAdminSession() {
  if (typeof window === "undefined") return null;

  const data = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function logoutAdmin() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ADMIN_SESSION_KEY);
}