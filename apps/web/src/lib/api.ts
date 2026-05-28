// Thin wrapper around fetch pointing to /api/

const BASE = "/api";

export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface SignUpResponse {
  user: User;
  session: Session;
  token: string;
}

export interface SignInResponse {
  user: User;
  session: Session;
  token: string;
}

export interface GetSessionResponse {
  user: User;
  session: Session;
}

interface ApiError {
  error: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<SignUpResponse> {
  return request<SignUpResponse>("/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function signIn(
  email: string,
  password: string
): Promise<SignInResponse> {
  return request<SignInResponse>("/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getSession(): Promise<GetSessionResponse | null> {
  try {
    return await request<GetSessionResponse>("/auth/get-session", {
      credentials: "include",
    });
  } catch {
    return null;
  }
}