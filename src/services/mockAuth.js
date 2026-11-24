// Local stand-in for the auth service, used when REACT_APP_AUTH_URL is not set.
// Mirrors the API contract described in README.md / SPEC.md §6.1.

const DEMO_USER = {
  _id: "1",
  firstName: "Demo",
  lastName: "User",
  email: "demo@adventglobal.com",
  role: "user",
};
const DEMO_PASSWORD = "Demo@123";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockLogin(email, password) {
  await wait(600);
  const matches =
    String(email).trim().toLowerCase() === DEMO_USER.email &&
    password === DEMO_PASSWORD;
  if (!matches) {
    throw new Error("Invalid email or password");
  }
  return {
    success: true,
    token: "mock." + btoa(DEMO_USER.email),
    user: { ...DEMO_USER },
  };
}

export async function mockGetUserDetails(token) {
  await wait(300);
  let email = "";
  try {
    email = atob(String(token).replace(/^mock\./, ""));
  } catch {
    email = "";
  }
  if (!String(token).startsWith("mock.") || email !== DEMO_USER.email) {
    throw new Error("Invalid session");
  }
  return { success: true, user: { ...DEMO_USER } };
}
