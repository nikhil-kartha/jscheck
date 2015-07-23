var VariableDeclarator = function (node){

    var key;
    var value;

    var elem = node;

    key = elem.id.name;

    if(elem.init && elem.init.type === "ConditionalExpression"){
        
        if(elem.init.consequent.type === "Identifier"){
            value = elem.init.consequent.name;
        }
        if(elem.init.consequent.type === "CallExpression"){
            value = elem.init.consequent.callee.name;
        }
        if(elem.init.alternate.type === "Identifier"){
            value = elem.init.alternate.name;
        }
        if( elem.init.alternate.type === "CallExpression" && 
            elem.init.alternate.callee.type === "MemberExpression" && 
            elem.init.alternate.callee.object.type ==="ThisExpression"
            ){
            //value = elem.init.alternate.callee.property.name;
            value = MemberExpression(elem.init.alternate.callee);
        }
    }
    
    if(elem.init && elem.init.type === "CallExpression"){
        if( elem.init.callee.type === "MemberExpression" && 
            elem.init.callee.object.type === "Identifier" && 
            elem.init.callee.object.name === "enyo" &&
            elem.init.callee.property.name === "clone"
          ){
            console.warn("\nSKIP clone in Variabledeclarator");
            value = elem.init.arguments[0].name;
            return null;
        }
    }

    return { 'name':key,  'value' : value} 
}

var VariableDeclaration = function(node, DICT){
    // Updates:
    // DICT.VARNAMES = {
    //    var1:[value1, value2,...], 
    //    var2:[value1, value2,...],
    //    ...};

    var elem;
    var varnames={};

    for (var i = 0; i < node.declarations.length; i += 1){
        elem = node.declarations[i];
        if(elem.type === "VariableDeclarator"){
            var h = VariableDeclarator(elem);
            if(h){
                varnames[h.name] = varnames[h.name] ||[];
                varnames[h.name].push(h.value);
            }
        }
    }

    DICT.VARNAMES = varnames;
}

var resolve_refs = function(identifier, mapping){
    // returns:
    // [vara1, varb1] 

    var list0=[];

    var key = identifier;
    if(key in mapping){
        for(x in mapping[key]){
            list0.push(mapping[key][x]);
        }
    }else{
        list0.push(key);
    }

    return list0;
    
}


var process_lib_mixin = function(obj){
    // returns:[arg1, arg2]

    //mixin wont be a part of an assignment expression.
    var args=[];

    for (var i=0; i < obj.arguments.length; i +=1){
        var x = obj.arguments[i];
        
        if(x.type === "Identifier"){
            args.push(x.name);
        }

        if(x.type === "MemberExpression"){
            args.push(MemberExpression(x));
        }
        
    }

    return args;
}

var process_lhs = function(node){
    /*
    var varname;

    if ( obj.type === "MemberExpression" && obj.object.type === "ThisExpression" ){
        varname = obj.property.name;
        return varname;
    }
    */

    if (node.type === "Identifier"){
        return node.name;
    }
    else if(node.type === "MemberExpression"){
        return MemberExpression(node);
    }
    else{
        console.warn("UNKNOWN LHS in AssignmentExpression: "+ node);
    }
}

var process_lib_clone = function(obj){

    var varname;

    if(obj.arguments[0].type === "Identifier"){
        varname = obj.arguments[0].name;
        return varname;
    }

    if(obj.arguments[0].type === "MemberExpression"){
        return MemberExpression(obj.arguments[0]);
    }

}


var MemberExpression = function(node){

    var str="";

    if(node.object.type === "Identifier"){
        str = node.object.name;
    }
    else if(node.object.type === "ThisExpression"){
        str = "this";
    }
    else if(node.object.type === "MemberExpression"){
        str = MemberExpression(node.object);
    }
    else if(node.object.type === "CallExpression"){
        console.warn("NOT IMPLEMENTED MemberExpression type: "+ JSON.stringify(node.object.type));
        str = node.object.callee.name;
    }
    else {
        console.warn("Unknown MemberExpression type: "+ JSON.stringify(node.object.type));
    }

    str = str + "."+ node.property.name;
    
    return str;
}

