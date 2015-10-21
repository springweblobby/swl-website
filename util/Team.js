/*
 * Utility functions for working with teams.
 */

var _ = require('lodash');
var Log = require('act/Log.js');

var Team = {

	add: function(teams, user, team){
		if (isFinite(Team.getTeam(teams, user.name))) {
			Log.warning('Tried to add already existing user to team.');
			return;
		}
		if (!teams[team])
			teams[team] = {};
		teams[team][user.name] = user;
	},
	remove: function(teams, name){
		_.keys(teams).forEach(function(team){
			delete teams[team][name];
			if (_.size(teams[team]) === 0)
				delete teams[team];
		});
	},
	// Returns NaN if not found.
	getTeam: function(teams, name){
		return parseInt(_.findKey(teams, function(team){
			return name in team;
		}));
	},
	move: function(teams, name, team){
		var oldTeam = Team.getTeam(teams, name);
		if (isFinite(oldTeam)) {
			var user = teams[oldTeam][name];
			Team.remove(teams, name);
			Team.add(teams, user, team);
		} else {
			Log.warning('Tried to move nonexistent user to another team.');
		}
	},
	toList: function(teams){
		return _(teams).map(function(t){ return _.values(t); }).flatten().value();
	},
};

module.exports = Team;
