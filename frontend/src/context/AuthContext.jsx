import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";


const AuthContext =
  createContext(null);

const TOKEN_KEY =
  "access_token";

const USER_KEY =
  "user";


// =============================
// BOOLEAN NORMALIZATION
// =============================

function normalizeBoolean(
  value
) {
  if (
    value === true ||
    value === 1
  ) {
    return true;
  }

  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    return [
      "true",
      "1",
      "yes",
      "enabled",
    ].includes(
      normalized
    );
  }

  return false;
}


// =============================
// USER RESPONSE EXTRACTION
// =============================

function extractUser(
  responseData
) {
  const possibleUser =
    responseData?.user ||
    responseData?.account ||
    responseData?.data?.user ||
    responseData?.data
      ?.account ||
    responseData;

  if (
    !possibleUser ||
    typeof possibleUser !==
      "object" ||
    Array.isArray(
      possibleUser
    )
  ) {
    return null;
  }

  return possibleUser;
}


// =============================
// TOKEN RESPONSE EXTRACTION
// =============================

function extractToken(
  responseData
) {
  return (
    responseData?.access_token ||
    responseData?.token ||
    responseData?.jwt_token ||
    responseData?.jwt ||
    responseData?.data
      ?.access_token ||
    responseData?.data
      ?.token ||
    null
  );
}


