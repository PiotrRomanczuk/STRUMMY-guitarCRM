# MCP Servers List

## 📂 Project-Specific MCP Servers

These are defined in `.vscode/mcp.json` (and `.vscode/settings.json` for `shadcn-ui`).

| Server Name | Type | Source / Command | Status | Auth |
| :--- | :--- | :--- | :--- | :--- |
| **next-devtools** | Command | `npx -y next-devtools-mcp@latest` | ✅ Connected | No |
| **sentry** | HTTP | `https://mcp.sentry.dev/mcp` | ❌ Not Connected | Yes |
| **supabase** | HTTP | `https://mcp.supabase.com/mcp` | ✅ Connected | Yes |
| **shadcn** | Command | `npx shadcn@latest mcp` | ✅ Connected | No |
| **github** | Command | `npx -y @modelcontextprotocol/server-github` | ✅ Connected | Yes (PAT) |
| **vercel** | Command | `npx -y @vercel/mcp-server` | ✅ Connected | Yes (VERCEL_TOKEN) |

## 🌐 Global / Extension MCP Servers

These servers are active in the VS Code environment (provided by extensions or global configuration).

| Server Name | Prefix | Functionality | Status | Auth |
| :--- | :--- | :--- | :--- | :--- |
| **Chrome DevTools** | `mcp_chromedevtool_` | Browser automation, console logs, and page inspection. | ✅ Connected | No (extension-provided) |
| **Container Tools** | `mcp_copilot_conta_` | Docker/Container management (images, containers, volumes). | ✅ Connected | No (extension-provided) |
| **GitKraken** | `mcp_gitkraken_` | Git operations and visualization tools. | ✅ Connected | Depends (Git auth via extension) |
| **Microsoft Docs** | `mcp_microsoftdocs_` | Search and retrieval of Microsoft documentation and code samples. | ✅ Connected | No (extension-provided) |
| **Postman** | `mcp_postmanlabs_` | API development, collections, and environment management. | ✅ Connected | Depends (API key for some ops) |
