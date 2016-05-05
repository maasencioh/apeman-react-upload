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
'use strict'

const React = require('react')
const ReactDOM = require('react-dom')

const Demo = require('./demo.component.js').default

window.addEventListener('load', function onLoad () {
  window.React = React
  let DemoFactory = React.createFactory(Demo)
  ReactDOM.render(DemoFactory(), document.getElementById('demo-wrap'))
})

},{"./demo.component.js":4,"react":"react","react-dom":"react-dom"}],4:[function(require,module,exports){
'use strict';Object.defineProperty(exports,'__esModule',{value:true});var _react=require('react');var _react2=_interopRequireDefault(_react);var _ap_upload=require('../../lib/ap_upload');var _ap_upload2=_interopRequireDefault(_ap_upload);var _ap_upload_style=require('../../lib/ap_upload_style');var _ap_upload_style2=_interopRequireDefault(_ap_upload_style);var _apemanReactImage=require('apeman-react-image');var _apemanReactSpinner=require('apeman-react-spinner');var _apemanReactButton=require('apeman-react-button');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}var DEMO_IMAGES=['https://raw.githubusercontent.com/apeman-asset-labo/apeman-asset-images/master/dist/dummy/12.jpg'];var Demo=_react2.default.createClass({displayName:'Demo',render:function render(){var s=this;return _react2.default.createElement('div',null,_react2.default.createElement(_apemanReactSpinner.ApSpinnerStyle,null),_react2.default.createElement(_apemanReactButton.ApButtonStyle,{highlightColor:'#b35600'}),_react2.default.createElement(_apemanReactImage.ApImageStyle,null),_react2.default.createElement(_ap_upload_style2.default,null),_react2.default.createElement(_ap_upload2.default,{multiple:true,id:'demo-file-upload-01',name:'file-input-01',accept:'image/*',onLoad:s.handleLoaded}),_react2.default.createElement(_ap_upload2.default,{multiple:true,id:'demo-file-upload-02',name:'file-input-02',accept:'image/*',value:DEMO_IMAGES,onLoad:s.handleLoaded}))},handleLoaded:function handleLoaded(ev){console.log('result',ev.target,ev.urls)}});exports.default=Demo;

},{"../../lib/ap_upload":5,"../../lib/ap_upload_style":6,"apeman-react-button":17,"apeman-react-image":20,"apeman-react-spinner":24,"react":"react"}],5:[function(require,module,exports){
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

},{"apeman-react-button":17,"apeman-react-image":20,"apeman-react-spinner":24,"async":25,"classnames":"classnames","path":1,"react":"react","uuid":32}],6:[function(require,module,exports){
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
/**
 * Big button component.
 * @class ApBigButton
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApBigButton;

},{"./ap_button":8,"apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],8:[function(require,module,exports){
/**
 * Button component.
 * @class ApButton
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApButton;

},{"apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],9:[function(require,module,exports){
/**
 * Button group component.
 * @class ApButtonGroup
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApButtonGroup;

},{"apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],10:[function(require,module,exports){
/**
 * Style for ApButton.
 * @class ApButtonStyle
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApButtonStyle;

},{"apeman-react-style":"apeman-react-style","react":"react"}],11:[function(require,module,exports){
/**
 * Cell button component.
 * @class ApCellButton
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApCellButton;

},{"./ap_button":8,"apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],12:[function(require,module,exports){
/**
 * Row for Cell buttons.
 * @class ApCellButtonRow
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApCellButtonRow;

},{"classnames":"classnames","react":"react"}],13:[function(require,module,exports){
/**
 * Icon button component.
 * @class ApIconButton
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApIconButton;

},{"./ap_button":8,"apeman-react-icon":"apeman-react-icon","apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],14:[function(require,module,exports){
/**
 * Row for Icon buttons.
 * @class ApIconButtonRow
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApIconButtonRow;

},{"classnames":"classnames","react":"react"}],15:[function(require,module,exports){
/**
 * Next button component.
 * @class ApNextButton
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApNextButton;

},{"./ap_button":8,"apeman-react-icon":"apeman-react-icon","apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],16:[function(require,module,exports){
/**
 * Prev button component.
 * @class ApPrevButton
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApPrevButton;

},{"./ap_button":8,"apeman-react-icon":"apeman-react-icon","apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","react":"react"}],17:[function(require,module,exports){
/**
 * apeman react package for button component.
 * @module apeman-react-button
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get ApBigButton () { return d(require('./ap_big_button')) },
  get ApButtonGroup () { return d(require('./ap_button_group')) },
  get ApButtonStyle () { return d(require('./ap_button_style')) },
  get ApButton () { return d(require('./ap_button')) },
  get ApCellButtonRow () { return d(require('./ap_cell_button_row')) },
  get ApCellButton () { return d(require('./ap_cell_button')) },
  get ApIconButtonRow () { return d(require('./ap_icon_button_row')) },
  get ApIconButton () { return d(require('./ap_icon_button')) },
  get ApNextButton () { return d(require('./ap_next_button')) },
  get ApPrevButton () { return d(require('./ap_prev_button')) }
}

},{"./ap_big_button":7,"./ap_button":8,"./ap_button_group":9,"./ap_button_style":10,"./ap_cell_button":11,"./ap_cell_button_row":12,"./ap_icon_button":13,"./ap_icon_button_row":14,"./ap_next_button":15,"./ap_prev_button":16}],18:[function(require,module,exports){
/**
 * apeman react package for image component.
 * @class ApImage
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _numcal = require('numcal');

var _numcal2 = _interopRequireDefault(_numcal);

var _scaled_size = require('./sizing/scaled_size');

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
      alt: 'NO IMAGE',
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

    var src = s.props.src;
    var nextSrc = nextProps.src;
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

exports.default = ApImage;

},{"./sizing/scaled_size":21,"apeman-react-mixins":"apeman-react-mixins","apeman-react-spinner":24,"classnames":"classnames","numcal":27,"react":"react","react-dom":"react-dom"}],19:[function(require,module,exports){
/**
 * Style for ApImage.
 * @class ApImageStyle
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _apemanReactStyle = require('apeman-react-style');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApImageStyle */
var ApImageStyle = _react2.default.createClass({
  displayName: 'ApImageStyle',

  propTypes: {

    style: _react.PropTypes.object,
    backgroundColor: _react.PropTypes.string
  },
  getDefaultProps: function getDefaultProps() {
    return {

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
      {
        data: Object.assign(data, props.style),
        smallMediaData: smallMediaData,
        mediumMediaData: mediumMediaData,
        largeMediaData: largeMediaData
      },
      props.children
    );
  }
});

exports.default = ApImageStyle;

},{"apeman-react-style":"apeman-react-style","react":"react"}],20:[function(require,module,exports){
/**
 * apeman react package for image component.
 * @module apeman-react-image
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get ApImageStyle () { return d(require('./ap_image_style')) },
  get ApImage () { return d(require('./ap_image')) }
}

},{"./ap_image":18,"./ap_image_style":19}],21:[function(require,module,exports){
/**
 * @function _scaledSize
 */

'use strict'

const numcal = require('numcal')

function scaledSize (contentSize, frameSize, policy) {
  let cw = contentSize.width
  let ch = contentSize.height
  let fw = frameSize.width
  let fh = frameSize.height

  let wRate = numcal.min(1, fw / cw)
  let hRate = numcal.min(1, fh / ch)

  let sizeWithRate = (rate) => ({
    width: contentSize.width * rate,
    height: contentSize.height * rate
  })

  switch (policy) {
    case 'none':
      return sizeWithRate(1)
    case 'fit':
      return sizeWithRate(
        numcal.min(wRate, hRate)
      )
    case 'fill':
      return sizeWithRate(
        numcal.max(wRate, hRate)
      )
    default:
      throw new Error(`Unknown policy: ${policy}`)
  }
}

module.exports = scaledSize

},{"numcal":27}],22:[function(require,module,exports){
/**
 * apeman react package for spinner.
 * @class ApSpinner
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _numcal = require('numcal');

var _numcal2 = _interopRequireDefault(_numcal);

var _apemanReactMixins = require('apeman-react-mixins');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SpinnerThemes = {
  a: ['fa', 'fa-spin', 'fa-spinner'],
  b: ['fa', 'fa-spin', 'fa-circle-o-notch'],
  c: ['fa', 'fa-spin', 'fa-refresh'],
  d: ['fa', 'fa-spin', 'fa-gear'],
  e: ['fa', 'fa-spin', 'fa-pulse']
};
var DEFAULT_THEME = 'c';

/** @lends ApSpinner */
var ApSpinner = _react2.default.createClass({
  displayName: 'ApSpinner',


  // --------------------
  // Specs
  // --------------------

  propTypes: {
    enabled: _react.PropTypes.bool,
    theme: _react.PropTypes.oneOf(Object.keys(SpinnerThemes))
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

    var className = (0, _classnames2.default)('ap-spinner', props.className, {
      'ap-spinner-visible': !!layouts.spinner,
      'ap-spinner-enabled': !!props.enabled
    });
    return _react2.default.createElement(
      'div',
      { className: className,
        style: Object.assign({}, layouts.spinner, props.style) },
      _react2.default.createElement(
        'span',
        { className: 'ap-spinner-aligner' },
        ' '
      ),
      _react2.default.createElement('span', { ref: 'icon',
        className: (0, _classnames2.default)('ap-spinner-icon', SpinnerThemes[props.theme]),
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

exports.default = ApSpinner;

},{"apeman-react-mixins":"apeman-react-mixins","classnames":"classnames","numcal":27,"react":"react","react-dom":"react-dom"}],23:[function(require,module,exports){
/**
 * Style for ApSpinner.
 * @class ApSpinnerStyle
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = ApSpinnerStyle;

},{"apeman-react-style":"apeman-react-style","react":"react"}],24:[function(require,module,exports){
/**
 * apeman react package for spinner.
 * @module apeman-react-spinner
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get ApSpinnerStyle () { return d(require('./ap_spinner_style')) },
  get ApSpinner () { return d(require('./ap_spinner')) }
}

},{"./ap_spinner":22,"./ap_spinner_style":23}],25:[function(require,module,exports){
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

},{"./rng":31}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4wLjAvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8ubnZtL3ZlcnNpb25zL25vZGUvdjYuMC4wL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwiLi4vLi4vLi4vLm52bS92ZXJzaW9ucy9ub2RlL3Y2LjAuMC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsImRvYy9kZW1vL2RlbW8uYnJvd3Nlci5qcyIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2RvYy9kZW1vL2RlbW8uY29tcG9uZW50LmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2xpYi9hcF91cGxvYWQuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC11cGxvYWQvbGliL2FwX3VwbG9hZF9zdHlsZS5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfYmlnX2J1dHRvbi5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfYnV0dG9uLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9hcF9idXR0b25fZ3JvdXAuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2J1dHRvbl9zdHlsZS5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfY2VsbF9idXR0b24uanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2NlbGxfYnV0dG9uX3Jvdy5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfaWNvbl9idXR0b24uanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2ljb25fYnV0dG9uX3Jvdy5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfbmV4dF9idXR0b24uanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX3ByZXZfYnV0dG9uLmpzeCIsIm5vZGVfbW9kdWxlcy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtaW1hZ2UvbGliL2FwX2ltYWdlLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtaW1hZ2UvbGliL2FwX2ltYWdlX3N0eWxlLmpzeCIsIm5vZGVfbW9kdWxlcy9hcGVtYW4tcmVhY3QtaW1hZ2UvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2FwZW1hbi1yZWFjdC1pbWFnZS9saWIvc2l6aW5nL3NjYWxlZF9zaXplLmpzIiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1zcGlubmVyL2xpYi9hcF9zcGlubmVyLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3Qtc3Bpbm5lci9saWIvYXBfc3Bpbm5lcl9zdHlsZS5qc3giLCJub2RlX21vZHVsZXMvYXBlbWFuLXJlYWN0LXNwaW5uZXIvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2FzeW5jL2xpYi9hc3luYy5qcyIsIm5vZGVfbW9kdWxlcy9udW1jYWwvbGliL2F2ZS5qcyIsIm5vZGVfbW9kdWxlcy9udW1jYWwvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvbWF4LmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvbWluLmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvc3VtLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvcm5nLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXVpZC91dWlkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpXG5jb25zdCBSZWFjdERPTSA9IHJlcXVpcmUoJ3JlYWN0LWRvbScpXG5cbmNvbnN0IERlbW8gPSByZXF1aXJlKCcuL2RlbW8uY29tcG9uZW50LmpzJykuZGVmYXVsdFxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIG9uTG9hZCAoKSB7XG4gIHdpbmRvdy5SZWFjdCA9IFJlYWN0XG4gIGxldCBEZW1vRmFjdG9yeSA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoRGVtbylcbiAgUmVhY3RET00ucmVuZGVyKERlbW9GYWN0b3J5KCksIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZW1vLXdyYXAnKSlcbn0pXG4iLCIndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IEFwVXBsb2FkIGZyb20gJy4uLy4uL2xpYi9hcF91cGxvYWQnXG5pbXBvcnQgQXBVcGxvYWRTdHlsZSBmcm9tICcuLi8uLi9saWIvYXBfdXBsb2FkX3N0eWxlJ1xuaW1wb3J0IHtBcEltYWdlU3R5bGV9IGZyb20gJ2FwZW1hbi1yZWFjdC1pbWFnZSdcbmltcG9ydCB7QXBTcGlubmVyU3R5bGV9IGZyb20gJ2FwZW1hbi1yZWFjdC1zcGlubmVyJ1xuaW1wb3J0IHtBcEJ1dHRvblN0eWxlfSBmcm9tICdhcGVtYW4tcmVhY3QtYnV0dG9uJ1xuXG5jb25zdCBERU1PX0lNQUdFUyA9IFtcbiAgJ2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9hcGVtYW4tYXNzZXQtbGFiby9hcGVtYW4tYXNzZXQtaW1hZ2VzL21hc3Rlci9kaXN0L2R1bW15LzEyLmpwZydcbl1cblxuY29uc3QgRGVtbyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8QXBTcGlubmVyU3R5bGUgLz5cbiAgICAgICAgPEFwQnV0dG9uU3R5bGUgaGlnaGxpZ2h0Q29sb3I9XCIjYjM1NjAwXCIvPlxuICAgICAgICA8QXBJbWFnZVN0eWxlIC8+XG4gICAgICAgIDxBcFVwbG9hZFN0eWxlIC8+XG4gICAgICAgIDxBcFVwbG9hZCBtdWx0aXBsZT17IHRydWUgfVxuICAgICAgICAgICAgICAgICAgaWQ9XCJkZW1vLWZpbGUtdXBsb2FkLTAxXCJcbiAgICAgICAgICAgICAgICAgIG5hbWU9XCJmaWxlLWlucHV0LTAxXCJcbiAgICAgICAgICAgICAgICAgIGFjY2VwdD1cImltYWdlLypcIlxuICAgICAgICAgICAgICAgICAgb25Mb2FkPXsgcy5oYW5kbGVMb2FkZWQgfT5cbiAgICAgICAgPC9BcFVwbG9hZD5cblxuICAgICAgICA8QXBVcGxvYWQgbXVsdGlwbGU9eyB0cnVlIH1cbiAgICAgICAgICAgICAgICAgIGlkPVwiZGVtby1maWxlLXVwbG9hZC0wMlwiXG4gICAgICAgICAgICAgICAgICBuYW1lPVwiZmlsZS1pbnB1dC0wMlwiXG4gICAgICAgICAgICAgICAgICBhY2NlcHQ9XCJpbWFnZS8qXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXsgREVNT19JTUFHRVMgfVxuICAgICAgICAgICAgICAgICAgb25Mb2FkPXsgcy5oYW5kbGVMb2FkZWQgfT5cbiAgICAgICAgPC9BcFVwbG9hZD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfSxcbiAgaGFuZGxlTG9hZGVkIChldikge1xuICAgIGNvbnNvbGUubG9nKCdyZXN1bHQnLCBldi50YXJnZXQsIGV2LnVybHMpXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IERlbW9cbiIsIi8qKlxuICogYXBlbWFuIHJlYWN0IHBhY2thZ2UgZm9yIGZpbGUgdXBsb2FkIGNvbXBvbmVudHMuXG4gKiBAY2xhc3MgQXBVcGxvYWRcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgYXN5bmMgZnJvbSAnYXN5bmMnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHV1aWQgZnJvbSAndXVpZCdcbmltcG9ydCB7QXBJbWFnZX0gZnJvbSAnYXBlbWFuLXJlYWN0LWltYWdlJ1xuaW1wb3J0IHtBcFNwaW5uZXJ9IGZyb20gJ2FwZW1hbi1yZWFjdC1zcGlubmVyJ1xuaW1wb3J0IHtBcEJ1dHRvbn0gZnJvbSAnYXBlbWFuLXJlYWN0LWJ1dHRvbidcblxuLyoqIEBsZW5kcyBBcFVwbG9hZCAqL1xuY29uc3QgQXBVcGxvYWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICAvKiogTmFtZSBvZiBpbnB1dCAqL1xuICAgIG5hbWU6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogRE9NIGlkIG9mIGlucHV0ICovXG4gICAgaWQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogQWxsb3cgbXVsdGlwbGUgdXBsb2FkICovXG4gICAgbXVsdGlwbGU6IHR5cGVzLmJvb2wsXG4gICAgLyoqIEhhbmRsZXIgZm9yIGNoYW5nZSBldmVudCAqL1xuICAgIG9uQ2hhbmdlOiB0eXBlcy5mdW5jLFxuICAgIC8qKiBIYW5kbGVyIGZvciBsb2FkIGV2ZW50ICovXG4gICAgb25Mb2FkOiB0eXBlcy5mdW5jLFxuICAgIC8qKiBIYW5kbGVyIGZvciBlcnJvciBldmVudCAqL1xuICAgIG9uRXJyb3I6IHR5cGVzLmZ1bmMsXG4gICAgLyoqIEltYWdlIHdpZHRoICovXG4gICAgd2lkdGg6IHR5cGVzLm51bWJlcixcbiAgICAvKiogSW1hZ2UgaGVpZ2h0ICovXG4gICAgaGVpZ2h0OiB0eXBlcy5udW1iZXIsXG4gICAgLyoqIEd1aWRlIHRleHQgKi9cbiAgICB0ZXh0OiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIEFjY2VwdCBmaWxlIHR5cGUgKi9cbiAgICBhY2NlcHQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogR3VpZGUgaWNvbiAqL1xuICAgIGljb246IHR5cGVzLnN0cmluZyxcbiAgICAvKiogSWNvbiBmb3IgY2xvc2UgaW1hZ2VzICovXG4gICAgY2xvc2VJY29uOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIFNwaW5uZXIgdGhlbWUgKi9cbiAgICBzcGlubmVyOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIFZhbHVlIG9mIGlucHV0ICovXG4gICAgdmFsdWU6IHR5cGVzLm9uZU9mVHlwZShbXG4gICAgICB0eXBlcy5zdHJpbmcsXG4gICAgICB0eXBlcy5hcnJheVxuICAgIF0pXG4gIH0sXG5cbiAgbWl4aW5zOiBbXSxcblxuICBzdGF0aWNzOiB7XG4gICAgcmVhZEZpbGUgKGZpbGUsIGNhbGxiYWNrKSB7XG4gICAgICBsZXQgcmVhZGVyID0gbmV3IHdpbmRvdy5GaWxlUmVhZGVyKClcbiAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gb25lcnJvciAoZXJyKSB7XG4gICAgICAgIGNhbGxiYWNrKGVycilcbiAgICAgIH1cbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiBvbmxvYWQgKGV2KSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGV2LnRhcmdldC5yZXN1bHQpXG4gICAgICB9XG4gICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKVxuICAgIH0sXG4gICAgaXNJbWFnZVVybCAodXJsKSB7XG4gICAgICBjb25zdCBpbWFnZUV4dGVuc2lvbnMgPSBbXG4gICAgICAgICcuanBnJyxcbiAgICAgICAgJy5qcGVnJyxcbiAgICAgICAgJy5zdmcnLFxuICAgICAgICAnLmdpZicsXG4gICAgICAgICcucG5nJ1xuICAgICAgXVxuICAgICAgcmV0dXJuIC9eZGF0YTppbWFnZS8udGVzdCh1cmwpIHx8ICEhfmltYWdlRXh0ZW5zaW9ucy5pbmRleE9mKHBhdGguZXh0bmFtZSh1cmwpKVxuICAgIH1cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcbiAgICBsZXQgaGFzVmFsdWUgPSBwcm9wcy52YWx1ZSAmJiBwcm9wcy52YWx1ZS5sZW5ndGggPiAwXG4gICAgcmV0dXJuIHtcbiAgICAgIHNwaW5uaW5nOiBmYWxzZSxcbiAgICAgIGVycm9yOiBudWxsLFxuICAgICAgdXJsczogaGFzVmFsdWUgPyBbXS5jb25jYXQocHJvcHMudmFsdWUpIDogbnVsbFxuICAgIH1cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBudWxsLFxuICAgICAgaWQ6IGBhcC11cGxvYWQtJHt1dWlkLnY0KCl9YCxcbiAgICAgIG11bHRpcGxlOiBmYWxzZSxcbiAgICAgIHdpZHRoOiAxODAsXG4gICAgICBoZWlnaHQ6IDE4MCxcbiAgICAgIGFjY2VwdDogbnVsbCxcbiAgICAgIHRleHQ6ICdVcGxvYWQgZmlsZScsXG4gICAgICBpY29uOiAnZmEgZmEtY2xvdWQtdXBsb2FkJyxcbiAgICAgIGNsb3NlSWNvbjogJ2ZhIGZhLWNsb3NlJyxcbiAgICAgIHNwaW5uZXJJY29uOiBBcFNwaW5uZXIuREVGQVVMVF9USEVNRSxcbiAgICAgIG9uQ2hhbmdlOiBudWxsLFxuICAgICAgb25Mb2FkOiBudWxsLFxuICAgICAgb25FcnJvcjogbnVsbFxuICAgIH1cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgc3RhdGUsIHByb3BzIH0gPSBzXG4gICAgbGV0IHsgd2lkdGgsIGhlaWdodCB9ID0gcHJvcHNcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzbmFtZXMoJ2FwLXVwbG9hZCcsIHByb3BzLmNsYXNzTmFtZSl9XG4gICAgICAgICAgIHN0eWxlPXtPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSl9PlxuICAgICAgICA8aW5wdXQgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWlucHV0XCJcbiAgICAgICAgICAgICAgIG11bHRpcGxlPXsgcHJvcHMubXVsdGlwbGUgfVxuICAgICAgICAgICAgICAgbmFtZT17IHByb3BzLm5hbWUgfVxuICAgICAgICAgICAgICAgaWQ9eyBwcm9wcy5pZCB9XG4gICAgICAgICAgICAgICBhY2NlcHQ9eyBwcm9wcy5hY2NlcHQgfVxuICAgICAgICAgICAgICAgb25DaGFuZ2U9e3MuaGFuZGxlQ2hhbmdlfVxuICAgICAgICAgICAgICAgc3R5bGU9e3t3aWR0aCwgaGVpZ2h0fX1cbiAgICAgICAgLz5cbiAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1sYWJlbFwiIGh0bWxGb3I9eyBwcm9wcy5pZCB9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC11cGxvYWQtYWxpZ25lclwiPlxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1sYWJlbC1pbm5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcyhcImFwLXVwbG9hZC1pY29uXCIsIHByb3BzLmljb24pIH0vPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLXRleHRcIj57cHJvcHMudGV4dH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgeyBzLl9yZW5kZXJQcmV2aWV3SW1hZ2Uoc3RhdGUudXJscywgd2lkdGgsIGhlaWdodCkgfVxuICAgICAgICB7IHMuX3JlbmRlclJlbW92ZUJ1dHRvbighIShzdGF0ZS51cmxzICYmIHN0YXRlLnVybHMubGVuZ3RoID4gMCksIHByb3BzLmNsb3NlSWNvbikgfVxuICAgICAgICB7IHMuX3JlbmRlclNwaW5uZXIoc3RhdGUuc3Bpbm5pbmcsIHByb3BzLnNwaW5uZXIpIH1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBMaWZlY3ljbGVcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gQ3VzdG9tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGhhbmRsZUNoYW5nZSAoZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcbiAgICBsZXQgeyB0YXJnZXQgfSA9IGVcbiAgICBsZXQgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0YXJnZXQuZmlsZXMsIDApXG5cbiAgICBsZXQgeyBvbkNoYW5nZSwgb25FcnJvciwgb25Mb2FkIH0gPSBwcm9wc1xuXG4gICAgcy5zZXRTdGF0ZSh7IHNwaW5uaW5nOiB0cnVlIH0pXG4gICAgaWYgKG9uQ2hhbmdlKSB7XG4gICAgICBvbkNoYW5nZShlKVxuICAgIH1cbiAgICBhc3luYy5jb25jYXQoZmlsZXMsIEFwVXBsb2FkLnJlYWRGaWxlLCAoZXJyLCB1cmxzKSA9PiB7XG4gICAgICBlLnVybHMgPSB1cmxzXG4gICAgICBlLnRhcmdldCA9IHRhcmdldFxuICAgICAgcy5zZXRTdGF0ZSh7XG4gICAgICAgIHNwaW5uaW5nOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycixcbiAgICAgICAgdXJsczogdXJsc1xuICAgICAgfSlcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgaWYgKG9uRXJyb3IpIHtcbiAgICAgICAgICBvbkVycm9yKGVycilcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG9uTG9hZCkge1xuICAgICAgICAgIG9uTG9hZChlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfSxcblxuICBoYW5kbGVSZW1vdmUgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcbiAgICBsZXQgeyBvbkxvYWQgfSA9IHByb3BzXG4gICAgcy5zZXRTdGF0ZSh7XG4gICAgICBlcnJvcjogbnVsbCxcbiAgICAgIHVybHM6IG51bGxcbiAgICB9KVxuICAgIGlmIChvbkxvYWQpIHtcbiAgICAgIG9uTG9hZChbXSlcbiAgICB9XG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFByaXZhdGVcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgX3JlbmRlclNwaW5uZXIgKHNwaW5uaW5nLCB0aGVtZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgcmV0dXJuIChcbiAgICAgIDxBcFNwaW5uZXIgZW5hYmxlZD17c3Bpbm5pbmd9IHRoZW1lPXt0aGVtZX0+XG4gICAgICA8L0FwU3Bpbm5lcj5cbiAgICApXG4gIH0sXG5cbiAgX3JlbmRlclJlbW92ZUJ1dHRvbiAocmVtb3ZhYmxlLCBpY29uKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBpZiAoIXJlbW92YWJsZSkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgIDxBcEJ1dHRvbiBvblRhcD17IHMuaGFuZGxlUmVtb3ZlIH0gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLXJlbW92ZS1idXR0b25cIj5cbiAgICAgICAgPGkgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcyhcImFwLXVwbG9hZC1yZW1vdmUtaWNvblwiLCBpY29uKSB9Lz5cbiAgICAgIDwvQXBCdXR0b24+XG4gICAgKVxuICB9LFxuXG4gIF9yZW5kZXJQcmV2aWV3SW1hZ2UgKHVybHMsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICBpZiAoIXVybHMpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgcmV0dXJuIHVybHNcbiAgICAgIC5maWx0ZXIoKHVybCkgPT4gQXBVcGxvYWQuaXNJbWFnZVVybCh1cmwpKVxuICAgICAgLm1hcCgodXJsLCBpKSA9PiAoXG4gICAgICAgIDxBcEltYWdlIGtleT17IHVybCB9XG4gICAgICAgICAgICAgICAgIHNyYz17IHVybCB9XG4gICAgICAgICAgICAgICAgIGhlaWdodD17IGhlaWdodCB9XG4gICAgICAgICAgICAgICAgIHdpZHRoPXsgd2lkdGggfVxuICAgICAgICAgICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC11cGxvYWQtcHJldmlldy1pbWFnZScpIH1cbiAgICAgICAgICAgICAgICAgc3R5bGU9eyB7IGxlZnQ6IGAke2kgKiAxMH0lYCwgdG9wOiBgJHtpICogMTB9JWAgfSB9XG4gICAgICAgICAgICAgICAgIHNjYWxlPVwiZml0XCI+XG4gICAgICAgIDwvQXBJbWFnZT5cbiAgICAgICkpXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwVXBsb2FkXG4iLCIvKipcbiAqIFN0eWxlIGZvciBBcFVwbG9hZC5cbiAqIEBjbGFzcyBBcFVwbG9hZFN0eWxlXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQge0FwU3R5bGV9IGZyb20gJ2FwZW1hbi1yZWFjdC1zdHlsZSdcblxuLyoqIEBsZW5kcyBBcFVwbG9hZFN0eWxlICovXG5jb25zdCBBcFVwbG9hZFN0eWxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBwcm9wVHlwZXM6IHtcbiAgICBzdHlsZTogdHlwZXMub2JqZWN0LFxuICAgIGhpZ2hsaWdodENvbG9yOiB0eXBlcy5zdHJpbmcsXG4gICAgYmFja2dyb3VuZENvbG9yOiB0eXBlcy5zdHJpbmdcbiAgfSxcbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3R5bGU6IHt9LFxuICAgICAgaGlnaGxpZ2h0Q29sb3I6IEFwU3R5bGUuREVGQVVMVF9ISUdITElHSFRfQ09MT1IsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IEFwU3R5bGUuREVGQVVMVF9CQUNLR1JPVU5EX0NPTE9SXG4gICAgfVxuICB9LFxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIGxldCB7IGhpZ2hsaWdodENvbG9yLCBiYWNrZ3JvdW5kQ29sb3IgfSA9IHByb3BzO1xuXG4gICAgbGV0IGRhdGEgPSB7XG4gICAgICAnLmFwLXVwbG9hZCc6IHtcbiAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICBjb2xvcjogJyM4ODgnLFxuICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbidcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZDpob3Zlcic6IHtcbiAgICAgICAgY29sb3I6ICcjNTU1J1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkOmFjdGl2ZSc6IHtcbiAgICAgICAgdGV4dFNoYWRvdzogJ25vbmUnLFxuICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICBjb2xvcjogJyM3NzcnXG4gICAgICB9LFxuICAgICAgJy5hcC11cGxvYWQtbGFiZWwnOiB7XG4gICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICB6SW5kZXg6IDEsXG4gICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBgJHtiYWNrZ3JvdW5kQ29sb3J9YCxcbiAgICAgICAgYm94U2hhZG93OiAnaW5zZXQgMXB4IDFweCAycHggcmdiYSgwLDAsMCwwLjMzKScsXG4gICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCAjQ0NDJyxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAnMnB4J1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkLWlucHV0Jzoge1xuICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICB6SW5kZXg6IDJcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1pY29uJzoge1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICBmb250U2l6ZTogJzJlbSdcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1sYWJlbC1pbm5lcic6IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHZlcnRpY2FsQWxpZ246ICdtaWRkbGUnXG4gICAgICB9LFxuICAgICAgJy5hcC11cGxvYWQtYWxpZ25lcic6IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHdpZHRoOiAnMXB4JyxcbiAgICAgICAgbWFyZ2luUmlnaHQ6ICctMXB4JyxcbiAgICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICB2ZXJ0aWNhbEFsaWduOiAnbWlkZGxlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkIC5hcC1zcGlubmVyJzoge1xuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICB6SW5kZXg6IDgsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogYCR7YmFja2dyb3VuZENvbG9yfWAsXG4gICAgICAgIGNvbG9yOiAnI0RERCdcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1wcmV2aWV3LWltYWdlJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICAgIHpJbmRleDogNCxcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuICAgICAgICBib3JkZXI6ICcxcHggc29saWQgI0FBQSdcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1yZW1vdmUtYnV0dG9uJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHpJbmRleDogNSxcbiAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgcGFkZGluZzogJzhweCcsXG4gICAgICAgIGZvbnRTaXplOiAnMjRweCcsXG4gICAgICAgIGNvbG9yOiAnI0FBQScsXG4gICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwyNTUsMjU1LDAuMiknLFxuICAgICAgICBib3JkZXJSYWRpdXM6IDBcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1yZW1vdmUtYnV0dG9uOmhvdmVyJzoge1xuICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcbiAgICAgICAgY29sb3I6ICcjNTU1J1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkLXJlbW92ZS1idXR0b246YWN0aXZlJzoge1xuICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcbiAgICAgICAgY29sb3I6ICcjNTU1J1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgc21hbGxNZWRpYURhdGEgPSB7fVxuICAgIGxldCBtZWRpdW1NZWRpYURhdGEgPSB7fVxuICAgIGxldCBsYXJnZU1lZGlhRGF0YSA9IHt9XG4gICAgcmV0dXJuIChcbiAgICAgIDxBcFN0eWxlIGRhdGE9eyBPYmplY3QuYXNzaWduKGRhdGEsIHByb3BzLnN0eWxlKSB9XG4gICAgICAgICAgICAgICBzbWFsbE1lZGlhRGF0YT17IHNtYWxsTWVkaWFEYXRhIH1cbiAgICAgICAgICAgICAgIG1lZGl1bU1lZGlhRGF0YT17IG1lZGl1bU1lZGlhRGF0YSB9XG4gICAgICAgICAgICAgICBsYXJnZU1lZGlhRGF0YT17IGxhcmdlTWVkaWFEYXRhIH1cbiAgICAgID57IHByb3BzLmNoaWxkcmVuIH08L0FwU3R5bGU+XG4gICAgKVxuICB9XG59KVxuXG5leHBvcnQgZGVmYXVsdCBBcFVwbG9hZFN0eWxlXG4iLCIvKipcbiAqIEJpZyBidXR0b24gY29tcG9uZW50LlxuICogQGNsYXNzIEFwQmlnQnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwQmlnQnV0dG9uICovXG5jb25zdCBBcEJpZ0J1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIGRpc2FibGVkOiB0eXBlcy5ib29sLFxuICAgIG9uVGFwOiB0eXBlcy5mdW5jLFxuICAgIHRleHQ6IHR5cGVzLnN0cmluZyxcbiAgICBzaXplOiB0eXBlcy5udW1iZXJcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsLFxuICAgICAgc2l6ZTogOTRcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgbGV0IHsgc2l6ZSB9ID0gcHJvcHNcbiAgICBsZXQgc3R5bGUgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHdpZHRoOiBzaXplLCBoZWlnaHQ6IHNpemVcbiAgICB9LCBwcm9wcy5zdHlsZSlcbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIHsgLi4ucHJvcHMgfVxuICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1iaWctYnV0dG9uJywgcHJvcHMuY2xhc3NOYW1lKSB9XG4gICAgICAgIHdpZGU9eyBmYWxzZSB9XG4gICAgICAgIHN0eWxlPXsgc3R5bGUgfVxuICAgICAgPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLWJpZy1idXR0b24tdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHByb3BzLnRleHQgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L0FwQnV0dG9uPlxuICAgIClcbiAgfVxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBCaWdCdXR0b25cbiIsIi8qKlxuICogQnV0dG9uIGNvbXBvbmVudC5cbiAqIEBjbGFzcyBBcEJ1dHRvblxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcblxuaW1wb3J0IHtBcFRvdWNoTWl4aW4sIEFwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwQnV0dG9uICovXG5sZXQgQXBCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICAvKiogRGlzYWJsZSBidXR0b24gdGFwICovXG4gICAgZGlzYWJsZWQ6IHR5cGVzLmJvb2wsXG4gICAgLyoqIFJlbmRlciB3aXRoIHByaW1hcnkgc3R5bGUgKi9cbiAgICBwcmltYXJ5OiB0eXBlcy5ib29sLFxuICAgIC8qKiBSZW5kZXIgd2l0aCBkYW5nZXIgc3R5bGUgKi9cbiAgICBkYW5nZXI6IHR5cGVzLmJvb2wsXG4gICAgLyoqIFJlbmRlciB3aXRoIHdpZGUgc3R5bGUgKi9cbiAgICB3aWRlOiB0eXBlcy5ib29sLFxuICAgIC8qKiBBbmNob3IgaHJlZiAqL1xuICAgIGhyZWY6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogRG9jdW1lbnQgaWQgKi9cbiAgICBpZDogdHlwZXMuc3RyaW5nLFxuICAgIC8qKiBIaWRlIGJ1dHRvbiAqL1xuICAgIGhpZGRlbjogdHlwZXMuYm9vbCxcbiAgICAvKiogUmVuZGVyIHdpdGggc2ltcGxlIHN0eWxlICovXG4gICAgc2ltcGxlOiB0eXBlcy5ib29sLFxuICAgIC8qKiBEYXRhIGZvciB0b3VjaCBldmVudHMgKi9cbiAgICBkYXRhOiB0eXBlcy5hbnlcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFRvdWNoTWl4aW4sXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC8qKiBGb3IgYml0IHRhcHBpbmcgKi9cbiAgICAgIGRpc2FibGVkOiBmYWxzZSxcbiAgICAgIC8qKiBSZW5kZXIgd2l0aCBwcmltYXJ5IHN0eWxlICovXG4gICAgICBwcmltYXJ5OiBmYWxzZSxcbiAgICAgIC8qKiBSZW5kZXIgd2l0aCBkYW5nZXIgc3R5bGUgKi9cbiAgICAgIGRhbmdlcjogZmFsc2UsXG4gICAgICB3aWRlOiBmYWxzZSxcbiAgICAgIGhyZWY6IG51bGwsXG4gICAgICAvKiogRG9jdW1lbnQgaWQgKi9cbiAgICAgIGlkOiBudWxsLFxuICAgICAgLyoqIERpc3BsYXkgaGlkZGVuICovXG4gICAgICBoaWRkZW46IGZhbHNlLFxuICAgICAgLyoqIFNpbXBsZSBzdHlsZSAqL1xuICAgICAgc2ltcGxlOiBmYWxzZSxcbiAgICAgIC8qKiBEYXRhIGZvciBldmVudCAqL1xuICAgICAgZGF0YTogbnVsbFxuICAgIH1cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIGxldCBjbGFzc05hbWUgPSBjbGFzc25hbWVzKCdhcC1idXR0b24nLCBwcm9wcy5jbGFzc05hbWUsIHtcbiAgICAgICdhcC1idXR0b24tcHJpbWFyeSc6IHByb3BzLnByaW1hcnksXG4gICAgICAnYXAtYnV0dG9uLWRhbmdlcic6IHByb3BzLmRhbmdlcixcbiAgICAgICdhcC1idXR0b24td2lkZSc6IHByb3BzLndpZGUsXG4gICAgICAnYXAtYnV0dG9uLWRpc2FibGVkJzogcHJvcHMuZGlzYWJsZWQsXG4gICAgICAnYXAtYnV0dG9uLXNpbXBsZSc6IHByb3BzLnNpbXBsZSxcbiAgICAgICdhcC1idXR0b24taGlkZGVuJzogcHJvcHMuaGlkZGVuXG4gICAgfSlcbiAgICByZXR1cm4gKFxuICAgICAgPGEgY2xhc3NOYW1lPXsgY2xhc3NOYW1lIH1cbiAgICAgICAgIGhyZWY9eyBwcm9wcy5ocmVmIH1cbiAgICAgICAgIGlkPXsgcHJvcHMuaWQgfVxuICAgICAgICAgc3R5bGU9eyBPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSkgfVxuICAgICAgPnsgcHJvcHMuY2hpbGRyZW4gfVxuICAgICAgPC9hPlxuICAgIClcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBGb3IgQXBUb3VjaE1peGluXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGdldFRvdWNoRGF0YSAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiBwcm9wcy5kYXRhXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwQnV0dG9uXG4iLCIvKipcbiAqIEJ1dHRvbiBncm91cCBjb21wb25lbnQuXG4gKiBAY2xhc3MgQXBCdXR0b25Hcm91cFxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcblxuaW1wb3J0IHtBcFB1cmVNaXhpbn0gZnJvbSAnYXBlbWFuLXJlYWN0LW1peGlucydcblxuLyoqIEBsZW5kcyBBcEJ1dHRvbkdyb3VwICovXG5jb25zdCBBcEJ1dHRvbkdyb3VwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7fSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge31cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLWJ1dHRvbi1ncm91cCcsIHByb3BzLmNsYXNzTmFtZSkgfT5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwQnV0dG9uR3JvdXBcbiIsIi8qKlxuICogU3R5bGUgZm9yIEFwQnV0dG9uLlxuICogQGNsYXNzIEFwQnV0dG9uU3R5bGVcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJ1xuXG4vKiogQGxlbmRzIEFwQnV0dG9uU3R5bGUgKi9cbmNvbnN0IEFwQnV0dG9uU3R5bGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIHNjb3BlOiB0eXBlcy5ib29sLFxuICAgIHN0eWxlOiB0eXBlcy5vYmplY3QsXG4gICAgaGlnaGxpZ2h0Q29sb3I6IHR5cGVzLnN0cmluZyxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IHR5cGVzLnN0cmluZyxcbiAgICBkYW5nZXJDb2xvcjogdHlwZXMuc3RyaW5nLFxuICAgIGRpc2FibGVkQ29sb3I6IHR5cGVzLnN0cmluZ1xuICB9LFxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY29wZTogZmFsc2UsXG4gICAgICBzdHlsZToge30sXG4gICAgICBoaWdobGlnaHRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0hJR0hMSUdIVF9DT0xPUixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0JBQ0tHUk9VTkRfQ09MT1IsXG4gICAgICBkYW5nZXJDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0RBTkdFUl9DT0xPUixcbiAgICAgIGRpc2FibGVkQ29sb3I6ICcjQUFBJ1xuICAgIH1cbiAgfSxcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7cHJvcHN9ID0gc1xuXG4gICAgbGV0IHtcbiAgICAgIGhpZ2hsaWdodENvbG9yLFxuICAgICAgYmFja2dyb3VuZENvbG9yLFxuICAgICAgZGFuZ2VyQ29sb3IsXG4gICAgICBkaXNhYmxlZENvbG9yXG4gICAgfSA9IHByb3BzXG5cbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgICcuYXAtYnV0dG9uJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICAgIHBhZGRpbmc6ICcwLjVlbSAxZW0nLFxuICAgICAgICBib3JkZXJSYWRpdXM6ICcycHgnLFxuICAgICAgICBtYXJnaW46ICc0cHgnLFxuICAgICAgICBjb2xvcjogYCR7aGlnaGxpZ2h0Q29sb3J9YCxcbiAgICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7aGlnaGxpZ2h0Q29sb3J9YCxcbiAgICAgICAgYmFja2dyb3VuZDogYCR7YmFja2dyb3VuZENvbG9yfWAsXG4gICAgICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgTW96VXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICBNc1VzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgVXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJ1xuICAgICAgfSxcbiAgICAgICcuYXAtYmlnLWJ1dHRvbic6IHtcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJyxcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgYm9yZGVyV2lkdGg6ICc0cHgnLFxuICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICBib3hTaGFkb3c6ICcycHggMnB4IDRweCByZ2JhKDAsMCwwLDAuMiknLFxuICAgICAgICB3aGl0ZVNwYWNlOiAnbm9ybWFsJ1xuICAgICAgfSxcbiAgICAgICcuYXAtYmlnLWJ1dHRvbjphY3RpdmUnOiB7XG4gICAgICAgIGJveFNoYWRvdzogJ25vbmUnXG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b24gPiAqJzoge1xuICAgICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZSdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbjpob3Zlcic6IHtcbiAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uOmFjdGl2ZSc6IHtcbiAgICAgICAgYm94U2hhZG93OiAnMXB4IDFweCAycHggcmdiYSgwLDAsMCwwLjEpIGluc2V0JyxcbiAgICAgICAgb3BhY2l0eTogMC44XG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b24uYXAtYnV0dG9uLWRpc2FibGVkLC5hcC1idXR0b24uYXAtYnV0dG9uLWRpc2FibGVkOmhvdmVyLC5hcC1idXR0b24uYXAtYnV0dG9uLWRpc2FibGVkOmFjdGl2ZSc6IHtcbiAgICAgICAgY3Vyc29yOiAnZGVmYXVsdCcsXG4gICAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxuICAgICAgICBjb2xvcjogYCR7ZGlzYWJsZWRDb2xvcn1gLFxuICAgICAgICBib3JkZXJDb2xvcjogYCR7ZGlzYWJsZWRDb2xvcn1gLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjRjBGMEYwJ1xuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLXByaW1hcnknOiB7XG4gICAgICAgIGNvbG9yOiAnd2hpdGUnLFxuICAgICAgICBiYWNrZ3JvdW5kOiBgJHtoaWdobGlnaHRDb2xvcn1gXG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b24tZGFuZ2VyJzoge1xuICAgICAgICBjb2xvcjogJ3doaXRlJyxcbiAgICAgICAgYmFja2dyb3VuZDogYCR7ZGFuZ2VyQ29sb3J9YFxuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLXdpZGUnOiB7XG4gICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICBtYXhXaWR0aDogJzI0MHB4JyxcbiAgICAgICAgbWFyZ2luTGVmdDogMCxcbiAgICAgICAgbWFyZ2luUmlnaHQ6IDBcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uJzoge1xuICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdpbmhlcml0JyxcbiAgICAgICAgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsXG4gICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbi1zaW1wbGUnOiB7XG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbi1zaW1wbGU6YWN0aXZlJzoge1xuICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcbiAgICAgICAgb3BhY2l0eTogJzAuOCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uLXNpbXBsZSAuYXAtaWNvbi1idXR0b24taWNvbic6IHtcbiAgICAgICAgZm9udFNpemU6ICdpbmhlcml0J1xuICAgICAgfSxcbiAgICAgICcuYXAtaWNvbi1idXR0b24taWNvbic6IHtcbiAgICAgICAgbWFyZ2luOiAnMnB4IDAnLFxuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICBmb250U2l6ZTogJzJlbSdcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uLXRleHQnOiB7XG4gICAgICAgIGRpc3BsYXk6ICdibG9jaycsXG4gICAgICAgIGZvbnRTaXplOiAnMC42NmVtJyxcbiAgICAgICAgcGFkZGluZzogJzJweCAwJ1xuICAgICAgfSxcbiAgICAgICcuYXAtaWNvbi1idXR0b24tcm93Jzoge1xuICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgIG1heFdpZHRoOiBBcFN0eWxlLkNPTlRFTlRfV0lEVEgsXG4gICAgICAgIG1hcmdpbjogJzAgYXV0bydcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uLXJvdyAuYXAtYnV0dG9uJzoge1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICB3aWR0aDogJzEwMCUnXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbic6IHtcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgbGluZUhlaWdodDogJzFlbScsXG4gICAgICAgIGZvbnRTaXplOiAnMTRweCcsXG4gICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAwLFxuICAgICAgICBib3hTaXppbmc6ICdib3JkZXItYm94J1xuICAgICAgfSxcbiAgICAgICcuYXAtY2VsbC1idXR0b24tYWxpZ25lcic6IHtcbiAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHdpZHRoOiAnMXB4JyxcbiAgICAgICAgbWFyZ2luUmlnaHQ6ICctMXB4JyxcbiAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICAgIHBhZGRpbmc6ICc4cHggMCcsXG4gICAgICAgIHZlcnRpY2FsQWxpZ246ICdtaWRkbGUnXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbi10ZXh0Jzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgdmVydGljYWxBbGlnbjogJ21pZGRsZSdcbiAgICAgIH0sXG4gICAgICAnLmFwLWNlbGwtYnV0dG9uLXJvdyc6IHtcbiAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICBtYXhXaWR0aDogQXBTdHlsZS5DT05URU5UX1dJRFRILFxuICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICBtYXJnaW46ICc4cHggYXV0bydcbiAgICAgIH0sXG4gICAgICAnLmFwLWNlbGwtYnV0dG9uLXJvdyAuYXAtY2VsbC1idXR0b24nOiB7XG4gICAgICAgIGJvcmRlclJpZ2h0Q29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgIGJvcmRlckJvdHRvbUNvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICB3aWR0aDogJzEwMCUnXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbi1yb3cgLmFwLWNlbGwtYnV0dG9uOmZpcnN0LWNoaWxkJzoge1xuICAgICAgICBib3JkZXJMZWZ0Q29sb3I6ICd0cmFuc3BhcmVudCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWNlbGwtYnV0dG9uLXJvdyAuYXAtYnV0dG9uJzoge1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICB3aWR0aDogJzEwMCUnXG4gICAgICB9LFxuICAgICAgJy5hcC1uZXh0LWJ1dHRvbiwuYXAtcHJldi1idXR0b24nOiB7XG4gICAgICAgIHBhZGRpbmc6ICcwLjI1ZW0gMWVtJ1xuICAgICAgfSxcbiAgICAgICcuYXAtbmV4dC1idXR0b24taWNvbic6IHtcbiAgICAgICAgbWFyZ2luTGVmdDogJzRweCcsXG4gICAgICAgIG1hcmdpblJpZ2h0OiAwXG4gICAgICB9LFxuICAgICAgJy5hcC1wcmV2LWJ1dHRvbi1pY29uJzoge1xuICAgICAgICBtYXJnaW5MZWZ0OiAwLFxuICAgICAgICBtYXJnaW5SaWdodDogJzRweCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbi1oaWRkZW4nOiB7XG4gICAgICAgIGRpc3BsYXk6ICdub25lICFpbXBvcnRhbnQnXG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b24tc2ltcGxlJzoge1xuICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50J1xuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLXNpbXBsZTphY3RpdmUnOiB7XG4gICAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxuICAgICAgICBvcGFjaXR5OiAnMC44J1xuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLWdyb3VwJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInXG4gICAgICB9XG4gICAgfVxuICAgIGxldCBzbWFsbE1lZGlhRGF0YSA9IHt9XG4gICAgbGV0IG1lZGl1bU1lZGlhRGF0YSA9IHt9XG4gICAgbGV0IGxhcmdlTWVkaWFEYXRhID0ge31cbiAgICByZXR1cm4gKFxuICAgICAgPEFwU3R5bGUgc2NvcGVkPXsgcHJvcHMuc2NvcGVkIH1cbiAgICAgICAgICAgICAgIGRhdGE9eyBPYmplY3QuYXNzaWduKGRhdGEsIHByb3BzLnN0eWxlKSB9XG4gICAgICAgICAgICAgICBzbWFsbE1lZGlhRGF0YT17IHNtYWxsTWVkaWFEYXRhIH1cbiAgICAgICAgICAgICAgIG1lZGl1bU1lZGlhRGF0YT17IG1lZGl1bU1lZGlhRGF0YSB9XG4gICAgICAgICAgICAgICBsYXJnZU1lZGlhRGF0YT17IGxhcmdlTWVkaWFEYXRhIH1cbiAgICAgID57IHByb3BzLmNoaWxkcmVuIH08L0FwU3R5bGU+XG4gICAgKVxuICB9XG59KVxuXG5leHBvcnQgZGVmYXVsdCBBcEJ1dHRvblN0eWxlXG4iLCIvKipcbiAqIENlbGwgYnV0dG9uIGNvbXBvbmVudC5cbiAqIEBjbGFzcyBBcENlbGxCdXR0b25cbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgQXBCdXR0b24gZnJvbSAnLi9hcF9idXR0b24nXG5cbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBDZWxsQnV0dG9uICovXG5jb25zdCBBcENlbGxCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICBkaXNhYmxlZDogdHlwZXMuYm9vbCxcbiAgICBvblRhcDogdHlwZXMuZnVuYyxcbiAgICB0ZXh0OiB0eXBlcy5zdHJpbmdcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQge3Byb3BzfSA9IHNcbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIHsgLi4ucHJvcHMgfVxuICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1jZWxsLWJ1dHRvbicsIHByb3BzLmNsYXNzTmFtZSkgfVxuICAgICAgICB3aWRlPXsgZmFsc2UgfVxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC1jZWxsLWJ1dHRvbi1hbGlnbmVyXCI+Jm5ic3A7PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC1jZWxsLWJ1dHRvbi10ZXh0XCI+eyBwcm9wcy50ZXh0IH08L3NwYW4+XG4gICAgICA8L0FwQnV0dG9uPlxuICAgIClcbiAgfVxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBBcENlbGxCdXR0b25cbiIsIi8qKlxuICogUm93IGZvciBDZWxsIGJ1dHRvbnMuXG4gKiBAY2xhc3MgQXBDZWxsQnV0dG9uUm93XG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuXG4vKiogQGxlbmRzIEFwQ2VsbEJ1dHRvblJvdyAqL1xuY29uc3QgQXBDZWxsQnV0dG9uUm93ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7fSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtY2VsbC1idXR0b24tcm93JywgcHJvcHMuY2xhc3NOYW1lKSB9PlxuICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBBcENlbGxCdXR0b25Sb3dcbiIsIi8qKlxuICogSWNvbiBidXR0b24gY29tcG9uZW50LlxuICogQGNsYXNzIEFwSWNvbkJ1dHRvblxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcbmltcG9ydCB7QXBJY29ufSBmcm9tICdhcGVtYW4tcmVhY3QtaWNvbidcbmltcG9ydCBBcEJ1dHRvbiBmcm9tICcuL2FwX2J1dHRvbidcblxuaW1wb3J0IHtBcFB1cmVNaXhpbn0gZnJvbSAnYXBlbWFuLXJlYWN0LW1peGlucydcblxuLyoqIEBsZW5kcyBBcEljb25CdXR0b24gKi9cbmNvbnN0IEFwSWNvbkJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIGljb246IHR5cGVzLnN0cmluZyxcbiAgICB0ZXh0OiB0eXBlcy5zdHJpbmcsXG4gICAgc2ltcGxlOiB0eXBlcy5ib29sXG4gIH0sXG5cbiAgc3RhdGljczoge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIGljb24gYnV0dG9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGV4dFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpY29uIC0gSWNvbiBjbGFzc1xuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uVGFwIC0gVGFwIGNhbGxiYWNrXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gT3RoZXIgcHJvcHMuXG4gICAgICogQHJldHVybnMge09iamVjdH0gLSBSZWFjdCBlbGVtZW50LlxuICAgICAqL1xuICAgIGNyZWF0ZUJ1dHRvbiAodGV4dCwgaWNvbiwgb25UYXAsIHByb3BzKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8QXBJY29uQnV0dG9uIHRleHQ9eyB0ZXh0IH1cbiAgICAgICAgICAgICAgICAgICAgICBpY29uPXsgaWNvbiB9XG4gICAgICAgICAgICAgICAgICAgICAgb25UYXA9eyBvblRhcCB9XG4gICAgICAgICAgeyAuLi5wcm9wcyB9XG4gICAgICAgIC8+XG4gICAgICApXG4gICAgfVxuICB9LFxuXG4gIG1peGluczogW1xuICAgIEFwUHVyZU1peGluXG4gIF0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlICgpIHtcbiAgICByZXR1cm4ge31cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBpY29uOiBudWxsLFxuICAgICAgdGV4dDogbnVsbFxuICAgIH1cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIHsgLi4ucHJvcHMgfVxuICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1pY29uLWJ1dHRvbicsIHtcbiAgICAgICAgICAgICAgICAnYXAtaWNvbi1idXR0b24tc2ltcGxlJzogISFwcm9wcy5zaW1wbGVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9wcy5jbGFzc05hbWUpIH1cbiAgICAgICAgd2lkZT17IGZhbHNlIH1cbiAgICAgID5cbiAgICAgICAgPEFwSWNvbiBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1pY29uLWJ1dHRvbi1pY29uJywgcHJvcHMuaWNvbiwge1xuICAgICAgICAgICAgICAgIH0pIH0vPlxuICAgICAgICB7cHJvcHMudGV4dCA/IDxzcGFuIGNsYXNzTmFtZT1cImFwLWljb24tYnV0dG9uLXRleHRcIj57IHByb3BzLnRleHQgfTwvc3Bhbj4gOiBudWxsfVxuICAgICAgPC9BcEJ1dHRvbj5cbiAgICApXG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBJY29uQnV0dG9uXG4iLCIvKipcbiAqIFJvdyBmb3IgSWNvbiBidXR0b25zLlxuICogQGNsYXNzIEFwSWNvbkJ1dHRvblJvd1xuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuXG4vKiogQGxlbmRzIEFwSWNvbkJ1dHRvblJvdyAqL1xuY29uc3QgQXBJY29uQnV0dG9uUm93ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7fSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtaWNvbi1idXR0b24tcm93JywgcHJvcHMuY2xhc3NOYW1lKSB9PlxuICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBBcEljb25CdXR0b25Sb3c7XG5cblxuIiwiLyoqXG4gKiBOZXh0IGJ1dHRvbiBjb21wb25lbnQuXG4gKiBAY2xhc3MgQXBOZXh0QnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuaW1wb3J0IHtBcEljb259IGZyb20gJ2FwZW1hbi1yZWFjdC1pY29uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwTmV4dEJ1dHRvbiAqL1xuY29uc3QgQXBOZXh0QnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZGlzYWJsZWQ6IHR5cGVzLmJvb2wsXG4gICAgb25UYXA6IHR5cGVzLmZ1bmMsXG4gICAgdGV4dDogdHlwZXMuc3RyaW5nLFxuICAgIHNpemU6IHR5cGVzLm51bWJlcixcbiAgICBpY29uOiB0eXBlcy5zdHJpbmdcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsLFxuICAgICAgaWNvbjogJ2ZhIGZhLWNhcmV0LXJpZ2h0J1xuICAgIH1cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIHsgLi4ucHJvcHMgfVxuICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1uZXh0LWJ1dHRvbicsIHByb3BzLmNsYXNzTmFtZSkgfVxuICAgICAgICB3aWRlPXsgZmFsc2UgfVxuICAgICAgICBzdHlsZT17T2JqZWN0LmFzc2lnbih7fSwgcHJvcHMuc3R5bGUpfVxuICAgICAgPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLW5leHQtYnV0dG9uLXRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBwcm9wcy50ZXh0IH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIHsgcHJvcHMuY2hpbGRyZW4gfVxuICAgICAgICA8QXBJY29uIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLW5leHQtYnV0dG9uLWljb24nLCBwcm9wcy5pY29uKSB9Lz5cbiAgICAgIDwvQXBCdXR0b24+XG4gICAgKVxuICB9XG5cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwTmV4dEJ1dHRvblxuIiwiLyoqXG4gKiBQcmV2IGJ1dHRvbiBjb21wb25lbnQuXG4gKiBAY2xhc3MgQXBQcmV2QnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuaW1wb3J0IHtBcEljb259IGZyb20gJ2FwZW1hbi1yZWFjdC1pY29uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwUHJldkJ1dHRvbiAqL1xuY29uc3QgQXBQcmV2QnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZGlzYWJsZWQ6IHR5cGVzLmJvb2wsXG4gICAgb25UYXA6IHR5cGVzLmZ1bmMsXG4gICAgdGV4dDogdHlwZXMuc3RyaW5nLFxuICAgIHNpemU6IHR5cGVzLm51bWJlcixcbiAgICBpY29uOiB0eXBlcy5zdHJpbmdcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsLFxuICAgICAgaWNvbjogJ2ZhIGZhLWNhcmV0LWxlZnQnXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiAoXG4gICAgICA8QXBCdXR0b24geyAuLi5wcm9wcyB9XG4gICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLXByZXYtYnV0dG9uJywgcHJvcHMuY2xhc3NOYW1lKSB9XG4gICAgICAgIHdpZGU9eyBmYWxzZSB9XG4gICAgICAgIHN0eWxlPXtPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSl9XG4gICAgICA+XG4gICAgICAgIDxBcEljb24gY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtcHJldi1idXR0b24taWNvbicsIHByb3BzLmljb24pIH0vPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXByZXYtYnV0dG9uLXRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgeyBwcm9wcy50ZXh0IH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIHsgcHJvcHMuY2hpbGRyZW4gfVxuICAgICAgPC9BcEJ1dHRvbj5cbiAgICApXG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBQcmV2QnV0dG9uXG4iLCIvKipcbiAqIGFwZW1hbiByZWFjdCBwYWNrYWdlIGZvciBidXR0b24gY29tcG9uZW50LlxuICogQG1vZHVsZSBhcGVtYW4tcmVhY3QtYnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmxldCBkID0gKG1vZHVsZSkgPT4gbW9kdWxlLmRlZmF1bHQgfHwgbW9kdWxlXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXQgQXBCaWdCdXR0b24gKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX2JpZ19idXR0b24nKSkgfSxcbiAgZ2V0IEFwQnV0dG9uR3JvdXAgKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX2J1dHRvbl9ncm91cCcpKSB9LFxuICBnZXQgQXBCdXR0b25TdHlsZSAoKSB7IHJldHVybiBkKHJlcXVpcmUoJy4vYXBfYnV0dG9uX3N0eWxlJykpIH0sXG4gIGdldCBBcEJ1dHRvbiAoKSB7IHJldHVybiBkKHJlcXVpcmUoJy4vYXBfYnV0dG9uJykpIH0sXG4gIGdldCBBcENlbGxCdXR0b25Sb3cgKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX2NlbGxfYnV0dG9uX3JvdycpKSB9LFxuICBnZXQgQXBDZWxsQnV0dG9uICgpIHsgcmV0dXJuIGQocmVxdWlyZSgnLi9hcF9jZWxsX2J1dHRvbicpKSB9LFxuICBnZXQgQXBJY29uQnV0dG9uUm93ICgpIHsgcmV0dXJuIGQocmVxdWlyZSgnLi9hcF9pY29uX2J1dHRvbl9yb3cnKSkgfSxcbiAgZ2V0IEFwSWNvbkJ1dHRvbiAoKSB7IHJldHVybiBkKHJlcXVpcmUoJy4vYXBfaWNvbl9idXR0b24nKSkgfSxcbiAgZ2V0IEFwTmV4dEJ1dHRvbiAoKSB7IHJldHVybiBkKHJlcXVpcmUoJy4vYXBfbmV4dF9idXR0b24nKSkgfSxcbiAgZ2V0IEFwUHJldkJ1dHRvbiAoKSB7IHJldHVybiBkKHJlcXVpcmUoJy4vYXBfcHJldl9idXR0b24nKSkgfVxufVxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3IgaW1hZ2UgY29tcG9uZW50LlxuICogQGNsYXNzIEFwSW1hZ2VcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IG51bWNhbCBmcm9tICdudW1jYWwnXG5pbXBvcnQgc2NhbGVkU2l6ZSBmcm9tICcuL3NpemluZy9zY2FsZWRfc2l6ZSdcbmltcG9ydCB7QXBTcGlubmVyfSBmcm9tICdhcGVtYW4tcmVhY3Qtc3Bpbm5lcidcbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBJbWFnZSAqL1xuY29uc3QgQXBJbWFnZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIC8qKiBJbWFnZSBzY2FsaW5nIHBvbGljeSAqL1xuICAgIHNjYWxlOiB0eXBlcy5vbmVPZihbXG4gICAgICAnZml0JyxcbiAgICAgICdmaWxsJyxcbiAgICAgICdub25lJ1xuICAgIF0pLFxuICAgIC8qKiBJbWFnZSB3aWR0aCAqL1xuICAgIHdpZHRoOiB0eXBlcy5vbmVPZlR5cGUoWyB0eXBlcy5udW1iZXIsIHR5cGVzLnN0cmluZyBdKSxcbiAgICAvKiogSW1hZ2UgaGVpZ2h0ICovXG4gICAgaGVpZ2h0OiB0eXBlcy5vbmVPZlR5cGUoWyB0eXBlcy5udW1iZXIsIHR5cGVzLnN0cmluZyBdKSxcbiAgICAvKiogSW1hZ2Ugc3JjIHN0cmluZyAqL1xuICAgIHNyYzogdHlwZXMuc3RyaW5nLFxuICAgIC8qKiBBbHQgdGVzdCAqL1xuICAgIGFsdDogdHlwZXMuc3RyaW5nLFxuICAgIC8qKiBUaGVtIG9mIHNwaW5uZXIgKi9cbiAgICBzcGlubmVyVGhlbWU6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogSGFuZGxlciBvbiBpbWFnZSBsb2FkICovXG4gICAgb25Mb2FkOiB0eXBlcy5mdW5jLFxuICAgIC8qKiBIYW5kbGVyIG9uIGltYWdlIGVycm9yLiAqL1xuICAgIG9uRXJyb3I6IHR5cGVzLmZ1bmNcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIHN0YXRpY3M6IHtcbiAgICBzY2FsZWRTaXplLFxuICAgIHplcm9JZk5hTiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc05hTih2YWx1ZSkgPyAwIDogdmFsdWVcbiAgICB9LFxuICAgIG51bGxJZk5hTiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc05hTih2YWx1ZSkgPyBudWxsIDogdmFsdWVcbiAgICB9XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIHJldHVybiB7XG4gICAgICBpbWdXaWR0aDogbnVsbCxcbiAgICAgIGltZ0hlaWdodDogbnVsbCxcbiAgICAgIG1vdW50ZWQ6IGZhbHNlLFxuICAgICAgcmVhZHk6IGZhbHNlLFxuICAgICAgbG9hZGluZzogISFzLnByb3BzLnNyYyxcbiAgICAgIGVycm9yOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjYWxlOiAnbm9uZScsXG4gICAgICB3aWR0aDogbnVsbCxcbiAgICAgIGhlaWdodDogbnVsbCxcbiAgICAgIHNyYzogbnVsbCxcbiAgICAgIGFsdDogJ05PIElNQUdFJyxcbiAgICAgIHNwaW5uZXJUaGVtZTogQXBTcGlubmVyLkRFRkFVTFRfVEhFTUUsXG4gICAgICBvbkxvYWQ6IG51bGwsXG4gICAgICBvbkVycm9yOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBzdGF0ZSwgcHJvcHMgfSA9IHNcblxuICAgIGxldCBzaXplID0ge1xuICAgICAgd2lkdGg6IHByb3BzLndpZHRoIHx8IG51bGwsXG4gICAgICBoZWlnaHQ6IHByb3BzLmhlaWdodCB8fCBudWxsXG4gICAgfVxuXG4gICAgbGV0IHsgbW91bnRlZCwgZXJyb3IsIHJlYWR5LCBsb2FkaW5nIH0gPSBzdGF0ZVxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLWltYWdlJywgcHJvcHMuY2xhc3NOYW1lLCB7XG4gICAgICAgICAgICAgICAgJ2FwLWltYWdlLWxvYWRpbmcnOiBwcm9wcy5zcmMgJiYgbG9hZGluZyxcbiAgICAgICAgICAgICAgICAnYXAtaW1hZ2UtcmVhZHknOiBwcm9wcy5zcmMgJiYgcmVhZHlcbiAgICAgICAgICAgIH0pIH1cbiAgICAgICAgICAgc3R5bGU9eyBPYmplY3QuYXNzaWduKHt9LCBzaXplLCBwcm9wcy5zdHlsZSkgfT5cbiAgICAgICAgeyBtb3VudGVkICYmIGVycm9yID8gcy5fcmVuZGVyTm90Zm91bmQoc2l6ZSkgOiBudWxsfVxuICAgICAgICB7IG1vdW50ZWQgJiYgIWVycm9yID8gcy5fcmVuZGVySW1nKHNpemUsIG1vdW50ZWQpIDogbnVsbCB9XG4gICAgICAgIHsgbG9hZGluZyA/IHMuX3JlbmRlclNwaW5uZXIoc2l6ZSkgOiBudWxsIH1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBMaWZlY3ljbGVcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBjb21wb25lbnRXaWxsTW91bnQgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgcy5zZXRTdGF0ZSh7XG4gICAgICBtb3VudGVkOiB0cnVlXG4gICAgfSlcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgcy5yZXNpemVJbWFnZSgpXG4gICAgfSwgMClcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIChuZXh0UHJvcHMpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuXG4gICAgbGV0IHNyYyA9IHMucHJvcHMuc3JjXG4gICAgbGV0IG5leHRTcmMgPSBuZXh0UHJvcHMuc3JjXG4gICAgbGV0IHNyY0NoYW5nZWQgPSAhIW5leHRTcmMgJiYgKG5leHRTcmMgIT09IHNyYylcbiAgICBpZiAoc3JjQ2hhbmdlZCkge1xuICAgICAgcy5zZXRTdGF0ZSh7XG4gICAgICAgIHJlYWR5OiBmYWxzZSxcbiAgICAgICAgbG9hZGluZzogdHJ1ZSxcbiAgICAgICAgZXJyb3I6IG51bGxcbiAgICAgIH0pXG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVcGRhdGUgKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBzLnJlc2l6ZUltYWdlKClcbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGUgKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudCAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gSGVscGVyXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGhhbmRsZUxvYWQgKGUpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG5cbiAgICBpZiAocHJvcHMub25Mb2FkKSB7XG4gICAgICBwcm9wcy5vbkxvYWQoZSlcbiAgICB9XG5cbiAgICBzLnJlc2l6ZUltYWdlKGUudGFyZ2V0LndpZHRoLCBlLnRhcmdldC5oZWlnaHQpXG4gIH0sXG5cbiAgaGFuZGxlRXJyb3IgKGUpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG5cbiAgICBzLnNldFN0YXRlKHtcbiAgICAgIGVycm9yOiBlLFxuICAgICAgbG9hZGluZzogZmFsc2VcbiAgICB9KVxuXG4gICAgaWYgKHByb3BzLm9uRXJyb3IpIHtcbiAgICAgIHByb3BzLm9uRXJyb3IoZSlcbiAgICB9XG4gIH0sXG5cbiAgcmVzaXplSW1hZ2UgKGltZ0NvbnRlbnRXaWR0aCwgaW1nQ29udGVudEhlaWdodCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgc3RhdGUsIHByb3BzIH0gPSBzXG5cbiAgICBpbWdDb250ZW50V2lkdGggPSBpbWdDb250ZW50V2lkdGggfHwgc3RhdGUuaW1nQ29udGVudFdpZHRoXG4gICAgaW1nQ29udGVudEhlaWdodCA9IGltZ0NvbnRlbnRIZWlnaHQgfHwgc3RhdGUuaW1nQ29udGVudEhlaWdodFxuXG4gICAgbGV0IHZhbGlkID0gaW1nQ29udGVudFdpZHRoICYmIGltZ0NvbnRlbnRIZWlnaHRcbiAgICBpZiAoIXZhbGlkKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBsZXQgZWxtID0gUmVhY3RET00uZmluZERPTU5vZGUocylcbiAgICBsZXQgZnJhbWVTaXplID0ge1xuICAgICAgd2lkdGg6IGVsbS5vZmZzZXRXaWR0aCxcbiAgICAgIGhlaWdodDogZWxtLm9mZnNldEhlaWdodFxuICAgIH1cbiAgICBsZXQgY29udGVudFNpemUgPSB7XG4gICAgICBoZWlnaHQ6IGltZ0NvbnRlbnRIZWlnaHQsXG4gICAgICB3aWR0aDogaW1nQ29udGVudFdpZHRoXG4gICAgfVxuICAgIGxldCBzY2FsZWRTaXplID0gQXBJbWFnZS5zY2FsZWRTaXplKFxuICAgICAgY29udGVudFNpemUsIGZyYW1lU2l6ZSwgcHJvcHMuc2NhbGVcbiAgICApXG5cbiAgICBzLnNldFN0YXRlKHtcbiAgICAgIGltZ0NvbnRlbnRXaWR0aDogaW1nQ29udGVudFdpZHRoLFxuICAgICAgaW1nQ29udGVudEhlaWdodDogaW1nQ29udGVudEhlaWdodCxcbiAgICAgIGltZ1dpZHRoOiBzY2FsZWRTaXplLndpZHRoLFxuICAgICAgaW1nSGVpZ2h0OiBzY2FsZWRTaXplLmhlaWdodCxcbiAgICAgIHJlYWR5OiB0cnVlLFxuICAgICAgbG9hZGluZzogZmFsc2VcbiAgICB9KVxuICB9LFxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBQcml2YXRlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuICBfcmVuZGVySW1nIChzaXplKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBzdGF0ZSwgcHJvcHMgfSA9IHNcblxuICAgIGxldCB7IG51bGxJZk5hTiwgemVyb0lmTmFOIH0gPSBBcEltYWdlXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGltZyBzcmM9eyBwcm9wcy5zcmMgfVxuICAgICAgICAgICBhbHQ9eyBwcm9wcy5hbHQgfVxuICAgICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1pbWFnZS1jb250ZW50JykgfVxuICAgICAgICAgICBzdHlsZT17IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogemVyb0lmTmFOKChzaXplLmhlaWdodCAtIHN0YXRlLmltZ0hlaWdodCkgLyAyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IHplcm9JZk5hTigoc2l6ZS53aWR0aCAtIHN0YXRlLmltZ1dpZHRoKSAvIDIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG51bGxJZk5hTihzdGF0ZS5pbWdXaWR0aCksXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IG51bGxJZk5hTihzdGF0ZS5pbWdIZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgICB9IH1cbiAgICAgICAgICAgb25Mb2FkPXsgcy5oYW5kbGVMb2FkIH1cbiAgICAgICAgICAgb25FcnJvcj17IHMuaGFuZGxlRXJyb3IgfVxuICAgICAgLz5cbiAgICApXG4gIH0sXG5cbiAgX3JlbmRlck5vdGZvdW5kIChzaXplKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYXAtaW1hZ2Utbm90Zm91bmRcIlxuICAgICAgICAgICBzdHlsZT17IHtcbiAgICAgICAgICAgICAgICAgICAgbGluZUhlaWdodDogYCR7c2l6ZS5oZWlnaHR9cHhgLFxuICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogYCR7bnVtY2FsLm1pbihzaXplLmhlaWdodCAqIDAuNCwgMTgpfWBcbiAgICAgICAgICAgICAgICAgfSB9XG4gICAgICA+eyBwcm9wcy5hbHQgfTwvZGl2PlxuICAgIClcbiAgfSxcblxuICBfcmVuZGVyU3Bpbm5lciAoc2l6ZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIHJldHVybiAoXG4gICAgICA8QXBTcGlubmVyIGNsYXNzTmFtZT1cImFwLWltYWdlLXNwaW5uZXJcIlxuICAgICAgICAgICAgICAgICB0aGVtZT17IHByb3BzLnNwaW5uZXJUaGVtZSB9XG4gICAgICAgICAgICAgICAgIHN0eWxlPXsge1xuICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzaXplLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICB9IH0vPlxuICAgIClcbiAgfVxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBJbWFnZVxuIiwiLyoqXG4gKiBTdHlsZSBmb3IgQXBJbWFnZS5cbiAqIEBjbGFzcyBBcEltYWdlU3R5bGVcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJ1xuXG4vKiogQGxlbmRzIEFwSW1hZ2VTdHlsZSAqL1xuY29uc3QgQXBJbWFnZVN0eWxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBwcm9wVHlwZXM6IHtcbiAgICBcbiAgICBzdHlsZTogdHlwZXMub2JqZWN0LFxuICAgIGJhY2tncm91bmRDb2xvcjogdHlwZXMuc3RyaW5nXG4gIH0sXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIFxuICAgICAgc3R5bGU6IHt9LFxuICAgICAgYmFja2dyb3VuZENvbG9yOiAnI0RERCcsXG4gICAgICBzcGluQ29sb3I6ICdyZ2JhKDI1NSwyNTUsMjU1LDAuNSknXG4gICAgfVxuICB9LFxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIGxldCB7IGJhY2tncm91bmRDb2xvciwgc3BpbkNvbG9yIH0gPSBwcm9wc1xuXG4gICAgbGV0IHRyYW5zaXRpb25EdXJhdGlvbiA9IDEwMFxuXG4gICAgbGV0IGRhdGEgPSB7XG4gICAgICAnLmFwLWltYWdlJzoge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGAke2JhY2tncm91bmRDb2xvcn1gLFxuICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtaW1hZ2UgaW1nJzoge1xuICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICB0cmFuc2l0aW9uOiBgd2lkdGggJHt0cmFuc2l0aW9uRHVyYXRpb259bXMsIG9wYWNpdHkgJHt0cmFuc2l0aW9uRHVyYXRpb259bXNgXG4gICAgICB9LFxuICAgICAgJy5hcC1pbWFnZS1yZWFkeSBpbWcnOiB7XG4gICAgICAgIG9wYWNpdHk6IDFcbiAgICAgIH0sXG4gICAgICAnLmFwLWltYWdlLWNvbnRlbnQnOiB7XG4gICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ1xuICAgICAgfSxcbiAgICAgICcuYXAtaW1hZ2Utc3Bpbm5lcic6IHtcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgekluZGV4OiA4LFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDAsMCwwLDAuMSknLFxuICAgICAgICBjb2xvcjogYCR7c3BpbkNvbG9yfWBcbiAgICAgIH0sXG4gICAgICAnLmFwLWltYWdlLW5vdGZvdW5kJzoge1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgICAgICBjb2xvcjogJ3JnYmEoMCwwLDAsMC4xKScsXG4gICAgICAgIGZvbnRGYW1pbHk6ICdtb25vc3BhY2UnXG4gICAgICB9XG4gICAgfVxuICAgIGxldCBzbWFsbE1lZGlhRGF0YSA9IHt9XG4gICAgbGV0IG1lZGl1bU1lZGlhRGF0YSA9IHt9XG4gICAgbGV0IGxhcmdlTWVkaWFEYXRhID0ge31cbiAgICByZXR1cm4gKFxuICAgICAgPEFwU3R5bGUgXG4gICAgICAgICAgICAgICBkYXRhPXsgT2JqZWN0LmFzc2lnbihkYXRhLCBwcm9wcy5zdHlsZSkgfVxuICAgICAgICAgICAgICAgc21hbGxNZWRpYURhdGE9eyBzbWFsbE1lZGlhRGF0YSB9XG4gICAgICAgICAgICAgICBtZWRpdW1NZWRpYURhdGE9eyBtZWRpdW1NZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbGFyZ2VNZWRpYURhdGE9eyBsYXJnZU1lZGlhRGF0YSB9XG4gICAgICA+eyBwcm9wcy5jaGlsZHJlbiB9PC9BcFN0eWxlPlxuICAgIClcbiAgfVxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBJbWFnZVN0eWxlXG4iLCIvKipcbiAqIGFwZW1hbiByZWFjdCBwYWNrYWdlIGZvciBpbWFnZSBjb21wb25lbnQuXG4gKiBAbW9kdWxlIGFwZW1hbi1yZWFjdC1pbWFnZVxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5sZXQgZCA9IChtb2R1bGUpID0+IG1vZHVsZS5kZWZhdWx0IHx8IG1vZHVsZVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0IEFwSW1hZ2VTdHlsZSAoKSB7IHJldHVybiBkKHJlcXVpcmUoJy4vYXBfaW1hZ2Vfc3R5bGUnKSkgfSxcbiAgZ2V0IEFwSW1hZ2UgKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX2ltYWdlJykpIH1cbn1cbiIsIi8qKlxuICogQGZ1bmN0aW9uIF9zY2FsZWRTaXplXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IG51bWNhbCA9IHJlcXVpcmUoJ251bWNhbCcpXG5cbmZ1bmN0aW9uIHNjYWxlZFNpemUgKGNvbnRlbnRTaXplLCBmcmFtZVNpemUsIHBvbGljeSkge1xuICBsZXQgY3cgPSBjb250ZW50U2l6ZS53aWR0aFxuICBsZXQgY2ggPSBjb250ZW50U2l6ZS5oZWlnaHRcbiAgbGV0IGZ3ID0gZnJhbWVTaXplLndpZHRoXG4gIGxldCBmaCA9IGZyYW1lU2l6ZS5oZWlnaHRcblxuICBsZXQgd1JhdGUgPSBudW1jYWwubWluKDEsIGZ3IC8gY3cpXG4gIGxldCBoUmF0ZSA9IG51bWNhbC5taW4oMSwgZmggLyBjaClcblxuICBsZXQgc2l6ZVdpdGhSYXRlID0gKHJhdGUpID0+ICh7XG4gICAgd2lkdGg6IGNvbnRlbnRTaXplLndpZHRoICogcmF0ZSxcbiAgICBoZWlnaHQ6IGNvbnRlbnRTaXplLmhlaWdodCAqIHJhdGVcbiAgfSlcblxuICBzd2l0Y2ggKHBvbGljeSkge1xuICAgIGNhc2UgJ25vbmUnOlxuICAgICAgcmV0dXJuIHNpemVXaXRoUmF0ZSgxKVxuICAgIGNhc2UgJ2ZpdCc6XG4gICAgICByZXR1cm4gc2l6ZVdpdGhSYXRlKFxuICAgICAgICBudW1jYWwubWluKHdSYXRlLCBoUmF0ZSlcbiAgICAgIClcbiAgICBjYXNlICdmaWxsJzpcbiAgICAgIHJldHVybiBzaXplV2l0aFJhdGUoXG4gICAgICAgIG51bWNhbC5tYXgod1JhdGUsIGhSYXRlKVxuICAgICAgKVxuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gcG9saWN5OiAke3BvbGljeX1gKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2NhbGVkU2l6ZVxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3Igc3Bpbm5lci5cbiAqIEBjbGFzcyBBcFNwaW5uZXJcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IG51bWNhbCBmcm9tICdudW1jYWwnXG5pbXBvcnQge0FwUHVyZU1peGluLCBBcExheW91dE1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG5jb25zdCBTcGlubmVyVGhlbWVzID0ge1xuICBhOiBbICdmYScsICdmYS1zcGluJywgJ2ZhLXNwaW5uZXInIF0sXG4gIGI6IFsgJ2ZhJywgJ2ZhLXNwaW4nLCAnZmEtY2lyY2xlLW8tbm90Y2gnIF0sXG4gIGM6IFsgJ2ZhJywgJ2ZhLXNwaW4nLCAnZmEtcmVmcmVzaCcgXSxcbiAgZDogWyAnZmEnLCAnZmEtc3BpbicsICdmYS1nZWFyJyBdLFxuICBlOiBbICdmYScsICdmYS1zcGluJywgJ2ZhLXB1bHNlJyBdXG59XG5jb25zdCBERUZBVUxUX1RIRU1FID0gJ2MnXG5cbi8qKiBAbGVuZHMgQXBTcGlubmVyICovXG5jb25zdCBBcFNwaW5uZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICBlbmFibGVkOiB0eXBlcy5ib29sLFxuICAgIHRoZW1lOiB0eXBlcy5vbmVPZihcbiAgICAgIE9iamVjdC5rZXlzKFNwaW5uZXJUaGVtZXMpXG4gICAgKVxuICB9LFxuXG4gIG1peGluczogW1xuICAgIEFwUHVyZU1peGluLFxuICAgIEFwTGF5b3V0TWl4aW5cbiAgXSxcblxuICBzdGF0aWNzOiB7XG4gICAgREVGQVVMVF9USEVNRTogREVGQVVMVF9USEVNRVxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICB0aGVtZTogREVGQVVMVF9USEVNRVxuICAgIH1cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMsIGxheW91dHMgfSA9IHNcbiAgICBsZXQgY2xhc3NOYW1lID0gY2xhc3NuYW1lcygnYXAtc3Bpbm5lcicsIHByb3BzLmNsYXNzTmFtZSwge1xuICAgICAgJ2FwLXNwaW5uZXItdmlzaWJsZSc6ICEhbGF5b3V0cy5zcGlubmVyLFxuICAgICAgJ2FwLXNwaW5uZXItZW5hYmxlZCc6ICEhcHJvcHMuZW5hYmxlZFxuICAgIH0pXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsgY2xhc3NOYW1lIH1cbiAgICAgICAgICAgc3R5bGU9eyBPYmplY3QuYXNzaWduKHt9LCBsYXlvdXRzLnNwaW5uZXIsIHByb3BzLnN0eWxlKSB9PlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC1zcGlubmVyLWFsaWduZXJcIj4mbmJzcDs8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gcmVmPVwiaWNvblwiXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtc3Bpbm5lci1pY29uJywgU3Bpbm5lclRoZW1lc1twcm9wcy50aGVtZV0pIH1cbiAgICAgICAgICAgICAgICBzdHlsZT17IGxheW91dHMuaWNvbiB9XG4gICAgICAgICAgPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBMaWZlY3ljbGVcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBjb21wb25lbnREaWRNb3VudCAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBzLnNldFN0YXRlKHtcbiAgICAgIGljb25WaXNpYmxlOiB0cnVlXG4gICAgfSlcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudCAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBGb3IgQXBMYXlvdXRNaXhpblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldEluaXRpYWxMYXlvdXRzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3Bpbm5lcjogbnVsbCxcbiAgICAgIGljb246IG51bGxcbiAgICB9XG4gIH0sXG5cbiAgY2FsY0xheW91dHMgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IG5vZGUgPSBSZWFjdERPTS5maW5kRE9NTm9kZShzKVxuXG4gICAgbGV0IHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZSB8fCBub2RlLnBhcmVudEVsZW1lbnRcbiAgICBsZXQgdyA9IG51bWNhbC5tYXgocGFyZW50Lm9mZnNldFdpZHRoLCBub2RlLm9mZnNldFdpZHRoKVxuICAgIGxldCBoID0gbnVtY2FsLm1heChwYXJlbnQub2Zmc2V0SGVpZ2h0LCBub2RlLm9mZnNldEhlaWdodClcbiAgICBsZXQgc2l6ZSA9IG51bWNhbC5taW4odywgaClcbiAgICBsZXQgaWNvblNpemUgPSBudW1jYWwubWluKHNpemUgKiAwLjUsIDYwKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNwaW5uZXI6IHtcbiAgICAgICAgbGluZUhlaWdodDogYCR7c2l6ZX1weGAsXG4gICAgICAgIGZvbnRTaXplOiBgJHtpY29uU2l6ZX1weGBcbiAgICAgIH0sXG4gICAgICBpY29uOiB7XG4gICAgICAgIHdpZHRoOiBgJHtpY29uU2l6ZX1weGAsXG4gICAgICAgIGhlaWdodDogYCR7aWNvblNpemV9cHhgXG4gICAgICB9XG4gICAgfVxuICB9XG59KVxuXG5leHBvcnQgZGVmYXVsdCBBcFNwaW5uZXJcbiIsIi8qKlxuICogU3R5bGUgZm9yIEFwU3Bpbm5lci5cbiAqIEBjbGFzcyBBcFNwaW5uZXJTdHlsZVxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtBcFN0eWxlfSBmcm9tICdhcGVtYW4tcmVhY3Qtc3R5bGUnXG5cbi8qKiBAbGVuZHMgQXBTcGlubmVyU3R5bGUgKi9cbmNvbnN0IEFwU3Bpbm5lclN0eWxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBzdGF0aWNzOiB7XG4gICAgYWxpZ25lclN0eWxlOiB7XG4gICAgICB3aWR0aDogMSxcbiAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgbWFyZ2luUmlnaHQ6ICctMXB4JyxcbiAgICAgIHZlcnRpY2FsQWxpZ246ICdtaWRkbGUnLFxuICAgICAgY29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICBvcGFjaXR5OiAwLFxuICAgICAgaGVpZ2h0OiAnMTAwJSdcbiAgICB9XG4gIH0sXG4gIHByb3BUeXBlczoge1xuICAgIHNjb3BlZDogdHlwZXMuYm9vbCxcbiAgICB0eXBlOiB0eXBlcy5zdHJpbmcsXG4gICAgc3R5bGU6IHR5cGVzLm9iamVjdFxuICB9LFxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2NvcGVkOiBmYWxzZSxcbiAgICAgIHR5cGU6ICd0ZXh0L2NzcycsXG4gICAgICBzdHlsZToge31cbiAgICB9XG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIGxldCBkYXRhID0ge1xuICAgICAgJy5hcC1zcGlubmVyJzoge1xuICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgICAgICBkaXNwbGF5OiAnbm9uZSdcbiAgICAgIH0sXG4gICAgICAnLmFwLXNwaW5uZXIuYXAtc3Bpbm5lci1lbmFibGVkJzoge1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG4gICAgICB9LFxuICAgICAgJy5hcC1zcGlubmVyLWljb24nOiB7XG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICBtYXJnaW46ICcwIDRweCcsXG4gICAgICAgIHRyYW5zaXRpb246ICdvcGFjaXR5IDEwMG1zJyxcbiAgICAgICAgb3BhY2l0eTogMFxuICAgICAgfSxcbiAgICAgICcuYXAtc3Bpbm5lci12aXNpYmxlIC5hcC1zcGlubmVyLWljb24nOiB7XG4gICAgICAgIG9wYWNpdHk6IDFcbiAgICAgIH0sXG4gICAgICAnLmFwLXNwaW5uZXItYWxpZ25lcic6IEFwU3Bpbm5lclN0eWxlLmFsaWduZXJTdHlsZVxuICAgIH1cbiAgICBsZXQgc21hbGxNZWRpYURhdGEgPSB7fVxuICAgIGxldCBtZWRpdW1NZWRpYURhdGEgPSB7fVxuICAgIGxldCBsYXJnZU1lZGlhRGF0YSA9IHt9XG5cbiAgICByZXR1cm4gKFxuICAgICAgPEFwU3R5bGUgc2NvcGVkPXsgcHJvcHMuc2NvcGVkIH1cbiAgICAgICAgICAgICAgIGRhdGE9eyBPYmplY3QuYXNzaWduKGRhdGEsIHByb3BzLnN0eWxlKSB9XG4gICAgICAgICAgICAgICBzbWFsbE1lZGlhRGF0YT17IHNtYWxsTWVkaWFEYXRhIH1cbiAgICAgICAgICAgICAgIG1lZGl1bU1lZGlhRGF0YT17IG1lZGl1bU1lZGlhRGF0YSB9XG4gICAgICAgICAgICAgICBsYXJnZU1lZGlhRGF0YT17IGxhcmdlTWVkaWFEYXRhIH1cbiAgICAgID57IHByb3BzLmNoaWxkcmVuIH08L0FwU3R5bGU+XG4gICAgKVxuICB9XG59KVxuXG5leHBvcnQgZGVmYXVsdCBBcFNwaW5uZXJTdHlsZVxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3Igc3Bpbm5lci5cbiAqIEBtb2R1bGUgYXBlbWFuLXJlYWN0LXNwaW5uZXJcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxubGV0IGQgPSAobW9kdWxlKSA9PiBtb2R1bGUuZGVmYXVsdCB8fCBtb2R1bGVcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldCBBcFNwaW5uZXJTdHlsZSAoKSB7IHJldHVybiBkKHJlcXVpcmUoJy4vYXBfc3Bpbm5lcl9zdHlsZScpKSB9LFxuICBnZXQgQXBTcGlubmVyICgpIHsgcmV0dXJuIGQocmVxdWlyZSgnLi9hcF9zcGlubmVyJykpIH1cbn1cbiIsIi8qIVxuICogYXN5bmNcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jYW9sYW4vYXN5bmNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IENhb2xhbiBNY01haG9uXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBhc3luYyA9IHt9O1xuICAgIGZ1bmN0aW9uIG5vb3AoKSB7fVxuICAgIGZ1bmN0aW9uIGlkZW50aXR5KHYpIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvQm9vbCh2KSB7XG4gICAgICAgIHJldHVybiAhIXY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5vdElkKHYpIHtcbiAgICAgICAgcmV0dXJuICF2O1xuICAgIH1cblxuICAgIC8vIGdsb2JhbCBvbiB0aGUgc2VydmVyLCB3aW5kb3cgaW4gdGhlIGJyb3dzZXJcbiAgICB2YXIgcHJldmlvdXNfYXN5bmM7XG5cbiAgICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCAoYHNlbGZgKSBpbiB0aGUgYnJvd3NlciwgYGdsb2JhbGBcbiAgICAvLyBvbiB0aGUgc2VydmVyLCBvciBgdGhpc2AgaW4gc29tZSB2aXJ0dWFsIG1hY2hpbmVzLiBXZSB1c2UgYHNlbGZgXG4gICAgLy8gaW5zdGVhZCBvZiBgd2luZG93YCBmb3IgYFdlYldvcmtlcmAgc3VwcG9ydC5cbiAgICB2YXIgcm9vdCA9IHR5cGVvZiBzZWxmID09PSAnb2JqZWN0JyAmJiBzZWxmLnNlbGYgPT09IHNlbGYgJiYgc2VsZiB8fFxuICAgICAgICAgICAgdHlwZW9mIGdsb2JhbCA9PT0gJ29iamVjdCcgJiYgZ2xvYmFsLmdsb2JhbCA9PT0gZ2xvYmFsICYmIGdsb2JhbCB8fFxuICAgICAgICAgICAgdGhpcztcblxuICAgIGlmIChyb290ICE9IG51bGwpIHtcbiAgICAgICAgcHJldmlvdXNfYXN5bmMgPSByb290LmFzeW5jO1xuICAgIH1cblxuICAgIGFzeW5jLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJvb3QuYXN5bmMgPSBwcmV2aW91c19hc3luYztcbiAgICAgICAgcmV0dXJuIGFzeW5jO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBvbmx5X29uY2UoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGZuID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayB3YXMgYWxyZWFkeSBjYWxsZWQuXCIpO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZuID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfb25jZShmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZm4gPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmbiA9IG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8vLyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGl0eSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgdmFyIF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICB2YXIgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIF90b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfTtcblxuICAgIC8vIFBvcnRlZCBmcm9tIHVuZGVyc2NvcmUuanMgaXNPYmplY3RcbiAgICB2YXIgX2lzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcbiAgICAgICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgdHlwZSA9PT0gJ29iamVjdCcgJiYgISFvYmo7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9pc0FycmF5TGlrZShhcnIpIHtcbiAgICAgICAgcmV0dXJuIF9pc0FycmF5KGFycikgfHwgKFxuICAgICAgICAgICAgLy8gaGFzIGEgcG9zaXRpdmUgaW50ZWdlciBsZW5ndGggcHJvcGVydHlcbiAgICAgICAgICAgIHR5cGVvZiBhcnIubGVuZ3RoID09PSBcIm51bWJlclwiICYmXG4gICAgICAgICAgICBhcnIubGVuZ3RoID49IDAgJiZcbiAgICAgICAgICAgIGFyci5sZW5ndGggJSAxID09PSAwXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2FycmF5RWFjaChhcnIsIGl0ZXJhdG9yKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gYXJyLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgaXRlcmF0b3IoYXJyW2luZGV4XSwgaW5kZXgsIGFycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfbWFwKGFyciwgaXRlcmF0b3IpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnIubGVuZ3RoLFxuICAgICAgICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgcmVzdWx0W2luZGV4XSA9IGl0ZXJhdG9yKGFycltpbmRleF0sIGluZGV4LCBhcnIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JhbmdlKGNvdW50KSB7XG4gICAgICAgIHJldHVybiBfbWFwKEFycmF5KGNvdW50KSwgZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIGk7IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yZWR1Y2UoYXJyLCBpdGVyYXRvciwgbWVtbykge1xuICAgICAgICBfYXJyYXlFYWNoKGFyciwgZnVuY3Rpb24gKHgsIGksIGEpIHtcbiAgICAgICAgICAgIG1lbW8gPSBpdGVyYXRvcihtZW1vLCB4LCBpLCBhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9mb3JFYWNoT2Yob2JqZWN0LCBpdGVyYXRvcikge1xuICAgICAgICBfYXJyYXlFYWNoKF9rZXlzKG9iamVjdCksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG9iamVjdFtrZXldLCBrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfaW5kZXhPZihhcnIsIGl0ZW0pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcnJbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICB2YXIgX2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfa2V5SXRlcmF0b3IoY29sbCkge1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB2YXIgbGVuO1xuICAgICAgICB2YXIga2V5cztcbiAgICAgICAgaWYgKF9pc0FycmF5TGlrZShjb2xsKSkge1xuICAgICAgICAgICAgbGVuID0gY29sbC5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgPCBsZW4gPyBpIDogbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrZXlzID0gX2tleXMoY29sbCk7XG4gICAgICAgICAgICBsZW4gPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gaSA8IGxlbiA/IGtleXNbaV0gOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNpbWlsYXIgdG8gRVM2J3MgcmVzdCBwYXJhbSAoaHR0cDovL2FyaXlhLm9maWxhYnMuY29tLzIwMTMvMDMvZXM2LWFuZC1yZXN0LXBhcmFtZXRlci5odG1sKVxuICAgIC8vIFRoaXMgYWNjdW11bGF0ZXMgdGhlIGFyZ3VtZW50cyBwYXNzZWQgaW50byBhbiBhcnJheSwgYWZ0ZXIgYSBnaXZlbiBpbmRleC5cbiAgICAvLyBGcm9tIHVuZGVyc2NvcmUuanMgKGh0dHBzOi8vZ2l0aHViLmNvbS9qYXNoa2VuYXMvdW5kZXJzY29yZS9wdWxsLzIxNDApLlxuICAgIGZ1bmN0aW9uIF9yZXN0UGFyYW0oZnVuYywgc3RhcnRJbmRleCkge1xuICAgICAgICBzdGFydEluZGV4ID0gc3RhcnRJbmRleCA9PSBudWxsID8gZnVuYy5sZW5ndGggLSAxIDogK3N0YXJ0SW5kZXg7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChhcmd1bWVudHMubGVuZ3RoIC0gc3RhcnRJbmRleCwgMCk7XG4gICAgICAgICAgICB2YXIgcmVzdCA9IEFycmF5KGxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgcmVzdFtpbmRleF0gPSBhcmd1bWVudHNbaW5kZXggKyBzdGFydEluZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoc3RhcnRJbmRleCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCByZXN0KTtcbiAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJndW1lbnRzWzBdLCByZXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEN1cnJlbnRseSB1bnVzZWQgYnV0IGhhbmRsZSBjYXNlcyBvdXRzaWRlIG9mIHRoZSBzd2l0Y2ggc3RhdGVtZW50OlxuICAgICAgICAgICAgLy8gdmFyIGFyZ3MgPSBBcnJheShzdGFydEluZGV4ICsgMSk7XG4gICAgICAgICAgICAvLyBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCBzdGFydEluZGV4OyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyAgICAgYXJnc1tpbmRleF0gPSBhcmd1bWVudHNbaW5kZXhdO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gYXJnc1tzdGFydEluZGV4XSA9IHJlc3Q7XG4gICAgICAgICAgICAvLyByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yKHZhbHVlLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8vLyBleHBvcnRlZCBhc3luYyBtb2R1bGUgZnVuY3Rpb25zIC8vLy9cblxuICAgIC8vLy8gbmV4dFRpY2sgaW1wbGVtZW50YXRpb24gd2l0aCBicm93c2VyLWNvbXBhdGlibGUgZmFsbGJhY2sgLy8vL1xuXG4gICAgLy8gY2FwdHVyZSB0aGUgZ2xvYmFsIHJlZmVyZW5jZSB0byBndWFyZCBhZ2FpbnN0IGZha2VUaW1lciBtb2Nrc1xuICAgIHZhciBfc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBzZXRJbW1lZGlhdGU7XG5cbiAgICB2YXIgX2RlbGF5ID0gX3NldEltbWVkaWF0ZSA/IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIC8vIG5vdCBhIGRpcmVjdCBhbGlhcyBmb3IgSUUxMCBjb21wYXRpYmlsaXR5XG4gICAgICAgIF9zZXRJbW1lZGlhdGUoZm4pO1xuICAgIH0gOiBmdW5jdGlvbihmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcHJvY2Vzcy5uZXh0VGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBhc3luYy5uZXh0VGljayA9IHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYXN5bmMubmV4dFRpY2sgPSBfZGVsYXk7XG4gICAgfVxuICAgIGFzeW5jLnNldEltbWVkaWF0ZSA9IF9zZXRJbW1lZGlhdGUgPyBfZGVsYXkgOiBhc3luYy5uZXh0VGljaztcblxuXG4gICAgYXN5bmMuZm9yRWFjaCA9XG4gICAgYXN5bmMuZWFjaCA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMuZWFjaE9mKGFyciwgX3dpdGhvdXRJbmRleChpdGVyYXRvciksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZm9yRWFjaFNlcmllcyA9XG4gICAgYXN5bmMuZWFjaFNlcmllcyA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMuZWFjaE9mU2VyaWVzKGFyciwgX3dpdGhvdXRJbmRleChpdGVyYXRvciksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG5cbiAgICBhc3luYy5mb3JFYWNoTGltaXQgPVxuICAgIGFzeW5jLmVhY2hMaW1pdCA9IGZ1bmN0aW9uIChhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIF9lYWNoT2ZMaW1pdChsaW1pdCkoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5mb3JFYWNoT2YgPVxuICAgIGFzeW5jLmVhY2hPZiA9IGZ1bmN0aW9uIChvYmplY3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBvYmplY3QgPSBvYmplY3QgfHwgW107XG5cbiAgICAgICAgdmFyIGl0ZXIgPSBfa2V5SXRlcmF0b3Iob2JqZWN0KTtcbiAgICAgICAgdmFyIGtleSwgY29tcGxldGVkID0gMDtcblxuICAgICAgICB3aGlsZSAoKGtleSA9IGl0ZXIoKSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29tcGxldGVkICs9IDE7XG4gICAgICAgICAgICBpdGVyYXRvcihvYmplY3Rba2V5XSwga2V5LCBvbmx5X29uY2UoZG9uZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBsZXRlZCA9PT0gMCkgY2FsbGJhY2sobnVsbCk7XG5cbiAgICAgICAgZnVuY3Rpb24gZG9uZShlcnIpIHtcbiAgICAgICAgICAgIGNvbXBsZXRlZC0tO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDaGVjayBrZXkgaXMgbnVsbCBpbiBjYXNlIGl0ZXJhdG9yIGlzbid0IGV4aGF1c3RlZFxuICAgICAgICAgICAgLy8gYW5kIGRvbmUgcmVzb2x2ZWQgc3luY2hyb25vdXNseS5cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PT0gbnVsbCAmJiBjb21wbGV0ZWQgPD0gMCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hPZlNlcmllcyA9XG4gICAgYXN5bmMuZWFjaE9mU2VyaWVzID0gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIG9iaiA9IG9iaiB8fCBbXTtcbiAgICAgICAgdmFyIG5leHRLZXkgPSBfa2V5SXRlcmF0b3Iob2JqKTtcbiAgICAgICAgdmFyIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgZnVuY3Rpb24gaXRlcmF0ZSgpIHtcbiAgICAgICAgICAgIHZhciBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVyYXRvcihvYmpba2V5XSwga2V5LCBvbmx5X29uY2UoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN5bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoaXRlcmF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpdGVyYXRlKCk7XG4gICAgfTtcblxuXG5cbiAgICBhc3luYy5mb3JFYWNoT2ZMaW1pdCA9XG4gICAgYXN5bmMuZWFjaE9mTGltaXQgPSBmdW5jdGlvbiAob2JqLCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9lYWNoT2ZMaW1pdChsaW1pdCkob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfZWFjaE9mTGltaXQobGltaXQpIHtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICAgICAgb2JqID0gb2JqIHx8IFtdO1xuICAgICAgICAgICAgdmFyIG5leHRLZXkgPSBfa2V5SXRlcmF0b3Iob2JqKTtcbiAgICAgICAgICAgIGlmIChsaW1pdCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBydW5uaW5nID0gMDtcbiAgICAgICAgICAgIHZhciBlcnJvcmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIChmdW5jdGlvbiByZXBsZW5pc2ggKCkge1xuICAgICAgICAgICAgICAgIGlmIChkb25lICYmIHJ1bm5pbmcgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHJ1bm5pbmcgPCBsaW1pdCAmJiAhZXJyb3JlZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gbmV4dEtleSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydW5uaW5nIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBydW5uaW5nICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG9ialtrZXldLCBrZXksIG9ubHlfb25jZShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxlbmlzaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGRvUGFyYWxsZWwoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGFzeW5jLmVhY2hPZiwgb2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBkb1BhcmFsbGVsTGltaXQoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihfZWFjaE9mTGltaXQobGltaXQpLCBvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRvU2VyaWVzKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihhc3luYy5lYWNoT2ZTZXJpZXMsIG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfYXN5bmNNYXAoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBhcnIgPSBhcnIgfHwgW107XG4gICAgICAgIHZhciByZXN1bHRzID0gX2lzQXJyYXlMaWtlKGFycikgPyBbXSA6IHt9O1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAodmFsdWUsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IodmFsdWUsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSA9IHY7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5tYXAgPSBkb1BhcmFsbGVsKF9hc3luY01hcCk7XG4gICAgYXN5bmMubWFwU2VyaWVzID0gZG9TZXJpZXMoX2FzeW5jTWFwKTtcbiAgICBhc3luYy5tYXBMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfYXN5bmNNYXApO1xuXG4gICAgLy8gcmVkdWNlIG9ubHkgaGFzIGEgc2VyaWVzIHZlcnNpb24sIGFzIGRvaW5nIHJlZHVjZSBpbiBwYXJhbGxlbCB3b24ndFxuICAgIC8vIHdvcmsgaW4gbWFueSBzaXR1YXRpb25zLlxuICAgIGFzeW5jLmluamVjdCA9XG4gICAgYXN5bmMuZm9sZGwgPVxuICAgIGFzeW5jLnJlZHVjZSA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5lYWNoT2ZTZXJpZXMoYXJyLCBmdW5jdGlvbiAoeCwgaSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG1lbW8sIHgsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICBtZW1vID0gdjtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgbWVtbyk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhc3luYy5mb2xkciA9XG4gICAgYXN5bmMucmVkdWNlUmlnaHQgPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJldmVyc2VkID0gX21hcChhcnIsIGlkZW50aXR5KS5yZXZlcnNlKCk7XG4gICAgICAgIGFzeW5jLnJlZHVjZShyZXZlcnNlZCwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMudHJhbnNmb3JtID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGl0ZXJhdG9yO1xuICAgICAgICAgICAgaXRlcmF0b3IgPSBtZW1vO1xuICAgICAgICAgICAgbWVtbyA9IF9pc0FycmF5KGFycikgPyBbXSA6IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMuZWFjaE9mKGFyciwgZnVuY3Rpb24odiwgaywgY2IpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG1lbW8sIHYsIGssIGNiKTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG1lbW8pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2ZpbHRlcihlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtpbmRleDogaW5kZXgsIHZhbHVlOiB4fSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbGJhY2soX21hcChyZXN1bHRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS5pbmRleCAtIGIuaW5kZXg7XG4gICAgICAgICAgICB9KSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geC52YWx1ZTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuc2VsZWN0ID1cbiAgICBhc3luYy5maWx0ZXIgPSBkb1BhcmFsbGVsKF9maWx0ZXIpO1xuXG4gICAgYXN5bmMuc2VsZWN0TGltaXQgPVxuICAgIGFzeW5jLmZpbHRlckxpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9maWx0ZXIpO1xuXG4gICAgYXN5bmMuc2VsZWN0U2VyaWVzID1cbiAgICBhc3luYy5maWx0ZXJTZXJpZXMgPSBkb1NlcmllcyhfZmlsdGVyKTtcblxuICAgIGZ1bmN0aW9uIF9yZWplY3QoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBfZmlsdGVyKGVhY2hmbiwgYXJyLCBmdW5jdGlvbih2YWx1ZSwgY2IpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHZhbHVlLCBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICAgICAgY2IoIXYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICB9XG4gICAgYXN5bmMucmVqZWN0ID0gZG9QYXJhbGxlbChfcmVqZWN0KTtcbiAgICBhc3luYy5yZWplY3RMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfcmVqZWN0KTtcbiAgICBhc3luYy5yZWplY3RTZXJpZXMgPSBkb1NlcmllcyhfcmVqZWN0KTtcblxuICAgIGZ1bmN0aW9uIF9jcmVhdGVUZXN0ZXIoZWFjaGZuLCBjaGVjaywgZ2V0UmVzdWx0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2IpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvbmUoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNiKSBjYihnZXRSZXN1bHQoZmFsc2UsIHZvaWQgMCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gaXRlcmF0ZWUoeCwgXywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNiKSByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2IgJiYgY2hlY2sodikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiKGdldFJlc3VsdCh0cnVlLCB4KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYiA9IGl0ZXJhdG9yID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMykge1xuICAgICAgICAgICAgICAgIGVhY2hmbihhcnIsIGxpbWl0LCBpdGVyYXRlZSwgZG9uZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNiID0gaXRlcmF0b3I7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IgPSBsaW1pdDtcbiAgICAgICAgICAgICAgICBlYWNoZm4oYXJyLCBpdGVyYXRlZSwgZG9uZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMuYW55ID1cbiAgICBhc3luYy5zb21lID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIHRvQm9vbCwgaWRlbnRpdHkpO1xuXG4gICAgYXN5bmMuc29tZUxpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgdG9Cb29sLCBpZGVudGl0eSk7XG5cbiAgICBhc3luYy5hbGwgPVxuICAgIGFzeW5jLmV2ZXJ5ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIG5vdElkLCBub3RJZCk7XG5cbiAgICBhc3luYy5ldmVyeUxpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgbm90SWQsIG5vdElkKTtcblxuICAgIGZ1bmN0aW9uIF9maW5kR2V0UmVzdWx0KHYsIHgpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGFzeW5jLmRldGVjdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mLCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuICAgIGFzeW5jLmRldGVjdFNlcmllcyA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mU2VyaWVzLCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuICAgIGFzeW5jLmRldGVjdExpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcblxuICAgIGFzeW5jLnNvcnRCeSA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5tYXAoYXJyLCBmdW5jdGlvbiAoeCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uIChlcnIsIGNyaXRlcmlhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwge3ZhbHVlOiB4LCBjcml0ZXJpYTogY3JpdGVyaWF9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgX21hcChyZXN1bHRzLnNvcnQoY29tcGFyYXRvciksIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBjb21wYXJhdG9yKGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWEsIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5hdXRvID0gZnVuY3Rpb24gKHRhc2tzLCBjb25jdXJyZW5jeSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIC8vIGNvbmN1cnJlbmN5IGlzIG9wdGlvbmFsLCBzaGlmdCB0aGUgYXJncy5cbiAgICAgICAgICAgIGNhbGxiYWNrID0gY29uY3VycmVuY3k7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgdmFyIGtleXMgPSBfa2V5cyh0YXNrcyk7XG4gICAgICAgIHZhciByZW1haW5pbmdUYXNrcyA9IGtleXMubGVuZ3RoO1xuICAgICAgICBpZiAoIXJlbWFpbmluZ1Rhc2tzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSByZW1haW5pbmdUYXNrcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHRzID0ge307XG4gICAgICAgIHZhciBydW5uaW5nVGFza3MgPSAwO1xuXG4gICAgICAgIHZhciBoYXNFcnJvciA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoZm4pIHtcbiAgICAgICAgICAgIGxpc3RlbmVycy51bnNoaWZ0KGZuKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihmbikge1xuICAgICAgICAgICAgdmFyIGlkeCA9IF9pbmRleE9mKGxpc3RlbmVycywgZm4pO1xuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSBsaXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gdGFza0NvbXBsZXRlKCkge1xuICAgICAgICAgICAgcmVtYWluaW5nVGFza3MtLTtcbiAgICAgICAgICAgIF9hcnJheUVhY2gobGlzdGVuZXJzLnNsaWNlKDApLCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRMaXN0ZW5lcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXJlbWFpbmluZ1Rhc2tzKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9hcnJheUVhY2goa2V5cywgZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgIGlmIChoYXNFcnJvcikgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIHRhc2sgPSBfaXNBcnJheSh0YXNrc1trXSkgPyB0YXNrc1trXTogW3Rhc2tzW2tdXTtcbiAgICAgICAgICAgIHZhciB0YXNrQ2FsbGJhY2sgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIHJ1bm5pbmdUYXNrcy0tO1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzYWZlUmVzdWx0cyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBfZm9yRWFjaE9mKHJlc3VsdHMsIGZ1bmN0aW9uKHZhbCwgcmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FmZVJlc3VsdHNbcmtleV0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9yID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIsIHNhZmVSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNba10gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUodGFza0NvbXBsZXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciByZXF1aXJlcyA9IHRhc2suc2xpY2UoMCwgdGFzay5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIC8vIHByZXZlbnQgZGVhZC1sb2Nrc1xuICAgICAgICAgICAgdmFyIGxlbiA9IHJlcXVpcmVzLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBkZXA7XG4gICAgICAgICAgICB3aGlsZSAobGVuLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShkZXAgPSB0YXNrc1tyZXF1aXJlc1tsZW5dXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdIYXMgbm9uZXhpc3RlbnQgZGVwZW5kZW5jeSBpbiAnICsgcmVxdWlyZXMuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChfaXNBcnJheShkZXApICYmIF9pbmRleE9mKGRlcCwgaykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hhcyBjeWNsaWMgZGVwZW5kZW5jaWVzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmdUYXNrcyA8IGNvbmN1cnJlbmN5ICYmIF9yZWR1Y2UocmVxdWlyZXMsIGZ1bmN0aW9uIChhLCB4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoYSAmJiByZXN1bHRzLmhhc093blByb3BlcnR5KHgpKTtcbiAgICAgICAgICAgICAgICB9LCB0cnVlKSAmJiAhcmVzdWx0cy5oYXNPd25Qcm9wZXJ0eShrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgcnVubmluZ1Rhc2tzKys7XG4gICAgICAgICAgICAgICAgdGFza1t0YXNrLmxlbmd0aCAtIDFdKHRhc2tDYWxsYmFjaywgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBhZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBsaXN0ZW5lcigpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVhZHkoKSkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nVGFza3MrKztcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0YXNrW3Rhc2subGVuZ3RoIC0gMV0odGFza0NhbGxiYWNrLCByZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cblxuXG4gICAgYXN5bmMucmV0cnkgPSBmdW5jdGlvbih0aW1lcywgdGFzaywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIERFRkFVTFRfVElNRVMgPSA1O1xuICAgICAgICB2YXIgREVGQVVMVF9JTlRFUlZBTCA9IDA7XG5cbiAgICAgICAgdmFyIGF0dGVtcHRzID0gW107XG5cbiAgICAgICAgdmFyIG9wdHMgPSB7XG4gICAgICAgICAgICB0aW1lczogREVGQVVMVF9USU1FUyxcbiAgICAgICAgICAgIGludGVydmFsOiBERUZBVUxUX0lOVEVSVkFMXG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gcGFyc2VUaW1lcyhhY2MsIHQpe1xuICAgICAgICAgICAgaWYodHlwZW9mIHQgPT09ICdudW1iZXInKXtcbiAgICAgICAgICAgICAgICBhY2MudGltZXMgPSBwYXJzZUludCh0LCAxMCkgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgICAgIH0gZWxzZSBpZih0eXBlb2YgdCA9PT0gJ29iamVjdCcpe1xuICAgICAgICAgICAgICAgIGFjYy50aW1lcyA9IHBhcnNlSW50KHQudGltZXMsIDEwKSB8fCBERUZBVUxUX1RJTUVTO1xuICAgICAgICAgICAgICAgIGFjYy5pbnRlcnZhbCA9IHBhcnNlSW50KHQuaW50ZXJ2YWwsIDEwKSB8fCBERUZBVUxUX0lOVEVSVkFMO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGFyZ3VtZW50IHR5cGUgZm9yIFxcJ3RpbWVzXFwnOiAnICsgdHlwZW9mIHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGlmIChsZW5ndGggPCAxIHx8IGxlbmd0aCA+IDMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBhcmd1bWVudHMgLSBtdXN0IGJlIGVpdGhlciAodGFzayksICh0YXNrLCBjYWxsYmFjayksICh0aW1lcywgdGFzaykgb3IgKHRpbWVzLCB0YXNrLCBjYWxsYmFjayknKTtcbiAgICAgICAgfSBlbHNlIGlmIChsZW5ndGggPD0gMiAmJiB0eXBlb2YgdGltZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdGFzaztcbiAgICAgICAgICAgIHRhc2sgPSB0aW1lcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRpbWVzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBwYXJzZVRpbWVzKG9wdHMsIHRpbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBvcHRzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIG9wdHMudGFzayA9IHRhc2s7XG5cbiAgICAgICAgZnVuY3Rpb24gd3JhcHBlZFRhc2sod3JhcHBlZENhbGxiYWNrLCB3cmFwcGVkUmVzdWx0cykge1xuICAgICAgICAgICAgZnVuY3Rpb24gcmV0cnlBdHRlbXB0KHRhc2ssIGZpbmFsQXR0ZW1wdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzZXJpZXNDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICB0YXNrKGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKCFlcnIgfHwgZmluYWxBdHRlbXB0LCB7ZXJyOiBlcnIsIHJlc3VsdDogcmVzdWx0fSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHdyYXBwZWRSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZXRyeUludGVydmFsKGludGVydmFsKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2VyaWVzQ2FsbGJhY2spe1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXNDYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdoaWxlIChvcHRzLnRpbWVzKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgZmluYWxBdHRlbXB0ID0gIShvcHRzLnRpbWVzLT0xKTtcbiAgICAgICAgICAgICAgICBhdHRlbXB0cy5wdXNoKHJldHJ5QXR0ZW1wdChvcHRzLnRhc2ssIGZpbmFsQXR0ZW1wdCkpO1xuICAgICAgICAgICAgICAgIGlmKCFmaW5hbEF0dGVtcHQgJiYgb3B0cy5pbnRlcnZhbCA+IDApe1xuICAgICAgICAgICAgICAgICAgICBhdHRlbXB0cy5wdXNoKHJldHJ5SW50ZXJ2YWwob3B0cy5pbnRlcnZhbCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXN5bmMuc2VyaWVzKGF0dGVtcHRzLCBmdW5jdGlvbihkb25lLCBkYXRhKXtcbiAgICAgICAgICAgICAgICBkYXRhID0gZGF0YVtkYXRhLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICh3cmFwcGVkQ2FsbGJhY2sgfHwgb3B0cy5jYWxsYmFjaykoZGF0YS5lcnIsIGRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBjYWxsYmFjayBpcyBwYXNzZWQsIHJ1biB0aGlzIGFzIGEgY29udHJvbGwgZmxvd1xuICAgICAgICByZXR1cm4gb3B0cy5jYWxsYmFjayA/IHdyYXBwZWRUYXNrKCkgOiB3cmFwcGVkVGFzaztcbiAgICB9O1xuXG4gICAgYXN5bmMud2F0ZXJmYWxsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBpZiAoIV9pc0FycmF5KHRhc2tzKSkge1xuICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgdG8gd2F0ZXJmYWxsIG11c3QgYmUgYW4gYXJyYXkgb2YgZnVuY3Rpb25zJyk7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gd3JhcEl0ZXJhdG9yKGl0ZXJhdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBbZXJyXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2god3JhcEl0ZXJhdG9yKG5leHQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZW5zdXJlQXN5bmMoaXRlcmF0b3IpLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHdyYXBJdGVyYXRvcihhc3luYy5pdGVyYXRvcih0YXNrcykpKCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9wYXJhbGxlbChlYWNoZm4sIHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IG5vb3A7XG4gICAgICAgIHZhciByZXN1bHRzID0gX2lzQXJyYXlMaWtlKHRhc2tzKSA/IFtdIDoge307XG5cbiAgICAgICAgZWFjaGZuKHRhc2tzLCBmdW5jdGlvbiAodGFzaywga2V5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdGFzayhfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0c1trZXldID0gYXJncztcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5wYXJhbGxlbCA9IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgX3BhcmFsbGVsKGFzeW5jLmVhY2hPZiwgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMucGFyYWxsZWxMaW1pdCA9IGZ1bmN0aW9uKHRhc2tzLCBsaW1pdCwgY2FsbGJhY2spIHtcbiAgICAgICAgX3BhcmFsbGVsKF9lYWNoT2ZMaW1pdChsaW1pdCksIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnNlcmllcyA9IGZ1bmN0aW9uKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoYXN5bmMuZWFjaE9mU2VyaWVzLCB0YXNrcywgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5pdGVyYXRvciA9IGZ1bmN0aW9uICh0YXNrcykge1xuICAgICAgICBmdW5jdGlvbiBtYWtlQ2FsbGJhY2soaW5kZXgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGZuKCkge1xuICAgICAgICAgICAgICAgIGlmICh0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFza3NbaW5kZXhdLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmbi5uZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmbi5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoaW5kZXggPCB0YXNrcy5sZW5ndGggLSAxKSA/IG1ha2VDYWxsYmFjayhpbmRleCArIDEpOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBmbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFrZUNhbGxiYWNrKDApO1xuICAgIH07XG5cbiAgICBhc3luYy5hcHBseSA9IF9yZXN0UGFyYW0oZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChjYWxsQXJncykge1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KFxuICAgICAgICAgICAgICAgIG51bGwsIGFyZ3MuY29uY2F0KGNhbGxBcmdzKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBfY29uY2F0KGVhY2hmbiwgYXJyLCBmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgaW5kZXgsIGNiKSB7XG4gICAgICAgICAgICBmbih4LCBmdW5jdGlvbiAoZXJyLCB5KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh5IHx8IFtdKTtcbiAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jLmNvbmNhdCA9IGRvUGFyYWxsZWwoX2NvbmNhdCk7XG4gICAgYXN5bmMuY29uY2F0U2VyaWVzID0gZG9TZXJpZXMoX2NvbmNhdCk7XG5cbiAgICBhc3luYy53aGlsc3QgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcbiAgICAgICAgaWYgKHRlc3QoKSkge1xuICAgICAgICAgICAgdmFyIG5leHQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRlc3QuYXBwbHkodGhpcywgYXJncykpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3IobmV4dCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgW251bGxdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmRvV2hpbHN0ID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY2FsbHMgPSAwO1xuICAgICAgICByZXR1cm4gYXN5bmMud2hpbHN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICsrY2FsbHMgPD0gMSB8fCB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnVudGlsID0gZnVuY3Rpb24gKHRlc3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMud2hpbHN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmRvVW50aWwgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5kb1doaWxzdChpdGVyYXRvciwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5kdXJpbmcgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcblxuICAgICAgICB2YXIgbmV4dCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGNoZWNrKTtcbiAgICAgICAgICAgICAgICB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgY2hlY2sgPSBmdW5jdGlvbihlcnIsIHRydXRoKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHJ1dGgpIHtcbiAgICAgICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGVzdChjaGVjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmRvRHVyaW5nID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY2FsbHMgPSAwO1xuICAgICAgICBhc3luYy5kdXJpbmcoZnVuY3Rpb24obmV4dCkge1xuICAgICAgICAgICAgaWYgKGNhbGxzKysgPCAxKSB7XG4gICAgICAgICAgICAgICAgbmV4dChudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfcXVldWUod29ya2VyLCBjb25jdXJyZW5jeSwgcGF5bG9hZCkge1xuICAgICAgICBpZiAoY29uY3VycmVuY3kgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoY29uY3VycmVuY3kgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uY3VycmVuY3kgbXVzdCBub3QgYmUgemVybycpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9pbnNlcnQocSwgZGF0YSwgcG9zLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwgJiYgdHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0YXNrIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIV9pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRhdGEubGVuZ3RoID09PSAwICYmIHEuaWRsZSgpKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbCBkcmFpbiBpbW1lZGlhdGVseSBpZiB0aGVyZSBhcmUgbm8gdGFza3NcbiAgICAgICAgICAgICAgICByZXR1cm4gYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfYXJyYXlFYWNoKGRhdGEsIGZ1bmN0aW9uKHRhc2spIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrIHx8IG5vb3BcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKHBvcykge1xuICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnVuc2hpZnQoaXRlbSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gcS5jb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgICAgICBxLnNhdHVyYXRlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX25leHQocSwgdGFza3MpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHdvcmtlcnMgLT0gMTtcblxuICAgICAgICAgICAgICAgIHZhciByZW1vdmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgX2FycmF5RWFjaCh0YXNrcywgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgX2FycmF5RWFjaCh3b3JrZXJzTGlzdCwgZnVuY3Rpb24gKHdvcmtlciwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3b3JrZXIgPT09IHRhc2sgJiYgIXJlbW92ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZXJzTGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB0YXNrLmNhbGxiYWNrLmFwcGx5KHRhc2ssIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCArIHdvcmtlcnMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBxLnByb2Nlc3MoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd29ya2VycyA9IDA7XG4gICAgICAgIHZhciB3b3JrZXJzTGlzdCA9IFtdO1xuICAgICAgICB2YXIgcSA9IHtcbiAgICAgICAgICAgIHRhc2tzOiBbXSxcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5OiBjb25jdXJyZW5jeSxcbiAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWQsXG4gICAgICAgICAgICBzYXR1cmF0ZWQ6IG5vb3AsXG4gICAgICAgICAgICBlbXB0eTogbm9vcCxcbiAgICAgICAgICAgIGRyYWluOiBub29wLFxuICAgICAgICAgICAgc3RhcnRlZDogZmFsc2UsXG4gICAgICAgICAgICBwYXVzZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcHVzaDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCBmYWxzZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGtpbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxLmRyYWluID0gbm9vcDtcbiAgICAgICAgICAgICAgICBxLnRhc2tzID0gW107XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5zaGlmdDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCB0cnVlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdoaWxlKCFxLnBhdXNlZCAmJiB3b3JrZXJzIDwgcS5jb25jdXJyZW5jeSAmJiBxLnRhc2tzLmxlbmd0aCl7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhc2tzID0gcS5wYXlsb2FkID9cbiAgICAgICAgICAgICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKDAsIHEucGF5bG9hZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoMCwgcS50YXNrcy5sZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gX21hcCh0YXNrcywgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0YXNrLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcnMgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgd29ya2Vyc0xpc3QucHVzaCh0YXNrc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYiA9IG9ubHlfb25jZShfbmV4dChxLCB0YXNrcykpO1xuICAgICAgICAgICAgICAgICAgICB3b3JrZXIoZGF0YSwgY2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsZW5ndGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS50YXNrcy5sZW5ndGg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcnVubmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB3b3JrZXJzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdvcmtlcnNMaXN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmtlcnNMaXN0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlkbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnRhc2tzLmxlbmd0aCArIHdvcmtlcnMgPT09IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxLnBhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSBmYWxzZSkgeyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICBxLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bWVDb3VudCA9IE1hdGgubWluKHEuY29uY3VycmVuY3ksIHEudGFza3MubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBOZWVkIHRvIGNhbGwgcS5wcm9jZXNzIG9uY2UgcGVyIGNvbmN1cnJlbnRcbiAgICAgICAgICAgICAgICAvLyB3b3JrZXIgdG8gcHJlc2VydmUgZnVsbCBjb25jdXJyZW5jeSBhZnRlciBwYXVzZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIHcgPSAxOyB3IDw9IHJlc3VtZUNvdW50OyB3KyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcTtcbiAgICB9XG5cbiAgICBhc3luYy5xdWV1ZSA9IGZ1bmN0aW9uICh3b3JrZXIsIGNvbmN1cnJlbmN5KSB7XG4gICAgICAgIHZhciBxID0gX3F1ZXVlKGZ1bmN0aW9uIChpdGVtcywgY2IpIHtcbiAgICAgICAgICAgIHdvcmtlcihpdGVtc1swXSwgY2IpO1xuICAgICAgICB9LCBjb25jdXJyZW5jeSwgMSk7XG5cbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfTtcblxuICAgIGFzeW5jLnByaW9yaXR5UXVldWUgPSBmdW5jdGlvbiAod29ya2VyLCBjb25jdXJyZW5jeSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIF9jb21wYXJlVGFza3MoYSwgYil7XG4gICAgICAgICAgICByZXR1cm4gYS5wcmlvcml0eSAtIGIucHJpb3JpdHk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfYmluYXJ5U2VhcmNoKHNlcXVlbmNlLCBpdGVtLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgYmVnID0gLTEsXG4gICAgICAgICAgICAgICAgZW5kID0gc2VxdWVuY2UubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIHdoaWxlIChiZWcgPCBlbmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWlkID0gYmVnICsgKChlbmQgLSBiZWcgKyAxKSA+Pj4gMSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBhcmUoaXRlbSwgc2VxdWVuY2VbbWlkXSkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBiZWcgPSBtaWQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gbWlkIC0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYmVnO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2luc2VydChxLCBkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGFzayBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCFfaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBbZGF0YV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihkYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGwgZHJhaW4gaW1tZWRpYXRlbHkgaWYgdGhlcmUgYXJlIG5vIHRhc2tzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2FycmF5RWFjaChkYXRhLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHRhc2ssXG4gICAgICAgICAgICAgICAgICAgIHByaW9yaXR5OiBwcmlvcml0eSxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyA/IGNhbGxiYWNrIDogbm9vcFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBxLnRhc2tzLnNwbGljZShfYmluYXJ5U2VhcmNoKHEudGFza3MsIGl0ZW0sIF9jb21wYXJlVGFza3MpICsgMSwgMCwgaXRlbSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggPT09IHEuY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0YXJ0IHdpdGggYSBub3JtYWwgcXVldWVcbiAgICAgICAgdmFyIHEgPSBhc3luYy5xdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5KTtcblxuICAgICAgICAvLyBPdmVycmlkZSBwdXNoIHRvIGFjY2VwdCBzZWNvbmQgcGFyYW1ldGVyIHJlcHJlc2VudGluZyBwcmlvcml0eVxuICAgICAgICBxLnB1c2ggPSBmdW5jdGlvbiAoZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjayk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmVtb3ZlIHVuc2hpZnQgZnVuY3Rpb25cbiAgICAgICAgZGVsZXRlIHEudW5zaGlmdDtcblxuICAgICAgICByZXR1cm4gcTtcbiAgICB9O1xuXG4gICAgYXN5bmMuY2FyZ28gPSBmdW5jdGlvbiAod29ya2VyLCBwYXlsb2FkKSB7XG4gICAgICAgIHJldHVybiBfcXVldWUod29ya2VyLCAxLCBwYXlsb2FkKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2NvbnNvbGVfZm4obmFtZSkge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZm4sIGFyZ3MpIHtcbiAgICAgICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MuY29uY2F0KFtfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbnNvbGVbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hcnJheUVhY2goYXJncywgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlW25hbWVdKHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jLmxvZyA9IF9jb25zb2xlX2ZuKCdsb2cnKTtcbiAgICBhc3luYy5kaXIgPSBfY29uc29sZV9mbignZGlyJyk7XG4gICAgLyphc3luYy5pbmZvID0gX2NvbnNvbGVfZm4oJ2luZm8nKTtcbiAgICBhc3luYy53YXJuID0gX2NvbnNvbGVfZm4oJ3dhcm4nKTtcbiAgICBhc3luYy5lcnJvciA9IF9jb25zb2xlX2ZuKCdlcnJvcicpOyovXG5cbiAgICBhc3luYy5tZW1vaXplID0gZnVuY3Rpb24gKGZuLCBoYXNoZXIpIHtcbiAgICAgICAgdmFyIG1lbW8gPSB7fTtcbiAgICAgICAgdmFyIHF1ZXVlcyA9IHt9O1xuICAgICAgICB2YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgICAgICAgaGFzaGVyID0gaGFzaGVyIHx8IGlkZW50aXR5O1xuICAgICAgICB2YXIgbWVtb2l6ZWQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uIG1lbW9pemVkKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgaWYgKGhhcy5jYWxsKG1lbW8sIGtleSkpIHsgICBcbiAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBtZW1vW2tleV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaGFzLmNhbGwocXVldWVzLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgcXVldWVzW2tleV0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBxdWV1ZXNba2V5XSA9IFtjYWxsYmFja107XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVtb1trZXldID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBxdWV1ZXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHF1ZXVlc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHEubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxW2ldLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBtZW1vaXplZC5tZW1vID0gbWVtbztcbiAgICAgICAgbWVtb2l6ZWQudW5tZW1vaXplZCA9IGZuO1xuICAgICAgICByZXR1cm4gbWVtb2l6ZWQ7XG4gICAgfTtcblxuICAgIGFzeW5jLnVubWVtb2l6ZSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChmbi51bm1lbW9pemVkIHx8IGZuKS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfdGltZXMobWFwcGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoY291bnQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgbWFwcGVyKF9yYW5nZShjb3VudCksIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMudGltZXMgPSBfdGltZXMoYXN5bmMubWFwKTtcbiAgICBhc3luYy50aW1lc1NlcmllcyA9IF90aW1lcyhhc3luYy5tYXBTZXJpZXMpO1xuICAgIGFzeW5jLnRpbWVzTGltaXQgPSBmdW5jdGlvbiAoY291bnQsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLm1hcExpbWl0KF9yYW5nZShjb3VudCksIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5zZXEgPSBmdW5jdGlvbiAoLyogZnVuY3Rpb25zLi4uICovKSB7XG4gICAgICAgIHZhciBmbnMgPSBhcmd1bWVudHM7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gbm9vcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXN5bmMucmVkdWNlKGZucywgYXJncywgZnVuY3Rpb24gKG5ld2FyZ3MsIGZuLCBjYikge1xuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIG5ld2FyZ3MuY29uY2F0KFtfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIG5leHRhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKGVyciwgbmV4dGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pXSkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGF0LCBbZXJyXS5jb25jYXQocmVzdWx0cykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhc3luYy5jb21wb3NlID0gZnVuY3Rpb24gKC8qIGZ1bmN0aW9ucy4uLiAqLykge1xuICAgICAgICByZXR1cm4gYXN5bmMuc2VxLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5yZXZlcnNlLmNhbGwoYXJndW1lbnRzKSk7XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gX2FwcGx5RWFjaChlYWNoZm4pIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24oZm5zLCBhcmdzKSB7XG4gICAgICAgICAgICB2YXIgZ28gPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWFjaGZuKGZucywgZnVuY3Rpb24gKGZuLCBfLCBjYikge1xuICAgICAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGF0LCBhcmdzLmNvbmNhdChbY2JdKSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjYWxsYmFjayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnby5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBnbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuYXBwbHlFYWNoID0gX2FwcGx5RWFjaChhc3luYy5lYWNoT2YpO1xuICAgIGFzeW5jLmFwcGx5RWFjaFNlcmllcyA9IF9hcHBseUVhY2goYXN5bmMuZWFjaE9mU2VyaWVzKTtcblxuXG4gICAgYXN5bmMuZm9yZXZlciA9IGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGRvbmUgPSBvbmx5X29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIHZhciB0YXNrID0gZW5zdXJlQXN5bmMoZm4pO1xuICAgICAgICBmdW5jdGlvbiBuZXh0KGVycikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBkb25lKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YXNrKG5leHQpO1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZW5zdXJlQXN5bmMoZm4pIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICBhcmdzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBpbm5lckFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgaWYgKHN5bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGlubmVyQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGlubmVyQXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgc3luYyA9IHRydWU7XG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuZW5zdXJlQXN5bmMgPSBlbnN1cmVBc3luYztcblxuICAgIGFzeW5jLmNvbnN0YW50ID0gX3Jlc3RQYXJhbShmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbbnVsbF0uY29uY2F0KHZhbHVlcyk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFzeW5jLndyYXBTeW5jID1cbiAgICBhc3luYy5hc3luY2lmeSA9IGZ1bmN0aW9uIGFzeW5jaWZ5KGZ1bmMpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIHJlc3VsdCBpcyBQcm9taXNlIG9iamVjdFxuICAgICAgICAgICAgaWYgKF9pc09iamVjdChyZXN1bHQpICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pW1wiY2F0Y2hcIl0oZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyci5tZXNzYWdlID8gZXJyIDogbmV3IEVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gTm9kZS5qc1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFzeW5jO1xuICAgIH1cbiAgICAvLyBBTUQgLyBSZXF1aXJlSlNcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmM7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBpbmNsdWRlZCBkaXJlY3RseSB2aWEgPHNjcmlwdD4gdGFnXG4gICAgZWxzZSB7XG4gICAgICAgIHJvb3QuYXN5bmMgPSBhc3luYztcbiAgICB9XG5cbn0oKSk7XG4iLCIvKipcbiAqIEdldCBhdmVyYWdlIHZhbHVlLlxuICogQGZ1bmN0aW9uIGF2ZVxuICogQHBhcmFtIHsuLi5udW1iZXJ9IHZhbHVlcyAtIFZhbHVlcyB0byBhdmUuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSAtIEF2ZXJhZ2UgdmFsdWUuXG4gKi9cblxuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3Qgc3VtID0gcmVxdWlyZSgnLi9zdW0nKTtcblxuLyoqIEBsZW5kcyBhdmUgKi9cbmZ1bmN0aW9uIGF2ZSgpIHtcbiAgICBsZXQgYXJncyA9IGFyZ3VtZW50cztcbiAgICBsZXQgdmFsdWVzID0gMCwgc2l6ZSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbCA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHNpemUgKz0gdmFsLmxlbmd0aDtcbiAgICAgICAgICAgIHZhbCA9IHN1bS5hcHBseShzdW0sIHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzaXplICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWVzICs9IHZhbDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcyAvIHNpemU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXZlO1xuXG4iLCIvKipcbiAqIEJhc2ljIG51bWVyaWMgY2FsY3VsYXRpb24gZnVuY3Rpb25zLlxuICogQG1vZHVsZSBudW1jYWxcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0IGF2ZSgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vYXZlJyk7IH0sXG4gICAgZ2V0IG1heCgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vbWF4Jyk7IH0sXG4gICAgZ2V0IG1pbigpIHsgcmV0dXJuIHJlcXVpcmUoJy4vbWluJyk7IH0sXG4gICAgZ2V0IHN1bSgpIHsgcmV0dXJuIHJlcXVpcmUoJy4vc3VtJyk7IH1cbn07IiwiLyoqXG4gKiBGaW5kIG1heCB2YWx1ZS5cbiAqIEBmdW5jdGlvbiBtYXhcbiAqIEBwYXJhbSB7Li4ubnVtYmVyfSB2YWx1ZXMgLSBWYWx1ZXMgdG8gY29tcGFyZS5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IC0gTWF4IG51bWJlci5cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKiogQGxlbmRzIG1heCAqL1xuZnVuY3Rpb24gbWF4KCkge1xuICAgIGxldCBhcmdzID0gYXJndW1lbnRzO1xuICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbCA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHZhbCA9IG1heC5hcHBseShtYXgsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGhpdCA9IChyZXN1bHQgPT09IHVuZGVmaW5lZCkgfHwgKHZhbCA+IHJlc3VsdCk7XG4gICAgICAgIGlmIChoaXQpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHZhbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1heDtcblxuIiwiLyoqXG4gKiBGaW5kIG1pbiB2YWx1ZS5cbiAqIEBmdW5jdGlvbiBtaW5cbiAqIEBwYXJhbSB7Li4ubnVtYmVyfSB2YWx1ZXMgLSBWYWx1ZXMgdG8gY29tcGFyZS5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IC0gTWluIG51bWJlci5cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKiogQGxlbmRzIG1pbiAqL1xuZnVuY3Rpb24gbWluKCkge1xuICAgIGxldCBhcmdzID0gYXJndW1lbnRzO1xuICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbCA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHZhbCA9IG1pbi5hcHBseShtaW4sIHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGhpdCA9IChyZXN1bHQgPT09IHVuZGVmaW5lZCkgfHwgKHZhbCA8IHJlc3VsdCk7XG4gICAgICAgIGlmIChoaXQpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHZhbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1pbjtcblxuIiwiLyoqXG4gKiBHZXQgc3VtIHZhbHVlLlxuICogQGZ1bmN0aW9uIHN1bVxuICogQHBhcmFtIHsuLi5udW1iZXJ9IHZhbHVlcyAtIFZhbHVlcyB0byBzdW0uXG4gKiBAcmV0dXJucyB7bnVtYmVyfSAtIFN1bSB2YWx1ZS5cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKiogQGxlbmRzIHN1bSAqL1xuZnVuY3Rpb24gc3VtKCkge1xuICAgIGxldCBhcmdzID0gYXJndW1lbnRzO1xuICAgIGxldCByZXN1bHQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBhcmdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGxldCB2YWwgPSBhcmdzW2ldO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgICAgICB2YWwgPSBzdW0uYXBwbHkoc3VtLCB2YWwpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSB2YWw7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VtO1xuXG4iLCJcbnZhciBybmc7XG5cbmlmIChnbG9iYWwuY3J5cHRvICYmIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgLy8gV0hBVFdHIGNyeXB0by1iYXNlZCBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gIC8vIE1vZGVyYXRlbHkgZmFzdCwgaGlnaCBxdWFsaXR5XG4gIHZhciBfcm5kczggPSBuZXcgVWludDhBcnJheSgxNik7XG4gIHJuZyA9IGZ1bmN0aW9uIHdoYXR3Z1JORygpIHtcbiAgICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKF9ybmRzOCk7XG4gICAgcmV0dXJuIF9ybmRzODtcbiAgfTtcbn1cblxuaWYgKCFybmcpIHtcbiAgLy8gTWF0aC5yYW5kb20oKS1iYXNlZCAoUk5HKVxuICAvL1xuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIE1hdGgucmFuZG9tKCkuICBJdCdzIGZhc3QsIGJ1dCBpcyBvZiB1bnNwZWNpZmllZFxuICAvLyBxdWFsaXR5LlxuICB2YXIgIF9ybmRzID0gbmV3IEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCAxNjsgaSsrKSB7XG4gICAgICBpZiAoKGkgJiAweDAzKSA9PT0gMCkgciA9IE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDtcbiAgICAgIF9ybmRzW2ldID0gciA+Pj4gKChpICYgMHgwMykgPDwgMykgJiAweGZmO1xuICAgIH1cblxuICAgIHJldHVybiBfcm5kcztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBybmc7XG5cbiIsIi8vICAgICB1dWlkLmpzXG4vL1xuLy8gICAgIENvcHlyaWdodCAoYykgMjAxMC0yMDEyIFJvYmVydCBLaWVmZmVyXG4vLyAgICAgTUlUIExpY2Vuc2UgLSBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG5cbi8vIFVuaXF1ZSBJRCBjcmVhdGlvbiByZXF1aXJlcyBhIGhpZ2ggcXVhbGl0eSByYW5kb20gIyBnZW5lcmF0b3IuICBXZSBmZWF0dXJlXG4vLyBkZXRlY3QgdG8gZGV0ZXJtaW5lIHRoZSBiZXN0IFJORyBzb3VyY2UsIG5vcm1hbGl6aW5nIHRvIGEgZnVuY3Rpb24gdGhhdFxuLy8gcmV0dXJucyAxMjgtYml0cyBvZiByYW5kb21uZXNzLCBzaW5jZSB0aGF0J3Mgd2hhdCdzIHVzdWFsbHkgcmVxdWlyZWRcbnZhciBfcm5nID0gcmVxdWlyZSgnLi9ybmcnKTtcblxuLy8gTWFwcyBmb3IgbnVtYmVyIDwtPiBoZXggc3RyaW5nIGNvbnZlcnNpb25cbnZhciBfYnl0ZVRvSGV4ID0gW107XG52YXIgX2hleFRvQnl0ZSA9IHt9O1xuZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICBfYnl0ZVRvSGV4W2ldID0gKGkgKyAweDEwMCkudG9TdHJpbmcoMTYpLnN1YnN0cigxKTtcbiAgX2hleFRvQnl0ZVtfYnl0ZVRvSGV4W2ldXSA9IGk7XG59XG5cbi8vICoqYHBhcnNlKClgIC0gUGFyc2UgYSBVVUlEIGludG8gaXQncyBjb21wb25lbnQgYnl0ZXMqKlxuZnVuY3Rpb24gcGFyc2UocywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSAoYnVmICYmIG9mZnNldCkgfHwgMCwgaWkgPSAwO1xuXG4gIGJ1ZiA9IGJ1ZiB8fCBbXTtcbiAgcy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1swLTlhLWZdezJ9L2csIGZ1bmN0aW9uKG9jdCkge1xuICAgIGlmIChpaSA8IDE2KSB7IC8vIERvbid0IG92ZXJmbG93IVxuICAgICAgYnVmW2kgKyBpaSsrXSA9IF9oZXhUb0J5dGVbb2N0XTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFplcm8gb3V0IHJlbWFpbmluZyBieXRlcyBpZiBzdHJpbmcgd2FzIHNob3J0XG4gIHdoaWxlIChpaSA8IDE2KSB7XG4gICAgYnVmW2kgKyBpaSsrXSA9IDA7XG4gIH1cblxuICByZXR1cm4gYnVmO1xufVxuXG4vLyAqKmB1bnBhcnNlKClgIC0gQ29udmVydCBVVUlEIGJ5dGUgYXJyYXkgKGFsYSBwYXJzZSgpKSBpbnRvIGEgc3RyaW5nKipcbmZ1bmN0aW9uIHVucGFyc2UoYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBvZmZzZXQgfHwgMCwgYnRoID0gX2J5dGVUb0hleDtcbiAgcmV0dXJuICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV07XG59XG5cbi8vICoqYHYxKClgIC0gR2VuZXJhdGUgdGltZS1iYXNlZCBVVUlEKipcbi8vXG4vLyBJbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vTGlvc0svVVVJRC5qc1xuLy8gYW5kIGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS91dWlkLmh0bWxcblxuLy8gcmFuZG9tICMncyB3ZSBuZWVkIHRvIGluaXQgbm9kZSBhbmQgY2xvY2tzZXFcbnZhciBfc2VlZEJ5dGVzID0gX3JuZygpO1xuXG4vLyBQZXIgNC41LCBjcmVhdGUgYW5kIDQ4LWJpdCBub2RlIGlkLCAoNDcgcmFuZG9tIGJpdHMgKyBtdWx0aWNhc3QgYml0ID0gMSlcbnZhciBfbm9kZUlkID0gW1xuICBfc2VlZEJ5dGVzWzBdIHwgMHgwMSxcbiAgX3NlZWRCeXRlc1sxXSwgX3NlZWRCeXRlc1syXSwgX3NlZWRCeXRlc1szXSwgX3NlZWRCeXRlc1s0XSwgX3NlZWRCeXRlc1s1XVxuXTtcblxuLy8gUGVyIDQuMi4yLCByYW5kb21pemUgKDE0IGJpdCkgY2xvY2tzZXFcbnZhciBfY2xvY2tzZXEgPSAoX3NlZWRCeXRlc1s2XSA8PCA4IHwgX3NlZWRCeXRlc1s3XSkgJiAweDNmZmY7XG5cbi8vIFByZXZpb3VzIHV1aWQgY3JlYXRpb24gdGltZVxudmFyIF9sYXN0TVNlY3MgPSAwLCBfbGFzdE5TZWNzID0gMDtcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjEob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG4gIHZhciBiID0gYnVmIHx8IFtdO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBjbG9ja3NlcSA9IG9wdGlvbnMuY2xvY2tzZXEgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuY2xvY2tzZXEgOiBfY2xvY2tzZXE7XG5cbiAgLy8gVVVJRCB0aW1lc3RhbXBzIGFyZSAxMDAgbmFuby1zZWNvbmQgdW5pdHMgc2luY2UgdGhlIEdyZWdvcmlhbiBlcG9jaCxcbiAgLy8gKDE1ODItMTAtMTUgMDA6MDApLiAgSlNOdW1iZXJzIGFyZW4ndCBwcmVjaXNlIGVub3VnaCBmb3IgdGhpcywgc29cbiAgLy8gdGltZSBpcyBoYW5kbGVkIGludGVybmFsbHkgYXMgJ21zZWNzJyAoaW50ZWdlciBtaWxsaXNlY29uZHMpIGFuZCAnbnNlY3MnXG4gIC8vICgxMDAtbmFub3NlY29uZHMgb2Zmc2V0IGZyb20gbXNlY3MpIHNpbmNlIHVuaXggZXBvY2gsIDE5NzAtMDEtMDEgMDA6MDAuXG4gIHZhciBtc2VjcyA9IG9wdGlvbnMubXNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubXNlY3MgOiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAvLyBQZXIgNC4yLjEuMiwgdXNlIGNvdW50IG9mIHV1aWQncyBnZW5lcmF0ZWQgZHVyaW5nIHRoZSBjdXJyZW50IGNsb2NrXG4gIC8vIGN5Y2xlIHRvIHNpbXVsYXRlIGhpZ2hlciByZXNvbHV0aW9uIGNsb2NrXG4gIHZhciBuc2VjcyA9IG9wdGlvbnMubnNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubnNlY3MgOiBfbGFzdE5TZWNzICsgMTtcblxuICAvLyBUaW1lIHNpbmNlIGxhc3QgdXVpZCBjcmVhdGlvbiAoaW4gbXNlY3MpXG4gIHZhciBkdCA9IChtc2VjcyAtIF9sYXN0TVNlY3MpICsgKG5zZWNzIC0gX2xhc3ROU2VjcykvMTAwMDA7XG5cbiAgLy8gUGVyIDQuMi4xLjIsIEJ1bXAgY2xvY2tzZXEgb24gY2xvY2sgcmVncmVzc2lvblxuICBpZiAoZHQgPCAwICYmIG9wdGlvbnMuY2xvY2tzZXEgPT09IHVuZGVmaW5lZCkge1xuICAgIGNsb2Nrc2VxID0gY2xvY2tzZXEgKyAxICYgMHgzZmZmO1xuICB9XG5cbiAgLy8gUmVzZXQgbnNlY3MgaWYgY2xvY2sgcmVncmVzc2VzIChuZXcgY2xvY2tzZXEpIG9yIHdlJ3ZlIG1vdmVkIG9udG8gYSBuZXdcbiAgLy8gdGltZSBpbnRlcnZhbFxuICBpZiAoKGR0IDwgMCB8fCBtc2VjcyA+IF9sYXN0TVNlY3MpICYmIG9wdGlvbnMubnNlY3MgPT09IHVuZGVmaW5lZCkge1xuICAgIG5zZWNzID0gMDtcbiAgfVxuXG4gIC8vIFBlciA0LjIuMS4yIFRocm93IGVycm9yIGlmIHRvbyBtYW55IHV1aWRzIGFyZSByZXF1ZXN0ZWRcbiAgaWYgKG5zZWNzID49IDEwMDAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1dWlkLnYxKCk6IENhblxcJ3QgY3JlYXRlIG1vcmUgdGhhbiAxME0gdXVpZHMvc2VjJyk7XG4gIH1cblxuICBfbGFzdE1TZWNzID0gbXNlY3M7XG4gIF9sYXN0TlNlY3MgPSBuc2VjcztcbiAgX2Nsb2Nrc2VxID0gY2xvY2tzZXE7XG5cbiAgLy8gUGVyIDQuMS40IC0gQ29udmVydCBmcm9tIHVuaXggZXBvY2ggdG8gR3JlZ29yaWFuIGVwb2NoXG4gIG1zZWNzICs9IDEyMjE5MjkyODAwMDAwO1xuXG4gIC8vIGB0aW1lX2xvd2BcbiAgdmFyIHRsID0gKChtc2VjcyAmIDB4ZmZmZmZmZikgKiAxMDAwMCArIG5zZWNzKSAlIDB4MTAwMDAwMDAwO1xuICBiW2krK10gPSB0bCA+Pj4gMjQgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gMTYgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gOCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsICYgMHhmZjtcblxuICAvLyBgdGltZV9taWRgXG4gIHZhciB0bWggPSAobXNlY3MgLyAweDEwMDAwMDAwMCAqIDEwMDAwKSAmIDB4ZmZmZmZmZjtcbiAgYltpKytdID0gdG1oID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdG1oICYgMHhmZjtcblxuICAvLyBgdGltZV9oaWdoX2FuZF92ZXJzaW9uYFxuICBiW2krK10gPSB0bWggPj4+IDI0ICYgMHhmIHwgMHgxMDsgLy8gaW5jbHVkZSB2ZXJzaW9uXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMTYgJiAweGZmO1xuXG4gIC8vIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYCAoUGVyIDQuMi4yIC0gaW5jbHVkZSB2YXJpYW50KVxuICBiW2krK10gPSBjbG9ja3NlcSA+Pj4gOCB8IDB4ODA7XG5cbiAgLy8gYGNsb2NrX3NlcV9sb3dgXG4gIGJbaSsrXSA9IGNsb2Nrc2VxICYgMHhmZjtcblxuICAvLyBgbm9kZWBcbiAgdmFyIG5vZGUgPSBvcHRpb25zLm5vZGUgfHwgX25vZGVJZDtcbiAgZm9yICh2YXIgbiA9IDA7IG4gPCA2OyBuKyspIHtcbiAgICBiW2kgKyBuXSA9IG5vZGVbbl07XG4gIH1cblxuICByZXR1cm4gYnVmID8gYnVmIDogdW5wYXJzZShiKTtcbn1cblxuLy8gKipgdjQoKWAgLSBHZW5lcmF0ZSByYW5kb20gVVVJRCoqXG5cbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYnJvb2ZhL25vZGUtdXVpZCBmb3IgQVBJIGRldGFpbHNcbmZ1bmN0aW9uIHY0KG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gIC8vIERlcHJlY2F0ZWQgLSAnZm9ybWF0JyBhcmd1bWVudCwgYXMgc3VwcG9ydGVkIGluIHYxLjJcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG5cbiAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSAnc3RyaW5nJykge1xuICAgIGJ1ZiA9IG9wdGlvbnMgPT0gJ2JpbmFyeScgPyBuZXcgQXJyYXkoMTYpIDogbnVsbDtcbiAgICBvcHRpb25zID0gbnVsbDtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgcm5kcyA9IG9wdGlvbnMucmFuZG9tIHx8IChvcHRpb25zLnJuZyB8fCBfcm5nKSgpO1xuXG4gIC8vIFBlciA0LjQsIHNldCBiaXRzIGZvciB2ZXJzaW9uIGFuZCBgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZGBcbiAgcm5kc1s2XSA9IChybmRzWzZdICYgMHgwZikgfCAweDQwO1xuICBybmRzWzhdID0gKHJuZHNbOF0gJiAweDNmKSB8IDB4ODA7XG5cbiAgLy8gQ29weSBieXRlcyB0byBidWZmZXIsIGlmIHByb3ZpZGVkXG4gIGlmIChidWYpIHtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgMTY7IGlpKyspIHtcbiAgICAgIGJ1ZltpICsgaWldID0gcm5kc1tpaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZiB8fCB1bnBhcnNlKHJuZHMpO1xufVxuXG4vLyBFeHBvcnQgcHVibGljIEFQSVxudmFyIHV1aWQgPSB2NDtcbnV1aWQudjEgPSB2MTtcbnV1aWQudjQgPSB2NDtcbnV1aWQucGFyc2UgPSBwYXJzZTtcbnV1aWQudW5wYXJzZSA9IHVucGFyc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gdXVpZDtcbiJdfQ==
