var VariableDeclarator = function (node){
    // return:
    // locals = {
    //    var1:[value1, value2,...], 
    //    var2:[value1, value2,...],
    //    ...};
    var locals = {};
    var key;
    var value;
    var elem;

    for (var i = 0; i < node.declarations.length; i += 1){
        elem = node.declarations[i];
        if(elem.type === "VariableDeclarator"){
            key = elem.id.name;
            locals[key] = locals[key] || [];

            if(elem.init && elem.init.type === "ConditionalExpression"){
                
                if(elem.init.consequent.type === "Identifier"){
                    value = elem.init.consequent.name;
                    locals[key].push(value);
                }
                if(elem.init.consequent.type === "CallExpression"){
                    value = elem.init.consequent.callee.name;
                    locals[key].push(value);
                }
                if(elem.init.alternate.type === "Identifier"){
                    value = elem.init.alternate.name;
                    locals[key].push(value);
                }
                if( elem.init.alternate.type === "CallExpression" && 
                    elem.init.alternate.callee.type === "MemberExpression" && 
                    elem.init.alternate.callee.object.type ==="ThisExpression"
                    ){
                    //value = elem.init.alternate.callee.property.name;
                    value = MemberExpression(elem.init.alternate.callee);
                    locals[key].push(value);
                }
            }
            
            if(elem.init && elem.init.type === "CallExpression"){
                if( elem.init.callee.type === "MemberExpression" && 
                    elem.init.callee.object.type === "Identifier" && 
                    elem.init.callee.object.name === "enyo" &&
                    elem.init.callee.property.name === "clone"
                  ){
                    console.log("\nSKIP clone in Variabledeclarator");
                    return;
                    value = elem.init.arguments[0].name;
                    locals[key].push(value);
                }
            }

        }
        
    }

    return locals;
}

var update_varnames = function(node, DICT){
    var h = VariableDeclarator(node);
    var varnames={};
    for(var key in h){
        varnames[key] = varnames[key] ||[];
        for(var ele in h[key]){
            varnames[key].push(h[key][ele]);
        }
    }
    
    DICT.VARNAMES = varnames;

}

