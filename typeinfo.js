
function find_type_in_obj (s, obj, x)
{
    /*
    Look for type string "s" in an object "obj" in global.DICT object.
    s: type string converted to list
    obj: eg: OBJ_XXX_XXX, i.e key in DICT
    x: index for s
    Note: we dont look for obj in s, always swap appropriately.
    */

    var NORMAL='\033[0m'
    var RED='\033[31m'

    var DICT = global.DICT;
    console.warn("find type " + s.join('.') + " in " + JSON.stringify(DICT[obj]));

    if (x >= s.length){
        return false;
    }

    if (s[x] === "Literal"){
        return true;
    }

    else if (s[x] === "OBJECT"){
        // we incr the index to get the key for the object, not needed for ARRAY’s 
        x = x + 1;
        //console.warn(s[x] + " inO " + DICT[obj]);
        if (s[x] in DICT[obj]){  // events in
            console.warn("found "+ s[x]);
            obj = DICT[obj][s[x]]  // obj = OBJ_413_440
            x = x + 1;
            find_type_in_obj(s, obj, x);
        } else{
            console.info(RED + "Failed to find " + s[x] + " in " + JSON.stringify(DICT[obj]) + NORMAL);
            console.warn(RED + "Failed to find " + s[x] + " in " + JSON.stringify(DICT[obj]) + NORMAL);
            return false;
        }
    }

    else if ( s[x] === "ARRAY" ){
        //console.warn(s[x] + " inA " + DICT[obj]);
        if ( s[x] in DICT[obj] ){
            //found ARRAY;
            obj = DICT[obj]["ARRAY"]; // obj = OBJ_414_439
            x = x + 1;
            find_type_in_obj(s, obj, x);
        } else{
            console.info(RED + "Failed to find " + s[x] + " in " + JSON.stringify(DICT[obj]) + NORMAL);
            console.warn(RED + "Failed to find " + s[x] + " in " + JSON.stringify(DICT[obj]) + NORMAL);
            //console.warn("Failed to find" + s + " in " + JSON.stringify(DICT[obj]));
            return false;
        }

    }

}

function type_check_object(obj1, obj2, scope){

    var var1;
    var var2;
    console.warn("");
    if(obj1 === undefined || obj2 === undefined){
        console.warn("Skip type_check_object for "+ obj1 + " AND " + obj2);
        return false;
    }
    else{
        console.warn("type_check_object for "+ obj1 + " AND " + obj2);
    }
    console.warn("");

    if(obj1.indexOf("this." === 0)){
        var1 = obj1.split('.')[1];
    }

    if(obj2.indexOf("this." === 0)){
        var2 = obj2.split('.')[1];
    }

    if(var1 === var2){
        console.warn("Skip. Variables " + obj1 + " " + obj2 + " are the same.");
        found = false;
        return;
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
    /*
        Process SCRATCH area. For each variable/key with multiple values,
        compare/typecheck the values
        Note: We only compare/typecheck the first 2 values, we 
        should be comparing/typechecking each value to every other value
    */
    //console.warn(DICT[obj]["SCRATCH"]);
    var cmp = [];
    var ci = 0;
    console.warn("Variables in SCRATCH.");
    for(prop in DICT[obj]["SCRATCH"]){
        console.warn(prop +" : "+ JSON.stringify(DICT[obj]["SCRATCH"][prop]));
        if(DICT[obj]["SCRATCH"][prop].length > 1){
            //console.warn(DICT[obj]["SCRATCH"][prop]);
            for( var i in DICT[obj]["SCRATCH"][prop]){
                /*
                if( DICT[obj]["SCRATCH"][prop][i].indexOf("this.") === 0 ){
                    cmp[ci] = DICT[obj]["SCRATCH"][prop][i];
                    //console.warn(cmp[ci]);
                    ci = ci + 1;
                }
                if( ci === 2 ){
                    //console.warn("find "+cmp);
                    //find_type_in_obj(cmp[0], cmp[1]);
                    var scope = DICT[obj];
                    type_check_object(cmp[0], cmp[1], scope);
                }
                */

                if (cmp[0] === undefined){
                    cmp[0] = DICT[obj]["SCRATCH"][prop][i];
                    continue;
                }

                cmp[1] = DICT[obj]["SCRATCH"][prop][i];
                var scope = DICT[obj];
                type_check_object(cmp[0], cmp[1], scope);
            }
        }
    }
}

function resolve_var(x, FUNC){
    //console.warn("Resolving variable "+x);
    //console.warn('Found value:' + FUNC.VARNAMES[x]);
    return FUNC.VARNAMES[x];
}

function update_identifier_upper_scope(key, rhs, FUNC)
{
    var ident = key.split('.')[1]; //strip "this."

    if(DICT[FUNC.UPPER]["SCRATCH"] === undefined){ DICT[FUNC.UPPER]["SCRATCH"] = {} }
    if(DICT[FUNC.UPPER]["SCRATCH"][ident] === undefined){ DICT[FUNC.UPPER]["SCRATCH"][ident] = [] }
    //DICT[FUNC.UPPER]["SCRATCH"][ident].push(FUNC.VARNAMES[prop]);

    for (var i in rhs){
        if(rhs[i].indexOf("this.") === 0){
            //console.warn("this.");
            DICT[FUNC.UPPER]["SCRATCH"][ident].push(rhs[i]);
        } else{
            //console.warn("resolve");
            var multiple = resolve_var(rhs[i], FUNC);
            if( typeof(multiple) === "string"){
                DICT[FUNC.UPPER]["SCRATCH"][ident].push(multiple);
            } else{
                for (var j in multiple){
                    DICT[FUNC.UPPER]["SCRATCH"][ident].push(multiple[j]);
                }
            }
        }
    }

    console.warn("DICT FUNC UPPER / SCRATCH  :" + JSON.stringify(DICT[FUNC.UPPER]["SCRATCH"]));

}

function propagate_vars(FUNC, DICT)
{
    for (var key in FUNC.VARNAMES){

        if(FUNC.VARNAMES.hasOwnProperty(key)){
            if(key.indexOf("this.") === 0){
                // Lookup in UPPER scope
                var rhs = FUNC.VARNAMES[key]
                update_identifier_upper_scope(key, rhs, FUNC);
            }
        }
    }
    //console.warn("DICT FUNC UPPER / SCRATCH :" + JSON.stringify(DICT[FUNC.UPPER]["SCRATCH"]));
}


function type_check_func(func, GLOBALDICT)
{
    /*
    { nOpts: [ 'opts', 'this.normalizeHoldPulseConfig' ],
      'this.holdPulseConfig': [ 'nOpts' ] }
    */

    var DICT = GLOBALDICT;
    //console.warn(DICT[func].VARNAMES);
    var FUNC = DICT[func];

    if(FUNC){
        propagate_vars(FUNC, DICT);
    }

}

function typechecker(SCOPES){

    console.warn("\nTYPE CHECKING ...\n");

    for(var i in SCOPES){
        if(i === "0"){
            console.warn("SKIP SCOPE[0]");
            continue;
        }
        var FUNC = "FUNC_"+SCOPES[i].block.body.range[0]+"_"+SCOPES[i].block.body.range[1]
        console.warn("\nProcessing "+ FUNC);
        type_check_func(FUNC, global.DICT);

    }

    for(var key in global.DICT){
        if(key.indexOf("OBJ_") === 0){
            console.warn("\nProcessing "+key);
            type_check_scratch(key, global.DICT);
        }
    }

}


exports.typechecker = typechecker;
