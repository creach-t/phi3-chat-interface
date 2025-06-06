// Save this as routes/authTest.ts
import express from "express";

const router = express.Router();

// Simple test routes without any complex dependencies
router.get("/check-auth", (req, res) => {
  console.log("✓ check-auth route hit");
  const isAuthenticated = req.session && (req.session as any).authenticated;
  res.json({
    authenticated: isAuthenticated,
    user: isAuthenticated ? (req.session as any).user : null,
    message: isAuthenticated
      ? "User is authenticated"
      : "User not authenticated",
    timestamp: new Date().toISOString(),
  });
});

router.post("/login", (req, res) => {
  console.log("✓ login route hit");
  const { username, password } = req.body;

  // Simple test login
  if (username === "admin" && password === "password123") {
    if (req.session) {
      (req.session as any).authenticated = true; // Fix: use 'authenticated' not 'user'
      (req.session as any).user = { username: "admin" };
    }
    res.json({
      success: true,
      message: "Login successful",
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
      timestamp: new Date().toISOString(),
    });
  }
});

router.post("/logout", (req, res) => {
  console.log("✓ logout route hit");
  if (req.session) {
    (req.session as any).authenticated = false;
    (req.session as any).user = null;
  }
  res.json({
    success: true,
    message: "Logout successful",
    timestamp: new Date().toISOString(),
  });
});

console.log("AuthTest router created with", router.stack.length, "routes");

export default router;
