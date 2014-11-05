/*
 * This stores data about games and maps. This is the only point of access to
 * unitsync. The possibility of fetching this data from plasma with unitsync
 * acting as a fallback should be investigated.
 */

'use strict'

var _ = require('lodash');
var async = require('async');
var Reflux = require('reflux');
var Applet = require('./Applet.js');
var Unitsync = require('./Unitsync.js');
var Log = require('./Log.js');

module.exports = Reflux.createStore({
	init: function(){
		_.extend(this, {
			games: {},
			maps: {},
			engines: {},
			currentOperation: null,

			resultHandlers: {},
			strands: [],
		});

		// Callin for the API.
		window.unitsyncResult = function(id, type, result){
			this.resultHandlers[id] && this.resultHandlers[id](type, result);
			delete this.resultHandlers[id];
		}.bind(this);

		var unitsync = new Unitsync(Applet.getUnitsyncAsync("/home/user/.spring/weblobby/engine/98.0/libunitsync.so"), this.registerResultHandler.bind(this));
		unitsync.init(false, 0, _.noop);
		this.executeStrand('', function(){
			unitsync.getPrimaryModCount(function(err, count, done){
				async.eachSeries(_.range(count), async.compose(function(infoCount, done){
					console.log(infoCount);
					done();
				}, unitsync.getPrimaryModInfoCount), done);
			});
		});
	},
	getDefaultData: function(){
		return {
			games: this.games,
			maps: this.maps,
			engines: _.keys(this.engines),
			currentOperation: this.currentOperation,
		};
	},
	triggerSync: function(){
		this.trigger(this.getDefaultData());
	},

	registerResultHandler: function(resultId, handler){
		this.resultHandlers[resultId] = handler;
	},
	// Here, strand is an async function that is strictly sequenced with all
	// other strands. This is useful to manage the stateful nature of unitsync
	// while keeping it asynchronous.
	//
	// executeStrand() must be used for all cases where you have a sequence of
	// unitsync calls that rely on internal unitsync state, e.g. if you call
	// getModOptionCount() and then getOptionKey()/getOptionName() in a loop, a
	// random getMapOptionCount() called while the loop is running will break
	// it. Using strands for such code insures against those situations.
	//
	// Arguments: strand is the function to be executed, description will be
	// stored in this.currentOperation while the strand is running.
	executeStrand: function(description, strand){
		this.strands.push({ strand: strand, desc: description });
		// If there are no other strands in queue, run this one.
		if (this.strands.length === 1)
			this.runNextStrand();
	},
	runNextStrand: function(){
		var next = this.strands.shift()
		if (next) {
			next.strand(this.runNextStrand.bind(this));
			this.currentOperation = next.desc;
		} else {
			this.currentOperation = null;
		}
		this.triggerSync();
	},

	loadEngines: function(){
	},
	loadGames: function(){
	},
	loadMaps: function(){
	},
});
