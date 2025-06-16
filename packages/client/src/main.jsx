import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import Demo from "@Tenants/ui-scaffolding/react/routes.jsx";

import Tenant01 from "@Tenants/object-based-storage/react/routes.jsx";
import Tenant02 from "@Tenants/acess-control/react/routes.jsx";
import Tenant03 from "@Tenants/workspace/react/routes.jsx";
import Tenant04 from "fastify-multitenant-flat-json/react/routes.jsx";

import { createApplicationRoot } from "@Tenants/ui-scaffolding/react/components/RootApplication.jsx";
import FinderMenu from "@Tenants/ui-scaffolding/react/components/FinderMenu/FinderMenu.jsx";
import FeatureMenu from "@Tenants/ui-scaffolding/react/components/FeatureMenu/FeatureMenu.jsx";

const RootApplication = createApplicationRoot({
  tenants: {},
  requestOptions: {
    baseUrl: "",
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RootApplication>
        <App />
        <Tenant01 TopLevelMenu={FinderMenu} FeatureMenu={FeatureMenu} />
        <Tenant02 TopLevelMenu={FinderMenu} FeatureMenu={FeatureMenu} />
        <Tenant03 TopLevelMenu={FinderMenu} FeatureMenu={FeatureMenu} />
        <Tenant04 TopLevelMenu={FinderMenu} FeatureMenu={FeatureMenu} />
        <Demo />
      </RootApplication>
    </BrowserRouter>
  </React.StrictMode>
);
