/*
 * This stores data about games and maps. This is the only point of access to
 * unitsync. The possibility of fetching this data from plasma with unitsync
 * acting as a fallback should be investigated.
 */

'use strict'

var _ = require('lodash');
var async = require('async');
var Log = require('./Log.js');
var Reflux = require('reflux');
var Applet = require('./Applet.js');
var Unitsync = require('./Unitsync.js');
var SystemInfo = require('./SystemInfo.js');

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
			next.strand(_.partial(_.defer, function(){
				this.strands.shift();
				this.runNextStrand();
			}.bind(this)));
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
				async.eachSeries(_.range(modCount), async.seq(function(modIdx, done){
					unitsync.getPrimaryModInfoCount(modIdx, function(e, infoCount){
						async.map(_.range(infoCount), unitsync.getInfoKey, function(e, keys){
							done(null, { idx: modIdx, keys: keys });
						});
					});
				}, function(infoKeys, done){
					var infoKeysObj = _.reduce(infoKeys.keys, function(acc, key, n){
						acc[key] = _.partial(unitsync.getInfoValueString, n);
						return acc;
					}, {});
					async.parallel(_.pick(infoKeysObj, ['name', 'name_pure', 'version']), function(e, info){
						if (!games[info.name])
							games[info.name] = {};
						_.extend(games[info.name], {
							name: info.name_pure,
							version: info.version,
							index: infoKeys.idx,
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

	loadLocalMap: function(map){
		if (!this.unitsync)
			return;
		var unitsync = this.unitsync;
		this.executeStrand('Loading ' + map, function(done){
			var mapObj = this.maps[map];
			if (!mapObj) {
				Log.warning('loadLocalMap(): ' + map + ' is not a known map.');
				return done();
			}
			if (mapObj.options && mapObj.author && mapObj.description && mapObj.width &&
					mapObj.height && mapObj.gravity && mapObj.startPositions)
				return done();
			async.series({
				options: _.partial(this.getOptions.bind(this), _.partial(unitsync.getMapOptionCount, map)),
				author: _.partial(unitsync.getMapAuthor, mapObj.index),
				description: _.partial(unitsync.getMapDescription, mapObj.index),
				width: _.partial(unitsync.getMapWidth, mapObj.index),
				height: _.partial(unitsync.getMapHeight, mapObj.index),
				gravity: _.partial(unitsync.getMapGravity, mapObj.index),
				startPositions: function(done){
					unitsync.getMapPosCount(mapObj.index, function(e, posCount){
						async.map(_.range(posCount), function(i, done){
							async.parallel({
								x: _.partial(unitsync.getMapPosX, mapObj.index, i),
								z: _.partial(unitsync.getMapPosZ, mapObj.index, i),
							}, done);
						}, done);
					});
				},
			}, function(e, res){
				_.extend(mapObj, res);
				done();
			});
		}.bind(this));
	},

	loadLocalGame: function(game){
		if (!this.unitsync)
			return;
		var unitsync = this.unitsync;
		this.executeStrand('Loading ' + game, function(done){
			var gameObj = this.games[game];
			if (!gameObj) {
				Log.warning('loadLocalGame(): ' + game + ' is not a known game.');
				return done();
			}
			// Return if already loaded.
			if (gameObj.sides && gameObj.options && gameObj.bots)
				return done();
			async.series({
				remArchives: unitsync.removeAllArchives,
				addArchives: _.partial(async.seq(unitsync.getPrimaryModArchive, unitsync.addAllArchives), gameObj.index),

				options: _.partial(this.getOptions.bind(this), unitsync.getModOptionCount),
				sides: this.getSides.bind(this),
				bots: this.getBots.bind(this),
			}, function(e, result){
				_.extend(gameObj, _.omit(result, ['remArchives', 'addArchives']));
				done();
			});
		}.bind(this));
	},


	getBots: function(done){
		var unitsync = this.unitsync;
		var getOptions = this.getOptions.bind(this);
		unitsync.getSkirmishAICount(function(e, aiCount){
			async.reduce(_.range(aiCount), {}, function(acc, i, done){
				unitsync.getSkirmishAIInfoCount(i, function(e, infoCount){
					async.map(_.range(infoCount), unitsync.getInfoKey, function(e, keys){
						async.parallel(_.mapValues(_.pick(_.invert(keys), ['shortName', 'description']), function(idx){
							return _.partial(unitsync.getInfoValueString, parseInt(idx));
						}), function(e, info){
							getOptions(_.partial(unitsync.getSkirmishAIOptionCount, i), function(e, options){
								acc[info.shortName] = _.extend(_.omit(info, 'shortName'), { options: options });
								done(null, acc);
							});
						});
					});
				});
			}, done);
		});
	},

	getSides: function(done){
		var unitsync = this.unitsync;
		unitsync.getSideCount(function(e, count){
			async.map(_.range(count), async.seq(unitsync.getSideName, function(side, done){
				var path = 'SidePics/' + side;
				async.parallel([_.partial(unitsync.openFileVFS, path + '.png'),
					_.partial(unitsync.openFileVFS, path + '.bmp')], function(e, files){
					var fd = files[0] || files[1] || 0;
					if (fd === 0) {
						Log.warning('Could not load faction icon for ' + side);
						done(null, { name: side, icon: '' });
					} else {
						async.seq(unitsync.fileSizeVFS, _.partial(unitsync.jsReadFileVFS, fd), function(icon, done){
							done(null, { name: side, icon: 'data:' + (files[0] ? 'image/png,' : 'image/bmp,') + icon });
						}, function(obj, done){
							async.parallel([
								function(done){ files[0] ? unitsync.closeFileVFS(files[0], done) : done(); },
								function(done){ files[1] ? unitsync.closeFileVFS(files[1], done) : done(); }],
								function(){ done(null, obj); });
						})(fd, done);
					}
				});
			}), done);
		});
	},

	// getOptionCount is an async function that calls e.g. getModOptionCount().
	getOptions: function(getOptionCount, done){
		var unitsync = this.unitsync;
		var sectionNames = {};
		getOptionCount(function(e, count){
			async.reduce(_.range(count), {}, function(acc, i, done){
				async.seq(async.parallel, function(opt, done){
					opt.type = ['error', 'bool', 'list', 'number', 'string', 'section'][opt.type];
					if (opt.type === 'section') {
						sectionNames[opt.key] = opt.name;
						done(null, null);
					} else if (opt.type === 'string') {
						opt.type = 'text';
						unitsync.getOptionStringDef(i, function(e, val){
							opt.val = val;
							done(null, opt);
						});
					} else if (opt.type === 'bool') {
						opt.type = 'bool';
						unitsync.getOptionBoolDef(i, function(e, val){
							opt.val = !!val;
							done(null, opt);
						});
					} else if (opt.type === 'number') {
						opt.type = 'float';
						async.parallel({
							val: _.partial(unitsync.getOptionNumberDef, i),
							min: _.partial(unitsync.getOptionNumberMin, i),
							max: _.partial(unitsync.getOptionNumberMax, i),
							step: _.partial(unitsync.getOptionNumberStep, i),
						}, function(e, obj){ done(null, _.extend(opt, obj)); });
					} else if (opt.type === 'list') {
						opt.type = 'select';
						unitsync.getOptionListCount(i, function(e, n){
							async.map(_.range(n), function(j, done){
								async.parallel({
									key: _.partial(unitsync.getOptionListItemKey, i, j),
									name: _.partial(unitsync.getOptionListItemName, i, j),
									desc: _.partial(unitsync.getOptionListItemDesc, i, j),
								}, done);
							}, function(e, vals){
								opt.options = vals.reduce(function(acc, obj){
									acc[obj.key] = _.omit(obj, 'key');
									return acc;
								}, {});
								unitsync.getOptionListDef(i, function(e, val){
									opt.val = val;
									done(null, opt);
								});
							});
						});
					} else {
						done(null, null);
					}
				}, function(opt, done){
					if (!opt) // throw away sections
						return done(null, acc);
					if (!acc[opt.section])
						acc[opt.section] = {};
					acc[opt.section][opt.key] = _.omit(opt, 'key');
					done(null, acc);
				})({
					key: _.partial(unitsync.getOptionKey, i),
					section: _.partial(unitsync.getOptionSection, i),
					name: _.partial(unitsync.getOptionName, i),
					desc: _.partial(unitsync.getOptionDesc, i),
					type: _.partial(unitsync.getOptionType, i),
				}, done);
			}, function(e, opts){
				// Rename sections to their human-readable names.
				for (var sec in opts) {
					if (sec in sectionNames) {
						opts[sectionNames[sec]] = opts[sec];
						delete opts[sec];
					}
				}
				done(null, opts);
			});
		});
	},
});
