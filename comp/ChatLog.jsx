'use strict'

require('style/ChatLog.sass');
var _ = require('lodash');
var MsgType = require('store/Chat.js').MsgType;
var Log = require('act/Log.js');

function getLastId(log){
	return log.length > 0 ? log[log.length - 1].id : NaN;
}

// TODO: Find a proper way to silence warnings instead of uniqueId(). Setting
// the keys to null is supposed to work but for some reason doesn't.

// The usage of this.scrollToBottom below is hacky (since the proper way to do
// that is to make it part of this.state), but calling this.setState() to
// change it would cause a re-render and make scrolling hitchy for logs longer
// than 1000 messages. When this is rewritten with lazy rendering,
// scrollToBottom may go into it's proper place in the state.

module.exports = React.createClass({
	displayName: 'ChatLog',
	getInitialState: function(){
		return { lastId: NaN };
	},
	componentWillReceiveProps: function(props){
		this.setState({ lastId: getLastId(this.props.log) });
		// Scroll to bottom if we switch to another channel. The log array gets
		// updated in-place so the reference doesn't change when new messages
		// are added.
		if (this.props.log !== props.log)
			this.scrollToBottom = true;
	},
	shouldComponentUpdate: function(props, state){
		return this.state.lastId !== getLastId(props.log);
	},
	componentDidMount: function(){
		this.scrollToBottom = true;
		this.componentDidUpdate();
	},
	componentDidUpdate: function(){
		if (this.scrollToBottom){
			var node = this.getDOMNode();
			node.scrollTop = node.scrollHeight - node.clientHeight;
		}
	},
	handleClick: function(){
		if (window.getSelection().toString() === "")
			this.props.onClick();
	},
	handleScroll: function(evt){
		var node = this.getDOMNode();
		if (node.scrollTop > node.scrollHeight - node.clientHeight * 1.2)
			this.scrollToBottom = true;
		else
			this.scrollToBottom = false;
	},
	handleJoinUserBattle: function(user, evt){
		evt.preventDefault();
		this.props.onJoinUserBattle(user);
	},
	mircToHtml: function(text){
		// \x03 - color, \x0f - reset, \x02 - bold, \x1f - underline, \x1d - italic.
		var startPos;
		if ((startPos = text.search(/\x03[0-9]{1,2}|\x02|\x1f|\x1d/)) >= 0) {
			var before = text.slice(0, startPos);
			var after = text.slice(startPos);
			// Treat plain \x03 as a complete, not only color, reset character.
			var endPos = after.search(/\x03([^0-9]|$)|\x0f/);
			var rest = endPos < 0 ? "" : after.slice(endPos + 1);
			if (endPos < 0)
				endPos = after.length;
			var match = after.slice(0, endPos);
			var ts = {
				'\x02': function(a){ return <b key={_.uniqueId('t')}>{a}</b> },
				'\x1f': function(a){ return <u key={_.uniqueId('t')}>{a}</u> },
				'\x1d': function(a){ return <i key={_.uniqueId('t')}>{a}</i> }
			};
			var colorRegExp = /^\x03([0-9]{1,2})(,([0-9]{1,2}))?/g;
			var formatRegExp = /^\x02|\x1f|\x1d/g;
			var res, tag = _.identity;
			if ((res = colorRegExp.exec(match))) {
				tag = function(a){
					return <span className={"mircFg" + parseInt(res[1]) + (res[3] ? " mircBg" + parseInt(res[3]) : "")} key={_.uniqueId('t')}>{a}</span>;
				}
			} else if ((res = formatRegExp.exec(match))) {
				tag = ts[res[0]];
			} else {
				Log.warning("Error occured while parsing mIRC colors.");
			}
			return [before, tag(this.mircToHtml(match.slice(Math.max(colorRegExp.lastIndex, formatRegExp.lastIndex)))), this.mircToHtml(rest)];
		}
		else
			return text;
	},
	addTags: function(text, regex, onMatch, onRest){
		var res = [];
		var match;
		while ((match = regex.exec(text))) {
			var firstIndex = text.search(regex);
			res.push(onRest(text.slice(0, firstIndex)));
			res.push(onMatch(match[0]));
			text = text.slice(regex.lastIndex);
			regex.lastIndex = 0;
		}
		res.push(onRest(text));
		return res;
	},
	renderMessage: function(message){
		// Add links.
		return this.addTags(message, /(\b(www\.|(https?|ftp|file|spring|zk):\/\/)([^\s(]*[^\s.,;:!()]|\([^)]*\))+)/ig,
		function(text){
			var match;
			if ((match = text.match(/(spring|zk):\/\/@join_player:(.+)/))) {
				return <a key={_.uniqueId('t')} href='#'
					onClick={_.partial(this.handleJoinUserBattle, match[2])}>{text}</a>;
			} else {
				return <a target='_blank' key={_.uniqueId('t')} href={text}>{text}</a>;
			}
		}.bind(this), function(text){
			// Add name highlight.
			return this.addTags(text, new RegExp(this.props.nick, 'ig'), function(text){
				return <span className="nickHighlight">{text}</span>;
			}, function(text){
				return this.mircToHtml(text);
			}.bind(this));
		}.bind(this));
	},
	renderEntry: function(entry){
		var authorClass = 'chatAuthor';
		var messageClass = 'chatMessage';
		var author = (entry.author === this.lastAuthor ? '' : entry.author);
		var message = entry.message;
		this.lastAuthor = entry.author;

		if (entry.type === MsgType.ME){
			this.lastAuthor = '';
			author = '*';
			message = entry.author + ' ' + entry.message;
			authorClass += ' chatSlashMe';
			messageClass += ' chatSlashMe';
		}
		return (<div className="chatEntry" key={entry.id}>
			<div className="chatTimestamp">{entry.date.toLocaleTimeString().replace(/ [A-Z][A-Z][A-Z].*$/, '')}</div>
			<div className={authorClass}>{author}</div>
			<div className={messageClass}>{this.renderMessage(message)}</div>
		</div>);
	},
	
	render: function(){
		var log = this.props.log;
		var unread = this.props.unread;
		this.lastAuthor = '';
		return (<div className="chatLog" onScroll={this.handleScroll} onClick={this.handleClick}>
			{log.slice(0, log.length - unread).map(this.renderEntry)}
			{unread > 0 && <hr />}
			{log.slice(log.length - unread).map(this.renderEntry)}
		</div>)
	}
});
