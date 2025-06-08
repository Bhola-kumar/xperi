# Xperi Consolidated User Interface

A Node.js frontend application that consolidates various Xperi solutions including Mail Management Engine, Preprocessing Engine, TV Metadata Matching Engine, QA Engine, Report Validation Engine, and Chat Assistant.

## Prerequisites

- Node.js (v20 or higher)
- npm (Node Package Manager)
- Tested on `Node.js v22.12.0`.

## Environment Setup

1. Clone the repository:

```bash
git clone https://code.gramener.com/xperi/consolidated-user-interface/consolidated-user-interface.git
cd consolidated-user-interface
```

2. If you are behind a proxy, before installation, create a `.npmrc` file and add the following content (update proxy details):

```bash
touch .npmrc
echo http_proxy=http://proxy.domain.com:8080    >> .npmrc
echo https_proxy=http://proxy.domain.com:8080   >> .npmrc
echo strict-ssl=false                           >> .npmrc
echo registry=https://registry.npmjs.org/       >> .npmrc
echo node-options=--tls-min-v1.2                >> .npmrc
```

3. Install dependencies:

```bash
npm install
```

### VSCode Configuration

1. Create `.vscode` directory in project root if it doesn't exist
2. Create/update `launch.json` with the below configuration:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Local Development",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:dev"],
      "env": {
        "NODE_ENV": "development"
      },
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Express App",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/app.js",
      "env": {
        "NODE_ENV": "local",
        "PORT": "3000"
      },
      "outFiles": ["${workspaceFolder}/**/*.js"],
      "console": "integratedTerminal",
      "restart": true,
      "sourceMaps": true
    }
  ]
}
```

This configuration provides two debug options:

1. **Launch Local Development**

   - Uses `npm run start:dev` to start the application.
   - Perfect for regular development work.
   - Runs with development environment settings (.env.development).
   - Shows output in VS Code's integrated terminal.

2. **Debug Express App**
   - Enables step-by-step debugging of the application.
   - Auto-restarts when files change.
   - Supports source maps for better debugging.
   - Runs on port 3000 by default.
   - Ideal for troubleshooting issues.

**To use**:

1. Open VS Code's Run and Debug view (Ctrl+Shift+D).
2. Select desired configuration from dropdown.
3. Press F5 or click the green play button.

Both configurations use the local environment settings from `.env.development`.

## Running the Application

1. Create `.env.development`, `.env.uat`, or `.env.production` file in the root directory if it does not exist.

`.env.development`:

```yaml
API_BASE_URL={local_ip}/api
API_TOKEN={authorization_token__dev}
FRONTEND_BASE_URL={local_ip}
NODE_ENV=development
```

`.env.uat`:

```yaml
API_BASE_URL=https://xperi-uat.straive.com/api
API_TOKEN={authorization_token__uat}
FRONTEND_BASE_URL=https://xperi-uat.straive.com
NODE_ENV=uat
```

`.env.production`:

```yaml
API_BASE_URL=https://xperi.straive.com/api
API_TOKEN={authorization_token__prod}
FRONTEND_BASE_URL=https://xperi.straive.com
NODE_ENV=production
```

2. Start the server in your preferred environment.

```bash
# Using npm scripts (recommended)
npm run start:dev     # Use development environment (.env.development)
npm run start:uat     # Use UAT environment (.env.uat)
npm run start:prod    # Use production environment (.env.production)

# Or use default environment (development)
npm start
```

2. Customize the port (optional):

```bash
# Using npm scripts with custom port
PORT=3001 npm run start:dev

