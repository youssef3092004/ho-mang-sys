const { Router } = require("express");
const {
  getHospitals,
  getHospital,
  createHospital,
  updateHospital,
  deleteHospital,
  deleteAllHospitals,
} = require("../controllers/hospitalController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

router.post("/", authMiddleware, createHospital);

router.get("/", authMiddleware, getHospitals);

router.get("/:id", authMiddleware, getHospital);

router.put("/:id", authMiddleware, updateHospital);

router.delete("/:id", authMiddleware, deleteHospital);

router.delete("/", authMiddleware, deleteAllHospitals);

module.exports = router;
