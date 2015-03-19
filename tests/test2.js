var esprima = require('esprima');
var escope =  require('escope');
var assert = require('assert');
var typeinfo = require('../typeinfo.js');

//****** Test 2 ******

x="x= { "+
    "obj1:{"+
        "obj2:["+
                 '"str2", '+
                 '1, '+
                 '['+
                     '{'+
                         'name: "hold", '+
                         'time: 200'+
                     '}'+
                 ']'+
             ']'+
         '}'+
   '}';

//console.log(x);


var x_type= [
                'OBJECT.obj1.OBJECT.obj2.ARRAY.Literal',
                'OBJECT.obj1.OBJECT.obj2.ARRAY.Literal',
                'OBJECT.obj1.OBJECT.obj2.ARRAY.ARRAY.OBJECT.name.Literal',
                'OBJECT.obj1.OBJECT.obj2.ARRAY.ARRAY.OBJECT.time.Literal',
            ];

var x_type_bad= [
                'OBJECT.obj1.OBJECT.obj2.ARRAY.STR',
                'OBJECT.obj1.OBJECT.obj2.ARRAY.INT',
                'OBJECT.obj1.OBJECT.obj2.ARRAY.ARRAY.OBJECT.name.STR',
                'OBJECT.obj1.OBJECT.obj2.ARRAY.ARRAY.OBJECT.time.INT',
            ];


var x_ast= esprima.parse(x, {range: false, loc: false});
var x_scopes = escope.analyze(x_ast).scopes;

objexp= x_scopes[0].block.body[0].expression.right;

//console.log(x_scopes[0].block.body[0].expression.left);
//console.log(objexp);

type_set=[];
typeinfo.objectexp("",objexp.properties,"OBJECT",type_set);
//console.log(type_set);

console.log("comparing same/compatible types");
var msg=is_subset(type_set, x_type);
assert.equal(msg,"","FAILED: TYPES DONT MATCH");

console.log("comparing in-compatible types");
var msg=is_subset(type_set, x_type_bad);
assert.notEqual(msg,"","FAILED: TYPES MATCH");
