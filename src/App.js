import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Home from "./pages/Home";
import Login from "./pages/AuthFlow/Login";
import ComingSoon from "./pages/ComingSoon";
import { getUserDetails } from "./services/operations/authAPIs";

function ProtectedRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  if (token || localStorage.getItem("token")) return children;
  return <Navigate to="/" replace />;
}

function OpenRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  if (!token && !localStorage.getItem("token")) return children;
  return <Navigate to="/coming-soon" replace />;
}

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.profile);

  useEffect(() => {
    if (localStorage.getItem("token") && !user) {
      dispatch(getUserDetails(navigate));
    }
    // Only run on mount: restores the session after a refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <OpenRoute>
            <Home />
          </OpenRoute>
        }
      />
      <Route
        path="/login"
        element={
          <OpenRoute>
            <Login />
          </OpenRoute>
        }
      />
      <Route
        path="/coming-soon"
        element={
          <ProtectedRoute>
            <ComingSoon />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
