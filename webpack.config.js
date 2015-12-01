var ExtractPlugin = require('extract-text-webpack-plugin');
var WebpackNotifierPlugin = require('webpack-notifier');
var path = require('path');


module.exports = {
	entry: './weblobby.jsx',
	output: {
		path: __dirname,
		filename: 'weblobby.bundle.js'
	},
	module: {
		loaders: [
			{ test: /\.jsx$/, loader: 'jsx' },
			{ test: /\.sass$/, loader: ExtractPlugin.extract('css!sass?indentedSyntax') },
			{ test: /\.(png|jpg|gif|svg)$/, loader: 'url?limit=10000&name=[path][name].[ext]' }
		]
	},
	resolve: {
		root: __dirname,
		alias: { 'weblobby': __dirname }
	},
	devtool: 'cheap-eval-source-map',
	plugins: [
		new ExtractPlugin('css/main.css', { allChunks: true }),
		new WebpackNotifierPlugin({title: 'SWL-Website',contentImage: path.join(__dirname, '/img/blobby2.png')}),
	]
};
