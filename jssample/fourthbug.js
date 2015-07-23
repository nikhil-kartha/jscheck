function normalizeHoldPulseConfig() {
    this._next = {events: [{hold: 'a'}]}; 
}

function fourthBug() {
    // BAD/BUG
    normalizeHoldPulseConfig();
    console.log(this._next.events.shift().name);
}

fourthBug();
