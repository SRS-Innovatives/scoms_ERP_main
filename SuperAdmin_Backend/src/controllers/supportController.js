/**
 * Super Admin Support Controller
 */
const { sendSuccess } = require('../../../shared');

const getTickets = async (req, res, next) => {
  try {
    // There is no Support Ticket table in schema yet, sending mock data
    const mockTickets = [
      { id: 'TKT-001', institution: 'Greenwood High', subject: 'Integration Issue', priority: 'High', status: 'Open', date: '2026-08-20' },
      { id: 'TKT-002', institution: 'Springfield College', subject: 'Billing Error', priority: 'Medium', status: 'In Progress', date: '2026-08-19' }
    ];
    
    return sendSuccess(res, mockTickets, 'Tickets retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTickets
};