var CallExpression = function(node,DICT){
    // node: AssignmentExpression. Note: param node is "not" CallExpression since clone shows up as a part of AssignmentExpression and we want to get hold of its lhs, but mixin is not.
    
    if(node.callee && 
        node.callee.type === "MemberExpression" && 
        node.callee.object.name === "enyo" && 
        node.callee.property.name === "mixin"){

        // mixin wont be a part of an assignment expression.
        var comp = process_lib_mixin(node);
        var refs = resolve_refs(comp[1], DICT.VARNAMES);

        console.warn("comp: "+ comp);
        console.warn("Resolved Refs: "+refs);
        
        //DICT.COMPARE = refs;
        if(DICT.VARNAMES[comp[0]] === undefined){ DICT.VARNAMES[comp[0]]=[];}
        DICT.VARNAMES[comp[0]].push(comp[1]);

        if(global.DICT[global.current_object][comp[0]] === undefined) {global.DICT[global.current_object][comp[0]]=[] };
        for(var i in refs){
            console.warn("elem Resolved Refs: "+refs[i]);
            global.DICT[global.current_object][comp[0]].push(refs[i]);
        }
    }
    else if (node.callee &&
            node.callee.type === "FunctionExpression"){

            var temp = FunctionExpression(node.callee, global.DICT);
    }
    else if(node.callee && 
            node.callee.type === "MemberExpression"){

            console.warn("UNKNOWN callee. Process the argument for function: " + MemberExpression(node.callee));
            console.warn("process argument: " + JSON.stringify(node.arguments));

            for(var i in node.arguments){
                //console.log(node.arguments[i]);
                console.log("=============");
                if(node.arguments[i].type === "MemberExpression"){
                    console.log("MemberExpression:"+ MemberExpression(node.arguments[i]));
                    var temp = MemberExpression(node.arguments[i]);
                    DICT.VERIFY.push(temp);
                }
            }

    }
    else {
        console.warn("\nSKIPPED UNKNOWN  CallExpression: "+ JSON.stringify(node));
    }


}

var AssignmentExpression = function(node, DICT){

    //console.warn("\n Processing AssignMentExpression: "+ JSON.stringify(node))

    var left = process_lhs(node.left);
    var right = null;

    if(DICT.VARNAMES[left] === undefined){ DICT.VARNAMES[left]=[];}// NOTE: This should proabably update ASSIGN and not VARNAMES ? 

    //eg: nOpts.frequency = nOpts.delay;
    if (node.right.type === "Identifier"){
        right = node.right.name;
    }

    else if (node.right.type === "MemberExpression"){
        right = MemberExpression(node.right);
    }

    //eg: nOpts.events = [{hold: nOpts.delay}];
    else if(node.right.type === "ArrayExpression"){
        var t = [];
        ArrayExpression(node.right.elements, "ARRAY", t);
        right = t;
    }

    else if (node.right && node.right.callee && 
        node.right.callee.type === "MemberExpression" && 
        node.right.callee.object.name === "enyo" && 
        node.right.callee.property.name === "clone"){

        // eg: this.holdPulseConfig = enyo.clone(this.holdPulseDefaultConfig, true);
        right = process_lib_clone(node.right);
     }

    else if(node.right.type === "ObjectExpression"){
        var t = [];
        var temp = SET_SCOPE(node)
        ObjectExpression(node.right.properties, "OBJECT", t);
        right = t;
        RESET_SCOPE(temp);
    }

    else if( node.right.type === "FunctionExpression"){
        
        var tright = FunctionExpression(node, global.DICT);
        right = [left, tright.RETURN_TYPE];
    }

    else{
        console.warn("\nSKIPPED UNKNOWN AssignmentExpression: "+ JSON.stringify(node));
        return null;
    }

    DICT.VARNAMES[left].push(right);

    UPDATE_GLOBAL(left, right);

}

