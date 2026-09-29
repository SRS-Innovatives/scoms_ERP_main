/**
 * In-process application event bus (Phase 9) — plain Node EventEmitter, per the spec's
 * own "start simple, no Kafka/RabbitMQ" rule. A single Express process already handles
 * all of an institution's traffic here (see the Notification Scheduler job for the same
 * reasoning), so this is a correct foundation; if this ever needs to fan out across
 * multiple processes, this is the one place that would need a real message broker.
 */
const EventEmitter = require('events');

const eventBus = new EventEmitter();
eventBus.setMaxListeners(50); // generous headroom — a handful of listeners is expected, not a leak

module.exports = eventBus;
