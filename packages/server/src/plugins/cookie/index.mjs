import fastifyCookie from "@fastify/cookie";

export const cookiePlugin = async (fastify, options) => {
  fastify.register(fastifyCookie, {
    secret: options.secret,
    parseOptions: options.cookieParseOptions,
  });

  fastify.decorate("addNoCacheHeaders", () => {
    this.headers({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none';",
      "Permissions-Policy": "geolocation=(self), microphone=()",
      "Feature-Policy": "geolocation 'self'; microphone 'self'",
    });
    return this;
  });

  fastify.decorate("attachedAllowOrgin", (value) => {
    reply.raw.setHeader("Access-Control-Allow-Origin", value ? value : "*");
    reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
    reply.raw.setHeader("Access-Control-Allow-Headers", "Content-Type");
  });

  fastify.decorate("attachedXHeaders", (xHeaders) => {
    if (Array.isArray(xHeaders)) {
      xHeaders.forEach(([key, value]) => {
        reply.raw.setHeader(key, value);
      });
    }
  });
};

export default cookiePlugin;
