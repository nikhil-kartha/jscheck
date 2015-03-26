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
                    value = elem.init.alternate.callee.property.name;
                    locals[key].push(value);
                }
            }
            
            if(elem.init && elem.init.type === "CallExpression"){
                if( elem.init.callee.type === "MemberExpression" && 
                    elem.init.callee.object.type === "Identifier" && 
                    elem.init.callee.object.name === "enyo" &&
                    elem.init.callee.property.name === "clone"
                  ){
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
    
    return [list0, list1]
}


var process_lib_mixin = function(obj){
    // returns:[arg1, arg2]

    //mixin wont be a part of an assignment expression.
    var args=[];

    for (var i=0; i < obj.arguments.length; i +=1){
        var x = obj.arguments[i];

        if(x.type === "MemberExpression" && x.object.type === "ThisExpression"){
            args.push(x.property.name);
        }
        
        if(x.type === "Identifier"){
            args.push(x.name);
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

    if(obj.arguments[0].type === "MemberExpression" && obj.arguments[0].object.type === "ThisExpression"){
        
        if(obj.arguments[0].property.type === "Identifier"){
            varname = obj.arguments[0].property.name;
            return varname;
        }
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
    
    //console.log("CallExpression: "+JSON.stringify(node));
    if (node.right && 
        node.right.callee.type === "MemberExpression" && 
        node.right.callee.object.name === "enyo" && 
        node.right.callee.property.name === "clone"){
        console.log("\nProcessing Clone  CallExpression: "+ JSON.stringify(node));
        
        var tright = process_lib_clone(node.right);
        var tleft = process_lhs(node.left);
        
        DICT.ASSIGN.push([tleft, tright]);

     }
    else if (node.expression && 
        node.expression.callee.type === "MemberExpression" && 
        node.expression.callee.object.name === "enyo" && 
        node.expression.callee.property.name === "mixin"){
        
        console.log("\nProcessing Mixin  CallExpression: "+ JSON.stringify(node));
        // mixin wont be a part of an assignment expression.
        var comp = process_lib_mixin(node.expression);
        var refs = resolve_refs(comp, DICT.VARNAMES);
        DICT.COMPARE = refs;
    }
    else if (node.callee &&
        node.callee.type === "FunctionExpression"
    //else if (node &&
    //    node.type === "FunctionExpression"
       ){
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
        DICT.VARNAMES[left].push(t);
    }

    //eg: nOpts.events = [{hold: nOpts.delay}];
    else if(node.right.type === "ArrayExpression"){
        var t = [];
        ArrayExpression(node.right.elements, "ARRAY", t);
        //DICT.VARNAMES[node.left.object.name].push(t);
        DICT.VARNAMES[left].push(t);
    }

    else if(node.right.type === "ObjectExpression"){
        var t = [];
        ObjectExpression(node.right.properties, "OBJECT", t);
        //if(DICT.VARNAMES[node.left.object.name] === undefined){ DICT.VARNAMES[node.left.object.name]=[];} 
        //DICT.VARNAMES[node.left.object.name].push(t);
        DICT.VARNAMES[left].push(t);
    }

    //eg: this.holdPulseConfig = enyo.clone(this.holdPulseDefaultConfig, true);
    else if( node.right.type === "CallExpression"){
        //CallExpression(node.right, DICT);
        CallExpression(node, DICT);
    }

    else if( node.right.type === "FunctionExpression"){
        
        //var tleft = process_lhs(node.left);
        var tright = FunctionExpression(node, global.DICT);
        
        //DICT.ASSIGN.push([tleft, tright]);
        DICT.ASSIGN.push([left, tright]);
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
        console.log("HERE: "+node.expression);
        //To handle enyo.mixin
        CallExpression(node.expression, DICT);
        //CallExpression(node, DICT);
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
    for (var i in properties){
        var object = properties[i];

        if (object.key && object.key.type==="Identifier"){
            type= type + "." + object.key.name
        }

        if (object.value && object.value.type==="Literal"){
            // this is the leaf, we got a full type
            type = type + "." + "Literal";
            type_set.push(type);
            //type = default_type; // reset type
        } 
        else if (object.value && object.value.type==="ObjectExpression"){
            type = type + "." + "OBJECT";
            ObjectExpression(object.value.properties, type, type_set);
        } 
        else if (object.value && object.value.type==="ArrayExpression"){
            type = type + "." + "ARRAY";
            ArrayExpression(object.value.elements, type, type_set);
        }
        else if (object.value && object.value.type==="FunctionExpression"){
            var return_type = FunctionExpression(object.value, global.DICT);
            for(j in return_type){
                type_set.push(type + "." + return_type[j]);
            }
        }
        else if (object.value && object.value.type==="MemberExpression"){
            var literal = MemberExpression(object.value);
            console.log("Replaced MemberExpression " + literal + " with the string/type Literal")
            type = type + "." + "Literal";
            type_set.push(type);
        }
        else {
            console.log("\nSKIPPED UNKNOWN ObjectExpression: "+ JSON.stringify(object));
        }
        type = default_type; //reset type
    }
}

var ArrayExpression = function (elements, type, type_set){
    // elements: ArrayExpression.elements array
    // type: Initial type string, pass in "ARRAY"
    // type_set: Array updated with type info
    
    // Process the elements array
    
    var default_type = type;
    for (var i in elements){
        var object = elements[i];

        if (object.type==="Literal"){
            // this is the leaf, we got a full type
            type = type + "." + "Literal";
            type_set.push(type);
            //type = default_type; //reset type
        } 
        else if (object.type==="ObjectExpression"){
            type = type + "." + "OBJECT";
            ObjectExpression(object.properties, type, type_set);
        } 
        else if (object.type==="ArrayExpression"){
            type = type + "." + "ARRAY";
            ArrayExpression(object.elements, type, type_set);
        }
        type = default_type; //reset type
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


var FunctionExpression= function(node, GLOBALDICT){

    var DICT={};
    DICT.ASSIGN = [];
    DICT.VARNAMES = {};
    DICT.COMPARE = [];
    DICT.RETURN_TYPE = [];
    DICT.FUNCS = {};

    var varnames={};
    //console.log("FunctionExpression: "+JSON.stringify(node));
    for(var i = 0; i < node.body.body.length; i += 1){
        //console.log("FunctionExpression: "+JSON.stringify(node.body.body[i]));
        //context.report(node,"type:"+x);
        var x = node.body.body[i];


        if (x.type === "VariableDeclaration"){
            update_varnames(x, DICT);
        }
        else if (x.type === "ExpressionStatement"){
            ExpressionStatement(x, DICT);
        }
        else if(x.type === "ReturnStatement"){
            if (x.argument && x.argument.type === "Identifier"){
                var return_type = DICT.VARNAMES[x.argument.name];
                DICT.RETURN_TYPE = return_type;
            }
        }
        else{
            console.log("\nSKIPPED UNKNOWN FunctionExpression TYPE: "+ JSON.stringify(x)+"\n");
        }
        
        //if(x.type === "FunctionExpression"){
        //    FunctionExpression(x);
        //}
    }

    GLOBALDICT["RANGE_"+node.body.range[0]+"_"+node.body.range[1]] = DICT;

    //return DICT;
    return DICT.RETURN_TYPE;
}

exports.ExpressionStatement = ExpressionStatement;
