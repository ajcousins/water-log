# 05 — Follow Request and Follow management

**What to build:** Signed-in users can send a **Follow Request** by exact username, accept/reject incoming requests, manage the one Follow slot, and revoke followers — without a Vessel marker yet.

**Blocked by:** 03 — Account signup / sign-in / sign-out in Settings

**Status:** ready-for-agent

- [ ] Send Follow Request by exact username; cannot Follow self; blocked while an active Follow or outgoing pending Request exists
- [ ] Recipient sees pending Requests via ~30s poll as one Accept/Reject modal at a time; next modal after each action; Accept does not auto-Reject others
- [ ] Requester can cancel pending Request and re-request immediately; after Reject, must wait 24 hours before requesting that user again
- [ ] Following control in Settings shows active Follow or outgoing pending Request; Unfollow / cancel works
- [ ] Followers list in Settings with revoke; after revoke or Unfollow, a new Follow Request is required
- [ ] Many users may Follow the same person; a user may have at most one active Follow
- [ ] Follow / Follow Request tables created with **RLS enabled** and policies matching consent rules (RLS was not enabled in ticket 01)
- [ ] Tests cover Follow Request rules via the remote façade fake
