import { createSlice } from "@reduxjs/toolkit";

function readToken() {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("token");
    return null;
  }
}

const initialState = {
  loading: false,
  token: readToken(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setToken(state, action) {
      state.token = action.payload;
    },
  },
});

export const { setLoading, setToken } = authSlice.actions;
export default authSlice.reducer;
