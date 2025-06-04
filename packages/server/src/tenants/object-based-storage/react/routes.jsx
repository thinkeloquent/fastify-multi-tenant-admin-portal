import "./routes.css";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import * as semver from "semver";
import Editor from "@monaco-editor/react";
import { Navigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Box,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  FileCopy as FileCopyIcon,
  Compare as CompareIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import {
  Archive,
  Layers,
  Clock,
  GitBranch,
  Tag,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Users,
  Activity,
  SearchIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

import * as lucide from "lucide-react";

// Custom JSON Viewer/Editor component with Material UI
const JsonEditor = ({ data, onChange, readOnly = false }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (path) => {
    setExpanded((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleValueChange = (path, newValue) => {
    if (readOnly) return;

    const pathParts = path.split(".");
    const updateObj = (obj, parts, value) => {
      const [current, ...rest] = parts;
      if (rest.length === 0) {
        return { ...obj, [current]: value };
      } else {
        return {
          ...obj,
          [current]: updateObj(obj[current] || {}, rest, value),
        };
      }
    };

    onChange(updateObj(data, pathParts, newValue));
  };

  const handleDelete = (path) => {
    if (readOnly) return;

    const pathParts = path.split(".");
    const updateObj = (obj, parts) => {
      const [current, ...rest] = parts;
      if (rest.length === 0) {
        const newObj = { ...obj };
        delete newObj[current];
        return newObj;
      } else {
        return {
          ...obj,
          [current]: updateObj(obj[current] || {}, rest),
        };
      }
    };

    onChange(updateObj(data, pathParts));
  };

  const handleAdd = (path, keyName = "newKey", value = null) => {
    if (readOnly) return;

    const targetObj = path
      ? path.split(".").reduce((obj, key) => obj[key], data)
      : data;

    // Find a unique key name
    let newKey = keyName;
    let counter = 1;
    while (targetObj[newKey] !== undefined) {
      newKey = `${keyName}${counter}`;
      counter++;
    }

    const pathParts = path ? path.split(".") : [];
    const updateObj = (obj, parts, key, val) => {
      if (parts.length === 0) {
        return { ...obj, [key]: val };
      }

      const [current, ...rest] = parts;
      return {
        ...obj,
        [current]: updateObj(obj[current] || {}, rest, key, val),
      };
    };

    onChange(updateObj(data, pathParts, newKey, value === null ? "" : value));
  };

  const renderValue = (value, path) => {
    if (value === null)
      return <Typography color="text.secondary">null</Typography>;

    switch (typeof value) {
      case "object":
        if (Array.isArray(value)) {
          return renderArray(value, path);
        }
        return renderObject(value, path);

      case "string":
        return (
          <Box sx={{ color: "success.main" }} className="json-editor-string">
            {readOnly ? (
              `"${value}"`
            ) : (
              <TextField
                size="small"
                value={value}
                onChange={(e) => handleValueChange(path, e.target.value)}
                variant="outlined"
                sx={{ my: 0.5 }}
              />
            )}
          </Box>
        );

      case "number":
        return (
          <Box sx={{ color: "primary.main" }} className="json-editor-number">
            {readOnly ? (
              value
            ) : (
              <TextField
                size="small"
                type="number"
                value={value}
                onChange={(e) =>
                  handleValueChange(path, Number(e.target.value))
                }
                variant="outlined"
                sx={{ my: 0.5 }}
              />
            )}
          </Box>
        );

      case "boolean":
        return (
          <Box sx={{ color: "secondary.main" }} className="json-editor-boolean">
            {readOnly ? (
              value.toString()
            ) : (
              <Select
                size="small"
                value={value.toString()}
                onChange={(e) =>
                  handleValueChange(path, e.target.value === "true")
                }
                sx={{ my: 0.5, minWidth: 100 }}
              >
                <MenuItem value="true">true</MenuItem>
                <MenuItem value="false">false</MenuItem>
              </Select>
            )}
          </Box>
        );

      default:
        return <Typography>{String(value)}</Typography>;
    }
  };

  const renderArray = (arr, path) => {
    const isExpanded = expanded[path] !== false;

    return (
      <Box sx={{ my: 1 }}>
        <Box
          onClick={() => toggleExpand(path)}
          sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          className="json-editor-array"
        >
          <IconButton size="small">
            {isExpanded ? (
              <ExpandMoreIcon />
            ) : (
              <ExpandMoreIcon sx={{ transform: "rotate(-90deg)" }} />
            )}
          </IconButton>
          <Typography color="text.secondary">Array[{arr.length}]</Typography>
        </Box>

        {isExpanded && (
          <Box sx={{ pl: 4, borderLeft: 1, borderColor: "divider", ml: 1 }}>
            {arr.map((item, index) => (
              <Box
                key={`${path}.${index}`}
                sx={{ display: "flex", alignItems: "center", my: 0.5 }}
              >
                <Typography
                  color="text.secondary"
                  sx={{ mr: 1 }}
                  className="json-editor-key"
                >
                  {index}:
                </Typography>
                {renderValue(item, `${path}.${index}`)}

                {!readOnly && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(`${path}.${index}`)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}

            {!readOnly && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleAdd(path, arr.length, "")}
                sx={{ mt: 1 }}
                className="json-editor-button"
              >
                Add Item
              </Button>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const renderObject = (obj, path = "") => {
    const keys = Object.keys(obj);
    const isExpanded = expanded[path] !== false;

    return (
      <Box sx={{ my: 1 }}>
        <Box
          onClick={() => toggleExpand(path)}
          sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          className="json-editor-object"
        >
          <IconButton size="small">
            {isExpanded ? (
              <ExpandMoreIcon />
            ) : (
              <ExpandMoreIcon sx={{ transform: "rotate(-90deg)" }} />
            )}
          </IconButton>
          <Typography color="text.secondary">
            {path ? path.split(".").pop() : "Object"}{" "}
            {keys.length > 0 ? `{${keys.length}}` : "{}"}
          </Typography>
        </Box>

        {isExpanded && keys.length > 0 && (
          <Box sx={{ pl: 4, borderLeft: 1, borderColor: "divider", ml: 1 }}>
            {keys.map((key) => (
              <Box
                key={`${path}.${key}`}
                sx={{ display: "flex", alignItems: "flex-start", my: 0.5 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{ mr: 1, fontWeight: "medium" }}
                    className="json-editor-key"
                  >
                    "{key}":
                  </Typography>
                  {renderValue(obj[key], path ? `${path}.${key}` : key)}

                  {!readOnly && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        handleDelete(path ? `${path}.${key}` : key)
                      }
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}

            {!readOnly && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleAdd(path)}
                sx={{ mt: 1 }}
                className="json-editor-button"
              >
                Add Property
              </Button>
            )}
          </Box>
        )}

        {isExpanded && keys.length === 0 && !readOnly && (
          <Box sx={{ pl: 4, borderLeft: 1, borderColor: "divider", ml: 1 }}>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleAdd(path)}
              sx={{ mt: 1 }}
              className="json-editor-button"
            >
              Add Property
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
      className="json-editor-container"
    >
      {renderValue(data, "")}
    </Box>
  );
};

// Custom JSON diff component with Material UI
const JsonDiffView = ({ oldJson, newJson }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (path) => {
    setExpanded((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Function to determine CSS class based on comparison
  const getValueStyle = (oldVal, newVal) => {
    if (oldVal === undefined)
      return {
        bgcolor: "success.light",
        px: 1,
        borderRadius: 1,
        className: "json-diff-added",
      }; // Added
    if (newVal === undefined)
      return {
        bgcolor: "error.light",
        px: 1,
        borderRadius: 1,
        className: "json-diff-removed",
      }; // Removed
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal))
      return {
        bgcolor: "warning.light",
        px: 1,
        borderRadius: 1,
        className: "json-diff-changed",
      }; // Changed
    return {}; // Unchanged
  };

  const renderValue = (oldVal, newVal, path) => {
    // Check if values are objects (but not null)
    const isOldObject = oldVal && typeof oldVal === "object";
    const isNewObject = newVal && typeof newVal === "object";

    // If both are objects, render a sub-comparison
    if (isOldObject && isNewObject) {
      return renderObjectDiff(oldVal, newVal, path);
    }

    // If only one is an object or neither are objects
    const style = getValueStyle(oldVal, newVal);

    if (oldVal === undefined) {
      return (
        <Typography sx={style} className="json-diff-added">
          Added: {JSON.stringify(newVal)}
        </Typography>
      );
    }

    if (newVal === undefined) {
      return (
        <Typography sx={style} className="json-diff-removed">
          Removed: {JSON.stringify(oldVal)}
        </Typography>
      );
    }

    if (Object.keys(style).length) {
      return (
        <Typography sx={style} className="json-diff-changed">
          Changed: {JSON.stringify(oldVal)} → {JSON.stringify(newVal)}
        </Typography>
      );
    }

    return <Typography>{JSON.stringify(oldVal)}</Typography>;
  };

  const renderObjectDiff = (oldObj, newObj, path = "") => {
    const allKeys = new Set([
      ...Object.keys(oldObj || {}),
      ...Object.keys(newObj || {}),
    ]);

    // For arrays, ensure numeric sorting
    const sortedKeys = Array.from(allKeys).sort((a, b) => {
      if (Array.isArray(oldObj) || Array.isArray(newObj)) {
        return parseInt(a) - parseInt(b);
      }
      return a.localeCompare(b);
    });

    const isExpanded = expanded[path] !== false;
    const hasChanges = sortedKeys.some((key) => {
      const oldVal = oldObj?.[key];
      const newVal = newObj?.[key];
      return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    });

    const objectType =
      Array.isArray(oldObj) || Array.isArray(newObj) ? "Array" : "Object";
    const displayName = path ? path.split(".").pop() : objectType;
    const changeIndicator = hasChanges ? " (modified)" : "";

    return (
      <Box sx={{ ml: 2 }} className="json-diff-container">
        <Box
          sx={{
            cursor: "pointer",
            color: hasChanges ? "warning.dark" : "text.secondary",
            fontWeight: hasChanges ? "medium" : "regular",
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => toggleExpand(path)}
        >
          <IconButton size="small">
            {isExpanded ? (
              <ExpandMoreIcon />
            ) : (
              <ExpandMoreIcon sx={{ transform: "rotate(-90deg)" }} />
            )}
          </IconButton>
          <Typography>
            {displayName}
            {changeIndicator}
          </Typography>
        </Box>

        {isExpanded && (
          <Box sx={{ pl: 4, borderLeft: 1, borderColor: "divider", ml: 1 }}>
            {sortedKeys.map((key) => {
              const oldValue = oldObj?.[key];
              const newValue = newObj?.[key];
              const currentPath = path ? `${path}.${key}` : key;

              return (
                <Box key={currentPath} sx={{ my: 1 }}>
                  <Typography sx={{ fontFamily: "monospace" }}>
                    {key}:{" "}
                  </Typography>
                  {renderValue(oldValue, newValue, currentPath)}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
      {renderObjectDiff(oldJson, newJson)}
    </Box>
  );
};

// Constants for the dashboard
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

// Service for handling API calls to the backend
const createObjectStorageService = (
  baseUrl = "http://localhost:3001/object-based-storage"
) => ({
  async getAllObjects() {
    const response = await fetch(`${baseUrl}`);
    if (!response.ok) throw new Error("Failed to fetch objects");
    return await response.json();
  },

  async getAllVersions(name) {
    const response = await fetch(`${baseUrl}/${name}`);
    if (!response.ok) throw new Error("Failed to fetch versions");
    return await response.json();
  },

  async getObject(name, version) {
    const response = await fetch(`${baseUrl}/${name}/${version}`);
    if (!response.ok) throw new Error("Failed to fetch object version");
    return await response.json();
  },

  async getLatestVersion(name) {
    const response = await fetch(`${baseUrl}/${name}/latest`);
    if (!response.ok) throw new Error("Failed to fetch latest version");
    return await response.json();
  },

  async getDiff(name, version1, version2) {
    const response = await fetch(
      `${baseUrl}/${name}/${version1}/diff/${version2}`
    );
    if (!response.ok) throw new Error("Failed to get diff");
    return await response.json();
  },

  async getHistory(name) {
    const response = await fetch(`${baseUrl}/${name}/history`);
    if (!response.ok) throw new Error("Failed to get history");
    return await response.json();
  },

  async createObject(objectData) {
    // Set initial semver version if not provided
    if (!objectData.version) {
      objectData.version = "1.0.0";
    }

    const response = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(objectData),
    });
    if (!response.ok) throw new Error("Failed to create object");
    return await response.json();
  },

  async updateObject(name, version, objectData) {
    const response = await fetch(`${baseUrl}/${name}/${version}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(objectData),
    });
    if (!response.ok) throw new Error("Failed to update object");
    return await response.json();
  },

  async cloneObject(name, version, cloneData) {
    // Create a new semver version when cloning
    if (!cloneData.version) {
      const currentVersion = version;
      cloneData.version = semver.inc(currentVersion, "patch");
    }

    const response = await fetch(`${baseUrl}/${name}/clone/${version}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cloneData),
    });
    if (!response.ok) throw new Error("Failed to clone object");
    return await response.json();
  },

  async deleteObject(name, version) {
    const response = await fetch(`${baseUrl}/${name}/${version}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete object");
    return true;
  },
});

// MetricCard Component
const MetricCard = ({ title, value, icon, color }) => {
  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height: 140,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: 3,
        },
      }}
      className="metric-card"
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ color: color || "primary.main" }}>{icon}</Box>
      </Box>
      <Typography component="p" variant="h3" className="metric-value">
        {value}
      </Typography>
    </Paper>
  );
};

// Page component for listing all objects with dashboard metrics
const ObjectStorageListPage = ({ service }) => {
  const [objects, setObjects] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalObjects: 0,
    totalVersions: 0,
    objectsByType: {},
    recentActivity: [],
    activityByTime: [],
    modifierCount: {},
    avgVersionsPerObject: 0,
  });
  const navigate = useNavigate();
  const theme = useTheme();

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);

      // Fetch all objects
      const objectsData = await service.getAllObjects();
      setObjects(objectsData);

      // Calculate type metrics
      const types = {};
      objectsData.forEach((obj) => {
        types[obj.type] = (types[obj.type] || 0) + 1;
      });

      // Get versions for metrics
      let allVersions = [];
      let recentActivity = [];
      let modifierStats = {};
      let activityTimeline = {};

      // Fetch versions for each object (in parallel)
      const versionPromises = objectsData.map((obj) =>
        service.getAllVersions(obj.name)
      );
      const versionsResults = await Promise.all(versionPromises);

      // Process all versions data
      versionsResults.forEach((objVersions) => {
        if (objVersions && objVersions.length > 0) {
          allVersions = [...allVersions, ...objVersions];

          // Process modifiers
          objVersions.forEach((v) => {
            const modifier = v.modified_by || "Unknown";
            modifierStats[modifier] = (modifierStats[modifier] || 0) + 1;

            // Create activity timeline data (by day)
            const date = new Date(v.created_at).toISOString().split("T")[0];
            activityTimeline[date] = (activityTimeline[date] || 0) + 1;
          });

          // Add to recent activity
          objVersions.sort(
            (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
          );
          recentActivity.push(objVersions[0]);
        }
      });

      // Sort recent activity by date
      recentActivity.sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );
      recentActivity = recentActivity.slice(0, 5); // Most recent 5

      // Create timeline data for chart
      const timelineData = Object.keys(activityTimeline)
        .sort()
        .map((date) => ({
          date,
          count: activityTimeline[date],
        }));

      // Calculate average versions per object
      const avgVersions = objectsData.length
        ? (allVersions.length / objectsData.length).toFixed(1)
        : 0;

      setVersions(allVersions);
      setMetrics({
        totalObjects: objectsData.length,
        totalVersions: allVersions.length,
        objectsByType: types,
        recentActivity,
        activityByTime: timelineData,
        modifierCount: modifierStats,
        avgVersionsPerObject: avgVersions,
      });

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [service]);

  // Prepare data for charts
  const typeChartData = useMemo(
    () =>
      Object.keys(metrics.objectsByType).map((type) => ({
        name: type,
        value: metrics.objectsByType[type],
      })),
    [metrics.objectsByType]
  );

  const modifierChartData = useMemo(
    () =>
      Object.keys(metrics.modifierCount).map((user) => ({
        name: user,
        value: metrics.modifierCount[user],
      })),
    [metrics.modifierCount]
  );

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error: {error}
      </Alert>
    );

  return (
    <div>
      {/* Dashboard Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        {/* <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button> */}
      </Box>

      {/* Metrics Cards Row */}
      {/* <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={6} sm={6} md={3}>
          <MetricCard
            title="Total Objects"
            value={metrics.totalObjects}
            icon={<Archive size={24} />}
          />
        </Grid>
        <Grid item size={6} sm={6} md={3}>
          <MetricCard
            title="Total Versions"
            value={metrics.totalVersions}
            icon={<Layers size={24} />}
            color="secondary.main"
          />
        </Grid>
        <Grid item size={3} sm={6} md={3}>
          <MetricCard
            title="Versions/Object"
            value={metrics.avgVersionsPerObject}
            icon={<GitBranch size={24} />}
            color="info.main"
          />
        </Grid>
        <Grid item size={3} sm={6} md={3}>
          <MetricCard
            title="Object Types"
            value={Object.keys(metrics.objectsByType).length}
            icon={<Tag size={24} />}
            color="success.main"
          />
        </Grid>
      </Grid> */}

      {/* Object List Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          All Objects ({objects.length})
        </Typography>
      </Box>

      {objects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="textSecondary">
            No objects found. Create a new one to get started!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {objects.map((obj) => (
            <Grid item size={12} sm={6} md={4} key={obj.name}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {obj.name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <Chip
                      size="small"
                      label={obj.type}
                      color={obj.type === "JSON" ? "primary" : "secondary"}
                    />
                  </Box>

                  {/* Get the version count for this object */}
                  <Typography color="text.secondary" variant="body2">
                    {versions.filter((v) => v.name === obj.name).length}{" "}
                    versions
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => navigate(`${obj.name}`)}
                  >
                    View Versions
                  </Button>
                  <Button
                    size="small"
                    color="secondary"
                    onClick={() => navigate(`${obj.name}/latest`)}
                  >
                    Latest Version
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Grid item size={12} md={6}>
        <Paper sx={{ p: 2, height: 350 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Recent Activity
          </Typography>
          <List
            sx={{ width: "100%", maxHeight: 290, overflow: "auto" }}
            className="activity-list"
          >
            {metrics.recentActivity.length === 0 ? (
              <ListItem>
                <ListItemText primary="No recent activity" />
              </ListItem>
            ) : (
              metrics.recentActivity.map((activity) => (
                <ListItem
                  key={`${activity.name}-${activity.version}`}
                  button
                  onClick={() =>
                    navigate(`${activity.name}/${activity.version}`)
                  }
                  sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.12)" }}
                  className="activity-item"
                >
                  <ListItemIcon>
                    <Activity size={20} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography fontWeight="medium">
                          {activity.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={`v${activity.version}`}
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {activity.change_summary
                            ? activity.change_summary.length > 60
                              ? `${activity.change_summary.substring(0, 60)}...`
                              : activity.change_summary
                            : "No description"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Updated{" "}
                          {new Date(activity.updated_at).toLocaleString()}
                          {activity.modified_by &&
                            ` by ${activity.modified_by}`}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Type Distribution Chart */}
        {/* //MOVE
        <Grid item size={12} md={4}>
          <Paper sx={{ p: 2, height: 300 }} className="chart-container">
            <Typography variant="h6" gutterBottom>
              Objects by Type
            </Typography>
            {typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill={theme.palette.primary.main}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name, props) => [
                      `${value} objects`,
                      props.payload.name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary">
                  No data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid> */}

        {/* Activity Timeline Chart */}
        <Grid item size={12} md={8}>
          <Paper sx={{ p: 2, height: 300 }} className="chart-container">
            <Typography variant="h6" gutterBottom>
              Activity Timeline
            </Typography>
            {metrics.activityByTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={metrics.activityByTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value) => [`${value} changes`, "Activity"]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString()
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Changes"
                    fill={theme.palette.primary.light}
                    stroke={theme.palette.primary.main}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary">
                  No timeline data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Row - Contributors and Recent Activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Contributors Chart */}
        <Grid item size={12} md={6}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Contributors
            </Typography>
            {modifierChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={290}>
                <BarChart
                  data={modifierChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip
                    formatter={(value) => [`${value} changes`, "Contributions"]}
                  />
                  <Bar
                    dataKey="value"
                    name="Changes"
                    fill={theme.palette.secondary.main}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary">
                  No contributor data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
      </Grid>
    </div>
  );
};

// Page component for listing all versions of a specific object
const ObjectVersionListPage = ({ service }) => {
  const { name } = useParams();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const data = await service.getAllVersions(name);
        // Sort versions by semver
        data.sort((a, b) => semver.rcompare(a.version, b.version));
        setVersions(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchVersions();
  }, [name, service]);

  // Calculate chart data for version history
  const historyChartData = useMemo(() => {
    if (!versions.length) return [];

    return versions
      .slice() // Create a copy before sorting
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((v) => ({
        version: v.version,
        date: new Date(v.created_at).getTime(),
        changes: v.change_summary ? 1 : 0,
      }));
  }, [versions]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error: {error}
      </Alert>
    );

  const latestVersion = versions.length > 0 ? versions[0].version : null;

  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={() => navigate("..")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {name}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => navigate("history")}
          >
            View History
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() =>
              navigate(`../new?clone=${name}&version=${latestVersion}`)
            }
            disabled={!latestVersion}
          >
            Create New Version
          </Button>
        </Box>
      </Box>

      {/* Version Timeline Chart
      {versions.length > 1 && (
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Version Timeline
          </Typography>
          <Box sx={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historyChartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(timestamp) =>
                    new Date(timestamp).toLocaleDateString()
                  }
                />
                <YAxis dataKey="version" />
                <RechartsTooltip
                  labelFormatter={(date) => new Date(date).toLocaleString()}
                  formatter={(value, name) => [
                    value,
                    name === "version" ? "Version" : name,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="version"
                  stroke={theme.palette.primary.main}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )} */}

      {versions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="textSecondary">
            No versions found for this object.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Modified By</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.map((version) => (
                <TableRow
                  key={version.version}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                  onClick={() => navigate(`${version.version}`)}
                >
                  <TableCell>
                    {version.version}
                    {version.version === latestVersion && (
                      <Chip
                        size="small"
                        label="Latest"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{version.type}</TableCell>
                  <TableCell>
                    {version.is_locked ? (
                      <Chip size="small" label="Locked" color="error" />
                    ) : (
                      <Chip size="small" label="Editable" color="success" />
                    )}
                    {!version.is_active && (
                      <Chip
                        size="small"
                        label="Inactive"
                        color="default"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{version.modified_by || "Unknown"}</TableCell>
                  <TableCell>
                    {new Date(version.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${version.version}`);
                          }}
                        >
                          <ExpandMoreIcon />
                        </IconButton>
                      </Tooltip>

                      {!version.is_locked && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`${version.version}/edit`);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

// TabPanel component for tabbed interfaces
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// Page component for viewing a specific object version
const ObjectVersionDetailPage = ({ service }) => {
  const { name, version } = useParams();
  const navigate = useNavigate();
  const [object, setObject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparisonVersion, setComparisonVersion] = useState("");
  const [versionList, setVersionList] = useState([]);
  const [diffData, setDiffData] = useState(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const theme = useTheme();

  // Parse JSON data once
  const parsedData = useMemo(() => {
    if (!object?.data) return null;
    try {
      return typeof object.data === "string"
        ? JSON.parse(object.data)
        : object.data;
    } catch (e) {
      return object.data;
    }
  }, [object?.data]);

  // Parse metadata once
  const parsedMetadata = useMemo(() => {
    if (!object?.metadata) return null;
    try {
      return typeof object.metadata === "string"
        ? JSON.parse(object.metadata)
        : object.metadata;
    } catch (e) {
      return object.metadata;
    }
  }, [object?.metadata]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const objectData = await service.getObject(name, version);
        setObject(objectData);

        const versions = await service.getAllVersions(name);
        // Sort versions by semver
        versions.sort((a, b) => semver.rcompare(a.version, b.version));
        setVersionList(versions.filter((v) => v.version !== version));

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [name, version, service]);

  const handleComparisonChange = (e) => {
    setComparisonVersion(e.target.value);
  };

  const handleViewDiff = async () => {
    if (!comparisonVersion) return;

    try {
      setLoadingDiff(true);
      const diffData = await service.getDiff(name, version, comparisonVersion);
      setDiffData(diffData);
      setLoadingDiff(false);
    } catch (err) {
      setError(err.message);
      setLoadingDiff(false);
    }
  };

  const handleLoadHistory = async () => {
    try {
      setLoadingHistory(true);
      const historyData = await service.getHistory(name);
      setHistory(historyData);
      setLoadingHistory(false);
    } catch (err) {
      setError(err.message);
      setLoadingHistory(false);
    }
  };

  const handleDelete = async () => {
    try {
      await service.deleteObject(name, version);
      navigate(`../${name}`);
    } catch (err) {
      setError(err.message);
    }
    setConfirmDelete(false);
  };

  const handleClone = async () => {
    try {
      const cloneData = {
        modified_by: "Current User",
        change_summary: `Cloned from version ${version}`,
      };

      await service.cloneObject(name, version, cloneData);
      navigate(`../${name}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // Load history data when history tab is selected
    if (newValue === 3 && history.length === 0) {
      handleLoadHistory();
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error: {error}
      </Alert>
    );
  if (!object)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Object not found
      </Alert>
    );

  // Prepare history chart data
  const historyChartData = history
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((h) => ({
      version: h.version,
      date: new Date(h.created_at).getTime(),
      changes: h.changes_count || 0,
    }));

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={() => navigate(`../${name}`)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {name}
            <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
              (Version: {version})
            </Typography>
            {object.version === versionList[0]?.version && (
              <Chip
                size="small"
                label="Latest Version"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileCopyIcon />}
            onClick={handleClone}
          >
            Clone
          </Button>

          {!object.is_locked && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<EditIcon />}
                onClick={() => navigate(`edit`)}
              >
                Edit
              </Button>

              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Object Information
            </Typography>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 2 }}
            >
              <Typography fontWeight="bold">Type:</Typography>
              <Typography>{object.type}</Typography>

              <Typography fontWeight="bold">Status:</Typography>
              <Typography>
                {object.is_active ? "Active" : "Inactive"}
              </Typography>

              <Typography fontWeight="bold">Locked:</Typography>
              <Typography>{object.is_locked ? "Yes" : "No"}</Typography>

              <Typography fontWeight="bold">Created:</Typography>
              <Typography>
                {new Date(object.created_at).toLocaleString()}
              </Typography>

              <Typography fontWeight="bold">Updated:</Typography>
              <Typography>
                {new Date(object.updated_at).toLocaleString()}
              </Typography>

              <Typography fontWeight="bold">Modified By:</Typography>
              <Typography>{object.modified_by || "Unknown"}</Typography>

              <Typography fontWeight="bold">Parent Version:</Typography>
              <Typography>
                {object.parent_version ? (
                  <Link to={`../${name}/${object.parent_version}`}>
                    {object.parent_version}
                  </Link>
                ) : (
                  "None (Original)"
                )}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item size={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography paragraph sx={{ whiteSpace: "pre-wrap" }}>
              {object.change_summary || "No description provided."}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              textTransform: "none",
              minWidth: 100,
              fontWeight: "medium",
            },
          }}
        >
          <Tab
            label="Data"
            icon={<CodeIcon />}
            iconPosition="start"
            aria-label="View object data"
          />
          <Tab
            label="Metadata"
            icon={<InfoIcon />}
            iconPosition="start"
            aria-label="View object metadata"
          />
          <Tab
            label="Compare"
            icon={<CompareIcon />}
            iconPosition="start"
            aria-label="Compare with other versions"
          />
          <Tab
            label="History"
            icon={<HistoryIcon />}
            iconPosition="start"
            aria-label="View version history"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Data Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box
              sx={{
                height: 500,
                borderRadius: 1,
              }}
              className="json-editor-container"
            >
              <Editor
                height="100%"
                defaultLanguage="json"
                value={
                  typeof object.data === "string"
                    ? object.data
                    : JSON.stringify(object.data, null, 2)
                }
                options={{
                  readOnly: true,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </Box>
          </TabPanel>

          {/* Metadata Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box
              sx={{
                height: 500,
                borderRadius: 1,
              }}
              className="json-editor-container"
            >
              <Editor
                height="100%"
                defaultLanguage="json"
                value={
                  typeof object.metadata === "string"
                    ? object.metadata
                    : JSON.stringify(object.metadata, null, 2)
                }
                options={{
                  readOnly: true,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </Box>
          </TabPanel>

          {/* Compare Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Compare with another version
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel id="version-compare-label">
                      Select version to compare
                    </InputLabel>
                    <Select
                      labelId="version-compare-label"
                      value={comparisonVersion}
                      onChange={handleComparisonChange}
                      label="Select version to compare"
                    >
                      <MenuItem value="">
                        <em>Select a version</em>
                      </MenuItem>
                      {versionList.map((v) => (
                        <MenuItem key={v.version} value={v.version}>
                          {v.version} ({new Date(v.created_at).toLocaleString()}
                          )
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<CompareIcon />}
                    onClick={handleViewDiff}
                    disabled={!comparisonVersion || loadingDiff}
                  >
                    {loadingDiff ? "Loading..." : "Compare"}
                  </Button>
                </Box>

                {loadingDiff && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", my: 4 }}
                  >
                    <CircularProgress />
                  </Box>
                )}

                {diffData && !loadingDiff && (
                  <>
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Data Differences</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box
                          sx={{
                            bgcolor: "background.default",
                            p: 2,
                            borderRadius: 1,
                          }}
                        >
                          <JsonDiffView
                            oldJson={diffData.dataChanges.first}
                            newJson={diffData.dataChanges.second}
                          />
                        </Box>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Metadata Differences</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box
                          sx={{
                            bgcolor: "background.default",
                            p: 2,
                            borderRadius: 1,
                          }}
                        >
                          <JsonDiffView
                            oldJson={diffData.metadataChanges.first}
                            newJson={diffData.metadataChanges.second}
                          />
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </>
                )}
              </Paper>
            </Box>
          </TabPanel>

          {/* History Tab */}
          <TabPanel value={activeTab} index={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Version History Timeline
              </Typography>

              {loadingHistory && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {!loadingHistory && history.length === 0 && (
                <Alert severity="info">
                  No history records available for this object.
                </Alert>
              )}

              {!loadingHistory && history.length > 0 && (
                <>
                  {/* Timeline Chart */}
                  <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                    <Box sx={{ height: 250, overflow: "auto" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={historyChartData}
                          margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            type="number"
                            scale="time"
                            domain={["dataMin", "dataMax"]}
                            tickFormatter={(timestamp) =>
                              new Date(timestamp).toLocaleDateString()
                            }
                            label={{
                              value: "Date",
                              position: "insideBottomRight",
                              offset: -10,
                            }}
                          />
                          <YAxis
                            label={{
                              value: "Changes",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <RechartsTooltip
                            labelFormatter={(timestamp) =>
                              new Date(timestamp).toLocaleString()
                            }
                            formatter={(value, name, props) => {
                              if (name === "version") return [value, "Version"];
                              if (name === "changes") return [value, "Changes"];
                              return [value, name];
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="version"
                            stroke={theme.palette.primary.main}
                            activeDot={{ r: 8 }}
                            name="Version"
                          />
                          <Line
                            type="monotone"
                            dataKey="changes"
                            stroke={theme.palette.secondary.main}
                            name="Changes"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>

                  {/* Version History Table */}
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Version</TableCell>
                          <TableCell>Modified By</TableCell>
                          <TableCell>Changes</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {history.map((entry) => (
                          <TableRow
                            key={entry.version}
                            sx={{
                              backgroundColor:
                                entry.version === version
                                  ? "rgba(25, 118, 210, 0.08)"
                                  : "inherit",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.04)",
                                cursor: "pointer",
                              },
                            }}
                            onClick={() =>
                              navigate(`../${name}/${entry.version}`)
                            }
                          >
                            <TableCell>
                              {new Date(entry.updated_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={entry.version}
                                size="small"
                                color={
                                  entry.version === version
                                    ? "primary"
                                    : "default"
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {entry.modified_by || "Unknown"}
                            </TableCell>
                            <TableCell>
                              {entry.changes_count > 0 ? (
                                <Chip
                                  label={`${entry.changes_count} changes`}
                                  size="small"
                                  color="warning"
                                />
                              ) : (
                                <Chip
                                  label="No changes"
                                  size="small"
                                  color="success"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Tooltip
                                title={entry.change_summary || "No description"}
                              >
                                <Typography
                                  sx={{
                                    maxWidth: "300px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {entry.change_summary || "No description"}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          </TabPanel>
        </Box>
      </Paper>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this version ({version}) of {name}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

// Form page component for creating or editing an object
const ObjectStorageFormPage = ({ service, isEdit = false }) => {
  const { name, version } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Base form state (without the editor contents)
  const [formData, setFormData] = useState({
    name: "",
    type: "JSON",
    modified_by: "Current User",
    change_summary: "",
  });

  // Separate state for the editor content to avoid UI slowdown
  const [dataContent, setDataContent] = useState("{}");
  const [metadataContent, setMetadataContent] = useState("{}");

  const editorRef = useRef(null);
  const metadataEditorRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleMetadataEditorDidMount = (editor) => {
    metadataEditorRef.current = editor;
  };

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        // Check for clone parameters in the URL
        const searchParams = new URLSearchParams(location.search);
        const cloneName = searchParams.get("clone");
        const cloneVersion = searchParams.get("version");

        if (isEdit && name && version) {
          const objectData = await service.getObject(name, version);
          setFormData({
            name: objectData.name,
            type: objectData.type || "JSON",
            modified_by: "Current User",
            change_summary: "",
            version: semver.inc(objectData.version, "patch"), // Increment patch version
          });

          // Set editor content separately
          setDataContent(
            typeof objectData.data === "string"
              ? objectData.data
              : JSON.stringify(objectData.data, null, 2)
          );

          setMetadataContent(
            typeof objectData.metadata === "string"
              ? objectData.metadata
              : JSON.stringify(objectData.metadata, null, 2)
          );
        } else if (cloneName && cloneVersion) {
          const objectData = await service.getObject(cloneName, cloneVersion);
          setFormData({
            name: objectData.name,
            type: objectData.type || "JSON",
            modified_by: "Current User",
            change_summary: `Cloned from version ${cloneVersion}`,
            version: semver.inc(objectData.version, "patch"), // Increment patch version
          });

          // Set editor content separately
          setDataContent(
            typeof objectData.data === "string"
              ? objectData.data
              : JSON.stringify(objectData.data, null, 2)
          );

          setMetadataContent(
            typeof objectData.metadata === "string"
              ? objectData.metadata
              : JSON.stringify(objectData.metadata, null, 2)
          );
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (isEdit || location.search) {
      loadExistingData();
    } else {
      setLoading(false);
    }
  }, [isEdit, name, version, location.search, service]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Get the current content from the editors
      const currentData = dataContent;
      const currentMetadata = metadataContent;

      // Combine the form data with the editor content
      const requestData = {
        ...formData,
        data: currentData,
        metadata: currentMetadata,
      };

      if (isEdit) {
        await service.updateObject(name, version, requestData);
        navigate(`../${name}/${version}`);
      } else {
        const newObject = await service.createObject(requestData);
        navigate(`../${newObject.name}/${newObject.version}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  // Parse search parameters for cloning
  const searchParams = new URLSearchParams(location.search);
  const cloneName = searchParams.get("clone");
  const cloneVersion = searchParams.get("version");
  const isCloning = !!(cloneName && cloneVersion);

  return (
    <div>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEdit
            ? `Edit Object: ${name} (Version: ${version})`
            : isCloning
              ? `Clone Object: ${cloneName}`
              : "Create New Object"}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item size={12} md={6}>
              <TextField
                fullWidth
                label="Object Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isEdit || isCloning}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item size={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="object-type-label">Object Type</InputLabel>
                <Select
                  labelId="object-type-label"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  label="Object Type"
                  required
                >
                  <MenuItem value="JSON">JSON</MenuItem>
                  <MenuItem value="Configuration">Configuration</MenuItem>
                  <MenuItem value="Template">Template</MenuItem>
                  <MenuItem value="Schema">Schema</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item size={12}>
              <TextField
                fullWidth
                label="Description"
                name="change_summary"
                value={formData.change_summary}
                onChange={handleInputChange}
                placeholder="Describe the changes or purpose of this version"
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>

            <Grid item size={12}>
              <Paper sx={{ mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  centered
                  sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontWeight: "medium",
                    },
                  }}
                >
                  <Tab label="Data" icon={<CodeIcon />} iconPosition="start" />
                  <Tab
                    label="Metadata"
                    icon={<InfoIcon />}
                    iconPosition="start"
                  />
                </Tabs>
                <Box sx={{ p: 3 }}>
                  {activeTab === 0 && (
                    <Box
                      sx={{
                        height: 400,
                        borderRadius: 1,
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                      }}
                      className="json-editor-container"
                    >
                      <Editor
                        height="100%"
                        defaultLanguage="json"
                        value={dataContent}
                        onChange={setDataContent}
                        onMount={handleEditorDidMount}
                        options={{
                          minimap: { enabled: true },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          formatOnPaste: true,
                          formatOnType: true,
                        }}
                      />
                    </Box>
                  )}
                  {activeTab === 1 && (
                    <Box
                      sx={{
                        height: 400,
                        borderRadius: 1,
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                      }}
                      className="json-editor-container"
                    >
                      <Editor
                        height="100%"
                        defaultLanguage="json"
                        value={metadataContent}
                        onChange={setMetadataContent}
                        onMount={handleMetadataEditorDidMount}
                        options={{
                          minimap: { enabled: true },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          formatOnPaste: true,
                          formatOnType: true,
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
          >
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Cancel
            </Button>

            <Button type="submit" variant="contained" color="primary">
              {isEdit ? "Update Object" : "Create Object"}
            </Button>
          </Box>
        </form>
      </Paper>
    </div>
  );
};

// History page for viewing object history
const ObjectHistoryPage = ({ service }) => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyData = await service.getHistory(name);
        setHistory(historyData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [name, service]);

  // Prepare chart data
  const versionData = useMemo(() => {
    return history
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((item) => ({
        version: item.version,
        date: new Date(item.created_at).getTime(),
        changes: item.changes_count || 0,
        developer: item.modified_by || "Unknown",
      }));
  }, [history]);

  // Calculate developer contributions
  const developerData = useMemo(() => {
    const developers = {};
    history.forEach((item) => {
      const dev = item.modified_by || "Unknown";
      developers[dev] = (developers[dev] || 0) + 1;
    });

    return Object.entries(developers).map(([name, count]) => ({
      name,
      value: count,
    }));
  }, [history]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error: {error}
      </Alert>
    );

  return (
    <Container>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate(`../${name}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          History for {name}
        </Typography>
      </Box>

      {history.length === 0 ? (
        <Alert severity="info">No history available for this object.</Alert>
      ) : (
        <>
          {/* Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item size={12} sm={6} md={3}>
              <MetricCard
                title="Total Versions"
                value={history.length}
                icon={<Layers size={24} />}
              />
            </Grid>
            <Grid item size={12} sm={6} md={3}>
              <MetricCard
                title="Contributors"
                value={developerData.length}
                icon={<Users size={24} />}
                color="secondary.main"
              />
            </Grid>
            <Grid item size={12} sm={6} md={3}>
              <MetricCard
                title="First Version"
                value={
                  history.length > 0
                    ? new Date(
                        Math.min(
                          ...history.map((h) =>
                            new Date(h.created_at).getTime()
                          )
                        )
                      ).toLocaleDateString()
                    : "-"
                }
                icon={<ArrowDownCircle size={24} />}
                color="success.main"
              />
            </Grid>
            <Grid item size={12} sm={6} md={3}>
              <MetricCard
                title="Latest Update"
                value={
                  history.length > 0
                    ? new Date(
                        Math.max(
                          ...history.map((h) =>
                            new Date(h.updated_at).getTime()
                          )
                        )
                      ).toLocaleDateString()
                    : "-"
                }
                icon={<ArrowUpCircle size={24} />}
                color="warning.main"
              />
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Version Timeline Chart */}
            <Grid item size={12} md={8}>
              <Paper sx={{ p: 2, height: 350 }}>
                <Typography variant="h6" gutterBottom>
                  Version Timeline
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={versionData}
                      margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        type="number"
                        scale="time"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(timestamp) =>
                          new Date(timestamp).toLocaleDateString()
                        }
                        label={{
                          value: "Date",
                          position: "insideBottomRight",
                          offset: -10,
                        }}
                      />
                      <YAxis
                        yAxisId="left"
                        label={{
                          value: "Version",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        label={{
                          value: "Changes",
                          angle: 90,
                          position: "insideRight",
                        }}
                      />
                      <RechartsTooltip
                        labelFormatter={(timestamp) =>
                          new Date(timestamp).toLocaleString()
                        }
                        formatter={(value, name, props) => {
                          if (name === "version") return [value, "Version"];
                          if (name === "changes") return [value, "Changes"];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="version"
                        stroke={theme.palette.primary.main}
                        activeDot={{ r: 8 }}
                        name="Version"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="changes"
                        stroke={theme.palette.secondary.main}
                        name="Changes"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Contributors Chart */}
            <Grid item size={12} md={4}>
              <Paper sx={{ p: 2, height: 350 }}>
                <Typography variant="h6" gutterBottom>
                  Contributors
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={developerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill={theme.palette.primary.main}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {developerData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [`${value} versions`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Version History Table */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Version History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Modified By</TableCell>
                    <TableCell>Changes</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history
                    .sort((a, b) => semver.rcompare(a.version, b.version))
                    .map((entry) => (
                      <TableRow key={entry.version}>
                        <TableCell>
                          <Chip
                            label={entry.version}
                            size="small"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(entry.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{entry.modified_by || "Unknown"}</TableCell>
                        <TableCell>
                          {entry.changes_count > 0 ? (
                            <Chip
                              label={`${entry.changes_count} changes`}
                              size="small"
                              color="warning"
                            />
                          ) : (
                            <Chip
                              label="No changes"
                              size="small"
                              color="success"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title={entry.change_summary || "No description"}
                          >
                            <Typography
                              sx={{
                                maxWidth: "300px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {entry.change_summary || "No description"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              navigate(`../${name}/${entry.version}`)
                            }
                          >
                            <ExpandMoreIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Container>
  );
};

// Main app component with layout and routing
const LayoutTemplate = ({ TopLevelMenu, FeatureMenu }) => {
  const navigate = useNavigate();

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
              onClick: () => {
                navigate("new");
              },
            },
          ],
        }}
        links={{
          home: { text: "Dashboard", to: "" },
          addItem: { text: "Add", to: "new", icon: <AddIcon /> },
          search: { text: "Search", to: "search", icon: <SearchIcon /> },
        }}
      >
        <Outlet />
      </FeatureMenu>
    </>
  );
};

const App = ({ TopLevelMenu, FeatureMenu }) => {
  // Create service instance
  const objectStorageService = createObjectStorageService(
    "http://localhost:3001/object-based-storage"
  );

  return (
    <Routes>
      <Route
        path="/object-based-storage/"
        element={
          <LayoutTemplate
            TopLevelMenu={TopLevelMenu}
            FeatureMenu={FeatureMenu}
          />
        }
      >
        <Route
          path=""
          element={<ObjectStorageListPage service={objectStorageService} />}
        />
        <Route
          path="new"
          element={<ObjectStorageFormPage service={objectStorageService} />}
        />
        <Route
          path=":name"
          element={<ObjectVersionListPage service={objectStorageService} />}
        />
        <Route
          path=":name/history"
          element={<ObjectHistoryPage service={objectStorageService} />}
        />
        <Route
          path=":name/latest"
          element={<Navigate to=".." relative="path" />}
        />
        <Route
          path=":name/:version"
          element={<ObjectVersionDetailPage service={objectStorageService} />}
        />
        <Route
          path=":name/:version/edit"
          element={
            <ObjectStorageFormPage
              service={objectStorageService}
              isEdit={true}
            />
          }
        />
      </Route>
    </Routes>
  );
};

export default App;
