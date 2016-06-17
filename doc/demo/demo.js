(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":2}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it don't break things.
var cachedSetTimeout = setTimeout;
var cachedClearTimeout = clearTimeout;

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
'use strict'

const React = require('react')
const ReactDOM = require('react-dom')

const Demo = require('./demo.component.js').default

function onLoad () {
  window.removeEventListener('DOMContentLoaded', onLoad)
  window.React = React
  let DemoFactory = React.createFactory(Demo)
  ReactDOM.render(DemoFactory(), document.getElementById('demo-wrap'), () => {
    console.debug('Demo component mounted.')
  })
}

window.addEventListener('DOMContentLoaded', onLoad)

},{"./demo.component.js":4,"react":"react","react-dom":"react-dom"}],4:[function(require,module,exports){
'use strict';Object.defineProperty(exports,'__esModule',{value:true});var _react=require('react');var _react2=_interopRequireDefault(_react);var _ap_upload=require('../../lib/ap_upload');var _ap_upload2=_interopRequireDefault(_ap_upload);var _ap_upload_style=require('../../lib/ap_upload_style');var _ap_upload_style2=_interopRequireDefault(_ap_upload_style);var _apemanReactImage=require('apeman-react-image');var _apemanReactSpinner=require('apeman-react-spinner');var _apemanReactButton=require('apeman-react-button');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}var DEMO_IMAGES=['https://raw.githubusercontent.com/apeman-asset-labo/apeman-asset-images/master/dist/dummy/12.jpg'];var Demo=_react2.default.createClass({displayName:'Demo',render:function render(){var s=this;return _react2.default.createElement('div',null,_react2.default.createElement(_apemanReactSpinner.ApSpinnerStyle,null),_react2.default.createElement(_apemanReactButton.ApButtonStyle,{highlightColor:'#b35600'}),_react2.default.createElement(_apemanReactImage.ApImageStyle,null),_react2.default.createElement(_ap_upload_style2.default,null),_react2.default.createElement(_ap_upload2.default,{multiple:true,id:'demo-file-upload-01',name:'file-input-01',accept:'image/*',onLoad:s.handleLoaded}),_react2.default.createElement(_ap_upload2.default,{multiple:true,id:'demo-file-upload-02',name:'file-input-02',accept:'image/*',value:DEMO_IMAGES,onLoad:s.handleLoaded}))},handleLoaded:function handleLoaded(ev){console.log('result',ev.target,ev.urls)}});exports.default=Demo;

},{"../../lib/ap_upload":5,"../../lib/ap_upload_style":6,"apeman-react-button":"apeman-react-button","apeman-react-image":"apeman-react-image","apeman-react-spinner":"apeman-react-spinner","react":"react"}],5:[function(require,module,exports){
/**
 * apeman react package for file upload components.
 * @class ApUpload
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _apemanReactImage = require('apeman-react-image');

var _apemanReactSpinner = require('apeman-react-spinner');

var _apemanReactButton = require('apeman-react-button');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApUpload */
var ApUpload = _react2.default.createClass({
  displayName: 'ApUpload',


  // --------------------
  // Specs
  // --------------------

  propTypes: {
    /** Name of input */
    name: _react.PropTypes.string,
    /** DOM id of input */
    id: _react.PropTypes.string,
    /** Allow multiple upload */
    multiple: _react.PropTypes.bool,
    /** Handler for change event */
    onChange: _react.PropTypes.func,
    /** Handler for load event */
    onLoad: _react.PropTypes.func,
    /** Handler for error event */
    onError: _react.PropTypes.func,
    /** Image width */
    width: _react.PropTypes.number,
    /** Image height */
    height: _react.PropTypes.number,
    /** Guide text */
    text: _react.PropTypes.string,
    /** Accept file type */
    accept: _react.PropTypes.string,
    /** Guide icon */
    icon: _react.PropTypes.string,
    /** Icon for close images */
    closeIcon: _react.PropTypes.string,
    /** Spinner theme */
    spinner: _react.PropTypes.string,
    /** Value of input */
    value: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.array])
  },

  mixins: [],

  statics: {
    readFile: function readFile(file, callback) {
      var reader = new window.FileReader();
      reader.onerror = function onerror(err) {
        callback(err);
      };
      reader.onload = function onload(ev) {
        callback(null, ev.target.result);
      };
      reader.readAsDataURL(file);
    },
    isImageUrl: function isImageUrl(url) {
      var imageExtensions = ['.jpg', '.jpeg', '.svg', '.gif', '.png'];
      return (/^data:image/.test(url) || !! ~imageExtensions.indexOf(_path2.default.extname(url))
      );
    }
  },

  getInitialState: function getInitialState() {
    var s = this;
    var props = s.props;

    var hasValue = props.value && props.value.length > 0;
    return {
      spinning: false,
      error: null,
      urls: hasValue ? [].concat(props.value) : null
    };
  },
  getDefaultProps: function getDefaultProps() {
    return {
      name: null,
      id: 'ap-upload-' + _uuid2.default.v4(),
      multiple: false,
      width: 180,
      height: 180,
      accept: null,
      text: 'Upload file',
      icon: 'fa fa-cloud-upload',
      closeIcon: 'fa fa-close',
      spinnerIcon: _apemanReactSpinner.ApSpinner.DEFAULT_THEME,
      onChange: null,
      onLoad: null,
      onError: null
    };
  },
  render: function render() {
    var s = this;
    var state = s.state;
    var props = s.props;
    var width = props.width;
    var height = props.height;

    return _react2.default.createElement(
      'div',
      { className: (0, _classnames2.default)('ap-upload', props.className),
        style: Object.assign({}, props.style) },
      _react2.default.createElement('input', { type: 'file',
        className: 'ap-upload-input',
        multiple: props.multiple,
        name: props.name,
        id: props.id,
        accept: props.accept,
        onChange: s.handleChange,
        style: { width: width, height: height }
      }),
      _react2.default.createElement(
        'label',
        { className: 'ap-upload-label', htmlFor: props.id },
        _react2.default.createElement('span', { className: 'ap-upload-aligner' }),
        _react2.default.createElement(
          'span',
          { className: 'ap-upload-label-inner' },
          _react2.default.createElement('i', { className: (0, _classnames2.default)("ap-upload-icon", props.icon) }),
          _react2.default.createElement(
            'span',
            { className: 'ap-upload-text' },
            props.text
          ),
          props.children
        )
      ),
      s._renderPreviewImage(state.urls, width, height),
      s._renderRemoveButton(!!(state.urls && state.urls.length > 0), props.closeIcon),
      s._renderSpinner(state.spinning, props.spinner)
    );
  },


  // --------------------
  // Lifecycle
  // --------------------

  // ------------------
  // Custom
  // ------------------

  handleChange: function handleChange(e) {
    var s = this;
    var props = s.props;
    var target = e.target;

    var files = Array.prototype.slice.call(target.files, 0);

    var onChange = props.onChange;
    var onError = props.onError;
    var onLoad = props.onLoad;


    s.setState({ spinning: true });
    if (onChange) {
      onChange(e);
    }
    _async2.default.concat(files, ApUpload.readFile, function (err, urls) {
      e.urls = urls;
      e.target = target;
      s.setState({
        spinning: false,
        error: err,
        urls: urls
      });
      if (err) {
        if (onError) {
          onError(err);
        }
      } else {
        if (onLoad) {
          onLoad(e);
        }
      }
    });
  },
  handleRemove: function handleRemove() {
    var s = this;
    var props = s.props;
    var onLoad = props.onLoad;

    s.setState({
      error: null,
      urls: null
    });
    if (onLoad) {
      onLoad([]);
    }
  },


  // ------------------
  // Private
  // ------------------

  _renderSpinner: function _renderSpinner(spinning, theme) {
    var s = this;
    return _react2.default.createElement(_apemanReactSpinner.ApSpinner, { enabled: spinning, theme: theme });
  },
  _renderRemoveButton: function _renderRemoveButton(removable, icon) {
    var s = this;
    if (!removable) {
      return null;
    }
    return _react2.default.createElement(
      _apemanReactButton.ApButton,
      { onTap: s.handleRemove, className: 'ap-upload-remove-button' },
      _react2.default.createElement('i', { className: (0, _classnames2.default)("ap-upload-remove-icon", icon) })
    );
  },
  _renderPreviewImage: function _renderPreviewImage(urls, width, height) {
    if (!urls) {
      return null;
    }
    var s = this;
    return urls.filter(function (url) {
      return ApUpload.isImageUrl(url);
    }).map(function (url, i) {
      return _react2.default.createElement(_apemanReactImage.ApImage, { key: url,
        src: url,
        height: height,
        width: width,
        className: (0, _classnames2.default)('ap-upload-preview-image'),
        style: { left: i * 10 + '%', top: i * 10 + '%' },
        scale: 'fit' });
    });
  }
});

