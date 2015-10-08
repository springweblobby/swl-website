/*
 * This module provides mixins similar to Reflux.listenTo/connect, only for
 * stores that get passed in as props.
 */

var _ = require('lodash');
var Reflux = require('reflux');

function storePropValidator(props, propName, componentName) {
	var prop = props[propName];
	if (!prop)
		return new Error(componentName + ' prop ' + propName + ' is missing.');
	if (typeof prop.listen !== 'function' || typeof prop.listenTo !== 'function')
		return new Error(componentName + ' prop ' + propName + ' is not a Reflux store.');
}

// Listen to a store.
//  storePropName (string) - name of the prop for the store.
//  handler (function|string) - function or name of a component method.
exports.listenTo = function(storePropName, handler){
	var propTypes = {};
	propTypes[storePropName] = storePropValidator;
	return {
		propTypes: propTypes,
		componentDidMount: function(){
			_.extend(this, Reflux.ListenerMethods);
			if (typeof handler === 'function')
				this.listenTo(this.props[storePropName], handler, handler);
			else
				this.listenTo(this.props[storePropName], this[handler], this[handler]);
		},
		componentWillUnmount: Reflux.ListenerMixin.componentWillUnmount
	};
};

// Connect component state with a store.
//  storePropName (string) - name of the prop for the store.
//  propertyOfState (string) - property of this.state that should be updated with
//      new store state, if left empty or undefined this.state itself will be used.
//  filter (string|array of strings) - if an array, only properties named in the array
//      will be taken when updating, if a string, the property will be "plucked" from store state.
//
// Examples for a store that updates with { foo: 1, bar: {}, baz: 3 }:
//  connect('myStore') results in setState({ foo: 1, bar: {}, baz: 3 })
//  connect('myStore', 'myStoreState') -> setState({ myStoreState: { foo: 1, bar: {}, baz: 3 } })
//  connect('myStore', '', ['foo', 'baz']) -> setState({ foo: 1, baz: 3 })
//  connect('myStore', 'asdf', 'bar') -> setState({ asdf: {} })
exports.connect = function(storePropName, propertyOfState, filter){

	var filterFunc;
	if (filter === undefined)
		filterFunc = _.identity;
	else if (typeof filter === 'string')
		filterFunc = _.partialRight(_.pluck, filter);
	else
		filterFunc = _.partialRight(_.pick, filter);

	var propTypes = {};
	propTypes[storePropName] = storePropValidator;

	return {
		propTypes: propTypes,
		getInitialState: function(){
			var state = {};
			if (propertyOfState) // non-empty string
				state[propertyOfState] = filterFunc(this.props[storePropName].getInitialState());
			else
				state = filterFunc(this.props[storePropName].getInitialState());
			return state;
		},
		componentDidMount: function(){
			_.extend(this, Reflux.ListenerMethods);
			if (propertyOfState) {
				this.listenTo(this.props[storePropName], function(state){
					var newState = {};
					newState[propertyOfState] = filterFunc(state);
					this.setState(newState);
				}.bind(this));
			} else {
				this.listenTo(this.props[storePropName], _.compose(this.setState, filterFunc));
			}
		},
		componentWillUnmount: Reflux.ListenerMixin.componentWillUnmount
	};
};
