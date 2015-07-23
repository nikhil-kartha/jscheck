function normalizeHoldPulseConfig() {
    return {events: [{hold: 'a'}]}; 
}

function thirdBug() {
    // BAD/BUG
    console.log(normalizeHoldPulseConfig().events.shift().name);
}

