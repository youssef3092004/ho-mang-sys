const {Router} = require ('express');
const {
  getNurses,
  getNurse,
  updateNurse,
  deleteNurse,
  deleteAllNurses,
} = require ('../controllers/nurseController');
const authMiddleware = require ('../middleware/authMiddleware');

const router = Router ();

router.get ('/', authMiddleware, getNurses);

router.get ('/:id', authMiddleware, getNurse);

router.put ('/:id', authMiddleware, updateNurse);

router.delete ('/:id', authMiddleware, deleteNurse);

router.delete ('/', authMiddleware, deleteAllNurses);

module.exports = router;