# Or directly with Node
PORT=3001 NODE_ENV=development node app.js
```

### Troubleshooting

If you encounter the "address already in use" error:

1. Kill existing Node.js processes:

   ```bash
   # On Windows
   taskkill /F /IM node.exe

   # On Linux/Mac
   pkill node
   ```

2. Or use a different port:
   ```bash
   PORT=3001 node app.js
   ```

The application uses different environment configurations:

- Development: `.env.development` - For local development
- UAT: `.env.uat` - For UAT server deployment
- Production: `.env.production` - For production deployment

## Code Quality

To maintain high code quality standards, we use ESLint for static code analysis. First install the required development dependencies:

```bash
# Install ESLint and plugins
npm install --save-dev eslint eslint-plugin-html eslint-plugin-sonarjs
```

Then run ESLint:

```bash
npx eslint . --debug --output-file=eslint_debug.log
```

This will:

- Run ESLint on all JavaScript files
- Generate detailed debug information
- Save the output to `eslint_debug.log`

Review the log file to identify and fix any code quality issues, including:

- Code complexity
- Potential bugs
- Style violations
- Best practices

### ESLint Configuration

The project uses a flat configuration file `eslint.config.js`, which needs to be created in the root directory. This file contains essential rules and settings for code quality checks. Make sure:

1. The `eslint.config.js` file exists in the project root
2. The file is not modified unless there's a team-wide agreement

```js
import eslintPluginHtml from "eslint-plugin-html";
import eslintPluginSonarjs from "eslint-plugin-sonarjs";
import globals from "globals";

export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.jquery,
        ...globals.node,
        module: true,
        AblePlayer: true,
        $: true,
        jQuery: true,
        Cookies: "readonly",
        jest: true, // Include Jest globals
      },
    },
    files: ["**/*.js", "**/*.html"],
    plugins: {
      html: eslintPluginHtml,
      sonarjs: eslintPluginSonarjs, // Add the plugin here
    },
    settings: {
      sonarjs: {
        threshold: 10, // Threshold for duplicate code detection
      },
    },
    rules: {
      complexity: ["warn", { max: 10 }],
      "no-unused-vars": "off",
      "no-empty": "off",
      "no-extra-boolean-cast": "off",
      "no-redeclare": "off",
      "no-constant-condition": "off",
      "no-prototype-builtins": "off",
      // SonarJS rules
      "sonarjs/no-duplicate-string": "error",
      "sonarjs/no-identical-functions": "error",
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-identical-expressions": "error",
      "sonarjs/no-duplicated-branches": "error",
    },
  },
];
```

The configuration includes rules for:

- Code complexity limits
- Best practices enforcement
- Style consistency
- Error prevention

### ESLint Configuration Documentation

#### Global Configurations

- **ECMAScript**: Latest version support
- **Source Type**: Module
- **File Types**: Supports `.js` and `.html` files

#### Included Globals

- Browser globals
- ES2022 globals
- jQuery globals
- Node.js globals
- Jest globals (for testing)
- Custom globals:
  - `module`
  - `AblePlayer`
  - `$` and `jQuery`
  - `Cookies` (readonly)

#### Plugins

1. **HTML Plugin** (`eslint-plugin-html`)

   - Lints JavaScript inside HTML files

2. **SonarJS Plugin** (`eslint-plugin-sonarjs`)
   - Threshold: 10 (for duplicate code detection)
   - Rules:
     - No duplicate strings
     - No identical functions
     - Cognitive complexity limit: 15
     - No identical expressions
     - No duplicated branches

#### Custom Rules

- Complexity warning threshold: 10
- Disabled rules for flexibility:
  - `no-unused-vars`
  - `no-empty`
  - `no-extra-boolean-cast`
  - `no-redeclare`
  - `no-constant-condition`
  - `no-prototype-builtins`

#### Usage

Run ESLint:

```bash
# Check all files
npx eslint .

# Check specific file
npx eslint path/to/file.js

# Fix automatically fixable issues
npx eslint --fix .
```

### Code Quality

To maintain high code quality standards, we use ESLint for static code analysis. First install the required dependencies:

```bash
npm install
```

Then run ESLint:

```bash
npx eslint . --debug --output-file=eslint_debug.log
```

This will:

- Run ESLint on all JavaScript files
- Generate detailed debug information
- Save the output to `eslint_debug.log`

Review the log file to identify and fix any code quality issues, including:

- Code complexity
- Potential bugs
- Style violations
- Best practices

### ESLint Configuration

The project uses a flat configuration file `eslint.config.js`, which needs to be created in the root directory. This file contains essential rules and settings for code quality checks. Make sure:

1. The `eslint.config.js` file exists in the project root
2. The file is not modified unless there's a team-wide agreement

```js
import eslintPluginHtml from "eslint-plugin-html";
import eslintPluginSonarjs from "eslint-plugin-sonarjs";
import globals from "globals";

