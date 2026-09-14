/**
 * Public, unauthenticated-by-JWT routes — reachable from the open internet. Every route
 * here authenticates itself independently (API key, not a user session) and must be
 * rate-limited, since there's no login wall in front of it.
 */
const express = require('express');
const router = express.Router();
const { publicSubmissionLimiter } = require('../../../shared');
const publicPreAdmissionController = require('../controllers/publicPreAdmissionController');

router.get('/pre-admission/form-schema', publicSubmissionLimiter, publicPreAdmissionController.getFormSchema);
router.post('/pre-admission/submit', publicSubmissionLimiter, publicPreAdmissionController.submitApplication);

module.exports = router;
