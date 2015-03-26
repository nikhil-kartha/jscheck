Partial implementation for the symbol table, works with a multiple scopes. 
Process Node types as per the AST standard here: 
https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API

Changes:
1. Encode the return type of a function as its type
2. Track assignments, this will be used to propagate values up the scope tree
3. Methods like enyo.mixin and enyo.clone are treated as assignment operation.
4. Record "comparison" operations.


Depends on: ESPRIMA, ESCOPE

Usage:
nodejs symtab.js jssample/drag.js

Sample symbol table output:
GLOBAL DICT: 
{
    "ASSIGN":[],"VARNAMES":{},"COMPARE":[],"RETURN_TYPE":[],"FUNCS":{},
    "RANGE_549_659":{"ASSIGN":[],"VARNAMES":{"this.holdPulseDefaultConfig":["config"]},"COMPARE":[],"RETURN_TYPE":[],"FUNCS":{}},
    "RANGE_891_1113":{"ASSIGN":[],"VARNAMES":{"nOpts":["oldOpts"],"nOpts.frequency":["nOpts.delay"],"nOpts.events":[["ARRAY.OBJECT.hold.Literal"]]},"COMPARE":[],"RETURN_TYPE":["oldOpts"],"FUNCS":{}},
    "RANGE_1364_1509":{"ASSIGN":[],"VARNAMES":{"nOpts":["opts","normalizeHoldPulseConfig"]},"COMPARE":[],"RETURN_TYPE":[],"FUNCS":{}},
    "RANGE_1563_1823":{"ASSIGN":[["this.holdPulseConfig","holdPulseDefaultConfig"]],"VARNAMES":{"this.holdPulseConfig":[],"e.configureHoldPulse":[]},"COMPARE":[],"RETURN_TYPE":[],"FUNCS":{}},
    "RANGE_24_1833":{"ASSIGN":[],"VARNAMES":{"enyo.gesture.drag":[["OBJECT.holdPulseDefaultConfig.OBJECT.frequency.Literal","OBJECT.holdPulseDefaultConfig.OBJECT.events.ARRAY.OBJECT.name.Literal","OBJECT.holdPulseDefaultConfig.OBJECT.events.ARRAY.OBJECT.time.Literal","OBJECT.holdPulseDefaultConfig.OBJECT.resume.Literal","OBJECT.holdPulseDefaultConfig.OBJECT.moveTolerance.Literal","OBJECT.holdPulseDefaultConfig.OBJECT.endHold.Literal","OBJECT.normalizeHoldPulseConfig.oldOpts"]]},"COMPARE":[],"RETURN_TYPE":[],"FUNCS":{}}
}

DICT.RANGE_XXX_XXX specifies the values processed for a given scope enclosed within that range. Needed for processing anonymous functions.
This will be used while stepping up the scope tree in the type checking stage.
