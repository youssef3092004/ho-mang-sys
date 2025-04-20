const {Router} = require ('express');
const {
    getTechnicalStaff,
    getOneTechnicalStaff,
    updateTechnicalStaff,
    deleteTechnicalStaff,
    deleteAllTechnicalStaff,
} = require ('../controllers/technicalStaffController');
const authMiddleware = require ('../middleware/authMiddleware');

const router = Router ();

router.get ('/', authMiddleware, getTechnicalStaff);

router.get ('/:id', authMiddleware, getOneTechnicalStaff);

router.put ('/:id', authMiddleware, updateTechnicalStaff);

router.delete ('/:id', authMiddleware, deleteTechnicalStaff);

router.delete ('/', authMiddleware, deleteAllTechnicalStaff);

module.exports = router;
