import React from "react";
import ReactDOM from "react-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import {
  configureStore,
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import { StateManagementProvider } from "./state-management";

export const request = async (baseUrl, endpoint, options = {}) => {
  const { method = "GET", data = null, token = null, params = {} } = options;

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add query parameters if provided
  const url = new URL(`${baseUrl}${endpoint}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const config = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };

  try {
    const response = await fetch(url.toString(), config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API error: ${endpoint}`, error);
    throw error;
  }
};

export const createService = (tenants, options) => {
  return {
    api: {
      baseUrl,
      tenants: Object.entries(tenants).reduce((acc, [key, value]) => {
        acc[key] = value(options, { request: request.bind(options) });
        return acc;
      }, {}),
    },
  };
};

// --- Configure Store ---

// // --- Simple App Component ---
// function App() {
//   const count = useSelector((state) => state.count);
//   const dispatch = useDispatch();

//   return (
//     <div style={{ padding: "20px", fontFamily: "Arial" }}>
//       <h1>Redux Counter</h1>
//       <h2>{count}</h2>
//       <button onClick={() => dispatch(actions.increment())}>Increment</button>
//       <button
//         onClick={() => dispatch(actions.decrement())}
//         style={{ marginLeft: "10px" }}
//       >
//         Decrement
//       </button>
//     </div>
//   );
// }

export const createApplicationRoot = ({ tenants, requestOptions }) => {
  const rootStateConfig = Object.entries(tenants).reduce(
    (acc, [tenantName, value]) => {
      const slice = value.defineSlice();
      acc.slices[tenantName] = slice;
      acc.reducers[tenantName] = slice.reducer;

      acc[tenantName] = {
        ...slice,
        services: Object.entries(value.services).reduce(
          (serviceContext, [serviceName, serviceFunc]) => {
            serviceContext[serviceName] = (options = {}) => {
              return serviceFunc({
                ...options,
                request,
              });
            };
            return serviceContext;
          },
          {}
        ),
      };
      return acc;
    },
    {
      reducers: {},
      slices: {},
      actions: {},
    }
  );

  const store = configureStore({
    reducer: rootStateConfig.reducers,
    devTools: {
      name: "My Redux App",
      trace: true,
      traceLimit: 25,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            "auth/login/fulfilled",
            "auth/refreshToken/fulfilled",
          ],
        },
      }),
  });

  const ApplicationRoot = ({ children }) => {
    return (
      <StateManagementProvider rootStateConfig={rootStateConfig}>
        <Provider store={store}>{children}</Provider>
      </StateManagementProvider>
    );
  };

  return ApplicationRoot;
};
