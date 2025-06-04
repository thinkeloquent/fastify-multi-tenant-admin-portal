import fastifyAuth from "@fastify/auth";

export const basicAuthPlugin = async (fastify, options = {}) => {
  fastify.register(fastifyAuth);

  if (options.username && options.password)
    fastify.register(fastifyAuth, {
      validate: async (username, password, req, reply) => {
        if (username === options.username && password === options.password) {
          return true;
        }
        return false;
      },
      authenticate: true,
    });

  if (options.bearerKeys)
    fastify.register(fastifyAuth, {
      addHook: false,
      keys: options.bearerKeys,
      verifyErrorLogLevel: "debug",
    });
};

export default basicAuthPlugin;
