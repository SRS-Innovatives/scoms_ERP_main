/**
 * Public, unauthenticated-by-JWT routes — reachable from the open internet. Every route
 * here authenticates itself independently (API key, not a user session) and must be
 * rate-limited, since there's no login wall in front of it.
 */
const express = require('express');
const router = express.Router();
const { publicFormSchemaLimiter, publicSubmissionLimiter } = require('../../../shared');
const publicPreAdmissionController = require('../controllers/publicPreAdmissionController');

// Plain HTML <form> posts (application/x-www-form-urlencoded) as well as JSON — a school
// website without any JavaScript can post straight here (see successUrl / errorUrl).
router.use(express.urlencoded({ extended: false, limit: '8mb' }));

router.get('/pre-admission/form-schema', publicFormSchemaLimiter, publicPreAdmissionController.getFormSchema);
router.post('/pre-admission/submit', publicSubmissionLimiter, publicPreAdmissionController.submitApplication);
// "check my application" — POST keeps the phone number out of URLs and server logs; GET also works
router.post('/pre-admission/status', publicSubmissionLimiter, publicPreAdmissionController.getApplicationStatus);
router.get('/pre-admission/status', publicSubmissionLimiter, publicPreAdmissionController.getApplicationStatus);
router.post('/pre-admission/:id/fee/initiate', publicSubmissionLimiter, publicPreAdmissionController.initiateApplicationFeePayment);
router.post('/pre-admission/:id/fee/verify', publicSubmissionLimiter, publicPreAdmissionController.verifyApplicationFeePayment);

module.exports = router;
