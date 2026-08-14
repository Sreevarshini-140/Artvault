import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000/api";

const TOKEN_KEY = "access_token";
const USER_KEY = "user";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,

  headers: {
    Accept: "application/json",
  },
});

/*
  Public GET collection routes.
*/
const PUBLIC_GET_EXACT_ROUTES = [
  "/artworks",
  "/artworks/collected",
  "/artists",
  "/users/artists",
  "/categories",
  "/exhibitions",
];

/*
  Public authentication routes.
*/
const PUBLIC_POST_EXACT_ROUTES = [
  "/auth/login",
  "/auth/register",
];

/*
  These route segments are protected even
  though they appear below a public resource.

  Examples:
  /artworks/mine
  /exhibitions/mine
*/
const PROTECTED_ROUTE_SEGMENTS = [
  "mine",
  "manage",
  "admin",
  "dashboard",
  "featured",
  "recommendations",
  "following",
  "wishlist",
];

/*
  Remove query parameters and trailing slashes.
*/
function normalizeUrl(url = "") {
  const cleanUrl =
    String(url).split("?")[0];

  if (
    cleanUrl.length > 1 &&
    cleanUrl.endsWith("/")
  ) {
    return cleanUrl.slice(0, -1);
  }

  return cleanUrl;
}

/*
  Determine whether a request points to a
  public detail route.

  Public examples:
  /artworks/4
  /artists/2
  /exhibitions/7
  /exhibitions/flames-of-legends

  Protected examples:
  /artworks/mine
  /exhibitions/mine
*/
function isPublicDetailRoute(url) {
  const routePrefixes = [
    "/artworks/",
    "/artists/",
    "/exhibitions/",
  ];

  return routePrefixes.some(
    (routePrefix) => {
      if (
        !url.startsWith(
          routePrefix
        )
      ) {
        return false;
      }

      const remainingPath =
        url
          .slice(
            routePrefix.length
          )
          .replace(
            /^\/+|\/+$/g,
            ""
          );

      /*
        Detail routes must contain exactly
        one path segment after the prefix.
      */
      if (
        !remainingPath ||
        remainingPath.includes("/")
      ) {
        return false;
      }

      const segment =
        remainingPath
          .trim()
          .toLowerCase();

      return !PROTECTED_ROUTE_SEGMENTS.includes(
        segment
      );
    }
  );
}

function isPublicRequest(config) {
  const method =
    String(
      config.method || "get"
    ).toLowerCase();

  const url = normalizeUrl(
    config.url || ""
  );

  if (method === "get") {
    if (
      PUBLIC_GET_EXACT_ROUTES.includes(
        url
      )
    ) {
      return true;
    }

    return isPublicDetailRoute(
      url
    );
  }

  if (method === "post") {
    return PUBLIC_POST_EXACT_ROUTES.includes(
      url
    );
  }

  return false;
}

/*
  Request interceptor.
*/
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        TOKEN_KEY
      );

    /*
      Allow Axios to generate the correct
      multipart boundary for file uploads.
    */
    if (
      config.data instanceof
      FormData
    ) {
      if (
        config.headers &&
        typeof config.headers.delete ===
          "function"
      ) {
        config.headers.delete(
          "Content-Type"
        );
      } else if (
        config.headers
      ) {
        delete config.headers[
          "Content-Type"
        ];
      }
    }

    const publicRequest =
      isPublicRequest(config);

    /*
      Attach JWT to every protected request.
    */
    if (
      token &&
      !publicRequest
    ) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    } else if (
      config.headers
    ) {
      if (
        typeof config.headers.delete ===
          "function"
      ) {
        config.headers.delete(
          "Authorization"
        );
      } else {
        delete config.headers
          .Authorization;
      }
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

/*
  Response interceptor.
*/
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const response =
      error.response;

    if (!response) {
      error.message =
        "Unable to connect to the ArtVault server. Make sure the backend is running.";

      return Promise.reject(
        error
      );
    }

    const status =
      response.status;

    const data =
      response.data || {};

    const backendMessage =
      data.error ||
      data.message ||
      data.msg;

    console.error(
      "API Error:",
      backendMessage ||
        data ||
        error.message
    );

    const requestUrl =
      normalizeUrl(
        error.config?.url || ""
      );

    const isLoginRequest =
      requestUrl ===
      "/auth/login";

    const isRegisterRequest =
      requestUrl ===
      "/auth/register";

    const isAuthRequest =
      isLoginRequest ||
      isRegisterRequest;

    /*
      Clear the session only when a protected
      request returns 401.
    */
    if (
      status === 401 &&
      !isAuthRequest
    ) {
      localStorage.removeItem(
        TOKEN_KEY
      );

      localStorage.removeItem(
        USER_KEY
      );

      const currentPath =
        window.location.pathname;

      if (
        currentPath !==
          "/login" &&
        !currentPath.startsWith(
          "/login/"
        )
      ) {
        const returnPath =
          `${window.location.pathname}${window.location.search}`;

        sessionStorage.setItem(
          "artvault_return_path",
          returnPath
        );

        window.location.replace(
          "/login"
        );
      }
    }

    /*
      Preserve the original Axios error so
      error.response remains available.
    */
    if (status === 401) {
      error.message =
        backendMessage ||
        "Your session has expired. Please sign in again.";
    } else if (
      status === 403
    ) {
      error.message =
        backendMessage ||
        "You do not have permission to perform this action.";
    } else if (
      status === 404
    ) {
      error.message =
        backendMessage ||
        "The requested resource was not found.";
    } else if (
      status === 422
    ) {
      error.message =
        backendMessage ||
        "The submitted information could not be validated.";
    } else if (
      status >= 500
    ) {
      error.message =
        backendMessage ||
        "The ArtVault server encountered an internal error.";
    } else {
      error.message =
        backendMessage ||
        error.message ||
        "Something went wrong.";
    }

    return Promise.reject(error);
  }
);

/*
  Save an authentication token.
*/
export function setAuthToken(
  token
) {
  if (!token) {
    return;
  }

  localStorage.setItem(
    TOKEN_KEY,
    token
  );
}

/*
  Read the current authentication token.
*/
export function getAuthToken() {
  return localStorage.getItem(
    TOKEN_KEY
  );
}

/*
  Remove stored authentication information.
*/
export function removeAuthToken() {
  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );

  sessionStorage.removeItem(
    "artvault_return_path"
  );
}

export default api;