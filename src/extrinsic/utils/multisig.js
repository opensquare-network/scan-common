const { WrappedEvents } = require("../../type/wrappedEvents");
const { Modules, MultisigEvents } = require("../../consts");

function getMultisigInnerCallEvents(wrappedEvents) {
  const source = (wrappedEvents?.events || []);
  const index = source.findIndex(
    ({ event }) => event?.method === MultisigEvents.MultisigExecuted
  )

  let events = source.slice(0, index);
  if (index < 0) {
    events = source;
  }

  return new WrappedEvents(
    events,
    wrappedEvents.offset,
    index >= 0 ? true : wrappedEvents.wrapped
  );
}

function isMultisigExecutedOk(events = []) {
  const event = events.find(({ event }) =>
    [Modules.Multisig, Modules.Utility].includes(event.section) && MultisigEvents.MultisigExecuted === event.method
  );

  if (!event) {
    return false
  }

  if (event.event?.data.length <= 4) {
    // For kusama spec 1055, `MultisigExecuted` event has no callHash argument
    return event.event?.data[3].isOk;
  } else {
    return event.event?.data[4].isOk;
  }
}

module.exports = {
  getMultisigInnerCallEvents,
  isMultisigExecutedOk,
}
