"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

    var DICT= {};
    //var varnames = {};
    var elem ="";
    var ins={};
    var x;

    function process_variable_declaration(node, x){
        // return:
        // locals = {
        //    var1:[value1, value2,...], 
        //    var2:[value1, value2,...],
        //    ...};
        var locals = {};
        var key;
        var value;
        var elem;

        for (var i = 0; i < x.declarations.length; i += 1){
            elem = x.declarations[i];
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

    function process_mixin(obj){

        // returns:[arg1, arg2]
        var args=[];

        if ( obj.callee.type === "MemberExpression" && obj.callee.object.name === "enyo" && obj.callee.property.name === "mixin"){
            for (var i=0; i < obj.arguments.length; i +=1){
                var x = obj.arguments[i];

                if(x.type === "MemberExpression" && x.object.type === "ThisExpression"){
                    args.push(x.property.name);
                }
                
                if(x.type === "Identifier"){
                    args.push(x.name);
                }
                
            }
        }

        return args;

    }

    function resolve_refs(comp, varnames){
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

    function process_clone(obj){

        var varname;

        if ( obj.callee.type === "MemberExpression" && obj.callee.object.name === "enyo" && obj.callee.property.name === "clone"){

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
    }

    function process_lhs(obj){

        var varname;

        if ( obj.type === "MemberExpression" && obj.object.type === "ThisExpression" ){
            varname = obj.property.name;
            return varname;
        }
    }

    return {

        "Property": function(node){
            function replacer(key, value){
                if (key === "range"){
                    return undefined;
                }
            }
            //context.report(node, "......PROPERTY......: "+node.key.name+" : VALUETYPE: " +node.value.type);
            // We need to be working within scopes, this is just a crude approximation, to get things going.
            if(node.value.type === "ObjectExpression"){
                //context.report(node, "......PROPERTY......: "+node.key.name+" : VALUETYPE: " +node.value.type);
                var key, value;
                key = node.key.name;
                value = JSON.stringify(node.value.properties, ["key", "name", "value", "elements", "properties"]);
                DICT[key]=value;
            }
        },

        "FunctionExpression": function(node){

            context.report(node,"\n\n======FunctionExpression=======");

            var ancestors = context.getAncestors();
            var parent = ancestors.pop();
            //context.report(node,parent.type);
            if(parent.type === "Property" && parent.key && parent.key.type === "Identifier" && parent.key.name){
                context.report(node,"FUNCTION: "+parent.key.name);
                DICT[parent.key.name]={};
                DICT[parent.key.name]["ASSIGN"] = [];
                var update_dict=true;
                //context.report(node, JSON.stringify(DICT));
            }
            var varnames={};
            for(var i = 0; i < node.body.body.length; i += 1){
                //context.report(node,"type:"+x);
                var x = node.body.body[i];
                if (x.type === "VariableDeclaration"){
                    //varnames[x.declarations[0].id.name]=[];
                    var h = process_variable_declaration(node, x);
                    for(var key in h){
                        //context.report(node, "VARS:"+JSON.stringify(h[key]));
                        varnames[key] = varnames[key] ||[];
                        for(var ele in h[key]){
                            varnames[key].push(h[key][ele]);
                        }
                    }
                    //context.report(node, "VARS:"+JSON.stringify(h));
                    context.report(node, "VARNAMES:"+JSON.stringify(varnames));
                    if(update_dict){
                        DICT[parent.key.name]["VARNAMES"] = varnames;
                    }
                }

                if (x.type === "ExpressionStatement" && x.expression.type === "AssignmentExpression" && x.expression.operator === "="){

                    // nOpts.frequency = nOpts.delay;
                    if (x.expression.right.type === "MemberExpression"){
                        //varnames[x.expression.left.object.name] = {
                        //varnames[x.expression.left.object.name]={}
                        //varnames[x.expression.left.object.name][x.expression.left.property.name] = x.expression.right.object.name+"."+x.expression.right.property.name;
                        var key = x.expression.left.property.name;
                        var value = x.expression.right.object.name+"."+x.expression.right.property.name;
                        //var t={};t[key]=value;
                        //var t = key + "." + value;  // frequency.nopts.delay, we want frequency.INT
                        var t = key;  // frequency.nopts.delay, we want frequency.INT
                        varnames[x.expression.left.object.name].push(t);
                    }

                    // nOpts.events = [{hold: nOpts.delay}];
                    if(x.expression.right.type === "ArrayExpression"){
                        // Walk "elements" Array
                        // add check for if defined
                        for(var j=0; j< x.expression.right.elements.length; j += 1){
                            var elem = x.expression.right.elements[j]
                            if (elem.type === "ObjectExpression"){
                                // Walk "properties" Array
                                for(var k=0; k<elem.properties.length; k += 1){
                                    var prop = elem.properties[k];
                                    //varnames[x.expression.left.object.name]={};
                                    //varnames[x.expression.left.object.name][x.expression.left.property.name] = prop.key.name;
                                    var key = x.expression.left.property.name;
                                    var value = prop.key.name;
                                    //var t={};t[key]=value;
                                    var t = key + ".Array." + value;  // Array.hold.nopts.delay, we want Array.name.STRING or Array.hold.STRING
                                    varnames[x.expression.left.object.name].push(t);
                                }
                            }
                        }

                    }

                    // this.holdPulseConfig = enyo.clone(this.holdPulseDefaultConfig, true);
                    if( x.expression.right.type === "CallExpression"){
                        // No need to process_mixin, since mixin wont be a part of an assignment expression.
                        var tright = process_clone(x.expression.right);
                        var tleft = process_lhs(x.expression.left);
                        if(update_dict){
                            DICT[parent.key.name]["ASSIGN"].push([tleft, tright]);
                        }
                    }
                }
                
                if (x.type === "ExpressionStatement" && x.expression.type === "CallExpression"){
                    var comp = process_mixin(x.expression);
                    var refs = resolve_refs(comp, varnames);
                    context.report(node, "COMPARE:"+JSON.stringify(refs));
                    if(update_dict){
                        DICT[parent.key.name]["COMPARE"] = refs;
                    }

                }
                
                if(x.type === "ReturnStatement"){
                    if (x.argument && x.argument.type === "Identifier"){
                        var return_type = varnames[x.argument.name];
                        context.report(node, "RETURN_TYPE:"+JSON.stringify(return_type));
                        if(update_dict){
                            DICT[parent.key.name]["RETURN_TYPE"] = return_type;
                        }
                    }
                }
            }
            //context.report(node, "varnames:"+JSON.stringify(varnames));

            
            if(update_dict){
                //DICT[parent.key.name]["VARNAMES"] = varnames;
                //DICT[parent.key.name]["COMPARE"] = refs;
                //DICT[parent.key.name]["RETURN_TYPE"] = return_type;
                context.report(node, "GLOBAL DICT: "+JSON.stringify(DICT));
                //varnames
            }
        }
    };

};
