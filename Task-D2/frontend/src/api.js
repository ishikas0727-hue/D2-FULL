import { auth } from "./firebase";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Sends a request to the Express backend, attaching the Firebase ID token if logged in.
export async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (auth.currentUser) {
    headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Unable to connect to the server. Is the backend running?");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}
