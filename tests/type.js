// Test the type extractor

//****** Test 1 ******

pulseconfig= {
    frequency: 200,
    events: [{name: 'hold', time: 200}],
    resume: false,
    moveTolerance: 16,
    endHold: 'onMove'
}

console.log(pulseconfig);

/*
x_type= Set of (
                OBJ.frequency.INT, 
                OBJ.events.ARRAY.OBJ.name.STR, 
                OBJ.events.ARRAY.OBJ.time.INT,
                OBJ.resume.BOOL,
                OBJ.endHold.STR,
                )

*/

events =  [{name: 'hold', time: 200}]

/*

events_type= Set of (
                     ARRAY.OBJ.name.STR,
                     ARRAY.OBJ.time.INT,
                     )
*/


//Check if events_type is a subset of pulseconfig
is_subset(events_type, pulseconfig)



//****** Test 2 ******

x= { 
    obj1:{
        obj2:[
                 "str2", 
                 1, 
                 [
                     {
                         name: 'hold', 
                         time: 200
                     }
                 ]
             ]
         }
   }

console.log(x);

/*
x_type= Set of (
                OBJ.obj1.OBJ.obj2.ARRAY.STR,
                OBJ.obj1.OBJ.obj2.ARRAY.INT,
                OBJ.obj1.OBJ.obj2.ARRAY.ARRAY.OBJ.name.STR,
                OBJ.obj1.OBJ.obj2.ARRAY.ARRAY.OBJ.time.INT,
                )
*/


