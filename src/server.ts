import { createApp } from "./app";
import { loadConfigFromEnv } from "./config";

async function bootstrap(): Promise<void> {
  const config = loadConfigFromEnv({ requireVisionProviderCredentials: true });
  const app = await createApp({ config });

  await app.listen({
    host: "0.0.0.0",
    port: config.port,
  });
}

void bootstrap();
