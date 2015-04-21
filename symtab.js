var esprima = require('esprima');
var escope =  require('escope');
var assert = require('assert');
var typeinfo = require('./typeinfo.js');
var astnode = require('./astnode.js');
var fs = require('fs'),

filename = process.argv[2];
content = fs.readFileSync(filename, 'utf-8');

//Symbol Table to be processed by the type checker
global.DICT={};    
global.DICT.VARNAMES = {};
global.DICT.RETURN_TYPE = [];
global.DICT.UPPER="NULL";
global.current_range = "MODULE_"+filename;  // This is for function scope
global.current_object = "MODULE_"+filename;   //"ROOTOBJECT";

var AST = esprima.parse(content, { tolerant: true, loc: true, range: true });
var SCOPES = escope.analyze(AST).scopes;
var program_body = SCOPES[0].block.body;

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

typeinfo.typechecker(SCOPES);
