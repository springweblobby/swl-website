/*
 * Actions that cause processes to launch and actions that get called when a
 * process gives output.
 */

'use strict'

var Reflux = require('reflux');

module.exports = Reflux.createActions([
	"launchSpringScript",
	"launchRemoteReplay",
	"killSpring",

	"downloadEngine",
	"downloadGame",
	"downloadMap",
	"cancelDownload",

	"springOutput",
	"getConfigVars",
	"gotConfigVars",
]);
