import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://backend:8000";

async function proxy(request: NextRequest, method: "GET" | "POST", path: string[]) {
  const search = request.nextUrl.search || "";
  const targetUrl = `${BACKEND_URL}/${path.join("/")}${search}`;

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  }

  const contentType = request.headers.get("content-type");
  if (contentType && method !== "GET") {
    headers.set("content-type", contentType);
  }

  const body = await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method,
    headers,
    body: method !== "GET" ? body : undefined,
    cache: "no-store",
  });

  const responseContentType = response.headers.get("content-type") ?? "application/json";
  const payload = await response.arrayBuffer();
  return new NextResponse(payload, {
    status: response.status,
    headers: {
      "content-type": responseContentType,
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, "GET", path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, "POST", path);
}