export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(() => {
    try {
      const storedUser =
        localStorage.getItem(
          USER_KEY
        );

      if (!storedUser) {
        return null;
      }

      const parsedUser =
        JSON.parse(
          storedUser
        );

      return (
        parsedUser &&
        typeof parsedUser ===
          "object"
      )
        ? parsedUser
        : null;
    } catch (error) {
      console.error(
        "Could not read stored user:",
        error
      );

      localStorage.removeItem(
        USER_KEY
      );

      return null;
    }
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  // =============================
  // SAVE USER
  // =============================

  const saveUser = (
    updatedUser
  ) => {
    if (
      !updatedUser ||
      typeof updatedUser !==
        "object" ||
      Array.isArray(
        updatedUser
      )
    ) {
      return false;
    }

    setUser(
      updatedUser
    );

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(
        updatedUser
      )
    );

    return true;
  };

  // =============================
  // CLEAR SESSION
  // =============================

  const clearSession = () => {
    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      USER_KEY
    );

    /*
      Remove token names used by
      older project versions.
    */
    localStorage.removeItem(
      "artvault_token"
    );

    localStorage.removeItem(
      "artvault_access_token"
    );

    localStorage.removeItem(
      "artvault_user"
    );

    setUser(null);
  };

  // =============================
  // UPDATE CURRENT USER
  // =============================

  const updateCurrentUser = (
    updatedUser
  ) => {
    return saveUser(
      updatedUser
    );
  };

  // =============================
  // LOAD CURRENT USER
  // =============================

  const fetchCurrentUser =
    async () => {
      const response =
        await api.get(
          "/auth/me"
        );

      const returnedUser =
        extractUser(
          response.data
        );

      if (!returnedUser) {
        throw new Error(
          "Current user information was not returned."
        );
      }

      saveUser(
        returnedUser
      );

      return returnedUser;
    };

  // =============================
  // RESTORE LOGIN SESSION
  // =============================

  useEffect(() => {
    let active = true;

    const restoreSession =
      async () => {
        const token =
          localStorage.getItem(
            TOKEN_KEY
          );

        if (!token) {
          if (active) {
            setUser(null);
            setLoading(false);
          }

          return;
        }

        try {
          const response =
            await api.get(
              "/auth/me"
            );

          if (!active) {
            return;
          }

          const returnedUser =
            extractUser(
              response.data
            );

          if (
            returnedUser
          ) {
            saveUser(
              returnedUser
            );
          } else {
            clearSession();
          }
        } catch (error) {
          console.error(
            "Session restoration failed:",
            error.response?.data ||
              error.message
          );

          if (!active) {
            return;
          }

          const status =
            error.response
              ?.status;

          /*
            Clear the session only when
            the backend confirms that
            the token is invalid,
            expired or unauthorized.

            Network failures should not
            automatically delete login.
          */
          if (
            status === 401 ||
            status === 422
          ) {
            clearSession();
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // =============================
  // LOGIN
  // =============================

  const login = async (
    email,
    password
  ) => {
    try {
      const response =
        await api.post(
          "/auth/login",
          {
            email:
              String(
                email || ""
              ).trim(),
            password,
          }
        );

      const token =
        extractToken(
          response.data
        );

      let loggedInUser =
        extractUser(
          response.data
        );

      if (!token) {
        throw new Error(
          "Login succeeded, but no authentication token was returned."
        );
      }

      /*
        Save token before calling /auth/me.
        Axios can then attach the token.
      */
      localStorage.setItem(
        TOKEN_KEY,
        token
      );

      /*
        Remove obsolete key names.
      */
      localStorage.removeItem(
        "artvault_token"
      );

      localStorage.removeItem(
        "artvault_access_token"
      );

      localStorage.removeItem(
        "artvault_user"
      );

      if (!loggedInUser) {
        loggedInUser =
          await fetchCurrentUser();
      } else {
        saveUser(
          loggedInUser
        );
      }

      return {
        token,
        access_token:
          token,
        user:
          loggedInUser,
      };
    } catch (error) {
      /*
        Do not leave a token behind when
        login processing fails.
      */
      clearSession();

      console.error(
        "Login failed:",
        error.response?.data ||
          error
      );

      const backendMessage =
        error.response?.data
          ?.error ||
        error.response?.data
          ?.message ||
        error.response?.data
          ?.msg ||
        error.message ||
        "Unable to sign in.";

      throw new Error(
        backendMessage
      );
    }
  };

  // =============================
  // REGISTER
  // =============================

  const register = async (
    formData
  ) => {
    try {
      const response =
        await api.post(
          "/auth/register",
          {
            name:
              String(
                formData?.name ||
                  ""
              ).trim(),

            email:
              String(
                formData?.email ||
                  ""
              ).trim(),

            password:
              formData?.password,

            role:
              formData?.role,
          }
        );

      const token =
        extractToken(
          response.data
        );

      let registeredUser =
        extractUser(
          response.data
        );

      /*
        When registration does not
        return a token, log the new
        account in normally.
      */
      if (!token) {
        return await login(
          formData.email,
          formData.password
        );
      }

      localStorage.setItem(
        TOKEN_KEY,
        token
      );

      localStorage.removeItem(
        "artvault_token"
      );

      localStorage.removeItem(
        "artvault_access_token"
      );

      localStorage.removeItem(
        "artvault_user"
      );

      if (!registeredUser) {
        registeredUser =
          await fetchCurrentUser();
      } else {
        saveUser(
          registeredUser
        );
      }

      return {
        token,
        access_token:
          token,
        user:
          registeredUser,
      };
    } catch (error) {
      clearSession();

      console.error(
        "Registration failed:",
        error.response?.data ||
          error
      );

      const backendMessage =
        error.response?.data
          ?.error ||
        error.response?.data
          ?.message ||
        error.response?.data
          ?.msg ||
        error.message ||
        "Unable to create your account.";

      throw new Error(
        backendMessage
      );
    }
  };

  // =============================
  // LOGOUT
  // =============================

  const logout = () => {
    clearSession();

    sessionStorage.removeItem(
      "artvault_return_path"
    );
  };

  // =============================
  // ROLE AND PERMISSION CHECKS
  // =============================

  const normalizedRole =
    String(
      user?.role || ""
    )
      .trim()
      .toLowerCase();

  /*
    An admin can be represented by:

    role: "admin"

    OR

    role: "artist",
    is_admin: true
  */
  const isAdmin =
    normalizedRole ===
      "admin" ||
    normalizeBoolean(
      user?.is_admin
    ) ||
    normalizeBoolean(
      user?.isAdmin
    ) ||
    normalizeBoolean(
      user?.admin
    );

  const isArtist =
    normalizedRole ===
      "artist" ||
    normalizeBoolean(
      user?.is_artist
    ) ||
    normalizeBoolean(
      user?.isArtist
    );

  const isCurator =
    normalizedRole ===
      "curator" ||
    normalizeBoolean(
      user?.is_curator
    ) ||
    normalizeBoolean(
      user?.isCurator
    );

  // =============================
  // CONTEXT VALUE
  // =============================

  const value =
    useMemo(
      () => ({
        user,
        loading,

        login,
        register,
        logout,

        saveUser,
        clearSession,
        updateCurrentUser,
        fetchCurrentUser,

        isAuthenticated:
          Boolean(user),

        normalizedRole,

        isArtist,
        isCurator,
        isAdmin,
      }),
      [
        user,
        loading,
        normalizedRole,
        isArtist,
        isCurator,
        isAdmin,
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}


export default AuthContext;