var SET_OBJECT_ELEMENT_SCOPE = function(name, object){

    var temp = global.current_object;
    var current_object = "OBJ_" + object.range[0] + "_" + object.range[1];

    // Assign reference to the current object in the previous object scope
    global.DICT[temp][name] = current_object;
    global["current_object"] = current_object;   //"OBJ_" + object.value.range[0] + "_" + object.value.range[1];
    if (global.DICT[global.current_object] === undefined){ global.DICT[global.current_object] = {} };
   
    return temp;

}

var SET_OBJECT_SCOPE = function(name, object){

    var temp = global.current_object;

    var current_object = "OBJ_" + object.value.range[0] + "_" + object.value.range[1];

    // Assign reference to the current object in the previous object scope
    global.DICT[temp][name] = current_object;
    global["current_object"] = current_object;   //"OBJ_" + object.value.range[0] + "_" + object.value.range[1];
    if (global.DICT[global.current_object] === undefined){ global.DICT[global.current_object] = {} };
    
    return temp;
}

var SET_SCOPE = function(node){
    
    var temp = global.current_object;

    global["current_object"] = "OBJ_" + node.right.range[0] + "_" + node.right.range[1];
    if (global.DICT[global.current_object] === undefined){ global.DICT[global.current_object] ={} };
    
    return temp;
}

var RESET_SCOPE = function(temp){

    global.current_object = temp;

}

var UPDATE_GLOBAL = function(left, right){

    if(left.indexOf("this") === 0){ 
        // HACK update global, since lhs starts with "this." FIXME
        if(global.DICT[global.current_object][left] === undefined) {global.DICT[global.current_object][left]=[] };
        global.DICT[global.current_object][left].push(right);
    }

}


var ExpressionStatement = function(node, DICT){

    //console.warn("In ExpressionStatement: "+ JSON.stringify(node));

    if(node.expression.type === "AssignmentExpression" && node.expression.operator === "="){
        AssignmentExpression(node.expression, DICT);
    }

    else if(node.expression.type === "CallExpression"){
        //To handle enyo.mixin and anonymous function calls
        CallExpression(node.expression, DICT);
    }

    else{
        console.warn("SKIPPED UNKNOWN  ExpressionStatement: "+ node.expression.type);
    }
}

var ObjectExpression = function (properties, type, type_set){
    // properties: ObjectExpression.properties array
    // type: Initial type string, pass in "OBJECT"
    // type: Array updated with type info

    // Process the properties array

    var default_type = type;

    if(properties.length === 0){
        type_set.push(type);
    } else {
        for (var i in properties){
            var object = properties[i];

            if (object.key && object.key.type==="Identifier"){
                type= type + "." + object.key.name;
                var name = object.key.name;
            }

            if (object.value && object.value.type==="Literal"){
                // this is the leaf, we got a full type
                type = type + "." + "Literal";
                type_set.push(type);

                global.DICT[global.current_object][name] = "Literal"; //update object scope, for this.xxx
            } 
            else if (object.value && object.value.type==="ObjectExpression"){
                type = type + "." + "OBJECT";
                var temp = SET_OBJECT_SCOPE(name, object);
                ObjectExpression(object.value.properties, type, type_set);
                RESET_SCOPE(temp);
            } 
            else if (object.value && object.value.type==="ArrayExpression"){
                type = type + "." + "ARRAY";
                var temp = SET_OBJECT_SCOPE(name, object);
                ArrayExpression(object.value.elements, type, type_set);
                RESET_SCOPE(temp);
            }
            else if (object.value && object.value.type==="FunctionExpression"){
                var _return = FunctionExpression(object.value, global.DICT);
                var return_type = _return.RETURN_TYPE;
                for(j in return_type){
                    type_set.push(type + "." + return_type[j]);
                }

                global.DICT[global.current_object][name] = return_type; //update object scope, for this.xxx
            }
            else if (object.value && object.value.type==="MemberExpression"){
                var literal = MemberExpression(object.value);
                console.warn("Replaced MemberExpression " + literal + " with the string/type Literal");
                type = type + "." + "Literal";
                type_set.push(type);
                
                /*
                //console.log("++++++ReturnStatement ObjectExpression current_object "+ global.current_object);
                if (global.DICT[global.current_object]){
                    global.DICT[global.current_object][name] = type; //update object scope, for this.xxx
                } else{
                    console.warn('SCOPE %s UNDEFINED', global.current_object);
                    global.DICT["ANONYMOUS"]= []; //update object scope, for this.xxx
                    global.DICT["ANONYMOUS"].push(type); //update object scope, for this.xxx
                }
                */
            }
            else {
                console.warn("\nSKIPPED UNKNOWN ObjectExpression: "+ JSON.stringify(object));
            }
            type = default_type; //reset type
        }
    }
}

