// Optional file to define a custom tenant ID
// This will override the directory name as the tenant ID

export const NAME = "access-control";

// You can also export additional tenant-specific initialization logic
export default async function initialize(app, options) {
  app.log.info(`Initializing tenant: ${NAME}`);

  return {
    initialized: new Date().toISOString(),
  };
}
