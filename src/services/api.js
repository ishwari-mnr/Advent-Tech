const BASE_URL = process.env.REACT_APP_AUTH_URL;

export const USE_MOCK = !BASE_URL;

export const endpoints = {
  LOGIN_API: `${BASE_URL}/auth/login`,
  GET_USER_DETAILS_API: `${BASE_URL}/auth/getUserDetails`,
};
