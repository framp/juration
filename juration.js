/*
 * juration - a natural language duration parser
 * https://github.com/domchristie/juration
 *
 * Copyright 2011, Dom Christie
 * Licenced under the MIT licence
 *
 */

(function() {

  var UNITS = {
	milliseconds: {
		patterns: ['millisecond', 'mil', 'ms'],
		value: 0.001,
		formats: {
			'chrono': ':',
			'micro':  'ms',
			'short':  'mil',
			'long':   'millisecond',
			'plural': 'milliseconds'
		}
	},
    seconds: {
      patterns: ['second', 'sec', 's'],
      value: 1,
      formats: {
        'chrono': ':',
        'micro':  's',
        'short':  'sec',
        'long':   'second',
        'plural': 'seconds'
      }
    },
    minutes: {
      patterns: ['minute', 'min', 'm(?!s)'],
      value: 60,
      formats: {
        'chrono': ':',
        'micro':  'm',
        'short':  'min',
        'long':   'minute',
        'plural': 'minutes'
      }
    },
    hours: {
      patterns: ['hour', 'hr', 'h'],
      value: 3600,
      formats: {
        'chrono': ':',
        'micro':  'h',
        'short':  'hr',
        'long':   'hour',
        'plural': 'hours'
      }
    },
    days: {
      patterns: ['day', 'dy', 'd'],
      value: 86400,
      formats: {
        'chrono': ':',
        'micro':  'd',
        'short':  'day',
        'long':   'day',
        'plural': 'days'
      }
    },
    weeks: {
      patterns: ['week', 'wk', 'w'],
      value: 604800,
      formats: {
        'chrono': ':',
        'micro':  'w',
        'short':  'wk',
        'long':   'week',
        'plural': 'weeks'
      }
    },
    months: {
      patterns: ['month', 'mon', 'mo', 'mth'],
      value: 2592000,
      formats: {
        'chrono': ':',
        'micro':  'm',
        'short':  'mth',
        'long':   'month',
        'plural': 'months'
      }
    },
    years: {
      patterns: ['year', 'yr', 'y'],
      value: 31536000,
      formats: {
        'chrono': ':',
        'micro':  'y',
        'short':  'yr',
        'long':   'year',
        'plural': 'years'
      }
    }
  };
    
  var stringify = function(seconds, options) {
    
    if(!_isNumeric(seconds)) {
      throw "juration.stringify(): Unable to stringify a non-numeric value";
    }
    
    if((typeof options === 'object' && options.format !== undefined) && (options.format !== 'micro' && options.format !== 'short' && options.format !== 'long' && options.format !== 'chrono')) {
      throw "juration.stringify(): format cannot be '" + options.format + "', and must be either 'micro', 'short', or 'long'";
    }
    
    var defaults = {
      format: 'long'
    };
    
    var opts = _extend(defaults, options);
    
    var units = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'], values = [];
    for(var i = 0, len = units.length; i < len; i++) {
      if(i === 0) {
        values[i] = Math.floor(seconds / UNITS[units[i]].value);
      }
      else {
        values[i] = Math.floor((seconds % UNITS[units[i-1]].value) / UNITS[units[i]].value);
      }
      if(opts.format === 'micro' || opts.format === 'chrono') {
        values[i] += UNITS[units[i]].formats[opts.format];
      }
      else {
        var singular = UNITS[units[i]].formats[opts.format],
            plural = opts.format === 'long' ? 
                      UNITS[units[i]].formats['plural'] :
                      '';
        values[i] += ' ' + _pluralize(values[i], singular, plural);
      }
    }
    var output = '';
    for(i = 0, len = values.length; i < len; i++) {
      if(values[i].charAt(0) !== "0" && opts.format != 'chrono') {
        output += values[i] + ' ';
      }
      else if (opts.format == 'chrono') {
        output += _padLeft(values[i]+'', '0', i==values.length-1 ? 2 : 3);
      }
    }
    return output.replace(/\s+$/, '').replace(/^(00:)+/g, '').replace(/^0/, '');
  };
  
  var parse = function(string) {
    
    // returns calculated values separated by spaces
    for(var unit in UNITS) {
      for(var i = 0, mLen = UNITS[unit].patterns.length; i < mLen; i++) {
        var regex = new RegExp("((?:\\d+\\.\\d+)|\\d+)\\s?(" + UNITS[unit].patterns[i] + "s?(?=\\s|\\d|\\b))", 'gi');
        string = string.replace(regex, function(str, p1, p2) {
          return " " + (p1 * UNITS[unit].value).toString() + " ";
        });
      }
    }
    
    var sum = 0,
        numbers = string
                    .replace(/(?!\.)\W+/g, ' ')                       // replaces non-word chars (excluding '.') with whitespace
                    .replace(/^\s+|\s+$|(?:and|plus|with)\s?/g, '')   // trim L/R whitespace, replace known join words with ''
                    .split(' ');
    
    for(var j = 0, nLen = numbers.length; j < nLen; j++) {
      if(numbers[j] && isFinite(numbers[j])) {
         sum += parseFloat(numbers[j]);
      } else if(!numbers[j]) {
        throw "juration.parse(): Unable to parse: a falsey value";
      } else {
        // throw an exception if it's not a valid word/unit
        throw "juration.parse(): Unable to parse: " + numbers[j].replace(/^\d+/g, '');
      }
    }
    return sum;
  };
  
  // _padLeft('5', '0', 2); // 05
  var _padLeft = function(s, c, n) {
      if (! s || ! c || s.length >= n) {
        return s;
      }
      
      var max = (n - s.length)/c.length;
      for (var i = 0; i < max; i++) {
        s = c + s;
      }
      
      return s;
  };
  
  var _pluralize = function(count, singular, plural) {
    return count == 1 ? singular : plural || singular + "s";
  };
  
  var _isNumeric = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };
  
  var _extend = function(obj, extObj) {
    for (var i in extObj) {
      if(extObj[i] !== undefined) {
        obj[i] = extObj[i];
      }
    }
    return obj;
  };
  
  var setLanguage = function(language){
    if (typeof require !== 'undefined'){
      require('./languages/' + language);
      return;
    }
  }
  
  var juration = {
    UNITS: UNITS,
    setLanguage: setLanguage,
    parse: parse,
    stringify: stringify,
    humanize: stringify
  };

  if ( typeof module === "object" && module && typeof module.exports === "object" ) {
    //loaders that implement the Node module pattern (including browserify)
    module.exports = juration;
  } else {
    // Otherwise expose juration
    window.juration = juration;

    // Register as a named AMD module
    if ( typeof define === "function" && define.amd ) {
      define("juration", [], function () { return juration; } );
    }
  }
})();
