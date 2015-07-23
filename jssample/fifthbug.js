function normalizeHoldPulseConfig() {
    return {events: [{hold: 'a'}]}; 
}

function maybeSendHold() {
    var n = this._next.events.shift();
    // BAD/BUG
    console.log(n.name);
}

function fifthBug() {
    this._next = normalizeHoldPulseConfig();
    maybeSendHold();
}

fifthBug();
