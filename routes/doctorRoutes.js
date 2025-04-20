const { Router } = require("express");
const {
  getDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  deleteAllDoctors,
} = require("../controllers/doctorController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

router.get("/", authMiddleware, getDoctors);

router.get("/:id", authMiddleware, getDoctor);

router.put("/:id", authMiddleware, updateDoctor);

router.delete("/:id", authMiddleware, deleteDoctor);

router.delete("/", authMiddleware, deleteAllDoctors);

module.exports = router;
