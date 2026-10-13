import nextPlugin from "@next/eslint-plugin-next";
import shadcn from "@shadcn/lint";

const eslintConfig = [
  {
    plugins: {
      "@next/next": nextPlugin,
      shadcn,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "shadcn/no-restyle": [
        "error",
        {
          allow: ["layout"],
          contracts: [],
        },
      ],
      "shadcn/no-raw-colors": "error",
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-unknown-classes": "error",
      "shadcn/no-inline-styles": "error",
      "shadcn/require-static-classes": "error",
    },
  },
  {
    files: ["app/components/ui/**", "components/ui/**", "src/components/ui/**"],
    rules: {
      "shadcn/no-restyle": "off",
      "shadcn/no-arbitrary-values": "off",
      "shadcn/require-static-classes": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
      ".agents/**",
    ],
  },
];

export default eslintConfig;
