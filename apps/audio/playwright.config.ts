import { smokeConfig } from "@editor-apps/build-config/playwright";
import { appConfig } from "./src/app.config.ts";

export default smokeConfig({ port: 4183, engines: appConfig.engines });
