export default {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" },
        modules: "auto",
      },
    ],
  ],
  plugins: [
    // Add support for import.meta.url
    function () {
      return {
        visitor: {
          MetaProperty(path) {
            if (
              path.node.meta.name === "import" &&
              path.node.property.name === "meta"
            ) {
              path.replaceWithSourceString("{ url: __filename }");
            }
          },
        },
      };
    },
  ],
};
