/**
 * Institute Admin Transport Controller
 *
 * Vehicle (fleet + driver + FC/insurance/license expiry) -> TransportRoute (per-vehicle
 * corridor with a monthly fare) -> StudentTransportMapping (one student = one route +
 * pickup point). VehicleTrip is a lightweight per-day morning/evening boarding log.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
} = require('../../../shared');

/** Local calendar date as a UTC-midnight Date, so `@db.Date` columns store the
 * intended day regardless of the server's timezone offset from UTC. */
const toDateOnly = (dateStr) => {
  if (dateStr) return new Date(dateStr);
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

// ============================================================
// Vehicles (Fleet)
// ============================================================
const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { institutionId: req.institutionId },
      include: { _count: { select: { routes: true } } },
      orderBy: { vehicleNumber: 'asc' },
    });
    return sendSuccess(res, vehicles, 'Vehicles retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const {
      vehicleNumber, vehicleType, capacity, driverName, driverPhone,
      driverLicenseNumber, licenseExpiryDate, fcExpiryDate, insuranceExpiryDate, gpsEnabled,
    } = req.body;
    if (!vehicleNumber) throw new ValidationError('vehicleNumber is required');

    const vehicle = await prisma.vehicle.create({
      data: {
        institutionId: req.institutionId,
        vehicleNumber,
        vehicleType: vehicleType || 'BUS',
        capacity: Number(capacity) || 40,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        driverLicenseNumber: driverLicenseNumber || null,
        licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
        fcExpiryDate: fcExpiryDate ? new Date(fcExpiryDate) : null,
        insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : null,
        gpsEnabled: !!gpsEnabled,
      },
    });
    return sendSuccess(res, vehicle, 'Vehicle added to fleet successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Routes
// ============================================================
const getRoutes = async (req, res, next) => {
  try {
    const routes = await prisma.transportRoute.findMany({
      where: { institutionId: req.institutionId },
      include: { vehicle: true, _count: { select: { mappings: true } } },
      orderBy: { routeName: 'asc' },
    });
    return sendSuccess(res, routes, 'Transport routes retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createRoute = async (req, res, next) => {
  try {
    const { routeName, startPoint, endPoint, monthlyFare, vehicleId } = req.body;
    if (!routeName || !startPoint || !endPoint || !monthlyFare) {
      throw new ValidationError('routeName, startPoint, endPoint, monthlyFare are required');
    }

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, institutionId: req.institutionId } });
      if (!vehicle) throw new NotFoundError('Vehicle not found or access denied');
    }

    const route = await prisma.transportRoute.create({
      data: {
        institutionId: req.institutionId,
        routeName,
        startPoint,
        endPoint,
        monthlyFare: Number(monthlyFare),
        vehicleId: vehicleId || null,
      },
    });
    return sendSuccess(res, route, 'Transport route created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Student <-> Route Mapping
// ============================================================
const getMappings = async (req, res, next) => {
  try {
    const mappings = await prisma.studentTransportMapping.findMany({
      where: { route: { institutionId: req.institutionId } },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true, course: { select: { name: true } } } },
        route: { select: { routeName: true, monthlyFare: true, vehicle: { select: { vehicleNumber: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, mappings, 'Student route mappings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const assignStudentToRoute = async (req, res, next) => {
  try {
    const { studentId, routeId, pickupPoint } = req.body;
    if (!studentId || !routeId || !pickupPoint) throw new ValidationError('studentId, routeId, pickupPoint are required');

    const route = await prisma.transportRoute.findFirst({ where: { id: routeId, institutionId: req.institutionId } });
    if (!route) throw new NotFoundError('Route not found or access denied');

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');

    const mapping = await prisma.studentTransportMapping.upsert({
      where: { studentId },
      create: { studentId, routeId, pickupPoint },
      update: { routeId, pickupPoint },
    });
    return sendSuccess(res, mapping, 'Student assigned to bus route successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Vehicle Trip Boarding Log
// ============================================================
const getTrips = async (req, res, next) => {
  try {
    const { date } = req.query;
    const day = toDateOnly(date);

    const vehicles = await prisma.vehicle.findMany({
      where: { institutionId: req.institutionId },
      include: {
        trips: { where: { tripDate: day } },
        routes: { select: { routeName: true } },
      },
      orderBy: { vehicleNumber: 'asc' },
    });

    const result = vehicles.map((v) => ({
      id: v.id,
      vehicleNumber: v.vehicleNumber,
      routeName: v.routes[0]?.routeName || '—',
      morning: v.trips.find((t) => t.session === 'MORNING') || null,
      evening: v.trips.find((t) => t.session === 'EVENING') || null,
    }));

    return sendSuccess(res, result, 'Vehicle trip log retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const markTripComplete = async (req, res, next) => {
  try {
    const { vehicleId, session, date, remarks } = req.body;
    if (!vehicleId || !session) throw new ValidationError('vehicleId and session are required');

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, institutionId: req.institutionId } });
    if (!vehicle) throw new NotFoundError('Vehicle not found or access denied');

    const day = toDateOnly(date);

    const trip = await prisma.vehicleTrip.upsert({
      where: { vehicleId_tripDate_session: { vehicleId, tripDate: day, session } },
      create: { vehicleId, tripDate: day, session, status: 'COMPLETED', completedAt: new Date(), remarks },
      update: { status: 'COMPLETED', completedAt: new Date(), remarks },
    });
    return sendSuccess(res, trip, `${session} trip marked complete`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVehicles,
  createVehicle,
  getRoutes,
  createRoute,
  getMappings,
  assignStudentToRoute,
  getTrips,
  markTripComplete,
};
