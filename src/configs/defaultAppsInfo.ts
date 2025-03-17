export type AppInfo = {
	name: string;
	icon: string;
	iconColor: 'inherit' | 'disabled' | 'primary' | 'secondary' | 'action' | 'error' | 'info' | 'success' | 'warning';
	url: string;
	version: string;
	pwaEnabled: boolean;
	category: string;
	description: string;
	defaultAction?: string;
	authorities?: string[];
}

export const defaultAppsInfo: AppInfo[] = [
	{
	  name: "Data Entry",
	  icon: "material-outline:edit",
	  iconColor: "primary",
	  url: "/apps/data-entry",
	  version: "0.0.0-alpha",
	  pwaEnabled: true,
	  category: "Data Management",
	  description: "Enter and manage data records",
	  authorities: ["DATA_ENTRY"]
	},
	{
	  name: "Data Import/Export",
	  icon: "material-outline:import_export",
	  iconColor: "info",
	  url: "/apps/import-export",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "Data Management",
	  description: "Import and export data in various formats",
	  authorities: ["DATA_IMPORT", "DATA_EXPORT"]
	},
	{
	  name: "Data Quality",
	  icon: "material-outline:verified",
	  iconColor: "success",
	  url: "/apps/data-quality",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "Data Management",
	  description: "Check and maintain data quality",
	  authorities: ["DATA_QUALITY"]
	},
	{
	  name: "Data Administration",
	  icon: "material-outline:admin_panel_settings",
	  iconColor: "secondary",
	  url: "/apps/data-administration",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "Data Management",
	  description: "Manage data administration tasks",
	  authorities: ["DATA_ADMIN"]
	},
	{
	  name: "Dashboard",
	  icon: "material-outline:dashboard",
	  iconColor: "info",
	  url: "/apps/dashboard",
	  version: "0.0.0-alpha",
	  pwaEnabled: true,
	  category: "Analytics",
	  description: "View analytical dashboards",
	  authorities: ["DASHBOARD_VIEW"]
	},
	{
	  name: "Data Visualization",
	  icon: "material-outline:chart",
	  iconColor: "info",
	  url: "/apps/data-visualization",
	  version: "0.0.0-alpha",
	  pwaEnabled: true,
	  category: "Analytics",
	  description: "Create and view data visualizations",
	  authorities: ["VISUALIZATION_VIEW", "VISUALIZATION_CREATE"]
	},
	{
	  name: "Reports",
	  icon: "material-outline:assessment",
	  iconColor: "primary",
	  url: "/apps/reports",
	  version: "0.0.0-alpha",
	  pwaEnabled: true,
	  category: "Analytics",
	  description: "Generate and view reports",
	  authorities: ["REPORTS_VIEW"]
	},
	{
	  name: "Analytics",
	  icon: "material-outline:insights",
	  iconColor: "info",
	  url: "/apps/analytics",
	  version: "0.0.0-alpha",
	  pwaEnabled: true,
	  category: "Analytics",
	  description: "Advanced analytics tools",
	  authorities: ["ANALYTICS_VIEW"]
	},
	{
	  name: "Capture",
	  icon: "material-outline:camera_alt",
	  iconColor: "action",
	  url: "/apps/capture",
	  version: "0.0.0-alpha",
	  pwaEnabled: true,
	  category: "Field Operations",
	  description: "Capture field data",
	  authorities: ["CAPTURE_DATA"]
	},
	{
	  name: "Tracker",
	  icon: "material-outline:tracking",
	  iconColor: "secondary",
	  url: "/apps/tracker",
	  version: "0.0.0-alpha",
	  pwaEnabled: true,
	  category: "Field Operations",
	  description: "Track field activities",
	  authorities: ["TRACKER_ACCESS"]
	},
	{
	  name: "Maps",
	  icon: "material-outline:map",
	  iconColor: "info",
	  url: "/apps/maps",
	  version: "0.0.0-alpha",
	  pwaEnabled: true,
	  category: "Field Operations",
	  description: "View geographical data",
	  authorities: ["MAPS_VIEW"]
	},
	{
	  name: "Messaging",
	  icon: "material-outline:chat",
	  iconColor: "primary",
	  url: "/apps/messaging",
	  version: "0.0.0-alpha",
	  pwaEnabled: true,
	  category: "Communication",
	  description: "Internal messaging system",
	  authorities: ["MESSAGING_ACCESS"]
	},
	{
	  name: "SMS Manager",
	  icon: "material-outline:phone",
	  iconColor: "primary",
	  url: "/apps/sms-manager",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "Communication",
	  description: "Manage SMS communications",
	  authorities: ["SMS_MANAGE"]
	},
	{
	  name: "Interpretation",
	  icon: "material-outline:translate",
	  iconColor: "info",
	  url: "/apps/interpretation",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "Communication",
	  description: "Data interpretation tools",
	  authorities: ["INTERPRETATION_ACCESS"]
	},
	{
	  name: "User",
	  icon: "material-outline:people",
	  iconColor: "secondary",
	  url: "/apps/people",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "System Administration",
	  description: "Manage user accounts and authorities",
	  authorities: ["USER_MANAGE"]
	},
	{
	  name: "Settings",
	  icon: "material-outline:settings",
	  iconColor: "warning",
	  url: "/apps/settings",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "System Administration",
	  description: "System configuration settings",
	  authorities: ["SETTINGS_MANAGE"]
	},
	{
	  name: "Cache Cleaner",
	  icon: "material-outline:delete_sweep",
	  iconColor: "error",
	  url: "/apps/cache-cleaner",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "System Administration",
	  description: "Clear system cache",
	  authorities: ["CACHE_MANAGE"]
	},
	{
	  name: "User Profile",
	  icon: "material-outline:account_circle",
	  iconColor: "primary",
	  url: "/apps/user-profile",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "User Account",
	  description: "Manage personal profile",
	  authorities: ["PROFILE_VIEW"]
	},
	{
	  name: "Metadata Manager",
	  icon: "material-outline:description",
	  iconColor: "warning",
	  url: "/apps/metadata-manager",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "Metadata",
	  description: "Manage system metadata",
	  authorities: ["METADATA_MANAGE"]
	},
	{
	  name: "App Management",
	  icon: "material-outline:settings_applications",
	  iconColor: "action",
	  url: "/apps/app-management",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "Utilities",
	  description: "Manage system applications",
	  authorities: ["APP_MANAGE"]
	},
	{
	  name: "Menu Manager",
	  icon: "material-outline:menu",
	  iconColor: "inherit",
	  url: "/apps",
	  version: "0.0.0-alpha",
	  pwaEnabled: false,
	  category: "Utilities",
	  description: "Customize menu layouts",
	  authorities: ["MENU_MANAGE"]
	},
];


// Helper function to get apps by category
export const getAppsByCategory = (apps: AppInfo[]): Record<string, AppInfo[]> => {
	return apps.reduce((acc, app) => {
	  if (!acc[app.category]) {
		acc[app.category] = [];
	  }
	  acc[app.category].push(app);
	  return acc;
	}, {} as Record<string, AppInfo[]>);
  };
  
  // Helper function to get PWA-enabled apps
export const getPwaEnabledApps = (apps: AppInfo[]): AppInfo[] => {
	return apps.filter(app => app.pwaEnabled);
};
  
  // Helper function to check if an app has specific authorities
  export const hasAppAuthorities = (app: AppInfo, userAuthorities: string[]): boolean => {
	if (!app.authorities) return true;
	return app.authorities.every(authority => userAuthorities.includes(authority));
  };
  