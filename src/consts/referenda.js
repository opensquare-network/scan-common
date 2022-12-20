const ReferendaEvents = Object.freeze({
  Submitted: "Submitted",
  DecisionDepositPlaced: "DecisionDepositPlaced",
  DecisionDepositRefunded: "DecisionDepositRefunded",
  DepositSlashed: "DepositSlashed",
  DecisionStarted: "DecisionStarted",
  ConfirmStarted: "ConfirmStarted",
  ConfirmAborted: "ConfirmAborted",
  Confirmed: "Confirmed",
  Approved: "Approved",
  Rejected: "Rejected",
  TimedOut: "TimedOut",
  Cancelled: "Cancelled",
  Killed: "Killed",
});

module.exports = {
  ReferendaEvents,
}
