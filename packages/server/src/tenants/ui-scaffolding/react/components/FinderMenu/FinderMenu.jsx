import "./FinderMenu.css";

import React, { useState, useRef, useEffect } from "react";
import * as lucide from "lucide-react";
import { useNavigate } from "react-router-dom";

// Custom SVG icons
const IconRecents = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.29-3.52-2.09V8z" />
  </svg>
);

const IconDocuments = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  </svg>
);

const IconDesktop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z" />
  </svg>
);

const IconDownloads = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </svg>
);

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const IconComputer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
  </svg>
);

const IconAirDrop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
  </svg>
);

const IconNetwork = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
  </svg>
);

const IconCloud = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
  </svg>
);

const IconApplications = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
  </svg>
);

const IconUtilities = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
  </svg>
);

const IconFolder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
);

// Map of icon components
const ICONS = {
  recents: <IconRecents />,
  documents: <IconDocuments />,
  desktop: <IconDesktop />,
  downloads: <IconDownloads />,
  home: <IconHome />,
  computer: <IconComputer />,
  airDrop: <IconAirDrop />,
  network: <IconNetwork />,
  cloud: <IconCloud />,
  applications: <IconApplications />,
  utilities: <IconUtilities />,
  folder: <IconFolder />,
  ObjectDocumentStorage: <lucide.FileDigit />,
  AdminWorkspace: <lucide.Box />,
  AdminAccessControl: <lucide.KeyRound />,
  FlatJson: <lucide.Logs />,
};

// Action handlers for menu items
const MENU_ACTIONS = {
  // Menu bar actions
  finder: () => console.log("Action: Finder menu"),
  file: () => console.log("Action: File menu"),
  edit: () => console.log("Action: Edit menu"),
  view: () => console.log("Action: View menu"),
  go: () => console.log("Action: Go menu"),
  window: () => console.log("Action: Window menu"),
  help: () => console.log("Action: Help menu"),

  // Go menu actions
  back: () => console.log("Action: Back"),
  forward: () => console.log("Action: Forward"),
  selectStartupDisk: () => console.log("Action: Select Startup Disk"),
  recents: () => console.log("Action: Recents"),
  documents: () => console.log("Action: Documents"),
  desktop: () => console.log("Action: Desktop"),
  downloads: () => console.log("Action: Downloads"),
  home: (id, item) => {
    window.location.href = "/";
  },
  computer: () => console.log("Action: Computer"),
  airDrop: () => console.log("Action: AirDrop"),
  network: () => console.log("Action: Network"),
  iCloudDrive: () => console.log("Action: iCloud Drive"),
  applications: () => console.log("Action: Applications"),
  utilities: () => console.log("Action: Utilities"),
  recentFolders: () => console.log("Action: Recent Folders"),
  goToFolder: () => console.log("Action: Go to Folder"),
  connectToServer: () => console.log("Action: Connect to Server"),

  // Recent folders submenu actions
  recentFolder1: () => console.log("Action: Recent Folder - Documents"),
  recentFolder2: () => console.log("Action: Recent Folder - Downloads"),
  recentFolder3: () => console.log("Action: Recent Folder - Desktop"),
  ObjectDocumentStorage: (id, item) => {
    if (item.goTo) window.location.href = item.goTo;
  },
  AdminWorkspace: (id, item) => {
    if (item.goTo) window.location.href = item.goTo;
  },
  AdminAccessControl: (id, item) => {
    if (item.goTo) window.location.href = item.goTo;
  },
  FlatJson: (id, item) => {
    if (item.goTo) window.location.href = item.goTo;
  },
  navigateTo: (id, item) => {
    if (item.goTo) window.location.href = item.goTo;
  },
};

