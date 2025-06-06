const express = require("express");
const {
  getAll,
  create,
  update,
  delete: deletePreprompt,
  getById,
} = require("../controllers/prepromptsController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { asyncErrorHandler } = require("../middleware/errorHandler");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get all preprompts
router.get("/", asyncErrorHandler(getAll));

// Get specific preprompt by ID
router.get("/:id", asyncErrorHandler(getById));

// Create new preprompt
router.post("/", validate("preprompt"), asyncErrorHandler(create));

// Update existing preprompt
router.put("/:id", validate("preprompt"), asyncErrorHandler(update));

// Delete preprompt
router.delete("/:id", asyncErrorHandler(deletePreprompt));

export default router;
