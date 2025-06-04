import React from "react";
import { Routes, Route } from "react-router-dom";

import FinderMenu from "./components/FinderMenu/FinderMenu";
import FeatureMenu from "./components/FeatureMenu/FeatureMenu";

const UIScaffoldingComponents = () => {
  return (
    <Routes>
      <Route path="ui-scaffolding/components/">
        <Route path="" element={<FeatureMenu />} />
      </Route>
    </Routes>
  );
};

export default UIScaffoldingComponents;
