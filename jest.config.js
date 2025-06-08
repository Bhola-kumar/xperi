/** @type {import('jest').Config} */
export default {
  verbose: true,
  transform: {
    "^.+\\.jsx?$": [
      "babel-jest",
      {
        targets: { node: "current" },
        presets: [
          [
            "@babel/preset-env",
            {
              targets: { node: "current" },
              modules: "auto",
            },
          ],
        ],
      },
    ],
  },
  moduleFileExtensions: ["js", "jsx", "json"],
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!(module-that-needs-to-be-transformed)/)",
  ],
  // Handle ES modules
  testMatch: ["**/*.test.js"],
};