exports.default = ApUpload;

},{"apeman-react-button":"apeman-react-button","apeman-react-image":"apeman-react-image","apeman-react-spinner":"apeman-react-spinner","async":"async","classnames":7,"path":1,"react":"react","uuid":"uuid"}],6:[function(require,module,exports){
/**
 * Style for ApUpload.
 * @class ApUploadStyle
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _apemanReactStyle = require('apeman-react-style');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApUploadStyle */
var ApUploadStyle = _react2.default.createClass({
  displayName: 'ApUploadStyle',

  propTypes: {
    style: _react.PropTypes.object,
    highlightColor: _react.PropTypes.string,
    backgroundColor: _react.PropTypes.string
  },
  getDefaultProps: function getDefaultProps() {
    return {
      style: {},
      highlightColor: _apemanReactStyle.ApStyle.DEFAULT_HIGHLIGHT_COLOR,
      backgroundColor: _apemanReactStyle.ApStyle.DEFAULT_BACKGROUND_COLOR
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;
    var highlightColor = props.highlightColor;
    var backgroundColor = props.backgroundColor;


    var data = {
      '.ap-upload': {
        position: 'relative',
        display: 'inline-block',
        color: '#888',
        overflow: 'hidden'
      },
      '.ap-upload:hover': {
        color: '#555'
      },
      '.ap-upload:active': {
        textShadow: 'none',
        opacity: 1,
        color: '#777'
      },
      '.ap-upload-label': {
        position: 'absolute',
        zIndex: 1,
        textAlign: 'center',
        boxSizing: 'border-box',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        backgroundColor: '' + backgroundColor,
        boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.33)',
        border: '1px solid #CCC',
        borderRadius: '2px'
      },
      '.ap-upload-input': {
        opacity: 0,
        display: 'inline-block',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 2
      },
      '.ap-upload-icon': {
        display: 'block',
        fontSize: '2em'
      },
      '.ap-upload-label-inner': {
        display: 'inline-block',
        verticalAlign: 'middle'
      },
      '.ap-upload-aligner': {
        display: 'inline-block',
        width: '1px',
        marginRight: '-1px',
        height: '100%',
        boxSizing: 'border-box',
        verticalAlign: 'middle'
      },
      '.ap-upload .ap-spinner': {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 8,
        backgroundColor: '' + backgroundColor,
        color: '#DDD'
      },
      '.ap-upload-preview-image': {
        display: 'inline-block',
        boxSizing: 'border-box',
        zIndex: 4,
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        border: '1px solid #AAA'
      },
      '.ap-upload-remove-button': {
        display: 'inline-block',
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 5,
        margin: 0,
        border: 'none',
        padding: '8px',
        fontSize: '24px',
        color: '#AAA',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: 0
      },
      '.ap-upload-remove-button:hover': {
        opacity: 1,
        boxShadow: 'none',
        color: '#555'
      },
      '.ap-upload-remove-button:active': {
        opacity: 1,
        boxShadow: 'none',
        color: '#555'
      }
    };
    var smallMediaData = {};
    var mediumMediaData = {};
    var largeMediaData = {};
    return _react2.default.createElement(
      _apemanReactStyle.ApStyle,
      { data: Object.assign(data, props.style),
        smallMediaData: smallMediaData,
        mediumMediaData: mediumMediaData,
        largeMediaData: largeMediaData
      },
      props.children
    );
  }
});

exports.default = ApUploadStyle;

},{"apeman-react-style":"apeman-react-style","react":"react"}],7:[function(require,module,exports){
/*!
  Copyright (c) 2016 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg)) {
				classes.push(classNames.apply(null, arg));
			} else if (argType === 'object') {
				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = classNames;
	} else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		// register as 'classnames', consistent with npm package name
		define('classnames', [], function () {
			return classNames;
		});
	} else {
		window.classNames = classNames;
	}
}());

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4yLjEvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8ubnZtL3ZlcnNpb25zL25vZGUvdjYuMi4xL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwiLi4vLi4vLi4vLm52bS92ZXJzaW9ucy9ub2RlL3Y2LjIuMS9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsImRvYy9kZW1vL2RlbW8uYnJvd3Nlci5qcyIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2RvYy9kZW1vL2RlbW8uY29tcG9uZW50LmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2xpYi9hcF91cGxvYWQuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC11cGxvYWQvbGliL2FwX3VwbG9hZF9zdHlsZS5qc3giLCJub2RlX21vZHVsZXMvY2xhc3NuYW1lcy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0IGRvbid0IGJyZWFrIHRoaW5ncy5cbnZhciBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG5cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IGNhY2hlZFNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNhY2hlZENsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpXG5jb25zdCBSZWFjdERPTSA9IHJlcXVpcmUoJ3JlYWN0LWRvbScpXG5cbmNvbnN0IERlbW8gPSByZXF1aXJlKCcuL2RlbW8uY29tcG9uZW50LmpzJykuZGVmYXVsdFxuXG5mdW5jdGlvbiBvbkxvYWQgKCkge1xuICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIG9uTG9hZClcbiAgd2luZG93LlJlYWN0ID0gUmVhY3RcbiAgbGV0IERlbW9GYWN0b3J5ID0gUmVhY3QuY3JlYXRlRmFjdG9yeShEZW1vKVxuICBSZWFjdERPTS5yZW5kZXIoRGVtb0ZhY3RvcnkoKSwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbW8td3JhcCcpLCAoKSA9PiB7XG4gICAgY29uc29sZS5kZWJ1ZygnRGVtbyBjb21wb25lbnQgbW91bnRlZC4nKVxuICB9KVxufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIG9uTG9hZClcbiIsIid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgQXBVcGxvYWQgZnJvbSAnLi4vLi4vbGliL2FwX3VwbG9hZCdcbmltcG9ydCBBcFVwbG9hZFN0eWxlIGZyb20gJy4uLy4uL2xpYi9hcF91cGxvYWRfc3R5bGUnXG5pbXBvcnQge0FwSW1hZ2VTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LWltYWdlJ1xuaW1wb3J0IHtBcFNwaW5uZXJTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXNwaW5uZXInXG5pbXBvcnQge0FwQnV0dG9uU3R5bGV9IGZyb20gJ2FwZW1hbi1yZWFjdC1idXR0b24nXG5cbmNvbnN0IERFTU9fSU1BR0VTID0gW1xuICAnaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2FwZW1hbi1hc3NldC1sYWJvL2FwZW1hbi1hc3NldC1pbWFnZXMvbWFzdGVyL2Rpc3QvZHVtbXkvMTIuanBnJ1xuXVxuXG5jb25zdCBEZW1vID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxBcFNwaW5uZXJTdHlsZSAvPlxuICAgICAgICA8QXBCdXR0b25TdHlsZSBoaWdobGlnaHRDb2xvcj1cIiNiMzU2MDBcIi8+XG4gICAgICAgIDxBcEltYWdlU3R5bGUgLz5cbiAgICAgICAgPEFwVXBsb2FkU3R5bGUgLz5cbiAgICAgICAgPEFwVXBsb2FkIG11bHRpcGxlPXsgdHJ1ZSB9XG4gICAgICAgICAgICAgICAgICBpZD1cImRlbW8tZmlsZS11cGxvYWQtMDFcIlxuICAgICAgICAgICAgICAgICAgbmFtZT1cImZpbGUtaW5wdXQtMDFcIlxuICAgICAgICAgICAgICAgICAgYWNjZXB0PVwiaW1hZ2UvKlwiXG4gICAgICAgICAgICAgICAgICBvbkxvYWQ9eyBzLmhhbmRsZUxvYWRlZCB9PlxuICAgICAgICA8L0FwVXBsb2FkPlxuXG4gICAgICAgIDxBcFVwbG9hZCBtdWx0aXBsZT17IHRydWUgfVxuICAgICAgICAgICAgICAgICAgaWQ9XCJkZW1vLWZpbGUtdXBsb2FkLTAyXCJcbiAgICAgICAgICAgICAgICAgIG5hbWU9XCJmaWxlLWlucHV0LTAyXCJcbiAgICAgICAgICAgICAgICAgIGFjY2VwdD1cImltYWdlLypcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9eyBERU1PX0lNQUdFUyB9XG4gICAgICAgICAgICAgICAgICBvbkxvYWQ9eyBzLmhhbmRsZUxvYWRlZCB9PlxuICAgICAgICA8L0FwVXBsb2FkPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuICBoYW5kbGVMb2FkZWQgKGV2KSB7XG4gICAgY29uc29sZS5sb2coJ3Jlc3VsdCcsIGV2LnRhcmdldCwgZXYudXJscylcbiAgfVxufSlcblxuZXhwb3J0IGRlZmF1bHQgRGVtb1xuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3IgZmlsZSB1cGxvYWQgY29tcG9uZW50cy5cbiAqIEBjbGFzcyBBcFVwbG9hZFxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcbmltcG9ydCBhc3luYyBmcm9tICdhc3luYydcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgdXVpZCBmcm9tICd1dWlkJ1xuaW1wb3J0IHtBcEltYWdlfSBmcm9tICdhcGVtYW4tcmVhY3QtaW1hZ2UnXG5pbXBvcnQge0FwU3Bpbm5lcn0gZnJvbSAnYXBlbWFuLXJlYWN0LXNwaW5uZXInXG5pbXBvcnQge0FwQnV0dG9ufSBmcm9tICdhcGVtYW4tcmVhY3QtYnV0dG9uJ1xuXG4vKiogQGxlbmRzIEFwVXBsb2FkICovXG5jb25zdCBBcFVwbG9hZCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIC8qKiBOYW1lIG9mIGlucHV0ICovXG4gICAgbmFtZTogdHlwZXMuc3RyaW5nLFxuICAgIC8qKiBET00gaWQgb2YgaW5wdXQgKi9cbiAgICBpZDogdHlwZXMuc3RyaW5nLFxuICAgIC8qKiBBbGxvdyBtdWx0aXBsZSB1cGxvYWQgKi9cbiAgICBtdWx0aXBsZTogdHlwZXMuYm9vbCxcbiAgICAvKiogSGFuZGxlciBmb3IgY2hhbmdlIGV2ZW50ICovXG4gICAgb25DaGFuZ2U6IHR5cGVzLmZ1bmMsXG4gICAgLyoqIEhhbmRsZXIgZm9yIGxvYWQgZXZlbnQgKi9cbiAgICBvbkxvYWQ6IHR5cGVzLmZ1bmMsXG4gICAgLyoqIEhhbmRsZXIgZm9yIGVycm9yIGV2ZW50ICovXG4gICAgb25FcnJvcjogdHlwZXMuZnVuYyxcbiAgICAvKiogSW1hZ2Ugd2lkdGggKi9cbiAgICB3aWR0aDogdHlwZXMubnVtYmVyLFxuICAgIC8qKiBJbWFnZSBoZWlnaHQgKi9cbiAgICBoZWlnaHQ6IHR5cGVzLm51bWJlcixcbiAgICAvKiogR3VpZGUgdGV4dCAqL1xuICAgIHRleHQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogQWNjZXB0IGZpbGUgdHlwZSAqL1xuICAgIGFjY2VwdDogdHlwZXMuc3RyaW5nLFxuICAgIC8qKiBHdWlkZSBpY29uICovXG4gICAgaWNvbjogdHlwZXMuc3RyaW5nLFxuICAgIC8qKiBJY29uIGZvciBjbG9zZSBpbWFnZXMgKi9cbiAgICBjbG9zZUljb246IHR5cGVzLnN0cmluZyxcbiAgICAvKiogU3Bpbm5lciB0aGVtZSAqL1xuICAgIHNwaW5uZXI6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogVmFsdWUgb2YgaW5wdXQgKi9cbiAgICB2YWx1ZTogdHlwZXMub25lT2ZUeXBlKFtcbiAgICAgIHR5cGVzLnN0cmluZyxcbiAgICAgIHR5cGVzLmFycmF5XG4gICAgXSlcbiAgfSxcblxuICBtaXhpbnM6IFtdLFxuXG4gIHN0YXRpY3M6IHtcbiAgICByZWFkRmlsZSAoZmlsZSwgY2FsbGJhY2spIHtcbiAgICAgIGxldCByZWFkZXIgPSBuZXcgd2luZG93LkZpbGVSZWFkZXIoKVxuICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiBvbmVycm9yIChlcnIpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyKVxuICAgICAgfVxuICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIG9ubG9hZCAoZXYpIHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgZXYudGFyZ2V0LnJlc3VsdClcbiAgICAgIH1cbiAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpXG4gICAgfSxcbiAgICBpc0ltYWdlVXJsICh1cmwpIHtcbiAgICAgIGNvbnN0IGltYWdlRXh0ZW5zaW9ucyA9IFtcbiAgICAgICAgJy5qcGcnLFxuICAgICAgICAnLmpwZWcnLFxuICAgICAgICAnLnN2ZycsXG4gICAgICAgICcuZ2lmJyxcbiAgICAgICAgJy5wbmcnXG4gICAgICBdXG4gICAgICByZXR1cm4gL15kYXRhOmltYWdlLy50ZXN0KHVybCkgfHwgISF+aW1hZ2VFeHRlbnNpb25zLmluZGV4T2YocGF0aC5leHRuYW1lKHVybCkpXG4gICAgfVxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIGxldCBoYXNWYWx1ZSA9IHByb3BzLnZhbHVlICYmIHByb3BzLnZhbHVlLmxlbmd0aCA+IDBcbiAgICByZXR1cm4ge1xuICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgZXJyb3I6IG51bGwsXG4gICAgICB1cmxzOiBoYXNWYWx1ZSA/IFtdLmNvbmNhdChwcm9wcy52YWx1ZSkgOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IG51bGwsXG4gICAgICBpZDogYGFwLXVwbG9hZC0ke3V1aWQudjQoKX1gLFxuICAgICAgbXVsdGlwbGU6IGZhbHNlLFxuICAgICAgd2lkdGg6IDE4MCxcbiAgICAgIGhlaWdodDogMTgwLFxuICAgICAgYWNjZXB0OiBudWxsLFxuICAgICAgdGV4dDogJ1VwbG9hZCBmaWxlJyxcbiAgICAgIGljb246ICdmYSBmYS1jbG91ZC11cGxvYWQnLFxuICAgICAgY2xvc2VJY29uOiAnZmEgZmEtY2xvc2UnLFxuICAgICAgc3Bpbm5lckljb246IEFwU3Bpbm5lci5ERUZBVUxUX1RIRU1FLFxuICAgICAgb25DaGFuZ2U6IG51bGwsXG4gICAgICBvbkxvYWQ6IG51bGwsXG4gICAgICBvbkVycm9yOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBzdGF0ZSwgcHJvcHMgfSA9IHNcbiAgICBsZXQgeyB3aWR0aCwgaGVpZ2h0IH0gPSBwcm9wc1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17Y2xhc3NuYW1lcygnYXAtdXBsb2FkJywgcHJvcHMuY2xhc3NOYW1lKX1cbiAgICAgICAgICAgc3R5bGU9e09iamVjdC5hc3NpZ24oe30sIHByb3BzLnN0eWxlKX0+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiZmlsZVwiXG4gICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhcC11cGxvYWQtaW5wdXRcIlxuICAgICAgICAgICAgICAgbXVsdGlwbGU9eyBwcm9wcy5tdWx0aXBsZSB9XG4gICAgICAgICAgICAgICBuYW1lPXsgcHJvcHMubmFtZSB9XG4gICAgICAgICAgICAgICBpZD17IHByb3BzLmlkIH1cbiAgICAgICAgICAgICAgIGFjY2VwdD17IHByb3BzLmFjY2VwdCB9XG4gICAgICAgICAgICAgICBvbkNoYW5nZT17cy5oYW5kbGVDaGFuZ2V9XG4gICAgICAgICAgICAgICBzdHlsZT17e3dpZHRoLCBoZWlnaHR9fVxuICAgICAgICAvPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWxhYmVsXCIgaHRtbEZvcj17IHByb3BzLmlkIH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1hbGlnbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWxhYmVsLWlubmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9eyBjbGFzc25hbWVzKFwiYXAtdXBsb2FkLWljb25cIiwgcHJvcHMuaWNvbikgfS8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC11cGxvYWQtdGV4dFwiPntwcm9wcy50ZXh0fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2xhYmVsPlxuICAgICAgICB7IHMuX3JlbmRlclByZXZpZXdJbWFnZShzdGF0ZS51cmxzLCB3aWR0aCwgaGVpZ2h0KSB9XG4gICAgICAgIHsgcy5fcmVuZGVyUmVtb3ZlQnV0dG9uKCEhKHN0YXRlLnVybHMgJiYgc3RhdGUudXJscy5sZW5ndGggPiAwKSwgcHJvcHMuY2xvc2VJY29uKSB9XG4gICAgICAgIHsgcy5fcmVuZGVyU3Bpbm5lcihzdGF0ZS5zcGlubmluZywgcHJvcHMuc3Bpbm5lcikgfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIExpZmVjeWNsZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBDdXN0b21cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgaGFuZGxlQ2hhbmdlIChlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIGxldCB7IHRhcmdldCB9ID0gZVxuICAgIGxldCBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRhcmdldC5maWxlcywgMClcblxuICAgIGxldCB7IG9uQ2hhbmdlLCBvbkVycm9yLCBvbkxvYWQgfSA9IHByb3BzXG5cbiAgICBzLnNldFN0YXRlKHsgc3Bpbm5pbmc6IHRydWUgfSlcbiAgICBpZiAob25DaGFuZ2UpIHtcbiAgICAgIG9uQ2hhbmdlKGUpXG4gICAgfVxuICAgIGFzeW5jLmNvbmNhdChmaWxlcywgQXBVcGxvYWQucmVhZEZpbGUsIChlcnIsIHVybHMpID0+IHtcbiAgICAgIGUudXJscyA9IHVybHNcbiAgICAgIGUudGFyZ2V0ID0gdGFyZ2V0XG4gICAgICBzLnNldFN0YXRlKHtcbiAgICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyLFxuICAgICAgICB1cmxzOiB1cmxzXG4gICAgICB9KVxuICAgICAgaWYgKGVycikge1xuICAgICAgICBpZiAob25FcnJvcikge1xuICAgICAgICAgIG9uRXJyb3IoZXJyKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAob25Mb2FkKSB7XG4gICAgICAgICAgb25Mb2FkKGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9LFxuXG4gIGhhbmRsZVJlbW92ZSAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIGxldCB7IG9uTG9hZCB9ID0gcHJvcHNcbiAgICBzLnNldFN0YXRlKHtcbiAgICAgIGVycm9yOiBudWxsLFxuICAgICAgdXJsczogbnVsbFxuICAgIH0pXG4gICAgaWYgKG9uTG9hZCkge1xuICAgICAgb25Mb2FkKFtdKVxuICAgIH1cbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gUHJpdmF0ZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICBfcmVuZGVyU3Bpbm5lciAoc3Bpbm5pbmcsIHRoZW1lKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICByZXR1cm4gKFxuICAgICAgPEFwU3Bpbm5lciBlbmFibGVkPXtzcGlubmluZ30gdGhlbWU9e3RoZW1lfT5cbiAgICAgIDwvQXBTcGlubmVyPlxuICAgIClcbiAgfSxcblxuICBfcmVuZGVyUmVtb3ZlQnV0dG9uIChyZW1vdmFibGUsIGljb24pIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGlmICghcmVtb3ZhYmxlKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIG9uVGFwPXsgcy5oYW5kbGVSZW1vdmUgfSBjbGFzc05hbWU9XCJhcC11cGxvYWQtcmVtb3ZlLWJ1dHRvblwiPlxuICAgICAgICA8aSBjbGFzc05hbWU9eyBjbGFzc25hbWVzKFwiYXAtdXBsb2FkLXJlbW92ZS1pY29uXCIsIGljb24pIH0vPlxuICAgICAgPC9BcEJ1dHRvbj5cbiAgICApXG4gIH0sXG5cbiAgX3JlbmRlclByZXZpZXdJbWFnZSAodXJscywgd2lkdGgsIGhlaWdodCkge1xuICAgIGlmICghdXJscykge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICByZXR1cm4gdXJsc1xuICAgICAgLmZpbHRlcigodXJsKSA9PiBBcFVwbG9hZC5pc0ltYWdlVXJsKHVybCkpXG4gICAgICAubWFwKCh1cmwsIGkpID0+IChcbiAgICAgICAgPEFwSW1hZ2Uga2V5PXsgdXJsIH1cbiAgICAgICAgICAgICAgICAgc3JjPXsgdXJsIH1cbiAgICAgICAgICAgICAgICAgaGVpZ2h0PXsgaGVpZ2h0IH1cbiAgICAgICAgICAgICAgICAgd2lkdGg9eyB3aWR0aCB9XG4gICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLXVwbG9hZC1wcmV2aWV3LWltYWdlJykgfVxuICAgICAgICAgICAgICAgICBzdHlsZT17IHsgbGVmdDogYCR7aSAqIDEwfSVgLCB0b3A6IGAke2kgKiAxMH0lYCB9IH1cbiAgICAgICAgICAgICAgICAgc2NhbGU9XCJmaXRcIj5cbiAgICAgICAgPC9BcEltYWdlPlxuICAgICAgKSlcbiAgfVxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBVcGxvYWRcbiIsIi8qKlxuICogU3R5bGUgZm9yIEFwVXBsb2FkLlxuICogQGNsYXNzIEFwVXBsb2FkU3R5bGVcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJ1xuXG4vKiogQGxlbmRzIEFwVXBsb2FkU3R5bGUgKi9cbmNvbnN0IEFwVXBsb2FkU3R5bGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIHN0eWxlOiB0eXBlcy5vYmplY3QsXG4gICAgaGlnaGxpZ2h0Q29sb3I6IHR5cGVzLnN0cmluZyxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IHR5cGVzLnN0cmluZ1xuICB9LFxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzdHlsZToge30sXG4gICAgICBoaWdobGlnaHRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0hJR0hMSUdIVF9DT0xPUixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0JBQ0tHUk9VTkRfQ09MT1JcbiAgICB9XG4gIH0sXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgbGV0IHsgaGlnaGxpZ2h0Q29sb3IsIGJhY2tncm91bmRDb2xvciB9ID0gcHJvcHM7XG5cbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgICcuYXAtdXBsb2FkJzoge1xuICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIGNvbG9yOiAnIzg4OCcsXG4gICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJ1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkOmhvdmVyJzoge1xuICAgICAgICBjb2xvcjogJyM1NTUnXG4gICAgICB9LFxuICAgICAgJy5hcC11cGxvYWQ6YWN0aXZlJzoge1xuICAgICAgICB0ZXh0U2hhZG93OiAnbm9uZScsXG4gICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgIGNvbG9yOiAnIzc3NydcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1sYWJlbCc6IHtcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIHpJbmRleDogMSxcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGAke2JhY2tncm91bmRDb2xvcn1gLFxuICAgICAgICBib3hTaGFkb3c6ICdpbnNldCAxcHggMXB4IDJweCByZ2JhKDAsMCwwLDAuMzMpJyxcbiAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkICNDQ0MnLFxuICAgICAgICBib3JkZXJSYWRpdXM6ICcycHgnXG4gICAgICB9LFxuICAgICAgJy5hcC11cGxvYWQtaW5wdXQnOiB7XG4gICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgIHpJbmRleDogMlxuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkLWljb24nOiB7XG4gICAgICAgIGRpc3BsYXk6ICdibG9jaycsXG4gICAgICAgIGZvbnRTaXplOiAnMmVtJ1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkLWxhYmVsLWlubmVyJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgdmVydGljYWxBbGlnbjogJ21pZGRsZSdcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1hbGlnbmVyJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgd2lkdGg6ICcxcHgnLFxuICAgICAgICBtYXJnaW5SaWdodDogJy0xcHgnLFxuICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICAgIHZlcnRpY2FsQWxpZ246ICdtaWRkbGUnXG4gICAgICB9LFxuICAgICAgJy5hcC11cGxvYWQgLmFwLXNwaW5uZXInOiB7XG4gICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICAgIHpJbmRleDogOCxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBgJHtiYWNrZ3JvdW5kQ29sb3J9YCxcbiAgICAgICAgY29sb3I6ICcjREREJ1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkLXByZXZpZXctaW1hZ2UnOiB7XG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICBib3hTaXppbmc6ICdib3JkZXItYm94JyxcbiAgICAgICAgekluZGV4OiA0LFxuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgbGVmdDogMCxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZScsXG4gICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCAjQUFBJ1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkLXJlbW92ZS1idXR0b24nOiB7XG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgekluZGV4OiA1LFxuICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICBwYWRkaW5nOiAnOHB4JyxcbiAgICAgICAgZm9udFNpemU6ICcyNHB4JyxcbiAgICAgICAgY29sb3I6ICcjQUFBJyxcbiAgICAgICAgYmFja2dyb3VuZDogJ3JnYmEoMjU1LDI1NSwyNTUsMC4yKScsXG4gICAgICAgIGJvcmRlclJhZGl1czogMFxuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkLXJlbW92ZS1idXR0b246aG92ZXInOiB7XG4gICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxuICAgICAgICBjb2xvcjogJyM1NTUnXG4gICAgICB9LFxuICAgICAgJy5hcC11cGxvYWQtcmVtb3ZlLWJ1dHRvbjphY3RpdmUnOiB7XG4gICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxuICAgICAgICBjb2xvcjogJyM1NTUnXG4gICAgICB9XG4gICAgfVxuICAgIGxldCBzbWFsbE1lZGlhRGF0YSA9IHt9XG4gICAgbGV0IG1lZGl1bU1lZGlhRGF0YSA9IHt9XG4gICAgbGV0IGxhcmdlTWVkaWFEYXRhID0ge31cbiAgICByZXR1cm4gKFxuICAgICAgPEFwU3R5bGUgZGF0YT17IE9iamVjdC5hc3NpZ24oZGF0YSwgcHJvcHMuc3R5bGUpIH1cbiAgICAgICAgICAgICAgIHNtYWxsTWVkaWFEYXRhPXsgc21hbGxNZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbWVkaXVtTWVkaWFEYXRhPXsgbWVkaXVtTWVkaWFEYXRhIH1cbiAgICAgICAgICAgICAgIGxhcmdlTWVkaWFEYXRhPXsgbGFyZ2VNZWRpYURhdGEgfVxuICAgICAgPnsgcHJvcHMuY2hpbGRyZW4gfTwvQXBTdHlsZT5cbiAgICApXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwVXBsb2FkU3R5bGVcbiIsIi8qIVxuICBDb3B5cmlnaHQgKGMpIDIwMTYgSmVkIFdhdHNvbi5cbiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChNSVQpLCBzZWVcbiAgaHR0cDovL2plZHdhdHNvbi5naXRodWIuaW8vY2xhc3NuYW1lc1xuKi9cbi8qIGdsb2JhbCBkZWZpbmUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuXHRmdW5jdGlvbiBjbGFzc05hbWVzICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IFtdO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKGFyZ1R5cGUgPT09ICdzdHJpbmcnIHx8IGFyZ1R5cGUgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdGNsYXNzZXMucHVzaChhcmcpO1xuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcblx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKSk7XG5cdFx0XHR9IGVsc2UgaWYgKGFyZ1R5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJnLCBrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzLnB1c2goa2V5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcy5qb2luKCcgJyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGNsYXNzTmFtZXM7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIHJlZ2lzdGVyIGFzICdjbGFzc25hbWVzJywgY29uc2lzdGVudCB3aXRoIG5wbSBwYWNrYWdlIG5hbWVcblx0XHRkZWZpbmUoJ2NsYXNzbmFtZXMnLCBbXSwgZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZXM7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LmNsYXNzTmFtZXMgPSBjbGFzc05hbWVzO1xuXHR9XG59KCkpO1xuIl19