export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.jquery,
        ...globals.node,
        module: true,
        AblePlayer: true,
        $: true,
        jQuery: true,
        Cookies: "readonly",
        jest: true, // Include Jest globals
      },
    },
    files: ["**/*.js", "**/*.html"],
    plugins: {
      html: eslintPluginHtml,
      sonarjs: eslintPluginSonarjs, // Add the plugin here
    },
    settings: {
      sonarjs: {
        threshold: 10, // Threshold for duplicate code detection
      },
    },
    rules: {
      complexity: ["warn", { max: 10 }],
      "no-unused-vars": "off",
      "no-empty": "off",
      "no-extra-boolean-cast": "off",
      "no-redeclare": "off",
      "no-constant-condition": "off",
      "no-prototype-builtins": "off",
      // SonarJS rules
      "sonarjs/no-duplicate-string": "error",
      "sonarjs/no-identical-functions": "error",
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-identical-expressions": "error",
      "sonarjs/no-duplicated-branches": "error",
    },
  },
];
```

> [!NOTE]
>
> `.eslintrc.yml` and its content are needed for `.gitlab-ci.yml` (https://github.com/gramener/builderrors).
> Leave it as it is.

The configuration includes rules for:

- Code complexity limits
- Best practices enforcement
- Style consistency
- Error prevention

### ESLint Configuration Documentation

#### Global Configurations

- **ECMAScript**: Latest version support
- **Source Type**: Module
- **File Types**: Supports `.js` and `.html` files

#### Included Globals

- Browser globals
- ES2022 globals
- jQuery globals
- Node.js globals
- Jest globals (for testing)
- Custom globals:
  - `module`
  - `AblePlayer`
  - `$` and `jQuery`
  - `Cookies` (readonly)

#### Plugins

1. **HTML Plugin** (`eslint-plugin-html`)

   - Lints JavaScript inside HTML files

2. **SonarJS Plugin** (`eslint-plugin-sonarjs`)
   - Threshold: 10 (for duplicate code detection)
   - Rules:
     - No duplicate strings
     - No identical functions
     - Cognitive complexity limit: 15
     - No identical expressions
     - No duplicated branches

#### Custom Rules

- Complexity warning threshold: 10
- Disabled rules for flexibility:
  - `no-unused-vars`
  - `no-empty`
  - `no-extra-boolean-cast`
  - `no-redeclare`
  - `no-constant-condition`
  - `no-prototype-builtins`

#### Usage

Run ESLint:

```bash
# Check all files
npx eslint .

# Check specific file
npx eslint path/to/file.js

