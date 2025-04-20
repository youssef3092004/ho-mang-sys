const express = require ('express');
const {
  registerDoctor,
  loginDoctor,
} = require ('../controllers/doctorAuthController');
const {
  registerNurse,
  loginNurse,
} = require ('../controllers/nurseAuthController');
const {
  registerTechnicalStaff,
  loginTechnicalStaff,
} = require ('../controllers/technicalStaffAuthController');
const {
  registerHospital,
  loginHospital,
} = require ('../controllers/hospitalAuthController');

const router = express.Router ();

router.post ('/register', registerDoctor);
router.post ('/login', loginDoctor);

router.post ('/register', registerNurse);
router.post ('/login', loginNurse);

router.post ('/register', registerTechnicalStaff);
router.post ('/login', loginTechnicalStaff);

router.post ('/register', registerHospital);
router.post ('/login', loginHospital);

module.exports = router;
