var esprima = require('esprima');
var escope =  require('escope');
var assert = require('assert');
var typeinfo = require('../typeinfo.js');

// Test the type extractor

//****** Test 1 ******

var pulseconfig= "pulseconfig={"+
    "frequency: 200, "+
    "events: [{name: 'hold', time: 200}],"+
    "resume: false,"+
    "moveTolerance: 16,"+
    "endHold: 'onMove'"+
"};";

//var pulseconfig= "pulseconfig={frequency: 200, events: [{name: 'hold', time: 200}], resume: false, moveTolerance: 16, endHold: 'onMove'};";

//console.log(pulseconfig);


var pulseconfig_type= [
                'OBJ.frequency.Literal', 
                'OBJ.events.ARRAY.OBJ.name.Literal', 
                'OBJ.events.ARRAY.OBJ.time.Literal',
                'OBJ.resume.Literal',
                'OBJ.endHold.Literal',
                ]

var pulseconfig_type_bad= [
                'OBJ.frequency.INT', 
                'OBJ.events.ARRAY.OBJ.name.STR', 
                'OBJ.events.ARRAY.OBJ.time.INT',
                'OBJ.resume.BOOL',
                'OBJ.endHold.STR',
                ]



var events =  "events = [{name: 'hold', time: 200}];";

var events_type= [
                    'ARRAY.OBJ.name.Literal',
                    'ARRAY.OBJ.time.Literal',
                 ]




//pulseconfig ObjectExpression
var pulseconfig_ast= esprima.parse(pulseconfig, {range: false, loc: false});
var pulseconfig_scopes = escope.analyze(pulseconfig_ast).scopes;

objexp= pulseconfig_scopes[0].block.body[0].expression.right;

pulseconfig_type_set=[];
typeinfo.objectexp("",objexp.properties,"OBJECT",pulseconfig_type_set);

//events ArrayExpression
var events_ast= esprima.parse(events, {range: false, loc: false});
var events_scopes = escope.analyze(events_ast).scopes;

arrexp= events_scopes[0].block.body[0].expression.right;
events_type_set=[];
typeinfo.arrayexp("", arrexp.elements,"ARRAY",events_type_set);

console.log("comparing compatible types");
var msg=is_subset(events_type_set, pulseconfig_type_set);
assert.equal(msg,"","NOT EXPECTED: TYPES SHOULD MATCH.XXXXX will be fixed when is_subset does suffix matches");

console.log("comparing in-compatible types");
var msg=is_subset(events_type_set, pulseconfig_type_bad);
assert.notEqual(msg,"","NOT EXPECTED: TYPES SHOULDNT MATCH");