# Fix automatically fixable issues
npx eslint --fix .
```

## Project Structure

The project follows a modular structure organized by feature and responsibility.

### Core Directories

- `data/` - Data files and source lists

  - Contains Parquet files for source data management
  - Used by the QA Engine for data accuracy checks

- `public/` - Client-side assets

  - `css/` - Stylesheets organized by feature
  - `js/` - Client-side JavaScript
    - `config/` - Centralized configurations (endpoints, etc.)
    - `services/` - Shared services (API, auth)
    - Feature-specific modules (data_accuracy, etc.)
  - `images/` - Static assets and icons

- `routes/` - Express route handlers

  - Organized by feature (auth, data_accuracy)
  - Handles API endpoints and page routing

- `views/` - EJS templates
  - Feature-specific pages and components
  - `partials/` - Reusable UI components
    - Modals, navigation, error pages
    - Loading overlays and shared elements

### Development & Configuration

- `devops/` - Deployment and versioning scripts
- `logger/` - Logging configuration

### Configuration Files

- `.eslintrc.yml` - Code quality rules
- `.htmlhintrc` - HTML linting
- `.stylelintrc.yml` - CSS/SCSS linting
- `babel.config.js` - JavaScript transpilation
- `CHANGELOG.md` - Version history
- `RELEASE.md` - Current version details

### Folder Structure

- To generate this folder structure, run:

```bash
./devops/scripts/tree_view_powershell.ps1 > project_tree.txt
```

```
consolidated-user-interface
|   data
|   |   data_accuracy
|   +-- master_source_list.parquet
|   devops
|   |   scripts
|   |   +-- .version
|   |   +-- add_semantic_ver_tag.sh
|   |   +-- tree_view_powershell.ps1
|   logger
|   +-- logger.js
|   logs
|   public
|   |   css
|   |   |   common
|   |   |   +-- loading_overlay.css
|   |   |   +-- main.css
|   |   |   +-- navbar.css
|   |   |   data_accuracy
|   |   |   +-- comparison.css
|   |   |   +-- jobs_listing.css
|   |   |   landing_page
|   |   |   +-- main.css
|   |   +-- app-switcher.css
|   |   +-- login.css
|   |   +-- not_implemented.css
|   |   images
|   |   |   icons
|   |   |   +-- apps.svg
|   |   |   +-- chat.svg
|   |   |   +-- dashboard.svg
|   |   |   +-- mail.svg
|   |   |   +-- qa.svg
|   |   |   +-- transform.svg
|   |   |   +-- tv.svg
|   |   |   +-- validation.svg
|   |   +-- straive_fav_icon.png
|   |   js
|   |   |   config
|   |   |   +-- endpoints.js
|   |   |   data_accuracy
|   |   |   +-- comparison.js
|   |   |   +-- jobs_listing.js
|   |   |   services
|   |   |   +-- apiService.js
|   |   +-- app-switcher.js
|   |   +-- auth.js
|   |   +-- config.js
|   |   +-- login.js
|   |   +-- not_implemented.js
|   +-- robots.txt
|   routes
|   |   auth
|   |   +-- config.js
|   |   data_accuracy
|   |   +-- comparison.js
|   |   +-- jobs.js
|   |   +-- sources.js
|   views
|   |   data_accuracy
|   |   |   comparison
|   |   |   +-- error.ejs
|   |   |   +-- index.ejs
|   |   |   jobs_listing
|   |   |   +-- error.ejs
|   |   |   +-- index.ejs
|   |   landing_page
|   |   +-- main.ejs
|   |   partials
|   |   +-- app_switcher.ejs
|   |   +-- data_load_error_modal.ejs
|   |   +-- error.ejs
|   |   +-- head.ejs
|   |   +-- loading_overlay.ejs
|   |   +-- navbar.ejs
|   +-- login.ejs
|   +-- not_implemented.ejs
+-- .eslintrc.yml
+-- .htmlhintrc
+-- .stylelintrc.yml
+-- app.js
+-- babel.config.js
+-- CHANGELOG.md
+-- jest.config.js
+-- package-lock.json
+-- package.json
+-- README.md
+-- RELEASE.md
```

## Git Branching Strategy and Versioning

The project follows a structured branching strategy with semantic versioning (SemVer) for release management.

#### Branch Structure

- `main`: Production branch deployed to `prod` EC2 instance
  - Contains stable, production-ready code
  - All commits are tagged with SemVer versions
  - Protected branch - requires PR approval
- `develop`: Development branch deployed to `dev` EC2 instance
  - Integration branch for feature development
  - Contains latest development changes
  - Tagged for dev environment deployments
- `uat`: UAT branch deployed to `dev` EC2 instance
  - Integration branch for feature development
  - Contains latest development changes
  - Tagged for UAT environment deployments

#### Semantic Versioning

We use SemVer (MAJOR.MINOR.PATCH) for version tagging:

- MAJOR: Breaking/incompatible API changes
- MINOR: Backwards-compatible new features
- PATCH: Backwards-compatible bug fixes

To create a new version tag:

```bash
# From the project root directory
./src/devops/scripts/add_semantic_ver_tag.sh
```

The script will:

1. Display the current version
2. Prompt for release type (major/minor/patch)
3. Create a new git tag with the incremented version
4. Update the version file
5. Push changes to the repository

> [!TIP]
>
> - Always run the versioning script from the project root directory
> - Use patch for bug fixes (1.0.0 → 1.0.1)
> - Use minor for new features (1.0.0 → 1.1.0)
> - Use major for breaking changes (1.0.0 → 2.0.0)
