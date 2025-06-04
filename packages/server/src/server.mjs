import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import Fastify from "fastify";
import { existsSync } from "fs";
import fastGlob from "fast-glob";
import closeWithGrace from "close-with-grace";
import merge from "deepmerge";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contexts = {
  app: null,
  tenants: {},
  plugins: {},
  capabilities: {},
  config: {
    server: {
      port: process.env.PORT || 3001,
      host: process.env.HOST || "0.0.0.0",
    },
    logger: {
      level: process.env.LOG_LEVEL || "info",
    },
    plugins: {
      coreOrder: [
        "database",
        "auth",
        "cookie",
        "exception",
        "logger",
        "request",
        "static",
      ],
    },
  },
};

/**
 * Utility functions for plugin and service management
 */
const utils = {
  plugins: new Proxy(
    {},
    {
      get: function (_, name) {
        return async function (app, options = {}) {
          if (!contexts.plugins[name]) {
            try {
              const pluginPath = path.join(
                __dirname,
                "plugins",
                name,
                "index.mjs"
              );
              if (existsSync(pluginPath)) {
                app.log.info(`Set plugins ${pluginPath}`);
                const plugin = await import(pluginPath);
                contexts.plugins[name] = plugin.default || plugin;
              } else {
                app.log.warn(`Plugin ${name} not found at ${pluginPath}`);
                return null;
              }
            } catch (err) {
              app.log.error(err, `Failed to load plugin ${name}`);
              return null;
            }
          }

          if (typeof contexts.plugins[name] === "function") {
            await app.register(contexts.plugins[name], {
              ...options,
              fastify: app,
            });
            app.log.debug(`Registered plugin ${name}`);
            return contexts.plugins[name];
          } else {
            app.log.warn(`Plugin ${name} is not a function`);
            return null;
          }
        };
      },
    }
  ),

  async loadNpmPlugins(app, pattern = "fastify-multitenant-*") {
    const packageJsonPath = path.join(process.cwd(), "package.json");

    try {
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf8")
      );

      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const pluginNames = Object.keys(dependencies).filter((dep) =>
        new RegExp(pattern).test(dep)
      );

      app.log.info(
        `Found ${pluginNames.length} NPM plugins matching pattern ${pattern}`
      );

      for (const pluginName of pluginNames) {
        try {
          const plugin = await import(pluginName);
          if (typeof plugin.default === "function") {
            await app.register(plugin.default);
            app.log.info(`Loaded NPM plugin ${pluginName}`);
          } else if (typeof plugin === "function") {
            await app.register(plugin);
            app.log.info(`Loaded NPM plugin ${pluginName}`);
          } else {
            app.log.warn(`NPM plugin ${pluginName} does not export a function`);
          }
        } catch (err) {
          app.log.error(err, `Failed to load NPM plugin ${pluginName}`);
        }
      }
    } catch (err) {
      app.log.error(err, `Failed to load package.json for NPM plugins`);
    }
  },
};

/**
 * Server capabilities - functions for loading plugins, schemas, and configs
 */
