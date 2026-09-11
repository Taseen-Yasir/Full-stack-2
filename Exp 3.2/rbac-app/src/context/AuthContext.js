import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  const users = [
    {
      username: "admin",
      password: "password123",
      role: "admin",
    },
    {
      username: "Taseen",
      password: "24BAI70036",
      role: "editor",
    },
    {
      username: "viewer",
      password: "viewer123",
      role: "viewer",
    },
  ];

  const login = (username, password) => {

    const foundUser = users.find(
      (u) =>
        u.username === username &&
        u.password === password
    );

    if (foundUser) {
      setUser(foundUser);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};