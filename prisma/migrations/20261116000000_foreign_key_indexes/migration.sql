-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "SubjectTeacherMapping_staffId_idx" ON "SubjectTeacherMapping"("staffId");

-- CreateIndex
CREATE INDEX "SubjectTeacherMapping_sectionId_idx" ON "SubjectTeacherMapping"("sectionId");

-- CreateIndex
CREATE INDEX "ParentStudent_studentId_idx" ON "ParentStudent"("studentId");

-- CreateIndex
CREATE INDEX "StaffQualification_staffId_idx" ON "StaffQualification"("staffId");

-- CreateIndex
CREATE INDEX "StaffExperience_staffId_idx" ON "StaffExperience"("staffId");

-- CreateIndex
CREATE INDEX "AttendanceCorrectionRequest_studentId_idx" ON "AttendanceCorrectionRequest"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceSession_sectionId_idx" ON "AttendanceSession"("sectionId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");

-- CreateIndex
CREATE INDEX "LeaveRequest_institutionId_idx" ON "LeaveRequest"("institutionId");

-- CreateIndex
CREATE INDEX "LeaveRequest_studentId_idx" ON "LeaveRequest"("studentId");

-- CreateIndex
CREATE INDEX "LeaveRequest_staffId_idx" ON "LeaveRequest"("staffId");

-- CreateIndex
CREATE INDEX "Timetable_sectionId_idx" ON "Timetable"("sectionId");

-- CreateIndex
CREATE INDEX "TimetableEntry_staffId_idx" ON "TimetableEntry"("staffId");

-- CreateIndex
CREATE INDEX "Assignment_institutionId_idx" ON "Assignment"("institutionId");

