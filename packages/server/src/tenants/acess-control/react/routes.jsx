import React, { useState, useEffect, useMemo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  Outlet,
} from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  AppBar,
  Toolbar,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  styled,
} from "@mui/material";
import * as lucide from "lucide-react";

// API Client
const API_BASE_URL = "http://127.0.0.1:3001/access-control";

const api = {
  policyDefinitions: {
    getAll: () =>
      fetch(`${API_BASE_URL}/policy/definitions`).then((res) => res.json()),
    getById: (id) =>
      fetch(`${API_BASE_URL}/policy/definition/${id}`).then((res) =>
        res.json()
      ),
    create: (data) =>
      fetch(`${API_BASE_URL}/policy/definition/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyDefinition: data }),
      }).then((res) => res.json()),
    update: (id, data) =>
      fetch(`${API_BASE_URL}/policy/definition/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyDefinition: data }),
      }).then((res) => res.json()),
  },
  policyRules: {
    getByPolicyId: (id) =>
      fetch(`${API_BASE_URL}/policy/definition/${id}/rules`).then((res) =>
        res.json()
      ),
    getById: (id) =>
      fetch(`${API_BASE_URL}/policy/rule/${id}`).then((res) => res.json()),
    create: (policyId, data) =>
      fetch(`${API_BASE_URL}/policy/definition/rule/${policyId}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyRule: data }),
      }).then((res) => res.json()),
    bulkCreate: (policyId, data) =>
      fetch(`${API_BASE_URL}/policy/definition/rule/${policyId}/bulk-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    update: (id, data) =>
      fetch(`${API_BASE_URL}/policy/rule/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyRule: data }),
      }).then((res) => res.json()),
    delete: (id) =>
      fetch(`${API_BASE_URL}/policy/rule/${id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json()),
    disable: (id) =>
      fetch(`${API_BASE_URL}/policy/rule/${id}/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json()),
    test: (data) =>
      fetch(`${API_BASE_URL}/policy/rule/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
  },
};

// Utility Functions
function formatFieldLabel(key) {
  if (key.startsWith("rule_v")) {
    return `Rule Value ${key.replace("rule_v", "")}`;
  }
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function convertPolicyDefinitionToModel(policyDef) {
  if (!policyDef) return "";

  return `
[request_definition]
r = ${policyDef.request_definition}

[policy_definition]
p = ${policyDef.policy_definition}

[role_definition]
g = ${policyDef.role_definition}

[policy_effect]
e = ${policyDef.policy_effect}

[matchers]
m = ${policyDef.matchers}
`;
}

function getUniqueAttributeValues(policyRules, attribute) {
  if (!policyRules?.length) return [];

  const valueSet = new Set();
  policyRules.forEach((rule) => {
    if (rule[attribute]) {
      valueSet.add(rule[attribute]);
    }
  });

  return Array.from(valueSet);
}

function generateTestCases(rules) {
  if (!rules?.length) return [];

  const testCases = [];
  const domains = [
    ...new Set(rules.filter((r) => r.rule_v1).map((r) => r.rule_v1)),
  ];
  const roleAssignments = rules.filter((r) => r.permission_type === "g");
  const permissionRules = rules.filter((r) => r.permission_type === "p");

  roleAssignments.forEach((assignment) => {
    const userId = assignment.rule_v0;
    const role = assignment.rule_v1;
    const domain = assignment.rule_v2;

    permissionRules.forEach((permission) => {
      if (permission.rule_v1 === domain) {
        testCases.push({
          name: `Test ${userId} as ${role} in ${domain} accessing ${permission.rule_v2} ${permission.rule_v3}`,
          subject: {
            rule_v0: userId,
            rule_v1: role,
            rule_v2: domain,
            rule_v3: permission.rule_v3,
          },
          domain,
          object: permission.rule_v2,
          action: permission.rule_v3,
        });
      }
    });
  });

  return testCases;
}

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
}));

