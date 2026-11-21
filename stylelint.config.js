import preset from "@hussmartinez/sdk-config/stylelint";

/**
 * The family's stylelint preset, with three rules set for an app's page
 * rather than an SDK's components. Everything else, such as design tokens
 * instead of literal values, applies as it does in the SDKs.
 */
export default {
  ...preset,
  rules: {
    ...preset.rules,
    // The shell styles the page itself (html, body, #root and the layout
    // around the editor), not parts inside an SDK's hm root.
    "hm/selector-scope": null,
    // The apps' own classes start with app-, so they never meet ui's and the
    // SDKs' hm- classes.
    "selector-class-pattern": [
      "^app(?:-[a-z0-9]+)+$",
      { message: (name) => `Expected class "${name}" to start with "app-", in kebab case` },
    ],
    // #root is where React renders; any other id starts with app-.
    "selector-id-pattern": [
      "^(?:root|app(?:-[a-z0-9]+)+)$",
      { message: (name) => `Expected id "${name}" to be "root" or to start with "app-"` },
    ],
  },
};
