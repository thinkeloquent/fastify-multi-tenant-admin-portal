import { Sequelize, DataTypes } from "sequelize";

export const databasePlugin = async (app, options) => {
  const { fastify } = options;

  const sequelize = new Sequelize("mydatabase", "myuser", "mypassword", {
    host: "localhost",
    dialect: "postgres",
  });

  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  fastify.addHook("onClose", async (instance) => {
    await sequelize.close();
  });

  fastify.decorate("db", sequelize);

  // await sequelize.sync({ force: true });
  // await sequelize.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);

  // fastify.ready(async () => {
  //   await sequelize.sync({ force: true });
  //   // await sequelize.sync({ alter: true });
  //   console.log("hello");
  // });
};

export default databasePlugin;