var ArrayExpression = function (elements, type, type_set){
    // elements: ArrayExpression.elements array
    // type: Initial type string, pass in "ARRAY"
    // type_set: Array updated with type info
    
    // Process the elements array
    
    var default_type = type;

    if(elements.length === 0){
        type_set.push(type);
    } else {

        for (var i in elements){
            var object = elements[i];

            var name = "ARRAY";

            if (object.type==="Literal"){
                // this is the leaf, we got a full type
                type = type + "." + "Literal";
                type_set.push(type);
            } 
            else if (object.type==="ObjectExpression"){
                type = type + "." + "OBJECT";
                var temp = SET_OBJECT_ELEMENT_SCOPE(name, object);
                ObjectExpression(object.properties, type, type_set);
                RESET_SCOPE(temp);
            } 
            else if (object.type==="ArrayExpression"){
                type = type + "." + "ARRAY";
                var temp = SET_OBJECT_SCOPE(name, object); 
                ArrayExpression(object.elements, type, type_set);
                RESET_SCOPE(temp);
            }
            type = default_type; //reset type
        }
    }

}

var is_subset = function (arr1, arr2){
    // Does a suffix match 
    // Returns a list of type/strings that dont match
    // Returns an empty string otherwise
    
    var msg="";
    
    for(var i in arr1){
        var str1=arr1[i];
        var found = false;

        /*
        // Do exact matches
        if (arr2.indexOf(str1) === -1){
            msg = msg + str1 + ",";
        }
        */

        // Do suffix matches
        for(var j in arr2){
            var str2=arr2[j];
            if(str2.lastIndexOf(str1) !== -1){
                //msg = msg + str1 + ",";
                found = true;
            }
        }

        if( found === false){
            msg = msg + str1 + ",";
        }
    }
    
    if(msg){
        console.warn("Types not found: "+msg);
        console.warn("In Object: "+arr2);
        return msg;
    }

    return msg;

}

var ReturnStatement= function(node, DICT){

    if (node.argument && node.argument.type === "Identifier"){
        // find exact match eg: "nOpts"
        var return_type = DICT.VARNAMES[node.argument.name];
        if(return_type){
            DICT.RETURN_TYPE.push(return_type);
        } else{
            // match prefix eg: "nOpts."
            for(var key in DICT.VARNAMES){
               
               if(key.indexOf(node.argument.name + '.') === 0){
                    var arr = key.split('.');
                    arr[0] = "OBJECT";
                    key_type = arr.join('.');// nOpts.events ==> OBJECT.events
                    DICT.RETURN_TYPE.push(key_type + '.'+ DICT.VARNAMES[key]);
                }else{
                    console.warn("Failed to find a match for variable in ReturnStatement");
                }
            }
        }
    }
    else if (node.argument && node.argument.type === "ObjectExpression"){
        var t = [];
        //var temp = SET_SCOPE(node)
        //ObjectExpression(node.right.properties, "OBJECT", t);
        //console.log("ReturnStatement ObjectExpression current_object "+ global.current_object); 
        ObjectExpression(node.argument.properties, "OBJECT", t);
        right = t;
        //console.log("RETURN: " + JSON.stringify(right));
        for (var key in right){
            //console.log(right[key]);
            DICT.RETURN_TYPE.push(right[key]);
        }
        //RESET_SCOPE(temp);
    }
    else{
        console.warn("SKIPPED UNKNOWN ReturnStatement: "+ JSON.stringify(node));
    }

}

