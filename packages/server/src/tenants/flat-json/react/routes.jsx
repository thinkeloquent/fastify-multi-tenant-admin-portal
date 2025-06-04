import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
  useLocation,
  Link as RouterLink,
  Outlet,
} from "react-router-dom";
import { Provider, useSelector, useDispatch } from "react-redux";
import {
  configureStore,
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress,
  Tooltip,
  FormControlLabel,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Breadcrumbs,
  Link,
  Snackbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  FormHelperText,
  Skeleton,
  Switch,
} from "@mui/material";
import {
  Plus as AddIcon,
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  RotateCcw as RestoreIcon,
  Save as SaveIcon,
  Eye as VisibilityIcon,
  Filter as FilterListIcon,
  Code as CodeIcon,
  History as HistoryIcon,
  Database as DataObjectIcon,
  Search as SearchIcon,
  ArrowLeft as ArrowBackIcon,
  Lock as LockIcon,
  Unlock as LockOpenIcon,
  ChevronDown as ExpandMoreIcon,
  ChevronUp as ExpandLessIcon,
  Home as HomeIcon,
  HardDrive as StorageIcon,
  Layers as LayersIcon,
  GitBranch as AccountTreeIcon,
  Menu as MenuIcon,
  BarChart3 as DashboardIcon,
  Database as DatabaseIcon,
  ArrowUp as ArrowUpIcon,
  Tag as TagIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { unflatten } from "flat";
import "./routes.css";

const api = {
  baseUrl: "http://127.0.0.1:3001/flat-json",

  async fetchNextVersion(objectId) {
    const response = await fetch(
      `${this.baseUrl}/objects/${objectId}/next-version`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to fetch next version"
      );
    }
    return (await response.json()).data;
  },

  async fetchNextRevision(versionId) {
    const response = await fetch(
      `${this.baseUrl}/versions/${versionId}/next-revision`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to fetch next revision"
      );
    }
    return (await response.json()).data;
  },

  async createVersionWithIncrement(objectId, incrementType = "patch") {
    const response = await fetch(
      `${this.baseUrl}/objects/${objectId}/increment-version`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementType }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to create version");
    }
    return (await response.json()).data;
  },

  async createRevisionWithIncrement(versionId) {
    const response = await fetch(
      `${this.baseUrl}/versions/${versionId}/increment-revision`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to create revision");
    }
    return (await response.json()).data;
  },

  async fetchObjects() {
    const response = await fetch(`${this.baseUrl}/objects`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to fetch objects");
    }
    return (await response.json()).data;
  },

  async fetchObject(id) {
    const response = await fetch(`${this.baseUrl}/objects/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to fetch object");
    }
    return (await response.json()).data;
  },

  async createObject(data) {
    const response = await fetch(`${this.baseUrl}/objects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to create object");
    }
    return (await response.json()).data;
  },

  async updateObject(id, data) {
    const response = await fetch(`${this.baseUrl}/objects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to update object");
    }
    return (await response.json()).data;
  },

  async deleteObject(id) {
    const response = await fetch(`${this.baseUrl}/objects/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to delete object");
    }
    return await response.json();
  },

  async lockObject(id) {
    const response = await fetch(`${this.baseUrl}/objects/${id}/lock`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to lock object");
    }
    return (await response.json()).data;
  },

  async unlockObject(id) {
    const response = await fetch(`${this.baseUrl}/objects/${id}/unlock`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to unlock object");
    }
    return (await response.json()).data;
  },

  async fetchVersions() {
    const response = await fetch(`${this.baseUrl}/versions`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to fetch versions");
    }
    return (await response.json()).data;
  },

  async fetchObjectVersions(objectId) {
    const response = await fetch(
      `${this.baseUrl}/objects/${objectId}/versions`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to fetch object versions"
      );
    }
    return (await response.json()).data;
  },

  async fetchVersion(id) {
    const response = await fetch(`${this.baseUrl}/versions/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to fetch version");
    }
    return (await response.json()).data;
  },

  async createVersion(data) {
    const response = await fetch(`${this.baseUrl}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to create version");
    }
    return (await response.json()).data;
  },

  async updateVersion(id, data) {
    const response = await fetch(`${this.baseUrl}/versions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to update version");
    }
    return (await response.json()).data;
  },

  async deleteVersion(id) {
    const response = await fetch(`${this.baseUrl}/versions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to delete version");
    }
    return await response.json();
  },

  async lockVersion(id) {
    const response = await fetch(`${this.baseUrl}/versions/${id}/lock`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to lock version");
    }
    return (await response.json()).data;
  },

  async unlockVersion(id) {
    const response = await fetch(`${this.baseUrl}/versions/${id}/unlock`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to unlock version");
    }
    return (await response.json()).data;
  },

  async fetchRevisions() {
    const response = await fetch(`${this.baseUrl}/revisions`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to fetch revisions");
    }
    return (await response.json()).data;
  },

  async fetchVersionRevisions(versionId) {
    const response = await fetch(
      `${this.baseUrl}/versions/${versionId}/revisions`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to fetch version revisions"
      );
    }
    return (await response.json()).data;
  },

  async fetchRevision(id) {
    const response = await fetch(`${this.baseUrl}/revisions/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to fetch revision");
    }
    return (await response.json()).data;
  },

  async createRevision(data) {
    const response = await fetch(`${this.baseUrl}/revisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to create revision");
    }
    return (await response.json()).data;
  },

  async updateRevision(id, data) {
    const response = await fetch(`${this.baseUrl}/revisions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to update revision");
    }
    return (await response.json()).data;
  },

  async deleteRevision(id) {
    const response = await fetch(`${this.baseUrl}/revisions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to delete revision");
    }
    return await response.json();
  },

  async lockRevision(id) {
    const response = await fetch(`${this.baseUrl}/revisions/${id}/lock`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to lock revision");
    }
    return (await response.json()).data;
  },

  async unlockRevision(id) {
    const response = await fetch(`${this.baseUrl}/revisions/${id}/unlock`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to unlock revision");
    }
    return (await response.json()).data;
  },

  async fetchFlatProperties() {
    const response = await fetch(`${this.baseUrl}/`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to fetch flat properties"
      );
    }
    return (await response.json()).data;
  },

  async fetchFlatPropertyById(id) {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to fetch flat property"
      );
    }
    return (await response.json()).data;
  },

  async fetchRevisionFlatProperties(revisionId) {
    const response = await fetch(`${this.baseUrl}/revision/${revisionId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to fetch revision flat properties"
      );
    }
    return (await response.json()).data;
  },

  async createFlatProperty(data) {
    const response = await fetch(`${this.baseUrl}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to create flat property"
      );
    }
    return (await response.json()).data;
  },

  async updateFlatProperty(id, data) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to update flat property"
      );
    }
    return (await response.json()).data;
  },

  async deleteFlatProperty(id) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to delete flat property"
      );
    }
    return await response.json();
  },

  async restoreFlatProperty(id) {
    const response = await fetch(`${this.baseUrl}/${id}/restore`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to restore flat property"
      );
    }
    return (await response.json()).data;
  },

  async unflattenRevision(revisionId) {
    const response = await fetch(
      `${this.baseUrl}/revision/${revisionId}/unflatten`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to unflatten revision"
      );
    }
    return (await response.json()).data;
  },

  async unflattenVersion(versionId) {
    const response = await fetch(
      `${this.baseUrl}/version/${versionId}/unflatten`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to unflatten version"
      );
    }
    return (await response.json()).data;
  },

  async unflattenObject(objectId) {
    const response = await fetch(
      `${this.baseUrl}/object/${objectId}/unflatten`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to unflatten object");
    }
    return (await response.json()).data;
  },

  async fetchChangelog() {
    const response = await fetch(`${this.baseUrl}/changelog`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(", ") || "Failed to fetch changelog");
    }
    return (await response.json()).data;
  },

  async fetchObjectChangelog(objectId) {
    const response = await fetch(
      `${this.baseUrl}/changelog/object/${objectId}`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to fetch object changelog"
      );
    }
    return (await response.json()).data;
  },

  async fetchVersionChangelog(versionId) {
    const response = await fetch(
      `${this.baseUrl}/changelog/version/${versionId}`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to fetch version changelog"
      );
    }
    return (await response.json()).data;
  },

  async fetchRevisionChangelog(revisionId) {
    const response = await fetch(
      `${this.baseUrl}/changelog/revision/${revisionId}`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.errors?.join(", ") || "Failed to fetch revision changelog"
      );
    }
    return (await response.json()).data;
  },
};

const sharedData = {
  supportedFlatPropertyTypes: [
    "string",
    "number",
    "boolean",
    "object",
    "array",
    "null",
    "custom",
  ],
  statusOptions: ["active", "draft", "deprecated"],
};

