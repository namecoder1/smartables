/**
 * Canonical Telnyx webhook event factories.
 *
 * Covers the two main event types this app handles:
 *  - call.initiated / call.answered / call.hangup  (voice call flow)
 *  - requirement_group.status.updated              (compliance pipeline)
 */

export const TELNYX_PHONE_NUMBER = "+390299999999";
export const CALLER_PHONE = "+393401234567";
export const CALL_CONTROL_ID = "call_ctrl_test_123";
export const CALL_SESSION_ID = "call_session_test_123";
export const REQUIREMENT_GROUP_ID = "req_group_test_123";

// ─── Event envelope builder ───────────────────────────────────────────────────

export function makeTelnyxEvent(
  eventType: string,
  payload: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
) {
  return {
    data: {
      event_type: eventType,
      id: "evt_test_123",
      occurred_at: "2024-01-01T12:00:00.000Z",
      payload,
      ...overrides,
    },
  };
}

// ─── Call event builders ──────────────────────────────────────────────────────

export function makeCallInitiatedEvent(overrides: Record<string, unknown> = {}) {
  return makeTelnyxEvent("call.initiated", {
    call_control_id: CALL_CONTROL_ID,
    call_session_id: CALL_SESSION_ID,
    call_leg_id: "leg_test_123",
    from: CALLER_PHONE,
    to: TELNYX_PHONE_NUMBER,
    direction: "incoming",
    state: "parked",
    ...overrides,
  });
}

export function makeCallAnsweredEvent(overrides: Record<string, unknown> = {}) {
  return makeTelnyxEvent("call.answered", {
    call_control_id: CALL_CONTROL_ID,
    call_session_id: CALL_SESSION_ID,
    from: CALLER_PHONE,
    to: TELNYX_PHONE_NUMBER,
    direction: "incoming",
    ...overrides,
  });
}

export function makeCallHangupEvent(
  hangupCause: string = "normal_clearing",
  overrides: Record<string, unknown> = {},
) {
  return makeTelnyxEvent("call.hangup", {
    call_control_id: CALL_CONTROL_ID,
    call_session_id: CALL_SESSION_ID,
    from: CALLER_PHONE,
    to: TELNYX_PHONE_NUMBER,
    direction: "incoming",
    hangup_cause: hangupCause,
    ...overrides,
  });
}

export function makeCallRecordingSavedEvent(recordingUrl: string, overrides: Record<string, unknown> = {}) {
  return makeTelnyxEvent("call.recording.saved", {
    call_control_id: CALL_CONTROL_ID,
    call_session_id: CALL_SESSION_ID,
    recording_urls: { mp3: recordingUrl },
    ...overrides,
  });
}

// ─── Compliance event builders ────────────────────────────────────────────────

export function makeRequirementGroupStatusEvent(
  status: "pending" | "approved" | "rejected",
  overrides: Record<string, unknown> = {},
) {
  return makeTelnyxEvent("requirement_group.status.updated", {
    id: REQUIREMENT_GROUP_ID,
    status,
    ...overrides,
  });
}
