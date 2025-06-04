import React, { useState, useEffect, createContext, useContext } from "react";
import ReactDOM from "react-dom/client";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Box,
  Paper,
  List,
  Divider,
  Badge,
  Drawer,
  Tooltip,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import {
  Mail,
  Reply,
  RefreshCw,
  Forward,
  Trash,
  Archive,
  Search,
  Check,
  MoreHorizontal,
  Bell,
  Settings,
  User,
  ChevronDown,
  PlusCircle,
  Copy,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Inbox,
  Send,
  FileText,
  Folder,
  Home,
} from "lucide-react";
import "./FeatureMenu.css";

function removeDuplicateById(arr) {
  const seen = new Set();
  return arr.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

const AppMenuDataContext = createContext();

const useAppMenuDataContext = () => useContext(AppMenuDataContext);

// ============================================================================
// CONTEXT AND SERVICE HOOKS
// ============================================================================
const EmailContext = createContext();

const useEmailContext = () => useContext(EmailContext);

const useEmailService = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFolder, setCurrentFolder] = useState("inbox");

  const fetchEmails = async (folderId = currentFolder) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data
      const mockEmails = [
        {
          id: 1,
          subject: "Project Update - Latest Changes for Review",
          from: "jane.smith@example.com",
          date: new Date(),
          read: true,
          content:
            "Hello, I wanted to share the latest project updates with you. We've made significant progress on the frontend implementation.",
        },
        {
          id: 2,
          subject: "Meeting Tomorrow at 10:00 AM",
          from: "john.doe@example.com",
          date: new Date(),
          read: false,
          content:
            "Please join us for an important team meeting tomorrow at 10:00 AM in Conference Room A. We'll be discussing quarterly goals.",
        },
        {
          id: 3,
          subject: "Quarterly Report - Q2 2023",
          from: "reports@company.com",
          date: new Date(),
          read: false,
          content:
            "Attached is the quarterly report for Q2 2023. Please review and provide your feedback by next Friday.",
        },
      ];

      setEmails(mockEmails);
      setError(null);
    } catch (err) {
      setError("Failed to fetch emails");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteEmail = async (id) => {
    try {
      setEmails(emails.filter((email) => email.id !== id));
    } catch (err) {
      setError("Failed to delete email");
      console.error(err);
    }
  };

  const archiveEmail = async (id) => {
    try {
      setEmails(emails.filter((email) => email.id !== id));
    } catch (err) {
      setError("Failed to archive email");
      console.error(err);
    }
  };

  const markAsRead = async (id, read = true) => {
    try {
      setEmails(
        emails.map((email) => (email.id === id ? { ...email, read } : email))
      );
    } catch (err) {
      setError("Failed to update email");
      console.error(err);
    }
  };

  const changeFolder = (folderId) => {
    setCurrentFolder(folderId);
    fetchEmails(folderId);
  };

  return {
    emails,
    loading,
    error,
    currentFolder,
    fetchEmails,
    deleteEmail,
    archiveEmail,
    markAsRead,
    changeFolder,
  };
};