var resolve_refs = function(comp, varnames){
    // returns:
    // [ [vara1, varb1], 
    //   [vara1, varb2],
    //   ...
    // ]

    var list0=[], list1=[];
/*
    if(comp.length === 2){
        
        // lookup comp[0] in varnames
        var key = comp[0];
        if(key in varnames){
            for(x in varnames[key]){
                list0.push(varnames[key][x]);
            }
        }else{
            list0.push(key);
        }

        //lookup comp[1] in varnames
        var key = comp[1];
        if(key in varnames){
            for(x in varnames[key]){
                list1.push(varnames[key][x]);
            }
        }else{
            //context.report(node, "COMP2:"+JSON.stringify(key));
            list1.push(key);
        }
        
    }
   console.log("list0:"+list0); 
   console.log("list1:"+list1); 
    return [list0, list1]
*/
    var key = comp;
    if(key in varnames){
        for(x in varnames[key]){
            list0.push(varnames[key][x]);
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
        console.log("UNKNOWN LHS in AssignmentExpression: "+ node);
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
    //console.log("\nMemberExpression NOT IMPLEMENTED, not processed node: "+ JSON.stringify(node));

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

    str = str + "."+ node.property.name;
    
    return str;
}

var CallExpression = function(node,DICT){
    // node: AssignmentExpression. Note: param node is "not" CallExpression since clone shows up as a part of AssignmentExpression and we want to get hold of its lhs, but mixin is not.
    
    //console.log("CallExpression: "+JSON.stringify(node));
    if (node.right && 
        node.right.callee.type === "MemberExpression" && 
        node.right.callee.object.name === "enyo" && 
        node.right.callee.property.name === "clone"){

        //console.log("SKIP clone in CallExpression");
        //return;
        
        var tright = process_lib_clone(node.right);
        var tleft = process_lhs(node.left);

        if(tleft.indexOf("this") === 0){
            if(global.DICT[global.current_object][tleft] === undefined) {global.DICT[global.current_object][tleft]=[] };
            global.DICT[global.current_object][tleft].push(tright);
        }
        
        //DICT.ASSIGN.push([tleft, tright]);
        if(DICT.VARNAMES[tleft] === undefined){ DICT.VARNAMES[tleft]=[];}
        DICT.VARNAMES[tleft].push(tright);

     }
    else if(node.callee && 
        node.callee.type === "MemberExpression" && 
        node.callee.object.name === "enyo" && 
        node.callee.property.name === "mixin"){

        // mixin wont be a part of an assignment expression.
        var comp = process_lib_mixin(node);
        var refs = resolve_refs(comp[1], DICT.VARNAMES);
        console.log("comp: "+ comp);
        console.log("Resolved Refs: "+refs);
        //DICT.COMPARE = refs;
        if(DICT.VARNAMES[comp[0]] === undefined){ DICT.VARNAMES[comp[0]]=[];}
        DICT.VARNAMES[comp[0]].push(comp[1]);

        if(global.DICT[global.current_object][comp[0]] === undefined) {global.DICT[global.current_object][comp[0]]=[] };
        for(var i in refs){
            console.log("elem Resolved Refs: "+refs[i]);
            global.DICT[global.current_object][comp[0]].push(refs[i]);
        }
    }
    else if (node.callee &&
        node.callee.type === "FunctionExpression"){

        FunctionExpression(node.callee, global.DICT);
    }
    else {
        console.log("\nSKIPPED UNKNOWN  CallExpression: "+ JSON.stringify(node));
    }


}

var AssignmentExpression = function(node, DICT){

    //console.log("\n Processing AssignMentExpression: "+ JSON.stringify(node))

    var left = process_lhs(node.left);
    if(DICT.VARNAMES[left] === undefined){ DICT.VARNAMES[left]=[];}// NOTE: This should proabably update ASSIGN and not VARNAMES ? 

    //eg: nOpts.frequency = nOpts.delay;
    if (node.right.type === "Identifier"){
        DICT.VARNAMES[left].push(node.right.name);
    }
    else if (node.right.type === "MemberExpression"){
        var t = MemberExpression(node.right);
        //DICT.VARNAMES[node.left.object.name].push(t);
        if(left.indexOf("this") === 0){ 
            if(global.DICT[global.current_object][left] === undefined) {global.DICT[global.current_object][left]=[] };
            global.DICT[global.current_object][left].push(t);
        }
        DICT.VARNAMES[left].push(t);
    }

    //eg: nOpts.events = [{hold: nOpts.delay}];
    else if(node.right.type === "ArrayExpression"){
        var t = [];
        ArrayExpression(node.right.elements, "ARRAY", t);
        DICT.VARNAMES[left].push(t);
    }

    else if(node.right.type === "ObjectExpression"){
        var t = [];
        //var obj_range;
        var temp = global.current_object;
        global["current_object"] = "OBJ_" + node.right.range[0] + "_" + node.right.range[1];
        if (global.DICT[global.current_object] === undefined){ global.DICT[global.current_object] ={} };
        ObjectExpression(node.right.properties, "OBJECT", t);
        DICT.VARNAMES[left].push(t);
        global.current_object = temp;
    }

    //eg: this.holdPulseConfig = enyo.clone(this.holdPulseDefaultConfig, true);
    else if( node.right.type === "CallExpression"){
        // To handle clone, which should always show up as part of an AssignmentExpression
        CallExpression(node, DICT);
    }

    else if( node.right.type === "FunctionExpression"){
        
        //var tleft = process_lhs(node.left);
        var tright = FunctionExpression(node, global.DICT);
        
        DICT.VARNAMES[left].push([left, tright]);
    }

    else{
        console.log("\nSKIPPED UNKNOWN AssignMentExpression: "+ JSON.stringify(node))
    }

}

var ExpressionStatement = function(node, DICT){

    //console.log("In ExpressionStatement: "+ JSON.stringify(node));

    if(node.expression.type === "AssignmentExpression" && node.expression.operator === "="){
        AssignmentExpression(node.expression, DICT);
    }

    else if(node.expression.type === "CallExpression"){
        //To handle enyo.mixin and anonymous function calls
        CallExpression(node.expression, DICT);
    }

    else{
        console.log("SKIPPED UNKNOWN  ExpressionStatement: "+ node.expression.type);
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
                var temp = global.current_object;
                var current_object = "OBJ_" + object.value.range[0] + "_" + object.value.range[1];
                
                // Assign reference to the current object in the previous object scope
                global.DICT[temp][name] = current_object;
                global["current_object"] = current_object;   //"OBJ_" + object.value.range[0] + "_" + object.value.range[1];
                if (global.DICT[global.current_object] === undefined){ global.DICT[global.current_object] = {} };
                ObjectExpression(object.value.properties, type, type_set);
                global.current_object = temp;
            } 
            else if (object.value && object.value.type==="ArrayExpression"){
                type = type + "." + "ARRAY";

                var temp = global.current_object;
                var current_object = "OBJ_" + object.value.range[0] + "_" + object.value.range[1];
                // Assign reference to the current object in the previous object scope
                global.DICT[temp][name] = current_object;
                global["current_object"] = current_object;   //"OBJ_" + object.value.range[0] + "_" + object.value.range[1];
                if (global.DICT[global.current_object] === undefined){ global.DICT[global.current_object] = {} };

                ArrayExpression(object.value.elements, type, type_set);
                
                global.current_object = temp;
            }
            else if (object.value && object.value.type==="FunctionExpression"){
                var return_type = FunctionExpression(object.value, global.DICT);
                for(j in return_type){
                    type_set.push(type + "." + return_type[j]);
                }

                global.DICT[global.current_object][name] = return_type; //update object scope, for this.xxx
            }
            else if (object.value && object.value.type==="MemberExpression"){
                var literal = MemberExpression(object.value);
                console.log("Replaced MemberExpression " + literal + " with the string/type Literal")
                type = type + "." + "Literal";
                type_set.push(type);

                global.DICT[global.current_object][name] = type; //update object scope, for this.xxx
            }
            else {
                console.log("\nSKIPPED UNKNOWN ObjectExpression: "+ JSON.stringify(object));
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

                var temp = global.current_object;
                var current_object = "OBJ_" + object.range[0] + "_" + object.range[1];
                // Assign reference to the current object in the previous object scope
                global.DICT[temp][name] = current_object;
                global["current_object"] = current_object;
                if (global.DICT[global.current_object] === undefined){ global.DICT[global.current_object] = {} };

                ObjectExpression(object.properties, type, type_set);

                global.current_object = temp;
            } 
            else if (object.type==="ArrayExpression"){
                type = type + "." + "ARRAY";

                var temp = global.current_object;
                var current_object = "OBJ_" + object.value.range[0] + "_" + object.value.range[1];
                // Assign reference to the current object in the previous object scope
                global.DICT[temp][name] = current_object;
                global["current_object"] = current_object;
                if (global.DICT[global.current_object] === undefined){ global.DICT[global.current_object] = {} };

                ArrayExpression(object.elements, type, type_set);

                global.current_object = temp;
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
        console.log("Types not found: "+msg);
        console.log("In Object: "+arr2);
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
                    console.log("Failed to find a match for variable in ReturnStatement");
                }
            }
        }
    }
    else{
        console.log("SKIPPED UNKNOWN ReturnStatement: "+ JSON.stringify(node));
    }

}

