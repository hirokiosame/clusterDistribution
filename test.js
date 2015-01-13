var clusterDistribution = require("./index");

clusterDistribution(
	require('os').cpus().length*4,
	function master(workers){

		console.log("Master online", workers.length);

		var worker;
		while( worker = workers.pop() ){ (function(worker){

			// Send work
			worker.send("Hello", function(res){
				console.log("Response", res);

				// Put back...
				workers.push(worker);
			});
		})(worker); }
	},
	function worker(listen){

		// Wait for master
		listen.recv(function(msg, toMaster){

			// Process work and send back
			toMaster(msg + " Master");
		});
	}
);