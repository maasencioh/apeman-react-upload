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

const React = require('react')
const ReactDOM = require('react-dom');

const Demo = require('./demo.component.js')

window.addEventListener('load', function onLoad () {
  window.React = React
  let DemoFactory = React.createFactory(Demo)
  ReactDOM.render(DemoFactory(), document.getElementById('demo-wrap'))
})

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
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (typeof arguments[1] === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var hasError = false;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    hasError = true;

                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
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

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
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
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback.apply(null, [null].concat(args));
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
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
                while(!q.paused && workers < q.concurrency && q.tasks.length){

                    var tasks = q.payload ?
                        q.tasks.splice(0, q.payload) :
                        q.tasks.splice(0, q.tasks.length);

                    var data = _map(tasks, function (task) {
                        return task.data;
                    });

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);
                    var cb = only_once(_next(q, tasks));
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
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {   
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
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
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92NS4zLjAvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwiLi4vLi4vLi4vLm52bS92ZXJzaW9ucy9ub2RlL3Y1LjMuMC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2RvYy9kZW1vL2RlbW8uY29tcG9uZW50LmpzeCIsImRvYy9kZW1vL2RlbW8ubm9kZS5qcyIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2xpYi9hcF91cGxvYWQuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2JpZ19idXR0b24uanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2J1dHRvbi5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfYnV0dG9uX2dyb3VwLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9hcF9idXR0b25fc3R5bGUuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2NlbGxfYnV0dG9uLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9hcF9jZWxsX2J1dHRvbl9yb3cuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2ljb25fYnV0dG9uLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9hcF9pY29uX2J1dHRvbl9yb3cuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX25leHRfYnV0dG9uLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9hcF9wcmV2X2J1dHRvbi5qc3giLCJub2RlX21vZHVsZXMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvaW5kZXguanMiLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWltYWdlL2xpYi9fc2NhbGVkX3NpemUuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1pbWFnZS9saWIvYXBfaW1hZ2UuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1pbWFnZS9saWIvYXBfaW1hZ2Vfc3R5bGUuanN4Iiwibm9kZV9tb2R1bGVzL2FwZW1hbi1yZWFjdC1pbWFnZS9saWIvaW5kZXguanMiLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LXNwaW5uZXIvbGliL2FwX3NwaW5uZXIuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1zcGlubmVyL2xpYi9hcF9zcGlubmVyX3N0eWxlLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3Qtc3Bpbm5lci9saWIvY29uc3RzLmpzeCIsIm5vZGVfbW9kdWxlcy9hcGVtYW4tcmVhY3Qtc3Bpbm5lci9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYXN5bmMvbGliL2FzeW5jLmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvYXZlLmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbnVtY2FsL2xpYi9tYXguanMiLCJub2RlX21vZHVsZXMvbnVtY2FsL2xpYi9taW4uanMiLCJub2RlX21vZHVsZXMvbnVtY2FsL2xpYi9zdW0uanMiLCJub2RlX21vZHVsZXMvdXVpZC9ybmctYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dWlkL3V1aWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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S0FBRyxDQUFFLElBQUYsRUFBUSxTQUFSLEVBQW1CLFlBQW5CLENBQUg7QUFDQSxLQUFHLENBQUUsSUFBRixFQUFRLFNBQVIsRUFBbUIsU0FBbkIsQ0FBSDtBQUNBLEtBQUcsQ0FBRSxJQUFGLEVBQVEsU0FBUixFQUFtQixVQUFuQixDQUFIO0NBTEY7OztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDanZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCBBcFVwbG9hZCBmcm9tICcuLi8uLi9saWIvYXBfdXBsb2FkJ1xuXG5jb25zdCBERU1PX0lNQUdFUyA9IFtcbiAgJ2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9hcGVtYW4tYXNzZXQtbGFiby9hcGVtYW4tYXNzZXQtaW1hZ2VzL21hc3Rlci9kaXN0L2R1bW15LzEyLmpwZydcbl1cblxubGV0IERlbW8gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPEFwVXBsb2FkIG11bHRpcGxlPXsgdHJ1ZSB9XG4gICAgICAgICAgICAgICAgICBpZD1cImRlbW8tZmlsZS11cGxvYWQtMDFcIlxuICAgICAgICAgICAgICAgICAgbmFtZT1cImZpbGUtaW5wdXQtMDFcIlxuICAgICAgICAgICAgICAgICAgYWNjZXB0PVwiaW1hZ2UvKlwiXG4gICAgICAgICAgICAgICAgICBvbkxvYWQ9eyBzLmhhbmRsZUxvYWRlZCB9PlxuICAgICAgICA8L0FwVXBsb2FkPlxuXG4gICAgICAgIDxBcFVwbG9hZCBtdWx0aXBsZT17IHRydWUgfVxuICAgICAgICAgICAgICAgICAgaWQ9XCJkZW1vLWZpbGUtdXBsb2FkLTAyXCJcbiAgICAgICAgICAgICAgICAgIG5hbWU9XCJmaWxlLWlucHV0LTAyXCJcbiAgICAgICAgICAgICAgICAgIGFjY2VwdD1cImltYWdlLypcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9eyBERU1PX0lNQUdFUyB9XG4gICAgICAgICAgICAgICAgICBvbkxvYWQ9eyBzLmhhbmRsZUxvYWRlZCB9PlxuICAgICAgICA8L0FwVXBsb2FkPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuICBoYW5kbGVMb2FkZWQgKGV2KSB7XG4gICAgY29uc29sZS5sb2coJ3Jlc3VsdCcsIGV2LnRhcmdldCwgZXYudXJscylcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBEZW1vXG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpXG5jb25zdCBSZWFjdERPTSA9IHJlcXVpcmUoJ3JlYWN0LWRvbScpO1xuXG5jb25zdCBEZW1vID0gcmVxdWlyZSgnLi9kZW1vLmNvbXBvbmVudC5qcycpXG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gb25Mb2FkICgpIHtcbiAgd2luZG93LlJlYWN0ID0gUmVhY3RcbiAgbGV0IERlbW9GYWN0b3J5ID0gUmVhY3QuY3JlYXRlRmFjdG9yeShEZW1vKVxuICBSZWFjdERPTS5yZW5kZXIoRGVtb0ZhY3RvcnkoKSwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbW8td3JhcCcpKVxufSlcbiIsIi8qKlxuICogYXBlbWFuIHJlYWN0IHBhY2thZ2UgZm9yIGZpbGUgdXBsb2FkIGNvbXBvbmVudHMuXG4gKiBAY29uc3RydWN0b3IgQXBVcGxvYWRcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgYXN5bmMgZnJvbSAnYXN5bmMnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHV1aWQgZnJvbSAndXVpZCdcbmltcG9ydCB7QXBJbWFnZX0gZnJvbSAnYXBlbWFuLXJlYWN0LWltYWdlJ1xuaW1wb3J0IHtBcFNwaW5uZXJ9IGZyb20gJ2FwZW1hbi1yZWFjdC1zcGlubmVyJ1xuaW1wb3J0IHtBcEJ1dHRvbn0gZnJvbSAnYXBlbWFuLXJlYWN0LWJ1dHRvbidcblxuLyoqIEBsZW5kcyBBcFVwbG9hZCAqL1xuY29uc3QgQXBVcGxvYWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICAvKiogTmFtZSBvZiBpbnB1dCAqL1xuICAgIG5hbWU6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogRE9NIGlkIG9mIGlucHV0ICovXG4gICAgaWQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogQWxsb3cgbXVsdGlwbGUgdXBsb2FkICovXG4gICAgbXVsdGlwbGU6IHR5cGVzLmJvb2wsXG4gICAgLyoqIEhhbmRsZXIgZm9yIGNoYW5nZSBldmVudCAqL1xuICAgIG9uQ2hhbmdlOiB0eXBlcy5mdW5jLFxuICAgIC8qKiBIYW5kbGVyIGZvciBsb2FkIGV2ZW50ICovXG4gICAgb25Mb2FkOiB0eXBlcy5mdW5jLFxuICAgIC8qKiBIYW5kbGVyIGZvciBlcnJvciBldmVudCAqL1xuICAgIG9uRXJyb3I6IHR5cGVzLmZ1bmMsXG4gICAgLyoqIEltYWdlIHdpZHRoICovXG4gICAgd2lkdGg6IHR5cGVzLm51bWJlcixcbiAgICAvKiogSW1hZ2UgaGVpZ2h0ICovXG4gICAgaGVpZ2h0OiB0eXBlcy5udW1iZXIsXG4gICAgLyoqIEd1aWRlIHRleHQgKi9cbiAgICB0ZXh0OiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIEFjY2VwdCBmaWxlIHR5cGUgKi9cbiAgICBhY2NlcHQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogR3VpZGUgaWNvbiAqL1xuICAgIGljb246IHR5cGVzLnN0cmluZyxcbiAgICAvKiogSWNvbiBmb3IgY2xvc2UgaW1hZ2VzICovXG4gICAgY2xvc2VJY29uOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIFNwaW5uZXIgdGhlbWUgKi9cbiAgICBzcGlubmVyOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIFZhbHVlIG9mIGlucHV0ICovXG4gICAgdmFsdWU6IHR5cGVzLm9uZU9mVHlwZShbXG4gICAgICB0eXBlcy5zdHJpbmcsXG4gICAgICB0eXBlcy5hcnJheVxuICAgIF0pXG4gIH0sXG5cbiAgbWl4aW5zOiBbXSxcblxuICBzdGF0aWNzOiB7XG4gICAgcmVhZEZpbGUgKGZpbGUsIGNhbGxiYWNrKSB7XG4gICAgICBsZXQgcmVhZGVyID0gbmV3IHdpbmRvdy5GaWxlUmVhZGVyKClcbiAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gb25lcnJvciAoZXJyKSB7XG4gICAgICAgIGNhbGxiYWNrKGVycilcbiAgICAgIH1cbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiBvbmxvYWQgKGV2KSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGV2LnRhcmdldC5yZXN1bHQpXG4gICAgICB9XG4gICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKVxuICAgIH0sXG4gICAgaXNJbWFnZVVybCh1cmwpIHtcbiAgICAgIHJldHVybiAvXmRhdGE6aW1hZ2UvLnRlc3QodXJsKSB8fCAhIX5bXG4gICAgICAgICAgJy5qcGcnLFxuICAgICAgICAgICcuanBlZycsXG4gICAgICAgICAgJy5zdmcnLFxuICAgICAgICAgICcuZ2lmJyxcbiAgICAgICAgICAnLnBuZydcbiAgICAgICAgXS5pbmRleE9mKHBhdGguZXh0bmFtZSh1cmwpKVxuICAgIH1cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgY29uc3QgcyA9IHRoaXMsXG4gICAgICB7IHByb3BzIH0gPSBzO1xuICAgIGxldCBoYXNWYWx1ZSA9IHByb3BzLnZhbHVlICYmIHByb3BzLnZhbHVlLmxlbmd0aCA+IDBcbiAgICByZXR1cm4ge1xuICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgZXJyb3I6IG51bGwsXG4gICAgICB1cmxzOiBoYXNWYWx1ZSA/IFtdLmNvbmNhdChwcm9wcy52YWx1ZSkgOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IG51bGwsXG4gICAgICBpZDogYGFwLXVwbG9hZC0ke3V1aWQudjQoKX1gLFxuICAgICAgbXVsdGlwbGU6IGZhbHNlLFxuICAgICAgd2lkdGg6IDE4MCxcbiAgICAgIGhlaWdodDogMTgwLFxuICAgICAgYWNjZXB0OiBudWxsLFxuICAgICAgdGV4dDogJ1VwbG9hZCBmaWxlJyxcbiAgICAgIGljb246ICdmYSBmYS1jbG91ZC11cGxvYWQnLFxuICAgICAgY2xvc2VJY29uOiAnZmEgZmEtY2xvc2UnLFxuICAgICAgc3Bpbm5lckljb246IEFwU3Bpbm5lci5ERUZBVUxUX1RIRU1FLFxuICAgICAgb25DaGFuZ2U6IG51bGwsXG4gICAgICBvbkxvYWQ6IG51bGwsXG4gICAgICBvbkVycm9yOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBzdGF0ZSwgcHJvcHMgfSA9IHNcbiAgICBsZXQgeyB3aWR0aCwgaGVpZ2h0IH0gPSBwcm9wc1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17Y2xhc3NuYW1lcygnYXAtdXBsb2FkJywgcHJvcHMuY2xhc3NOYW1lKX1cbiAgICAgICAgICAgc3R5bGU9e09iamVjdC5hc3NpZ24oe30sIHByb3BzLnN0eWxlKX0+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiZmlsZVwiXG4gICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhcC11cGxvYWQtaW5wdXRcIlxuICAgICAgICAgICAgICAgbXVsdGlwbGU9eyBwcm9wcy5tdWx0aXBsZSB9XG4gICAgICAgICAgICAgICBuYW1lPXsgcHJvcHMubmFtZSB9XG4gICAgICAgICAgICAgICBpZD17IHByb3BzLmlkIH1cbiAgICAgICAgICAgICAgIGFjY2VwdD17IHByb3BzLmFjY2VwdCB9XG4gICAgICAgICAgICAgICBvbkNoYW5nZT17cy5oYW5kbGVDaGFuZ2V9XG4gICAgICAgICAgICAgICBzdHlsZT17e3dpZHRoLCBoZWlnaHR9fVxuICAgICAgICAvPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWxhYmVsXCIgaHRtbEZvcj17IHByb3BzLmlkIH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1hbGlnbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWxhYmVsLWlubmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9eyBjbGFzc25hbWVzKFwiYXAtdXBsb2FkLWljb25cIiwgcHJvcHMuaWNvbikgfS8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC11cGxvYWQtdGV4dFwiPntwcm9wcy50ZXh0fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2xhYmVsPlxuICAgICAgICB7IHMuX3JlbmRlclByZXZpZXdJbWFnZShzdGF0ZS51cmxzLCB3aWR0aCwgaGVpZ2h0KSB9XG4gICAgICAgIHsgcy5fcmVuZGVyUmVtb3ZlQnV0dG9uKCEhKHN0YXRlLnVybHMgJiYgc3RhdGUudXJscy5sZW5ndGggPiAwKSwgcHJvcHMuY2xvc2VJY29uKSB9XG4gICAgICAgIHsgcy5fcmVuZGVyU3Bpbm5lcihzdGF0ZS5zcGlubmluZywgcHJvcHMuc3Bpbm5lcikgfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIExpZmVjeWNsZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBDdXN0b21cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgaGFuZGxlQ2hhbmdlIChlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIGxldCB7IHRhcmdldCB9ID0gZVxuICAgIGxldCBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRhcmdldC5maWxlcywgMClcblxuICAgIGxldCB7IG9uQ2hhbmdlLCBvbkVycm9yLCBvbkxvYWQgfSA9IHByb3BzXG5cbiAgICBzLnNldFN0YXRlKHsgc3Bpbm5pbmc6IHRydWUgfSlcbiAgICBpZiAob25DaGFuZ2UpIHtcbiAgICAgIG9uQ2hhbmdlKGUpXG4gICAgfVxuICAgIGFzeW5jLmNvbmNhdChmaWxlcywgQXBVcGxvYWQucmVhZEZpbGUsIChlcnIsIHVybHMpID0+IHtcbiAgICAgIGUudXJscyA9IHVybHNcbiAgICAgIGUudGFyZ2V0ID0gdGFyZ2V0XG4gICAgICBzLnNldFN0YXRlKHtcbiAgICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyLFxuICAgICAgICB1cmxzOiB1cmxzXG4gICAgICB9KVxuICAgICAgaWYgKGVycikge1xuICAgICAgICBpZiAob25FcnJvcikge1xuICAgICAgICAgIG9uRXJyb3IoZXJyKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAob25Mb2FkKSB7XG4gICAgICAgICAgb25Mb2FkKGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9LFxuXG4gIGhhbmRsZVJlbW92ZSgpIHtcbiAgICBjb25zdCBzID0gdGhpcyxcbiAgICAgIHsgcHJvcHMgfSA9IHMsXG4gICAgICB7IG9uTG9hZCB9ID0gcHJvcHNcbiAgICBzLnNldFN0YXRlKHtcbiAgICAgIGVycm9yOiBudWxsLFxuICAgICAgdXJsczogbnVsbFxuICAgIH0pXG4gICAgaWYgKG9uTG9hZCkge1xuICAgICAgb25Mb2FkKFtdKVxuICAgIH1cbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gUHJpdmF0ZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICBfcmVuZGVyU3Bpbm5lciAoc3Bpbm5pbmcsIHRoZW1lKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICByZXR1cm4gKFxuICAgICAgPEFwU3Bpbm5lciBlbmFibGVkPXtzcGlubmluZ30gdGhlbWU9e3RoZW1lfT5cbiAgICAgIDwvQXBTcGlubmVyPlxuICAgIClcbiAgfSxcblxuICBfcmVuZGVyUmVtb3ZlQnV0dG9uIChyZW1vdmFibGUsIGljb24pIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGlmICghcmVtb3ZhYmxlKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIG9uVGFwPXsgcy5oYW5kbGVSZW1vdmUgfSBjbGFzc05hbWU9XCJhcC11cGxvYWQtcmVtb3ZlLWJ1dHRvblwiPlxuICAgICAgICA8aSBjbGFzc05hbWU9eyBjbGFzc25hbWVzKFwiYXAtdXBsb2FkLXJlbW92ZS1pY29uXCIsIGljb24pIH0vPlxuICAgICAgPC9BcEJ1dHRvbj5cbiAgICApXG4gIH0sXG5cbiAgX3JlbmRlclByZXZpZXdJbWFnZSAodXJscywgd2lkdGgsIGhlaWdodCkge1xuICAgIGlmICghdXJscykge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICByZXR1cm4gdXJsc1xuICAgICAgLmZpbHRlcigodXJsKSA9PiBBcFVwbG9hZC5pc0ltYWdlVXJsKHVybCkpXG4gICAgICAubWFwKCh1cmwsIGkpID0+IChcbiAgICAgICAgPEFwSW1hZ2Uga2V5PXsgdXJsIH1cbiAgICAgICAgICAgICAgICAgc3JjPXsgdXJsIH1cbiAgICAgICAgICAgICAgICAgaGVpZ2h0PXsgaGVpZ2h0IH1cbiAgICAgICAgICAgICAgICAgd2lkdGg9eyB3aWR0aCB9XG4gICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoXCJhcC11cGxvYWQtcHJldmlldy1pbWFnZVwiKSB9XG4gICAgICAgICAgICAgICAgIHN0eWxlPXsge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IGAke2kgKiAxMH0lYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGAke2kgKiAxMH0lYFxuICAgICAgICAgICAgICAgICAgICAgICAgIH0gfVxuICAgICAgICAgICAgICAgICBzY2FsZT1cImZpdFwiPlxuICAgICAgICA8L0FwSW1hZ2U+XG4gICAgICApKVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwVXBsb2FkXG4iLCIvKipcbiAqIEJpZyBidXR0b24gY29tcG9uZW50LlxuICogQGNvbnN0cnVjdG9yIEFwQmlnQnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwQmlnQnV0dG9uICovXG5jb25zdCBBcEJpZ0J1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIGRpc2FibGVkOiB0eXBlcy5ib29sLFxuICAgIG9uVGFwOiB0eXBlcy5mdW5jLFxuICAgIHRleHQ6IHR5cGVzLnN0cmluZyxcbiAgICBzaXplOiB0eXBlcy5udW1iZXJcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsLFxuICAgICAgc2l6ZTogOTRcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgbGV0IHsgc2l6ZSB9ID0gcHJvcHNcbiAgICBsZXQgc3R5bGUgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHdpZHRoOiBzaXplLCBoZWlnaHQ6IHNpemVcbiAgICB9LCBwcm9wcy5zdHlsZSlcbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIHsgLi4ucHJvcHMgfVxuICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1iaWctYnV0dG9uJywgcHJvcHMuY2xhc3NOYW1lKSB9XG4gICAgICAgIHdpZGU9eyBmYWxzZSB9XG4gICAgICAgIHN0eWxlPXsgc3R5bGUgfVxuICAgICAgPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLWJpZy1idXR0b24tdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHByb3BzLnRleHQgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L0FwQnV0dG9uPlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBBcEJpZ0J1dHRvblxuIiwiLyoqXG4gKiBCdXR0b24gY29tcG9uZW50LlxuICogQGNvbnN0cnVjdG9yIEFwQnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuXG5pbXBvcnQge0FwVG91Y2hNaXhpbiwgQXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBCdXR0b24gKi9cbmxldCBBcEJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIC8qKiBEaXNhYmxlIGJ1dHRvbiB0YXAgKi9cbiAgICBkaXNhYmxlZDogdHlwZXMuYm9vbCxcbiAgICAvKiogUmVuZGVyIHdpdGggcHJpbWFyeSBzdHlsZSAqL1xuICAgIHByaW1hcnk6IHR5cGVzLmJvb2wsXG4gICAgLyoqIFJlbmRlciB3aXRoIGRhbmdlciBzdHlsZSAqL1xuICAgIGRhbmdlcjogdHlwZXMuYm9vbCxcbiAgICAvKiogUmVuZGVyIHdpdGggd2lkZSBzdHlsZSAqL1xuICAgIHdpZGU6IHR5cGVzLmJvb2wsXG4gICAgLyoqIEFuY2hvciBocmVmICovXG4gICAgaHJlZjogdHlwZXMuc3RyaW5nLFxuICAgIC8qKiBEb2N1bWVudCBpZCAqL1xuICAgIGlkOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIEhpZGUgYnV0dG9uICovXG4gICAgaGlkZGVuOiB0eXBlcy5ib29sLFxuICAgIC8qKiBSZW5kZXIgd2l0aCBzaW1wbGUgc3R5bGUgKi9cbiAgICBzaW1wbGU6IHR5cGVzLmJvb2wsXG4gICAgLyoqIERhdGEgZm9yIHRvdWNoIGV2ZW50cyAqL1xuICAgIGRhdGE6IHR5cGVzLmFueVxuICB9LFxuXG4gIG1peGluczogW1xuICAgIEFwVG91Y2hNaXhpbixcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgLyoqIEZvciBiaXQgdGFwcGluZyAqL1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgLyoqIFJlbmRlciB3aXRoIHByaW1hcnkgc3R5bGUgKi9cbiAgICAgIHByaW1hcnk6IGZhbHNlLFxuICAgICAgLyoqIFJlbmRlciB3aXRoIGRhbmdlciBzdHlsZSAqL1xuICAgICAgZGFuZ2VyOiBmYWxzZSxcbiAgICAgIHdpZGU6IGZhbHNlLFxuICAgICAgaHJlZjogbnVsbCxcbiAgICAgIC8qKiBEb2N1bWVudCBpZCAqL1xuICAgICAgaWQ6IG51bGwsXG4gICAgICAvKiogRGlzcGxheSBoaWRkZW4gKi9cbiAgICAgIGhpZGRlbjogZmFsc2UsXG4gICAgICAvKiogU2ltcGxlIHN0eWxlICovXG4gICAgICBzaW1wbGU6IGZhbHNlLFxuICAgICAgLyoqIERhdGEgZm9yIGV2ZW50ICovXG4gICAgICBkYXRhOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgbGV0IGNsYXNzTmFtZSA9IGNsYXNzbmFtZXMoJ2FwLWJ1dHRvbicsIHByb3BzLmNsYXNzTmFtZSwge1xuICAgICAgJ2FwLWJ1dHRvbi1wcmltYXJ5JzogcHJvcHMucHJpbWFyeSxcbiAgICAgICdhcC1idXR0b24tZGFuZ2VyJzogcHJvcHMuZGFuZ2VyLFxuICAgICAgJ2FwLWJ1dHRvbi13aWRlJzogcHJvcHMud2lkZSxcbiAgICAgICdhcC1idXR0b24tZGlzYWJsZWQnOiBwcm9wcy5kaXNhYmxlZCxcbiAgICAgICdhcC1idXR0b24tc2ltcGxlJzogcHJvcHMuc2ltcGxlLFxuICAgICAgJ2FwLWJ1dHRvbi1oaWRkZW4nOiBwcm9wcy5oaWRkZW5cbiAgICB9KVxuICAgIHJldHVybiAoXG4gICAgICA8YSBjbGFzc05hbWU9eyBjbGFzc05hbWUgfVxuICAgICAgICAgaHJlZj17IHByb3BzLmhyZWYgfVxuICAgICAgICAgaWQ9eyBwcm9wcy5pZCB9XG4gICAgICAgICBzdHlsZT17IE9iamVjdC5hc3NpZ24oe30sIHByb3BzLnN0eWxlKSB9XG4gICAgICA+eyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L2E+XG4gICAgKVxuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEZvciBBcFRvdWNoTWl4aW5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZ2V0VG91Y2hEYXRhICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgcmV0dXJuIHByb3BzLmRhdGFcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBBcEJ1dHRvblxuIiwiLyoqXG4gKiBCdXR0b24gZ3JvdXAgY29tcG9uZW50LlxuICogQGNvbnN0cnVjdG9yIEFwQnV0dG9uR3JvdXBcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5cbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBCdXR0b25Hcm91cCAqL1xuY29uc3QgQXBCdXR0b25Hcm91cCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge30sXG5cbiAgbWl4aW5zOiBbXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1idXR0b24tZ3JvdXAnLCBwcm9wcy5jbGFzc05hbWUpIH0+XG4gICAgICAgIHsgcHJvcHMuY2hpbGRyZW4gfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwQnV0dG9uR3JvdXBcbiIsIi8qKlxuICogU3R5bGUgZm9yIEFwQnV0dG9uLlxuICogQGNvbnN0cnVjdG9yIEFwQnV0dG9uU3R5bGVcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJ1xuXG4vKiogQGxlbmRzIEFwQnV0dG9uU3R5bGUgKi9cbmNvbnN0IEFwQnV0dG9uU3R5bGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIHNjb3BlOiB0eXBlcy5ib29sLFxuICAgIHN0eWxlOiB0eXBlcy5vYmplY3QsXG4gICAgaGlnaGxpZ2h0Q29sb3I6IHR5cGVzLnN0cmluZyxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IHR5cGVzLnN0cmluZyxcbiAgICBkYW5nZXJDb2xvcjogdHlwZXMuc3RyaW5nLFxuICAgIGRpc2FibGVkQ29sb3I6IHR5cGVzLnN0cmluZ1xuICB9LFxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY29wZTogZmFsc2UsXG4gICAgICBzdHlsZToge30sXG4gICAgICBoaWdobGlnaHRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0hJR0hMSUdIVF9DT0xPUixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0JBQ0tHUk9VTkRfQ09MT1IsXG4gICAgICBkYW5nZXJDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0RBTkdFUl9DT0xPUixcbiAgICAgIGRpc2FibGVkQ29sb3I6ICcjQUFBJ1xuICAgIH1cbiAgfSxcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCBwcm9wcyA9IHMucHJvcHNcblxuICAgIGxldCB7XG4gICAgICBoaWdobGlnaHRDb2xvcixcbiAgICAgIGJhY2tncm91bmRDb2xvcixcbiAgICAgIGRhbmdlckNvbG9yLFxuICAgICAgZGlzYWJsZWRDb2xvclxuICAgIH0gPSBwcm9wc1xuXG4gICAgbGV0IGRhdGEgPSB7XG4gICAgICAnLmFwLWJ1dHRvbic6IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICBwYWRkaW5nOiAnMC41ZW0gMWVtJyxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAnMnB4JyxcbiAgICAgICAgbWFyZ2luOiAnNHB4JyxcbiAgICAgICAgY29sb3I6IGAke2hpZ2hsaWdodENvbG9yfWAsXG4gICAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke2hpZ2hsaWdodENvbG9yfWAsXG4gICAgICAgIGJhY2tncm91bmQ6IGAke2JhY2tncm91bmRDb2xvcn1gLFxuICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgIE1velVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgTXNVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgIFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJpZy1idXR0b24nOiB7XG4gICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsXG4gICAgICAgIGJvcmRlcldpZHRoOiAnNHB4JyxcbiAgICAgICAgcGFkZGluZzogMCxcbiAgICAgICAgYm94U2hhZG93OiAnMnB4IDJweCA0cHggcmdiYSgwLDAsMCwwLjIpJyxcbiAgICAgICAgd2hpdGVTcGFjZTogJ25vcm1hbCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJpZy1idXR0b246YWN0aXZlJzoge1xuICAgICAgICBib3hTaGFkb3c6ICdub25lJ1xuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uID4gKic6IHtcbiAgICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnXG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b246aG92ZXInOiB7XG4gICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbjphY3RpdmUnOiB7XG4gICAgICAgIGJveFNoYWRvdzogJzFweCAxcHggMnB4IHJnYmEoMCwwLDAsMC4xKSBpbnNldCcsXG4gICAgICAgIG9wYWNpdHk6IDAuOFxuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLmFwLWJ1dHRvbi1kaXNhYmxlZCwuYXAtYnV0dG9uLmFwLWJ1dHRvbi1kaXNhYmxlZDpob3ZlciwuYXAtYnV0dG9uLmFwLWJ1dHRvbi1kaXNhYmxlZDphY3RpdmUnOiB7XG4gICAgICAgIGN1cnNvcjogJ2RlZmF1bHQnLFxuICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcbiAgICAgICAgY29sb3I6IGAke2Rpc2FibGVkQ29sb3J9YCxcbiAgICAgICAgYm9yZGVyQ29sb3I6IGAke2Rpc2FibGVkQ29sb3J9YCxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI0YwRjBGMCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbi1wcmltYXJ5Jzoge1xuICAgICAgICBjb2xvcjogJ3doaXRlJyxcbiAgICAgICAgYmFja2dyb3VuZDogYCR7aGlnaGxpZ2h0Q29sb3J9YFxuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLWRhbmdlcic6IHtcbiAgICAgICAgY29sb3I6ICd3aGl0ZScsXG4gICAgICAgIGJhY2tncm91bmQ6IGAke2RhbmdlckNvbG9yfWBcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbi13aWRlJzoge1xuICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICBib3hTaXppbmc6ICdib3JkZXItYm94JyxcbiAgICAgICAgbWF4V2lkdGg6ICcyNDBweCcsXG4gICAgICAgIG1hcmdpbkxlZnQ6IDAsXG4gICAgICAgIG1hcmdpblJpZ2h0OiAwXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbic6IHtcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnaW5oZXJpdCcsXG4gICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJ1xuICAgICAgfSxcbiAgICAgICcuYXAtaWNvbi1idXR0b24tc2ltcGxlJzoge1xuICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50J1xuICAgICAgfSxcbiAgICAgICcuYXAtaWNvbi1idXR0b24tc2ltcGxlOmFjdGl2ZSc6IHtcbiAgICAgICAgYm94U2hhZG93OiAnbm9uZScsXG4gICAgICAgIG9wYWNpdHk6ICcwLjgnXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbi1zaW1wbGUgLmFwLWljb24tYnV0dG9uLWljb24nOiB7XG4gICAgICAgIGZvbnRTaXplOiAnaW5oZXJpdCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uLWljb24nOiB7XG4gICAgICAgIG1hcmdpbjogJzJweCAwJyxcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgZm9udFNpemU6ICcyZW0nXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbi10ZXh0Jzoge1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICBmb250U2l6ZTogJzAuNjZlbScsXG4gICAgICAgIHBhZGRpbmc6ICcycHggMCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uLXJvdyc6IHtcbiAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICBtYXhXaWR0aDogQXBTdHlsZS5DT05URU5UX1dJRFRILFxuICAgICAgICBtYXJnaW46ICcwIGF1dG8nXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbi1yb3cgLmFwLWJ1dHRvbic6IHtcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtY2VsbC1idXR0b24nOiB7XG4gICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgIGxpbmVIZWlnaHQ6ICcxZW0nLFxuICAgICAgICBmb250U2l6ZTogJzE0cHgnLFxuICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgIGJvcmRlclJhZGl1czogMCxcbiAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWNlbGwtYnV0dG9uLWFsaWduZXInOiB7XG4gICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICB3aWR0aDogJzFweCcsXG4gICAgICAgIG1hcmdpblJpZ2h0OiAnLTFweCcsXG4gICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICBwYWRkaW5nOiAnOHB4IDAnLFxuICAgICAgICB2ZXJ0aWNhbEFsaWduOiAnbWlkZGxlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtY2VsbC1idXR0b24tdGV4dCc6IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHZlcnRpY2FsQWxpZ246ICdtaWRkbGUnXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbi1yb3cnOiB7XG4gICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgbWF4V2lkdGg6IEFwU3R5bGUuQ09OVEVOVF9XSURUSCxcbiAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgbWFyZ2luOiAnOHB4IGF1dG8nXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbi1yb3cgLmFwLWNlbGwtYnV0dG9uJzoge1xuICAgICAgICBib3JkZXJSaWdodENvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICBib3JkZXJCb3R0b21Db2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtY2VsbC1idXR0b24tcm93IC5hcC1jZWxsLWJ1dHRvbjpmaXJzdC1jaGlsZCc6IHtcbiAgICAgICAgYm9yZGVyTGVmdENvbG9yOiAndHJhbnNwYXJlbnQnXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbi1yb3cgLmFwLWJ1dHRvbic6IHtcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtbmV4dC1idXR0b24sLmFwLXByZXYtYnV0dG9uJzoge1xuICAgICAgICBwYWRkaW5nOiAnMC4yNWVtIDFlbSdcbiAgICAgIH0sXG4gICAgICAnLmFwLW5leHQtYnV0dG9uLWljb24nOiB7XG4gICAgICAgIG1hcmdpbkxlZnQ6ICc0cHgnLFxuICAgICAgICBtYXJnaW5SaWdodDogMFxuICAgICAgfSxcbiAgICAgICcuYXAtcHJldi1idXR0b24taWNvbic6IHtcbiAgICAgICAgbWFyZ2luTGVmdDogMCxcbiAgICAgICAgbWFyZ2luUmlnaHQ6ICc0cHgnXG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b24taGlkZGVuJzoge1xuICAgICAgICBkaXNwbGF5OiAnbm9uZSAhaW1wb3J0YW50J1xuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLXNpbXBsZSc6IHtcbiAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbi1zaW1wbGU6YWN0aXZlJzoge1xuICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcbiAgICAgICAgb3BhY2l0eTogJzAuOCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbi1ncm91cCc6IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJ1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgc21hbGxNZWRpYURhdGEgPSB7fVxuICAgIGxldCBtZWRpdW1NZWRpYURhdGEgPSB7fVxuICAgIGxldCBsYXJnZU1lZGlhRGF0YSA9IHt9XG4gICAgcmV0dXJuIChcbiAgICAgIDxBcFN0eWxlIHNjb3BlZD17IHByb3BzLnNjb3BlZCB9XG4gICAgICAgICAgICAgICBkYXRhPXsgT2JqZWN0LmFzc2lnbihkYXRhLCBwcm9wcy5zdHlsZSkgfVxuICAgICAgICAgICAgICAgc21hbGxNZWRpYURhdGE9eyBzbWFsbE1lZGlhRGF0YSB9XG4gICAgICAgICAgICAgICBtZWRpdW1NZWRpYURhdGE9eyBtZWRpdW1NZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbGFyZ2VNZWRpYURhdGE9eyBsYXJnZU1lZGlhRGF0YSB9XG4gICAgICA+eyBwcm9wcy5jaGlsZHJlbiB9PC9BcFN0eWxlPlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBBcEJ1dHRvblN0eWxlXG4iLCIvKipcbiAqIENlbGwgYnV0dG9uIGNvbXBvbmVudC5cbiAqIEBjb25zdHJ1Y3RvciBBcENlbGxCdXR0b25cbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgQXBCdXR0b24gZnJvbSAnLi9hcF9idXR0b24nXG5cbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBDZWxsQnV0dG9uICovXG5jb25zdCBBcENlbGxCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICBkaXNhYmxlZDogdHlwZXMuYm9vbCxcbiAgICBvblRhcDogdHlwZXMuZnVuYyxcbiAgICB0ZXh0OiB0eXBlcy5zdHJpbmdcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgcHJvcHMgPSBzLnByb3BzXG4gICAgcmV0dXJuIChcbiAgICAgIDxBcEJ1dHRvbiB7IC4uLnByb3BzIH1cbiAgICAgICAgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtY2VsbC1idXR0b24nLCBwcm9wcy5jbGFzc05hbWUpIH1cbiAgICAgICAgd2lkZT17IGZhbHNlIH1cbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtY2VsbC1idXR0b24tYWxpZ25lclwiPiZuYnNwOzwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtY2VsbC1idXR0b24tdGV4dFwiPnsgcHJvcHMudGV4dCB9PC9zcGFuPlxuICAgICAgPC9BcEJ1dHRvbj5cbiAgICApXG4gIH1cblxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBBcENlbGxCdXR0b25cbiIsIi8qKlxuICogUm93IGZvciBDZWxsIGJ1dHRvbnMuXG4gKiBAY29uc3RydWN0b3IgQXBDZWxsQnV0dG9uUm93XG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuXG4vKiogQGxlbmRzIEFwQ2VsbEJ1dHRvblJvdyAqL1xuY29uc3QgQXBDZWxsQnV0dG9uUm93ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7fSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtY2VsbC1idXR0b24tcm93JywgcHJvcHMuY2xhc3NOYW1lKSB9PlxuICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwQ2VsbEJ1dHRvblJvd1xuIiwiLyoqXG4gKiBJY29uIGJ1dHRvbiBjb21wb25lbnQuXG4gKiBAY29uc3RydWN0b3IgQXBJY29uQnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IHtBcEljb259IGZyb20gJ2FwZW1hbi1yZWFjdC1pY29uJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwSWNvbkJ1dHRvbiAqL1xuY29uc3QgQXBJY29uQnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgaWNvbjogdHlwZXMuc3RyaW5nLFxuICAgIHRleHQ6IHR5cGVzLnN0cmluZyxcbiAgICBzaW1wbGU6IHR5cGVzLmJvb2xcbiAgfSxcblxuICBzdGF0aWNzOiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgaWNvbiBidXR0b24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUZXh0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGljb24gLSBJY29uIGNsYXNzXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gb25UYXAgLSBUYXAgY2FsbGJhY2tcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBPdGhlciBwcm9wcy5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFJlYWN0IGVsZW1lbnQuXG4gICAgICovXG4gICAgY3JlYXRlQnV0dG9uICh0ZXh0LCBpY29uLCBvblRhcCwgcHJvcHMpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxBcEljb25CdXR0b24gdGV4dD17IHRleHQgfVxuICAgICAgICAgICAgICAgICAgICAgIGljb249eyBpY29uIH1cbiAgICAgICAgICAgICAgICAgICAgICBvblRhcD17IG9uVGFwIH1cbiAgICAgICAgICB7IC4uLnByb3BzIH1cbiAgICAgICAgLz5cbiAgICAgIClcbiAgICB9XG4gIH0sXG5cbiAgbWl4aW5zOiBbXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGljb246IG51bGwsXG4gICAgICB0ZXh0OiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiAoXG4gICAgICA8QXBCdXR0b24geyAuLi5wcm9wcyB9XG4gICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLWljb24tYnV0dG9uJywge1xuICAgICAgICAgICAgICAgICdhcC1pY29uLWJ1dHRvbi1zaW1wbGUnOiAhIXByb3BzLnNpbXBsZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb3BzLmNsYXNzTmFtZSkgfVxuICAgICAgICB3aWRlPXsgZmFsc2UgfVxuICAgICAgPlxuICAgICAgICA8QXBJY29uIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLWljb24tYnV0dG9uLWljb24nLCBwcm9wcy5pY29uLCB7XG4gICAgICAgICAgICAgICAgfSl9Lz5cbiAgICAgICAge3Byb3BzLnRleHQgPyA8c3BhbiBjbGFzc05hbWU9XCJhcC1pY29uLWJ1dHRvbi10ZXh0XCI+eyBwcm9wcy50ZXh0IH08L3NwYW4+IDogbnVsbH1cbiAgICAgIDwvQXBCdXR0b24+XG4gICAgKVxuICB9XG5cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gQXBJY29uQnV0dG9uXG4iLCIvKipcbiAqIFJvdyBmb3IgSWNvbiBidXR0b25zLlxuICogQGNvbnN0cnVjdG9yIEFwSWNvbkJ1dHRvblJvd1xuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuXG4vKiogQGxlbmRzIEFwSWNvbkJ1dHRvblJvdyAqL1xuY29uc3QgQXBJY29uQnV0dG9uUm93ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7fSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtaWNvbi1idXR0b24tcm93JywgcHJvcHMuY2xhc3NOYW1lKSB9PlxuICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwSWNvbkJ1dHRvblJvdztcblxuXG4iLCIvKipcbiAqIE5leHQgYnV0dG9uIGNvbXBvbmVudC5cbiAqIEBjb25zdHJ1Y3RvciBBcE5leHRCdXR0b25cbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgQXBCdXR0b24gZnJvbSAnLi9hcF9idXR0b24nXG5pbXBvcnQge0FwSWNvbn0gZnJvbSAnYXBlbWFuLXJlYWN0LWljb24nXG5cbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBOZXh0QnV0dG9uICovXG5jb25zdCBBcE5leHRCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICBkaXNhYmxlZDogdHlwZXMuYm9vbCxcbiAgICBvblRhcDogdHlwZXMuZnVuYyxcbiAgICB0ZXh0OiB0eXBlcy5zdHJpbmcsXG4gICAgc2l6ZTogdHlwZXMubnVtYmVyLFxuICAgIGljb246IHR5cGVzLnN0cmluZ1xuICB9LFxuXG4gIG1peGluczogW1xuICAgIEFwUHVyZU1peGluXG4gIF0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlICgpIHtcbiAgICByZXR1cm4ge31cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkaXNhYmxlZDogZmFsc2UsXG4gICAgICBvblRhcDogbnVsbCxcbiAgICAgIHRleHQ6IG51bGwsXG4gICAgICBpY29uOiAnZmEgZmEtY2FyZXQtcmlnaHQnXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiAoXG4gICAgICA8QXBCdXR0b24geyAuLi5wcm9wcyB9XG4gICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLW5leHQtYnV0dG9uJywgcHJvcHMuY2xhc3NOYW1lKSB9XG4gICAgICAgIHdpZGU9eyBmYWxzZSB9XG4gICAgICAgIHN0eWxlPXtPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSl9XG4gICAgICA+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtbmV4dC1idXR0b24tdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHByb3BzLnRleHQgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICAgIDxBcEljb24gY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtbmV4dC1idXR0b24taWNvbicsIHByb3BzLmljb24pfS8+XG4gICAgICA8L0FwQnV0dG9uPlxuICAgIClcbiAgfVxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwTmV4dEJ1dHRvblxuIiwiLyoqXG4gKiBQcmV2IGJ1dHRvbiBjb21wb25lbnQuXG4gKiBAY29uc3RydWN0b3IgQXBQcmV2QnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuaW1wb3J0IHtBcEljb259IGZyb20gJ2FwZW1hbi1yZWFjdC1pY29uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwUHJldkJ1dHRvbiAqL1xuY29uc3QgQXBQcmV2QnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZGlzYWJsZWQ6IHR5cGVzLmJvb2wsXG4gICAgb25UYXA6IHR5cGVzLmZ1bmMsXG4gICAgdGV4dDogdHlwZXMuc3RyaW5nLFxuICAgIHNpemU6IHR5cGVzLm51bWJlcixcbiAgICBpY29uOiB0eXBlcy5zdHJpbmdcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsLFxuICAgICAgaWNvbjogJ2ZhIGZhLWNhcmV0LWxlZnQnXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiAoXG4gICAgICA8QXBCdXR0b24geyAuLi5wcm9wcyB9XG4gICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLXByZXYtYnV0dG9uJywgcHJvcHMuY2xhc3NOYW1lKSB9XG4gICAgICAgIHdpZGU9eyBmYWxzZSB9XG4gICAgICAgIHN0eWxlPXtPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSl9XG4gICAgICA+XG4gICAgICAgIDxBcEljb24gY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtcHJldi1idXR0b24taWNvbicsIHByb3BzLmljb24pfS8+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtcHJldi1idXR0b24tdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHByb3BzLnRleHQgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L0FwQnV0dG9uPlxuICAgIClcbiAgfVxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwUHJldkJ1dHRvblxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3IgYnV0dG9uIGNvbXBvbmVudC5cbiAqIEBtb2R1bGUgYXBlbWFuLXJlYWN0LWJ1dHRvblxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLyoqXG4gICAqIEBuYW1lIEFwQmlnQnV0dG9uXG4gICAqL1xuICBnZXQgQXBCaWdCdXR0b24gKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9iaWdfYnV0dG9uJykgfSxcbiAgLyoqXG4gICAqIEBuYW1lIEFwQnV0dG9uR3JvdXBcbiAgICovXG4gIGdldCBBcEJ1dHRvbkdyb3VwICgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXBfYnV0dG9uX2dyb3VwJykgfSxcbiAgLyoqXG4gICAqIEBuYW1lIEFwQnV0dG9uU3R5bGVcbiAgICovXG4gIGdldCBBcEJ1dHRvblN0eWxlICgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXBfYnV0dG9uX3N0eWxlJykgfSxcbiAgLyoqXG4gICAqIEBuYW1lIEFwQnV0dG9uXG4gICAqL1xuICBnZXQgQXBCdXR0b24gKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9idXR0b24nKSB9LFxuICAvKipcbiAgICogQG5hbWUgQXBDZWxsQnV0dG9uUm93XG4gICAqL1xuICBnZXQgQXBDZWxsQnV0dG9uUm93ICgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXBfY2VsbF9idXR0b25fcm93JykgfSxcbiAgLyoqXG4gICAqIEBuYW1lIEFwQ2VsbEJ1dHRvblxuICAgKi9cbiAgZ2V0IEFwQ2VsbEJ1dHRvbiAoKSB7IHJldHVybiByZXF1aXJlKCcuL2FwX2NlbGxfYnV0dG9uJykgfSxcbiAgLyoqXG4gICAqIEBuYW1lIEFwSWNvbkJ1dHRvblJvd1xuICAgKi9cbiAgZ2V0IEFwSWNvbkJ1dHRvblJvdyAoKSB7IHJldHVybiByZXF1aXJlKCcuL2FwX2ljb25fYnV0dG9uX3JvdycpIH0sXG4gIC8qKlxuICAgKiBAbmFtZSBBcEljb25CdXR0b25cbiAgICovXG4gIGdldCBBcEljb25CdXR0b24gKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9pY29uX2J1dHRvbicpIH0sXG4gIC8qKlxuICAgKiBAbmFtZSBBcE5leHRCdXR0b25cbiAgICovXG4gIGdldCBBcE5leHRCdXR0b24gKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9uZXh0X2J1dHRvbicpIH0sXG4gIC8qKlxuICAgKiBAbmFtZSBBcFByZXZCdXR0b25cbiAgICovXG4gIGdldCBBcFByZXZCdXR0b24gKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9wcmV2X2J1dHRvbicpIH1cbn1cbiIsIi8qKlxuICogQGZ1bmN0aW9uIF9zY2FsZWRTaXplXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCBudW1jYWwgZnJvbSAnbnVtY2FsJ1xuXG5mdW5jdGlvbiBfc2NhbGVkU2l6ZSAoY29udGVudFNpemUsIGZyYW1lU2l6ZSwgcG9saWN5KSB7XG4gIGxldCBjdyA9IGNvbnRlbnRTaXplLndpZHRoXG4gIGxldCBjaCA9IGNvbnRlbnRTaXplLmhlaWdodFxuICBsZXQgZncgPSBmcmFtZVNpemUud2lkdGhcbiAgbGV0IGZoID0gZnJhbWVTaXplLmhlaWdodFxuXG4gIGxldCB3UmF0ZSA9IG51bWNhbC5taW4oMSwgZncgLyBjdylcbiAgbGV0IGhSYXRlID0gbnVtY2FsLm1pbigxLCBmaCAvIGNoKVxuXG4gIGxldCByYXRlID0gbnVtY2FsLm1pbih3UmF0ZSwgaFJhdGUpXG4gIHN3aXRjaCAocG9saWN5KSB7XG4gICAgY2FzZSAnbm9uZSc6XG4gICAgICByZXR1cm4gY29udGVudFNpemU7XG4gICAgY2FzZSAnZml0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHdpZHRoOiBjb250ZW50U2l6ZS53aWR0aCAqIHJhdGUsXG4gICAgICAgIGhlaWdodDogY29udGVudFNpemUuaGVpZ2h0ICogcmF0ZVxuICAgICAgfVxuICAgIGNhc2UgJ2ZpbGwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgd2lkdGg6IGNvbnRlbnRTaXplLndpZHRoICogcmF0ZSxcbiAgICAgICAgaGVpZ2h0OiBjb250ZW50U2l6ZS5oZWlnaHQgKiByYXRlXG4gICAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwb2xpY3k6ICR7cG9saWN5fWApO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX3NjYWxlZFNpemU7XG4iLCIvKipcbiAqIGFwZW1hbiByZWFjdCBwYWNrYWdlIGZvciBpbWFnZSBjb21wb25lbnQuXG4gKiBAY29uc3RydWN0b3IgQXBJbWFnZVxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgbnVtY2FsIGZyb20gJ251bWNhbCdcbmltcG9ydCBfc2NhbGVkU2l6ZSBmcm9tICcuL19zY2FsZWRfc2l6ZSdcbmltcG9ydCB7QXBTcGlubmVyfSBmcm9tICdhcGVtYW4tcmVhY3Qtc3Bpbm5lcidcbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBJbWFnZSAqL1xubGV0IEFwSW1hZ2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICAvKiogSW1hZ2Ugc2NhbGluZyBwb2xpY3kgKi9cbiAgICBzY2FsZTogdHlwZXMub25lT2YoW1xuICAgICAgJ2ZpdCcsXG4gICAgICAnZmlsbCcsXG4gICAgICAnbm9uZSdcbiAgICBdKSxcbiAgICAvKiogSW1hZ2Ugd2lkdGggKi9cbiAgICB3aWR0aDogdHlwZXMub25lT2ZUeXBlKFsgdHlwZXMubnVtYmVyLCB0eXBlcy5zdHJpbmcgXSksXG4gICAgLyoqIEltYWdlIGhlaWdodCAqL1xuICAgIGhlaWdodDogdHlwZXMub25lT2ZUeXBlKFsgdHlwZXMubnVtYmVyLCB0eXBlcy5zdHJpbmcgXSksXG4gICAgLyoqIEltYWdlIHNyYyBzdHJpbmcgKi9cbiAgICBzcmM6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogQWx0IHRlc3QgKi9cbiAgICBhbHQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogVGhlbSBvZiBzcGlubmVyICovXG4gICAgc3Bpbm5lclRoZW1lOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIEhhbmRsZXIgb24gaW1hZ2UgbG9hZCAqL1xuICAgIG9uTG9hZDogdHlwZXMuZnVuYyxcbiAgICAvKiogSGFuZGxlciBvbiBpbWFnZSBlcnJvci4gKi9cbiAgICBvbkVycm9yOiB0eXBlcy5mdW5jXG4gIH0sXG5cbiAgbWl4aW5zOiBbXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBzdGF0aWNzOiB7XG4gICAgc2NhbGVkU2l6ZTogX3NjYWxlZFNpemUsXG4gICAgemVyb0lmTmFOICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzTmFOKHZhbHVlKSA/IDAgOiB2YWx1ZVxuICAgIH0sXG4gICAgbnVsbElmTmFOICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzTmFOKHZhbHVlKSA/IG51bGwgOiB2YWx1ZVxuICAgIH1cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICByZXR1cm4ge1xuICAgICAgaW1nV2lkdGg6IG51bGwsXG4gICAgICBpbWdIZWlnaHQ6IG51bGwsXG4gICAgICBtb3VudGVkOiBmYWxzZSxcbiAgICAgIHJlYWR5OiBmYWxzZSxcbiAgICAgIGxvYWRpbmc6ICEhcy5wcm9wcy5zcmMsXG4gICAgICBlcnJvcjogbnVsbFxuICAgIH1cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjYWxlOiAnbm9uZScsXG4gICAgICB3aWR0aDogbnVsbCxcbiAgICAgIGhlaWdodDogbnVsbCxcbiAgICAgIHNyYzogbnVsbCxcbiAgICAgIGFsdDogXCJOTyBJTUFHRVwiLFxuICAgICAgc3Bpbm5lclRoZW1lOiBBcFNwaW5uZXIuREVGQVVMVF9USEVNRSxcbiAgICAgIG9uTG9hZDogbnVsbCxcbiAgICAgIG9uRXJyb3I6IG51bGxcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzLFxuICAgICAgeyBzdGF0ZSwgcHJvcHMgfSA9IHM7XG5cbiAgICBsZXQgc2l6ZSA9IHtcbiAgICAgIHdpZHRoOiBwcm9wcy53aWR0aCB8fCBudWxsLFxuICAgICAgaGVpZ2h0OiBwcm9wcy5oZWlnaHQgfHwgbnVsbFxuICAgIH1cblxuICAgIGxldCB7IG1vdW50ZWQsIGVycm9yLCByZWFkeSwgbG9hZGluZyB9ID0gc3RhdGVcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1pbWFnZScsIHByb3BzLmNsYXNzTmFtZSwge1xuICAgICAgICAgICAgICAgICdhcC1pbWFnZS1sb2FkaW5nJzogcHJvcHMuc3JjICYmIGxvYWRpbmcsXG4gICAgICAgICAgICAgICAgJ2FwLWltYWdlLXJlYWR5JzogcHJvcHMuc3JjICYmIHJlYWR5XG4gICAgICAgICAgICB9KSB9XG4gICAgICAgICAgIHN0eWxlPXsgT2JqZWN0LmFzc2lnbih7fSwgc2l6ZSwgcHJvcHMuc3R5bGUpIH0+XG4gICAgICAgIHsgbW91bnRlZCAmJiBlcnJvciA/IHMuX3JlbmRlck5vdGZvdW5kKHNpemUpIDogbnVsbH1cbiAgICAgICAgeyBtb3VudGVkICYmICFlcnJvciA/IHMuX3JlbmRlckltZyhzaXplLCBtb3VudGVkKSA6IG51bGwgfVxuICAgICAgICB7IGxvYWRpbmcgPyBzLl9yZW5kZXJTcGlubmVyKHNpemUpIDogbnVsbCB9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gTGlmZWN5Y2xlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgY29tcG9uZW50V2lsbE1vdW50ICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgcy5zZXRTdGF0ZSh7XG4gICAgICBtb3VudGVkOiB0cnVlXG4gICAgfSlcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgcy5yZXNpemVJbWFnZSgpXG4gICAgfSwgMClcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wcykge1xuICAgIGNvbnN0IHMgPSB0aGlzXG5cbiAgICBsZXQgc3JjID0gcy5wcm9wcy5zcmMsXG4gICAgICBuZXh0U3JjID0gbmV4dFByb3BzLnNyYztcbiAgICBsZXQgc3JjQ2hhbmdlZCA9ICEhbmV4dFNyYyAmJiAobmV4dFNyYyAhPT0gc3JjKVxuICAgIGlmIChzcmNDaGFuZ2VkKSB7XG4gICAgICBzLnNldFN0YXRlKHtcbiAgICAgICAgcmVhZHk6IGZhbHNlLFxuICAgICAgICBsb2FkaW5nOiB0cnVlLFxuICAgICAgICBlcnJvcjogbnVsbFxuICAgICAgfSlcbiAgICB9XG5cbiAgfSxcblxuICBjb21wb25lbnRXaWxsVXBkYXRlKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBzLnJlc2l6ZUltYWdlKClcbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEhlbHBlclxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICBoYW5kbGVMb2FkIChlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgcHJvcHMub25Mb2FkKGUpXG4gICAgfVxuXG4gICAgcy5yZXNpemVJbWFnZShlLnRhcmdldC53aWR0aCwgZS50YXJnZXQuaGVpZ2h0KVxuICB9LFxuXG4gIGhhbmRsZUVycm9yIChlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgcy5zZXRTdGF0ZSh7XG4gICAgICBlcnJvcjogZSxcbiAgICAgIGxvYWRpbmc6IGZhbHNlXG4gICAgfSlcblxuICAgIGlmIChwcm9wcy5vbkVycm9yKSB7XG4gICAgICBwcm9wcy5vbkVycm9yKGUpXG4gICAgfVxuICB9LFxuXG4gIHJlc2l6ZUltYWdlIChpbWdDb250ZW50V2lkdGgsIGltZ0NvbnRlbnRIZWlnaHQpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHN0YXRlLCBwcm9wcyB9ID0gc1xuXG4gICAgaW1nQ29udGVudFdpZHRoID0gaW1nQ29udGVudFdpZHRoIHx8IHN0YXRlLmltZ0NvbnRlbnRXaWR0aFxuICAgIGltZ0NvbnRlbnRIZWlnaHQgPSBpbWdDb250ZW50SGVpZ2h0IHx8IHN0YXRlLmltZ0NvbnRlbnRIZWlnaHRcblxuICAgIGxldCB2YWxpZCA9IGltZ0NvbnRlbnRXaWR0aCAmJiBpbWdDb250ZW50SGVpZ2h0XG4gICAgaWYgKCF2YWxpZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgbGV0IGVsbSA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKHMpXG4gICAgbGV0IGZyYW1lU2l6ZSA9IHtcbiAgICAgIHdpZHRoOiBlbG0ub2Zmc2V0V2lkdGgsXG4gICAgICBoZWlnaHQ6IGVsbS5vZmZzZXRIZWlnaHRcbiAgICB9XG4gICAgbGV0IGNvbnRlbnRTaXplID0ge1xuICAgICAgaGVpZ2h0OiBpbWdDb250ZW50SGVpZ2h0LFxuICAgICAgd2lkdGg6IGltZ0NvbnRlbnRXaWR0aFxuICAgIH07XG4gICAgbGV0IHNjYWxlZFNpemUgPSBBcEltYWdlLnNjYWxlZFNpemUoXG4gICAgICBjb250ZW50U2l6ZSwgZnJhbWVTaXplLCBwcm9wcy5zY2FsZVxuICAgICk7XG5cbiAgICBzLnNldFN0YXRlKHtcbiAgICAgIGltZ0NvbnRlbnRXaWR0aDogaW1nQ29udGVudFdpZHRoLFxuICAgICAgaW1nQ29udGVudEhlaWdodDogaW1nQ29udGVudEhlaWdodCxcbiAgICAgIGltZ1dpZHRoOiBzY2FsZWRTaXplLndpZHRoLFxuICAgICAgaW1nSGVpZ2h0OiBzY2FsZWRTaXplLmhlaWdodCxcbiAgICAgIHJlYWR5OiB0cnVlLFxuICAgICAgbG9hZGluZzogZmFsc2VcbiAgICB9KVxuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBQcml2YXRlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuICBfcmVuZGVySW1nIChzaXplKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBzdGF0ZSwgcHJvcHMgfSA9IHNcblxuICAgIGxldCB7IG51bGxJZk5hTiwgemVyb0lmTmFOIH0gPSBBcEltYWdlXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGltZyBzcmM9eyBwcm9wcy5zcmMgfVxuICAgICAgICAgICBhbHQ9eyBwcm9wcy5hbHQgfVxuICAgICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1pbWFnZS1jb250ZW50JykgfVxuICAgICAgICAgICBzdHlsZT17IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogemVyb0lmTmFOKChzaXplLmhlaWdodCAtIHN0YXRlLmltZ0hlaWdodCkgLyAyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IHplcm9JZk5hTigoc2l6ZS53aWR0aCAtIHN0YXRlLmltZ1dpZHRoKSAvIDIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG51bGxJZk5hTihzdGF0ZS5pbWdXaWR0aCksXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IG51bGxJZk5hTihzdGF0ZS5pbWdIZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgICB9IH1cbiAgICAgICAgICAgb25Mb2FkPXsgcy5oYW5kbGVMb2FkIH1cbiAgICAgICAgICAgb25FcnJvcj17IHMuaGFuZGxlRXJyb3IgfVxuICAgICAgLz5cbiAgICApXG4gIH0sXG5cbiAgX3JlbmRlck5vdGZvdW5kIChzaXplKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYXAtaW1hZ2Utbm90Zm91bmRcIlxuICAgICAgICAgICBzdHlsZT17IHtcbiAgICAgICAgICAgICAgICAgICAgbGluZUhlaWdodDogYCR7c2l6ZS5oZWlnaHR9cHhgLFxuICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogYCR7bnVtY2FsLm1pbihzaXplLmhlaWdodCAqIDAuNCwgMTgpfWBcbiAgICAgICAgICAgICAgICAgfSB9XG4gICAgICA+eyBwcm9wcy5hbHQgfTwvZGl2PlxuICAgIClcbiAgfSxcblxuICBfcmVuZGVyU3Bpbm5lciAoc2l6ZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIHJldHVybiAoXG4gICAgICA8QXBTcGlubmVyIGNsYXNzTmFtZT1cImFwLWltYWdlLXNwaW5uZXJcIlxuICAgICAgICAgICAgICAgICB0aGVtZT17IHByb3BzLnNwaW5uZXJUaGVtZSB9XG4gICAgICAgICAgICAgICAgIHN0eWxlPXsge1xuICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzaXplLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICB9IH0vPlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBBcEltYWdlXG4iLCIvKipcbiAqIFN0eWxlIGZvciBBcEltYWdlLlxuICogQGNvbnN0cnVjdG9yIEFwSW1hZ2VTdHlsZVxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtBcFN0eWxlfSBmcm9tICdhcGVtYW4tcmVhY3Qtc3R5bGUnXG5cbi8qKiBAbGVuZHMgQXBJbWFnZVN0eWxlICovXG5jb25zdCBBcEltYWdlU3R5bGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIHNjb3BlZDogdHlwZXMuYm9vbCxcbiAgICBzdHlsZTogdHlwZXMub2JqZWN0LFxuICAgIGJhY2tncm91bmRDb2xvcjogdHlwZXMuc3RyaW5nXG4gIH0sXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlZDogZmFsc2UsXG4gICAgICBzdHlsZToge30sXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjREREJyxcbiAgICAgIHNwaW5Db2xvcjogJ3JnYmEoMjU1LDI1NSwyNTUsMC41KSdcbiAgICB9XG4gIH0sXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgbGV0IHsgYmFja2dyb3VuZENvbG9yLCBzcGluQ29sb3IgfSA9IHByb3BzXG5cbiAgICBsZXQgdHJhbnNpdGlvbkR1cmF0aW9uID0gMTAwXG5cbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgICcuYXAtaW1hZ2UnOiB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogYCR7YmFja2dyb3VuZENvbG9yfWAsXG4gICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnXG4gICAgICB9LFxuICAgICAgJy5hcC1pbWFnZSBpbWcnOiB7XG4gICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgIHRyYW5zaXRpb246IGB3aWR0aCAke3RyYW5zaXRpb25EdXJhdGlvbn1tcywgb3BhY2l0eSAke3RyYW5zaXRpb25EdXJhdGlvbn1tc2BcbiAgICAgIH0sXG4gICAgICAnLmFwLWltYWdlLXJlYWR5IGltZyc6IHtcbiAgICAgICAgb3BhY2l0eTogMVxuICAgICAgfSxcbiAgICAgICcuYXAtaW1hZ2UtY29udGVudCc6IHtcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXG4gICAgICB9LFxuICAgICAgJy5hcC1pbWFnZS1zcGlubmVyJzoge1xuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgbGVmdDogMCxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICB6SW5kZXg6IDgsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMCwwLDAsMC4xKScsXG4gICAgICAgIGNvbG9yOiBgJHtzcGluQ29sb3J9YFxuICAgICAgfSxcbiAgICAgICcuYXAtaW1hZ2Utbm90Zm91bmQnOiB7XG4gICAgICAgIGRpc3BsYXk6ICdibG9jaycsXG4gICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgIGNvbG9yOiAncmdiYSgwLDAsMCwwLjEpJyxcbiAgICAgICAgZm9udEZhbWlseTogJ21vbm9zcGFjZSdcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IHNtYWxsTWVkaWFEYXRhID0ge31cbiAgICBsZXQgbWVkaXVtTWVkaWFEYXRhID0ge31cbiAgICBsZXQgbGFyZ2VNZWRpYURhdGEgPSB7fVxuICAgIHJldHVybiAoXG4gICAgICA8QXBTdHlsZSBzY29wZWQ9eyBwcm9wcy5zY29wZWQgfVxuICAgICAgICAgICAgICAgZGF0YT17IE9iamVjdC5hc3NpZ24oZGF0YSwgcHJvcHMuc3R5bGUpIH1cbiAgICAgICAgICAgICAgIHNtYWxsTWVkaWFEYXRhPXsgc21hbGxNZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbWVkaXVtTWVkaWFEYXRhPXsgbWVkaXVtTWVkaWFEYXRhIH1cbiAgICAgICAgICAgICAgIGxhcmdlTWVkaWFEYXRhPXsgbGFyZ2VNZWRpYURhdGEgfVxuICAgICAgPnsgcHJvcHMuY2hpbGRyZW4gfTwvQXBTdHlsZT5cbiAgICApXG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gQXBJbWFnZVN0eWxlO1xuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3IgaW1hZ2UgY29tcG9uZW50LlxuICogQG1vZHVsZSBhcGVtYW4tcmVhY3QtaW1hZ2VcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8qKlxuICAgKiBAbmFtZSBBcEltYWdlU3R5bGVcbiAgICovXG4gIGdldCBBcEltYWdlU3R5bGUgKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9pbWFnZV9zdHlsZScpIH0sXG4gIC8qKlxuICAgKiBAbmFtZSBBcEltYWdlXG4gICAqL1xuICBnZXQgQXBJbWFnZSAoKSB7IHJldHVybiByZXF1aXJlKCcuL2FwX2ltYWdlJykgfVxufVxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3Igc3Bpbm5lci5cbiAqIEBjb25zdHJ1Y3RvciBBcFNwaW5uZXJcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IG51bWNhbCBmcm9tICdudW1jYWwnXG5pbXBvcnQge0FwUHVyZU1peGluLCBBcExheW91dE1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuaW1wb3J0IGNvbnN0cyBmcm9tICcuL2NvbnN0cydcblxuY29uc3QgREVGQVVMVF9USEVNRSA9ICdjJ1xuXG4vKiogQGxlbmRzIEFwU3Bpbm5lciAqL1xuY29uc3QgQXBTcGlubmVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZW5hYmxlZDogdHlwZXMuYm9vbCxcbiAgICB0aGVtZTogdHlwZXMub25lT2YoXG4gICAgICBPYmplY3Qua2V5cyhjb25zdHMudGhlbWVzKVxuICAgIClcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpbixcbiAgICBBcExheW91dE1peGluXG4gIF0sXG5cbiAgc3RhdGljczoge1xuICAgIERFRkFVTFRfVEhFTUU6IERFRkFVTFRfVEhFTUVcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgdGhlbWU6IERFRkFVTFRfVEhFTUVcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzLCBsYXlvdXRzIH0gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtc3Bpbm5lcicsIHByb3BzLmNsYXNzTmFtZSwge1xuICAgICAgICAgICAgICAgICdhcC1zcGlubmVyLXZpc2libGUnOiAhIWxheW91dHMuc3Bpbm5lcixcbiAgICAgICAgICAgICAgICAnYXAtc3Bpbm5lci1lbmFibGVkJzogISFwcm9wcy5lbmFibGVkXG4gICAgICAgICAgICB9KSB9XG4gICAgICAgICAgIHN0eWxlPXtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgbGF5b3V0cy5zcGlubmVyLCBwcm9wcy5zdHlsZSlcbiAgICAgICAgICAgICAgICAgIH0+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXNwaW5uZXItYWxpZ25lclwiPiZuYnNwOzwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiByZWY9XCJpY29uXCJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NuYW1lcygnYXAtc3Bpbm5lci1pY29uJywgY29uc3RzLnRoZW1lc1twcm9wcy50aGVtZV0pXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXsgbGF5b3V0cy5pY29uIH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIExpZmVjeWNsZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGNvbXBvbmVudERpZE1vdW50ICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIHMuc2V0U3RhdGUoe1xuICAgICAgaWNvblZpc2libGU6IHRydWVcbiAgICB9KVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50ICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEZvciBBcExheW91dE1peGluXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0SW5pdGlhbExheW91dHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzcGlubmVyOiBudWxsLFxuICAgICAgaWNvbjogbnVsbFxuICAgIH1cbiAgfSxcblxuICBjYWxjTGF5b3V0cyAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgbm9kZSA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKHMpXG5cbiAgICBsZXQgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlIHx8IG5vZGUucGFyZW50RWxlbWVudFxuICAgIGxldCB3ID0gbnVtY2FsLm1heChwYXJlbnQub2Zmc2V0V2lkdGgsIG5vZGUub2Zmc2V0V2lkdGgpXG4gICAgbGV0IGggPSBudW1jYWwubWF4KHBhcmVudC5vZmZzZXRIZWlnaHQsIG5vZGUub2Zmc2V0SGVpZ2h0KVxuICAgIGxldCBzaXplID0gbnVtY2FsLm1pbih3LCBoKVxuICAgIGxldCBpY29uU2l6ZSA9IG51bWNhbC5taW4oc2l6ZSAqIDAuNSwgNjApXG5cbiAgICByZXR1cm4ge1xuICAgICAgc3Bpbm5lcjoge1xuICAgICAgICBsaW5lSGVpZ2h0OiBgJHtzaXplfXB4YCxcbiAgICAgICAgZm9udFNpemU6IGAke2ljb25TaXplfXB4YFxuICAgICAgfSxcbiAgICAgIGljb246IHtcbiAgICAgICAgd2lkdGg6IGAke2ljb25TaXplfXB4YCxcbiAgICAgICAgaGVpZ2h0OiBgJHtpY29uU2l6ZX1weGBcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gQXBTcGlubmVyXG4iLCIvKipcbiAqIFN0eWxlIGZvciBBcFNwaW5uZXIuXG4gKiBAY29uc3RydWN0b3IgQXBTcGlubmVyU3R5bGVcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJ1xuXG4vKiogQGxlbmRzIEFwU3Bpbm5lclN0eWxlICovXG5jb25zdCBBcFNwaW5uZXJTdHlsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgc3RhdGljczoge1xuICAgIGFsaWduZXJTdHlsZToge1xuICAgICAgd2lkdGg6IDEsXG4gICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgIG1hcmdpblJpZ2h0OiAnLTFweCcsXG4gICAgICB2ZXJ0aWNhbEFsaWduOiAnbWlkZGxlJyxcbiAgICAgIGNvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgb3BhY2l0eTogMCxcbiAgICAgIGhlaWdodDogJzEwMCUnXG4gICAgfVxuICB9LFxuICBwcm9wVHlwZXM6IHtcbiAgICBzY29wZWQ6IHR5cGVzLmJvb2wsXG4gICAgdHlwZTogdHlwZXMuc3RyaW5nLFxuICAgIHN0eWxlOiB0eXBlcy5vYmplY3RcbiAgfSxcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlZDogZmFsc2UsXG4gICAgICB0eXBlOiAndGV4dC9jc3MnLFxuICAgICAgc3R5bGU6IHt9XG4gICAgfVxuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG5cbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgICcuYXAtc3Bpbm5lcic6IHtcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgZGlzcGxheTogJ25vbmUnXG4gICAgICB9LFxuICAgICAgJy5hcC1zcGlubmVyLmFwLXNwaW5uZXItZW5hYmxlZCc6IHtcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuICAgICAgfSxcbiAgICAgICcuYXAtc3Bpbm5lci1pY29uJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgbWFyZ2luOiAnMCA0cHgnLFxuICAgICAgICB0cmFuc2l0aW9uOiAnb3BhY2l0eSAxMDBtcycsXG4gICAgICAgIG9wYWNpdHk6IDBcbiAgICAgIH0sXG4gICAgICAnLmFwLXNwaW5uZXItdmlzaWJsZSAuYXAtc3Bpbm5lci1pY29uJzoge1xuICAgICAgICBvcGFjaXR5OiAxXG4gICAgICB9LFxuICAgICAgJy5hcC1zcGlubmVyLWFsaWduZXInOiBBcFNwaW5uZXJTdHlsZS5hbGlnbmVyU3R5bGVcbiAgICB9XG4gICAgbGV0IHNtYWxsTWVkaWFEYXRhID0ge31cbiAgICBsZXQgbWVkaXVtTWVkaWFEYXRhID0ge31cbiAgICBsZXQgbGFyZ2VNZWRpYURhdGEgPSB7fVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxBcFN0eWxlIHNjb3BlZD17IHByb3BzLnNjb3BlZCB9XG4gICAgICAgICAgICAgICBkYXRhPXsgT2JqZWN0LmFzc2lnbihkYXRhLCBwcm9wcy5zdHlsZSkgfVxuICAgICAgICAgICAgICAgc21hbGxNZWRpYURhdGE9eyBzbWFsbE1lZGlhRGF0YSB9XG4gICAgICAgICAgICAgICBtZWRpdW1NZWRpYURhdGE9eyBtZWRpdW1NZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbGFyZ2VNZWRpYURhdGE9eyBsYXJnZU1lZGlhRGF0YSB9XG4gICAgICA+e3Byb3BzLmNoaWxkcmVufTwvQXBTdHlsZT5cbiAgICApXG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gQXBTcGlubmVyU3R5bGVcbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLnRoZW1lcyA9IHtcbiAgYTogWyAnZmEnLCAnZmEtc3BpbicsICdmYS1zcGlubmVyJyBdLFxuICBiOiBbICdmYScsICdmYS1zcGluJywgJ2ZhLWNpcmNsZS1vLW5vdGNoJyBdLFxuICBjOiBbICdmYScsICdmYS1zcGluJywgJ2ZhLXJlZnJlc2gnIF0sXG4gIGQ6IFsgJ2ZhJywgJ2ZhLXNwaW4nLCAnZmEtZ2VhcicgXSxcbiAgZTogWyAnZmEnLCAnZmEtc3BpbicsICdmYS1wdWxzZScgXVxufVxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3Igc3Bpbm5lci5cbiAqIEBtb2R1bGUgYXBlbWFuLXJlYWN0LXNwaW5uZXJcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8qKlxuICAgKiBAbmFtZSBBcFNwaW5uZXJTdHlsZVxuICAgKi9cbiAgZ2V0IEFwU3Bpbm5lclN0eWxlICgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXBfc3Bpbm5lcl9zdHlsZScpIH0sXG4gIC8qKlxuICAgKiBAbmFtZSBBcFNwaW5uZXJcbiAgICovXG4gIGdldCBBcFNwaW5uZXIgKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hcF9zcGlubmVyJykgfSxcbiAgZ2V0IGNvbnN0cyAoKSB7IHJldHVybiByZXF1aXJlKCcuL2NvbnN0cycpIH1cbn1cbiIsIi8qIVxuICogYXN5bmNcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jYW9sYW4vYXN5bmNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IENhb2xhbiBNY01haG9uXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBhc3luYyA9IHt9O1xuICAgIGZ1bmN0aW9uIG5vb3AoKSB7fVxuICAgIGZ1bmN0aW9uIGlkZW50aXR5KHYpIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvQm9vbCh2KSB7XG4gICAgICAgIHJldHVybiAhIXY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5vdElkKHYpIHtcbiAgICAgICAgcmV0dXJuICF2O1xuICAgIH1cblxuICAgIC8vIGdsb2JhbCBvbiB0aGUgc2VydmVyLCB3aW5kb3cgaW4gdGhlIGJyb3dzZXJcbiAgICB2YXIgcHJldmlvdXNfYXN5bmM7XG5cbiAgICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCAoYHNlbGZgKSBpbiB0aGUgYnJvd3NlciwgYGdsb2JhbGBcbiAgICAvLyBvbiB0aGUgc2VydmVyLCBvciBgdGhpc2AgaW4gc29tZSB2aXJ0dWFsIG1hY2hpbmVzLiBXZSB1c2UgYHNlbGZgXG4gICAgLy8gaW5zdGVhZCBvZiBgd2luZG93YCBmb3IgYFdlYldvcmtlcmAgc3VwcG9ydC5cbiAgICB2YXIgcm9vdCA9IHR5cGVvZiBzZWxmID09PSAnb2JqZWN0JyAmJiBzZWxmLnNlbGYgPT09IHNlbGYgJiYgc2VsZiB8fFxuICAgICAgICAgICAgdHlwZW9mIGdsb2JhbCA9PT0gJ29iamVjdCcgJiYgZ2xvYmFsLmdsb2JhbCA9PT0gZ2xvYmFsICYmIGdsb2JhbCB8fFxuICAgICAgICAgICAgdGhpcztcblxuICAgIGlmIChyb290ICE9IG51bGwpIHtcbiAgICAgICAgcHJldmlvdXNfYXN5bmMgPSByb290LmFzeW5jO1xuICAgIH1cblxuICAgIGFzeW5jLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJvb3QuYXN5bmMgPSBwcmV2aW91c19hc3luYztcbiAgICAgICAgcmV0dXJuIGFzeW5jO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBvbmx5X29uY2UoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGZuID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayB3YXMgYWxyZWFkeSBjYWxsZWQuXCIpO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZuID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfb25jZShmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZm4gPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmbiA9IG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8vLyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGl0eSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgdmFyIF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICB2YXIgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIF90b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfTtcblxuICAgIC8vIFBvcnRlZCBmcm9tIHVuZGVyc2NvcmUuanMgaXNPYmplY3RcbiAgICB2YXIgX2lzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcbiAgICAgICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgdHlwZSA9PT0gJ29iamVjdCcgJiYgISFvYmo7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9pc0FycmF5TGlrZShhcnIpIHtcbiAgICAgICAgcmV0dXJuIF9pc0FycmF5KGFycikgfHwgKFxuICAgICAgICAgICAgLy8gaGFzIGEgcG9zaXRpdmUgaW50ZWdlciBsZW5ndGggcHJvcGVydHlcbiAgICAgICAgICAgIHR5cGVvZiBhcnIubGVuZ3RoID09PSBcIm51bWJlclwiICYmXG4gICAgICAgICAgICBhcnIubGVuZ3RoID49IDAgJiZcbiAgICAgICAgICAgIGFyci5sZW5ndGggJSAxID09PSAwXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2FycmF5RWFjaChhcnIsIGl0ZXJhdG9yKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gYXJyLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgaXRlcmF0b3IoYXJyW2luZGV4XSwgaW5kZXgsIGFycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfbWFwKGFyciwgaXRlcmF0b3IpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnIubGVuZ3RoLFxuICAgICAgICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgcmVzdWx0W2luZGV4XSA9IGl0ZXJhdG9yKGFycltpbmRleF0sIGluZGV4LCBhcnIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JhbmdlKGNvdW50KSB7XG4gICAgICAgIHJldHVybiBfbWFwKEFycmF5KGNvdW50KSwgZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIGk7IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yZWR1Y2UoYXJyLCBpdGVyYXRvciwgbWVtbykge1xuICAgICAgICBfYXJyYXlFYWNoKGFyciwgZnVuY3Rpb24gKHgsIGksIGEpIHtcbiAgICAgICAgICAgIG1lbW8gPSBpdGVyYXRvcihtZW1vLCB4LCBpLCBhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9mb3JFYWNoT2Yob2JqZWN0LCBpdGVyYXRvcikge1xuICAgICAgICBfYXJyYXlFYWNoKF9rZXlzKG9iamVjdCksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG9iamVjdFtrZXldLCBrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfaW5kZXhPZihhcnIsIGl0ZW0pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcnJbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICB2YXIgX2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfa2V5SXRlcmF0b3IoY29sbCkge1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB2YXIgbGVuO1xuICAgICAgICB2YXIga2V5cztcbiAgICAgICAgaWYgKF9pc0FycmF5TGlrZShjb2xsKSkge1xuICAgICAgICAgICAgbGVuID0gY29sbC5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgPCBsZW4gPyBpIDogbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrZXlzID0gX2tleXMoY29sbCk7XG4gICAgICAgICAgICBsZW4gPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gaSA8IGxlbiA/IGtleXNbaV0gOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNpbWlsYXIgdG8gRVM2J3MgcmVzdCBwYXJhbSAoaHR0cDovL2FyaXlhLm9maWxhYnMuY29tLzIwMTMvMDMvZXM2LWFuZC1yZXN0LXBhcmFtZXRlci5odG1sKVxuICAgIC8vIFRoaXMgYWNjdW11bGF0ZXMgdGhlIGFyZ3VtZW50cyBwYXNzZWQgaW50byBhbiBhcnJheSwgYWZ0ZXIgYSBnaXZlbiBpbmRleC5cbiAgICAvLyBGcm9tIHVuZGVyc2NvcmUuanMgKGh0dHBzOi8vZ2l0aHViLmNvbS9qYXNoa2VuYXMvdW5kZXJzY29yZS9wdWxsLzIxNDApLlxuICAgIGZ1bmN0aW9uIF9yZXN0UGFyYW0oZnVuYywgc3RhcnRJbmRleCkge1xuICAgICAgICBzdGFydEluZGV4ID0gc3RhcnRJbmRleCA9PSBudWxsID8gZnVuYy5sZW5ndGggLSAxIDogK3N0YXJ0SW5kZXg7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChhcmd1bWVudHMubGVuZ3RoIC0gc3RhcnRJbmRleCwgMCk7XG4gICAgICAgICAgICB2YXIgcmVzdCA9IEFycmF5KGxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgcmVzdFtpbmRleF0gPSBhcmd1bWVudHNbaW5kZXggKyBzdGFydEluZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoc3RhcnRJbmRleCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCByZXN0KTtcbiAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJndW1lbnRzWzBdLCByZXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEN1cnJlbnRseSB1bnVzZWQgYnV0IGhhbmRsZSBjYXNlcyBvdXRzaWRlIG9mIHRoZSBzd2l0Y2ggc3RhdGVtZW50OlxuICAgICAgICAgICAgLy8gdmFyIGFyZ3MgPSBBcnJheShzdGFydEluZGV4ICsgMSk7XG4gICAgICAgICAgICAvLyBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCBzdGFydEluZGV4OyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyAgICAgYXJnc1tpbmRleF0gPSBhcmd1bWVudHNbaW5kZXhdO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gYXJnc1tzdGFydEluZGV4XSA9IHJlc3Q7XG4gICAgICAgICAgICAvLyByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yKHZhbHVlLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8vLyBleHBvcnRlZCBhc3luYyBtb2R1bGUgZnVuY3Rpb25zIC8vLy9cblxuICAgIC8vLy8gbmV4dFRpY2sgaW1wbGVtZW50YXRpb24gd2l0aCBicm93c2VyLWNvbXBhdGlibGUgZmFsbGJhY2sgLy8vL1xuXG4gICAgLy8gY2FwdHVyZSB0aGUgZ2xvYmFsIHJlZmVyZW5jZSB0byBndWFyZCBhZ2FpbnN0IGZha2VUaW1lciBtb2Nrc1xuICAgIHZhciBfc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBzZXRJbW1lZGlhdGU7XG5cbiAgICB2YXIgX2RlbGF5ID0gX3NldEltbWVkaWF0ZSA/IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIC8vIG5vdCBhIGRpcmVjdCBhbGlhcyBmb3IgSUUxMCBjb21wYXRpYmlsaXR5XG4gICAgICAgIF9zZXRJbW1lZGlhdGUoZm4pO1xuICAgIH0gOiBmdW5jdGlvbihmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcHJvY2Vzcy5uZXh0VGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBhc3luYy5uZXh0VGljayA9IHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYXN5bmMubmV4dFRpY2sgPSBfZGVsYXk7XG4gICAgfVxuICAgIGFzeW5jLnNldEltbWVkaWF0ZSA9IF9zZXRJbW1lZGlhdGUgPyBfZGVsYXkgOiBhc3luYy5uZXh0VGljaztcblxuXG4gICAgYXN5bmMuZm9yRWFjaCA9XG4gICAgYXN5bmMuZWFjaCA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMuZWFjaE9mKGFyciwgX3dpdGhvdXRJbmRleChpdGVyYXRvciksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZm9yRWFjaFNlcmllcyA9XG4gICAgYXN5bmMuZWFjaFNlcmllcyA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMuZWFjaE9mU2VyaWVzKGFyciwgX3dpdGhvdXRJbmRleChpdGVyYXRvciksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG5cbiAgICBhc3luYy5mb3JFYWNoTGltaXQgPVxuICAgIGFzeW5jLmVhY2hMaW1pdCA9IGZ1bmN0aW9uIChhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIF9lYWNoT2ZMaW1pdChsaW1pdCkoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5mb3JFYWNoT2YgPVxuICAgIGFzeW5jLmVhY2hPZiA9IGZ1bmN0aW9uIChvYmplY3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBvYmplY3QgPSBvYmplY3QgfHwgW107XG5cbiAgICAgICAgdmFyIGl0ZXIgPSBfa2V5SXRlcmF0b3Iob2JqZWN0KTtcbiAgICAgICAgdmFyIGtleSwgY29tcGxldGVkID0gMDtcblxuICAgICAgICB3aGlsZSAoKGtleSA9IGl0ZXIoKSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29tcGxldGVkICs9IDE7XG4gICAgICAgICAgICBpdGVyYXRvcihvYmplY3Rba2V5XSwga2V5LCBvbmx5X29uY2UoZG9uZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBsZXRlZCA9PT0gMCkgY2FsbGJhY2sobnVsbCk7XG5cbiAgICAgICAgZnVuY3Rpb24gZG9uZShlcnIpIHtcbiAgICAgICAgICAgIGNvbXBsZXRlZC0tO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDaGVjayBrZXkgaXMgbnVsbCBpbiBjYXNlIGl0ZXJhdG9yIGlzbid0IGV4aGF1c3RlZFxuICAgICAgICAgICAgLy8gYW5kIGRvbmUgcmVzb2x2ZWQgc3luY2hyb25vdXNseS5cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PT0gbnVsbCAmJiBjb21wbGV0ZWQgPD0gMCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hPZlNlcmllcyA9XG4gICAgYXN5bmMuZWFjaE9mU2VyaWVzID0gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIG9iaiA9IG9iaiB8fCBbXTtcbiAgICAgICAgdmFyIG5leHRLZXkgPSBfa2V5SXRlcmF0b3Iob2JqKTtcbiAgICAgICAgdmFyIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgZnVuY3Rpb24gaXRlcmF0ZSgpIHtcbiAgICAgICAgICAgIHZhciBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVyYXRvcihvYmpba2V5XSwga2V5LCBvbmx5X29uY2UoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN5bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoaXRlcmF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpdGVyYXRlKCk7XG4gICAgfTtcblxuXG5cbiAgICBhc3luYy5mb3JFYWNoT2ZMaW1pdCA9XG4gICAgYXN5bmMuZWFjaE9mTGltaXQgPSBmdW5jdGlvbiAob2JqLCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9lYWNoT2ZMaW1pdChsaW1pdCkob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfZWFjaE9mTGltaXQobGltaXQpIHtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICAgICAgb2JqID0gb2JqIHx8IFtdO1xuICAgICAgICAgICAgdmFyIG5leHRLZXkgPSBfa2V5SXRlcmF0b3Iob2JqKTtcbiAgICAgICAgICAgIGlmIChsaW1pdCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBydW5uaW5nID0gMDtcbiAgICAgICAgICAgIHZhciBlcnJvcmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIChmdW5jdGlvbiByZXBsZW5pc2ggKCkge1xuICAgICAgICAgICAgICAgIGlmIChkb25lICYmIHJ1bm5pbmcgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHJ1bm5pbmcgPCBsaW1pdCAmJiAhZXJyb3JlZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gbmV4dEtleSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydW5uaW5nIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBydW5uaW5nICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG9ialtrZXldLCBrZXksIG9ubHlfb25jZShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxlbmlzaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGRvUGFyYWxsZWwoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGFzeW5jLmVhY2hPZiwgb2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBkb1BhcmFsbGVsTGltaXQoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihfZWFjaE9mTGltaXQobGltaXQpLCBvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRvU2VyaWVzKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihhc3luYy5lYWNoT2ZTZXJpZXMsIG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfYXN5bmNNYXAoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBhcnIgPSBhcnIgfHwgW107XG4gICAgICAgIHZhciByZXN1bHRzID0gX2lzQXJyYXlMaWtlKGFycikgPyBbXSA6IHt9O1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAodmFsdWUsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IodmFsdWUsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSA9IHY7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5tYXAgPSBkb1BhcmFsbGVsKF9hc3luY01hcCk7XG4gICAgYXN5bmMubWFwU2VyaWVzID0gZG9TZXJpZXMoX2FzeW5jTWFwKTtcbiAgICBhc3luYy5tYXBMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfYXN5bmNNYXApO1xuXG4gICAgLy8gcmVkdWNlIG9ubHkgaGFzIGEgc2VyaWVzIHZlcnNpb24sIGFzIGRvaW5nIHJlZHVjZSBpbiBwYXJhbGxlbCB3b24ndFxuICAgIC8vIHdvcmsgaW4gbWFueSBzaXR1YXRpb25zLlxuICAgIGFzeW5jLmluamVjdCA9XG4gICAgYXN5bmMuZm9sZGwgPVxuICAgIGFzeW5jLnJlZHVjZSA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5lYWNoT2ZTZXJpZXMoYXJyLCBmdW5jdGlvbiAoeCwgaSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG1lbW8sIHgsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICBtZW1vID0gdjtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgbWVtbyk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhc3luYy5mb2xkciA9XG4gICAgYXN5bmMucmVkdWNlUmlnaHQgPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJldmVyc2VkID0gX21hcChhcnIsIGlkZW50aXR5KS5yZXZlcnNlKCk7XG4gICAgICAgIGFzeW5jLnJlZHVjZShyZXZlcnNlZCwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMudHJhbnNmb3JtID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGl0ZXJhdG9yO1xuICAgICAgICAgICAgaXRlcmF0b3IgPSBtZW1vO1xuICAgICAgICAgICAgbWVtbyA9IF9pc0FycmF5KGFycikgPyBbXSA6IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMuZWFjaE9mKGFyciwgZnVuY3Rpb24odiwgaywgY2IpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG1lbW8sIHYsIGssIGNiKTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG1lbW8pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2ZpbHRlcihlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtpbmRleDogaW5kZXgsIHZhbHVlOiB4fSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbGJhY2soX21hcChyZXN1bHRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS5pbmRleCAtIGIuaW5kZXg7XG4gICAgICAgICAgICB9KSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geC52YWx1ZTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuc2VsZWN0ID1cbiAgICBhc3luYy5maWx0ZXIgPSBkb1BhcmFsbGVsKF9maWx0ZXIpO1xuXG4gICAgYXN5bmMuc2VsZWN0TGltaXQgPVxuICAgIGFzeW5jLmZpbHRlckxpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9maWx0ZXIpO1xuXG4gICAgYXN5bmMuc2VsZWN0U2VyaWVzID1cbiAgICBhc3luYy5maWx0ZXJTZXJpZXMgPSBkb1NlcmllcyhfZmlsdGVyKTtcblxuICAgIGZ1bmN0aW9uIF9yZWplY3QoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBfZmlsdGVyKGVhY2hmbiwgYXJyLCBmdW5jdGlvbih2YWx1ZSwgY2IpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHZhbHVlLCBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICAgICAgY2IoIXYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICB9XG4gICAgYXN5bmMucmVqZWN0ID0gZG9QYXJhbGxlbChfcmVqZWN0KTtcbiAgICBhc3luYy5yZWplY3RMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfcmVqZWN0KTtcbiAgICBhc3luYy5yZWplY3RTZXJpZXMgPSBkb1NlcmllcyhfcmVqZWN0KTtcblxuICAgIGZ1bmN0aW9uIF9jcmVhdGVUZXN0ZXIoZWFjaGZuLCBjaGVjaywgZ2V0UmVzdWx0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2IpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvbmUoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNiKSBjYihnZXRSZXN1bHQoZmFsc2UsIHZvaWQgMCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gaXRlcmF0ZWUoeCwgXywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNiKSByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2IgJiYgY2hlY2sodikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiKGdldFJlc3VsdCh0cnVlLCB4KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYiA9IGl0ZXJhdG9yID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMykge1xuICAgICAgICAgICAgICAgIGVhY2hmbihhcnIsIGxpbWl0LCBpdGVyYXRlZSwgZG9uZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNiID0gaXRlcmF0b3I7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IgPSBsaW1pdDtcbiAgICAgICAgICAgICAgICBlYWNoZm4oYXJyLCBpdGVyYXRlZSwgZG9uZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMuYW55ID1cbiAgICBhc3luYy5zb21lID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIHRvQm9vbCwgaWRlbnRpdHkpO1xuXG4gICAgYXN5bmMuc29tZUxpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgdG9Cb29sLCBpZGVudGl0eSk7XG5cbiAgICBhc3luYy5hbGwgPVxuICAgIGFzeW5jLmV2ZXJ5ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIG5vdElkLCBub3RJZCk7XG5cbiAgICBhc3luYy5ldmVyeUxpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgbm90SWQsIG5vdElkKTtcblxuICAgIGZ1bmN0aW9uIF9maW5kR2V0UmVzdWx0KHYsIHgpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGFzeW5jLmRldGVjdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mLCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuICAgIGFzeW5jLmRldGVjdFNlcmllcyA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mU2VyaWVzLCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuICAgIGFzeW5jLmRldGVjdExpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcblxuICAgIGFzeW5jLnNvcnRCeSA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5tYXAoYXJyLCBmdW5jdGlvbiAoeCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uIChlcnIsIGNyaXRlcmlhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwge3ZhbHVlOiB4LCBjcml0ZXJpYTogY3JpdGVyaWF9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgX21hcChyZXN1bHRzLnNvcnQoY29tcGFyYXRvciksIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBjb21wYXJhdG9yKGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWEsIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5hdXRvID0gZnVuY3Rpb24gKHRhc2tzLCBjb25jdXJyZW5jeSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIC8vIGNvbmN1cnJlbmN5IGlzIG9wdGlvbmFsLCBzaGlmdCB0aGUgYXJncy5cbiAgICAgICAgICAgIGNhbGxiYWNrID0gY29uY3VycmVuY3k7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgdmFyIGtleXMgPSBfa2V5cyh0YXNrcyk7XG4gICAgICAgIHZhciByZW1haW5pbmdUYXNrcyA9IGtleXMubGVuZ3RoO1xuICAgICAgICBpZiAoIXJlbWFpbmluZ1Rhc2tzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSByZW1haW5pbmdUYXNrcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHRzID0ge307XG4gICAgICAgIHZhciBydW5uaW5nVGFza3MgPSAwO1xuXG4gICAgICAgIHZhciBoYXNFcnJvciA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoZm4pIHtcbiAgICAgICAgICAgIGxpc3RlbmVycy51bnNoaWZ0KGZuKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihmbikge1xuICAgICAgICAgICAgdmFyIGlkeCA9IF9pbmRleE9mKGxpc3RlbmVycywgZm4pO1xuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSBsaXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gdGFza0NvbXBsZXRlKCkge1xuICAgICAgICAgICAgcmVtYWluaW5nVGFza3MtLTtcbiAgICAgICAgICAgIF9hcnJheUVhY2gobGlzdGVuZXJzLnNsaWNlKDApLCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRMaXN0ZW5lcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXJlbWFpbmluZ1Rhc2tzKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9hcnJheUVhY2goa2V5cywgZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgIGlmIChoYXNFcnJvcikgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIHRhc2sgPSBfaXNBcnJheSh0YXNrc1trXSkgPyB0YXNrc1trXTogW3Rhc2tzW2tdXTtcbiAgICAgICAgICAgIHZhciB0YXNrQ2FsbGJhY2sgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIHJ1bm5pbmdUYXNrcy0tO1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzYWZlUmVzdWx0cyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBfZm9yRWFjaE9mKHJlc3VsdHMsIGZ1bmN0aW9uKHZhbCwgcmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FmZVJlc3VsdHNbcmtleV0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9yID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIsIHNhZmVSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNba10gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUodGFza0NvbXBsZXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciByZXF1aXJlcyA9IHRhc2suc2xpY2UoMCwgdGFzay5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIC8vIHByZXZlbnQgZGVhZC1sb2Nrc1xuICAgICAgICAgICAgdmFyIGxlbiA9IHJlcXVpcmVzLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBkZXA7XG4gICAgICAgICAgICB3aGlsZSAobGVuLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShkZXAgPSB0YXNrc1tyZXF1aXJlc1tsZW5dXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdIYXMgbm9uZXhpc3RlbnQgZGVwZW5kZW5jeSBpbiAnICsgcmVxdWlyZXMuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChfaXNBcnJheShkZXApICYmIF9pbmRleE9mKGRlcCwgaykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hhcyBjeWNsaWMgZGVwZW5kZW5jaWVzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmdUYXNrcyA8IGNvbmN1cnJlbmN5ICYmIF9yZWR1Y2UocmVxdWlyZXMsIGZ1bmN0aW9uIChhLCB4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoYSAmJiByZXN1bHRzLmhhc093blByb3BlcnR5KHgpKTtcbiAgICAgICAgICAgICAgICB9LCB0cnVlKSAmJiAhcmVzdWx0cy5oYXNPd25Qcm9wZXJ0eShrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgcnVubmluZ1Rhc2tzKys7XG4gICAgICAgICAgICAgICAgdGFza1t0YXNrLmxlbmd0aCAtIDFdKHRhc2tDYWxsYmFjaywgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBhZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBsaXN0ZW5lcigpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVhZHkoKSkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nVGFza3MrKztcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0YXNrW3Rhc2subGVuZ3RoIC0gMV0odGFza0NhbGxiYWNrLCByZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cblxuXG4gICAgYXN5bmMucmV0cnkgPSBmdW5jdGlvbih0aW1lcywgdGFzaywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIERFRkFVTFRfVElNRVMgPSA1O1xuICAgICAgICB2YXIgREVGQVVMVF9JTlRFUlZBTCA9IDA7XG5cbiAgICAgICAgdmFyIGF0dGVtcHRzID0gW107XG5cbiAgICAgICAgdmFyIG9wdHMgPSB7XG4gICAgICAgICAgICB0aW1lczogREVGQVVMVF9USU1FUyxcbiAgICAgICAgICAgIGludGVydmFsOiBERUZBVUxUX0lOVEVSVkFMXG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gcGFyc2VUaW1lcyhhY2MsIHQpe1xuICAgICAgICAgICAgaWYodHlwZW9mIHQgPT09ICdudW1iZXInKXtcbiAgICAgICAgICAgICAgICBhY2MudGltZXMgPSBwYXJzZUludCh0LCAxMCkgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgICAgIH0gZWxzZSBpZih0eXBlb2YgdCA9PT0gJ29iamVjdCcpe1xuICAgICAgICAgICAgICAgIGFjYy50aW1lcyA9IHBhcnNlSW50KHQudGltZXMsIDEwKSB8fCBERUZBVUxUX1RJTUVTO1xuICAgICAgICAgICAgICAgIGFjYy5pbnRlcnZhbCA9IHBhcnNlSW50KHQuaW50ZXJ2YWwsIDEwKSB8fCBERUZBVUxUX0lOVEVSVkFMO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGFyZ3VtZW50IHR5cGUgZm9yIFxcJ3RpbWVzXFwnOiAnICsgdHlwZW9mIHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGlmIChsZW5ndGggPCAxIHx8IGxlbmd0aCA+IDMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBhcmd1bWVudHMgLSBtdXN0IGJlIGVpdGhlciAodGFzayksICh0YXNrLCBjYWxsYmFjayksICh0aW1lcywgdGFzaykgb3IgKHRpbWVzLCB0YXNrLCBjYWxsYmFjayknKTtcbiAgICAgICAgfSBlbHNlIGlmIChsZW5ndGggPD0gMiAmJiB0eXBlb2YgdGltZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdGFzaztcbiAgICAgICAgICAgIHRhc2sgPSB0aW1lcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRpbWVzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBwYXJzZVRpbWVzKG9wdHMsIHRpbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBvcHRzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIG9wdHMudGFzayA9IHRhc2s7XG5cbiAgICAgICAgZnVuY3Rpb24gd3JhcHBlZFRhc2sod3JhcHBlZENhbGxiYWNrLCB3cmFwcGVkUmVzdWx0cykge1xuICAgICAgICAgICAgZnVuY3Rpb24gcmV0cnlBdHRlbXB0KHRhc2ssIGZpbmFsQXR0ZW1wdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzZXJpZXNDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICB0YXNrKGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKCFlcnIgfHwgZmluYWxBdHRlbXB0LCB7ZXJyOiBlcnIsIHJlc3VsdDogcmVzdWx0fSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHdyYXBwZWRSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZXRyeUludGVydmFsKGludGVydmFsKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2VyaWVzQ2FsbGJhY2spe1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXNDYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdoaWxlIChvcHRzLnRpbWVzKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgZmluYWxBdHRlbXB0ID0gIShvcHRzLnRpbWVzLT0xKTtcbiAgICAgICAgICAgICAgICBhdHRlbXB0cy5wdXNoKHJldHJ5QXR0ZW1wdChvcHRzLnRhc2ssIGZpbmFsQXR0ZW1wdCkpO1xuICAgICAgICAgICAgICAgIGlmKCFmaW5hbEF0dGVtcHQgJiYgb3B0cy5pbnRlcnZhbCA+IDApe1xuICAgICAgICAgICAgICAgICAgICBhdHRlbXB0cy5wdXNoKHJldHJ5SW50ZXJ2YWwob3B0cy5pbnRlcnZhbCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXN5bmMuc2VyaWVzKGF0dGVtcHRzLCBmdW5jdGlvbihkb25lLCBkYXRhKXtcbiAgICAgICAgICAgICAgICBkYXRhID0gZGF0YVtkYXRhLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICh3cmFwcGVkQ2FsbGJhY2sgfHwgb3B0cy5jYWxsYmFjaykoZGF0YS5lcnIsIGRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBjYWxsYmFjayBpcyBwYXNzZWQsIHJ1biB0aGlzIGFzIGEgY29udHJvbGwgZmxvd1xuICAgICAgICByZXR1cm4gb3B0cy5jYWxsYmFjayA/IHdyYXBwZWRUYXNrKCkgOiB3cmFwcGVkVGFzaztcbiAgICB9O1xuXG4gICAgYXN5bmMud2F0ZXJmYWxsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBpZiAoIV9pc0FycmF5KHRhc2tzKSkge1xuICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgdG8gd2F0ZXJmYWxsIG11c3QgYmUgYW4gYXJyYXkgb2YgZnVuY3Rpb25zJyk7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gd3JhcEl0ZXJhdG9yKGl0ZXJhdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBbZXJyXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2god3JhcEl0ZXJhdG9yKG5leHQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZW5zdXJlQXN5bmMoaXRlcmF0b3IpLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHdyYXBJdGVyYXRvcihhc3luYy5pdGVyYXRvcih0YXNrcykpKCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9wYXJhbGxlbChlYWNoZm4sIHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IG5vb3A7XG4gICAgICAgIHZhciByZXN1bHRzID0gX2lzQXJyYXlMaWtlKHRhc2tzKSA/IFtdIDoge307XG5cbiAgICAgICAgZWFjaGZuKHRhc2tzLCBmdW5jdGlvbiAodGFzaywga2V5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdGFzayhfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0c1trZXldID0gYXJncztcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5wYXJhbGxlbCA9IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgX3BhcmFsbGVsKGFzeW5jLmVhY2hPZiwgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMucGFyYWxsZWxMaW1pdCA9IGZ1bmN0aW9uKHRhc2tzLCBsaW1pdCwgY2FsbGJhY2spIHtcbiAgICAgICAgX3BhcmFsbGVsKF9lYWNoT2ZMaW1pdChsaW1pdCksIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnNlcmllcyA9IGZ1bmN0aW9uKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoYXN5bmMuZWFjaE9mU2VyaWVzLCB0YXNrcywgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5pdGVyYXRvciA9IGZ1bmN0aW9uICh0YXNrcykge1xuICAgICAgICBmdW5jdGlvbiBtYWtlQ2FsbGJhY2soaW5kZXgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGZuKCkge1xuICAgICAgICAgICAgICAgIGlmICh0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFza3NbaW5kZXhdLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmbi5uZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmbi5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoaW5kZXggPCB0YXNrcy5sZW5ndGggLSAxKSA/IG1ha2VDYWxsYmFjayhpbmRleCArIDEpOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBmbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFrZUNhbGxiYWNrKDApO1xuICAgIH07XG5cbiAgICBhc3luYy5hcHBseSA9IF9yZXN0UGFyYW0oZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChjYWxsQXJncykge1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KFxuICAgICAgICAgICAgICAgIG51bGwsIGFyZ3MuY29uY2F0KGNhbGxBcmdzKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBfY29uY2F0KGVhY2hmbiwgYXJyLCBmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgaW5kZXgsIGNiKSB7XG4gICAgICAgICAgICBmbih4LCBmdW5jdGlvbiAoZXJyLCB5KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh5IHx8IFtdKTtcbiAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jLmNvbmNhdCA9IGRvUGFyYWxsZWwoX2NvbmNhdCk7XG4gICAgYXN5bmMuY29uY2F0U2VyaWVzID0gZG9TZXJpZXMoX2NvbmNhdCk7XG5cbiAgICBhc3luYy53aGlsc3QgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcbiAgICAgICAgaWYgKHRlc3QoKSkge1xuICAgICAgICAgICAgdmFyIG5leHQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRlc3QuYXBwbHkodGhpcywgYXJncykpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3IobmV4dCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgW251bGxdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmRvV2hpbHN0ID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY2FsbHMgPSAwO1xuICAgICAgICByZXR1cm4gYXN5bmMud2hpbHN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICsrY2FsbHMgPD0gMSB8fCB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnVudGlsID0gZnVuY3Rpb24gKHRlc3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMud2hpbHN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmRvVW50aWwgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5kb1doaWxzdChpdGVyYXRvciwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5kdXJpbmcgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcblxuICAgICAgICB2YXIgbmV4dCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGNoZWNrKTtcbiAgICAgICAgICAgICAgICB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgY2hlY2sgPSBmdW5jdGlvbihlcnIsIHRydXRoKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHJ1dGgpIHtcbiAgICAgICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGVzdChjaGVjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmRvRHVyaW5nID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY2FsbHMgPSAwO1xuICAgICAgICBhc3luYy5kdXJpbmcoZnVuY3Rpb24obmV4dCkge1xuICAgICAgICAgICAgaWYgKGNhbGxzKysgPCAxKSB7XG4gICAgICAgICAgICAgICAgbmV4dChudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfcXVldWUod29ya2VyLCBjb25jdXJyZW5jeSwgcGF5bG9hZCkge1xuICAgICAgICBpZiAoY29uY3VycmVuY3kgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoY29uY3VycmVuY3kgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uY3VycmVuY3kgbXVzdCBub3QgYmUgemVybycpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9pbnNlcnQocSwgZGF0YSwgcG9zLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwgJiYgdHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0YXNrIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIV9pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRhdGEubGVuZ3RoID09PSAwICYmIHEuaWRsZSgpKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbCBkcmFpbiBpbW1lZGlhdGVseSBpZiB0aGVyZSBhcmUgbm8gdGFza3NcbiAgICAgICAgICAgICAgICByZXR1cm4gYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfYXJyYXlFYWNoKGRhdGEsIGZ1bmN0aW9uKHRhc2spIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrIHx8IG5vb3BcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKHBvcykge1xuICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnVuc2hpZnQoaXRlbSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gcS5jb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgICAgICBxLnNhdHVyYXRlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX25leHQocSwgdGFza3MpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHdvcmtlcnMgLT0gMTtcblxuICAgICAgICAgICAgICAgIHZhciByZW1vdmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgX2FycmF5RWFjaCh0YXNrcywgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgX2FycmF5RWFjaCh3b3JrZXJzTGlzdCwgZnVuY3Rpb24gKHdvcmtlciwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3b3JrZXIgPT09IHRhc2sgJiYgIXJlbW92ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZXJzTGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB0YXNrLmNhbGxiYWNrLmFwcGx5KHRhc2ssIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCArIHdvcmtlcnMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBxLnByb2Nlc3MoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd29ya2VycyA9IDA7XG4gICAgICAgIHZhciB3b3JrZXJzTGlzdCA9IFtdO1xuICAgICAgICB2YXIgcSA9IHtcbiAgICAgICAgICAgIHRhc2tzOiBbXSxcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5OiBjb25jdXJyZW5jeSxcbiAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWQsXG4gICAgICAgICAgICBzYXR1cmF0ZWQ6IG5vb3AsXG4gICAgICAgICAgICBlbXB0eTogbm9vcCxcbiAgICAgICAgICAgIGRyYWluOiBub29wLFxuICAgICAgICAgICAgc3RhcnRlZDogZmFsc2UsXG4gICAgICAgICAgICBwYXVzZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcHVzaDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCBmYWxzZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGtpbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxLmRyYWluID0gbm9vcDtcbiAgICAgICAgICAgICAgICBxLnRhc2tzID0gW107XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5zaGlmdDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCB0cnVlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdoaWxlKCFxLnBhdXNlZCAmJiB3b3JrZXJzIDwgcS5jb25jdXJyZW5jeSAmJiBxLnRhc2tzLmxlbmd0aCl7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhc2tzID0gcS5wYXlsb2FkID9cbiAgICAgICAgICAgICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKDAsIHEucGF5bG9hZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoMCwgcS50YXNrcy5sZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gX21hcCh0YXNrcywgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0YXNrLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcnMgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgd29ya2Vyc0xpc3QucHVzaCh0YXNrc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYiA9IG9ubHlfb25jZShfbmV4dChxLCB0YXNrcykpO1xuICAgICAgICAgICAgICAgICAgICB3b3JrZXIoZGF0YSwgY2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsZW5ndGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS50YXNrcy5sZW5ndGg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcnVubmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB3b3JrZXJzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdvcmtlcnNMaXN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmtlcnNMaXN0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlkbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnRhc2tzLmxlbmd0aCArIHdvcmtlcnMgPT09IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxLnBhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSBmYWxzZSkgeyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICBxLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bWVDb3VudCA9IE1hdGgubWluKHEuY29uY3VycmVuY3ksIHEudGFza3MubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBOZWVkIHRvIGNhbGwgcS5wcm9jZXNzIG9uY2UgcGVyIGNvbmN1cnJlbnRcbiAgICAgICAgICAgICAgICAvLyB3b3JrZXIgdG8gcHJlc2VydmUgZnVsbCBjb25jdXJyZW5jeSBhZnRlciBwYXVzZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIHcgPSAxOyB3IDw9IHJlc3VtZUNvdW50OyB3KyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcTtcbiAgICB9XG5cbiAgICBhc3luYy5xdWV1ZSA9IGZ1bmN0aW9uICh3b3JrZXIsIGNvbmN1cnJlbmN5KSB7XG4gICAgICAgIHZhciBxID0gX3F1ZXVlKGZ1bmN0aW9uIChpdGVtcywgY2IpIHtcbiAgICAgICAgICAgIHdvcmtlcihpdGVtc1swXSwgY2IpO1xuICAgICAgICB9LCBjb25jdXJyZW5jeSwgMSk7XG5cbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfTtcblxuICAgIGFzeW5jLnByaW9yaXR5UXVldWUgPSBmdW5jdGlvbiAod29ya2VyLCBjb25jdXJyZW5jeSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIF9jb21wYXJlVGFza3MoYSwgYil7XG4gICAgICAgICAgICByZXR1cm4gYS5wcmlvcml0eSAtIGIucHJpb3JpdHk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfYmluYXJ5U2VhcmNoKHNlcXVlbmNlLCBpdGVtLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgYmVnID0gLTEsXG4gICAgICAgICAgICAgICAgZW5kID0gc2VxdWVuY2UubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIHdoaWxlIChiZWcgPCBlbmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWlkID0gYmVnICsgKChlbmQgLSBiZWcgKyAxKSA+Pj4gMSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBhcmUoaXRlbSwgc2VxdWVuY2VbbWlkXSkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBiZWcgPSBtaWQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gbWlkIC0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYmVnO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2luc2VydChxLCBkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGFzayBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCFfaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBbZGF0YV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihkYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGwgZHJhaW4gaW1tZWRpYXRlbHkgaWYgdGhlcmUgYXJlIG5vIHRhc2tzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2FycmF5RWFjaChkYXRhLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHRhc2ssXG4gICAgICAgICAgICAgICAgICAgIHByaW9yaXR5OiBwcmlvcml0eSxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyA/IGNhbGxiYWNrIDogbm9vcFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBxLnRhc2tzLnNwbGljZShfYmluYXJ5U2VhcmNoKHEudGFza3MsIGl0ZW0sIF9jb21wYXJlVGFza3MpICsgMSwgMCwgaXRlbSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggPT09IHEuY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0YXJ0IHdpdGggYSBub3JtYWwgcXVldWVcbiAgICAgICAgdmFyIHEgPSBhc3luYy5xdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5KTtcblxuICAgICAgICAvLyBPdmVycmlkZSBwdXNoIHRvIGFjY2VwdCBzZWNvbmQgcGFyYW1ldGVyIHJlcHJlc2VudGluZyBwcmlvcml0eVxuICAgICAgICBxLnB1c2ggPSBmdW5jdGlvbiAoZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjayk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmVtb3ZlIHVuc2hpZnQgZnVuY3Rpb25cbiAgICAgICAgZGVsZXRlIHEudW5zaGlmdDtcblxuICAgICAgICByZXR1cm4gcTtcbiAgICB9O1xuXG4gICAgYXN5bmMuY2FyZ28gPSBmdW5jdGlvbiAod29ya2VyLCBwYXlsb2FkKSB7XG4gICAgICAgIHJldHVybiBfcXVldWUod29ya2VyLCAxLCBwYXlsb2FkKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2NvbnNvbGVfZm4obmFtZSkge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZm4sIGFyZ3MpIHtcbiAgICAgICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MuY29uY2F0KFtfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbnNvbGVbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hcnJheUVhY2goYXJncywgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlW25hbWVdKHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jLmxvZyA9IF9jb25zb2xlX2ZuKCdsb2cnKTtcbiAgICBhc3luYy5kaXIgPSBfY29uc29sZV9mbignZGlyJyk7XG4gICAgLyphc3luYy5pbmZvID0gX2NvbnNvbGVfZm4oJ2luZm8nKTtcbiAgICBhc3luYy53YXJuID0gX2NvbnNvbGVfZm4oJ3dhcm4nKTtcbiAgICBhc3luYy5lcnJvciA9IF9jb25zb2xlX2ZuKCdlcnJvcicpOyovXG5cbiAgICBhc3luYy5tZW1vaXplID0gZnVuY3Rpb24gKGZuLCBoYXNoZXIpIHtcbiAgICAgICAgdmFyIG1lbW8gPSB7fTtcbiAgICAgICAgdmFyIHF1ZXVlcyA9IHt9O1xuICAgICAgICB2YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgICAgICAgaGFzaGVyID0gaGFzaGVyIHx8IGlkZW50aXR5O1xuICAgICAgICB2YXIgbWVtb2l6ZWQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uIG1lbW9pemVkKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgaWYgKGhhcy5jYWxsKG1lbW8sIGtleSkpIHsgICBcbiAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBtZW1vW2tleV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaGFzLmNhbGwocXVldWVzLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgcXVldWVzW2tleV0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBxdWV1ZXNba2V5XSA9IFtjYWxsYmFja107XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVtb1trZXldID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBxdWV1ZXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHF1ZXVlc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHEubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxW2ldLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBtZW1vaXplZC5tZW1vID0gbWVtbztcbiAgICAgICAgbWVtb2l6ZWQudW5tZW1vaXplZCA9IGZuO1xuICAgICAgICByZXR1cm4gbWVtb2l6ZWQ7XG4gICAgfTtcblxuICAgIGFzeW5jLnVubWVtb2l6ZSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChmbi51bm1lbW9pemVkIHx8IGZuKS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfdGltZXMobWFwcGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoY291bnQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgbWFwcGVyKF9yYW5nZShjb3VudCksIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMudGltZXMgPSBfdGltZXMoYXN5bmMubWFwKTtcbiAgICBhc3luYy50aW1lc1NlcmllcyA9IF90aW1lcyhhc3luYy5tYXBTZXJpZXMpO1xuICAgIGFzeW5jLnRpbWVzTGltaXQgPSBmdW5jdGlvbiAoY291bnQsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLm1hcExpbWl0KF9yYW5nZShjb3VudCksIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5zZXEgPSBmdW5jdGlvbiAoLyogZnVuY3Rpb25zLi4uICovKSB7XG4gICAgICAgIHZhciBmbnMgPSBhcmd1bWVudHM7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gbm9vcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXN5bmMucmVkdWNlKGZucywgYXJncywgZnVuY3Rpb24gKG5ld2FyZ3MsIGZuLCBjYikge1xuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIG5ld2FyZ3MuY29uY2F0KFtfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIG5leHRhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKGVyciwgbmV4dGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pXSkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGF0LCBbZXJyXS5jb25jYXQocmVzdWx0cykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhc3luYy5jb21wb3NlID0gZnVuY3Rpb24gKC8qIGZ1bmN0aW9ucy4uLiAqLykge1xuICAgICAgICByZXR1cm4gYXN5bmMuc2VxLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5yZXZlcnNlLmNhbGwoYXJndW1lbnRzKSk7XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gX2FwcGx5RWFjaChlYWNoZm4pIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24oZm5zLCBhcmdzKSB7XG4gICAgICAgICAgICB2YXIgZ28gPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWFjaGZuKGZucywgZnVuY3Rpb24gKGZuLCBfLCBjYikge1xuICAgICAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGF0LCBhcmdzLmNvbmNhdChbY2JdKSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjYWxsYmFjayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnby5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBnbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuYXBwbHlFYWNoID0gX2FwcGx5RWFjaChhc3luYy5lYWNoT2YpO1xuICAgIGFzeW5jLmFwcGx5RWFjaFNlcmllcyA9IF9hcHBseUVhY2goYXN5bmMuZWFjaE9mU2VyaWVzKTtcblxuXG4gICAgYXN5bmMuZm9yZXZlciA9IGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGRvbmUgPSBvbmx5X29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIHZhciB0YXNrID0gZW5zdXJlQXN5bmMoZm4pO1xuICAgICAgICBmdW5jdGlvbiBuZXh0KGVycikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBkb25lKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YXNrKG5leHQpO1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZW5zdXJlQXN5bmMoZm4pIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICBhcmdzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBpbm5lckFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgaWYgKHN5bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGlubmVyQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGlubmVyQXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgc3luYyA9IHRydWU7XG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuZW5zdXJlQXN5bmMgPSBlbnN1cmVBc3luYztcblxuICAgIGFzeW5jLmNvbnN0YW50ID0gX3Jlc3RQYXJhbShmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbbnVsbF0uY29uY2F0KHZhbHVlcyk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFzeW5jLndyYXBTeW5jID1cbiAgICBhc3luYy5hc3luY2lmeSA9IGZ1bmN0aW9uIGFzeW5jaWZ5KGZ1bmMpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIHJlc3VsdCBpcyBQcm9taXNlIG9iamVjdFxuICAgICAgICAgICAgaWYgKF9pc09iamVjdChyZXN1bHQpICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pW1wiY2F0Y2hcIl0oZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyci5tZXNzYWdlID8gZXJyIDogbmV3IEVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gTm9kZS5qc1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFzeW5jO1xuICAgIH1cbiAgICAvLyBBTUQgLyBSZXF1aXJlSlNcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmM7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBpbmNsdWRlZCBkaXJlY3RseSB2aWEgPHNjcmlwdD4gdGFnXG4gICAgZWxzZSB7XG4gICAgICAgIHJvb3QuYXN5bmMgPSBhc3luYztcbiAgICB9XG5cbn0oKSk7XG4iLCIvKipcbiAqIEdldCBhdmVyYWdlIHZhbHVlLlxuICogQGZ1bmN0aW9uIGF2ZVxuICogQHBhcmFtIHsuLi5udW1iZXJ9IHZhbHVlcyAtIFZhbHVlcyB0byBhdmUuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSAtIEF2ZXJhZ2UgdmFsdWUuXG4gKi9cblxuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3Qgc3VtID0gcmVxdWlyZSgnLi9zdW0nKTtcblxuLyoqIEBsZW5kcyBhdmUgKi9cbmZ1bmN0aW9uIGF2ZSgpIHtcbiAgICBsZXQgYXJncyA9IGFyZ3VtZW50cztcbiAgICBsZXQgdmFsdWVzID0gMCwgc2l6ZSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbCA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHNpemUgKz0gdmFsLmxlbmd0aDtcbiAgICAgICAgICAgIHZhbCA9IHN1bS5hcHBseShzdW0sIHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzaXplICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWVzICs9IHZhbDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcyAvIHNpemU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXZlO1xuXG4iLCIvKipcbiAqIEJhc2ljIG51bWVyaWMgY2FsY3VsYXRpb24gZnVuY3Rpb25zLlxuICogQG1vZHVsZSBudW1jYWxcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0IGF2ZSgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXZlJyk7IH0sXG4gICAgZ2V0IG1heCgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vbWF4Jyk7IH0sXG4gICAgZ2V0IG1pbigpIHsgcmV0dXJuIHJlcXVpcmUoJy4vbWluJyk7IH0sXG4gICAgZ2V0IHN1bSgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vc3VtJyk7IH1cbn07IiwiLyoqXG4gKiBGaW5kIG1heCB2YWx1ZS5cbiAqIEBmdW5jdGlvbiBtYXhcbiAqIEBwYXJhbSB7Li4ubnVtYmVyfSB2YWx1ZXMgLSBWYWx1ZXMgdG8gY29tcGFyZS5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IC0gTWF4IG51bWJlci5cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKiogQGxlbmRzIG1heCAqL1xuZnVuY3Rpb24gbWF4KCkge1xuICAgIGxldCBhcmdzID0gYXJndW1lbnRzO1xuICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbCA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHZhbCA9IG1heC5hcHBseShtYXgsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGhpdCA9IChyZXN1bHQgPT09IHVuZGVmaW5lZCkgfHwgKHZhbCA+IHJlc3VsdCk7XG4gICAgICAgIGlmIChoaXQpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHZhbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1heDtcblxuIiwiLyoqXG4gKiBGaW5kIG1pbiB2YWx1ZS5cbiAqIEBmdW5jdGlvbiBtaW5cbiAqIEBwYXJhbSB7Li4ubnVtYmVyfSB2YWx1ZXMgLSBWYWx1ZXMgdG8gY29tcGFyZS5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IC0gTWluIG51bWJlci5cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKiogQGxlbmRzIG1pbiAqL1xuZnVuY3Rpb24gbWluKCkge1xuICAgIGxldCBhcmdzID0gYXJndW1lbnRzO1xuICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbCA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHZhbCA9IG1pbi5hcHBseShtaW4sIHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGhpdCA9IChyZXN1bHQgPT09IHVuZGVmaW5lZCkgfHwgKHZhbCA8IHJlc3VsdCk7XG4gICAgICAgIGlmIChoaXQpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHZhbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1pbjtcblxuIiwiLyoqXG4gKiBHZXQgc3VtIHZhbHVlLlxuICogQGZ1bmN0aW9uIHN1bVxuICogQHBhcmFtIHsuLi5udW1iZXJ9IHZhbHVlcyAtIFZhbHVlcyB0byBzdW0uXG4gKiBAcmV0dXJucyB7bnVtYmVyfSAtIFN1bSB2YWx1ZS5cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKiogQGxlbmRzIHN1bSAqL1xuZnVuY3Rpb24gc3VtKCkge1xuICAgIGxldCBhcmdzID0gYXJndW1lbnRzO1xuICAgIGxldCByZXN1bHQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBhcmdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGxldCB2YWwgPSBhcmdzW2ldO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgICAgICB2YWwgPSBzdW0uYXBwbHkoc3VtLCB2YWwpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSB2YWw7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VtO1xuXG4iLCJcbnZhciBybmc7XG5cbmlmIChnbG9iYWwuY3J5cHRvICYmIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgLy8gV0hBVFdHIGNyeXB0by1iYXNlZCBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gIC8vIE1vZGVyYXRlbHkgZmFzdCwgaGlnaCBxdWFsaXR5XG4gIHZhciBfcm5kczggPSBuZXcgVWludDhBcnJheSgxNik7XG4gIHJuZyA9IGZ1bmN0aW9uIHdoYXR3Z1JORygpIHtcbiAgICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKF9ybmRzOCk7XG4gICAgcmV0dXJuIF9ybmRzODtcbiAgfTtcbn1cblxuaWYgKCFybmcpIHtcbiAgLy8gTWF0aC5yYW5kb20oKS1iYXNlZCAoUk5HKVxuICAvL1xuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIE1hdGgucmFuZG9tKCkuICBJdCdzIGZhc3QsIGJ1dCBpcyBvZiB1bnNwZWNpZmllZFxuICAvLyBxdWFsaXR5LlxuICB2YXIgIF9ybmRzID0gbmV3IEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCAxNjsgaSsrKSB7XG4gICAgICBpZiAoKGkgJiAweDAzKSA9PT0gMCkgciA9IE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDtcbiAgICAgIF9ybmRzW2ldID0gciA+Pj4gKChpICYgMHgwMykgPDwgMykgJiAweGZmO1xuICAgIH1cblxuICAgIHJldHVybiBfcm5kcztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBybmc7XG5cbiIsIi8vICAgICB1dWlkLmpzXG4vL1xuLy8gICAgIENvcHlyaWdodCAoYykgMjAxMC0yMDEyIFJvYmVydCBLaWVmZmVyXG4vLyAgICAgTUlUIExpY2Vuc2UgLSBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG5cbi8vIFVuaXF1ZSBJRCBjcmVhdGlvbiByZXF1aXJlcyBhIGhpZ2ggcXVhbGl0eSByYW5kb20gIyBnZW5lcmF0b3IuICBXZSBmZWF0dXJlXG4vLyBkZXRlY3QgdG8gZGV0ZXJtaW5lIHRoZSBiZXN0IFJORyBzb3VyY2UsIG5vcm1hbGl6aW5nIHRvIGEgZnVuY3Rpb24gdGhhdFxuLy8gcmV0dXJucyAxMjgtYml0cyBvZiByYW5kb21uZXNzLCBzaW5jZSB0aGF0J3Mgd2hhdCdzIHVzdWFsbHkgcmVxdWlyZWRcbnZhciBfcm5nID0gcmVxdWlyZSgnLi9ybmcnKTtcblxuLy8gTWFwcyBmb3IgbnVtYmVyIDwtPiBoZXggc3RyaW5nIGNvbnZlcnNpb25cbnZhciBfYnl0ZVRvSGV4ID0gW107XG52YXIgX2hleFRvQnl0ZSA9IHt9O1xuZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICBfYnl0ZVRvSGV4W2ldID0gKGkgKyAweDEwMCkudG9TdHJpbmcoMTYpLnN1YnN0cigxKTtcbiAgX2hleFRvQnl0ZVtfYnl0ZVRvSGV4W2ldXSA9IGk7XG59XG5cbi8vICoqYHBhcnNlKClgIC0gUGFyc2UgYSBVVUlEIGludG8gaXQncyBjb21wb25lbnQgYnl0ZXMqKlxuZnVuY3Rpb24gcGFyc2UocywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSAoYnVmICYmIG9mZnNldCkgfHwgMCwgaWkgPSAwO1xuXG4gIGJ1ZiA9IGJ1ZiB8fCBbXTtcbiAgcy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1swLTlhLWZdezJ9L2csIGZ1bmN0aW9uKG9jdCkge1xuICAgIGlmIChpaSA8IDE2KSB7IC8vIERvbid0IG92ZXJmbG93IVxuICAgICAgYnVmW2kgKyBpaSsrXSA9IF9oZXhUb0J5dGVbb2N0XTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFplcm8gb3V0IHJlbWFpbmluZyBieXRlcyBpZiBzdHJpbmcgd2FzIHNob3J0XG4gIHdoaWxlIChpaSA8IDE2KSB7XG4gICAgYnVmW2kgKyBpaSsrXSA9IDA7XG4gIH1cblxuICByZXR1cm4gYnVmO1xufVxuXG4vLyAqKmB1bnBhcnNlKClgIC0gQ29udmVydCBVVUlEIGJ5dGUgYXJyYXkgKGFsYSBwYXJzZSgpKSBpbnRvIGEgc3RyaW5nKipcbmZ1bmN0aW9uIHVucGFyc2UoYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBvZmZzZXQgfHwgMCwgYnRoID0gX2J5dGVUb0hleDtcbiAgcmV0dXJuICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV07XG59XG5cbi8vICoqYHYxKClgIC0gR2VuZXJhdGUgdGltZS1iYXNlZCBVVUlEKipcbi8vXG4vLyBJbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vTGlvc0svVVVJRC5qc1xuLy8gYW5kIGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS91dWlkLmh0bWxcblxuLy8gcmFuZG9tICMncyB3ZSBuZWVkIHRvIGluaXQgbm9kZSBhbmQgY2xvY2tzZXFcbnZhciBfc2VlZEJ5dGVzID0gX3JuZygpO1xuXG4vLyBQZXIgNC41LCBjcmVhdGUgYW5kIDQ4LWJpdCBub2RlIGlkLCAoNDcgcmFuZG9tIGJpdHMgKyBtdWx0aWNhc3QgYml0ID0gMSlcbnZhciBfbm9kZUlkID0gW1xuICBfc2VlZEJ5dGVzWzBdIHwgMHgwMSxcbiAgX3NlZWRCeXRlc1sxXSwgX3NlZWRCeXRlc1syXSwgX3NlZWRCeXRlc1szXSwgX3NlZWRCeXRlc1s0XSwgX3NlZWRCeXRlc1s1XVxuXTtcblxuLy8gUGVyIDQuMi4yLCByYW5kb21pemUgKDE0IGJpdCkgY2xvY2tzZXFcbnZhciBfY2xvY2tzZXEgPSAoX3NlZWRCeXRlc1s2XSA8PCA4IHwgX3NlZWRCeXRlc1s3XSkgJiAweDNmZmY7XG5cbi8vIFByZXZpb3VzIHV1aWQgY3JlYXRpb24gdGltZVxudmFyIF9sYXN0TVNlY3MgPSAwLCBfbGFzdE5TZWNzID0gMDtcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjEob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG4gIHZhciBiID0gYnVmIHx8IFtdO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBjbG9ja3NlcSA9IG9wdGlvbnMuY2xvY2tzZXEgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuY2xvY2tzZXEgOiBfY2xvY2tzZXE7XG5cbiAgLy8gVVVJRCB0aW1lc3RhbXBzIGFyZSAxMDAgbmFuby1zZWNvbmQgdW5pdHMgc2luY2UgdGhlIEdyZWdvcmlhbiBlcG9jaCxcbiAgLy8gKDE1ODItMTAtMTUgMDA6MDApLiAgSlNOdW1iZXJzIGFyZW4ndCBwcmVjaXNlIGVub3VnaCBmb3IgdGhpcywgc29cbiAgLy8gdGltZSBpcyBoYW5kbGVkIGludGVybmFsbHkgYXMgJ21zZWNzJyAoaW50ZWdlciBtaWxsaXNlY29uZHMpIGFuZCAnbnNlY3MnXG4gIC8vICgxMDAtbmFub3NlY29uZHMgb2Zmc2V0IGZyb20gbXNlY3MpIHNpbmNlIHVuaXggZXBvY2gsIDE5NzAtMDEtMDEgMDA6MDAuXG4gIHZhciBtc2VjcyA9IG9wdGlvbnMubXNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubXNlY3MgOiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAvLyBQZXIgNC4yLjEuMiwgdXNlIGNvdW50IG9mIHV1aWQncyBnZW5lcmF0ZWQgZHVyaW5nIHRoZSBjdXJyZW50IGNsb2NrXG4gIC8vIGN5Y2xlIHRvIHNpbXVsYXRlIGhpZ2hlciByZXNvbHV0aW9uIGNsb2NrXG4gIHZhciBuc2VjcyA9IG9wdGlvbnMubnNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubnNlY3MgOiBfbGFzdE5TZWNzICsgMTtcblxuICAvLyBUaW1lIHNpbmNlIGxhc3QgdXVpZCBjcmVhdGlvbiAoaW4gbXNlY3MpXG4gIHZhciBkdCA9IChtc2VjcyAtIF9sYXN0TVNlY3MpICsgKG5zZWNzIC0gX2xhc3ROU2VjcykvMTAwMDA7XG5cbiAgLy8gUGVyIDQuMi4xLjIsIEJ1bXAgY2xvY2tzZXEgb24gY2xvY2sgcmVncmVzc2lvblxuICBpZiAoZHQgPCAwICYmIG9wdGlvbnMuY2xvY2tzZXEgPT09IHVuZGVmaW5lZCkge1xuICAgIGNsb2Nrc2VxID0gY2xvY2tzZXEgKyAxICYgMHgzZmZmO1xuICB9XG5cbiAgLy8gUmVzZXQgbnNlY3MgaWYgY2xvY2sgcmVncmVzc2VzIChuZXcgY2xvY2tzZXEpIG9yIHdlJ3ZlIG1vdmVkIG9udG8gYSBuZXdcbiAgLy8gdGltZSBpbnRlcnZhbFxuICBpZiAoKGR0IDwgMCB8fCBtc2VjcyA+IF9sYXN0TVNlY3MpICYmIG9wdGlvbnMubnNlY3MgPT09IHVuZGVmaW5lZCkge1xuICAgIG5zZWNzID0gMDtcbiAgfVxuXG4gIC8vIFBlciA0LjIuMS4yIFRocm93IGVycm9yIGlmIHRvbyBtYW55IHV1aWRzIGFyZSByZXF1ZXN0ZWRcbiAgaWYgKG5zZWNzID49IDEwMDAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1dWlkLnYxKCk6IENhblxcJ3QgY3JlYXRlIG1vcmUgdGhhbiAxME0gdXVpZHMvc2VjJyk7XG4gIH1cblxuICBfbGFzdE1TZWNzID0gbXNlY3M7XG4gIF9sYXN0TlNlY3MgPSBuc2VjcztcbiAgX2Nsb2Nrc2VxID0gY2xvY2tzZXE7XG5cbiAgLy8gUGVyIDQuMS40IC0gQ29udmVydCBmcm9tIHVuaXggZXBvY2ggdG8gR3JlZ29yaWFuIGVwb2NoXG4gIG1zZWNzICs9IDEyMjE5MjkyODAwMDAwO1xuXG4gIC8vIGB0aW1lX2xvd2BcbiAgdmFyIHRsID0gKChtc2VjcyAmIDB4ZmZmZmZmZikgKiAxMDAwMCArIG5zZWNzKSAlIDB4MTAwMDAwMDAwO1xuICBiW2krK10gPSB0bCA+Pj4gMjQgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gMTYgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gOCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsICYgMHhmZjtcblxuICAvLyBgdGltZV9taWRgXG4gIHZhciB0bWggPSAobXNlY3MgLyAweDEwMDAwMDAwMCAqIDEwMDAwKSAmIDB4ZmZmZmZmZjtcbiAgYltpKytdID0gdG1oID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdG1oICYgMHhmZjtcblxuICAvLyBgdGltZV9oaWdoX2FuZF92ZXJzaW9uYFxuICBiW2krK10gPSB0bWggPj4+IDI0ICYgMHhmIHwgMHgxMDsgLy8gaW5jbHVkZSB2ZXJzaW9uXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMTYgJiAweGZmO1xuXG4gIC8vIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYCAoUGVyIDQuMi4yIC0gaW5jbHVkZSB2YXJpYW50KVxuICBiW2krK10gPSBjbG9ja3NlcSA+Pj4gOCB8IDB4ODA7XG5cbiAgLy8gYGNsb2NrX3NlcV9sb3dgXG4gIGJbaSsrXSA9IGNsb2Nrc2VxICYgMHhmZjtcblxuICAvLyBgbm9kZWBcbiAgdmFyIG5vZGUgPSBvcHRpb25zLm5vZGUgfHwgX25vZGVJZDtcbiAgZm9yICh2YXIgbiA9IDA7IG4gPCA2OyBuKyspIHtcbiAgICBiW2kgKyBuXSA9IG5vZGVbbl07XG4gIH1cblxuICByZXR1cm4gYnVmID8gYnVmIDogdW5wYXJzZShiKTtcbn1cblxuLy8gKipgdjQoKWAgLSBHZW5lcmF0ZSByYW5kb20gVVVJRCoqXG5cbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYnJvb2ZhL25vZGUtdXVpZCBmb3IgQVBJIGRldGFpbHNcbmZ1bmN0aW9uIHY0KG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gIC8vIERlcHJlY2F0ZWQgLSAnZm9ybWF0JyBhcmd1bWVudCwgYXMgc3VwcG9ydGVkIGluIHYxLjJcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG5cbiAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSAnc3RyaW5nJykge1xuICAgIGJ1ZiA9IG9wdGlvbnMgPT0gJ2JpbmFyeScgPyBuZXcgQXJyYXkoMTYpIDogbnVsbDtcbiAgICBvcHRpb25zID0gbnVsbDtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgcm5kcyA9IG9wdGlvbnMucmFuZG9tIHx8IChvcHRpb25zLnJuZyB8fCBfcm5nKSgpO1xuXG4gIC8vIFBlciA0LjQsIHNldCBiaXRzIGZvciB2ZXJzaW9uIGFuZCBgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZGBcbiAgcm5kc1s2XSA9IChybmRzWzZdICYgMHgwZikgfCAweDQwO1xuICBybmRzWzhdID0gKHJuZHNbOF0gJiAweDNmKSB8IDB4ODA7XG5cbiAgLy8gQ29weSBieXRlcyB0byBidWZmZXIsIGlmIHByb3ZpZGVkXG4gIGlmIChidWYpIHtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgMTY7IGlpKyspIHtcbiAgICAgIGJ1ZltpICsgaWldID0gcm5kc1tpaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZiB8fCB1bnBhcnNlKHJuZHMpO1xufVxuXG4vLyBFeHBvcnQgcHVibGljIEFQSVxudmFyIHV1aWQgPSB2NDtcbnV1aWQudjEgPSB2MTtcbnV1aWQudjQgPSB2NDtcbnV1aWQucGFyc2UgPSBwYXJzZTtcbnV1aWQudW5wYXJzZSA9IHVucGFyc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gdXVpZDtcbiJdfQ==
