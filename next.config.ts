import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { execSync } from "node:child_process";
import packageJson from "./package.json";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// In local development behind Traefik self-signed certificates, allow Node.js fetch() to connect
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

function getGitCommitHash(): string {
  if (process.env.NEXT_PUBLIC_GIT_COMMIT_HASH) {
    return process.env.NEXT_PUBLIC_GIT_COMMIT_HASH;
  }
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "development";
  }
}

const gitCommitHash = getGitCommitHash();
const appVersion = packageJson.version || "0.1.0";

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId: `${appVersion}-${gitCommitHash}`,
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
    NEXT_PUBLIC_GIT_COMMIT_HASH: gitCommitHash,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Accel-Buffering",
            value: "no",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "*.local",
        "*.localhost",
      ],
    },
  },
};

export default withNextIntl(nextConfig);