// ============================================================================
// REUSABLE UI COMPONENTS
// ============================================================================
const Avatar = ({ children, ...props }) => {
  return (
    <Box
      {...props}
      sx={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        bgcolor: "primary.main",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

const ActionButton = ({ icon, label, onClick, disabled }) => {
  return (
    <Tooltip title={label}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mx: 1,
        }}
      >
        <IconButton
          onClick={onClick}
          disabled={disabled}
          sx={{
            color: disabled ? "text.disabled" : "text.primary",
            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
          }}
        >
          {icon}
        </IconButton>
        <Typography variant="caption" sx={{ mt: 0.5 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
};

const GenericDropdown = ({ icon, menuItems, handlers }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (actionType) => {
    if (handlers[actionType]) {
      handlers[actionType]();
    }
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small" sx={{ mr: 1 }}>
        {icon}
        <ChevronDown size={16} />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {menuItems.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => handleMenuItemClick(item.action)}
          >
            <Box sx={{ mr: 2, display: "flex" }}>{item.icon}</Box>
            <Typography>{item.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// Custom ListItem to avoid DOM nesting issues
const CustomListItem = ({
  icon,
  primary,
  secondary,
  tertiary,
  selected,
  onClick,
  badge,
  className,
  ...props
}) => {
  return (
    <div
      className={`custom-list-item ${selected ? "selected" : ""} ${className || ""}`}
      onClick={onClick}
      {...props}
    >
      {icon && <div className="folder-icon">{icon}</div>}

      <div className="list-item-content">
        {primary && <div className="list-item-primary">{primary}</div>}
        {secondary && <div className="list-item-secondary">{secondary}</div>}
        {tertiary && <div className="list-item-tertiary">{tertiary}</div>}
      </div>

      {badge && <Badge badgeContent={badge} color="primary" />}
    </div>
  );
};

const ActionToolbar = ({
  selectedEmail,
  actions,
  handleDelete,
  handleArchive,
  handleMarkAsRead,
}) => {
  const appMenuData = useAppMenuDataContext();

  // Create handlers object for the dropdown menus
  const dropdownHandlers = {
    delete: handleDelete,
    archive: handleArchive,
    markRead: () => selectedEmail && handleMarkAsRead(selectedEmail.id, true),
    markUnread: () =>
      selectedEmail && handleMarkAsRead(selectedEmail.id, false),
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        p: 0.5,
        bgcolor: "background.default",
      }}
    >
      {actions.map((action, index) => (
        <React.Fragment key={action.id}>
          <ActionButton
            icon={action.icon}
            label={action.label}
            onClick={action.onClick}
            disabled={action.requiresSelection && !selectedEmail}
          />
          {action.divider === "after" && (
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          )}
        </React.Fragment>
      ))}

      {/* Add the delete dropdown after the appropriate divider */}
      <GenericDropdown
        icon={<Trash size={20} />}
        menuItems={appMenuData.deleteMenu}
        handlers={dropdownHandlers}
      />

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Add the mark dropdown */}
      <GenericDropdown
        icon={<Check size={20} />}
        menuItems={appMenuData.markMenu}
        handlers={dropdownHandlers}
      />
    </Paper>
  );
};

const FolderNav = ({ folders, currentFolder, onFolderChange }) => {
  return (
    <Drawer
      variant="persistent"
      open={true}
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
          position: "relative",
          border: "none",
          borderRight: 1,
          borderColor: "divider",
        },
      }}
    >
      <List sx={{ p: 0 }}>
        {folders.map((folder) => (
          <CustomListItem
            key={folder.id}
            icon={folder.icon}
            primary={folder.name}
            selected={folder.id === currentFolder}
            onClick={() => onFolderChange(folder.id)}
            badge={folder.badge}
          />
        ))}
      </List>
    </Drawer>
  );
};

const EmailList = ({
  emails,
  loading,
  error,
  selectedEmail,
  onSelectEmail,
}) => {
  return (
    <Box
      sx={{
        width: 350,
        borderRight: 1,
        borderColor: "divider",
        overflow: "auto",
      }}
    >
      {loading ? (
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography>Loading emails...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{ p: 2, textAlign: "center", color: "error.main" }}>
          <Typography>{error}</Typography>
        </Box>
      ) : (
        <div className="email-list">
          {emails.map((email) => (
            <CustomListItem
              key={email.id}
              primary={
                <span
                  style={{
                    fontWeight: email.read ? "normal" : "bold",
                  }}
                >
                  {email.subject}
                </span>
              }
              secondary={email.from}
              tertiary={new Date(email.date).toLocaleString()}
              selected={selectedEmail && selectedEmail.id === email.id}
              onClick={() => onSelectEmail(email)}
              style={{
                borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
                backgroundColor: email.read
                  ? "transparent"
                  : "rgba(0, 120, 212, 0.05)",
              }}
            />
          ))}
          {emails.length === 0 && (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography>No emails to display</Typography>
            </Box>
          )}
        </div>
      )}
    </Box>
  );
};

