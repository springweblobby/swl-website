/*
 * Provides some system info.
 */

'use strict'

var Applet = require('store/Applet.js');

module.exports = {
	platform: (function(){
		if (navigator.platform.match(/Win/))
			return "Windows";
		else if (navigator.platform.match(/Mac/))
			return "Mac";
		else if (navigator.platform.match(/Linux.*x86_64/))
			return "Linux64";
		else if (navigator.platform.match(/Linux/))
			return "Linux";
		else
			return "";
	})(),
	springHome: Applet ? Applet.getSpringHome() : "springHome",
};
