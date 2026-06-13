// Side-effect import: must be the FIRST import in any benchmark entrypoint so
// env vars are populated before modules like @/prisma/prisma read them.
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });
