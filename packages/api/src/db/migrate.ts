import { getDb, closeDb } from "./index";
import { runMigrations } from "./schema";

const db = getDb();
runMigrations(db);
console.log("Migrations complete");
closeDb();
