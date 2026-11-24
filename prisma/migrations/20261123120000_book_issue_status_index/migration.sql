-- Library: active / overdue / due-today issue lists and the librarian dashboard counts
CREATE INDEX IF NOT EXISTS "BookIssue_status_dueDate_idx" ON "BookIssue"("status", "dueDate");