var SET_FUNCTION_SCOPE = function(node, GLOBALDICT, DICT){

    var temp_function = global.current_function;
    
    // Set scope/range
    global.current_function = "FUNC_"+node.body.range[0]+"_"+node.body.range[1];
    GLOBALDICT[global.current_function]={};

    // Change the scope of an object to the current function.
    var temp_object = global.current_object;
    DICT.UPPER = temp_object;
    var current_object = temp_function;
    global["current_object"] = current_object;

    var prev={};
    prev.func = temp_function;
    prev.object = temp_object;

    return prev;

}

var RESET_FUNCTION_SCOPE = function(prev){

    // Reset scope/range
    global.current_function = prev.func;
    global.current_object = prev.object;

}


var FunctionExpression= function(node, GLOBALDICT){

    var DICT={};
    DICT.VARNAMES = {};
    DICT.SCRATCH = {};
    DICT.UPPER="UNDEFINED";
    DICT.RETURN_TYPE = [];
    DICT.VERIFY = [];

    var prev = SET_FUNCTION_SCOPE(node, GLOBALDICT, DICT);

    //console.warn("FunctionExpression: "+JSON.stringify(node));
    for(var i = 0; i < node.body.body.length; i += 1){
        //console.warn("FunctionExpression: "+JSON.stringify(node.body.body[i]));
        var x = node.body.body[i];


        if (x.type === "VariableDeclaration"){
            VariableDeclaration(x, DICT);
        }
        else if (x.type === "ExpressionStatement"){
            ExpressionStatement(x, DICT);
        }
        else if(x.type === "ReturnStatement"){
            ReturnStatement(x, DICT);
        }
        else{
            console.warn("\nSKIPPED UNKNOWN NODE In FunctionExpression TYPE: "+ JSON.stringify(x)+"\n");
        }
        
        //if(x.type === "FunctionExpression"){
        //    FunctionExpression(x);
        //}
    }

    GLOBALDICT["FUNC_"+node.body.range[0]+"_"+node.body.range[1]] = DICT;
    DICT["IDENTIFIER"] = "FUNC_"+node.body.range[0]+"_"+node.body.range[1];

    RESET_FUNCTION_SCOPE(prev);

    return DICT;
    //return DICT.RETURN_TYPE;
}

var FunctionDeclaration= function(node, GLOBALDICT){

    //console.warn("NOT IMPLEMENTED: "+ node.type);
/*
    var DICT={};
    DICT.VARNAMES = {};
    DICT.SCRATCH = {};
    DICT.UPPER="UNDEFINED";
    DICT.RETURN_TYPE = [];

    var prev = SET_FUNCTION_SCOPE(node, GLOBALDICT, DICT);

    console.warn("NOT IMPLEMENTED: "+ JSON.stringify(node));

    for(var i = 0; i < node.body.body.length; i += 1){

    }
*/
    var func_name = node.id.name;

    var _return = FunctionExpression(node, GLOBALDICT);
    var func_return = _return.RETURN_TYPE;

    console.warn("FunctionDeclaration return value: "+ JSON.stringify(func_return));

    if(GLOBALDICT[global.current_scope][func_name]){
        console.warn("Overwriting existing value for %s in scope %s", func_name, global.current_scope);
    }
    
    GLOBALDICT[global.current_scope][func_name]=_return.IDENTIFIER;
}

exports.ExpressionStatement = ExpressionStatement;
exports.FunctionDeclaration = FunctionDeclaration;
