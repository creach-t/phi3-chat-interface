import { Router } from "express";
// Import from the controller
import {
  get,
  getInfo,
  getLimits,
  reset,
  update,
  validate,
} from "../controllers/modelParamsController";

const router = Router();

// GET /api/model-params - Get current model parameters
router.get("/", get);

// GET /api/model-params/limits - Get parameter limits
router.get("/limits", getLimits);

// GET /api/model-params/info - Get parameter info
router.get("/info", getInfo);

// POST /api/model-params - Update model parameters
router.post("/", update);

// POST /api/model-params/reset - Reset to defaults
router.post("/reset", reset);

// POST /api/model-params/validate - Validate parameters
router.post("/validate", validate);

export default router;
