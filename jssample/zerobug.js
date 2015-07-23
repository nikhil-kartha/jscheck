function firstBug() {
    var h = {hold: nOpts.delay}; 

    // BAD/BUG
    console.log(h.name);

    //var x;
    //x = h.name;
}

// output: zerobug.js:5 -- possibly invalid key name referenced for prototype/hash 
// output: zerobug.js:5 -- possibly invalid key name ('name') referenced for prototype/hash 
