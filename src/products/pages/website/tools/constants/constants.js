export const TOOL_EVENTS = {
  CONNECTION_NOTE_SUCCESS: 'TOOL_CONNECTION_NOTE_SUCCESS',
  CONNECTION_NOTE_FAILURE: 'TOOL_CONNECTION_NOTE_FAILURE',
};

export const NOTE_REASONS = [
  { value: 'network', label: 'Networking' },
  { value: 'sell', label: 'Possible customer' },
  { value: 'hire', label: 'Recruiting' },
  { value: 'job', label: 'Job search' },
  { value: 'partner', label: 'Partnership' },
  { value: 'followup', label: 'We have met or interacted' },
];

export const NOTE_TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'warm', label: 'Warm' },
  { value: 'direct', label: 'Direct' },
  { value: 'curious', label: 'Curious' },
];