const ResultPaper = styled(Paper)(({ theme, allowed }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  backgroundColor: allowed
    ? theme.palette.success.light
    : theme.palette.error.light,
  color: allowed
    ? theme.palette.success.contrastText
    : theme.palette.error.contrastText,
}));

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Policy Definition Components
function PolicyDefinitionCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    request_definition: "sub, dom, obj, act",
    policy_definition: "sub_rule, dom, obj, act, eft",
    role_definition: "_, _, _",
    policy_effect:
      "some(where (p.eft == allow)) && !some(where (p.eft == deny))",
    matchers: `(eval(p.sub_rule) && r.dom == p.dom && r.obj.startsWith(p.obj) && (r.act == p.act || p.act == "*")) || (g(r.sub.id, p.sub_rule, r.dom) && r.dom == p.dom && r.obj.startsWith(p.obj) && (r.act == p.act || p.act == "*"))`,
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setNotification({
        open: true,
        message: "Policy name is required",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.policyDefinitions.create(formData);

      if (response.success) {
        setNotification({
          open: true,
          message: "Policy definition created successfully",
          severity: "success",
        });

        setTimeout(() => navigate("/admin/access-control/"), 1500);
      } else {
        throw new Error(response.message || "Failed to create policy");
      }
    } catch (error) {
      console.error("Error creating policy:", error);
      setNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      request_definition: "sub, dom, obj, act",
      policy_definition: "sub_rule, dom, obj, act, eft",
      role_definition: "_, _, _",
      policy_effect:
        "some(where (p.eft == allow)) && !some(where (p.eft == deny))",
      matchers: `(eval(p.sub_rule) && r.dom == p.dom && r.obj.startsWith(p.obj) && (r.act == p.act || p.act == "*")) || (g(r.sub.id, p.sub_rule, r.dom) && r.dom == p.dom && r.obj.startsWith(p.obj) && (r.act == p.act || p.act == "*"))`,
    });
    setNotification({
      open: true,
      message: "Form has been reset",
      severity: "info",
    });
  };

  return (
    <Paper elevation={3} sx={{ maxWidth: 800, mx: "auto", p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Create New Policy Definition
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {Object.entries(formData).map(([key, value]) => (
            <Grid item size={12} key={key}>
              <Typography variant="subtitle2" gutterBottom>
                {formatFieldLabel(key)}
              </Typography>
              <TextField
                fullWidth
                name={key}
                value={value}
                onChange={handleChange}
                multiline={key === "matchers" || key.includes("definition")}
                rows={key === "matchers" || key.includes("definition") ? 3 : 1}
                variant="outlined"
                size="small"
                required={key === "name"}
              />
            </Grid>
          ))}

          <Grid
            item
            size={12}
            sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}
          >
            <Button variant="outlined" onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Create Policy"}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

function PolicyDefinitionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [policyDefinition, setPolicyDefinition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    async function fetchPolicyDefinition() {
      if (!id) return;

      try {
        setLoading(true);
        const response = await api.policyDefinitions.getById(id);

        if (response.success && response.payload?.policyDefinition) {
          setPolicyDefinition(response.payload.policyDefinition);
        } else {
          throw new Error(
            response.message || "Failed to load policy definition"
          );
        }
      } catch (error) {
        console.error("Error fetching policy:", error);
        setNotification({
          open: true,
          message: `Error: ${error.message}`,
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchPolicyDefinition();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPolicyDefinition((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!policyDefinition) {
      setNotification({
        open: true,
        message: "No policy data to update",
        severity: "error",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.policyDefinitions.update(id, policyDefinition);

      if (response.success) {
        setNotification({
          open: true,
          message: "Policy definition updated successfully",
          severity: "success",
        });
      } else {
        throw new Error(response.message || "Failed to update policy");
      }
    } catch (error) {
      console.error("Error updating policy:", error);
      setNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (!policyDefinition) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load policy definition</Alert>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ maxWidth: 800, mx: "auto", p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Edit Policy Definition
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item size={12}>
            <Typography variant="subtitle2" gutterBottom>
              ID
            </Typography>
            <TextField
              fullWidth
              name="id"
              value={policyDefinition.id || ""}
              disabled
              variant="outlined"
              size="small"
            />
          </Grid>

          {Object.entries(policyDefinition)
            .filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key))
            .map(([key, value]) => (
              <Grid item size={12} key={key}>
                <Typography variant="subtitle2" gutterBottom>
                  {formatFieldLabel(key)}
                </Typography>
                <TextField
                  fullWidth
                  name={key}
                  value={value || ""}
                  onChange={handleChange}
                  multiline={key === "matchers" || key.includes("definition")}
                  rows={
                    key === "matchers" || key.includes("definition") ? 3 : 1
                  }
                  variant="outlined"
                  size="small"
                  required={key === "name"}
                />
              </Grid>
            ))}

          <Grid
            item
            size={12}
            sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}
          >
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate("/admin/access-control/")}
            >
              Back to List
            </Button>
            <Box>
              <Button
                variant="outlined"
                color="primary"
                onClick={() =>
                  navigate(`/admin/access-control/policy/${id}/rules`)
                }
                sx={{ mr: 2 }}
              >
                Manage Rules
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : "Update Policy"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

function PolicyDefinitionList() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        setLoading(true);
        const response = await api.policyDefinitions.getAll();

        if (response.success && response.payload?.policyDefinitions) {
          setPolicies(response.payload.policyDefinitions);
        } else {
          throw new Error(response.message || "Failed to load policies");
        }
      } catch (error) {
        console.error("Error fetching policies:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPolicies();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Error: {error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Policy Definitions</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/admin/access-control/policy/create")}
        >
          Create New Policy
        </Button>
      </Box>

      {policies.length === 0 ? (
        <Alert severity="info">
          No policy definitions found. Create your first policy.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "primary.main" }}>
                <TableCell sx={{ color: "white" }}>ID</TableCell>
                <TableCell sx={{ color: "white" }}>Name</TableCell>
                <TableCell sx={{ color: "white" }}>Status</TableCell>
                <TableCell sx={{ color: "white" }}>Created</TableCell>
                <TableCell sx={{ color: "white" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id} hover>
                  <TableCell>{policy.id}</TableCell>
                  <TableCell>{policy.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={policy.is_active !== false ? "Active" : "Inactive"}
                      color={policy.is_active !== false ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(policy.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          navigate(
                            `/admin/access-control/policy/edit/${policy.id}`
                          )
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() =>
                          navigate(
                            `/admin/access-control/policy/${policy.id}/rules`
                          )
                        }
                      >
                        Rules
                      </Button>
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
}

const DEFAULT_RULES = `
# HR department rules
p, r.sub.userGroup == "HR" && r.sub.workspace == "US" && r.sub.applicationName == "HRApp", tenantA, /hr/, post, allow
p, r.sub.userGroup == "HR" && r.sub.workspace == "US" && r.sub.applicationName == "HRApp", tenantA, /hr/, get, allow
p, r.sub.userGroup == "HR-Admin" && r.sub.workspace == "US", tenantA, /hr/, delete, allow
p, r.sub.userGroup == "HR" && r.sub.workspace != "US", tenantA, /hr/, post, deny

# Finance department rules
p, r.sub.userRole == "manager" && r.sub.market == "EU", tenantB, /finance/, get, allow
p, r.sub.userRole == "finance-admin" && r.sub.market == "EU", tenantB, /finance/, post, allow
p, r.sub.userRole == "manager" && r.sub.market == "EU", tenantB, /finance/, post, deny

# Role-based rules (using direct role names instead of property checks)
p, admin, tenantA, /admin/, *, allow
p, viewer, tenantA, /reports/, get, allow

# Role inheritance rules (using role names)
g, editor, viewer, tenantA
g, admin, editor, tenantA
`;

// Policy Rules Components
function PolicyRuleCreate() {
  const { policyId } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const [formValues, setFormValues] = useState({
    permission_type: "p",
    rule_v0: "",
    rule_v1: "",
    rule_v2: "",
    rule_v3: "",
    rule_v4: "",
    rule_v5: "",
    is_active: true,
  });

  const [bulkText, setBulkText] = useState(DEFAULT_RULES);
  const [parsedRules, setParsedRules] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFieldChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleBulkTextChange = (event) => {
    setBulkText(event.target.value);
  };

  const handleParseBulkText = () => {
    try {
      const lines = bulkText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));

      const rules = [];

      lines.forEach((line) => {
        const parts = line.split(",").map((part) => part.trim());

        if (parts.length >= 3) {
          if (parts[0] === "p" || parts[0] === "g") {
            const rule = {
              permission_type: parts[0],
              rule_v0: parts[1] || "",
              rule_v1: parts[2] || "",
              rule_v2: parts.length > 3 ? parts[3] || "" : "",
              rule_v3: parts.length > 4 ? parts[4] || "" : "",
              rule_v4: parts.length > 5 ? parts[5] || "" : "",
              rule_v5: parts.length > 6 ? parts[6] || "" : "",
              is_active: true,
            };

            rules.push(rule);
          }
        }
      });

      setParsedRules(rules);

      if (rules.length === 0) {
        setNotification({
          open: true,
          message: "No valid rules found in the text",
          severity: "warning",
        });
      } else {
        setNotification({
          open: true,
          message: `Found ${rules.length} valid rules`,
          severity: "success",
        });
      }

      return rules;
    } catch (err) {
      console.error("Error parsing rules:", err);
      setNotification({
        open: true,
        message: `Error parsing rules: ${err.message}`,
        severity: "error",
      });
      return [];
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);

      const response = await api.policyRules.create(policyId, formValues);

      if (response.success) {
        setNotification({
          open: true,
          message: "Policy rule created successfully",
          severity: "success",
        });

        setFormValues({
          permission_type: "p",
          rule_v0: "",
          rule_v1: "",
          rule_v2: "",
          rule_v3: "",
          rule_v4: "",
          rule_v5: "",
          is_active: true,
        });

        setTimeout(() => {
          navigate(`/admin/access-control/policy/${policyId}/rules`);
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to create rule");
      }
    } catch (error) {
      console.error("Error creating rule:", error);
      setNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (event) => {
    event.preventDefault();

    try {
      setBulkSubmitting(true);

      const rules =
        parsedRules.length > 0 ? parsedRules : handleParseBulkText();

      if (rules.length === 0) {
        throw new Error("No valid rules to submit");
      }

      const response = await api.policyRules.bulkCreate(policyId, { rules });

      if (response.success) {
        setNotification({
          open: true,
          message: `${response.payload.count} rules created successfully`,
          severity: "success",
        });

        setBulkText("");
        setParsedRules([]);

        setTimeout(() => {
          navigate(`/admin/access-control/policy/${policyId}/rules`);
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to create rules");
      }
    } catch (error) {
      console.error("Error creating rules:", error);
      setNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: "error",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ maxWidth: 900, mx: "auto", p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Create Policy Rules
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Single Rule" id="tab-0" />
          <Tab label="Bulk Create" id="tab-1" />
        </Tabs>
      </Box>

      {/* Single Rule Tab */}
      <TabPanel value={tabValue} index={0}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Permission Type */}
            <Grid item size={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Permission Type</InputLabel>
                <Select
                  value={formValues.permission_type}
                  onChange={handleFieldChange("permission_type")}
                  label="Permission Type"
                  required
                >
                  <MenuItem value="p">Permission (p)</MenuItem>
                  <MenuItem value="g">Group/Role (g)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Active Status */}
            <Grid item size={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formValues.is_active ? "true" : "false"}
                  onChange={(e) =>
                    handleFieldChange("is_active")({
                      target: { value: e.target.value === "true" },
                    })
                  }
                  label="Status"
                >
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Rule Values */}
            {[0, 1, 2, 3, 4, 5].map((num) => (
              <Grid item size={12} md={6} key={`rule_v${num}`}>
                <TextField
                  fullWidth
                  label={formatFieldLabel(`rule_v${num}`)}
                  value={formValues[`rule_v${num}`] || ""}
                  onChange={handleFieldChange(`rule_v${num}`)}
                  required={num < 2} // First two fields required
                />
              </Grid>
            ))}

            <Grid
              item
              size={12}
              sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}
            >
              <Button
                variant="outlined"
                color="secondary"
                onClick={() =>
                  navigate(`/admin/access-control/policy/${policyId}/rules`)
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : "Create Rule"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </TabPanel>

      {/* Bulk Create Tab */}
      <TabPanel value={tabValue} index={1}>
        <form onSubmit={handleBulkSubmit}>
          <Typography variant="subtitle1" gutterBottom>
            Enter Casbin Policy Rules
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Use the format: p/g, value0, value1, value2, ... <br />
            Example: p, admin, resource1, read <br />
            Example: g, user1, admin_role
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={10}
            value={bulkText}
            onChange={handleBulkTextChange}
            placeholder="# Example policy rules\np, admin, resource1, read\ng, user1, admin"
            variant="outlined"
            sx={{ mb: 3 }}
          />

          {parsedRules.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Preview: {parsedRules.length} Rules Parsed
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>V0</TableCell>
                      <TableCell>V1</TableCell>
                      <TableCell>V2</TableCell>
                      <TableCell>V3</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedRules.map((rule, index) => (
                      <TableRow key={index}>
                        <TableCell>{rule.permission_type}</TableCell>
                        <TableCell>{rule.rule_v0}</TableCell>
                        <TableCell>{rule.rule_v1}</TableCell>
                        <TableCell>{rule.rule_v2}</TableCell>
                        <TableCell>{rule.rule_v3}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              onClick={handleParseBulkText}
              disabled={!bulkText || bulkSubmitting}
            >
              Parse & Preview
            </Button>

            <Box>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() =>
                  navigate(`/admin/access-control/policy/${policyId}/rules`)
                }
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={bulkSubmitting || parsedRules.length === 0}
              >
                {bulkSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  `Create ${parsedRules.length} Rules`
                )}
              </Button>
            </Box>
          </Box>
        </form>
      </TabPanel>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

function PolicyRuleEdit() {
  const { ruleId } = useParams();
  const navigate = useNavigate();

  const [ruleData, setRuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    async function fetchRuleData() {
      try {
        setLoading(true);
        const response = await api.policyRules.getById(ruleId);

        if (response.success && response.payload?.policyRule) {
          setRuleData(response.payload.policyRule);
        } else {
          throw new Error(response.message || "Failed to load rule data");
        }
      } catch (error) {
        console.error("Error fetching rule:", error);
        setNotification({
          open: true,
          message: `Error: ${error.message}`,
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    if (ruleId) {
      fetchRuleData();
    }
  }, [ruleId]);

  const handleChange = (field) => (event) => {
    setRuleData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!ruleData) {
      setNotification({
        open: true,
        message: "No rule data to update",
        severity: "error",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.policyRules.update(ruleId, ruleData);

      if (response.success) {
        setNotification({
          open: true,
          message: "Rule updated successfully",
          severity: "success",
        });

        setTimeout(() => {
          navigate(
            `/admin/access-control/policy/${ruleData.policy_definition_id}/rules`
          );
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to update rule");
      }
    } catch (error) {
      console.error("Error updating rule:", error);
      setNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ruleData) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load rule data</Alert>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ maxWidth: 800, mx: "auto", p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Edit Policy Rule
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item size={12} md={6}>
            <TextField
              fullWidth
              label="ID"
              value={ruleData.id || ""}
              disabled
              variant="outlined"
              size="small"
            />
          </Grid>

          <Grid item size={12} md={6}>
            <TextField
              fullWidth
              label="Policy Definition ID"
              value={ruleData.policy_definition_id || ""}
              disabled
              variant="outlined"
              size="small"
            />
          </Grid>

          <Grid item size={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Permission Type</InputLabel>
              <Select
                value={ruleData.permission_type || ""}
                onChange={handleChange("permission_type")}
                label="Permission Type"
              >
                <MenuItem value="p">Permission (p)</MenuItem>
                <MenuItem value="g">Group/Role (g)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item size={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={ruleData.is_active ? "true" : "false"}
                onChange={(e) =>
                  setRuleData((prev) => ({
                    ...prev,
                    is_active: e.target.value === "true",
                  }))
                }
                label="Status"
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {[0, 1, 2, 3, 4, 5].map((num) => (
            <Grid item size={12} md={6} key={`rule_v${num}`}>
              <TextField
                fullWidth
                label={formatFieldLabel(`rule_v${num}`)}
                value={ruleData[`rule_v${num}`] || ""}
                onChange={handleChange(`rule_v${num}`)}
                variant="outlined"
                size="small"
              />
            </Grid>
          ))}

          <Grid
            item
            size={12}
            sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}
          >
            <Button
              variant="outlined"
              color="secondary"
              onClick={() =>
                navigate(
                  `/admin/access-control/policy/${ruleData.policy_definition_id}/rules`
                )
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : "Update Rule"}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

function PolicyRuleList() {
  const { policyId } = useParams();
  const navigate = useNavigate();

  const [policyDefinition, setPolicyDefinition] = useState(null);
  const [policyRules, setPolicyRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const policyResponse = await api.policyDefinitions.getById(policyId);
        if (!policyResponse.success) {
          throw new Error(policyResponse.message || "Failed to load policy");
        }

        const rulesResponse = await api.policyRules.getByPolicyId(policyId);
        if (!rulesResponse.success) {
          throw new Error(rulesResponse.message || "Failed to load rules");
        }

        setPolicyDefinition(policyResponse.payload.policyDefinition);
        setPolicyRules(rulesResponse.payload.policyRules);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (policyId) {
      fetchData();
    }
  }, [policyId]);

  const groupedRules = useMemo(() => {
    const groups = {};

    policyRules.forEach((rule) => {
      const type = rule.permission_type || "other";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(rule);
    });

    return groups;
  }, [policyRules]);

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) {
      return;
    }

    try {
      const response = await api.policyRules.delete(ruleId);

      if (response.success) {
        setPolicyRules((prev) => prev.filter((rule) => rule.id !== ruleId));
        setNotification({
          open: true,
          message: "Rule deleted successfully",
          severity: "success",
        });
      } else {
        throw new Error(response.message || "Failed to delete rule");
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
      setNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleDisableRule = async (ruleId) => {
    try {
      const response = await api.policyRules.disable(ruleId);

      if (response.success) {
        setPolicyRules((prev) =>
          prev.map((rule) =>
            rule.id === ruleId ? { ...rule, is_active: false } : rule
          )
        );
        setNotification({
          open: true,
          message: "Rule disabled successfully",
          severity: "success",
        });
      } else {
        throw new Error(response.message || "Failed to disable rule");
      }
    } catch (error) {
      console.error("Error disabling rule:", error);
      setNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Error: {error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5">
              Policy Rules: {policyDefinition?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ID: {policyDefinition?.id} | Total Rules: {policyRules.length}
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() =>
                navigate(`/admin/access-control/policy/edit/${policyId}`)
              }
              sx={{ mr: 2 }}
            >
              Edit Policy
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                navigate(`/admin/access-control/policy/${policyId}/rule/create`)
              }
            >
              Add Rule
            </Button>
          </Box>
        </Box>
      </Paper>

      {Object.keys(groupedRules).length === 0 ? (
        <Alert severity="info">
          No rules found for this policy. Add your first rule.
        </Alert>
      ) : (
        Object.entries(groupedRules).map(([type, rules]) => (
          <Accordion key={type} defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary>
              <Box display="flex" alignItems="center">
                <Chip
                  label={
                    type === "p"
                      ? "Permission"
                      : type === "g"
                        ? "Group/Role"
                        : type
                  }
                  color={
                    type === "p"
                      ? "primary"
                      : type === "g"
                        ? "secondary"
                        : "default"
                  }
                  size="small"
                  sx={{ mr: 2 }}
                />
                <Typography variant="h6">
                  {type === "p"
                    ? "Permission"
                    : type === "g"
                      ? "Group/Role"
                      : type}{" "}
                  Rules ({rules.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>V0</TableCell>
                      <TableCell>V1</TableCell>
                      <TableCell>V2</TableCell>
                      <TableCell>V3</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id} hover>
                        <TableCell>{rule.id}</TableCell>
                        <TableCell>{rule.rule_v0 || "-"}</TableCell>
                        <TableCell>{rule.rule_v1 || "-"}</TableCell>
                        <TableCell>{rule.rule_v2 || "-"}</TableCell>
                        <TableCell>{rule.rule_v3 || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            label={rule.is_active ? "Active" : "Inactive"}
                            color={rule.is_active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                navigate(
                                  `/admin/access-control/policy/rule/edit/${rule.id}`
                                )
                              }
                            >
                              <span role="img" aria-label="edit">
                                ✏️
                              </span>
                            </IconButton>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleDisableRule(rule.id)}
                              disabled={!rule.is_active}
                            >
                              <span role="img" aria-label="disable">
                                🔻
                              </span>
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              <span role="img" aria-label="delete">
                                🗑️
                              </span>
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {policyRules.length > 0 && (
        <PolicyPermissionTester
          policyDefinitionId={policyId}
          policyDefinition={policyDefinition}
          policyRules={policyRules}
        />
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

function PolicyPermissionTester({
  policyDefinitionId,
  policyDefinition,
  policyRules,
}) {
  const [subjectAttributes, setSubjectAttributes] = useState({});
  const [domain, setDomain] = useState("");
  const [object, setObject] = useState("");
  const [action, setAction] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTestCase, setSelectedTestCase] = useState(null);

  const testCases = useMemo(
    () => generateTestCases(policyRules),
    [policyRules]
  );

  const modelText = useMemo(
    () => convertPolicyDefinitionToModel(policyDefinition),
    [policyDefinition]
  );

  const handleSubjectAttributeChange = (key, value) => {
    setSubjectAttributes((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleLoadTestCase = (testCase) => {
    setSelectedTestCase(testCase);
    setSubjectAttributes(testCase.subject || {});
    setDomain(testCase.domain || "");
    setObject(testCase.object || "");
    setAction(testCase.action || "");
  };

  const handleRunTest = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await api.policyRules.test({
        policyDefinitionId,
        subjectAttributes,
        domain,
        object,
        action,
      });

      if (response.success !== false) {
        setTestResult(response.allowed);
      } else {
        throw new Error(response.message || "Test failed");
      }
    } catch (error) {
      console.error("Error testing policy:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSubjectAttributes({});
    setDomain("");
    setObject("");
    setAction("");
    setTestResult(null);
    setSelectedTestCase(null);
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Test Policy Permissions
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid item size={12} md={8}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Subject Attributes
            </Typography>
            <Grid container spacing={2}>
              {[
                "userGroup",
                "workspace",
                "applicationName",
                "userRole",
                "market",
              ].map((attr) => (
                <Grid item size={12} md={4} key={attr}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{formatFieldLabel(attr)}</InputLabel>
                    <Select
                      value={subjectAttributes[attr] || ""}
                      onChange={(e) =>
                        handleSubjectAttributeChange(attr, e.target.value)
                      }
                      label={formatFieldLabel(attr)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {[
                        "HR",
                        "HR-Admin",
                        "Finance",
                        "IT",
                        "admin",
                        "user",
                        "manager",
                      ].map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}

              {[0, 1, 2, 3].map((num) => (
                <Grid item size={12} md={4} key={`rule_v${num}`}>
                  <TextField
                    fullWidth
                    label={formatFieldLabel(`rule_v${num}`)}
                    value={subjectAttributes[`rule_v${num}`] || ""}
                    onChange={(e) =>
                      handleSubjectAttributeChange(
                        `rule_v${num}`,
                        e.target.value
                      )
                    }
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Request Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item size={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Domain</InputLabel>
                    <Select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      label="Domain"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {getUniqueAttributeValues(policyRules, "rule_v1")
                        .filter((v) => v)
                        .map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item size={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Object</InputLabel>
                    <Select
                      value={object}
                      onChange={(e) => setObject(e.target.value)}
                      label="Object"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {getUniqueAttributeValues(policyRules, "rule_v2")
                        .filter((v) => v)
                        .map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                      <MenuItem value="/hr/*">/hr/*</MenuItem>
                      <MenuItem value="/finance/*">/finance/*</MenuItem>
                      <MenuItem value="/admin/access-control/*">
                        /admin/*
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item size={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Action</InputLabel>
                    <Select
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      label="Action"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {["get", "post", "put", "delete", "patch", "*"].map(
                        (value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRunTest}
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                Check Permission
              </Button>

              <Button variant="outlined" onClick={handleClear}>
                Clear Form
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {testResult !== null && !loading && (
              <ResultPaper allowed={testResult}>
                <Typography variant="h6">
                  {testResult
                    ? "✅ Permission Granted"
                    : "❌ Permission Denied"}
                </Typography>
                <Typography variant="body2">
                  {testResult
                    ? "The subject is allowed to perform this action."
                    : "The subject is not allowed to perform this action."}
                </Typography>
              </ResultPaper>
            )}
          </StyledPaper>
        </Grid>

        <Grid item size={12} md={4}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Predefined Test Cases
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {testCases.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {testCases.map((testCase, index) => (
                  <Button
                    key={index}
                    variant={
                      selectedTestCase === testCase ? "contained" : "outlined"
                    }
                    color="info"
                    onClick={() => handleLoadTestCase(testCase)}
                    size="small"
                    sx={{ justifyContent: "flex-start", textAlign: "left" }}
                  >
                    {testCase.name}
                  </Button>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No test cases available. Add policy rules to generate test
                cases.
              </Alert>
            )}
          </StyledPaper>

          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Policy Definition
            </Typography>
            <Box
              sx={{
                backgroundColor: "grey.100",
                p: 1,
                borderRadius: 1,
                fontFamily: "monospace",
                fontSize: 12,
                whiteSpace: "pre-wrap",
                overflow: "auto",
                maxHeight: 300,
              }}
            >
              {modelText || "No model definition available"}
            </Box>
          </StyledPaper>
        </Grid>
      </Grid>
    </Paper>
  );
}

const NotFound = () => {
  return (
    <div style={{ padding: "2rem", color: "red" }}>
      <h2>404 - Page Not Found</h2>
      <p>URL: {window.location.pathname}</p>
    </div>
  );
};

// function AccessControlManagement() {
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
//           <Button color="inherit" component={Link} to="/admin/access-control/">
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

export default function App({ TopLevelMenu, FeatureMenu }) {
  return (
    <Routes>
      <Route
        path="admin/access-control"
        element={
          <LayoutTemplate
            TopLevelMenu={TopLevelMenu}
            FeatureMenu={FeatureMenu}
          />
        }
      >
        <Route path="" element={<PolicyDefinitionList />} />
        <Route path="policy/create" element={<PolicyDefinitionCreate />} />
        <Route path="policy/edit/:id" element={<PolicyDefinitionEdit />} />
        <Route path="policy/:policyId/rules" element={<PolicyRuleList />} />
        <Route
          path="policy/:policyId/rule/create"
          element={<PolicyRuleCreate />}
        />
        <Route path="policy/rule/edit/:ruleId" element={<PolicyRuleEdit />} />
      </Route>
    </Routes>
  );
}
