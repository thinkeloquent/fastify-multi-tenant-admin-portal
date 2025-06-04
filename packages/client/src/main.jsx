import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import Demo from "@Tenants/ui-scaffolding/react/routes.jsx";

import Tenant01 from "@Tenants/object-based-storage/react/routes.jsx";
import Tenant02 from "@Tenants/acess-control/react/routes.jsx";
import Tenant03 from "@Tenants/workspace/react/routes.jsx";
import Tenant04 from "@Tenants/flat-json/react/routes.jsx";
// import Tenant05 from "@Tenants/figma-to-code/react/routes.jsx";

import { createApplicationRoot } from "@Tenants/ui-scaffolding/react/components/RootApplication.jsx";
import * as automationTestVisualization from "@Tenants/automation-test-visualization/react";
import FinderMenu from "@Tenants/ui-scaffolding/react/components/FinderMenu/FinderMenu.jsx";
import FeatureMenu from "@Tenants/ui-scaffolding/react/components/FeatureMenu/FeatureMenu.jsx";

const RootApplication = createApplicationRoot({
  tenants: {
    automationTestVisualization,
  },
  requestOptions: {
    baseUrl: "",
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RootApplication>
        <App />
        {/* <Tenant05 TopLevelMenu={FinderMenu} FeatureMenu={FeatureMenu} /> */}
        <Tenant01 TopLevelMenu={FinderMenu} FeatureMenu={FeatureMenu} />
        <Tenant02 TopLevelMenu={FinderMenu} FeatureMenu={FeatureMenu} />
        <Tenant03 TopLevelMenu={FinderMenu} FeatureMenu={FeatureMenu} />
        <Tenant04 TopLevelMenu={FinderMenu} FeatureMenu={FeatureMenu} />

        <automationTestVisualization.Routes
          TopLevelMenu={FinderMenu}
          FeatureMenu={FeatureMenu}
        />
        <Demo />
      </RootApplication>
    </BrowserRouter>
  </React.StrictMode>
);
