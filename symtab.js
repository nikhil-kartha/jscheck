var esprima = require('esprima');
var escope =  require('escope');
var assert = require('assert');
//var typeinfo = require('./typeinfo.js');
var astnode = require('./astnode.js');
var fs = require('fs'),

filename = process.argv[2];
content = fs.readFileSync(filename, 'utf-8');

var AST = esprima.parse(content, { tolerant: true, loc: true, range: true });
var SCOPES = escope.analyze(AST).scopes;
var program_body = SCOPES[0].block.body;

//Symbol Table to be processed by the type checker
global.DICT={};    
global.DICT.VARNAMES = {};
global.DICT.RETURN_TYPE = [];
global.DICT.UPPER="NULL";
global.current_range = "MODULE_"+filename;  // This is for function scope
global.current_object = "MODULE_"+filename;   //"ROOTOBJECT";
for(var i in program_body){
    var body = program_body[i];

    if( body.type === "ExpressionStatement"){ 
        astnode.ExpressionStatement(body, global.DICT);

    }
    else{
        console.log("PROGRAM BODY. SKIPPED UNKNOWN NODE TYPE: "+ body.type);
    }
}

console.log("\nGLOBAL DICT: "+JSON.stringify(global.DICT));

//Type Check

var FUNC1 = "FUNC_1364_1509";
var FUNC2 = "FUNC_1563_1823";

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
                //console.log("DICT FUNC UPPER / SCRATCH  :" + JSON.stringify(DICT[FUNC.UPPER]["SCRATCH"]));
            }
        }
    }
    console.log("DICT FUNC UPPER / SCRATCH :" + JSON.stringify(DICT[FUNC.UPPER]["SCRATCH"]));
}

console.log("\nTYPE CHECKING ...");

function type_check_func(func, GLOBALDICT)
{
    /*
    { nOpts: [ 'opts', 'this.normalizeHoldPulseConfig' ],
      'this.holdPulseConfig': [ 'nOpts' ] }
    */

    var DICT = GLOBALDICT;
    //console.log(DICT[func].VARNAMES);

    propagate_vars(DICT[func], DICT);

}

//console.log("FUNC1");
type_check_func(FUNC1, global.DICT);
//console.log("FUNC2");
type_check_func(FUNC2, global.DICT);

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

type_check_scratch("OBJ_328_1829",global.DICT);
