import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { SITE } from "../../config/site";
import { USE_MOCK } from "../../services/api";
import { login } from "../../services/operations/authAPIs";
import HelpWidget from "../../components/Landing/HelpWidget";

function isAllowedEmail(email) {
  const lower = email.trim().toLowerCase();
  return SITE.allowedEmailDomains.some((domain) => lower.endsWith(`@${domain}`));
}

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");

  const onEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(value && !isAllowedEmail(value) ? "This email is not allowed" : "");
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (emailError) return;
    dispatch(login(email.trim(), password, navigate));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-xl font-bold text-navy">
            {SITE.brand}
          </Link>
          <button
            type="button"
            aria-label="Back to home"
            onClick={() => navigate("/")}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-3xl font-bold text-navy">{SITE.brand}</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Sign in to your account</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@adventglobal.com"
                value={email}
                onChange={onEmailChange}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 ${
                  emailError ? "border-red-400" : "border-gray-300"
                }`}
              />
              {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() =>
                    toast("Please contact your system administrator to reset your password.")
                  }
                  className="text-sm font-medium text-orange-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!emailError}
              className="w-full rounded-lg bg-navy px-4 py-2.5 font-semibold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Need access?{" "}
            <span className="font-semibold text-navy">Please contact your system administrator.</span>
          </p>
          {USE_MOCK && (
            <p className="mt-3 text-center text-xs text-gray-400">
              Demo: demo@adventglobal.com / Demo@123
            </p>
          )}
        </div>
      </div>

      <HelpWidget />
    </div>
  );
}
