import { Router } from 'express';
import { getPixelAdminController, savePixelAdminController } from '../controllers/pixel.controller.js';

const pixelRouter = Router();

pixelRouter.get('/get-pixel', getPixelAdminController);
pixelRouter.post('/save-pixel', savePixelAdminController);

export default pixelRouter;
