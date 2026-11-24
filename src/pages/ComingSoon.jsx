import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogOut } from "lucide-react";
import { SITE } from "../config/site";
import { logout } from "../services/operations/authAPIs";

function initials(user) {
  const first = user?.firstName?.[0] || "";
  const last = user?.lastName?.[0] || "";
  return (first + last).toUpperCase() || "?";
}

export default function ComingSoon() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.profile);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <span className="text-xl font-bold text-navy">{SITE.brand}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                {user ? initials(user) : "…"}
              </div>
              <div className="hidden min-w-0 leading-tight sm:block">
                {user ? (
                  <>
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Loading...</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dispatch(logout(navigate))}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        {user && (
          <p className="mb-4 text-sm text-gray-500 sm:hidden">
            Signed in as {user.firstName} {user.lastName}
          </p>
        )}
        <h1 className="text-5xl font-extrabold text-navy sm:text-7xl">{SITE.brand}</h1>
        <p className="mt-4 text-2xl font-semibold text-orange-500 sm:text-3xl">Coming Soon</p>
        <p className="mt-3 text-gray-600">We're building something great. Stay tuned.</p>
      </main>
    </div>
  );
}