-- CreateIndex
CREATE INDEX "Assignment_staffId_idx" ON "Assignment"("staffId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_studentId_idx" ON "AssignmentSubmission"("studentId");

-- CreateIndex
CREATE INDEX "StudyMaterial_institutionId_idx" ON "StudyMaterial"("institutionId");

-- CreateIndex
CREATE INDEX "StudyMaterial_staffId_idx" ON "StudyMaterial"("staffId");

-- CreateIndex
CREATE INDEX "QuestionBank_institutionId_idx" ON "QuestionBank"("institutionId");

-- CreateIndex
CREATE INDEX "Exam_institutionId_idx" ON "Exam"("institutionId");

-- CreateIndex
CREATE INDEX "ExamSchedule_examId_idx" ON "ExamSchedule"("examId");

-- CreateIndex
CREATE INDEX "MarkCorrectionRequest_studentId_idx" ON "MarkCorrectionRequest"("studentId");

-- CreateIndex
CREATE INDEX "StudentMark_studentId_idx" ON "StudentMark"("studentId");

-- CreateIndex
CREATE INDEX "FeeStructure_sectionId_idx" ON "FeeStructure"("sectionId");

-- CreateIndex
CREATE INDEX "StudentFeeAssignment_studentId_idx" ON "StudentFeeAssignment"("studentId");

-- CreateIndex
CREATE INDEX "ConcessionApplication_studentId_idx" ON "ConcessionApplication"("studentId");

-- CreateIndex
CREATE INDEX "FeePayment_studentId_idx" ON "FeePayment"("studentId");

-- CreateIndex
CREATE INDEX "FeeReceipt_institutionId_idx" ON "FeeReceipt"("institutionId");

-- CreateIndex
CREATE INDEX "FeeReceipt_studentId_idx" ON "FeeReceipt"("studentId");

-- CreateIndex
CREATE INDEX "FeeChallan_institutionId_idx" ON "FeeChallan"("institutionId");

-- CreateIndex
CREATE INDEX "FeeChallan_studentId_idx" ON "FeeChallan"("studentId");

-- CreateIndex
CREATE INDEX "FeeRefund_institutionId_idx" ON "FeeRefund"("institutionId");

-- CreateIndex
CREATE INDEX "FeeRefund_studentId_idx" ON "FeeRefund"("studentId");

-- CreateIndex
CREATE INDEX "Book_institutionId_idx" ON "Book"("institutionId");

-- CreateIndex
CREATE INDEX "BookIssue_studentId_idx" ON "BookIssue"("studentId");

-- CreateIndex
CREATE INDEX "Vehicle_institutionId_idx" ON "Vehicle"("institutionId");

-- CreateIndex
CREATE INDEX "TransportRoute_institutionId_idx" ON "TransportRoute"("institutionId");

-- CreateIndex
CREATE INDEX "Hostel_institutionId_idx" ON "Hostel"("institutionId");

-- CreateIndex
CREATE INDEX "HostelVisitorLog_studentId_idx" ON "HostelVisitorLog"("studentId");

-- CreateIndex
CREATE INDEX "CertificateRequest_studentId_idx" ON "CertificateRequest"("studentId");

-- CreateIndex
CREATE INDEX "Certificate_institutionId_idx" ON "Certificate"("institutionId");

-- CreateIndex
CREATE INDEX "Certificate_studentId_idx" ON "Certificate"("studentId");

-- CreateIndex
CREATE INDEX "Notification_institutionId_idx" ON "Notification"("institutionId");

-- CreateIndex
CREATE INDEX "Event_institutionId_idx" ON "Event"("institutionId");

-- CreateIndex
CREATE INDEX "EventRegistration_studentId_idx" ON "EventRegistration"("studentId");

-- CreateIndex
CREATE INDEX "Club_institutionId_idx" ON "Club"("institutionId");

-- CreateIndex
CREATE INDEX "ClubMember_studentId_idx" ON "ClubMember"("studentId");

-- CreateIndex
CREATE INDEX "Grievance_institutionId_idx" ON "Grievance"("institutionId");

-- CreateIndex
CREATE INDEX "Grievance_studentId_idx" ON "Grievance"("studentId");

-- CreateIndex
CREATE INDEX "StudentAchievement_institutionId_idx" ON "StudentAchievement"("institutionId");

-- CreateIndex
CREATE INDEX "StudentAchievement_studentId_idx" ON "StudentAchievement"("studentId");

-- CreateIndex
CREATE INDEX "Appointment_institutionId_idx" ON "Appointment"("institutionId");

-- CreateIndex
CREATE INDEX "Appointment_studentId_idx" ON "Appointment"("studentId");

-- CreateIndex
CREATE INDEX "Appointment_staffId_idx" ON "Appointment"("staffId");

-- CreateIndex
CREATE INDEX "ParentMeetingNote_institutionId_idx" ON "ParentMeetingNote"("institutionId");

-- CreateIndex
CREATE INDEX "JobPosting_institutionId_idx" ON "JobPosting"("institutionId");

-- CreateIndex
CREATE INDEX "JobApplication_studentId_idx" ON "JobApplication"("studentId");

-- CreateIndex
CREATE INDEX "JobOpening_institutionId_idx" ON "JobOpening"("institutionId");

-- CreateIndex
CREATE INDEX "ResearchPublication_staffId_idx" ON "ResearchPublication"("staffId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Subscription_institutionId_idx" ON "Subscription"("institutionId");

-- CreateIndex
CREATE INDEX "AiUsageLog_userId_idx" ON "AiUsageLog"("userId");

-- CreateIndex
CREATE INDEX "Vendor_institutionId_idx" ON "Vendor"("institutionId");

-- CreateIndex
CREATE INDEX "ComputerLab_institutionId_idx" ON "ComputerLab"("institutionId");

-- CreateIndex
CREATE INDEX "StockItem_institutionId_idx" ON "StockItem"("institutionId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_institutionId_idx" ON "PurchaseOrder"("institutionId");

-- CreateIndex
CREATE INDEX "SavedReport_userId_idx" ON "SavedReport"("userId");

-- CreateIndex
CREATE INDEX "DisciplineRecord_studentId_idx" ON "DisciplineRecord"("studentId");

-- CreateIndex
CREATE INDEX "HealthRecord_studentId_idx" ON "HealthRecord"("studentId");

-- CreateIndex
CREATE INDEX "StudentDocument_studentId_idx" ON "StudentDocument"("studentId");

