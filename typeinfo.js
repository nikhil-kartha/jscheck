
function find_type_in_obj (s, obj, x)
{
    /*
    Look for type string "s" in an object "obj" in global.DICT object.
    s: type string converted to list
    obj: eg: OBJ_XXX_XXX, i.e key in DICT
    x: index for s
    Note: we dont look for obj in s, always swap appropriately.
    */
    console.log("find type");

    var DICT = global.DICT;

    if (x >= s.length){
        return false;
    }

    if (s[x] === "Literal"){
        return true;
    }

    else if (s[x] === "OBJECT"){
        // we incr the index to get the key for the object, not needed for ARRAY’s 
        x = x + 1;
        //console.log(s[x] + " inO " + DICT[obj]);
        if (s[x] in DICT[obj]){  // events in
            console.log("found "+ s[x]);
            obj = DICT[obj][s[x]]  // obj = OBJ_413_440
            x = x + 1;
            find_type_in_obj(s, obj, x);
        } else{
            console.log("Failed to find " + s[x] + " in " + JSON.stringify(DICT[obj]));
            return false;
        }
    }

    else if ( s[x] === "ARRAY" ){
        //console.log(s[x] + " inA " + DICT[obj]);
        if ( s[x] in DICT[obj] ){
            //found ARRAY;
            obj = DICT[obj]["ARRAY"]; // obj = OBJ_414_439
            x = x + 1;
            find_type_in_obj(s, obj, x);
        } else{
            console.log("Failed to find " + s[x] + " in " + JSON.stringify(DICT[obj]));
            //console.log("Failed to find" + s + " in " + JSON.stringify(DICT[obj]));
            return false;
        }

    }

}

function type_check_object(obj1, obj2, scope){
    console.log("type check object");

    var var1;
    var var2;

    if(obj1.indexOf("this." === 0)){
        var1 = obj1.split('.')[1];
    }

    if(obj2.indexOf("this." === 0)){
        var2 = obj2.split('.')[1];
    }

    if(typeof(scope[var1]) === "object"){
        // Iterate through a list of types, lookup each in var2
        for(var i in scope[var1]){
            var s = scope[var1][i]
            var found = find_type_in_obj(s.split('.'), scope[var2], 0);
        }
    }


}

//var obj = "OBJ_328_1829";
function type_check_scratch(obj, DICT){
    //console.log(DICT[obj]["SCRATCH"]);
    var cmp = [];
    var ci = 0;
    for(prop in DICT[obj]["SCRATCH"]){
        if(DICT[obj]["SCRATCH"][prop].length > 1){
            //console.log(DICT[obj]["SCRATCH"][prop]);
            for( var i in DICT[obj]["SCRATCH"][prop]){
                if( DICT[obj]["SCRATCH"][prop][i].indexOf("this.") === 0 ){
                    cmp[ci] = DICT[obj]["SCRATCH"][prop][i];
                    //console.log(cmp[ci]);
                    ci = ci + 1;
                }
                if( ci === 2 ){
                    //console.log("find "+cmp);
                    //find_type_in_obj(cmp[0], cmp[1]);
                    var scope = DICT[obj];
                    type_check_object(cmp[0], cmp[1], scope);
                }
            }
        }
    }
}

function resolve_var(x, FUNC){
    //console.log("Resolving variable "+x);
    //console.log('Found value:' + FUNC.VARNAMES[x]);
    return FUNC.VARNAMES[x];
}

function propagate_vars(FUNC, DICT)
{
    for (var prop in FUNC.VARNAMES){
        if(FUNC.VARNAMES.hasOwnProperty(prop)){
            //console.log(prop);
            //resolve_var(prop, FUNC)
            if(prop.indexOf("this.") === 0){
                // Lookup in UPPER scope
                var name = prop.split('.')[1];
                if(DICT[FUNC.UPPER]["SCRATCH"] === undefined){ DICT[FUNC.UPPER]["SCRATCH"] = {} }
                if(DICT[FUNC.UPPER]["SCRATCH"][name] === undefined){ DICT[FUNC.UPPER]["SCRATCH"][name] = [] }
                //DICT[FUNC.UPPER]["SCRATCH"][name].push(FUNC.VARNAMES[prop]);
                var vars = FUNC.VARNAMES[prop]
                for (var i in vars){
                    if(vars[i].indexOf("this.") === 0){
                        //console.log("this.");
                        DICT[FUNC.UPPER]["SCRATCH"][name].push(vars[i]);
                    } else{
                        //console.log("resolve");
                        var multiple = resolve_var(vars[i], FUNC);
                        if( typeof(multiple) === "string"){
                            DICT[FUNC.UPPER]["SCRATCH"][name].push(multiple);
                        } else{
                            for (var j in multiple){
                                DICT[FUNC.UPPER]["SCRATCH"][name].push(multiple[j]);
                            }
                        }
                    }
                }
                console.log("DICT FUNC UPPER / SCRATCH  :" + JSON.stringify(DICT[FUNC.UPPER]["SCRATCH"]));
            }
        }
    }
    //console.log("DICT FUNC UPPER / SCRATCH :" + JSON.stringify(DICT[FUNC.UPPER]["SCRATCH"]));
}


function type_check_func(func, GLOBALDICT)
{
    /*
    { nOpts: [ 'opts', 'this.normalizeHoldPulseConfig' ],
      'this.holdPulseConfig': [ 'nOpts' ] }
    */

    var DICT = GLOBALDICT;
    //console.log(DICT[func].VARNAMES);
    var FUNC = DICT[func];

    if(FUNC){
        propagate_vars(FUNC, DICT);
    }

}

function typechecker(SCOPES){

    console.log("\nTYPE CHECKING ...\n");

    for(var i in SCOPES){
        if(i === "0"){
            console.log("SKIP SCOPE[0]");
            continue;
        }
        var FUNC = "FUNC_"+SCOPES[i].block.body.range[0]+"_"+SCOPES[i].block.body.range[1]
        console.log("\nProcessing "+ FUNC);
        type_check_func(FUNC, global.DICT);

    }

    for(var key in global.DICT){
        if(key.indexOf("OBJ_") === 0){
            console.log("\nProcessing "+key);
            type_check_scratch(key, global.DICT);
        }
    }

}


exports.typechecker = typechecker;
