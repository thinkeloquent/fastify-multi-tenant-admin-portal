import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import jsonfile from "jsonfile";
import { DataTypes, Op } from "sequelize";
import { unflatten } from "flat";
import { v7 as uuidv7 } from "uuid";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sharedData = jsonfile.readFileSync(__dirname + "/../data.json");

async function flatJsonPlugin(fastify, opts) {
  fastify.addHook("onRequest", async (request, reply) => {
    request.tenantId = "flat-json";
    fastify.log.info(`FlatJSON request: ${request.method} ${request.url}`, {
      tenantId: request.tenantId,
      timestamp: new Date().toISOString(),
      userAgent: request.headers["user-agent"],
      ip: request.ip,
    });
  });

  const sequelize = fastify.db;

  const FlatJsonObject = sequelize.define(
    "flat_json_object",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: { type: DataTypes.TEXT },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      is_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_frozen: { type: DataTypes.BOOLEAN, defaultValue: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "flat_json_object",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  const FlatJsonVersion = sequelize.define(
    "flat_json_version",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      object_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "flat_json_object", key: "id" },
      },
      version_number: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT },
      tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      is_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_frozen: { type: DataTypes.BOOLEAN, defaultValue: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "flat_json_version",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  const FlatJsonRevision = sequelize.define(
    "flat_json_revision",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      version_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "flat_json_version", key: "id" },
      },
      revision_uuid: {
        type: DataTypes.UUID,
        defaultValue: uuidv7,
        allowNull: false,
      },
      summary: { type: DataTypes.TEXT },
      tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      is_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_frozen: { type: DataTypes.BOOLEAN, defaultValue: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "flat_json_revision",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  const FlatJsonProperty = sequelize.define(
    "flat_json_property",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: DataTypes.STRING(255), allowNull: false },
      key_path: { type: DataTypes.TEXT, allowNull: false },
      key_value: { type: DataTypes.TEXT, allowNull: false },
      revision_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "flat_json_revision", key: "id" },
      },
      status: {
        type: DataTypes.ENUM("active", "draft", "deprecated"),
        defaultValue: "active",
      },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      is_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_frozen: { type: DataTypes.BOOLEAN, defaultValue: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "flat_json_property",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
      indexes: [
        {
          unique: true,
          fields: ["revision_id", "key_path"],
          where: { is_active: true },
        },
      ],
    }
  );

  const FlatJsonChangelog = sequelize.define(
    "flat_json_changelog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      revision_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "flat_json_revision", key: "id" },
      },
      version_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "flat_json_version", key: "id" },
      },
      object_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "flat_json_object", key: "id" },
      },
      entity_type: {
        type: DataTypes.ENUM("object", "version", "revision", "flat_property"),
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM(
          "create",
          "update",
          "delete",
          "restore",
          "lock",
          "unlock"
        ),
        allowNull: false,
      },
      details: { type: DataTypes.JSON, defaultValue: {} },
      tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      performed_by: { type: DataTypes.STRING(255), defaultValue: "system" },
      performed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "flat_json_changelog",
      timestamps: false,
    }
  );

  FlatJsonObject.hasMany(FlatJsonVersion, { foreignKey: "object_id" });
  FlatJsonVersion.belongsTo(FlatJsonObject, { foreignKey: "object_id" });
  FlatJsonVersion.hasMany(FlatJsonRevision, { foreignKey: "version_id" });
  FlatJsonRevision.belongsTo(FlatJsonVersion, { foreignKey: "version_id" });
  FlatJsonRevision.hasMany(FlatJsonProperty, { foreignKey: "revision_id" });
  FlatJsonProperty.belongsTo(FlatJsonRevision, { foreignKey: "revision_id" });

  FlatJsonObject.hasMany(FlatJsonChangelog, { foreignKey: "object_id" });
  FlatJsonChangelog.belongsTo(FlatJsonObject, { foreignKey: "object_id" });
  FlatJsonVersion.hasMany(FlatJsonChangelog, { foreignKey: "version_id" });
  FlatJsonChangelog.belongsTo(FlatJsonVersion, { foreignKey: "version_id" });
  FlatJsonRevision.hasMany(FlatJsonChangelog, { foreignKey: "revision_id" });
  FlatJsonChangelog.belongsTo(FlatJsonRevision, { foreignKey: "revision_id" });

  const parseSemanticVersion = (version) => {
    const match = version.match(
      /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/
    );
    if (!match) return null;

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || null,
      build: match[5] || null,
    };
  };

  const isValidSemanticVersion = (version) => {
    return parseSemanticVersion(version) !== null;
  };

  const incrementSemanticVersion = (version, type) => {
    const parsed = parseSemanticVersion(version);
    if (!parsed) return null;

    switch (type) {
      case "major":
        return `${parsed.major + 1}.0.0`;
      case "minor":
        return `${parsed.major}.${parsed.minor + 1}.0`;
      case "patch":
        return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
      default:
        return null;
    }
  };

  const getNextVersionNumber = async (objectId) => {
    const versions = await FlatJsonVersion.findAll({
      where: { object_id: objectId, is_active: true },
      order: [["created_at", "DESC"]],
    });

    if (versions.length === 0) {
      return {
        major: "1.0.0",
        minor: "0.1.0",
        patch: "0.0.1",
      };
    }

    const latestVersion = versions[0];
    const currentVersion = latestVersion.version_number;

    if (!isValidSemanticVersion(currentVersion)) {
      return {
        major: "1.0.0",
        minor: "0.1.0",
        patch: "0.0.1",
      };
    }

    return {
      major: incrementSemanticVersion(currentVersion, "major"),
      minor: incrementSemanticVersion(currentVersion, "minor"),
      patch: incrementSemanticVersion(currentVersion, "patch"),
    };
  };

  const getNextRevisionNumber = async (versionId) => {
    const revisions = await FlatJsonRevision.findAll({
      where: { version_id: versionId, is_active: true },
      order: [["created_at", "DESC"]],
    });

    const currentCount = revisions.length;
    const nextRevision = uuidv7();

    return {
      nextRevision,
      currentCount,
    };
  };

  const unflattenProperties = (entries) => {
    const flatJson = {};
    entries.forEach((entry) => {
      let value = entry.key_value;
      try {
        if (entry.type === "number") {
          value = parseFloat(value);
        } else if (entry.type === "boolean") {
          value = value === "true";
        } else if (entry.type === "object" || entry.type === "array") {
          value = JSON.parse(value);
        } else if (entry.type === "null") {
          value = null;
        }
      } catch (error) {
        fastify.log.warn(
          `Failed to parse value for ${entry.key_path}: ${error.message}`
        );
      }
      flatJson[entry.key_path] = value;
    });
    return unflatten(flatJson);
  };

  const createChangelogEntry = async (params) => {
    const {
      objectId = null,
      versionId = null,
      revisionId = null,
      entityType,
      action,
      details = {},
      tags = [],
      performedBy = "system",
    } = params;

    return await FlatJsonChangelog.create({
      object_id: objectId,
      version_id: versionId,
      revision_id: revisionId,
      entity_type: entityType,
      action,
      details,
      tags,
      performed_by: performedBy,
      performed_at: new Date(),
    });
  };

  const checkLockHierarchy = async (entityType, entityId) => {
    let entity;

    switch (entityType) {
      case "flat_property":
        entity = await FlatJsonProperty.findByPk(entityId, {
          include: [
            {
              model: FlatJsonRevision,
              include: [
                {
                  model: FlatJsonVersion,
                  include: [FlatJsonObject],
                },
              ],
            },
          ],
        });

        if (!entity) throw new Error("Flat Property not found");

        if (entity.is_locked) throw new Error("Flat Property is locked");
        if (entity.flat_json_revision?.is_locked)
          throw new Error("Parent revision is locked");
        if (entity.flat_json_revision?.flat_json_version?.is_locked)
          throw new Error("Parent version is locked");
        if (
          entity.flat_json_revision?.flat_json_version?.flat_json_object
            ?.is_locked
        )
          throw new Error("Parent object is locked");
        break;

      case "revision":
        entity = await FlatJsonRevision.findByPk(entityId, {
          include: [
            {
              model: FlatJsonVersion,
              include: [FlatJsonObject],
            },
          ],
        });

        if (!entity) throw new Error("Revision not found");

        if (entity.is_locked) throw new Error("Revision is locked");
        if (entity.flat_json_version?.is_locked)
          throw new Error("Parent version is locked");
        if (entity.flat_json_version?.flat_json_object?.is_locked)
          throw new Error("Parent object is locked");
        break;

      case "version":
        entity = await FlatJsonVersion.findByPk(entityId, {
          include: [FlatJsonObject],
        });

        if (!entity) throw new Error("Version not found");

        if (entity.is_locked) throw new Error("Version is locked");
        if (entity.flat_json_object?.is_locked)
          throw new Error("Parent object is locked");
        break;

      case "object":
        entity = await FlatJsonObject.findByPk(entityId);

        if (!entity) throw new Error("Object not found");

        if (entity.is_locked) throw new Error("Object is locked");
        break;
    }

    return entity;
  };

  fastify.get("/objects/:id/next-version", async (request, reply) => {
    try {
      const nextVersionInfo = await getNextVersionNumber(request.params.id);
      return { data: nextVersionInfo };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/versions/:id/next-revision", async (request, reply) => {
    try {
      const nextRevisionInfo = await getNextRevisionNumber(request.params.id);
      return { data: nextRevisionInfo };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.post("/objects/:id/increment-version", async (request, reply) => {
    try {
      const { incrementType = "patch" } = request.body;
      const objectId = request.params.id;

      await checkLockHierarchy("object", objectId);
      const object = await FlatJsonObject.findByPk(objectId);

      const nextVersionInfo = await getNextVersionNumber(objectId);
      const newVersionLabel = nextVersionInfo[incrementType];

      if (!newVersionLabel) {
        return reply.code(400).send({ errors: ["Invalid increment type"] });
      }

      const version = await FlatJsonVersion.create({
        object_id: objectId,
        version_number: newVersionLabel,
        description: `Auto-incremented ${incrementType} version`,
        tags: ["auto-generated", incrementType],
      });

      await createChangelogEntry({
        objectId: objectId,
        versionId: version.id,
        entityType: "version",
        action: "create",
        details: {
          object_id: objectId,
          version_number: newVersionLabel,
          incrementType,
          auto_generated: true,
        },
        tags: ["auto-increment", incrementType],
        performedBy: request.user?.username || "system",
      });

      return reply.code(201).send({ data: version });
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.post("/versions/:id/increment-revision", async (request, reply) => {
    try {
      const versionId = request.params.id;

      await checkLockHierarchy("version", versionId);
      const version = await FlatJsonVersion.findByPk(versionId, {
        include: [FlatJsonObject],
      });

      const nextRevisionInfo = await getNextRevisionNumber(versionId);
      const newRevisionLabel = nextRevisionInfo.nextRevision;

      const revision = await FlatJsonRevision.create({
        version_id: versionId,
        revision_uuid: newRevisionLabel,
        summary: `Auto-incremented revision`,
        tags: ["auto-generated"],
      });

      await createChangelogEntry({
        objectId: version.object_id,
        versionId: versionId,
        revisionId: revision.id,
        entityType: "revision",
        action: "create",
        details: {
          version_id: versionId,
          revision_uuid: newRevisionLabel,
          auto_generated: true,
        },
        tags: ["auto-increment"],
        performedBy: request.user?.username || "system",
      });

      return reply.code(201).send({ data: revision });
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.get("/objects", async (request, reply) => {
    try {
      const objects = await FlatJsonObject.findAll({
        include: [
          {
            model: FlatJsonVersion,
            where: { is_active: true },
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
      });
      return { data: objects };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/objects/:id", async (request, reply) => {
    try {
      const object = await FlatJsonObject.findByPk(request.params.id, {
        include: [
          {
            model: FlatJsonVersion,
            where: { is_active: true },
            required: false,
            include: [
              {
                model: FlatJsonRevision,
                where: { is_active: true },
                required: false,
              },
            ],
          },
        ],
      });
      if (!object) return reply.code(404).send({ error: "Object not found" });
      return { data: object };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.post("/objects", async (request, reply) => {
    try {
      const { name, description } = request.body;

      if (!name) {
        return reply.code(400).send({ errors: ["Name is required"] });
      }

      const object = await FlatJsonObject.create({ name, description });

      await createChangelogEntry({
        objectId: object.id,
        entityType: "object",
        action: "create",
        details: { name, description },
        performedBy: request.user?.username || "system",
      });

      return reply.code(201).send({ data: object });
    } catch (error) {
      fastify.log.error(error);
      if (error.name === "SequelizeUniqueConstraintError") {
        reply.code(400).send({ errors: ["Object name must be unique"] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.put("/objects/:id", async (request, reply) => {
    try {
      const { name, description, is_active } = request.body;

      await checkLockHierarchy("object", request.params.id);
      const object = await FlatJsonObject.findByPk(request.params.id);

      const oldValues = {
        name: object.name,
        description: object.description,
        is_active: object.is_active,
      };

      await object.update({
        name: name || object.name,
        description:
          description !== undefined ? description : object.description,
        is_active: is_active !== undefined ? is_active : object.is_active,
      });

      await createChangelogEntry({
        objectId: object.id,
        entityType: "object",
        action: "update",
        details: { oldValues, newValues: { name, description, is_active } },
        performedBy: request.user?.username || "system",
      });

      return { data: object };
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else if (error.name === "SequelizeUniqueConstraintError") {
        reply.code(400).send({ errors: ["Object name must be unique"] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.post("/objects/:id/lock", async (request, reply) => {
    try {
      const object = await FlatJsonObject.findByPk(request.params.id);
      if (!object)
        return reply.code(404).send({ errors: ["Object not found"] });
      if (object.is_locked)
        return reply.code(400).send({ errors: ["Object is already locked"] });

      await object.update({ is_locked: true });
      await createChangelogEntry({
        objectId: object.id,
        entityType: "object",
        action: "lock",
        performedBy: request.user?.username || "system",
      });

      return { data: object };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.post("/objects/:id/unlock", async (request, reply) => {
    try {
      const object = await FlatJsonObject.findByPk(request.params.id);
      if (!object)
        return reply.code(404).send({ errors: ["Object not found"] });
      if (!object.is_locked)
        return reply.code(400).send({ errors: ["Object is already unlocked"] });

      await object.update({ is_locked: false });
      await createChangelogEntry({
        objectId: object.id,
        entityType: "object",
        action: "unlock",
        performedBy: request.user?.username || "system",
      });

      return { data: object };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.delete("/objects/:id", async (request, reply) => {
    try {
      await checkLockHierarchy("object", request.params.id);
      const object = await FlatJsonObject.findByPk(request.params.id);

      await object.update({ is_active: false });
      await createChangelogEntry({
        objectId: object.id,
        entityType: "object",
        action: "delete",
        performedBy: request.user?.username || "system",
      });

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.get("/versions", async (request, reply) => {
    try {
      const versions = await FlatJsonVersion.findAll({
        include: [FlatJsonObject],
        order: [["created_at", "DESC"]],
      });
      return { data: versions };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/objects/:id/versions", async (request, reply) => {
    try {
      const object = await FlatJsonObject.findByPk(request.params.id);
      if (!object)
        return reply.code(404).send({ errors: ["Object not found"] });

      const versions = await FlatJsonVersion.findAll({
        where: { object_id: request.params.id },
        include: [
          {
            model: FlatJsonRevision,
            where: { is_active: true },
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
      });
      return { data: versions };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/versions/:id", async (request, reply) => {
    try {
      const version = await FlatJsonVersion.findByPk(request.params.id, {
        include: [
          FlatJsonObject,
          {
            model: FlatJsonRevision,
            where: { is_active: true },
            required: false,
          },
        ],
      });
      if (!version)
        return reply.code(404).send({ errors: ["Version not found"] });
      return { data: version };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.post("/versions", async (request, reply) => {
    try {
      const {
        object_id,
        version_number,
        description,
        tags = [],
      } = request.body;

      if (!object_id || !version_number) {
        return reply
          .code(400)
          .send({ errors: ["Object ID and version number are required"] });
      }

      if (!isValidSemanticVersion(version_number)) {
        return reply.code(400).send({
          errors: [
            "Version number must follow semantic versioning (e.g., 1.0.0)",
          ],
        });
      }

      await checkLockHierarchy("object", object_id);

      const version = await FlatJsonVersion.create({
        object_id,
        version_number,
        description,
        tags,
      });

      await createChangelogEntry({
        objectId: object_id,
        versionId: version.id,
        entityType: "version",
        action: "create",
        details: { object_id, version_number, description, tags },
        performedBy: request.user?.username || "system",
      });

      return reply.code(201).send({ data: version });
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.put("/versions/:id", async (request, reply) => {
    try {
      const { version_number, description, is_active, tags } = request.body;

      if (version_number && !isValidSemanticVersion(version_number)) {
        return reply.code(400).send({
          errors: [
            "Version number must follow semantic versioning (e.g., 1.0.0)",
          ],
        });
      }

      await checkLockHierarchy("version", request.params.id);
      const version = await FlatJsonVersion.findByPk(request.params.id, {
        include: [FlatJsonObject],
      });

      const oldValues = {
        version_number: version.version_number,
        description: version.description,
        is_active: version.is_active,
        tags: version.tags,
      };

      await version.update({
        version_number: version_number || version.version_number,
        description:
          description !== undefined ? description : version.description,
        is_active: is_active !== undefined ? is_active : version.is_active,
        tags: tags || version.tags,
      });

      await createChangelogEntry({
        objectId: version.object_id,
        versionId: version.id,
        entityType: "version",
        action: "update",
        details: {
          oldValues,
          newValues: { version_number, description, is_active, tags },
        },
        performedBy: request.user?.username || "system",
      });

      return { data: version };
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.post("/versions/:id/lock", async (request, reply) => {
    try {
      const version = await FlatJsonVersion.findByPk(request.params.id, {
        include: [FlatJsonObject],
      });
      if (!version)
        return reply.code(404).send({ errors: ["Version not found"] });
      if (version.is_locked)
        return reply.code(400).send({ errors: ["Version is already locked"] });
      if (version.flat_json_object?.is_locked) {
        return reply
          .code(403)
          .send({ errors: ["Cannot lock version of locked object"] });
      }

      await version.update({ is_locked: true });
      await createChangelogEntry({
        objectId: version.object_id,
        versionId: version.id,
        entityType: "version",
        action: "lock",
        performedBy: request.user?.username || "system",
      });

      return { data: version };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.post("/versions/:id/unlock", async (request, reply) => {
    try {
      await checkLockHierarchy("version", request.params.id);
      const version = await FlatJsonVersion.findByPk(request.params.id, {
        include: [FlatJsonObject],
      });

      if (!version.is_locked)
        return reply
          .code(400)
          .send({ errors: ["Version is already unlocked"] });

      await version.update({ is_locked: false });
      await createChangelogEntry({
        objectId: version.object_id,
        versionId: version.id,
        entityType: "version",
        action: "unlock",
        performedBy: request.user?.username || "system",
      });

      return { data: version };
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.delete("/versions/:id", async (request, reply) => {
    try {
      await checkLockHierarchy("version", request.params.id);
      const version = await FlatJsonVersion.findByPk(request.params.id, {
        include: [FlatJsonObject],
      });

      await version.update({ is_active: false });
      await createChangelogEntry({
        objectId: version.object_id,
        versionId: version.id,
        entityType: "version",
        action: "delete",
        performedBy: request.user?.username || "system",
      });

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.get("/revisions", async (request, reply) => {
    try {
      const revisions = await FlatJsonRevision.findAll({
        include: [{ model: FlatJsonVersion, include: [FlatJsonObject] }],
        order: [["created_at", "DESC"]],
      });
      return { data: revisions };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/versions/:id/revisions", async (request, reply) => {
    try {
      const version = await FlatJsonVersion.findByPk(request.params.id);
      if (!version)
        return reply.code(404).send({ errors: ["Version not found"] });

      const revisions = await FlatJsonRevision.findAll({
        where: { version_id: request.params.id },
        include: [
          {
            model: FlatJsonProperty,
            where: { is_active: true },
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
      });
      return { data: revisions };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/revisions/:id", async (request, reply) => {
    try {
      const revision = await FlatJsonRevision.findByPk(request.params.id, {
        include: [
          {
            model: FlatJsonVersion,
            include: [FlatJsonObject],
          },
          {
            model: FlatJsonProperty,
            where: { is_active: true },
            required: false,
          },
        ],
      });
      if (!revision)
        return reply.code(404).send({ errors: ["Revision not found"] });
      return { data: revision };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.post("/revisions", async (request, reply) => {
    try {
      const { version_id, revision_uuid, summary, tags = [] } = request.body;

      if (!version_id) {
        return reply.code(400).send({ errors: ["Version ID is required"] });
      }

      await checkLockHierarchy("version", version_id);
      const version = await FlatJsonVersion.findByPk(version_id, {
        include: [FlatJsonObject],
      });

      const revisionLabel = revision_uuid || uuidv7();

      const revision = await FlatJsonRevision.create({
        version_id,
        revision_uuid: revisionLabel,
        summary,
        tags,
      });

      await createChangelogEntry({
        objectId: version.object_id,
        versionId: version_id,
        revisionId: revision.id,
        entityType: "revision",
        action: "create",
        details: { version_id, revision_uuid: revisionLabel, summary, tags },
        performedBy: request.user?.username || "system",
      });

      return reply.code(201).send({ data: revision });
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.put("/revisions/:id", async (request, reply) => {
    try {
      const { revision_uuid, summary, is_active, tags } = request.body;

      await checkLockHierarchy("revision", request.params.id);
      const revision = await FlatJsonRevision.findByPk(request.params.id, {
        include: [{ model: FlatJsonVersion, include: [FlatJsonObject] }],
      });

      const oldValues = {
        revision_uuid: revision.revision_uuid,
        summary: revision.summary,
        is_active: revision.is_active,
        tags: revision.tags,
      };

      await revision.update({
        revision_uuid: revision_uuid || revision.revision_uuid,
        summary: summary !== undefined ? summary : revision.summary,
        is_active: is_active !== undefined ? is_active : revision.is_active,
        tags: tags || revision.tags,
      });

      await createChangelogEntry({
        objectId: revision.flat_json_version?.object_id,
        versionId: revision.version_id,
        revisionId: revision.id,
        entityType: "revision",
        action: "update",
        details: {
          oldValues,
          newValues: { revision_uuid, summary, is_active, tags },
        },
        performedBy: request.user?.username || "system",
      });

      return { data: revision };
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.post("/revisions/:id/lock", async (request, reply) => {
    try {
      const revision = await FlatJsonRevision.findByPk(request.params.id, {
        include: [{ model: FlatJsonVersion, include: [FlatJsonObject] }],
      });
      if (!revision)
        return reply.code(404).send({ errors: ["Revision not found"] });
      if (revision.is_locked)
        return reply.code(400).send({ errors: ["Revision is already locked"] });
      if (revision.flat_json_version?.is_locked) {
        return reply
          .code(403)
          .send({ errors: ["Cannot lock revision of locked version"] });
      }
      if (revision.flat_json_version?.flat_json_object?.is_locked) {
        return reply
          .code(403)
          .send({ errors: ["Cannot lock revision of locked object"] });
      }

      await revision.update({ is_locked: true });
      await createChangelogEntry({
        objectId: revision.flat_json_version?.object_id,
        versionId: revision.version_id,
        revisionId: revision.id,
        entityType: "revision",
        action: "lock",
        performedBy: request.user?.username || "system",
      });

      return { data: revision };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.post("/revisions/:id/unlock", async (request, reply) => {
    try {
      await checkLockHierarchy("revision", request.params.id);
      const revision = await FlatJsonRevision.findByPk(request.params.id, {
        include: [{ model: FlatJsonVersion, include: [FlatJsonObject] }],
      });

      if (!revision.is_locked)
        return reply
          .code(400)
          .send({ errors: ["Revision is already unlocked"] });

      await revision.update({ is_locked: false });
      await createChangelogEntry({
        objectId: revision.flat_json_version?.object_id,
        versionId: revision.version_id,
        revisionId: revision.id,
        entityType: "revision",
        action: "unlock",
        performedBy: request.user?.username || "system",
      });

      return { data: revision };
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.delete("/revisions/:id", async (request, reply) => {
    try {
      await checkLockHierarchy("revision", request.params.id);
      const revision = await FlatJsonRevision.findByPk(request.params.id, {
        include: [{ model: FlatJsonVersion, include: [FlatJsonObject] }],
      });

      await revision.update({ is_active: false });
      await createChangelogEntry({
        objectId: revision.flat_json_version?.object_id,
        versionId: revision.version_id,
        revisionId: revision.id,
        entityType: "revision",
        action: "delete",
        performedBy: request.user?.username || "system",
      });

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.get("/", async (request, reply) => {
    try {
      const flatProperties = await FlatJsonProperty.findAll({
        include: [
          {
            model: FlatJsonRevision,
            include: [
              {
                model: FlatJsonVersion,
                include: [FlatJsonObject],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
      });
      return { data: flatProperties };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/:id", async (request, reply) => {
    try {
      const flatProperty = await FlatJsonProperty.findByPk(request.params.id, {
        include: [
          {
            model: FlatJsonRevision,
            include: [
              {
                model: FlatJsonVersion,
                include: [FlatJsonObject],
              },
            ],
          },
        ],
      });
      if (!flatProperty)
        return reply.code(404).send({ errors: ["Flat Property not found"] });
      return { data: flatProperty };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/revision/:id", async (request, reply) => {
    try {
      const revision = await FlatJsonRevision.findByPk(request.params.id);
      if (!revision)
        return reply.code(404).send({ errors: ["Revision not found"] });

      const flatProperties = await FlatJsonProperty.findAll({
        where: { revision_id: request.params.id, is_active: true },
        order: [["key_path", "ASC"]],
      });
      return { data: flatProperties };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.post("/", async (request, reply) => {
    try {
      const { type, key_path, key_value, revision_id, status } = request.body;

      if (!type || !key_path || key_value === undefined || !revision_id) {
        return reply.code(400).send({
          errors: ["Type, key_path, key_value, and revision_id are required"],
        });
      }

      await checkLockHierarchy("revision", revision_id);
      const revision = await FlatJsonRevision.findByPk(revision_id, {
        include: [{ model: FlatJsonVersion, include: [FlatJsonObject] }],
      });

      const flatProperty = await FlatJsonProperty.create({
        type,
        key_path,
        key_value,
        revision_id,
        status: status || "active",
      });

      await createChangelogEntry({
        objectId: revision.flat_json_version?.object_id,
        versionId: revision.version_id,
        revisionId: revision_id,
        entityType: "flat_property",
        action: "create",
        details: { type, key_path, key_value, revision_id, status },
        performedBy: request.user?.username || "system",
      });

      return reply.code(201).send({ data: flatProperty });
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else if (error.name === "SequelizeUniqueConstraintError") {
        reply.code(400).send({
          errors: ["Key path must be unique within the revision"],
        });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.put("/:id", async (request, reply) => {
    try {
      const { type, key_path, key_value, status, is_active } = request.body;

      await checkLockHierarchy("flat_property", request.params.id);
      const flatProperty = await FlatJsonProperty.findByPk(request.params.id, {
        include: [
          {
            model: FlatJsonRevision,
            include: [{ model: FlatJsonVersion, include: [FlatJsonObject] }],
          },
        ],
      });

      const oldValues = {
        type: flatProperty.type,
        key_path: flatProperty.key_path,
        key_value: flatProperty.key_value,
        status: flatProperty.status,
        is_active: flatProperty.is_active,
      };

      await flatProperty.update({
        type: type || flatProperty.type,
        key_path: key_path || flatProperty.key_path,
        key_value: key_value !== undefined ? key_value : flatProperty.key_value,
        status: status || flatProperty.status,
        is_active: is_active !== undefined ? is_active : flatProperty.is_active,
      });

      await createChangelogEntry({
        objectId: flatProperty.flat_json_revision?.flat_json_version?.object_id,
        versionId: flatProperty.flat_json_revision?.version_id,
        revisionId: flatProperty.revision_id,
        entityType: "flat_property",
        action: "update",
        details: {
          oldValues,
          newValues: { type, key_path, key_value, status, is_active },
        },
        performedBy: request.user?.username || "system",
      });

      return { data: flatProperty };
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else if (error.name === "SequelizeUniqueConstraintError") {
        reply.code(400).send({
          errors: ["Key path must be unique within the revision"],
        });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.delete("/:id", async (request, reply) => {
    try {
      await checkLockHierarchy("flat_property", request.params.id);
      const flatProperty = await FlatJsonProperty.findByPk(request.params.id, {
        include: [
          {
            model: FlatJsonRevision,
            include: [{ model: FlatJsonVersion, include: [FlatJsonObject] }],
          },
        ],
      });

      await flatProperty.update({ is_active: false });
      await createChangelogEntry({
        objectId: flatProperty.flat_json_revision?.flat_json_version?.object_id,
        versionId: flatProperty.flat_json_revision?.version_id,
        revisionId: flatProperty.revision_id,
        entityType: "flat_property",
        action: "delete",
        performedBy: request.user?.username || "system",
      });

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      if (error.message.includes("locked")) {
        reply.code(403).send({ errors: [error.message] });
      } else {
        reply.code(500).send({ errors: [error.message] });
      }
    }
  });

  fastify.post("/:id/restore", async (request, reply) => {
    try {
      const flatProperty = await FlatJsonProperty.findByPk(request.params.id, {
        include: [
          {
            model: FlatJsonRevision,
            include: [{ model: FlatJsonVersion, include: [FlatJsonObject] }],
          },
        ],
        paranoid: false,
      });

      if (!flatProperty)
        return reply.code(404).send({ errors: ["Flat Property not found"] });

      await flatProperty.restore();
      await flatProperty.update({ is_active: true });

      await createChangelogEntry({
        objectId: flatProperty.flat_json_revision?.flat_json_version?.object_id,
        versionId: flatProperty.flat_json_revision?.version_id,
        revisionId: flatProperty.revision_id,
        entityType: "flat_property",
        action: "restore",
        performedBy: request.user?.username || "system",
      });

      return { data: flatProperty };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/revision/:id/unflatten", async (request, reply) => {
    try {
      const revision = await FlatJsonRevision.findByPk(request.params.id);
      if (!revision)
        return reply.code(404).send({ errors: ["Revision not found"] });

      const flatProperties = await FlatJsonProperty.findAll({
        where: { revision_id: request.params.id, is_active: true },
        order: [["key_path", "ASC"]],
      });

      const unflattenedData = unflattenProperties(flatProperties);
      return { data: unflattenedData };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/version/:id/unflatten", async (request, reply) => {
    try {
      const version = await FlatJsonVersion.findByPk(request.params.id, {
        include: [
          {
            model: FlatJsonRevision,
            where: { is_active: true },
            required: false,
            include: [
              {
                model: FlatJsonProperty,
                where: { is_active: true },
                required: false,
              },
            ],
          },
        ],
      });

      if (!version)
        return reply.code(404).send({ errors: ["Version not found"] });

      const allFlatProperties = [];
      version.flat_json_revisions?.forEach((revision) => {
        if (revision.flat_json_properties) {
          allFlatProperties.push(...revision.flat_json_properties);
        }
      });

      const unflattenedData = unflattenProperties(allFlatProperties);
      return { data: unflattenedData };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/object/:id/unflatten", async (request, reply) => {
    try {
      const object = await FlatJsonObject.findByPk(request.params.id, {
        include: [
          {
            model: FlatJsonVersion,
            where: { is_active: true },
            required: false,
            include: [
              {
                model: FlatJsonRevision,
                where: { is_active: true },
                required: false,
                include: [
                  {
                    model: FlatJsonProperty,
                    where: { is_active: true },
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!object)
        return reply.code(404).send({ errors: ["Object not found"] });

      const allFlatProperties = [];
      object.flat_json_versions?.forEach((version) => {
        version.flat_json_revisions?.forEach((revision) => {
          if (revision.flat_json_properties) {
            allFlatProperties.push(...revision.flat_json_properties);
          }
        });
      });

      const unflattenedData = unflattenProperties(allFlatProperties);
      return { data: unflattenedData };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/changelog", async (request, reply) => {
    try {
      const { limit = 100, offset = 0 } = request.query;
      const changelog = await FlatJsonChangelog.findAll({
        include: [
          { model: FlatJsonObject, required: false },
          { model: FlatJsonVersion, required: false },
          { model: FlatJsonRevision, required: false },
        ],
        order: [["performed_at", "DESC"]],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      });
      return { data: changelog };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/changelog/object/:id", async (request, reply) => {
    try {
      const changelog = await FlatJsonChangelog.findAll({
        where: { object_id: request.params.id },
        include: [
          { model: FlatJsonObject, required: false },
          { model: FlatJsonVersion, required: false },
          { model: FlatJsonRevision, required: false },
        ],
        order: [["performed_at", "DESC"]],
      });
      return { data: changelog };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/changelog/version/:id", async (request, reply) => {
    try {
      const changelog = await FlatJsonChangelog.findAll({
        where: { version_id: request.params.id },
        include: [
          { model: FlatJsonObject, required: false },
          { model: FlatJsonVersion, required: false },
          { model: FlatJsonRevision, required: false },
        ],
        order: [["performed_at", "DESC"]],
      });
      return { data: changelog };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  fastify.get("/changelog/revision/:id", async (request, reply) => {
    try {
      const changelog = await FlatJsonChangelog.findAll({
        where: { revision_id: request.params.id },
        include: [
          { model: FlatJsonObject, required: false },
          { model: FlatJsonVersion, required: false },
          { model: FlatJsonRevision, required: false },
        ],
        order: [["performed_at", "DESC"]],
      });
      return { data: changelog };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ errors: [error.message] });
    }
  });

  await sequelize.sync();

  fastify.decorate("flatJsonModels", {
    FlatJsonObject,
    FlatJsonVersion,
    FlatJsonRevision,
    FlatJsonProperty,
    FlatJsonChangelog,
  });

  fastify.decorate("flatJsonUtils", {
    unflattenProperties,
    createChangelogEntry,
    checkLockHierarchy,
    parseSemanticVersion,
    isValidSemanticVersion,
    incrementSemanticVersion,
    getNextVersionNumber,
    getNextRevisionNumber,
  });

  fastify.decorate("sharedData", sharedData);
}

export default flatJsonPlugin;
