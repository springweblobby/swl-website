module.exports = {
	SystemInfo: require('./SystemInfo.js'),
	Team: require('./Team.js'),
	
	humanizedTimeDifference: function(t1, t0){
		var diff = Math.floor((t1 - t0) / 60000);
		return (Math.floor(diff / 60) > 0 ? Math.floor(diff / 60) + ' hours ' : '') +
			(diff % 60) + ' minutes';
	},
}
