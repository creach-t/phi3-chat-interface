import express from "express";
import {
  getStatus,
  sendMessage,
  testConnection,
} from "../controllers/chatController";
import { requireAuth } from "../middleware/auth";
import { asyncErrorHandler } from "../middleware/errorHandler";
import {
  validate,
  validateAndMergeModelParams,
} from "../middleware/validation";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Send chat message
router.post(
  "/",
  validate("chat"),
  validateAndMergeModelParams,
  asyncErrorHandler(sendMessage)
);

// Get chat status
router.get("/status", asyncErrorHandler(getStatus));

// Test llama.cpp connection
router.post("/test-connection", asyncErrorHandler(testConnection));

export default router;
