const Modules = Object.freeze({
  Treasury: "treasury",
  Council: "council",
  Proxy: "proxy",
  Multisig: "multisig",
  Utility: "utility",
  Tips: "tips",
  Bounties: "bounties",
  Staking: "staking",
  Identity: "identity",
  Democracy: "democracy",
  ElectionsPhragmen: "electionsPhragmen",
  PhragmenElection: "phragmenElection",
  Session: "session",
  Balances: "balances",
  Sudo: "sudo",
  TechnicalCommittee: "technicalCommittee",
  ChildBounties: "childBounties",
  Timestamp: "timestamp",
  ParachainSystem: "parachainSystem",
  ParaInherent: "paraInherent",
  Referenda: "referenda",
});

const ChildBountiesEvents = Object.freeze({
  Added: "Added",
  Awarded: "Awarded",
  Claimed: "Claimed",
  Canceled: "Canceled",
})

const ChildBountiesMethods = Object.freeze({
  proposeCurator: "proposeCurator",
  acceptCurator: "acceptCurator",
  unassignCurator: "unassignCurator",
});

const SudoMethods = Object.freeze({
  sudo: "sudo",
  sudoAs: "sudoAs",
});

const SudoEvents = Object.freeze({
  Sudid: "Sudid",
  SudoAsDone: "SudoAsDone",
});

const DemocracyMethods = Object.freeze({
  externalPropose: "externalPropose",
  externalProposeMajority: "externalProposeMajority",
  externalProposeDefault: "externalProposeDefault",
  fastTrack: "fastTrack",
});

const KaruraModules = Object.freeze({
  GeneralCouncil: "generalCouncil",
});

const TipEvents = Object.freeze({
  NewTip: "NewTip",
  TipClosing: "TipClosing",
  TipClosed: "TipClosed",
  TipRetracted: "TipRetracted",
  TipSlashed: "TipSlashed",
});

const TipMethods = Object.freeze({
  tipNew: "tipNew",
  reportAwesome: "reportAwesome",
  retractTip: "retractTip",
  tip: "tip",
  closeTip: "closeTip",
});

const ProxyMethods = Object.freeze({
  proxy: "proxy",
  proxyAnnounced: "proxyAnnounced",
});

const ProxyEvents = Object.freeze({
  ProxyExecuted: "ProxyExecuted",
});

const MultisigMethods = Object.freeze({
  asMulti: "asMulti",
  asMultiThreshold1: "asMultiThreshold1",
});

const MultisigEvents = Object.freeze({
  MultisigExecuted: "MultisigExecuted",
});

const UtilityMethods = Object.freeze({
  batch: "batch",
  batchAll: "batchAll",
  forceBatch: "forceBatch",
  asDerivative: "asDerivative",
});

const UtilityEvents = Object.freeze({
  BatchInterrupted: "BatchInterrupted",
  BatchCompleted: "BatchCompleted",
  ItemCompleted: "ItemCompleted",
});

const TimelineItemTypes = Object.freeze({
  extrinsic: "extrinsic",
  event: "event",
});

const CollectiveMethods = Object.freeze({
  propose: "propose",
});

const CouncilEvents = Object.freeze({
  Proposed: "Proposed",
  Voted: "Voted",
  Approved: "Approved",
  Disapproved: "Disapproved",
  Executed: "Executed",
  Closed: "Closed",
});

const TechnicalCommitteeEvents = Object.freeze({
  ...CouncilEvents,
});

const TreasuryProposalEvents = Object.freeze({
  Proposed: "Proposed",
  Awarded: "Awarded",
  Rejected: "Rejected",
});

const TreasuryProposalMethods = Object.freeze({
  proposeSpend: "proposeSpend",
  rejectProposal: "rejectProposal",
  approveProposal: "approveProposal",
});

const BountyMethods = Object.freeze({
  proposeBounty: "proposeBounty",
  approveBounty: "approveBounty",
  proposeCurator: "proposeCurator",
  unassignCurator: "unassignCurator",
  acceptCurator: "acceptCurator",
  awardBounty: "awardBounty",
  claimBounty: "claimBounty",
  closeBounty: "closeBounty",
  extendBountyExpiry: "extendBountyExpiry",
});

const BountyEvents = Object.freeze({
  BountyProposed: "BountyProposed",
  BountyRejected: "BountyRejected",
  BountyBecameActive: "BountyBecameActive",
  BountyAwarded: "BountyAwarded",
  BountyClaimed: "BountyClaimed",
  BountyCanceled: "BountyCanceled",
  BountyExtended: "BountyExtended",
});

