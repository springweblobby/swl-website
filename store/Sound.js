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
		clearTimeout(this.preventHearingLoss);
		this.preventHearingLoss = null;
	}.bind(this), 1000);
	if (Applet)
		Applet.playSound(baseUrl + file);
	else
		new Audio(baseUrl + file).play();
}

module.exports = function(){ return Reflux.createStore({
	listenables: require('act/Sound.js'),
	init: function(){
		this.preventHearingLoss = null;
	},
	playRing: _.partial(playSound, 'alert.mp3'),
	playDing: _.partial(playSound, '4_tone_ding.mp3'),
})};
