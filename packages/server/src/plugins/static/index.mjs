import fastifyStatic from "@fastify/static";

export const staticPlugin = async (fastify, options = {}) => {
  if (Array.isArray(options.assets))
    options.assets.forEach((asset, index) => {
      fastify.register(
        fastifyStatic,
        merge(
          {},
          {
            ...asset,
            prefix: `/asset-${index}/`,
            decorateReply: false,
            list: true,
            setHeaders: (res, path) => {
              res.setHeader("Cache-Control", "public, max-age=315576000");
              res.setHeader(
                "Expires",
                new Date(Date.now() + 315576000).toUTCString()
              );
            },
          }
        )
      );
    });

  if (options.public)
    fastify.register(
      fastifyStatic,
      merge(
        {},
        {
          ...options.public,
          prefix: "/public/",
          decorateReply: false,
          list: true,
          setHeaders: (res, path) => {
            res.setHeader("Cache-Control", "public, max-age=315576000");
            res.setHeader(
              "Expires",
              new Date(Date.now() + 315576000).toUTCString()
            );
          },
        }
      )
    );
};

export default staticPlugin;
