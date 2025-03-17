import { Link, Outlet } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  ShowChart as ShowChartIcon,
  ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material";

const DRAWER_WIDTH = 240;

export default function Layout() {
  return (
    <Box sx={{ display: "flex" }}>
      {/* Top Bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Optimo Analytics
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Side Menu */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar /> {/* This creates space for the AppBar */}
        <Box sx={{ overflow: "auto" }}>
          <List>
            <ListItem button component={Link} to="/">
              <ListItemIcon>
                <ShowChartIcon />
              </ListItemIcon>
              <ListItemText primary="Sales Overview" />
            </ListItem>
            <ListItem button component={Link} to="/orders">
              <ListItemIcon>
                <ShoppingCartIcon />
              </ListItemIcon>
              <ListItemText primary="Orders" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
        }}
      >
        <Toolbar /> {/* This creates space for the AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
}
