function normalizeHoldPulseConfig() {
    return {events: [{hold: 'a'}]}; 
}

function thirdBug() {
    // BAD/BUG
    console.log(normalizeHoldPulseConfig().events[0].name);
}

