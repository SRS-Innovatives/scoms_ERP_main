/**
 * Mounted at the exact same prefix as the reused Student/Staff routers, right after
 * them — a request that doesn't match anything inside those falls through here with
 * req.user already set (requireAuth/requireTenant already ran as router.use()
 * middleware inside them), so these two routes get real auth for free without
 * duplicating that middleware. See ../../app.js for the mount points.
 */
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/notifications/device-token', controller.register);
router.delete('/notifications/device-token', controller.unregister);

module.exports = router;