contexts.capabilities = {
  // Load services from a specific directory path
  loadServices: async (app, servicesPath, options = {}) => {
    try {
      const absolutePath = path.isAbsolute(servicesPath)
        ? servicesPath
        : path.join(process.cwd(), servicesPath);

      if (!(await fs.stat(absolutePath).catch(() => false))) {
        app.log.debug(`No services directory found at ${servicesPath}`);
        return {};
      }

      const serviceFiles = await fastGlob("**/*.{js,mjs}", {
        cwd: absolutePath,
        absolute: true,
      });

      app.log.info(
        `Tenant Found ${serviceFiles.length} service files in ${servicesPath}`
      );

      const services = {};

      for (const file of serviceFiles) {
        try {
          const serviceName = path.basename(file, path.extname(file));
          const service = await import(`file://${file}`);
          const ServiceClass = service.default || service;

          // Check if it's a class (to be instantiated) or a function (to be called)
          if (typeof ServiceClass === "function") {
            if (/^[A-Z]/.test(ServiceClass.name)) {
              // Likely a class (starts with capital letter)
              services[serviceName] = new ServiceClass(
                options.db,
                options.config
              );
            } else {
              // Likely a factory function
              services[serviceName] = ServiceClass(options.db, options.config);
            }
            app.log.debug(`Loaded service ${serviceName} from ${file}`);
          } else {
            // It's an object
            services[serviceName] = ServiceClass;
            app.log.debug(`Loaded service object ${serviceName} from ${file}`);
          }
        } catch (err) {
          app.log.error(err, `Failed to load service from ${file}`);
        }
      }

      return services;
    } catch (err) {
      app.log.error(err, `Failed to load services from ${servicesPath}`);
      return {};
    }
  },
  loadPlugin: async (app, pluginPath, options = {}) => {
    try {
      const absolutePath = path.isAbsolute(pluginPath)
        ? pluginPath
        : path.join(process.cwd(), pluginPath);

      const indexPath = path.join(absolutePath, "index.mjs");

      if (!(await fs.stat(indexPath).catch(() => false))) {
        app.log.warn(`Plugin file not found at ${indexPath}`);
        return false;
      }

      const plugin = await import(`file://${indexPath}`);
      const pluginFunc = plugin.default || plugin;

      if (typeof pluginFunc !== "function") {
        app.log.warn(`Plugin at ${indexPath} does not export a function`);
        return false;
      } else {
        app.log.info(`Tenant plugin loaded: file://${indexPath}`);
      }

      await app.register(pluginFunc, options);
      app.log.info(`Tenant Loaded plugin from ${pluginPath}`);
      return true;
    } catch (err) {
      app.log.error(err, `Failed to load plugin from ${pluginPath}`);
      return false;
    }
  },
  loadSchema: async (app, schemaPath) => {
    try {
      const absolutePath = path.isAbsolute(schemaPath)
        ? schemaPath
        : path.join(process.cwd(), schemaPath);

      const schemaFiles = await fastGlob("**/*.{json,js,mjs}", {
        cwd: absolutePath,
        absolute: true,
      });

      app.log.info(
        `Tenant Found ${schemaFiles.length} schema files in ${schemaPath}`
      );

      for (const file of schemaFiles) {
        try {
          const schema = await import(`file://${file}`);
          const schemaData = schema.default || schema;

          if (!schemaData.$id) {
            app.log.warn(`Schema at ${file} does not have an $id property`);
            continue;
          }

          app.addSchema(schemaData);
          app.log.debug(`Loaded schema ${schemaData.$id} from ${file}`);
        } catch (err) {
          app.log.error(err, `Failed to load schema from ${file}`);
        }
      }

      return true;
    } catch (err) {
      app.log.error(err, `Failed to load schemas from ${schemaPath}`);
      return false;
    }
  },
  loadConfig: async (app, configPath, defaults = {}) => {
    try {
      const absolutePath = path.isAbsolute(configPath)
        ? configPath
        : path.join(process.cwd(), configPath);

      let config = { ...defaults };

      const configFiles = await fastGlob("config.{json,js,mjs}", {
        cwd: absolutePath,
        absolute: true,
      });

      if (configFiles.length === 0) {
        app.log.warn(`No config files found in ${absolutePath}`);
        return config;
      }

      for (const file of configFiles) {
        try {
          if (file.endsWith(".json")) {
            const content = await fs.readFile(file, "utf8");
            config = merge(config, JSON.parse(content));
          } else {
            const module = await import(`file://${file}`);
            config = merge(config, module.default || module);
          }
          app.log.debug(`Loaded configuration from ${file}`);
        } catch (err) {
          app.log.error(err, `Failed to load config from ${file}`);
        }
      }

      return config;
    } catch (err) {
      app.log.error(err, `Failed to load config from ${configPath}`);
      return defaults;
    }
  },
};

/**
 * Tenant capabilities - functions for managing multi-tenant contexts
 */
