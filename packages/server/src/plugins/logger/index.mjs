import merge from "deepmerge";
import pino from "pino";

export const loggerPlugin = async (fastify, options) => {
  // const defaultPinoOptions = {
  //   sys: (options = {}) => {
  //     return merge(
  //       {
  //         target: "pino/file",
  //         options: {
  //           destination: "1",
  //           mkdir: true,
  //           append: false,
  //           sync: false,
  //           level: "info",
  //         },
  //       },
  //       options
  //     );
  //   },
  //   file: (options = {}) => {
  //     return merge(
  //       {
  //         target: "pino/file",
  //         options: {
  //           destination: process.cwd() + "/logs/fastify.log",
  //           mkdir: true,
  //           append: false,
  //           sync: false,
  //           level: "info",
  //         },
  //       },
  //       options
  //     );
  //   },
  //   pretty: (options = {}) => {
  //     return merge(
  //       {
  //         target: "pino-pretty",
  //       },
  //       options
  //     );
  //   },
  // };
  // const target = !options.target
  //   ? [defaultPinoOptions.pretty()]
  //   : options.targets.map(({ type, options }) => {
  //       return defaultPinoOptions[type](options);
  //     });
  // const transport = pino.transport({
  //   target,
  // });
  // console.log({target});
  // // const logger = pino({
  // //   mixin: (source) => {
  // //     return {
  // //       tags: options.tags ? options.tags : [],
  // //     };
  // //   },
  // //   transport,
  // // });
  // // fastify.decorate("logger", logger);
};

export default loggerPlugin;
