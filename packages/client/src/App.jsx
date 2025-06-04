import React from "react";
import { Routes, Route } from "react-router-dom";
import { Link } from "react-router-dom";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="container">
      {/* <Navbar /> */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

const NotFoundPage = () => {
  const routes = [
    "/admin/workspace/",
    "/admin/access-control",
    "/object-based-storage",
    "/flat-json",
    "/figma-to-code/",
    "/reports/automation-test-visualization",
    "/ui-scaffolding/components",
  ];

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <h2>Home</h2>
      <div className="navigation-links">
        {routes.map((route, index) => (
          <Link
            key={index}
            to={route}
            className="nav-link"
            style={{
              display: "block",
              margin: "10px 0",
              padding: "8px 16px",
              background: "#f5f5f5",
              borderRadius: "4px",
              textDecoration: "none",
              color: "#333",
            }}
          >
            {route}
          </Link>
        ))}
      </div>
    </div>
  );
};

function RootApp() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default RootApp;
