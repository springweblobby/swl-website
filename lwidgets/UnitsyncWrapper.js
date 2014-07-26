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

	resolveDeferred: function(deferred, unsub, type, val)
	{
		if( type === 'void' )
			deferred.resolve();
		else if( type === 'bool' )
			deferred.resolve(val === 'true');
		else if( type === 'int' )
			deferred.resolve(parseInt(val));
		else if( type === 'unsigned int' )
			deferred.resolve(parseInt(val));
		else if( type === 'float' )
			deferred.resolve(parseFloat(val));
		else if( type === 'const char*' )
			deferred.resolve(val);
		else
		{
			console.log("Got unknown type from unitsync: " + type);
			deferred.resolve(val);
		}
		unsub.obj.remove();
	},

	jsReadFileVFS: function(fd, size)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.jsReadFileVFS(__id, fd, size);
		return deferred.promise;
	},

	// Auto-generated code.

	getNextError: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getNextError(__id);
		return deferred.promise;
	},
	getSpringVersion: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSpringVersion(__id);
		return deferred.promise;
	},
	getSpringVersionPatchset: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSpringVersionPatchset(__id);
		return deferred.promise;
	},
	isSpringReleaseVersion: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.isSpringReleaseVersion(__id);
		return deferred.promise;
	},
	init: function(isServer, id)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.init(__id, isServer, id);
		return deferred.promise;
	},
	unInit: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.unInit(__id);
		return deferred.promise;
	},
	getWritableDataDirectory: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getWritableDataDirectory(__id);
		return deferred.promise;
	},
	getDataDirectoryCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getDataDirectoryCount(__id);
		return deferred.promise;
	},
	getDataDirectory: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getDataDirectory(__id, index);
		return deferred.promise;
	},
	processUnits: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.processUnits(__id);
		return deferred.promise;
	},
	getUnitCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getUnitCount(__id);
		return deferred.promise;
	},
	getUnitName: function(unit)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getUnitName(__id, unit);
		return deferred.promise;
	},
	getFullUnitName: function(unit)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getFullUnitName(__id, unit);
		return deferred.promise;
	},
	addArchive: function(archiveName)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.addArchive(__id, archiveName);
		return deferred.promise;
	},
	addAllArchives: function(rootArchiveName)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.addAllArchives(__id, rootArchiveName);
		return deferred.promise;
	},
	removeAllArchives: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.removeAllArchives(__id);
		return deferred.promise;
	},
	getArchiveChecksum: function(archiveName)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getArchiveChecksum(__id, archiveName);
		return deferred.promise;
	},
	getArchivePath: function(archiveName)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getArchivePath(__id, archiveName);
		return deferred.promise;
	},
	getMapCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapCount(__id);
		return deferred.promise;
	},
	getMapName: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapName(__id, index);
		return deferred.promise;
	},
	getMapFileName: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapFileName(__id, index);
		return deferred.promise;
	},
	getMapDescription: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapDescription(__id, index);
		return deferred.promise;
	},
	getMapAuthor: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapAuthor(__id, index);
		return deferred.promise;
	},
	getMapWidth: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapWidth(__id, index);
		return deferred.promise;
	},
	getMapHeight: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapHeight(__id, index);
		return deferred.promise;
	},
	getMapTidalStrength: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapTidalStrength(__id, index);
		return deferred.promise;
	},
	getMapWindMin: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapWindMin(__id, index);
		return deferred.promise;
	},
	getMapWindMax: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapWindMax(__id, index);
		return deferred.promise;
	},
	getMapGravity: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapGravity(__id, index);
		return deferred.promise;
	},
	getMapResourceCount: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapResourceCount(__id, index);
		return deferred.promise;
	},
	getMapResourceName: function(index, resourceIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapResourceName(__id, index, resourceIndex);
		return deferred.promise;
	},
	getMapResourceMax: function(index, resourceIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapResourceMax(__id, index, resourceIndex);
		return deferred.promise;
	},
	getMapResourceExtractorRadius: function(index, resourceIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapResourceExtractorRadius(__id, index, resourceIndex);
		return deferred.promise;
	},
	getMapPosCount: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapPosCount(__id, index);
		return deferred.promise;
	},
	getMapPosX: function(index, posIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapPosX(__id, index, posIndex);
		return deferred.promise;
	},
	getMapPosZ: function(index, posIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapPosZ(__id, index, posIndex);
		return deferred.promise;
	},
	getMapMinHeight: function(mapName)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapMinHeight(__id, mapName);
		return deferred.promise;
	},
	getMapMaxHeight: function(mapName)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapMaxHeight(__id, mapName);
		return deferred.promise;
	},
	getMapArchiveCount: function(mapName)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapArchiveCount(__id, mapName);
		return deferred.promise;
	},
	getMapArchiveName: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapArchiveName(__id, index);
		return deferred.promise;
	},
	getMapChecksum: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapChecksum(__id, index);
		return deferred.promise;
	},
	getMapChecksumFromName: function(mapName)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapChecksumFromName(__id, mapName);
		return deferred.promise;
	},
	getSkirmishAICount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSkirmishAICount(__id);
		return deferred.promise;
	},
	getSkirmishAIInfoCount: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSkirmishAIInfoCount(__id, index);
		return deferred.promise;
	},
	getInfoKey: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getInfoKey(__id, index);
		return deferred.promise;
	},
	getInfoType: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getInfoType(__id, index);
		return deferred.promise;
	},
	getInfoValueString: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getInfoValueString(__id, index);
		return deferred.promise;
	},
	getInfoValueInteger: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getInfoValueInteger(__id, index);
		return deferred.promise;
	},
	getInfoValueFloat: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getInfoValueFloat(__id, index);
		return deferred.promise;
	},
	getInfoValueBool: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getInfoValueBool(__id, index);
		return deferred.promise;
	},
	getInfoDescription: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getInfoDescription(__id, index);
		return deferred.promise;
	},
	getSkirmishAIOptionCount: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSkirmishAIOptionCount(__id, index);
		return deferred.promise;
	},
	getPrimaryModCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModCount(__id);
		return deferred.promise;
	},
	getPrimaryModInfoCount: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModInfoCount(__id, index);
		return deferred.promise;
	},
	getPrimaryModArchive: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModArchive(__id, index);
		return deferred.promise;
	},
	getPrimaryModArchiveCount: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModArchiveCount(__id, index);
		return deferred.promise;
	},
	getPrimaryModArchiveList: function(archive)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModArchiveList(__id, archive);
		return deferred.promise;
	},
	getPrimaryModIndex: function(name)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModIndex(__id, name);
		return deferred.promise;
	},
	getPrimaryModChecksum: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModChecksum(__id, index);
		return deferred.promise;
	},
	getPrimaryModChecksumFromName: function(name)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModChecksumFromName(__id, name);
		return deferred.promise;
	},
	getSideCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSideCount(__id);
		return deferred.promise;
	},
	getSideName: function(side)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSideName(__id, side);
		return deferred.promise;
	},
	getSideStartUnit: function(side)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSideStartUnit(__id, side);
		return deferred.promise;
	},
	getMapOptionCount: function(mapName)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getMapOptionCount(__id, mapName);
		return deferred.promise;
	},
	getModOptionCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getModOptionCount(__id);
		return deferred.promise;
	},
	getCustomOptionCount: function(fileName)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getCustomOptionCount(__id, fileName);
		return deferred.promise;
	},
	getOptionKey: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionKey(__id, optIndex);
		return deferred.promise;
	},
	getOptionScope: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionScope(__id, optIndex);
		return deferred.promise;
	},
	getOptionName: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionName(__id, optIndex);
		return deferred.promise;
	},
	getOptionSection: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionSection(__id, optIndex);
		return deferred.promise;
	},
	getOptionStyle: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionStyle(__id, optIndex);
		return deferred.promise;
	},
	getOptionDesc: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionDesc(__id, optIndex);
		return deferred.promise;
	},
	getOptionType: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionType(__id, optIndex);
		return deferred.promise;
	},
	getOptionBoolDef: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionBoolDef(__id, optIndex);
		return deferred.promise;
	},
	getOptionNumberDef: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionNumberDef(__id, optIndex);
		return deferred.promise;
	},
	getOptionNumberMin: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionNumberMin(__id, optIndex);
		return deferred.promise;
	},
	getOptionNumberMax: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionNumberMax(__id, optIndex);
		return deferred.promise;
	},
	getOptionNumberStep: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionNumberStep(__id, optIndex);
		return deferred.promise;
	},
	getOptionStringDef: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionStringDef(__id, optIndex);
		return deferred.promise;
	},
	getOptionStringMaxLen: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionStringMaxLen(__id, optIndex);
		return deferred.promise;
	},
	getOptionListCount: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionListCount(__id, optIndex);
		return deferred.promise;
	},
	getOptionListDef: function(optIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionListDef(__id, optIndex);
		return deferred.promise;
	},
	getOptionListItemKey: function(optIndex, itemIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionListItemKey(__id, optIndex, itemIndex);
		return deferred.promise;
	},
	getOptionListItemName: function(optIndex, itemIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionListItemName(__id, optIndex, itemIndex);
		return deferred.promise;
	},
	getOptionListItemDesc: function(optIndex, itemIndex)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getOptionListItemDesc(__id, optIndex, itemIndex);
		return deferred.promise;
	},
	getModValidMapCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getModValidMapCount(__id);
		return deferred.promise;
	},
	getModValidMap: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getModValidMap(__id, index);
		return deferred.promise;
	},
	openFileVFS: function(name)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.openFileVFS(__id, name);
		return deferred.promise;
	},
	closeFileVFS: function(file)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.closeFileVFS(__id, file);
		return deferred.promise;
	},
	fileSizeVFS: function(file)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.fileSizeVFS(__id, file);
		return deferred.promise;
	},
	initFindVFS: function(pattern)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.initFindVFS(__id, pattern);
		return deferred.promise;
	},
	initDirListVFS: function(path, pattern, modes)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.initDirListVFS(__id, path, pattern, modes);
		return deferred.promise;
	},
	initSubDirsVFS: function(path, pattern, modes)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.initSubDirsVFS(__id, path, pattern, modes);
		return deferred.promise;
	},
	openArchive: function(name)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.openArchive(__id, name);
		return deferred.promise;
	},
	closeArchive: function(archive)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.closeArchive(__id, archive);
		return deferred.promise;
	},
	openArchiveFile: function(archive, name)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.openArchiveFile(__id, archive, name);
		return deferred.promise;
	},
	closeArchiveFile: function(archive, file)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.closeArchiveFile(__id, archive, file);
		return deferred.promise;
	},
	sizeArchiveFile: function(archive, file)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.sizeArchiveFile(__id, archive, file);
		return deferred.promise;
	},
	setSpringConfigFile: function(fileNameAsAbsolutePath)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.setSpringConfigFile(__id, fileNameAsAbsolutePath);
		return deferred.promise;
	},
	getSpringConfigFile: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSpringConfigFile(__id);
		return deferred.promise;
	},
	getSpringConfigString: function(name, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSpringConfigString(__id, name, defValue);
		return deferred.promise;
	},
	getSpringConfigInt: function(name, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSpringConfigInt(__id, name, defValue);
		return deferred.promise;
	},
	getSpringConfigFloat: function(name, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getSpringConfigFloat(__id, name, defValue);
		return deferred.promise;
	},
	setSpringConfigString: function(name, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.setSpringConfigString(__id, name, value);
		return deferred.promise;
	},
	setSpringConfigInt: function(name, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.setSpringConfigInt(__id, name, value);
		return deferred.promise;
	},
	setSpringConfigFloat: function(name, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.setSpringConfigFloat(__id, name, value);
		return deferred.promise;
	},
	deleteSpringConfigKey: function(name)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.deleteSpringConfigKey(__id, name);
		return deferred.promise;
	},
	lpClose: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpClose(__id);
		return deferred.promise;
	},
	lpOpenFile: function(fileName, fileModes, accessModes)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpOpenFile(__id, fileName, fileModes, accessModes);
		return deferred.promise;
	},
	lpOpenSource: function(source, accessModes)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpOpenSource(__id, source, accessModes);
		return deferred.promise;
	},
	lpExecute: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpExecute(__id);
		return deferred.promise;
	},
	lpErrorLog: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpErrorLog(__id);
		return deferred.promise;
	},
	lpAddTableInt: function(key, override)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpAddTableInt(__id, key, override);
		return deferred.promise;
	},
	lpAddTableStr: function(key, override)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpAddTableStr(__id, key, override);
		return deferred.promise;
	},
	lpEndTable: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpEndTable(__id);
		return deferred.promise;
	},
	lpAddIntKeyIntVal: function(key, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpAddIntKeyIntVal(__id, key, value);
		return deferred.promise;
	},
	lpAddStrKeyIntVal: function(key, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpAddStrKeyIntVal(__id, key, value);
		return deferred.promise;
	},
	lpAddIntKeyBoolVal: function(key, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpAddIntKeyBoolVal(__id, key, value);
		return deferred.promise;
	},
	lpAddStrKeyBoolVal: function(key, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpAddStrKeyBoolVal(__id, key, value);
		return deferred.promise;
	},
	lpAddIntKeyFloatVal: function(key, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpAddIntKeyFloatVal(__id, key, value);
		return deferred.promise;
	},
	lpAddStrKeyFloatVal: function(key, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpAddStrKeyFloatVal(__id, key, value);
		return deferred.promise;
	},
	lpAddIntKeyStrVal: function(key, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpAddIntKeyStrVal(__id, key, value);
		return deferred.promise;
	},
	lpAddStrKeyStrVal: function(key, value)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpAddStrKeyStrVal(__id, key, value);
		return deferred.promise;
	},
	lpRootTable: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpRootTable(__id);
		return deferred.promise;
	},
	lpRootTableExpr: function(expr)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpRootTableExpr(__id, expr);
		return deferred.promise;
	},
	lpSubTableInt: function(key)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpSubTableInt(__id, key);
		return deferred.promise;
	},
	lpSubTableStr: function(key)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpSubTableStr(__id, key);
		return deferred.promise;
	},
	lpSubTableExpr: function(expr)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpSubTableExpr(__id, expr);
		return deferred.promise;
	},
	lpPopTable: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpPopTable(__id);
		return deferred.promise;
	},
	lpGetKeyExistsInt: function(key)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetKeyExistsInt(__id, key);
		return deferred.promise;
	},
	lpGetKeyExistsStr: function(key)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetKeyExistsStr(__id, key);
		return deferred.promise;
	},
	lpGetIntKeyType: function(key)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetIntKeyType(__id, key);
		return deferred.promise;
	},
	lpGetStrKeyType: function(key)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetStrKeyType(__id, key);
		return deferred.promise;
	},
	lpGetIntKeyListCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetIntKeyListCount(__id);
		return deferred.promise;
	},
	lpGetIntKeyListEntry: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetIntKeyListEntry(__id, index);
		return deferred.promise;
	},
	lpGetStrKeyListCount: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetStrKeyListCount(__id);
		return deferred.promise;
	},
	lpGetStrKeyListEntry: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetStrKeyListEntry(__id, index);
		return deferred.promise;
	},
	lpGetIntKeyIntVal: function(key, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetIntKeyIntVal(__id, key, defValue);
		return deferred.promise;
	},
	lpGetStrKeyIntVal: function(key, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetStrKeyIntVal(__id, key, defValue);
		return deferred.promise;
	},
	lpGetIntKeyBoolVal: function(key, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetIntKeyBoolVal(__id, key, defValue);
		return deferred.promise;
	},
	lpGetStrKeyBoolVal: function(key, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetStrKeyBoolVal(__id, key, defValue);
		return deferred.promise;
	},
	lpGetIntKeyFloatVal: function(key, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetIntKeyFloatVal(__id, key, defValue);
		return deferred.promise;
	},
	lpGetStrKeyFloatVal: function(key, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetStrKeyFloatVal(__id, key, defValue);
		return deferred.promise;
	},
	lpGetIntKeyStrVal: function(key, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetIntKeyStrVal(__id, key, defValue);
		return deferred.promise;
	},
	lpGetStrKeyStrVal: function(key, defValue)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.lpGetStrKeyStrVal(__id, key, defValue);
		return deferred.promise;
	},
	processUnitsNoChecksum: function()
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.processUnitsNoChecksum(__id);
		return deferred.promise;
	},
	getInfoValue: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getInfoValue(__id, index);
		return deferred.promise;
	},
	getPrimaryModName: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModName(__id, index);
		return deferred.promise;
	},
	getPrimaryModShortName: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModShortName(__id, index);
		return deferred.promise;
	},
	getPrimaryModVersion: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModVersion(__id, index);
		return deferred.promise;
	},
	getPrimaryModMutator: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModMutator(__id, index);
		return deferred.promise;
	},
	getPrimaryModGame: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModGame(__id, index);
		return deferred.promise;
	},
	getPrimaryModShortGame: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModShortGame(__id, index);
		return deferred.promise;
	},
	getPrimaryModDescription: function(index)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.getPrimaryModDescription(__id, index);
		return deferred.promise;
	},
	openArchiveType: function(name, type)
	{
		var __id = this.getUniqId();
		var deferred = new Deferred();
		var unsub = { obj: null };
		unsub.obj = topic.subscribe('Lobby/unitsync/' + __id, lang.hitch(this, lang.partial(this.resolveDeferred, deferred, unsub)));
		this.jsobject.openArchiveType(__id, name, type);
		return deferred.promise;
	},
}); });
