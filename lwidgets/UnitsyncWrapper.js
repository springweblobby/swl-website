define(
	'lwidgets/UnitsyncWrapper',
	[
		"dojo/_base/declare",
		
		'dojo/topic',
		'dojo/_base/array',
		'dojo/_base/lang',
		'dojo/Deferred'
	],
	function(declare,
		topic, array, lang, Deferred
	){
	return declare([], {

	jsobject: null,
	idCount: { val: 0 },
	
	constructor: function(args)
	{
		declare.safeMixin(this, args);
	},

	getUniqId: function()
	{
		return (this.idCount.val++)+'';
	},

	resolveDeferred: function(deferred, type, val)
	{
		if( type === 'void' )
			deferred.resolve();
		else if( type === 'int' )
			deferred.resolve(parseInt(val));
		else
		{
			console.log("Got unknown type from unitsync: " + type);
			deferred.resolve(val);
		}
	},

	init: function(server, n)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred)));
		this.jsobject.init(__id, server, n);
		return deferred.promise;
	},

	getMapCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred)));
		this.jsobject.getMapCount(__id);
		return deferred.promise;
	},

	getPrimaryModCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred)));
		this.jsobject.getPrimaryModCount(__id);
		return deferred.promise;
	}
}); });
