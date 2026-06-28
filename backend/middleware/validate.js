import { body, param, query, validationResult } from 'express-validator';

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

export const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'teacher']).withMessage('Role must be student or teacher'),
  handleValidation,
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

export const validateUpdateRoom = [
  param('id').notEmpty().withMessage('Room ID is required'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('description').optional().trim(),
  body('topic').optional().isIn(['office', 'consultation', 'other']).withMessage('Topic must be office, consultation, or other'),
  body('is_open').optional().isIn([0, 1]).withMessage('is_open must be 0 or 1'),
  handleValidation,
];

export const validateRoomParam = [
  param('id').notEmpty().withMessage('Room ID is required'),
  handleValidation,
];

export const validateWaitNote = [
  param('id').notEmpty().withMessage('Room ID is required'),
  body('note').optional().trim().isLength({ max: 500 }).withMessage('Note must be under 500 characters'),
  handleValidation,
];

export const validateWaitingEntryParam = [
  param('id').notEmpty().withMessage('Waiting entry ID is required'),
  handleValidation,
];

export const validateWaitingMine = [
  query('room_id').notEmpty().withMessage('room_id query parameter is required'),
  handleValidation,
];

export const validateZoomSignature = [
  query('meetingNumber').isInt().withMessage('meetingNumber must be an integer'),
  query('role').isInt({ min: 0, max: 1 }).withMessage('role must be 0 or 1'),
  handleValidation,
];
