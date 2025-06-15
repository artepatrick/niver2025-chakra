import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Serve static files from the public directory
app.use(express.static(join(__dirname, "public")));

// Handle all routes by serving index.html
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
