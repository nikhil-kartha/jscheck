Initial sketch for the symbol table, works with a single scope. 
Changes:
1. Encode the return type of a function as its type
2. Track assignments, this will be used to propagate values up the scope tree
3. Methods like enyo.mixin and enyo.clone are treated as assignment operation.
4. Record "comparison" operations.
