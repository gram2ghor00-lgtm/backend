import { Router } from 'express';
import { getPixelClientController } from '../controllers/pixel.controller.js';

const clientPixelRouter = Router();

clientPixelRouter.get('/config', getPixelClientController);

export default clientPixelRouter;
