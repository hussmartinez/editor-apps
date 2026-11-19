import { smokeConfig } from "@editor-apps/build-config/playwright";
import { appConfig } from "./src/app.config.ts";

export default smokeConfig({ port: 4186, engines: appConfig.engines });
