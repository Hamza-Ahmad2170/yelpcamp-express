import * as authController from '@/controllers/auth.controller.js';
import auth from '@/middleware/auth.js';
import express from 'express';

const router: express.Router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', auth, authController.refreshToken);
router.post('/logout', auth, authController.signout);
router.get('/session', auth, authController.getSession);

export default router;
