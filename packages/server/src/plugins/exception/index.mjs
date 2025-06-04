import closeWithGrace from "close-with-grace";

export const exceptionPlugin = async (fastify, options) => {
  // // Register error handler for this route
  // fastify.setErrorHandler(function (error, request, reply) {
  //   // Fastify automatically handles validation errors
  //   if (error.validation) {
  //     return reply.code(400).send({
  //       success: false,
  //       error: "Validation Error",
  //       details: error.validation,
  //     });
  //   }

  //   request.log.error(error);
  //   reply.code(500).send({
  //     success: false,
  //     error: "Internal Server Error",
  //   });
  // });

  const closeServerListeners = closeWithGrace(async function ({
    signal,
    err,
    manual,
  }) {
    if (err) {
      fastify.log.error({ err }, "server closing with error");
    } else {
      fastify.log.info(`${signal} received, server closing`);
    }
    await fastify.close();
  });

  const waitForShutdown = new Promise((resolve) => {
    fastify.addHook("onClose", (_, done) => {
      closeServerListeners.uninstall();
      resolve();
      done();
    });
  });

  fastify.decorate("gracefulShutdown", async function () {
    fastify.log.info("Graceful shutdown initiated");
    await waitForShutdown;
    await new Promise((resolve) => {
      process.nextTick(resolve);
      fastify.log.info("Server closed");
    });
  });

  process.on("unhandledRejection", (reason, promise) => {
    fastify.log.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
  process.on("uncaughtException", (error) => {
    fastify.log.error("Uncaught Exception thrown:", error);
  });
  process.on("SIGINT", async () => {
    fastify.log.info("Shutting down server...");
    await fastify.close();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    fastify.log.info("Shutting down server...");
    await fastify.close();
    process.exit(0);
  });
};

export default exceptionPlugin;
