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
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
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
    var timeout = setTimeout(cleanUpNextTick);
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
    clearTimeout(timeout);
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
        setTimeout(drainQueue, 0);
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
'use strict';var _react=require('react');var _react2=_interopRequireDefault(_react);var _ap_upload=require('../../lib/ap_upload');var _ap_upload2=_interopRequireDefault(_ap_upload);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}var DEMO_IMAGES=['https://raw.githubusercontent.com/apeman-asset-labo/apeman-asset-images/master/dist/dummy/12.jpg'];var Demo=_react2.default.createClass({displayName:'Demo',render:function render(){var s=this;return _react2.default.createElement('div',null,_react2.default.createElement(_ap_upload2.default,{multiple:true,id:'demo-file-upload-01',name:'file-input-01',accept:'image/*',onLoad:s.handleLoaded}),_react2.default.createElement(_ap_upload2.default,{multiple:true,id:'demo-file-upload-02',name:'file-input-02',accept:'image/*',value:DEMO_IMAGES,onLoad:s.handleLoaded}))},handleLoaded:function handleLoaded(ev){console.log('result',ev.target,ev.urls)}});module.exports=Demo;

},{"../../lib/ap_upload":5,"react":"react"}],4:[function(require,module,exports){
'use strict'

const React = require('react'),
    ReactDOM = require('react-dom')

const Demo = require('./demo.component.js')

window.React = React;
let DemoFactory = React.createFactory(Demo)
ReactDOM.render(DemoFactory(), document.getElementById('demo-wrap'))

},{"./demo.component.js":3,"react":"react","react-dom":"react-dom"}],5:[function(require,module,exports){
/**
 * apeman react package for file upload components.
 * @constructor ApUpload
 */

'use strict';

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
      return (/^data:image/.test(url) || !! ~['.jpg', '.jpeg', '.svg', '.gif', '.png'].indexOf(_path2.default.extname(url))
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
        className: (0, _classnames2.default)("ap-upload-preview-image"),
        style: {
          left: i * 10 + '%',
          top: i * 10 + '%'
        },
        scale: 'fit' });
    });
  }
});

module.exports = ApUpload;

},{"apeman-react-button":16,"apeman-react-image":20,"apeman-react-spinner":24,"async":25,"classnames":"classnames","path":1,"react":"react","uuid":32}],6:[function(require,module,exports){
/**
 * Big button component.
 * @constructor ApBigButton
 */

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _ap_button = require('./ap_button');

var _ap_button2 = _interopRequireDefault(_ap_button);

var _apemanReactMixins = require('apeman-react-mixins');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApBigButton */
var ApBigButton = _react2.default.createClass({
  displayName: 'ApBigButton',

  // --------------------
  // Specs
  // --------------------

  propTypes: {
    disabled: _react.PropTypes.bool,
    onTap: _react.PropTypes.func,
    text: _react.PropTypes.string,
    size: _react.PropTypes.number
  },

  mixins: [_apemanReactMixins.ApPureMixin],

  getInitialState: function getInitialState() {
    return {};
  },
  getDefaultProps: function getDefaultProps() {
    return {
      disabled: false,
      onTap: null,
      text: null,
      size: 94
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;
    var size = props.size;

    var style = Object.assign({
      width: size, height: size
    }, props.style);
    return _react2.default.createElement(
      _ap_button2.default,
      _extends({}, props, {
        className: (0, _classnames2.default)('ap-big-button', props.className),
        wide: false,
        style: style
      }),
      _react2.default.createElement(
        'span',
        { className: 'ap-big-button-text' },
        props.text
      ),
      props.children
    );
  }
});

module.exports = ApBigButton;

},{"./ap_button":7,"apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],7:[function(require,module,exports){
/**
 * Button component.
 * @constructor ApButton
 */

'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _apemanReactMixins = require('apeman-react-mixins');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApButton */
var ApButton = _react2.default.createClass({
  displayName: 'ApButton',

  // --------------------
  // Specs
  // --------------------

  propTypes: {
    /** Disable button tap */
    disabled: _react.PropTypes.bool,
    /** Render with primary style */
    primary: _react.PropTypes.bool,
    /** Render with danger style */
    danger: _react.PropTypes.bool,
    /** Render with wide style */
    wide: _react.PropTypes.bool,
    /** Anchor href */
    href: _react.PropTypes.string,
    /** Document id */
    id: _react.PropTypes.string,
    /** Hide button */
    hidden: _react.PropTypes.bool,
    /** Render with simple style */
    simple: _react.PropTypes.bool,
    /** Data for touch events */
    data: _react.PropTypes.any
  },

  mixins: [_apemanReactMixins.ApTouchMixin, _apemanReactMixins.ApPureMixin],

  getInitialState: function getInitialState() {
    return {};
  },
  getDefaultProps: function getDefaultProps() {
    return {
      /** For bit tapping */
      disabled: false,
      /** Render with primary style */
      primary: false,
      /** Render with danger style */
      danger: false,
      wide: false,
      href: null,
      /** Document id */
      id: null,
      /** Display hidden */
      hidden: false,
      /** Simple style */
      simple: false,
      /** Data for event */
      data: null
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;

    var className = (0, _classnames2.default)('ap-button', props.className, {
      'ap-button-primary': props.primary,
      'ap-button-danger': props.danger,
      'ap-button-wide': props.wide,
      'ap-button-disabled': props.disabled,
      'ap-button-simple': props.simple,
      'ap-button-hidden': props.hidden
    });
    return _react2.default.createElement(
      'a',
      { className: className,
        href: props.href,
        id: props.id,
        style: Object.assign({}, props.style)
      },
      props.children
    );
  },

  // --------------------
  // For ApTouchMixin
  // --------------------
  getTouchData: function getTouchData() {
    var s = this;
    var props = s.props;

    return props.data;
  }
});

module.exports = ApButton;

},{"apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],8:[function(require,module,exports){
/**
 * Button group component.
 * @constructor ApButtonGroup
 */

'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _apemanReactMixins = require('apeman-react-mixins');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApButtonGroup */
var ApButtonGroup = _react2.default.createClass({
  displayName: 'ApButtonGroup',

  // --------------------
  // Specs
  // --------------------

  propTypes: {},

  mixins: [_apemanReactMixins.ApPureMixin],

  getInitialState: function getInitialState() {
    return {};
  },
  getDefaultProps: function getDefaultProps() {
    return {};
  },
  render: function render() {
    var s = this;
    var props = s.props;

    return _react2.default.createElement(
      'div',
      { className: (0, _classnames2.default)('ap-button-group', props.className) },
      props.children
    );
  }
});

module.exports = ApButtonGroup;

},{"apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],9:[function(require,module,exports){
/**
 * Style for ApButton.
 * @constructor ApButtonStyle
 */

'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _apemanReactStyle = require('apeman-react-style');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApButtonStyle */
var ApButtonStyle = _react2.default.createClass({
  displayName: 'ApButtonStyle',

  propTypes: {
    scope: _react.PropTypes.bool,
    style: _react.PropTypes.object,
    highlightColor: _react.PropTypes.string,
    backgroundColor: _react.PropTypes.string,
    dangerColor: _react.PropTypes.string,
    disabledColor: _react.PropTypes.string
  },
  getDefaultProps: function getDefaultProps() {
    return {
      scope: false,
      style: {},
      highlightColor: _apemanReactStyle.ApStyle.DEFAULT_HIGHLIGHT_COLOR,
      backgroundColor: _apemanReactStyle.ApStyle.DEFAULT_BACKGROUND_COLOR,
      dangerColor: _apemanReactStyle.ApStyle.DEFAULT_DANGER_COLOR,
      disabledColor: '#AAA'
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;

    var highlightColor = props.highlightColor;
    var backgroundColor = props.backgroundColor;
    var dangerColor = props.dangerColor;
    var disabledColor = props.disabledColor;

    var data = {
      '.ap-button': {
        display: 'inline-block',
        boxSizing: 'border-box',
        padding: '0.5em 1em',
        borderRadius: '2px',
        margin: '4px',
        color: '' + highlightColor,
        border: '1px solid ' + highlightColor,
        background: '' + backgroundColor,
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        MsUserSelect: 'none',
        UserSelect: 'none',
        whiteSpace: 'nowrap'
      },
      '.ap-big-button': {
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: '4px',
        padding: 0,
        boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
        whiteSpace: 'normal'
      },
      '.ap-big-button:active': {
        boxShadow: 'none'
      },
      '.ap-button > *': {
        pointerEvents: 'none'
      },
      '.ap-button:hover': {
        cursor: 'pointer',
        opacity: 0.9
      },
      '.ap-button:active': {
        boxShadow: '1px 1px 2px rgba(0,0,0,0.1) inset',
        opacity: 0.8
      },
      '.ap-button.ap-button-disabled,.ap-button.ap-button-disabled:hover,.ap-button.ap-button-disabled:active': {
        cursor: 'default',
        boxShadow: 'none',
        color: '' + disabledColor,
        borderColor: '' + disabledColor,
        backgroundColor: '#F0F0F0'
      },
      '.ap-button-primary': {
        color: 'white',
        background: '' + highlightColor
      },
      '.ap-button-danger': {
        color: 'white',
        background: '' + dangerColor
      },
      '.ap-button-wide': {
        width: '100%',
        boxSizing: 'border-box',
        maxWidth: '240px',
        marginLeft: 0,
        marginRight: 0
      },
      '.ap-icon-button': {
        textAlign: 'center',
        display: 'inline-block',
        justifyContent: 'inherit',
        flexDirection: 'column',
        alignItems: 'center'
      },
      '.ap-icon-button-simple': {
        border: 'none',
        background: 'transparent'
      },
      '.ap-icon-button-simple:active': {
        boxShadow: 'none',
        opacity: '0.8'
      },
      '.ap-icon-button-simple .ap-icon-button-icon': {
        fontSize: 'inherit'
      },
      '.ap-icon-button-icon': {
        margin: '2px 0',
        display: 'block',
        fontSize: '2em'
      },
      '.ap-icon-button-text': {
        display: 'block',
        fontSize: '0.66em',
        padding: '2px 0'
      },
      '.ap-icon-button-row': {
        display: 'flex',
        maxWidth: _apemanReactStyle.ApStyle.CONTENT_WIDTH,
        margin: '0 auto'
      },
      '.ap-icon-button-row .ap-button': {
        display: 'block',
        width: '100%'
      },
      '.ap-cell-button': {
        textAlign: 'center',
        background: 'transparent',
        lineHeight: '1em',
        fontSize: '14px',
        margin: 0,
        borderRadius: 0,
        boxSizing: 'border-box'
      },
      '.ap-cell-button-aligner': {
        opacity: 0,
        display: 'inline-block',
        width: '1px',
        marginRight: '-1px',
        boxSizing: 'border-box',
        padding: '8px 0',
        verticalAlign: 'middle'
      },
      '.ap-cell-button-text': {
        display: 'inline-block',
        verticalAlign: 'middle'
      },
      '.ap-cell-button-row': {
        display: 'flex',
        maxWidth: _apemanReactStyle.ApStyle.CONTENT_WIDTH,
        width: '100%',
        margin: '8px auto'
      },
      '.ap-cell-button-row .ap-cell-button': {
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        width: '100%'
      },
      '.ap-cell-button-row .ap-cell-button:first-child': {
        borderLeftColor: 'transparent'
      },
      '.ap-cell-button-row .ap-button': {
        display: 'block',
        width: '100%'
      },
      '.ap-next-button,.ap-prev-button': {
        padding: '0.25em 1em'
      },
      '.ap-next-button-icon': {
        marginLeft: '4px',
        marginRight: 0
      },
      '.ap-prev-button-icon': {
        marginLeft: 0,
        marginRight: '4px'
      },
      '.ap-button-hidden': {
        display: 'none !important'
      },
      '.ap-button-simple': {
        border: 'none',
        background: 'transparent'
      },
      '.ap-button-simple:active': {
        boxShadow: 'none',
        opacity: '0.8'
      },
      '.ap-button-group': {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    };
    var smallMediaData = {};
    var mediumMediaData = {};
    var largeMediaData = {};
    return _react2.default.createElement(
      _apemanReactStyle.ApStyle,
      { scoped: props.scoped,
        data: Object.assign(data, props.style),
        smallMediaData: smallMediaData,
        mediumMediaData: mediumMediaData,
        largeMediaData: largeMediaData
      },
      props.children
    );
  }
});

module.exports = ApButtonStyle;

},{"apeman-react-style":"apeman-react-style","react":"react"}],10:[function(require,module,exports){
/**
 * Cell button component.
 * @constructor ApCellButton
 */

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _ap_button = require('./ap_button');

var _ap_button2 = _interopRequireDefault(_ap_button);

var _apemanReactMixins = require('apeman-react-mixins');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApCellButton */
var ApCellButton = _react2.default.createClass({
  displayName: 'ApCellButton',

  // --------------------
  // Specs
  // --------------------

  propTypes: {
    disabled: _react.PropTypes.bool,
    onTap: _react.PropTypes.func,
    text: _react.PropTypes.string
  },

  mixins: [_apemanReactMixins.ApPureMixin],

  getInitialState: function getInitialState() {
    return {};
  },
  getDefaultProps: function getDefaultProps() {
    return {
      disabled: false,
      onTap: null,
      text: null
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;
    return _react2.default.createElement(
      _ap_button2.default,
      _extends({}, props, {
        className: (0, _classnames2.default)('ap-cell-button', props.className),
        wide: false
      }),
      _react2.default.createElement(
        'span',
        { className: 'ap-cell-button-aligner' },
        ' '
      ),
      _react2.default.createElement(
        'span',
        { className: 'ap-cell-button-text' },
        props.text
      )
    );
  }
});

module.exports = ApCellButton;

},{"./ap_button":7,"apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],11:[function(require,module,exports){
/**
 * Row for Cell buttons.
 * @constructor ApCellButtonRow
 */

'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApCellButtonRow */
var ApCellButtonRow = _react2.default.createClass({
  displayName: 'ApCellButtonRow',

  // --------------------
  // Specs
  // --------------------

  propTypes: {},

  getInitialState: function getInitialState() {
    return {};
  },
  getDefaultProps: function getDefaultProps() {
    return {};
  },
  render: function render() {
    var s = this;
    var props = s.props;

    return _react2.default.createElement(
      'div',
      { className: (0, _classnames2.default)('ap-cell-button-row', props.className) },
      props.children
    );
  }
});

module.exports = ApCellButtonRow;

},{"classnames":"classnames","react":"react"}],12:[function(require,module,exports){
/**
 * Icon button component.
 * @constructor ApIconButton
 */

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _apemanReactIcon = require('apeman-react-icon');

var _ap_button = require('./ap_button');

var _ap_button2 = _interopRequireDefault(_ap_button);

var _apemanReactMixins = require('apeman-react-mixins');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApIconButton */
var ApIconButton = _react2.default.createClass({
  displayName: 'ApIconButton',

  // --------------------
  // Specs
  // --------------------

  propTypes: {
    icon: _react.PropTypes.string,
    text: _react.PropTypes.string,
    simple: _react.PropTypes.bool
  },

  statics: {
    /**
     * Create a icon button.
     * @param {string} text - Text
     * @param {string} icon - Icon class
     * @param {function} onTap - Tap callback
     * @param {Object} props - Other props.
     * @returns {Object} - React element.
     */

    createButton: function createButton(text, icon, onTap, props) {
      return _react2.default.createElement(ApIconButton, _extends({ text: text,
        icon: icon,
        onTap: onTap
      }, props));
    }
  },

  mixins: [_apemanReactMixins.ApPureMixin],

  getInitialState: function getInitialState() {
    return {};
  },
  getDefaultProps: function getDefaultProps() {
    return {
      icon: null,
      text: null
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;

    return _react2.default.createElement(
      _ap_button2.default,
      _extends({}, props, {
        className: (0, _classnames2.default)('ap-icon-button', {
          'ap-icon-button-simple': !!props.simple
        }, props.className),
        wide: false
      }),
      _react2.default.createElement(_apemanReactIcon.ApIcon, { className: (0, _classnames2.default)('ap-icon-button-icon', props.icon, {}) }),
      props.text ? _react2.default.createElement(
        'span',
        { className: 'ap-icon-button-text' },
        props.text
      ) : null
    );
  }
});

module.exports = ApIconButton;

},{"./ap_button":7,"apeman-react-icon":"apeman-react-icon","apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],13:[function(require,module,exports){
/**
 * Row for Icon buttons.
 * @constructor ApIconButtonRow
 */

'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApIconButtonRow */
var ApIconButtonRow = _react2.default.createClass({
  displayName: 'ApIconButtonRow',

  // --------------------
  // Specs
  // --------------------

  propTypes: {},

  getInitialState: function getInitialState() {
    return {};
  },
  getDefaultProps: function getDefaultProps() {
    return {};
  },
  render: function render() {
    var s = this;
    var props = s.props;

    return _react2.default.createElement(
      'div',
      { className: (0, _classnames2.default)('ap-icon-button-row', props.className) },
      props.children
    );
  }
});

module.exports = ApIconButtonRow;

},{"classnames":"classnames","react":"react"}],14:[function(require,module,exports){
/**
 * Next button component.
 * @constructor ApNextButton
 */

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _ap_button = require('./ap_button');

var _ap_button2 = _interopRequireDefault(_ap_button);

var _apemanReactIcon = require('apeman-react-icon');

var _apemanReactMixins = require('apeman-react-mixins');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApNextButton */
var ApNextButton = _react2.default.createClass({
  displayName: 'ApNextButton',

  // --------------------
  // Specs
  // --------------------

  propTypes: {
    disabled: _react.PropTypes.bool,
    onTap: _react.PropTypes.func,
    text: _react.PropTypes.string,
    size: _react.PropTypes.number,
    icon: _react.PropTypes.string
  },

  mixins: [_apemanReactMixins.ApPureMixin],

  getInitialState: function getInitialState() {
    return {};
  },
  getDefaultProps: function getDefaultProps() {
    return {
      disabled: false,
      onTap: null,
      text: null,
      icon: 'fa fa-caret-right'
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;

    return _react2.default.createElement(
      _ap_button2.default,
      _extends({}, props, {
        className: (0, _classnames2.default)('ap-next-button', props.className),
        wide: false,
        style: Object.assign({}, props.style)
      }),
      _react2.default.createElement(
        'span',
        { className: 'ap-next-button-text' },
        props.text
      ),
      props.children,
      _react2.default.createElement(_apemanReactIcon.ApIcon, { className: (0, _classnames2.default)('ap-next-button-icon', props.icon) })
    );
  }
});

module.exports = ApNextButton;

},{"./ap_button":7,"apeman-react-icon":"apeman-react-icon","apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],15:[function(require,module,exports){
/**
 * Prev button component.
 * @constructor ApPrevButton
 */

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _ap_button = require('./ap_button');

var _ap_button2 = _interopRequireDefault(_ap_button);

var _apemanReactIcon = require('apeman-react-icon');

var _apemanReactMixins = require('apeman-react-mixins');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApPrevButton */
var ApPrevButton = _react2.default.createClass({
  displayName: 'ApPrevButton',

  // --------------------
  // Specs
  // --------------------

  propTypes: {
    disabled: _react.PropTypes.bool,
    onTap: _react.PropTypes.func,
    text: _react.PropTypes.string,
    size: _react.PropTypes.number,
    icon: _react.PropTypes.string
  },

  mixins: [_apemanReactMixins.ApPureMixin],

  getInitialState: function getInitialState() {
    return {};
  },
  getDefaultProps: function getDefaultProps() {
    return {
      disabled: false,
      onTap: null,
      text: null,
      icon: 'fa fa-caret-left'
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;

    return _react2.default.createElement(
      _ap_button2.default,
      _extends({}, props, {
        className: (0, _classnames2.default)('ap-prev-button', props.className),
        wide: false,
        style: Object.assign({}, props.style)
      }),
      _react2.default.createElement(_apemanReactIcon.ApIcon, { className: (0, _classnames2.default)('ap-prev-button-icon', props.icon) }),
      _react2.default.createElement(
        'span',
        { className: 'ap-prev-button-text' },
        props.text
      ),
      props.children
    );
  }
});

module.exports = ApPrevButton;

},{"./ap_button":7,"apeman-react-icon":"apeman-react-icon","apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],16:[function(require,module,exports){
/**
 * apeman react package for button component.
 * @module apeman-react-button
 */

'use strict'

module.exports = {
  /**
   * @name ApBigButton
   */
  get ApBigButton () { return require('./ap_big_button') },
  /**
   * @name ApButtonGroup
   */
  get ApButtonGroup () { return require('./ap_button_group') },
  /**
   * @name ApButtonStyle
   */
  get ApButtonStyle () { return require('./ap_button_style') },
  /**
   * @name ApButton
   */
  get ApButton () { return require('./ap_button') },
  /**
   * @name ApCellButtonRow
   */
  get ApCellButtonRow () { return require('./ap_cell_button_row') },
  /**
   * @name ApCellButton
   */
  get ApCellButton () { return require('./ap_cell_button') },
  /**
   * @name ApIconButtonRow
   */
  get ApIconButtonRow () { return require('./ap_icon_button_row') },
  /**
   * @name ApIconButton
   */
  get ApIconButton () { return require('./ap_icon_button') },
  /**
   * @name ApNextButton
   */
  get ApNextButton () { return require('./ap_next_button') },
  /**
   * @name ApPrevButton
   */
  get ApPrevButton () { return require('./ap_prev_button') }
}

},{"./ap_big_button":6,"./ap_button":7,"./ap_button_group":8,"./ap_button_style":9,"./ap_cell_button":10,"./ap_cell_button_row":11,"./ap_icon_button":12,"./ap_icon_button_row":13,"./ap_next_button":14,"./ap_prev_button":15}],17:[function(require,module,exports){
/**
 * @function _scaledSize
 */

"use strict";

var _numcal = require('numcal');

var _numcal2 = _interopRequireDefault(_numcal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _scaledSize(contentSize, frameSize, policy) {
  var cw = contentSize.width;
  var ch = contentSize.height;
  var fw = frameSize.width;
  var fh = frameSize.height;

  var wRate = _numcal2.default.min(1, fw / cw);
  var hRate = _numcal2.default.min(1, fh / ch);

  var rate = _numcal2.default.min(wRate, hRate);
  switch (policy) {
    case 'none':
      return contentSize;
    case 'fit':
      return {
        width: contentSize.width * rate,
        height: contentSize.height * rate
      };
    case 'fill':
      return {
        width: contentSize.width * rate,
        height: contentSize.height * rate
      };
    default:
      throw new Error('Unknown policy: ' + policy);
  }
}

module.exports = _scaledSize;

},{"numcal":27}],18:[function(require,module,exports){
/**
 * apeman react package for image component.
 * @constructor ApImage
 */

'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _numcal = require('numcal');

var _numcal2 = _interopRequireDefault(_numcal);

var _scaled_size = require('./_scaled_size');

var _scaled_size2 = _interopRequireDefault(_scaled_size);

var _apemanReactSpinner = require('apeman-react-spinner');

var _apemanReactMixins = require('apeman-react-mixins');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApImage */
var ApImage = _react2.default.createClass({
  displayName: 'ApImage',

  // --------------------
  // Specs
  // --------------------

  propTypes: {
    /** Image scaling policy */
    scale: _react.PropTypes.oneOf(['fit', 'fill', 'none']),
    /** Image width */
    width: _react.PropTypes.oneOfType([_react.PropTypes.number, _react.PropTypes.string]),
    /** Image height */
    height: _react.PropTypes.oneOfType([_react.PropTypes.number, _react.PropTypes.string]),
    /** Image src string */
    src: _react.PropTypes.string,
    /** Alt test */
    alt: _react.PropTypes.string,
    /** Them of spinner */
    spinnerTheme: _react.PropTypes.string,
    /** Handler on image load */
    onLoad: _react.PropTypes.func,
    /** Handler on image error. */
    onError: _react.PropTypes.func
  },

  mixins: [_apemanReactMixins.ApPureMixin],

  statics: {
    scaledSize: _scaled_size2.default,
    zeroIfNaN: function zeroIfNaN(value) {
      return isNaN(value) ? 0 : value;
    },
    nullIfNaN: function nullIfNaN(value) {
      return isNaN(value) ? null : value;
    }
  },

  getInitialState: function getInitialState() {
    var s = this;
    return {
      imgWidth: null,
      imgHeight: null,
      mounted: false,
      ready: false,
      loading: !!s.props.src,
      error: null
    };
  },
  getDefaultProps: function getDefaultProps() {
    return {
      scale: 'none',
      width: null,
      height: null,
      src: null,
      alt: "NO IMAGE",
      spinnerTheme: _apemanReactSpinner.ApSpinner.DEFAULT_THEME,
      onLoad: null,
      onError: null
    };
  },
  render: function render() {
    var s = this;
    var state = s.state;
    var props = s.props;

    var size = {
      width: props.width || null,
      height: props.height || null
    };

    var mounted = state.mounted;
    var error = state.error;
    var ready = state.ready;
    var loading = state.loading;

    return _react2.default.createElement(
      'div',
      { className: (0, _classnames2.default)('ap-image', props.className, {
          'ap-image-loading': props.src && loading,
          'ap-image-ready': props.src && ready
        }),
        style: Object.assign({}, size, props.style) },
      mounted && error ? s._renderNotfound(size) : null,
      mounted && !error ? s._renderImg(size, mounted) : null,
      loading ? s._renderSpinner(size) : null
    );
  },

  // --------------------
  // Lifecycle
  // --------------------

  componentWillMount: function componentWillMount() {
    var s = this;
  },
  componentDidMount: function componentDidMount() {
    var s = this;
    s.setState({
      mounted: true
    });

    setTimeout(function () {
      s.resizeImage();
    }, 0);
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var s = this;

    var src = s.props.src,
        nextSrc = nextProps.src;
    var srcChanged = !!nextSrc && nextSrc !== src;
    if (srcChanged) {
      s.setState({
        ready: false,
        loading: true,
        error: null
      });
    }
  },
  componentWillUpdate: function componentWillUpdate(nextProps, nextState) {
    var s = this;
    s.resizeImage();
  },
  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
    var s = this;
  },
  componentWillUnmount: function componentWillUnmount() {
    var s = this;
  },

  // ------------------
  // Helper
  // ------------------

  handleLoad: function handleLoad(e) {
    var s = this;
    var props = s.props;

    if (props.onLoad) {
      props.onLoad(e);
    }

    s.resizeImage(e.target.width, e.target.height);
  },
  handleError: function handleError(e) {
    var s = this;
    var props = s.props;

    s.setState({
      error: e,
      loading: false
    });

    if (props.onError) {
      props.onError(e);
    }
  },
  resizeImage: function resizeImage(imgContentWidth, imgContentHeight) {
    var s = this;
    var state = s.state;
    var props = s.props;

    imgContentWidth = imgContentWidth || state.imgContentWidth;
    imgContentHeight = imgContentHeight || state.imgContentHeight;

    var valid = imgContentWidth && imgContentHeight;
    if (!valid) {
      return;
    }

    var elm = _reactDom2.default.findDOMNode(s);
    var frameSize = {
      width: elm.offsetWidth,
      height: elm.offsetHeight
    };
    var contentSize = {
      height: imgContentHeight,
      width: imgContentWidth
    };
    var scaledSize = ApImage.scaledSize(contentSize, frameSize, props.scale);

    s.setState({
      imgContentWidth: imgContentWidth,
      imgContentHeight: imgContentHeight,
      imgWidth: scaledSize.width,
      imgHeight: scaledSize.height,
      ready: true,
      loading: false
    });
  },

  // ------------------
  // Private
  // ------------------
  _renderImg: function _renderImg(size) {
    var s = this;
    var state = s.state;
    var props = s.props;
    var nullIfNaN = ApImage.nullIfNaN;
    var zeroIfNaN = ApImage.zeroIfNaN;

    return _react2.default.createElement('img', { src: props.src,
      alt: props.alt,
      className: (0, _classnames2.default)('ap-image-content'),
      style: {
        top: zeroIfNaN((size.height - state.imgHeight) / 2),
        left: zeroIfNaN((size.width - state.imgWidth) / 2),
        width: nullIfNaN(state.imgWidth),
        height: nullIfNaN(state.imgHeight)
      },
      onLoad: s.handleLoad,
      onError: s.handleError
    });
  },
  _renderNotfound: function _renderNotfound(size) {
    var s = this;
    var props = s.props;

    return _react2.default.createElement(
      'div',
      { className: 'ap-image-notfound',
        style: {
          lineHeight: size.height + 'px',
          fontSize: '' + _numcal2.default.min(size.height * 0.4, 18)
        }
      },
      props.alt
    );
  },
  _renderSpinner: function _renderSpinner(size) {
    var s = this;
    var props = s.props;

    return _react2.default.createElement(_apemanReactSpinner.ApSpinner, { className: 'ap-image-spinner',
      theme: props.spinnerTheme,
      style: {
        width: size.width,
        height: size.height
      } });
  }
});

module.exports = ApImage;

},{"./_scaled_size":17,"apeman-react-mixins":"apeman-react-mixins","apeman-react-spinner":24,"classnames":"classnames","numcal":27,"react":"react","react-dom":"react-dom"}],19:[function(require,module,exports){
/**
 * Style for ApImage.
 * @constructor ApImageStyle
 */

'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _apemanReactStyle = require('apeman-react-style');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApImageStyle */
var ApImageStyle = _react2.default.createClass({
  displayName: 'ApImageStyle',

  propTypes: {
    scoped: _react.PropTypes.bool,
    style: _react.PropTypes.object,
    backgroundColor: _react.PropTypes.string
  },
  getDefaultProps: function getDefaultProps() {
    return {
      scoped: false,
      style: {},
      backgroundColor: '#DDD',
      spinColor: 'rgba(255,255,255,0.5)'
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;
    var backgroundColor = props.backgroundColor;
    var spinColor = props.spinColor;

    var transitionDuration = 100;

    var data = {
      '.ap-image': {
        backgroundColor: '' + backgroundColor,
        overflow: 'hidden',
        textAlign: 'center',
        display: 'inline-block',
        position: 'relative'
      },
      '.ap-image img': {
        opacity: 0,
        transition: 'width ' + transitionDuration + 'ms, opacity ' + transitionDuration + 'ms'
      },
      '.ap-image-ready img': {
        opacity: 1
      },
      '.ap-image-content': {
        position: 'absolute',
        display: 'inline-block'
      },
      '.ap-image-spinner': {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        textAlign: 'center',
        display: 'block',
        zIndex: 8,
        backgroundColor: 'rgba(0,0,0,0.1)',
        color: '' + spinColor
      },
      '.ap-image-notfound': {
        display: 'block',
        textAlign: 'center',
        color: 'rgba(0,0,0,0.1)',
        fontFamily: 'monospace'
      }
    };
    var smallMediaData = {};
    var mediumMediaData = {};
    var largeMediaData = {};
    return _react2.default.createElement(
      _apemanReactStyle.ApStyle,
      { scoped: props.scoped,
        data: Object.assign(data, props.style),
        smallMediaData: smallMediaData,
        mediumMediaData: mediumMediaData,
        largeMediaData: largeMediaData
      },
      props.children
    );
  }
});

module.exports = ApImageStyle;

},{"apeman-react-style":"apeman-react-style","react":"react"}],20:[function(require,module,exports){
/**
 * apeman react package for image component.
 * @module apeman-react-image
 */

'use strict'

module.exports = {
  /**
   * @name ApImageStyle
   */
  get ApImageStyle () { return require('./ap_image_style') },
  /**
   * @name ApImage
   */
  get ApImage () { return require('./ap_image') }
}

},{"./ap_image":18,"./ap_image_style":19}],21:[function(require,module,exports){
/**
 * apeman react package for spinner.
 * @constructor ApSpinner
 */

'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _numcal = require('numcal');

var _numcal2 = _interopRequireDefault(_numcal);

var _apemanReactMixins = require('apeman-react-mixins');

var _consts = require('./consts');

var _consts2 = _interopRequireDefault(_consts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_THEME = 'c';

/** @lends ApSpinner */
var ApSpinner = _react2.default.createClass({
  displayName: 'ApSpinner',

  // --------------------
  // Specs
  // --------------------

  propTypes: {
    enabled: _react.PropTypes.bool,
    theme: _react.PropTypes.oneOf(Object.keys(_consts2.default.themes))
  },

  mixins: [_apemanReactMixins.ApPureMixin, _apemanReactMixins.ApLayoutMixin],

  statics: {
    DEFAULT_THEME: DEFAULT_THEME
  },

  getInitialState: function getInitialState() {
    return {};
  },
  getDefaultProps: function getDefaultProps() {
    return {
      enabled: false,
      theme: DEFAULT_THEME
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;
    var layouts = s.layouts;

    return _react2.default.createElement(
      'div',
      { className: (0, _classnames2.default)('ap-spinner', props.className, {
          'ap-spinner-visible': !!layouts.spinner,
          'ap-spinner-enabled': !!props.enabled
        }),
        style: Object.assign({}, layouts.spinner, props.style) },
      _react2.default.createElement(
        'span',
        { className: 'ap-spinner-aligner' },
        ' '
      ),
      _react2.default.createElement('span', { ref: 'icon',
        className: (0, _classnames2.default)('ap-spinner-icon', _consts2.default.themes[props.theme]),
        style: layouts.icon
      })
    );
  },

  // --------------------
  // Lifecycle
  // --------------------

  componentDidMount: function componentDidMount() {
    var s = this;
    s.setState({
      iconVisible: true
    });
  },
  componentWillUnmount: function componentWillUnmount() {
    var s = this;
  },

  // --------------------
  // For ApLayoutMixin
  // --------------------

  getInitialLayouts: function getInitialLayouts() {
    return {
      spinner: null,
      icon: null
    };
  },
  calcLayouts: function calcLayouts() {
    var s = this;
    var node = _reactDom2.default.findDOMNode(s);

    var parent = node.parentNode || node.parentElement;
    var w = _numcal2.default.max(parent.offsetWidth, node.offsetWidth);
    var h = _numcal2.default.max(parent.offsetHeight, node.offsetHeight);
    var size = _numcal2.default.min(w, h);
    var iconSize = _numcal2.default.min(size * 0.5, 60);

    return {
      spinner: {
        lineHeight: size + 'px',
        fontSize: iconSize + 'px'
      },
      icon: {
        width: iconSize + 'px',
        height: iconSize + 'px'
      }
    };
  }
});

module.exports = ApSpinner;

},{"./consts":23,"apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","numcal":27,"react":"react","react-dom":"react-dom"}],22:[function(require,module,exports){
/**
 * Style for ApSpinner.
 * @constructor ApSpinnerStyle
 */

'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _apemanReactStyle = require('apeman-react-style');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApSpinnerStyle */
var ApSpinnerStyle = _react2.default.createClass({
  displayName: 'ApSpinnerStyle',

  statics: {
    alignerStyle: {
      width: 1,
      overflow: 'hidden',
      display: 'inline-block',
      marginRight: '-1px',
      verticalAlign: 'middle',
      color: 'transparent',
      opacity: 0,
      height: '100%'
    }
  },
  propTypes: {
    scoped: _react.PropTypes.bool,
    type: _react.PropTypes.string,
    style: _react.PropTypes.object
  },
  getDefaultProps: function getDefaultProps() {
    return {
      scoped: false,
      type: 'text/css',
      style: {}
    };
  },
  render: function render() {
    var s = this;
    var props = s.props;

    var data = {
      '.ap-spinner': {
        textAlign: 'center',
        display: 'none'
      },
      '.ap-spinner.ap-spinner-enabled': {
        display: 'block'
      },
      '.ap-spinner-icon': {
        display: 'inline-block',
        margin: '0 4px',
        transition: 'opacity 100ms',
        opacity: 0
      },
      '.ap-spinner-visible .ap-spinner-icon': {
        opacity: 1
      },
      '.ap-spinner-aligner': ApSpinnerStyle.alignerStyle
    };
    var smallMediaData = {};
    var mediumMediaData = {};
    var largeMediaData = {};

    return _react2.default.createElement(
      _apemanReactStyle.ApStyle,
      { scoped: props.scoped,
        data: Object.assign(data, props.style),
        smallMediaData: smallMediaData,
        mediumMediaData: mediumMediaData,
        largeMediaData: largeMediaData
      },
      props.children
    );
  }
});

module.exports = ApSpinnerStyle;

},{"apeman-react-style":"apeman-react-style","react":"react"}],23:[function(require,module,exports){
'use strict';

exports.themes = {
  a: ['fa', 'fa-spin', 'fa-spinner'],
  b: ['fa', 'fa-spin', 'fa-circle-o-notch'],
  c: ['fa', 'fa-spin', 'fa-refresh'],
  d: ['fa', 'fa-spin', 'fa-gear'],
  e: ['fa', 'fa-spin', 'fa-pulse']
};

},{}],24:[function(require,module,exports){
/**
 * apeman react package for spinner.
 * @module apeman-react-spinner
 */

'use strict'

module.exports = {
  /**
   * @name ApSpinnerStyle
   */
  get ApSpinnerStyle () { return require('./ap_spinner_style') },
  /**
   * @name ApSpinner
   */
  get ApSpinner () { return require('./ap_spinner') },
  get consts () { return require('./consts') }
}

},{"./ap_spinner":21,"./ap_spinner_style":22,"./consts":23}],25:[function(require,module,exports){
(function (process,global){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.async = global.async || {})));
}(this, function (exports) { 'use strict';

    /**
     * A faster alternative to `Function#apply`, this function invokes `func`
     * with the `this` binding of `thisArg` and the arguments of `args`.
     *
     * @private
     * @param {Function} func The function to invoke.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {...*} args The arguments to invoke `func` with.
     * @returns {*} Returns the result of `func`.
     */
    function apply(func, thisArg, args) {
      var length = args.length;
      switch (length) {
        case 0: return func.call(thisArg);
        case 1: return func.call(thisArg, args[0]);
        case 2: return func.call(thisArg, args[0], args[1]);
        case 3: return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    var funcTag = '[object Function]';
    var genTag = '[object GeneratorFunction]';
    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto.toString;

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 8 which returns 'object' for typed array and weak map constructors,
      // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
      var tag = isObject(value) ? objectToString.call(value) : '';
      return tag == funcTag || tag == genTag;
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return !!value && typeof value == 'object';
    }

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$1 = objectProto$1.toString;

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && objectToString$1.call(value) == symbolTag);
    }

    /** Used as references for various `Number` constants. */
    var NAN = 0 / 0;

    /** Used to match leading and trailing whitespace. */
    var reTrim = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal = /^0o[0-7]+$/i;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt = parseInt;

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3);
     * // => 3
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3');
     * // => 3
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = isFunction(value.valueOf) ? value.valueOf() : value;
        value = isObject(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ?  value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    var INFINITY = 1 / 0;
    var MAX_INTEGER = 1.7976931348623157e+308;
    /**
     * Converts `value` to an integer.
     *
     * **Note:** This function is loosely based on
     * [`ToInteger`](http://www.ecma-international.org/ecma-262/6.0/#sec-tointeger).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.toInteger(3);
     * // => 3
     *
     * _.toInteger(Number.MIN_VALUE);
     * // => 0
     *
     * _.toInteger(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toInteger('3');
     * // => 3
     */
    function toInteger(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = (value < 0 ? -1 : 1);
        return sign * MAX_INTEGER;
      }
      var remainder = value % 1;
      return value === value ? (remainder ? value - remainder : value) : 0;
    }

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max;

    /**
     * Creates a function that invokes `func` with the `this` binding of the
     * created function and arguments from `start` and beyond provided as
     * an array.
     *
     * **Note:** This method is based on the
     * [rest parameter](https://mdn.io/rest_parameters).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Function
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.rest(function(what, names) {
     *   return what + ' ' + _.initial(names).join(', ') +
     *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
     * });
     *
     * say('hello', 'fred', 'barney', 'pebbles');
     * // => 'hello fred, barney, & pebbles'
     */
    function rest(func, start) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      start = nativeMax(start === undefined ? (func.length - 1) : toInteger(start), 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            array = Array(length);

        while (++index < length) {
          array[index] = args[start + index];
        }
        switch (start) {
          case 0: return func.call(this, array);
          case 1: return func.call(this, args[0], array);
          case 2: return func.call(this, args[0], args[1], array);
        }
        var otherArgs = Array(start + 1);
        index = -1;
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = array;
        return apply(func, this, otherArgs);
      };
    }

    function initialParams (fn) {
        return rest(function (args /*..., callback*/) {
            var callback = args.pop();
            fn.call(this, args, callback);
        });
    }

    function applyEach$1(eachfn) {
        return rest(function (fns, args) {
            var go = initialParams(function (args, callback) {
                var that = this;
                return eachfn(fns, function (fn, cb) {
                    fn.apply(that, args.concat([cb]));
                }, callback);
            });
            if (args.length) {
                return go.apply(this, args);
            } else {
                return go;
            }
        });
    }

    /**
     * A no-operation function that returns `undefined` regardless of the
     * arguments it receives.
     *
     * @static
     * @memberOf _
     * @since 2.3.0
     * @category Util
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // No operation performed.
    }

    function once(fn) {
        return function () {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    /**
     * The base implementation of `_.property` without support for deep paths.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @returns {Function} Returns the new function.
     */
    function baseProperty(key) {
      return function(object) {
        return object == null ? undefined : object[key];
      };
    }

    /**
     * Gets the "length" property value of `object`.
     *
     * **Note:** This function is used to avoid a
     * [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792) that affects
     * Safari on at least iOS 8.1-8.3 ARM64.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {*} Returns the "length" value.
     */
    var getLength = baseProperty('length');

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length,
     *  else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength(getLength(value)) && !isFunction(value);
    }

    var iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator;

    function getIterator (coll) {
        return iteratorSymbol && coll[iteratorSymbol] && coll[iteratorSymbol]();
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetPrototype = Object.getPrototypeOf;

    /**
     * Gets the `[[Prototype]]` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {null|Object} Returns the `[[Prototype]]`.
     */
    function getPrototype(value) {
      return nativeGetPrototype(Object(value));
    }

    /** Used for built-in method references. */
    var objectProto$2 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto$2.hasOwnProperty;

    /**
     * The base implementation of `_.has` without support for deep paths.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} key The key to check.
     * @returns {boolean} Returns `true` if `key` exists, else `false`.
     */
    function baseHas(object, key) {
      // Avoid a bug in IE 10-11 where objects with a [[Prototype]] of `null`,
      // that are composed entirely of index properties, return `false` for
      // `hasOwnProperty` checks of them.
      return hasOwnProperty.call(object, key) ||
        (typeof object == 'object' && key in object && getPrototype(object) === null);
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeKeys = Object.keys;

    /**
     * The base implementation of `_.keys` which doesn't skip the constructor
     * property of prototypes or treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      return nativeKeys(Object(object));
    }

    /**
     * The base implementation of `_.times` without support for iteratee shorthands
     * or max array length checks.
     *
     * @private
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     */
    function baseTimes(n, iteratee) {
      var index = -1,
          result = Array(n);

      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }

    /**
     * This method is like `_.isArrayLike` except that it also checks if `value`
     * is an object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array-like object,
     *  else `false`.
     * @example
     *
     * _.isArrayLikeObject([1, 2, 3]);
     * // => true
     *
     * _.isArrayLikeObject(document.body.children);
     * // => true
     *
     * _.isArrayLikeObject('abc');
     * // => false
     *
     * _.isArrayLikeObject(_.noop);
     * // => false
     */
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]';

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$3.hasOwnProperty;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$2 = objectProto$3.toString;

    /** Built-in value references. */
    var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      // Safari 8.1 incorrectly makes `arguments.callee` enumerable in strict mode.
      return isArrayLikeObject(value) && hasOwnProperty$1.call(value, 'callee') &&
        (!propertyIsEnumerable.call(value, 'callee') || objectToString$2.call(value) == argsTag);
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @type {Function}
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    /** `Object#toString` result references. */
    var stringTag = '[object String]';

    /** Used for built-in method references. */
    var objectProto$4 = Object.prototype;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$3 = objectProto$4.toString;

    /**
     * Checks if `value` is classified as a `String` primitive or object.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isString('abc');
     * // => true
     *
     * _.isString(1);
     * // => false
     */
    function isString(value) {
      return typeof value == 'string' ||
        (!isArray(value) && isObjectLike(value) && objectToString$3.call(value) == stringTag);
    }

    /**
     * Creates an array of index keys for `object` values of arrays,
     * `arguments` objects, and strings, otherwise `null` is returned.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array|null} Returns index keys, else `null`.
     */
    function indexKeys(object) {
      var length = object ? object.length : undefined;
      if (isLength(length) &&
          (isArray(object) || isString(object) || isArguments(object))) {
        return baseTimes(length, String);
      }
      return null;
    }

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER$1 = 9007199254740991;

    /** Used to detect unsigned integer values. */
    var reIsUint = /^(?:0|[1-9]\d*)$/;

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
      length = length == null ? MAX_SAFE_INTEGER$1 : length;
      return value > -1 && value % 1 == 0 && value < length;
    }

    /** Used for built-in method references. */
    var objectProto$5 = Object.prototype;

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$5;

      return value === proto;
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    function keys(object) {
      var isProto = isPrototype(object);
      if (!(isProto || isArrayLike(object))) {
        return baseKeys(object);
      }
      var indexes = indexKeys(object),
          skipIndexes = !!indexes,
          result = indexes || [],
          length = result.length;

      for (var key in object) {
        if (baseHas(object, key) &&
            !(skipIndexes && (key == 'length' || isIndex(key, length))) &&
            !(isProto && key == 'constructor')) {
          result.push(key);
        }
      }
      return result;
    }

    function iterator(coll) {
        var i = -1;
        var len;
        if (isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? { value: coll[i], key: i } : null;
            };
        }

        var iterate = getIterator(coll);
        if (iterate) {
            return function next() {
                var item = iterate.next();
                if (item.done) return null;
                i++;
                return { value: item.value, key: i };
            };
        }

        var okeys = keys(coll);
        len = okeys.length;
        return function next() {
            i++;
            var key = okeys[i];
            return i < len ? { value: coll[key], key: key } : null;
        };
    }

    function onlyOnce(fn) {
        return function () {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _eachOfLimit(limit) {
        return function (obj, iteratee, callback) {
            callback = once(callback || noop);
            obj = obj || [];
            var nextElem = iterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish() {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var elem = nextElem();
                    if (elem === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iteratee(elem.value, elem.key, onlyOnce(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        } else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }

    function doParallelLimit(fn) {
        return function (obj, limit, iteratee, callback) {
            return fn(_eachOfLimit(limit), obj, iteratee, callback);
        };
    }

    function _asyncMap(eachfn, arr, iteratee, callback) {
        callback = once(callback || noop);
        arr = arr || [];
        var results = isArrayLike(arr) || getIterator(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iteratee(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    var mapLimit = doParallelLimit(_asyncMap);

    function doLimit(fn, limit) {
        return function (iterable, iteratee, callback) {
            return fn(iterable, limit, iteratee, callback);
        };
    }

    var map = doLimit(mapLimit, Infinity);

    var applyEach = applyEach$1(map);

    var mapSeries = doLimit(mapLimit, 1);

    var applyEachSeries = applyEach$1(mapSeries);

    var apply$1 = rest(function (fn, args) {
        return rest(function (callArgs) {
            return fn.apply(null, args.concat(callArgs));
        });
    });

    function asyncify(func) {
        return initialParams(function (args, callback) {
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (isObject(result) && typeof result.then === 'function') {
                result.then(function (value) {
                    callback(null, value);
                })['catch'](function (err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    }

    /**
     * A specialized version of `_.forEach` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEach(array, iteratee) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * Creates a base function for methods like `_.forIn` and `_.forOwn`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var index = -1,
            iterable = Object(object),
            props = keysFunc(object),
            length = props.length;

        while (length--) {
          var key = props[fromRight ? length : ++index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * The base implementation of `baseForOwn` which iterates over `object`
     * properties returned by `keysFunc` invoking `iteratee` for each property.
     * Iteratee functions may exit iteration early by explicitly returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    /**
     * The base implementation of `_.forOwn` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwn(object, iteratee) {
      return object && baseFor(object, iteratee, keys);
    }

    /**
     * Removes all key-value entries from the stack.
     *
     * @private
     * @name clear
     * @memberOf Stack
     */
    function stackClear() {
      this.__data__ = { 'array': [], 'map': null };
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'fred' };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    /** Used for built-in method references. */
    var arrayProto = Array.prototype;

    /** Built-in value references. */
    var splice = arrayProto.splice;

    /**
     * Removes `key` and its value from the associative array.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function assocDelete(array, key) {
      var index = assocIndexOf(array, key);
      if (index < 0) {
        return false;
      }
      var lastIndex = array.length - 1;
      if (index == lastIndex) {
        array.pop();
      } else {
        splice.call(array, index, 1);
      }
      return true;
    }

    /**
     * Removes `key` and its value from the stack.
     *
     * @private
     * @name delete
     * @memberOf Stack
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function stackDelete(key) {
      var data = this.__data__,
          array = data.array;

      return array ? assocDelete(array, key) : data.map['delete'](key);
    }

    /**
     * Gets the associative array value for `key`.
     *
     * @private
     * @param {Array} array The array to query.
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function assocGet(array, key) {
      var index = assocIndexOf(array, key);
      return index < 0 ? undefined : array[index][1];
    }

    /**
     * Gets the stack value for `key`.
     *
     * @private
     * @name get
     * @memberOf Stack
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function stackGet(key) {
      var data = this.__data__,
          array = data.array;

      return array ? assocGet(array, key) : data.map.get(key);
    }

    /**
     * Checks if an associative array value for `key` exists.
     *
     * @private
     * @param {Array} array The array to query.
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function assocHas(array, key) {
      return assocIndexOf(array, key) > -1;
    }

    /**
     * Checks if a stack value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Stack
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function stackHas(key) {
      var data = this.__data__,
          array = data.array;

      return array ? assocHas(array, key) : data.map.has(key);
    }

    /**
     * Checks if `value` is a host object in IE < 9.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
     */
    function isHostObject(value) {
      // Many host objects are `Object` objects that can coerce to strings
      // despite having improperly defined `toString` methods.
      var result = false;
      if (value != null && typeof value.toString != 'function') {
        try {
          result = !!(value + '');
        } catch (e) {}
      }
      return result;
    }

    /** Used to match `RegExp` [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns). */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used for built-in method references. */
    var objectProto$7 = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString = Function.prototype.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$2 = objectProto$7.hasOwnProperty;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString.call(hasOwnProperty$2).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /**
     * Checks if `value` is a native function.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     * @example
     *
     * _.isNative(Array.prototype.push);
     * // => true
     *
     * _.isNative(_);
     * // => false
     */
    function isNative(value) {
      if (value == null) {
        return false;
      }
      if (isFunction(value)) {
        return reIsNative.test(funcToString.call(value));
      }
      return isObjectLike(value) &&
        (isHostObject(value) ? reIsNative : reIsHostCtor).test(value);
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = object[key];
      return isNative(value) ? value : undefined;
    }

    /* Built-in method references that are verified to be native. */
    var nativeCreate = getNative(Object, 'create');

    /** Used for built-in method references. */
    var objectProto$6 = Object.prototype;

    /**
     * Creates an hash object.
     *
     * @private
     * @constructor
     * @returns {Object} Returns the new hash object.
     */
    function Hash() {}

    // Avoid inheriting from `Object.prototype` when possible.
    Hash.prototype = nativeCreate ? nativeCreate(null) : objectProto$6;

    /**
     * Checks if `value` is a global object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {null|Object} Returns `value` if it's a global object, else `null`.
     */
    function checkGlobal(value) {
      return (value && value.Object === Object) ? value : null;
    }

    /** Used to determine if values are of the language type `Object`. */
    var objectTypes = {
      'function': true,
      'object': true
    };

    /** Detect free variable `exports`. */
    var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType)
      ? exports
      : undefined;

    /** Detect free variable `module`. */
    var freeModule = (objectTypes[typeof module] && module && !module.nodeType)
      ? module
      : undefined;

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = checkGlobal(freeExports && freeModule && typeof global == 'object' && global);

    /** Detect free variable `self`. */
    var freeSelf = checkGlobal(objectTypes[typeof self] && self);

    /** Detect free variable `window`. */
    var freeWindow = checkGlobal(objectTypes[typeof window] && window);

    /** Detect `this` as the global object. */
    var thisGlobal = checkGlobal(objectTypes[typeof this] && this);

    /**
     * Used as a reference to the global object.
     *
     * The `this` value is used if it's the global object to avoid Greasemonkey's
     * restricted `window` object, otherwise the `window` object is used.
     */
    var root = freeGlobal ||
      ((freeWindow !== (thisGlobal && thisGlobal.window)) && freeWindow) ||
        freeSelf || thisGlobal || Function('return this')();

    /* Built-in method references that are verified to be native. */
    var Map = getNative(root, 'Map');

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapClear() {
      this.__data__ = {
        'hash': new Hash,
        'map': Map ? new Map : [],
        'string': new Hash
      };
    }

    /** Used for built-in method references. */
    var objectProto$8 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$3 = objectProto$8.hasOwnProperty;

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @param {Object} hash The hash to query.
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(hash, key) {
      return nativeCreate ? hash[key] !== undefined : hasOwnProperty$3.call(hash, key);
    }

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(hash, key) {
      return hashHas(hash, key) && delete hash[key];
    }

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return type == 'number' || type == 'boolean' ||
        (type == 'string' && value != '__proto__') || value == null;
    }

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapDelete(key) {
      var data = this.__data__;
      if (isKeyable(key)) {
        return hashDelete(typeof key == 'string' ? data.string : data.hash, key);
      }
      return Map ? data.map['delete'](key) : assocDelete(data.map, key);
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = '__lodash_hash_undefined__';

    /** Used for built-in method references. */
    var objectProto$9 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$4 = objectProto$9.hasOwnProperty;

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @param {Object} hash The hash to query.
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(hash, key) {
      if (nativeCreate) {
        var result = hash[key];
        return result === HASH_UNDEFINED ? undefined : result;
      }
      return hasOwnProperty$4.call(hash, key) ? hash[key] : undefined;
    }

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapGet(key) {
      var data = this.__data__;
      if (isKeyable(key)) {
        return hashGet(typeof key == 'string' ? data.string : data.hash, key);
      }
      return Map ? data.map.get(key) : assocGet(data.map, key);
    }

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapHas(key) {
      var data = this.__data__;
      if (isKeyable(key)) {
        return hashHas(typeof key == 'string' ? data.string : data.hash, key);
      }
      return Map ? data.map.has(key) : assocHas(data.map, key);
    }

    /**
     * Sets the associative array `key` to `value`.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     */
    function assocSet(array, key, value) {
      var index = assocIndexOf(array, key);
      if (index < 0) {
        array.push([key, value]);
      } else {
        array[index][1] = value;
      }
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     */
    function hashSet(hash, key, value) {
      hash[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
    }

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapSet(key, value) {
      var data = this.__data__;
      if (isKeyable(key)) {
        hashSet(typeof key == 'string' ? data.string : data.hash, key, value);
      } else if (Map) {
        data.map.set(key, value);
      } else {
        assocSet(data.map, key, value);
      }
      return this;
    }

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [values] The values to cache.
     */
    function MapCache(values) {
      var index = -1,
          length = values ? values.length : 0;

      this.clear();
      while (++index < length) {
        var entry = values[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapClear;
    MapCache.prototype['delete'] = mapDelete;
    MapCache.prototype.get = mapGet;
    MapCache.prototype.has = mapHas;
    MapCache.prototype.set = mapSet;

    /** Used as the size to enable large array optimizations. */
    var LARGE_ARRAY_SIZE = 200;

    /**
     * Sets the stack `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Stack
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the stack cache instance.
     */
    function stackSet(key, value) {
      var data = this.__data__,
          array = data.array;

      if (array) {
        if (array.length < (LARGE_ARRAY_SIZE - 1)) {
          assocSet(array, key, value);
        } else {
          data.array = null;
          data.map = new MapCache(array);
        }
      }
      var map = data.map;
      if (map) {
        map.set(key, value);
      }
      return this;
    }

    /**
     * Creates a stack cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [values] The values to cache.
     */
    function Stack(values) {
      var index = -1,
          length = values ? values.length : 0;

      this.clear();
      while (++index < length) {
        var entry = values[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `Stack`.
    Stack.prototype.clear = stackClear;
    Stack.prototype['delete'] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;

    /**
     * A specialized version of `_.some` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function arraySome(array, predicate) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }

    var UNORDERED_COMPARE_FLAG$1 = 1;
    var PARTIAL_COMPARE_FLAG$2 = 2;
    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} customizer The function to customize comparisons.
     * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
     *  for more details.
     * @param {Object} stack Tracks traversed `array` and `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
      var index = -1,
          isPartial = bitmask & PARTIAL_COMPARE_FLAG$2,
          isUnordered = bitmask & UNORDERED_COMPARE_FLAG$1,
          arrLength = array.length,
          othLength = other.length;

      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(array);
      if (stacked) {
        return stacked == other;
      }
      var result = true;
      stack.set(array, other);

      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, arrValue, index, other, array, stack)
            : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== undefined) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (isUnordered) {
          if (!arraySome(other, function(othValue) {
                return arrValue === othValue ||
                  equalFunc(arrValue, othValue, customizer, bitmask, stack);
              })) {
            result = false;
            break;
          }
        } else if (!(
              arrValue === othValue ||
                equalFunc(arrValue, othValue, customizer, bitmask, stack)
            )) {
          result = false;
          break;
        }
      }
      stack['delete'](array);
      return result;
    }

    /** Built-in value references. */
    var Symbol$1 = root.Symbol;

    /** Built-in value references. */
    var Uint8Array = root.Uint8Array;

    /**
     * Converts `map` to an array.
     *
     * @private
     * @param {Object} map The map to convert.
     * @returns {Array} Returns the converted array.
     */
    function mapToArray(map) {
      var index = -1,
          result = Array(map.size);

      map.forEach(function(value, key) {
        result[++index] = [key, value];
      });
      return result;
    }

    /**
     * Converts `set` to an array.
     *
     * @private
     * @param {Object} set The set to convert.
     * @returns {Array} Returns the converted array.
     */
    function setToArray(set) {
      var index = -1,
          result = Array(set.size);

      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }

    var UNORDERED_COMPARE_FLAG$2 = 1;
    var PARTIAL_COMPARE_FLAG$3 = 2;
    var boolTag = '[object Boolean]';
    var dateTag = '[object Date]';
    var errorTag = '[object Error]';
    var mapTag = '[object Map]';
    var numberTag = '[object Number]';
    var regexpTag = '[object RegExp]';
    var setTag = '[object Set]';
    var stringTag$1 = '[object String]';
    var symbolTag$1 = '[object Symbol]';
    var arrayBufferTag = '[object ArrayBuffer]';
    var dataViewTag = '[object DataView]';
    var symbolProto = Symbol$1 ? Symbol$1.prototype : undefined;
    var symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;
    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} customizer The function to customize comparisons.
     * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
     *  for more details.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
      switch (tag) {
        case dataViewTag:
          if ((object.byteLength != other.byteLength) ||
              (object.byteOffset != other.byteOffset)) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;

        case arrayBufferTag:
          if ((object.byteLength != other.byteLength) ||
              !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
            return false;
          }
          return true;

        case boolTag:
        case dateTag:
          // Coerce dates and booleans to numbers, dates to milliseconds and
          // booleans to `1` or `0` treating invalid dates coerced to `NaN` as
          // not equal.
          return +object == +other;

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case numberTag:
          // Treat `NaN` vs. `NaN` as equal.
          return (object != +object) ? other != +other : object == +other;

        case regexpTag:
        case stringTag$1:
          // Coerce regexes to strings and treat strings, primitives and objects,
          // as equal. See https://es5.github.io/#x15.10.6.4 for more details.
          return object == (other + '');

        case mapTag:
          var convert = mapToArray;

        case setTag:
          var isPartial = bitmask & PARTIAL_COMPARE_FLAG$3;
          convert || (convert = setToArray);

          if (object.size != other.size && !isPartial) {
            return false;
          }
          // Assume cyclic values are equal.
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= UNORDERED_COMPARE_FLAG$2;
          stack.set(object, other);

          // Recursively compare objects (susceptible to call stack limits).
          return equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);

        case symbolTag$1:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }

    /** Used to compose bitmasks for comparison styles. */
    var PARTIAL_COMPARE_FLAG$4 = 2;

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} customizer The function to customize comparisons.
     * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
     *  for more details.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
      var isPartial = bitmask & PARTIAL_COMPARE_FLAG$4,
          objProps = keys(object),
          objLength = objProps.length,
          othProps = keys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : baseHas(other, key))) {
          return false;
        }
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      var result = true;
      stack.set(object, other);

      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, objValue, key, other, object, stack)
            : customizer(objValue, othValue, key, object, other, stack);
        }
        // Recursively compare objects (susceptible to call stack limits).
        if (!(compared === undefined
              ? (objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack))
              : compared
            )) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack['delete'](object);
      return result;
    }

    /* Built-in method references that are verified to be native. */
    var DataView = getNative(root, 'DataView');

    /* Built-in method references that are verified to be native. */
    var Promise = getNative(root, 'Promise');

    /* Built-in method references that are verified to be native. */
    var Set = getNative(root, 'Set');

    /* Built-in method references that are verified to be native. */
    var WeakMap = getNative(root, 'WeakMap');

    var mapTag$1 = '[object Map]';
    var objectTag$1 = '[object Object]';
    var promiseTag = '[object Promise]';
    var setTag$1 = '[object Set]';
    var weakMapTag = '[object WeakMap]';
    var dataViewTag$1 = '[object DataView]';

    /** Used for built-in method references. */
    var objectProto$11 = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString$1 = Function.prototype.toString;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$4 = objectProto$11.toString;

    /** Used to detect maps, sets, and weakmaps. */
    var dataViewCtorString = DataView ? (DataView + '') : '';
    var mapCtorString = Map ? funcToString$1.call(Map) : '';
    var promiseCtorString = Promise ? funcToString$1.call(Promise) : '';
    var setCtorString = Set ? funcToString$1.call(Set) : '';
    var weakMapCtorString = WeakMap ? funcToString$1.call(WeakMap) : '';
    /**
     * Gets the `toStringTag` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function getTag(value) {
      return objectToString$4.call(value);
    }

    // Fallback for data views, maps, sets, and weak maps in IE 11,
    // for data views in Edge, and promises in Node.js.
    if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag$1) ||
        (Map && getTag(new Map) != mapTag$1) ||
        (Promise && getTag(Promise.resolve()) != promiseTag) ||
        (Set && getTag(new Set) != setTag$1) ||
        (WeakMap && getTag(new WeakMap) != weakMapTag)) {
      getTag = function(value) {
        var result = objectToString$4.call(value),
            Ctor = result == objectTag$1 ? value.constructor : null,
            ctorString = typeof Ctor == 'function' ? funcToString$1.call(Ctor) : '';

        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString: return dataViewTag$1;
            case mapCtorString: return mapTag$1;
            case promiseCtorString: return promiseTag;
            case setCtorString: return setTag$1;
            case weakMapCtorString: return weakMapTag;
          }
        }
        return result;
      };
    }

    var getTag$1 = getTag;

    var argsTag$2 = '[object Arguments]';
    var arrayTag$1 = '[object Array]';
    var boolTag$1 = '[object Boolean]';
    var dateTag$1 = '[object Date]';
    var errorTag$1 = '[object Error]';
    var funcTag$1 = '[object Function]';
    var mapTag$2 = '[object Map]';
    var numberTag$1 = '[object Number]';
    var objectTag$2 = '[object Object]';
    var regexpTag$1 = '[object RegExp]';
    var setTag$2 = '[object Set]';
    var stringTag$2 = '[object String]';
    var weakMapTag$1 = '[object WeakMap]';
    var arrayBufferTag$1 = '[object ArrayBuffer]';
    var dataViewTag$2 = '[object DataView]';
    var float32Tag = '[object Float32Array]';
    var float64Tag = '[object Float64Array]';
    var int8Tag = '[object Int8Array]';
    var int16Tag = '[object Int16Array]';
    var int32Tag = '[object Int32Array]';
    var uint8Tag = '[object Uint8Array]';
    var uint8ClampedTag = '[object Uint8ClampedArray]';
    var uint16Tag = '[object Uint16Array]';
    var uint32Tag = '[object Uint32Array]';
    /** Used to identify `toStringTag` values of typed arrays. */
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
    typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
    typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
    typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
    typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag$2] = typedArrayTags[arrayTag$1] =
    typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] =
    typedArrayTags[dataViewTag$2] = typedArrayTags[dateTag$1] =
    typedArrayTags[errorTag$1] = typedArrayTags[funcTag$1] =
    typedArrayTags[mapTag$2] = typedArrayTags[numberTag$1] =
    typedArrayTags[objectTag$2] = typedArrayTags[regexpTag$1] =
    typedArrayTags[setTag$2] = typedArrayTags[stringTag$2] =
    typedArrayTags[weakMapTag$1] = false;

    /** Used for built-in method references. */
    var objectProto$12 = Object.prototype;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$5 = objectProto$12.toString;

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    function isTypedArray(value) {
      return isObjectLike(value) &&
        isLength(value.length) && !!typedArrayTags[objectToString$5.call(value)];
    }

    /** Used to compose bitmasks for comparison styles. */
    var PARTIAL_COMPARE_FLAG$1 = 2;

    /** `Object#toString` result references. */
    var argsTag$1 = '[object Arguments]';
    var arrayTag = '[object Array]';
    var objectTag = '[object Object]';
    /** Used for built-in method references. */
    var objectProto$10 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$5 = objectProto$10.hasOwnProperty;

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparisons.
     * @param {number} [bitmask] The bitmask of comparison flags. See `baseIsEqual`
     *  for more details.
     * @param {Object} [stack] Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
      var objIsArr = isArray(object),
          othIsArr = isArray(other),
          objTag = arrayTag,
          othTag = arrayTag;

      if (!objIsArr) {
        objTag = getTag$1(object);
        objTag = objTag == argsTag$1 ? objectTag : objTag;
      }
      if (!othIsArr) {
        othTag = getTag$1(other);
        othTag = othTag == argsTag$1 ? objectTag : othTag;
      }
      var objIsObj = objTag == objectTag && !isHostObject(object),
          othIsObj = othTag == objectTag && !isHostObject(other),
          isSameTag = objTag == othTag;

      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack);
        return (objIsArr || isTypedArray(object))
          ? equalArrays(object, other, equalFunc, customizer, bitmask, stack)
          : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
      }
      if (!(bitmask & PARTIAL_COMPARE_FLAG$1)) {
        var objIsWrapped = objIsObj && hasOwnProperty$5.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty$5.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object,
              othUnwrapped = othIsWrapped ? other.value() : other;

          stack || (stack = new Stack);
          return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack);
      return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
    }

    /**
     * The base implementation of `_.isEqual` which supports partial comparisons
     * and tracks traversed objects.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize comparisons.
     * @param {boolean} [bitmask] The bitmask of comparison flags.
     *  The bitmask may be composed of the following flags:
     *     1 - Unordered comparison
     *     2 - Partial comparison
     * @param {Object} [stack] Tracks traversed `value` and `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, customizer, bitmask, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
    }

    var UNORDERED_COMPARE_FLAG = 1;
    var PARTIAL_COMPARE_FLAG = 2;
    /**
     * The base implementation of `_.isMatch` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property values to match.
     * @param {Array} matchData The property names, values, and compare flags to match.
     * @param {Function} [customizer] The function to customize comparisons.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     */
    function baseIsMatch(object, source, matchData, customizer) {
      var index = matchData.length,
          length = index,
          noCustomizer = !customizer;

      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (index--) {
        var data = matchData[index];
        if ((noCustomizer && data[2])
              ? data[1] !== object[data[0]]
              : !(data[0] in object)
            ) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0],
            objValue = object[key],
            srcValue = data[1];

        if (noCustomizer && data[2]) {
          if (objValue === undefined && !(key in object)) {
            return false;
          }
        } else {
          var stack = new Stack;
          if (customizer) {
            var result = customizer(objValue, srcValue, key, object, source, stack);
          }
          if (!(result === undefined
                ? baseIsEqual(srcValue, objValue, customizer, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG, stack)
                : result
              )) {
            return false;
          }
        }
      }
      return true;
    }

    /**
     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` if suitable for strict
     *  equality comparisons, else `false`.
     */
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }

    /**
     * A specialized version of `_.map` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap(array, iteratee) {
      var index = -1,
          length = array.length,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }

    /**
     * The base implementation of `_.toPairs` and `_.toPairsIn` which creates an array
     * of key-value pairs for `object` corresponding to the property names of `props`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} props The property names to get values for.
     * @returns {Object} Returns the new array of key-value pairs.
     */
    function baseToPairs(object, props) {
      return arrayMap(props, function(key) {
        return [key, object[key]];
      });
    }

    /**
     * Creates an array of own enumerable string keyed-value pairs for `object`
     * which can be consumed by `_.fromPairs`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @alias entries
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the new array of key-value pairs.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.toPairs(new Foo);
     * // => [['a', 1], ['b', 2]] (iteration order is not guaranteed)
     */
    function toPairs(object) {
      return baseToPairs(object, keys(object));
    }

    /**
     * Gets the property names, values, and compare flags of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the match data of `object`.
     */
    function getMatchData(object) {
      var result = toPairs(object),
          length = result.length;

      while (length--) {
        result[length][2] = isStrictComparable(result[length][1]);
      }
      return result;
    }

    /**
     * The base implementation of `_.matches` which doesn't clone `source`.
     *
     * @private
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new function.
     */
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        var key = matchData[0][0],
            value = matchData[0][1];

        return function(object) {
          if (object == null) {
            return false;
          }
          return object[key] === value &&
            (value !== undefined || (key in Object(object)));
        };
      }
      return function(object) {
        return object === source || baseIsMatch(object, source, matchData);
      };
    }

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT$1 = 'Expected a function';

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it determines the cache key for storing the result based on the
     * arguments provided to the memoized function. By default, the first argument
     * provided to the memoized function is used as the map cache key. The `func`
     * is invoked with the `this` binding of the memoized function.
     *
     * **Note:** The cache is exposed as the `cache` property on the memoized
     * function. Its creation may be customized by replacing the `_.memoize.Cache`
     * constructor with one whose instances implement the
     * [`Map`](http://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-map-prototype-object)
     * method interface of `delete`, `get`, `has`, and `set`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] The function to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var object = { 'a': 1, 'b': 2 };
     * var other = { 'c': 3, 'd': 4 };
     *
     * var values = _.memoize(_.values);
     * values(object);
     * // => [1, 2]
     *
     * values(other);
     * // => [3, 4]
     *
     * object.a = 2;
     * values(object);
     * // => [1, 2]
     *
     * // Modify the result cache.
     * values.cache.set(object, ['a', 'b']);
     * values(object);
     * // => ['a', 'b']
     *
     * // Replace `_.memoize.Cache`.
     * _.memoize.Cache = WeakMap;
     */
    function memoize(func, resolver) {
      if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
        throw new TypeError(FUNC_ERROR_TEXT$1);
      }
      var memoized = function() {
        var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result);
        return result;
      };
      memoized.cache = new (memoize.Cache || MapCache);
      return memoized;
    }

    // Assign cache to `_.memoize`.
    memoize.Cache = MapCache;

    /** Used as references for various `Number` constants. */
    var INFINITY$1 = 1 / 0;

    /** Used to convert symbols to primitives and strings. */
    var symbolProto$1 = Symbol$1 ? Symbol$1.prototype : undefined;
    var symbolToString = symbolProto$1 ? symbolProto$1.toString : undefined;
    /**
     * Converts `value` to a string if it's not one. An empty string is returned
     * for `null` and `undefined` values. The sign of `-0` is preserved.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {string} Returns the string.
     * @example
     *
     * _.toString(null);
     * // => ''
     *
     * _.toString(-0);
     * // => '-0'
     *
     * _.toString([1, 2, 3]);
     * // => '1,2,3'
     */
    function toString(value) {
      // Exit early for strings to avoid a performance hit in some environments.
      if (typeof value == 'string') {
        return value;
      }
      if (value == null) {
        return '';
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : '';
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
    }

    /** Used to match property names within property paths. */
    var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]/g;

    /** Used to match backslashes in property paths. */
    var reEscapeChar = /\\(\\)?/g;

    /**
     * Converts `string` to a property path array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the property path array.
     */
    var stringToPath = memoize(function(string) {
      var result = [];
      toString(string).replace(rePropName, function(match, number, quote, string) {
        result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
      });
      return result;
    });

    /**
     * Casts `value` to a path array if it's not one.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {Array} Returns the cast property path array.
     */
    function baseCastPath(value) {
      return isArray(value) ? value : stringToPath(value);
    }

    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
    var reIsPlainProp = /^\w*$/;
    /**
     * Checks if `value` is a property name and not a property path.
     *
     * @private
     * @param {*} value The value to check.
     * @param {Object} [object] The object to query keys on.
     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
     */
    function isKey(value, object) {
      var type = typeof value;
      if (type == 'number' || type == 'symbol') {
        return true;
      }
      return !isArray(value) &&
        (isSymbol(value) || reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
          (object != null && value in Object(object)));
    }

    /**
     * The base implementation of `_.get` without support for default values.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @returns {*} Returns the resolved value.
     */
    function baseGet(object, path) {
      path = isKey(path, object) ? [path] : baseCastPath(path);

      var index = 0,
          length = path.length;

      while (object != null && index < length) {
        object = object[path[index++]];
      }
      return (index && index == length) ? object : undefined;
    }

    /**
     * Gets the value at `path` of `object`. If the resolved value is
     * `undefined` the `defaultValue` is used in its place.
     *
     * @static
     * @memberOf _
     * @since 3.7.0
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @param {*} [defaultValue] The value returned for `undefined` resolved values.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.get(object, 'a[0].b.c');
     * // => 3
     *
     * _.get(object, ['a', '0', 'b', 'c']);
     * // => 3
     *
     * _.get(object, 'a.b.c', 'default');
     * // => 'default'
     */
    function get(object, path, defaultValue) {
      var result = object == null ? undefined : baseGet(object, path);
      return result === undefined ? defaultValue : result;
    }

    /**
     * The base implementation of `_.hasIn` without support for deep paths.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} key The key to check.
     * @returns {boolean} Returns `true` if `key` exists, else `false`.
     */
    function baseHasIn(object, key) {
      return key in Object(object);
    }

    /**
     * Checks if `path` exists on `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @param {Function} hasFunc The function to check properties.
     * @returns {boolean} Returns `true` if `path` exists, else `false`.
     */
    function hasPath(object, path, hasFunc) {
      if (object == null) {
        return false;
      }
      var result = hasFunc(object, path);
      if (!result && !isKey(path)) {
        path = baseCastPath(path);

        var index = -1,
            length = path.length;

        while (object != null && ++index < length) {
          var key = path[index];
          if (!(result = hasFunc(object, key))) {
            break;
          }
          object = object[key];
        }
      }
      var length = object ? object.length : undefined;
      return result || (
        !!length && isLength(length) && isIndex(path, length) &&
        (isArray(object) || isString(object) || isArguments(object))
      );
    }

    /**
     * Checks if `path` is a direct or inherited property of `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @returns {boolean} Returns `true` if `path` exists, else `false`.
     * @example
     *
     * var object = _.create({ 'a': _.create({ 'b': _.create({ 'c': 3 }) }) });
     *
     * _.hasIn(object, 'a');
     * // => true
     *
     * _.hasIn(object, 'a.b.c');
     * // => true
     *
     * _.hasIn(object, ['a', 'b', 'c']);
     * // => true
     *
     * _.hasIn(object, 'b');
     * // => false
     */
    function hasIn(object, path) {
      return hasPath(object, path, baseHasIn);
    }

    var UNORDERED_COMPARE_FLAG$3 = 1;
    var PARTIAL_COMPARE_FLAG$5 = 2;
    /**
     * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
     *
     * @private
     * @param {string} path The path of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new function.
     */
    function baseMatchesProperty(path, srcValue) {
      return function(object) {
        var objValue = get(object, path);
        return (objValue === undefined && objValue === srcValue)
          ? hasIn(object, path)
          : baseIsEqual(srcValue, objValue, undefined, UNORDERED_COMPARE_FLAG$3 | PARTIAL_COMPARE_FLAG$5);
      };
    }

    /**
     * This method returns the first argument given to it.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * A specialized version of `baseProperty` which supports deep paths.
     *
     * @private
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     */
    function basePropertyDeep(path) {
      return function(object) {
        return baseGet(object, path);
      };
    }

    /**
     * Creates a function that returns the value at `path` of a given object.
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Util
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': { 'c': 2 } } },
     *   { 'a': { 'b': { 'c': 1 } } }
     * ];
     *
     * _.map(objects, _.property('a.b.c'));
     * // => [2, 1]
     *
     * _.map(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
     * // => [1, 2]
     */
    function property(path) {
      return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
    }

    /**
     * The base implementation of `_.iteratee`.
     *
     * @private
     * @param {*} [value=_.identity] The value to convert to an iteratee.
     * @returns {Function} Returns the iteratee.
     */
    function baseIteratee(value) {
      // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
      // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
      if (typeof value == 'function') {
        return value;
      }
      if (value == null) {
        return identity;
      }
      if (typeof value == 'object') {
        return isArray(value)
          ? baseMatchesProperty(value[0], value[1])
          : baseMatches(value);
      }
      return property(value);
    }

    /**
     * Iterates over own enumerable string keyed properties of an object invoking
     * `iteratee` for each property. The iteratee is invoked with three arguments:
     * (value, key, object). Iteratee functions may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @since 0.3.0
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => Logs 'a' then 'b' (iteration order is not guaranteed).
     */
    function forOwn(object, iteratee) {
      return object && baseForOwn(object, baseIteratee(iteratee));
    }

    /**
     * Gets the index at which the first occurrence of `NaN` is found in `array`.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {number} fromIndex The index to search from.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {number} Returns the index of the matched `NaN`, else `-1`.
     */
    function indexOfNaN(array, fromIndex, fromRight) {
      var length = array.length,
          index = fromIndex + (fromRight ? 0 : -1);

      while ((fromRight ? index-- : ++index < length)) {
        var other = array[index];
        if (other !== other) {
          return index;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseIndexOf(array, value, fromIndex) {
      if (value !== value) {
        return indexOfNaN(array, fromIndex);
      }
      var index = fromIndex - 1,
          length = array.length;

      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    function auto (tasks, concurrency, callback) {
        if (typeof concurrency === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = once(callback || noop);
        var keys$$ = keys(tasks);
        var numTasks = keys$$.length;
        if (!numTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = numTasks;
        }

        var results = {};
        var runningTasks = 0;
        var hasError = false;

        var listeners = {};

        var readyTasks = [];

        forOwn(tasks, function (task, key) {
            if (!isArray(task)) {
                // no dependencies
                enqueueTask(key, [task]);
                return;
            }

            var dependencies = task.slice(0, task.length - 1);
            var remainingDependencies = dependencies.length;

            checkForDeadlocks();

            function checkForDeadlocks() {
                var len = dependencies.length;
                var dep;
                while (len--) {
                    if (!(dep = tasks[dependencies[len]])) {
                        throw new Error('async.auto task `' + key + '` has non-existent dependency in ' + dependencies.join(', '));
                    }
                    if (isArray(dep) && baseIndexOf(dep, key, 0) >= 0) {
                        throw new Error('async.auto task `' + key + '`Has cyclic dependencies');
                    }
                }
            }

            arrayEach(dependencies, function (dependencyName) {
                addListener(dependencyName, function () {
                    remainingDependencies--;
                    if (remainingDependencies === 0) {
                        enqueueTask(key, task);
                    }
                });
            });
        });

        processQueue();

        function enqueueTask(key, task) {
            readyTasks.push(function () {
                runTask(key, task);
            });
        }

        function processQueue() {
            if (readyTasks.length === 0 && runningTasks === 0) {
                return callback(null, results);
            }
            while (readyTasks.length && runningTasks < concurrency) {
                var run = readyTasks.shift();
                run();
            }
        }

        function addListener(taskName, fn) {
            var taskListeners = listeners[taskName];
            if (!taskListeners) {
                taskListeners = listeners[taskName] = [];
            }

            taskListeners.push(fn);
        }

        function taskComplete(taskName) {
            var taskListeners = listeners[taskName] || [];
            arrayEach(taskListeners, function (fn) {
                fn();
            });
            processQueue();
        }

        function runTask(key, task) {
            if (hasError) return;

            var taskCallback = onlyOnce(rest(function (err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    forOwn(results, function (val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[key] = args;
                    hasError = true;
                    listeners = [];

                    callback(err, safeResults);
                } else {
                    results[key] = args;
                    taskComplete(key);
                }
            }));

            runningTasks++;
            var taskFn = task[task.length - 1];
            if (task.length > 1) {
                taskFn(results, taskCallback);
            } else {
                taskFn(taskCallback);
            }
        }
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    var argsRegex = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;

    function parseParams(func) {
        return func.toString().match(argsRegex)[1].split(/\s*\,\s*/);
    }

    function autoInject(tasks, callback) {
        var newTasks = {};

        forOwn(tasks, function (taskFn, key) {
            var params;

            if (isArray(taskFn)) {
                params = copyArray(taskFn);
                taskFn = params.pop();

                newTasks[key] = params.concat(newTask);
            } else if (taskFn.length === 0) {
                throw new Error("autoInject task functions require explicit parameters.");
            } else if (taskFn.length === 1) {
                // no dependencies, use the function as-is
                newTasks[key] = taskFn;
            } else {
                params = parseParams(taskFn);
                params.pop();

                newTasks[key] = params.concat(newTask);
            }

            function newTask(results, taskCb) {
                var newArgs = arrayMap(params, function (name) {
                    return results[name];
                });
                newArgs.push(taskCb);
                taskFn.apply(null, newArgs);
            }
        });

        auto(newTasks, function (err, results) {
            var params;
            if (isArray(callback)) {
                params = copyArray(callback);
                callback = params.pop();
            } else {
                params = parseParams(callback);
                params.shift();
            }

            params = arrayMap(params, function (name) {
                return results[name];
            });

            params.unshift(err);
            callback.apply(null, params);
        });
    }

    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _defer;
    if (_setImmediate) {
        _defer = _setImmediate;
    } else if (typeof process === 'object' && typeof process.nextTick === 'function') {
        _defer = process.nextTick;
    } else {
        _defer = function (fn) {
            setTimeout(fn, 0);
        };
    }

    var setImmediate$1 = rest(function (fn, args) {
        _defer(function () {
            fn.apply(null, args);
        });
    });

    function queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        } else if (concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== 'function') {
                throw new Error('task callback must be a function');
            }
            q.started = true;
            if (!isArray(data)) {
                data = [data];
            }
            if (data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return setImmediate$1(function () {
                    q.drain();
                });
            }
            arrayEach(data, function (task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }
            });
            setImmediate$1(q.process);
        }
        function _next(q, tasks) {
            return function () {
                workers -= 1;

                var removed = false;
                var args = arguments;
                arrayEach(tasks, function (task) {
                    arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });

                if (workers <= q.concurrency - q.buffer) {
                    q.unsaturated();
                }

                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            unsaturated: noop,
            buffer: concurrency / 4,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while (!q.paused && workers < q.concurrency && q.tasks.length) {

                    var tasks = q.payload ? q.tasks.splice(0, q.payload) : q.tasks.splice(0, q.tasks.length);

                    var data = arrayMap(tasks, baseProperty('data'));

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);

                    if (workers === q.concurrency) {
                        q.saturated();
                    }

                    var cb = onlyOnce(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function () {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) {
                    return;
                }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    setImmediate$1(q.process);
                }
            }
        };
        return q;
    }

    function cargo(worker, payload) {
        return queue(worker, 1, payload);
    }

    function eachOfLimit(obj, limit, iteratee, cb) {
        _eachOfLimit(limit)(obj, iteratee, cb);
    }

    var eachOfSeries = doLimit(eachOfLimit, 1);

    function reduce(arr, memo, iteratee, cb) {
        eachOfSeries(arr, function (x, i, cb) {
            iteratee(memo, x, function (err, v) {
                memo = v;
                cb(err);
            });
        }, function (err) {
            cb(err, memo);
        });
    }

    function seq() /* functions... */{
        var fns = arguments;
        return rest(function (args) {
            var that = this;

            var cb = args[args.length - 1];
            if (typeof cb == 'function') {
                args.pop();
            } else {
                cb = noop;
            }

            reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([rest(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            }, function (err, results) {
                cb.apply(that, [err].concat(results));
            });
        });
    }

    var reverse = Array.prototype.reverse;

    function compose() /* functions... */{
        return seq.apply(null, reverse.call(arguments));
    }

    function concat$1(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }

    var eachOf = doLimit(eachOfLimit, Infinity);

    function doParallel(fn) {
        return function (obj, iteratee, callback) {
            return fn(eachOf, obj, iteratee, callback);
        };
    }

    var concat = doParallel(concat$1);

    function doSeries(fn) {
        return function (obj, iteratee, callback) {
            return fn(eachOfSeries, obj, iteratee, callback);
        };
    }

    var concatSeries = doSeries(concat$1);

    var constant = rest(function (values) {
        var args = [null].concat(values);
        return initialParams(function (ignoredArgs, callback) {
            return callback.apply(this, args);
        });
    });

    function _createTester(eachfn, check, getResult) {
        return function (arr, limit, iteratee, cb) {
            function done(err) {
                if (cb) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, getResult(false));
                    }
                }
            }
            function wrappedIteratee(x, _, callback) {
                if (!cb) return callback();
                iteratee(x, function (err, v) {
                    if (cb) {
                        if (err) {
                            cb(err);
                            cb = iteratee = false;
                        } else if (check(v)) {
                            cb(null, getResult(true, x));
                            cb = iteratee = false;
                        }
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                cb = cb || noop;
                eachfn(arr, limit, wrappedIteratee, done);
            } else {
                cb = iteratee;
                cb = cb || noop;
                iteratee = limit;
                eachfn(arr, wrappedIteratee, done);
            }
        };
    }

    function _findGetResult(v, x) {
        return x;
    }

    var detect = _createTester(eachOf, identity, _findGetResult);

    var detectLimit = _createTester(eachOfLimit, identity, _findGetResult);

    var detectSeries = _createTester(eachOfSeries, identity, _findGetResult);

    function consoleFunc(name) {
        return rest(function (fn, args) {
            fn.apply(null, args.concat([rest(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    } else if (console[name]) {
                        arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }

    var dir = consoleFunc('dir');

    function during(test, iteratee, cb) {
        cb = cb || noop;

        var next = rest(function (err, args) {
            if (err) {
                cb(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function (err, truth) {
            if (err) return cb(err);
            if (!truth) return cb(null);
            iteratee(next);
        };

        test(check);
    }

    function doDuring(iteratee, test, cb) {
        var calls = 0;

        during(function (next) {
            if (calls++ < 1) return next(null, true);
            test.apply(this, arguments);
        }, iteratee, cb);
    }

    function whilst(test, iteratee, cb) {
        cb = cb || noop;
        if (!test()) return cb(null);
        var next = rest(function (err, args) {
            if (err) return cb(err);
            if (test.apply(this, args)) return iteratee(next);
            cb.apply(null, [null].concat(args));
        });
        iteratee(next);
    }

    function doWhilst(iteratee, test, cb) {
        var calls = 0;
        return whilst(function () {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iteratee, cb);
    }

    function doUntil(iteratee, test, cb) {
        return doWhilst(iteratee, function () {
            return !test.apply(this, arguments);
        }, cb);
    }

    function _withoutIndex(iteratee) {
        return function (value, index, callback) {
            return iteratee(value, callback);
        };
    }

    function eachLimit(arr, limit, iteratee, cb) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iteratee), cb);
    }

    var each = doLimit(eachLimit, Infinity);

    var eachSeries = doLimit(eachLimit, 1);

    function ensureAsync(fn) {
        return initialParams(function (args, callback) {
            var sync = true;
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    setImmediate$1(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            fn.apply(this, args);
            sync = false;
        });
    }

    function notId(v) {
        return !v;
    }

    var everyLimit = _createTester(eachOfLimit, notId, notId);

    var every = doLimit(everyLimit, Infinity);

    var everySeries = doLimit(everyLimit, 1);

    function _filter(eachfn, arr, iteratee, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iteratee(x, function (err, v) {
                if (err) {
                    callback(err);
                } else {
                    if (v) {
                        results.push({ index: index, value: x });
                    }
                    callback();
                }
            });
        }, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null, arrayMap(results.sort(function (a, b) {
                    return a.index - b.index;
                }), baseProperty('value')));
            }
        });
    }

    var filterLimit = doParallelLimit(_filter);

    var filter = doLimit(filterLimit, Infinity);

    var filterSeries = doLimit(filterLimit, 1);

    function forever(fn, cb) {
        var done = onlyOnce(cb || noop);
        var task = ensureAsync(fn);

        function next(err) {
            if (err) return done(err);
            task(next);
        }
        next();
    }

    function iterator$1 (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return index < tasks.length - 1 ? makeCallback(index + 1) : null;
            };
            return fn;
        }
        return makeCallback(0);
    }

    var log = consoleFunc('log');

    function has(obj, key) {
        return key in obj;
    }

    function memoize$1(fn, hasher) {
        var memo = Object.create(null);
        var queues = Object.create(null);
        hasher = hasher || identity;
        var memoized = initialParams(function memoized(args, callback) {
            var key = hasher.apply(null, args);
            if (has(memo, key)) {
                setImmediate$1(function () {
                    callback.apply(null, memo[key]);
                });
            } else if (has(queues, key)) {
                queues[key].push(callback);
            } else {
                queues[key] = [callback];
                fn.apply(null, args.concat([rest(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    }

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(rest(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    function parallelLimit(tasks, limit, cb) {
        return _parallel(_eachOfLimit(limit), tasks, cb);
    }

    var parallel = doLimit(parallelLimit, Infinity);

    function queue$1 (worker, concurrency) {
        return queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);
    }

    function priorityQueue (worker, concurrency) {
        function _compareTasks(a, b) {
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + (end - beg + 1 >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== 'function') {
                throw new Error('task callback must be a function');
            }
            q.started = true;
            if (!isArray(data)) {
                data = [data];
            }
            if (data.length === 0) {
                // call drain immediately if there are no tasks
                return setImmediate$1(function () {
                    q.drain();
                });
            }
            arrayEach(data, function (task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                if (q.tasks.length <= q.concurrency - q.buffer) {
                    q.unsaturated();
                }
                setImmediate$1(q.process);
            });
        }

        // Start with a normal queue
        var q = queue$1(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    }

    /**
     * Creates a `baseEach` or `baseEachRight` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        if (collection == null) {
          return collection;
        }
        if (!isArrayLike(collection)) {
          return eachFunc(collection, iteratee);
        }
        var length = collection.length,
            index = fromRight ? length : -1,
            iterable = Object(collection);

        while ((fromRight ? index-- : ++index < length)) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }

    /**
     * The base implementation of `_.forEach` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object} Returns `collection`.
     */
    var baseEach = createBaseEach(baseForOwn);

    /**
     * Iterates over elements of `collection` invoking `iteratee` for each element.
     * The iteratee is invoked with three arguments: (value, index|key, collection).
     * Iteratee functions may exit iteration early by explicitly returning `false`.
     *
     * **Note:** As with other "Collections" methods, objects with a "length"
     * property are iterated like arrays. To avoid this behavior use `_.forIn`
     * or `_.forOwn` for object iteration.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @alias each
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array|Object} Returns `collection`.
     * @example
     *
     * _([1, 2]).forEach(function(value) {
     *   console.log(value);
     * });
     * // => Logs `1` then `2`.
     *
     * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
     *   console.log(key);
     * });
     * // => Logs 'a' then 'b' (iteration order is not guaranteed).
     */
    function forEach(collection, iteratee) {
      return (typeof iteratee == 'function' && isArray(collection))
        ? arrayEach(collection, iteratee)
        : baseEach(collection, baseIteratee(iteratee));
    }

    function race(tasks, cb) {
        cb = once(cb || noop);
        if (!isArray(tasks)) return cb(new TypeError('First argument to race must be an array of functions'));
        if (!tasks.length) return cb();
        forEach(tasks, function (task) {
            task(cb);
        });
    }

    var slice = Array.prototype.slice;

    function reduceRight(arr, memo, iteratee, cb) {
        var reversed = slice.call(arr).reverse();
        reduce(reversed, memo, iteratee, cb);
    }

    function reflect(fn) {
        return initialParams(function reflectOn(args, reflectCallback) {
            args.push(rest(function callback(err, cbArgs) {
                if (err) {
                    reflectCallback(null, {
                        error: err
                    });
                } else {
                    var value = null;
                    if (cbArgs.length === 1) {
                        value = cbArgs[0];
                    } else if (cbArgs.length > 1) {
                        value = cbArgs;
                    }
                    reflectCallback(null, {
                        value: value
                    });
                }
            }));

            return fn.apply(this, args);
        });
    }

    function reject$1(eachfn, arr, iteratee, callback) {
        _filter(eachfn, arr, function (value, cb) {
            iteratee(value, function (err, v) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, !v);
                }
            });
        }, callback);
    }

    var rejectLimit = doParallelLimit(reject$1);

    var reject = doLimit(rejectLimit, Infinity);

    function reflectAll(tasks) {
        return tasks.map(reflect);
    }

    var rejectSeries = doLimit(rejectLimit, 1);

    function series(tasks, cb) {
        return _parallel(eachOfSeries, tasks, cb);
    }

    function retry(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t) {
            if (typeof t === 'object') {
                acc.times = +t.times || DEFAULT_TIMES;
                acc.interval = +t.interval || DEFAULT_INTERVAL;
            } else if (typeof t === 'number' || typeof t === 'string') {
                acc.times = +t || DEFAULT_TIMES;
            } else {
                throw new Error("Invalid arguments for async.retry");
            }
        }

        if (arguments.length < 3 && typeof times === 'function') {
            callback = task || noop;
            task = times;
        } else {
            parseTimes(opts, times);
            callback = callback || noop;
        }

        if (typeof task !== 'function') {
            throw new Error("Invalid arguments for async.retry");
        }

        var attempts = [];
        while (opts.times) {
            var isFinalAttempt = !(opts.times -= 1);
            attempts.push(retryAttempt(isFinalAttempt));
            if (!isFinalAttempt && opts.interval > 0) {
                attempts.push(retryInterval(opts.interval));
            }
        }

        series(attempts, function (done, data) {
            data = data[data.length - 1];
            callback(data.err, data.result);
        });

        function retryAttempt(isFinalAttempt) {
            return function (seriesCallback) {
                task(function (err, result) {
                    seriesCallback(!err || isFinalAttempt, {
                        err: err,
                        result: result
                    });
                });
            };
        }

        function retryInterval(interval) {
            return function (seriesCallback) {
                setTimeout(function () {
                    seriesCallback(null);
                }, interval);
            };
        }
    }

    function retryable (opts, task) {
        if (!task) {
            task = opts;
            opts = null;
        }
        return initialParams(function (args, callback) {
            function taskFn(cb) {
                task.apply(null, args.concat([cb]));
            }

            if (opts) retry(opts, taskFn, callback);else retry(taskFn, callback);
        });
    }

    var someLimit = _createTester(eachOfLimit, Boolean, identity);

    var some = doLimit(someLimit, Infinity);

    var someSeries = doLimit(someLimit, 1);

    function sortBy(arr, iteratee, cb) {
        map(arr, function (x, cb) {
            iteratee(x, function (err, criteria) {
                if (err) return cb(err);
                cb(null, { value: x, criteria: criteria });
            });
        }, function (err, results) {
            if (err) return cb(err);
            cb(null, arrayMap(results.sort(comparator), baseProperty('value')));
        });

        function comparator(left, right) {
            var a = left.criteria,
                b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    }

    function timeout(asyncFn, miliseconds, info) {
        var originalCallback, timer;
        var timedOut = false;

        function injectedCallback() {
            if (!timedOut) {
                originalCallback.apply(null, arguments);
                clearTimeout(timer);
            }
        }

        function timeoutCallback() {
            var name = asyncFn.name || 'anonymous';
            var error = new Error('Callback function "' + name + '" timed out.');
            error.code = 'ETIMEDOUT';
            if (info) {
                error.info = info;
            }
            timedOut = true;
            originalCallback(error);
        }

        return initialParams(function (args, origCallback) {
            originalCallback = origCallback;
            // setup timer and call original function
            timer = setTimeout(timeoutCallback, miliseconds);
            asyncFn.apply(null, args.concat(injectedCallback));
        });
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeCeil = Math.ceil;
    var nativeMax$1 = Math.max;
    /**
     * The base implementation of `_.range` and `_.rangeRight` which doesn't
     * coerce arguments to numbers.
     *
     * @private
     * @param {number} start The start of the range.
     * @param {number} end The end of the range.
     * @param {number} step The value to increment or decrement by.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the new array of numbers.
     */
    function baseRange(start, end, step, fromRight) {
      var index = -1,
          length = nativeMax$1(nativeCeil((end - start) / (step || 1)), 0),
          result = Array(length);

      while (length--) {
        result[fromRight ? length : ++index] = start;
        start += step;
      }
      return result;
    }

    function timeLimit(count, limit, iteratee, cb) {
        return mapLimit(baseRange(0, count, 1), limit, iteratee, cb);
    }

    var times = doLimit(timeLimit, Infinity);

    var timesSeries = doLimit(timeLimit, 1);

    function transform(arr, memo, iteratee, callback) {
        if (arguments.length === 3) {
            callback = iteratee;
            iteratee = memo;
            memo = isArray(arr) ? [] : {};
        }

        eachOf(arr, function (v, k, cb) {
            iteratee(memo, v, k, cb);
        }, function (err) {
            callback(err, memo);
        });
    }

    function unmemoize(fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    }

    function until(test, iteratee, cb) {
        return whilst(function () {
            return !test.apply(this, arguments);
        }, iteratee, cb);
    }

    function waterfall (tasks, cb) {
        cb = once(cb || noop);
        if (!isArray(tasks)) return cb(new Error('First argument to waterfall must be an array of functions'));
        if (!tasks.length) return cb();
        var taskIndex = 0;

        function nextTask(args) {
            if (taskIndex === tasks.length) {
                return cb.apply(null, [null].concat(args));
            }

            var taskCallback = onlyOnce(rest(function (err, args) {
                if (err) {
                    return cb.apply(null, [err].concat(args));
                }
                nextTask(args);
            }));

            args.push(taskCallback);

            var task = tasks[taskIndex++];
            task.apply(null, args);
        }

        nextTask([]);
    }

    var index = {
        applyEach: applyEach,
        applyEachSeries: applyEachSeries,
        apply: apply$1,
        asyncify: asyncify,
        auto: auto,
        autoInject: autoInject,
        cargo: cargo,
        compose: compose,
        concat: concat,
        concatSeries: concatSeries,
        constant: constant,
        detect: detect,
        detectLimit: detectLimit,
        detectSeries: detectSeries,
        dir: dir,
        doDuring: doDuring,
        doUntil: doUntil,
        doWhilst: doWhilst,
        during: during,
        each: each,
        eachLimit: eachLimit,
        eachOf: eachOf,
        eachOfLimit: eachOfLimit,
        eachOfSeries: eachOfSeries,
        eachSeries: eachSeries,
        ensureAsync: ensureAsync,
        every: every,
        everyLimit: everyLimit,
        everySeries: everySeries,
        filter: filter,
        filterLimit: filterLimit,
        filterSeries: filterSeries,
        forever: forever,
        iterator: iterator$1,
        log: log,
        map: map,
        mapLimit: mapLimit,
        mapSeries: mapSeries,
        memoize: memoize$1,
        nextTick: setImmediate$1,
        parallel: parallel,
        parallelLimit: parallelLimit,
        priorityQueue: priorityQueue,
        queue: queue$1,
        race: race,
        reduce: reduce,
        reduceRight: reduceRight,
        reflect: reflect,
        reflectAll: reflectAll,
        reject: reject,
        rejectLimit: rejectLimit,
        rejectSeries: rejectSeries,
        retry: retry,
        retryable: retryable,
        seq: seq,
        series: series,
        setImmediate: setImmediate$1,
        some: some,
        someLimit: someLimit,
        someSeries: someSeries,
        sortBy: sortBy,
        timeout: timeout,
        times: times,
        timesLimit: timeLimit,
        timesSeries: timesSeries,
        transform: transform,
        unmemoize: unmemoize,
        until: until,
        waterfall: waterfall,
        whilst: whilst,

        // aliases
        all: every,
        any: some,
        forEach: each,
        forEachSeries: eachSeries,
        forEachLimit: eachLimit,
        forEachOf: eachOf,
        forEachOfSeries: eachOfSeries,
        forEachOfLimit: eachOfLimit,
        inject: reduce,
        foldl: reduce,
        foldr: reduceRight,
        select: filter,
        selectLimit: filterLimit,
        selectSeries: filterSeries,
        wrapSync: asyncify
    };

    exports['default'] = index;
    exports.applyEach = applyEach;
    exports.applyEachSeries = applyEachSeries;
    exports.apply = apply$1;
    exports.asyncify = asyncify;
    exports.auto = auto;
    exports.autoInject = autoInject;
    exports.cargo = cargo;
    exports.compose = compose;
    exports.concat = concat;
    exports.concatSeries = concatSeries;
    exports.constant = constant;
    exports.detect = detect;
    exports.detectLimit = detectLimit;
    exports.detectSeries = detectSeries;
    exports.dir = dir;
    exports.doDuring = doDuring;
    exports.doUntil = doUntil;
    exports.doWhilst = doWhilst;
    exports.during = during;
    exports.each = each;
    exports.eachLimit = eachLimit;
    exports.eachOf = eachOf;
    exports.eachOfLimit = eachOfLimit;
    exports.eachOfSeries = eachOfSeries;
    exports.eachSeries = eachSeries;
    exports.ensureAsync = ensureAsync;
    exports.every = every;
    exports.everyLimit = everyLimit;
    exports.everySeries = everySeries;
    exports.filter = filter;
    exports.filterLimit = filterLimit;
    exports.filterSeries = filterSeries;
    exports.forever = forever;
    exports.iterator = iterator$1;
    exports.log = log;
    exports.map = map;
    exports.mapLimit = mapLimit;
    exports.mapSeries = mapSeries;
    exports.memoize = memoize$1;
    exports.nextTick = setImmediate$1;
    exports.parallel = parallel;
    exports.parallelLimit = parallelLimit;
    exports.priorityQueue = priorityQueue;
    exports.queue = queue$1;
    exports.race = race;
    exports.reduce = reduce;
    exports.reduceRight = reduceRight;
    exports.reflect = reflect;
    exports.reflectAll = reflectAll;
    exports.reject = reject;
    exports.rejectLimit = rejectLimit;
    exports.rejectSeries = rejectSeries;
    exports.retry = retry;
    exports.retryable = retryable;
    exports.seq = seq;
    exports.series = series;
    exports.setImmediate = setImmediate$1;
    exports.some = some;
    exports.someLimit = someLimit;
    exports.someSeries = someSeries;
    exports.sortBy = sortBy;
    exports.timeout = timeout;
    exports.times = times;
    exports.timesLimit = timeLimit;
    exports.timesSeries = timesSeries;
    exports.transform = transform;
    exports.unmemoize = unmemoize;
    exports.until = until;
    exports.waterfall = waterfall;
    exports.whilst = whilst;
    exports.all = every;
    exports.allLimit = everyLimit;
    exports.allSeries = everySeries;
    exports.any = some;
    exports.anyLimit = someLimit;
    exports.anySeries = someSeries;
    exports.find = detect;
    exports.findLimit = detectLimit;
    exports.findSeries = detectSeries;
    exports.forEach = each;
    exports.forEachSeries = eachSeries;
    exports.forEachLimit = eachLimit;
    exports.forEachOf = eachOf;
    exports.forEachOfSeries = eachOfSeries;
    exports.forEachOfLimit = eachOfLimit;
    exports.inject = reduce;
    exports.foldl = reduce;
    exports.foldr = reduceRight;
    exports.select = filter;
    exports.selectLimit = filterLimit;
    exports.selectSeries = filterSeries;
    exports.wrapSync = asyncify;

}));
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":2}],26:[function(require,module,exports){
/**
 * Get average value.
 * @function ave
 * @param {...number} values - Values to ave.
 * @returns {number} - Average value.
 */


"use strict";

const sum = require('./sum');

/** @lends ave */
function ave() {
    let args = arguments;
    let values = 0, size = 0;
    for (let i = 0, len = args.length; i < len; i++) {
        let val = args[i];
        if (Array.isArray(val)) {
            size += val.length;
            val = sum.apply(sum, val);
        } else {
            size += 1;
        }
        values += val;
    }
    return values / size;
}

module.exports = ave;


},{"./sum":30}],27:[function(require,module,exports){
/**
 * Basic numeric calculation functions.
 * @module numcal
 */

"use strict";

module.exports = {
    get ave() { return require('./ave'); },
    get max() { return require('./max'); },
    get min() { return require('./min'); },
    get sum() { return require('./sum'); }
};
},{"./ave":26,"./max":28,"./min":29,"./sum":30}],28:[function(require,module,exports){
/**
 * Find max value.
 * @function max
 * @param {...number} values - Values to compare.
 * @returns {number} - Max number.
 */


"use strict";

/** @lends max */
function max() {
    let args = arguments;
    let result = undefined;
    for (let i = 0, len = args.length; i < len; i++) {
        let val = args[i];
        if (Array.isArray(val)) {
            val = max.apply(max, val);
        }
        let hit = (result === undefined) || (val > result);
        if (hit) {
            result = val;
        }
    }
    return result;
}

module.exports = max;


},{}],29:[function(require,module,exports){
/**
 * Find min value.
 * @function min
 * @param {...number} values - Values to compare.
 * @returns {number} - Min number.
 */


"use strict";

/** @lends min */
function min() {
    let args = arguments;
    let result = undefined;
    for (let i = 0, len = args.length; i < len; i++) {
        let val = args[i];
        if (Array.isArray(val)) {
            val = min.apply(min, val);
        }
        let hit = (result === undefined) || (val < result);
        if (hit) {
            result = val;
        }
    }
    return result;
}

module.exports = min;


},{}],30:[function(require,module,exports){
/**
 * Get sum value.
 * @function sum
 * @param {...number} values - Values to sum.
 * @returns {number} - Sum value.
 */


"use strict";

/** @lends sum */
function sum() {
    let args = arguments;
    let result = 0;
    for (let i = 0, len = args.length; i < len; i++) {
        let val = args[i];
        if (Array.isArray(val)) {
            val = sum.apply(sum, val);
        }
        result += val;
    }
    return result;
}

module.exports = sum;


},{}],31:[function(require,module,exports){
(function (global){

var rng;

if (global.crypto && crypto.getRandomValues) {
  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
  // Moderately fast, high quality
  var _rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(_rnds8);
    return _rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  _rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return _rnds;
  };
}

module.exports = rng;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],32:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var _rng = require('./rng');

// Maps for number <-> hex string conversion
var _byteToHex = [];
var _hexToByte = {};
for (var i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
  _hexToByte[_byteToHex[i]] = i;
}

// **`parse()` - Parse a UUID into it's component bytes**
function parse(s, buf, offset) {
  var i = (buf && offset) || 0, ii = 0;

  buf = buf || [];
  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = _hexToByte[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
function unparse(buf, offset) {
  var i = offset || 0, bth = _byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = _rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; n++) {
    b[i + n] = node[n];
  }

  return buf ? buf : unparse(b);
}

// **`v4()` - Generate random UUID**

// See https://github.com/broofa/node-uuid for API details
function v4(options, buf, offset) {
  // Deprecated - 'format' argument, as supported in v1.2
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || _rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ii++) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || unparse(rnds);
}

// Export public API
var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;
uuid.parse = parse;
uuid.unparse = unparse;

module.exports = uuid;

},{"./rng":31}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92NS4zLjAvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwiLi4vLi4vLi4vLm52bS92ZXJzaW9ucy9ub2RlL3Y1LjMuMC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2RvYy9kZW1vL2RlbW8uY29tcG9uZW50LmpzeCIsImRvYy9kZW1vL2RlbW8ubm9kZS5qcyIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2xpYi9hcF91cGxvYWQuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2JpZ19idXR0b24uanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2J1dHRvbi5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfYnV0dG9uX2dyb3VwLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9hcF9idXR0b25fc3R5bGUuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2NlbGxfYnV0dG9uLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9hcF9jZWxsX2J1dHRvbl9yb3cuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2ljb25fYnV0dG9uLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9hcF9pY29uX2J1dHRvbl9yb3cuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX25leHRfYnV0dG9uLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9hcF9wcmV2X2J1dHRvbi5qc3giLCJub2RlX21vZHVsZXMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvaW5kZXguanMiLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWltYWdlL2xpYi9fc2NhbGVkX3NpemUuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1pbWFnZS9saWIvYXBfaW1hZ2UuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1pbWFnZS9saWIvYXBfaW1hZ2Vfc3R5bGUuanN4Iiwibm9kZV9tb2R1bGVzL2FwZW1hbi1yZWFjdC1pbWFnZS9saWIvaW5kZXguanMiLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LXNwaW5uZXIvbGliL2FwX3NwaW5uZXIuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1zcGlubmVyL2xpYi9hcF9zcGlubmVyX3N0eWxlLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3Qtc3Bpbm5lci9saWIvY29uc3RzLmpzeCIsIm5vZGVfbW9kdWxlcy9hcGVtYW4tcmVhY3Qtc3Bpbm5lci9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYXN5bmMvZGlzdC9hc3luYy5qcyIsIm5vZGVfbW9kdWxlcy9udW1jYWwvbGliL2F2ZS5qcyIsIm5vZGVfbW9kdWxlcy9udW1jYWwvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvbWF4LmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvbWluLmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvc3VtLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvcm5nLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXVpZC91dWlkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LElBQUYsRUFBUSxTQUFSLEVBQW1CLFlBQW5CLENBQUg7QUFDQSxLQUFHLENBQUUsSUFBRixFQUFRLFNBQVIsRUFBbUIsU0FBbkIsQ0FBSDtBQUNBLEtBQUcsQ0FBRSxJQUFGLEVBQVEsU0FBUixFQUFtQixVQUFuQixDQUFIO0NBTEY7OztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5Z0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IEFwVXBsb2FkIGZyb20gJy4uLy4uL2xpYi9hcF91cGxvYWQnXG5cbmNvbnN0IERFTU9fSU1BR0VTID0gW1xuICAnaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2FwZW1hbi1hc3NldC1sYWJvL2FwZW1hbi1hc3NldC1pbWFnZXMvbWFzdGVyL2Rpc3QvZHVtbXkvMTIuanBnJ1xuXVxuXG5sZXQgRGVtbyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8QXBVcGxvYWQgbXVsdGlwbGU9eyB0cnVlIH1cbiAgICAgICAgICAgICAgICAgIGlkPVwiZGVtby1maWxlLXVwbG9hZC0wMVwiXG4gICAgICAgICAgICAgICAgICBuYW1lPVwiZmlsZS1pbnB1dC0wMVwiXG4gICAgICAgICAgICAgICAgICBhY2NlcHQ9XCJpbWFnZS8qXCJcbiAgICAgICAgICAgICAgICAgIG9uTG9hZD17IHMuaGFuZGxlTG9hZGVkIH0+XG4gICAgICAgIDwvQXBVcGxvYWQ+XG5cbiAgICAgICAgPEFwVXBsb2FkIG11bHRpcGxlPXsgdHJ1ZSB9XG4gICAgICAgICAgICAgICAgICBpZD1cImRlbW8tZmlsZS11cGxvYWQtMDJcIlxuICAgICAgICAgICAgICAgICAgbmFtZT1cImZpbGUtaW5wdXQtMDJcIlxuICAgICAgICAgICAgICAgICAgYWNjZXB0PVwiaW1hZ2UvKlwiXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17IERFTU9fSU1BR0VTIH1cbiAgICAgICAgICAgICAgICAgIG9uTG9hZD17IHMuaGFuZGxlTG9hZGVkIH0+XG4gICAgICAgIDwvQXBVcGxvYWQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH0sXG4gIGhhbmRsZUxvYWRlZCAoZXYpIHtcbiAgICBjb25zb2xlLmxvZygncmVzdWx0JywgZXYudGFyZ2V0LCBldi51cmxzKVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlbW9cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgUmVhY3RET00gPSByZXF1aXJlKCdyZWFjdC1kb20nKVxuXG5jb25zdCBEZW1vID0gcmVxdWlyZSgnLi9kZW1vLmNvbXBvbmVudC5qcycpXG5cbndpbmRvdy5SZWFjdCA9IFJlYWN0O1xubGV0IERlbW9GYWN0b3J5ID0gUmVhY3QuY3JlYXRlRmFjdG9yeShEZW1vKVxuUmVhY3RET00ucmVuZGVyKERlbW9GYWN0b3J5KCksIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZW1vLXdyYXAnKSlcbiIsIi8qKlxuICogYXBlbWFuIHJlYWN0IHBhY2thZ2UgZm9yIGZpbGUgdXBsb2FkIGNvbXBvbmVudHMuXG4gKiBAY29uc3RydWN0b3IgQXBVcGxvYWRcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgYXN5bmMgZnJvbSAnYXN5bmMnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHV1aWQgZnJvbSAndXVpZCdcbmltcG9ydCB7QXBJbWFnZX0gZnJvbSAnYXBlbWFuLXJlYWN0LWltYWdlJ1xuaW1wb3J0IHtBcFNwaW5uZXJ9IGZyb20gJ2FwZW1hbi1yZWFjdC1zcGlubmVyJ1xuaW1wb3J0IHtBcEJ1dHRvbn0gZnJvbSAnYXBlbWFuLXJlYWN0LWJ1dHRvbidcblxuLyoqIEBsZW5kcyBBcFVwbG9hZCAqL1xuY29uc3QgQXBVcGxvYWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICAvKiogTmFtZSBvZiBpbnB1dCAqL1xuICAgIG5hbWU6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogRE9NIGlkIG9mIGlucHV0ICovXG4gICAgaWQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogQWxsb3cgbXVsdGlwbGUgdXBsb2FkICovXG4gICAgbXVsdGlwbGU6IHR5cGVzLmJvb2wsXG4gICAgLyoqIEhhbmRsZXIgZm9yIGNoYW5nZSBldmVudCAqL1xuICAgIG9uQ2hhbmdlOiB0eXBlcy5mdW5jLFxuICAgIC8qKiBIYW5kbGVyIGZvciBsb2FkIGV2ZW50ICovXG4gICAgb25Mb2FkOiB0eXBlcy5mdW5jLFxuICAgIC8qKiBIYW5kbGVyIGZvciBlcnJvciBldmVudCAqL1xuICAgIG9uRXJyb3I6IHR5cGVzLmZ1bmMsXG4gICAgLyoqIEltYWdlIHdpZHRoICovXG4gICAgd2lkdGg6IHR5cGVzLm51bWJlcixcbiAgICAvKiogSW1hZ2UgaGVpZ2h0ICovXG4gICAgaGVpZ2h0OiB0eXBlcy5udW1iZXIsXG4gICAgLyoqIEd1aWRlIHRleHQgKi9cbiAgICB0ZXh0OiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIEFjY2VwdCBmaWxlIHR5cGUgKi9cbiAgICBhY2NlcHQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogR3VpZGUgaWNvbiAqL1xuICAgIGljb246IHR5cGVzLnN0cmluZyxcbiAgICAvKiogSWNvbiBmb3IgY2xvc2UgaW1hZ2VzICovXG4gICAgY2xvc2VJY29uOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIFNwaW5uZXIgdGhlbWUgKi9cbiAgICBzcGlubmVyOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIFZhbHVlIG9mIGlucHV0ICovXG4gICAgdmFsdWU6IHR5cGVzLm9uZU9mVHlwZShbXG4gICAgICB0eXBlcy5zdHJpbmcsXG4gICAgICB0eXBlcy5hcnJheVxuICAgIF0pXG4gIH0sXG5cbiAgbWl4aW5zOiBbXSxcblxuICBzdGF0aWNzOiB7XG4gICAgcmVhZEZpbGUgKGZpbGUsIGNhbGxiYWNrKSB7XG4gICAgICBsZXQgcmVhZGVyID0gbmV3IHdpbmRvdy5GaWxlUmVhZGVyKClcbiAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gb25lcnJvciAoZXJyKSB7XG4gICAgICAgIGNhbGxiYWNrKGVycilcbiAgICAgIH1cbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiBvbmxvYWQgKGV2KSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGV2LnRhcmdldC5yZXN1bHQpXG4gICAgICB9XG4gICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKVxuICAgIH0sXG4gICAgaXNJbWFnZVVybCh1cmwpIHtcbiAgICAgIHJldHVybiAvXmRhdGE6aW1hZ2UvLnRlc3QodXJsKSB8fCAhIX5bXG4gICAgICAgICAgJy5qcGcnLFxuICAgICAgICAgICcuanBlZycsXG4gICAgICAgICAgJy5zdmcnLFxuICAgICAgICAgICcuZ2lmJyxcbiAgICAgICAgICAnLnBuZydcbiAgICAgICAgXS5pbmRleE9mKHBhdGguZXh0bmFtZSh1cmwpKVxuICAgIH1cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgY29uc3QgcyA9IHRoaXMsXG4gICAgICB7IHByb3BzIH0gPSBzO1xuICAgIGxldCBoYXNWYWx1ZSA9IHByb3BzLnZhbHVlICYmIHByb3BzLnZhbHVlLmxlbmd0aCA+IDBcbiAgICByZXR1cm4ge1xuICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgZXJyb3I6IG51bGwsXG4gICAgICB1cmxzOiBoYXNWYWx1ZSA/IFtdLmNvbmNhdChwcm9wcy52YWx1ZSkgOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IG51bGwsXG4gICAgICBpZDogYGFwLXVwbG9hZC0ke3V1aWQudjQoKX1gLFxuICAgICAgbXVsdGlwbGU6IGZhbHNlLFxuICAgICAgd2lkdGg6IDE4MCxcbiAgICAgIGhlaWdodDogMTgwLFxuICAgICAgYWNjZXB0OiBudWxsLFxuICAgICAgdGV4dDogJ1VwbG9hZCBmaWxlJyxcbiAgICAgIGljb246ICdmYSBmYS1jbG91ZC11cGxvYWQnLFxuICAgICAgY2xvc2VJY29uOiAnZmEgZmEtY2xvc2UnLFxuICAgICAgc3Bpbm5lckljb246IEFwU3Bpbm5lci5ERUZBVUxUX1RIRU1FLFxuICAgICAgb25DaGFuZ2U6IG51bGwsXG4gICAgICBvbkxvYWQ6IG51bGwsXG4gICAgICBvbkVycm9yOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBzdGF0ZSwgcHJvcHMgfSA9IHNcbiAgICBsZXQgeyB3aWR0aCwgaGVpZ2h0IH0gPSBwcm9wc1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17Y2xhc3NuYW1lcygnYXAtdXBsb2FkJywgcHJvcHMuY2xhc3NOYW1lKX1cbiAgICAgICAgICAgc3R5bGU9e09iamVjdC5hc3NpZ24oe30sIHByb3BzLnN0eWxlKX0+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiZmlsZVwiXG4gICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhcC11cGxvYWQtaW5wdXRcIlxuICAgICAgICAgICAgICAgbXVsdGlwbGU9eyBwcm9wcy5tdWx0aXBsZSB9XG4gICAgICAgICAgICAgICBuYW1lPXsgcHJvcHMubmFtZSB9XG4gICAgICAgICAgICAgICBpZD17IHByb3BzLmlkIH1cbiAgICAgICAgICAgICAgIGFjY2VwdD17IHByb3BzLmFjY2VwdCB9XG4gICAgICAgICAgICAgICBvbkNoYW5nZT17cy5oYW5kbGVDaGFuZ2V9XG4gICAgICAgICAgICAgICBzdHlsZT17e3dpZHRoLCBoZWlnaHR9fVxuICAgICAgICAvPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWxhYmVsXCIgaHRtbEZvcj17IHByb3BzLmlkIH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1hbGlnbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWxhYmVsLWlubmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9eyBjbGFzc25hbWVzKFwiYXAtdXBsb2FkLWljb25cIiwgcHJvcHMuaWNvbikgfS8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC11cGxvYWQtdGV4dFwiPntwcm9wcy50ZXh0fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2xhYmVsPlxuICAgICAgICB7IHMuX3JlbmRlclByZXZpZXdJbWFnZShzdGF0ZS51cmxzLCB3aWR0aCwgaGVpZ2h0KSB9XG4gICAgICAgIHsgcy5fcmVuZGVyUmVtb3ZlQnV0dG9uKCEhKHN0YXRlLnVybHMgJiYgc3RhdGUudXJscy5sZW5ndGggPiAwKSwgcHJvcHMuY2xvc2VJY29uKSB9XG4gICAgICAgIHsgcy5fcmVuZGVyU3Bpbm5lcihzdGF0ZS5zcGlubmluZywgcHJvcHMuc3Bpbm5lcikgfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIExpZmVjeWNsZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBDdXN0b21cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgaGFuZGxlQ2hhbmdlIChlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIGxldCB7IHRhcmdldCB9ID0gZVxuICAgIGxldCBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRhcmdldC5maWxlcywgMClcblxuICAgIGxldCB7IG9uQ2hhbmdlLCBvbkVycm9yLCBvbkxvYWQgfSA9IHByb3BzXG5cbiAgICBzLnNldFN0YXRlKHsgc3Bpbm5pbmc6IHRydWUgfSlcbiAgICBpZiAob25DaGFuZ2UpIHtcbiAgICAgIG9uQ2hhbmdlKGUpXG4gICAgfVxuICAgIGFzeW5jLmNvbmNhdChmaWxlcywgQXBVcGxvYWQucmVhZEZpbGUsIChlcnIsIHVybHMpID0+IHtcbiAgICAgIGUudXJscyA9IHVybHNcbiAgICAgIGUudGFyZ2V0ID0gdGFyZ2V0XG4gICAgICBzLnNldFN0YXRlKHtcbiAgICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyLFxuICAgICAgICB1cmxzOiB1cmxzXG4gICAgICB9KVxuICAgICAgaWYgKGVycikge1xuICAgICAgICBpZiAob25FcnJvcikge1xuICAgICAgICAgIG9uRXJyb3IoZXJyKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAob25Mb2FkKSB7XG4gICAgICAgICAgb25Mb2FkKGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9LFxuXG4gIGhhbmRsZVJlbW92ZSgpIHtcbiAgICBjb25zdCBzID0gdGhpcyxcbiAgICAgIHsgcHJvcHMgfSA9IHMsXG4gICAgICB7IG9uTG9hZCB9ID0gcHJvcHNcbiAgICBzLnNldFN0YXRlKHtcbiAgICAgIGVycm9yOiBudWxsLFxuICAgICAgdXJsczogbnVsbFxuICAgIH0pXG4gICAgaWYgKG9uTG9hZCkge1xuICAgICAgb25Mb2FkKFtdKVxuICAgIH1cbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gUHJpdmF0ZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICBfcmVuZGVyU3Bpbm5lciAoc3Bpbm5pbmcsIHRoZW1lKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICByZXR1cm4gKFxuICAgICAgPEFwU3Bpbm5lciBlbmFibGVkPXtzcGlubmluZ30gdGhlbWU9e3RoZW1lfT5cbiAgICAgIDwvQXBTcGlubmVyPlxuICAgIClcbiAgfSxcblxuICBfcmVuZGVyUmVtb3ZlQnV0dG9uIChyZW1vdmFibGUsIGljb24pIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGlmICghcmVtb3ZhYmxlKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIG9uVGFwPXsgcy5oYW5kbGVSZW1vdmUgfSBjbGFzc05hbWU9XCJhcC11cGxvYWQtcmVtb3ZlLWJ1dHRvblwiPlxuICAgICAgICA8aSBjbGFzc05hbWU9eyBjbGFzc25hbWVzKFwiYXAtdXBsb2FkLXJlbW92ZS1pY29uXCIsIGljb24pIH0vPlxuICAgICAgPC9BcEJ1dHRvbj5cbiAgICApXG4gIH0sXG5cbiAgX3JlbmRlclByZXZpZXdJbWFnZSAodXJscywgd2lkdGgsIGhlaWdodCkge1xuICAgIGlmICghdXJscykge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICByZXR1cm4gdXJsc1xuICAgICAgLmZpbHRlcigodXJsKSA9PiBBcFVwbG9hZC5pc0ltYWdlVXJsKHVybCkpXG4gICAgICAubWFwKCh1cmwsIGkpID0+IChcbiAgICAgICAgPEFwSW1hZ2Uga2V5PXsgdXJsIH1cbiAgICAgICAgICAgICAgICAgc3JjPXsgdXJsIH1cbiAgICAgICAgICAgICAgICAgaGVpZ2h0PXsgaGVpZ2h0IH1cbiAgICAgICAgICAgICAgICAgd2lkdGg9eyB3aWR0aCB9XG4gICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoXCJhcC11cGxvYWQtcHJldmlldy1pbWFnZVwiKSB9XG4gICAgICAgICAgICAgICAgIHN0eWxlPXsge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IGAke2kgKiAxMH0lYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGAke2kgKiAxMH0lYFxuICAgICAgICAgICAgICAgICAgICAgICAgIH0gfVxuICAgICAgICAgICAgICAgICBzY2FsZT1cImZpdFwiPlxuICAgICAgICA8L0FwSW1hZ2U+XG4gICAgICApKVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwVXBsb2FkXG4iLCIvKipcbiAqIEJpZyBidXR0b24gY29tcG9uZW50LlxuICogQGNvbnN0cnVjdG9yIEFwQmlnQnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwQmlnQnV0dG9uICovXG5jb25zdCBBcEJpZ0J1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIGRpc2FibGVkOiB0eXBlcy5ib29sLFxuICAgIG9uVGFwOiB0eXBlcy5mdW5jLFxuICAgIHRleHQ6IHR5cGVzLnN0cmluZyxcbiAgICBzaXplOiB0eXBlcy5udW1iZXJcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsLFxuICAgICAgc2l6ZTogOTRcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgbGV0IHsgc2l6ZSB9ID0gcHJvcHNcbiAgICBsZXQgc3R5bGUgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHdpZHRoOiBzaXplLCBoZWlnaHQ6IHNpemVcbiAgICB9LCBwcm9wcy5zdHlsZSlcbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIHsgLi4ucHJvcHMgfVxuICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1iaWctYnV0dG9uJywgcHJvcHMuY2xhc3NOYW1lKSB9XG4gICAgICAgIHdpZGU9eyBmYWxzZSB9XG4gICAgICAgIHN0eWxlPXsgc3R5bGUgfVxuICAgICAgPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLWJpZy1idXR0b24tdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHByb3BzLnRleHQgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L0FwQnV0dG9uPlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBBcEJpZ0J1dHRvblxuIiwiLyoqXG4gKiBCdXR0b24gY29tcG9uZW50LlxuICogQGNvbnN0cnVjdG9yIEFwQnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuXG5pbXBvcnQge0FwVG91Y2hNaXhpbiwgQXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBCdXR0b24gKi9cbmxldCBBcEJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIC8qKiBEaXNhYmxlIGJ1dHRvbiB0YXAgKi9cbiAgICBkaXNhYmxlZDogdHlwZXMuYm9vbCxcbiAgICAvKiogUmVuZGVyIHdpdGggcHJpbWFyeSBzdHlsZSAqL1xuICAgIHByaW1hcnk6IHR5cGVzLmJvb2wsXG4gICAgLyoqIFJlbmRlciB3aXRoIGRhbmdlciBzdHlsZSAqL1xuICAgIGRhbmdlcjogdHlwZXMuYm9vbCxcbiAgICAvKiogUmVuZGVyIHdpdGggd2lkZSBzdHlsZSAqL1xuICAgIHdpZGU6IHR5cGVzLmJvb2wsXG4gICAgLyoqIEFuY2hvciBocmVmICovXG4gICAgaHJlZjogdHlwZXMuc3RyaW5nLFxuICAgIC8qKiBEb2N1bWVudCBpZCAqL1xuICAgIGlkOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIEhpZGUgYnV0dG9uICovXG4gICAgaGlkZGVuOiB0eXBlcy5ib29sLFxuICAgIC8qKiBSZW5kZXIgd2l0aCBzaW1wbGUgc3R5bGUgKi9cbiAgICBzaW1wbGU6IHR5cGVzLmJvb2wsXG4gICAgLyoqIERhdGEgZm9yIHRvdWNoIGV2ZW50cyAqL1xuICAgIGRhdGE6IHR5cGVzLmFueVxuICB9LFxuXG4gIG1peGluczogW1xuICAgIEFwVG91Y2hNaXhpbixcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgLyoqIEZvciBiaXQgdGFwcGluZyAqL1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgLyoqIFJlbmRlciB3aXRoIHByaW1hcnkgc3R5bGUgKi9cbiAgICAgIHByaW1hcnk6IGZhbHNlLFxuICAgICAgLyoqIFJlbmRlciB3aXRoIGRhbmdlciBzdHlsZSAqL1xuICAgICAgZGFuZ2VyOiBmYWxzZSxcbiAgICAgIHdpZGU6IGZhbHNlLFxuICAgICAgaHJlZjogbnVsbCxcbiAgICAgIC8qKiBEb2N1bWVudCBpZCAqL1xuICAgICAgaWQ6IG51bGwsXG4gICAgICAvKiogRGlzcGxheSBoaWRkZW4gKi9cbiAgICAgIGhpZGRlbjogZmFsc2UsXG4gICAgICAvKiogU2ltcGxlIHN0eWxlICovXG4gICAgICBzaW1wbGU6IGZhbHNlLFxuICAgICAgLyoqIERhdGEgZm9yIGV2ZW50ICovXG4gICAgICBkYXRhOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgbGV0IGNsYXNzTmFtZSA9IGNsYXNzbmFtZXMoJ2FwLWJ1dHRvbicsIHByb3BzLmNsYXNzTmFtZSwge1xuICAgICAgJ2FwLWJ1dHRvbi1wcmltYXJ5JzogcHJvcHMucHJpbWFyeSxcbiAgICAgICdhcC1idXR0b24tZGFuZ2VyJzogcHJvcHMuZGFuZ2VyLFxuICAgICAgJ2FwLWJ1dHRvbi13aWRlJzogcHJvcHMud2lkZSxcbiAgICAgICdhcC1idXR0b24tZGlzYWJsZWQnOiBwcm9wcy5kaXNhYmxlZCxcbiAgICAgICdhcC1idXR0b24tc2ltcGxlJzogcHJvcHMuc2ltcGxlLFxuICAgICAgJ2FwLWJ1dHRvbi1oaWRkZW4nOiBwcm9wcy5oaWRkZW5cbiAgICB9KVxuICAgIHJldHVybiAoXG4gICAgICA8YSBjbGFzc05hbWU9eyBjbGFzc05hbWUgfVxuICAgICAgICAgaHJlZj17IHByb3BzLmhyZWYgfVxuICAgICAgICAgaWQ9eyBwcm9wcy5pZCB9XG4gICAgICAgICBzdHlsZT17IE9iamVjdC5hc3NpZ24oe30sIHByb3BzLnN0eWxlKSB9XG4gICAgICA+eyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L2E+XG4gICAgKVxuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEZvciBBcFRvdWNoTWl4aW5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZ2V0VG91Y2hEYXRhICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgcmV0dXJuIHByb3BzLmRhdGFcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBBcEJ1dHRvblxuIiwiLyoqXG4gKiBCdXR0b24gZ3JvdXAgY29tcG9uZW50LlxuICogQGNvbnN0cnVjdG9yIEFwQnV0dG9uR3JvdXBcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5cbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBCdXR0b25Hcm91cCAqL1xuY29uc3QgQXBCdXR0b25Hcm91cCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge30sXG5cbiAgbWl4aW5zOiBbXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1idXR0b24tZ3JvdXAnLCBwcm9wcy5jbGFzc05hbWUpIH0+XG4gICAgICAgIHsgcHJvcHMuY2hpbGRyZW4gfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwQnV0dG9uR3JvdXBcbiIsIi8qKlxuICogU3R5bGUgZm9yIEFwQnV0dG9uLlxuICogQGNvbnN0cnVjdG9yIEFwQnV0dG9uU3R5bGVcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJ1xuXG4vKiogQGxlbmRzIEFwQnV0dG9uU3R5bGUgKi9cbmNvbnN0IEFwQnV0dG9uU3R5bGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIHNjb3BlOiB0eXBlcy5ib29sLFxuICAgIHN0eWxlOiB0eXBlcy5vYmplY3QsXG4gICAgaGlnaGxpZ2h0Q29sb3I6IHR5cGVzLnN0cmluZyxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IHR5cGVzLnN0cmluZyxcbiAgICBkYW5nZXJDb2xvcjogdHlwZXMuc3RyaW5nLFxuICAgIGRpc2FibGVkQ29sb3I6IHR5cGVzLnN0cmluZ1xuICB9LFxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY29wZTogZmFsc2UsXG4gICAgICBzdHlsZToge30sXG4gICAgICBoaWdobGlnaHRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0hJR0hMSUdIVF9DT0xPUixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0JBQ0tHUk9VTkRfQ09MT1IsXG4gICAgICBkYW5nZXJDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0RBTkdFUl9DT0xPUixcbiAgICAgIGRpc2FibGVkQ29sb3I6ICcjQUFBJ1xuICAgIH1cbiAgfSxcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCBwcm9wcyA9IHMucHJvcHNcblxuICAgIGxldCB7XG4gICAgICBoaWdobGlnaHRDb2xvcixcbiAgICAgIGJhY2tncm91bmRDb2xvcixcbiAgICAgIGRhbmdlckNvbG9yLFxuICAgICAgZGlzYWJsZWRDb2xvclxuICAgIH0gPSBwcm9wc1xuXG4gICAgbGV0IGRhdGEgPSB7XG4gICAgICAnLmFwLWJ1dHRvbic6IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICBwYWRkaW5nOiAnMC41ZW0gMWVtJyxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAnMnB4JyxcbiAgICAgICAgbWFyZ2luOiAnNHB4JyxcbiAgICAgICAgY29sb3I6IGAke2hpZ2hsaWdodENvbG9yfWAsXG4gICAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke2hpZ2hsaWdodENvbG9yfWAsXG4gICAgICAgIGJhY2tncm91bmQ6IGAke2JhY2tncm91bmRDb2xvcn1gLFxuICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgIE1velVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgTXNVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgIFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJpZy1idXR0b24nOiB7XG4gICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsXG4gICAgICAgIGJvcmRlcldpZHRoOiAnNHB4JyxcbiAgICAgICAgcGFkZGluZzogMCxcbiAgICAgICAgYm94U2hhZG93OiAnMnB4IDJweCA0cHggcmdiYSgwLDAsMCwwLjIpJyxcbiAgICAgICAgd2hpdGVTcGFjZTogJ25vcm1hbCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJpZy1idXR0b246YWN0aXZlJzoge1xuICAgICAgICBib3hTaGFkb3c6ICdub25lJ1xuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uID4gKic6IHtcbiAgICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnXG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b246aG92ZXInOiB7XG4gICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbjphY3RpdmUnOiB7XG4gICAgICAgIGJveFNoYWRvdzogJzFweCAxcHggMnB4IHJnYmEoMCwwLDAsMC4xKSBpbnNldCcsXG4gICAgICAgIG9wYWNpdHk6IDAuOFxuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLmFwLWJ1dHRvbi1kaXNhYmxlZCwuYXAtYnV0dG9uLmFwLWJ1dHRvbi1kaXNhYmxlZDpob3ZlciwuYXAtYnV0dG9uLmFwLWJ1dHRvbi1kaXNhYmxlZDphY3RpdmUnOiB7XG4gICAgICAgIGN1cnNvcjogJ2RlZmF1bHQnLFxuICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcbiAgICAgICAgY29sb3I6IGAke2Rpc2FibGVkQ29sb3J9YCxcbiAgICAgICAgYm9yZGVyQ29sb3I6IGAke2Rpc2FibGVkQ29sb3J9YCxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI0YwRjBGMCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbi1wcmltYXJ5Jzoge1xuICAgICAgICBjb2xvcjogJ3doaXRlJyxcbiAgICAgICAgYmFja2dyb3VuZDogYCR7aGlnaGxpZ2h0Q29sb3J9YFxuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLWRhbmdlcic6IHtcbiAgICAgICAgY29sb3I6ICd3aGl0ZScsXG4gICAgICAgIGJhY2tncm91bmQ6IGAke2RhbmdlckNvbG9yfWBcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbi13aWRlJzoge1xuICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICBib3hTaXppbmc6ICdib3JkZXItYm94JyxcbiAgICAgICAgbWF4V2lkdGg6ICcyNDBweCcsXG4gICAgICAgIG1hcmdpbkxlZnQ6IDAsXG4gICAgICAgIG1hcmdpblJpZ2h0OiAwXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbic6IHtcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnaW5oZXJpdCcsXG4gICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJ1xuICAgICAgfSxcbiAgICAgICcuYXAtaWNvbi1idXR0b24tc2ltcGxlJzoge1xuICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50J1xuICAgICAgfSxcbiAgICAgICcuYXAtaWNvbi1idXR0b24tc2ltcGxlOmFjdGl2ZSc6IHtcbiAgICAgICAgYm94U2hhZG93OiAnbm9uZScsXG4gICAgICAgIG9wYWNpdHk6ICcwLjgnXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbi1zaW1wbGUgLmFwLWljb24tYnV0dG9uLWljb24nOiB7XG4gICAgICAgIGZvbnRTaXplOiAnaW5oZXJpdCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uLWljb24nOiB7XG4gICAgICAgIG1hcmdpbjogJzJweCAwJyxcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgZm9udFNpemU6ICcyZW0nXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbi10ZXh0Jzoge1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICBmb250U2l6ZTogJzAuNjZlbScsXG4gICAgICAgIHBhZGRpbmc6ICcycHggMCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uLXJvdyc6IHtcbiAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICBtYXhXaWR0aDogQXBTdHlsZS5DT05URU5UX1dJRFRILFxuICAgICAgICBtYXJnaW46ICcwIGF1dG8nXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbi1yb3cgLmFwLWJ1dHRvbic6IHtcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtY2VsbC1idXR0b24nOiB7XG4gICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgIGxpbmVIZWlnaHQ6ICcxZW0nLFxuICAgICAgICBmb250U2l6ZTogJzE0cHgnLFxuICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgIGJvcmRlclJhZGl1czogMCxcbiAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWNlbGwtYnV0dG9uLWFsaWduZXInOiB7XG4gICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICB3aWR0aDogJzFweCcsXG4gICAgICAgIG1hcmdpblJpZ2h0OiAnLTFweCcsXG4gICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICBwYWRkaW5nOiAnOHB4IDAnLFxuICAgICAgICB2ZXJ0aWNhbEFsaWduOiAnbWlkZGxlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtY2VsbC1idXR0b24tdGV4dCc6IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHZlcnRpY2FsQWxpZ246ICdtaWRkbGUnXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbi1yb3cnOiB7XG4gICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgbWF4V2lkdGg6IEFwU3R5bGUuQ09OVEVOVF9XSURUSCxcbiAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgbWFyZ2luOiAnOHB4IGF1dG8nXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbi1yb3cgLmFwLWNlbGwtYnV0dG9uJzoge1xuICAgICAgICBib3JkZXJSaWdodENvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICBib3JkZXJCb3R0b21Db2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtY2VsbC1idXR0b24tcm93IC5hcC1jZWxsLWJ1dHRvbjpmaXJzdC1jaGlsZCc6IHtcbiAgICAgICAgYm9yZGVyTGVmdENvbG9yOiAndHJhbnNwYXJlbnQnXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbi1yb3cgLmFwLWJ1dHRvbic6IHtcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtbmV4dC1idXR0b24sLmFwLXByZXYtYnV0dG9uJzoge1xuICAgICAgICBwYWRkaW5nOiAnMC4yNWVtIDFlbSdcbiAgICAgIH0sXG4gICAgICAnLmFwLW5leHQtYnV0dG9uLWljb24nOiB7XG4gICAgICAgIG1hcmdpbkxlZnQ6ICc0cHgnLFxuICAgICAgICBtYXJnaW5SaWdodDogMFxuICAgICAgfSxcbiAgICAgICcuYXAtcHJldi1idXR0b24taWNvbic6IHtcbiAgICAgICAgbWFyZ2luTGVmdDogMCxcbiAgICAgICAgbWFyZ2luUmlnaHQ6ICc0cHgnXG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b24taGlkZGVuJzoge1xuICAgICAgICBkaXNwbGF5OiAnbm9uZSAhaW1wb3J0YW50J1xuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLXNpbXBsZSc6IHtcbiAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbi1zaW1wbGU6YWN0aXZlJzoge1xuICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcbiAgICAgICAgb3BhY2l0eTogJzAuOCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbi1ncm91cCc6IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJ1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgc21hbGxNZWRpYURhdGEgPSB7fVxuICAgIGxldCBtZWRpdW1NZWRpYURhdGEgPSB7fVxuICAgIGxldCBsYXJnZU1lZGlhRGF0YSA9IHt9XG4gICAgcmV0dXJuIChcbiAgICAgIDxBcFN0eWxlIHNjb3BlZD17IHByb3BzLnNjb3BlZCB9XG4gICAgICAgICAgICAgICBkYXRhPXsgT2JqZWN0LmFzc2lnbihkYXRhLCBwcm9wcy5zdHlsZSkgfVxuICAgICAgICAgICAgICAgc21hbGxNZWRpYURhdGE9eyBzbWFsbE1lZGlhRGF0YSB9XG4gICAgICAgICAgICAgICBtZWRpdW1NZWRpYURhdGE9eyBtZWRpdW1NZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbGFyZ2VNZWRpYURhdGE9eyBsYXJnZU1lZGlhRGF0YSB9XG4gICAgICA+eyBwcm9wcy5jaGlsZHJlbiB9PC9BcFN0eWxlPlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBBcEJ1dHRvblN0eWxlXG4iLCIvKipcbiAqIENlbGwgYnV0dG9uIGNvbXBvbmVudC5cbiAqIEBjb25zdHJ1Y3RvciBBcENlbGxCdXR0b25cbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgQXBCdXR0b24gZnJvbSAnLi9hcF9idXR0b24nXG5cbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBDZWxsQnV0dG9uICovXG5jb25zdCBBcENlbGxCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICBkaXNhYmxlZDogdHlwZXMuYm9vbCxcbiAgICBvblRhcDogdHlwZXMuZnVuYyxcbiAgICB0ZXh0OiB0eXBlcy5zdHJpbmdcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgcHJvcHMgPSBzLnByb3BzXG4gICAgcmV0dXJuIChcbiAgICAgIDxBcEJ1dHRvbiB7IC4uLnByb3BzIH1cbiAgICAgICAgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtY2VsbC1idXR0b24nLCBwcm9wcy5jbGFzc05hbWUpIH1cbiAgICAgICAgd2lkZT17IGZhbHNlIH1cbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtY2VsbC1idXR0b24tYWxpZ25lclwiPiZuYnNwOzwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtY2VsbC1idXR0b24tdGV4dFwiPnsgcHJvcHMudGV4dCB9PC9zcGFuPlxuICAgICAgPC9BcEJ1dHRvbj5cbiAgICApXG4gIH1cblxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBBcENlbGxCdXR0b25cbiIsIi8qKlxuICogUm93IGZvciBDZWxsIGJ1dHRvbnMuXG4gKiBAY29uc3RydWN0b3IgQXBDZWxsQnV0dG9uUm93XG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuXG4vKiogQGxlbmRzIEFwQ2VsbEJ1dHRvblJvdyAqL1xuY29uc3QgQXBDZWxsQnV0dG9uUm93ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7fSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtY2VsbC1idXR0b24tcm93JywgcHJvcHMuY2xhc3NOYW1lKSB9PlxuICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwQ2VsbEJ1dHRvblJvd1xuIiwiLyoqXG4gKiBJY29uIGJ1dHRvbiBjb21wb25lbnQuXG4gKiBAY29uc3RydWN0b3IgQXBJY29uQnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IHtBcEljb259IGZyb20gJ2FwZW1hbi1yZWFjdC1pY29uJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwSWNvbkJ1dHRvbiAqL1xuY29uc3QgQXBJY29uQnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgaWNvbjogdHlwZXMuc3RyaW5nLFxuICAgIHRleHQ6IHR5cGVzLnN0cmluZyxcbiAgICBzaW1wbGU6IHR5cGVzLmJvb2xcbiAgfSxcblxuICBzdGF0aWNzOiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgaWNvbiBidXR0b24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUZXh0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGljb24gLSBJY29uIGNsYXNzXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gb25UYXAgLSBUYXAgY2FsbGJhY2tcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBPdGhlciBwcm9wcy5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFJlYWN0IGVsZW1lbnQuXG4gICAgICovXG4gICAgY3JlYXRlQnV0dG9uICh0ZXh0LCBpY29uLCBvblRhcCwgcHJvcHMpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxBcEljb25CdXR0b24gdGV4dD17IHRleHQgfVxuICAgICAgICAgICAgICAgICAgICAgIGljb249eyBpY29uIH1cbiAgICAgICAgICAgICAgICAgICAgICBvblRhcD17IG9uVGFwIH1cbiAgICAgICAgICB7IC4uLnByb3BzIH1cbiAgICAgICAgLz5cbiAgICAgIClcbiAgICB9XG4gIH0sXG5cbiAgbWl4aW5zOiBbXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGljb246IG51bGwsXG4gICAgICB0ZXh0OiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiAoXG4gICAgICA8QXBCdXR0b24geyAuLi5wcm9wcyB9XG4gICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLWljb24tYnV0dG9uJywge1xuICAgICAgICAgICAgICAgICdhcC1pY29uLWJ1dHRvbi1zaW1wbGUnOiAhIXByb3BzLnNpbXBsZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb3BzLmNsYXNzTmFtZSkgfVxuICAgICAgICB3aWRlPXsgZmFsc2UgfVxuICAgICAgPlxuICAgICAgICA8QXBJY29uIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLWljb24tYnV0dG9uLWljb24nLCBwcm9wcy5pY29uLCB7XG4gICAgICAgICAgICAgICAgfSl9Lz5cbiAgICAgICAge3Byb3BzLnRleHQgPyA8c3BhbiBjbGFzc05hbWU9XCJhcC1pY29uLWJ1dHRvbi10ZXh0XCI+eyBwcm9wcy50ZXh0IH08L3NwYW4+IDogbnVsbH1cbiAgICAgIDwvQXBCdXR0b24+XG4gICAgKVxuICB9XG5cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gQXBJY29uQnV0dG9uXG4iLCIvKipcbiAqIFJvdyBmb3IgSWNvbiBidXR0b25zLlxuICogQGNvbnN0cnVjdG9yIEFwSWNvbkJ1dHRvblJvd1xuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuXG4vKiogQGxlbmRzIEFwSWNvbkJ1dHRvblJvdyAqL1xuY29uc3QgQXBJY29uQnV0dG9uUm93ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7fSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtaWNvbi1idXR0b24tcm93JywgcHJvcHMuY2xhc3NOYW1lKSB9PlxuICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwSWNvbkJ1dHRvblJvdztcblxuXG4iLCIvKipcbiAqIE5leHQgYnV0dG9uIGNvbXBvbmVudC5cbiAqIEBjb25zdHJ1Y3RvciBBcE5leHRCdXR0b25cbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgQXBCdXR0b24gZnJvbSAnLi9hcF9idXR0b24nXG5pbXBvcnQge0FwSWNvbn0gZnJvbSAnYXBlbWFuLXJlYWN0LWljb24nXG5cbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBOZXh0QnV0dG9uICovXG5jb25zdCBBcE5leHRCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICBkaXNhYmxlZDogdHlwZXMuYm9vbCxcbiAgICBvblRhcDogdHlwZXMuZnVuYyxcbiAgICB0ZXh0OiB0eXBlcy5zdHJpbmcsXG4gICAgc2l6ZTogdHlwZXMubnVtYmVyLFxuICAgIGljb246IHR5cGVzLnN0cmluZ1xuICB9LFxuXG4gIG1peGluczogW1xuICAgIEFwUHVyZU1peGluXG4gIF0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlICgpIHtcbiAgICByZXR1cm4ge31cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkaXNhYmxlZDogZmFsc2UsXG4gICAgICBvblRhcDogbnVsbCxcbiAgICAgIHRleHQ6IG51bGwsXG4gICAgICBpY29uOiAnZmEgZmEtY2FyZXQtcmlnaHQnXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiAoXG4gICAgICA8QXBCdXR0b24geyAuLi5wcm9wcyB9XG4gICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLW5leHQtYnV0dG9uJywgcHJvcHMuY2xhc3NOYW1lKSB9XG4gICAgICAgIHdpZGU9eyBmYWxzZSB9XG4gICAgICAgIHN0eWxlPXtPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSl9XG4gICAgICA+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtbmV4dC1idXR0b24tdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHByb3BzLnRleHQgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICAgIDxBcEljb24gY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtbmV4dC1idXR0b24taWNvbicsIHByb3BzLmljb24pfS8+XG4gICAgICA8L0FwQnV0dG9uPlxuICAgIClcbiAgfVxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwTmV4dEJ1dHRvblxuIiwiLyoqXG4gKiBQcmV2IGJ1dHRvbiBjb21wb25lbnQuXG4gKiBAY29uc3RydWN0b3IgQXBQcmV2QnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuaW1wb3J0IHtBcEljb259IGZyb20gJ2FwZW1hbi1yZWFjdC1pY29uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwUHJldkJ1dHRvbiAqL1xuY29uc3QgQXBQcmV2QnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZGlzYWJsZWQ6IHR5cGVzLmJvb2wsXG4gICAgb25UYXA6IHR5cGVzLmZ1bmMsXG4gICAgdGV4dDogdHlwZXMuc3RyaW5nLFxuICAgIHNpemU6IHR5cGVzLm51bWJlcixcbiAgICBpY29uOiB0eXBlcy5zdHJpbmdcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsLFxuICAgICAgaWNvbjogJ2ZhIGZhLWNhcmV0LWxlZnQnXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiAoXG4gICAgICA8QXBCdXR0b24geyAuLi5wcm9wcyB9XG4gICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLXByZXYtYnV0dG9uJywgcHJvcHMuY2xhc3NOYW1lKSB9XG4gICAgICAgIHdpZGU9eyBmYWxzZSB9XG4gICAgICAgIHN0eWxlPXtPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSl9XG4gICAgICA+XG4gICAgICAgIDxBcEljb24gY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtcHJldi1idXR0b24taWNvbicsIHByb3BzLmljb24pfS8+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtcHJldi1idXR0b24tdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHByb3BzLnRleHQgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L0FwQnV0dG9uPlxuICAgIClcbiAgfVxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwUHJldkJ1dHRvblxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3IgYnV0dG9uIGNvbXBvbmVudC5cbiAqIEBtb2R1bGUgYXBlbWFuLXJlYWN0LWJ1dHRvblxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLyoqXG4gICAqIEBuYW1lIEFwQmlnQnV0dG9uXG4gICAqL1xuICBnZXQgQXBCaWdCdXR0b24gKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9iaWdfYnV0dG9uJykgfSxcbiAgLyoqXG4gICAqIEBuYW1lIEFwQnV0dG9uR3JvdXBcbiAgICovXG4gIGdldCBBcEJ1dHRvbkdyb3VwICgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXBfYnV0dG9uX2dyb3VwJykgfSxcbiAgLyoqXG4gICAqIEBuYW1lIEFwQnV0dG9uU3R5bGVcbiAgICovXG4gIGdldCBBcEJ1dHRvblN0eWxlICgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXBfYnV0dG9uX3N0eWxlJykgfSxcbiAgLyoqXG4gICAqIEBuYW1lIEFwQnV0dG9uXG4gICAqL1xuICBnZXQgQXBCdXR0b24gKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9idXR0b24nKSB9LFxuICAvKipcbiAgICogQG5hbWUgQXBDZWxsQnV0dG9uUm93XG4gICAqL1xuICBnZXQgQXBDZWxsQnV0dG9uUm93ICgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXBfY2VsbF9idXR0b25fcm93JykgfSxcbiAgLyoqXG4gICAqIEBuYW1lIEFwQ2VsbEJ1dHRvblxuICAgKi9cbiAgZ2V0IEFwQ2VsbEJ1dHRvbiAoKSB7IHJldHVybiByZXF1aXJlKCcuL2FwX2NlbGxfYnV0dG9uJykgfSxcbiAgLyoqXG4gICAqIEBuYW1lIEFwSWNvbkJ1dHRvblJvd1xuICAgKi9cbiAgZ2V0IEFwSWNvbkJ1dHRvblJvdyAoKSB7IHJldHVybiByZXF1aXJlKCcuL2FwX2ljb25fYnV0dG9uX3JvdycpIH0sXG4gIC8qKlxuICAgKiBAbmFtZSBBcEljb25CdXR0b25cbiAgICovXG4gIGdldCBBcEljb25CdXR0b24gKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9pY29uX2J1dHRvbicpIH0sXG4gIC8qKlxuICAgKiBAbmFtZSBBcE5leHRCdXR0b25cbiAgICovXG4gIGdldCBBcE5leHRCdXR0b24gKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9uZXh0X2J1dHRvbicpIH0sXG4gIC8qKlxuICAgKiBAbmFtZSBBcFByZXZCdXR0b25cbiAgICovXG4gIGdldCBBcFByZXZCdXR0b24gKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9wcmV2X2J1dHRvbicpIH1cbn1cbiIsIi8qKlxuICogQGZ1bmN0aW9uIF9zY2FsZWRTaXplXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCBudW1jYWwgZnJvbSAnbnVtY2FsJ1xuXG5mdW5jdGlvbiBfc2NhbGVkU2l6ZSAoY29udGVudFNpemUsIGZyYW1lU2l6ZSwgcG9saWN5KSB7XG4gIGxldCBjdyA9IGNvbnRlbnRTaXplLndpZHRoXG4gIGxldCBjaCA9IGNvbnRlbnRTaXplLmhlaWdodFxuICBsZXQgZncgPSBmcmFtZVNpemUud2lkdGhcbiAgbGV0IGZoID0gZnJhbWVTaXplLmhlaWdodFxuXG4gIGxldCB3UmF0ZSA9IG51bWNhbC5taW4oMSwgZncgLyBjdylcbiAgbGV0IGhSYXRlID0gbnVtY2FsLm1pbigxLCBmaCAvIGNoKVxuXG4gIGxldCByYXRlID0gbnVtY2FsLm1pbih3UmF0ZSwgaFJhdGUpXG4gIHN3aXRjaCAocG9saWN5KSB7XG4gICAgY2FzZSAnbm9uZSc6XG4gICAgICByZXR1cm4gY29udGVudFNpemU7XG4gICAgY2FzZSAnZml0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHdpZHRoOiBjb250ZW50U2l6ZS53aWR0aCAqIHJhdGUsXG4gICAgICAgIGhlaWdodDogY29udGVudFNpemUuaGVpZ2h0ICogcmF0ZVxuICAgICAgfVxuICAgIGNhc2UgJ2ZpbGwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgd2lkdGg6IGNvbnRlbnRTaXplLndpZHRoICogcmF0ZSxcbiAgICAgICAgaGVpZ2h0OiBjb250ZW50U2l6ZS5oZWlnaHQgKiByYXRlXG4gICAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwb2xpY3k6ICR7cG9saWN5fWApO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX3NjYWxlZFNpemU7XG4iLCIvKipcbiAqIGFwZW1hbiByZWFjdCBwYWNrYWdlIGZvciBpbWFnZSBjb21wb25lbnQuXG4gKiBAY29uc3RydWN0b3IgQXBJbWFnZVxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgbnVtY2FsIGZyb20gJ251bWNhbCdcbmltcG9ydCBfc2NhbGVkU2l6ZSBmcm9tICcuL19zY2FsZWRfc2l6ZSdcbmltcG9ydCB7QXBTcGlubmVyfSBmcm9tICdhcGVtYW4tcmVhY3Qtc3Bpbm5lcidcbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBJbWFnZSAqL1xubGV0IEFwSW1hZ2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICAvKiogSW1hZ2Ugc2NhbGluZyBwb2xpY3kgKi9cbiAgICBzY2FsZTogdHlwZXMub25lT2YoW1xuICAgICAgJ2ZpdCcsXG4gICAgICAnZmlsbCcsXG4gICAgICAnbm9uZSdcbiAgICBdKSxcbiAgICAvKiogSW1hZ2Ugd2lkdGggKi9cbiAgICB3aWR0aDogdHlwZXMub25lT2ZUeXBlKFsgdHlwZXMubnVtYmVyLCB0eXBlcy5zdHJpbmcgXSksXG4gICAgLyoqIEltYWdlIGhlaWdodCAqL1xuICAgIGhlaWdodDogdHlwZXMub25lT2ZUeXBlKFsgdHlwZXMubnVtYmVyLCB0eXBlcy5zdHJpbmcgXSksXG4gICAgLyoqIEltYWdlIHNyYyBzdHJpbmcgKi9cbiAgICBzcmM6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogQWx0IHRlc3QgKi9cbiAgICBhbHQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogVGhlbSBvZiBzcGlubmVyICovXG4gICAgc3Bpbm5lclRoZW1lOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIEhhbmRsZXIgb24gaW1hZ2UgbG9hZCAqL1xuICAgIG9uTG9hZDogdHlwZXMuZnVuYyxcbiAgICAvKiogSGFuZGxlciBvbiBpbWFnZSBlcnJvci4gKi9cbiAgICBvbkVycm9yOiB0eXBlcy5mdW5jXG4gIH0sXG5cbiAgbWl4aW5zOiBbXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBzdGF0aWNzOiB7XG4gICAgc2NhbGVkU2l6ZTogX3NjYWxlZFNpemUsXG4gICAgemVyb0lmTmFOICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzTmFOKHZhbHVlKSA/IDAgOiB2YWx1ZVxuICAgIH0sXG4gICAgbnVsbElmTmFOICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzTmFOKHZhbHVlKSA/IG51bGwgOiB2YWx1ZVxuICAgIH1cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICByZXR1cm4ge1xuICAgICAgaW1nV2lkdGg6IG51bGwsXG4gICAgICBpbWdIZWlnaHQ6IG51bGwsXG4gICAgICBtb3VudGVkOiBmYWxzZSxcbiAgICAgIHJlYWR5OiBmYWxzZSxcbiAgICAgIGxvYWRpbmc6ICEhcy5wcm9wcy5zcmMsXG4gICAgICBlcnJvcjogbnVsbFxuICAgIH1cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjYWxlOiAnbm9uZScsXG4gICAgICB3aWR0aDogbnVsbCxcbiAgICAgIGhlaWdodDogbnVsbCxcbiAgICAgIHNyYzogbnVsbCxcbiAgICAgIGFsdDogXCJOTyBJTUFHRVwiLFxuICAgICAgc3Bpbm5lclRoZW1lOiBBcFNwaW5uZXIuREVGQVVMVF9USEVNRSxcbiAgICAgIG9uTG9hZDogbnVsbCxcbiAgICAgIG9uRXJyb3I6IG51bGxcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzLFxuICAgICAgeyBzdGF0ZSwgcHJvcHMgfSA9IHM7XG5cbiAgICBsZXQgc2l6ZSA9IHtcbiAgICAgIHdpZHRoOiBwcm9wcy53aWR0aCB8fCBudWxsLFxuICAgICAgaGVpZ2h0OiBwcm9wcy5oZWlnaHQgfHwgbnVsbFxuICAgIH1cblxuICAgIGxldCB7IG1vdW50ZWQsIGVycm9yLCByZWFkeSwgbG9hZGluZyB9ID0gc3RhdGVcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1pbWFnZScsIHByb3BzLmNsYXNzTmFtZSwge1xuICAgICAgICAgICAgICAgICdhcC1pbWFnZS1sb2FkaW5nJzogcHJvcHMuc3JjICYmIGxvYWRpbmcsXG4gICAgICAgICAgICAgICAgJ2FwLWltYWdlLXJlYWR5JzogcHJvcHMuc3JjICYmIHJlYWR5XG4gICAgICAgICAgICB9KSB9XG4gICAgICAgICAgIHN0eWxlPXsgT2JqZWN0LmFzc2lnbih7fSwgc2l6ZSwgcHJvcHMuc3R5bGUpIH0+XG4gICAgICAgIHsgbW91bnRlZCAmJiBlcnJvciA/IHMuX3JlbmRlck5vdGZvdW5kKHNpemUpIDogbnVsbH1cbiAgICAgICAgeyBtb3VudGVkICYmICFlcnJvciA/IHMuX3JlbmRlckltZyhzaXplLCBtb3VudGVkKSA6IG51bGwgfVxuICAgICAgICB7IGxvYWRpbmcgPyBzLl9yZW5kZXJTcGlubmVyKHNpemUpIDogbnVsbCB9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gTGlmZWN5Y2xlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgY29tcG9uZW50V2lsbE1vdW50ICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgcy5zZXRTdGF0ZSh7XG4gICAgICBtb3VudGVkOiB0cnVlXG4gICAgfSlcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgcy5yZXNpemVJbWFnZSgpXG4gICAgfSwgMClcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wcykge1xuICAgIGNvbnN0IHMgPSB0aGlzXG5cbiAgICBsZXQgc3JjID0gcy5wcm9wcy5zcmMsXG4gICAgICBuZXh0U3JjID0gbmV4dFByb3BzLnNyYztcbiAgICBsZXQgc3JjQ2hhbmdlZCA9ICEhbmV4dFNyYyAmJiAobmV4dFNyYyAhPT0gc3JjKVxuICAgIGlmIChzcmNDaGFuZ2VkKSB7XG4gICAgICBzLnNldFN0YXRlKHtcbiAgICAgICAgcmVhZHk6IGZhbHNlLFxuICAgICAgICBsb2FkaW5nOiB0cnVlLFxuICAgICAgICBlcnJvcjogbnVsbFxuICAgICAgfSlcbiAgICB9XG5cbiAgfSxcblxuICBjb21wb25lbnRXaWxsVXBkYXRlKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBzLnJlc2l6ZUltYWdlKClcbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEhlbHBlclxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICBoYW5kbGVMb2FkIChlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgcHJvcHMub25Mb2FkKGUpXG4gICAgfVxuXG4gICAgcy5yZXNpemVJbWFnZShlLnRhcmdldC53aWR0aCwgZS50YXJnZXQuaGVpZ2h0KVxuICB9LFxuXG4gIGhhbmRsZUVycm9yIChlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgcy5zZXRTdGF0ZSh7XG4gICAgICBlcnJvcjogZSxcbiAgICAgIGxvYWRpbmc6IGZhbHNlXG4gICAgfSlcblxuICAgIGlmIChwcm9wcy5vbkVycm9yKSB7XG4gICAgICBwcm9wcy5vbkVycm9yKGUpXG4gICAgfVxuICB9LFxuXG4gIHJlc2l6ZUltYWdlIChpbWdDb250ZW50V2lkdGgsIGltZ0NvbnRlbnRIZWlnaHQpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHN0YXRlLCBwcm9wcyB9ID0gc1xuXG4gICAgaW1nQ29udGVudFdpZHRoID0gaW1nQ29udGVudFdpZHRoIHx8IHN0YXRlLmltZ0NvbnRlbnRXaWR0aFxuICAgIGltZ0NvbnRlbnRIZWlnaHQgPSBpbWdDb250ZW50SGVpZ2h0IHx8IHN0YXRlLmltZ0NvbnRlbnRIZWlnaHRcblxuICAgIGxldCB2YWxpZCA9IGltZ0NvbnRlbnRXaWR0aCAmJiBpbWdDb250ZW50SGVpZ2h0XG4gICAgaWYgKCF2YWxpZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgbGV0IGVsbSA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKHMpXG4gICAgbGV0IGZyYW1lU2l6ZSA9IHtcbiAgICAgIHdpZHRoOiBlbG0ub2Zmc2V0V2lkdGgsXG4gICAgICBoZWlnaHQ6IGVsbS5vZmZzZXRIZWlnaHRcbiAgICB9XG4gICAgbGV0IGNvbnRlbnRTaXplID0ge1xuICAgICAgaGVpZ2h0OiBpbWdDb250ZW50SGVpZ2h0LFxuICAgICAgd2lkdGg6IGltZ0NvbnRlbnRXaWR0aFxuICAgIH07XG4gICAgbGV0IHNjYWxlZFNpemUgPSBBcEltYWdlLnNjYWxlZFNpemUoXG4gICAgICBjb250ZW50U2l6ZSwgZnJhbWVTaXplLCBwcm9wcy5zY2FsZVxuICAgICk7XG5cbiAgICBzLnNldFN0YXRlKHtcbiAgICAgIGltZ0NvbnRlbnRXaWR0aDogaW1nQ29udGVudFdpZHRoLFxuICAgICAgaW1nQ29udGVudEhlaWdodDogaW1nQ29udGVudEhlaWdodCxcbiAgICAgIGltZ1dpZHRoOiBzY2FsZWRTaXplLndpZHRoLFxuICAgICAgaW1nSGVpZ2h0OiBzY2FsZWRTaXplLmhlaWdodCxcbiAgICAgIHJlYWR5OiB0cnVlLFxuICAgICAgbG9hZGluZzogZmFsc2VcbiAgICB9KVxuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBQcml2YXRlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuICBfcmVuZGVySW1nIChzaXplKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBzdGF0ZSwgcHJvcHMgfSA9IHNcblxuICAgIGxldCB7IG51bGxJZk5hTiwgemVyb0lmTmFOIH0gPSBBcEltYWdlXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGltZyBzcmM9eyBwcm9wcy5zcmMgfVxuICAgICAgICAgICBhbHQ9eyBwcm9wcy5hbHQgfVxuICAgICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1pbWFnZS1jb250ZW50JykgfVxuICAgICAgICAgICBzdHlsZT17IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogemVyb0lmTmFOKChzaXplLmhlaWdodCAtIHN0YXRlLmltZ0hlaWdodCkgLyAyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IHplcm9JZk5hTigoc2l6ZS53aWR0aCAtIHN0YXRlLmltZ1dpZHRoKSAvIDIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG51bGxJZk5hTihzdGF0ZS5pbWdXaWR0aCksXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IG51bGxJZk5hTihzdGF0ZS5pbWdIZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgICB9IH1cbiAgICAgICAgICAgb25Mb2FkPXsgcy5oYW5kbGVMb2FkIH1cbiAgICAgICAgICAgb25FcnJvcj17IHMuaGFuZGxlRXJyb3IgfVxuICAgICAgLz5cbiAgICApXG4gIH0sXG5cbiAgX3JlbmRlck5vdGZvdW5kIChzaXplKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYXAtaW1hZ2Utbm90Zm91bmRcIlxuICAgICAgICAgICBzdHlsZT17IHtcbiAgICAgICAgICAgICAgICAgICAgbGluZUhlaWdodDogYCR7c2l6ZS5oZWlnaHR9cHhgLFxuICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogYCR7bnVtY2FsLm1pbihzaXplLmhlaWdodCAqIDAuNCwgMTgpfWBcbiAgICAgICAgICAgICAgICAgfSB9XG4gICAgICA+eyBwcm9wcy5hbHQgfTwvZGl2PlxuICAgIClcbiAgfSxcblxuICBfcmVuZGVyU3Bpbm5lciAoc2l6ZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIHJldHVybiAoXG4gICAgICA8QXBTcGlubmVyIGNsYXNzTmFtZT1cImFwLWltYWdlLXNwaW5uZXJcIlxuICAgICAgICAgICAgICAgICB0aGVtZT17IHByb3BzLnNwaW5uZXJUaGVtZSB9XG4gICAgICAgICAgICAgICAgIHN0eWxlPXsge1xuICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzaXplLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICB9IH0vPlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBBcEltYWdlXG4iLCIvKipcbiAqIFN0eWxlIGZvciBBcEltYWdlLlxuICogQGNvbnN0cnVjdG9yIEFwSW1hZ2VTdHlsZVxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtBcFN0eWxlfSBmcm9tICdhcGVtYW4tcmVhY3Qtc3R5bGUnXG5cbi8qKiBAbGVuZHMgQXBJbWFnZVN0eWxlICovXG5jb25zdCBBcEltYWdlU3R5bGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIHNjb3BlZDogdHlwZXMuYm9vbCxcbiAgICBzdHlsZTogdHlwZXMub2JqZWN0LFxuICAgIGJhY2tncm91bmRDb2xvcjogdHlwZXMuc3RyaW5nXG4gIH0sXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlZDogZmFsc2UsXG4gICAgICBzdHlsZToge30sXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjREREJyxcbiAgICAgIHNwaW5Db2xvcjogJ3JnYmEoMjU1LDI1NSwyNTUsMC41KSdcbiAgICB9XG4gIH0sXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgbGV0IHsgYmFja2dyb3VuZENvbG9yLCBzcGluQ29sb3IgfSA9IHByb3BzXG5cbiAgICBsZXQgdHJhbnNpdGlvbkR1cmF0aW9uID0gMTAwXG5cbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgICcuYXAtaW1hZ2UnOiB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogYCR7YmFja2dyb3VuZENvbG9yfWAsXG4gICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnXG4gICAgICB9LFxuICAgICAgJy5hcC1pbWFnZSBpbWcnOiB7XG4gICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgIHRyYW5zaXRpb246IGB3aWR0aCAke3RyYW5zaXRpb25EdXJhdGlvbn1tcywgb3BhY2l0eSAke3RyYW5zaXRpb25EdXJhdGlvbn1tc2BcbiAgICAgIH0sXG4gICAgICAnLmFwLWltYWdlLXJlYWR5IGltZyc6IHtcbiAgICAgICAgb3BhY2l0eTogMVxuICAgICAgfSxcbiAgICAgICcuYXAtaW1hZ2UtY29udGVudCc6IHtcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXG4gICAgICB9LFxuICAgICAgJy5hcC1pbWFnZS1zcGlubmVyJzoge1xuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgbGVmdDogMCxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICB6SW5kZXg6IDgsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMCwwLDAsMC4xKScsXG4gICAgICAgIGNvbG9yOiBgJHtzcGluQ29sb3J9YFxuICAgICAgfSxcbiAgICAgICcuYXAtaW1hZ2Utbm90Zm91bmQnOiB7XG4gICAgICAgIGRpc3BsYXk6ICdibG9jaycsXG4gICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgIGNvbG9yOiAncmdiYSgwLDAsMCwwLjEpJyxcbiAgICAgICAgZm9udEZhbWlseTogJ21vbm9zcGFjZSdcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IHNtYWxsTWVkaWFEYXRhID0ge31cbiAgICBsZXQgbWVkaXVtTWVkaWFEYXRhID0ge31cbiAgICBsZXQgbGFyZ2VNZWRpYURhdGEgPSB7fVxuICAgIHJldHVybiAoXG4gICAgICA8QXBTdHlsZSBzY29wZWQ9eyBwcm9wcy5zY29wZWQgfVxuICAgICAgICAgICAgICAgZGF0YT17IE9iamVjdC5hc3NpZ24oZGF0YSwgcHJvcHMuc3R5bGUpIH1cbiAgICAgICAgICAgICAgIHNtYWxsTWVkaWFEYXRhPXsgc21hbGxNZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbWVkaXVtTWVkaWFEYXRhPXsgbWVkaXVtTWVkaWFEYXRhIH1cbiAgICAgICAgICAgICAgIGxhcmdlTWVkaWFEYXRhPXsgbGFyZ2VNZWRpYURhdGEgfVxuICAgICAgPnsgcHJvcHMuY2hpbGRyZW4gfTwvQXBTdHlsZT5cbiAgICApXG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gQXBJbWFnZVN0eWxlO1xuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3IgaW1hZ2UgY29tcG9uZW50LlxuICogQG1vZHVsZSBhcGVtYW4tcmVhY3QtaW1hZ2VcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8qKlxuICAgKiBAbmFtZSBBcEltYWdlU3R5bGVcbiAgICovXG4gIGdldCBBcEltYWdlU3R5bGUgKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9pbWFnZV9zdHlsZScpIH0sXG4gIC8qKlxuICAgKiBAbmFtZSBBcEltYWdlXG4gICAqL1xuICBnZXQgQXBJbWFnZSAoKSB7IHJldHVybiByZXF1aXJlKCcuL2FwX2ltYWdlJykgfVxufVxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3Igc3Bpbm5lci5cbiAqIEBjb25zdHJ1Y3RvciBBcFNwaW5uZXJcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IG51bWNhbCBmcm9tICdudW1jYWwnXG5pbXBvcnQge0FwUHVyZU1peGluLCBBcExheW91dE1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuaW1wb3J0IGNvbnN0cyBmcm9tICcuL2NvbnN0cydcblxuY29uc3QgREVGQVVMVF9USEVNRSA9ICdjJ1xuXG4vKiogQGxlbmRzIEFwU3Bpbm5lciAqL1xuY29uc3QgQXBTcGlubmVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZW5hYmxlZDogdHlwZXMuYm9vbCxcbiAgICB0aGVtZTogdHlwZXMub25lT2YoXG4gICAgICBPYmplY3Qua2V5cyhjb25zdHMudGhlbWVzKVxuICAgIClcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpbixcbiAgICBBcExheW91dE1peGluXG4gIF0sXG5cbiAgc3RhdGljczoge1xuICAgIERFRkFVTFRfVEhFTUU6IERFRkFVTFRfVEhFTUVcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgdGhlbWU6IERFRkFVTFRfVEhFTUVcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzLCBsYXlvdXRzIH0gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtc3Bpbm5lcicsIHByb3BzLmNsYXNzTmFtZSwge1xuICAgICAgICAgICAgICAgICdhcC1zcGlubmVyLXZpc2libGUnOiAhIWxheW91dHMuc3Bpbm5lcixcbiAgICAgICAgICAgICAgICAnYXAtc3Bpbm5lci1lbmFibGVkJzogISFwcm9wcy5lbmFibGVkXG4gICAgICAgICAgICB9KSB9XG4gICAgICAgICAgIHN0eWxlPXtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgbGF5b3V0cy5zcGlubmVyLCBwcm9wcy5zdHlsZSlcbiAgICAgICAgICAgICAgICAgIH0+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXNwaW5uZXItYWxpZ25lclwiPiZuYnNwOzwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiByZWY9XCJpY29uXCJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NuYW1lcygnYXAtc3Bpbm5lci1pY29uJywgY29uc3RzLnRoZW1lc1twcm9wcy50aGVtZV0pXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXsgbGF5b3V0cy5pY29uIH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIExpZmVjeWNsZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGNvbXBvbmVudERpZE1vdW50ICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIHMuc2V0U3RhdGUoe1xuICAgICAgaWNvblZpc2libGU6IHRydWVcbiAgICB9KVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50ICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEZvciBBcExheW91dE1peGluXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0SW5pdGlhbExheW91dHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzcGlubmVyOiBudWxsLFxuICAgICAgaWNvbjogbnVsbFxuICAgIH1cbiAgfSxcblxuICBjYWxjTGF5b3V0cyAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgbm9kZSA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKHMpXG5cbiAgICBsZXQgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlIHx8IG5vZGUucGFyZW50RWxlbWVudFxuICAgIGxldCB3ID0gbnVtY2FsLm1heChwYXJlbnQub2Zmc2V0V2lkdGgsIG5vZGUub2Zmc2V0V2lkdGgpXG4gICAgbGV0IGggPSBudW1jYWwubWF4KHBhcmVudC5vZmZzZXRIZWlnaHQsIG5vZGUub2Zmc2V0SGVpZ2h0KVxuICAgIGxldCBzaXplID0gbnVtY2FsLm1pbih3LCBoKVxuICAgIGxldCBpY29uU2l6ZSA9IG51bWNhbC5taW4oc2l6ZSAqIDAuNSwgNjApXG5cbiAgICByZXR1cm4ge1xuICAgICAgc3Bpbm5lcjoge1xuICAgICAgICBsaW5lSGVpZ2h0OiBgJHtzaXplfXB4YCxcbiAgICAgICAgZm9udFNpemU6IGAke2ljb25TaXplfXB4YFxuICAgICAgfSxcbiAgICAgIGljb246IHtcbiAgICAgICAgd2lkdGg6IGAke2ljb25TaXplfXB4YCxcbiAgICAgICAgaGVpZ2h0OiBgJHtpY29uU2l6ZX1weGBcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gQXBTcGlubmVyXG4iLCIvKipcbiAqIFN0eWxlIGZvciBBcFNwaW5uZXIuXG4gKiBAY29uc3RydWN0b3IgQXBTcGlubmVyU3R5bGVcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJ1xuXG4vKiogQGxlbmRzIEFwU3Bpbm5lclN0eWxlICovXG5jb25zdCBBcFNwaW5uZXJTdHlsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgc3RhdGljczoge1xuICAgIGFsaWduZXJTdHlsZToge1xuICAgICAgd2lkdGg6IDEsXG4gICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgIG1hcmdpblJpZ2h0OiAnLTFweCcsXG4gICAgICB2ZXJ0aWNhbEFsaWduOiAnbWlkZGxlJyxcbiAgICAgIGNvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgb3BhY2l0eTogMCxcbiAgICAgIGhlaWdodDogJzEwMCUnXG4gICAgfVxuICB9LFxuICBwcm9wVHlwZXM6IHtcbiAgICBzY29wZWQ6IHR5cGVzLmJvb2wsXG4gICAgdHlwZTogdHlwZXMuc3RyaW5nLFxuICAgIHN0eWxlOiB0eXBlcy5vYmplY3RcbiAgfSxcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlZDogZmFsc2UsXG4gICAgICB0eXBlOiAndGV4dC9jc3MnLFxuICAgICAgc3R5bGU6IHt9XG4gICAgfVxuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG5cbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgICcuYXAtc3Bpbm5lcic6IHtcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgZGlzcGxheTogJ25vbmUnXG4gICAgICB9LFxuICAgICAgJy5hcC1zcGlubmVyLmFwLXNwaW5uZXItZW5hYmxlZCc6IHtcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuICAgICAgfSxcbiAgICAgICcuYXAtc3Bpbm5lci1pY29uJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgbWFyZ2luOiAnMCA0cHgnLFxuICAgICAgICB0cmFuc2l0aW9uOiAnb3BhY2l0eSAxMDBtcycsXG4gICAgICAgIG9wYWNpdHk6IDBcbiAgICAgIH0sXG4gICAgICAnLmFwLXNwaW5uZXItdmlzaWJsZSAuYXAtc3Bpbm5lci1pY29uJzoge1xuICAgICAgICBvcGFjaXR5OiAxXG4gICAgICB9LFxuICAgICAgJy5hcC1zcGlubmVyLWFsaWduZXInOiBBcFNwaW5uZXJTdHlsZS5hbGlnbmVyU3R5bGVcbiAgICB9XG4gICAgbGV0IHNtYWxsTWVkaWFEYXRhID0ge31cbiAgICBsZXQgbWVkaXVtTWVkaWFEYXRhID0ge31cbiAgICBsZXQgbGFyZ2VNZWRpYURhdGEgPSB7fVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxBcFN0eWxlIHNjb3BlZD17IHByb3BzLnNjb3BlZCB9XG4gICAgICAgICAgICAgICBkYXRhPXsgT2JqZWN0LmFzc2lnbihkYXRhLCBwcm9wcy5zdHlsZSkgfVxuICAgICAgICAgICAgICAgc21hbGxNZWRpYURhdGE9eyBzbWFsbE1lZGlhRGF0YSB9XG4gICAgICAgICAgICAgICBtZWRpdW1NZWRpYURhdGE9eyBtZWRpdW1NZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbGFyZ2VNZWRpYURhdGE9eyBsYXJnZU1lZGlhRGF0YSB9XG4gICAgICA+e3Byb3BzLmNoaWxkcmVufTwvQXBTdHlsZT5cbiAgICApXG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gQXBTcGlubmVyU3R5bGVcbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLnRoZW1lcyA9IHtcbiAgYTogWyAnZmEnLCAnZmEtc3BpbicsICdmYS1zcGlubmVyJyBdLFxuICBiOiBbICdmYScsICdmYS1zcGluJywgJ2ZhLWNpcmNsZS1vLW5vdGNoJyBdLFxuICBjOiBbICdmYScsICdmYS1zcGluJywgJ2ZhLXJlZnJlc2gnIF0sXG4gIGQ6IFsgJ2ZhJywgJ2ZhLXNwaW4nLCAnZmEtZ2VhcicgXSxcbiAgZTogWyAnZmEnLCAnZmEtc3BpbicsICdmYS1wdWxzZScgXVxufVxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3Igc3Bpbm5lci5cbiAqIEBtb2R1bGUgYXBlbWFuLXJlYWN0LXNwaW5uZXJcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8qKlxuICAgKiBAbmFtZSBBcFNwaW5uZXJTdHlsZVxuICAgKi9cbiAgZ2V0IEFwU3Bpbm5lclN0eWxlICgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXBfc3Bpbm5lcl9zdHlsZScpIH0sXG4gIC8qKlxuICAgKiBAbmFtZSBBcFNwaW5uZXJcbiAgICovXG4gIGdldCBBcFNwaW5uZXIgKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9zcGlubmVyJykgfSxcbiAgZ2V0IGNvbnN0cyAoKSB7IHJldHVybiByZXF1aXJlKCcuL2NvbnN0cycpIH1cbn1cbiIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG4gICAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG4gICAgKGZhY3RvcnkoKGdsb2JhbC5hc3luYyA9IGdsb2JhbC5hc3luYyB8fCB7fSkpKTtcbn0odGhpcywgZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQSBmYXN0ZXIgYWx0ZXJuYXRpdmUgdG8gYEZ1bmN0aW9uI2FwcGx5YCwgdGhpcyBmdW5jdGlvbiBpbnZva2VzIGBmdW5jYFxuICAgICAqIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIGB0aGlzQXJnYCBhbmQgdGhlIGFyZ3VtZW50cyBvZiBgYXJnc2AuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGludm9rZS5cbiAgICAgKiBAcGFyYW0geyp9IHRoaXNBcmcgVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAgICAgKiBAcGFyYW0gey4uLip9IGFyZ3MgVGhlIGFyZ3VtZW50cyB0byBpbnZva2UgYGZ1bmNgIHdpdGguXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHJlc3VsdCBvZiBgZnVuY2AuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYXBwbHkoZnVuYywgdGhpc0FyZywgYXJncykge1xuICAgICAgdmFyIGxlbmd0aCA9IGFyZ3MubGVuZ3RoO1xuICAgICAgc3dpdGNoIChsZW5ndGgpIHtcbiAgICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcpO1xuICAgICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYXJnc1swXSk7XG4gICAgICAgIGNhc2UgMjogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCBhcmdzWzBdLCBhcmdzWzFdKTtcbiAgICAgICAgY2FzZSAzOiByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlIFtsYW5ndWFnZSB0eXBlXShodHRwczovL2VzNS5naXRodWIuaW8vI3g4KSBvZiBgT2JqZWN0YC5cbiAgICAgKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBzaW5jZSAwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMYW5nXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNPYmplY3Qoe30pO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc09iamVjdChudWxsKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgICAgIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgdmFyIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nO1xuICAgIHZhciBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nO1xuICAgIC8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbiAgICB2YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAgICAgKiBvZiB2YWx1ZXMuXG4gICAgICovXG4gICAgdmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAc2luY2UgMC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGFuZ1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLFxuICAgICAqICBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNGdW5jdGlvbihfKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAgICAgLy8gVGhlIHVzZSBvZiBgT2JqZWN0I3RvU3RyaW5nYCBhdm9pZHMgaXNzdWVzIHdpdGggdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gICAgICAvLyBpbiBTYWZhcmkgOCB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheSBhbmQgd2VhayBtYXAgY29uc3RydWN0b3JzLFxuICAgICAgLy8gYW5kIFBoYW50b21KUyAxLjkgd2hpY2ggcmV0dXJucyAnZnVuY3Rpb24nIGZvciBgTm9kZUxpc3RgIGluc3RhbmNlcy5cbiAgICAgIHZhciB0YWcgPSBpc09iamVjdCh2YWx1ZSkgPyBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICAgICAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gICAgICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHNpbmNlIDQuMC4wXG4gICAgICogQGNhdGVnb3J5IExhbmdcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xuICAgIH1cblxuICAgIC8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbiAgICB2YXIgc3ltYm9sVGFnID0gJ1tvYmplY3QgU3ltYm9sXSc7XG5cbiAgICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gICAgdmFyIG9iamVjdFByb3RvJDEgPSBPYmplY3QucHJvdG90eXBlO1xuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAgICAgKiBvZiB2YWx1ZXMuXG4gICAgICovXG4gICAgdmFyIG9iamVjdFRvU3RyaW5nJDEgPSBvYmplY3RQcm90byQxLnRvU3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBTeW1ib2xgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAc2luY2UgNC4wLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGFuZ1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLFxuICAgICAqICBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzeW1ib2wnIHx8XG4gICAgICAgIChpc09iamVjdExpa2UodmFsdWUpICYmIG9iamVjdFRvU3RyaW5nJDEuY2FsbCh2YWx1ZSkgPT0gc3ltYm9sVGFnKTtcbiAgICB9XG5cbiAgICAvKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbiAgICB2YXIgTkFOID0gMCAvIDA7XG5cbiAgICAvKiogVXNlZCB0byBtYXRjaCBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlLiAqL1xuICAgIHZhciByZVRyaW0gPSAvXlxccyt8XFxzKyQvZztcblxuICAgIC8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG4gICAgdmFyIHJlSXNCYWRIZXggPSAvXlstK10weFswLTlhLWZdKyQvaTtcblxuICAgIC8qKiBVc2VkIHRvIGRldGVjdCBiaW5hcnkgc3RyaW5nIHZhbHVlcy4gKi9cbiAgICB2YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuICAgIC8qKiBVc2VkIHRvIGRldGVjdCBvY3RhbCBzdHJpbmcgdmFsdWVzLiAqL1xuICAgIHZhciByZUlzT2N0YWwgPSAvXjBvWzAtN10rJC9pO1xuXG4gICAgLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGByb290YC4gKi9cbiAgICB2YXIgZnJlZVBhcnNlSW50ID0gcGFyc2VJbnQ7XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgbnVtYmVyLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHNpbmNlIDQuMC4wXG4gICAgICogQGNhdGVnb3J5IExhbmdcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIG51bWJlci5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy50b051bWJlcigzKTtcbiAgICAgKiAvLyA9PiAzXG4gICAgICpcbiAgICAgKiBfLnRvTnVtYmVyKE51bWJlci5NSU5fVkFMVUUpO1xuICAgICAqIC8vID0+IDVlLTMyNFxuICAgICAqXG4gICAgICogXy50b051bWJlcihJbmZpbml0eSk7XG4gICAgICogLy8gPT4gSW5maW5pdHlcbiAgICAgKlxuICAgICAqIF8udG9OdW1iZXIoJzMnKTtcbiAgICAgKiAvLyA9PiAzXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9OdW1iZXIodmFsdWUpIHtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gTkFOO1xuICAgICAgfVxuICAgICAgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICB2YXIgb3RoZXIgPSBpc0Z1bmN0aW9uKHZhbHVlLnZhbHVlT2YpID8gdmFsdWUudmFsdWVPZigpIDogdmFsdWU7XG4gICAgICAgIHZhbHVlID0gaXNPYmplY3Qob3RoZXIpID8gKG90aGVyICsgJycpIDogb3RoZXI7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/ICB2YWx1ZSA6ICt2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZShyZVRyaW0sICcnKTtcbiAgICAgIHZhciBpc0JpbmFyeSA9IHJlSXNCaW5hcnkudGVzdCh2YWx1ZSk7XG4gICAgICByZXR1cm4gKGlzQmluYXJ5IHx8IHJlSXNPY3RhbC50ZXN0KHZhbHVlKSlcbiAgICAgICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgICAgIDogKHJlSXNCYWRIZXgudGVzdCh2YWx1ZSkgPyBOQU4gOiArdmFsdWUpO1xuICAgIH1cblxuICAgIHZhciBJTkZJTklUWSA9IDEgLyAwO1xuICAgIHZhciBNQVhfSU5URUdFUiA9IDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4O1xuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYW4gaW50ZWdlci5cbiAgICAgKlxuICAgICAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIGxvb3NlbHkgYmFzZWQgb25cbiAgICAgKiBbYFRvSW50ZWdlcmBdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy10b2ludGVnZXIpLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHNpbmNlIDQuMC4wXG4gICAgICogQGNhdGVnb3J5IExhbmdcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGNvbnZlcnRlZCBpbnRlZ2VyLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnRvSW50ZWdlcigzKTtcbiAgICAgKiAvLyA9PiAzXG4gICAgICpcbiAgICAgKiBfLnRvSW50ZWdlcihOdW1iZXIuTUlOX1ZBTFVFKTtcbiAgICAgKiAvLyA9PiAwXG4gICAgICpcbiAgICAgKiBfLnRvSW50ZWdlcihJbmZpbml0eSk7XG4gICAgICogLy8gPT4gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDhcbiAgICAgKlxuICAgICAqIF8udG9JbnRlZ2VyKCczJyk7XG4gICAgICogLy8gPT4gM1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvSW50ZWdlcih2YWx1ZSkge1xuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6IDA7XG4gICAgICB9XG4gICAgICB2YWx1ZSA9IHRvTnVtYmVyKHZhbHVlKTtcbiAgICAgIGlmICh2YWx1ZSA9PT0gSU5GSU5JVFkgfHwgdmFsdWUgPT09IC1JTkZJTklUWSkge1xuICAgICAgICB2YXIgc2lnbiA9ICh2YWx1ZSA8IDAgPyAtMSA6IDEpO1xuICAgICAgICByZXR1cm4gc2lnbiAqIE1BWF9JTlRFR0VSO1xuICAgICAgfVxuICAgICAgdmFyIHJlbWFpbmRlciA9IHZhbHVlICUgMTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gdmFsdWUgPyAocmVtYWluZGVyID8gdmFsdWUgLSByZW1haW5kZXIgOiB2YWx1ZSkgOiAwO1xuICAgIH1cblxuICAgIC8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG4gICAgdmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuICAgIC8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbiAgICB2YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXg7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGBmdW5jYCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiB0aGVcbiAgICAgKiBjcmVhdGVkIGZ1bmN0aW9uIGFuZCBhcmd1bWVudHMgZnJvbSBgc3RhcnRgIGFuZCBiZXlvbmQgcHJvdmlkZWQgYXNcbiAgICAgKiBhbiBhcnJheS5cbiAgICAgKlxuICAgICAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBiYXNlZCBvbiB0aGVcbiAgICAgKiBbcmVzdCBwYXJhbWV0ZXJdKGh0dHBzOi8vbWRuLmlvL3Jlc3RfcGFyYW1ldGVycykuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAc2luY2UgNC4wLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBhcHBseSBhIHJlc3QgcGFyYW1ldGVyIHRvLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnQ9ZnVuYy5sZW5ndGgtMV0gVGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoZSByZXN0IHBhcmFtZXRlci5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIHNheSA9IF8ucmVzdChmdW5jdGlvbih3aGF0LCBuYW1lcykge1xuICAgICAqICAgcmV0dXJuIHdoYXQgKyAnICcgKyBfLmluaXRpYWwobmFtZXMpLmpvaW4oJywgJykgK1xuICAgICAqICAgICAoXy5zaXplKG5hbWVzKSA+IDEgPyAnLCAmICcgOiAnJykgKyBfLmxhc3QobmFtZXMpO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogc2F5KCdoZWxsbycsICdmcmVkJywgJ2Jhcm5leScsICdwZWJibGVzJyk7XG4gICAgICogLy8gPT4gJ2hlbGxvIGZyZWQsIGJhcm5leSwgJiBwZWJibGVzJ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlc3QoZnVuYywgc3RhcnQpIHtcbiAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgICAgIH1cbiAgICAgIHN0YXJ0ID0gbmF0aXZlTWF4KHN0YXJ0ID09PSB1bmRlZmluZWQgPyAoZnVuYy5sZW5ndGggLSAxKSA6IHRvSW50ZWdlcihzdGFydCksIDApO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBuYXRpdmVNYXgoYXJncy5sZW5ndGggLSBzdGFydCwgMCksXG4gICAgICAgICAgICBhcnJheSA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBhcnJheVtpbmRleF0gPSBhcmdzW3N0YXJ0ICsgaW5kZXhdO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAoc3RhcnQpIHtcbiAgICAgICAgICBjYXNlIDA6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJyYXkpO1xuICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBhcmdzWzBdLCBhcnJheSk7XG4gICAgICAgICAgY2FzZSAyOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFyZ3NbMF0sIGFyZ3NbMV0sIGFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3RoZXJBcmdzID0gQXJyYXkoc3RhcnQgKyAxKTtcbiAgICAgICAgaW5kZXggPSAtMTtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBzdGFydCkge1xuICAgICAgICAgIG90aGVyQXJnc1tpbmRleF0gPSBhcmdzW2luZGV4XTtcbiAgICAgICAgfVxuICAgICAgICBvdGhlckFyZ3Nbc3RhcnRdID0gYXJyYXk7XG4gICAgICAgIHJldHVybiBhcHBseShmdW5jLCB0aGlzLCBvdGhlckFyZ3MpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbml0aWFsUGFyYW1zIChmbikge1xuICAgICAgICByZXR1cm4gcmVzdChmdW5jdGlvbiAoYXJncyAvKi4uLiwgY2FsbGJhY2sqLykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgYXJncywgY2FsbGJhY2spO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcHBseUVhY2gkMShlYWNoZm4pIHtcbiAgICAgICAgcmV0dXJuIHJlc3QoZnVuY3Rpb24gKGZucywgYXJncykge1xuICAgICAgICAgICAgdmFyIGdvID0gaW5pdGlhbFBhcmFtcyhmdW5jdGlvbiAoYXJncywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVhY2hmbihmbnMsIGZ1bmN0aW9uIChmbiwgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgZm4uYXBwbHkodGhhdCwgYXJncy5jb25jYXQoW2NiXSkpO1xuICAgICAgICAgICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdvLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ287XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgbm8tb3BlcmF0aW9uIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBgdW5kZWZpbmVkYCByZWdhcmRsZXNzIG9mIHRoZVxuICAgICAqIGFyZ3VtZW50cyBpdCByZWNlaXZlcy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBzaW5jZSAyLjMuMFxuICAgICAqIEBjYXRlZ29yeSBVdGlsXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBvYmplY3QgPSB7ICd1c2VyJzogJ2ZyZWQnIH07XG4gICAgICpcbiAgICAgKiBfLm5vb3Aob2JqZWN0KSA9PT0gdW5kZWZpbmVkO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBub29wKCkge1xuICAgICAgLy8gTm8gb3BlcmF0aW9uIHBlcmZvcm1lZC5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbmNlKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoZm4gPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmbiA9IG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ucHJvcGVydHlgIHdpdGhvdXQgc3VwcG9ydCBmb3IgZGVlcCBwYXRocy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZVByb3BlcnR5KGtleSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgXCJsZW5ndGhcIiBwcm9wZXJ0eSB2YWx1ZSBvZiBgb2JqZWN0YC5cbiAgICAgKlxuICAgICAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gYXZvaWQgYVxuICAgICAqIFtKSVQgYnVnXShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTQyNzkyKSB0aGF0IGFmZmVjdHNcbiAgICAgKiBTYWZhcmkgb24gYXQgbGVhc3QgaU9TIDguMS04LjMgQVJNNjQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgXCJsZW5ndGhcIiB2YWx1ZS5cbiAgICAgKi9cbiAgICB2YXIgZ2V0TGVuZ3RoID0gYmFzZVByb3BlcnR5KCdsZW5ndGgnKTtcblxuICAgIC8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xuICAgIHZhciBNQVhfU0FGRV9JTlRFR0VSID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBsZW5ndGguXG4gICAgICpcbiAgICAgKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyBsb29zZWx5IGJhc2VkIG9uXG4gICAgICogW2BUb0xlbmd0aGBdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLXRvbGVuZ3RoKS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBzaW5jZSA0LjAuMFxuICAgICAqIEBjYXRlZ29yeSBMYW5nXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBsZW5ndGgsXG4gICAgICogIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pc0xlbmd0aCgzKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzTGVuZ3RoKE51bWJlci5NSU5fVkFMVUUpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmlzTGVuZ3RoKEluZmluaXR5KTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqXG4gICAgICogXy5pc0xlbmd0aCgnMycpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNMZW5ndGgodmFsdWUpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiZcbiAgICAgICAgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UuIEEgdmFsdWUgaXMgY29uc2lkZXJlZCBhcnJheS1saWtlIGlmIGl0J3NcbiAgICAgKiBub3QgYSBmdW5jdGlvbiBhbmQgaGFzIGEgYHZhbHVlLmxlbmd0aGAgdGhhdCdzIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIG9yXG4gICAgICogZXF1YWwgdG8gYDBgIGFuZCBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYE51bWJlci5NQVhfU0FGRV9JTlRFR0VSYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBzaW5jZSA0LjAuMFxuICAgICAqIEBjYXRlZ29yeSBMYW5nXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZSwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzQXJyYXlMaWtlKFsxLCAyLCAzXSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc0FycmF5TGlrZShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzQXJyYXlMaWtlKCdhYmMnKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzQXJyYXlMaWtlKF8ubm9vcCk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc0FycmF5TGlrZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgaXNMZW5ndGgoZ2V0TGVuZ3RoKHZhbHVlKSkgJiYgIWlzRnVuY3Rpb24odmFsdWUpO1xuICAgIH1cblxuICAgIHZhciBpdGVyYXRvclN5bWJvbCA9IHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgU3ltYm9sLml0ZXJhdG9yO1xuXG4gICAgZnVuY3Rpb24gZ2V0SXRlcmF0b3IgKGNvbGwpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yU3ltYm9sICYmIGNvbGxbaXRlcmF0b3JTeW1ib2xdICYmIGNvbGxbaXRlcmF0b3JTeW1ib2xdKCk7XG4gICAgfVxuXG4gICAgLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xuICAgIHZhciBuYXRpdmVHZXRQcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Y7XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBgW1tQcm90b3R5cGVdXWAgb2YgYHZhbHVlYC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gICAgICogQHJldHVybnMge251bGx8T2JqZWN0fSBSZXR1cm5zIHRoZSBgW1tQcm90b3R5cGVdXWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0UHJvdG90eXBlKHZhbHVlKSB7XG4gICAgICByZXR1cm4gbmF0aXZlR2V0UHJvdG90eXBlKE9iamVjdCh2YWx1ZSkpO1xuICAgIH1cblxuICAgIC8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbiAgICB2YXIgb2JqZWN0UHJvdG8kMiA9IE9iamVjdC5wcm90b3R5cGU7XG5cbiAgICAvKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbiAgICB2YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90byQyLmhhc093blByb3BlcnR5O1xuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaGFzYCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZXAgcGF0aHMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAgICAgKiBAcGFyYW0ge0FycmF5fHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGBrZXlgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VIYXMob2JqZWN0LCBrZXkpIHtcbiAgICAgIC8vIEF2b2lkIGEgYnVnIGluIElFIDEwLTExIHdoZXJlIG9iamVjdHMgd2l0aCBhIFtbUHJvdG90eXBlXV0gb2YgYG51bGxgLFxuICAgICAgLy8gdGhhdCBhcmUgY29tcG9zZWQgZW50aXJlbHkgb2YgaW5kZXggcHJvcGVydGllcywgcmV0dXJuIGBmYWxzZWAgZm9yXG4gICAgICAvLyBgaGFzT3duUHJvcGVydHlgIGNoZWNrcyBvZiB0aGVtLlxuICAgICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpIHx8XG4gICAgICAgICh0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmIGtleSBpbiBvYmplY3QgJiYgZ2V0UHJvdG90eXBlKG9iamVjdCkgPT09IG51bGwpO1xuICAgIH1cblxuICAgIC8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbiAgICB2YXIgbmF0aXZlS2V5cyA9IE9iamVjdC5rZXlzO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ua2V5c2Agd2hpY2ggZG9lc24ndCBza2lwIHRoZSBjb25zdHJ1Y3RvclxuICAgICAqIHByb3BlcnR5IG9mIHByb3RvdHlwZXMgb3IgdHJlYXQgc3BhcnNlIGFycmF5cyBhcyBkZW5zZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZUtleXMob2JqZWN0KSB7XG4gICAgICByZXR1cm4gbmF0aXZlS2V5cyhPYmplY3Qob2JqZWN0KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udGltZXNgIHdpdGhvdXQgc3VwcG9ydCBmb3IgaXRlcmF0ZWUgc2hvcnRoYW5kc1xuICAgICAqIG9yIG1heCBhcnJheSBsZW5ndGggY2hlY2tzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbiBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIGludm9rZSBgaXRlcmF0ZWVgLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiByZXN1bHRzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VUaW1lcyhuLCBpdGVyYXRlZSkge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgcmVzdWx0ID0gQXJyYXkobik7XG5cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbikge1xuICAgICAgICByZXN1bHRbaW5kZXhdID0gaXRlcmF0ZWUoaW5kZXgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLmlzQXJyYXlMaWtlYCBleGNlcHQgdGhhdCBpdCBhbHNvIGNoZWNrcyBpZiBgdmFsdWVgXG4gICAgICogaXMgYW4gb2JqZWN0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHNpbmNlIDQuMC4wXG4gICAgICogQGNhdGVnb3J5IExhbmdcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBhcnJheS1saWtlIG9iamVjdCxcbiAgICAgKiAgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzQXJyYXlMaWtlT2JqZWN0KFsxLCAyLCAzXSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc0FycmF5TGlrZU9iamVjdChkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzQXJyYXlMaWtlT2JqZWN0KCdhYmMnKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqXG4gICAgICogXy5pc0FycmF5TGlrZU9iamVjdChfLm5vb3ApO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNBcnJheUxpa2VPYmplY3QodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzQXJyYXlMaWtlKHZhbHVlKTtcbiAgICB9XG5cbiAgICAvKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG4gICAgdmFyIGFyZ3NUYWcgPSAnW29iamVjdCBBcmd1bWVudHNdJztcblxuICAgIC8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbiAgICB2YXIgb2JqZWN0UHJvdG8kMyA9IE9iamVjdC5wcm90b3R5cGU7XG5cbiAgICAvKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbiAgICB2YXIgaGFzT3duUHJvcGVydHkkMSA9IG9iamVjdFByb3RvJDMuaGFzT3duUHJvcGVydHk7XG5cbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICAgICAqIG9mIHZhbHVlcy5cbiAgICAgKi9cbiAgICB2YXIgb2JqZWN0VG9TdHJpbmckMiA9IG9iamVjdFByb3RvJDMudG9TdHJpbmc7XG5cbiAgICAvKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbiAgICB2YXIgcHJvcGVydHlJc0VudW1lcmFibGUgPSBvYmplY3RQcm90byQzLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGFuIGBhcmd1bWVudHNgIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBzaW5jZSAwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMYW5nXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsXG4gICAgICogIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pc0FyZ3VtZW50cyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuICAgICAgLy8gU2FmYXJpIDguMSBpbmNvcnJlY3RseSBtYWtlcyBgYXJndW1lbnRzLmNhbGxlZWAgZW51bWVyYWJsZSBpbiBzdHJpY3QgbW9kZS5cbiAgICAgIHJldHVybiBpc0FycmF5TGlrZU9iamVjdCh2YWx1ZSkgJiYgaGFzT3duUHJvcGVydHkkMS5jYWxsKHZhbHVlLCAnY2FsbGVlJykgJiZcbiAgICAgICAgKCFwcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHZhbHVlLCAnY2FsbGVlJykgfHwgb2JqZWN0VG9TdHJpbmckMi5jYWxsKHZhbHVlKSA9PSBhcmdzVGFnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBBcnJheWAgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHNpbmNlIDAuMS4wXG4gICAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgICAqIEBjYXRlZ29yeSBMYW5nXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsXG4gICAgICogIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc0FycmF5KGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmlzQXJyYXkoJ2FiYycpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmlzQXJyYXkoXy5ub29wKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuICAgIC8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbiAgICB2YXIgc3RyaW5nVGFnID0gJ1tvYmplY3QgU3RyaW5nXSc7XG5cbiAgICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gICAgdmFyIG9iamVjdFByb3RvJDQgPSBPYmplY3QucHJvdG90eXBlO1xuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAgICAgKiBvZiB2YWx1ZXMuXG4gICAgICovXG4gICAgdmFyIG9iamVjdFRvU3RyaW5nJDMgPSBvYmplY3RQcm90byQ0LnRvU3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBTdHJpbmdgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHNpbmNlIDAuMS4wXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgTGFuZ1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLFxuICAgICAqICBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNTdHJpbmcoJ2FiYycpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaXNTdHJpbmcoMSk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc1N0cmluZyh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fFxuICAgICAgICAoIWlzQXJyYXkodmFsdWUpICYmIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgb2JqZWN0VG9TdHJpbmckMy5jYWxsKHZhbHVlKSA9PSBzdHJpbmdUYWcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgaW5kZXgga2V5cyBmb3IgYG9iamVjdGAgdmFsdWVzIG9mIGFycmF5cyxcbiAgICAgKiBgYXJndW1lbnRzYCBvYmplY3RzLCBhbmQgc3RyaW5ncywgb3RoZXJ3aXNlIGBudWxsYCBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgICAqIEByZXR1cm5zIHtBcnJheXxudWxsfSBSZXR1cm5zIGluZGV4IGtleXMsIGVsc2UgYG51bGxgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluZGV4S2V5cyhvYmplY3QpIHtcbiAgICAgIHZhciBsZW5ndGggPSBvYmplY3QgPyBvYmplY3QubGVuZ3RoIDogdW5kZWZpbmVkO1xuICAgICAgaWYgKGlzTGVuZ3RoKGxlbmd0aCkgJiZcbiAgICAgICAgICAoaXNBcnJheShvYmplY3QpIHx8IGlzU3RyaW5nKG9iamVjdCkgfHwgaXNBcmd1bWVudHMob2JqZWN0KSkpIHtcbiAgICAgICAgcmV0dXJuIGJhc2VUaW1lcyhsZW5ndGgsIFN0cmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbiAgICB2YXIgTUFYX1NBRkVfSU5URUdFUiQxID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuICAgIC8qKiBVc2VkIHRvIGRldGVjdCB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcy4gKi9cbiAgICB2YXIgcmVJc1VpbnQgPSAvXig/OjB8WzEtOV1cXGQqKSQvO1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGluZGV4LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD1NQVhfU0FGRV9JTlRFR0VSXSBUaGUgdXBwZXIgYm91bmRzIG9mIGEgdmFsaWQgaW5kZXguXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBpbmRleCwgZWxzZSBgZmFsc2VgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzSW5kZXgodmFsdWUsIGxlbmd0aCkge1xuICAgICAgdmFsdWUgPSAodHlwZW9mIHZhbHVlID09ICdudW1iZXInIHx8IHJlSXNVaW50LnRlc3QodmFsdWUpKSA/ICt2YWx1ZSA6IC0xO1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID09IG51bGwgPyBNQVhfU0FGRV9JTlRFR0VSJDEgOiBsZW5ndGg7XG4gICAgICByZXR1cm4gdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8IGxlbmd0aDtcbiAgICB9XG5cbiAgICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gICAgdmFyIG9iamVjdFByb3RvJDUgPSBPYmplY3QucHJvdG90eXBlO1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGEgcHJvdG90eXBlIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwcm90b3R5cGUsIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc1Byb3RvdHlwZSh2YWx1ZSkge1xuICAgICAgdmFyIEN0b3IgPSB2YWx1ZSAmJiB2YWx1ZS5jb25zdHJ1Y3RvcixcbiAgICAgICAgICBwcm90byA9ICh0eXBlb2YgQ3RvciA9PSAnZnVuY3Rpb24nICYmIEN0b3IucHJvdG90eXBlKSB8fCBvYmplY3RQcm90byQ1O1xuXG4gICAgICByZXR1cm4gdmFsdWUgPT09IHByb3RvO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGBvYmplY3RgLlxuICAgICAqXG4gICAgICogKipOb3RlOioqIE5vbi1vYmplY3QgdmFsdWVzIGFyZSBjb2VyY2VkIHRvIG9iamVjdHMuIFNlZSB0aGVcbiAgICAgKiBbRVMgc3BlY10oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LmtleXMpXG4gICAgICogZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAc2luY2UgMC4xLjBcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogZnVuY3Rpb24gRm9vKCkge1xuICAgICAqICAgdGhpcy5hID0gMTtcbiAgICAgKiAgIHRoaXMuYiA9IDI7XG4gICAgICogfVxuICAgICAqXG4gICAgICogRm9vLnByb3RvdHlwZS5jID0gMztcbiAgICAgKlxuICAgICAqIF8ua2V5cyhuZXcgRm9vKTtcbiAgICAgKiAvLyA9PiBbJ2EnLCAnYiddIChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gICAgICpcbiAgICAgKiBfLmtleXMoJ2hpJyk7XG4gICAgICogLy8gPT4gWycwJywgJzEnXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG4gICAgICB2YXIgaXNQcm90byA9IGlzUHJvdG90eXBlKG9iamVjdCk7XG4gICAgICBpZiAoIShpc1Byb3RvIHx8IGlzQXJyYXlMaWtlKG9iamVjdCkpKSB7XG4gICAgICAgIHJldHVybiBiYXNlS2V5cyhvYmplY3QpO1xuICAgICAgfVxuICAgICAgdmFyIGluZGV4ZXMgPSBpbmRleEtleXMob2JqZWN0KSxcbiAgICAgICAgICBza2lwSW5kZXhlcyA9ICEhaW5kZXhlcyxcbiAgICAgICAgICByZXN1bHQgPSBpbmRleGVzIHx8IFtdLFxuICAgICAgICAgIGxlbmd0aCA9IHJlc3VsdC5sZW5ndGg7XG5cbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKGJhc2VIYXMob2JqZWN0LCBrZXkpICYmXG4gICAgICAgICAgICAhKHNraXBJbmRleGVzICYmIChrZXkgPT0gJ2xlbmd0aCcgfHwgaXNJbmRleChrZXksIGxlbmd0aCkpKSAmJlxuICAgICAgICAgICAgIShpc1Byb3RvICYmIGtleSA9PSAnY29uc3RydWN0b3InKSkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXRlcmF0b3IoY29sbCkge1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB2YXIgbGVuO1xuICAgICAgICBpZiAoaXNBcnJheUxpa2UoY29sbCkpIHtcbiAgICAgICAgICAgIGxlbiA9IGNvbGwubGVuZ3RoO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIHJldHVybiBpIDwgbGVuID8geyB2YWx1ZTogY29sbFtpXSwga2V5OiBpIH0gOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpdGVyYXRlID0gZ2V0SXRlcmF0b3IoY29sbCk7XG4gICAgICAgIGlmIChpdGVyYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IGl0ZXJhdGUubmV4dCgpO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLmRvbmUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogaXRlbS52YWx1ZSwga2V5OiBpIH07XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9rZXlzID0ga2V5cyhjb2xsKTtcbiAgICAgICAgbGVuID0gb2tleXMubGVuZ3RoO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIHZhciBrZXkgPSBva2V5c1tpXTtcbiAgICAgICAgICAgIHJldHVybiBpIDwgbGVuID8geyB2YWx1ZTogY29sbFtrZXldLCBrZXk6IGtleSB9IDogbnVsbDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbmx5T25jZShmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGZuID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayB3YXMgYWxyZWFkeSBjYWxsZWQuXCIpO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZuID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfZWFjaE9mTGltaXQobGltaXQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdGVlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBvbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICAgICAgb2JqID0gb2JqIHx8IFtdO1xuICAgICAgICAgICAgdmFyIG5leHRFbGVtID0gaXRlcmF0b3Iob2JqKTtcbiAgICAgICAgICAgIGlmIChsaW1pdCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBydW5uaW5nID0gMDtcbiAgICAgICAgICAgIHZhciBlcnJvcmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIChmdW5jdGlvbiByZXBsZW5pc2goKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvbmUgJiYgcnVubmluZyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAocnVubmluZyA8IGxpbWl0ICYmICFlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbGVtID0gbmV4dEVsZW0oKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0gPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmcgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZWUoZWxlbS52YWx1ZSwgZWxlbS5rZXksIG9ubHlPbmNlKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBsZW5pc2goKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZG9QYXJhbGxlbExpbWl0KGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBsaW1pdCwgaXRlcmF0ZWUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oX2VhY2hPZkxpbWl0KGxpbWl0KSwgb2JqLCBpdGVyYXRlZSwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9hc3luY01hcChlYWNoZm4sIGFyciwgaXRlcmF0ZWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgYXJyID0gYXJyIHx8IFtdO1xuICAgICAgICB2YXIgcmVzdWx0cyA9IGlzQXJyYXlMaWtlKGFycikgfHwgZ2V0SXRlcmF0b3IoYXJyKSA/IFtdIDoge307XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRlZSh2YWx1ZSwgZnVuY3Rpb24gKGVyciwgdikge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gdjtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBtYXBMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfYXN5bmNNYXApO1xuXG4gICAgZnVuY3Rpb24gZG9MaW1pdChmbiwgbGltaXQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpdGVyYWJsZSwgaXRlcmF0ZWUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oaXRlcmFibGUsIGxpbWl0LCBpdGVyYXRlZSwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBtYXAgPSBkb0xpbWl0KG1hcExpbWl0LCBJbmZpbml0eSk7XG5cbiAgICB2YXIgYXBwbHlFYWNoID0gYXBwbHlFYWNoJDEobWFwKTtcblxuICAgIHZhciBtYXBTZXJpZXMgPSBkb0xpbWl0KG1hcExpbWl0LCAxKTtcblxuICAgIHZhciBhcHBseUVhY2hTZXJpZXMgPSBhcHBseUVhY2gkMShtYXBTZXJpZXMpO1xuXG4gICAgdmFyIGFwcGx5JDEgPSByZXN0KGZ1bmN0aW9uIChmbiwgYXJncykge1xuICAgICAgICByZXR1cm4gcmVzdChmdW5jdGlvbiAoY2FsbEFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChjYWxsQXJncykpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGFzeW5jaWZ5KGZ1bmMpIHtcbiAgICAgICAgcmV0dXJuIGluaXRpYWxQYXJhbXMoZnVuY3Rpb24gKGFyZ3MsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIHJlc3VsdCBpcyBQcm9taXNlIG9iamVjdFxuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KHJlc3VsdCkgJiYgdHlwZW9mIHJlc3VsdC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KVsnY2F0Y2gnXShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyci5tZXNzYWdlID8gZXJyIDogbmV3IEVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uZm9yRWFjaGAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yXG4gICAgICogaXRlcmF0ZWUgc2hvcnRoYW5kcy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBgYXJyYXlgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFycmF5RWFjaChhcnJheSwgaXRlcmF0ZWUpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgaWYgKGl0ZXJhdGVlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBiYXNlIGZ1bmN0aW9uIGZvciBtZXRob2RzIGxpa2UgYF8uZm9ySW5gIGFuZCBgXy5mb3JPd25gLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmcm9tUmlnaHRdIFNwZWNpZnkgaXRlcmF0aW5nIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBiYXNlIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNyZWF0ZUJhc2VGb3IoZnJvbVJpZ2h0KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0LCBpdGVyYXRlZSwga2V5c0Z1bmMpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBpdGVyYWJsZSA9IE9iamVjdChvYmplY3QpLFxuICAgICAgICAgICAgcHJvcHMgPSBrZXlzRnVuYyhvYmplY3QpLFxuICAgICAgICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuXG4gICAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICAgIHZhciBrZXkgPSBwcm9wc1tmcm9tUmlnaHQgPyBsZW5ndGggOiArK2luZGV4XTtcbiAgICAgICAgICBpZiAoaXRlcmF0ZWUoaXRlcmFibGVba2V5XSwga2V5LCBpdGVyYWJsZSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGJhc2VGb3JPd25gIHdoaWNoIGl0ZXJhdGVzIG92ZXIgYG9iamVjdGBcbiAgICAgKiBwcm9wZXJ0aWVzIHJldHVybmVkIGJ5IGBrZXlzRnVuY2AgaW52b2tpbmcgYGl0ZXJhdGVlYCBmb3IgZWFjaCBwcm9wZXJ0eS5cbiAgICAgKiBJdGVyYXRlZSBmdW5jdGlvbnMgbWF5IGV4aXQgaXRlcmF0aW9uIGVhcmx5IGJ5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBrZXlzRnVuYyBUaGUgZnVuY3Rpb24gdG8gZ2V0IHRoZSBrZXlzIG9mIGBvYmplY3RgLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gICAgICovXG4gICAgdmFyIGJhc2VGb3IgPSBjcmVhdGVCYXNlRm9yKCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mb3JPd25gIHdpdGhvdXQgc3VwcG9ydCBmb3IgaXRlcmF0ZWUgc2hvcnRoYW5kcy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZUZvck93bihvYmplY3QsIGl0ZXJhdGVlKSB7XG4gICAgICByZXR1cm4gb2JqZWN0ICYmIGJhc2VGb3Iob2JqZWN0LCBpdGVyYXRlZSwga2V5cyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwga2V5LXZhbHVlIGVudHJpZXMgZnJvbSB0aGUgc3RhY2suXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBuYW1lIGNsZWFyXG4gICAgICogQG1lbWJlck9mIFN0YWNrXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3RhY2tDbGVhcigpIHtcbiAgICAgIHRoaXMuX19kYXRhX18gPSB7ICdhcnJheSc6IFtdLCAnbWFwJzogbnVsbCB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGFcbiAgICAgKiBbYFNhbWVWYWx1ZVplcm9gXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1zYW1ldmFsdWV6ZXJvKVxuICAgICAqIGNvbXBhcmlzb24gYmV0d2VlbiB0d28gdmFsdWVzIHRvIGRldGVybWluZSBpZiB0aGV5IGFyZSBlcXVpdmFsZW50LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHNpbmNlIDQuMC4wXG4gICAgICogQGNhdGVnb3J5IExhbmdcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb21wYXJlLlxuICAgICAqIEBwYXJhbSB7Kn0gb3RoZXIgVGhlIG90aGVyIHZhbHVlIHRvIGNvbXBhcmUuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIG9iamVjdCA9IHsgJ3VzZXInOiAnZnJlZCcgfTtcbiAgICAgKiB2YXIgb3RoZXIgPSB7ICd1c2VyJzogJ2ZyZWQnIH07XG4gICAgICpcbiAgICAgKiBfLmVxKG9iamVjdCwgb2JqZWN0KTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmVxKG9iamVjdCwgb3RoZXIpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmVxKCdhJywgJ2EnKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmVxKCdhJywgT2JqZWN0KCdhJykpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmVxKE5hTiwgTmFOKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZXEodmFsdWUsIG90aGVyKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG90aGVyIHx8ICh2YWx1ZSAhPT0gdmFsdWUgJiYgb3RoZXIgIT09IG90aGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgYGtleWAgaXMgZm91bmQgaW4gYGFycmF5YCBvZiBrZXktdmFsdWUgcGFpcnMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBzZWFyY2guXG4gICAgICogQHBhcmFtIHsqfSBrZXkgVGhlIGtleSB0byBzZWFyY2ggZm9yLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBtYXRjaGVkIHZhbHVlLCBlbHNlIGAtMWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYXNzb2NJbmRleE9mKGFycmF5LCBrZXkpIHtcbiAgICAgIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgaWYgKGVxKGFycmF5W2xlbmd0aF1bMF0sIGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gbGVuZ3RoO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xuICAgIHZhciBhcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlO1xuXG4gICAgLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG4gICAgdmFyIHNwbGljZSA9IGFycmF5UHJvdG8uc3BsaWNlO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBga2V5YCBhbmQgaXRzIHZhbHVlIGZyb20gdGhlIGFzc29jaWF0aXZlIGFycmF5LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gbW9kaWZ5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZW50cnkgd2FzIHJlbW92ZWQsIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhc3NvY0RlbGV0ZShhcnJheSwga2V5KSB7XG4gICAgICB2YXIgaW5kZXggPSBhc3NvY0luZGV4T2YoYXJyYXksIGtleSk7XG4gICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHZhciBsYXN0SW5kZXggPSBhcnJheS5sZW5ndGggLSAxO1xuICAgICAgaWYgKGluZGV4ID09IGxhc3RJbmRleCkge1xuICAgICAgICBhcnJheS5wb3AoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNwbGljZS5jYWxsKGFycmF5LCBpbmRleCwgMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGBrZXlgIGFuZCBpdHMgdmFsdWUgZnJvbSB0aGUgc3RhY2suXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBuYW1lIGRlbGV0ZVxuICAgICAqIEBtZW1iZXJPZiBTdGFja1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZW50cnkgd2FzIHJlbW92ZWQsIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzdGFja0RlbGV0ZShrZXkpIHtcbiAgICAgIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyxcbiAgICAgICAgICBhcnJheSA9IGRhdGEuYXJyYXk7XG5cbiAgICAgIHJldHVybiBhcnJheSA/IGFzc29jRGVsZXRlKGFycmF5LCBrZXkpIDogZGF0YS5tYXBbJ2RlbGV0ZSddKGtleSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgYXNzb2NpYXRpdmUgYXJyYXkgdmFsdWUgZm9yIGBrZXlgLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcXVlcnkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBnZXQuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGVudHJ5IHZhbHVlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFzc29jR2V0KGFycmF5LCBrZXkpIHtcbiAgICAgIHZhciBpbmRleCA9IGFzc29jSW5kZXhPZihhcnJheSwga2V5KTtcbiAgICAgIHJldHVybiBpbmRleCA8IDAgPyB1bmRlZmluZWQgOiBhcnJheVtpbmRleF1bMV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgc3RhY2sgdmFsdWUgZm9yIGBrZXlgLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAbmFtZSBnZXRcbiAgICAgKiBAbWVtYmVyT2YgU3RhY2tcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZW50cnkgdmFsdWUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3RhY2tHZXQoa2V5KSB7XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX19kYXRhX18sXG4gICAgICAgICAgYXJyYXkgPSBkYXRhLmFycmF5O1xuXG4gICAgICByZXR1cm4gYXJyYXkgPyBhc3NvY0dldChhcnJheSwga2V5KSA6IGRhdGEubWFwLmdldChrZXkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBhbiBhc3NvY2lhdGl2ZSBhcnJheSB2YWx1ZSBmb3IgYGtleWAgZXhpc3RzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcXVlcnkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW4gZW50cnkgZm9yIGBrZXlgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFzc29jSGFzKGFycmF5LCBrZXkpIHtcbiAgICAgIHJldHVybiBhc3NvY0luZGV4T2YoYXJyYXksIGtleSkgPiAtMTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYSBzdGFjayB2YWx1ZSBmb3IgYGtleWAgZXhpc3RzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAbmFtZSBoYXNcbiAgICAgKiBAbWVtYmVyT2YgU3RhY2tcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIGVudHJ5IHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3RhY2tIYXMoa2V5KSB7XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX19kYXRhX18sXG4gICAgICAgICAgYXJyYXkgPSBkYXRhLmFycmF5O1xuXG4gICAgICByZXR1cm4gYXJyYXkgPyBhc3NvY0hhcyhhcnJheSwga2V5KSA6IGRhdGEubWFwLmhhcyhrZXkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgaG9zdCBvYmplY3QgaW4gSUUgPCA5LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGhvc3Qgb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNIb3N0T2JqZWN0KHZhbHVlKSB7XG4gICAgICAvLyBNYW55IGhvc3Qgb2JqZWN0cyBhcmUgYE9iamVjdGAgb2JqZWN0cyB0aGF0IGNhbiBjb2VyY2UgdG8gc3RyaW5nc1xuICAgICAgLy8gZGVzcGl0ZSBoYXZpbmcgaW1wcm9wZXJseSBkZWZpbmVkIGB0b1N0cmluZ2AgbWV0aG9kcy5cbiAgICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICAgIGlmICh2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZS50b1N0cmluZyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzdWx0ID0gISEodmFsdWUgKyAnJyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKiBVc2VkIHRvIG1hdGNoIGBSZWdFeHBgIFtzeW50YXggY2hhcmFjdGVyc10oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtcGF0dGVybnMpLiAqL1xuICAgIHZhciByZVJlZ0V4cENoYXIgPSAvW1xcXFxeJC4qKz8oKVtcXF17fXxdL2c7XG5cbiAgICAvKiogVXNlZCB0byBkZXRlY3QgaG9zdCBjb25zdHJ1Y3RvcnMgKFNhZmFyaSkuICovXG4gICAgdmFyIHJlSXNIb3N0Q3RvciA9IC9eXFxbb2JqZWN0IC4rP0NvbnN0cnVjdG9yXFxdJC87XG5cbiAgICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gICAgdmFyIG9iamVjdFByb3RvJDcgPSBPYmplY3QucHJvdG90eXBlO1xuXG4gICAgLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgZGVjb21waWxlZCBzb3VyY2Ugb2YgZnVuY3Rpb25zLiAqL1xuICAgIHZhciBmdW5jVG9TdHJpbmcgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICAvKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbiAgICB2YXIgaGFzT3duUHJvcGVydHkkMiA9IG9iamVjdFByb3RvJDcuaGFzT3duUHJvcGVydHk7XG5cbiAgICAvKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlLiAqL1xuICAgIHZhciByZUlzTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gICAgICBmdW5jVG9TdHJpbmcuY2FsbChoYXNPd25Qcm9wZXJ0eSQyKS5yZXBsYWNlKHJlUmVnRXhwQ2hhciwgJ1xcXFwkJicpXG4gICAgICAucmVwbGFjZSgvaGFzT3duUHJvcGVydHl8KGZ1bmN0aW9uKS4qPyg/PVxcXFxcXCgpfCBmb3IgLis/KD89XFxcXFxcXSkvZywgJyQxLio/JykgKyAnJCdcbiAgICApO1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAc2luY2UgMy4wLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGFuZ1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLFxuICAgICAqICBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNOYXRpdmUoQXJyYXkucHJvdG90eXBlLnB1c2gpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaXNOYXRpdmUoXyk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc05hdGl2ZSh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgIHJldHVybiByZUlzTmF0aXZlLnRlc3QoZnVuY1RvU3RyaW5nLmNhbGwodmFsdWUpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmXG4gICAgICAgIChpc0hvc3RPYmplY3QodmFsdWUpID8gcmVJc05hdGl2ZSA6IHJlSXNIb3N0Q3RvcikudGVzdCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbmF0aXZlIGZ1bmN0aW9uIGF0IGBrZXlgIG9mIGBvYmplY3RgLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBtZXRob2QgdG8gZ2V0LlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmdW5jdGlvbiBpZiBpdCdzIG5hdGl2ZSwgZWxzZSBgdW5kZWZpbmVkYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXROYXRpdmUob2JqZWN0LCBrZXkpIHtcbiAgICAgIHZhciB2YWx1ZSA9IG9iamVjdFtrZXldO1xuICAgICAgcmV0dXJuIGlzTmF0aXZlKHZhbHVlKSA/IHZhbHVlIDogdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHRoYXQgYXJlIHZlcmlmaWVkIHRvIGJlIG5hdGl2ZS4gKi9cbiAgICB2YXIgbmF0aXZlQ3JlYXRlID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2NyZWF0ZScpO1xuXG4gICAgLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xuICAgIHZhciBvYmplY3RQcm90byQ2ID0gT2JqZWN0LnByb3RvdHlwZTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaGFzaCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG5ldyBoYXNoIG9iamVjdC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBIYXNoKCkge31cblxuICAgIC8vIEF2b2lkIGluaGVyaXRpbmcgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAgd2hlbiBwb3NzaWJsZS5cbiAgICBIYXNoLnByb3RvdHlwZSA9IG5hdGl2ZUNyZWF0ZSA/IG5hdGl2ZUNyZWF0ZShudWxsKSA6IG9iamVjdFByb3RvJDY7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGdsb2JhbCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtudWxsfE9iamVjdH0gUmV0dXJucyBgdmFsdWVgIGlmIGl0J3MgYSBnbG9iYWwgb2JqZWN0LCBlbHNlIGBudWxsYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjaGVja0dsb2JhbCh2YWx1ZSkge1xuICAgICAgcmV0dXJuICh2YWx1ZSAmJiB2YWx1ZS5PYmplY3QgPT09IE9iamVjdCkgPyB2YWx1ZSA6IG51bGw7XG4gICAgfVxuXG4gICAgLyoqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHZhbHVlcyBhcmUgb2YgdGhlIGxhbmd1YWdlIHR5cGUgYE9iamVjdGAuICovXG4gICAgdmFyIG9iamVjdFR5cGVzID0ge1xuICAgICAgJ2Z1bmN0aW9uJzogdHJ1ZSxcbiAgICAgICdvYmplY3QnOiB0cnVlXG4gICAgfTtcblxuICAgIC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZXhwb3J0c2AuICovXG4gICAgdmFyIGZyZWVFeHBvcnRzID0gKG9iamVjdFR5cGVzW3R5cGVvZiBleHBvcnRzXSAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlKVxuICAgICAgPyBleHBvcnRzXG4gICAgICA6IHVuZGVmaW5lZDtcblxuICAgIC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgbW9kdWxlYC4gKi9cbiAgICB2YXIgZnJlZU1vZHVsZSA9IChvYmplY3RUeXBlc1t0eXBlb2YgbW9kdWxlXSAmJiBtb2R1bGUgJiYgIW1vZHVsZS5ub2RlVHlwZSlcbiAgICAgID8gbW9kdWxlXG4gICAgICA6IHVuZGVmaW5lZDtcblxuICAgIC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZ2xvYmFsYCBmcm9tIE5vZGUuanMuICovXG4gICAgdmFyIGZyZWVHbG9iYWwgPSBjaGVja0dsb2JhbChmcmVlRXhwb3J0cyAmJiBmcmVlTW9kdWxlICYmIHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsKTtcblxuICAgIC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgc2VsZmAuICovXG4gICAgdmFyIGZyZWVTZWxmID0gY2hlY2tHbG9iYWwob2JqZWN0VHlwZXNbdHlwZW9mIHNlbGZdICYmIHNlbGYpO1xuXG4gICAgLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGB3aW5kb3dgLiAqL1xuICAgIHZhciBmcmVlV2luZG93ID0gY2hlY2tHbG9iYWwob2JqZWN0VHlwZXNbdHlwZW9mIHdpbmRvd10gJiYgd2luZG93KTtcblxuICAgIC8qKiBEZXRlY3QgYHRoaXNgIGFzIHRoZSBnbG9iYWwgb2JqZWN0LiAqL1xuICAgIHZhciB0aGlzR2xvYmFsID0gY2hlY2tHbG9iYWwob2JqZWN0VHlwZXNbdHlwZW9mIHRoaXNdICYmIHRoaXMpO1xuXG4gICAgLyoqXG4gICAgICogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdC5cbiAgICAgKlxuICAgICAqIFRoZSBgdGhpc2AgdmFsdWUgaXMgdXNlZCBpZiBpdCdzIHRoZSBnbG9iYWwgb2JqZWN0IHRvIGF2b2lkIEdyZWFzZW1vbmtleSdzXG4gICAgICogcmVzdHJpY3RlZCBgd2luZG93YCBvYmplY3QsIG90aGVyd2lzZSB0aGUgYHdpbmRvd2Agb2JqZWN0IGlzIHVzZWQuXG4gICAgICovXG4gICAgdmFyIHJvb3QgPSBmcmVlR2xvYmFsIHx8XG4gICAgICAoKGZyZWVXaW5kb3cgIT09ICh0aGlzR2xvYmFsICYmIHRoaXNHbG9iYWwud2luZG93KSkgJiYgZnJlZVdpbmRvdykgfHxcbiAgICAgICAgZnJlZVNlbGYgfHwgdGhpc0dsb2JhbCB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG4gICAgLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgdGhhdCBhcmUgdmVyaWZpZWQgdG8gYmUgbmF0aXZlLiAqL1xuICAgIHZhciBNYXAgPSBnZXROYXRpdmUocm9vdCwgJ01hcCcpO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwga2V5LXZhbHVlIGVudHJpZXMgZnJvbSB0aGUgbWFwLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAbmFtZSBjbGVhclxuICAgICAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG1hcENsZWFyKCkge1xuICAgICAgdGhpcy5fX2RhdGFfXyA9IHtcbiAgICAgICAgJ2hhc2gnOiBuZXcgSGFzaCxcbiAgICAgICAgJ21hcCc6IE1hcCA/IG5ldyBNYXAgOiBbXSxcbiAgICAgICAgJ3N0cmluZyc6IG5ldyBIYXNoXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbiAgICB2YXIgb2JqZWN0UHJvdG8kOCA9IE9iamVjdC5wcm90b3R5cGU7XG5cbiAgICAvKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbiAgICB2YXIgaGFzT3duUHJvcGVydHkkMyA9IG9iamVjdFByb3RvJDguaGFzT3duUHJvcGVydHk7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYSBoYXNoIHZhbHVlIGZvciBga2V5YCBleGlzdHMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBoYXNoIFRoZSBoYXNoIHRvIHF1ZXJ5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZW50cnkgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGFuIGVudHJ5IGZvciBga2V5YCBleGlzdHMsIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBoYXNoSGFzKGhhc2gsIGtleSkge1xuICAgICAgcmV0dXJuIG5hdGl2ZUNyZWF0ZSA/IGhhc2hba2V5XSAhPT0gdW5kZWZpbmVkIDogaGFzT3duUHJvcGVydHkkMy5jYWxsKGhhc2gsIGtleSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBga2V5YCBhbmQgaXRzIHZhbHVlIGZyb20gdGhlIGhhc2guXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBoYXNoIFRoZSBoYXNoIHRvIG1vZGlmeS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHJlbW92ZS5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGVudHJ5IHdhcyByZW1vdmVkLCBlbHNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaGFzaERlbGV0ZShoYXNoLCBrZXkpIHtcbiAgICAgIHJldHVybiBoYXNoSGFzKGhhc2gsIGtleSkgJiYgZGVsZXRlIGhhc2hba2V5XTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSBmb3IgdXNlIGFzIHVuaXF1ZSBvYmplY3Qga2V5LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSwgZWxzZSBgZmFsc2VgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzS2V5YWJsZSh2YWx1ZSkge1xuICAgICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gICAgICByZXR1cm4gdHlwZSA9PSAnbnVtYmVyJyB8fCB0eXBlID09ICdib29sZWFuJyB8fFxuICAgICAgICAodHlwZSA9PSAnc3RyaW5nJyAmJiB2YWx1ZSAhPSAnX19wcm90b19fJykgfHwgdmFsdWUgPT0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGBrZXlgIGFuZCBpdHMgdmFsdWUgZnJvbSB0aGUgbWFwLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAbmFtZSBkZWxldGVcbiAgICAgKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHJlbW92ZS5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGVudHJ5IHdhcyByZW1vdmVkLCBlbHNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWFwRGVsZXRlKGtleSkge1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICAgICAgaWYgKGlzS2V5YWJsZShrZXkpKSB7XG4gICAgICAgIHJldHVybiBoYXNoRGVsZXRlKHR5cGVvZiBrZXkgPT0gJ3N0cmluZycgPyBkYXRhLnN0cmluZyA6IGRhdGEuaGFzaCwga2V5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBNYXAgPyBkYXRhLm1hcFsnZGVsZXRlJ10oa2V5KSA6IGFzc29jRGVsZXRlKGRhdGEubWFwLCBrZXkpO1xuICAgIH1cblxuICAgIC8qKiBVc2VkIHRvIHN0YW5kLWluIGZvciBgdW5kZWZpbmVkYCBoYXNoIHZhbHVlcy4gKi9cbiAgICB2YXIgSEFTSF9VTkRFRklORUQgPSAnX19sb2Rhc2hfaGFzaF91bmRlZmluZWRfXyc7XG5cbiAgICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gICAgdmFyIG9iamVjdFByb3RvJDkgPSBPYmplY3QucHJvdG90eXBlO1xuXG4gICAgLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG4gICAgdmFyIGhhc093blByb3BlcnR5JDQgPSBvYmplY3RQcm90byQ5Lmhhc093blByb3BlcnR5O1xuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgaGFzaCB2YWx1ZSBmb3IgYGtleWAuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBoYXNoIFRoZSBoYXNoIHRvIHF1ZXJ5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gZ2V0LlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBoYXNoR2V0KGhhc2gsIGtleSkge1xuICAgICAgaWYgKG5hdGl2ZUNyZWF0ZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gaGFzaFtrZXldO1xuICAgICAgICByZXR1cm4gcmVzdWx0ID09PSBIQVNIX1VOREVGSU5FRCA/IHVuZGVmaW5lZCA6IHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eSQ0LmNhbGwoaGFzaCwga2V5KSA/IGhhc2hba2V5XSA6IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBtYXAgdmFsdWUgZm9yIGBrZXlgLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAbmFtZSBnZXRcbiAgICAgKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZW50cnkgdmFsdWUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWFwR2V0KGtleSkge1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICAgICAgaWYgKGlzS2V5YWJsZShrZXkpKSB7XG4gICAgICAgIHJldHVybiBoYXNoR2V0KHR5cGVvZiBrZXkgPT0gJ3N0cmluZycgPyBkYXRhLnN0cmluZyA6IGRhdGEuaGFzaCwga2V5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBNYXAgPyBkYXRhLm1hcC5nZXQoa2V5KSA6IGFzc29jR2V0KGRhdGEubWFwLCBrZXkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBhIG1hcCB2YWx1ZSBmb3IgYGtleWAgZXhpc3RzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAbmFtZSBoYXNcbiAgICAgKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIGVudHJ5IHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWFwSGFzKGtleSkge1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICAgICAgaWYgKGlzS2V5YWJsZShrZXkpKSB7XG4gICAgICAgIHJldHVybiBoYXNoSGFzKHR5cGVvZiBrZXkgPT0gJ3N0cmluZycgPyBkYXRhLnN0cmluZyA6IGRhdGEuaGFzaCwga2V5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBNYXAgPyBkYXRhLm1hcC5oYXMoa2V5KSA6IGFzc29jSGFzKGRhdGEubWFwLCBrZXkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGFzc29jaWF0aXZlIGFycmF5IGBrZXlgIHRvIGB2YWx1ZWAuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBtb2RpZnkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFzc29jU2V0KGFycmF5LCBrZXksIHZhbHVlKSB7XG4gICAgICB2YXIgaW5kZXggPSBhc3NvY0luZGV4T2YoYXJyYXksIGtleSk7XG4gICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgIGFycmF5LnB1c2goW2tleSwgdmFsdWVdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFycmF5W2luZGV4XVsxXSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBVc2VkIHRvIHN0YW5kLWluIGZvciBgdW5kZWZpbmVkYCBoYXNoIHZhbHVlcy4gKi9cbiAgICB2YXIgSEFTSF9VTkRFRklORUQkMSA9ICdfX2xvZGFzaF9oYXNoX3VuZGVmaW5lZF9fJztcblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGhhc2ggYGtleWAgdG8gYHZhbHVlYC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGhhc2ggVGhlIGhhc2ggdG8gbW9kaWZ5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gc2V0LlxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBoYXNoU2V0KGhhc2gsIGtleSwgdmFsdWUpIHtcbiAgICAgIGhhc2hba2V5XSA9IChuYXRpdmVDcmVhdGUgJiYgdmFsdWUgPT09IHVuZGVmaW5lZCkgPyBIQVNIX1VOREVGSU5FRCQxIDogdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgbWFwIGBrZXlgIHRvIGB2YWx1ZWAuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBuYW1lIHNldFxuICAgICAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gc2V0LlxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBtYXAgY2FjaGUgaW5zdGFuY2UuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWFwU2V0KGtleSwgdmFsdWUpIHtcbiAgICAgIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXztcbiAgICAgIGlmIChpc0tleWFibGUoa2V5KSkge1xuICAgICAgICBoYXNoU2V0KHR5cGVvZiBrZXkgPT0gJ3N0cmluZycgPyBkYXRhLnN0cmluZyA6IGRhdGEuaGFzaCwga2V5LCB2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKE1hcCkge1xuICAgICAgICBkYXRhLm1hcC5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhc3NvY1NldChkYXRhLm1hcCwga2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbWFwIGNhY2hlIG9iamVjdCB0byBzdG9yZSBrZXktdmFsdWUgcGFpcnMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFt2YWx1ZXNdIFRoZSB2YWx1ZXMgdG8gY2FjaGUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gTWFwQ2FjaGUodmFsdWVzKSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSB2YWx1ZXMgPyB2YWx1ZXMubGVuZ3RoIDogMDtcblxuICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gdmFsdWVzW2luZGV4XTtcbiAgICAgICAgdGhpcy5zZXQoZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBZGQgbWV0aG9kcyB0byBgTWFwQ2FjaGVgLlxuICAgIE1hcENhY2hlLnByb3RvdHlwZS5jbGVhciA9IG1hcENsZWFyO1xuICAgIE1hcENhY2hlLnByb3RvdHlwZVsnZGVsZXRlJ10gPSBtYXBEZWxldGU7XG4gICAgTWFwQ2FjaGUucHJvdG90eXBlLmdldCA9IG1hcEdldDtcbiAgICBNYXBDYWNoZS5wcm90b3R5cGUuaGFzID0gbWFwSGFzO1xuICAgIE1hcENhY2hlLnByb3RvdHlwZS5zZXQgPSBtYXBTZXQ7XG5cbiAgICAvKiogVXNlZCBhcyB0aGUgc2l6ZSB0byBlbmFibGUgbGFyZ2UgYXJyYXkgb3B0aW1pemF0aW9ucy4gKi9cbiAgICB2YXIgTEFSR0VfQVJSQVlfU0laRSA9IDIwMDtcblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHN0YWNrIGBrZXlgIHRvIGB2YWx1ZWAuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBuYW1lIHNldFxuICAgICAqIEBtZW1iZXJPZiBTdGFja1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gc2V0LlxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBzdGFjayBjYWNoZSBpbnN0YW5jZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzdGFja1NldChrZXksIHZhbHVlKSB7XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX19kYXRhX18sXG4gICAgICAgICAgYXJyYXkgPSBkYXRhLmFycmF5O1xuXG4gICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgaWYgKGFycmF5Lmxlbmd0aCA8IChMQVJHRV9BUlJBWV9TSVpFIC0gMSkpIHtcbiAgICAgICAgICBhc3NvY1NldChhcnJheSwga2V5LCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGF0YS5hcnJheSA9IG51bGw7XG4gICAgICAgICAgZGF0YS5tYXAgPSBuZXcgTWFwQ2FjaGUoYXJyYXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgbWFwID0gZGF0YS5tYXA7XG4gICAgICBpZiAobWFwKSB7XG4gICAgICAgIG1hcC5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgc3RhY2sgY2FjaGUgb2JqZWN0IHRvIHN0b3JlIGtleS12YWx1ZSBwYWlycy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gW3ZhbHVlc10gVGhlIHZhbHVlcyB0byBjYWNoZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBTdGFjayh2YWx1ZXMpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IHZhbHVlcyA/IHZhbHVlcy5sZW5ndGggOiAwO1xuXG4gICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICB2YXIgZW50cnkgPSB2YWx1ZXNbaW5kZXhdO1xuICAgICAgICB0aGlzLnNldChlbnRyeVswXSwgZW50cnlbMV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFkZCBtZXRob2RzIHRvIGBTdGFja2AuXG4gICAgU3RhY2sucHJvdG90eXBlLmNsZWFyID0gc3RhY2tDbGVhcjtcbiAgICBTdGFjay5wcm90b3R5cGVbJ2RlbGV0ZSddID0gc3RhY2tEZWxldGU7XG4gICAgU3RhY2sucHJvdG90eXBlLmdldCA9IHN0YWNrR2V0O1xuICAgIFN0YWNrLnByb3RvdHlwZS5oYXMgPSBzdGFja0hhcztcbiAgICBTdGFjay5wcm90b3R5cGUuc2V0ID0gc3RhY2tTZXQ7XG5cbiAgICAvKipcbiAgICAgKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uc29tZWAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yIGl0ZXJhdGVlXG4gICAgICogc2hvcnRoYW5kcy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW55IGVsZW1lbnQgcGFzc2VzIHRoZSBwcmVkaWNhdGUgY2hlY2ssXG4gICAgICogIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhcnJheVNvbWUoYXJyYXksIHByZWRpY2F0ZSkge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICBpZiAocHJlZGljYXRlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIFVOT1JERVJFRF9DT01QQVJFX0ZMQUckMSA9IDE7XG4gICAgdmFyIFBBUlRJQUxfQ09NUEFSRV9GTEFHJDIgPSAyO1xuICAgIC8qKlxuICAgICAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUlzRXF1YWxEZWVwYCBmb3IgYXJyYXlzIHdpdGggc3VwcG9ydCBmb3JcbiAgICAgKiBwYXJ0aWFsIGRlZXAgY29tcGFyaXNvbnMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBjb21wYXJlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IG90aGVyIFRoZSBvdGhlciBhcnJheSB0byBjb21wYXJlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGVxdWFsRnVuYyBUaGUgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIGVxdWl2YWxlbnRzIG9mIHZhbHVlcy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjdXN0b21pemVyIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaXNvbnMuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJpdG1hc2sgVGhlIGJpdG1hc2sgb2YgY29tcGFyaXNvbiBmbGFncy4gU2VlIGBiYXNlSXNFcXVhbGBcbiAgICAgKiAgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3RhY2sgVHJhY2tzIHRyYXZlcnNlZCBgYXJyYXlgIGFuZCBgb3RoZXJgIG9iamVjdHMuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBhcnJheXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlcXVhbEFycmF5cyhhcnJheSwgb3RoZXIsIGVxdWFsRnVuYywgY3VzdG9taXplciwgYml0bWFzaywgc3RhY2spIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGlzUGFydGlhbCA9IGJpdG1hc2sgJiBQQVJUSUFMX0NPTVBBUkVfRkxBRyQyLFxuICAgICAgICAgIGlzVW5vcmRlcmVkID0gYml0bWFzayAmIFVOT1JERVJFRF9DT01QQVJFX0ZMQUckMSxcbiAgICAgICAgICBhcnJMZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICAgICAgb3RoTGVuZ3RoID0gb3RoZXIubGVuZ3RoO1xuXG4gICAgICBpZiAoYXJyTGVuZ3RoICE9IG90aExlbmd0aCAmJiAhKGlzUGFydGlhbCAmJiBvdGhMZW5ndGggPiBhcnJMZW5ndGgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIEFzc3VtZSBjeWNsaWMgdmFsdWVzIGFyZSBlcXVhbC5cbiAgICAgIHZhciBzdGFja2VkID0gc3RhY2suZ2V0KGFycmF5KTtcbiAgICAgIGlmIChzdGFja2VkKSB7XG4gICAgICAgIHJldHVybiBzdGFja2VkID09IG90aGVyO1xuICAgICAgfVxuICAgICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgICBzdGFjay5zZXQoYXJyYXksIG90aGVyKTtcblxuICAgICAgLy8gSWdub3JlIG5vbi1pbmRleCBwcm9wZXJ0aWVzLlxuICAgICAgd2hpbGUgKCsraW5kZXggPCBhcnJMZW5ndGgpIHtcbiAgICAgICAgdmFyIGFyclZhbHVlID0gYXJyYXlbaW5kZXhdLFxuICAgICAgICAgICAgb3RoVmFsdWUgPSBvdGhlcltpbmRleF07XG5cbiAgICAgICAgaWYgKGN1c3RvbWl6ZXIpIHtcbiAgICAgICAgICB2YXIgY29tcGFyZWQgPSBpc1BhcnRpYWxcbiAgICAgICAgICAgID8gY3VzdG9taXplcihvdGhWYWx1ZSwgYXJyVmFsdWUsIGluZGV4LCBvdGhlciwgYXJyYXksIHN0YWNrKVxuICAgICAgICAgICAgOiBjdXN0b21pemVyKGFyclZhbHVlLCBvdGhWYWx1ZSwgaW5kZXgsIGFycmF5LCBvdGhlciwgc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb21wYXJlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKGNvbXBhcmVkKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBhcnJheXMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKS5cbiAgICAgICAgaWYgKGlzVW5vcmRlcmVkKSB7XG4gICAgICAgICAgaWYgKCFhcnJheVNvbWUob3RoZXIsIGZ1bmN0aW9uKG90aFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyclZhbHVlID09PSBvdGhWYWx1ZSB8fFxuICAgICAgICAgICAgICAgICAgZXF1YWxGdW5jKGFyclZhbHVlLCBvdGhWYWx1ZSwgY3VzdG9taXplciwgYml0bWFzaywgc3RhY2spO1xuICAgICAgICAgICAgICB9KSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIShcbiAgICAgICAgICAgICAgYXJyVmFsdWUgPT09IG90aFZhbHVlIHx8XG4gICAgICAgICAgICAgICAgZXF1YWxGdW5jKGFyclZhbHVlLCBvdGhWYWx1ZSwgY3VzdG9taXplciwgYml0bWFzaywgc3RhY2spXG4gICAgICAgICAgICApKSB7XG4gICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHN0YWNrWydkZWxldGUnXShhcnJheSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xuICAgIHZhciBTeW1ib2wkMSA9IHJvb3QuU3ltYm9sO1xuXG4gICAgLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG4gICAgdmFyIFVpbnQ4QXJyYXkgPSByb290LlVpbnQ4QXJyYXk7XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBgbWFwYCB0byBhbiBhcnJheS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG1hcCBUaGUgbWFwIHRvIGNvbnZlcnQuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgYXJyYXkuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWFwVG9BcnJheShtYXApIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIHJlc3VsdCA9IEFycmF5KG1hcC5zaXplKTtcblxuICAgICAgbWFwLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICByZXN1bHRbKytpbmRleF0gPSBba2V5LCB2YWx1ZV07XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydHMgYHNldGAgdG8gYW4gYXJyYXkuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzZXQgVGhlIHNldCB0byBjb252ZXJ0LlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY29udmVydGVkIGFycmF5LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNldFRvQXJyYXkoc2V0KSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICByZXN1bHQgPSBBcnJheShzZXQuc2l6ZSk7XG5cbiAgICAgIHNldC5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJlc3VsdFsrK2luZGV4XSA9IHZhbHVlO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHZhciBVTk9SREVSRURfQ09NUEFSRV9GTEFHJDIgPSAxO1xuICAgIHZhciBQQVJUSUFMX0NPTVBBUkVfRkxBRyQzID0gMjtcbiAgICB2YXIgYm9vbFRhZyA9ICdbb2JqZWN0IEJvb2xlYW5dJztcbiAgICB2YXIgZGF0ZVRhZyA9ICdbb2JqZWN0IERhdGVdJztcbiAgICB2YXIgZXJyb3JUYWcgPSAnW29iamVjdCBFcnJvcl0nO1xuICAgIHZhciBtYXBUYWcgPSAnW29iamVjdCBNYXBdJztcbiAgICB2YXIgbnVtYmVyVGFnID0gJ1tvYmplY3QgTnVtYmVyXSc7XG4gICAgdmFyIHJlZ2V4cFRhZyA9ICdbb2JqZWN0IFJlZ0V4cF0nO1xuICAgIHZhciBzZXRUYWcgPSAnW29iamVjdCBTZXRdJztcbiAgICB2YXIgc3RyaW5nVGFnJDEgPSAnW29iamVjdCBTdHJpbmddJztcbiAgICB2YXIgc3ltYm9sVGFnJDEgPSAnW29iamVjdCBTeW1ib2xdJztcbiAgICB2YXIgYXJyYXlCdWZmZXJUYWcgPSAnW29iamVjdCBBcnJheUJ1ZmZlcl0nO1xuICAgIHZhciBkYXRhVmlld1RhZyA9ICdbb2JqZWN0IERhdGFWaWV3XSc7XG4gICAgdmFyIHN5bWJvbFByb3RvID0gU3ltYm9sJDEgPyBTeW1ib2wkMS5wcm90b3R5cGUgOiB1bmRlZmluZWQ7XG4gICAgdmFyIHN5bWJvbFZhbHVlT2YgPSBzeW1ib2xQcm90byA/IHN5bWJvbFByb3RvLnZhbHVlT2YgOiB1bmRlZmluZWQ7XG4gICAgLyoqXG4gICAgICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbERlZXBgIGZvciBjb21wYXJpbmcgb2JqZWN0cyBvZlxuICAgICAqIHRoZSBzYW1lIGB0b1N0cmluZ1RhZ2AuXG4gICAgICpcbiAgICAgKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBvbmx5IHN1cHBvcnRzIGNvbXBhcmluZyB2YWx1ZXMgd2l0aCB0YWdzIG9mXG4gICAgICogYEJvb2xlYW5gLCBgRGF0ZWAsIGBFcnJvcmAsIGBOdW1iZXJgLCBgUmVnRXhwYCwgb3IgYFN0cmluZ2AuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBjb21wYXJlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdGhlciBUaGUgb3RoZXIgb2JqZWN0IHRvIGNvbXBhcmUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgYHRvU3RyaW5nVGFnYCBvZiB0aGUgb2JqZWN0cyB0byBjb21wYXJlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGVxdWFsRnVuYyBUaGUgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIGVxdWl2YWxlbnRzIG9mIHZhbHVlcy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjdXN0b21pemVyIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaXNvbnMuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJpdG1hc2sgVGhlIGJpdG1hc2sgb2YgY29tcGFyaXNvbiBmbGFncy4gU2VlIGBiYXNlSXNFcXVhbGBcbiAgICAgKiAgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3RhY2sgVHJhY2tzIHRyYXZlcnNlZCBgb2JqZWN0YCBhbmQgYG90aGVyYCBvYmplY3RzLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVxdWFsQnlUYWcob2JqZWN0LCBvdGhlciwgdGFnLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGJpdG1hc2ssIHN0YWNrKSB7XG4gICAgICBzd2l0Y2ggKHRhZykge1xuICAgICAgICBjYXNlIGRhdGFWaWV3VGFnOlxuICAgICAgICAgIGlmICgob2JqZWN0LmJ5dGVMZW5ndGggIT0gb3RoZXIuYnl0ZUxlbmd0aCkgfHxcbiAgICAgICAgICAgICAgKG9iamVjdC5ieXRlT2Zmc2V0ICE9IG90aGVyLmJ5dGVPZmZzZXQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIG9iamVjdCA9IG9iamVjdC5idWZmZXI7XG4gICAgICAgICAgb3RoZXIgPSBvdGhlci5idWZmZXI7XG5cbiAgICAgICAgY2FzZSBhcnJheUJ1ZmZlclRhZzpcbiAgICAgICAgICBpZiAoKG9iamVjdC5ieXRlTGVuZ3RoICE9IG90aGVyLmJ5dGVMZW5ndGgpIHx8XG4gICAgICAgICAgICAgICFlcXVhbEZ1bmMobmV3IFVpbnQ4QXJyYXkob2JqZWN0KSwgbmV3IFVpbnQ4QXJyYXkob3RoZXIpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBjYXNlIGJvb2xUYWc6XG4gICAgICAgIGNhc2UgZGF0ZVRhZzpcbiAgICAgICAgICAvLyBDb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWJlcnMsIGRhdGVzIHRvIG1pbGxpc2Vjb25kcyBhbmRcbiAgICAgICAgICAvLyBib29sZWFucyB0byBgMWAgb3IgYDBgIHRyZWF0aW5nIGludmFsaWQgZGF0ZXMgY29lcmNlZCB0byBgTmFOYCBhc1xuICAgICAgICAgIC8vIG5vdCBlcXVhbC5cbiAgICAgICAgICByZXR1cm4gK29iamVjdCA9PSArb3RoZXI7XG5cbiAgICAgICAgY2FzZSBlcnJvclRhZzpcbiAgICAgICAgICByZXR1cm4gb2JqZWN0Lm5hbWUgPT0gb3RoZXIubmFtZSAmJiBvYmplY3QubWVzc2FnZSA9PSBvdGhlci5tZXNzYWdlO1xuXG4gICAgICAgIGNhc2UgbnVtYmVyVGFnOlxuICAgICAgICAgIC8vIFRyZWF0IGBOYU5gIHZzLiBgTmFOYCBhcyBlcXVhbC5cbiAgICAgICAgICByZXR1cm4gKG9iamVjdCAhPSArb2JqZWN0KSA/IG90aGVyICE9ICtvdGhlciA6IG9iamVjdCA9PSArb3RoZXI7XG5cbiAgICAgICAgY2FzZSByZWdleHBUYWc6XG4gICAgICAgIGNhc2Ugc3RyaW5nVGFnJDE6XG4gICAgICAgICAgLy8gQ29lcmNlIHJlZ2V4ZXMgdG8gc3RyaW5ncyBhbmQgdHJlYXQgc3RyaW5ncywgcHJpbWl0aXZlcyBhbmQgb2JqZWN0cyxcbiAgICAgICAgICAvLyBhcyBlcXVhbC4gU2VlIGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDE1LjEwLjYuNCBmb3IgbW9yZSBkZXRhaWxzLlxuICAgICAgICAgIHJldHVybiBvYmplY3QgPT0gKG90aGVyICsgJycpO1xuXG4gICAgICAgIGNhc2UgbWFwVGFnOlxuICAgICAgICAgIHZhciBjb252ZXJ0ID0gbWFwVG9BcnJheTtcblxuICAgICAgICBjYXNlIHNldFRhZzpcbiAgICAgICAgICB2YXIgaXNQYXJ0aWFsID0gYml0bWFzayAmIFBBUlRJQUxfQ09NUEFSRV9GTEFHJDM7XG4gICAgICAgICAgY29udmVydCB8fCAoY29udmVydCA9IHNldFRvQXJyYXkpO1xuXG4gICAgICAgICAgaWYgKG9iamVjdC5zaXplICE9IG90aGVyLnNpemUgJiYgIWlzUGFydGlhbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBBc3N1bWUgY3ljbGljIHZhbHVlcyBhcmUgZXF1YWwuXG4gICAgICAgICAgdmFyIHN0YWNrZWQgPSBzdGFjay5nZXQob2JqZWN0KTtcbiAgICAgICAgICBpZiAoc3RhY2tlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHN0YWNrZWQgPT0gb3RoZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJpdG1hc2sgfD0gVU5PUkRFUkVEX0NPTVBBUkVfRkxBRyQyO1xuICAgICAgICAgIHN0YWNrLnNldChvYmplY3QsIG90aGVyKTtcblxuICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgICAgICAgIHJldHVybiBlcXVhbEFycmF5cyhjb252ZXJ0KG9iamVjdCksIGNvbnZlcnQob3RoZXIpLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGJpdG1hc2ssIHN0YWNrKTtcblxuICAgICAgICBjYXNlIHN5bWJvbFRhZyQxOlxuICAgICAgICAgIGlmIChzeW1ib2xWYWx1ZU9mKSB7XG4gICAgICAgICAgICByZXR1cm4gc3ltYm9sVmFsdWVPZi5jYWxsKG9iamVjdCkgPT0gc3ltYm9sVmFsdWVPZi5jYWxsKG90aGVyKTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqIFVzZWQgdG8gY29tcG9zZSBiaXRtYXNrcyBmb3IgY29tcGFyaXNvbiBzdHlsZXMuICovXG4gICAgdmFyIFBBUlRJQUxfQ09NUEFSRV9GTEFHJDQgPSAyO1xuXG4gICAgLyoqXG4gICAgICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbERlZXBgIGZvciBvYmplY3RzIHdpdGggc3VwcG9ydCBmb3JcbiAgICAgKiBwYXJ0aWFsIGRlZXAgY29tcGFyaXNvbnMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBjb21wYXJlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdGhlciBUaGUgb3RoZXIgb2JqZWN0IHRvIGNvbXBhcmUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZXF1YWxGdW5jIFRoZSBmdW5jdGlvbiB0byBkZXRlcm1pbmUgZXF1aXZhbGVudHMgb2YgdmFsdWVzLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGN1c3RvbWl6ZXIgVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpc29ucy5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYml0bWFzayBUaGUgYml0bWFzayBvZiBjb21wYXJpc29uIGZsYWdzLiBTZWUgYGJhc2VJc0VxdWFsYFxuICAgICAqICBmb3IgbW9yZSBkZXRhaWxzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzdGFjayBUcmFja3MgdHJhdmVyc2VkIGBvYmplY3RgIGFuZCBgb3RoZXJgIG9iamVjdHMuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBvYmplY3RzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZXF1YWxPYmplY3RzKG9iamVjdCwgb3RoZXIsIGVxdWFsRnVuYywgY3VzdG9taXplciwgYml0bWFzaywgc3RhY2spIHtcbiAgICAgIHZhciBpc1BhcnRpYWwgPSBiaXRtYXNrICYgUEFSVElBTF9DT01QQVJFX0ZMQUckNCxcbiAgICAgICAgICBvYmpQcm9wcyA9IGtleXMob2JqZWN0KSxcbiAgICAgICAgICBvYmpMZW5ndGggPSBvYmpQcm9wcy5sZW5ndGgsXG4gICAgICAgICAgb3RoUHJvcHMgPSBrZXlzKG90aGVyKSxcbiAgICAgICAgICBvdGhMZW5ndGggPSBvdGhQcm9wcy5sZW5ndGg7XG5cbiAgICAgIGlmIChvYmpMZW5ndGggIT0gb3RoTGVuZ3RoICYmICFpc1BhcnRpYWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdmFyIGluZGV4ID0gb2JqTGVuZ3RoO1xuICAgICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgICAgdmFyIGtleSA9IG9ialByb3BzW2luZGV4XTtcbiAgICAgICAgaWYgKCEoaXNQYXJ0aWFsID8ga2V5IGluIG90aGVyIDogYmFzZUhhcyhvdGhlciwga2V5KSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIEFzc3VtZSBjeWNsaWMgdmFsdWVzIGFyZSBlcXVhbC5cbiAgICAgIHZhciBzdGFja2VkID0gc3RhY2suZ2V0KG9iamVjdCk7XG4gICAgICBpZiAoc3RhY2tlZCkge1xuICAgICAgICByZXR1cm4gc3RhY2tlZCA9PSBvdGhlcjtcbiAgICAgIH1cbiAgICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgICAgc3RhY2suc2V0KG9iamVjdCwgb3RoZXIpO1xuXG4gICAgICB2YXIgc2tpcEN0b3IgPSBpc1BhcnRpYWw7XG4gICAgICB3aGlsZSAoKytpbmRleCA8IG9iakxlbmd0aCkge1xuICAgICAgICBrZXkgPSBvYmpQcm9wc1tpbmRleF07XG4gICAgICAgIHZhciBvYmpWYWx1ZSA9IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgb3RoVmFsdWUgPSBvdGhlcltrZXldO1xuXG4gICAgICAgIGlmIChjdXN0b21pemVyKSB7XG4gICAgICAgICAgdmFyIGNvbXBhcmVkID0gaXNQYXJ0aWFsXG4gICAgICAgICAgICA/IGN1c3RvbWl6ZXIob3RoVmFsdWUsIG9ialZhbHVlLCBrZXksIG90aGVyLCBvYmplY3QsIHN0YWNrKVxuICAgICAgICAgICAgOiBjdXN0b21pemVyKG9ialZhbHVlLCBvdGhWYWx1ZSwga2V5LCBvYmplY3QsIG90aGVyLCBzdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgICAgIGlmICghKGNvbXBhcmVkID09PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgPyAob2JqVmFsdWUgPT09IG90aFZhbHVlIHx8IGVxdWFsRnVuYyhvYmpWYWx1ZSwgb3RoVmFsdWUsIGN1c3RvbWl6ZXIsIGJpdG1hc2ssIHN0YWNrKSlcbiAgICAgICAgICAgICAgOiBjb21wYXJlZFxuICAgICAgICAgICAgKSkge1xuICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHNraXBDdG9yIHx8IChza2lwQ3RvciA9IGtleSA9PSAnY29uc3RydWN0b3InKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXN1bHQgJiYgIXNraXBDdG9yKSB7XG4gICAgICAgIHZhciBvYmpDdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yLFxuICAgICAgICAgICAgb3RoQ3RvciA9IG90aGVyLmNvbnN0cnVjdG9yO1xuXG4gICAgICAgIC8vIE5vbiBgT2JqZWN0YCBvYmplY3QgaW5zdGFuY2VzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWFsLlxuICAgICAgICBpZiAob2JqQ3RvciAhPSBvdGhDdG9yICYmXG4gICAgICAgICAgICAoJ2NvbnN0cnVjdG9yJyBpbiBvYmplY3QgJiYgJ2NvbnN0cnVjdG9yJyBpbiBvdGhlcikgJiZcbiAgICAgICAgICAgICEodHlwZW9mIG9iakN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBvYmpDdG9yIGluc3RhbmNlb2Ygb2JqQ3RvciAmJlxuICAgICAgICAgICAgICB0eXBlb2Ygb3RoQ3RvciA9PSAnZnVuY3Rpb24nICYmIG90aEN0b3IgaW5zdGFuY2VvZiBvdGhDdG9yKSkge1xuICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGFja1snZGVsZXRlJ10ob2JqZWN0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgdGhhdCBhcmUgdmVyaWZpZWQgdG8gYmUgbmF0aXZlLiAqL1xuICAgIHZhciBEYXRhVmlldyA9IGdldE5hdGl2ZShyb290LCAnRGF0YVZpZXcnKTtcblxuICAgIC8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHRoYXQgYXJlIHZlcmlmaWVkIHRvIGJlIG5hdGl2ZS4gKi9cbiAgICB2YXIgUHJvbWlzZSA9IGdldE5hdGl2ZShyb290LCAnUHJvbWlzZScpO1xuXG4gICAgLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgdGhhdCBhcmUgdmVyaWZpZWQgdG8gYmUgbmF0aXZlLiAqL1xuICAgIHZhciBTZXQgPSBnZXROYXRpdmUocm9vdCwgJ1NldCcpO1xuXG4gICAgLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgdGhhdCBhcmUgdmVyaWZpZWQgdG8gYmUgbmF0aXZlLiAqL1xuICAgIHZhciBXZWFrTWFwID0gZ2V0TmF0aXZlKHJvb3QsICdXZWFrTWFwJyk7XG5cbiAgICB2YXIgbWFwVGFnJDEgPSAnW29iamVjdCBNYXBdJztcbiAgICB2YXIgb2JqZWN0VGFnJDEgPSAnW29iamVjdCBPYmplY3RdJztcbiAgICB2YXIgcHJvbWlzZVRhZyA9ICdbb2JqZWN0IFByb21pc2VdJztcbiAgICB2YXIgc2V0VGFnJDEgPSAnW29iamVjdCBTZXRdJztcbiAgICB2YXIgd2Vha01hcFRhZyA9ICdbb2JqZWN0IFdlYWtNYXBdJztcbiAgICB2YXIgZGF0YVZpZXdUYWckMSA9ICdbb2JqZWN0IERhdGFWaWV3XSc7XG5cbiAgICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gICAgdmFyIG9iamVjdFByb3RvJDExID0gT2JqZWN0LnByb3RvdHlwZTtcblxuICAgIC8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGRlY29tcGlsZWQgc291cmNlIG9mIGZ1bmN0aW9ucy4gKi9cbiAgICB2YXIgZnVuY1RvU3RyaW5nJDEgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICAgICAqIG9mIHZhbHVlcy5cbiAgICAgKi9cbiAgICB2YXIgb2JqZWN0VG9TdHJpbmckNCA9IG9iamVjdFByb3RvJDExLnRvU3RyaW5nO1xuXG4gICAgLyoqIFVzZWQgdG8gZGV0ZWN0IG1hcHMsIHNldHMsIGFuZCB3ZWFrbWFwcy4gKi9cbiAgICB2YXIgZGF0YVZpZXdDdG9yU3RyaW5nID0gRGF0YVZpZXcgPyAoRGF0YVZpZXcgKyAnJykgOiAnJztcbiAgICB2YXIgbWFwQ3RvclN0cmluZyA9IE1hcCA/IGZ1bmNUb1N0cmluZyQxLmNhbGwoTWFwKSA6ICcnO1xuICAgIHZhciBwcm9taXNlQ3RvclN0cmluZyA9IFByb21pc2UgPyBmdW5jVG9TdHJpbmckMS5jYWxsKFByb21pc2UpIDogJyc7XG4gICAgdmFyIHNldEN0b3JTdHJpbmcgPSBTZXQgPyBmdW5jVG9TdHJpbmckMS5jYWxsKFNldCkgOiAnJztcbiAgICB2YXIgd2Vha01hcEN0b3JTdHJpbmcgPSBXZWFrTWFwID8gZnVuY1RvU3RyaW5nJDEuY2FsbChXZWFrTWFwKSA6ICcnO1xuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGB0b1N0cmluZ1RhZ2Agb2YgYHZhbHVlYC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgYHRvU3RyaW5nVGFnYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRUYWcodmFsdWUpIHtcbiAgICAgIHJldHVybiBvYmplY3RUb1N0cmluZyQ0LmNhbGwodmFsdWUpO1xuICAgIH1cblxuICAgIC8vIEZhbGxiYWNrIGZvciBkYXRhIHZpZXdzLCBtYXBzLCBzZXRzLCBhbmQgd2VhayBtYXBzIGluIElFIDExLFxuICAgIC8vIGZvciBkYXRhIHZpZXdzIGluIEVkZ2UsIGFuZCBwcm9taXNlcyBpbiBOb2RlLmpzLlxuICAgIGlmICgoRGF0YVZpZXcgJiYgZ2V0VGFnKG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoMSkpKSAhPSBkYXRhVmlld1RhZyQxKSB8fFxuICAgICAgICAoTWFwICYmIGdldFRhZyhuZXcgTWFwKSAhPSBtYXBUYWckMSkgfHxcbiAgICAgICAgKFByb21pc2UgJiYgZ2V0VGFnKFByb21pc2UucmVzb2x2ZSgpKSAhPSBwcm9taXNlVGFnKSB8fFxuICAgICAgICAoU2V0ICYmIGdldFRhZyhuZXcgU2V0KSAhPSBzZXRUYWckMSkgfHxcbiAgICAgICAgKFdlYWtNYXAgJiYgZ2V0VGFnKG5ldyBXZWFrTWFwKSAhPSB3ZWFrTWFwVGFnKSkge1xuICAgICAgZ2V0VGFnID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG9iamVjdFRvU3RyaW5nJDQuY2FsbCh2YWx1ZSksXG4gICAgICAgICAgICBDdG9yID0gcmVzdWx0ID09IG9iamVjdFRhZyQxID8gdmFsdWUuY29uc3RydWN0b3IgOiBudWxsLFxuICAgICAgICAgICAgY3RvclN0cmluZyA9IHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgPyBmdW5jVG9TdHJpbmckMS5jYWxsKEN0b3IpIDogJyc7XG5cbiAgICAgICAgaWYgKGN0b3JTdHJpbmcpIHtcbiAgICAgICAgICBzd2l0Y2ggKGN0b3JTdHJpbmcpIHtcbiAgICAgICAgICAgIGNhc2UgZGF0YVZpZXdDdG9yU3RyaW5nOiByZXR1cm4gZGF0YVZpZXdUYWckMTtcbiAgICAgICAgICAgIGNhc2UgbWFwQ3RvclN0cmluZzogcmV0dXJuIG1hcFRhZyQxO1xuICAgICAgICAgICAgY2FzZSBwcm9taXNlQ3RvclN0cmluZzogcmV0dXJuIHByb21pc2VUYWc7XG4gICAgICAgICAgICBjYXNlIHNldEN0b3JTdHJpbmc6IHJldHVybiBzZXRUYWckMTtcbiAgICAgICAgICAgIGNhc2Ugd2Vha01hcEN0b3JTdHJpbmc6IHJldHVybiB3ZWFrTWFwVGFnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgZ2V0VGFnJDEgPSBnZXRUYWc7XG5cbiAgICB2YXIgYXJnc1RhZyQyID0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG4gICAgdmFyIGFycmF5VGFnJDEgPSAnW29iamVjdCBBcnJheV0nO1xuICAgIHZhciBib29sVGFnJDEgPSAnW29iamVjdCBCb29sZWFuXSc7XG4gICAgdmFyIGRhdGVUYWckMSA9ICdbb2JqZWN0IERhdGVdJztcbiAgICB2YXIgZXJyb3JUYWckMSA9ICdbb2JqZWN0IEVycm9yXSc7XG4gICAgdmFyIGZ1bmNUYWckMSA9ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG4gICAgdmFyIG1hcFRhZyQyID0gJ1tvYmplY3QgTWFwXSc7XG4gICAgdmFyIG51bWJlclRhZyQxID0gJ1tvYmplY3QgTnVtYmVyXSc7XG4gICAgdmFyIG9iamVjdFRhZyQyID0gJ1tvYmplY3QgT2JqZWN0XSc7XG4gICAgdmFyIHJlZ2V4cFRhZyQxID0gJ1tvYmplY3QgUmVnRXhwXSc7XG4gICAgdmFyIHNldFRhZyQyID0gJ1tvYmplY3QgU2V0XSc7XG4gICAgdmFyIHN0cmluZ1RhZyQyID0gJ1tvYmplY3QgU3RyaW5nXSc7XG4gICAgdmFyIHdlYWtNYXBUYWckMSA9ICdbb2JqZWN0IFdlYWtNYXBdJztcbiAgICB2YXIgYXJyYXlCdWZmZXJUYWckMSA9ICdbb2JqZWN0IEFycmF5QnVmZmVyXSc7XG4gICAgdmFyIGRhdGFWaWV3VGFnJDIgPSAnW29iamVjdCBEYXRhVmlld10nO1xuICAgIHZhciBmbG9hdDMyVGFnID0gJ1tvYmplY3QgRmxvYXQzMkFycmF5XSc7XG4gICAgdmFyIGZsb2F0NjRUYWcgPSAnW29iamVjdCBGbG9hdDY0QXJyYXldJztcbiAgICB2YXIgaW50OFRhZyA9ICdbb2JqZWN0IEludDhBcnJheV0nO1xuICAgIHZhciBpbnQxNlRhZyA9ICdbb2JqZWN0IEludDE2QXJyYXldJztcbiAgICB2YXIgaW50MzJUYWcgPSAnW29iamVjdCBJbnQzMkFycmF5XSc7XG4gICAgdmFyIHVpbnQ4VGFnID0gJ1tvYmplY3QgVWludDhBcnJheV0nO1xuICAgIHZhciB1aW50OENsYW1wZWRUYWcgPSAnW29iamVjdCBVaW50OENsYW1wZWRBcnJheV0nO1xuICAgIHZhciB1aW50MTZUYWcgPSAnW29iamVjdCBVaW50MTZBcnJheV0nO1xuICAgIHZhciB1aW50MzJUYWcgPSAnW29iamVjdCBVaW50MzJBcnJheV0nO1xuICAgIC8qKiBVc2VkIHRvIGlkZW50aWZ5IGB0b1N0cmluZ1RhZ2AgdmFsdWVzIG9mIHR5cGVkIGFycmF5cy4gKi9cbiAgICB2YXIgdHlwZWRBcnJheVRhZ3MgPSB7fTtcbiAgICB0eXBlZEFycmF5VGFnc1tmbG9hdDMyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2Zsb2F0NjRUYWddID1cbiAgICB0eXBlZEFycmF5VGFnc1tpbnQ4VGFnXSA9IHR5cGVkQXJyYXlUYWdzW2ludDE2VGFnXSA9XG4gICAgdHlwZWRBcnJheVRhZ3NbaW50MzJUYWddID0gdHlwZWRBcnJheVRhZ3NbdWludDhUYWddID1cbiAgICB0eXBlZEFycmF5VGFnc1t1aW50OENsYW1wZWRUYWddID0gdHlwZWRBcnJheVRhZ3NbdWludDE2VGFnXSA9XG4gICAgdHlwZWRBcnJheVRhZ3NbdWludDMyVGFnXSA9IHRydWU7XG4gICAgdHlwZWRBcnJheVRhZ3NbYXJnc1RhZyQyXSA9IHR5cGVkQXJyYXlUYWdzW2FycmF5VGFnJDFdID1cbiAgICB0eXBlZEFycmF5VGFnc1thcnJheUJ1ZmZlclRhZyQxXSA9IHR5cGVkQXJyYXlUYWdzW2Jvb2xUYWckMV0gPVxuICAgIHR5cGVkQXJyYXlUYWdzW2RhdGFWaWV3VGFnJDJdID0gdHlwZWRBcnJheVRhZ3NbZGF0ZVRhZyQxXSA9XG4gICAgdHlwZWRBcnJheVRhZ3NbZXJyb3JUYWckMV0gPSB0eXBlZEFycmF5VGFnc1tmdW5jVGFnJDFdID1cbiAgICB0eXBlZEFycmF5VGFnc1ttYXBUYWckMl0gPSB0eXBlZEFycmF5VGFnc1tudW1iZXJUYWckMV0gPVxuICAgIHR5cGVkQXJyYXlUYWdzW29iamVjdFRhZyQyXSA9IHR5cGVkQXJyYXlUYWdzW3JlZ2V4cFRhZyQxXSA9XG4gICAgdHlwZWRBcnJheVRhZ3Nbc2V0VGFnJDJdID0gdHlwZWRBcnJheVRhZ3Nbc3RyaW5nVGFnJDJdID1cbiAgICB0eXBlZEFycmF5VGFnc1t3ZWFrTWFwVGFnJDFdID0gZmFsc2U7XG5cbiAgICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gICAgdmFyIG9iamVjdFByb3RvJDEyID0gT2JqZWN0LnByb3RvdHlwZTtcblxuICAgIC8qKlxuICAgICAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gICAgICogb2YgdmFsdWVzLlxuICAgICAqL1xuICAgIHZhciBvYmplY3RUb1N0cmluZyQ1ID0gb2JqZWN0UHJvdG8kMTIudG9TdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgdHlwZWQgYXJyYXkuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAc2luY2UgMy4wLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGFuZ1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLFxuICAgICAqICBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNUeXBlZEFycmF5KG5ldyBVaW50OEFycmF5KTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzVHlwZWRBcnJheShbXSk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc1R5cGVkQXJyYXkodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmXG4gICAgICAgIGlzTGVuZ3RoKHZhbHVlLmxlbmd0aCkgJiYgISF0eXBlZEFycmF5VGFnc1tvYmplY3RUb1N0cmluZyQ1LmNhbGwodmFsdWUpXTtcbiAgICB9XG5cbiAgICAvKiogVXNlZCB0byBjb21wb3NlIGJpdG1hc2tzIGZvciBjb21wYXJpc29uIHN0eWxlcy4gKi9cbiAgICB2YXIgUEFSVElBTF9DT01QQVJFX0ZMQUckMSA9IDI7XG5cbiAgICAvKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG4gICAgdmFyIGFyZ3NUYWckMSA9ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuICAgIHZhciBhcnJheVRhZyA9ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgdmFyIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nO1xuICAgIC8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbiAgICB2YXIgb2JqZWN0UHJvdG8kMTAgPSBPYmplY3QucHJvdG90eXBlO1xuXG4gICAgLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG4gICAgdmFyIGhhc093blByb3BlcnR5JDUgPSBvYmplY3RQcm90byQxMC5oYXNPd25Qcm9wZXJ0eTtcblxuICAgIC8qKlxuICAgICAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUlzRXF1YWxgIGZvciBhcnJheXMgYW5kIG9iamVjdHMgd2hpY2ggcGVyZm9ybXNcbiAgICAgKiBkZWVwIGNvbXBhcmlzb25zIGFuZCB0cmFja3MgdHJhdmVyc2VkIG9iamVjdHMgZW5hYmxpbmcgb2JqZWN0cyB3aXRoIGNpcmN1bGFyXG4gICAgICogcmVmZXJlbmNlcyB0byBiZSBjb21wYXJlZC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGNvbXBhcmUuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG90aGVyIFRoZSBvdGhlciBvYmplY3QgdG8gY29tcGFyZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBlcXVhbEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRldGVybWluZSBlcXVpdmFsZW50cyBvZiB2YWx1ZXMuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaXNvbnMuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtiaXRtYXNrXSBUaGUgYml0bWFzayBvZiBjb21wYXJpc29uIGZsYWdzLiBTZWUgYGJhc2VJc0VxdWFsYFxuICAgICAqICBmb3IgbW9yZSBkZXRhaWxzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbc3RhY2tdIFRyYWNrcyB0cmF2ZXJzZWQgYG9iamVjdGAgYW5kIGBvdGhlcmAgb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG9iamVjdHMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlSXNFcXVhbERlZXAob2JqZWN0LCBvdGhlciwgZXF1YWxGdW5jLCBjdXN0b21pemVyLCBiaXRtYXNrLCBzdGFjaykge1xuICAgICAgdmFyIG9iaklzQXJyID0gaXNBcnJheShvYmplY3QpLFxuICAgICAgICAgIG90aElzQXJyID0gaXNBcnJheShvdGhlciksXG4gICAgICAgICAgb2JqVGFnID0gYXJyYXlUYWcsXG4gICAgICAgICAgb3RoVGFnID0gYXJyYXlUYWc7XG5cbiAgICAgIGlmICghb2JqSXNBcnIpIHtcbiAgICAgICAgb2JqVGFnID0gZ2V0VGFnJDEob2JqZWN0KTtcbiAgICAgICAgb2JqVGFnID0gb2JqVGFnID09IGFyZ3NUYWckMSA/IG9iamVjdFRhZyA6IG9ialRhZztcbiAgICAgIH1cbiAgICAgIGlmICghb3RoSXNBcnIpIHtcbiAgICAgICAgb3RoVGFnID0gZ2V0VGFnJDEob3RoZXIpO1xuICAgICAgICBvdGhUYWcgPSBvdGhUYWcgPT0gYXJnc1RhZyQxID8gb2JqZWN0VGFnIDogb3RoVGFnO1xuICAgICAgfVxuICAgICAgdmFyIG9iaklzT2JqID0gb2JqVGFnID09IG9iamVjdFRhZyAmJiAhaXNIb3N0T2JqZWN0KG9iamVjdCksXG4gICAgICAgICAgb3RoSXNPYmogPSBvdGhUYWcgPT0gb2JqZWN0VGFnICYmICFpc0hvc3RPYmplY3Qob3RoZXIpLFxuICAgICAgICAgIGlzU2FtZVRhZyA9IG9ialRhZyA9PSBvdGhUYWc7XG5cbiAgICAgIGlmIChpc1NhbWVUYWcgJiYgIW9iaklzT2JqKSB7XG4gICAgICAgIHN0YWNrIHx8IChzdGFjayA9IG5ldyBTdGFjayk7XG4gICAgICAgIHJldHVybiAob2JqSXNBcnIgfHwgaXNUeXBlZEFycmF5KG9iamVjdCkpXG4gICAgICAgICAgPyBlcXVhbEFycmF5cyhvYmplY3QsIG90aGVyLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGJpdG1hc2ssIHN0YWNrKVxuICAgICAgICAgIDogZXF1YWxCeVRhZyhvYmplY3QsIG90aGVyLCBvYmpUYWcsIGVxdWFsRnVuYywgY3VzdG9taXplciwgYml0bWFzaywgc3RhY2spO1xuICAgICAgfVxuICAgICAgaWYgKCEoYml0bWFzayAmIFBBUlRJQUxfQ09NUEFSRV9GTEFHJDEpKSB7XG4gICAgICAgIHZhciBvYmpJc1dyYXBwZWQgPSBvYmpJc09iaiAmJiBoYXNPd25Qcm9wZXJ0eSQ1LmNhbGwob2JqZWN0LCAnX193cmFwcGVkX18nKSxcbiAgICAgICAgICAgIG90aElzV3JhcHBlZCA9IG90aElzT2JqICYmIGhhc093blByb3BlcnR5JDUuY2FsbChvdGhlciwgJ19fd3JhcHBlZF9fJyk7XG5cbiAgICAgICAgaWYgKG9iaklzV3JhcHBlZCB8fCBvdGhJc1dyYXBwZWQpIHtcbiAgICAgICAgICB2YXIgb2JqVW53cmFwcGVkID0gb2JqSXNXcmFwcGVkID8gb2JqZWN0LnZhbHVlKCkgOiBvYmplY3QsXG4gICAgICAgICAgICAgIG90aFVud3JhcHBlZCA9IG90aElzV3JhcHBlZCA/IG90aGVyLnZhbHVlKCkgOiBvdGhlcjtcblxuICAgICAgICAgIHN0YWNrIHx8IChzdGFjayA9IG5ldyBTdGFjayk7XG4gICAgICAgICAgcmV0dXJuIGVxdWFsRnVuYyhvYmpVbndyYXBwZWQsIG90aFVud3JhcHBlZCwgY3VzdG9taXplciwgYml0bWFzaywgc3RhY2spO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWlzU2FtZVRhZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBzdGFjayB8fCAoc3RhY2sgPSBuZXcgU3RhY2spO1xuICAgICAgcmV0dXJuIGVxdWFsT2JqZWN0cyhvYmplY3QsIG90aGVyLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGJpdG1hc2ssIHN0YWNrKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc0VxdWFsYCB3aGljaCBzdXBwb3J0cyBwYXJ0aWFsIGNvbXBhcmlzb25zXG4gICAgICogYW5kIHRyYWNrcyB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAgICAgKiBAcGFyYW0geyp9IG90aGVyIFRoZSBvdGhlciB2YWx1ZSB0byBjb21wYXJlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjdXN0b21pemVyXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmlzb25zLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2JpdG1hc2tdIFRoZSBiaXRtYXNrIG9mIGNvbXBhcmlzb24gZmxhZ3MuXG4gICAgICogIFRoZSBiaXRtYXNrIG1heSBiZSBjb21wb3NlZCBvZiB0aGUgZm9sbG93aW5nIGZsYWdzOlxuICAgICAqICAgICAxIC0gVW5vcmRlcmVkIGNvbXBhcmlzb25cbiAgICAgKiAgICAgMiAtIFBhcnRpYWwgY29tcGFyaXNvblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbc3RhY2tdIFRyYWNrcyB0cmF2ZXJzZWQgYHZhbHVlYCBhbmQgYG90aGVyYCBvYmplY3RzLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZUlzRXF1YWwodmFsdWUsIG90aGVyLCBjdXN0b21pemVyLCBiaXRtYXNrLCBzdGFjaykge1xuICAgICAgaWYgKHZhbHVlID09PSBvdGhlcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IG90aGVyID09IG51bGwgfHwgKCFpc09iamVjdCh2YWx1ZSkgJiYgIWlzT2JqZWN0TGlrZShvdGhlcikpKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gdmFsdWUgJiYgb3RoZXIgIT09IG90aGVyO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJhc2VJc0VxdWFsRGVlcCh2YWx1ZSwgb3RoZXIsIGJhc2VJc0VxdWFsLCBjdXN0b21pemVyLCBiaXRtYXNrLCBzdGFjayk7XG4gICAgfVxuXG4gICAgdmFyIFVOT1JERVJFRF9DT01QQVJFX0ZMQUcgPSAxO1xuICAgIHZhciBQQVJUSUFMX0NPTVBBUkVfRkxBRyA9IDI7XG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXNNYXRjaGAgd2l0aG91dCBzdXBwb3J0IGZvciBpdGVyYXRlZSBzaG9ydGhhbmRzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc291cmNlIFRoZSBvYmplY3Qgb2YgcHJvcGVydHkgdmFsdWVzIHRvIG1hdGNoLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IG1hdGNoRGF0YSBUaGUgcHJvcGVydHkgbmFtZXMsIHZhbHVlcywgYW5kIGNvbXBhcmUgZmxhZ3MgdG8gbWF0Y2guXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaXNvbnMuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGBvYmplY3RgIGlzIGEgbWF0Y2gsIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlSXNNYXRjaChvYmplY3QsIHNvdXJjZSwgbWF0Y2hEYXRhLCBjdXN0b21pemVyKSB7XG4gICAgICB2YXIgaW5kZXggPSBtYXRjaERhdGEubGVuZ3RoLFxuICAgICAgICAgIGxlbmd0aCA9IGluZGV4LFxuICAgICAgICAgIG5vQ3VzdG9taXplciA9ICFjdXN0b21pemVyO1xuXG4gICAgICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICFsZW5ndGg7XG4gICAgICB9XG4gICAgICBvYmplY3QgPSBPYmplY3Qob2JqZWN0KTtcbiAgICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICAgIHZhciBkYXRhID0gbWF0Y2hEYXRhW2luZGV4XTtcbiAgICAgICAgaWYgKChub0N1c3RvbWl6ZXIgJiYgZGF0YVsyXSlcbiAgICAgICAgICAgICAgPyBkYXRhWzFdICE9PSBvYmplY3RbZGF0YVswXV1cbiAgICAgICAgICAgICAgOiAhKGRhdGFbMF0gaW4gb2JqZWN0KVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICBkYXRhID0gbWF0Y2hEYXRhW2luZGV4XTtcbiAgICAgICAgdmFyIGtleSA9IGRhdGFbMF0sXG4gICAgICAgICAgICBvYmpWYWx1ZSA9IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgc3JjVmFsdWUgPSBkYXRhWzFdO1xuXG4gICAgICAgIGlmIChub0N1c3RvbWl6ZXIgJiYgZGF0YVsyXSkge1xuICAgICAgICAgIGlmIChvYmpWYWx1ZSA9PT0gdW5kZWZpbmVkICYmICEoa2V5IGluIG9iamVjdCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHN0YWNrID0gbmV3IFN0YWNrO1xuICAgICAgICAgIGlmIChjdXN0b21pemVyKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VzdG9taXplcihvYmpWYWx1ZSwgc3JjVmFsdWUsIGtleSwgb2JqZWN0LCBzb3VyY2UsIHN0YWNrKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID09PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICA/IGJhc2VJc0VxdWFsKHNyY1ZhbHVlLCBvYmpWYWx1ZSwgY3VzdG9taXplciwgVU5PUkRFUkVEX0NPTVBBUkVfRkxBRyB8IFBBUlRJQUxfQ09NUEFSRV9GTEFHLCBzdGFjaylcbiAgICAgICAgICAgICAgICA6IHJlc3VsdFxuICAgICAgICAgICAgICApKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSBmb3Igc3RyaWN0IGVxdWFsaXR5IGNvbXBhcmlzb25zLCBpLmUuIGA9PT1gLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpZiBzdWl0YWJsZSBmb3Igc3RyaWN0XG4gICAgICogIGVxdWFsaXR5IGNvbXBhcmlzb25zLCBlbHNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNTdHJpY3RDb21wYXJhYmxlKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHZhbHVlICYmICFpc09iamVjdCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLm1hcGAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yIGl0ZXJhdGVlXG4gICAgICogc2hvcnRoYW5kcy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IG1hcHBlZCBhcnJheS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhcnJheU1hcChhcnJheSwgaXRlcmF0ZWUpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICByZXN1bHRbaW5kZXhdID0gaXRlcmF0ZWUoYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy50b1BhaXJzYCBhbmQgYF8udG9QYWlyc0luYCB3aGljaCBjcmVhdGVzIGFuIGFycmF5XG4gICAgICogb2Yga2V5LXZhbHVlIHBhaXJzIGZvciBgb2JqZWN0YCBjb3JyZXNwb25kaW5nIHRvIHRoZSBwcm9wZXJ0eSBuYW1lcyBvZiBgcHJvcHNgLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gICAgICogQHBhcmFtIHtBcnJheX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIGdldCB2YWx1ZXMgZm9yLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG5ldyBhcnJheSBvZiBrZXktdmFsdWUgcGFpcnMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZVRvUGFpcnMob2JqZWN0LCBwcm9wcykge1xuICAgICAgcmV0dXJuIGFycmF5TWFwKHByb3BzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIFtrZXksIG9iamVjdFtrZXldXTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2Ygb3duIGVudW1lcmFibGUgc3RyaW5nIGtleWVkLXZhbHVlIHBhaXJzIGZvciBgb2JqZWN0YFxuICAgICAqIHdoaWNoIGNhbiBiZSBjb25zdW1lZCBieSBgXy5mcm9tUGFpcnNgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHNpbmNlIDQuMC4wXG4gICAgICogQGFsaWFzIGVudHJpZXNcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGFycmF5IG9mIGtleS12YWx1ZSBwYWlycy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogZnVuY3Rpb24gRm9vKCkge1xuICAgICAqICAgdGhpcy5hID0gMTtcbiAgICAgKiAgIHRoaXMuYiA9IDI7XG4gICAgICogfVxuICAgICAqXG4gICAgICogRm9vLnByb3RvdHlwZS5jID0gMztcbiAgICAgKlxuICAgICAqIF8udG9QYWlycyhuZXcgRm9vKTtcbiAgICAgKiAvLyA9PiBbWydhJywgMV0sIFsnYicsIDJdXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvUGFpcnMob2JqZWN0KSB7XG4gICAgICByZXR1cm4gYmFzZVRvUGFpcnMob2JqZWN0LCBrZXlzKG9iamVjdCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIHByb3BlcnR5IG5hbWVzLCB2YWx1ZXMsIGFuZCBjb21wYXJlIGZsYWdzIG9mIGBvYmplY3RgLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBtYXRjaCBkYXRhIG9mIGBvYmplY3RgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldE1hdGNoRGF0YShvYmplY3QpIHtcbiAgICAgIHZhciByZXN1bHQgPSB0b1BhaXJzKG9iamVjdCksXG4gICAgICAgICAgbGVuZ3RoID0gcmVzdWx0Lmxlbmd0aDtcblxuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIHJlc3VsdFtsZW5ndGhdWzJdID0gaXNTdHJpY3RDb21wYXJhYmxlKHJlc3VsdFtsZW5ndGhdWzFdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ubWF0Y2hlc2Agd2hpY2ggZG9lc24ndCBjbG9uZSBgc291cmNlYC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgb2JqZWN0IG9mIHByb3BlcnR5IHZhbHVlcyB0byBtYXRjaC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlTWF0Y2hlcyhzb3VyY2UpIHtcbiAgICAgIHZhciBtYXRjaERhdGEgPSBnZXRNYXRjaERhdGEoc291cmNlKTtcbiAgICAgIGlmIChtYXRjaERhdGEubGVuZ3RoID09IDEgJiYgbWF0Y2hEYXRhWzBdWzJdKSB7XG4gICAgICAgIHZhciBrZXkgPSBtYXRjaERhdGFbMF1bMF0sXG4gICAgICAgICAgICB2YWx1ZSA9IG1hdGNoRGF0YVswXVsxXTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgICAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBvYmplY3Rba2V5XSA9PT0gdmFsdWUgJiZcbiAgICAgICAgICAgICh2YWx1ZSAhPT0gdW5kZWZpbmVkIHx8IChrZXkgaW4gT2JqZWN0KG9iamVjdCkpKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdCA9PT0gc291cmNlIHx8IGJhc2VJc01hdGNoKG9iamVjdCwgc291cmNlLCBtYXRjaERhdGEpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKiogVXNlZCBhcyB0aGUgYFR5cGVFcnJvcmAgbWVzc2FnZSBmb3IgXCJGdW5jdGlvbnNcIiBtZXRob2RzLiAqL1xuICAgIHZhciBGVU5DX0VSUk9SX1RFWFQkMSA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IG1lbW9pemVzIHRoZSByZXN1bHQgb2YgYGZ1bmNgLiBJZiBgcmVzb2x2ZXJgIGlzXG4gICAgICogcHJvdmlkZWQgaXQgZGV0ZXJtaW5lcyB0aGUgY2FjaGUga2V5IGZvciBzdG9yaW5nIHRoZSByZXN1bHQgYmFzZWQgb24gdGhlXG4gICAgICogYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBtZW1vaXplZCBmdW5jdGlvbi4gQnkgZGVmYXVsdCwgdGhlIGZpcnN0IGFyZ3VtZW50XG4gICAgICogcHJvdmlkZWQgdG8gdGhlIG1lbW9pemVkIGZ1bmN0aW9uIGlzIHVzZWQgYXMgdGhlIG1hcCBjYWNoZSBrZXkuIFRoZSBgZnVuY2BcbiAgICAgKiBpcyBpbnZva2VkIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZSBtZW1vaXplZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqICoqTm90ZToqKiBUaGUgY2FjaGUgaXMgZXhwb3NlZCBhcyB0aGUgYGNhY2hlYCBwcm9wZXJ0eSBvbiB0aGUgbWVtb2l6ZWRcbiAgICAgKiBmdW5jdGlvbi4gSXRzIGNyZWF0aW9uIG1heSBiZSBjdXN0b21pemVkIGJ5IHJlcGxhY2luZyB0aGUgYF8ubWVtb2l6ZS5DYWNoZWBcbiAgICAgKiBjb25zdHJ1Y3RvciB3aXRoIG9uZSB3aG9zZSBpbnN0YW5jZXMgaW1wbGVtZW50IHRoZVxuICAgICAqIFtgTWFwYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtcHJvcGVydGllcy1vZi10aGUtbWFwLXByb3RvdHlwZS1vYmplY3QpXG4gICAgICogbWV0aG9kIGludGVyZmFjZSBvZiBgZGVsZXRlYCwgYGdldGAsIGBoYXNgLCBhbmQgYHNldGAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAc2luY2UgMC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBoYXZlIGl0cyBvdXRwdXQgbWVtb2l6ZWQuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW3Jlc29sdmVyXSBUaGUgZnVuY3Rpb24gdG8gcmVzb2x2ZSB0aGUgY2FjaGUga2V5LlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IG1lbW9pemluZyBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIG9iamVjdCA9IHsgJ2EnOiAxLCAnYic6IDIgfTtcbiAgICAgKiB2YXIgb3RoZXIgPSB7ICdjJzogMywgJ2QnOiA0IH07XG4gICAgICpcbiAgICAgKiB2YXIgdmFsdWVzID0gXy5tZW1vaXplKF8udmFsdWVzKTtcbiAgICAgKiB2YWx1ZXMob2JqZWN0KTtcbiAgICAgKiAvLyA9PiBbMSwgMl1cbiAgICAgKlxuICAgICAqIHZhbHVlcyhvdGhlcik7XG4gICAgICogLy8gPT4gWzMsIDRdXG4gICAgICpcbiAgICAgKiBvYmplY3QuYSA9IDI7XG4gICAgICogdmFsdWVzKG9iamVjdCk7XG4gICAgICogLy8gPT4gWzEsIDJdXG4gICAgICpcbiAgICAgKiAvLyBNb2RpZnkgdGhlIHJlc3VsdCBjYWNoZS5cbiAgICAgKiB2YWx1ZXMuY2FjaGUuc2V0KG9iamVjdCwgWydhJywgJ2InXSk7XG4gICAgICogdmFsdWVzKG9iamVjdCk7XG4gICAgICogLy8gPT4gWydhJywgJ2InXVxuICAgICAqXG4gICAgICogLy8gUmVwbGFjZSBgXy5tZW1vaXplLkNhY2hlYC5cbiAgICAgKiBfLm1lbW9pemUuQ2FjaGUgPSBXZWFrTWFwO1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIG1lbW9pemUoZnVuYywgcmVzb2x2ZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nIHx8IChyZXNvbHZlciAmJiB0eXBlb2YgcmVzb2x2ZXIgIT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQkMSk7XG4gICAgICB9XG4gICAgICB2YXIgbWVtb2l6ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgICAgICBrZXkgPSByZXNvbHZlciA/IHJlc29sdmVyLmFwcGx5KHRoaXMsIGFyZ3MpIDogYXJnc1swXSxcbiAgICAgICAgICAgIGNhY2hlID0gbWVtb2l6ZWQuY2FjaGU7XG5cbiAgICAgICAgaWYgKGNhY2hlLmhhcyhrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuIGNhY2hlLmdldChrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICBtZW1vaXplZC5jYWNoZSA9IGNhY2hlLnNldChrZXksIHJlc3VsdCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgICAgbWVtb2l6ZWQuY2FjaGUgPSBuZXcgKG1lbW9pemUuQ2FjaGUgfHwgTWFwQ2FjaGUpO1xuICAgICAgcmV0dXJuIG1lbW9pemVkO1xuICAgIH1cblxuICAgIC8vIEFzc2lnbiBjYWNoZSB0byBgXy5tZW1vaXplYC5cbiAgICBtZW1vaXplLkNhY2hlID0gTWFwQ2FjaGU7XG5cbiAgICAvKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbiAgICB2YXIgSU5GSU5JVFkkMSA9IDEgLyAwO1xuXG4gICAgLyoqIFVzZWQgdG8gY29udmVydCBzeW1ib2xzIHRvIHByaW1pdGl2ZXMgYW5kIHN0cmluZ3MuICovXG4gICAgdmFyIHN5bWJvbFByb3RvJDEgPSBTeW1ib2wkMSA/IFN5bWJvbCQxLnByb3RvdHlwZSA6IHVuZGVmaW5lZDtcbiAgICB2YXIgc3ltYm9sVG9TdHJpbmcgPSBzeW1ib2xQcm90byQxID8gc3ltYm9sUHJvdG8kMS50b1N0cmluZyA6IHVuZGVmaW5lZDtcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgc3RyaW5nIGlmIGl0J3Mgbm90IG9uZS4gQW4gZW1wdHkgc3RyaW5nIGlzIHJldHVybmVkXG4gICAgICogZm9yIGBudWxsYCBhbmQgYHVuZGVmaW5lZGAgdmFsdWVzLiBUaGUgc2lnbiBvZiBgLTBgIGlzIHByZXNlcnZlZC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBzaW5jZSA0LjAuMFxuICAgICAqIEBjYXRlZ29yeSBMYW5nXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzdHJpbmcuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8udG9TdHJpbmcobnVsbCk7XG4gICAgICogLy8gPT4gJydcbiAgICAgKlxuICAgICAqIF8udG9TdHJpbmcoLTApO1xuICAgICAqIC8vID0+ICctMCdcbiAgICAgKlxuICAgICAqIF8udG9TdHJpbmcoWzEsIDIsIDNdKTtcbiAgICAgKiAvLyA9PiAnMSwyLDMnXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9TdHJpbmcodmFsdWUpIHtcbiAgICAgIC8vIEV4aXQgZWFybHkgZm9yIHN0cmluZ3MgdG8gYXZvaWQgYSBwZXJmb3JtYW5jZSBoaXQgaW4gc29tZSBlbnZpcm9ubWVudHMuXG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICAgIGlmIChpc1N5bWJvbCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHN5bWJvbFRvU3RyaW5nID8gc3ltYm9sVG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgICAgIH1cbiAgICAgIHZhciByZXN1bHQgPSAodmFsdWUgKyAnJyk7XG4gICAgICByZXR1cm4gKHJlc3VsdCA9PSAnMCcgJiYgKDEgLyB2YWx1ZSkgPT0gLUlORklOSVRZJDEpID8gJy0wJyA6IHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKiogVXNlZCB0byBtYXRjaCBwcm9wZXJ0eSBuYW1lcyB3aXRoaW4gcHJvcGVydHkgcGF0aHMuICovXG4gICAgdmFyIHJlUHJvcE5hbWUgPSAvW14uW1xcXV0rfFxcWyg/OigtP1xcZCsoPzpcXC5cXGQrKT8pfChbXCInXSkoKD86KD8hXFwyKVteXFxcXF18XFxcXC4pKj8pXFwyKVxcXS9nO1xuXG4gICAgLyoqIFVzZWQgdG8gbWF0Y2ggYmFja3NsYXNoZXMgaW4gcHJvcGVydHkgcGF0aHMuICovXG4gICAgdmFyIHJlRXNjYXBlQ2hhciA9IC9cXFxcKFxcXFwpPy9nO1xuXG4gICAgLyoqXG4gICAgICogQ29udmVydHMgYHN0cmluZ2AgdG8gYSBwcm9wZXJ0eSBwYXRoIGFycmF5LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gY29udmVydC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIHByb3BlcnR5IHBhdGggYXJyYXkuXG4gICAgICovXG4gICAgdmFyIHN0cmluZ1RvUGF0aCA9IG1lbW9pemUoZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICB0b1N0cmluZyhzdHJpbmcpLnJlcGxhY2UocmVQcm9wTmFtZSwgZnVuY3Rpb24obWF0Y2gsIG51bWJlciwgcXVvdGUsIHN0cmluZykge1xuICAgICAgICByZXN1bHQucHVzaChxdW90ZSA/IHN0cmluZy5yZXBsYWNlKHJlRXNjYXBlQ2hhciwgJyQxJykgOiAobnVtYmVyIHx8IG1hdGNoKSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDYXN0cyBgdmFsdWVgIHRvIGEgcGF0aCBhcnJheSBpZiBpdCdzIG5vdCBvbmUuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGluc3BlY3QuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBjYXN0IHByb3BlcnR5IHBhdGggYXJyYXkuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZUNhc3RQYXRoKHZhbHVlKSB7XG4gICAgICByZXR1cm4gaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6IHN0cmluZ1RvUGF0aCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgdmFyIHJlSXNEZWVwUHJvcCA9IC9cXC58XFxbKD86W15bXFxdXSp8KFtcIiddKSg/Oig/IVxcMSlbXlxcXFxdfFxcXFwuKSo/XFwxKVxcXS87XG4gICAgdmFyIHJlSXNQbGFpblByb3AgPSAvXlxcdyokLztcbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHByb3BlcnR5IG5hbWUgYW5kIG5vdCBhIHByb3BlcnR5IHBhdGguXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb2JqZWN0XSBUaGUgb2JqZWN0IHRvIHF1ZXJ5IGtleXMgb24uXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwcm9wZXJ0eSBuYW1lLCBlbHNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNLZXkodmFsdWUsIG9iamVjdCkge1xuICAgICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gICAgICBpZiAodHlwZSA9PSAnbnVtYmVyJyB8fCB0eXBlID09ICdzeW1ib2wnKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuICFpc0FycmF5KHZhbHVlKSAmJlxuICAgICAgICAoaXNTeW1ib2wodmFsdWUpIHx8IHJlSXNQbGFpblByb3AudGVzdCh2YWx1ZSkgfHwgIXJlSXNEZWVwUHJvcC50ZXN0KHZhbHVlKSB8fFxuICAgICAgICAgIChvYmplY3QgIT0gbnVsbCAmJiB2YWx1ZSBpbiBPYmplY3Qob2JqZWN0KSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmdldGAgd2l0aG91dCBzdXBwb3J0IGZvciBkZWZhdWx0IHZhbHVlcy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgICAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBwYXRoIFRoZSBwYXRoIG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHJlc29sdmVkIHZhbHVlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VHZXQob2JqZWN0LCBwYXRoKSB7XG4gICAgICBwYXRoID0gaXNLZXkocGF0aCwgb2JqZWN0KSA/IFtwYXRoXSA6IGJhc2VDYXN0UGF0aChwYXRoKTtcblxuICAgICAgdmFyIGluZGV4ID0gMCxcbiAgICAgICAgICBsZW5ndGggPSBwYXRoLmxlbmd0aDtcblxuICAgICAgd2hpbGUgKG9iamVjdCAhPSBudWxsICYmIGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIG9iamVjdCA9IG9iamVjdFtwYXRoW2luZGV4KytdXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAoaW5kZXggJiYgaW5kZXggPT0gbGVuZ3RoKSA/IG9iamVjdCA6IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBgcGF0aGAgb2YgYG9iamVjdGAuIElmIHRoZSByZXNvbHZlZCB2YWx1ZSBpc1xuICAgICAqIGB1bmRlZmluZWRgIHRoZSBgZGVmYXVsdFZhbHVlYCBpcyB1c2VkIGluIGl0cyBwbGFjZS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBzaW5jZSAzLjcuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gICAgICogQHBhcmFtIHtBcnJheXxzdHJpbmd9IHBhdGggVGhlIHBhdGggb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAgICAgKiBAcGFyYW0geyp9IFtkZWZhdWx0VmFsdWVdIFRoZSB2YWx1ZSByZXR1cm5lZCBmb3IgYHVuZGVmaW5lZGAgcmVzb2x2ZWQgdmFsdWVzLlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSByZXNvbHZlZCB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIG9iamVjdCA9IHsgJ2EnOiBbeyAnYic6IHsgJ2MnOiAzIH0gfV0gfTtcbiAgICAgKlxuICAgICAqIF8uZ2V0KG9iamVjdCwgJ2FbMF0uYi5jJyk7XG4gICAgICogLy8gPT4gM1xuICAgICAqXG4gICAgICogXy5nZXQob2JqZWN0LCBbJ2EnLCAnMCcsICdiJywgJ2MnXSk7XG4gICAgICogLy8gPT4gM1xuICAgICAqXG4gICAgICogXy5nZXQob2JqZWN0LCAnYS5iLmMnLCAnZGVmYXVsdCcpO1xuICAgICAqIC8vID0+ICdkZWZhdWx0J1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldChvYmplY3QsIHBhdGgsIGRlZmF1bHRWYWx1ZSkge1xuICAgICAgdmFyIHJlc3VsdCA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogYmFzZUdldChvYmplY3QsIHBhdGgpO1xuICAgICAgcmV0dXJuIHJlc3VsdCA9PT0gdW5kZWZpbmVkID8gZGVmYXVsdFZhbHVlIDogcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmhhc0luYCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZXAgcGF0aHMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAgICAgKiBAcGFyYW0ge0FycmF5fHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGBrZXlgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VIYXNJbihvYmplY3QsIGtleSkge1xuICAgICAgcmV0dXJuIGtleSBpbiBPYmplY3Qob2JqZWN0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHBhdGhgIGV4aXN0cyBvbiBgb2JqZWN0YC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgICAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBwYXRoIFRoZSBwYXRoIHRvIGNoZWNrLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhc0Z1bmMgVGhlIGZ1bmN0aW9uIHRvIGNoZWNrIHByb3BlcnRpZXMuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGBwYXRoYCBleGlzdHMsIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBoYXNQYXRoKG9iamVjdCwgcGF0aCwgaGFzRnVuYykge1xuICAgICAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHZhciByZXN1bHQgPSBoYXNGdW5jKG9iamVjdCwgcGF0aCk7XG4gICAgICBpZiAoIXJlc3VsdCAmJiAhaXNLZXkocGF0aCkpIHtcbiAgICAgICAgcGF0aCA9IGJhc2VDYXN0UGF0aChwYXRoKTtcblxuICAgICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoO1xuXG4gICAgICAgIHdoaWxlIChvYmplY3QgIT0gbnVsbCAmJiArK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIGtleSA9IHBhdGhbaW5kZXhdO1xuICAgICAgICAgIGlmICghKHJlc3VsdCA9IGhhc0Z1bmMob2JqZWN0LCBrZXkpKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIG9iamVjdCA9IG9iamVjdFtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgbGVuZ3RoID0gb2JqZWN0ID8gb2JqZWN0Lmxlbmd0aCA6IHVuZGVmaW5lZDtcbiAgICAgIHJldHVybiByZXN1bHQgfHwgKFxuICAgICAgICAhIWxlbmd0aCAmJiBpc0xlbmd0aChsZW5ndGgpICYmIGlzSW5kZXgocGF0aCwgbGVuZ3RoKSAmJlxuICAgICAgICAoaXNBcnJheShvYmplY3QpIHx8IGlzU3RyaW5nKG9iamVjdCkgfHwgaXNBcmd1bWVudHMob2JqZWN0KSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGBwYXRoYCBpcyBhIGRpcmVjdCBvciBpbmhlcml0ZWQgcHJvcGVydHkgb2YgYG9iamVjdGAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAc2luY2UgNC4wLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgICAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBwYXRoIFRoZSBwYXRoIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgcGF0aGAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBvYmplY3QgPSBfLmNyZWF0ZSh7ICdhJzogXy5jcmVhdGUoeyAnYic6IF8uY3JlYXRlKHsgJ2MnOiAzIH0pIH0pIH0pO1xuICAgICAqXG4gICAgICogXy5oYXNJbihvYmplY3QsICdhJyk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5oYXNJbihvYmplY3QsICdhLmIuYycpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaGFzSW4ob2JqZWN0LCBbJ2EnLCAnYicsICdjJ10pO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaGFzSW4ob2JqZWN0LCAnYicpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaGFzSW4ob2JqZWN0LCBwYXRoKSB7XG4gICAgICByZXR1cm4gaGFzUGF0aChvYmplY3QsIHBhdGgsIGJhc2VIYXNJbik7XG4gICAgfVxuXG4gICAgdmFyIFVOT1JERVJFRF9DT01QQVJFX0ZMQUckMyA9IDE7XG4gICAgdmFyIFBBUlRJQUxfQ09NUEFSRV9GTEFHJDUgPSAyO1xuICAgIC8qKlxuICAgICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLm1hdGNoZXNQcm9wZXJ0eWAgd2hpY2ggZG9lc24ndCBjbG9uZSBgc3JjVmFsdWVgLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgcGF0aCBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICAgICAqIEBwYXJhbSB7Kn0gc3JjVmFsdWUgVGhlIHZhbHVlIHRvIG1hdGNoLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VNYXRjaGVzUHJvcGVydHkocGF0aCwgc3JjVmFsdWUpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgdmFyIG9ialZhbHVlID0gZ2V0KG9iamVjdCwgcGF0aCk7XG4gICAgICAgIHJldHVybiAob2JqVmFsdWUgPT09IHVuZGVmaW5lZCAmJiBvYmpWYWx1ZSA9PT0gc3JjVmFsdWUpXG4gICAgICAgICAgPyBoYXNJbihvYmplY3QsIHBhdGgpXG4gICAgICAgICAgOiBiYXNlSXNFcXVhbChzcmNWYWx1ZSwgb2JqVmFsdWUsIHVuZGVmaW5lZCwgVU5PUkRFUkVEX0NPTVBBUkVfRkxBRyQzIHwgUEFSVElBTF9DT01QQVJFX0ZMQUckNSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGZpcnN0IGFyZ3VtZW50IGdpdmVuIHRvIGl0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBzaW5jZSAwLjEuMFxuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIEFueSB2YWx1ZS5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyBgdmFsdWVgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgb2JqZWN0ID0geyAndXNlcic6ICdmcmVkJyB9O1xuICAgICAqXG4gICAgICogXy5pZGVudGl0eShvYmplY3QpID09PSBvYmplY3Q7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlUHJvcGVydHlgIHdoaWNoIHN1cHBvcnRzIGRlZXAgcGF0aHMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBwYXRoIFRoZSBwYXRoIG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZVByb3BlcnR5RGVlcChwYXRoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBiYXNlR2V0KG9iamVjdCwgcGF0aCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIHZhbHVlIGF0IGBwYXRoYCBvZiBhIGdpdmVuIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBzaW5jZSAyLjQuMFxuICAgICAqIEBjYXRlZ29yeSBVdGlsXG4gICAgICogQHBhcmFtIHtBcnJheXxzdHJpbmd9IHBhdGggVGhlIHBhdGggb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIG9iamVjdHMgPSBbXG4gICAgICogICB7ICdhJzogeyAnYic6IHsgJ2MnOiAyIH0gfSB9LFxuICAgICAqICAgeyAnYSc6IHsgJ2InOiB7ICdjJzogMSB9IH0gfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiBfLm1hcChvYmplY3RzLCBfLnByb3BlcnR5KCdhLmIuYycpKTtcbiAgICAgKiAvLyA9PiBbMiwgMV1cbiAgICAgKlxuICAgICAqIF8ubWFwKF8uc29ydEJ5KG9iamVjdHMsIF8ucHJvcGVydHkoWydhJywgJ2InLCAnYyddKSksICdhLmIuYycpO1xuICAgICAqIC8vID0+IFsxLCAyXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHByb3BlcnR5KHBhdGgpIHtcbiAgICAgIHJldHVybiBpc0tleShwYXRoKSA/IGJhc2VQcm9wZXJ0eShwYXRoKSA6IGJhc2VQcm9wZXJ0eURlZXAocGF0aCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXRlcmF0ZWVgLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0geyp9IFt2YWx1ZT1fLmlkZW50aXR5XSBUaGUgdmFsdWUgdG8gY29udmVydCB0byBhbiBpdGVyYXRlZS5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIGl0ZXJhdGVlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VJdGVyYXRlZSh2YWx1ZSkge1xuICAgICAgLy8gRG9uJ3Qgc3RvcmUgdGhlIGB0eXBlb2ZgIHJlc3VsdCBpbiBhIHZhcmlhYmxlIHRvIGF2b2lkIGEgSklUIGJ1ZyBpbiBTYWZhcmkgOS5cbiAgICAgIC8vIFNlZSBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTU2MDM0IGZvciBtb3JlIGRldGFpbHMuXG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGlkZW50aXR5O1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gaXNBcnJheSh2YWx1ZSlcbiAgICAgICAgICA/IGJhc2VNYXRjaGVzUHJvcGVydHkodmFsdWVbMF0sIHZhbHVlWzFdKVxuICAgICAgICAgIDogYmFzZU1hdGNoZXModmFsdWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByb3BlcnR5KHZhbHVlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlcyBvdmVyIG93biBlbnVtZXJhYmxlIHN0cmluZyBrZXllZCBwcm9wZXJ0aWVzIG9mIGFuIG9iamVjdCBpbnZva2luZ1xuICAgICAqIGBpdGVyYXRlZWAgZm9yIGVhY2ggcHJvcGVydHkuIFRoZSBpdGVyYXRlZSBpcyBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOlxuICAgICAqICh2YWx1ZSwga2V5LCBvYmplY3QpLiBJdGVyYXRlZSBmdW5jdGlvbnMgbWF5IGV4aXQgaXRlcmF0aW9uIGVhcmx5IGJ5XG4gICAgICogZXhwbGljaXRseSByZXR1cm5pbmcgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBzaW5jZSAwLjMuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIGZ1bmN0aW9uIEZvbygpIHtcbiAgICAgKiAgIHRoaXMuYSA9IDE7XG4gICAgICogICB0aGlzLmIgPSAyO1xuICAgICAqIH1cbiAgICAgKlxuICAgICAqIEZvby5wcm90b3R5cGUuYyA9IDM7XG4gICAgICpcbiAgICAgKiBfLmZvck93bihuZXcgRm9vLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICogICBjb25zb2xlLmxvZyhrZXkpO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IExvZ3MgJ2EnIHRoZW4gJ2InIChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZvck93bihvYmplY3QsIGl0ZXJhdGVlKSB7XG4gICAgICByZXR1cm4gb2JqZWN0ICYmIGJhc2VGb3JPd24ob2JqZWN0LCBiYXNlSXRlcmF0ZWUoaXRlcmF0ZWUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBgTmFOYCBpcyBmb3VuZCBpbiBgYXJyYXlgLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmcm9tSW5kZXggVGhlIGluZGV4IHRvIHNlYXJjaCBmcm9tLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2Zyb21SaWdodF0gU3BlY2lmeSBpdGVyYXRpbmcgZnJvbSByaWdodCB0byBsZWZ0LlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBtYXRjaGVkIGBOYU5gLCBlbHNlIGAtMWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW5kZXhPZk5hTihhcnJheSwgZnJvbUluZGV4LCBmcm9tUmlnaHQpIHtcbiAgICAgIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICAgICAgaW5kZXggPSBmcm9tSW5kZXggKyAoZnJvbVJpZ2h0ID8gMCA6IC0xKTtcblxuICAgICAgd2hpbGUgKChmcm9tUmlnaHQgPyBpbmRleC0tIDogKytpbmRleCA8IGxlbmd0aCkpIHtcbiAgICAgICAgdmFyIG90aGVyID0gYXJyYXlbaW5kZXhdO1xuICAgICAgICBpZiAob3RoZXIgIT09IG90aGVyKSB7XG4gICAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaW5kZXhPZmAgd2l0aG91dCBgZnJvbUluZGV4YCBib3VuZHMgY2hlY2tzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNlYXJjaCBmb3IuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGZyb21JbmRleCBUaGUgaW5kZXggdG8gc2VhcmNoIGZyb20uXG4gICAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoZWQgdmFsdWUsIGVsc2UgYC0xYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlSW5kZXhPZihhcnJheSwgdmFsdWUsIGZyb21JbmRleCkge1xuICAgICAgaWYgKHZhbHVlICE9PSB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gaW5kZXhPZk5hTihhcnJheSwgZnJvbUluZGV4KTtcbiAgICAgIH1cbiAgICAgIHZhciBpbmRleCA9IGZyb21JbmRleCAtIDEsXG4gICAgICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICBpZiAoYXJyYXlbaW5kZXhdID09PSB2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGF1dG8gKHRhc2tzLCBjb25jdXJyZW5jeSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25jdXJyZW5jeSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgLy8gY29uY3VycmVuY3kgaXMgb3B0aW9uYWwsIHNoaWZ0IHRoZSBhcmdzLlxuICAgICAgICAgICAgY2FsbGJhY2sgPSBjb25jdXJyZW5jeTtcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayA9IG9uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIHZhciBrZXlzJCQgPSBrZXlzKHRhc2tzKTtcbiAgICAgICAgdmFyIG51bVRhc2tzID0ga2V5cyQkLmxlbmd0aDtcbiAgICAgICAgaWYgKCFudW1UYXNrcykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5ID0gbnVtVGFza3M7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0cyA9IHt9O1xuICAgICAgICB2YXIgcnVubmluZ1Rhc2tzID0gMDtcbiAgICAgICAgdmFyIGhhc0Vycm9yID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHt9O1xuXG4gICAgICAgIHZhciByZWFkeVRhc2tzID0gW107XG5cbiAgICAgICAgZm9yT3duKHRhc2tzLCBmdW5jdGlvbiAodGFzaywga2V5KSB7XG4gICAgICAgICAgICBpZiAoIWlzQXJyYXkodGFzaykpIHtcbiAgICAgICAgICAgICAgICAvLyBubyBkZXBlbmRlbmNpZXNcbiAgICAgICAgICAgICAgICBlbnF1ZXVlVGFzayhrZXksIFt0YXNrXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZGVwZW5kZW5jaWVzID0gdGFzay5zbGljZSgwLCB0YXNrLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgdmFyIHJlbWFpbmluZ0RlcGVuZGVuY2llcyA9IGRlcGVuZGVuY2llcy5sZW5ndGg7XG5cbiAgICAgICAgICAgIGNoZWNrRm9yRGVhZGxvY2tzKCk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNoZWNrRm9yRGVhZGxvY2tzKCkge1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSBkZXBlbmRlbmNpZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciBkZXA7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGxlbi0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKGRlcCA9IHRhc2tzW2RlcGVuZGVuY2llc1tsZW5dXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignYXN5bmMuYXV0byB0YXNrIGAnICsga2V5ICsgJ2AgaGFzIG5vbi1leGlzdGVudCBkZXBlbmRlbmN5IGluICcgKyBkZXBlbmRlbmNpZXMuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkoZGVwKSAmJiBiYXNlSW5kZXhPZihkZXAsIGtleSwgMCkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhc3luYy5hdXRvIHRhc2sgYCcgKyBrZXkgKyAnYEhhcyBjeWNsaWMgZGVwZW5kZW5jaWVzJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFycmF5RWFjaChkZXBlbmRlbmNpZXMsIGZ1bmN0aW9uIChkZXBlbmRlbmN5TmFtZSkge1xuICAgICAgICAgICAgICAgIGFkZExpc3RlbmVyKGRlcGVuZGVuY3lOYW1lLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ0RlcGVuZGVuY2llcy0tO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVtYWluaW5nRGVwZW5kZW5jaWVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbnF1ZXVlVGFzayhrZXksIHRhc2spO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvY2Vzc1F1ZXVlKCk7XG5cbiAgICAgICAgZnVuY3Rpb24gZW5xdWV1ZVRhc2soa2V5LCB0YXNrKSB7XG4gICAgICAgICAgICByZWFkeVRhc2tzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJ1blRhc2soa2V5LCB0YXNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcHJvY2Vzc1F1ZXVlKCkge1xuICAgICAgICAgICAgaWYgKHJlYWR5VGFza3MubGVuZ3RoID09PSAwICYmIHJ1bm5pbmdUYXNrcyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChyZWFkeVRhc2tzLmxlbmd0aCAmJiBydW5uaW5nVGFza3MgPCBjb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgIHZhciBydW4gPSByZWFkeVRhc2tzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgcnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZGRMaXN0ZW5lcih0YXNrTmFtZSwgZm4pIHtcbiAgICAgICAgICAgIHZhciB0YXNrTGlzdGVuZXJzID0gbGlzdGVuZXJzW3Rhc2tOYW1lXTtcbiAgICAgICAgICAgIGlmICghdGFza0xpc3RlbmVycykge1xuICAgICAgICAgICAgICAgIHRhc2tMaXN0ZW5lcnMgPSBsaXN0ZW5lcnNbdGFza05hbWVdID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRhc2tMaXN0ZW5lcnMucHVzaChmbik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB0YXNrQ29tcGxldGUodGFza05hbWUpIHtcbiAgICAgICAgICAgIHZhciB0YXNrTGlzdGVuZXJzID0gbGlzdGVuZXJzW3Rhc2tOYW1lXSB8fCBbXTtcbiAgICAgICAgICAgIGFycmF5RWFjaCh0YXNrTGlzdGVuZXJzLCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBwcm9jZXNzUXVldWUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJ1blRhc2soa2V5LCB0YXNrKSB7XG4gICAgICAgICAgICBpZiAoaGFzRXJyb3IpIHJldHVybjtcblxuICAgICAgICAgICAgdmFyIHRhc2tDYWxsYmFjayA9IG9ubHlPbmNlKHJlc3QoZnVuY3Rpb24gKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIHJ1bm5pbmdUYXNrcy0tO1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzYWZlUmVzdWx0cyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBmb3JPd24ocmVzdWx0cywgZnVuY3Rpb24gKHZhbCwgcmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FmZVJlc3VsdHNbcmtleV0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1trZXldID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIsIHNhZmVSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzW2tleV0gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICB0YXNrQ29tcGxldGUoa2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJ1bm5pbmdUYXNrcysrO1xuICAgICAgICAgICAgdmFyIHRhc2tGbiA9IHRhc2tbdGFzay5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICh0YXNrLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICB0YXNrRm4ocmVzdWx0cywgdGFza0NhbGxiYWNrKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGFza0ZuKHRhc2tDYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb3BpZXMgdGhlIHZhbHVlcyBvZiBgc291cmNlYCB0byBgYXJyYXlgLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBzb3VyY2UgVGhlIGFycmF5IHRvIGNvcHkgdmFsdWVzIGZyb20uXG4gICAgICogQHBhcmFtIHtBcnJheX0gW2FycmF5PVtdXSBUaGUgYXJyYXkgdG8gY29weSB2YWx1ZXMgdG8uXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29weUFycmF5KHNvdXJjZSwgYXJyYXkpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IHNvdXJjZS5sZW5ndGg7XG5cbiAgICAgIGFycmF5IHx8IChhcnJheSA9IEFycmF5KGxlbmd0aCkpO1xuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgYXJyYXlbaW5kZXhdID0gc291cmNlW2luZGV4XTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICB2YXIgYXJnc1JlZ2V4ID0gL15mdW5jdGlvblxccypbXlxcKF0qXFwoXFxzKihbXlxcKV0qKVxcKS9tO1xuXG4gICAgZnVuY3Rpb24gcGFyc2VQYXJhbXMoZnVuYykge1xuICAgICAgICByZXR1cm4gZnVuYy50b1N0cmluZygpLm1hdGNoKGFyZ3NSZWdleClbMV0uc3BsaXQoL1xccypcXCxcXHMqLyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXV0b0luamVjdCh0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG5ld1Rhc2tzID0ge307XG5cbiAgICAgICAgZm9yT3duKHRhc2tzLCBmdW5jdGlvbiAodGFza0ZuLCBrZXkpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXM7XG5cbiAgICAgICAgICAgIGlmIChpc0FycmF5KHRhc2tGbikpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSBjb3B5QXJyYXkodGFza0ZuKTtcbiAgICAgICAgICAgICAgICB0YXNrRm4gPSBwYXJhbXMucG9wKCk7XG5cbiAgICAgICAgICAgICAgICBuZXdUYXNrc1trZXldID0gcGFyYW1zLmNvbmNhdChuZXdUYXNrKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFza0ZuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImF1dG9JbmplY3QgdGFzayBmdW5jdGlvbnMgcmVxdWlyZSBleHBsaWNpdCBwYXJhbWV0ZXJzLlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFza0ZuLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIG5vIGRlcGVuZGVuY2llcywgdXNlIHRoZSBmdW5jdGlvbiBhcy1pc1xuICAgICAgICAgICAgICAgIG5ld1Rhc2tzW2tleV0gPSB0YXNrRm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHBhcnNlUGFyYW1zKHRhc2tGbik7XG4gICAgICAgICAgICAgICAgcGFyYW1zLnBvcCgpO1xuXG4gICAgICAgICAgICAgICAgbmV3VGFza3Nba2V5XSA9IHBhcmFtcy5jb25jYXQobmV3VGFzayk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG5ld1Rhc2socmVzdWx0cywgdGFza0NiKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0FyZ3MgPSBhcnJheU1hcChwYXJhbXMsIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzW25hbWVdO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG5ld0FyZ3MucHVzaCh0YXNrQ2IpO1xuICAgICAgICAgICAgICAgIHRhc2tGbi5hcHBseShudWxsLCBuZXdBcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXV0byhuZXdUYXNrcywgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgdmFyIHBhcmFtcztcbiAgICAgICAgICAgIGlmIChpc0FycmF5KGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IGNvcHlBcnJheShjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBwYXJhbXMucG9wKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHBhcnNlUGFyYW1zKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBwYXJhbXMuc2hpZnQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFyYW1zID0gYXJyYXlNYXAocGFyYW1zLCBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzW25hbWVdO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHBhcmFtcy51bnNoaWZ0KGVycik7XG4gICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBwYXJhbXMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgX3NldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicgJiYgc2V0SW1tZWRpYXRlO1xuXG4gICAgdmFyIF9kZWZlcjtcbiAgICBpZiAoX3NldEltbWVkaWF0ZSkge1xuICAgICAgICBfZGVmZXIgPSBfc2V0SW1tZWRpYXRlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHByb2Nlc3MgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwcm9jZXNzLm5leHRUaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIF9kZWZlciA9IHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgX2RlZmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgc2V0SW1tZWRpYXRlJDEgPSByZXN0KGZ1bmN0aW9uIChmbiwgYXJncykge1xuICAgICAgICBfZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gcXVldWUod29ya2VyLCBjb25jdXJyZW5jeSwgcGF5bG9hZCkge1xuICAgICAgICBpZiAoY29uY3VycmVuY3kgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbmN1cnJlbmN5ID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmN1cnJlbmN5IG11c3Qgbm90IGJlIHplcm8nKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBfaW5zZXJ0KHEsIGRhdGEsIHBvcywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGFzayBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIWlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gW2RhdGFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoID09PSAwICYmIHEuaWRsZSgpKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbCBkcmFpbiBpbW1lZGlhdGVseSBpZiB0aGVyZSBhcmUgbm8gdGFza3NcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0SW1tZWRpYXRlJDEoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhcnJheUVhY2goZGF0YSwgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrIHx8IG5vb3BcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKHBvcykge1xuICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnVuc2hpZnQoaXRlbSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2V0SW1tZWRpYXRlJDEocS5wcm9jZXNzKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBfbmV4dChxLCB0YXNrcykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3b3JrZXJzIC09IDE7XG5cbiAgICAgICAgICAgICAgICB2YXIgcmVtb3ZlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIGFycmF5RWFjaCh0YXNrcywgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyYXlFYWNoKHdvcmtlcnNMaXN0LCBmdW5jdGlvbiAod29ya2VyLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmtlciA9PT0gdGFzayAmJiAhcmVtb3ZlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtlcnNMaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHRhc2suY2FsbGJhY2suYXBwbHkodGFzaywgYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAod29ya2VycyA8PSBxLmNvbmN1cnJlbmN5IC0gcS5idWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgcS51bnNhdHVyYXRlZCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCArIHdvcmtlcnMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBxLnByb2Nlc3MoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd29ya2VycyA9IDA7XG4gICAgICAgIHZhciB3b3JrZXJzTGlzdCA9IFtdO1xuICAgICAgICB2YXIgcSA9IHtcbiAgICAgICAgICAgIHRhc2tzOiBbXSxcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5OiBjb25jdXJyZW5jeSxcbiAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWQsXG4gICAgICAgICAgICBzYXR1cmF0ZWQ6IG5vb3AsXG4gICAgICAgICAgICB1bnNhdHVyYXRlZDogbm9vcCxcbiAgICAgICAgICAgIGJ1ZmZlcjogY29uY3VycmVuY3kgLyA0LFxuICAgICAgICAgICAgZW1wdHk6IG5vb3AsXG4gICAgICAgICAgICBkcmFpbjogbm9vcCxcbiAgICAgICAgICAgIHN0YXJ0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSxcbiAgICAgICAgICAgIHB1c2g6IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgZmFsc2UsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBraWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcS5kcmFpbiA9IG5vb3A7XG4gICAgICAgICAgICAgICAgcS50YXNrcyA9IFtdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuc2hpZnQ6IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAoIXEucGF1c2VkICYmIHdvcmtlcnMgPCBxLmNvbmN1cnJlbmN5ICYmIHEudGFza3MubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhc2tzID0gcS5wYXlsb2FkID8gcS50YXNrcy5zcGxpY2UoMCwgcS5wYXlsb2FkKSA6IHEudGFza3Muc3BsaWNlKDAsIHEudGFza3MubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGFycmF5TWFwKHRhc2tzLCBiYXNlUHJvcGVydHkoJ2RhdGEnKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgd29ya2VycyArPSAxO1xuICAgICAgICAgICAgICAgICAgICB3b3JrZXJzTGlzdC5wdXNoKHRhc2tzWzBdKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAod29ya2VycyA9PT0gcS5jb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcS5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYiA9IG9ubHlPbmNlKF9uZXh0KHEsIHRhc2tzKSk7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcihkYXRhLCBjYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxlbmd0aDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnRhc2tzLmxlbmd0aDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBydW5uaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmtlcnM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd29ya2Vyc0xpc3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2Vyc0xpc3Q7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWRsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnRhc2tzLmxlbmd0aCArIHdvcmtlcnMgPT09IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxLnBhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VtZUNvdW50ID0gTWF0aC5taW4ocS5jb25jdXJyZW5jeSwgcS50YXNrcy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIE5lZWQgdG8gY2FsbCBxLnByb2Nlc3Mgb25jZSBwZXIgY29uY3VycmVudFxuICAgICAgICAgICAgICAgIC8vIHdvcmtlciB0byBwcmVzZXJ2ZSBmdWxsIGNvbmN1cnJlbmN5IGFmdGVyIHBhdXNlXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdyA9IDE7IHcgPD0gcmVzdW1lQ291bnQ7IHcrKykge1xuICAgICAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGUkMShxLnByb2Nlc3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FyZ28od29ya2VyLCBwYXlsb2FkKSB7XG4gICAgICAgIHJldHVybiBxdWV1ZSh3b3JrZXIsIDEsIHBheWxvYWQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVhY2hPZkxpbWl0KG9iaiwgbGltaXQsIGl0ZXJhdGVlLCBjYikge1xuICAgICAgICBfZWFjaE9mTGltaXQobGltaXQpKG9iaiwgaXRlcmF0ZWUsIGNiKTtcbiAgICB9XG5cbiAgICB2YXIgZWFjaE9mU2VyaWVzID0gZG9MaW1pdChlYWNoT2ZMaW1pdCwgMSk7XG5cbiAgICBmdW5jdGlvbiByZWR1Y2UoYXJyLCBtZW1vLCBpdGVyYXRlZSwgY2IpIHtcbiAgICAgICAgZWFjaE9mU2VyaWVzKGFyciwgZnVuY3Rpb24gKHgsIGksIGNiKSB7XG4gICAgICAgICAgICBpdGVyYXRlZShtZW1vLCB4LCBmdW5jdGlvbiAoZXJyLCB2KSB7XG4gICAgICAgICAgICAgICAgbWVtbyA9IHY7XG4gICAgICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIsIG1lbW8pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXEoKSAvKiBmdW5jdGlvbnMuLi4gKi97XG4gICAgICAgIHZhciBmbnMgPSBhcmd1bWVudHM7XG4gICAgICAgIHJldHVybiByZXN0KGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciBjYiA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNiID0gbm9vcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVkdWNlKGZucywgYXJncywgZnVuY3Rpb24gKG5ld2FyZ3MsIGZuLCBjYikge1xuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIG5ld2FyZ3MuY29uY2F0KFtyZXN0KGZ1bmN0aW9uIChlcnIsIG5leHRhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKGVyciwgbmV4dGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pXSkpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgIGNiLmFwcGx5KHRoYXQsIFtlcnJdLmNvbmNhdChyZXN1bHRzKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIHJldmVyc2UgPSBBcnJheS5wcm90b3R5cGUucmV2ZXJzZTtcblxuICAgIGZ1bmN0aW9uIGNvbXBvc2UoKSAvKiBmdW5jdGlvbnMuLi4gKi97XG4gICAgICAgIHJldHVybiBzZXEuYXBwbHkobnVsbCwgcmV2ZXJzZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbmNhdCQxKGVhY2hmbiwgYXJyLCBmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgaW5kZXgsIGNiKSB7XG4gICAgICAgICAgICBmbih4LCBmdW5jdGlvbiAoZXJyLCB5KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh5IHx8IFtdKTtcbiAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIGVhY2hPZiA9IGRvTGltaXQoZWFjaE9mTGltaXQsIEluZmluaXR5KTtcblxuICAgIGZ1bmN0aW9uIGRvUGFyYWxsZWwoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdGVlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGVhY2hPZiwgb2JqLCBpdGVyYXRlZSwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBjb25jYXQgPSBkb1BhcmFsbGVsKGNvbmNhdCQxKTtcblxuICAgIGZ1bmN0aW9uIGRvU2VyaWVzKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRlZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihlYWNoT2ZTZXJpZXMsIG9iaiwgaXRlcmF0ZWUsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgY29uY2F0U2VyaWVzID0gZG9TZXJpZXMoY29uY2F0JDEpO1xuXG4gICAgdmFyIGNvbnN0YW50ID0gcmVzdChmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgIHZhciBhcmdzID0gW251bGxdLmNvbmNhdCh2YWx1ZXMpO1xuICAgICAgICByZXR1cm4gaW5pdGlhbFBhcmFtcyhmdW5jdGlvbiAoaWdub3JlZEFyZ3MsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gX2NyZWF0ZVRlc3RlcihlYWNoZm4sIGNoZWNrLCBnZXRSZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhcnIsIGxpbWl0LCBpdGVyYXRlZSwgY2IpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvbmUoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYihudWxsLCBnZXRSZXN1bHQoZmFsc2UpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIHdyYXBwZWRJdGVyYXRlZSh4LCBfLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmICghY2IpIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIGl0ZXJhdGVlKHgsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYiA9IGl0ZXJhdGVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoZWNrKHYpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IobnVsbCwgZ2V0UmVzdWx0KHRydWUsIHgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYiA9IGl0ZXJhdGVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMykge1xuICAgICAgICAgICAgICAgIGNiID0gY2IgfHwgbm9vcDtcbiAgICAgICAgICAgICAgICBlYWNoZm4oYXJyLCBsaW1pdCwgd3JhcHBlZEl0ZXJhdGVlLCBkb25lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2IgPSBpdGVyYXRlZTtcbiAgICAgICAgICAgICAgICBjYiA9IGNiIHx8IG5vb3A7XG4gICAgICAgICAgICAgICAgaXRlcmF0ZWUgPSBsaW1pdDtcbiAgICAgICAgICAgICAgICBlYWNoZm4oYXJyLCB3cmFwcGVkSXRlcmF0ZWUsIGRvbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9maW5kR2V0UmVzdWx0KHYsIHgpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuXG4gICAgdmFyIGRldGVjdCA9IF9jcmVhdGVUZXN0ZXIoZWFjaE9mLCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuXG4gICAgdmFyIGRldGVjdExpbWl0ID0gX2NyZWF0ZVRlc3RlcihlYWNoT2ZMaW1pdCwgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcblxuICAgIHZhciBkZXRlY3RTZXJpZXMgPSBfY3JlYXRlVGVzdGVyKGVhY2hPZlNlcmllcywgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcblxuICAgIGZ1bmN0aW9uIGNvbnNvbGVGdW5jKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHJlc3QoZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbcmVzdChmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZS5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb25zb2xlW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJheUVhY2goYXJncywgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlW25hbWVdKHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIGRpciA9IGNvbnNvbGVGdW5jKCdkaXInKTtcblxuICAgIGZ1bmN0aW9uIGR1cmluZyh0ZXN0LCBpdGVyYXRlZSwgY2IpIHtcbiAgICAgICAgY2IgPSBjYiB8fCBub29wO1xuXG4gICAgICAgIHZhciBuZXh0ID0gcmVzdChmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGNoZWNrKTtcbiAgICAgICAgICAgICAgICB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgY2hlY2sgPSBmdW5jdGlvbiAoZXJyLCB0cnV0aCkge1xuICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgICBpZiAoIXRydXRoKSByZXR1cm4gY2IobnVsbCk7XG4gICAgICAgICAgICBpdGVyYXRlZShuZXh0KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0ZXN0KGNoZWNrKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkb0R1cmluZyhpdGVyYXRlZSwgdGVzdCwgY2IpIHtcbiAgICAgICAgdmFyIGNhbGxzID0gMDtcblxuICAgICAgICBkdXJpbmcoZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgICAgICAgIGlmIChjYWxscysrIDwgMSkgcmV0dXJuIG5leHQobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGl0ZXJhdGVlLCBjYik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2hpbHN0KHRlc3QsIGl0ZXJhdGVlLCBjYikge1xuICAgICAgICBjYiA9IGNiIHx8IG5vb3A7XG4gICAgICAgIGlmICghdGVzdCgpKSByZXR1cm4gY2IobnVsbCk7XG4gICAgICAgIHZhciBuZXh0ID0gcmVzdChmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICAgIGlmICh0ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpKSByZXR1cm4gaXRlcmF0ZWUobmV4dCk7XG4gICAgICAgICAgICBjYi5hcHBseShudWxsLCBbbnVsbF0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0ZXJhdGVlKG5leHQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvV2hpbHN0KGl0ZXJhdGVlLCB0ZXN0LCBjYikge1xuICAgICAgICB2YXIgY2FsbHMgPSAwO1xuICAgICAgICByZXR1cm4gd2hpbHN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiArK2NhbGxzIDw9IDEgfHwgdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBpdGVyYXRlZSwgY2IpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvVW50aWwoaXRlcmF0ZWUsIHRlc3QsIGNiKSB7XG4gICAgICAgIHJldHVybiBkb1doaWxzdChpdGVyYXRlZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGNiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfd2l0aG91dEluZGV4KGl0ZXJhdGVlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdGVlKHZhbHVlLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZWFjaExpbWl0KGFyciwgbGltaXQsIGl0ZXJhdGVlLCBjYikge1xuICAgICAgICByZXR1cm4gX2VhY2hPZkxpbWl0KGxpbWl0KShhcnIsIF93aXRob3V0SW5kZXgoaXRlcmF0ZWUpLCBjYik7XG4gICAgfVxuXG4gICAgdmFyIGVhY2ggPSBkb0xpbWl0KGVhY2hMaW1pdCwgSW5maW5pdHkpO1xuXG4gICAgdmFyIGVhY2hTZXJpZXMgPSBkb0xpbWl0KGVhY2hMaW1pdCwgMSk7XG5cbiAgICBmdW5jdGlvbiBlbnN1cmVBc3luYyhmbikge1xuICAgICAgICByZXR1cm4gaW5pdGlhbFBhcmFtcyhmdW5jdGlvbiAoYXJncywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIGFyZ3MucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlubmVyQXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBpZiAoc3luYykge1xuICAgICAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGUkMShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBpbm5lckFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBpbm5lckFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICBzeW5jID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vdElkKHYpIHtcbiAgICAgICAgcmV0dXJuICF2O1xuICAgIH1cblxuICAgIHZhciBldmVyeUxpbWl0ID0gX2NyZWF0ZVRlc3RlcihlYWNoT2ZMaW1pdCwgbm90SWQsIG5vdElkKTtcblxuICAgIHZhciBldmVyeSA9IGRvTGltaXQoZXZlcnlMaW1pdCwgSW5maW5pdHkpO1xuXG4gICAgdmFyIGV2ZXJ5U2VyaWVzID0gZG9MaW1pdChldmVyeUxpbWl0LCAxKTtcblxuICAgIGZ1bmN0aW9uIF9maWx0ZXIoZWFjaGZuLCBhcnIsIGl0ZXJhdGVlLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRlZSh4LCBmdW5jdGlvbiAoZXJyLCB2KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBpbmRleDogaW5kZXgsIHZhbHVlOiB4IH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBhcnJheU1hcChyZXN1bHRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEuaW5kZXggLSBiLmluZGV4O1xuICAgICAgICAgICAgICAgIH0pLCBiYXNlUHJvcGVydHkoJ3ZhbHVlJykpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIGZpbHRlckxpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9maWx0ZXIpO1xuXG4gICAgdmFyIGZpbHRlciA9IGRvTGltaXQoZmlsdGVyTGltaXQsIEluZmluaXR5KTtcblxuICAgIHZhciBmaWx0ZXJTZXJpZXMgPSBkb0xpbWl0KGZpbHRlckxpbWl0LCAxKTtcblxuICAgIGZ1bmN0aW9uIGZvcmV2ZXIoZm4sIGNiKSB7XG4gICAgICAgIHZhciBkb25lID0gb25seU9uY2UoY2IgfHwgbm9vcCk7XG4gICAgICAgIHZhciB0YXNrID0gZW5zdXJlQXN5bmMoZm4pO1xuXG4gICAgICAgIGZ1bmN0aW9uIG5leHQoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gZG9uZShlcnIpO1xuICAgICAgICAgICAgdGFzayhuZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXRlcmF0b3IkMSAodGFza3MpIHtcbiAgICAgICAgZnVuY3Rpb24gbWFrZUNhbGxiYWNrKGluZGV4KSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBmbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2tzW2luZGV4XS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm4ubmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm4ubmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXggPCB0YXNrcy5sZW5ndGggLSAxID8gbWFrZUNhbGxiYWNrKGluZGV4ICsgMSkgOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBmbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFrZUNhbGxiYWNrKDApO1xuICAgIH1cblxuICAgIHZhciBsb2cgPSBjb25zb2xlRnVuYygnbG9nJyk7XG5cbiAgICBmdW5jdGlvbiBoYXMob2JqLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIGtleSBpbiBvYmo7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVtb2l6ZSQxKGZuLCBoYXNoZXIpIHtcbiAgICAgICAgdmFyIG1lbW8gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICB2YXIgcXVldWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgaGFzaGVyID0gaGFzaGVyIHx8IGlkZW50aXR5O1xuICAgICAgICB2YXIgbWVtb2l6ZWQgPSBpbml0aWFsUGFyYW1zKGZ1bmN0aW9uIG1lbW9pemVkKGFyZ3MsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgaWYgKGhhcyhtZW1vLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlJDEoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBtZW1vW2tleV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChoYXMocXVldWVzLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgcXVldWVzW2tleV0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHF1ZXVlc1trZXldID0gW2NhbGxiYWNrXTtcbiAgICAgICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbcmVzdChmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgICAgICBtZW1vW2tleV0gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcSA9IHF1ZXVlc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcXVldWVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHFbaV0uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG1lbW9pemVkLm1lbW8gPSBtZW1vO1xuICAgICAgICBtZW1vaXplZC51bm1lbW9pemVkID0gZm47XG4gICAgICAgIHJldHVybiBtZW1vaXplZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcGFyYWxsZWwoZWFjaGZuLCB0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuICAgICAgICB2YXIgcmVzdWx0cyA9IGlzQXJyYXlMaWtlKHRhc2tzKSA/IFtdIDoge307XG5cbiAgICAgICAgZWFjaGZuKHRhc2tzLCBmdW5jdGlvbiAodGFzaywga2V5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdGFzayhyZXN0KGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0c1trZXldID0gYXJncztcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJhbGxlbExpbWl0KHRhc2tzLCBsaW1pdCwgY2IpIHtcbiAgICAgICAgcmV0dXJuIF9wYXJhbGxlbChfZWFjaE9mTGltaXQobGltaXQpLCB0YXNrcywgY2IpO1xuICAgIH1cblxuICAgIHZhciBwYXJhbGxlbCA9IGRvTGltaXQocGFyYWxsZWxMaW1pdCwgSW5maW5pdHkpO1xuXG4gICAgZnVuY3Rpb24gcXVldWUkMSAod29ya2VyLCBjb25jdXJyZW5jeSkge1xuICAgICAgICByZXR1cm4gcXVldWUoZnVuY3Rpb24gKGl0ZW1zLCBjYikge1xuICAgICAgICAgICAgd29ya2VyKGl0ZW1zWzBdLCBjYik7XG4gICAgICAgIH0sIGNvbmN1cnJlbmN5LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmlvcml0eVF1ZXVlICh3b3JrZXIsIGNvbmN1cnJlbmN5KSB7XG4gICAgICAgIGZ1bmN0aW9uIF9jb21wYXJlVGFza3MoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2JpbmFyeVNlYXJjaChzZXF1ZW5jZSwgaXRlbSwgY29tcGFyZSkge1xuICAgICAgICAgICAgdmFyIGJlZyA9IC0xLFxuICAgICAgICAgICAgICAgIGVuZCA9IHNlcXVlbmNlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB3aGlsZSAoYmVnIDwgZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZCA9IGJlZyArIChlbmQgLSBiZWcgKyAxID4+PiAxKTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGFyZShpdGVtLCBzZXF1ZW5jZVttaWRdKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlZyA9IG1pZDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbmQgPSBtaWQgLSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBiZWc7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwgJiYgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0YXNrIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcS5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBbZGF0YV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsIGRyYWluIGltbWVkaWF0ZWx5IGlmIHRoZXJlIGFyZSBubyB0YXNrc1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXRJbW1lZGlhdGUkMShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFycmF5RWFjaChkYXRhLCBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0YXNrLFxuICAgICAgICAgICAgICAgICAgICBwcmlvcml0eTogcHJpb3JpdHksXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBjYWxsYmFjayA6IG5vb3BcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoX2JpbmFyeVNlYXJjaChxLnRhc2tzLCBpdGVtLCBfY29tcGFyZVRhc2tzKSArIDEsIDAsIGl0ZW0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSBxLmNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA8PSBxLmNvbmN1cnJlbmN5IC0gcS5idWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgcS51bnNhdHVyYXRlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGUkMShxLnByb2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGFydCB3aXRoIGEgbm9ybWFsIHF1ZXVlXG4gICAgICAgIHZhciBxID0gcXVldWUkMSh3b3JrZXIsIGNvbmN1cnJlbmN5KTtcblxuICAgICAgICAvLyBPdmVycmlkZSBwdXNoIHRvIGFjY2VwdCBzZWNvbmQgcGFyYW1ldGVyIHJlcHJlc2VudGluZyBwcmlvcml0eVxuICAgICAgICBxLnB1c2ggPSBmdW5jdGlvbiAoZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjayk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmVtb3ZlIHVuc2hpZnQgZnVuY3Rpb25cbiAgICAgICAgZGVsZXRlIHEudW5zaGlmdDtcblxuICAgICAgICByZXR1cm4gcTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYGJhc2VFYWNoYCBvciBgYmFzZUVhY2hSaWdodGAgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGVhY2hGdW5jIFRoZSBmdW5jdGlvbiB0byBpdGVyYXRlIG92ZXIgYSBjb2xsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2Zyb21SaWdodF0gU3BlY2lmeSBpdGVyYXRpbmcgZnJvbSByaWdodCB0byBsZWZ0LlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGJhc2UgZnVuY3Rpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY3JlYXRlQmFzZUVhY2goZWFjaEZ1bmMsIGZyb21SaWdodCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKSB7XG4gICAgICAgIGlmIChjb2xsZWN0aW9uID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzQXJyYXlMaWtlKGNvbGxlY3Rpb24pKSB7XG4gICAgICAgICAgcmV0dXJuIGVhY2hGdW5jKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGVuZ3RoID0gY29sbGVjdGlvbi5sZW5ndGgsXG4gICAgICAgICAgICBpbmRleCA9IGZyb21SaWdodCA/IGxlbmd0aCA6IC0xLFxuICAgICAgICAgICAgaXRlcmFibGUgPSBPYmplY3QoY29sbGVjdGlvbik7XG5cbiAgICAgICAgd2hpbGUgKChmcm9tUmlnaHQgPyBpbmRleC0tIDogKytpbmRleCA8IGxlbmd0aCkpIHtcbiAgICAgICAgICBpZiAoaXRlcmF0ZWUoaXRlcmFibGVbaW5kZXhdLCBpbmRleCwgaXRlcmFibGUpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mb3JFYWNoYCB3aXRob3V0IHN1cHBvcnQgZm9yIGl0ZXJhdGVlIHNob3J0aGFuZHMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R9IFJldHVybnMgYGNvbGxlY3Rpb25gLlxuICAgICAqL1xuICAgIHZhciBiYXNlRWFjaCA9IGNyZWF0ZUJhc2VFYWNoKGJhc2VGb3JPd24pO1xuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBgY29sbGVjdGlvbmAgaW52b2tpbmcgYGl0ZXJhdGVlYCBmb3IgZWFjaCBlbGVtZW50LlxuICAgICAqIFRoZSBpdGVyYXRlZSBpcyBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOiAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuXG4gICAgICogSXRlcmF0ZWUgZnVuY3Rpb25zIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseSBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICAgICAqXG4gICAgICogKipOb3RlOioqIEFzIHdpdGggb3RoZXIgXCJDb2xsZWN0aW9uc1wiIG1ldGhvZHMsIG9iamVjdHMgd2l0aCBhIFwibGVuZ3RoXCJcbiAgICAgKiBwcm9wZXJ0eSBhcmUgaXRlcmF0ZWQgbGlrZSBhcnJheXMuIFRvIGF2b2lkIHRoaXMgYmVoYXZpb3IgdXNlIGBfLmZvckluYFxuICAgICAqIG9yIGBfLmZvck93bmAgZm9yIG9iamVjdCBpdGVyYXRpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAc2luY2UgMC4xLjBcbiAgICAgKiBAYWxpYXMgZWFjaFxuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R9IFJldHVybnMgYGNvbGxlY3Rpb25gLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfKFsxLCAyXSkuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAqICAgY29uc29sZS5sb2codmFsdWUpO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IExvZ3MgYDFgIHRoZW4gYDJgLlxuICAgICAqXG4gICAgICogXy5mb3JFYWNoKHsgJ2EnOiAxLCAnYic6IDIgfSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAqICAgY29uc29sZS5sb2coa2V5KTtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiBMb2dzICdhJyB0aGVuICdiJyAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmb3JFYWNoKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKSB7XG4gICAgICByZXR1cm4gKHR5cGVvZiBpdGVyYXRlZSA9PSAnZnVuY3Rpb24nICYmIGlzQXJyYXkoY29sbGVjdGlvbikpXG4gICAgICAgID8gYXJyYXlFYWNoKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKVxuICAgICAgICA6IGJhc2VFYWNoKGNvbGxlY3Rpb24sIGJhc2VJdGVyYXRlZShpdGVyYXRlZSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJhY2UodGFza3MsIGNiKSB7XG4gICAgICAgIGNiID0gb25jZShjYiB8fCBub29wKTtcbiAgICAgICAgaWYgKCFpc0FycmF5KHRhc2tzKSkgcmV0dXJuIGNiKG5ldyBUeXBlRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IHRvIHJhY2UgbXVzdCBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMnKSk7XG4gICAgICAgIGlmICghdGFza3MubGVuZ3RoKSByZXR1cm4gY2IoKTtcbiAgICAgICAgZm9yRWFjaCh0YXNrcywgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgIHRhc2soY2IpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbiAgICBmdW5jdGlvbiByZWR1Y2VSaWdodChhcnIsIG1lbW8sIGl0ZXJhdGVlLCBjYikge1xuICAgICAgICB2YXIgcmV2ZXJzZWQgPSBzbGljZS5jYWxsKGFycikucmV2ZXJzZSgpO1xuICAgICAgICByZWR1Y2UocmV2ZXJzZWQsIG1lbW8sIGl0ZXJhdGVlLCBjYik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVmbGVjdChmbikge1xuICAgICAgICByZXR1cm4gaW5pdGlhbFBhcmFtcyhmdW5jdGlvbiByZWZsZWN0T24oYXJncywgcmVmbGVjdENhbGxiYWNrKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2gocmVzdChmdW5jdGlvbiBjYWxsYmFjayhlcnIsIGNiQXJncykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVmbGVjdENhbGxiYWNrKG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNiQXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2JBcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNiQXJncy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNiQXJncztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZWZsZWN0Q2FsbGJhY2sobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWplY3QkMShlYWNoZm4sIGFyciwgaXRlcmF0ZWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9maWx0ZXIoZWFjaGZuLCBhcnIsIGZ1bmN0aW9uICh2YWx1ZSwgY2IpIHtcbiAgICAgICAgICAgIGl0ZXJhdGVlKHZhbHVlLCBmdW5jdGlvbiAoZXJyLCB2KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKG51bGwsICF2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIHZhciByZWplY3RMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChyZWplY3QkMSk7XG5cbiAgICB2YXIgcmVqZWN0ID0gZG9MaW1pdChyZWplY3RMaW1pdCwgSW5maW5pdHkpO1xuXG4gICAgZnVuY3Rpb24gcmVmbGVjdEFsbCh0YXNrcykge1xuICAgICAgICByZXR1cm4gdGFza3MubWFwKHJlZmxlY3QpO1xuICAgIH1cblxuICAgIHZhciByZWplY3RTZXJpZXMgPSBkb0xpbWl0KHJlamVjdExpbWl0LCAxKTtcblxuICAgIGZ1bmN0aW9uIHNlcmllcyh0YXNrcywgY2IpIHtcbiAgICAgICAgcmV0dXJuIF9wYXJhbGxlbChlYWNoT2ZTZXJpZXMsIHRhc2tzLCBjYik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmV0cnkodGltZXMsIHRhc2ssIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBERUZBVUxUX1RJTUVTID0gNTtcbiAgICAgICAgdmFyIERFRkFVTFRfSU5URVJWQUwgPSAwO1xuXG4gICAgICAgIHZhciBvcHRzID0ge1xuICAgICAgICAgICAgdGltZXM6IERFRkFVTFRfVElNRVMsXG4gICAgICAgICAgICBpbnRlcnZhbDogREVGQVVMVF9JTlRFUlZBTFxuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlVGltZXMoYWNjLCB0KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgYWNjLnRpbWVzID0gK3QudGltZXMgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgICAgICAgICBhY2MuaW50ZXJ2YWwgPSArdC5pbnRlcnZhbCB8fCBERUZBVUxUX0lOVEVSVkFMO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgYWNjLnRpbWVzID0gK3QgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBhcmd1bWVudHMgZm9yIGFzeW5jLnJldHJ5XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzICYmIHR5cGVvZiB0aW1lcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSB0YXNrIHx8IG5vb3A7XG4gICAgICAgICAgICB0YXNrID0gdGltZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJzZVRpbWVzKG9wdHMsIHRpbWVzKTtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdGFzayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBhcmd1bWVudHMgZm9yIGFzeW5jLnJldHJ5XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGF0dGVtcHRzID0gW107XG4gICAgICAgIHdoaWxlIChvcHRzLnRpbWVzKSB7XG4gICAgICAgICAgICB2YXIgaXNGaW5hbEF0dGVtcHQgPSAhKG9wdHMudGltZXMgLT0gMSk7XG4gICAgICAgICAgICBhdHRlbXB0cy5wdXNoKHJldHJ5QXR0ZW1wdChpc0ZpbmFsQXR0ZW1wdCkpO1xuICAgICAgICAgICAgaWYgKCFpc0ZpbmFsQXR0ZW1wdCAmJiBvcHRzLmludGVydmFsID4gMCkge1xuICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlJbnRlcnZhbChvcHRzLmludGVydmFsKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzZXJpZXMoYXR0ZW1wdHMsIGZ1bmN0aW9uIChkb25lLCBkYXRhKSB7XG4gICAgICAgICAgICBkYXRhID0gZGF0YVtkYXRhLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YS5lcnIsIGRhdGEucmVzdWx0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gcmV0cnlBdHRlbXB0KGlzRmluYWxBdHRlbXB0KSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHNlcmllc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGFzayhmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VyaWVzQ2FsbGJhY2soIWVyciB8fCBpc0ZpbmFsQXR0ZW1wdCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyOiBlcnIsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHJlc3VsdFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZXRyeUludGVydmFsKGludGVydmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHNlcmllc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgIH0sIGludGVydmFsKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXRyeWFibGUgKG9wdHMsIHRhc2spIHtcbiAgICAgICAgaWYgKCF0YXNrKSB7XG4gICAgICAgICAgICB0YXNrID0gb3B0cztcbiAgICAgICAgICAgIG9wdHMgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbml0aWFsUGFyYW1zKGZ1bmN0aW9uIChhcmdzLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgZnVuY3Rpb24gdGFza0ZuKGNiKSB7XG4gICAgICAgICAgICAgICAgdGFzay5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbY2JdKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRzKSByZXRyeShvcHRzLCB0YXNrRm4sIGNhbGxiYWNrKTtlbHNlIHJldHJ5KHRhc2tGbiwgY2FsbGJhY2spO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgc29tZUxpbWl0ID0gX2NyZWF0ZVRlc3RlcihlYWNoT2ZMaW1pdCwgQm9vbGVhbiwgaWRlbnRpdHkpO1xuXG4gICAgdmFyIHNvbWUgPSBkb0xpbWl0KHNvbWVMaW1pdCwgSW5maW5pdHkpO1xuXG4gICAgdmFyIHNvbWVTZXJpZXMgPSBkb0xpbWl0KHNvbWVMaW1pdCwgMSk7XG5cbiAgICBmdW5jdGlvbiBzb3J0QnkoYXJyLCBpdGVyYXRlZSwgY2IpIHtcbiAgICAgICAgbWFwKGFyciwgZnVuY3Rpb24gKHgsIGNiKSB7XG4gICAgICAgICAgICBpdGVyYXRlZSh4LCBmdW5jdGlvbiAoZXJyLCBjcml0ZXJpYSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgICAgICAgIGNiKG51bGwsIHsgdmFsdWU6IHgsIGNyaXRlcmlhOiBjcml0ZXJpYSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCByZXN1bHRzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICAgIGNiKG51bGwsIGFycmF5TWFwKHJlc3VsdHMuc29ydChjb21wYXJhdG9yKSwgYmFzZVByb3BlcnR5KCd2YWx1ZScpKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXBhcmF0b3IobGVmdCwgcmlnaHQpIHtcbiAgICAgICAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYSxcbiAgICAgICAgICAgICAgICBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICAgICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0aW1lb3V0KGFzeW5jRm4sIG1pbGlzZWNvbmRzLCBpbmZvKSB7XG4gICAgICAgIHZhciBvcmlnaW5hbENhbGxiYWNrLCB0aW1lcjtcbiAgICAgICAgdmFyIHRpbWVkT3V0ID0gZmFsc2U7XG5cbiAgICAgICAgZnVuY3Rpb24gaW5qZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgICAgIGlmICghdGltZWRPdXQpIHtcbiAgICAgICAgICAgICAgICBvcmlnaW5hbENhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRpbWVvdXRDYWxsYmFjaygpIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gYXN5bmNGbi5uYW1lIHx8ICdhbm9ueW1vdXMnO1xuICAgICAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKCdDYWxsYmFjayBmdW5jdGlvbiBcIicgKyBuYW1lICsgJ1wiIHRpbWVkIG91dC4nKTtcbiAgICAgICAgICAgIGVycm9yLmNvZGUgPSAnRVRJTUVET1VUJztcbiAgICAgICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICAgICAgZXJyb3IuaW5mbyA9IGluZm87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aW1lZE91dCA9IHRydWU7XG4gICAgICAgICAgICBvcmlnaW5hbENhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbml0aWFsUGFyYW1zKGZ1bmN0aW9uIChhcmdzLCBvcmlnQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQ2FsbGJhY2sgPSBvcmlnQ2FsbGJhY2s7XG4gICAgICAgICAgICAvLyBzZXR1cCB0aW1lciBhbmQgY2FsbCBvcmlnaW5hbCBmdW5jdGlvblxuICAgICAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KHRpbWVvdXRDYWxsYmFjaywgbWlsaXNlY29uZHMpO1xuICAgICAgICAgICAgYXN5bmNGbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChpbmplY3RlZENhbGxiYWNrKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbiAgICB2YXIgbmF0aXZlQ2VpbCA9IE1hdGguY2VpbDtcbiAgICB2YXIgbmF0aXZlTWF4JDEgPSBNYXRoLm1heDtcbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5yYW5nZWAgYW5kIGBfLnJhbmdlUmlnaHRgIHdoaWNoIGRvZXNuJ3RcbiAgICAgKiBjb2VyY2UgYXJndW1lbnRzIHRvIG51bWJlcnMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBUaGUgc3RhcnQgb2YgdGhlIHJhbmdlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBlbmQgVGhlIGVuZCBvZiB0aGUgcmFuZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0ZXAgVGhlIHZhbHVlIHRvIGluY3JlbWVudCBvciBkZWNyZW1lbnQgYnkuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbZnJvbVJpZ2h0XSBTcGVjaWZ5IGl0ZXJhdGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgYXJyYXkgb2YgbnVtYmVycy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlUmFuZ2Uoc3RhcnQsIGVuZCwgc3RlcCwgZnJvbVJpZ2h0KSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBuYXRpdmVNYXgkMShuYXRpdmVDZWlsKChlbmQgLSBzdGFydCkgLyAoc3RlcCB8fCAxKSksIDApLFxuICAgICAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICByZXN1bHRbZnJvbVJpZ2h0ID8gbGVuZ3RoIDogKytpbmRleF0gPSBzdGFydDtcbiAgICAgICAgc3RhcnQgKz0gc3RlcDtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGltZUxpbWl0KGNvdW50LCBsaW1pdCwgaXRlcmF0ZWUsIGNiKSB7XG4gICAgICAgIHJldHVybiBtYXBMaW1pdChiYXNlUmFuZ2UoMCwgY291bnQsIDEpLCBsaW1pdCwgaXRlcmF0ZWUsIGNiKTtcbiAgICB9XG5cbiAgICB2YXIgdGltZXMgPSBkb0xpbWl0KHRpbWVMaW1pdCwgSW5maW5pdHkpO1xuXG4gICAgdmFyIHRpbWVzU2VyaWVzID0gZG9MaW1pdCh0aW1lTGltaXQsIDEpO1xuXG4gICAgZnVuY3Rpb24gdHJhbnNmb3JtKGFyciwgbWVtbywgaXRlcmF0ZWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGl0ZXJhdGVlO1xuICAgICAgICAgICAgaXRlcmF0ZWUgPSBtZW1vO1xuICAgICAgICAgICAgbWVtbyA9IGlzQXJyYXkoYXJyKSA/IFtdIDoge307XG4gICAgICAgIH1cblxuICAgICAgICBlYWNoT2YoYXJyLCBmdW5jdGlvbiAodiwgaywgY2IpIHtcbiAgICAgICAgICAgIGl0ZXJhdGVlKG1lbW8sIHYsIGssIGNiKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBtZW1vKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5tZW1vaXplKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKGZuLnVubWVtb2l6ZWQgfHwgZm4pLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW50aWwodGVzdCwgaXRlcmF0ZWUsIGNiKSB7XG4gICAgICAgIHJldHVybiB3aGlsc3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGl0ZXJhdGVlLCBjYik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2F0ZXJmYWxsICh0YXNrcywgY2IpIHtcbiAgICAgICAgY2IgPSBvbmNlKGNiIHx8IG5vb3ApO1xuICAgICAgICBpZiAoIWlzQXJyYXkodGFza3MpKSByZXR1cm4gY2IobmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byB3YXRlcmZhbGwgbXVzdCBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMnKSk7XG4gICAgICAgIGlmICghdGFza3MubGVuZ3RoKSByZXR1cm4gY2IoKTtcbiAgICAgICAgdmFyIHRhc2tJbmRleCA9IDA7XG5cbiAgICAgICAgZnVuY3Rpb24gbmV4dFRhc2soYXJncykge1xuICAgICAgICAgICAgaWYgKHRhc2tJbmRleCA9PT0gdGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiLmFwcGx5KG51bGwsIFtudWxsXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGFza0NhbGxiYWNrID0gb25seU9uY2UocmVzdChmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IuYXBwbHkobnVsbCwgW2Vycl0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV4dFRhc2soYXJncyk7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGFyZ3MucHVzaCh0YXNrQ2FsbGJhY2spO1xuXG4gICAgICAgICAgICB2YXIgdGFzayA9IHRhc2tzW3Rhc2tJbmRleCsrXTtcbiAgICAgICAgICAgIHRhc2suYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgIH1cblxuICAgICAgICBuZXh0VGFzayhbXSk7XG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0ge1xuICAgICAgICBhcHBseUVhY2g6IGFwcGx5RWFjaCxcbiAgICAgICAgYXBwbHlFYWNoU2VyaWVzOiBhcHBseUVhY2hTZXJpZXMsXG4gICAgICAgIGFwcGx5OiBhcHBseSQxLFxuICAgICAgICBhc3luY2lmeTogYXN5bmNpZnksXG4gICAgICAgIGF1dG86IGF1dG8sXG4gICAgICAgIGF1dG9JbmplY3Q6IGF1dG9JbmplY3QsXG4gICAgICAgIGNhcmdvOiBjYXJnbyxcbiAgICAgICAgY29tcG9zZTogY29tcG9zZSxcbiAgICAgICAgY29uY2F0OiBjb25jYXQsXG4gICAgICAgIGNvbmNhdFNlcmllczogY29uY2F0U2VyaWVzLFxuICAgICAgICBjb25zdGFudDogY29uc3RhbnQsXG4gICAgICAgIGRldGVjdDogZGV0ZWN0LFxuICAgICAgICBkZXRlY3RMaW1pdDogZGV0ZWN0TGltaXQsXG4gICAgICAgIGRldGVjdFNlcmllczogZGV0ZWN0U2VyaWVzLFxuICAgICAgICBkaXI6IGRpcixcbiAgICAgICAgZG9EdXJpbmc6IGRvRHVyaW5nLFxuICAgICAgICBkb1VudGlsOiBkb1VudGlsLFxuICAgICAgICBkb1doaWxzdDogZG9XaGlsc3QsXG4gICAgICAgIGR1cmluZzogZHVyaW5nLFxuICAgICAgICBlYWNoOiBlYWNoLFxuICAgICAgICBlYWNoTGltaXQ6IGVhY2hMaW1pdCxcbiAgICAgICAgZWFjaE9mOiBlYWNoT2YsXG4gICAgICAgIGVhY2hPZkxpbWl0OiBlYWNoT2ZMaW1pdCxcbiAgICAgICAgZWFjaE9mU2VyaWVzOiBlYWNoT2ZTZXJpZXMsXG4gICAgICAgIGVhY2hTZXJpZXM6IGVhY2hTZXJpZXMsXG4gICAgICAgIGVuc3VyZUFzeW5jOiBlbnN1cmVBc3luYyxcbiAgICAgICAgZXZlcnk6IGV2ZXJ5LFxuICAgICAgICBldmVyeUxpbWl0OiBldmVyeUxpbWl0LFxuICAgICAgICBldmVyeVNlcmllczogZXZlcnlTZXJpZXMsXG4gICAgICAgIGZpbHRlcjogZmlsdGVyLFxuICAgICAgICBmaWx0ZXJMaW1pdDogZmlsdGVyTGltaXQsXG4gICAgICAgIGZpbHRlclNlcmllczogZmlsdGVyU2VyaWVzLFxuICAgICAgICBmb3JldmVyOiBmb3JldmVyLFxuICAgICAgICBpdGVyYXRvcjogaXRlcmF0b3IkMSxcbiAgICAgICAgbG9nOiBsb2csXG4gICAgICAgIG1hcDogbWFwLFxuICAgICAgICBtYXBMaW1pdDogbWFwTGltaXQsXG4gICAgICAgIG1hcFNlcmllczogbWFwU2VyaWVzLFxuICAgICAgICBtZW1vaXplOiBtZW1vaXplJDEsXG4gICAgICAgIG5leHRUaWNrOiBzZXRJbW1lZGlhdGUkMSxcbiAgICAgICAgcGFyYWxsZWw6IHBhcmFsbGVsLFxuICAgICAgICBwYXJhbGxlbExpbWl0OiBwYXJhbGxlbExpbWl0LFxuICAgICAgICBwcmlvcml0eVF1ZXVlOiBwcmlvcml0eVF1ZXVlLFxuICAgICAgICBxdWV1ZTogcXVldWUkMSxcbiAgICAgICAgcmFjZTogcmFjZSxcbiAgICAgICAgcmVkdWNlOiByZWR1Y2UsXG4gICAgICAgIHJlZHVjZVJpZ2h0OiByZWR1Y2VSaWdodCxcbiAgICAgICAgcmVmbGVjdDogcmVmbGVjdCxcbiAgICAgICAgcmVmbGVjdEFsbDogcmVmbGVjdEFsbCxcbiAgICAgICAgcmVqZWN0OiByZWplY3QsXG4gICAgICAgIHJlamVjdExpbWl0OiByZWplY3RMaW1pdCxcbiAgICAgICAgcmVqZWN0U2VyaWVzOiByZWplY3RTZXJpZXMsXG4gICAgICAgIHJldHJ5OiByZXRyeSxcbiAgICAgICAgcmV0cnlhYmxlOiByZXRyeWFibGUsXG4gICAgICAgIHNlcTogc2VxLFxuICAgICAgICBzZXJpZXM6IHNlcmllcyxcbiAgICAgICAgc2V0SW1tZWRpYXRlOiBzZXRJbW1lZGlhdGUkMSxcbiAgICAgICAgc29tZTogc29tZSxcbiAgICAgICAgc29tZUxpbWl0OiBzb21lTGltaXQsXG4gICAgICAgIHNvbWVTZXJpZXM6IHNvbWVTZXJpZXMsXG4gICAgICAgIHNvcnRCeTogc29ydEJ5LFxuICAgICAgICB0aW1lb3V0OiB0aW1lb3V0LFxuICAgICAgICB0aW1lczogdGltZXMsXG4gICAgICAgIHRpbWVzTGltaXQ6IHRpbWVMaW1pdCxcbiAgICAgICAgdGltZXNTZXJpZXM6IHRpbWVzU2VyaWVzLFxuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zZm9ybSxcbiAgICAgICAgdW5tZW1vaXplOiB1bm1lbW9pemUsXG4gICAgICAgIHVudGlsOiB1bnRpbCxcbiAgICAgICAgd2F0ZXJmYWxsOiB3YXRlcmZhbGwsXG4gICAgICAgIHdoaWxzdDogd2hpbHN0LFxuXG4gICAgICAgIC8vIGFsaWFzZXNcbiAgICAgICAgYWxsOiBldmVyeSxcbiAgICAgICAgYW55OiBzb21lLFxuICAgICAgICBmb3JFYWNoOiBlYWNoLFxuICAgICAgICBmb3JFYWNoU2VyaWVzOiBlYWNoU2VyaWVzLFxuICAgICAgICBmb3JFYWNoTGltaXQ6IGVhY2hMaW1pdCxcbiAgICAgICAgZm9yRWFjaE9mOiBlYWNoT2YsXG4gICAgICAgIGZvckVhY2hPZlNlcmllczogZWFjaE9mU2VyaWVzLFxuICAgICAgICBmb3JFYWNoT2ZMaW1pdDogZWFjaE9mTGltaXQsXG4gICAgICAgIGluamVjdDogcmVkdWNlLFxuICAgICAgICBmb2xkbDogcmVkdWNlLFxuICAgICAgICBmb2xkcjogcmVkdWNlUmlnaHQsXG4gICAgICAgIHNlbGVjdDogZmlsdGVyLFxuICAgICAgICBzZWxlY3RMaW1pdDogZmlsdGVyTGltaXQsXG4gICAgICAgIHNlbGVjdFNlcmllczogZmlsdGVyU2VyaWVzLFxuICAgICAgICB3cmFwU3luYzogYXN5bmNpZnlcbiAgICB9O1xuXG4gICAgZXhwb3J0c1snZGVmYXVsdCddID0gaW5kZXg7XG4gICAgZXhwb3J0cy5hcHBseUVhY2ggPSBhcHBseUVhY2g7XG4gICAgZXhwb3J0cy5hcHBseUVhY2hTZXJpZXMgPSBhcHBseUVhY2hTZXJpZXM7XG4gICAgZXhwb3J0cy5hcHBseSA9IGFwcGx5JDE7XG4gICAgZXhwb3J0cy5hc3luY2lmeSA9IGFzeW5jaWZ5O1xuICAgIGV4cG9ydHMuYXV0byA9IGF1dG87XG4gICAgZXhwb3J0cy5hdXRvSW5qZWN0ID0gYXV0b0luamVjdDtcbiAgICBleHBvcnRzLmNhcmdvID0gY2FyZ287XG4gICAgZXhwb3J0cy5jb21wb3NlID0gY29tcG9zZTtcbiAgICBleHBvcnRzLmNvbmNhdCA9IGNvbmNhdDtcbiAgICBleHBvcnRzLmNvbmNhdFNlcmllcyA9IGNvbmNhdFNlcmllcztcbiAgICBleHBvcnRzLmNvbnN0YW50ID0gY29uc3RhbnQ7XG4gICAgZXhwb3J0cy5kZXRlY3QgPSBkZXRlY3Q7XG4gICAgZXhwb3J0cy5kZXRlY3RMaW1pdCA9IGRldGVjdExpbWl0O1xuICAgIGV4cG9ydHMuZGV0ZWN0U2VyaWVzID0gZGV0ZWN0U2VyaWVzO1xuICAgIGV4cG9ydHMuZGlyID0gZGlyO1xuICAgIGV4cG9ydHMuZG9EdXJpbmcgPSBkb0R1cmluZztcbiAgICBleHBvcnRzLmRvVW50aWwgPSBkb1VudGlsO1xuICAgIGV4cG9ydHMuZG9XaGlsc3QgPSBkb1doaWxzdDtcbiAgICBleHBvcnRzLmR1cmluZyA9IGR1cmluZztcbiAgICBleHBvcnRzLmVhY2ggPSBlYWNoO1xuICAgIGV4cG9ydHMuZWFjaExpbWl0ID0gZWFjaExpbWl0O1xuICAgIGV4cG9ydHMuZWFjaE9mID0gZWFjaE9mO1xuICAgIGV4cG9ydHMuZWFjaE9mTGltaXQgPSBlYWNoT2ZMaW1pdDtcbiAgICBleHBvcnRzLmVhY2hPZlNlcmllcyA9IGVhY2hPZlNlcmllcztcbiAgICBleHBvcnRzLmVhY2hTZXJpZXMgPSBlYWNoU2VyaWVzO1xuICAgIGV4cG9ydHMuZW5zdXJlQXN5bmMgPSBlbnN1cmVBc3luYztcbiAgICBleHBvcnRzLmV2ZXJ5ID0gZXZlcnk7XG4gICAgZXhwb3J0cy5ldmVyeUxpbWl0ID0gZXZlcnlMaW1pdDtcbiAgICBleHBvcnRzLmV2ZXJ5U2VyaWVzID0gZXZlcnlTZXJpZXM7XG4gICAgZXhwb3J0cy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgZXhwb3J0cy5maWx0ZXJMaW1pdCA9IGZpbHRlckxpbWl0O1xuICAgIGV4cG9ydHMuZmlsdGVyU2VyaWVzID0gZmlsdGVyU2VyaWVzO1xuICAgIGV4cG9ydHMuZm9yZXZlciA9IGZvcmV2ZXI7XG4gICAgZXhwb3J0cy5pdGVyYXRvciA9IGl0ZXJhdG9yJDE7XG4gICAgZXhwb3J0cy5sb2cgPSBsb2c7XG4gICAgZXhwb3J0cy5tYXAgPSBtYXA7XG4gICAgZXhwb3J0cy5tYXBMaW1pdCA9IG1hcExpbWl0O1xuICAgIGV4cG9ydHMubWFwU2VyaWVzID0gbWFwU2VyaWVzO1xuICAgIGV4cG9ydHMubWVtb2l6ZSA9IG1lbW9pemUkMTtcbiAgICBleHBvcnRzLm5leHRUaWNrID0gc2V0SW1tZWRpYXRlJDE7XG4gICAgZXhwb3J0cy5wYXJhbGxlbCA9IHBhcmFsbGVsO1xuICAgIGV4cG9ydHMucGFyYWxsZWxMaW1pdCA9IHBhcmFsbGVsTGltaXQ7XG4gICAgZXhwb3J0cy5wcmlvcml0eVF1ZXVlID0gcHJpb3JpdHlRdWV1ZTtcbiAgICBleHBvcnRzLnF1ZXVlID0gcXVldWUkMTtcbiAgICBleHBvcnRzLnJhY2UgPSByYWNlO1xuICAgIGV4cG9ydHMucmVkdWNlID0gcmVkdWNlO1xuICAgIGV4cG9ydHMucmVkdWNlUmlnaHQgPSByZWR1Y2VSaWdodDtcbiAgICBleHBvcnRzLnJlZmxlY3QgPSByZWZsZWN0O1xuICAgIGV4cG9ydHMucmVmbGVjdEFsbCA9IHJlZmxlY3RBbGw7XG4gICAgZXhwb3J0cy5yZWplY3QgPSByZWplY3Q7XG4gICAgZXhwb3J0cy5yZWplY3RMaW1pdCA9IHJlamVjdExpbWl0O1xuICAgIGV4cG9ydHMucmVqZWN0U2VyaWVzID0gcmVqZWN0U2VyaWVzO1xuICAgIGV4cG9ydHMucmV0cnkgPSByZXRyeTtcbiAgICBleHBvcnRzLnJldHJ5YWJsZSA9IHJldHJ5YWJsZTtcbiAgICBleHBvcnRzLnNlcSA9IHNlcTtcbiAgICBleHBvcnRzLnNlcmllcyA9IHNlcmllcztcbiAgICBleHBvcnRzLnNldEltbWVkaWF0ZSA9IHNldEltbWVkaWF0ZSQxO1xuICAgIGV4cG9ydHMuc29tZSA9IHNvbWU7XG4gICAgZXhwb3J0cy5zb21lTGltaXQgPSBzb21lTGltaXQ7XG4gICAgZXhwb3J0cy5zb21lU2VyaWVzID0gc29tZVNlcmllcztcbiAgICBleHBvcnRzLnNvcnRCeSA9IHNvcnRCeTtcbiAgICBleHBvcnRzLnRpbWVvdXQgPSB0aW1lb3V0O1xuICAgIGV4cG9ydHMudGltZXMgPSB0aW1lcztcbiAgICBleHBvcnRzLnRpbWVzTGltaXQgPSB0aW1lTGltaXQ7XG4gICAgZXhwb3J0cy50aW1lc1NlcmllcyA9IHRpbWVzU2VyaWVzO1xuICAgIGV4cG9ydHMudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgIGV4cG9ydHMudW5tZW1vaXplID0gdW5tZW1vaXplO1xuICAgIGV4cG9ydHMudW50aWwgPSB1bnRpbDtcbiAgICBleHBvcnRzLndhdGVyZmFsbCA9IHdhdGVyZmFsbDtcbiAgICBleHBvcnRzLndoaWxzdCA9IHdoaWxzdDtcbiAgICBleHBvcnRzLmFsbCA9IGV2ZXJ5O1xuICAgIGV4cG9ydHMuYWxsTGltaXQgPSBldmVyeUxpbWl0O1xuICAgIGV4cG9ydHMuYWxsU2VyaWVzID0gZXZlcnlTZXJpZXM7XG4gICAgZXhwb3J0cy5hbnkgPSBzb21lO1xuICAgIGV4cG9ydHMuYW55TGltaXQgPSBzb21lTGltaXQ7XG4gICAgZXhwb3J0cy5hbnlTZXJpZXMgPSBzb21lU2VyaWVzO1xuICAgIGV4cG9ydHMuZmluZCA9IGRldGVjdDtcbiAgICBleHBvcnRzLmZpbmRMaW1pdCA9IGRldGVjdExpbWl0O1xuICAgIGV4cG9ydHMuZmluZFNlcmllcyA9IGRldGVjdFNlcmllcztcbiAgICBleHBvcnRzLmZvckVhY2ggPSBlYWNoO1xuICAgIGV4cG9ydHMuZm9yRWFjaFNlcmllcyA9IGVhY2hTZXJpZXM7XG4gICAgZXhwb3J0cy5mb3JFYWNoTGltaXQgPSBlYWNoTGltaXQ7XG4gICAgZXhwb3J0cy5mb3JFYWNoT2YgPSBlYWNoT2Y7XG4gICAgZXhwb3J0cy5mb3JFYWNoT2ZTZXJpZXMgPSBlYWNoT2ZTZXJpZXM7XG4gICAgZXhwb3J0cy5mb3JFYWNoT2ZMaW1pdCA9IGVhY2hPZkxpbWl0O1xuICAgIGV4cG9ydHMuaW5qZWN0ID0gcmVkdWNlO1xuICAgIGV4cG9ydHMuZm9sZGwgPSByZWR1Y2U7XG4gICAgZXhwb3J0cy5mb2xkciA9IHJlZHVjZVJpZ2h0O1xuICAgIGV4cG9ydHMuc2VsZWN0ID0gZmlsdGVyO1xuICAgIGV4cG9ydHMuc2VsZWN0TGltaXQgPSBmaWx0ZXJMaW1pdDtcbiAgICBleHBvcnRzLnNlbGVjdFNlcmllcyA9IGZpbHRlclNlcmllcztcbiAgICBleHBvcnRzLndyYXBTeW5jID0gYXN5bmNpZnk7XG5cbn0pKTsiLCIvKipcbiAqIEdldCBhdmVyYWdlIHZhbHVlLlxuICogQGZ1bmN0aW9uIGF2ZVxuICogQHBhcmFtIHsuLi5udW1iZXJ9IHZhbHVlcyAtIFZhbHVlcyB0byBhdmUuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSAtIEF2ZXJhZ2UgdmFsdWUuXG4gKi9cblxuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3Qgc3VtID0gcmVxdWlyZSgnLi9zdW0nKTtcblxuLyoqIEBsZW5kcyBhdmUgKi9cbmZ1bmN0aW9uIGF2ZSgpIHtcbiAgICBsZXQgYXJncyA9IGFyZ3VtZW50cztcbiAgICBsZXQgdmFsdWVzID0gMCwgc2l6ZSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbCA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHNpemUgKz0gdmFsLmxlbmd0aDtcbiAgICAgICAgICAgIHZhbCA9IHN1bS5hcHBseShzdW0sIHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzaXplICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWVzICs9IHZhbDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcyAvIHNpemU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXZlO1xuXG4iLCIvKipcbiAqIEJhc2ljIG51bWVyaWMgY2FsY3VsYXRpb24gZnVuY3Rpb25zLlxuICogQG1vZHVsZSBudW1jYWxcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0IGF2ZSgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXZlJyk7IH0sXG4gICAgZ2V0IG1heCgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vbWF4Jyk7IH0sXG4gICAgZ2V0IG1pbigpIHsgcmV0dXJuIHJlcXVpcmUoJy4vbWluJyk7IH0sXG4gICAgZ2V0IHN1bSgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vc3VtJyk7IH1cbn07IiwiLyoqXG4gKiBGaW5kIG1heCB2YWx1ZS5cbiAqIEBmdW5jdGlvbiBtYXhcbiAqIEBwYXJhbSB7Li4ubnVtYmVyfSB2YWx1ZXMgLSBWYWx1ZXMgdG8gY29tcGFyZS5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IC0gTWF4IG51bWJlci5cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKiogQGxlbmRzIG1heCAqL1xuZnVuY3Rpb24gbWF4KCkge1xuICAgIGxldCBhcmdzID0gYXJndW1lbnRzO1xuICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbCA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHZhbCA9IG1heC5hcHBseShtYXgsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGhpdCA9IChyZXN1bHQgPT09IHVuZGVmaW5lZCkgfHwgKHZhbCA+IHJlc3VsdCk7XG4gICAgICAgIGlmIChoaXQpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHZhbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1heDtcblxuIiwiLyoqXG4gKiBGaW5kIG1pbiB2YWx1ZS5cbiAqIEBmdW5jdGlvbiBtaW5cbiAqIEBwYXJhbSB7Li4ubnVtYmVyfSB2YWx1ZXMgLSBWYWx1ZXMgdG8gY29tcGFyZS5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IC0gTWluIG51bWJlci5cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKiogQGxlbmRzIG1pbiAqL1xuZnVuY3Rpb24gbWluKCkge1xuICAgIGxldCBhcmdzID0gYXJndW1lbnRzO1xuICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbCA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHZhbCA9IG1pbi5hcHBseShtaW4sIHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGhpdCA9IChyZXN1bHQgPT09IHVuZGVmaW5lZCkgfHwgKHZhbCA8IHJlc3VsdCk7XG4gICAgICAgIGlmIChoaXQpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHZhbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1pbjtcblxuIiwiLyoqXG4gKiBHZXQgc3VtIHZhbHVlLlxuICogQGZ1bmN0aW9uIHN1bVxuICogQHBhcmFtIHsuLi5udW1iZXJ9IHZhbHVlcyAtIFZhbHVlcyB0byBzdW0uXG4gKiBAcmV0dXJucyB7bnVtYmVyfSAtIFN1bSB2YWx1ZS5cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKiogQGxlbmRzIHN1bSAqL1xuZnVuY3Rpb24gc3VtKCkge1xuICAgIGxldCBhcmdzID0gYXJndW1lbnRzO1xuICAgIGxldCByZXN1bHQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBhcmdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGxldCB2YWwgPSBhcmdzW2ldO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgICAgICB2YWwgPSBzdW0uYXBwbHkoc3VtLCB2YWwpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSB2YWw7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VtO1xuXG4iLCJcbnZhciBybmc7XG5cbmlmIChnbG9iYWwuY3J5cHRvICYmIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgLy8gV0hBVFdHIGNyeXB0by1iYXNlZCBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gIC8vIE1vZGVyYXRlbHkgZmFzdCwgaGlnaCBxdWFsaXR5XG4gIHZhciBfcm5kczggPSBuZXcgVWludDhBcnJheSgxNik7XG4gIHJuZyA9IGZ1bmN0aW9uIHdoYXR3Z1JORygpIHtcbiAgICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKF9ybmRzOCk7XG4gICAgcmV0dXJuIF9ybmRzODtcbiAgfTtcbn1cblxuaWYgKCFybmcpIHtcbiAgLy8gTWF0aC5yYW5kb20oKS1iYXNlZCAoUk5HKVxuICAvL1xuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIE1hdGgucmFuZG9tKCkuICBJdCdzIGZhc3QsIGJ1dCBpcyBvZiB1bnNwZWNpZmllZFxuICAvLyBxdWFsaXR5LlxuICB2YXIgIF9ybmRzID0gbmV3IEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCAxNjsgaSsrKSB7XG4gICAgICBpZiAoKGkgJiAweDAzKSA9PT0gMCkgciA9IE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDtcbiAgICAgIF9ybmRzW2ldID0gciA+Pj4gKChpICYgMHgwMykgPDwgMykgJiAweGZmO1xuICAgIH1cblxuICAgIHJldHVybiBfcm5kcztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBybmc7XG5cbiIsIi8vICAgICB1dWlkLmpzXG4vL1xuLy8gICAgIENvcHlyaWdodCAoYykgMjAxMC0yMDEyIFJvYmVydCBLaWVmZmVyXG4vLyAgICAgTUlUIExpY2Vuc2UgLSBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG5cbi8vIFVuaXF1ZSBJRCBjcmVhdGlvbiByZXF1aXJlcyBhIGhpZ2ggcXVhbGl0eSByYW5kb20gIyBnZW5lcmF0b3IuICBXZSBmZWF0dXJlXG4vLyBkZXRlY3QgdG8gZGV0ZXJtaW5lIHRoZSBiZXN0IFJORyBzb3VyY2UsIG5vcm1hbGl6aW5nIHRvIGEgZnVuY3Rpb24gdGhhdFxuLy8gcmV0dXJucyAxMjgtYml0cyBvZiByYW5kb21uZXNzLCBzaW5jZSB0aGF0J3Mgd2hhdCdzIHVzdWFsbHkgcmVxdWlyZWRcbnZhciBfcm5nID0gcmVxdWlyZSgnLi9ybmcnKTtcblxuLy8gTWFwcyBmb3IgbnVtYmVyIDwtPiBoZXggc3RyaW5nIGNvbnZlcnNpb25cbnZhciBfYnl0ZVRvSGV4ID0gW107XG52YXIgX2hleFRvQnl0ZSA9IHt9O1xuZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICBfYnl0ZVRvSGV4W2ldID0gKGkgKyAweDEwMCkudG9TdHJpbmcoMTYpLnN1YnN0cigxKTtcbiAgX2hleFRvQnl0ZVtfYnl0ZVRvSGV4W2ldXSA9IGk7XG59XG5cbi8vICoqYHBhcnNlKClgIC0gUGFyc2UgYSBVVUlEIGludG8gaXQncyBjb21wb25lbnQgYnl0ZXMqKlxuZnVuY3Rpb24gcGFyc2UocywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSAoYnVmICYmIG9mZnNldCkgfHwgMCwgaWkgPSAwO1xuXG4gIGJ1ZiA9IGJ1ZiB8fCBbXTtcbiAgcy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1swLTlhLWZdezJ9L2csIGZ1bmN0aW9uKG9jdCkge1xuICAgIGlmIChpaSA8IDE2KSB7IC8vIERvbid0IG92ZXJmbG93IVxuICAgICAgYnVmW2kgKyBpaSsrXSA9IF9oZXhUb0J5dGVbb2N0XTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFplcm8gb3V0IHJlbWFpbmluZyBieXRlcyBpZiBzdHJpbmcgd2FzIHNob3J0XG4gIHdoaWxlIChpaSA8IDE2KSB7XG4gICAgYnVmW2kgKyBpaSsrXSA9IDA7XG4gIH1cblxuICByZXR1cm4gYnVmO1xufVxuXG4vLyAqKmB1bnBhcnNlKClgIC0gQ29udmVydCBVVUlEIGJ5dGUgYXJyYXkgKGFsYSBwYXJzZSgpKSBpbnRvIGEgc3RyaW5nKipcbmZ1bmN0aW9uIHVucGFyc2UoYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBvZmZzZXQgfHwgMCwgYnRoID0gX2J5dGVUb0hleDtcbiAgcmV0dXJuICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV07XG59XG5cbi8vICoqYHYxKClgIC0gR2VuZXJhdGUgdGltZS1iYXNlZCBVVUlEKipcbi8vXG4vLyBJbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vTGlvc0svVVVJRC5qc1xuLy8gYW5kIGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS91dWlkLmh0bWxcblxuLy8gcmFuZG9tICMncyB3ZSBuZWVkIHRvIGluaXQgbm9kZSBhbmQgY2xvY2tzZXFcbnZhciBfc2VlZEJ5dGVzID0gX3JuZygpO1xuXG4vLyBQZXIgNC41LCBjcmVhdGUgYW5kIDQ4LWJpdCBub2RlIGlkLCAoNDcgcmFuZG9tIGJpdHMgKyBtdWx0aWNhc3QgYml0ID0gMSlcbnZhciBfbm9kZUlkID0gW1xuICBfc2VlZEJ5dGVzWzBdIHwgMHgwMSxcbiAgX3NlZWRCeXRlc1sxXSwgX3NlZWRCeXRlc1syXSwgX3NlZWRCeXRlc1szXSwgX3NlZWRCeXRlc1s0XSwgX3NlZWRCeXRlc1s1XVxuXTtcblxuLy8gUGVyIDQuMi4yLCByYW5kb21pemUgKDE0IGJpdCkgY2xvY2tzZXFcbnZhciBfY2xvY2tzZXEgPSAoX3NlZWRCeXRlc1s2XSA8PCA4IHwgX3NlZWRCeXRlc1s3XSkgJiAweDNmZmY7XG5cbi8vIFByZXZpb3VzIHV1aWQgY3JlYXRpb24gdGltZVxudmFyIF9sYXN0TVNlY3MgPSAwLCBfbGFzdE5TZWNzID0gMDtcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjEob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG4gIHZhciBiID0gYnVmIHx8IFtdO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBjbG9ja3NlcSA9IG9wdGlvbnMuY2xvY2tzZXEgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuY2xvY2tzZXEgOiBfY2xvY2tzZXE7XG5cbiAgLy8gVVVJRCB0aW1lc3RhbXBzIGFyZSAxMDAgbmFuby1zZWNvbmQgdW5pdHMgc2luY2UgdGhlIEdyZWdvcmlhbiBlcG9jaCxcbiAgLy8gKDE1ODItMTAtMTUgMDA6MDApLiAgSlNOdW1iZXJzIGFyZW4ndCBwcmVjaXNlIGVub3VnaCBmb3IgdGhpcywgc29cbiAgLy8gdGltZSBpcyBoYW5kbGVkIGludGVybmFsbHkgYXMgJ21zZWNzJyAoaW50ZWdlciBtaWxsaXNlY29uZHMpIGFuZCAnbnNlY3MnXG4gIC8vICgxMDAtbmFub3NlY29uZHMgb2Zmc2V0IGZyb20gbXNlY3MpIHNpbmNlIHVuaXggZXBvY2gsIDE5NzAtMDEtMDEgMDA6MDAuXG4gIHZhciBtc2VjcyA9IG9wdGlvbnMubXNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubXNlY3MgOiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAvLyBQZXIgNC4yLjEuMiwgdXNlIGNvdW50IG9mIHV1aWQncyBnZW5lcmF0ZWQgZHVyaW5nIHRoZSBjdXJyZW50IGNsb2NrXG4gIC8vIGN5Y2xlIHRvIHNpbXVsYXRlIGhpZ2hlciByZXNvbHV0aW9uIGNsb2NrXG4gIHZhciBuc2VjcyA9IG9wdGlvbnMubnNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubnNlY3MgOiBfbGFzdE5TZWNzICsgMTtcblxuICAvLyBUaW1lIHNpbmNlIGxhc3QgdXVpZCBjcmVhdGlvbiAoaW4gbXNlY3MpXG4gIHZhciBkdCA9IChtc2VjcyAtIF9sYXN0TVNlY3MpICsgKG5zZWNzIC0gX2xhc3ROU2VjcykvMTAwMDA7XG5cbiAgLy8gUGVyIDQuMi4xLjIsIEJ1bXAgY2xvY2tzZXEgb24gY2xvY2sgcmVncmVzc2lvblxuICBpZiAoZHQgPCAwICYmIG9wdGlvbnMuY2xvY2tzZXEgPT09IHVuZGVmaW5lZCkge1xuICAgIGNsb2Nrc2VxID0gY2xvY2tzZXEgKyAxICYgMHgzZmZmO1xuICB9XG5cbiAgLy8gUmVzZXQgbnNlY3MgaWYgY2xvY2sgcmVncmVzc2VzIChuZXcgY2xvY2tzZXEpIG9yIHdlJ3ZlIG1vdmVkIG9udG8gYSBuZXdcbiAgLy8gdGltZSBpbnRlcnZhbFxuICBpZiAoKGR0IDwgMCB8fCBtc2VjcyA+IF9sYXN0TVNlY3MpICYmIG9wdGlvbnMubnNlY3MgPT09IHVuZGVmaW5lZCkge1xuICAgIG5zZWNzID0gMDtcbiAgfVxuXG4gIC8vIFBlciA0LjIuMS4yIFRocm93IGVycm9yIGlmIHRvbyBtYW55IHV1aWRzIGFyZSByZXF1ZXN0ZWRcbiAgaWYgKG5zZWNzID49IDEwMDAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1dWlkLnYxKCk6IENhblxcJ3QgY3JlYXRlIG1vcmUgdGhhbiAxME0gdXVpZHMvc2VjJyk7XG4gIH1cblxuICBfbGFzdE1TZWNzID0gbXNlY3M7XG4gIF9sYXN0TlNlY3MgPSBuc2VjcztcbiAgX2Nsb2Nrc2VxID0gY2xvY2tzZXE7XG5cbiAgLy8gUGVyIDQuMS40IC0gQ29udmVydCBmcm9tIHVuaXggZXBvY2ggdG8gR3JlZ29yaWFuIGVwb2NoXG4gIG1zZWNzICs9IDEyMjE5MjkyODAwMDAwO1xuXG4gIC8vIGB0aW1lX2xvd2BcbiAgdmFyIHRsID0gKChtc2VjcyAmIDB4ZmZmZmZmZikgKiAxMDAwMCArIG5zZWNzKSAlIDB4MTAwMDAwMDAwO1xuICBiW2krK10gPSB0bCA+Pj4gMjQgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gMTYgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gOCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsICYgMHhmZjtcblxuICAvLyBgdGltZV9taWRgXG4gIHZhciB0bWggPSAobXNlY3MgLyAweDEwMDAwMDAwMCAqIDEwMDAwKSAmIDB4ZmZmZmZmZjtcbiAgYltpKytdID0gdG1oID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdG1oICYgMHhmZjtcblxuICAvLyBgdGltZV9oaWdoX2FuZF92ZXJzaW9uYFxuICBiW2krK10gPSB0bWggPj4+IDI0ICYgMHhmIHwgMHgxMDsgLy8gaW5jbHVkZSB2ZXJzaW9uXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMTYgJiAweGZmO1xuXG4gIC8vIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYCAoUGVyIDQuMi4yIC0gaW5jbHVkZSB2YXJpYW50KVxuICBiW2krK10gPSBjbG9ja3NlcSA+Pj4gOCB8IDB4ODA7XG5cbiAgLy8gYGNsb2NrX3NlcV9sb3dgXG4gIGJbaSsrXSA9IGNsb2Nrc2VxICYgMHhmZjtcblxuICAvLyBgbm9kZWBcbiAgdmFyIG5vZGUgPSBvcHRpb25zLm5vZGUgfHwgX25vZGVJZDtcbiAgZm9yICh2YXIgbiA9IDA7IG4gPCA2OyBuKyspIHtcbiAgICBiW2kgKyBuXSA9IG5vZGVbbl07XG4gIH1cblxuICByZXR1cm4gYnVmID8gYnVmIDogdW5wYXJzZShiKTtcbn1cblxuLy8gKipgdjQoKWAgLSBHZW5lcmF0ZSByYW5kb20gVVVJRCoqXG5cbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYnJvb2ZhL25vZGUtdXVpZCBmb3IgQVBJIGRldGFpbHNcbmZ1bmN0aW9uIHY0KG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gIC8vIERlcHJlY2F0ZWQgLSAnZm9ybWF0JyBhcmd1bWVudCwgYXMgc3VwcG9ydGVkIGluIHYxLjJcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG5cbiAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSAnc3RyaW5nJykge1xuICAgIGJ1ZiA9IG9wdGlvbnMgPT0gJ2JpbmFyeScgPyBuZXcgQXJyYXkoMTYpIDogbnVsbDtcbiAgICBvcHRpb25zID0gbnVsbDtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgcm5kcyA9IG9wdGlvbnMucmFuZG9tIHx8IChvcHRpb25zLnJuZyB8fCBfcm5nKSgpO1xuXG4gIC8vIFBlciA0LjQsIHNldCBiaXRzIGZvciB2ZXJzaW9uIGFuZCBgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZGBcbiAgcm5kc1s2XSA9IChybmRzWzZdICYgMHgwZikgfCAweDQwO1xuICBybmRzWzhdID0gKHJuZHNbOF0gJiAweDNmKSB8IDB4ODA7XG5cbiAgLy8gQ29weSBieXRlcyB0byBidWZmZXIsIGlmIHByb3ZpZGVkXG4gIGlmIChidWYpIHtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgMTY7IGlpKyspIHtcbiAgICAgIGJ1ZltpICsgaWldID0gcm5kc1tpaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZiB8fCB1bnBhcnNlKHJuZHMpO1xufVxuXG4vLyBFeHBvcnQgcHVibGljIEFQSVxudmFyIHV1aWQgPSB2NDtcbnV1aWQudjEgPSB2MTtcbnV1aWQudjQgPSB2NDtcbnV1aWQucGFyc2UgPSBwYXJzZTtcbnV1aWQudW5wYXJzZSA9IHVucGFyc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gdXVpZDtcbiJdfQ==
