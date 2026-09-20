/**
 * Institute Admin Inventory & Assets Controller
 *
 * Vendor (approved suppliers) -> PurchaseOrder (procurement) -> Asset (fixed asset
 * register, doubles as lab-equipment register via calibrationDueDate) / StockItem
 * (consumables) with a StockTransaction ledger for IN/OUT movements. ComputerLab is a
 * standalone infrastructure register.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
} = require('../../../shared');

const nextPoNumber = async (institutionId) => {
  const count = await prisma.purchaseOrder.count({ where: { institutionId } });
  const year = new Date().getFullYear();
  return `PO/${year}/${String(count + 1).padStart(3, '0')}`;
};

// ============================================================
// Vendors
// ============================================================
const getVendors = async (req, res, next) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { institutionId: req.institutionId },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, vendors, 'Vendors retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createVendor = async (req, res, next) => {
  try {
    const { name, category, gstNumber, phone, email } = req.body;
    if (!name) throw new ValidationError('name is required');

    const vendor = await prisma.vendor.create({
      data: { institutionId: req.institutionId, name, category: category || null, gstNumber: gstNumber || null, phone: phone || null, email: email || null },
    });
    return sendSuccess(res, vendor, 'Vendor added successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Assets (fixed asset register + lab equipment)
// ============================================================
const getAssets = async (req, res, next) => {
  try {
    const { category } = req.query;
    const assets = await prisma.asset.findMany({
      where: { institutionId: req.institutionId, ...(category && { category }) },
      include: { vendor: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, assets, 'Assets retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const { assetTag, name, category, location, quantity, condition, purchaseDate, purchaseValue, calibrationDueDate, vendorId } = req.body;
    if (!assetTag || !name || !category) throw new ValidationError('assetTag, name, category are required');

    if (vendorId) {
      const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, institutionId: req.institutionId } });
      if (!vendor) throw new NotFoundError('Vendor not found or access denied');
    }

    const asset = await prisma.asset.create({
      data: {
        institutionId: req.institutionId,
        assetTag,
        name,
        category,
        location: location || null,
        quantity: Number(quantity) || 1,
        condition: condition || 'GOOD',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseValue: purchaseValue ? Number(purchaseValue) : null,
        calibrationDueDate: calibrationDueDate ? new Date(calibrationDueDate) : null,
        vendorId: vendorId || null,
      },
    });
    return sendSuccess(res, asset, 'Asset added to register successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Computer Labs
// ============================================================
const getComputerLabs = async (req, res, next) => {
  try {
    const labs = await prisma.computerLab.findMany({
      where: { institutionId: req.institutionId },
      orderBy: { labName: 'asc' },
    });
    return sendSuccess(res, labs, 'Computer labs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createComputerLab = async (req, res, next) => {
  try {
    const { labName, pcCount, specifications, operatingSystem, network } = req.body;
    if (!labName) throw new ValidationError('labName is required');

    const lab = await prisma.computerLab.create({
      data: { institutionId: req.institutionId, labName, pcCount: Number(pcCount) || 0, specifications, operatingSystem, network },
    });
    return sendSuccess(res, lab, 'Computer lab added successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Stock (consumables) — items + IN/OUT transaction ledger
// ============================================================
const getStockItems = async (req, res, next) => {
  try {
    const items = await prisma.stockItem.findMany({
      where: { institutionId: req.institutionId },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, items, 'Stock items retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createStockItem = async (req, res, next) => {
  try {
    const { name, category, unit, quantity, reorderLevel, location } = req.body;
    if (!name) throw new ValidationError('name is required');

    const item = await prisma.stockItem.create({
      data: {
        institutionId: req.institutionId,
        name,
        category: category || null,
        unit: unit || 'Units',
        quantity: Number(quantity) || 0,
        reorderLevel: Number(reorderLevel) || 10,
        location: location || null,
      },
    });
    return sendSuccess(res, item, 'Stock item added successfully', 201);
  } catch (err) {
    next(err);
  }
};

const recordStockTransaction = async (req, res, next) => {
  try {
    const { stockItemId, type, quantity, reason } = req.body;
    if (!stockItemId || !type || !quantity) throw new ValidationError('stockItemId, type, quantity are required');
    if (!['IN', 'OUT'].includes(type)) throw new ValidationError('type must be IN or OUT');

    const item = await prisma.stockItem.findFirst({ where: { id: stockItemId, institutionId: req.institutionId } });
    if (!item) throw new NotFoundError('Stock item not found or access denied');

    const qty = Number(quantity);
    const newQuantity = type === 'IN' ? item.quantity + qty : item.quantity - qty;
    if (newQuantity < 0) throw new ValidationError(`Not enough stock — only ${item.quantity} ${item.unit} available`);

    const [transaction] = await prisma.$transaction([
      prisma.stockTransaction.create({
        data: { stockItemId, type, quantity: qty, reason: reason || null, performedBy: req.user.email },
      }),
      prisma.stockItem.update({ where: { id: stockItemId }, data: { quantity: newQuantity } }),
    ]);

    return sendSuccess(res, transaction, `Stock ${type === 'IN' ? 'inward' : 'outward'} entry recorded successfully`, 201);
  } catch (err) {
    next(err);
  }
};

const getStockTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.stockTransaction.findMany({
      where: { stockItem: { institutionId: req.institutionId } },
      include: { stockItem: { select: { name: true, unit: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return sendSuccess(res, transactions, 'Stock transactions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Purchase Orders
// ============================================================
const getPurchaseOrders = async (req, res, next) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: { institutionId: req.institutionId },
      include: { vendor: { select: { name: true } } },
      orderBy: { orderDate: 'desc' },
    });
    return sendSuccess(res, orders, 'Purchase orders retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    const { vendorId, items, totalAmount, orderDate } = req.body;
    if (!vendorId || !items || !totalAmount) throw new ValidationError('vendorId, items, totalAmount are required');

    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, institutionId: req.institutionId } });
    if (!vendor) throw new NotFoundError('Vendor not found or access denied');

    const poNumber = await nextPoNumber(req.institutionId);
    const order = await prisma.purchaseOrder.create({
      data: {
        institutionId: req.institutionId,
        poNumber,
        vendorId,
        items,
        totalAmount: Number(totalAmount),
        orderDate: orderDate ? new Date(orderDate) : new Date(),
      },
      include: { vendor: { select: { name: true } } },
    });
    return sendSuccess(res, order, 'Purchase order created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const existing = await prisma.purchaseOrder.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Purchase order not found');

    const order = await prisma.purchaseOrder.update({ where: { id }, data: { status } });
    return sendSuccess(res, order, 'Purchase order status updated successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Asset Maintenance (service/repair/calibration events — distinct from
// EquipmentIssue, which is who currently has an asset checked out)
// ============================================================
const MAINTENANCE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const getMaintenanceRecords = async (req, res, next) => {
  try {
    const { assetId, status } = req.query;
    const records = await prisma.assetMaintenanceRecord.findMany({
      where: {
        asset: { institutionId: req.institutionId },
        ...(assetId && { assetId }),
        ...(status && { status }),
      },
      include: { asset: { select: { name: true, assetTag: true } }, vendor: { select: { name: true } } },
      orderBy: { scheduledDate: 'desc' },
    });
    return sendSuccess(res, records, 'Maintenance records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const scheduleMaintenance = async (req, res, next) => {
  try {
    const { assetId, description, scheduledDate, vendorId, cost, notes } = req.body;
    if (!assetId || !description || !scheduledDate) throw new ValidationError('assetId, description and scheduledDate are required');

    const asset = await prisma.asset.findFirst({ where: { id: assetId, institutionId: req.institutionId } });
    if (!asset) throw new NotFoundError('Asset not found or access denied');

    if (vendorId) {
      const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, institutionId: req.institutionId } });
      if (!vendor) throw new NotFoundError('Vendor not found or access denied');
    }

    const record = await prisma.assetMaintenanceRecord.create({
      data: {
        assetId,
        description,
        scheduledDate: new Date(scheduledDate),
        vendorId: vendorId || null,
        cost: cost || null,
        notes: notes || null,
        createdById: req.user.id,
      },
    });
    return sendSuccess(res, record, 'Maintenance scheduled successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateMaintenanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cost, notes } = req.body;
    if (!status || !MAINTENANCE_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${MAINTENANCE_STATUSES.join(', ')}`);

    const existing = await prisma.assetMaintenanceRecord.findFirst({ where: { id, asset: { institutionId: req.institutionId } } });
    if (!existing) throw new NotFoundError('Maintenance record not found');

    const record = await prisma.assetMaintenanceRecord.update({
      where: { id },
      data: {
        status,
        ...(cost !== undefined && { cost }),
        ...(notes !== undefined && { notes }),
        ...(status === 'COMPLETED' && { completedDate: new Date() }),
      },
    });

    // Completing a repair is a real signal the asset is usable again — same convention
    // as EquipmentIssue return updating Asset elsewhere in this controller.
    if (status === 'COMPLETED') {
      await prisma.asset.update({ where: { id: existing.assetId }, data: { condition: 'GOOD' } });
    }

    return sendSuccess(res, record, 'Maintenance record updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVendors,
  createVendor,
  getAssets,
  createAsset,
  getComputerLabs,
  createComputerLab,
  getStockItems,
  createStockItem,
  recordStockTransaction,
  getStockTransactions,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  getMaintenanceRecords,
  scheduleMaintenance,
  updateMaintenanceStatus,
};
