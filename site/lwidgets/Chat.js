///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/Chat',
	[
		"dojo/_base/declare",
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		'dojo/_base/event',
		
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		//extras
		
		'dojox/html/entities',
		//,'dojox/av/FLAudio'
		
		
	],
	function(declare,
		array, domConstruct, domStyle, domAttr, lang, topic, event,
		WidgetBase, Templated, WidgetsInTemplate ){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {
	
	
	'subscriptions':null,
	
	'mainContainer':null,
	'messageNode':'',
	'name':'',
	'nick':'',
	
	'prevCommands':null,
	'curPrevCommandIndex':0,
	
	'startMeUp':true,
	
	'maxLines':100,
	
	'users':null,	//mixed in
	'settings':null,
	
	'nickCompleteIndex':0,
	'nickCompleteWord':'',
	'nickCompleteNicks':null,
	
	'postCreate' : function()
	{
		this.prevCommands = [];
		this.subscriptions = [];

		setTimeout( function(thisObj){ topic.publish('SetChatStyle') }, 1000, this );
		
		this.addSubscription( this.subscribe('SetNick', 'setNick' ) );
		
		//dumb hax
		/**/
		this.addSubscription( this.subscribe('ResizeNeeded', function(){
			setTimeout( function(thisObj){
				thisObj.resizeAlready();
			}, 1, this );
		} ) );
		/**/
		//this.addSubscription( this.subscribe('ResizeNeeded', 'resizeAlready' ) );
		
		this.addSubscription( this.subscribe('Lobby/chime', function(data){
			this.addLine( data.chimeMsg, 'chatMine' );
		} ) );
		
		this.messageNode.on('mouseup', lang.hitch(this, 'focusTextNode'))
		
		this.postCreate2();

	},
	
	'destroyMe':function()
	{
		if( this.playerListNode )
		{
			//echo('destroy playerlist error')
			//this.playerListNode.destroyRecursive();	
		}
		
		if( this.subscriptions )
		{
			array.forEach(this.subscriptions, function(subscription){
				subscription.remove()
			});
		}
		//echo('destroy chat error')
		//this.destroyRecursive();
		
	},
	
	'setNick':function(data)
	{
		this.nick = data.nick;
	},
	
	'addSubscription':function( handle )
	{
		this.subscriptions.push( handle );
	},
	
	'postCreate2':function()
	{
	},
	
	'focusTextNode':function(e)
	{
		this.textInputNode.focus();
	},
	
	'keydown':function(e)
	{
		var cursorPos, curText, words, curWord, curTextLeft, curTextRight, joinedNicks
		if(e.keyCode === 9) //tab
		{
			event.stop(e);
			cursorPos = this.textInputNode.selectionStart;
			
			curText = this.textInputNode.value;
			curTextLeft = curText.substring(0,cursorPos);
			curTextRight = curText.substring(cursorPos);
			words = curTextLeft.split(' ');
			curWord = words.pop();
			
			if( curWord === '' )
			{
				return;
			}
			
			if( this.nickCompleteWord === '' )
			{
				this.nickCompleteWord = curWord;
				joinedNicks = '';
				for(user in this.players)
				{
					joinedNicks += ' ' + user;
				}
				this.nickCompleteNicks = joinedNicks.match(new RegExp('[^ ]*'+ this.nickCompleteWord.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") +'[^ ]*', 'gi') );
			}
			
			if( this.nickCompleteNicks !== null )
			{
			
				curWord = this.nickCompleteNicks[this.nickCompleteIndex];
				words.push(curWord);
				curTextLeft = words.join(' ');
				this.textInputNode.value = curTextLeft + curTextRight;
				this.textInputNode.selectionStart = curTextLeft.length;
				this.textInputNode.selectionEnd = curTextLeft.length;
				
				this.nickCompleteIndex+=1;
				this.nickCompleteIndex %= this.nickCompleteNicks.length;
			}
		}
		else
		{
			this.nickCompleteNicks = null;
			this.nickCompleteIndex = 0;
			this.nickCompleteWord = '';
		}
	},
	
	'keyup':function(e)
	{
		var prevCommand;
		//up = 38, down = 40
		if(e.keyCode === 38)
		{
			this.curPrevCommandIndex += 1;
		}
		if(e.keyCode === 40)
		{
			this.curPrevCommandIndex -= 1;
		}
		if(e.keyCode === 38 || e.keyCode === 40)
		{
			this.curPrevCommandIndex = Math.min(this.curPrevCommandIndex, this.prevCommands.length-1)
			this.curPrevCommandIndex = Math.max(this.curPrevCommandIndex, 0)
			prevCommand = this.prevCommands[ this.curPrevCommandIndex ]
			if( typeof prevCommand !== 'undefined' )
			{
				this.textInputNode.value = this.prevCommands[ this.curPrevCommandIndex ];
			}
			return;	
		}
		
		//enter
		if(e.keyCode === 13)
		{
			this.curPrevCommandIndex = -1;
			msg = this.textInputNode.value;
		
			this.prevCommands.remove(msg);
			this.prevCommands.unshift(msg);
			if( this.prevCommands.length > 20 )
			{
				this.prevCommands.pop();
			}
			
			this.sendMessage(msg);
			this.textInputNode.value = '';
		}
		
	},
	
	'sendMessage':function(msg)
	{
		var smsg, msg_arr, rest, thisName;
		
		msg_arr = msg.split(' ');
		cmd = msg_arr[0];
		
		thisName = '';
		if( this.name !== '' )
		{
			thisName = this.name + ' ';
		}
		
		if( cmd == '/me' )
		{
			rest = msg_arr.slice(1).join(' ')
			smsg = this.saystring + 'EX ' + thisName + rest;
		}
		else
		{
			smsg = this.saystring + ' ' + thisName + msg;
		}
		topic.publish( 'Lobby/notidle', {} );
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
		
	},
	
	'scrollToBottom':function()
	{
		this.messageNode.domNode.scrollTop = 9999;
	},
	
	'addLine':function(line, className, timeStamp, source )
	{
		var toPlace, newNode, date, line_ts, line_clean, timeStamp2, style;
		var sourceStyle;
		var sourceOut;
		var lineSourceDiv, lineMessageDiv, timeStampDiv, selectLink
		var sourceLink;
		
		date = new Date();
		if( timeStamp && timeStamp !== 'Offline' )
		{
			date = new Date( Date.parse(timeStamp) - (new Date()).getTimezoneOffset()*60000 );
		}
		timeStamp2 = '[' + date.toLocaleTimeString() + ']';
		
		if( timeStamp )
		{
			timeStamp2 = '<i>' + timeStamp2 + '</i>';
		}
		
		toPlace = this.messageNode.domNode;
		
		if( source === null || typeof source === 'undefined' )
		{
			source = ''
		}
		
		sourceOut = '*** ' + source;
		style = {};
		sourceStyle = '';
		
		if( source === '' )
		{
		}
		else if( className === 'chatJoin' )
		{
			style = {
				'color':this.settings.settings.chatJoinColor,
				//'display':this.settings.settings.showJoinsAndLeaves ? 'block' :'none'
			};
		}
		else if( className === 'chatLeave' )
		{
			style = {
				'color':this.settings.settings.chatLeaveColor,
				//'display':this.settings.settings.showJoinsAndLeaves ? 'block' :'none'
			};
		}
		else if( className === 'chatMine' )
		{
			sourceLink = true;
			style = {'color':this.settings.fadedColor };
			sourceOut = '<' + source + '>';
			sourceStyle = {
				'color':this.settings.settings.chatNickColor,
			};
		}
		else if( className === 'chatAction' )
		{
			sourceLink = true;
			style = {'color':this.settings.settings.chatActionColor};
			sourceOut = '* ' + source;
		}
		else
		{
			sourceLink = true;
			sourceOut = '<' + source + '>';
			sourceStyle = {
				'color':this.settings.settings.chatNickColor,
			};
		}
		
		if( sourceStyle === '' )
		{
			sourceStyle = style;
		}
		
		sourceOut = dojox.html.entities.encode(sourceOut) + '&nbsp;';
		
		if( source !== this.nick && this.nick !== '' && line.toLowerCase().search( this.convertedNick() ) !== -1 )
		{
			lineClass = 'chatAlert';
			if( this.settings.settings.nickHiliteSound )
			{
				playSound('./sound/alert.ogg')
			}
			style = {'color':this.settings.settings.alertColor};
			if( className === 'chatAction' )
			{
				sourceStyle = style;
			}
		}
		
		line = makeLinks(line, this.settings.settings.chatNickColor);
		
		newNode = domConstruct.create('div', {
			style:{ display:'table-row' },
		}, toPlace )
		
		timeStampDiv= domConstruct.create('div', {
			innerHTML: timeStamp2 + '&nbsp;',
			style:{
				display:'table-cell',
				minWidth:'50px',
				whiteSpace:'nowrap',
			}
		}, newNode );
		lineSourceDiv = domConstruct.create('div', {
			innerHTML: sourceOut,
			style:lang.mixin( {
				display:'table-cell',
				minWidth:'50px',
				whiteSpace:'nowrap',
				textAlign:'right'
			}, sourceStyle )
		}, newNode );
		if( sourceLink )
		{
			selectLink = domConstruct.create('a', {
				innerHTML:sourceOut,
				style:lang.mixin( {
					color:this.settings.settings.chatTextColor,
					textDecoration:'none'
				}, sourceStyle ),
				href:'#',
				onclick:lang.hitch(this, function(e){
					event.stop(e);
					this.playerListNode.selectUser(source)
				})
			}, lineSourceDiv, 'only' );
		}
		
		lineMessageDiv = domConstruct.create('div', {
			innerHTML: line,
			style:lang.mixin( {
				display:'table-cell',
			}, style ),
			class : className ? className : ''
		}, newNode );
		
		//fixme: hidden join/leaves will cause confusing removal of chat lines
		while( toPlace.children.length > this.maxLines )
		{
			domConstruct.destroy( toPlace.firstChild );
		}
		this.scrollToBottom(newNode);
	},
	
	'playerMessage':function( data )
	{
		var pname, msg, lineClass, nameStyle, nameClass, timeStamp;
		var source;
		
		if(data.channel !== this.name && data.userWindow !== this.name && data.battle === undefined )
		{
			return;
		}
		
		msg = data.msg;
		msg = dojox.html.entities.encode(msg);
		pname = data.name;
		
		source = pname;
		
		lineClass = '';
		
		if(data.ex)
		{
			lineClass = 'chatAction';
		}
		else if(pname == this.nick)
		{
			lineClass = 'chatMine';
		}
		
		timeStamp = data.time ? data.time : false;
		
		this.addLine( msg, lineClass, timeStamp, source );
	},
	
	//because .search treats [] as though it's a character class for a regular expression, even if the parameter is a plain string!?
	'convertedNick':function()
	{
		return this.nick.toLowerCase().replace( /\[/, '\\[' ).replace( /\]/, '\\]' )
	},
	
	//stupid hax
	'resizeAlready':function()
	{
		this.mainContainer.resize();
		this.resizeAlready2();
	},
	'resizeAlready2':function()
	{
	},
	
	'startup2':function()
	{
		//sucky hax
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.mainContainer.startup();
		}
	},

	'blank':null
}); }); //declare lwidgets.Chatroom
