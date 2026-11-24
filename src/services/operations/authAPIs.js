import toast from "react-hot-toast";
import { setLoading, setToken } from "../../slices/authSlice";
import { setUser } from "../../slices/profileSlice";
import { apiConnector } from "../apiConnector";
import { endpoints, USE_MOCK } from "../api";
import { mockGetUserDetails, mockLogin } from "../mockAuth";

const { LOGIN_API, GET_USER_DETAILS_API } = endpoints;

function clearSession(dispatch) {
  dispatch(setToken(null));
  dispatch(setUser(null));
  localStorage.removeItem("token");
}

function readStoredToken() {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function login(email, password, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      let data;
      if (USE_MOCK) {
        data = await mockLogin(email, password);
      } else {
        const response = await apiConnector("POST", LOGIN_API, { email, password });
        data = response.data;
      }

      if (!data?.success) {
        throw new Error(data?.message);
      }

      toast.success("Signin Successful");
      dispatch(setToken(data.token));
      dispatch(setUser(data.user));
      localStorage.setItem("token", JSON.stringify(data.token));
      navigate("/coming-soon");
    } catch (error) {
      let message;
      if (!USE_MOCK && error?.isAxiosError && !error.response) {
        message =
          "Cannot reach the server. Check that the API is running and REACT_APP_AUTH_URL is correct.";
      } else {
        message =
          error?.response?.data?.message ||
          error?.message ||
          "Sign in failed. Please try again.";
      }
      toast.error(message);
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}

export function getUserDetails(navigate) {
  return async (dispatch) => {
    try {
      const token = readStoredToken();
      let data;
      if (USE_MOCK) {
        data = await mockGetUserDetails(token);
      } else {
        const response = await apiConnector("GET", GET_USER_DETAILS_API);
        data = response.data;
      }
      if (!data?.success || !data.user) {
        throw new Error(data?.message || "Invalid session");
      }
      dispatch(setUser(data.user));
    } catch (error) {
      clearSession(dispatch);
      toast.error("Could not confirm your sign-in — please sign in again");
      navigate("/login");
    }
  };
}

export function logout(navigate) {
  return (dispatch) => {
    clearSession(dispatch);
    toast.success("Logged Out");
    navigate("/");
  };
}
