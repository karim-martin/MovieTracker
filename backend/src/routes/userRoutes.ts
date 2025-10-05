import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser,
} from '../controllers/userController';
import { auth } from '../middlewares/auth';
import { adminAuth } from '../middlewares/adminAuth';

const router = Router();

// All user management routes require admin authentication
router.use(auth, adminAuth);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id/block', blockUser);
router.patch('/:id/unblock', unblockUser);
router.delete('/:id', deleteUser);

export default router;
