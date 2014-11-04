/*
 * A wrapper around the unitsync API interface. Provides node style async
 * functions that take the callback as the last parameter.
 */

'use strict'

var _ = require('lodash');
var Log = require('./Log.js');

// The API returns all types as strings, this is done to cast them back.
function cast(handler){
	return function(type, val){
		if (type === 'void')
			handler();
		else if (type === 'bool')
			handler(val === 'true');
		else if (type === 'int')
			handler(parseInt(val));
		else if (type === 'unsigned int')
			handler(parseInt(val));
		else if (type === 'float')
			handler(parseFloat(val));
		else if (type === 'const char*')
			handler(val);
		else
			Log.warning("Got unknown type from unitsync: " + type);
	};
}

// unitsync is the API object returned by getUnitsyncAsync()
// result() is a function that takes the unitsync result id and the handler to
// be called once that result arrives.
module.exports = function(unitsync, result){
	_.extend(this, {
		init: function(isServer, id, done){
			var id = _.uniqueId();
			unitsync.init(id, isServer, id);
			result(id, cast(done));
		},
		getMapChecksumFromName: function(mapName, done){
			var id = _.uniqueId();
			unitsync.getMapChecksumFromName(id, mapName);
			result(id, cast(done));
		},
	});
};
