import fastifySensible from "@fastify/sensible";
import fastifyEtag from "@fastify/etag";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCors from "@fastify/cors";
import fastifyCompress from "@fastify/compress";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from "@fastify/multipart";

export const requestPlugin = async (app, options) => {
  const { fastify } = options;
  fastify.register(fastifySensible);
  fastify.register(fastifyEtag);
  fastify.register(fastifyHelmet);
  fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // fastify.options("*", (request, reply) => {
  //   reply
  //     .header("Access-Control-Allow-Origin", "*")
  //     .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  //     .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  //     .code(204)
  //     .send();
  // });

  fastify.addHook("onSend", async (request, reply, payload) => {
    reply
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
      .header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return payload;
  });

  await fastify.register(fastifyCors, {
    origin: "*", // Or specify domains like: ['https://example.com']
    credentials: true, // Optional: allow credentials
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Optional
  });

  // fastify.register(fastifyCors, {
  //   origin: "*",
  //   methods: ["GET", "POST", "PUT", "DELETE"],
  //   hook: "preHandler",
  //   allowedHeaders: ["Content-Type", "Authorization"],
  //   exposedHeaders: ["Content-Type", "Authorization"],
  //   credentials: true,
  //   maxAge: 3600,
  //   delegator: (req, callback) => {
  //     if (options.corsDelegators) {
  //       callback(options.corsDelegators[0], options.corsDelegators[0]);
  //     } else if (options.corsUseOrigin) {
  //       const origin = req.headers.origin;
  //       if (origin) {
  //         callback(null, true);
  //       } else {
  //         callback(new Error("Origin not allowed"));
  //       }
  //     } else if (options.corsUseAnyHost) {
  //       callback(null, {
  //         origin: "*",
  //         methods: ["GET", "POST", "PUT", "DELETE"],
  //         allowedHeaders: ["Content-Type", "Authorization"],
  //         exposedHeaders: ["Content-Type", "Authorization"],
  //         credentials: true,
  //         maxAge: 3600,
  //       });
  //     } else {
  //       callback(null, true);
  //     }
  //   },
  // });
  // fastify.register(fastifyCompress);
  fastify.register(fastifyFormbody);
  fastify.register(fastifyMultipart);
};

export default requestPlugin;
