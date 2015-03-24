/** @jsx React.DOM
 *
 * An item in the UserList. It shows as much data as you give it, the only
 * required data field is user.name
 */

'use strict'

var _ = require('lodash');
var ModalWindow = require('comp/ModalWindow.jsx');
var Chat = require('act/Chat.js');

module.exports = React.createClass({
	getInitialState: function(){
		return { displayingInfo: false };
	},
	handleClick: function(){
		this.setState({ displayingInfo: true });
	},
	handleClose: function(){
		this.setState({ displayingInfo: false });
	},
	timeDifference: function(t1, t0){
		var diff = Math.floor((t1 - t0) / 60000);
		return (Math.floor(diff / 60) > 0 ? Math.floor(diff / 60) + ' hours ' : '') + (diff % 60) + ' minutes';
	},
	renderInfoBox: function(){
		var user = this.props.user;
		var now = new Date();
		return (<ModalWindow title="User info" onClose={this.handleClose}>
		<div className="userInfoBox">
			<h1>{user.name}</h1>
			{user.away && user.awaySince ?
				<p><img src="img/away.png" />Away for {this.timeDifference(now, user.awaySince)}</p>
			: null}
			{user.inGame && user.inGameSince ?
				<p><img src="img/battle.png" />In game for {this.timeDifference(now, user.inGameSince)}</p>
			: null}
			<p>
				<button onClick={_.partial(Chat.openPrivate, user.name)}>Open private conversation</button>
				<button>Join user's battle</button>
			</p>
		</div></ModalWindow>);
	},
	render: function(){
		var user = {
			cpu: 0,
		};
		_.extend(user, this.props.user);
		var frontPics = [];
		var backPics = [];

		// Country
		if (user.country)
			frontPics.push(<img src={'img/flags/' + user.country.toLowerCase() + '.png'} key="country" />);

		// Is a bot?
		if (user.botType)
			frontPics.push(<img src="img/robot.png" key="bot" />);

		// Has a side icon.
		if ('sideIcon' in user)
			frontPics.push(<img src={user.sideIcon} key="side" />);

		if (('synced' in user) && !user.synced)
			frontPics.push(<img src={'img/warning.png'} key="synced" width={14} height={14} title="User hasn't downloaded engine, game or map." />);

		// Away
		if (user['away'])
			backPics.push(<img src="img/away.png" key="away" />);

		// In game
		if (user['inGame'])
			backPics.push(<img src="img/battle.png" key="inGame" />);

		// Lobby
		if (user.lobby === 'swl')
			backPics.push(<img src = "img/blobby2icon-small.png" title = "Spring Web Lobby" key="lobby" />);
		else if (user.lobby === 'zkl')
			backPics.push(<img src = "img/zk_logo_square.png" title = "Zero-K Lobby" key="lobby" />);
		else if (user.lobby === 'notalobby')
			backPics.push(<img src = "img/notalobby.png" title = "NotaLobby" key="lobby" />);
		else if (user.lobby === 'mlclient')
			backPics.push(<img src = "img/mlclient.ico" title = "mlclient" key="lobby" />);
		else if (user.lobby === 'flobby')
			backPics.push(<img src = "img/flobby.png" title = "flobby" key="lobby" />);

		// OS
		if (user.os === 'windows')
			backPics.push(<img src="img/windows.png" title = "Microsoft Windows" key="os" />);
		else if (user.os === 'linux')
			backPics.push(<img src="img/linux.png" title = "Linux" key="os" />);
		else if (user.os === 'mac')
			backPics.push(<img src="img/mac.png" title = "MacOS" key="os" />);

		return (<li className="userItem">
			<span className="userFrontPics">{frontPics}</span>
			<span className="userName" onClick={this.handleClick}>{user.name}</span>
			<span className="userBackPics">{backPics}</span>
			{this.state.displayingInfo ? this.renderInfoBox() : null}
		</li>);
	}
});
