/*
 * This stores data about games and maps. This is the only point of access to
 * unitsync. The possibility of fetching this data from plasma with unitsync
 * acting as a fallback should be investigated.
 */

'use strict'

var _ = require('lodash');
var async = require('async');
var Log = require('act/Log.js');
var Process = require('act/Process.js');
var Reflux = require('reflux');
var Applet = require('store/Applet.js');
var Unitsync = require('store/Unitsync.js');
var SystemInfo = require('util/SystemInfo.js');
var request = require('superagent');

// This is based on the scroll size used by zk site.
// See https://github.com/ZeroK-RTS/Zero-K-Infrastructure/blob/master/Zero-K.info/AppCode/Global.cs#L41
var mapSearchPageSize = 40;

function getZkMapResource(name, type) {
	console.log(JSON.stringify(arguments));
	console.log('http://zero-k.info/Resources/' + name.replace(/ /g, '_') + '.' + type + '.jpg');
	return 'http://zero-k.info/Resources/' + name.replace(/ /g, '_') + '.' + type + '.jpg';
}

function getMapThumbnail(name) {
	return getZkMapResource(name, 'thumbnail');
}

function getMinimaps(name) {
	return {
		minimap: getZkMapResource(name, 'minimap'),
		heightmap: getZkMapResource(name, 'heightmap'),
		metalmap: getZkMapResource(name, 'metalmap'),
	};
}

