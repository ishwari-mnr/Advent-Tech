import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux"; // Added Redux hooks
import { login } from "../../services/operations/authAPIs"; // Import your login action
import AuthShell, { AuthBrand, authLabel, authInput, authSubmit } from "../../components/Landing/AuthShell";
import { Eye, EyeOff } from "lucide-react";


const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Initialize dispatch

  // Get loading state from Redux slice (optional, replaces local loading)
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("token");
    // If token exists, redirect to dashboard
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { email, password } = formData;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "email") {
      if (
        value &&
        !(
          value.endsWith("@adventglobal.com")
        )
      ) {
        setEmailError(
          "This email is not allowed",
        );
      } else {
        setEmailError("");
      }
    }
  };

  const onLoginSubmit = (e) => {
    e.preventDefault();
    if (emailError) return;

    // Dispatch the Redux action
    // It handles the API call, Toast, and Navigation internally
    dispatch(login(email, password, navigate));
  };

  return (
    <AuthShell>
      <AuthBrand subtitle="Sign in to your account" />

      <form onSubmit={onLoginSubmit} className="space-y-6">
        {/* EMAIL */}
        <div>
          <label className={authLabel}>
            Email Address
          </label>

          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={handleChange}
            className={authInput(emailError)}
            placeholder="name@adventglobal.com"
          />

          {emailError && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">
              {emailError}
            </p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <label className={authLabel}>
            Password
          </label>

          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={handleChange}
              className={`${authInput(false)} !pr-12`}
              placeholder="••••••••"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0c1e5b]/40 hover:text-orange-500 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="flex justify-end mt-2.5">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-[#0c1e5b]/60 hover:text-orange-500 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || emailError}
          className={authSubmit}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {/* <p className="mt-8 text-center text-sm text-gray-500">
        New here?
        <Link
          to="/signup"
          className="text-orange-500 font-bold hover:underline ml-1"
        >
          Create an account
        </Link>
      </p> */}

      <p className="mt-8 pt-6 border-t border-dashed border-[#0c1e5b]/15 text-center text-sm text-[#0c1e5b]/60">
        Need access?{" "}
        <span className="text-[#0c1e5b] font-semibold">
          Please contact your system administrator.
        </span>
      </p>
    </AuthShell>
  );
};

export default Login;
