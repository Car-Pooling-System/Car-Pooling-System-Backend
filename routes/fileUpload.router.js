import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

function sanitizeFileName(name = "file") {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getExtensionFromDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,/.exec(dataUrl || "");
  const mime = match?.[1] || "";
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("pdf")) return "pdf";
  return "bin";
}

router.post("/upload", async (req, res) => {
  try {
    const { dataUrl, filename, folder = "general" } = req.body || {};

    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return res.status(400).json({ message: "Valid dataUrl is required" });
    }

    const parts = dataUrl.split(",");
    if (parts.length !== 2) {
      return res.status(400).json({ message: "Invalid dataUrl format" });
    }

    const safeFolder = sanitizeFileName(folder);
    const ext = path.extname(filename || "").replace(".", "") || getExtensionFromDataUrl(dataUrl);
    const baseName = path.basename(filename || `upload.${ext}`, path.extname(filename || `upload.${ext}`));
    const safeBaseName = sanitizeFileName(baseName);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeBaseName}.${ext}`;

    const uploadsRoot = path.join(process.cwd(), "uploads", safeFolder);
    await fs.mkdir(uploadsRoot, { recursive: true });

    const binary = Buffer.from(parts[1], "base64");
    const filePath = path.join(uploadsRoot, uniqueName);
    await fs.writeFile(filePath, binary);

    const publicPath = `/uploads/${safeFolder}/${uniqueName}`;
    res.status(201).json({ message: "File uploaded", path: publicPath, url: publicPath });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload file", error: err.message });
  }
});

export default router;
