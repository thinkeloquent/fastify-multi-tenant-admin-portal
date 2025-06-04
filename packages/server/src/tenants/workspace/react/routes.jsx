import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
  Link,
} from "react-router-dom";
import Select from "react-select";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Snackbar,
  Toolbar,
  AppBar,
  Alert,
  Checkbox,
  List,
  ListItem,
  Container,
} from "@mui/material";
import {
  Plus,
  Trash2,
  Edit,
  Layers,
  LinkIcon,
  RefreshCw,
  X,
  FolderTree,
  Database,
  Tag,
  Check,
} from "lucide-react";
import * as lucide from "lucide-react";

// Node type options - Updated with all required types
const NODE_TYPES = [
  { value: "organization", label: "Organization" },
  { value: "project", label: "Project" },
  { value: "application", label: "Application" },
  { value: "web_page", label: "Web Page" },
  { value: "form_page", label: "Form Page" },
  { value: "data_source", label: "Data Source" },
  { value: "api_endpoint", label: "API Endpoint" },
];

// Edge type options
const EDGE_TYPES = [
  { value: "contains", label: "Contains" },
  { value: "links_to", label: "Links To" },
  { value: "submits_to", label: "Submits To" },
  { value: "references", label: "References" },
];

const customSelectStyles = {
  // Style for the dropdown menu container
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#f0f8ff", // Light blue background
    zIndex: 9999, // Set a high z-index to ensure the dropdown appears above other elements
  }),

  // Style for each option in the dropdown
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#007bff" // Blue background for selected option
      : state.isFocused
        ? "#cce5ff" // Light blue for hovered/focused option
        : "#f0f8ff", // Default background for other options
    color: state.isSelected ? "white" : "black",
  }),

  // Style for the control/input box
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "white",
    borderColor: state.isFocused ? "#007bff" : "#ced4da",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(0, 123, 255, 0.25)" : null,
  }),

  // You can also set z-index for the dropdown container
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
};

// Base API URL
const API_URL = "http://127.0.0.1:3001/workspace";

// Helper function for extended alphanumeric validation (includes spaces and dashes)
const isExtendedAlphanumeric = (str) => {
  return /^[a-zA-Z0-9_\s-]+$/.test(str);
};