contexts.tenants = {
  getIdFromRequest: (request) => {
    const hostnameMatch = request.hostname?.match(/^([^.]+)\./);
    if (hostnameMatch) {
      return hostnameMatch[1];
    }

    const pathMatch = request.url?.match(/^\/([^/]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    if (request.headers["x-tenant-id"]) {
      return request.headers["x-tenant-id"];
    }

    return "default-tenant";
  },

  getContext: (tenantId) => {
    return contexts.tenants[tenantId] || null;
  },

  getListing: () => {
    return Object.keys(contexts.tenants);
  },

  getTenant: (tenantId) => {
    const tenant = contexts.tenants[tenantId];
    return tenant ? tenant.config : null;
  },

  loadTenant: async (app, tenantId) => {
    try {
      const tenantPath = path.join(__dirname, "tenants", tenantId);

      try {
        await fs.access(tenantPath);
      } catch (err) {
        app.log.warn(`Tenant directory for ${tenantId} does not exist`);
        return false;
      }

      let customTenantId = tenantId;
      try {
        const indexPath = path.join(tenantPath, "index.mjs");

        if (existsSync(indexPath)) {
          const tenantModule = await import(`file://${indexPath}`);
          if (tenantModule.NAME) {
            customTenantId = tenantModule.NAME;
            app.log.info(`Tenant ${tenantId} has custom ID: ${customTenantId}`);
          }
        }
      } catch (err) {
        app.log.warn(`Error loading tenant index.mjs for ${tenantId}:`, err);
      }

      const config = await contexts.capabilities.loadConfig(app, tenantPath, {
        id: customTenantId,
        name: customTenantId,
        active: true,
      });

      if (!config.active) {
        app.log.info(`Tenant ${customTenantId} is inactive, skipping`);
        return false;
      }

      contexts.tenants[customTenantId] = {
        id: customTenantId,
        path: tenantPath,
        config: config,
        services: {},
      };

      const schemaPath = path.join(tenantPath, "schemas");
      if (existsSync(schemaPath)) {
        await contexts.capabilities.loadSchema(app, schemaPath);
      }

      // In contexts.tenants.loadTenant, add after loading schemas:

      // Load tenant-specific services
      const servicesPath = path.join(tenantPath, "services");
      if (existsSync(servicesPath)) {
        const services = await contexts.capabilities.loadServices(
          app,
          servicesPath,
          {
            db: app.db,
            config: config,
            tenantId: customTenantId,
          }
        );

        contexts.tenants[customTenantId].services = services;

        // Decorate the app with tenant services for easy access in routes
        // app.decorate(`${customTenantId}ervices`, services);
        app.log.info(
          `Tenant Loaded ${Object.keys(services).length} services for tenant ${customTenantId}`
        );
      }

      const pluginsPath = path.join(tenantPath, "plugins");
      if (existsSync(pluginsPath)) {
        const pluginDirs = await fs.readdir(pluginsPath);
        for (const pluginName of pluginDirs) {
          const pluginPath = path.join(pluginsPath, pluginName);
          await contexts.capabilities.loadPlugin(app, pluginPath, {
            tenant: customTenantId,
            config: config,
            fastify: app,
          });
        }
      }

      const routesPath = path.join(tenantPath, "routes");
      if (existsSync(routesPath)) {
        await contexts.capabilities.loadPlugin(app, routesPath, {
          tenant: customTenantId,
          config: config,
          prefix: `/${customTenantId}`,
          fastify: app,
        });
      }

      app.log.info(`Tenant ${customTenantId} loaded successfully`);
      return true;
    } catch (err) {
      app.log.error(err, `Failed to load tenant ${tenantId}`);
      return false;
    }
  },

  loadAllTenants: async (app) => {
    try {
      const tenantsPath = path.join(__dirname, "tenants");

      try {
        await fs.access(tenantsPath);
      } catch (err) {
        app.log.warn(`Tenants directory does not exist at ${tenantsPath}`);
        return false;
      }

      const tenantDirs = await fs.readdir(tenantsPath);

      for (const tenantId of tenantDirs) {
        if (tenantId.startsWith(".")) continue;

        await contexts.tenants.loadTenant(app, tenantId);
      }

      app.log.info(`Loaded ${Object.keys(contexts.tenants).length} tenants`);
      return true;
    } catch (err) {
      app.log.error(err, `Failed to load tenants`);
      return false;
    }
  },
};

/**
 * Main entry function - starts the server and initializes all components
 * @param {Object} options - Configuration options to override defaults
 * @returns {FastifyInstance} The initialized Fastify instance
 */
export async function start(options = {}) {
  const config = merge(contexts.config, options);

  const app = Fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    },
    trustProxy: true,
  });

  contexts.app = app;

  app.decorate("capabilities", contexts.capabilities);
  app.decorate("tenants", contexts.tenants);

  app.addHook("onRequest", async (request, reply) => {
    const tenantId = contexts.tenants.getIdFromRequest(request);
    const tenant = contexts.tenants.getContext(tenantId);

    if (tenant) {
      request.tenantId = tenantId;
      request.tenant = tenant;
      request.log = request.log.child({ tenant: tenantId });
    } else if (request.url.startsWith("/api/")) {
      reply.code(404).send({
        success: false,
        error: `Tenant '${tenantId}' not found`,
      });
    }
  });

  try {
    const pluginOrder = config.plugins.coreOrder || [];

    // for (const pluginName of pluginOrder) {
    //   app.log.info(`loading core plugin: ${pluginName}`);
    //   await utils.plugins[pluginName](app, config.plugins[pluginName] || {});
    // }

    const pluginsDir = path.join(__dirname, "plugins");

    if (existsSync(pluginsDir)) {
      const pluginDirs = await fs.readdir(pluginsDir);

      for (const pluginName of pluginDirs) {
        console.log(`core plugin loading::${pluginName}`);
        // if (pluginOrder.includes(pluginName)) continue;
        await utils.plugins[pluginName](app, config.plugins[pluginName] || {});
        console.log(`core plugin loaded::${pluginName}`);
      }
    }

    app.log.info("Core plugins loaded");
  } catch (err) {
    app.log.error(err, "Failed to load core plugins");
  }

  await utils.loadNpmPlugins(app, config.plugins.npmPattern || "fastify-mt-*");

  // Load all tenants
  await contexts.tenants.loadAllTenants(app);

  // Configure graceful shutdown
  const closeListeners = closeWithGrace(
    { delay: 500 },
    async ({ signal, err, manual }) => {
      if (err) {
        app.log.error({ err }, "server closing due to error");
      } else {
        app.log.info(`server closing due to ${signal}`);
      }
      await app.close();
    }
  );

  app.addHook("onClose", (instance, done) => {
    closeListeners.uninstall();
    done();
  });

  // Start server
  try {
    await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    app.log.info(`Server listening on ${app.server.address().port}`);
  } catch (err) {
    app.log.error(err, "Failed to start server");
    process.exit(1);
  }

  app.ready(async () => {
    console.log(app.printRoutes({ commonPrefix: false }));
    await app.db.sync({ force: true });
  });

  //TODO: setup wildcard route(*)
  return app;
}

/**
 * Initialize a single tenant for testing or custom initialization
 * @param {string} tenantId - ID of the tenant to initialize
 * @param {Object} options - Optional configuration overrides
 * @returns {Object} The initialized tenant context
 */
export async function initTenant(tenantId, options = {}) {
  if (!contexts.app) {
    throw new Error("Server not started. Call start() first.");
  }

  await contexts.tenants.loadTenant(contexts.app, tenantId);

  const tenant = contexts.tenants.getContext(tenantId);
  if (!tenant) {
    throw new Error(`Failed to initialize tenant ${tenantId}`);
  }

  return tenant;
}

/**
 * Export main functions and objects for use in other files
 */
export default {
  start,
  initTenant,
  contexts,
  utils,
};

/**
 * Auto-start server if this file is run directly
 */
if (import.meta.url === `file://${__filename}`) {
  start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
