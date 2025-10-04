import * as campgroundController from '@/controllers/campground.controller.js';
import auth from '@/middleware/auth.js';
import express from 'express';

const router: express.Router = express.Router();

router
  .route('/')
  .get(campgroundController.getAllCampgrounds)
  .post(auth, campgroundController.createCampground);

router
  .route('/:id')
  .get(campgroundController.getCampgroundById)
  .put(campgroundController.updateCampground)
  .delete(campgroundController.deleteCampground);

export default router;
