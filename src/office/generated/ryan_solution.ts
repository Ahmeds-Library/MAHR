/**
Client                                                  Server
  |                                                       |
  |--- [App Data: State Update] ------------------------->|
  |                                                       |
  |--- [HEARTBEAT: "ping"] ------------------------------>|
  |<-- [HEARTBEAT: "pong"] -------------------------------|  (Reset client death-timer)
  |                                                       |
  |    ... Network drops silently ...                     |
  |                                                       |
  |--- [HEARTBEAT: "ping"] ------------------------------>X
  |    [Timer expires: No "pong" received!]               |
  |    [Action: Force close socket & trigger reconnect]   |
  |                                                       |
  |===> Reconnect & State Reconciliation (Pam Milestone) ->|
*/
export const RYAN_HEARTBEAT_SPEC = "Ryan Milestone Heartbeat Specification";
