function normalizeHoldPulseConfig() {
    return {events: {hold: nOpts.delay}}; // BAD/BUG
}

function secondBug() {
  console.log(normalizeHoldPulseConfig().events.name);
}
