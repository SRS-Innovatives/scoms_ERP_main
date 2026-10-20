/**
 * Mounted directly on the app at a top-level path (see ../../app.js), NOT under
 * /api/v1/mobile/{student,staff} — this is server-to-server traffic (secret-header
 * authenticated in the controller), never an end-user request, so it must not sit
 * behind the reused routers' requireAuth chain.
 */
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/dispatch', controller.dispatch);

module.exports = router;
