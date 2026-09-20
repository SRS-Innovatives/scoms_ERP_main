/**
 * Institute Admin — Workflow Engine
 *
 * A generic, configurable multi-step approval chain (e.g. Leave Request: Dept Head ->
 * Principal). Deliberately NOT wired into any existing single-step approval flow —
 * Leave, Expense, Custom Field, Student Exit, etc. all keep working exactly as they do
 * today. This is opt-in infrastructure: an institution defines a named chain of
 * approver roles, then starts an instance against any real record it wants that chain
 * applied to (entityType/entityId are free — the engine doesn't need to know that
 * record's shape).
 *
 * A REJECTED decision at any step halts the whole instance immediately — it does not
 * bounce back to an earlier step. An APPROVED decision advances to the next step, or
 * finalizes the instance as APPROVED if it was the last step.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError, ROLES } = require('../../../shared');

const VALID_ROLES = Object.values(ROLES);

const validateSteps = (steps) => {
  if (!Array.isArray(steps) || steps.length === 0) throw new ValidationError('steps must be a non-empty array');
  steps.forEach((s, i) => {
    if (!s.approverRole || !VALID_ROLES.includes(s.approverRole)) {
      throw new ValidationError(`steps[${i}].approverRole must be a valid role`);
    }
  });
};

// ============================================================
// Workflow Definitions (Institute Admin configures the chain)
// ============================================================
const getDefinitions = async (req, res, next) => {
  try {
    const definitions = await prisma.workflowDefinition.findMany({
      where: { institutionId: req.institutionId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, definitions, 'Workflow definitions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createDefinition = async (req, res, next) => {
  try {
    const { workflowType, name, steps } = req.body;
    if (!workflowType || !name) throw new ValidationError('workflowType and name are required');
    validateSteps(steps);

    const existing = await prisma.workflowDefinition.findUnique({
      where: { institutionId_workflowType: { institutionId: req.institutionId, workflowType } },
    });
    if (existing) throw new ValidationError(`A workflow definition for "${workflowType}" already exists — update it instead`);

    // Normalize stepOrder to array position so the caller doesn't have to get it right.
    const orderedSteps = steps.map((s, i) => ({ stepOrder: i, approverRole: s.approverRole }));

    const definition = await prisma.workflowDefinition.create({
      data: { institutionId: req.institutionId, workflowType, name, steps: orderedSteps, createdById: req.user.id },
    });
    return sendSuccess(res, definition, 'Workflow definition created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateDefinition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.workflowDefinition.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Workflow definition not found');

    const { name, steps, isActive } = req.body;
    if (steps !== undefined) validateSteps(steps);
    const orderedSteps = steps ? steps.map((s, i) => ({ stepOrder: i, approverRole: s.approverRole })) : undefined;

    const definition = await prisma.workflowDefinition.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(orderedSteps !== undefined && { steps: orderedSteps }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      },
    });
    return sendSuccess(res, definition, 'Workflow definition updated successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Workflow Instances (a real request moving through the chain)
// ============================================================
const startInstance = async (req, res, next) => {
  try {
    const { workflowDefinitionId, entityType, entityId } = req.body;
    if (!workflowDefinitionId || !entityType || !entityId) throw new ValidationError('workflowDefinitionId, entityType and entityId are required');

    const definition = await prisma.workflowDefinition.findFirst({ where: { id: workflowDefinitionId, institutionId: req.institutionId } });
    if (!definition) throw new NotFoundError('Workflow definition not found');
    if (!definition.isActive) throw new BusinessRuleError('This workflow definition is not active');

    const existing = await prisma.workflowInstance.findFirst({
      where: { entityType, entityId, status: 'IN_PROGRESS' },
    });
    if (existing) throw new BusinessRuleError('An in-progress workflow instance already exists for this record');

    const instance = await prisma.workflowInstance.create({
      data: { institutionId: req.institutionId, workflowDefinitionId, entityType, entityId, startedById: req.user.id },
    });
    return sendSuccess(res, instance, 'Workflow instance started successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getInstance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const instance = await prisma.workflowInstance.findFirst({
      where: { id, institutionId: req.institutionId },
      include: { workflowDefinition: true, stepLogs: { orderBy: { decidedAt: 'asc' } } },
    });
    if (!instance) throw new NotFoundError('Workflow instance not found');
    return sendSuccess(res, instance, 'Workflow instance retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getInstancesForEntity = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.query;
    if (!entityType || !entityId) throw new ValidationError('entityType and entityId are required');
    const instances = await prisma.workflowInstance.findMany({
      where: { institutionId: req.institutionId, entityType, entityId },
      include: { stepLogs: { orderBy: { decidedAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, instances, 'Workflow instances retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Every IN_PROGRESS instance whose current step's approverRole matches the caller's
 * own role — "what's waiting on me to decide". */
const getMyPendingApprovals = async (req, res, next) => {
  try {
    const instances = await prisma.workflowInstance.findMany({
      where: { institutionId: req.institutionId, status: 'IN_PROGRESS' },
      include: { workflowDefinition: true },
    });
    const mine = instances.filter((inst) => {
      const steps = inst.workflowDefinition.steps;
      const currentStep = steps[inst.currentStepIndex];
      return currentStep?.approverRole === req.user.role;
    });
    return sendSuccess(res, mine, 'Pending approvals retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const decideStep = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, comment } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(decision)) throw new ValidationError('decision must be APPROVED or REJECTED');

    const instance = await prisma.workflowInstance.findFirst({
      where: { id, institutionId: req.institutionId },
      include: { workflowDefinition: true },
    });
    if (!instance) throw new NotFoundError('Workflow instance not found');
    if (instance.status !== 'IN_PROGRESS') throw new BusinessRuleError('This workflow instance is already finalized');

    const steps = instance.workflowDefinition.steps;
    const currentStep = steps[instance.currentStepIndex];
    if (currentStep.approverRole !== req.user.role) {
      throw new BusinessRuleError(`This step requires a decision from ${currentStep.approverRole}, not ${req.user.role}`);
    }

    const isLastStep = instance.currentStepIndex === steps.length - 1;
    const nextStatus = decision === 'REJECTED' ? 'REJECTED' : (isLastStep ? 'APPROVED' : 'IN_PROGRESS');

    const [, updated] = await prisma.$transaction([
      prisma.workflowStepLog.create({
        data: {
          workflowInstanceId: id,
          stepIndex: instance.currentStepIndex,
          approverRole: currentStep.approverRole,
          decision,
          decidedById: req.user.id,
          comment: comment || null,
        },
      }),
      prisma.workflowInstance.update({
        where: { id },
        data: {
          status: nextStatus,
          ...(nextStatus === 'IN_PROGRESS' && { currentStepIndex: instance.currentStepIndex + 1 }),
        },
      }),
    ]);

    return sendSuccess(res, updated, `Step ${decision.toLowerCase()}${nextStatus === 'IN_PROGRESS' ? ' — advanced to next step' : ` — workflow ${nextStatus.toLowerCase()}`}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getDefinitions, createDefinition, updateDefinition, startInstance, getInstance, getInstancesForEntity, getMyPendingApprovals, decideStep };
