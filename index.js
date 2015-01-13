module.exports = (function(){

	'use strict';

	function callN(counter, callback){
		return function(){
			if( !--counter ){ callback(); }
		};
	}

	return function(options, master, worker){

		var cluster = require('cluster'),
			listen = require('processCallback.js');

		// Master
		if( cluster.isMaster ){

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
					if( workers[i].listeningTo === worker.process.pid ){
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
		else {
			worker(listen(process));
		}
	};
})();