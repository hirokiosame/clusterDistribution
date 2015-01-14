
'use strict';

var callback = eval("("+process.env.code+");"),
	listen = require('processCallback.js');

if( typeof callback === "function" ){
	callback(listen(process));
}