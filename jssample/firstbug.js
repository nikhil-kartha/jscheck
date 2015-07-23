function normalizeHoldPulseConfig() {

    return {hold: nOpts.delay}; 
}

function firstBug() {
    // BAD/BUG
    console.log(normalizeHoldPulseConfig().name);
}
//firstBug();

// output: firstbug.js:7 -- possibly invalid key name referenced for prototype/hash 
// output: firstbug.js:7 -- possibly invalid key name ('name') referenced for prototype/hash 
