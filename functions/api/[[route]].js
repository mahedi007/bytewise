// Every /api/* request lands here and is dispatched by lib/api.js
import { handle } from '../../lib/api.js';

export const onRequest = (context) => handle(context);
