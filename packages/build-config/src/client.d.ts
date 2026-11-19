/**
 * What the `editorApp` Vite plugin gives an app's browser code. An app adds
 * `"@editor-apps/build-config/client"` to its tsconfig's `types`.
 */

/** Where the app serves its SDK's assets, for the SDK's `assetsUrl`. Empty without assets. */
declare const __SDK_ASSETS_URL__: string;

/** The theme stylesheet from the `themeStylesheet` plugin. */
declare module "virtual:theme.css";
