module.exports = (function(){

	'use strict';

	function callN(counter, callback){
		return function(){
			if( !--counter ){ callback(); }
		};
	}


	var path = require("path"),
		child_process = require('child_process'),
		fork = child_process.fork;

	child_process.fork = function(modulePath){

		// Legitimate path
		if(path.dirname(modulePath)+"/"+path.basename(modulePath) === modulePath ){
			return fork.apply(child_process, Array.prototype.slice.apply(arguments));
		}

		// Code
		else{
			var args = Array.prototype.slice.apply(arguments);
			args[0] = __dirname + "/spawn.js";
			args[2].env.code = modulePath;

			return fork.apply(child_process, args);
		}
	};

	var cluster = require('cluster');

	return function(options, master, worker){

		if( typeof master !== "function" ){ throw new Error("Master must be a function"); }

		if( typeof worker !== "function" ){ throw new Error("Worker must be a function"); }


		var listen = require('processCallback.js');

		// Master
		if( cluster.isMaster ){

			// Prepare Worker
			cluster.setupMaster({
				exec : worker
			});

			// Number of workers
			var numWorkers = options,

			// Store workers
				workers = [];

			// Wait until all workers are ready
			var onlineCB = callN(numWorkers, function(){

				// Invoke master
				master(workers);
			});

			// When a Worker process is up
			cluster.on('online', function( worker ){

				// console.info('Worker ' + worker.process.pid + ' spawned' );

				// Bind Listener to each forked process
				workers.push( listen(worker) );

				// Signal online
				onlineCB();
			});

			// If a Worker process dies
			cluster.on('exit', function(worker, code, signal){

				// Delete worker
				for( var i = 0; i<workers.length; i++ ){
					if( workers[i].listeningTo === worker ){
						delete workers[i];
						break;
					}
				}

				// Respawn Worker
				cluster.fork();
			});

			// Spawn workers
			for( var i = 0; i < numWorkers; i++ ){
				cluster.fork();
			}
		}

		// Load worker
		// else {
		// 	worker(listen(process));
		// }
	};
})();