function WorkspaceManager() {
  // State management
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [namespaceDialogOpen, setNamespaceDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [viewMode, setViewMode] = useState("nodes"); // 'nodes', 'edges', 'hierarchy', 'namespace'
  const [hierarchyRoot, setHierarchyRoot] = useState(null);
  const [hierarchyData, setHierarchyData] = useState([]);
  const [pathNodes, setPathNodes] = useState([]);
  const [selectedNamespaceNodes, setSelectedNamespaceNodes] = useState([]);
  const [generatedNamespaceValue, setGeneratedNamespaceValue] = useState("");
  const [generatedNamespaceName, setGeneratedNamespaceName] = useState("");

  // Form setup for nodes
  const nodeForm = useForm({
    defaultValues: {
      node_type: null,
      name: "",
      description: "",
      visual_metadata: {
        color: "#3f51b5",
        icon: "default",
        position: { x: 0, y: 0 },
      },
      functional_metadata: {},
    },
  });

  // Form setup for edges
  const edgeForm = useForm({
    defaultValues: {
      source_id: null,
      target_id: null,
      edge_type: null,
      metadata: {},
    },
  });

  // Form setup for namespaces
  const namespaceForm = useForm({
    defaultValues: {
      display_name: "",
      description: "",
      source_id: null,
      target_id: null,
    },
  });

  // API Calls
  const fetchNodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/nodes`);
      if (!response.ok) throw new Error("Failed to fetch nodes");
      const data = await response.json();
      setNodes(data);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      setAlertInfo({
        open: true,
        message: "Failed to load workspace nodes",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEdges = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/edges`);
      if (!response.ok) throw new Error("Failed to fetch edges");
      const data = await response.json();
      setEdges(data);
    } catch (error) {
      console.error("Error fetching edges:", error);
      setAlertInfo({
        open: true,
        message: "Failed to load workspace edges",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNamespaces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/namespaces`);
      if (!response.ok) throw new Error("Failed to fetch namespaces");
      const data = await response.json();
      setNamespaces(data);
    } catch (error) {
      console.error("Error fetching namespaces:", error);
      setAlertInfo({
        open: true,
        message: "Failed to load namespaces",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHierarchy = useCallback(async (nodeId) => {
    if (!nodeId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/nodes/${nodeId}/descendants`);
      if (!response.ok) throw new Error("Failed to fetch hierarchy");
      const data = await response.json();
      setHierarchyData(data);
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
      setAlertInfo({
        open: true,
        message: "Failed to load hierarchy data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPath = useCallback(async (sourceId, targetId) => {
    if (!sourceId || !targetId) {
      setPathNodes([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/path?source_id=${sourceId}&target_id=${targetId}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch path");
      }
      const data = await response.json();
      setPathNodes(data);
      // Auto-select all nodes in the path
      setSelectedNamespaceNodes(data.map((node) => node.id));
    } catch (error) {
      console.error("Error fetching path:", error);
      setAlertInfo({
        open: true,
        message:
          error.message || "Failed to find a path between the selected nodes",
        severity: "error",
      });
      setPathNodes([]);
      setSelectedNamespaceNodes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNode = async (data) => {
    if (!isExtendedAlphanumeric(data.name)) {
      setAlertInfo({
        open: true,
        message:
          "Node name can only contain alphanumeric characters, underscores, spaces, and dashes",
        severity: "error",
      });
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/nodes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create node");
      }

      await fetchNodes();
      setAlertInfo({
        open: true,
        message: "Node created successfully",
        severity: "success",
      });
      return true;
    } catch (error) {
      console.error("Error creating node:", error);
      setAlertInfo({
        open: true,
        message: error.message || "Failed to create node",
        severity: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateNode = async (id, data) => {
    if (!isExtendedAlphanumeric(data.name)) {
      setAlertInfo({
        open: true,
        message:
          "Node name can only contain alphanumeric characters, underscores, spaces, and dashes",
        severity: "error",
      });
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/nodes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update node");
      }

      await fetchNodes();
      setAlertInfo({
        open: true,
        message: "Node updated successfully",
        severity: "success",
      });
      return true;
    } catch (error) {
      console.error("Error updating node:", error);
      setAlertInfo({
        open: true,
        message: error.message || "Failed to update node",
        severity: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteNode = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this node? This will also delete all associated edges."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/nodes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete node");

      await fetchNodes();
      await fetchEdges();
      setAlertInfo({
        open: true,
        message: "Node deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting node:", error);
      setAlertInfo({
        open: true,
        message: "Failed to delete node",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEdge = async (data) => {
    if (!isExtendedAlphanumeric(data.edge_type)) {
      setAlertInfo({
        open: true,
        message:
          "Edge type can only contain alphanumeric characters, underscores, spaces, and dashes",
        severity: "error",
      });
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/edges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create edge");
      }

      await fetchEdges();
      setAlertInfo({
        open: true,
        message: "Edge created successfully",
        severity: "success",
      });
      return true;
    } catch (error) {
      console.error("Error creating edge:", error);
      setAlertInfo({
        open: true,
        message: error.message || "Failed to create edge",
        severity: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteEdge = async (id) => {
    if (!window.confirm("Are you sure you want to delete this edge?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/edges/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete edge");

      await fetchEdges();
      setAlertInfo({
        open: true,
        message: "Edge deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting edge:", error);
      setAlertInfo({
        open: true,
        message: "Failed to delete edge",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNamespace = async (data) => {
    if (selectedNamespaceNodes.length === 0) {
      setAlertInfo({
        open: true,
        message: "Please select at least one node to include in the namespace",
        severity: "warning",
      });
      return false;
    }

    if (!data.source_id || !data.target_id) {
      setAlertInfo({
        open: true,
        message: "Source and target nodes are required",
        severity: "warning",
      });
      return false;
    }

    // Transform the data for API - don't include name or separator
    const namespaceData = {
      display_name: data.display_name,
      description: data.description,
      source_id: data.source_id.value,
      target_id: data.target_id.value,
      node_ids: selectedNamespaceNodes,
    };

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/namespaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(namespaceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create namespace");
      }

      await fetchNamespaces();
      setAlertInfo({
        open: true,
        message: "Namespace created successfully",
        severity: "success",
      });
      return true;
    } catch (error) {
      console.error("Error creating namespace:", error);
      setAlertInfo({
        open: true,
        message: error.message || "Failed to create namespace",
        severity: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteNamespace = async (id) => {
    if (!window.confirm("Are you sure you want to delete this namespace?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/namespaces/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete namespace");

      await fetchNamespaces();
      setAlertInfo({
        open: true,
        message: "Namespace deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting namespace:", error);
      setAlertInfo({
        open: true,
        message: "Failed to delete namespace",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate namespace value based on selected nodes
  const updateNamespaceValue = useCallback(() => {
    if (selectedNamespaceNodes.length === 0) {
      setGeneratedNamespaceValue("");
      setGeneratedNamespaceName("");
      return;
    }

    const nodeMap = {};

    // Create a map of node ID to node
    pathNodes.forEach((node) => {
      nodeMap[node.id] = node;
    });

    // Get the path order
    const pathOrder = pathNodes.map((node) => node.id);

    // Sort selected nodes according to the path order
    const sortedSelectedNodes = [...selectedNamespaceNodes]
      .sort((a, b) => {
        const aIndex = pathOrder.indexOf(a);
        const bIndex = pathOrder.indexOf(b);
        return aIndex - bIndex;
      })
      .map((id) => nodeMap[id])
      .filter((node) => !!node);

    // Create value with . separator
    const dotValueParts = sortedSelectedNodes.map(
      (node) => node.name || `unnamed_${node.id.substring(0, 8)}`
    );
    setGeneratedNamespaceValue(dotValueParts.join("."));

    // Create name with :: separator
    const namespaceParts = sortedSelectedNodes.map(
      (node) => node.name?.toLowerCase() || `unnamed_${node.id.substring(0, 8)}`
    );
    setGeneratedNamespaceName(namespaceParts.join("::"));
  }, [selectedNamespaceNodes, pathNodes]);

  // Effect Hooks
  useEffect(() => {
    fetchNodes();
    fetchEdges();
    fetchNamespaces();
  }, [fetchNodes, fetchEdges, fetchNamespaces]);

  useEffect(() => {
    if (viewMode === "hierarchy" && hierarchyRoot) {
      fetchHierarchy(hierarchyRoot);
    }
  }, [viewMode, hierarchyRoot, fetchHierarchy]);

  useEffect(() => {
    updateNamespaceValue();
  }, [selectedNamespaceNodes, updateNamespaceValue]);

  // Update namespace path when source or target changes
  useEffect(() => {
    const source_id = namespaceForm.watch("source_id")?.value;
    const target_id = namespaceForm.watch("target_id")?.value;

    if (source_id && target_id) {
      fetchPath(source_id, target_id);
    } else {
      setPathNodes([]);
      setSelectedNamespaceNodes([]);
    }
  }, [
    namespaceForm.watch("source_id"),
    namespaceForm.watch("target_id"),
    fetchPath,
  ]);

  // Dialog Handlers
  const handleOpenNodeDialog = (node = null) => {
    if (node) {
      // Edit mode - set form values from node
      nodeForm.reset({
        node_type: NODE_TYPES.find((t) => t.value === node.node_type) || null,
        name: node.name || "",
        description: node.description || "",
        visual_metadata: node.visual_metadata || {},
        functional_metadata: node.functional_metadata || {},
      });
      setSelectedNode(node);
    } else {
      // Create mode - reset form
      nodeForm.reset({
        node_type: null,
        name: "",
        description: "",
        visual_metadata: {
          color: "#3f51b5",
          icon: "default",
          position: { x: 0, y: 0 },
        },
        functional_metadata: {},
      });
      setSelectedNode(null);
    }
    setNodeDialogOpen(true);
  };

  const handleCloseNodeDialog = () => {
    setNodeDialogOpen(false);
  };

  const handleOpenEdgeDialog = () => {
    edgeForm.reset({
      source_id: null,
      target_id: null,
      edge_type: null,
      metadata: {},
    });
    setEdgeDialogOpen(true);
  };

  const handleCloseEdgeDialog = () => {
    setEdgeDialogOpen(false);
  };

  const handleOpenNamespaceDialog = () => {
    namespaceForm.reset({
      display_name: "",
      description: "",
      source_id: null,
      target_id: null,
    });
    setPathNodes([]);
    setSelectedNamespaceNodes([]);
    setGeneratedNamespaceValue("");
    setGeneratedNamespaceName("");
    setNamespaceDialogOpen(true);
  };

  const handleCloseNamespaceDialog = () => {
    setNamespaceDialogOpen(false);
  };

  // Form Submissions
  const handleNodeSubmit = async (data) => {
    // Transform the data for API
    const nodeData = {
      ...data,
      node_type: data.node_type.value,
      visual_metadata:
        typeof data.visual_metadata === "string"
          ? JSON.parse(data.visual_metadata)
          : data.visual_metadata,
      functional_metadata:
        typeof data.functional_metadata === "string"
          ? JSON.parse(data.functional_metadata)
          : data.functional_metadata,
    };

    let success;
    if (selectedNode) {
      // Update existing node
      success = await updateNode(selectedNode.id, nodeData);
    } else {
      // Create new node
      success = await createNode(nodeData);
    }

    if (success) {
      handleCloseNodeDialog();
    }
  };

  const handleEdgeSubmit = async (data) => {
    // Transform the data for API
    const edgeData = {
      source_id: data.source_id.value,
      target_id: data.target_id.value,
      edge_type: data.edge_type.value,
      metadata:
        typeof data.metadata === "string"
          ? JSON.parse(data.metadata)
          : data.metadata,
    };

    const success = await createEdge(edgeData);

    if (success) {
      handleCloseEdgeDialog();
    }
  };

  const handleNamespaceSubmit = async (data) => {
    if (selectedNamespaceNodes.length === 0) {
      setAlertInfo({
        open: true,
        message: "Please select at least one node to include in the namespace",
        severity: "warning",
      });
      return;
    }

    if (!data.source_id || !data.target_id) {
      setAlertInfo({
        open: true,
        message: "Source and target nodes are required",
        severity: "warning",
      });
      return;
    }

    const success = await createNamespace(data);

    if (success) {
      handleCloseNamespaceDialog();
    }
  };

  const handleCloseAlert = () => {
    setAlertInfo((prev) => ({ ...prev, open: false }));
  };

  const handleToggleNamespaceNode = (nodeId) => {
    setSelectedNamespaceNodes((prevSelected) => {
      if (prevSelected.includes(nodeId)) {
        return prevSelected.filter((id) => id !== nodeId);
      } else {
        return [...prevSelected, nodeId];
      }
    });
  };

  // Render helper functions
  const renderJSONEditor = (jsonValue, onChange) => {
    const stringValue =
      typeof jsonValue === "object"
        ? JSON.stringify(jsonValue, null, 2)
        : jsonValue || "{}";

    return (
      <TextField
        multiline
        rows={4}
        fullWidth
        value={stringValue}
        onChange={(e) => {
          try {
            const parsedValue = JSON.parse(e.target.value);
            onChange(parsedValue);
          } catch (error) {
            // Allow invalid JSON during editing
            onChange(e.target.value);
          }
        }}
        error={
          typeof jsonValue === "string" &&
          jsonValue !== "{}" &&
          jsonValue !== ""
        }
        helperText={
          typeof jsonValue === "string" &&
          jsonValue !== "{}" &&
          jsonValue !== ""
            ? "Invalid JSON"
            : ""
        }
      />
    );
  };

  const getNodeTypeChip = (nodeType) => {
    const colorMap = {
      organization: "primary",
      project: "secondary",
      application: "success",
      web_page: "info",
      form_page: "warning",
      data_source: "error",
      api_endpoint: "default",
    };

    return (
      <Chip
        label={nodeType}
        color={colorMap[nodeType] || "default"}
        size="small"
      />
    );
  };

  const getEdgeTypeChip = (edgeType) => {
    const colorMap = {
      contains: "primary",
      links_to: "success",
      submits_to: "secondary",
      references: "info",
    };

    return (
      <Chip
        label={edgeType}
        color={colorMap[edgeType] || "default"}
        size="small"
      />
    );
  };

  const renderNodeOptions = () => {
    return nodes.map((node) => ({
      value: node.id,
      label: `${node.name || "(Unnamed)"} (${node.node_type})`,
    }));
  };

  // Main render function
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", mb: 2 }}>
        <Button
          variant={viewMode === "nodes" ? "contained" : "outlined"}
          startIcon={<Database />}
          onClick={() => setViewMode("nodes")}
          sx={{ mr: 1 }}
        >
          Nodes
        </Button>
        <Button
          variant={viewMode === "edges" ? "contained" : "outlined"}
          startIcon={<LinkIcon />}
          onClick={() => setViewMode("edges")}
          sx={{ mr: 1 }}
        >
          Edges
        </Button>
        <Button
          variant={viewMode === "hierarchy" ? "contained" : "outlined"}
          startIcon={<FolderTree />}
          onClick={() => setViewMode("hierarchy")}
          sx={{ mr: 1 }}
        >
          Hierarchy
        </Button>
        <Button
          variant={viewMode === "namespace" ? "contained" : "outlined"}
          startIcon={<Tag />}
          onClick={() => setViewMode("namespace")}
          sx={{ mr: 1 }}
        >
          Assign Namespace
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      {viewMode === "nodes" && (
        <>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus />}
              onClick={() => handleOpenNodeDialog()}
            >
              Add Node
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : nodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No nodes found. Create your first node.
                    </TableCell>
                  </TableRow>
                ) : (
                  nodes.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell>{node.name || "(Unnamed)"}</TableCell>
                      <TableCell>{getNodeTypeChip(node.node_type)}</TableCell>
                      <TableCell>{node.description || "-"}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenNodeDialog(node)}
                        >
                          <Edit size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteNode(node.id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => {
                            setHierarchyRoot(node.id);
                            setViewMode("hierarchy");
                          }}
                        >
                          <Layers size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {viewMode === "edges" && (
        <>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus />}
              onClick={handleOpenEdgeDialog}
            >
              Add Edge
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Source</TableCell>
                  <TableCell>Relationship</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : edges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No edges found. Create your first edge.
                    </TableCell>
                  </TableRow>
                ) : (
                  edges.map((edge) => (
                    <TableRow key={edge.id}>
                      <TableCell>
                        {edge.source_node?.name || "(Unknown)"}
                        <Box component="div" sx={{ mt: 1 }}>
                          {getNodeTypeChip(
                            edge.source_node?.node_type || "unknown"
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{getEdgeTypeChip(edge.edge_type)}</TableCell>
                      <TableCell>
                        {edge.target_node?.name || "(Unknown)"}
                        <Box component="div" sx={{ mt: 1 }}>
                          {getNodeTypeChip(
                            edge.target_node?.node_type || "unknown"
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteEdge(edge.id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {viewMode === "hierarchy" && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hierarchy View
            </Typography>
            <Select
              styles={customSelectStyles}
              options={renderNodeOptions()}
              value={
                renderNodeOptions().find(
                  (opt) => opt.value === hierarchyRoot
                ) || null
              }
              onChange={(selected) => setHierarchyRoot(selected?.value)}
              placeholder="Select root node..."
              isClearable
            />
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : !hierarchyRoot ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              Please select a root node to view its hierarchy
            </Paper>
          ) : hierarchyData.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              No hierarchy data found for this node
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Level</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hierarchyData.map((node, index) => (
                    <TableRow key={index} hover sx={{ pl: node.level * 2 }}>
                      <TableCell>{node.level}</TableCell>
                      <TableCell>
                        <Box sx={{ ml: node.level * 2 }}>
                          {node.name || "(Unnamed)"}
                        </Box>
                      </TableCell>
                      <TableCell>{getNodeTypeChip(node.node_type)}</TableCell>
                      <TableCell>{node.description || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {viewMode === "namespace" && (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="h6">Namespaces</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus />}
              onClick={handleOpenNamespaceDialog}
            >
              Create Namespace
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : namespaces.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              No namespaces found. Create your first namespace.
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Display Name</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Source Node</TableCell>
                    <TableCell>Target Node</TableCell>
                    <TableCell>Node Count</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {namespaces.map((namespace) => (
                    <TableRow key={namespace.id}>
                      <TableCell>{namespace.name}</TableCell>
                      <TableCell>
                        {namespace.display_name || namespace.name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={namespace.value}
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {namespace.source_node?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {namespace.target_node?.name || "-"}
                      </TableCell>
                      <TableCell>{namespace.nodes?.length || 0}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteNamespace(namespace.id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Node Dialog */}
      <Dialog
        open={nodeDialogOpen}
        onClose={handleCloseNodeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedNode ? "Edit Node" : "Create Node"}
          <IconButton
            aria-label="close"
            onClick={handleCloseNodeDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <form onSubmit={nodeForm.handleSubmit(handleNodeSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item size={12} md={6}>
                <Controller
                  name="node_type"
                  control={nodeForm.control}
                  rules={{ required: "Node type is required" }}
                  render={({ field, fieldState }) => (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Node Type*
                      </Typography>
                      <Select
                        {...field}
                        styles={customSelectStyles}
                        options={NODE_TYPES}
                        placeholder="Select node type..."
                        isSearchable
                        isClearable
                        className={fieldState.error ? "is-invalid" : ""}
                      />
                      {fieldState.error && (
                        <Typography color="error" variant="caption">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              <Grid item size={12} md={6}>
                <Controller
                  name="name"
                  control={nodeForm.control}
                  rules={{
                    required: "Name is required",
                    pattern: {
                      value: /^[a-zA-Z0-9_\s-]+$/,
                      message:
                        "Name can only contain alphanumeric characters, underscores, spaces, and dashes",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Name*"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message ||
                        "Alphanumeric characters, underscores, spaces, and dashes only"
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item size={12}>
                <Controller
                  name="description"
                  control={nodeForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      multiline
                      rows={2}
                      margin="normal"
                    />
                  )}
                />
              </Grid>
              <Grid item size={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Visual Metadata
                </Typography>
                <Controller
                  name="visual_metadata"
                  control={nodeForm.control}
                  render={({ field: { value, onChange } }) =>
                    renderJSONEditor(value, onChange)
                  }
                />
              </Grid>
              <Grid item size={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Functional Metadata
                </Typography>
                <Controller
                  name="functional_metadata"
                  control={nodeForm.control}
                  render={({ field: { value, onChange } }) =>
                    renderJSONEditor(value, onChange)
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNodeDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : selectedNode ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edge Dialog */}
      <Dialog
        open={edgeDialogOpen}
        onClose={handleCloseEdgeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Create Edge
          <IconButton
            aria-label="close"
            onClick={handleCloseEdgeDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <form onSubmit={edgeForm.handleSubmit(handleEdgeSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item size={12} md={6}>
                <Controller
                  name="source_id"
                  control={edgeForm.control}
                  rules={{ required: "Source node is required" }}
                  render={({ field, fieldState }) => (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Source Node*
                      </Typography>
                      <Select
                        {...field}
                        styles={customSelectStyles}
                        options={renderNodeOptions()}
                        placeholder="Select source node..."
                        isSearchable
                        className={fieldState.error ? "is-invalid" : ""}
                      />
                      {fieldState.error && (
                        <Typography color="error" variant="caption">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              <Grid item size={12} md={6}>
                <Controller
                  name="target_id"
                  control={edgeForm.control}
                  rules={{ required: "Target node is required" }}
                  render={({ field, fieldState }) => (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Target Node*
                      </Typography>
                      <Select
                        {...field}
                        styles={customSelectStyles}
                        options={renderNodeOptions()}
                        placeholder="Select target node..."
                        isSearchable
                        className={fieldState.error ? "is-invalid" : ""}
                      />
                      {fieldState.error && (
                        <Typography color="error" variant="caption">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              <Grid item size={12}>
                <Controller
                  name="edge_type"
                  control={edgeForm.control}
                  rules={{
                    required: "Edge type is required",
                    pattern: {
                      value: /^[a-zA-Z0-9_\s-]+$/,
                      message:
                        "Edge type can only contain alphanumeric characters, underscores, spaces, and dashes",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Relationship Type*
                      </Typography>
                      <Select
                        {...field}
                        styles={customSelectStyles}
                        options={EDGE_TYPES}
                        placeholder="Select relationship type..."
                        isSearchable
                        className={fieldState.error ? "is-invalid" : ""}
                      />
                      {fieldState.error && (
                        <Typography color="error" variant="caption">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              <Grid item size={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Metadata
                </Typography>
                <Controller
                  name="metadata"
                  control={edgeForm.control}
                  render={({ field: { value, onChange } }) =>
                    renderJSONEditor(value, onChange)
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEdgeDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Namespace Dialog */}
      <Dialog
        open={namespaceDialogOpen}
        onClose={handleCloseNamespaceDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Create Namespace
          <IconButton
            aria-label="close"
            onClick={handleCloseNamespaceDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <form onSubmit={namespaceForm.handleSubmit(handleNamespaceSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item size={12} md={6}>
                <Controller
                  name="display_name"
                  control={namespaceForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Display Name (Alias)"
                      fullWidth
                      margin="normal"
                      placeholder="Friendly name for display purposes"
                    />
                  )}
                />
              </Grid>
              <Grid item size={12} md={6}>
                <Controller
                  name="source_id"
                  control={namespaceForm.control}
                  rules={{ required: "Source node is required" }}
                  render={({ field, fieldState }) => (
                    <Box sx={{ mb: 2, mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Source Node*
                      </Typography>
                      <Select
                        {...field}
                        styles={customSelectStyles}
                        options={renderNodeOptions()}
                        placeholder="Select source node..."
                        isSearchable
                        className={fieldState.error ? "is-invalid" : ""}
                      />
                      {fieldState.error && (
                        <Typography color="error" variant="caption">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              <Grid item size={12} md={6}>
                <Controller
                  name="target_id"
                  control={namespaceForm.control}
                  rules={{ required: "Target node is required" }}
                  render={({ field, fieldState }) => (
                    <Box sx={{ mb: 2, mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Target Node*
                      </Typography>
                      <Select
                        {...field}
                        styles={customSelectStyles}
                        options={renderNodeOptions()}
                        placeholder="Select target node..."
                        isSearchable
                        className={fieldState.error ? "is-invalid" : ""}
                      />
                      {fieldState.error && (
                        <Typography color="error" variant="caption">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              <Grid item size={12} md={6}>
                <TextField
                  label="Namespace Name"
                  value={generatedNamespaceName}
                  fullWidth
                  margin="normal"
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Auto-generated from selected nodes using :: separator
                </Typography>
              </Grid>
              <Grid item size={12}>
                <Controller
                  name="description"
                  control={namespaceForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      multiline
                      rows={2}
                      margin="normal"
                    />
                  )}
                />
              </Grid>
              <Grid item size={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Generated Path
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "info.light",
                      color: "info.contrastText",
                    }}
                  >
                    <Typography variant="subtitle1" component="div">
                      Namespace Value (Auto-generated):
                    </Typography>
                    <Typography
                      variant="body1"
                      component="div"
                      fontWeight="bold"
                    >
                      {generatedNamespaceValue ||
                        "(Select source and target nodes to generate value)"}
                    </Typography>
                  </Paper>
                </Box>

                <Typography variant="h6" gutterBottom>
                  Select Nodes in Path
                </Typography>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : pathNodes.length === 0 ? (
                  <Paper
                    sx={{ p: 3, textAlign: "center", bgcolor: "action.hover" }}
                  >
                    {namespaceForm.watch("source_id") &&
                    namespaceForm.watch("target_id")
                      ? "No path found between source and target nodes. Please ensure they are connected in the graph."
                      : "Select source and target nodes to display the path"}
                  </Paper>
                ) : (
                  <List sx={{ bgcolor: "background.paper" }}>
                    {pathNodes.map((node, index) => (
                      <ListItem
                        key={node.id}
                        divider={index < pathNodes.length - 1}
                        dense
                        sx={{
                          ml: index * 2,
                          bgcolor: selectedNamespaceNodes.includes(node.id)
                            ? "action.selected"
                            : "inherit",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Checkbox
                          edge="start"
                          checked={selectedNamespaceNodes.includes(node.id)}
                          onChange={() => handleToggleNamespaceNode(node.id)}
                        />

                        <Box
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography component="span">
                              {node.name || "(Unnamed)"}
                            </Typography>
                            {index === 0 && (
                              <Chip
                                label="Source"
                                color="primary"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                            {index === pathNodes.length - 1 && (
                              <Chip
                                label="Target"
                                color="secondary"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 0.5,
                            }}
                          >
                            {getNodeTypeChip(node.node_type)}
                            {node.description && (
                              <Typography
                                variant="body2"
                                component="span"
                                sx={{ ml: 1, color: "text.secondary" }}
                              >
                                - {node.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 2 }}
                >
                  Selected {selectedNamespaceNodes.length} of {pathNodes.length}{" "}
                  nodes in path
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNamespaceDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || selectedNamespaceNodes.length === 0}
            >
              {loading ? <CircularProgress size={24} /> : "Create Namespace"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Alerts */}
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alertInfo.severity}
          variant="filled"
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
import { Outlet } from "react-router-dom";

// function Layout() {
//   return (
//     <Box sx={{ flexGrow: 1 }}>
//       <AppBar position="static" color="primary" sx={{ mb: 4 }}>
//         <Toolbar>
//           <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
//             Access Control Management
//           </Typography>
//           <Button color="inherit" component={Link} to="/">
//             Home
//           </Button>
//           <Button
//             color="inherit"
//             component={Link}
//             to="/admin/access-control/policies"
//           >
//             Policies
//           </Button>
//           <Button
//             color="inherit"
//             component={Link}
//             to="/admin/access-control/policy/create"
//           >
//             Create Policy
//           </Button>
//         </Toolbar>
//       </AppBar>
//       <Container maxWidth="lg">
//         <Outlet />
//       </Container>
//     </Box>
//   );
// }

const LayoutTemplate = ({ TopLevelMenu, FeatureMenu }) => {
  return (
    <>
      <TopLevelMenu />
      <FeatureMenu
        title="Object Storage System"
        menuitems={{
          actions: [
            {
              id: "new",
              label: "Create Object",
              icon: <lucide.Mail size={20} />,
              divider: "after",
              goTo: "new",
              clickEventType: "navigateTo",
            },
          ],
        }}
        links={{
          home: { text: "Dashboard", to: "" },
          addItem: { text: "Add", to: "new" },
          search: { text: "Search", to: "search" },
        }}
      >
        <Outlet />
      </FeatureMenu>
    </>
  );
};

export default ({ TopLevelMenu, FeatureMenu }) => {
  return (
    <Routes>
      <Route
        path="admin/workspace/"
        element={
          <LayoutTemplate
            TopLevelMenu={TopLevelMenu}
            FeatureMenu={FeatureMenu}
          />
        }
      >
        <Route index element={<WorkspaceManager />} />
      </Route>
    </Routes>
  );
};
