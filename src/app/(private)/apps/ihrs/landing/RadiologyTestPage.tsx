import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CssBaseline,
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  useTheme,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import {
  TableChart,
  ViewModule,
  Assignment,
  Save,
  Menu as MenuIcon,
} from "@mui/icons-material";

// Import the four data capture components
import DynamicTableInterface from "../components/DynamicTableInterface";
import CardBasedEntrySystem from "../components/CardBasedEntrySystem";
import WizardStyleDataEntry from "../components/WizardStyleDataEntry";
import TemplateBasedApproach from "../components/TemplateBasedApproach";

const drawerWidth = 240;

function RadiologyTestPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState("dynamic-table");

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: "dynamic-table", text: "Dynamic Table", icon: <TableChart /> },
    { id: "card-based", text: "Card Based Entry", icon: <ViewModule /> },
    { id: "wizard-style", text: "Wizard Style", icon: <Assignment /> },
    { id: "template-based", text: "Template Based", icon: <Save /> },
  ];

  const renderActiveComponent = () => {
    switch (activeView) {
      case "dynamic-table":
        return <DynamicTableInterface />;
      case "card-based":
        return <CardBasedEntrySystem />;
      case "wizard-style":
        return <WizardStyleDataEntry />;
      case "template-based":
        return <TemplateBasedApproach />;
      default:
        return <DynamicTableInterface />;
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Data Capture App
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={activeView === item.id}
              onClick={() => {
                setActiveView(item.id);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <Box
            sx={{
              mr: 2,
              display: { sm: "none" },
            }}
          >
            <MenuIcon onClick={handleDrawerToggle} sx={{ cursor: "pointer" }} />
          </Box>
          <Typography variant="h6" noWrap component="div">
            {menuItems.find((item) => item.id === activeView)?.text ||
              "Radiology Data Entry"}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: ["56px", "64px"],
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {renderActiveComponent()}
        </Container>
      </Box>
    </Box>
  );
}

export default RadiologyTestPage;