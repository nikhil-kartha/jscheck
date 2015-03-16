(function (enyo, scope) {

	/**
	* @private
	*/
	enyo.dispatcher.features.push(
		function(e) {
			// NOTE: beware of properties in enyo.gesture inadvertently mapped to event types
			if (enyo.gesture.drag[e.type]) {
				return enyo.gesture.drag[e.type](e);
			}
		}
	);


	enyo.gesture.drag =
		/** @lends enyo.gesture.drag */ {

		/**
		* @private
		*/
		holdPulseDefaultConfig: {
			frequency: 200,
			events: [{name: 'hold', time: 200}],
			resume: false,
			moveTolerance: 16,
			endHold: 'onMove'
		},


		configureHoldPulse: function(config) {
			// TODO: Might be nice to do some validation, error handling
			this.holdPulseDefaultConfig = config;
		},

		/**
		* @private
		*/
		holdPulseConfig: {},


		/**
		* Translate the old format for holdPulseConfig to the new one, to
		* preserve backward compatibility.
		*
		* @private
		*/
		normalizeHoldPulseConfig: function (oldOpts) {
			var nOpts = enyo.clone(oldOpts);
			nOpts.frequency = nOpts.delay;
			nOpts.events = [{hold: nOpts.delay}]; // BAD/BUG
            //nOpts.events = [{name: 'hold', time: nOpts.delay}]; // GOOD/FIX
			return nOpts;
		},

		/**
		* Method to override holdPulseConfig for a given gesture. This method isn't
		* accessed directly from enyo.gesture.drag, but exposed by the `down` event.
		* See `prepareHold()`.
		*
		* @private
		*/
		_configureHoldPulse: function(opts) {
			var nOpts = (opts.delay === undefined) ?
				opts :
				this.normalizeHoldPulseConfig(opts);
			enyo.mixin(this.holdPulseConfig, nOpts);
		},

		/**
		* @private
		*/
		prepareHold: function(e) {
			// quick copy as the prototype of the new overridable config
			this.holdPulseConfig = enyo.clone(this.holdPulseDefaultConfig, true);

			// expose method for configuring holdpulse options
			e.configureHoldPulse = this._configureHoldPulse.bind(this);
		},


	};

})(enyo, this);
