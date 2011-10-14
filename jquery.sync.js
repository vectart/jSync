/*
 * jQuery Sync Data Plugin v1.0
 *
 * Instantly sync and store data between all website pages.
 * Set value in current window and get it by event in all opened.
 *
 * DEPENDENCIES
 *
 * - jquery.js - jquery.com
 *
 * - jquery.diff.js - code.google.com/p/jquery-diff/
 *
 * - jquery.cookie.js - github.com/carhartl/jquery-cookie
 *
 *   if you prefer to use another storage from cookie, exclude Cookie plugin 
 *   and set own object to jQuery.syncStorage (see example of it below)
 *
 *
 * EXAMPLES
 *
 * $.sync()  returns data.
 * $.sync({ a: 1, b: 2 })  extends data by new object.
 *
 * $.sync.a  return value of `a` key.
 * $.sync.a = 1  apply value to `a` key.
 * $.sync.a = null  delete `a` key.
 *
 * $.sync(null)
 * $.sync(false)  clear object.
 *
 *
 * EVENTS
 * 
 * $(window).bind('sync', function(e, data){})  Bind event for changes and init
 * $(window).bind('sync:a', function(e, value){})  Bind event for changes or init of `a` key
 * 
 * 
 * Copyright 2011, Marat Dyatko / Ostrovok.ru
 * Dual licensed under the MIT or GPL Version 3 licenses.
*/

var window = window,
	jQuery = jQuery;

(function (jQuery, window) {
	'use strict';
	var engine, simplestorage, data;

	jQuery.__sync__ = function (settings) {
		var __engine__;

		settings = $.extend({
			name: 'sync',
			delay: 100,
			storage: simplestorage,
			expires: 30,
			path: '/'
		}, settings);

		__engine__ = new engine();
		__engine__.settings = settings;
		__engine__.name = settings.name;
		__engine__.storage = settings.storage;
		__engine__.data = jQuery.proxy(new data, __engine__);

		jQuery[__engine__.name] = __engine__.data;

		__engine__.sync();
	};

	data = function() {
		return function(obj) {
			var key;

			// apply something
			if (typeof obj === 'object') {
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						this.apply(key, obj[key]);
					}
				}
			}

			// or clear
			if (obj === null || obj === false) {
				for (key in sync) {
					if (sync.hasOwnProperty(key)) {
						this.apply(key, null);
					}
				}
			}

			return this.value();			
		}
	};

	simplestorage = {
		// get json
		get: function (settings) {
			return jQuery.cookie(settings.name);
		},
		// set json
		set: function (settings, json) {
			return jQuery.cookie(settings.name, json, settings);
		}
	};

	engine = function(){};
	engine.prototype.value = function () {
		return jQuery.extend(true, {}, this.data);
	};
	engine.prototype.last = {};

	// fetch and save JSON to storage
	engine.prototype.sync = function () {
		// fetch and check diff
		var json = this.storage.get(this.settings);

		if (json !== JSON.stringify(this.value())) {
			this.parse(JSON.parse(json));
			this.storage.set(this.settings, JSON.stringify(this.value()));
		}

		window.setTimeout(jQuery.proxy(this.sync, this), this.delay);
	};

	// check diff and save as last
	engine.prototype.parse = function (obj) {
		var cnt = 0;

		// merge data from cookie
		cnt = cnt + this.merge(this.last, obj);

		// merge local data
		cnt = cnt + this.merge(this.last, this.value());
		
		this.last = this.value();

		if (cnt) {
			jQuery(window).trigger(this.name, this.value());
		}
	};

	// merge data
	engine.prototype.merge = function (older, newer) {
		var diff = jQuery.diff(older, newer),
		    cnt = 0,
		    value,
		    id, 
		    key;

		// check for diff
		for (id in diff) {
			if (diff.hasOwnProperty(id)) {
				for (key in diff[id]) {
					if (diff[id].hasOwnProperty(key)) {
						value = id === 'del' ? null : diff[id][key];
						this.apply(key, value);
						cnt = cnt + 1;
					}
				}
			}
		}

		return cnt;
	};

	// apply or delete values to main object
	engine.prototype.apply = function (key, value) {
		if (value === null) {
			delete this.data[key];
		} else {
			this.data[key] = value;
		}
		jQuery(window).trigger(this.name + ':' + key, value);
	};

	new jQuery.__sync__();

}(jQuery, window));

