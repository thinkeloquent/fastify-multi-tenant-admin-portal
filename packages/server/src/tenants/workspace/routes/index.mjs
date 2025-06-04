// main.mjs - Fastify plugin for workspace management

import fp from "fastify-plugin";
import { DataTypes, Op } from "sequelize";

async function workspacePlugin(fastify, options) {
  const sequelize = fastify.db;

  // Define models
  const WorkspaceNode = sequelize.define(
    "WorkspaceNode",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      node_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: /^[a-zA-Z0-9_\s-]+$/, // Allow alphanumeric, underscore, space, and dash
        },
      },
      description: {
        type: DataTypes.TEXT,
      },
      visual_metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      functional_metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      tableName: "workspace_nodes",
      timestamps: true,
      schema: "public",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  const WorkspaceEdge = sequelize.define(
    "WorkspaceEdge",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      source_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: WorkspaceNode,
          key: "id",
        },
      },
      target_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: WorkspaceNode,
          key: "id",
        },
      },
      edge_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: /^[a-zA-Z0-9_\s-]+$/, // Allow alphanumeric, underscore, space, and dash
        },
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      tableName: "workspace_edges",
      timestamps: true,
      schema: "public",
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["source_id", "target_id", "edge_type"],
        },
      ],
    }
  );

  // New model for namespaces
  const WorkspaceNamespace = sequelize.define(
    "WorkspaceNamespace",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true, // Using SERIAL via autoIncrement
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: /^[a-zA-Z0-9_\s-:]+$/, // Allow alphanumeric, underscore, space, dash, and colon
        },
      },
      display_name: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.TEXT,
      },
      source_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: WorkspaceNode,
          key: "id",
        },
      },
      target_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: WorkspaceNode,
          key: "id",
        },
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      separator: {
        type: DataTypes.STRING,
        defaultValue: ".",
      },
    },
    {
      tableName: "workspace_namespaces",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Join table for namespace to nodes (many-to-many)
  const NamespaceNode = sequelize.define(
    "NamespaceNode",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      namespace_id: {
        type: DataTypes.INTEGER, // Changed to INTEGER to match WorkspaceNamespace id
        allowNull: false,
        references: {
          model: WorkspaceNamespace,
          key: "id",
        },
      },
      node_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: WorkspaceNode,
          key: "id",
        },
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "workspace_namespace_nodes",
      timestamps: true,
      schema: "public",
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["namespace_id", "node_id"],
        },
      ],
    }
  );

  // Define relationships
  WorkspaceNode.hasMany(WorkspaceEdge, {
    foreignKey: "source_id",
    as: "outgoing_edges",
  });
  WorkspaceNode.hasMany(WorkspaceEdge, {
    foreignKey: "target_id",
    as: "incoming_edges",
  });
  WorkspaceEdge.belongsTo(WorkspaceNode, {
    foreignKey: "source_id",
    as: "source_node",
  });
  WorkspaceEdge.belongsTo(WorkspaceNode, {
    foreignKey: "target_id",
    as: "target_node",
  });

  // Namespace relationships
  WorkspaceNamespace.belongsTo(WorkspaceNode, {
    foreignKey: "source_id",
    as: "source_node",
  });
  WorkspaceNamespace.belongsTo(WorkspaceNode, {
    foreignKey: "target_id",
    as: "target_node",
  });
  WorkspaceNode.hasMany(WorkspaceNamespace, {
    foreignKey: "source_id",
    as: "source_namespaces",
  });
  WorkspaceNode.hasMany(WorkspaceNamespace, {
    foreignKey: "target_id",
    as: "target_namespaces",
  });

  WorkspaceNamespace.belongsToMany(WorkspaceNode, {
    through: NamespaceNode,
    foreignKey: "namespace_id",
    otherKey: "node_id",
    as: "nodes",
  });

  WorkspaceNode.belongsToMany(WorkspaceNamespace, {
    through: NamespaceNode,
    foreignKey: "node_id",
    otherKey: "namespace_id",
    as: "namespace_memberships",
  });

  // Sync models with database - FIXED ORDER
  await sequelize.models.WorkspaceNode.sync({ force: true });
  await sequelize.models.WorkspaceEdge.sync({ force: true });
  await sequelize.models.WorkspaceNamespace.sync({ force: true });
  await sequelize.models.NamespaceNode.sync({ force: true });

  // Register models with fastify instance
  fastify.decorate("WorkspaceNode", WorkspaceNode);
  fastify.decorate("WorkspaceEdge", WorkspaceEdge);
  fastify.decorate("WorkspaceNamespace", WorkspaceNamespace);
  fastify.decorate("NamespaceNode", NamespaceNode);

  // Helper functions
  async function findShortestPath(sourceId, targetId) {
    // Use breadth-first search to find the shortest path
    let visited = new Set();
    let queue = [
      {
        id: sourceId,
        path: [sourceId],
      },
    ];

    while (queue.length > 0) {
      let { id, path } = queue.shift();

      if (id === targetId) {
        // Found the target, return the path
        const nodes = await WorkspaceNode.findAll({
          where: { id: { [Op.in]: path } },
          attributes: ["id", "name", "node_type", "description"],
        });

        // Create a map of id -> node
        const nodeMap = {};
        nodes.forEach((node) => {
          nodeMap[node.id] = node;
        });

        // Return nodes in path order
        return path.map((id) => nodeMap[id]);
      }

      if (!visited.has(id)) {
        visited.add(id);

        // Get all outgoing edges
        const edges = await WorkspaceEdge.findAll({
          where: { source_id: id },
        });

        for (const edge of edges) {
          if (!visited.has(edge.target_id)) {
            queue.push({
              id: edge.target_id,
              path: [...path, edge.target_id],
            });
          }
        }
      }
    }

    // No path found
    return null;
  }

  // Define routes
  // Node routes
  fastify.get("/nodes", async (request, reply) => {
    const { type } = request.query;
    let filter = {};
    if (type) {
      filter.node_type = type;
    }

    const nodes = await WorkspaceNode.findAll({
      where: filter,
    });

    return nodes;
  });

  fastify.get("/nodes/:id", async (request, reply) => {
    const node = await WorkspaceNode.findByPk(request.params.id);
    if (!node) {
      reply.code(404).send({ error: "Node not found" });
      return;
    }
    return node;
  });

  fastify.post("/nodes", async (request, reply) => {
    const {
      node_type,
      name,
      description,
      visual_metadata,
      functional_metadata,
    } = request.body;

    if (!node_type) {
      reply.code(400).send({ error: "node_type is required" });
      return;
    }

    if (!name) {
      reply.code(400).send({ error: "name is required" });
      return;
    }

    // Validate name format
    if (!/^[a-zA-Z0-9_\s-]+$/.test(name)) {
      reply.code(400).send({
        error:
          "name can only contain alphanumeric characters, underscores, spaces, and dashes",
      });
      return;
    }

    try {
      const node = await WorkspaceNode.create({
        node_type,
        name,
        description,
        visual_metadata,
        functional_metadata,
      });

      reply.code(201).send(node);
    } catch (error) {
      console.error("Error creating node:", error);
      reply.code(400).send({ error: error.message || "Failed to create node" });
    }
  });

  fastify.put("/nodes/:id", async (request, reply) => {
    const node = await WorkspaceNode.findByPk(request.params.id);
    if (!node) {
      reply.code(404).send({ error: "Node not found" });
      return;
    }

    const {
      node_type,
      name,
      description,
      visual_metadata,
      functional_metadata,
    } = request.body;

    // Validate name format if provided
    if (name && !/^[a-zA-Z0-9_\s-]+$/.test(name)) {
      reply.code(400).send({
        error:
          "name can only contain alphanumeric characters, underscores, spaces, and dashes",
      });
      return;
    }

    try {
      await node.update({
        node_type: node_type || node.node_type,
        name: name !== undefined ? name : node.name,
        description: description !== undefined ? description : node.description,
        visual_metadata: visual_metadata || node.visual_metadata,
        functional_metadata: functional_metadata || node.functional_metadata,
      });

      return node;
    } catch (error) {
      console.error("Error updating node:", error);
      reply.code(400).send({ error: error.message || "Failed to update node" });
    }
  });

  fastify.delete("/nodes/:id", async (request, reply) => {
    const node = await WorkspaceNode.findByPk(request.params.id);
    if (!node) {
      reply.code(404).send({ error: "Node not found" });
      return;
    }

    await node.destroy();

    return { success: true };
  });

  // Edge routes
  fastify.get("/edges", async (request, reply) => {
    const { source_id, target_id, edge_type } = request.query;
    let filter = {};

    if (source_id) filter.source_id = source_id;
    if (target_id) filter.target_id = target_id;
    if (edge_type) filter.edge_type = edge_type;

    const edges = await WorkspaceEdge.findAll({
      where: filter,
      include: [
        { model: WorkspaceNode, as: "source_node" },
        { model: WorkspaceNode, as: "target_node" },
      ],
    });

    return edges;
  });

  fastify.get("/edges/:id", async (request, reply) => {
    const edge = await WorkspaceEdge.findByPk(request.params.id, {
      include: [
        { model: WorkspaceNode, as: "source_node" },
        { model: WorkspaceNode, as: "target_node" },
      ],
    });

    if (!edge) {
      reply.code(404).send({ error: "Edge not found" });
      return;
    }

    return edge;
  });

  fastify.post("/edges", async (request, reply) => {
    const { source_id, target_id, edge_type, metadata } = request.body;

    if (!source_id || !target_id || !edge_type) {
      reply
        .code(400)
        .send({ error: "source_id, target_id, and edge_type are required" });
      return;
    }

    // Validate edge_type format
    if (!/^[a-zA-Z0-9_\s-]+$/.test(edge_type)) {
      reply.code(400).send({
        error:
          "edge_type can only contain alphanumeric characters, underscores, spaces, and dashes",
      });
      return;
    }

    // Check if nodes exist
    const sourceNode = await WorkspaceNode.findByPk(source_id);
    const targetNode = await WorkspaceNode.findByPk(target_id);

    if (!sourceNode || !targetNode) {
      reply.code(400).send({ error: "Source or target node does not exist" });
      return;
    }

    try {
      const edge = await WorkspaceEdge.create({
        source_id,
        target_id,
        edge_type,
        metadata,
      });

      reply.code(201).send(edge);
    } catch (error) {
      // Handle unique constraint violation
      if (error.name === "SequelizeUniqueConstraintError") {
        reply.code(409).send({
          error: "Edge already exists between these nodes with this type",
        });
        return;
      }
      console.error("Error creating edge:", error);
      reply.code(400).send({ error: error.message || "Failed to create edge" });
    }
  });

  fastify.put("/edges/:id", async (request, reply) => {
    const edge = await WorkspaceEdge.findByPk(request.params.id);
    if (!edge) {
      reply.code(404).send({ error: "Edge not found" });
      return;
    }

    const { edge_type, metadata } = request.body;

    // Validate edge_type format if provided
    if (edge_type && !/^[a-zA-Z0-9_\s-]+$/.test(edge_type)) {
      reply.code(400).send({
        error:
          "edge_type can only contain alphanumeric characters, underscores, spaces, and dashes",
      });
      return;
    }

    try {
      await edge.update({
        edge_type: edge_type || edge.edge_type,
        metadata: metadata || edge.metadata,
      });

      return edge;
    } catch (error) {
      console.error("Error updating edge:", error);
      reply.code(400).send({ error: error.message || "Failed to update edge" });
    }
  });

  fastify.delete("/edges/:id", async (request, reply) => {
    const edge = await WorkspaceEdge.findByPk(request.params.id);
    if (!edge) {
      reply.code(404).send({ error: "Edge not found" });
      return;
    }

    await edge.destroy();

    return { success: true };
  });

  // Namespace routes
  fastify.get("/namespaces", async (request, reply) => {
    const namespaces = await WorkspaceNamespace.findAll({
      include: [
        { model: WorkspaceNode, as: "source_node" },
        { model: WorkspaceNode, as: "target_node" },
        { model: WorkspaceNode, as: "nodes" },
      ],
    });

    return namespaces;
  });

  fastify.get("/namespaces/:id", async (request, reply) => {
    const namespace = await WorkspaceNamespace.findByPk(request.params.id, {
      include: [
        { model: WorkspaceNode, as: "source_node" },
        { model: WorkspaceNode, as: "target_node" },
        { model: WorkspaceNode, as: "nodes" },
      ],
    });

    if (!namespace) {
      reply.code(404).send({ error: "Namespace not found" });
      return;
    }

    return namespace;
  });

  fastify.post("/namespaces", async (request, reply) => {
    const { display_name, description, source_id, target_id, node_ids } =
      request.body;

    if (!source_id || !target_id) {
      reply.code(400).send({ error: "source_id and target_id are required" });
      return;
    }

    if (!Array.isArray(node_ids) || node_ids.length === 0) {
      reply.code(400).send({ error: "At least one node_id is required" });
      return;
    }

    // Check if source and target nodes exist
    const sourceNode = await WorkspaceNode.findByPk(source_id);
    const targetNode = await WorkspaceNode.findByPk(target_id);

    if (!sourceNode || !targetNode) {
      reply.code(400).send({ error: "Source or target node does not exist" });
      return;
    }

    // Find the path between source and target
    const pathNodes = await findShortestPath(source_id, target_id);

    if (!pathNodes) {
      reply.code(400).send({
        error:
          "No path found between source and target nodes. Make sure they are connected in the graph.",
      });
      return;
    }

    // Validate that all selected nodes are in the path
    const pathNodeIds = pathNodes.map((node) => node.id);
    for (const nodeId of node_ids) {
      if (!pathNodeIds.includes(nodeId)) {
        reply.code(400).send({
          error: `Node ${nodeId} is not in the path between source and target nodes`,
        });
        return;
      }
    }

    // Check if all selected nodes exist
    const selectedNodes = await WorkspaceNode.findAll({
      where: {
        id: {
          [Op.in]: node_ids,
        },
      },
    });

    if (selectedNodes.length !== node_ids.length) {
      reply
        .code(400)
        .send({ error: "One or more selected nodes do not exist" });
      return;
    }

    // Generate the namespace name and value by concatenating node names
    const nodeMap = {};
    selectedNodes.forEach((node) => {
      nodeMap[node.id] = node;
    });

    // Sort nodes according to path order
    const sortedNodeIds = node_ids.sort((a, b) => {
      const aIndex = pathNodeIds.indexOf(a);
      const bIndex = pathNodeIds.indexOf(b);
      return aIndex - bIndex;
    });

    // Create name using :: separator
    const namespaceName = sortedNodeIds
      .map(
        (id) =>
          nodeMap[id]?.name?.toLowerCase() || `unnamed_${id.substring(0, 8)}`
      )
      .join("::");

    // Create value using . separator (or custom separator)
    const namespaceValue = sortedNodeIds
      .map((id) => nodeMap[id]?.name || `unnamed_${id.substring(0, 8)}`)
      .join(".");

    // Check if namespace value is unique
    const existingNamespace = await WorkspaceNamespace.findOne({
      where: { value: namespaceValue },
    });

    if (existingNamespace) {
      reply
        .code(409)
        .send({ error: "A namespace with this value already exists" });
      return;
    }

    const transaction = await sequelize.transaction();

    try {
      // Create the namespace
      const namespace = await WorkspaceNamespace.create(
        {
          name: namespaceName,
          display_name: display_name || namespaceName,
          description,
          source_id,
          target_id,
          value: namespaceValue,
          separator: ".",
        },
        { transaction }
      );

      // Create the node associations with order
      const namespaceNodes = [];
      for (let i = 0; i < sortedNodeIds.length; i++) {
        namespaceNodes.push({
          namespace_id: namespace.id,
          node_id: sortedNodeIds[i],
          order: i,
        });
      }

      await NamespaceNode.bulkCreate(namespaceNodes, { transaction });

      await transaction.commit();

      // Return the created namespace with associated nodes
      const result = await WorkspaceNamespace.findByPk(namespace.id, {
        include: [
          { model: WorkspaceNode, as: "source_node" },
          { model: WorkspaceNode, as: "target_node" },
          { model: WorkspaceNode, as: "nodes" },
        ],
      });

      reply.code(201).send(result);
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating namespace:", error);
      reply
        .code(500)
        .send({ error: error.message || "Failed to create namespace" });
    }
  });

  fastify.delete("/namespaces/:id", async (request, reply) => {
    const namespace = await WorkspaceNamespace.findByPk(request.params.id);
    if (!namespace) {
      reply.code(404).send({ error: "Namespace not found" });
      return;
    }

    await namespace.destroy();

    return { success: true };
  });

  // Specialized routes
  // Get children of a node
  fastify.get("/nodes/:id/children", async (request, reply) => {
    const { edge_type } = request.query;
    let filter = { source_id: request.params.id };

    if (edge_type) {
      filter.edge_type = edge_type;
    }

    const edges = await WorkspaceEdge.findAll({
      where: filter,
      include: [{ model: WorkspaceNode, as: "target_node" }],
    });

    const children = edges.map((edge) => edge.target_node);
    return children;
  });

  // Get parents of a node
  fastify.get("/nodes/:id/parents", async (request, reply) => {
    const { edge_type } = request.query;
    let filter = { target_id: request.params.id };

    if (edge_type) {
      filter.edge_type = edge_type;
    }

    const edges = await WorkspaceEdge.findAll({
      where: filter,
      include: [{ model: WorkspaceNode, as: "source_node" }],
    });

    const parents = edges.map((edge) => edge.source_node);
    return parents;
  });

  // Get full descendants tree (via raw SQL query for recursion)
  fastify.get("/nodes/:id/descendants", async (request, reply) => {
    const nodeId = request.params.id;
    const edgeType = request.query.edge_type || "contains";

    const [results] = await sequelize.query(
      `
      WITH RECURSIVE node_hierarchy AS (
        SELECT id, node_type, name, description, visual_metadata, functional_metadata, 0 as level
        FROM workspace_nodes
        WHERE id = :nodeId
        
        UNION ALL
        
        SELECT wn.id, wn.node_type, wn.name, wn.description, wn.visual_metadata, wn.functional_metadata, nh.level + 1
        FROM workspace_nodes wn
        JOIN workspace_edges we ON wn.id = we.target_id
        JOIN node_hierarchy nh ON we.source_id = nh.id
        WHERE we.edge_type = :edgeType
      )
      SELECT * FROM node_hierarchy ORDER BY level;
    `,
      {
        replacements: { nodeId, edgeType },
      }
    );

    return results;
  });

  // Find path between two nodes
  fastify.get("/path", async (request, reply) => {
    const { source_id, target_id } = request.query;

    if (!source_id || !target_id) {
      reply.code(400).send({ error: "source_id and target_id are required" });
      return;
    }

    const path = await findShortestPath(source_id, target_id);

    if (!path) {
      reply
        .code(404)
        .send({ error: "No path found between the source and target nodes" });
      return;
    }

    return path;
  });
}

export default workspacePlugin;
export { workspacePlugin };
