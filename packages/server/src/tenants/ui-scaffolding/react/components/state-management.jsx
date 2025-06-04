import React, { createContext, useContext, useState } from "react";

const StateManagement = createContext();

export function StateManagementProvider({ rootStateConfig, children }) {
  return (
    <StateManagement.Provider value={{ config: rootStateConfig }}>
      {children}
    </StateManagement.Provider>
  );
}

export function useRootTenantStateManagementUtils(tenantName) {
  const context = useContext(StateManagement);
  if (!context) {
    throw new Error(
      "useStateManagement must be used within an StateManagementProvider"
    );
  }

  const tenantUtils = context.config[tenantName];
  return tenantUtils;
}
