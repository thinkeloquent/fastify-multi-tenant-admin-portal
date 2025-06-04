import { DataTypes } from "sequelize";
import { newEnforcer, newModelFromString, StringAdapter } from "casbin";
import { v4 as uuidv4 } from "uuid";

/**
 * Access Control Management Plugin for Fastify
 * Provides policy definition and rule management with Casbin integration
 */
export default async function accessControlPlugin(fastify, options = {}) {
  // Configuration
  const config = {
    databaseUrl: options.databaseUrl || process.env.DATABASE_URL,
    defaultDBSchema: options.defaultDBSchema || "public",
    defaultPolicyName: options.defaultPolicyName || "RBAC_DOMAINS",
    logging: options.logging || false,
    useTimestamps: options.useTimestamps !== false,
    forceSync: options.forceSync || false,
  };

  // Helper Functions
  function createNamespace(str) {
    if (!str || typeof str !== "string") return "";
    return str
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "")
      .replace(/\s/g, "_")
      .toUpperCase();
  }

  function convertPolicyRuleToModel(policyRules) {
    return policyRules
      .map((rule) => rule.toJSON())
      .map(
        ({
          permission_type,
          rule_v0,
          rule_v1,
          rule_v2,
          rule_v3,
          rule_v4,
          rule_v5,
          rule_v6,
          rule_v7,
        }) => {
          return [
            permission_type,
            rule_v0,
            rule_v1,
            rule_v2,
            rule_v3,
            rule_v4,
            rule_v5,
            rule_v6,
            rule_v7,
          ]
            .filter((v) => v)
            .join(", ");
        }
      )
      .join("\n");
  }

  function parsePolicyText(policyText) {
    const rules = [];
    const lines = policyText.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) continue;

      const match = trimmedLine.match(/^([pg]),\s*(.+)$/);
      if (match) {
        const permissionType = match[1];
        const values = match[2].split(",").map((val) => val.trim());

        const rule = {
          permission_type: permissionType,
          name: [
            values[0] || "",
            values[1] || "",
            values[2] || "",
            values[3] || "",
            values[4] || "",
            values[5] || "",
            uuidv4(),
          ].join(","),
          rule_v0: values[0] || null,
          rule_v1: values[1] || null,
          rule_v2: values[2] || null,
          rule_v3: values[3] || null,
          rule_v4: values[4] || null,
          rule_v5: values[5] || null,
        };

        rules.push(rule);
      }
    }

    return rules;
  }

  // Response formatters
  const success = (data, message = "Success") => ({
    success: true,
    message,
    payload: data,
  });

  const error = (message = "Error", statusCode = 400) => ({
    success: false,
    message,
    statusCode,
  });

  // Database Models
  const PolicyDefinition = fastify.db.define(
    "PolicyDefinition",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      request_definition: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "sub, obj, act",
      },
      policy_definition: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "sub, obj, act",
      },
      role_definition: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "_, _",
      },
      policy_effect: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "some(where (p.eft == allow))",
      },
      matchers: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "r.sub == p.sub && r.obj == p.obj && r.act == p.act",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "access_control_definition",
      timestamps: config.useTimestamps,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      schema: config.defaultDBSchema,
    }
  );

  const PolicyRule = fastify.db.define(
    "PolicyRule",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      permission_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rule_v0: DataTypes.STRING,
      rule_v1: DataTypes.STRING,
      rule_v2: DataTypes.STRING,
      rule_v3: DataTypes.STRING,
      rule_v4: DataTypes.STRING,
      rule_v5: DataTypes.STRING,
      rule_v6: DataTypes.STRING,
      rule_v7: DataTypes.STRING,
      policy_definition_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "access_control_rule",
      timestamps: config.useTimestamps,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      schema: config.defaultDBSchema,
    }
  );

  PolicyDefinition.hasMany(PolicyRule, {
    foreignKey: "policy_definition_id",
    as: "rules",
  });

  PolicyRule.belongsTo(PolicyDefinition, {
    foreignKey: "policy_definition_id",
    as: "policyDefinition",
  });

  // Casbin Enforcer Setup
  fastify.decorate("createEnforcer", async function (policyDefinitionName) {
    try {
      // Get policy definition
      const policyDefinition = await PolicyDefinition.findOne({
        where: { name: policyDefinitionName, is_active: true },
      });

      if (!policyDefinition) {
        throw new Error(`Policy definition not found: ${policyDefinitionName}`);
      }

      // Get active policy rules
      const policyRules = await PolicyRule.findAll({
        where: {
          policy_definition_id: policyDefinition.id,
          is_active: true,
        },
      });

      // Build model text
      const modelText = [
        `[request_definition]`,
        `r = ${policyDefinition.request_definition}`,
        `[policy_definition]`,
        `p = ${policyDefinition.policy_definition}`,
        `[role_definition]`,
        `g = ${policyDefinition.role_definition}`,
        `[policy_effect]`,
        `e = ${policyDefinition.policy_effect}`,
        `[matchers]`,
        `m = ${policyDefinition.matchers}`,
      ].join("\n");

      // Convert rules to policy text
      const policyText = convertPolicyRuleToModel(policyRules);

      // Create Casbin enforcer
      const model = newModelFromString(modelText);
      const adapter = new StringAdapter(policyText);
      const enforcer = await newEnforcer(model, adapter);

      // Add helper functions
      enforcer.addFunction("matchKeyword", (key1, key2) => {
        return key1 === key2 || key2 === "*";
      });

      return enforcer;
    } catch (err) {
      fastify.log.error(`Failed to create enforcer: ${err.message}`);
      throw err;
    }
  });

  // Create default enforcer
  try {
    const enforcer = await fastify.createEnforcer(config.defaultPolicyName);

    fastify.decorate("decorateAccessControlRules", {
      getPolicy: async () => await enforcer.getPolicy(),
      getGroupingPolicy: async () => await enforcer.getGroupingPolicy(),
      getRolesForUser: async (user) => await enforcer.getRolesForUser(user),
      addPolicy: async (sub, obj, act) =>
        await enforcer.addPolicy(sub, obj, act),
      addGroupingPolicy: async (sub, group) =>
        await enforcer.addGroupingPolicy(sub, group),
      enforce: async (sub, obj, act) => await enforcer.enforce(sub, obj, act),
      removePolicy: async (sub, obj, act) =>
        await enforcer.removePolicy(sub, obj, act),
      savePolicy: async () => await enforcer.savePolicy(),
    });

    fastify.log.info("Default enforcer created successfully");
  } catch (err) {
    fastify.log.error(`Error initializing enforcer: ${err.message}`);
  }

  // Setup endpoint
  fastify.get("/setup/policy", async () => {
    try {
      // Check if default policy exists
      let defaultPolicy = await PolicyDefinition.findOne({
        where: { name: config.defaultPolicyName },
      });

      // Create default policy if it doesn't exist
      if (!defaultPolicy) {
        fastify.log.info(
          `Creating default policy: ${config.defaultPolicyName}`
        );

        defaultPolicy = await PolicyDefinition.create({
          name: config.defaultPolicyName,
          request_definition: "sub, dom, obj, act",
          policy_definition: "sub, dom, obj, act",
          role_definition: "_, _",
          policy_effect: "some(where (p.eft == allow))",
          matchers:
            "g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.act",
        });

        // Create default rules for the policy
        const defaultRules = [
          {
            permission_type: "p",
            name: "admin_all_access",
            rule_v0: "admin",
            rule_v1: "*",
            rule_v2: "*",
            rule_v3: "*",
            policy_definition_id: defaultPolicy.id,
            is_active: true,
          },
          {
            permission_type: "g",
            name: "user1_admin_role",
            rule_v0: "user1",
            rule_v1: "admin",
            rule_v2: "default",
            policy_definition_id: defaultPolicy.id,
            is_active: true,
          },
        ];

        await PolicyRule.bulkCreate(defaultRules);
        return success(
          null,
          `Created default policy: ${config.defaultPolicyName}`
        );
      }

      return success(
        defaultPolicy,
        `Default policy exists: ${config.defaultPolicyName}`
      );
    } catch (err) {
      fastify.log.error(`Error during policy initialization: ${err.message}`);
      throw err;
    }
  });

  // API Endpoints
  fastify.get("/policy/definitions", async (request, reply) => {
    try {
      const policyDefinitions = await PolicyDefinition.findAll({
        order: [["id", "ASC"]],
      });

      return success({ policyDefinitions });
    } catch (err) {
      request.log.error(err);
      return reply
        .code(500)
        .send(error(`Failed to fetch policy definitions: ${err.message}`));
    }
  });

  fastify.get("/policy/definition/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const policyDefinition = await PolicyDefinition.findByPk(id);

      if (!policyDefinition) {
        return reply.code(404).send(error("Policy definition not found"));
      }

      return success({ policyDefinition });
    } catch (err) {
      request.log.error(err);
      return reply
        .code(500)
        .send(error(`Failed to fetch policy definition: ${err.message}`));
    }
  });

  fastify.post("/policy/definition/create", async (request, reply) => {
    try {
      const { policyDefinition } = request.body;

      if (!policyDefinition) {
        return reply
          .code(400)
          .send(error("Missing policyDefinition in request body"));
      }

      const newPolicyDefinition = await PolicyDefinition.create({
        name: policyDefinition.name
          ? createNamespace(policyDefinition.name)
          : null,
        request_definition:
          policyDefinition.request_definition || "sub, obj, act",
        policy_definition:
          policyDefinition.policy_definition || "sub, obj, act",
        role_definition: policyDefinition.role_definition || "_, _",
        policy_effect:
          policyDefinition.policy_effect || "some(where (p.eft == allow))",
        matchers:
          policyDefinition.matchers ||
          "r.sub == p.sub && r.obj == p.obj && r.act == p.act",
      });

      return reply.code(201).send(
        success(
          {
            policyDefinition: newPolicyDefinition,
          },
          "Policy definition created successfully"
        )
      );
    } catch (err) {
      request.log.error(err);

      if (err.name === "SequelizeUniqueConstraintError") {
        return reply
          .code(400)
          .send(error("A policy with this name already exists"));
      }

      return reply
        .code(500)
        .send(error(`Failed to create policy definition: ${err.message}`));
    }
  });

  fastify.post("/policy/definition/:id/update", async (request, reply) => {
    try {
      const { id } = request.params;
      const { policyDefinition } = request.body;

      if (!policyDefinition) {
        return reply
          .code(400)
          .send(error("Missing policyDefinition in request body"));
      }

      const existingPolicy = await PolicyDefinition.findByPk(id);

      if (!existingPolicy) {
        return reply.code(404).send(error("Policy definition not found"));
      }

      const [updatedCount] = await PolicyDefinition.update(
        {
          name: policyDefinition.name,
          request_definition: policyDefinition.request_definition,
          policy_definition: policyDefinition.policy_definition,
          role_definition: policyDefinition.role_definition,
          policy_effect: policyDefinition.policy_effect,
          matchers: policyDefinition.matchers,
          is_active:
            policyDefinition.is_active !== undefined
              ? policyDefinition.is_active
              : true,
        },
        {
          where: { id },
        }
      );

      if (updatedCount === 0) {
        return reply.code(400).send(error("No changes were made"));
      }

      const updatedPolicy = await PolicyDefinition.findByPk(id);

      return success(
        {
          policyDefinition: updatedPolicy,
        },
        "Policy definition updated successfully"
      );
    } catch (err) {
      request.log.error(err);
      return reply
        .code(500)
        .send(error(`Failed to update policy definition: ${err.message}`));
    }
  });

  fastify.get("/policy/definition/:id/rules", async (request, reply) => {
    try {
      const { id } = request.params;

      const policyDefinition = await PolicyDefinition.findByPk(id);

      if (!policyDefinition) {
        return reply.code(404).send(error("Policy definition not found"));
      }

      const policyRules = await PolicyRule.findAll({
        where: { policy_definition_id: id },
        order: [
          ["permission_type", "ASC"],
          ["createdAt", "DESC"],
        ],
      });

      return success({ policyRules });
    } catch (err) {
      request.log.error(err);
      return reply
        .code(500)
        .send(error(`Failed to fetch policy rules: ${err.message}`));
    }
  });

  fastify.get("/policy/rule/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const policyRule = await PolicyRule.findByPk(id);

      if (!policyRule) {
        return reply.code(404).send(error("Policy rule not found"));
      }

      return success({ policyRule });
    } catch (err) {
      request.log.error(err);
      return reply
        .code(500)
        .send(error(`Failed to fetch policy rule: ${err.message}`));
    }
  });

  fastify.post("/policy/definition/rule/:id/create", async (request, reply) => {
    try {
      const policy_definition_id = request.params.id;
      const { policyRule } = request.body;

      if (!policyRule) {
        return reply
          .code(400)
          .send(error("Missing policyRule in request body"));
      }

      // Check if policy definition exists
      const policyDefinition =
        await PolicyDefinition.findByPk(policy_definition_id);
      if (!policyDefinition) {
        return reply.code(404).send(error("Policy definition not found"));
      }

      // Create a name for the rule
      const ruleName = [
        policyRule.rule_v0 || "",
        policyRule.rule_v1 || "",
        policyRule.rule_v2 || "",
        policyRule.rule_v3 || "",
        policyRule.rule_v4 || "",
        policyRule.rule_v5 || "",
        uuidv4(),
      ].join(",");

      // Create rule
      const newRule = await PolicyRule.create({
        policy_definition_id,
        permission_type: policyRule.permission_type,
        name: ruleName,
        rule_v0: policyRule.rule_v0 || null,
        rule_v1: policyRule.rule_v1 || null,
        rule_v2: policyRule.rule_v2 || null,
        rule_v3: policyRule.rule_v3 || null,
        rule_v4: policyRule.rule_v4 || null,
        rule_v5: policyRule.rule_v5 || null,
        rule_v6: policyRule.rule_v6 || null,
        rule_v7: policyRule.rule_v7 || null,
        is_active:
          policyRule.is_active !== undefined ? policyRule.is_active : true,
      });

      return reply.code(201).send(
        success(
          {
            policyRule: newRule,
          },
          "Policy rule created successfully"
        )
      );
    } catch (err) {
      request.log.error(err);
      return reply
        .code(500)
        .send(error(`Failed to create policy rule: ${err.message}`));
    }
  });

  fastify.post(
    "/policy/definition/rule/:id/bulk-create",
    async (request, reply) => {
      try {
        const policy_definition_id = request.params.id;
        const { rules, policy_text } = request.body;

        // Check if policy definition exists
        const policyDefinition =
          await PolicyDefinition.findByPk(policy_definition_id);
        if (!policyDefinition) {
          return reply.code(404).send(error("Policy definition not found"));
        }

        let rulesToCreate = [];

        if (policy_text) {
          // Parse policy text
          rulesToCreate = parsePolicyText(policy_text).map((rule) => ({
            ...rule,
            policy_definition_id,
            is_active: true,
          }));
        } else if (Array.isArray(rules) && rules.length > 0) {
          // Use provided rules array and ensure name is not null
          rulesToCreate = rules.map((rule) => {
            // Create a unique name for each rule
            const name = [
              rule.rule_v0 || "",
              rule.rule_v1 || "",
              rule.rule_v2 || "",
              rule.rule_v3 || "",
              rule.rule_v4 || "",
              rule.rule_v5 || "",
              uuidv4(),
            ].join(",");

            return {
              ...rule,
              name,
              policy_definition_id,
              is_active: rule.is_active !== undefined ? rule.is_active : true,
            };
          });
        } else {
          return reply.code(400).send(error("No valid rules provided"));
        }

        if (rulesToCreate.length === 0) {
          return reply.code(400).send(error("No valid rules found to create"));
        }

        // Create rules in database
        const createdRules = await PolicyRule.bulkCreate(rulesToCreate);

        return reply.code(201).send(
          success(
            {
              policyRules: createdRules,
              count: createdRules.length,
            },
            `${createdRules.length} policy rules created successfully`
          )
        );
      } catch (err) {
        request.log.error(err);
        return reply
          .code(500)
          .send(error(`Failed to create policy rules: ${err.message}`));
      }
    }
  );

  fastify.post("/policy/rule/:id/update", async (request, reply) => {
    try {
      const { id } = request.params;
      const { policyRule } = request.body;

      if (!policyRule) {
        return reply
          .code(400)
          .send(error("Missing policyRule in request body"));
      }

      const existingRule = await PolicyRule.findByPk(id);

      if (!existingRule) {
        return reply.code(404).send(error("Policy rule not found"));
      }

      // Update rule
      await existingRule.update({
        permission_type:
          policyRule.permission_type || existingRule.permission_type,
        rule_v0:
          policyRule.rule_v0 !== undefined
            ? policyRule.rule_v0
            : existingRule.rule_v0,
        rule_v1:
          policyRule.rule_v1 !== undefined
            ? policyRule.rule_v1
            : existingRule.rule_v1,
        rule_v2:
          policyRule.rule_v2 !== undefined
            ? policyRule.rule_v2
            : existingRule.rule_v2,
        rule_v3:
          policyRule.rule_v3 !== undefined
            ? policyRule.rule_v3
            : existingRule.rule_v3,
        rule_v4:
          policyRule.rule_v4 !== undefined
            ? policyRule.rule_v4
            : existingRule.rule_v4,
        rule_v5:
          policyRule.rule_v5 !== undefined
            ? policyRule.rule_v5
            : existingRule.rule_v5,
        rule_v6:
          policyRule.rule_v6 !== undefined
            ? policyRule.rule_v6
            : existingRule.rule_v6,
        rule_v7:
          policyRule.rule_v7 !== undefined
            ? policyRule.rule_v7
            : existingRule.rule_v7,
        is_active:
          policyRule.is_active !== undefined
            ? policyRule.is_active
            : existingRule.is_active,
      });

      // Update the name field with new values
      await existingRule.update({
        name: [
          existingRule.rule_v0 || "",
          existingRule.rule_v1 || "",
          existingRule.rule_v2 || "",
          existingRule.rule_v3 || "",
          existingRule.rule_v4 || "",
          existingRule.rule_v5 || "",
          uuidv4(), // Generate new UUID part for uniqueness
        ].join(","),
      });

      return success(
        {
          policyRule: existingRule,
        },
        "Policy rule updated successfully"
      );
    } catch (err) {
      request.log.error(err);
      return reply
        .code(500)
        .send(error(`Failed to update policy rule: ${err.message}`));
    }
  });

  fastify.post("/policy/rule/:id/delete", async (request, reply) => {
    try {
      const { id } = request.params;
      const existingRule = await PolicyRule.findByPk(id);

      if (!existingRule) {
        return reply.code(404).send(error("Policy rule not found"));
      }

      await existingRule.destroy();

      return success(null, "Policy rule deleted successfully");
    } catch (err) {
      request.log.error(err);
      return reply
        .code(500)
        .send(error(`Failed to delete policy rule: ${err.message}`));
    }
  });

  fastify.post("/policy/rule/:id/disable", async (request, reply) => {
    try {
      const { id } = request.params;
      const existingRule = await PolicyRule.findByPk(id);

      if (!existingRule) {
        return reply.code(404).send(error("Policy rule not found"));
      }

      await existingRule.update({ is_active: false });

      return success(
        {
          policyRule: existingRule,
        },
        "Policy rule disabled successfully"
      );
    } catch (err) {
      request.log.error(err);
      return reply
        .code(500)
        .send(error(`Failed to disable policy rule: ${err.message}`));
    }
  });

  fastify.post("/policy/rule/test", async (request, reply) => {
    try {
      const { policyDefinitionId, subjectAttributes, domain, object, action } =
        request.body;

      if (!policyDefinitionId) {
        return reply.code(400).send(error("policyDefinitionId is required"));
      }

      // Get policy definition
      const policyDefinition =
        await PolicyDefinition.findByPk(policyDefinitionId);

      if (!policyDefinition) {
        return reply.code(404).send(error("Policy definition not found"));
      }

      // Get active policy rules
      const policyRules = await PolicyRule.findAll({
        where: {
          policy_definition_id: policyDefinitionId,
          is_active: true,
        },
      });

      // Create Casbin model text
      const policyDefinitionTextModel = `
[request_definition]
r = ${policyDefinition.request_definition}  

[policy_definition]
p = ${policyDefinition.policy_definition} 

[role_definition]
g = ${policyDefinition.role_definition} 

[policy_effect]
e = ${policyDefinition.policy_effect} 

[matchers]
m = ${policyDefinition.matchers} 
      `;

      // Create Casbin policy rules text
      const policyDefinitionTextRules = convertPolicyRuleToModel(policyRules);

      // Create Casbin enforcer
      const policyDefinitionModel = newModelFromString(
        policyDefinitionTextModel
      );
      const adapter = new StringAdapter(policyDefinitionTextRules);
      const enforcer = await newEnforcer(policyDefinitionModel, adapter);

      // Add helper function
      enforcer.addFunction("matchKeyword", (key1, key2) => {
        return key1 === key2 || key2 === "*";
      });

      // Check permission
      const allowed = await enforcer.enforce(
        subjectAttributes,
        domain,
        object,
        action
      );

      return {
        success: true,
        subjectAttributes,
        domain,
        object,
        action,
        policyDefinitionTextModel,
        policyDefinitionTextRules,
        allowed,
      };
    } catch (err) {
      request.log.error(err);
      return reply
        .code(500)
        .send(error(`Failed to test policy: ${err.message}`));
    }
  });

  fastify.log.info("Access control management plugin initialized successfully");
}
