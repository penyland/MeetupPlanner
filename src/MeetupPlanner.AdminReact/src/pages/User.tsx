import { useEffect, useState } from "react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  roles: string[];
  claims: Record<string, unknown>;
}

interface SessionInfo {
  isAuthenticated: boolean;
  userName: string;
  issuedAt: string;
  expiresAt: string;
}

function User() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);

  function handleLogin() {
    const redirectUri = encodeURIComponent(location.pathname);
    window.location.href = `/bff/login?redirectUri=${redirectUri}`;
  }

  function handleLogout() {
    const redirectUri = encodeURIComponent(location.pathname);
    window.location.href = `/bff/logout?redirectUri=${redirectUri}`;
  }

  async function getUserInfo() {
    setError(null);

    try {
      const result = await fetch('/bff/user')

      if (!result.ok) {
        throw new Error(`Error fetching user info: ${result.statusText}`);
      }

      const response: UserInfo = await result.json();
      console.log('User Info:', response);
      setUserInfo(response);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError((error as Error).message);
    }
  }

  const fetchSessionAsync = async () => {
    try {
      const response = await fetch('/bff/session');
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
        console.log('Session Data:', sessionData);
      }
    } catch {
      setSession(null);
      console.error('User is not authenticated');
    }
  };

  useEffect(() => {
    fetchSessionAsync();
  }, []);

  return (
    <section className="p-6 mt-4 ml-4">
      <div>
        <h1 className="text-2xl font-bold mb-4">User Page</h1>
        <p>Welcome to the user page.</p>

        {session && (
          <button onClick={handleLogout} className="mt-4 ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Logout
          </button>
        )}

        {!session && (
          <button onClick={handleLogin} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Login
          </button>
        )}

        <button onClick={getUserInfo} className="mt-4 ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Get User Info
        </button>
      </div>

      <div className="p-6 mt-4 ml-4">
        {userInfo && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">User Information</h2>
            <p><strong>ID:</strong> {userInfo.id}</p>
            <p><strong>Name:</strong> {userInfo.name}</p>
            <p><strong>Email:</strong> {userInfo.email}</p>
            <p><strong>Roles:</strong> {userInfo.roles.join(', ')}</p>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Claims</h3>
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-4 py-2 text-left">Claim</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(userInfo.claims) 
                    ? userInfo.claims.map((claim: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-100">
                          <td className="border border-gray-300 px-4 py-2 font-medium">{claim.type}</td>
                          <td className="border border-gray-300 px-4 py-2">{claim.value}</td>
                        </tr>
                      ))
                    : Object.entries(userInfo.claims).map(([key, value]) => (
                        <tr key={key} className="hover:bg-gray-100">
                          <td className="border border-gray-300 px-4 py-2 font-medium">{key}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>

          </div>
        )}

        {error && (
          <div className="mt-4 p-4 border rounded bg-red-50 text-red-700">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        )}

      </div>
    </section>
  );
}

export default User;