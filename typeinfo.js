extract_type_from_objectexp = function (node, properties, type, type_set){
    // properties: ObjectExpression.properties array
    // type: Initial type string, pass in "OBJECT"
    // type: Array updated with type info

    // Process the properties array
    //context.report(node,"\n\n++++++++ EXTRACT TYPE  FROM OBJECTEXP++++++:"+JSON.stringify(properties));

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
            extract_type_from_objectexp(node, object.value.properties, type, type_set);
        } 
        else if (object.value && object.value.type==="ArrayExpression"){
            type = type + "." + "ARRAY";
            extract_type_from_arrayexp(node, object.value.elements, type, type_set);
        }
        type = default_type; //reset type
    }
}

extract_type_from_arrayexp = function (node, elements, type, type_set){
    // elements: ArrayExpression.elements array
    // type: Initial type string, pass in "ARRAY"
    // type_set: Array updated with type info
    
    // Process the elements array
    //context.report(node,"\n\n++++++++ EXTRACT TYPE ++++++ FROM ARRAYEXP:"+JSON.stringify(elements));
    
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
            extract_type_from_objectexp(node, object.properties, type, type_set);
        } 
        else if (object.type==="ArrayExpression"){
            type = type + "." + "ARRAY";
            extract_type_from_arrayexp(node, object.elements, type, type_set);
        }
        type = default_type; //reset type
    }

}

is_subset = function (arr1, arr2){
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

exports.objectexp = extract_type_from_objectexp;
exports.arrayexp = extract_type_from_arrayexp;
exports.is_subset = is_subset;
