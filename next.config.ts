import path from "node:path";
import type { NextConfig } from "next";
import { assertProductionSiteUrl } from "./lib/site-config";

assertProductionSiteUrl();

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
