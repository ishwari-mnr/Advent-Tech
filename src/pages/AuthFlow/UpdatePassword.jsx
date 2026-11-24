import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux"; // Added Redux hooks
import { resetPassword } from "../../services/operations/authAPIs"; // Import Redux action
import AuthShell, { AuthBrand, authLabel, authInput, authSubmit } from "../../components/Landing/AuthShell";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useParams(); 

  // Get loading state from Redux store
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onUpdateSubmit = (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Dispatch the Redux action
    // Note: In your authAPI.js, it takes (password, confirmPassword, token, navigate)
    dispatch(resetPassword(password, confirmPassword, token, navigate));
    
    // Optional: If you want to show the CheckCircle2 UI locally before the 
    // Redux action redirects the user, you can keep the isSuccess state logic, 
    // but usually, the navigate("/") inside authAPI.js will trigger first.
  };


  return (
    <AuthShell>
      {!isSuccess ? (
        <>
          <AuthBrand subtitle="Please enter your new password below" />

          <form onSubmit={onUpdateSubmit} className="space-y-6">
            {/* NEW PASSWORD */}
            <div>
              <label className={authLabel}>
                New Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  value={password}
                  type={showPassword ? "text" : "password"}
                  required
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
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className={authLabel}>
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                value={confirmPassword}
                type="password"
                required
                onChange={handleChange}
                className={authInput(false)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={authSubmit}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <h2 className="lp-heading text-2xl font-semibold text-[#0c1e5b] mb-2">
            Password Updated!
          </h2>
          <p className="text-[#0c1e5b]/65">
            Your password has been changed successfully. Redirecting you...
          </p>
        </div>
      )}
    </AuthShell>
  );
};

export default UpdatePassword;
