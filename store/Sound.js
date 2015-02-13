/*
 * Plays sounds.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Applet = require('./Applet.js');

var baseUrl = document.URL.replace(/\/[^/]*$/, "/") + 'sound/';
var preventHearingLoss = null;

function playSound(file) {
	if (preventHearingLoss)
		return;
	preventHearingLoss = setTimeout(function(){
		clearTimeout(preventHearingLoss);
		preventHearingLoss = null;
	}, 1000);
	Applet && Applet.playSound(baseUrl + file);
}

module.exports = Reflux.createStore({
	listenables: require('../act/Sound.js'),

	playRing: _.partial(playSound, 'alert.mp3'),
	playDing: _.partial(playSound, '4_tone_ding.mp3'),
});