var FunctionExpression= function(node, GLOBALDICT){

    var DICT={};
    DICT.VARNAMES = {};
    DICT.SCRATCH = {};
    DICT.UPPER="UNDEFINED";
    DICT.RETURN_TYPE = [];

    var temp_function = global.current_function;
    
    // Set scope/range
    global.current_function = "FUNC_"+node.body.range[0]+"_"+node.body.range[1];
    GLOBALDICT[global.current_function]={};

    // Change the scope of an object to the current function.
    var temp_object = global.current_object;
    DICT.UPPER = temp_object;
    var current_object = temp_function;
    global["current_object"] = current_object;


    var varnames={};
    //console.log("FunctionExpression: "+JSON.stringify(node));
    for(var i = 0; i < node.body.body.length; i += 1){
        //console.log("FunctionExpression: "+JSON.stringify(node.body.body[i]));
        var x = node.body.body[i];


        if (x.type === "VariableDeclaration"){
            update_varnames(x, DICT);
        }
        else if (x.type === "ExpressionStatement"){
            ExpressionStatement(x, DICT);
        }
        else if(x.type === "ReturnStatement"){
            ReturnStatement(x, DICT);
        }
        else{
            console.log("\nSKIPPED UNKNOWN NODE In FunctionExpression TYPE: "+ JSON.stringify(x)+"\n");
        }
        
        //if(x.type === "FunctionExpression"){
        //    FunctionExpression(x);
        //}
    }

    GLOBALDICT["FUNC_"+node.body.range[0]+"_"+node.body.range[1]] = DICT;

    // Reset scope/range
    global.current_function = temp_function;
    global.current_object = temp_object;

    //return DICT;
    return DICT.RETURN_TYPE;
}

exports.ExpressionStatement = ExpressionStatement;
