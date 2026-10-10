import "dotenv/config";
import app from "./src/app.js";
import { getDB } from "./src/config/database.js";

const PORT = process.env.PORT || 5000;

function start() {
  try {
    getDB(); // initialize SQLite
    app.listen(PORT, () => {
      console.log(`\n🚀 TrustBridge API Server`);
      console.log(`📡 Running on http://localhost:${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`⛓️  Stellar Network: ${process.env.STELLAR_NETWORK || "mainnet"}\n`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
