// main.mjs - Fastify plugin for object-based storage system
import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import semver from "semver";

/**
 * Object-Based Storage Plugin
 * A Fastify plugin that provides versioned object storage functionality with semver support
 *
 * @param {FastifyInstance} fastify - The Fastify instance
 * @param {Object} options - Plugin options
 */
export default async function objectBasedStoragePlugin(fastify, options) {
  // Validate Sequelize is available on app
  if (!fastify.db) {
    throw new Error(
      "fastify.db is required. Please register a Sequelize instance."
    );
  }

  // Define the model
  fastify.db.define(
    "ObjectBasedStorage",
    {
      uuid: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      version: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      data: {
        type: DataTypes.TEXT("long"), // Use TEXT to store raw JSON string
        allowNull: false,
      },
      metadata: {
        type: DataTypes.TEXT("long"), // Use TEXT to store raw JSON string
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      modified_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      change_summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      parent_version: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "object_based_storage",
      timestamps: true,
      schema: "public",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Object-based Storage Controller
  class ObjectBasedStorageController {
    async getAll(request, reply) {
      try {
        const objects = await fastify.db.models.ObjectBasedStorage.findAll({
          attributes: ["name", "type"],
          group: ["name", "type"],
          order: [["name", "ASC"]],
        });
        return reply.send(objects);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to retrieve objects" });
      }
    }

    async getAllVersions(request, reply) {
      const { name } = request.params;
      try {
        const versions = await fastify.db.models.ObjectBasedStorage.findAll({
          where: { name },
          order: [["created_at", "DESC"]],
        });
        return reply.send(versions);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to retrieve versions" });
      }
    }

    async getById(request, reply) {
      const { name, version } = request.params;
      try {
        const object = await fastify.db.models.ObjectBasedStorage.findOne({
          where: { name, version },
        });
        if (!object) {
          return reply.code(404).send({ error: "Object version not found" });
        }
        return reply.send(object);
      } catch (error) {
        fastify.log.error(error);
        return reply
          .code(500)
          .send({ error: "Failed to retrieve object version" });
      }
    }

    async getLatest(request, reply) {
      const { name } = request.params;
      try {
        // Get all versions and find the highest semver
        const versions = await fastify.db.models.ObjectBasedStorage.findAll({
          where: { name },
          attributes: ["version"],
        });

        if (versions.length === 0) {
          return reply.code(404).send({ error: "Object not found" });
        }

        // Sort by semver and get the latest
        const latestVersion = versions
          .map((v) => v.version)
          .sort(semver.rcompare)[0];

        const object = await fastify.db.models.ObjectBasedStorage.findOne({
          where: { name, version: latestVersion },
        });

        return reply.send(object);
      } catch (error) {
        fastify.log.error(error);
        return reply
          .code(500)
          .send({ error: "Failed to retrieve latest object version" });
      }
    }

    async getDiff(request, reply) {
      const { name, version, otherVersion } = request.params;
      try {
        const firstObject = await fastify.db.models.ObjectBasedStorage.findOne({
          where: { name, version },
        });
        if (!firstObject) {
          return reply
            .code(404)
            .send({ error: "First object version not found" });
        }
        const secondObject = await fastify.db.models.ObjectBasedStorage.findOne(
          {
            where: { name, version: otherVersion },
          }
        );
        if (!secondObject) {
          return reply
            .code(404)
            .send({ error: "Second object version not found" });
        }

        // Parse JSON data for comparison
        let firstData, secondData, firstMetadata, secondMetadata;

        try {
          firstData =
            typeof firstObject.data === "string"
              ? JSON.parse(firstObject.data)
              : firstObject.data;

          secondData =
            typeof secondObject.data === "string"
              ? JSON.parse(secondObject.data)
              : secondObject.data;

          firstMetadata =
            typeof firstObject.metadata === "string"
              ? JSON.parse(firstObject.metadata)
              : firstObject.metadata;

          secondMetadata =
            typeof secondObject.metadata === "string"
              ? JSON.parse(secondObject.metadata)
              : secondObject.metadata;
        } catch (e) {
          // If parsing fails, use the raw values
          firstData = firstObject.data;
          secondData = secondObject.data;
          firstMetadata = firstObject.metadata;
          secondMetadata = secondObject.metadata;
        }

        const diff = {
          firstVersion: version,
          secondVersion: otherVersion,
          dataChanges: {
            first: firstData,
            second: secondData,
          },
          metadataChanges: {
            first: firstMetadata,
            second: secondMetadata,
          },
        };

        return reply.send(diff);
      } catch (error) {
        fastify.log.error(error);
        return reply
          .code(500)
          .send({ error: "Failed to create diff between versions" });
      }
    }

    async getHistory(request, reply) {
      const { name } = request.params;
      try {
        // Get all versions for this object name
        const versions = await fastify.db.models.ObjectBasedStorage.findAll({
          where: { name },
          order: [["created_at", "DESC"]],
        });

        if (versions.length === 0) {
          return reply.code(404).send({ error: "Object history not found" });
        }

        // Process versions to create history entries with change information
        const history = [];

        for (let i = 0; i < versions.length; i++) {
          const current = versions[i];
          const previous = i < versions.length - 1 ? versions[i + 1] : null;

          let changes_count = 0;

          if (previous) {
            // This is a simplified change count calculation
            // In a real implementation, you'd calculate actual JSON differences
            try {
              const currentData = JSON.parse(current.data);
              const previousData = JSON.parse(previous.data);

              // Just check if they're different (simplified)
              if (
                JSON.stringify(currentData) !== JSON.stringify(previousData)
              ) {
                changes_count += 1;
              }

              const currentMeta = JSON.parse(current.metadata);
              const previousMeta = JSON.parse(previous.metadata);

              if (
                JSON.stringify(currentMeta) !== JSON.stringify(previousMeta)
              ) {
                changes_count += 1;
              }
            } catch (e) {
              // If parsing fails, assume changes
              changes_count = 1;
            }
          }

          history.push({
            version: current.version,
            created_at: current.created_at,
            updated_at: current.updated_at,
            modified_by: current.modified_by,
            change_summary: current.change_summary,
            parent_version: current.parent_version,
            changes_count,
          });
        }

        return reply.send(history);
      } catch (error) {
        fastify.log.error(error);
        return reply
          .code(500)
          .send({ error: "Failed to retrieve object history" });
      }
    }

    async create(request, reply) {
      const {
        name,
        type,
        data,
        metadata,
        modified_by,
        change_summary,
        version,
      } = request.body;
      try {
        // Use provided version or default to 1.0.0
        const objectVersion = version || "1.0.0";

        // Validate semver
        if (!semver.valid(objectVersion)) {
          return reply
            .code(400)
            .send({ error: "Invalid semantic version format" });
        }

        // Store data and metadata as provided (might be parsed JSON or stringified JSON)
        const newObject = await fastify.db.models.ObjectBasedStorage.create({
          uuid: uuidv4(),
          name,
          version: objectVersion,
          type,
          data,
          metadata,
          modified_by,
          change_summary,
          is_active: true,
          is_locked: false,
        });
        return reply.code(201).send(newObject);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to create object" });
      }
    }

    async clone(request, reply) {
      const { name, version } = request.params;
      const { modified_by, change_summary, version: newVersion } = request.body;
      try {
        const sourceObject = await fastify.db.models.ObjectBasedStorage.findOne(
          {
            where: { name, version },
          }
        );
        if (!sourceObject) {
          return reply
            .code(404)
            .send({ error: "Source object version not found" });
        }

        // Calculate new version using semver
        let objectVersion;
        if (newVersion) {
          objectVersion = newVersion;
        } else {
          objectVersion = semver.inc(version, "patch");
        }

        // Validate semver
        if (!semver.valid(objectVersion)) {
          return reply
            .code(400)
            .send({ error: "Invalid semantic version format" });
        }

        const clonedObject = await fastify.db.models.ObjectBasedStorage.create({
          uuid: uuidv4(),
          name: sourceObject.name,
          version: objectVersion,
          type: sourceObject.type,
          data: sourceObject.data,
          metadata: sourceObject.metadata,
          is_active: true,
          is_locked: false,
          modified_by: modified_by || sourceObject.modified_by,
          change_summary: change_summary || `Cloned from ${version}`,
          parent_version: sourceObject.version,
        });
        return reply.code(201).send(clonedObject);
      } catch (error) {
        fastify.log.error(error);
        return reply
          .code(500)
          .send({ error: "Failed to clone object version" });
      }
    }

    async update(request, reply) {
      const { name, version } = request.params;
      const updates = request.body;
      try {
        const object = await fastify.db.models.ObjectBasedStorage.findOne({
          where: { name, version },
        });
        if (!object) {
          return reply.code(404).send({ error: "Object version not found" });
        }
        if (object.is_locked) {
          return reply.code(403).send({
            error: "This object version is locked and cannot be modified",
          });
        }

        // If a new version is provided, validate it with semver
        if (updates.version && !semver.valid(updates.version)) {
          return reply
            .code(400)
            .send({ error: "Invalid semantic version format" });
        }

        // Don't allow changing these fields directly
        delete updates.uuid;
        delete updates.name;
        delete updates.version;

        for (const [key, value] of Object.entries(updates)) {
          if (key in object) {
            object[key] = value;
          }
        }

        object.updated_at = new Date();
        await object.save();
        return reply.send(object);
      } catch (error) {
        fastify.log.error(error);
        return reply
          .code(500)
          .send({ error: "Failed to update object version" });
      }
    }

    async delete(request, reply) {
      const { name, version } = request.params;
      try {
        const object = await fastify.db.models.ObjectBasedStorage.findOne({
          where: { name, version },
        });
        if (!object) {
          return reply.code(404).send({ error: "Object version not found" });
        }
        if (object.is_locked) {
          return reply.code(403).send({
            error: "This object version is locked and cannot be deleted",
          });
        }
        await object.destroy();
        return reply.code(204).send();
      } catch (error) {
        fastify.log.error(error);
        return reply
          .code(500)
          .send({ error: "Failed to delete object version" });
      }
    }
  }

  // Initialize controller
  const controller = new ObjectBasedStorageController();

  // Register routes
  fastify.get("/", controller.getAll);
  fastify.get("/:name", controller.getAllVersions);
  fastify.get("/:name/:version", controller.getById);
  fastify.get("/:name/latest", controller.getLatest);
  fastify.get("/:name/:version/diff/:otherVersion", controller.getDiff);
  fastify.get("/:name/history", controller.getHistory);
  fastify.post("/", controller.create);
  fastify.post("/:name/clone/:version", controller.clone);
  fastify.put("/:name/:version", controller.update);
  fastify.delete("/:name/:version", controller.delete);
}
