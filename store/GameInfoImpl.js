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
var SystemInfo = require('./SystemInfo.js');
var Log = require('./Log.js');

module.exports = Reflux.createStore({
	init: function(){
		_.extend(this, {
			games: {},
			maps: {},
			engines: [],
			currentOperation: null,

			unitsync: null,
			resultHandlers: {},
			strands: [],
		});

		// Callin for the API.
		window.unitsyncResult = function(id, type, result){
			this.resultHandlers[id] && this.resultHandlers[id](type, result);
			delete this.resultHandlers[id];
		}.bind(this);

		this.loadEngines();
		this.loadGames();
		this.loadMaps();
	},
	getDefaultData: function(){
		return {
			games: this.games,
			maps: this.maps,
			engines: this.engines,
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
		var next = this.strands[0];
		if (next) {
			next.strand(function(){
				this.strands.shift();
				this.runNextStrand();
			}.bind(this));
			this.currentOperation = next.desc;
		} else {
			this.currentOperation = null;
		}
		this.triggerSync();
	},

	loadEngines: function(){
		var enginePath = SystemInfo.springHome + '/weblobby/engine';
		var dirs = Applet.listDirs(enginePath);
		this.engines = (dirs === '' ? [] : dirs.split('||'));
		var latestStable = this.engines.sort(function(ver1, ver2){
			var dev = _.map(arguments, function(ver){ return !!ver.match(/-/); });
			if (dev[0] && !dev[1]) return 1;
			if (!dev[0] && dev[1]) return -1;

			var list = _.map(arguments, function(ver){
				return ver.split('.').concat([ver.split('-')[1] || '0']).map(function(s){ return parseInt(s); });
			});
			for (var i = 0; i < list[0].length || i < list[1].length; i++) {
				if (list[0][i] < list[1][i]) return 1;
				if (list[0][i] > list[1][i]) return -1;
			}
			return 0;
		})[0];
		if (!latestStable)
			return;
		this.unitsync = new Unitsync(Applet.getUnitsyncAsync(enginePath + '/' + latestStable + ({
				Windows: '\\unitsync.dll',
				Mac: '/libunitsync.dylib',
				Linux: '/libunitsync.so',
				Linux64: '/libunitsync.so',
			})[SystemInfo.platform]), this.registerResultHandler.bind(this));
		this.executeStrand('Initializing', function(done){
			this.unitsync.init(false, 0, done);
		}.bind(this));
		this.triggerSync();
	},

	loadGames: function(){
		if (!this.unitsync)
			return;
		var unitsync = this.unitsync;
		var games = this.games;
		this.executeStrand('Learning games', function(done){
			unitsync.getPrimaryModCount(function(e, modCount){
				async.eachSeries(_.range(modCount), async.seq(unitsync.getPrimaryModInfoCount, function(infoCount, done){
					async.map(_.range(infoCount), unitsync.getInfoKey, done);
				}, function(infoKeys, done){
					var infoKeysObj = _.reduce(infoKeys, function(acc, key, n){
						acc[key] = _.partial(unitsync.getInfoValueString, n);
						return acc;
					}, {});
					async.parallel(_.pick(infoKeysObj, ['name', 'name_pure', 'version']), function(e, info){
						if (!games[info.name])
							games[info.name] = {};
						_.extend(games[info.name], {
							name: info.name_pure,
							version: info.version,
							local: true,
						});
						done();
					});
				}), done);
			});
		});
	},

	loadMaps: function(){
		if (!this.unitsync)
			return;
		var unitsync = this.unitsync;
		var maps = this.maps;
		this.executeStrand('Learning maps', function(done){
			unitsync.getMapCount(function(e, mapCount){
				async.map(_.range(mapCount), unitsync.getMapName, function(e, mapNames){
					mapNames.forEach(function(name, idx){
						if (!maps[name])
							maps[name] = {};
						_.extend(maps[name], {
							thumbnail: 'http://zero-k.info/Resources/' + name + '.thumbnail.jpg',
							index: idx,
							local: true,
						});
					});
					done();
				});
			});
		});
	},
});
