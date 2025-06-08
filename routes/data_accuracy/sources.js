import express from "express";
import parquetjs from "@dsnp/parquetjs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache the source data in memory
let sourceData = null;

// Helper function to convert BigInt to Number in an object
function convertBigIntToNumber(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (typeof value === "bigint") {
        return [key, Number(value)];
      }
      return [key, value];
    }),
  );
}

async function loadSourceData() {
  if (sourceData) return sourceData;

  try {
    const parquetPath = path.join(
      __dirname,
      "../../data/master_source_list.parquet",
    );
    console.log("Loading parquet file from:", parquetPath);

    // Create a reader
    const reader = await parquetjs.ParquetReader.openFile(parquetPath);
    const cursor = reader.getCursor();

    // Read all records
    const records = [];
    let record = null;
    while ((record = await cursor.next())) {
      // Convert any BigInt values to regular numbers
      records.push(convertBigIntToNumber(record));
    }

    // Close the reader
    await reader.close();

    sourceData = records;
    console.log("Loaded sources:", sourceData.length);
    return sourceData;
  } catch (error) {
    console.error("Error loading parquet file:", error);
    return [];
  }
}

router.get("/search", async (req, res) => {
  try {
    const { query = "", page = 1, limit = 20 } = req.query;
    const sources = await loadSourceData();

    // Filter sources based on the search query
    const filteredSources = sources.filter((source) => {
      const searchStr = query.toLowerCase();
      return (
        source.source_id.toString().includes(searchStr) ||
        source.source_name.toLowerCase().includes(searchStr) ||
        source.source_long_name.toLowerCase().includes(searchStr)
      );
    });

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSources = filteredSources.slice(startIndex, endIndex);

    res.json({
      sources: paginatedSources,
      total: filteredSources.length,
      hasMore: endIndex < filteredSources.length,
    });
  } catch (error) {
    console.error("Error searching sources:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
