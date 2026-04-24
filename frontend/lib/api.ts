type RequestOptions = {
  method?: "GET" | "POST";
  token?: string;
  body?: BodyInit | null;
  json?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (options.json) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`/api${normalizedPath}`, {
    method: options.method ?? "GET",
    headers,
    body: options.json ? JSON.stringify(options.json) : (options.body ?? null),
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(payload.detail ?? "Request failed");
  }

  return response.json() as Promise<T>;
}