// Menu data structure with nested submenus
const MENU_BAR_ITEMS = [
  { id: "home", label: "SelfServe HQ", bold: true },
  { id: "file", label: "File", bold: false },
  { id: "edit", label: "Edit", bold: false },
  {
    id: "view",
    label: "View",
    bold: false,
    submenu: [
      // {
      //   isDark: true, // First section has dark background
      //   items: [
      //     { id: "back", text: "Back", shortcut: "⌘[" },
      //     { id: "forward", text: "Forward", shortcut: "⌘]" },
      //     {
      //       id: "selectStartupDisk",
      //       text: "Select Startup Disk",
      //       shortcut: "⌥⌘T",
      //     },
      //   ],
      // },
      {
        items: [
          {
            id: "ObjectDocumentStorage",
            text: "Object Document Storage",
            shortcut: "⌥⌘D",
            icon: "ObjectDocumentStorage",
            goTo: "/object-based-storage",
            clickEventType: "navigateTo",
          },
          {
            id: "AdminWorkspace",
            text: "Admin > Workspace",
            shortcut: "⌥⌘L",
            icon: "AdminWorkspace",
            goTo: "/admin/workspace/",
          },
          {
            id: "AdminAccessControl",
            text: "Admin > Access Control",
            shortcut: "⌥⌘H",
            icon: "AdminAccessControl",
            goTo: "/admin/access-control",
          },
          {
            id: "FlatJson",
            text: "Flatten JSON",
            shortcut: "⌥⌘H",
            icon: "FlatJson",
            goTo: "/flat-json/",
          },
          {
            id: "computer",
            text: "Computer",
            shortcut: "⌥⌘C",
            icon: "computer",
          },
          { id: "airDrop", text: "AirDrop", shortcut: "⌥⌘R", icon: "airDrop" },
          { id: "network", text: "Network", shortcut: "⌥⌘K", icon: "network" },
          {
            id: "iCloudDrive",
            text: "iCloud Drive",
            shortcut: "⌥⌘I",
            icon: "cloud",
          },
          { id: "recents", text: "Recents", shortcut: "⌥⌘F", icon: "recents" },
          {
            id: "documents",
            text: "Documents",
            shortcut: "⌥⌘O",
            icon: "documents",
          },
          {
            id: "applications",
            text: "Applications",
            shortcut: "⌥⌘A",
            icon: "applications",
            isSelected: true,
          },
          {
            id: "utilities",
            text: "Utilities",
            shortcut: "⌥⌘U",
            icon: "utilities",
            divider: true,
          },
        ],
      },
      {
        items: [
          {
            id: "recentFolders",
            text: "Recent Folders",
            shortcut: "›",
            isSpecial: true,
            submenu: [
              { id: "recentFolder1", text: "Documents", icon: "documents" },
              { id: "recentFolder2", text: "Downloads", icon: "downloads" },
              { id: "recentFolder3", text: "Desktop", icon: "desktop" },
            ],
          },
          {
            id: "goToFolder",
            text: "Go to Folder...",
            shortcut: "⌥⌘G",
            icon: "folder",
          },
          {
            id: "connectToServer",
            text: "Connect to Server...",
            shortcut: "⌘K",
            icon: "computer",
          },
        ],
      },
    ],
  },
  {
    id: "go",
    label: "Go",
    bold: true,
    submenu: [
      {
        items: [
          {
            id: "ObjectDocumentStorage",
            text: "Object Document Storage",
            shortcut: "⌥⌘D",
            icon: "ObjectDocumentStorage",
            goTo: "/object-based-storage",
            clickEventType: "navigateTo",
          },
          {
            id: "AdminWorkspace",
            text: "Admin > Workspace",
            shortcut: "⌥⌘L",
            icon: "AdminWorkspace",
            goTo: "/admin/workspace/",
          },
          {
            id: "AdminAccessControl",
            text: "Admin > Access Control",
            shortcut: "⌥⌘H",
            icon: "AdminAccessControl",
            goTo: "/admin/access-control",
          },
          {
            id: "FlatJson",
            text: "Flatten JSON",
            shortcut: "⌥⌘H",
            icon: "FlatJson",
            goTo: "/flat-json/",
          },
        ],
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    bold: false,
    submenu: [
      {
        isDark: true, // First section has dark background
        items: [
          {
            id: "navigateTo",
            text: "Single Automation Test Visualization",
            goTo: "/reports/automation-test-visualization",
          },
        ],
      },
    ],
  },
  { id: "help", label: "Help", bold: false },
];

// Helper component for standard menu items
const MenuItem = ({
  id,
  icon,
  text,
  shortcut,
  isSelected = false,
  divider = false,
  onClick,
  hasSubmenu = false,
  submenuItems = null,
}) => {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const itemRef = useRef(null);

  const menuItemClasses = `menu-item ${isSelected ? "selected" : ""} ${divider ? "with-divider" : ""}`;

  const handleMouseEnter = () => {
    if (hasSubmenu) {
      setShowSubmenu(true);
    }
  };

  const handleMouseLeave = () => {
    if (hasSubmenu) {
      setShowSubmenu(false);
    }
  };

  const handleClick = () => {
    if (!hasSubmenu) {
      onClick(id);
    }
  };

  return (
    <div
      className={menuItemClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={itemRef}
    >
      <div className="menu-item-content">
        {icon && <div className="menu-item-icon">{icon}</div>}
        <span>{text}</span>
      </div>
      <span className="menu-item-shortcut">{shortcut}</span>

      {hasSubmenu && showSubmenu && (
        <div className="submenu">
          {submenuItems.map((item) => (
            <MenuItem
              key={item.id}
              id={item.id}
              icon={item.icon ? ICONS[item.icon] : null}
              text={item.text}
              shortcut={item.shortcut}
              isSelected={item.isSelected}
              divider={item.divider}
              onClick={onClick}
              hasSubmenu={!!item.submenu}
              submenuItems={item.submenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Special component for Recent Folders menu item
const RecentFoldersItem = ({ id, text, shortcut, submenu, onClick }) => {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const itemRef = useRef(null);

  const handleMouseEnter = () => {
    setShowSubmenu(true);
  };

  const handleMouseLeave = () => {
    setShowSubmenu(false);
  };

  return (
    <div
      className="recent-folders-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={itemRef}
    >
      <span>{text}</span>
      <span className="menu-item-shortcut">{shortcut}</span>

      {showSubmenu && submenu && (
        <div className="submenu">
          {submenu.map((item) => (
            <MenuItem
              key={item.id}
              id={item.id}
              icon={item.icon ? ICONS[item.icon] : null}
              text={item.text}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Recursive component for rendering menu and submenus
const MenuRenderer = ({ sections, onItemClick }) => {
  return (
    <>
      {sections.map((section, index) => (
        <div
          key={index}
          className={`menu-section ${section.isDark ? "dark" : ""}`}
        >
          {section.items.map((item) =>
            item.isSpecial ? (
              <RecentFoldersItem
                key={item.id}
                id={item.id}
                text={item.text}
                shortcut={item.shortcut}
                submenu={item.submenu}
                onClick={() => onItemClick(item.id, item)}
              />
            ) : (
              <MenuItem
                key={item.id}
                id={item.id}
                icon={item.icon ? ICONS[item.icon] : null}
                text={item.text}
                shortcut={item.shortcut}
                isSelected={item.isSelected}
                divider={item.divider}
                onClick={() => onItemClick(item.id, item)}
                hasSubmenu={!!item.submenu}
                submenuItems={item.submenu}
              />
            )
          )}
        </div>
      ))}
    </>
  );
};

// Main FinderMenu component
const FinderMenu = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRefs = useRef({});
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        activeMenu &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        (!menuRefs.current[activeMenu] ||
          !menuRefs.current[activeMenu].contains(event.target))
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenu]);

  // Handle menu item click
  const handleMenuItemClick = (itemId, item) => {
    if (MENU_ACTIONS[itemId]) {
      MENU_ACTIONS[itemId](itemId, item);
    } else {
      console.log(`unknown event ${itemId}`);
    }
    setActiveMenu(null);
  };

  // Handle clicking on menu bar item
  const handleMenuBarClick = (menuId) => {
    const menuItem = MENU_BAR_ITEMS.find((item) => item.id === menuId);

    if (menuItem && MENU_ACTIONS[menuItem.id]) {
      MENU_ACTIONS[menuItem.id]();
    }

    if (menuItem && menuItem.submenu) {
      setActiveMenu(activeMenu === menuId ? null : menuId);
    }
  };

  return (
    <div className="macos-window">
      {/* Menu Bar */}
      <div className="menu-bar">
        {MENU_BAR_ITEMS.map((item) => (
          <React.Fragment key={item.id}>
            <div
              ref={(el) => (menuRefs.current[item.id] = el)}
              className={`menu-bar-item ${item.bold ? "bold" : ""} ${activeMenu === item.id ? "active" : ""}`}
              onClick={() => handleMenuBarClick(item.id, item)}
            >
              {item.label}
            </div>

            {activeMenu === item.id && item.submenu && (
              <div
                className="dropdown-menu"
                ref={dropdownRef}
                style={{
                  left: menuRefs.current[item.id]
                    ? menuRefs.current[item.id].offsetLeft
                    : 0,
                }}
              >
                <MenuRenderer
                  sections={item.submenu}
                  onItemClick={handleMenuItemClick}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default FinderMenu;