const BountyStatus = Object.freeze({
  Proposed: "Proposed",
  Approved: "Approved",
  /// The bounty is funded and waiting for curator assignment.
  Funded: "Funded",
  /// A curator has been proposed by the `ApproveOrigin`. Waiting for acceptance from the
  /// curator.
  CuratorProposed: "CuratorProposed",
  /// The bounty is active and waiting to be awarded.
  Active: "Active",
  /// The bounty is awarded and waiting to released after a delay.
  PendingPayout: "PendingPayout",
  Rejected: "Rejected",
  Canceled: "Canceled",
  Claimed: "Claimed",
});

const ChildBountyState = Object.freeze({
  Added: "Added",
  CuratorProposed: "CuratorProposed",
  Active: "Active",
  PendingPayout: "PendingPayout",
  Rejected: "Rejected",
  Canceled: "Canceled",
  Claimed: "Claimed",
})

const TreasuryCommonEvent = Object.freeze({
  Burnt: "Burnt",
  Deposit: "Deposit",
});

const MotionState = Object.freeze({
  ApproveVoting: "ApproveVoting",
  RejectVoting: "RejectVoting",
});

const DemocracyPublicProposalEvents = Object.freeze({
  Proposed: "Proposed",
  Tabled: "Tabled",
});

const ReferendumEvents = Object.freeze({
  Started: "Started",
  Passed: "Passed",
  NotPassed: "NotPassed",
  Cancelled: "Cancelled",
  Executed: "Executed",
  PreimageMissing: "PreimageMissing",
  PreimageInvalid: "PreimageInvalid",
});

const DemocracyExternalEvents = Object.freeze({
  Vetoed: "Vetoed",
  ExternalTabled: "ExternalTabled",
});

const DemocracyExternalStates = Object.freeze({
  Proposed: "Proposed",
  Tabled: "Tabled",
});

const PreImageEvents = Object.freeze({
  PreimageNoted: "PreimageNoted",
  PreimageUsed: "PreimageUsed",
  PreimageInvalid: "PreimageInvalid",
  PreimageMissing: "PreimageMissing",
  PreimageReaped: "PreimageReaped",
});

const BalancesEvents = Object.freeze({
  Transfer: "Transfer",
  Reserved: "Reserved",
  Withdraw: "Withdraw",
});

const StakingEvents = Object.freeze({
  EraPayout: "EraPayout",
  Slash: "Slash",
  Slashed: "Slashed",
  Reward: "Reward",
  EraPaid: "EraPaid",
});

const IdentityEvents = Object.freeze({
  IdentityKilled: "IdentityKilled",
});

const ElectionsPhragmenEvents = Object.freeze({
  CandidateSlashed: "CandidateSlashed",
  SeatHolderSlashed: "SeatHolderSlashed",
  NewTerm: "NewTerm",
  Renounced: "Renounced",
});

const KsmTreasuryAccount = "F3opxRbN5ZbjJNU511Kj2TLuzFcDq9BGduA9TgiECafpg29";
const DotTreasuryAccount = "13UVJyLnbVp9RBZYFwFGyDvVd1y27Tt8tkntv6Q7JVPhFsTB";

module.exports = {
  Modules,
  TipEvents,
  TipMethods,
  ProxyMethods,
  ProxyEvents,
  MultisigMethods,
  MultisigEvents,
  UtilityMethods,
  UtilityEvents,
  TimelineItemTypes,
  CouncilEvents,
  KaruraModules,
  TreasuryProposalEvents,
  TreasuryProposalMethods,
  MotionState,
  DemocracyPublicProposalEvents,
  ReferendumEvents,
  DemocracyMethods,
  DemocracyExternalStates,
  TechnicalCommitteeEvents,
  SudoMethods,
  SudoEvents,
  DemocracyExternalEvents,
  PreImageEvents,
  BalancesEvents,
  KsmTreasuryAccount,
  DotTreasuryAccount,
  TreasuryCommonEvent,
  BountyEvents,
  BountyMethods,
  BountyStatus,
  ChildBountiesEvents,
  ChildBountiesMethods,
  ChildBountyState,
  StakingEvents,
  IdentityEvents,
  ElectionsPhragmenEvents,
  CollectiveMethods,
  ...require("./chains"),
  ...require("./referenda"),
};
