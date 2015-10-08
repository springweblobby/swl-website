/*
 * Plays sounds.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Applet = require('store/Applet.js');

var baseUrl = document.URL.replace(/\/[^/]*$/, "/") + 'sound/';

function playSound(file) {
	if (this.preventHearingLoss)
		return;
	this.preventHearingLoss = setTimeout(function(){
		clearTimeout(preventHearingLoss);
		preventHearingLoss = null;
	}, 1000);
	Applet && Applet.playSound(baseUrl + file);
}

module.exports = function(){ return Reflux.createStore({
	listenables: require('act/Sound.js'),
	init: function(){
		this.preventHearingLostt = null;
	},
	playRing: _.partial(playSound, 'alert.mp3'),
	playDing: _.partial(playSound, '4_tone_ding.mp3'),
})};