module.exports = function(){ return Reflux.createStore({

	listenables: require('act/GameInfo.js'),

	init: function(){
		_.extend(this, {
			games: {},
			maps: {},
			engines: [],
			currentOperation: null,

			mapSearchResult: [], // null means search in progress

			springSettings: {},

			unitsync: null,
			resultHandlers: {},
			strands: [],

			mapSearchQuery: {},
			mapSearchPages: 0,
			mapSearchInProgress: false,
		});

		// Callin for the API.
		if (window.unitsyncResult !== undefined)
			throw new Error('GameInfoImpl: window.unitsyncResult() already defined.');
		window.unitsyncResult = function(id, type, result){
			this.resultHandlers[id] && this.resultHandlers[id](type, result);
			delete this.resultHandlers[id];
		}.bind(this);

		this.listenTo(Process.gotConfigVars, 'gotConfigVars');

		this.loadEngines();
		this.loadGames();
		this.loadMaps();
	},
	getInitialState: function(){
		return {
			games: this.games,
			maps: this.maps,
			engines: this.engines,
			currentOperation: this.currentOperation,
			mapSearchResult: this.mapSearchResult,
			springSettings: this.springSettings,
		};
	},
	triggerSync: function(){
		this.trigger(this.getInitialState());
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


	// Action handlers.

	// The idea of those is that you signal that you want some new data loaded
	// into the store, but you get no guarantees if it will be loaded and when.
	// Supposedly this leads to simpler code because you don't have to handle
	// exceptions in code calling loadSomething() or change state when data
	// arrives, you just have dumb components rendering whatever relevant data
	// is present in the store at the time.


	loadEngines: function(){
		var enginePath = SystemInfo.springHome + '/engine';
		var dirs = Applet.listDirs(enginePath);
		this.engines = (dirs === '' ? [] : dirs.split('||')).filter(function(name){
			return !!name.match(/[0-9][0-9.]*[0-9](-[0-9]+-g.*)?/);
		});
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
		var handle = Applet.getUnitsyncAsync(enginePath + '/' + latestStable + ({
				Windows: '\\unitsync.dll',
				Mac: '/Spring_' + latestStable + '.app/Contents/MacOS/libunitsync.dylib',
				Linux: '/libunitsync.so',
				Linux64: '/libunitsync.so'
			})[SystemInfo.platform]);
		if (!handle)
			return;
		this.unitsync = new Unitsync(handle, this.registerResultHandler);
		var unitsync = this.unitsync;
		this.executeStrand('Initializing', function(done){
			async.series({
				init: _.partial(unitsync.init, false, 0),
				springData: _.partial(unitsync.getSpringConfigString, 'SpringData', ''),
			}, function(e, res){
				var sep = SystemInfo.platform === 'Windows' ? ';' : ':';
				var dirs = res.springData.split(sep);
				if (dirs.indexOf(SystemInfo.springHome) < 0) {
					dirs.unshift(SystemInfo.springHome);
					async.series([_.partial(unitsync.setSpringConfigString, 'SpringData',
						dirs.join(sep)), _.partial(unitsync.init, false, 0)], done);
				} else {
					done();
				}
			});
		});
		Process.getConfigVars(latestStable);
		this.triggerSync();
	},

	loadGames: function(){
		if (!this.unitsync)
			return;
		var unitsync = this.unitsync;
		var games = this.games;
		this.runInit();
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
		this.runInit();
		this.executeStrand('Learning maps', function(done){
			unitsync.getMapCount(function(e, mapCount){
				async.map(_.range(mapCount), unitsync.getMapName, function(e, mapNames){
					mapNames.forEach(function(name, idx){
						if (!maps[name])
							maps[name] = {};
						_.extend(maps[name], {
							thumbnail: getMapThumbnail(name),
							index: idx,
							local: true,
						});
						_.extend(maps[name], getMinimaps(name));
					});
					done();
				});
			});
		});
	},

	loadGame: function(game){
		if (this.games[game] && this.games[game].local)
			this.loadLocalGame(game);
		//this.loadRemoteGame(game);
	},
	loadMap: function(map){
		if (this.maps[map] && this.maps[map].local)
			this.loadLocalMap(map);
		this.loadRemoteMap(map);
	},
	loadMapThumbnails: function(maps){
		maps.forEach(function(map){
			if (!this.maps[map])
				this.maps[map] = {};
			if (!this.maps[map].thumbnail) {
				this.maps[map].thumbnail = getMapThumbnail(map);
				_.extend(this.maps[map], getMinimaps(map));
			}
		}.bind(this));
		this.triggerSync();
	},


	// See comments in act/GameInfo.js
	searchMaps: function(query){
		if (this.mapSearchInProgress) return;
		this.mapSearchQuery = query;
		this.mapSearchPages = 0;
		this.mapSearchResult = null;
		this.triggerSync();
		this.searchMapsMore();
	},
	searchMapsMore: function(){
		// Check if we've exhausted the search result.
		if (this.mapSearchInProgress || this.mapSearchResult !== null &&
			(this.mapSearchPages - 1) * mapSearchPageSize > this.mapSearchResult.length) {

			return;
		}
		this.mapSearchInProgress = true;
		request.get('http://zero-k.info/Maps/JsonSearch').
			query(_.extend(this.mapSearchQuery, { offset: this.mapSearchPages * mapSearchPageSize })).
				end(function(err, res){

			if (!err) {
				if (this.mapSearchResult === null)
					this.mapSearchResult = [];
				this.mapSearchResult = this.mapSearchResult.concat(res.body);
				this.mapSearchPages++;
				this.triggerSync();
			}
			this.mapSearchInProgress = false;
		}.bind(this));
	},

	gotConfigVars: function(vars){
		if (!this.unitsync)
			return;
		var unitsync = this.unitsync;
		this.executeStrand('Learning engine settings', function(done){
			var opts = _.mapValues(vars, function(opt, key){
				return {
					name: key,
					desc: opt.description,
					type: (opt.type === 'std::string' ? 'text' : opt.type),
					defaultValue: opt.defaultValue,
					min: opt.minimumValue,
					max: opt.maximumValue,
					step: 1,
				};
			});
			async.forEachOf(opts, function(opt, key, done){
				var getOpt;
				if (opt.type === 'text')
					getOpt = unitsync.getSpringConfigString;
				else if (opt.type === 'float')
					getOpt = unitsync.getSpringConfigFloat;
				else
					getOpt = unitsync.getSpringConfigInt;
				getOpt(key, opt.defaultValue, function(e, val){
					opts[key].val = val;
					done(null);
				});
			}, function(){
				this.springSettings = opts;
				this.triggerSync();
				done();
			}.bind(this));
		}.bind(this));
	},
	setSpringSetting: function(key, val){
		if (!this.unitsync || !this.springSettings[key])
			return;
		var getOpt, setOpt;
		if (this.springSettings[key].type === 'text') {
			getOpt = this.unitsync.getSpringConfigString;
			setOpt = this.unitsync.setSpringConfigString;
		} else if (this.springSettings[key].type === 'float') {
			getOpt = this.unitsync.getSpringConfigFloat;
			setOpt = this.unitsync.setSpringConfigFloat;
		} else {
			getOpt = this.unitsync.getSpringConfigInt;
			setOpt = this.unitsync.setSpringConfigInt;
		}
		setOpt(key, val, function(){
			getOpt(key, this.springSettings[key].defaultValue, function(e, newVal){
				this.springSettings[key].val = newVal;
				this.triggerSync();
			}.bind(this));
		}.bind(this));
	},


	// Not action handlers.


	runInit: function(){
		this.executeStrand('Initializing', function(done){
			this.unitsync.init(false, 0, done);
		}.bind(this));
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
			return done();

			// GetMapAuthor() and friends were removed.
			// https://github.com/spring/spring/commit/0806c632fb2
			//
			// TODO: Rewrite using whatever new API unitsync has for this.

			/*if (_.all(['options', 'author', 'description', 'width', 'height', 'gravity', 'startPositions'], _.partial(_.has, mapObj)))
				return done();
			async.series({
				options: _.partial(this.getOptions, _.partial(unitsync.getMapOptionCount, map)),
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
			});*/
		}.bind(this));
	},

	loadRemoteMap: function(map){
		if (!this.maps[map])
			this.maps[map] = {};
		if (!this.maps[map].thumbnail) {
			this.maps[map].thumbnail = getMapThumbnail(map);
			_.extend(this.maps[map], getMinimaps(map));
			this.triggerSync();
		}

		/* Springfiles is too unreliable, but maybe use as fallback?

		request.get('http://weblobby.springrts.com/reactjs/springfiles.php').
			query({ springname: map, images: 1 }).end(function(err, res){

			if (!err && res.body.length > 0) {
				_.extend(this.maps[map], {
					minimap: res.body[0].mapimages[0],
					heightmap: res.body[0].mapimages[1],
					metalmap: res.body[0].mapimages[2],
				});
				this.triggerSync();
			}
		}.bind(this));*/
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
			if (_.all(['sides', 'options', 'bots'], _.partial(_.has, gameObj)))
				return done();
			async.series({
				remArchives: unitsync.removeAllArchives,
				addArchives: _.partial(async.seq(unitsync.getPrimaryModArchive, unitsync.addAllArchives), gameObj.index),

				options: _.partial(this.getOptions, unitsync.getModOptionCount),
				sides: this.getSides,
				bots: this.getBots,
			}, function(e, result){
				_.extend(gameObj, _.omit(result, ['remArchives', 'addArchives']));
				done();
			});
		}.bind(this));
	},


	getBots: function(done){
		var unitsync = this.unitsync;
		var getOptions = this.getOptions;
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
})};