const fetchObjects = createAsyncThunk(
  "objects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await api.fetchObjects();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchObject = createAsyncThunk(
  "objects/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      return await api.fetchObject(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const createObject = createAsyncThunk(
  "objects/create",
  async (data, { rejectWithValue }) => {
    try {
      return await api.createObject(data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const updateObject = createAsyncThunk(
  "objects/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await api.updateObject(id, data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const deleteObject = createAsyncThunk(
  "objects/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteObject(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const lockObject = createAsyncThunk(
  "objects/lock",
  async (id, { rejectWithValue }) => {
    try {
      return await api.lockObject(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const unlockObject = createAsyncThunk(
  "objects/unlock",
  async (id, { rejectWithValue }) => {
    try {
      return await api.unlockObject(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchVersions = createAsyncThunk(
  "versions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await api.fetchVersions();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchObjectVersions = createAsyncThunk(
  "versions/fetchByObject",
  async (objectId, { rejectWithValue }) => {
    try {
      return await api.fetchObjectVersions(objectId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchVersion = createAsyncThunk(
  "versions/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      return await api.fetchVersion(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const createVersion = createAsyncThunk(
  "versions/create",
  async (data, { rejectWithValue }) => {
    try {
      return await api.createVersion(data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const createVersionWithIncrement = createAsyncThunk(
  "versions/createWithIncrement",
  async ({ objectId, incrementType }, { rejectWithValue }) => {
    try {
      return await api.createVersionWithIncrement(objectId, incrementType);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const updateVersion = createAsyncThunk(
  "versions/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await api.updateVersion(id, data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const deleteVersion = createAsyncThunk(
  "versions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteVersion(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const lockVersion = createAsyncThunk(
  "versions/lock",
  async (id, { rejectWithValue }) => {
    try {
      return await api.lockVersion(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const unlockVersion = createAsyncThunk(
  "versions/unlock",
  async (id, { rejectWithValue }) => {
    try {
      return await api.unlockVersion(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchRevisions = createAsyncThunk(
  "revisions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await api.fetchRevisions();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchVersionRevisions = createAsyncThunk(
  "revisions/fetchByVersion",
  async (versionId, { rejectWithValue }) => {
    try {
      return await api.fetchVersionRevisions(versionId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchRevision = createAsyncThunk(
  "revisions/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      return await api.fetchRevision(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const createRevision = createAsyncThunk(
  "revisions/create",
  async (data, { rejectWithValue }) => {
    try {
      return await api.createRevision(data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const createRevisionWithIncrement = createAsyncThunk(
  "revisions/createWithIncrement",
  async (versionId, { rejectWithValue }) => {
    try {
      return await api.createRevisionWithIncrement(versionId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const updateRevision = createAsyncThunk(
  "revisions/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await api.updateRevision(id, data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const deleteRevision = createAsyncThunk(
  "revisions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteRevision(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const lockRevision = createAsyncThunk(
  "revisions/lock",
  async (id, { rejectWithValue }) => {
    try {
      return await api.lockRevision(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const unlockRevision = createAsyncThunk(
  "revisions/unlock",
  async (id, { rejectWithValue }) => {
    try {
      return await api.unlockRevision(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchFlatProperties = createAsyncThunk(
  "flatProperties/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await api.fetchFlatProperties();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchFlatPropertyById = createAsyncThunk(
  "flatProperties/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      return await api.fetchFlatPropertyById(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchRevisionFlatProperties = createAsyncThunk(
  "flatProperties/fetchByRevision",
  async (revisionId, { rejectWithValue }) => {
    try {
      return await api.fetchRevisionFlatProperties(revisionId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const createFlatProperty = createAsyncThunk(
  "flatProperties/create",
  async (data, { rejectWithValue }) => {
    try {
      return await api.createFlatProperty(data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const updateFlatProperty = createAsyncThunk(
  "flatProperties/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await api.updateFlatProperty(id, data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const deleteFlatProperty = createAsyncThunk(
  "flatProperties/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteFlatProperty(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const restoreFlatProperty = createAsyncThunk(
  "flatProperties/restore",
  async (id, { rejectWithValue }) => {
    try {
      return await api.restoreFlatProperty(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const unflattenRevision = createAsyncThunk(
  "flatProperties/unflattenRevision",
  async (revisionId, { rejectWithValue }) => {
    try {
      return await api.unflattenRevision(revisionId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const unflattenVersion = createAsyncThunk(
  "flatProperties/unflattenVersion",
  async (versionId, { rejectWithValue }) => {
    try {
      return await api.unflattenVersion(versionId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const unflattenObject = createAsyncThunk(
  "flatProperties/unflattenObject",
  async (objectId, { rejectWithValue }) => {
    try {
      return await api.unflattenObject(objectId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchChangelog = createAsyncThunk(
  "changelog/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await api.fetchChangelog();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchObjectChangelog = createAsyncThunk(
  "changelog/fetchByObject",
  async (objectId, { rejectWithValue }) => {
    try {
      return await api.fetchObjectChangelog(objectId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchVersionChangelog = createAsyncThunk(
  "changelog/fetchByVersion",
  async (versionId, { rejectWithValue }) => {
    try {
      return await api.fetchVersionChangelog(versionId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchRevisionChangelog = createAsyncThunk(
  "changelog/fetchByRevision",
  async (revisionId, { rejectWithValue }) => {
    try {
      return await api.fetchRevisionChangelog(revisionId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchNextVersion = createAsyncThunk(
  "versioning/fetchNextVersion",
  async (objectId, { rejectWithValue }) => {
    try {
      return await api.fetchNextVersion(objectId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const fetchNextRevision = createAsyncThunk(
  "versioning/fetchNextRevision",
  async (versionId, { rejectWithValue }) => {
    try {
      return await api.fetchNextRevision(versionId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const objectsSlice = createSlice({
  name: "objects",
  initialState: {
    items: [],
    currentObject: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearObjectError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchObjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchObjects.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchObjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchObject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchObject.fulfilled, (state, action) => {
        state.currentObject = action.payload;
        state.loading = false;
      })
      .addCase(fetchObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createObject.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateObject.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentObject?.id === action.payload.id) {
          state.currentObject = action.payload;
        }
      })
      .addCase(deleteObject.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], is_active: false };
        }
        if (state.currentObject?.id === action.payload) {
          state.currentObject = { ...state.currentObject, is_active: false };
        }
      })
      .addCase(lockObject.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentObject?.id === action.payload.id) {
          state.currentObject = action.payload;
        }
      })
      .addCase(unlockObject.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentObject?.id === action.payload.id) {
          state.currentObject = action.payload;
        }
      });
  },
});

const versionsSlice = createSlice({
  name: "versions",
  initialState: {
    items: [],
    objectVersions: [],
    currentVersion: null,
    nextVersionInfo: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearVersionError: (state) => {
      state.error = null;
    },
    clearNextVersionInfo: (state) => {
      state.nextVersionInfo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVersions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVersions.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchVersions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchObjectVersions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchObjectVersions.fulfilled, (state, action) => {
        state.objectVersions = action.payload;
        state.loading = false;
      })
      .addCase(fetchObjectVersions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchVersion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVersion.fulfilled, (state, action) => {
        state.currentVersion = action.payload;
        state.loading = false;
      })
      .addCase(fetchVersion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createVersion.fulfilled, (state, action) => {
        state.items.push(action.payload);
        if (
          state.objectVersions.length > 0 &&
          state.objectVersions[0].object_id === action.payload.object_id
        ) {
          state.objectVersions.push(action.payload);
        }
      })
      .addCase(createVersionWithIncrement.fulfilled, (state, action) => {
        state.items.push(action.payload);
        if (
          state.objectVersions.length > 0 &&
          state.objectVersions[0].object_id === action.payload.object_id
        ) {
          state.objectVersions.push(action.payload);
        }
      })
      .addCase(updateVersion.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        const objIndex = state.objectVersions.findIndex(
          (item) => item.id === action.payload.id
        );
        if (objIndex !== -1) {
          state.objectVersions[objIndex] = action.payload;
        }

        if (state.currentVersion?.id === action.payload.id) {
          state.currentVersion = action.payload;
        }
      })
      .addCase(deleteVersion.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], is_active: false };
        }

        const objIndex = state.objectVersions.findIndex(
          (item) => item.id === action.payload
        );
        if (objIndex !== -1) {
          state.objectVersions[objIndex] = {
            ...state.objectVersions[objIndex],
            is_active: false,
          };
        }

        if (state.currentVersion?.id === action.payload) {
          state.currentVersion = { ...state.currentVersion, is_active: false };
        }
      })
      .addCase(lockVersion.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        const objIndex = state.objectVersions.findIndex(
          (item) => item.id === action.payload.id
        );
        if (objIndex !== -1) {
          state.objectVersions[objIndex] = action.payload;
        }

        if (state.currentVersion?.id === action.payload.id) {
          state.currentVersion = action.payload;
        }
      })
      .addCase(unlockVersion.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        const objIndex = state.objectVersions.findIndex(
          (item) => item.id === action.payload.id
        );
        if (objIndex !== -1) {
          state.objectVersions[objIndex] = action.payload;
        }

        if (state.currentVersion?.id === action.payload.id) {
          state.currentVersion = action.payload;
        }
      })
      .addCase(fetchNextVersion.fulfilled, (state, action) => {
        state.nextVersionInfo = action.payload;
      });
  },
});

const revisionsSlice = createSlice({
  name: "revisions",
  initialState: {
    items: [],
    versionRevisions: [],
    currentRevision: null,
    nextRevisionInfo: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearRevisionError: (state) => {
      state.error = null;
    },
    clearNextRevisionInfo: (state) => {
      state.nextRevisionInfo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevisions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevisions.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchRevisions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchVersionRevisions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVersionRevisions.fulfilled, (state, action) => {
        state.versionRevisions = action.payload;
        state.loading = false;
      })
      .addCase(fetchVersionRevisions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRevision.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevision.fulfilled, (state, action) => {
        state.currentRevision = action.payload;
        state.loading = false;
      })
      .addCase(fetchRevision.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createRevision.fulfilled, (state, action) => {
        state.items.push(action.payload);
        if (
          state.versionRevisions.length > 0 &&
          state.versionRevisions[0].version_id === action.payload.version_id
        ) {
          state.versionRevisions.push(action.payload);
        }
      })
      .addCase(createRevisionWithIncrement.fulfilled, (state, action) => {
        state.items.push(action.payload);
        if (
          state.versionRevisions.length > 0 &&
          state.versionRevisions[0].version_id === action.payload.version_id
        ) {
          state.versionRevisions.push(action.payload);
        }
      })
      .addCase(updateRevision.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        const versionIndex = state.versionRevisions.findIndex(
          (item) => item.id === action.payload.id
        );
        if (versionIndex !== -1) {
          state.versionRevisions[versionIndex] = action.payload;
        }

        if (state.currentRevision?.id === action.payload.id) {
          state.currentRevision = action.payload;
        }
      })
      .addCase(deleteRevision.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], is_active: false };
        }

        const versionIndex = state.versionRevisions.findIndex(
          (item) => item.id === action.payload
        );
        if (versionIndex !== -1) {
          state.versionRevisions[versionIndex] = {
            ...state.versionRevisions[versionIndex],
            is_active: false,
          };
        }

        if (state.currentRevision?.id === action.payload) {
          state.currentRevision = {
            ...state.currentRevision,
            is_active: false,
          };
        }
      })
      .addCase(lockRevision.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        const versionIndex = state.versionRevisions.findIndex(
          (item) => item.id === action.payload.id
        );
        if (versionIndex !== -1) {
          state.versionRevisions[versionIndex] = action.payload;
        }

        if (state.currentRevision?.id === action.payload.id) {
          state.currentRevision = action.payload;
        }
      })
      .addCase(unlockRevision.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        const versionIndex = state.versionRevisions.findIndex(
          (item) => item.id === action.payload.id
        );
        if (versionIndex !== -1) {
          state.versionRevisions[versionIndex] = action.payload;
        }

        if (state.currentRevision?.id === action.payload.id) {
          state.currentRevision = action.payload;
        }
      })
      .addCase(fetchNextRevision.fulfilled, (state, action) => {
        state.nextRevisionInfo = action.payload;
      });
  },
});

const flatPropertiesSlice = createSlice({
  name: "flatProperties",
  initialState: {
    items: [],
    revisionFlatProperties: [],
    versionFlatProperties: [],
    objectFlatProperties: [],
    currentFlatProperty: null,
    unflattenedData: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearFlatPropertyError: (state) => {
      state.error = null;
    },
    clearUnflattenedData: (state) => {
      state.unflattenedData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlatProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlatProperties.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchFlatProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFlatPropertyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlatPropertyById.fulfilled, (state, action) => {
        state.currentFlatProperty = action.payload;
        state.loading = false;
      })
      .addCase(fetchFlatPropertyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRevisionFlatProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevisionFlatProperties.fulfilled, (state, action) => {
        state.revisionFlatProperties = action.payload;
        state.loading = false;
      })
      .addCase(fetchRevisionFlatProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createFlatProperty.fulfilled, (state, action) => {
        state.items.push(action.payload);
        if (
          state.revisionFlatProperties.length > 0 &&
          state.revisionFlatProperties[0].revision_id ===
            action.payload.revision_id
        ) {
          state.revisionFlatProperties.push(action.payload);
        }
      })
      .addCase(updateFlatProperty.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        const revIndex = state.revisionFlatProperties.findIndex(
          (item) => item.id === action.payload.id
        );
        if (revIndex !== -1) {
          state.revisionFlatProperties[revIndex] = action.payload;
        }

        if (state.currentFlatProperty?.id === action.payload.id) {
          state.currentFlatProperty = action.payload;
        }
      })
      .addCase(deleteFlatProperty.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], is_active: false };
        }

        const revIndex = state.revisionFlatProperties.findIndex(
          (item) => item.id === action.payload
        );
        if (revIndex !== -1) {
          state.revisionFlatProperties[revIndex] = {
            ...state.revisionFlatProperties[revIndex],
            is_active: false,
          };
        }

        if (state.currentFlatProperty?.id === action.payload) {
          state.currentFlatProperty = {
            ...state.currentFlatProperty,
            is_active: false,
          };
        }
      })
      .addCase(restoreFlatProperty.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        const revIndex = state.revisionFlatProperties.findIndex(
          (item) => item.id === action.payload.id
        );
        if (revIndex !== -1) {
          state.revisionFlatProperties[revIndex] = action.payload;
        }

        if (state.currentFlatProperty?.id === action.payload.id) {
          state.currentFlatProperty = action.payload;
        }
      })
      .addCase(unflattenRevision.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unflattenRevision.fulfilled, (state, action) => {
        state.unflattenedData = action.payload;
        state.loading = false;
      })
      .addCase(unflattenRevision.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(unflattenVersion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unflattenVersion.fulfilled, (state, action) => {
        state.unflattenedData = action.payload;
        state.loading = false;
      })
      .addCase(unflattenVersion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(unflattenObject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unflattenObject.fulfilled, (state, action) => {
        state.unflattenedData = action.payload;
        state.loading = false;
      })
      .addCase(unflattenObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

const changelogSlice = createSlice({
  name: "changelog",
  initialState: {
    items: [],
    objectChangelog: [],
    versionChangelog: [],
    revisionChangelog: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearChangelogError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChangelog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChangelog.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchChangelog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchObjectChangelog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchObjectChangelog.fulfilled, (state, action) => {
        state.objectChangelog = action.payload;
        state.loading = false;
      })
      .addCase(fetchObjectChangelog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchVersionChangelog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVersionChangelog.fulfilled, (state, action) => {
        state.versionChangelog = action.payload;
        state.loading = false;
      })
      .addCase(fetchVersionChangelog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRevisionChangelog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevisionChangelog.fulfilled, (state, action) => {
        state.revisionChangelog = action.payload;
        state.loading = false;
      })
      .addCase(fetchRevisionChangelog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

const versioningSlice = createSlice({
  name: "versioning",
  initialState: {
    nextVersionInfo: null,
    nextRevisionInfo: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearVersioningError: (state) => {
      state.error = null;
    },
    clearNextVersionInfo: (state) => {
      state.nextVersionInfo = null;
    },
    clearNextRevisionInfo: (state) => {
      state.nextRevisionInfo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNextVersion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNextVersion.fulfilled, (state, action) => {
        state.nextVersionInfo = action.payload;
        state.loading = false;
      })
      .addCase(fetchNextVersion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchNextRevision.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNextRevision.fulfilled, (state, action) => {
        state.nextRevisionInfo = action.payload;
        state.loading = false;
      })
      .addCase(fetchNextRevision.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    notification: {
      open: false,
      message: "",
      type: "info",
    },
    sidebarOpen: true,
    confirmDialog: {
      open: false,
      title: "",
      message: "",
      actionId: null,
      actionData: null,
    },
  },
  reducers: {
    showNotification(state, action) {
      state.notification = {
        open: true,
        message: action.payload.message,
        type: action.payload.type || "info",
      };
    },
    hideNotification(state) {
      state.notification.open = false;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    showConfirmDialog(state, action) {
      state.confirmDialog = {
        open: true,
        title: action.payload.title || "Confirm Action",
        message: action.payload.message || "Are you sure you want to proceed?",
        actionId: action.payload.actionId,
        actionData: action.payload.actionData,
      };
    },
    hideConfirmDialog(state) {
      state.confirmDialog.open = false;
      state.confirmDialog.actionId = null;
      state.confirmDialog.actionData = null;
    },
  },
});

export const {
  showNotification,
  hideNotification,
  toggleSidebar,
  showConfirmDialog,
  hideConfirmDialog,
} = uiSlice.actions;

export const { clearFlatPropertyError, clearUnflattenedData } =
  flatPropertiesSlice.actions;
export const { clearObjectError } = objectsSlice.actions;
export const { clearVersionError, clearNextVersionInfo } =
  versionsSlice.actions;
export const { clearRevisionError, clearNextRevisionInfo } =
  revisionsSlice.actions;
export const { clearChangelogError } = changelogSlice.actions;
export const { clearVersioningError } = versioningSlice.actions;

const store = configureStore({
  reducer: {
    objects: objectsSlice.reducer,
    versions: versionsSlice.reducer,
    revisions: revisionsSlice.reducer,
    flatProperties: flatPropertiesSlice.reducer,
    changelog: changelogSlice.reducer,
    versioning: versioningSlice.reducer,
    ui: uiSlice.reducer,
  },
});

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563eb",
    },
    secondary: {
      main: "#7c3aed",
    },
    background: {
      default: "#f7fafc",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

const ConfirmDialog = () => {
  const dispatch = useDispatch();
  const { confirmDialog } = useSelector((state) => state.ui);

  const handleConfirm = async () => {
    const { actionId, actionData } = confirmDialog;

    try {
      switch (actionId) {
        case "DELETE_OBJECT":
          await dispatch(deleteObject(actionData.id)).unwrap();
          dispatch(
            showNotification({
              message: "Object deleted successfully",
              type: "success",
            })
          );
          break;
        case "DELETE_VERSION":
          await dispatch(deleteVersion(actionData.id)).unwrap();
          dispatch(
            showNotification({
              message: "Version deleted successfully",
              type: "success",
            })
          );
          break;
        case "DELETE_REVISION":
          await dispatch(deleteRevision(actionData.id)).unwrap();
          dispatch(
            showNotification({
              message: "Revision deleted successfully",
              type: "success",
            })
          );
          break;
        case "DELETE_FLAT_PROPERTY":
          await dispatch(deleteFlatProperty(actionData.id)).unwrap();
          dispatch(
            showNotification({
              message: "Flat Property deleted successfully",
              type: "success",
            })
          );
          break;
        default:
          break;
      }
    } catch (err) {
      dispatch(
        showNotification({
          message: `Failed to delete: ${err}`,
          type: "error",
        })
      );
    }

    dispatch(hideConfirmDialog());
  };

  const handleCancel = () => {
    dispatch(hideConfirmDialog());
  };

  return (
    <Dialog open={confirmDialog.open} onClose={handleCancel}>
      <DialogTitle>{confirmDialog.title}</DialogTitle>
      <DialogContent>
        <Typography>{confirmDialog.message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleConfirm} color="primary" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const StatusChip = ({ active, locked }) => {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Chip
        size="small"
        label={active ? "Active" : "Inactive"}
        color={active ? "success" : "default"}
      />
      {locked && <Chip size="small" label="Locked" color="warning" />}
    </Box>
  );
};

const VersionChip = ({ version, isSemanticVersion = false }) => {
  return (
    <Chip
      size="small"
      label={version}
      color={isSemanticVersion ? "primary" : "default"}
      icon={isSemanticVersion ? <TagIcon size={16} /> : undefined}
      variant={isSemanticVersion ? "filled" : "outlined"}
    />
  );
};

const RevisionChip = ({ revisionUuid, truncate = true }) => {
  const displayValue = truncate
    ? revisionUuid.substring(0, 8) + "..."
    : revisionUuid;

  return (
    <Tooltip title={revisionUuid}>
      <Chip
        size="small"
        label={displayValue}
        color="success"
        variant="outlined"
        className="revision-uuid-chip"
      />
    </Tooltip>
  );
};

const TopLevelMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  let title = "FlatJSON Metadata Management";

  if (pathname.includes("/objects")) {
    title = "Objects";
  } else if (pathname.includes("/versions")) {
    title = "Versions";
  } else if (pathname.includes("/revisions")) {
    title = "Revisions";
  } else if (pathname.includes("/flat-properties")) {
    title = "Flat Properties";
  } else if (pathname.includes("/changelog")) {
    title = "Audit Log";
  } else if (pathname === "/flat-json" || pathname === "/flat-json/") {
    title = "Dashboard";
  }

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => {
              if (
                pathname.includes("/objects") ||
                pathname === "/flat-json" ||
                pathname === "/flat-json/"
              ) {
                navigate("/flat-json/objects/new");
              } else if (pathname.includes("/versions")) {
                navigate("/flat-json/versions/new");
              } else if (pathname.includes("/revisions")) {
                navigate("/flat-json/revisions/new");
              } else if (pathname.includes("/flat-properties")) {
                navigate("/flat-json/flat-properties/new");
              }
            }}
          >
            {pathname.includes("/objects") ||
            pathname === "/flat-json" ||
            pathname === "/flat-json/"
              ? "New Object"
              : pathname.includes("/versions")
                ? "New Version"
                : pathname.includes("/revisions")
                  ? "New Revision"
                  : pathname.includes("/flat-properties")
                    ? "New Flat Property"
                    : ""}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const FeatureMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state) => state.ui);

  const [objectsOpen, setObjectsOpen] = useState(true);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <Drawer
      variant="permanent"
      open={sidebarOpen}
      sx={{
        width: sidebarOpen ? 240 : 70,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: sidebarOpen ? 240 : 70,
          boxSizing: "border-box",
          transition: "width 0.2s",
          overflowX: "hidden",
        },
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarOpen ? "flex-end" : "center",
          px: [1],
        }}
      >
        {sidebarOpen && (
          <Typography variant="h6" sx={{ mr: "auto" }}>
            FlatJSON
          </Typography>
        )}
        <IconButton onClick={handleToggleSidebar}>
          <MenuIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List component="nav">
        <ListItemButton
          selected={
            location.pathname === "/flat-json" ||
            location.pathname === "/flat-json/"
          }
          onClick={() => navigate("/flat-json")}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          {sidebarOpen && <ListItemText primary="Dashboard" />}
        </ListItemButton>

        <ListItemButton onClick={() => setObjectsOpen(!objectsOpen)}>
          <ListItemIcon>
            <StorageIcon />
          </ListItemIcon>
          {sidebarOpen && (
            <>
              <ListItemText primary="Objects" />
              {objectsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </>
          )}
        </ListItemButton>

        <Collapse in={objectsOpen && sidebarOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === "/flat-json/objects"}
              onClick={() => navigate("/flat-json/objects")}
            >
              <ListItemIcon>
                <DataObjectIcon />
              </ListItemIcon>
              <ListItemText primary="All Objects" />
            </ListItemButton>

            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === "/flat-json/versions"}
              onClick={() => navigate("/flat-json/versions")}
            >
              <ListItemIcon>
                <LayersIcon />
              </ListItemIcon>
              <ListItemText primary="All Versions" />
            </ListItemButton>

            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === "/flat-json/revisions"}
              onClick={() => navigate("/flat-json/revisions")}
            >
              <ListItemIcon>
                <AccountTreeIcon />
              </ListItemIcon>
              <ListItemText primary="All Revisions" />
            </ListItemButton>
          </List>
        </Collapse>

        <ListItemButton
          selected={location.pathname === "/flat-json/flat-properties"}
          onClick={() => navigate("/flat-json/flat-properties")}
        >
          <ListItemIcon>
            <DatabaseIcon />
          </ListItemIcon>
          {sidebarOpen && <ListItemText primary="Flat Properties" />}
        </ListItemButton>

        <ListItemButton
          selected={location.pathname === "/flat-json/changelog"}
          onClick={() => navigate("/flat-json/changelog")}
        >
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          {sidebarOpen && <ListItemText primary="Audit Log" />}
        </ListItemButton>
      </List>
    </Drawer>
  );
};

const Notifications = () => {
  const dispatch = useDispatch();
  const { notification } = useSelector((state) => state.ui);

  const handleClose = () => {
    dispatch(hideNotification());
  };

  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={handleClose}
        severity={notification.type}
        sx={{ width: "100%" }}
        elevation={6}
        variant="filled"
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

const LayoutTemplate = ({ TopLevelMenu, FeatureMenu }) => {
  const { sidebarOpen } = useSelector((state) => state.ui);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CssBaseline />
      <TopLevelMenu />
      <FeatureMenu />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: "64px",
          overflowY: "auto",
          transition: "margin-left 0.2s",
          marginLeft: sidebarOpen ? "240px" : "70px",
        }}
      >
        <Outlet />
      </Box>
      <Notifications />
      <ConfirmDialog />
    </Box>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const { items: objects, loading: objectsLoading } = useSelector(
    (state) => state.objects
  );
  const { items: versions, loading: versionsLoading } = useSelector(
    (state) => state.versions
  );
  const { items: revisions, loading: revisionsLoading } = useSelector(
    (state) => state.revisions
  );
  const { items: flatProperties, loading: flatPropertiesLoading } = useSelector(
    (state) => state.flatProperties
  );
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchObjects());
    dispatch(fetchVersions());
    dispatch(fetchRevisions());
    dispatch(fetchFlatProperties());
  }, [dispatch]);

  const activeObjects = objects.filter((obj) => obj.is_active).length;
  const activeVersions = versions.filter((ver) => ver.is_active).length;
  const activeRevisions = revisions.filter((rev) => rev.is_active).length;
  const activeFlatProperties = flatProperties.filter(
    (fp) => fp.is_active
  ).length;

  const renderSummaryCard = (title, count, icon, loading, onClick) => (
    <Card className="stat-card" onClick={onClick}>
      <CardContent>
        <Box className="stat-title">
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {icon}
        </Box>
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={60} />
        ) : (
          <Typography variant="h3" component="div" className="stat-count">
            {count}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={3}>
          {renderSummaryCard(
            "Objects",
            activeObjects,
            <StorageIcon color="primary" />,
            objectsLoading,
            () => navigate("/flat-json/objects")
          )}
        </Grid>
        <Grid item size={3}>
          {renderSummaryCard(
            "Versions",
            activeVersions,
            <LayersIcon color="secondary" />,
            versionsLoading,
            () => navigate("/flat-json/versions")
          )}
        </Grid>
        <Grid item size={3}>
          {renderSummaryCard(
            "Revisions",
            activeRevisions,
            <AccountTreeIcon sx={{ color: "success.main" }} />,
            revisionsLoading,
            () => navigate("/flat-json/revisions")
          )}
        </Grid>
        <Grid item size={3}>
          {renderSummaryCard(
            "Flat Properties",
            activeFlatProperties,
            <DatabaseIcon sx={{ color: "info.main" }} />,
            flatPropertiesLoading,
            () => navigate("/flat-json/flat-properties")
          )}
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent Objects
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Versions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {objectsLoading
              ? Array.from(new Array(3)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                  </TableRow>
                ))
              : objects.slice(0, 5).map((object) => (
                  <TableRow key={object.id}>
                    <TableCell>{object.name}</TableCell>
                    <TableCell>
                      <StatusChip
                        active={object.is_active}
                        locked={object.is_locked}
                      />
                    </TableCell>
                    <TableCell>
                      {object.flat_json_versions?.length || 0}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(`/flat-json/objects/${object.id}`)
                          }
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/flat-json/objects/new")}
        >
          Create New Object
        </Button>
      </Box>
    </Box>
  );
};

const ObjectList = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.objects);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchObjects());
  }, [dispatch]);

  const handleDelete = (id) => {
    dispatch(
      showConfirmDialog({
        title: "Delete Object",
        message:
          "Are you sure you want to delete this object? This action will make the object inactive.",
        actionId: "DELETE_OBJECT",
        actionData: { id },
      })
    );
  };

  const handleLock = async (id) => {
    try {
      await dispatch(lockObject(id)).unwrap();
      dispatch(
        showNotification({
          message: "Object locked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to lock: ${err}`, type: "error" })
      );
    }
  };

  const handleUnlock = async (id) => {
    try {
      await dispatch(unlockObject(id)).unwrap();
      dispatch(
        showNotification({
          message: "Object unlocked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to unlock: ${err}`, type: "error" })
      );
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await dispatch(
        updateObject({ id, data: { is_active: !currentActive } })
      ).unwrap();
      dispatch(
        showNotification({
          message: `Object ${!currentActive ? "enabled" : "disabled"} successfully`,
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to update: ${err}`, type: "error" })
      );
    }
  };

  const filteredObjects = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "active") return item.is_active;
    if (filter === "inactive") return !item.is_active;
    if (filter === "locked") return item.is_locked;
    return true;
  });

  if (loading && items.length === 0) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ py: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Paper sx={{ p: 1 }}>
          <Tabs
            value={filter}
            onChange={(e, value) => setFilter(value)}
            aria-label="object filter tabs"
          >
            <Tab label="All" value="all" />
            <Tab label="Active" value="active" />
            <Tab label="Inactive" value="inactive" />
            <Tab label="Locked" value="locked" />
          </Tabs>
        </Paper>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/flat-json/objects/new")}
        >
          New Object
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {filteredObjects.map((object) => (
          <Grid item size={4} key={object.id}>
            <Card className="card-hoverable">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {object.name}
                  </Typography>
                  <Box>
                    <StatusChip
                      active={object.is_active}
                      locked={object.is_locked}
                    />
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {object.description || "No description provided"}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2">
                    Created: {new Date(object.created_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Versions: {object.flat_json_versions?.length || 0}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate(`/flat-json/objects/${object.id}`)}
                >
                  View
                </Button>

                {!object.is_locked && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() =>
                      navigate(`/flat-json/objects/${object.id}/edit`)
                    }
                  >
                    Edit
                  </Button>
                )}

                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(object.id)}
                  disabled={object.is_locked}
                >
                  Delete
                </Button>

                {object.is_locked ? (
                  <Button
                    size="small"
                    color="warning"
                    startIcon={<LockOpenIcon />}
                    onClick={() => handleUnlock(object.id)}
                  >
                    Unlock
                  </Button>
                ) : (
                  <Button
                    size="small"
                    color="warning"
                    startIcon={<LockIcon />}
                    onClick={() => handleLock(object.id)}
                  >
                    Lock
                  </Button>
                )}

                <Button
                  size="small"
                  color={object.is_active ? "error" : "success"}
                  onClick={() =>
                    handleToggleActive(object.id, object.is_active)
                  }
                  disabled={object.is_locked}
                >
                  {object.is_active ? "Disable" : "Enable"}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredObjects.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography>No objects found.</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate("/flat-json/objects/new")}
            sx={{ mt: 2 }}
          >
            Create New Object
          </Button>
        </Paper>
      )}
    </Box>
  );
};

const ObjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = Boolean(id);
  const { currentObject, loading, error } = useSelector(
    (state) => state.objects
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchObject(id));
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentObject) {
      reset({
        name: currentObject.name,
        description: currentObject.description,
      });
    }
  }, [currentObject, isEditMode, reset]);

  const handleDelete = () => {
    dispatch(
      showConfirmDialog({
        title: "Delete Object",
        message:
          "Are you sure you want to delete this object? This action will make the object inactive.",
        actionId: "DELETE_OBJECT",
        actionData: { id },
      })
    );
  };

  const handleLock = async () => {
    try {
      await dispatch(lockObject(id)).unwrap();
      dispatch(
        showNotification({
          message: "Object locked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to lock: ${err}`, type: "error" })
      );
    }
  };

  const handleUnlock = async () => {
    try {
      await dispatch(unlockObject(id)).unwrap();
      dispatch(
        showNotification({
          message: "Object unlocked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to unlock: ${err}`, type: "error" })
      );
    }
  };

  const handleToggleActive = async () => {
    try {
      await dispatch(
        updateObject({
          id,
          data: { is_active: !currentObject.is_active },
        })
      ).unwrap();
      dispatch(
        showNotification({
          message: `Object ${!currentObject.is_active ? "enabled" : "disabled"} successfully`,
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to update: ${err}`, type: "error" })
      );
    }
  };

  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await dispatch(updateObject({ id, data })).unwrap();
        dispatch(
          showNotification({
            message: "Object updated successfully",
            type: "success",
          })
        );
      } else {
        await dispatch(createObject(data)).unwrap();
        dispatch(
          showNotification({
            message: "Object created successfully",
            type: "success",
          })
        );
      }
      navigate("/flat-json/objects");
    } catch (err) {
      dispatch(showNotification({ message: err, type: "error" }));
    }
  };

  if (isEditMode && loading && !currentObject) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ py: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          color="inherit"
          onClick={() => navigate("/flat-json/objects")}
          sx={{ cursor: "pointer" }}
        >
          Objects
        </Link>
        {isEditMode && currentObject && (
          <Link
            color="inherit"
            onClick={() => navigate(`/flat-json/objects/${id}`)}
            sx={{ cursor: "pointer" }}
          >
            {currentObject.name}
          </Link>
        )}
        <Typography color="text.primary">
          {isEditMode ? "Edit" : "Create"} Object
        </Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ mb: 3 }}>
        {isEditMode ? "Edit Object" : "Create New Object"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item size={12}>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Name"
                    fullWidth
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item size={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    multiline
                    rows={4}
                    fullWidth
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/flat-json/objects")}
              startIcon={<ArrowBackIcon />}
            >
              Cancel
            </Button>

            <Box sx={{ display: "flex", gap: 2 }}>
              {isEditMode && currentObject && (
                <>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    disabled={currentObject.is_locked}
                  >
                    Delete
                  </Button>

                  {currentObject.is_locked ? (
                    <Button
                      color="warning"
                      startIcon={<LockOpenIcon />}
                      onClick={handleUnlock}
                    >
                      Unlock
                    </Button>
                  ) : (
                    <Button
                      color="warning"
                      startIcon={<LockIcon />}
                      onClick={handleLock}
                    >
                      Lock
                    </Button>
                  )}

                  <Button
                    color={currentObject.is_active ? "error" : "success"}
                    onClick={handleToggleActive}
                    disabled={currentObject.is_locked}
                  >
                    {currentObject.is_active ? "Disable" : "Enable"}
                  </Button>
                </>
              )}

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const VersionList = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.versions);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchVersions());
  }, [dispatch]);

  const handleDelete = (id) => {
    dispatch(
      showConfirmDialog({
        title: "Delete Version",
        message:
          "Are you sure you want to delete this version? This action will make the version inactive.",
        actionId: "DELETE_VERSION",
        actionData: { id },
      })
    );
  };

  const handleLock = async (id) => {
    try {
      await dispatch(lockVersion(id)).unwrap();
      dispatch(
        showNotification({
          message: "Version locked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to lock: ${err}`, type: "error" })
      );
    }
  };

  const handleUnlock = async (id) => {
    try {
      await dispatch(unlockVersion(id)).unwrap();
      dispatch(
        showNotification({
          message: "Version unlocked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to unlock: ${err}`, type: "error" })
      );
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await dispatch(
        updateVersion({ id, data: { is_active: !currentActive } })
      ).unwrap();
      dispatch(
        showNotification({
          message: `Version ${!currentActive ? "enabled" : "disabled"} successfully`,
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to update: ${err}`, type: "error" })
      );
    }
  };

  const filteredVersions = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "active") return item.is_active;
    if (filter === "inactive") return !item.is_active;
    if (filter === "locked") return item.is_locked;
    return true;
  });

  const isSemanticVersion = (label) => {
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(label);
  };

  if (loading && items.length === 0) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ py: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Paper sx={{ p: 1 }}>
          <Tabs
            value={filter}
            onChange={(e, value) => setFilter(value)}
            aria-label="version filter tabs"
          >
            <Tab label="All" value="all" />
            <Tab label="Active" value="active" />
            <Tab label="Inactive" value="inactive" />
            <Tab label="Locked" value="locked" />
          </Tabs>
        </Paper>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/flat-json/versions/new")}
        >
          New Version
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {filteredVersions.map((version) => (
          <Grid item size={4} key={version.id}>
            <Card className="card-hoverable">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      Version {version.version_number}
                    </Typography>
                    <VersionChip
                      version={version.version_number}
                      isSemanticVersion={isSemanticVersion(
                        version.version_number
                      )}
                    />
                  </Box>
                  <Box>
                    <StatusChip
                      active={version.is_active}
                      locked={version.is_locked}
                    />
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {version.description || "No description provided"}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2">
                    Object:{" "}
                    {version.flat_json_object?.name ||
                      `ID: ${version.object_id}`}
                  </Typography>
                  <Typography variant="body2">
                    Created: {new Date(version.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate(`/flat-json/versions/${version.id}`)}
                >
                  View
                </Button>

                {!version.is_locked && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() =>
                      navigate(`/flat-json/versions/${version.id}/edit`)
                    }
                  >
                    Edit
                  </Button>
                )}

                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(version.id)}
                  disabled={version.is_locked}
                >
                  Delete
                </Button>

                {version.is_locked ? (
                  <Button
                    size="small"
                    color="warning"
                    startIcon={<LockOpenIcon />}
                    onClick={() => handleUnlock(version.id)}
                  >
                    Unlock
                  </Button>
                ) : (
                  <Button
                    size="small"
                    color="warning"
                    startIcon={<LockIcon />}
                    onClick={() => handleLock(version.id)}
                  >
                    Lock
                  </Button>
                )}

                <Button
                  size="small"
                  color={version.is_active ? "error" : "success"}
                  onClick={() =>
                    handleToggleActive(version.id, version.is_active)
                  }
                  disabled={version.is_locked}
                >
                  {version.is_active ? "Disable" : "Enable"}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredVersions.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: "center" }} className="empty-state">
          <Typography>No versions found.</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate("/flat-json/versions/new")}
            sx={{ mt: 2 }}
          >
            Create New Version
          </Button>
        </Paper>
      )}
    </Box>
  );
};

const VersionForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = Boolean(id);
  const { currentVersion, loading, error } = useSelector(
    (state) => state.versions
  );
  const { items: objects, loading: objectsLoading } = useSelector(
    (state) => state.objects
  );
  const { nextVersionInfo } = useSelector((state) => state.versioning);

  const queryParams = new URLSearchParams(location.search);
  const objectIdFromQuery = queryParams.get("objectId");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      object_id: objectIdFromQuery || "",
      version_number: "",
      description: "",
      incrementType: "patch",
    },
  });

  const selectedObjectId = watch("object_id");
  const incrementType = watch("incrementType");

  useEffect(() => {
    dispatch(fetchObjects());

    if (isEditMode) {
      dispatch(fetchVersion(id));
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentVersion) {
      reset({
        object_id: currentVersion.object_id.toString(),
        version_number: currentVersion.version_number,
        description: currentVersion.description,
      });
    }
  }, [currentVersion, isEditMode, reset]);

  useEffect(() => {
    if (!isEditMode && selectedObjectId) {
      dispatch(fetchNextVersion(selectedObjectId));
    }
  }, [dispatch, selectedObjectId, isEditMode]);

  useEffect(() => {
    if (!isEditMode && nextVersionInfo && incrementType) {
      const nextVersion = nextVersionInfo[incrementType];
      if (nextVersion) {
        setValue("version_number", nextVersion);
      }
    }
  }, [nextVersionInfo, incrementType, setValue, isEditMode]);

  const handleDelete = () => {
    dispatch(
      showConfirmDialog({
        title: "Delete Version",
        message:
          "Are you sure you want to delete this version? This action will make the version inactive.",
        actionId: "DELETE_VERSION",
        actionData: { id },
      })
    );
  };

  const handleLock = async () => {
    try {
      await dispatch(lockVersion(id)).unwrap();
      dispatch(
        showNotification({
          message: "Version locked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to lock: ${err}`, type: "error" })
      );
    }
  };

  const handleUnlock = async () => {
    try {
      await dispatch(unlockVersion(id)).unwrap();
      dispatch(
        showNotification({
          message: "Version unlocked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to unlock: ${err}`, type: "error" })
      );
    }
  };

  const handleToggleActive = async () => {
    try {
      await dispatch(
        updateVersion({
          id,
          data: { is_active: !currentVersion.is_active },
        })
      ).unwrap();
      dispatch(
        showNotification({
          message: `Version ${!currentVersion.is_active ? "enabled" : "disabled"} successfully`,
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to update: ${err}`, type: "error" })
      );
    }
  };

  const handleCreateWithIncrement = async () => {
    if (!selectedObjectId || !incrementType) return;

    try {
      const newVersion = await dispatch(
        createVersionWithIncrement({
          objectId: selectedObjectId,
          incrementType,
        })
      ).unwrap();

      dispatch(
        showNotification({
          message: `Version ${newVersion.version_number} created successfully`,
          type: "success",
        })
      );
      navigate("/flat-json/versions");
    } catch (err) {
      dispatch(showNotification({ message: err, type: "error" }));
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        object_id: parseInt(data.object_id, 10),
      };

      if (isEditMode) {
        await dispatch(updateVersion({ id, data: payload })).unwrap();
        dispatch(
          showNotification({
            message: "Version updated successfully",
            type: "success",
          })
        );
      } else {
        await dispatch(createVersion(payload)).unwrap();
        dispatch(
          showNotification({
            message: "Version created successfully",
            type: "success",
          })
        );
      }
      navigate("/flat-json/versions");
    } catch (err) {
      dispatch(showNotification({ message: err, type: "error" }));
    }
  };

  if ((isEditMode && loading && !currentVersion) || objectsLoading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ py: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          color="inherit"
          onClick={() => navigate("/flat-json/versions")}
          sx={{ cursor: "pointer" }}
        >
          Versions
        </Link>
        {isEditMode && currentVersion && (
          <Link
            color="inherit"
            onClick={() => navigate(`/flat-json/versions/${id}`)}
            sx={{ cursor: "pointer" }}
          >
            {currentVersion.version_number}
          </Link>
        )}
        <Typography color="text.primary">
          {isEditMode ? "Edit" : "Create"} Version
        </Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ mb: 3 }}>
        {isEditMode ? "Edit Version" : "Create New Version"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item size={12}>
              <Controller
                name="object_id"
                control={control}
                rules={{ required: "Object is required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.object_id)}>
                    <InputLabel id="object-select-label">Object</InputLabel>
                    <Select
                      {...field}
                      labelId="object-select-label"
                      label="Object"
                      disabled={isEditMode}
                    >
                      {objects
                        .filter((obj) => obj.is_active)
                        .map((object) => (
                          <MenuItem
                            key={object.id}
                            value={object.id.toString()}
                          >
                            {object.name}
                          </MenuItem>
                        ))}
                    </Select>
                    {errors.object_id && (
                      <FormHelperText>
                        {errors.object_id.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {!isEditMode && selectedObjectId && nextVersionInfo && (
              <Grid item size={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Semantic Versioning Options:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      label={`Patch: ${nextVersionInfo.patch}`}
                      color={incrementType === "patch" ? "primary" : "default"}
                      onClick={() => setValue("incrementType", "patch")}
                      clickable
                    />
                    <Chip
                      label={`Minor: ${nextVersionInfo.minor}`}
                      color={incrementType === "minor" ? "primary" : "default"}
                      onClick={() => setValue("incrementType", "minor")}
                      clickable
                    />
                    <Chip
                      label={`Major: ${nextVersionInfo.major}`}
                      color={incrementType === "major" ? "primary" : "default"}
                      onClick={() => setValue("incrementType", "major")}
                      clickable
                    />
                  </Box>
                </Alert>

                <Controller
                  name="incrementType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel id="increment-select-label">
                        Version Increment Type
                      </InputLabel>
                      <Select
                        {...field}
                        labelId="increment-select-label"
                        label="Version Increment Type"
                      >
                        <MenuItem value="patch">Patch (Bug fixes)</MenuItem>
                        <MenuItem value="minor">Minor (New features)</MenuItem>
                        <MenuItem value="major">
                          Major (Breaking changes)
                        </MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            )}

            <Grid item size={12}>
              <Controller
                name="version_number"
                control={control}
                rules={{
                  required: "Version number is required",
                  pattern: {
                    value:
                      /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/,
                    message:
                      "Version number must follow semantic versioning (e.g., 1.0.0)",
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Version Number"
                    fullWidth
                    error={Boolean(errors.version_number)}
                    helperText={
                      errors.version_number?.message ||
                      "Semantic versioning format (e.g., 1.0.0)"
                    }
                    disabled={!isEditMode}
                    InputProps={{
                      startAdornment: (
                        <TagIcon
                          size={20}
                          style={{ marginRight: 8, color: "#666" }}
                        />
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item size={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    multiline
                    rows={4}
                    fullWidth
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/flat-json/versions")}
              startIcon={<ArrowBackIcon />}
            >
              Cancel
            </Button>

            <Box sx={{ display: "flex", gap: 2 }}>
              {isEditMode && currentVersion && (
                <>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    disabled={currentVersion.is_locked}
                  >
                    Delete
                  </Button>

                  {currentVersion.is_locked ? (
                    <Button
                      color="warning"
                      startIcon={<LockOpenIcon />}
                      onClick={handleUnlock}
                    >
                      Unlock
                    </Button>
                  ) : (
                    <Button
                      color="warning"
                      startIcon={<LockIcon />}
                      onClick={handleLock}
                    >
                      Lock
                    </Button>
                  )}

                  <Button
                    color={currentVersion.is_active ? "error" : "success"}
                    onClick={handleToggleActive}
                    disabled={currentVersion.is_locked}
                  >
                    {currentVersion.is_active ? "Disable" : "Enable"}
                  </Button>
                </>
              )}

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const RevisionList = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.revisions);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchRevisions());
  }, [dispatch]);

  const handleDelete = (id) => {
    dispatch(
      showConfirmDialog({
        title: "Delete Revision",
        message:
          "Are you sure you want to delete this revision? This action will make the revision inactive.",
        actionId: "DELETE_REVISION",
        actionData: { id },
      })
    );
  };

  const handleLock = async (id) => {
    try {
      await dispatch(lockRevision(id)).unwrap();
      dispatch(
        showNotification({
          message: "Revision locked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to lock: ${err}`, type: "error" })
      );
    }
  };

  const handleUnlock = async (id) => {
    try {
      await dispatch(unlockRevision(id)).unwrap();
      dispatch(
        showNotification({
          message: "Revision unlocked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to unlock: ${err}`, type: "error" })
      );
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await dispatch(
        updateRevision({ id, data: { is_active: !currentActive } })
      ).unwrap();
      dispatch(
        showNotification({
          message: `Revision ${!currentActive ? "enabled" : "disabled"} successfully`,
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to update: ${err}`, type: "error" })
      );
    }
  };

  const filteredRevisions = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "active") return item.is_active;
    if (filter === "inactive") return !item.is_active;
    if (filter === "locked") return item.is_locked;
    return true;
  });

  if (loading && items.length === 0) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ py: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Paper sx={{ p: 1 }}>
          <Tabs
            value={filter}
            onChange={(e, value) => setFilter(value)}
            aria-label="revision filter tabs"
          >
            <Tab label="All" value="all" />
            <Tab label="Active" value="active" />
            <Tab label="Inactive" value="inactive" />
            <Tab label="Locked" value="locked" />
          </Tabs>
        </Paper>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/flat-json/revisions/new")}
        >
          New Revision
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {filteredRevisions.map((revision) => (
          <Grid item size={4} key={revision.id}>
            <Card className="card-hoverable">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">Revision</Typography>
                    <RevisionChip revisionUuid={revision.revision_uuid} />
                  </Box>
                  <Box>
                    <StatusChip
                      active={revision.is_active}
                      locked={revision.is_locked}
                    />
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {revision.summary || "No summary provided"}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2">
                    Version:{" "}
                    {revision.flat_json_version?.version_number ||
                      `ID: ${revision.version_id}`}
                  </Typography>
                  <Typography variant="body2">
                    Created:{" "}
                    {new Date(revision.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() =>
                    navigate(`/flat-json/revisions/${revision.id}`)
                  }
                >
                  View
                </Button>

                {!revision.is_locked && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() =>
                      navigate(`/flat-json/revisions/${revision.id}/edit`)
                    }
                  >
                    Edit
                  </Button>
                )}

                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(revision.id)}
                  disabled={revision.is_locked}
                >
                  Delete
                </Button>

                {revision.is_locked ? (
                  <Button
                    size="small"
                    color="warning"
                    startIcon={<LockOpenIcon />}
                    onClick={() => handleUnlock(revision.id)}
                  >
                    Unlock
                  </Button>
                ) : (
                  <Button
                    size="small"
                    color="warning"
                    startIcon={<LockIcon />}
                    onClick={() => handleLock(revision.id)}
                  >
                    Lock
                  </Button>
                )}

                <Button
                  size="small"
                  color={revision.is_active ? "error" : "success"}
                  onClick={() =>
                    handleToggleActive(revision.id, revision.is_active)
                  }
                  disabled={revision.is_locked}
                >
                  {revision.is_active ? "Disable" : "Enable"}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredRevisions.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: "center" }} className="empty-state">
          <Typography>No revisions found.</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate("/flat-json/revisions/new")}
            sx={{ mt: 2 }}
          >
            Create New Revision
          </Button>
        </Paper>
      )}
    </Box>
  );
};

const RevisionForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = Boolean(id);
  const { currentRevision, loading, error } = useSelector(
    (state) => state.revisions
  );
  const { items: versions, loading: versionsLoading } = useSelector(
    (state) => state.versions
  );
  const { nextRevisionInfo } = useSelector((state) => state.versioning);

  const queryParams = new URLSearchParams(location.search);
  const versionIdFromQuery = queryParams.get("versionId");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      version_id: versionIdFromQuery || "",
      revision_uuid: "",
      summary: "",
    },
  });

  const selectedVersionId = watch("version_id");

  useEffect(() => {
    dispatch(fetchVersions());

    if (isEditMode) {
      dispatch(fetchRevision(id));
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentRevision) {
      reset({
        version_id: currentRevision.version_id.toString(),
        revision_uuid: currentRevision.revision_uuid,
        summary: currentRevision.summary,
      });
    }
  }, [currentRevision, isEditMode, reset]);

  useEffect(() => {
    if (!isEditMode && selectedVersionId) {
      dispatch(fetchNextRevision(selectedVersionId));
    }
  }, [dispatch, selectedVersionId, isEditMode]);

  useEffect(() => {
    if (!isEditMode && nextRevisionInfo) {
      setValue("revision_uuid", nextRevisionInfo.nextRevision);
    }
  }, [nextRevisionInfo, setValue, isEditMode]);

  const handleDelete = () => {
    dispatch(
      showConfirmDialog({
        title: "Delete Revision",
        message:
          "Are you sure you want to delete this revision? This action will make the revision inactive.",
        actionId: "DELETE_REVISION",
        actionData: { id },
      })
    );
  };

  const handleLock = async () => {
    try {
      await dispatch(lockRevision(id)).unwrap();
      dispatch(
        showNotification({
          message: "Revision locked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to lock: ${err}`, type: "error" })
      );
    }
  };

  const handleUnlock = async () => {
    try {
      await dispatch(unlockRevision(id)).unwrap();
      dispatch(
        showNotification({
          message: "Revision unlocked successfully",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to unlock: ${err}`, type: "error" })
      );
    }
  };

  const handleToggleActive = async () => {
    try {
      await dispatch(
        updateRevision({
          id,
          data: { is_active: !currentRevision.is_active },
        })
      ).unwrap();
      dispatch(
        showNotification({
          message: `Revision ${!currentRevision.is_active ? "enabled" : "disabled"} successfully`,
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to update: ${err}`, type: "error" })
      );
    }
  };

  const handleCreateWithIncrement = async () => {
    if (!selectedVersionId) return;

    try {
      const newRevision = await dispatch(
        createRevisionWithIncrement(selectedVersionId)
      ).unwrap();

      dispatch(
        showNotification({
          message: `Revision created successfully`,
          type: "success",
        })
      );
      navigate("/flat-json/revisions");
    } catch (err) {
      dispatch(showNotification({ message: err, type: "error" }));
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        version_id: parseInt(data.version_id, 10),
      };

      if (isEditMode) {
        await dispatch(updateRevision({ id, data: payload })).unwrap();
        dispatch(
          showNotification({
            message: "Revision updated successfully",
            type: "success",
          })
        );
      } else {
        await dispatch(createRevision(payload)).unwrap();
        dispatch(
          showNotification({
            message: "Revision created successfully",
            type: "success",
          })
        );
      }
      navigate("/flat-json/revisions");
    } catch (err) {
      dispatch(showNotification({ message: err, type: "error" }));
    }
  };

  if ((isEditMode && loading && !currentRevision) || versionsLoading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ py: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          color="inherit"
          onClick={() => navigate("/flat-json/revisions")}
          sx={{ cursor: "pointer" }}
        >
          Revisions
        </Link>
        {isEditMode && currentRevision && (
          <Link
            color="inherit"
            onClick={() => navigate(`/flat-json/revisions/${id}`)}
            sx={{ cursor: "pointer" }}
          >
            {currentRevision.revision_uuid}
          </Link>
        )}
        <Typography color="text.primary">
          {isEditMode ? "Edit" : "Create"} Revision
        </Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ mb: 3 }}>
        {isEditMode ? "Edit Revision" : "Create New Revision"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item size={12}>
              <Controller
                name="version_id"
                control={control}
                rules={{ required: "Version is required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.version_id)}>
                    <InputLabel id="version-select-label">Version</InputLabel>
                    <Select
                      {...field}
                      labelId="version-select-label"
                      label="Version"
                      disabled={isEditMode}
                    >
                      {versions
                        .filter((ver) => ver.is_active)
                        .map((version) => (
                          <MenuItem
                            key={version.id}
                            value={version.id.toString()}
                          >
                            {version.version_number} (
                            {version.flat_json_object?.name ||
                              `Object ID: ${version.object_id}`}
                            )
                          </MenuItem>
                        ))}
                    </Select>
                    {errors.version_id && (
                      <FormHelperText>
                        {errors.version_id.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {!isEditMode && selectedVersionId && nextRevisionInfo && (
              <Grid item size={12}>
                <Alert severity="info">
                  <Typography variant="subtitle2">
                    Next available revision: {nextRevisionInfo.nextRevision}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current revision count: {nextRevisionInfo.currentCount}
                  </Typography>
                </Alert>
              </Grid>
            )}

            <Grid item size={12}>
              <Controller
                name="revision_uuid"
                control={control}
                rules={{ required: "Revision UUID is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Revision UUID"
                    fullWidth
                    error={Boolean(errors.revision_uuid)}
                    helperText={
                      errors.revision_uuid?.message || "Auto-generated UUID v7"
                    }
                    disabled={true}
                    className="uuid-display"
                  />
                )}
              />
            </Grid>

            <Grid item size={12}>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Summary"
                    multiline
                    rows={4}
                    fullWidth
                    error={Boolean(errors.summary)}
                    helperText={errors.summary?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/flat-json/revisions")}
              startIcon={<ArrowBackIcon />}
            >
              Cancel
            </Button>

            <Box sx={{ display: "flex", gap: 2 }}>
              {isEditMode && currentRevision && (
                <>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    disabled={currentRevision.is_locked}
                  >
                    Delete
                  </Button>

                  {currentRevision.is_locked ? (
                    <Button
                      color="warning"
                      startIcon={<LockOpenIcon />}
                      onClick={handleUnlock}
                    >
                      Unlock
                    </Button>
                  ) : (
                    <Button
                      color="warning"
                      startIcon={<LockIcon />}
                      onClick={handleLock}
                    >
                      Lock
                    </Button>
                  )}

                  <Button
                    color={currentRevision.is_active ? "error" : "success"}
                    onClick={handleToggleActive}
                    disabled={currentRevision.is_locked}
                  >
                    {currentRevision.is_active ? "Disable" : "Enable"}
                  </Button>
                </>
              )}

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const FlatPropertyList = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector(
    (state) => state.flatProperties
  );
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchFlatProperties());
  }, [dispatch]);

  const filteredFlatProperties = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "inactive") return !item.is_active;
    return item.type === filter;
  });

  const types = [...new Set(items.map((item) => item.type))];

  if (loading && items.length === 0) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ py: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Paper sx={{ p: 1 }}>
          <Tabs
            value={filter}
            onChange={(_, newValue) => setFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All" value="all" />
            {types.map((type) => (
              <Tab key={type} label={type} value={type} />
            ))}
            <Tab label="Inactive" value="inactive" />
          </Tabs>
        </Paper>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/flat-json/flat-properties/new")}
        >
          Add Flat Property
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Key Path</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Revision</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFlatProperties.map((item) => (
              <TableRow
                key={item.id}
                sx={{ opacity: item.is_active ? 1 : 0.6 }}
              >
                <TableCell>{item.type}</TableCell>
                <TableCell>
                  <span className="key-path">{item.key_path}</span>
                </TableCell>
                <TableCell>{item.key_value}</TableCell>
                <TableCell>
                  {item.flat_json_revision?.revision_uuid ? (
                    <RevisionChip
                      revisionUuid={item.flat_json_revision.revision_uuid}
                    />
                  ) : (
                    `Rev ID: ${item.revision_id}`
                  )}
                </TableCell>
                <TableCell>
                  <StatusChip active={item.is_active} locked={item.is_locked} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`/flat-json/flat-properties/${item.id}`)
                      }
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredFlatProperties.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: "center" }} className="empty-state">
          <Typography>No flat properties found.</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate("/flat-json/flat-properties/new")}
            sx={{ mt: 2 }}
          >
            Create New Entry
          </Button>
        </Paper>
      )}
    </Box>
  );
};

const FlatPropertyForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = Boolean(id);
  const { currentFlatProperty, loading, error } = useSelector(
    (state) => state.flatProperties
  );
  const { items: revisions, loading: revisionsLoading } = useSelector(
    (state) => state.revisions
  );

  const queryParams = new URLSearchParams(location.search);
  const revisionIdFromQuery = queryParams.get("revisionId");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: "",
      key_path: "",
      key_value: "",
      revision_id: revisionIdFromQuery || "",
      status: "active",
    },
  });

  useEffect(() => {
    dispatch(fetchRevisions());

    if (isEditMode) {
      dispatch(fetchFlatPropertyById(id));
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentFlatProperty) {
      reset({
        type: currentFlatProperty.type,
        key_path: currentFlatProperty.key_path,
        key_value: currentFlatProperty.key_value,
        revision_id: currentFlatProperty.revision_id.toString(),
        status: currentFlatProperty.status,
      });
    }
  }, [currentFlatProperty, isEditMode, reset]);

  const handleDelete = () => {
    dispatch(
      showConfirmDialog({
        title: "Delete Flat Property",
        message:
          "Are you sure you want to delete this flat property? This action will make the property inactive.",
        actionId: "DELETE_FLAT_PROPERTY",
        actionData: { id },
      })
    );
  };

  const handleToggleActive = async () => {
    try {
      await dispatch(
        updateFlatProperty({
          id,
          data: { is_active: !currentFlatProperty.is_active },
        })
      ).unwrap();
      dispatch(
        showNotification({
          message: `Flat Property ${!currentFlatProperty.is_active ? "enabled" : "disabled"} successfully`,
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        showNotification({ message: `Failed to update: ${err}`, type: "error" })
      );
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        revision_id: parseInt(data.revision_id, 10),
      };

      if (isEditMode) {
        await dispatch(updateFlatProperty({ id, data: payload })).unwrap();
        dispatch(
          showNotification({
            message: "Flat Property updated successfully",
            type: "success",
          })
        );
      } else {
        await dispatch(createFlatProperty(payload)).unwrap();
        dispatch(
          showNotification({
            message: "Flat Property created successfully",
            type: "success",
          })
        );
      }
      navigate("/flat-json/flat-properties");
    } catch (err) {
      dispatch(showNotification({ message: err, type: "error" }));
    }
  };

  const typeOptions = sharedData.supportedFlatPropertyTypes.map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }));

  if ((isEditMode && loading && !currentFlatProperty) || revisionsLoading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ py: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          color="inherit"
          onClick={() => navigate("/flat-json/flat-properties")}
          sx={{ cursor: "pointer" }}
        >
          Flat Properties
        </Link>
        {isEditMode && currentFlatProperty && (
          <Link
            color="inherit"
            onClick={() => navigate(`/flat-json/flat-properties/${id}`)}
            sx={{ cursor: "pointer" }}
          >
            View
          </Link>
        )}
        <Typography color="text.primary">
          {isEditMode ? "Edit" : "Create"} Flat Property
        </Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ mb: 3 }}>
        {isEditMode ? "Edit Flat Property" : "Create New Flat Property"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item size={6}>
              <Controller
                name="type"
                control={control}
                rules={{ required: "Type is required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.type)}>
                    <InputLabel id="type-select-label">Type</InputLabel>
                    <Select {...field} labelId="type-select-label" label="Type">
                      {typeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.type && (
                      <FormHelperText>{errors.type.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item size={6}>
              <Controller
                name="revision_id"
                control={control}
                rules={{ required: "Revision is required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.revision_id)}>
                    <InputLabel id="revision-select-label">Revision</InputLabel>
                    <Select
                      {...field}
                      labelId="revision-select-label"
                      label="Revision"
                      disabled={isEditMode}
                    >
                      {revisions
                        .filter((rev) => rev.is_active && !rev.is_locked)
                        .map((revision) => (
                          <MenuItem
                            key={revision.id}
                            value={revision.id.toString()}
                          >
                            {revision.revision_uuid.substring(0, 8)}...
                            {revision.flat_json_version
                              ? ` (${revision.flat_json_version.version_number})`
                              : ` (Version ID: ${revision.version_id})`}
                          </MenuItem>
                        ))}
                    </Select>
                    {errors.revision_id && (
                      <FormHelperText>
                        {errors.revision_id.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item size={12}>
              <Controller
                name="key_path"
                control={control}
                rules={{ required: "Key path is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Key Path"
                    fullWidth
                    error={Boolean(errors.key_path)}
                    helperText={
                      errors.key_path?.message ||
                      "Example: user.preferences.theme"
                    }
                  />
                )}
              />
            </Grid>

            <Grid item size={12}>
              <Controller
                name="key_value"
                control={control}
                rules={{ required: "Value is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Value"
                    multiline
                    rows={4}
                    fullWidth
                    error={Boolean(errors.key_value)}
                    helperText={errors.key_value?.message}
                  />
                )}
              />
            </Grid>

            <Grid item size={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select
                      {...field}
                      labelId="status-select-label"
                      label="Status"
                    >
                      {sharedData.statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/flat-json/flat-properties")}
              startIcon={<ArrowBackIcon />}
            >
              Cancel
            </Button>

            <Box sx={{ display: "flex", gap: 2 }}>
              {isEditMode && currentFlatProperty && (
                <>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    disabled={currentFlatProperty.is_locked}
                  >
                    Delete
                  </Button>

                  <Button
                    color={currentFlatProperty.is_active ? "error" : "success"}
                    onClick={handleToggleActive}
                    disabled={currentFlatProperty.is_locked}
                  >
                    {currentFlatProperty.is_active ? "Disable" : "Enable"}
                  </Button>
                </>
              )}

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const Changelog = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.changelog);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchChangelog());
  }, [dispatch]);

  const filteredLogs = items.filter((log) => {
    if (filter === "all") return true;
    return log.entity_type === filter;
  });

  if (loading && items.length === 0) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ py: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h5" sx={{ mb: 3 }}>
        Audit Log
      </Typography>

      <Paper sx={{ p: 1, mb: 3 }}>
        <Tabs
          value={filter}
          onChange={(_, newValue) => setFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" value="all" />
          <Tab label="Object" value="object" />
          <Tab label="Version" value="version" />
          <Tab label="Revision" value="revision" />
          <Tab label="Flat Property" value="flat_property" />
        </Tabs>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.performed_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {log.action === "create" && (
                      <AddIcon
                        fontSize="small"
                        color="success"
                        sx={{ mr: 1 }}
                      />
                    )}
                    {log.action === "update" && (
                      <EditIcon
                        fontSize="small"
                        color="primary"
                        sx={{ mr: 1 }}
                      />
                    )}
                    {log.action === "delete" && (
                      <DeleteIcon
                        fontSize="small"
                        color="error"
                        sx={{ mr: 1 }}
                      />
                    )}
                    {log.action === "restore" && (
                      <RestoreIcon
                        fontSize="small"
                        color="info"
                        sx={{ mr: 1 }}
                      />
                    )}
                    {log.action === "lock" && (
                      <LockIcon
                        fontSize="small"
                        color="warning"
                        sx={{ mr: 1 }}
                      />
                    )}
                    {log.action === "unlock" && (
                      <LockOpenIcon
                        fontSize="small"
                        color="warning"
                        sx={{ mr: 1 }}
                      />
                    )}
                    <span className={`audit-action audit-${log.action}`}>
                      {log.action}
                    </span>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.entity_type}
                    color={
                      log.entity_type === "object"
                        ? "primary"
                        : log.entity_type === "version"
                          ? "secondary"
                          : log.entity_type === "revision"
                            ? "success"
                            : "info"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>{log.performed_by}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {log.tags?.map((tag, idx) => (
                      <Chip key={idx} label={tag} size="small" />
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const FlatJsonApp = ({ TopLevelMenu, FeatureMenu }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Provider store={store}>
        <Routes>
          <Route
            path="/flat-json/"
            element={
              <LayoutTemplate
                TopLevelMenu={TopLevelMenu}
                FeatureMenu={FeatureMenu}
              />
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="objects" element={<ObjectList />} />
            <Route path="objects/new" element={<ObjectForm />} />
            <Route path="objects/:id" element={<ObjectForm />} />
            <Route path="objects/:id/edit" element={<ObjectForm />} />

            <Route path="versions" element={<VersionList />} />
            <Route path="versions/new" element={<VersionForm />} />
            <Route path="versions/:id" element={<VersionForm />} />
            <Route path="versions/:id/edit" element={<VersionForm />} />

            <Route path="revisions" element={<RevisionList />} />
            <Route path="revisions/new" element={<RevisionForm />} />
            <Route path="revisions/:id" element={<RevisionForm />} />
            <Route path="revisions/:id/edit" element={<RevisionForm />} />

            <Route path="flat-properties" element={<FlatPropertyList />} />
            <Route path="flat-properties/new" element={<FlatPropertyForm />} />
            <Route path="flat-properties/:id" element={<FlatPropertyForm />} />
            <Route
              path="flat-properties/:id/edit"
              element={<FlatPropertyForm />}
            />

            <Route path="changelog" element={<Changelog />} />
          </Route>
        </Routes>
      </Provider>
    </ThemeProvider>
  );
};

const App = () => {
  return <FlatJsonApp TopLevelMenu={TopLevelMenu} FeatureMenu={FeatureMenu} />;
};

export default App;
