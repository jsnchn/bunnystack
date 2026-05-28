import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getSession, type User, type Session } from "../lib/api";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((data) => {
      if (data) {
        setUser(data.user);
        setSession(data.session);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Not Authenticated
          </h1>
          <p className="mb-6 text-gray-600">
            Please sign in to view this page.
          </p>
          <Link
            to="/"
            className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Dashboard
        </h1>

        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h2 className="mb-2 text-sm font-semibold text-blue-800">
              User Info
            </h2>
            <dl className="space-y-1 text-sm text-blue-700">
              <div className="flex justify-between">
                <dt>ID:</dt>
                <dd className="font-mono">{user.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Name:</dt>
                <dd>{user.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Email:</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Verified:</dt>
                <dd>{user.emailVerified ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <h2 className="mb-2 text-sm font-semibold text-green-800">
              Session Info
            </h2>
            <dl className="space-y-1 text-sm text-green-700">
              <div className="flex justify-between">
                <dt>Session ID:</dt>
                <dd className="font-mono">{session.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Expires:</dt>
                <dd>{new Date(session.expiresAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}