///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/ConfirmationDialog',
	[
		"dojo/_base/declare",
		'dijit/_WidgetBase',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dijit/form/Button',
		'dijit/Dialog',
	],
	function(declare,
			WidgetBase,
			lang,
			domConstruct,
			Button,
			Dialog
	){


return declare( [ WidgetBase ], {
	
	msg: '',
	gotResult: false,
	result: null,
	
	buildRendering: function()
	{
		this.setup();
	},
	
	setup: function()
	{
		var dlg;
		var div, bottomDiv, dlg;
		var okButton, cancelButton;
		
		div = domConstruct.create('div', {innerHTML: this.msg} )
		dlg = new dijit.Dialog({
			title: "Confirmation",
			class: 'confirmationDialog',
			content: div
		});
		domConstruct.create('br', {}, div )
		bottomDiv = domConstruct.create('div', {style: {height: '30px'}}, div )
		cancelButton = new dijit.form.Button({ label: 'Cancel', style: {float: 'right'} } ).placeAt(bottomDiv);
		okButton = new dijit.form.Button({ label: 'OK', style: {float: 'right'} } ).placeAt(bottomDiv);
		
		okButton.on('click',lang.hitch(this, function(dlg){
			dlg.hide();
			this.onConfirm(true)
		}, dlg) );
		cancelButton.on('click',lang.hitch(this, function(dlg){
			dlg.hide();
			this.onConfirm(false)
		}, dlg) );
		
		dlg.show();
	},
	blank: null
}); }); //declare lwidgets.BattleManager
