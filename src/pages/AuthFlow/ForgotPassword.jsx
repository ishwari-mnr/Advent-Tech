import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux"; // Added Redux hooks
import { getPasswordResetToken } from "../../services/operations/authAPIs"; // Import Redux action
import AuthShell, { AuthBrand, authLabel, authInput, authSubmit } from "../../components/Landing/AuthShell";
import { ArrowLeft, MailCheck } from "lucide-react";

const ForgotPassword = () => {
  const dispatch = useDispatch();

  // Get loading state from Redux store
  const { loading } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSent, setIsSent] = useState(false); // Used as 'setEmailSent' in the action

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (
      value &&
      !(
        value.endsWith("@adventglobal.com")
      )
    ) {
      setEmailError(
        "Only @adventglobal.com emails are allowed",
      );
    } else {
      setEmailError("");
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (emailError || !email) return;

    // Dispatch the Redux action
    // Note: getPasswordResetToken(email, setEmailSent)
    dispatch(getPasswordResetToken(email, setIsSent));
  };

  return (
    <AuthShell>
      {!isSent ? (
        <>
          <AuthBrand subtitle="Enter your email to receive a reset link" />

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className={authLabel}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                className={authInput(emailError)}
                placeholder="name@adventglobal.com"
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || emailError}
              className={authSubmit}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <span className="absolute inset-0 rounded-2xl border-2 border-orange-400 animate-ping opacity-40" />
            <div className="relative bg-[#0c1e5b] w-16 h-16 rounded-2xl flex items-center justify-center">
              <MailCheck className="text-orange-400" size={30} />
            </div>
          </div>
          <h2 className="lp-heading text-2xl font-semibold text-[#0c1e5b] mb-2">
            Check your email
          </h2>
          <p className="text-[#0c1e5b]/65 mb-8">
            We've sent a password reset link to <br />
            <span className="font-semibold text-[#0c1e5b]">{email}</span>
          </p>
          <button
            onClick={() => setIsSent(false)}
            className="text-orange-500 font-bold hover:underline block mx-auto"
          >
            Didn't receive the email? Try again
          </button>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-dashed border-[#0c1e5b]/15 text-center">
        <Link
          to="/login"
          className="group inline-flex items-center text-sm text-[#0c1e5b]/60 hover:text-orange-500 font-medium transition-colors"
        >
          <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Sign In
        </Link>
      </div>
    </AuthShell>
  );
};

export default ForgotPassword;