const EmailViewer = ({ email, children }) => {
  return (
    <div
      sx={{
        display: "block",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <div variant="h6" color="text.secondary" sx={{ mt: 2 }}>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">{email.subject}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small">
          <ArrowLeft size={20} />
        </IconButton>
        <IconButton size="small">
          <ArrowRight size={20} />
        </IconButton>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box sx={{ mr: 2 }}>
            <Avatar>{email.from.charAt(0).toUpperCase()}</Avatar>
          </Box>
          <Box>
            <Typography variant="subtitle1">{email.from}</Typography>
            <Typography variant="caption" color="text.secondary">
              To: me
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {new Date(email.date).toLocaleString()}
          </Typography>
        </Box>

        <Typography variant="body1">
          {email.content ||
            "This is the email content. In a real application, this would be the actual content of the email, which could include formatted text, images, and attachments."}
        </Typography>
      </Paper>
    </>
  );
};

const StatusBar = ({ loading, emailCount }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.default",
        p: 0.5,
        px: 2,
      }}
    >
      <Typography variant="caption">{loading ? "Syncing..." : ``}</Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Typography variant="caption"></Typography>
    </Box>
  );
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
const FeatureMenu = ({ menuitems = {}, onClick, children }) => {
  const emailService = useEmailService();

  const {
    emails,
    loading,
    error,
    currentFolder,
    fetchEmails,
    deleteEmail,
    archiveEmail,
    markAsRead,
    changeFolder,
  } = emailService;

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Handler functions
  const handleNewMail = () => console.log("New mail clicked");
  const handleReply = () => console.log("Reply clicked", selectedEmail?.id);
  const handleReplyAll = () =>
    console.log("Reply all clicked", selectedEmail?.id);
  const handleForward = () => console.log("Forward clicked", selectedEmail?.id);
  const handleDelete = () => {
    if (selectedEmail) {
      deleteEmail(selectedEmail.id);
      setSelectedEmail(null);
    }
  };
  const handleArchive = () => {
    if (selectedEmail) {
      archiveEmail(selectedEmail.id);
      setSelectedEmail(null);
    }
  };
  const handleSearch = (e) => setSearchQuery(e.target.value);
  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    if (!email.read) {
      markAsRead(email.id);
    }
  };
  const handleFolderChange = (folderId) => {
    changeFolder(folderId);
    setSelectedEmail(null);
  };

  const appMenuData = {
    folders: [
      { id: "inbox", name: "Inbox", icon: <Inbox size={20} />, badge: 2 },
      { id: "sent", name: "Sent Items", icon: <Send size={20} /> },
      { id: "drafts", name: "Drafts", icon: <FileText size={20} /> },
      { id: "deleted", name: "Deleted Items", icon: <Trash size={20} /> },
      { id: "archive", name: "Archive", icon: <Archive size={20} /> },
      { id: "personal", name: "Personal", icon: <Folder size={20} /> },
    ],
    actions: removeDuplicateById([
      ...(menuitems.actions ? menuitems.actions : []),
      {
        id: "new",
        label: "Create New Object",
        icon: <Mail size={20} />,
        divider: "after",
        goTo: "new",
        clickEventType: "navigateTo",
      },
      {
        id: "reply",
        label: "Reply",
        icon: <Reply size={20} />,
        requiresSelection: true,
      },
      {
        id: "replyAll",
        label: "Reply All",
        icon: <Reply size={20} />,
        requiresSelection: true,
      },
      {
        id: "forward",
        label: "Forward",
        icon: <Forward size={20} />,
        requiresSelection: true,
        divider: "after",
      },
      {
        id: "mark",
        label: "Mark",
        icon: <Check size={20} />,
        requiresSelection: true,
        divider: "after",
      },
      { id: "sync", label: "Sync", icon: <RefreshCw size={20} /> },
      { id: "more", label: "More", icon: <MoreHorizontal size={20} /> },
    ]),
    deleteMenu: [
      {
        id: "delete",
        label: "Delete",
        icon: <Trash size={18} />,
        action: "delete",
      },
      {
        id: "archive",
        label: "Archive",
        icon: <Archive size={18} />,
        action: "archive",
      },
    ],
    markMenu: [
      {
        id: "read",
        label: "Mark as Read",
        icon: <Check size={18} />,
        action: "markRead",
      },
      {
        id: "unread",
        label: "Mark as Unread",
        icon: <AlertCircle size={18} />,
        action: "markUnread",
      },
    ],
  };

  // Create actions array with handler functions
  const toolbarActions = appMenuData.actions.map((action) => {
    if (action.onClick)
      return { ...action, onClick: (event) => action.onClick(event, action) };

    return { ...action, onClick: () => console.log("add click event", action) };
  });

  // Fetch emails on mount
  useEffect(() => {
    fetchEmails();
  }, []);

  // Filter emails based on search query if provided
  const filteredEmails = searchQuery
    ? emails.filter(
        (email) =>
          email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.from.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : emails;

  return (
    <AppMenuDataContext.Provider value={appMenuData}>
      <EmailContext.Provider value={emailService}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <ActionToolbar
            selectedEmail={selectedEmail}
            actions={toolbarActions}
            handleDelete={handleDelete}
            handleArchive={handleArchive}
            handleMarkAsRead={markAsRead}
          />

          <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
            {/* <FolderNav
              folders={appMenuData.folders}
              currentFolder={currentFolder}
              onFolderChange={handleFolderChange}
            />

            <EmailList
              emails={filteredEmails}
              loading={loading}
              error={error}
              selectedEmail={selectedEmail}
              onSelectEmail={handleSelectEmail}
            /> */}

            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                p: 2,
                bgcolor: "background.default",
                overflow: "auto",
              }}
            >
              <EmailViewer email={selectedEmail}>{children}</EmailViewer>
            </Box>
          </Box>

          <StatusBar loading={loading} emailCount={filteredEmails.length} />
        </Box>
      </EmailContext.Provider>
    </AppMenuDataContext.Provider>
  );
};

export default FeatureMenu;
