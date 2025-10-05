import { Router } from 'express';
import { body } from 'express-validator';
import { getAllPeople, createPerson, deletePerson } from '../controllers/personController';
import { auth, adminAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

const personValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('type').isIn(['ACTOR', 'DIRECTOR', 'PRODUCER']).withMessage('Type must be ACTOR, DIRECTOR, or PRODUCER'),
];

// Public route
router.get('/', getAllPeople);

// Admin only routes
router.post('/', auth, adminAuth, validate(personValidation), createPerson);
router.delete('/:id', auth, adminAuth, deletePerson);

export default router;
