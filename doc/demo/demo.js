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

    type: _react.PropTypes.string,
    style: _react.PropTypes.object
  },
  getDefaultProps: function getDefaultProps() {
    return {

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4wLjAvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8ubnZtL3ZlcnNpb25zL25vZGUvdjYuMC4wL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwiLi4vLi4vLi4vLm52bS92ZXJzaW9ucy9ub2RlL3Y2LjAuMC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsImRvYy9kZW1vL2RlbW8uYnJvd3Nlci5qcyIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2RvYy9kZW1vL2RlbW8uY29tcG9uZW50LmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2xpYi9hcF91cGxvYWQuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC11cGxvYWQvbGliL2FwX3VwbG9hZF9zdHlsZS5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfYmlnX2J1dHRvbi5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfYnV0dG9uLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9hcF9idXR0b25fZ3JvdXAuanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2J1dHRvbl9zdHlsZS5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfY2VsbF9idXR0b24uanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2NlbGxfYnV0dG9uX3Jvdy5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfaWNvbl9idXR0b24uanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX2ljb25fYnV0dG9uX3Jvdy5qc3giLCIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LWJ1dHRvbi9saWIvYXBfbmV4dF9idXR0b24uanN4IiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1idXR0b24vbGliL2FwX3ByZXZfYnV0dG9uLmpzeCIsIm5vZGVfbW9kdWxlcy9hcGVtYW4tcmVhY3QtYnV0dG9uL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtaW1hZ2UvbGliL2FwX2ltYWdlLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtaW1hZ2UvbGliL2FwX2ltYWdlX3N0eWxlLmpzeCIsIm5vZGVfbW9kdWxlcy9hcGVtYW4tcmVhY3QtaW1hZ2UvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2FwZW1hbi1yZWFjdC1pbWFnZS9saWIvc2l6aW5nL3NjYWxlZF9zaXplLmpzIiwiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC1zcGlubmVyL2xpYi9hcF9zcGlubmVyLmpzeCIsIi9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3Qtc3Bpbm5lci9saWIvYXBfc3Bpbm5lcl9zdHlsZS5qc3giLCJub2RlX21vZHVsZXMvYXBlbWFuLXJlYWN0LXNwaW5uZXIvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2FzeW5jL2xpYi9hc3luYy5qcyIsIm5vZGVfbW9kdWxlcy9udW1jYWwvbGliL2F2ZS5qcyIsIm5vZGVfbW9kdWxlcy9udW1jYWwvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvbWF4LmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvbWluLmpzIiwibm9kZV9tb2R1bGVzL251bWNhbC9saWIvc3VtLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvcm5nLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXVpZC91dWlkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpXG5jb25zdCBSZWFjdERPTSA9IHJlcXVpcmUoJ3JlYWN0LWRvbScpXG5cbmNvbnN0IERlbW8gPSByZXF1aXJlKCcuL2RlbW8uY29tcG9uZW50LmpzJykuZGVmYXVsdFxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIG9uTG9hZCAoKSB7XG4gIHdpbmRvdy5SZWFjdCA9IFJlYWN0XG4gIGxldCBEZW1vRmFjdG9yeSA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoRGVtbylcbiAgUmVhY3RET00ucmVuZGVyKERlbW9GYWN0b3J5KCksIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZW1vLXdyYXAnKSlcbn0pXG4iLCIndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IEFwVXBsb2FkIGZyb20gJy4uLy4uL2xpYi9hcF91cGxvYWQnXG5pbXBvcnQgQXBVcGxvYWRTdHlsZSBmcm9tICcuLi8uLi9saWIvYXBfdXBsb2FkX3N0eWxlJ1xuaW1wb3J0IHtBcEltYWdlU3R5bGV9IGZyb20gJ2FwZW1hbi1yZWFjdC1pbWFnZSdcbmltcG9ydCB7QXBTcGlubmVyU3R5bGV9IGZyb20gJ2FwZW1hbi1yZWFjdC1zcGlubmVyJ1xuaW1wb3J0IHtBcEJ1dHRvblN0eWxlfSBmcm9tICdhcGVtYW4tcmVhY3QtYnV0dG9uJ1xuXG5jb25zdCBERU1PX0lNQUdFUyA9IFtcbiAgJ2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9hcGVtYW4tYXNzZXQtbGFiby9hcGVtYW4tYXNzZXQtaW1hZ2VzL21hc3Rlci9kaXN0L2R1bW15LzEyLmpwZydcbl1cblxuY29uc3QgRGVtbyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8QXBTcGlubmVyU3R5bGUgLz5cbiAgICAgICAgPEFwQnV0dG9uU3R5bGUgaGlnaGxpZ2h0Q29sb3I9XCIjYjM1NjAwXCIvPlxuICAgICAgICA8QXBJbWFnZVN0eWxlIC8+XG4gICAgICAgIDxBcFVwbG9hZFN0eWxlIC8+XG4gICAgICAgIDxBcFVwbG9hZCBtdWx0aXBsZT17IHRydWUgfVxuICAgICAgICAgICAgICAgICAgaWQ9XCJkZW1vLWZpbGUtdXBsb2FkLTAxXCJcbiAgICAgICAgICAgICAgICAgIG5hbWU9XCJmaWxlLWlucHV0LTAxXCJcbiAgICAgICAgICAgICAgICAgIGFjY2VwdD1cImltYWdlLypcIlxuICAgICAgICAgICAgICAgICAgb25Mb2FkPXsgcy5oYW5kbGVMb2FkZWQgfT5cbiAgICAgICAgPC9BcFVwbG9hZD5cblxuICAgICAgICA8QXBVcGxvYWQgbXVsdGlwbGU9eyB0cnVlIH1cbiAgICAgICAgICAgICAgICAgIGlkPVwiZGVtby1maWxlLXVwbG9hZC0wMlwiXG4gICAgICAgICAgICAgICAgICBuYW1lPVwiZmlsZS1pbnB1dC0wMlwiXG4gICAgICAgICAgICAgICAgICBhY2NlcHQ9XCJpbWFnZS8qXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXsgREVNT19JTUFHRVMgfVxuICAgICAgICAgICAgICAgICAgb25Mb2FkPXsgcy5oYW5kbGVMb2FkZWQgfT5cbiAgICAgICAgPC9BcFVwbG9hZD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfSxcbiAgaGFuZGxlTG9hZGVkIChldikge1xuICAgIGNvbnNvbGUubG9nKCdyZXN1bHQnLCBldi50YXJnZXQsIGV2LnVybHMpXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IERlbW9cbiIsIi8qKlxuICogYXBlbWFuIHJlYWN0IHBhY2thZ2UgZm9yIGZpbGUgdXBsb2FkIGNvbXBvbmVudHMuXG4gKiBAY2xhc3MgQXBVcGxvYWRcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQgYXN5bmMgZnJvbSAnYXN5bmMnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHV1aWQgZnJvbSAndXVpZCdcbmltcG9ydCB7QXBJbWFnZX0gZnJvbSAnYXBlbWFuLXJlYWN0LWltYWdlJ1xuaW1wb3J0IHtBcFNwaW5uZXJ9IGZyb20gJ2FwZW1hbi1yZWFjdC1zcGlubmVyJ1xuaW1wb3J0IHtBcEJ1dHRvbn0gZnJvbSAnYXBlbWFuLXJlYWN0LWJ1dHRvbidcblxuLyoqIEBsZW5kcyBBcFVwbG9hZCAqL1xuY29uc3QgQXBVcGxvYWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICAvKiogTmFtZSBvZiBpbnB1dCAqL1xuICAgIG5hbWU6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogRE9NIGlkIG9mIGlucHV0ICovXG4gICAgaWQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogQWxsb3cgbXVsdGlwbGUgdXBsb2FkICovXG4gICAgbXVsdGlwbGU6IHR5cGVzLmJvb2wsXG4gICAgLyoqIEhhbmRsZXIgZm9yIGNoYW5nZSBldmVudCAqL1xuICAgIG9uQ2hhbmdlOiB0eXBlcy5mdW5jLFxuICAgIC8qKiBIYW5kbGVyIGZvciBsb2FkIGV2ZW50ICovXG4gICAgb25Mb2FkOiB0eXBlcy5mdW5jLFxuICAgIC8qKiBIYW5kbGVyIGZvciBlcnJvciBldmVudCAqL1xuICAgIG9uRXJyb3I6IHR5cGVzLmZ1bmMsXG4gICAgLyoqIEltYWdlIHdpZHRoICovXG4gICAgd2lkdGg6IHR5cGVzLm51bWJlcixcbiAgICAvKiogSW1hZ2UgaGVpZ2h0ICovXG4gICAgaGVpZ2h0OiB0eXBlcy5udW1iZXIsXG4gICAgLyoqIEd1aWRlIHRleHQgKi9cbiAgICB0ZXh0OiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIEFjY2VwdCBmaWxlIHR5cGUgKi9cbiAgICBhY2NlcHQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogR3VpZGUgaWNvbiAqL1xuICAgIGljb246IHR5cGVzLnN0cmluZyxcbiAgICAvKiogSWNvbiBmb3IgY2xvc2UgaW1hZ2VzICovXG4gICAgY2xvc2VJY29uOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIFNwaW5uZXIgdGhlbWUgKi9cbiAgICBzcGlubmVyOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIFZhbHVlIG9mIGlucHV0ICovXG4gICAgdmFsdWU6IHR5cGVzLm9uZU9mVHlwZShbXG4gICAgICB0eXBlcy5zdHJpbmcsXG4gICAgICB0eXBlcy5hcnJheVxuICAgIF0pXG4gIH0sXG5cbiAgbWl4aW5zOiBbXSxcblxuICBzdGF0aWNzOiB7XG4gICAgcmVhZEZpbGUgKGZpbGUsIGNhbGxiYWNrKSB7XG4gICAgICBsZXQgcmVhZGVyID0gbmV3IHdpbmRvdy5GaWxlUmVhZGVyKClcbiAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gb25lcnJvciAoZXJyKSB7XG4gICAgICAgIGNhbGxiYWNrKGVycilcbiAgICAgIH1cbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiBvbmxvYWQgKGV2KSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGV2LnRhcmdldC5yZXN1bHQpXG4gICAgICB9XG4gICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKVxuICAgIH0sXG4gICAgaXNJbWFnZVVybCAodXJsKSB7XG4gICAgICBjb25zdCBpbWFnZUV4dGVuc2lvbnMgPSBbXG4gICAgICAgICcuanBnJyxcbiAgICAgICAgJy5qcGVnJyxcbiAgICAgICAgJy5zdmcnLFxuICAgICAgICAnLmdpZicsXG4gICAgICAgICcucG5nJ1xuICAgICAgXVxuICAgICAgcmV0dXJuIC9eZGF0YTppbWFnZS8udGVzdCh1cmwpIHx8ICEhfmltYWdlRXh0ZW5zaW9ucy5pbmRleE9mKHBhdGguZXh0bmFtZSh1cmwpKVxuICAgIH1cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcbiAgICBsZXQgaGFzVmFsdWUgPSBwcm9wcy52YWx1ZSAmJiBwcm9wcy52YWx1ZS5sZW5ndGggPiAwXG4gICAgcmV0dXJuIHtcbiAgICAgIHNwaW5uaW5nOiBmYWxzZSxcbiAgICAgIGVycm9yOiBudWxsLFxuICAgICAgdXJsczogaGFzVmFsdWUgPyBbXS5jb25jYXQocHJvcHMudmFsdWUpIDogbnVsbFxuICAgIH1cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBudWxsLFxuICAgICAgaWQ6IGBhcC11cGxvYWQtJHt1dWlkLnY0KCl9YCxcbiAgICAgIG11bHRpcGxlOiBmYWxzZSxcbiAgICAgIHdpZHRoOiAxODAsXG4gICAgICBoZWlnaHQ6IDE4MCxcbiAgICAgIGFjY2VwdDogbnVsbCxcbiAgICAgIHRleHQ6ICdVcGxvYWQgZmlsZScsXG4gICAgICBpY29uOiAnZmEgZmEtY2xvdWQtdXBsb2FkJyxcbiAgICAgIGNsb3NlSWNvbjogJ2ZhIGZhLWNsb3NlJyxcbiAgICAgIHNwaW5uZXJJY29uOiBBcFNwaW5uZXIuREVGQVVMVF9USEVNRSxcbiAgICAgIG9uQ2hhbmdlOiBudWxsLFxuICAgICAgb25Mb2FkOiBudWxsLFxuICAgICAgb25FcnJvcjogbnVsbFxuICAgIH1cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgc3RhdGUsIHByb3BzIH0gPSBzXG4gICAgbGV0IHsgd2lkdGgsIGhlaWdodCB9ID0gcHJvcHNcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzbmFtZXMoJ2FwLXVwbG9hZCcsIHByb3BzLmNsYXNzTmFtZSl9XG4gICAgICAgICAgIHN0eWxlPXtPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSl9PlxuICAgICAgICA8aW5wdXQgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWlucHV0XCJcbiAgICAgICAgICAgICAgIG11bHRpcGxlPXsgcHJvcHMubXVsdGlwbGUgfVxuICAgICAgICAgICAgICAgbmFtZT17IHByb3BzLm5hbWUgfVxuICAgICAgICAgICAgICAgaWQ9eyBwcm9wcy5pZCB9XG4gICAgICAgICAgICAgICBhY2NlcHQ9eyBwcm9wcy5hY2NlcHQgfVxuICAgICAgICAgICAgICAgb25DaGFuZ2U9e3MuaGFuZGxlQ2hhbmdlfVxuICAgICAgICAgICAgICAgc3R5bGU9e3t3aWR0aCwgaGVpZ2h0fX1cbiAgICAgICAgLz5cbiAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1sYWJlbFwiIGh0bWxGb3I9eyBwcm9wcy5pZCB9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC11cGxvYWQtYWxpZ25lclwiPlxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1sYWJlbC1pbm5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcyhcImFwLXVwbG9hZC1pY29uXCIsIHByb3BzLmljb24pIH0vPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLXRleHRcIj57cHJvcHMudGV4dH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgeyBzLl9yZW5kZXJQcmV2aWV3SW1hZ2Uoc3RhdGUudXJscywgd2lkdGgsIGhlaWdodCkgfVxuICAgICAgICB7IHMuX3JlbmRlclJlbW92ZUJ1dHRvbighIShzdGF0ZS51cmxzICYmIHN0YXRlLnVybHMubGVuZ3RoID4gMCksIHByb3BzLmNsb3NlSWNvbikgfVxuICAgICAgICB7IHMuX3JlbmRlclNwaW5uZXIoc3RhdGUuc3Bpbm5pbmcsIHByb3BzLnNwaW5uZXIpIH1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBMaWZlY3ljbGVcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gQ3VzdG9tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGhhbmRsZUNoYW5nZSAoZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcbiAgICBsZXQgeyB0YXJnZXQgfSA9IGVcbiAgICBsZXQgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0YXJnZXQuZmlsZXMsIDApXG5cbiAgICBsZXQgeyBvbkNoYW5nZSwgb25FcnJvciwgb25Mb2FkIH0gPSBwcm9wc1xuXG4gICAgcy5zZXRTdGF0ZSh7IHNwaW5uaW5nOiB0cnVlIH0pXG4gICAgaWYgKG9uQ2hhbmdlKSB7XG4gICAgICBvbkNoYW5nZShlKVxuICAgIH1cbiAgICBhc3luYy5jb25jYXQoZmlsZXMsIEFwVXBsb2FkLnJlYWRGaWxlLCAoZXJyLCB1cmxzKSA9PiB7XG4gICAgICBlLnVybHMgPSB1cmxzXG4gICAgICBlLnRhcmdldCA9IHRhcmdldFxuICAgICAgcy5zZXRTdGF0ZSh7XG4gICAgICAgIHNwaW5uaW5nOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycixcbiAgICAgICAgdXJsczogdXJsc1xuICAgICAgfSlcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgaWYgKG9uRXJyb3IpIHtcbiAgICAgICAgICBvbkVycm9yKGVycilcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG9uTG9hZCkge1xuICAgICAgICAgIG9uTG9hZChlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfSxcblxuICBoYW5kbGVSZW1vdmUgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcbiAgICBsZXQgeyBvbkxvYWQgfSA9IHByb3BzXG4gICAgcy5zZXRTdGF0ZSh7XG4gICAgICBlcnJvcjogbnVsbCxcbiAgICAgIHVybHM6IG51bGxcbiAgICB9KVxuICAgIGlmIChvbkxvYWQpIHtcbiAgICAgIG9uTG9hZChbXSlcbiAgICB9XG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFByaXZhdGVcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgX3JlbmRlclNwaW5uZXIgKHNwaW5uaW5nLCB0aGVtZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgcmV0dXJuIChcbiAgICAgIDxBcFNwaW5uZXIgZW5hYmxlZD17c3Bpbm5pbmd9IHRoZW1lPXt0aGVtZX0+XG4gICAgICA8L0FwU3Bpbm5lcj5cbiAgICApXG4gIH0sXG5cbiAgX3JlbmRlclJlbW92ZUJ1dHRvbiAocmVtb3ZhYmxlLCBpY29uKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBpZiAoIXJlbW92YWJsZSkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgIDxBcEJ1dHRvbiBvblRhcD17IHMuaGFuZGxlUmVtb3ZlIH0gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLXJlbW92ZS1idXR0b25cIj5cbiAgICAgICAgPGkgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcyhcImFwLXVwbG9hZC1yZW1vdmUtaWNvblwiLCBpY29uKSB9Lz5cbiAgICAgIDwvQXBCdXR0b24+XG4gICAgKVxuICB9LFxuXG4gIF9yZW5kZXJQcmV2aWV3SW1hZ2UgKHVybHMsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICBpZiAoIXVybHMpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgcmV0dXJuIHVybHNcbiAgICAgIC5maWx0ZXIoKHVybCkgPT4gQXBVcGxvYWQuaXNJbWFnZVVybCh1cmwpKVxuICAgICAgLm1hcCgodXJsLCBpKSA9PiAoXG4gICAgICAgIDxBcEltYWdlIGtleT17IHVybCB9XG4gICAgICAgICAgICAgICAgIHNyYz17IHVybCB9XG4gICAgICAgICAgICAgICAgIGhlaWdodD17IGhlaWdodCB9XG4gICAgICAgICAgICAgICAgIHdpZHRoPXsgd2lkdGggfVxuICAgICAgICAgICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC11cGxvYWQtcHJldmlldy1pbWFnZScpIH1cbiAgICAgICAgICAgICAgICAgc3R5bGU9eyB7IGxlZnQ6IGAke2kgKiAxMH0lYCwgdG9wOiBgJHtpICogMTB9JWAgfSB9XG4gICAgICAgICAgICAgICAgIHNjYWxlPVwiZml0XCI+XG4gICAgICAgIDwvQXBJbWFnZT5cbiAgICAgICkpXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwVXBsb2FkXG4iLCIvKipcbiAqIFN0eWxlIGZvciBBcFVwbG9hZC5cbiAqIEBjbGFzcyBBcFVwbG9hZFN0eWxlXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQge0FwU3R5bGV9IGZyb20gJ2FwZW1hbi1yZWFjdC1zdHlsZSdcblxuLyoqIEBsZW5kcyBBcFVwbG9hZFN0eWxlICovXG5jb25zdCBBcFVwbG9hZFN0eWxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBwcm9wVHlwZXM6IHtcbiAgICBzdHlsZTogdHlwZXMub2JqZWN0LFxuICAgIGhpZ2hsaWdodENvbG9yOiB0eXBlcy5zdHJpbmcsXG4gICAgYmFja2dyb3VuZENvbG9yOiB0eXBlcy5zdHJpbmdcbiAgfSxcbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3R5bGU6IHt9LFxuICAgICAgaGlnaGxpZ2h0Q29sb3I6IEFwU3R5bGUuREVGQVVMVF9ISUdITElHSFRfQ09MT1IsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IEFwU3R5bGUuREVGQVVMVF9CQUNLR1JPVU5EX0NPTE9SXG4gICAgfVxuICB9LFxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIGxldCB7IGhpZ2hsaWdodENvbG9yLCBiYWNrZ3JvdW5kQ29sb3IgfSA9IHByb3BzO1xuXG4gICAgbGV0IGRhdGEgPSB7XG4gICAgICAnLmFwLXVwbG9hZCc6IHtcbiAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICBjb2xvcjogJyM4ODgnLFxuICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbidcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZDpob3Zlcic6IHtcbiAgICAgICAgY29sb3I6ICcjNTU1J1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkOmFjdGl2ZSc6IHtcbiAgICAgICAgdGV4dFNoYWRvdzogJ25vbmUnLFxuICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICBjb2xvcjogJyM3NzcnXG4gICAgICB9LFxuICAgICAgJy5hcC11cGxvYWQtbGFiZWwnOiB7XG4gICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICB6SW5kZXg6IDEsXG4gICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBgJHtiYWNrZ3JvdW5kQ29sb3J9YCxcbiAgICAgICAgYm94U2hhZG93OiAnaW5zZXQgMXB4IDFweCAycHggcmdiYSgwLDAsMCwwLjMzKScsXG4gICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCAjQ0NDJyxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAnMnB4J1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkLWlucHV0Jzoge1xuICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICB6SW5kZXg6IDJcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1pY29uJzoge1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICBmb250U2l6ZTogJzJlbSdcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1sYWJlbC1pbm5lcic6IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHZlcnRpY2FsQWxpZ246ICdtaWRkbGUnXG4gICAgICB9LFxuICAgICAgJy5hcC11cGxvYWQtYWxpZ25lcic6IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHdpZHRoOiAnMXB4JyxcbiAgICAgICAgbWFyZ2luUmlnaHQ6ICctMXB4JyxcbiAgICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICB2ZXJ0aWNhbEFsaWduOiAnbWlkZGxlJ1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkIC5hcC1zcGlubmVyJzoge1xuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICB6SW5kZXg6IDgsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogYCR7YmFja2dyb3VuZENvbG9yfWAsXG4gICAgICAgIGNvbG9yOiAnI0RERCdcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1wcmV2aWV3LWltYWdlJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICAgIHpJbmRleDogNCxcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuICAgICAgICBib3JkZXI6ICcxcHggc29saWQgI0FBQSdcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1yZW1vdmUtYnV0dG9uJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHpJbmRleDogNSxcbiAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgcGFkZGluZzogJzhweCcsXG4gICAgICAgIGZvbnRTaXplOiAnMjRweCcsXG4gICAgICAgIGNvbG9yOiAnI0FBQScsXG4gICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwyNTUsMjU1LDAuMiknLFxuICAgICAgICBib3JkZXJSYWRpdXM6IDBcbiAgICAgIH0sXG4gICAgICAnLmFwLXVwbG9hZC1yZW1vdmUtYnV0dG9uOmhvdmVyJzoge1xuICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcbiAgICAgICAgY29sb3I6ICcjNTU1J1xuICAgICAgfSxcbiAgICAgICcuYXAtdXBsb2FkLXJlbW92ZS1idXR0b246YWN0aXZlJzoge1xuICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcbiAgICAgICAgY29sb3I6ICcjNTU1J1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgc21hbGxNZWRpYURhdGEgPSB7fVxuICAgIGxldCBtZWRpdW1NZWRpYURhdGEgPSB7fVxuICAgIGxldCBsYXJnZU1lZGlhRGF0YSA9IHt9XG4gICAgcmV0dXJuIChcbiAgICAgIDxBcFN0eWxlIGRhdGE9eyBPYmplY3QuYXNzaWduKGRhdGEsIHByb3BzLnN0eWxlKSB9XG4gICAgICAgICAgICAgICBzbWFsbE1lZGlhRGF0YT17IHNtYWxsTWVkaWFEYXRhIH1cbiAgICAgICAgICAgICAgIG1lZGl1bU1lZGlhRGF0YT17IG1lZGl1bU1lZGlhRGF0YSB9XG4gICAgICAgICAgICAgICBsYXJnZU1lZGlhRGF0YT17IGxhcmdlTWVkaWFEYXRhIH1cbiAgICAgID57IHByb3BzLmNoaWxkcmVuIH08L0FwU3R5bGU+XG4gICAgKVxuICB9XG59KVxuXG5leHBvcnQgZGVmYXVsdCBBcFVwbG9hZFN0eWxlXG4iLCIvKipcbiAqIEJpZyBidXR0b24gY29tcG9uZW50LlxuICogQGNsYXNzIEFwQmlnQnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwQmlnQnV0dG9uICovXG5jb25zdCBBcEJpZ0J1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIGRpc2FibGVkOiB0eXBlcy5ib29sLFxuICAgIG9uVGFwOiB0eXBlcy5mdW5jLFxuICAgIHRleHQ6IHR5cGVzLnN0cmluZyxcbiAgICBzaXplOiB0eXBlcy5udW1iZXJcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgb25UYXA6IG51bGwsXG4gICAgICB0ZXh0OiBudWxsLFxuICAgICAgc2l6ZTogOTRcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgbGV0IHsgc2l6ZSB9ID0gcHJvcHNcbiAgICBsZXQgc3R5bGUgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHdpZHRoOiBzaXplLCBoZWlnaHQ6IHNpemVcbiAgICB9LCBwcm9wcy5zdHlsZSlcbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIHsgLi4ucHJvcHMgfVxuICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1iaWctYnV0dG9uJywgcHJvcHMuY2xhc3NOYW1lKSB9XG4gICAgICAgIHdpZGU9eyBmYWxzZSB9XG4gICAgICAgIHN0eWxlPXsgc3R5bGUgfVxuICAgICAgPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLWJpZy1idXR0b24tdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHByb3BzLnRleHQgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L0FwQnV0dG9uPlxuICAgIClcbiAgfVxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBCaWdCdXR0b25cbiIsIi8qKlxuICogQnV0dG9uIGNvbXBvbmVudC5cbiAqIEBjbGFzcyBBcEJ1dHRvblxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcblxuaW1wb3J0IHtBcFRvdWNoTWl4aW4sIEFwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwQnV0dG9uICovXG5sZXQgQXBCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICAvKiogRGlzYWJsZSBidXR0b24gdGFwICovXG4gICAgZGlzYWJsZWQ6IHR5cGVzLmJvb2wsXG4gICAgLyoqIFJlbmRlciB3aXRoIHByaW1hcnkgc3R5bGUgKi9cbiAgICBwcmltYXJ5OiB0eXBlcy5ib29sLFxuICAgIC8qKiBSZW5kZXIgd2l0aCBkYW5nZXIgc3R5bGUgKi9cbiAgICBkYW5nZXI6IHR5cGVzLmJvb2wsXG4gICAgLyoqIFJlbmRlciB3aXRoIHdpZGUgc3R5bGUgKi9cbiAgICB3aWRlOiB0eXBlcy5ib29sLFxuICAgIC8qKiBBbmNob3IgaHJlZiAqL1xuICAgIGhyZWY6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogRG9jdW1lbnQgaWQgKi9cbiAgICBpZDogdHlwZXMuc3RyaW5nLFxuICAgIC8qKiBIaWRlIGJ1dHRvbiAqL1xuICAgIGhpZGRlbjogdHlwZXMuYm9vbCxcbiAgICAvKiogUmVuZGVyIHdpdGggc2ltcGxlIHN0eWxlICovXG4gICAgc2ltcGxlOiB0eXBlcy5ib29sLFxuICAgIC8qKiBEYXRhIGZvciB0b3VjaCBldmVudHMgKi9cbiAgICBkYXRhOiB0eXBlcy5hbnlcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFRvdWNoTWl4aW4sXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC8qKiBGb3IgYml0IHRhcHBpbmcgKi9cbiAgICAgIGRpc2FibGVkOiBmYWxzZSxcbiAgICAgIC8qKiBSZW5kZXIgd2l0aCBwcmltYXJ5IHN0eWxlICovXG4gICAgICBwcmltYXJ5OiBmYWxzZSxcbiAgICAgIC8qKiBSZW5kZXIgd2l0aCBkYW5nZXIgc3R5bGUgKi9cbiAgICAgIGRhbmdlcjogZmFsc2UsXG4gICAgICB3aWRlOiBmYWxzZSxcbiAgICAgIGhyZWY6IG51bGwsXG4gICAgICAvKiogRG9jdW1lbnQgaWQgKi9cbiAgICAgIGlkOiBudWxsLFxuICAgICAgLyoqIERpc3BsYXkgaGlkZGVuICovXG4gICAgICBoaWRkZW46IGZhbHNlLFxuICAgICAgLyoqIFNpbXBsZSBzdHlsZSAqL1xuICAgICAgc2ltcGxlOiBmYWxzZSxcbiAgICAgIC8qKiBEYXRhIGZvciBldmVudCAqL1xuICAgICAgZGF0YTogbnVsbFxuICAgIH1cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIGxldCBjbGFzc05hbWUgPSBjbGFzc25hbWVzKCdhcC1idXR0b24nLCBwcm9wcy5jbGFzc05hbWUsIHtcbiAgICAgICdhcC1idXR0b24tcHJpbWFyeSc6IHByb3BzLnByaW1hcnksXG4gICAgICAnYXAtYnV0dG9uLWRhbmdlcic6IHByb3BzLmRhbmdlcixcbiAgICAgICdhcC1idXR0b24td2lkZSc6IHByb3BzLndpZGUsXG4gICAgICAnYXAtYnV0dG9uLWRpc2FibGVkJzogcHJvcHMuZGlzYWJsZWQsXG4gICAgICAnYXAtYnV0dG9uLXNpbXBsZSc6IHByb3BzLnNpbXBsZSxcbiAgICAgICdhcC1idXR0b24taGlkZGVuJzogcHJvcHMuaGlkZGVuXG4gICAgfSlcbiAgICByZXR1cm4gKFxuICAgICAgPGEgY2xhc3NOYW1lPXsgY2xhc3NOYW1lIH1cbiAgICAgICAgIGhyZWY9eyBwcm9wcy5ocmVmIH1cbiAgICAgICAgIGlkPXsgcHJvcHMuaWQgfVxuICAgICAgICAgc3R5bGU9eyBPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSkgfVxuICAgICAgPnsgcHJvcHMuY2hpbGRyZW4gfVxuICAgICAgPC9hPlxuICAgIClcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBGb3IgQXBUb3VjaE1peGluXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGdldFRvdWNoRGF0YSAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiBwcm9wcy5kYXRhXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwQnV0dG9uXG4iLCIvKipcbiAqIEJ1dHRvbiBncm91cCBjb21wb25lbnQuXG4gKiBAY2xhc3MgQXBCdXR0b25Hcm91cFxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcblxuaW1wb3J0IHtBcFB1cmVNaXhpbn0gZnJvbSAnYXBlbWFuLXJlYWN0LW1peGlucydcblxuLyoqIEBsZW5kcyBBcEJ1dHRvbkdyb3VwICovXG5jb25zdCBBcEJ1dHRvbkdyb3VwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7fSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge31cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLWJ1dHRvbi1ncm91cCcsIHByb3BzLmNsYXNzTmFtZSkgfT5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwQnV0dG9uR3JvdXBcbiIsIi8qKlxuICogU3R5bGUgZm9yIEFwQnV0dG9uLlxuICogQGNsYXNzIEFwQnV0dG9uU3R5bGVcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJ1xuXG4vKiogQGxlbmRzIEFwQnV0dG9uU3R5bGUgKi9cbmNvbnN0IEFwQnV0dG9uU3R5bGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIFxuICAgIHN0eWxlOiB0eXBlcy5vYmplY3QsXG4gICAgaGlnaGxpZ2h0Q29sb3I6IHR5cGVzLnN0cmluZyxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IHR5cGVzLnN0cmluZyxcbiAgICBkYW5nZXJDb2xvcjogdHlwZXMuc3RyaW5nLFxuICAgIGRpc2FibGVkQ29sb3I6IHR5cGVzLnN0cmluZ1xuICB9LFxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY29wZTogZmFsc2UsXG4gICAgICBzdHlsZToge30sXG4gICAgICBoaWdobGlnaHRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0hJR0hMSUdIVF9DT0xPUixcbiAgICAgIGJhY2tncm91bmRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0JBQ0tHUk9VTkRfQ09MT1IsXG4gICAgICBkYW5nZXJDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0RBTkdFUl9DT0xPUixcbiAgICAgIGRpc2FibGVkQ29sb3I6ICcjQUFBJ1xuICAgIH1cbiAgfSxcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7cHJvcHN9ID0gc1xuXG4gICAgbGV0IHtcbiAgICAgIGhpZ2hsaWdodENvbG9yLFxuICAgICAgYmFja2dyb3VuZENvbG9yLFxuICAgICAgZGFuZ2VyQ29sb3IsXG4gICAgICBkaXNhYmxlZENvbG9yXG4gICAgfSA9IHByb3BzXG5cbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgICcuYXAtYnV0dG9uJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICAgIHBhZGRpbmc6ICcwLjVlbSAxZW0nLFxuICAgICAgICBib3JkZXJSYWRpdXM6ICcycHgnLFxuICAgICAgICBtYXJnaW46ICc0cHgnLFxuICAgICAgICBjb2xvcjogYCR7aGlnaGxpZ2h0Q29sb3J9YCxcbiAgICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7aGlnaGxpZ2h0Q29sb3J9YCxcbiAgICAgICAgYmFja2dyb3VuZDogYCR7YmFja2dyb3VuZENvbG9yfWAsXG4gICAgICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgTW96VXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICBNc1VzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgVXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJ1xuICAgICAgfSxcbiAgICAgICcuYXAtYmlnLWJ1dHRvbic6IHtcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJyxcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgYm9yZGVyV2lkdGg6ICc0cHgnLFxuICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICBib3hTaGFkb3c6ICcycHggMnB4IDRweCByZ2JhKDAsMCwwLDAuMiknLFxuICAgICAgICB3aGl0ZVNwYWNlOiAnbm9ybWFsJ1xuICAgICAgfSxcbiAgICAgICcuYXAtYmlnLWJ1dHRvbjphY3RpdmUnOiB7XG4gICAgICAgIGJveFNoYWRvdzogJ25vbmUnXG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b24gPiAqJzoge1xuICAgICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZSdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbjpob3Zlcic6IHtcbiAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uOmFjdGl2ZSc6IHtcbiAgICAgICAgYm94U2hhZG93OiAnMXB4IDFweCAycHggcmdiYSgwLDAsMCwwLjEpIGluc2V0JyxcbiAgICAgICAgb3BhY2l0eTogMC44XG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b24uYXAtYnV0dG9uLWRpc2FibGVkLC5hcC1idXR0b24uYXAtYnV0dG9uLWRpc2FibGVkOmhvdmVyLC5hcC1idXR0b24uYXAtYnV0dG9uLWRpc2FibGVkOmFjdGl2ZSc6IHtcbiAgICAgICAgY3Vyc29yOiAnZGVmYXVsdCcsXG4gICAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxuICAgICAgICBjb2xvcjogYCR7ZGlzYWJsZWRDb2xvcn1gLFxuICAgICAgICBib3JkZXJDb2xvcjogYCR7ZGlzYWJsZWRDb2xvcn1gLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjRjBGMEYwJ1xuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLXByaW1hcnknOiB7XG4gICAgICAgIGNvbG9yOiAnd2hpdGUnLFxuICAgICAgICBiYWNrZ3JvdW5kOiBgJHtoaWdobGlnaHRDb2xvcn1gXG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b24tZGFuZ2VyJzoge1xuICAgICAgICBjb2xvcjogJ3doaXRlJyxcbiAgICAgICAgYmFja2dyb3VuZDogYCR7ZGFuZ2VyQ29sb3J9YFxuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLXdpZGUnOiB7XG4gICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICBtYXhXaWR0aDogJzI0MHB4JyxcbiAgICAgICAgbWFyZ2luTGVmdDogMCxcbiAgICAgICAgbWFyZ2luUmlnaHQ6IDBcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uJzoge1xuICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdpbmhlcml0JyxcbiAgICAgICAgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsXG4gICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbi1zaW1wbGUnOiB7XG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnXG4gICAgICB9LFxuICAgICAgJy5hcC1pY29uLWJ1dHRvbi1zaW1wbGU6YWN0aXZlJzoge1xuICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcbiAgICAgICAgb3BhY2l0eTogJzAuOCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uLXNpbXBsZSAuYXAtaWNvbi1idXR0b24taWNvbic6IHtcbiAgICAgICAgZm9udFNpemU6ICdpbmhlcml0J1xuICAgICAgfSxcbiAgICAgICcuYXAtaWNvbi1idXR0b24taWNvbic6IHtcbiAgICAgICAgbWFyZ2luOiAnMnB4IDAnLFxuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICBmb250U2l6ZTogJzJlbSdcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uLXRleHQnOiB7XG4gICAgICAgIGRpc3BsYXk6ICdibG9jaycsXG4gICAgICAgIGZvbnRTaXplOiAnMC42NmVtJyxcbiAgICAgICAgcGFkZGluZzogJzJweCAwJ1xuICAgICAgfSxcbiAgICAgICcuYXAtaWNvbi1idXR0b24tcm93Jzoge1xuICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgIG1heFdpZHRoOiBBcFN0eWxlLkNPTlRFTlRfV0lEVEgsXG4gICAgICAgIG1hcmdpbjogJzAgYXV0bydcbiAgICAgIH0sXG4gICAgICAnLmFwLWljb24tYnV0dG9uLXJvdyAuYXAtYnV0dG9uJzoge1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICB3aWR0aDogJzEwMCUnXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbic6IHtcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgbGluZUhlaWdodDogJzFlbScsXG4gICAgICAgIGZvbnRTaXplOiAnMTRweCcsXG4gICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAwLFxuICAgICAgICBib3hTaXppbmc6ICdib3JkZXItYm94J1xuICAgICAgfSxcbiAgICAgICcuYXAtY2VsbC1idXR0b24tYWxpZ25lcic6IHtcbiAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHdpZHRoOiAnMXB4JyxcbiAgICAgICAgbWFyZ2luUmlnaHQ6ICctMXB4JyxcbiAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICAgIHBhZGRpbmc6ICc4cHggMCcsXG4gICAgICAgIHZlcnRpY2FsQWxpZ246ICdtaWRkbGUnXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbi10ZXh0Jzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgdmVydGljYWxBbGlnbjogJ21pZGRsZSdcbiAgICAgIH0sXG4gICAgICAnLmFwLWNlbGwtYnV0dG9uLXJvdyc6IHtcbiAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICBtYXhXaWR0aDogQXBTdHlsZS5DT05URU5UX1dJRFRILFxuICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICBtYXJnaW46ICc4cHggYXV0bydcbiAgICAgIH0sXG4gICAgICAnLmFwLWNlbGwtYnV0dG9uLXJvdyAuYXAtY2VsbC1idXR0b24nOiB7XG4gICAgICAgIGJvcmRlclJpZ2h0Q29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgIGJvcmRlckJvdHRvbUNvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICB3aWR0aDogJzEwMCUnXG4gICAgICB9LFxuICAgICAgJy5hcC1jZWxsLWJ1dHRvbi1yb3cgLmFwLWNlbGwtYnV0dG9uOmZpcnN0LWNoaWxkJzoge1xuICAgICAgICBib3JkZXJMZWZ0Q29sb3I6ICd0cmFuc3BhcmVudCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWNlbGwtYnV0dG9uLXJvdyAuYXAtYnV0dG9uJzoge1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICB3aWR0aDogJzEwMCUnXG4gICAgICB9LFxuICAgICAgJy5hcC1uZXh0LWJ1dHRvbiwuYXAtcHJldi1idXR0b24nOiB7XG4gICAgICAgIHBhZGRpbmc6ICcwLjI1ZW0gMWVtJ1xuICAgICAgfSxcbiAgICAgICcuYXAtbmV4dC1idXR0b24taWNvbic6IHtcbiAgICAgICAgbWFyZ2luTGVmdDogJzRweCcsXG4gICAgICAgIG1hcmdpblJpZ2h0OiAwXG4gICAgICB9LFxuICAgICAgJy5hcC1wcmV2LWJ1dHRvbi1pY29uJzoge1xuICAgICAgICBtYXJnaW5MZWZ0OiAwLFxuICAgICAgICBtYXJnaW5SaWdodDogJzRweCdcbiAgICAgIH0sXG4gICAgICAnLmFwLWJ1dHRvbi1oaWRkZW4nOiB7XG4gICAgICAgIGRpc3BsYXk6ICdub25lICFpbXBvcnRhbnQnXG4gICAgICB9LFxuICAgICAgJy5hcC1idXR0b24tc2ltcGxlJzoge1xuICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50J1xuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLXNpbXBsZTphY3RpdmUnOiB7XG4gICAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxuICAgICAgICBvcGFjaXR5OiAnMC44J1xuICAgICAgfSxcbiAgICAgICcuYXAtYnV0dG9uLWdyb3VwJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInXG4gICAgICB9XG4gICAgfVxuICAgIGxldCBzbWFsbE1lZGlhRGF0YSA9IHt9XG4gICAgbGV0IG1lZGl1bU1lZGlhRGF0YSA9IHt9XG4gICAgbGV0IGxhcmdlTWVkaWFEYXRhID0ge31cbiAgICByZXR1cm4gKFxuICAgICAgPEFwU3R5bGUgXG4gICAgICAgICAgICAgICBkYXRhPXsgT2JqZWN0LmFzc2lnbihkYXRhLCBwcm9wcy5zdHlsZSkgfVxuICAgICAgICAgICAgICAgc21hbGxNZWRpYURhdGE9eyBzbWFsbE1lZGlhRGF0YSB9XG4gICAgICAgICAgICAgICBtZWRpdW1NZWRpYURhdGE9eyBtZWRpdW1NZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbGFyZ2VNZWRpYURhdGE9eyBsYXJnZU1lZGlhRGF0YSB9XG4gICAgICA+eyBwcm9wcy5jaGlsZHJlbiB9PC9BcFN0eWxlPlxuICAgIClcbiAgfVxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBCdXR0b25TdHlsZVxuIiwiLyoqXG4gKiBDZWxsIGJ1dHRvbiBjb21wb25lbnQuXG4gKiBAY2xhc3MgQXBDZWxsQnV0dG9uXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJ1xuaW1wb3J0IEFwQnV0dG9uIGZyb20gJy4vYXBfYnV0dG9uJ1xuXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwQ2VsbEJ1dHRvbiAqL1xuY29uc3QgQXBDZWxsQnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZGlzYWJsZWQ6IHR5cGVzLmJvb2wsXG4gICAgb25UYXA6IHR5cGVzLmZ1bmMsXG4gICAgdGV4dDogdHlwZXMuc3RyaW5nXG4gIH0sXG5cbiAgbWl4aW5zOiBbXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc2FibGVkOiBmYWxzZSxcbiAgICAgIG9uVGFwOiBudWxsLFxuICAgICAgdGV4dDogbnVsbFxuICAgIH1cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHtwcm9wc30gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxBcEJ1dHRvbiB7IC4uLnByb3BzIH1cbiAgICAgICAgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtY2VsbC1idXR0b24nLCBwcm9wcy5jbGFzc05hbWUpIH1cbiAgICAgICAgd2lkZT17IGZhbHNlIH1cbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtY2VsbC1idXR0b24tYWxpZ25lclwiPiZuYnNwOzwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtY2VsbC1idXR0b24tdGV4dFwiPnsgcHJvcHMudGV4dCB9PC9zcGFuPlxuICAgICAgPC9BcEJ1dHRvbj5cbiAgICApXG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBDZWxsQnV0dG9uXG4iLCIvKipcbiAqIFJvdyBmb3IgQ2VsbCBidXR0b25zLlxuICogQGNsYXNzIEFwQ2VsbEJ1dHRvblJvd1xuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcblxuLyoqIEBsZW5kcyBBcENlbGxCdXR0b25Sb3cgKi9cbmNvbnN0IEFwQ2VsbEJ1dHRvblJvdyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge30sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlICgpIHtcbiAgICByZXR1cm4ge31cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLWNlbGwtYnV0dG9uLXJvdycsIHByb3BzLmNsYXNzTmFtZSkgfT5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBDZWxsQnV0dG9uUm93XG4iLCIvKipcbiAqIEljb24gYnV0dG9uIGNvbXBvbmVudC5cbiAqIEBjbGFzcyBBcEljb25CdXR0b25cbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnXG5pbXBvcnQge0FwSWNvbn0gZnJvbSAnYXBlbWFuLXJlYWN0LWljb24nXG5pbXBvcnQgQXBCdXR0b24gZnJvbSAnLi9hcF9idXR0b24nXG5cbmltcG9ydCB7QXBQdXJlTWl4aW59IGZyb20gJ2FwZW1hbi1yZWFjdC1taXhpbnMnXG5cbi8qKiBAbGVuZHMgQXBJY29uQnV0dG9uICovXG5jb25zdCBBcEljb25CdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICBpY29uOiB0eXBlcy5zdHJpbmcsXG4gICAgdGV4dDogdHlwZXMuc3RyaW5nLFxuICAgIHNpbXBsZTogdHlwZXMuYm9vbFxuICB9LFxuXG4gIHN0YXRpY3M6IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBpY29uIGJ1dHRvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRleHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWNvbiAtIEljb24gY2xhc3NcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvblRhcCAtIFRhcCBjYWxsYmFja1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIE90aGVyIHByb3BzLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gUmVhY3QgZWxlbWVudC5cbiAgICAgKi9cbiAgICBjcmVhdGVCdXR0b24gKHRleHQsIGljb24sIG9uVGFwLCBwcm9wcykge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPEFwSWNvbkJ1dHRvbiB0ZXh0PXsgdGV4dCB9XG4gICAgICAgICAgICAgICAgICAgICAgaWNvbj17IGljb24gfVxuICAgICAgICAgICAgICAgICAgICAgIG9uVGFwPXsgb25UYXAgfVxuICAgICAgICAgIHsgLi4ucHJvcHMgfVxuICAgICAgICAvPlxuICAgICAgKVxuICAgIH1cbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpblxuICBdLFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHt9XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWNvbjogbnVsbCxcbiAgICAgIHRleHQ6IG51bGxcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxBcEJ1dHRvbiB7IC4uLnByb3BzIH1cbiAgICAgICAgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtaWNvbi1idXR0b24nLCB7XG4gICAgICAgICAgICAgICAgJ2FwLWljb24tYnV0dG9uLXNpbXBsZSc6ICEhcHJvcHMuc2ltcGxlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvcHMuY2xhc3NOYW1lKSB9XG4gICAgICAgIHdpZGU9eyBmYWxzZSB9XG4gICAgICA+XG4gICAgICAgIDxBcEljb24gY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtaWNvbi1idXR0b24taWNvbicsIHByb3BzLmljb24sIHtcbiAgICAgICAgICAgICAgICB9KSB9Lz5cbiAgICAgICAge3Byb3BzLnRleHQgPyA8c3BhbiBjbGFzc05hbWU9XCJhcC1pY29uLWJ1dHRvbi10ZXh0XCI+eyBwcm9wcy50ZXh0IH08L3NwYW4+IDogbnVsbH1cbiAgICAgIDwvQXBCdXR0b24+XG4gICAgKVxuICB9XG5cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwSWNvbkJ1dHRvblxuIiwiLyoqXG4gKiBSb3cgZm9yIEljb24gYnV0dG9ucy5cbiAqIEBjbGFzcyBBcEljb25CdXR0b25Sb3dcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcblxuLyoqIEBsZW5kcyBBcEljb25CdXR0b25Sb3cgKi9cbmNvbnN0IEFwSWNvbkJ1dHRvblJvdyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge30sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlICgpIHtcbiAgICByZXR1cm4ge31cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLWljb24tYnV0dG9uLXJvdycsIHByb3BzLmNsYXNzTmFtZSkgfT5cbiAgICAgICAgeyBwcm9wcy5jaGlsZHJlbiB9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBJY29uQnV0dG9uUm93O1xuXG5cbiIsIi8qKlxuICogTmV4dCBidXR0b24gY29tcG9uZW50LlxuICogQGNsYXNzIEFwTmV4dEJ1dHRvblxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcbmltcG9ydCBBcEJ1dHRvbiBmcm9tICcuL2FwX2J1dHRvbidcbmltcG9ydCB7QXBJY29ufSBmcm9tICdhcGVtYW4tcmVhY3QtaWNvbidcblxuaW1wb3J0IHtBcFB1cmVNaXhpbn0gZnJvbSAnYXBlbWFuLXJlYWN0LW1peGlucydcblxuLyoqIEBsZW5kcyBBcE5leHRCdXR0b24gKi9cbmNvbnN0IEFwTmV4dEJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIGRpc2FibGVkOiB0eXBlcy5ib29sLFxuICAgIG9uVGFwOiB0eXBlcy5mdW5jLFxuICAgIHRleHQ6IHR5cGVzLnN0cmluZyxcbiAgICBzaXplOiB0eXBlcy5udW1iZXIsXG4gICAgaWNvbjogdHlwZXMuc3RyaW5nXG4gIH0sXG5cbiAgbWl4aW5zOiBbXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc2FibGVkOiBmYWxzZSxcbiAgICAgIG9uVGFwOiBudWxsLFxuICAgICAgdGV4dDogbnVsbCxcbiAgICAgIGljb246ICdmYSBmYS1jYXJldC1yaWdodCdcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG4gICAgcmV0dXJuIChcbiAgICAgIDxBcEJ1dHRvbiB7IC4uLnByb3BzIH1cbiAgICAgICAgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtbmV4dC1idXR0b24nLCBwcm9wcy5jbGFzc05hbWUpIH1cbiAgICAgICAgd2lkZT17IGZhbHNlIH1cbiAgICAgICAgc3R5bGU9e09iamVjdC5hc3NpZ24oe30sIHByb3BzLnN0eWxlKX1cbiAgICAgID5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC1uZXh0LWJ1dHRvbi10ZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgcHJvcHMudGV4dCB9XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgICAgPEFwSWNvbiBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1uZXh0LWJ1dHRvbi1pY29uJywgcHJvcHMuaWNvbikgfS8+XG4gICAgICA8L0FwQnV0dG9uPlxuICAgIClcbiAgfVxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBBcE5leHRCdXR0b25cbiIsIi8qKlxuICogUHJldiBidXR0b24gY29tcG9uZW50LlxuICogQGNsYXNzIEFwUHJldkJ1dHRvblxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcbmltcG9ydCBBcEJ1dHRvbiBmcm9tICcuL2FwX2J1dHRvbidcbmltcG9ydCB7QXBJY29ufSBmcm9tICdhcGVtYW4tcmVhY3QtaWNvbidcblxuaW1wb3J0IHtBcFB1cmVNaXhpbn0gZnJvbSAnYXBlbWFuLXJlYWN0LW1peGlucydcblxuLyoqIEBsZW5kcyBBcFByZXZCdXR0b24gKi9cbmNvbnN0IEFwUHJldkJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTcGVjc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3BUeXBlczoge1xuICAgIGRpc2FibGVkOiB0eXBlcy5ib29sLFxuICAgIG9uVGFwOiB0eXBlcy5mdW5jLFxuICAgIHRleHQ6IHR5cGVzLnN0cmluZyxcbiAgICBzaXplOiB0eXBlcy5udW1iZXIsXG4gICAgaWNvbjogdHlwZXMuc3RyaW5nXG4gIH0sXG5cbiAgbWl4aW5zOiBbXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc2FibGVkOiBmYWxzZSxcbiAgICAgIG9uVGFwOiBudWxsLFxuICAgICAgdGV4dDogbnVsbCxcbiAgICAgIGljb246ICdmYSBmYS1jYXJldC1sZWZ0J1xuICAgIH1cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcbiAgICByZXR1cm4gKFxuICAgICAgPEFwQnV0dG9uIHsgLi4ucHJvcHMgfVxuICAgICAgICBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1wcmV2LWJ1dHRvbicsIHByb3BzLmNsYXNzTmFtZSkgfVxuICAgICAgICB3aWRlPXsgZmFsc2UgfVxuICAgICAgICBzdHlsZT17T2JqZWN0LmFzc2lnbih7fSwgcHJvcHMuc3R5bGUpfVxuICAgICAgPlxuICAgICAgICA8QXBJY29uIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLXByZXYtYnV0dG9uLWljb24nLCBwcm9wcy5pY29uKSB9Lz5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC1wcmV2LWJ1dHRvbi10ZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgcHJvcHMudGV4dCB9XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICB7IHByb3BzLmNoaWxkcmVuIH1cbiAgICAgIDwvQXBCdXR0b24+XG4gICAgKVxuICB9XG5cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwUHJldkJ1dHRvblxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3IgYnV0dG9uIGNvbXBvbmVudC5cbiAqIEBtb2R1bGUgYXBlbWFuLXJlYWN0LWJ1dHRvblxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5sZXQgZCA9IChtb2R1bGUpID0+IG1vZHVsZS5kZWZhdWx0IHx8IG1vZHVsZVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0IEFwQmlnQnV0dG9uICgpIHsgcmV0dXJuIGQocmVxdWlyZSgnLi9hcF9iaWdfYnV0dG9uJykpIH0sXG4gIGdldCBBcEJ1dHRvbkdyb3VwICgpIHsgcmV0dXJuIGQocmVxdWlyZSgnLi9hcF9idXR0b25fZ3JvdXAnKSkgfSxcbiAgZ2V0IEFwQnV0dG9uU3R5bGUgKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX2J1dHRvbl9zdHlsZScpKSB9LFxuICBnZXQgQXBCdXR0b24gKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX2J1dHRvbicpKSB9LFxuICBnZXQgQXBDZWxsQnV0dG9uUm93ICgpIHsgcmV0dXJuIGQocmVxdWlyZSgnLi9hcF9jZWxsX2J1dHRvbl9yb3cnKSkgfSxcbiAgZ2V0IEFwQ2VsbEJ1dHRvbiAoKSB7IHJldHVybiBkKHJlcXVpcmUoJy4vYXBfY2VsbF9idXR0b24nKSkgfSxcbiAgZ2V0IEFwSWNvbkJ1dHRvblJvdyAoKSB7IHJldHVybiBkKHJlcXVpcmUoJy4vYXBfaWNvbl9idXR0b25fcm93JykpIH0sXG4gIGdldCBBcEljb25CdXR0b24gKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX2ljb25fYnV0dG9uJykpIH0sXG4gIGdldCBBcE5leHRCdXR0b24gKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX25leHRfYnV0dG9uJykpIH0sXG4gIGdldCBBcFByZXZCdXR0b24gKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX3ByZXZfYnV0dG9uJykpIH1cbn1cbiIsIi8qKlxuICogYXBlbWFuIHJlYWN0IHBhY2thZ2UgZm9yIGltYWdlIGNvbXBvbmVudC5cbiAqIEBjbGFzcyBBcEltYWdlXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJ1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcbmltcG9ydCBudW1jYWwgZnJvbSAnbnVtY2FsJ1xuaW1wb3J0IHNjYWxlZFNpemUgZnJvbSAnLi9zaXppbmcvc2NhbGVkX3NpemUnXG5pbXBvcnQge0FwU3Bpbm5lcn0gZnJvbSAnYXBlbWFuLXJlYWN0LXNwaW5uZXInXG5pbXBvcnQge0FwUHVyZU1peGlufSBmcm9tICdhcGVtYW4tcmVhY3QtbWl4aW5zJ1xuXG4vKiogQGxlbmRzIEFwSW1hZ2UgKi9cbmNvbnN0IEFwSW1hZ2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU3BlY3NcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm9wVHlwZXM6IHtcbiAgICAvKiogSW1hZ2Ugc2NhbGluZyBwb2xpY3kgKi9cbiAgICBzY2FsZTogdHlwZXMub25lT2YoW1xuICAgICAgJ2ZpdCcsXG4gICAgICAnZmlsbCcsXG4gICAgICAnbm9uZSdcbiAgICBdKSxcbiAgICAvKiogSW1hZ2Ugd2lkdGggKi9cbiAgICB3aWR0aDogdHlwZXMub25lT2ZUeXBlKFsgdHlwZXMubnVtYmVyLCB0eXBlcy5zdHJpbmcgXSksXG4gICAgLyoqIEltYWdlIGhlaWdodCAqL1xuICAgIGhlaWdodDogdHlwZXMub25lT2ZUeXBlKFsgdHlwZXMubnVtYmVyLCB0eXBlcy5zdHJpbmcgXSksXG4gICAgLyoqIEltYWdlIHNyYyBzdHJpbmcgKi9cbiAgICBzcmM6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogQWx0IHRlc3QgKi9cbiAgICBhbHQ6IHR5cGVzLnN0cmluZyxcbiAgICAvKiogVGhlbSBvZiBzcGlubmVyICovXG4gICAgc3Bpbm5lclRoZW1lOiB0eXBlcy5zdHJpbmcsXG4gICAgLyoqIEhhbmRsZXIgb24gaW1hZ2UgbG9hZCAqL1xuICAgIG9uTG9hZDogdHlwZXMuZnVuYyxcbiAgICAvKiogSGFuZGxlciBvbiBpbWFnZSBlcnJvci4gKi9cbiAgICBvbkVycm9yOiB0eXBlcy5mdW5jXG4gIH0sXG5cbiAgbWl4aW5zOiBbXG4gICAgQXBQdXJlTWl4aW5cbiAgXSxcblxuICBzdGF0aWNzOiB7XG4gICAgc2NhbGVkU2l6ZSxcbiAgICB6ZXJvSWZOYU4gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gaXNOYU4odmFsdWUpID8gMCA6IHZhbHVlXG4gICAgfSxcbiAgICBudWxsSWZOYU4gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gaXNOYU4odmFsdWUpID8gbnVsbCA6IHZhbHVlXG4gICAgfVxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICByZXR1cm4ge1xuICAgICAgaW1nV2lkdGg6IG51bGwsXG4gICAgICBpbWdIZWlnaHQ6IG51bGwsXG4gICAgICBtb3VudGVkOiBmYWxzZSxcbiAgICAgIHJlYWR5OiBmYWxzZSxcbiAgICAgIGxvYWRpbmc6ICEhcy5wcm9wcy5zcmMsXG4gICAgICBlcnJvcjogbnVsbFxuICAgIH1cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY2FsZTogJ25vbmUnLFxuICAgICAgd2lkdGg6IG51bGwsXG4gICAgICBoZWlnaHQ6IG51bGwsXG4gICAgICBzcmM6IG51bGwsXG4gICAgICBhbHQ6ICdOTyBJTUFHRScsXG4gICAgICBzcGlubmVyVGhlbWU6IEFwU3Bpbm5lci5ERUZBVUxUX1RIRU1FLFxuICAgICAgb25Mb2FkOiBudWxsLFxuICAgICAgb25FcnJvcjogbnVsbFxuICAgIH1cbiAgfSxcblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgc3RhdGUsIHByb3BzIH0gPSBzXG5cbiAgICBsZXQgc2l6ZSA9IHtcbiAgICAgIHdpZHRoOiBwcm9wcy53aWR0aCB8fCBudWxsLFxuICAgICAgaGVpZ2h0OiBwcm9wcy5oZWlnaHQgfHwgbnVsbFxuICAgIH1cblxuICAgIGxldCB7IG1vdW50ZWQsIGVycm9yLCByZWFkeSwgbG9hZGluZyB9ID0gc3RhdGVcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9eyBjbGFzc25hbWVzKCdhcC1pbWFnZScsIHByb3BzLmNsYXNzTmFtZSwge1xuICAgICAgICAgICAgICAgICdhcC1pbWFnZS1sb2FkaW5nJzogcHJvcHMuc3JjICYmIGxvYWRpbmcsXG4gICAgICAgICAgICAgICAgJ2FwLWltYWdlLXJlYWR5JzogcHJvcHMuc3JjICYmIHJlYWR5XG4gICAgICAgICAgICB9KSB9XG4gICAgICAgICAgIHN0eWxlPXsgT2JqZWN0LmFzc2lnbih7fSwgc2l6ZSwgcHJvcHMuc3R5bGUpIH0+XG4gICAgICAgIHsgbW91bnRlZCAmJiBlcnJvciA/IHMuX3JlbmRlck5vdGZvdW5kKHNpemUpIDogbnVsbH1cbiAgICAgICAgeyBtb3VudGVkICYmICFlcnJvciA/IHMuX3JlbmRlckltZyhzaXplLCBtb3VudGVkKSA6IG51bGwgfVxuICAgICAgICB7IGxvYWRpbmcgPyBzLl9yZW5kZXJTcGlubmVyKHNpemUpIDogbnVsbCB9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gTGlmZWN5Y2xlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgY29tcG9uZW50V2lsbE1vdW50ICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50ICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIHMuc2V0U3RhdGUoe1xuICAgICAgbW91bnRlZDogdHJ1ZVxuICAgIH0pXG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHMucmVzaXplSW1hZ2UoKVxuICAgIH0sIDApXG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyAobmV4dFByb3BzKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcblxuICAgIGxldCBzcmMgPSBzLnByb3BzLnNyY1xuICAgIGxldCBuZXh0U3JjID0gbmV4dFByb3BzLnNyY1xuICAgIGxldCBzcmNDaGFuZ2VkID0gISFuZXh0U3JjICYmIChuZXh0U3JjICE9PSBzcmMpXG4gICAgaWYgKHNyY0NoYW5nZWQpIHtcbiAgICAgIHMuc2V0U3RhdGUoe1xuICAgICAgICByZWFkeTogZmFsc2UsXG4gICAgICAgIGxvYWRpbmc6IHRydWUsXG4gICAgICAgIGVycm9yOiBudWxsXG4gICAgICB9KVxuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsVXBkYXRlIChuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgcy5yZXNpemVJbWFnZSgpXG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlIChwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEhlbHBlclxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICBoYW5kbGVMb2FkIChlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgcHJvcHMub25Mb2FkKGUpXG4gICAgfVxuXG4gICAgcy5yZXNpemVJbWFnZShlLnRhcmdldC53aWR0aCwgZS50YXJnZXQuaGVpZ2h0KVxuICB9LFxuXG4gIGhhbmRsZUVycm9yIChlKSB7XG4gICAgY29uc3QgcyA9IHRoaXNcbiAgICBsZXQgeyBwcm9wcyB9ID0gc1xuXG4gICAgcy5zZXRTdGF0ZSh7XG4gICAgICBlcnJvcjogZSxcbiAgICAgIGxvYWRpbmc6IGZhbHNlXG4gICAgfSlcblxuICAgIGlmIChwcm9wcy5vbkVycm9yKSB7XG4gICAgICBwcm9wcy5vbkVycm9yKGUpXG4gICAgfVxuICB9LFxuXG4gIHJlc2l6ZUltYWdlIChpbWdDb250ZW50V2lkdGgsIGltZ0NvbnRlbnRIZWlnaHQpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHN0YXRlLCBwcm9wcyB9ID0gc1xuXG4gICAgaW1nQ29udGVudFdpZHRoID0gaW1nQ29udGVudFdpZHRoIHx8IHN0YXRlLmltZ0NvbnRlbnRXaWR0aFxuICAgIGltZ0NvbnRlbnRIZWlnaHQgPSBpbWdDb250ZW50SGVpZ2h0IHx8IHN0YXRlLmltZ0NvbnRlbnRIZWlnaHRcblxuICAgIGxldCB2YWxpZCA9IGltZ0NvbnRlbnRXaWR0aCAmJiBpbWdDb250ZW50SGVpZ2h0XG4gICAgaWYgKCF2YWxpZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgbGV0IGVsbSA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKHMpXG4gICAgbGV0IGZyYW1lU2l6ZSA9IHtcbiAgICAgIHdpZHRoOiBlbG0ub2Zmc2V0V2lkdGgsXG4gICAgICBoZWlnaHQ6IGVsbS5vZmZzZXRIZWlnaHRcbiAgICB9XG4gICAgbGV0IGNvbnRlbnRTaXplID0ge1xuICAgICAgaGVpZ2h0OiBpbWdDb250ZW50SGVpZ2h0LFxuICAgICAgd2lkdGg6IGltZ0NvbnRlbnRXaWR0aFxuICAgIH1cbiAgICBsZXQgc2NhbGVkU2l6ZSA9IEFwSW1hZ2Uuc2NhbGVkU2l6ZShcbiAgICAgIGNvbnRlbnRTaXplLCBmcmFtZVNpemUsIHByb3BzLnNjYWxlXG4gICAgKVxuXG4gICAgcy5zZXRTdGF0ZSh7XG4gICAgICBpbWdDb250ZW50V2lkdGg6IGltZ0NvbnRlbnRXaWR0aCxcbiAgICAgIGltZ0NvbnRlbnRIZWlnaHQ6IGltZ0NvbnRlbnRIZWlnaHQsXG4gICAgICBpbWdXaWR0aDogc2NhbGVkU2l6ZS53aWR0aCxcbiAgICAgIGltZ0hlaWdodDogc2NhbGVkU2l6ZS5oZWlnaHQsXG4gICAgICByZWFkeTogdHJ1ZSxcbiAgICAgIGxvYWRpbmc6IGZhbHNlXG4gICAgfSlcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gUHJpdmF0ZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3JlbmRlckltZyAoc2l6ZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgc3RhdGUsIHByb3BzIH0gPSBzXG5cbiAgICBsZXQgeyBudWxsSWZOYU4sIHplcm9JZk5hTiB9ID0gQXBJbWFnZVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxpbWcgc3JjPXsgcHJvcHMuc3JjIH1cbiAgICAgICAgICAgYWx0PXsgcHJvcHMuYWx0IH1cbiAgICAgICAgICAgY2xhc3NOYW1lPXsgY2xhc3NuYW1lcygnYXAtaW1hZ2UtY29udGVudCcpIH1cbiAgICAgICAgICAgc3R5bGU9eyB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IHplcm9JZk5hTigoc2l6ZS5oZWlnaHQgLSBzdGF0ZS5pbWdIZWlnaHQpIC8gMiksXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiB6ZXJvSWZOYU4oKHNpemUud2lkdGggLSBzdGF0ZS5pbWdXaWR0aCkgLyAyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBudWxsSWZOYU4oc3RhdGUuaW1nV2lkdGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBudWxsSWZOYU4oc3RhdGUuaW1nSGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAgfSB9XG4gICAgICAgICAgIG9uTG9hZD17IHMuaGFuZGxlTG9hZCB9XG4gICAgICAgICAgIG9uRXJyb3I9eyBzLmhhbmRsZUVycm9yIH1cbiAgICAgIC8+XG4gICAgKVxuICB9LFxuXG4gIF9yZW5kZXJOb3Rmb3VuZCAoc2l6ZSkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgbGV0IHsgcHJvcHMgfSA9IHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImFwLWltYWdlLW5vdGZvdW5kXCJcbiAgICAgICAgICAgc3R5bGU9eyB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVIZWlnaHQ6IGAke3NpemUuaGVpZ2h0fXB4YCxcbiAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6IGAke251bWNhbC5taW4oc2l6ZS5oZWlnaHQgKiAwLjQsIDE4KX1gXG4gICAgICAgICAgICAgICAgIH0gfVxuICAgICAgPnsgcHJvcHMuYWx0IH08L2Rpdj5cbiAgICApXG4gIH0sXG5cbiAgX3JlbmRlclNwaW5uZXIgKHNpemUpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPEFwU3Bpbm5lciBjbGFzc05hbWU9XCJhcC1pbWFnZS1zcGlubmVyXCJcbiAgICAgICAgICAgICAgICAgdGhlbWU9eyBwcm9wcy5zcGlubmVyVGhlbWUgfVxuICAgICAgICAgICAgICAgICBzdHlsZT17IHtcbiAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHNpemUud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgfSB9Lz5cbiAgICApXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwSW1hZ2VcbiIsIi8qKlxuICogU3R5bGUgZm9yIEFwSW1hZ2UuXG4gKiBAY2xhc3MgQXBJbWFnZVN0eWxlXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQge0FwU3R5bGV9IGZyb20gJ2FwZW1hbi1yZWFjdC1zdHlsZSdcblxuLyoqIEBsZW5kcyBBcEltYWdlU3R5bGUgKi9cbmNvbnN0IEFwSW1hZ2VTdHlsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcHJvcFR5cGVzOiB7XG4gICAgXG4gICAgc3R5bGU6IHR5cGVzLm9iamVjdCxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IHR5cGVzLnN0cmluZ1xuICB9LFxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICBcbiAgICAgIHN0eWxlOiB7fSxcbiAgICAgIGJhY2tncm91bmRDb2xvcjogJyNEREQnLFxuICAgICAgc3BpbkNvbG9yOiAncmdiYSgyNTUsMjU1LDI1NSwwLjUpJ1xuICAgIH1cbiAgfSxcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG5cbiAgICBsZXQgeyBiYWNrZ3JvdW5kQ29sb3IsIHNwaW5Db2xvciB9ID0gcHJvcHNcblxuICAgIGxldCB0cmFuc2l0aW9uRHVyYXRpb24gPSAxMDBcblxuICAgIGxldCBkYXRhID0ge1xuICAgICAgJy5hcC1pbWFnZSc6IHtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBgJHtiYWNrZ3JvdW5kQ29sb3J9YCxcbiAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZSdcbiAgICAgIH0sXG4gICAgICAnLmFwLWltYWdlIGltZyc6IHtcbiAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgdHJhbnNpdGlvbjogYHdpZHRoICR7dHJhbnNpdGlvbkR1cmF0aW9ufW1zLCBvcGFjaXR5ICR7dHJhbnNpdGlvbkR1cmF0aW9ufW1zYFxuICAgICAgfSxcbiAgICAgICcuYXAtaW1hZ2UtcmVhZHkgaW1nJzoge1xuICAgICAgICBvcGFjaXR5OiAxXG4gICAgICB9LFxuICAgICAgJy5hcC1pbWFnZS1jb250ZW50Jzoge1xuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaydcbiAgICAgIH0sXG4gICAgICAnLmFwLWltYWdlLXNwaW5uZXInOiB7XG4gICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgIGRpc3BsYXk6ICdibG9jaycsXG4gICAgICAgIHpJbmRleDogOCxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmdiYSgwLDAsMCwwLjEpJyxcbiAgICAgICAgY29sb3I6IGAke3NwaW5Db2xvcn1gXG4gICAgICB9LFxuICAgICAgJy5hcC1pbWFnZS1ub3Rmb3VuZCc6IHtcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgY29sb3I6ICdyZ2JhKDAsMCwwLDAuMSknLFxuICAgICAgICBmb250RmFtaWx5OiAnbW9ub3NwYWNlJ1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgc21hbGxNZWRpYURhdGEgPSB7fVxuICAgIGxldCBtZWRpdW1NZWRpYURhdGEgPSB7fVxuICAgIGxldCBsYXJnZU1lZGlhRGF0YSA9IHt9XG4gICAgcmV0dXJuIChcbiAgICAgIDxBcFN0eWxlIFxuICAgICAgICAgICAgICAgZGF0YT17IE9iamVjdC5hc3NpZ24oZGF0YSwgcHJvcHMuc3R5bGUpIH1cbiAgICAgICAgICAgICAgIHNtYWxsTWVkaWFEYXRhPXsgc21hbGxNZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbWVkaXVtTWVkaWFEYXRhPXsgbWVkaXVtTWVkaWFEYXRhIH1cbiAgICAgICAgICAgICAgIGxhcmdlTWVkaWFEYXRhPXsgbGFyZ2VNZWRpYURhdGEgfVxuICAgICAgPnsgcHJvcHMuY2hpbGRyZW4gfTwvQXBTdHlsZT5cbiAgICApXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwSW1hZ2VTdHlsZVxuIiwiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3IgaW1hZ2UgY29tcG9uZW50LlxuICogQG1vZHVsZSBhcGVtYW4tcmVhY3QtaW1hZ2VcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxubGV0IGQgPSAobW9kdWxlKSA9PiBtb2R1bGUuZGVmYXVsdCB8fCBtb2R1bGVcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldCBBcEltYWdlU3R5bGUgKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX2ltYWdlX3N0eWxlJykpIH0sXG4gIGdldCBBcEltYWdlICgpIHsgcmV0dXJuIGQocmVxdWlyZSgnLi9hcF9pbWFnZScpKSB9XG59XG4iLCIvKipcbiAqIEBmdW5jdGlvbiBfc2NhbGVkU2l6ZVxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5jb25zdCBudW1jYWwgPSByZXF1aXJlKCdudW1jYWwnKVxuXG5mdW5jdGlvbiBzY2FsZWRTaXplIChjb250ZW50U2l6ZSwgZnJhbWVTaXplLCBwb2xpY3kpIHtcbiAgbGV0IGN3ID0gY29udGVudFNpemUud2lkdGhcbiAgbGV0IGNoID0gY29udGVudFNpemUuaGVpZ2h0XG4gIGxldCBmdyA9IGZyYW1lU2l6ZS53aWR0aFxuICBsZXQgZmggPSBmcmFtZVNpemUuaGVpZ2h0XG5cbiAgbGV0IHdSYXRlID0gbnVtY2FsLm1pbigxLCBmdyAvIGN3KVxuICBsZXQgaFJhdGUgPSBudW1jYWwubWluKDEsIGZoIC8gY2gpXG5cbiAgbGV0IHNpemVXaXRoUmF0ZSA9IChyYXRlKSA9PiAoe1xuICAgIHdpZHRoOiBjb250ZW50U2l6ZS53aWR0aCAqIHJhdGUsXG4gICAgaGVpZ2h0OiBjb250ZW50U2l6ZS5oZWlnaHQgKiByYXRlXG4gIH0pXG5cbiAgc3dpdGNoIChwb2xpY3kpIHtcbiAgICBjYXNlICdub25lJzpcbiAgICAgIHJldHVybiBzaXplV2l0aFJhdGUoMSlcbiAgICBjYXNlICdmaXQnOlxuICAgICAgcmV0dXJuIHNpemVXaXRoUmF0ZShcbiAgICAgICAgbnVtY2FsLm1pbih3UmF0ZSwgaFJhdGUpXG4gICAgICApXG4gICAgY2FzZSAnZmlsbCc6XG4gICAgICByZXR1cm4gc2l6ZVdpdGhSYXRlKFxuICAgICAgICBudW1jYWwubWF4KHdSYXRlLCBoUmF0ZSlcbiAgICAgIClcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHBvbGljeTogJHtwb2xpY3l9YClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNjYWxlZFNpemVcbiIsIi8qKlxuICogYXBlbWFuIHJlYWN0IHBhY2thZ2UgZm9yIHNwaW5uZXIuXG4gKiBAY2xhc3MgQXBTcGlubmVyXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnXG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJ1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcydcbmltcG9ydCBudW1jYWwgZnJvbSAnbnVtY2FsJ1xuaW1wb3J0IHtBcFB1cmVNaXhpbiwgQXBMYXlvdXRNaXhpbn0gZnJvbSAnYXBlbWFuLXJlYWN0LW1peGlucydcblxuY29uc3QgU3Bpbm5lclRoZW1lcyA9IHtcbiAgYTogWyAnZmEnLCAnZmEtc3BpbicsICdmYS1zcGlubmVyJyBdLFxuICBiOiBbICdmYScsICdmYS1zcGluJywgJ2ZhLWNpcmNsZS1vLW5vdGNoJyBdLFxuICBjOiBbICdmYScsICdmYS1zcGluJywgJ2ZhLXJlZnJlc2gnIF0sXG4gIGQ6IFsgJ2ZhJywgJ2ZhLXNwaW4nLCAnZmEtZ2VhcicgXSxcbiAgZTogWyAnZmEnLCAnZmEtc3BpbicsICdmYS1wdWxzZScgXVxufVxuY29uc3QgREVGQVVMVF9USEVNRSA9ICdjJ1xuXG4vKiogQGxlbmRzIEFwU3Bpbm5lciAqL1xuY29uc3QgQXBTcGlubmVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNwZWNzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZW5hYmxlZDogdHlwZXMuYm9vbCxcbiAgICB0aGVtZTogdHlwZXMub25lT2YoXG4gICAgICBPYmplY3Qua2V5cyhTcGlubmVyVGhlbWVzKVxuICAgIClcbiAgfSxcblxuICBtaXhpbnM6IFtcbiAgICBBcFB1cmVNaXhpbixcbiAgICBBcExheW91dE1peGluXG4gIF0sXG5cbiAgc3RhdGljczoge1xuICAgIERFRkFVTFRfVEhFTUU6IERFRkFVTFRfVEhFTUVcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUgKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgdGhlbWU6IERFRkFVTFRfVEhFTUVcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzLCBsYXlvdXRzIH0gPSBzXG4gICAgbGV0IGNsYXNzTmFtZSA9IGNsYXNzbmFtZXMoJ2FwLXNwaW5uZXInLCBwcm9wcy5jbGFzc05hbWUsIHtcbiAgICAgICdhcC1zcGlubmVyLXZpc2libGUnOiAhIWxheW91dHMuc3Bpbm5lcixcbiAgICAgICdhcC1zcGlubmVyLWVuYWJsZWQnOiAhIXByb3BzLmVuYWJsZWRcbiAgICB9KVxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17IGNsYXNzTmFtZSB9XG4gICAgICAgICAgIHN0eWxlPXsgT2JqZWN0LmFzc2lnbih7fSwgbGF5b3V0cy5zcGlubmVyLCBwcm9wcy5zdHlsZSkgfT5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtc3Bpbm5lci1hbGlnbmVyXCI+Jm5ic3A7PC9zcGFuPlxuICAgICAgICAgIDxzcGFuIHJlZj1cImljb25cIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17IGNsYXNzbmFtZXMoJ2FwLXNwaW5uZXItaWNvbicsIFNwaW5uZXJUaGVtZXNbcHJvcHMudGhlbWVdKSB9XG4gICAgICAgICAgICAgICAgc3R5bGU9eyBsYXlvdXRzLmljb24gfVxuICAgICAgICAgID5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gTGlmZWN5Y2xlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgY29tcG9uZW50RGlkTW91bnQgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gICAgcy5zZXRTdGF0ZSh7XG4gICAgICBpY29uVmlzaWJsZTogdHJ1ZVxuICAgIH0pXG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQgKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzXG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gRm9yIEFwTGF5b3V0TWl4aW5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBnZXRJbml0aWFsTGF5b3V0cyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNwaW5uZXI6IG51bGwsXG4gICAgICBpY29uOiBudWxsXG4gICAgfVxuICB9LFxuXG4gIGNhbGNMYXlvdXRzICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCBub2RlID0gUmVhY3RET00uZmluZERPTU5vZGUocylcblxuICAgIGxldCBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGUgfHwgbm9kZS5wYXJlbnRFbGVtZW50XG4gICAgbGV0IHcgPSBudW1jYWwubWF4KHBhcmVudC5vZmZzZXRXaWR0aCwgbm9kZS5vZmZzZXRXaWR0aClcbiAgICBsZXQgaCA9IG51bWNhbC5tYXgocGFyZW50Lm9mZnNldEhlaWdodCwgbm9kZS5vZmZzZXRIZWlnaHQpXG4gICAgbGV0IHNpemUgPSBudW1jYWwubWluKHcsIGgpXG4gICAgbGV0IGljb25TaXplID0gbnVtY2FsLm1pbihzaXplICogMC41LCA2MClcblxuICAgIHJldHVybiB7XG4gICAgICBzcGlubmVyOiB7XG4gICAgICAgIGxpbmVIZWlnaHQ6IGAke3NpemV9cHhgLFxuICAgICAgICBmb250U2l6ZTogYCR7aWNvblNpemV9cHhgXG4gICAgICB9LFxuICAgICAgaWNvbjoge1xuICAgICAgICB3aWR0aDogYCR7aWNvblNpemV9cHhgLFxuICAgICAgICBoZWlnaHQ6IGAke2ljb25TaXplfXB4YFxuICAgICAgfVxuICAgIH1cbiAgfVxufSlcblxuZXhwb3J0IGRlZmF1bHQgQXBTcGlubmVyXG4iLCIvKipcbiAqIFN0eWxlIGZvciBBcFNwaW5uZXIuXG4gKiBAY2xhc3MgQXBTcGlubmVyU3R5bGVcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJ1xuXG4vKiogQGxlbmRzIEFwU3Bpbm5lclN0eWxlICovXG5jb25zdCBBcFNwaW5uZXJTdHlsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgc3RhdGljczoge1xuICAgIGFsaWduZXJTdHlsZToge1xuICAgICAgd2lkdGg6IDEsXG4gICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgIG1hcmdpblJpZ2h0OiAnLTFweCcsXG4gICAgICB2ZXJ0aWNhbEFsaWduOiAnbWlkZGxlJyxcbiAgICAgIGNvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgb3BhY2l0eTogMCxcbiAgICAgIGhlaWdodDogJzEwMCUnXG4gICAgfVxuICB9LFxuICBwcm9wVHlwZXM6IHtcbiAgICBcbiAgICB0eXBlOiB0eXBlcy5zdHJpbmcsXG4gICAgc3R5bGU6IHR5cGVzLm9iamVjdFxuICB9LFxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgXG4gICAgICB0eXBlOiAndGV4dC9jc3MnLFxuICAgICAgc3R5bGU6IHt9XG4gICAgfVxuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBzID0gdGhpc1xuICAgIGxldCB7IHByb3BzIH0gPSBzXG5cbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgICcuYXAtc3Bpbm5lcic6IHtcbiAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgZGlzcGxheTogJ25vbmUnXG4gICAgICB9LFxuICAgICAgJy5hcC1zcGlubmVyLmFwLXNwaW5uZXItZW5hYmxlZCc6IHtcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuICAgICAgfSxcbiAgICAgICcuYXAtc3Bpbm5lci1pY29uJzoge1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgbWFyZ2luOiAnMCA0cHgnLFxuICAgICAgICB0cmFuc2l0aW9uOiAnb3BhY2l0eSAxMDBtcycsXG4gICAgICAgIG9wYWNpdHk6IDBcbiAgICAgIH0sXG4gICAgICAnLmFwLXNwaW5uZXItdmlzaWJsZSAuYXAtc3Bpbm5lci1pY29uJzoge1xuICAgICAgICBvcGFjaXR5OiAxXG4gICAgICB9LFxuICAgICAgJy5hcC1zcGlubmVyLWFsaWduZXInOiBBcFNwaW5uZXJTdHlsZS5hbGlnbmVyU3R5bGVcbiAgICB9XG4gICAgbGV0IHNtYWxsTWVkaWFEYXRhID0ge31cbiAgICBsZXQgbWVkaXVtTWVkaWFEYXRhID0ge31cbiAgICBsZXQgbGFyZ2VNZWRpYURhdGEgPSB7fVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxBcFN0eWxlIFxuICAgICAgICAgICAgICAgZGF0YT17IE9iamVjdC5hc3NpZ24oZGF0YSwgcHJvcHMuc3R5bGUpIH1cbiAgICAgICAgICAgICAgIHNtYWxsTWVkaWFEYXRhPXsgc21hbGxNZWRpYURhdGEgfVxuICAgICAgICAgICAgICAgbWVkaXVtTWVkaWFEYXRhPXsgbWVkaXVtTWVkaWFEYXRhIH1cbiAgICAgICAgICAgICAgIGxhcmdlTWVkaWFEYXRhPXsgbGFyZ2VNZWRpYURhdGEgfVxuICAgICAgPnsgcHJvcHMuY2hpbGRyZW4gfTwvQXBTdHlsZT5cbiAgICApXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IEFwU3Bpbm5lclN0eWxlXG4iLCIvKipcbiAqIGFwZW1hbiByZWFjdCBwYWNrYWdlIGZvciBzcGlubmVyLlxuICogQG1vZHVsZSBhcGVtYW4tcmVhY3Qtc3Bpbm5lclxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG5sZXQgZCA9IChtb2R1bGUpID0+IG1vZHVsZS5kZWZhdWx0IHx8IG1vZHVsZVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0IEFwU3Bpbm5lclN0eWxlICgpIHsgcmV0dXJuIGQocmVxdWlyZSgnLi9hcF9zcGlubmVyX3N0eWxlJykpIH0sXG4gIGdldCBBcFNwaW5uZXIgKCkgeyByZXR1cm4gZChyZXF1aXJlKCcuL2FwX3NwaW5uZXInKSkgfVxufVxuIiwiLyohXG4gKiBhc3luY1xuICogaHR0cHM6Ly9naXRodWIuY29tL2Nhb2xhbi9hc3luY1xuICpcbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQ2FvbGFuIE1jTWFob25cbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGFzeW5jID0ge307XG4gICAgZnVuY3Rpb24gbm9vcCgpIHt9XG4gICAgZnVuY3Rpb24gaWRlbnRpdHkodikge1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG9Cb29sKHYpIHtcbiAgICAgICAgcmV0dXJuICEhdjtcbiAgICB9XG4gICAgZnVuY3Rpb24gbm90SWQodikge1xuICAgICAgICByZXR1cm4gIXY7XG4gICAgfVxuXG4gICAgLy8gZ2xvYmFsIG9uIHRoZSBzZXJ2ZXIsIHdpbmRvdyBpbiB0aGUgYnJvd3NlclxuICAgIHZhciBwcmV2aW91c19hc3luYztcblxuICAgIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIChgc2VsZmApIGluIHRoZSBicm93c2VyLCBgZ2xvYmFsYFxuICAgIC8vIG9uIHRoZSBzZXJ2ZXIsIG9yIGB0aGlzYCBpbiBzb21lIHZpcnR1YWwgbWFjaGluZXMuIFdlIHVzZSBgc2VsZmBcbiAgICAvLyBpbnN0ZWFkIG9mIGB3aW5kb3dgIGZvciBgV2ViV29ya2VyYCBzdXBwb3J0LlxuICAgIHZhciByb290ID0gdHlwZW9mIHNlbGYgPT09ICdvYmplY3QnICYmIHNlbGYuc2VsZiA9PT0gc2VsZiAmJiBzZWxmIHx8XG4gICAgICAgICAgICB0eXBlb2YgZ2xvYmFsID09PSAnb2JqZWN0JyAmJiBnbG9iYWwuZ2xvYmFsID09PSBnbG9iYWwgJiYgZ2xvYmFsIHx8XG4gICAgICAgICAgICB0aGlzO1xuXG4gICAgaWYgKHJvb3QgIT0gbnVsbCkge1xuICAgICAgICBwcmV2aW91c19hc3luYyA9IHJvb3QuYXN5bmM7XG4gICAgfVxuXG4gICAgYXN5bmMubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcm9vdC5hc3luYyA9IHByZXZpb3VzX2FzeW5jO1xuICAgICAgICByZXR1cm4gYXN5bmM7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG9ubHlfb25jZShmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZm4gPT09IG51bGwpIHRocm93IG5ldyBFcnJvcihcIkNhbGxiYWNrIHdhcyBhbHJlYWR5IGNhbGxlZC5cIik7XG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgZm4gPSBudWxsO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9vbmNlKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChmbiA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZuID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLy8vIGNyb3NzLWJyb3dzZXIgY29tcGF0aWJsaXR5IGZ1bmN0aW9ucyAvLy8vXG5cbiAgICB2YXIgX3RvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuICAgIHZhciBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gX3RvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9O1xuXG4gICAgLy8gUG9ydGVkIGZyb20gdW5kZXJzY29yZS5qcyBpc09iamVjdFxuICAgIHZhciBfaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqO1xuICAgICAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlID09PSAnb2JqZWN0JyAmJiAhIW9iajtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2lzQXJyYXlMaWtlKGFycikge1xuICAgICAgICByZXR1cm4gX2lzQXJyYXkoYXJyKSB8fCAoXG4gICAgICAgICAgICAvLyBoYXMgYSBwb3NpdGl2ZSBpbnRlZ2VyIGxlbmd0aCBwcm9wZXJ0eVxuICAgICAgICAgICAgdHlwZW9mIGFyci5sZW5ndGggPT09IFwibnVtYmVyXCIgJiZcbiAgICAgICAgICAgIGFyci5sZW5ndGggPj0gMCAmJlxuICAgICAgICAgICAgYXJyLmxlbmd0aCAlIDEgPT09IDBcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfYXJyYXlFYWNoKGFyciwgaXRlcmF0b3IpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnIubGVuZ3RoO1xuXG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihhcnJbaW5kZXhdLCBpbmRleCwgYXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9tYXAoYXJyLCBpdGVyYXRvcikge1xuICAgICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICAgIGxlbmd0aCA9IGFyci5sZW5ndGgsXG4gICAgICAgICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICByZXN1bHRbaW5kZXhdID0gaXRlcmF0b3IoYXJyW2luZGV4XSwgaW5kZXgsIGFycik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcmFuZ2UoY291bnQpIHtcbiAgICAgICAgcmV0dXJuIF9tYXAoQXJyYXkoY291bnQpLCBmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gaTsgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlZHVjZShhcnIsIGl0ZXJhdG9yLCBtZW1vKSB7XG4gICAgICAgIF9hcnJheUVhY2goYXJyLCBmdW5jdGlvbiAoeCwgaSwgYSkge1xuICAgICAgICAgICAgbWVtbyA9IGl0ZXJhdG9yKG1lbW8sIHgsIGksIGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2ZvckVhY2hPZihvYmplY3QsIGl0ZXJhdG9yKSB7XG4gICAgICAgIF9hcnJheUVhY2goX2tleXMob2JqZWN0KSwgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaXRlcmF0b3Iob2JqZWN0W2tleV0sIGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9pbmRleE9mKGFyciwgaXRlbSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFycltpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIHZhciBfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIGtleXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9rZXlJdGVyYXRvcihjb2xsKSB7XG4gICAgICAgIHZhciBpID0gLTE7XG4gICAgICAgIHZhciBsZW47XG4gICAgICAgIHZhciBrZXlzO1xuICAgICAgICBpZiAoX2lzQXJyYXlMaWtlKGNvbGwpKSB7XG4gICAgICAgICAgICBsZW4gPSBjb2xsLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gaSA8IGxlbiA/IGkgOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtleXMgPSBfa2V5cyhjb2xsKTtcbiAgICAgICAgICAgIGxlbiA9IGtleXMubGVuZ3RoO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIHJldHVybiBpIDwgbGVuID8ga2V5c1tpXSA6IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2ltaWxhciB0byBFUzYncyByZXN0IHBhcmFtIChodHRwOi8vYXJpeWEub2ZpbGFicy5jb20vMjAxMy8wMy9lczYtYW5kLXJlc3QtcGFyYW1ldGVyLmh0bWwpXG4gICAgLy8gVGhpcyBhY2N1bXVsYXRlcyB0aGUgYXJndW1lbnRzIHBhc3NlZCBpbnRvIGFuIGFycmF5LCBhZnRlciBhIGdpdmVuIGluZGV4LlxuICAgIC8vIEZyb20gdW5kZXJzY29yZS5qcyAoaHR0cHM6Ly9naXRodWIuY29tL2phc2hrZW5hcy91bmRlcnNjb3JlL3B1bGwvMjE0MCkuXG4gICAgZnVuY3Rpb24gX3Jlc3RQYXJhbShmdW5jLCBzdGFydEluZGV4KSB7XG4gICAgICAgIHN0YXJ0SW5kZXggPSBzdGFydEluZGV4ID09IG51bGwgPyBmdW5jLmxlbmd0aCAtIDEgOiArc3RhcnRJbmRleDtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KGFyZ3VtZW50cy5sZW5ndGggLSBzdGFydEluZGV4LCAwKTtcbiAgICAgICAgICAgIHZhciByZXN0ID0gQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICByZXN0W2luZGV4XSA9IGFyZ3VtZW50c1tpbmRleCArIHN0YXJ0SW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChzdGFydEluZGV4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJlc3QpO1xuICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBhcmd1bWVudHNbMF0sIHJlc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ3VycmVudGx5IHVudXNlZCBidXQgaGFuZGxlIGNhc2VzIG91dHNpZGUgb2YgdGhlIHN3aXRjaCBzdGF0ZW1lbnQ6XG4gICAgICAgICAgICAvLyB2YXIgYXJncyA9IEFycmF5KHN0YXJ0SW5kZXggKyAxKTtcbiAgICAgICAgICAgIC8vIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IHN0YXJ0SW5kZXg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIC8vICAgICBhcmdzW2luZGV4XSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBhcmdzW3N0YXJ0SW5kZXhdID0gcmVzdDtcbiAgICAgICAgICAgIC8vIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcmF0b3IodmFsdWUsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLy8vIGV4cG9ydGVkIGFzeW5jIG1vZHVsZSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgLy8vLyBuZXh0VGljayBpbXBsZW1lbnRhdGlvbiB3aXRoIGJyb3dzZXItY29tcGF0aWJsZSBmYWxsYmFjayAvLy8vXG5cbiAgICAvLyBjYXB0dXJlIHRoZSBnbG9iYWwgcmVmZXJlbmNlIHRvIGd1YXJkIGFnYWluc3QgZmFrZVRpbWVyIG1vY2tzXG4gICAgdmFyIF9zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nICYmIHNldEltbWVkaWF0ZTtcblxuICAgIHZhciBfZGVsYXkgPSBfc2V0SW1tZWRpYXRlID8gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgLy8gbm90IGEgZGlyZWN0IGFsaWFzIGZvciBJRTEwIGNvbXBhdGliaWxpdHlcbiAgICAgICAgX3NldEltbWVkaWF0ZShmbik7XG4gICAgfSA6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwcm9jZXNzLm5leHRUaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGFzeW5jLm5leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICB9IGVsc2Uge1xuICAgICAgICBhc3luYy5uZXh0VGljayA9IF9kZWxheTtcbiAgICB9XG4gICAgYXN5bmMuc2V0SW1tZWRpYXRlID0gX3NldEltbWVkaWF0ZSA/IF9kZWxheSA6IGFzeW5jLm5leHRUaWNrO1xuXG5cbiAgICBhc3luYy5mb3JFYWNoID1cbiAgICBhc3luYy5lYWNoID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5lYWNoT2YoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5mb3JFYWNoU2VyaWVzID1cbiAgICBhc3luYy5lYWNoU2VyaWVzID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5lYWNoT2ZTZXJpZXMoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cblxuICAgIGFzeW5jLmZvckVhY2hMaW1pdCA9XG4gICAgYXN5bmMuZWFjaExpbWl0ID0gZnVuY3Rpb24gKGFyciwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gX2VhY2hPZkxpbWl0KGxpbWl0KShhcnIsIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hPZiA9XG4gICAgYXN5bmMuZWFjaE9mID0gZnVuY3Rpb24gKG9iamVjdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIG9iamVjdCA9IG9iamVjdCB8fCBbXTtcblxuICAgICAgICB2YXIgaXRlciA9IF9rZXlJdGVyYXRvcihvYmplY3QpO1xuICAgICAgICB2YXIga2V5LCBjb21wbGV0ZWQgPSAwO1xuXG4gICAgICAgIHdoaWxlICgoa2V5ID0gaXRlcigpKSAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb21wbGV0ZWQgKz0gMTtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG9iamVjdFtrZXldLCBrZXksIG9ubHlfb25jZShkb25lKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tcGxldGVkID09PSAwKSBjYWxsYmFjayhudWxsKTtcblxuICAgICAgICBmdW5jdGlvbiBkb25lKGVycikge1xuICAgICAgICAgICAgY29tcGxldGVkLS07XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENoZWNrIGtleSBpcyBudWxsIGluIGNhc2UgaXRlcmF0b3IgaXNuJ3QgZXhoYXVzdGVkXG4gICAgICAgICAgICAvLyBhbmQgZG9uZSByZXNvbHZlZCBzeW5jaHJvbm91c2x5LlxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5ID09PSBudWxsICYmIGNvbXBsZXRlZCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMuZm9yRWFjaE9mU2VyaWVzID1cbiAgICBhc3luYy5lYWNoT2ZTZXJpZXMgPSBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgb2JqID0gb2JqIHx8IFtdO1xuICAgICAgICB2YXIgbmV4dEtleSA9IF9rZXlJdGVyYXRvcihvYmopO1xuICAgICAgICB2YXIga2V5ID0gbmV4dEtleSgpO1xuICAgICAgICBmdW5jdGlvbiBpdGVyYXRlKCkge1xuICAgICAgICAgICAgdmFyIHN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZXJhdG9yKG9ialtrZXldLCBrZXksIG9ubHlfb25jZShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAga2V5ID0gbmV4dEtleSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3luYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShpdGVyYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgc3luYyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGl0ZXJhdGUoKTtcbiAgICB9O1xuXG5cblxuICAgIGFzeW5jLmZvckVhY2hPZkxpbWl0ID1cbiAgICBhc3luYy5lYWNoT2ZMaW1pdCA9IGZ1bmN0aW9uIChvYmosIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgX2VhY2hPZkxpbWl0KGxpbWl0KShvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9lYWNoT2ZMaW1pdChsaW1pdCkge1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgICAgICBvYmogPSBvYmogfHwgW107XG4gICAgICAgICAgICB2YXIgbmV4dEtleSA9IF9rZXlJdGVyYXRvcihvYmopO1xuICAgICAgICAgICAgaWYgKGxpbWl0IDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIHJ1bm5pbmcgPSAwO1xuICAgICAgICAgICAgdmFyIGVycm9yZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgKGZ1bmN0aW9uIHJlcGxlbmlzaCAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvbmUgJiYgcnVubmluZyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAocnVubmluZyA8IGxpbWl0ICYmICFlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBuZXh0S2V5KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmcgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3Iob2JqW2tleV0sIGtleSwgb25seV9vbmNlKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwbGVuaXNoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSgpO1xuICAgICAgICB9O1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZG9QYXJhbGxlbChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oYXN5bmMuZWFjaE9mLCBvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRvUGFyYWxsZWxMaW1pdChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKF9lYWNoT2ZMaW1pdChsaW1pdCksIG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZG9TZXJpZXMoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGFzeW5jLmVhY2hPZlNlcmllcywgb2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9hc3luY01hcChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIGFyciA9IGFyciB8fCBbXTtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBfaXNBcnJheUxpa2UoYXJyKSA/IFtdIDoge307XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih2YWx1ZSwgZnVuY3Rpb24gKGVyciwgdikge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gdjtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLm1hcCA9IGRvUGFyYWxsZWwoX2FzeW5jTWFwKTtcbiAgICBhc3luYy5tYXBTZXJpZXMgPSBkb1NlcmllcyhfYXN5bmNNYXApO1xuICAgIGFzeW5jLm1hcExpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9hc3luY01hcCk7XG5cbiAgICAvLyByZWR1Y2Ugb25seSBoYXMgYSBzZXJpZXMgdmVyc2lvbiwgYXMgZG9pbmcgcmVkdWNlIGluIHBhcmFsbGVsIHdvbid0XG4gICAgLy8gd29yayBpbiBtYW55IHNpdHVhdGlvbnMuXG4gICAgYXN5bmMuaW5qZWN0ID1cbiAgICBhc3luYy5mb2xkbCA9XG4gICAgYXN5bmMucmVkdWNlID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGFzeW5jLmVhY2hPZlNlcmllcyhhcnIsIGZ1bmN0aW9uICh4LCBpLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IobWVtbywgeCwgZnVuY3Rpb24gKGVyciwgdikge1xuICAgICAgICAgICAgICAgIG1lbW8gPSB2O1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBtZW1vKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFzeW5jLmZvbGRyID1cbiAgICBhc3luYy5yZWR1Y2VSaWdodCA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmV2ZXJzZWQgPSBfbWFwKGFyciwgaWRlbnRpdHkpLnJldmVyc2UoKTtcbiAgICAgICAgYXN5bmMucmVkdWNlKHJldmVyc2VkLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gaXRlcmF0b3I7XG4gICAgICAgICAgICBpdGVyYXRvciA9IG1lbW87XG4gICAgICAgICAgICBtZW1vID0gX2lzQXJyYXkoYXJyKSA/IFtdIDoge307XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYy5lYWNoT2YoYXJyLCBmdW5jdGlvbih2LCBrLCBjYikge1xuICAgICAgICAgICAgaXRlcmF0b3IobWVtbywgdiwgaywgY2IpO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgbWVtbyk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfZmlsdGVyKGVhY2hmbiwgYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHgsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IoeCwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe2luZGV4OiBpbmRleCwgdmFsdWU6IHh9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhfbWFwKHJlc3VsdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmluZGV4IC0gYi5pbmRleDtcbiAgICAgICAgICAgIH0pLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5zZWxlY3QgPVxuICAgIGFzeW5jLmZpbHRlciA9IGRvUGFyYWxsZWwoX2ZpbHRlcik7XG5cbiAgICBhc3luYy5zZWxlY3RMaW1pdCA9XG4gICAgYXN5bmMuZmlsdGVyTGltaXQgPSBkb1BhcmFsbGVsTGltaXQoX2ZpbHRlcik7XG5cbiAgICBhc3luYy5zZWxlY3RTZXJpZXMgPVxuICAgIGFzeW5jLmZpbHRlclNlcmllcyA9IGRvU2VyaWVzKF9maWx0ZXIpO1xuXG4gICAgZnVuY3Rpb24gX3JlamVjdChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9maWx0ZXIoZWFjaGZuLCBhcnIsIGZ1bmN0aW9uKHZhbHVlLCBjYikge1xuICAgICAgICAgICAgaXRlcmF0b3IodmFsdWUsIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgICAgICBjYighdik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH1cbiAgICBhc3luYy5yZWplY3QgPSBkb1BhcmFsbGVsKF9yZWplY3QpO1xuICAgIGFzeW5jLnJlamVjdExpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9yZWplY3QpO1xuICAgIGFzeW5jLnJlamVjdFNlcmllcyA9IGRvU2VyaWVzKF9yZWplY3QpO1xuXG4gICAgZnVuY3Rpb24gX2NyZWF0ZVRlc3RlcihlYWNoZm4sIGNoZWNrLCBnZXRSZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFyciwgbGltaXQsIGl0ZXJhdG9yLCBjYikge1xuICAgICAgICAgICAgZnVuY3Rpb24gZG9uZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2IpIGNiKGdldFJlc3VsdChmYWxzZSwgdm9pZCAwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBpdGVyYXRlZSh4LCBfLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmICghY2IpIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYiAmJiBjaGVjayh2KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IoZ2V0UmVzdWx0KHRydWUsIHgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiID0gaXRlcmF0b3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAzKSB7XG4gICAgICAgICAgICAgICAgZWFjaGZuKGFyciwgbGltaXQsIGl0ZXJhdGVlLCBkb25lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2IgPSBpdGVyYXRvcjtcbiAgICAgICAgICAgICAgICBpdGVyYXRvciA9IGxpbWl0O1xuICAgICAgICAgICAgICAgIGVhY2hmbihhcnIsIGl0ZXJhdGVlLCBkb25lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYy5hbnkgPVxuICAgIGFzeW5jLnNvbWUgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZiwgdG9Cb29sLCBpZGVudGl0eSk7XG5cbiAgICBhc3luYy5zb21lTGltaXQgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZkxpbWl0LCB0b0Jvb2wsIGlkZW50aXR5KTtcblxuICAgIGFzeW5jLmFsbCA9XG4gICAgYXN5bmMuZXZlcnkgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZiwgbm90SWQsIG5vdElkKTtcblxuICAgIGFzeW5jLmV2ZXJ5TGltaXQgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZkxpbWl0LCBub3RJZCwgbm90SWQpO1xuXG4gICAgZnVuY3Rpb24gX2ZpbmRHZXRSZXN1bHQodiwgeCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgYXN5bmMuZGV0ZWN0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIGlkZW50aXR5LCBfZmluZEdldFJlc3VsdCk7XG4gICAgYXN5bmMuZGV0ZWN0U2VyaWVzID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZTZXJpZXMsIGlkZW50aXR5LCBfZmluZEdldFJlc3VsdCk7XG4gICAgYXN5bmMuZGV0ZWN0TGltaXQgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZkxpbWl0LCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuXG4gICAgYXN5bmMuc29ydEJ5ID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGFzeW5jLm1hcChhcnIsIGZ1bmN0aW9uICh4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IoeCwgZnVuY3Rpb24gKGVyciwgY3JpdGVyaWEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB7dmFsdWU6IHgsIGNyaXRlcmlhOiBjcml0ZXJpYX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCByZXN1bHRzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBfbWFwKHJlc3VsdHMuc29ydChjb21wYXJhdG9yKSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHgudmFsdWU7XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXBhcmF0b3IobGVmdCwgcmlnaHQpIHtcbiAgICAgICAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYSwgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgICAgICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmF1dG8gPSBmdW5jdGlvbiAodGFza3MsIGNvbmN1cnJlbmN5LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1sxXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgLy8gY29uY3VycmVuY3kgaXMgb3B0aW9uYWwsIHNoaWZ0IHRoZSBhcmdzLlxuICAgICAgICAgICAgY2FsbGJhY2sgPSBjb25jdXJyZW5jeTtcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICB2YXIga2V5cyA9IF9rZXlzKHRhc2tzKTtcbiAgICAgICAgdmFyIHJlbWFpbmluZ1Rhc2tzID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIGlmICghcmVtYWluaW5nVGFza3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IHJlbWFpbmluZ1Rhc2tzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgdmFyIHJ1bm5pbmdUYXNrcyA9IDA7XG5cbiAgICAgICAgdmFyIGhhc0Vycm9yID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IFtdO1xuICAgICAgICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihmbikge1xuICAgICAgICAgICAgbGlzdGVuZXJzLnVuc2hpZnQoZm4pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGZuKSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gX2luZGV4T2YobGlzdGVuZXJzLCBmbik7XG4gICAgICAgICAgICBpZiAoaWR4ID49IDApIGxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB0YXNrQ29tcGxldGUoKSB7XG4gICAgICAgICAgICByZW1haW5pbmdUYXNrcy0tO1xuICAgICAgICAgICAgX2FycmF5RWFjaChsaXN0ZW5lcnMuc2xpY2UoMCksIGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZExpc3RlbmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghcmVtYWluaW5nVGFza3MpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX2FycmF5RWFjaChrZXlzLCBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgaWYgKGhhc0Vycm9yKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgdGFzayA9IF9pc0FycmF5KHRhc2tzW2tdKSA/IHRhc2tzW2tdOiBbdGFza3Nba11dO1xuICAgICAgICAgICAgdmFyIHRhc2tDYWxsYmFjayA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcnVubmluZ1Rhc2tzLS07XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNhZmVSZXN1bHRzID0ge307XG4gICAgICAgICAgICAgICAgICAgIF9mb3JFYWNoT2YocmVzdWx0cywgZnVuY3Rpb24odmFsLCBya2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1tya2V5XSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHNhZmVSZXN1bHRzW2tdID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3IgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgc2FmZVJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZSh0YXNrQ29tcGxldGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHJlcXVpcmVzID0gdGFzay5zbGljZSgwLCB0YXNrLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgLy8gcHJldmVudCBkZWFkLWxvY2tzXG4gICAgICAgICAgICB2YXIgbGVuID0gcmVxdWlyZXMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGRlcDtcbiAgICAgICAgICAgIHdoaWxlIChsZW4tLSkge1xuICAgICAgICAgICAgICAgIGlmICghKGRlcCA9IHRhc2tzW3JlcXVpcmVzW2xlbl1dKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hhcyBub25leGlzdGVudCBkZXBlbmRlbmN5IGluICcgKyByZXF1aXJlcy5qb2luKCcsICcpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKF9pc0FycmF5KGRlcCkgJiYgX2luZGV4T2YoZGVwLCBrKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSGFzIGN5Y2xpYyBkZXBlbmRlbmNpZXMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZ1Rhc2tzIDwgY29uY3VycmVuY3kgJiYgX3JlZHVjZShyZXF1aXJlcywgZnVuY3Rpb24gKGEsIHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChhICYmIHJlc3VsdHMuaGFzT3duUHJvcGVydHkoeCkpO1xuICAgICAgICAgICAgICAgIH0sIHRydWUpICYmICFyZXN1bHRzLmhhc093blByb3BlcnR5KGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlYWR5KCkpIHtcbiAgICAgICAgICAgICAgICBydW5uaW5nVGFza3MrKztcbiAgICAgICAgICAgICAgICB0YXNrW3Rhc2subGVuZ3RoIC0gMV0odGFza0NhbGxiYWNrLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGxpc3RlbmVyKCkge1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdUYXNrcysrO1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIHRhc2tbdGFzay5sZW5ndGggLSAxXSh0YXNrQ2FsbGJhY2ssIHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG5cbiAgICBhc3luYy5yZXRyeSA9IGZ1bmN0aW9uKHRpbWVzLCB0YXNrLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgREVGQVVMVF9USU1FUyA9IDU7XG4gICAgICAgIHZhciBERUZBVUxUX0lOVEVSVkFMID0gMDtcblxuICAgICAgICB2YXIgYXR0ZW1wdHMgPSBbXTtcblxuICAgICAgICB2YXIgb3B0cyA9IHtcbiAgICAgICAgICAgIHRpbWVzOiBERUZBVUxUX1RJTUVTLFxuICAgICAgICAgICAgaW50ZXJ2YWw6IERFRkFVTFRfSU5URVJWQUxcbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiBwYXJzZVRpbWVzKGFjYywgdCl7XG4gICAgICAgICAgICBpZih0eXBlb2YgdCA9PT0gJ251bWJlcicpe1xuICAgICAgICAgICAgICAgIGFjYy50aW1lcyA9IHBhcnNlSW50KHQsIDEwKSB8fCBERUZBVUxUX1RJTUVTO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHR5cGVvZiB0ID09PSAnb2JqZWN0Jyl7XG4gICAgICAgICAgICAgICAgYWNjLnRpbWVzID0gcGFyc2VJbnQodC50aW1lcywgMTApIHx8IERFRkFVTFRfVElNRVM7XG4gICAgICAgICAgICAgICAgYWNjLmludGVydmFsID0gcGFyc2VJbnQodC5pbnRlcnZhbCwgMTApIHx8IERFRkFVTFRfSU5URVJWQUw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgYXJndW1lbnQgdHlwZSBmb3IgXFwndGltZXNcXCc6ICcgKyB0eXBlb2YgdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbmd0aCA8IDEgfHwgbGVuZ3RoID4gMykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGFyZ3VtZW50cyAtIG11c3QgYmUgZWl0aGVyICh0YXNrKSwgKHRhc2ssIGNhbGxiYWNrKSwgKHRpbWVzLCB0YXNrKSBvciAodGltZXMsIHRhc2ssIGNhbGxiYWNrKScpO1xuICAgICAgICB9IGVsc2UgaWYgKGxlbmd0aCA8PSAyICYmIHR5cGVvZiB0aW1lcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSB0YXNrO1xuICAgICAgICAgICAgdGFzayA9IHRpbWVzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGltZXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHBhcnNlVGltZXMob3B0cywgdGltZXMpO1xuICAgICAgICB9XG4gICAgICAgIG9wdHMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgb3B0cy50YXNrID0gdGFzaztcblxuICAgICAgICBmdW5jdGlvbiB3cmFwcGVkVGFzayh3cmFwcGVkQ2FsbGJhY2ssIHdyYXBwZWRSZXN1bHRzKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiByZXRyeUF0dGVtcHQodGFzaywgZmluYWxBdHRlbXB0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNlcmllc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2soZnVuY3Rpb24oZXJyLCByZXN1bHQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzQ2FsbGJhY2soIWVyciB8fCBmaW5hbEF0dGVtcHQsIHtlcnI6IGVyciwgcmVzdWx0OiByZXN1bHR9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgd3JhcHBlZFJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJldHJ5SW50ZXJ2YWwoaW50ZXJ2YWwpe1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzZXJpZXNDYWxsYmFjayl7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9LCBpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2hpbGUgKG9wdHMudGltZXMpIHtcblxuICAgICAgICAgICAgICAgIHZhciBmaW5hbEF0dGVtcHQgPSAhKG9wdHMudGltZXMtPTEpO1xuICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlBdHRlbXB0KG9wdHMudGFzaywgZmluYWxBdHRlbXB0KSk7XG4gICAgICAgICAgICAgICAgaWYoIWZpbmFsQXR0ZW1wdCAmJiBvcHRzLmludGVydmFsID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlJbnRlcnZhbChvcHRzLmludGVydmFsKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhc3luYy5zZXJpZXMoYXR0ZW1wdHMsIGZ1bmN0aW9uKGRvbmUsIGRhdGEpe1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhW2RhdGEubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgKHdyYXBwZWRDYWxsYmFjayB8fCBvcHRzLmNhbGxiYWNrKShkYXRhLmVyciwgZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGNhbGxiYWNrIGlzIHBhc3NlZCwgcnVuIHRoaXMgYXMgYSBjb250cm9sbCBmbG93XG4gICAgICAgIHJldHVybiBvcHRzLmNhbGxiYWNrID8gd3JhcHBlZFRhc2soKSA6IHdyYXBwZWRUYXNrO1xuICAgIH07XG5cbiAgICBhc3luYy53YXRlcmZhbGwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIGlmICghX2lzQXJyYXkodGFza3MpKSB7XG4gICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byB3YXRlcmZhbGwgbXVzdCBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMnKTtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB3cmFwSXRlcmF0b3IoaXRlcmF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIFtlcnJdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaCh3cmFwSXRlcmF0b3IobmV4dCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbnN1cmVBc3luYyhpdGVyYXRvcikuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgd3JhcEl0ZXJhdG9yKGFzeW5jLml0ZXJhdG9yKHRhc2tzKSkoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX3BhcmFsbGVsKGVhY2hmbiwgdGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBfaXNBcnJheUxpa2UodGFza3MpID8gW10gOiB7fTtcblxuICAgICAgICBlYWNoZm4odGFza3MsIGZ1bmN0aW9uICh0YXNrLCBrZXksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0YXNrKF9yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRzW2tleV0gPSBhcmdzO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLnBhcmFsbGVsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoYXN5bmMuZWFjaE9mLCB0YXNrcywgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5wYXJhbGxlbExpbWl0ID0gZnVuY3Rpb24odGFza3MsIGxpbWl0LCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoX2VhY2hPZkxpbWl0KGxpbWl0KSwgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuc2VyaWVzID0gZnVuY3Rpb24odGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbChhc3luYy5lYWNoT2ZTZXJpZXMsIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLml0ZXJhdG9yID0gZnVuY3Rpb24gKHRhc2tzKSB7XG4gICAgICAgIGZ1bmN0aW9uIG1ha2VDYWxsYmFjayhpbmRleCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gZm4oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0YXNrc1tpbmRleF0uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLm5leHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZuLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChpbmRleCA8IHRhc2tzLmxlbmd0aCAtIDEpID8gbWFrZUNhbGxiYWNrKGluZGV4ICsgMSk6IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGZuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYWtlQ2FsbGJhY2soMCk7XG4gICAgfTtcblxuICAgIGFzeW5jLmFwcGx5ID0gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZm4sIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGNhbGxBcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkoXG4gICAgICAgICAgICAgICAgbnVsbCwgYXJncy5jb25jYXQoY2FsbEFyZ3MpXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIF9jb25jYXQoZWFjaGZuLCBhcnIsIGZuLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBpbmRleCwgY2IpIHtcbiAgICAgICAgICAgIGZuKHgsIGZ1bmN0aW9uIChlcnIsIHkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHkgfHwgW10pO1xuICAgICAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMuY29uY2F0ID0gZG9QYXJhbGxlbChfY29uY2F0KTtcbiAgICBhc3luYy5jb25jYXRTZXJpZXMgPSBkb1NlcmllcyhfY29uY2F0KTtcblxuICAgIGFzeW5jLndoaWxzdCA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuICAgICAgICBpZiAodGVzdCgpKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGVzdC5hcHBseSh0aGlzLCBhcmdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBbbnVsbF0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG5leHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMuZG9XaGlsc3QgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjYWxscyA9IDA7XG4gICAgICAgIHJldHVybiBhc3luYy53aGlsc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gKytjYWxscyA8PSAxIHx8IHRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMudW50aWwgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy53aGlsc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZG9VbnRpbCA9IGZ1bmN0aW9uIChpdGVyYXRvciwgdGVzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLmRvV2hpbHN0KGl0ZXJhdG9yLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAhdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmR1cmluZyA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuXG4gICAgICAgIHZhciBuZXh0ID0gX3Jlc3RQYXJhbShmdW5jdGlvbihlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goY2hlY2spO1xuICAgICAgICAgICAgICAgIHRlc3QuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKGVyciwgdHJ1dGgpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0cnV0aCkge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG5leHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0ZXN0KGNoZWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZG9EdXJpbmcgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjYWxscyA9IDA7XG4gICAgICAgIGFzeW5jLmR1cmluZyhmdW5jdGlvbihuZXh0KSB7XG4gICAgICAgICAgICBpZiAoY2FsbHMrKyA8IDEpIHtcbiAgICAgICAgICAgICAgICBuZXh0KG51bGwsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9xdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5LCBwYXlsb2FkKSB7XG4gICAgICAgIGlmIChjb25jdXJyZW5jeSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihjb25jdXJyZW5jeSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25jdXJyZW5jeSBtdXN0IG5vdCBiZSB6ZXJvJyk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX2luc2VydChxLCBkYXRhLCBwb3MsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCAmJiB0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRhc2sgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcS5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gW2RhdGFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT09IDAgJiYgcS5pZGxlKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsIGRyYWluIGltbWVkaWF0ZWx5IGlmIHRoZXJlIGFyZSBubyB0YXNrc1xuICAgICAgICAgICAgICAgIHJldHVybiBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9hcnJheUVhY2goZGF0YSwgZnVuY3Rpb24odGFzaykge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0YXNrLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2sgfHwgbm9vcFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAocG9zKSB7XG4gICAgICAgICAgICAgICAgICAgIHEudGFza3MudW5zaGlmdChpdGVtKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSBxLmNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBfbmV4dChxLCB0YXNrcykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgd29ya2VycyAtPSAxO1xuXG4gICAgICAgICAgICAgICAgdmFyIHJlbW92ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBfYXJyYXlFYWNoKHRhc2tzLCBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgICAgICAgICBfYXJyYXlFYWNoKHdvcmtlcnNMaXN0LCBmdW5jdGlvbiAod29ya2VyLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmtlciA9PT0gdGFzayAmJiAhcmVtb3ZlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtlcnNMaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHRhc2suY2FsbGJhY2suYXBwbHkodGFzaywgYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHEucHJvY2VzcygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3b3JrZXJzID0gMDtcbiAgICAgICAgdmFyIHdvcmtlcnNMaXN0ID0gW107XG4gICAgICAgIHZhciBxID0ge1xuICAgICAgICAgICAgdGFza3M6IFtdLFxuICAgICAgICAgICAgY29uY3VycmVuY3k6IGNvbmN1cnJlbmN5LFxuICAgICAgICAgICAgcGF5bG9hZDogcGF5bG9hZCxcbiAgICAgICAgICAgIHNhdHVyYXRlZDogbm9vcCxcbiAgICAgICAgICAgIGVtcHR5OiBub29wLFxuICAgICAgICAgICAgZHJhaW46IG5vb3AsXG4gICAgICAgICAgICBzdGFydGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHBhdXNlZDogZmFsc2UsXG4gICAgICAgICAgICBwdXNoOiBmdW5jdGlvbiAoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIGZhbHNlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAga2lsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHEuZHJhaW4gPSBub29wO1xuICAgICAgICAgICAgICAgIHEudGFza3MgPSBbXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bnNoaWZ0OiBmdW5jdGlvbiAoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIHRydWUsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUoIXEucGF1c2VkICYmIHdvcmtlcnMgPCBxLmNvbmN1cnJlbmN5ICYmIHEudGFza3MubGVuZ3RoKXtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFza3MgPSBxLnBheWxvYWQgP1xuICAgICAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoMCwgcS5wYXlsb2FkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnNwbGljZSgwLCBxLnRhc2tzLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBfbWFwKHRhc2tzLCBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhc2suZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgd29ya2VycyArPSAxO1xuICAgICAgICAgICAgICAgICAgICB3b3JrZXJzTGlzdC5wdXNoKHRhc2tzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNiID0gb25seV9vbmNlKF9uZXh0KHEsIHRhc2tzKSk7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcihkYXRhLCBjYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxlbmd0aDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnRhc2tzLmxlbmd0aDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBydW5uaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmtlcnM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd29ya2Vyc0xpc3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2Vyc0xpc3Q7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWRsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEudGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXVzZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocS5wYXVzZWQgPT09IGZhbHNlKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VtZUNvdW50ID0gTWF0aC5taW4ocS5jb25jdXJyZW5jeSwgcS50YXNrcy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIE5lZWQgdG8gY2FsbCBxLnByb2Nlc3Mgb25jZSBwZXIgY29uY3VycmVudFxuICAgICAgICAgICAgICAgIC8vIHdvcmtlciB0byBwcmVzZXJ2ZSBmdWxsIGNvbmN1cnJlbmN5IGFmdGVyIHBhdXNlXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdyA9IDE7IHcgPD0gcmVzdW1lQ291bnQ7IHcrKykge1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBxO1xuICAgIH1cblxuICAgIGFzeW5jLnF1ZXVlID0gZnVuY3Rpb24gKHdvcmtlciwgY29uY3VycmVuY3kpIHtcbiAgICAgICAgdmFyIHEgPSBfcXVldWUoZnVuY3Rpb24gKGl0ZW1zLCBjYikge1xuICAgICAgICAgICAgd29ya2VyKGl0ZW1zWzBdLCBjYik7XG4gICAgICAgIH0sIGNvbmN1cnJlbmN5LCAxKTtcblxuICAgICAgICByZXR1cm4gcTtcbiAgICB9O1xuXG4gICAgYXN5bmMucHJpb3JpdHlRdWV1ZSA9IGZ1bmN0aW9uICh3b3JrZXIsIGNvbmN1cnJlbmN5KSB7XG5cbiAgICAgICAgZnVuY3Rpb24gX2NvbXBhcmVUYXNrcyhhLCBiKXtcbiAgICAgICAgICAgIHJldHVybiBhLnByaW9yaXR5IC0gYi5wcmlvcml0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9iaW5hcnlTZWFyY2goc2VxdWVuY2UsIGl0ZW0sIGNvbXBhcmUpIHtcbiAgICAgICAgICAgIHZhciBiZWcgPSAtMSxcbiAgICAgICAgICAgICAgICBlbmQgPSBzZXF1ZW5jZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgd2hpbGUgKGJlZyA8IGVuZCkge1xuICAgICAgICAgICAgICAgIHZhciBtaWQgPSBiZWcgKyAoKGVuZCAtIGJlZyArIDEpID4+PiAxKTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGFyZShpdGVtLCBzZXF1ZW5jZVttaWRdKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlZyA9IG1pZDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbmQgPSBtaWQgLSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBiZWc7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwgJiYgdHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0YXNrIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIV9pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbCBkcmFpbiBpbW1lZGlhdGVseSBpZiB0aGVyZSBhcmUgbm8gdGFza3NcbiAgICAgICAgICAgICAgICByZXR1cm4gYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfYXJyYXlFYWNoKGRhdGEsIGZ1bmN0aW9uKHRhc2spIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgICAgcHJpb3JpdHk6IHByaW9yaXR5LFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nID8gY2FsbGJhY2sgOiBub29wXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKF9iaW5hcnlTZWFyY2gocS50YXNrcywgaXRlbSwgX2NvbXBhcmVUYXNrcykgKyAxLCAwLCBpdGVtKTtcblxuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gcS5jb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgICAgICBxLnNhdHVyYXRlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RhcnQgd2l0aCBhIG5vcm1hbCBxdWV1ZVxuICAgICAgICB2YXIgcSA9IGFzeW5jLnF1ZXVlKHdvcmtlciwgY29uY3VycmVuY3kpO1xuXG4gICAgICAgIC8vIE92ZXJyaWRlIHB1c2ggdG8gYWNjZXB0IHNlY29uZCBwYXJhbWV0ZXIgcmVwcmVzZW50aW5nIHByaW9yaXR5XG4gICAgICAgIHEucHVzaCA9IGZ1bmN0aW9uIChkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBSZW1vdmUgdW5zaGlmdCBmdW5jdGlvblxuICAgICAgICBkZWxldGUgcS51bnNoaWZ0O1xuXG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG5cbiAgICBhc3luYy5jYXJnbyA9IGZ1bmN0aW9uICh3b3JrZXIsIHBheWxvYWQpIHtcbiAgICAgICAgcmV0dXJuIF9xdWV1ZSh3b3JrZXIsIDEsIHBheWxvYWQpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfY29uc29sZV9mbihuYW1lKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChmbiwgYXJncykge1xuICAgICAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29uc29sZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY29uc29sZVtuYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2FycmF5RWFjaChhcmdzLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGVbbmFtZV0oeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMubG9nID0gX2NvbnNvbGVfZm4oJ2xvZycpO1xuICAgIGFzeW5jLmRpciA9IF9jb25zb2xlX2ZuKCdkaXInKTtcbiAgICAvKmFzeW5jLmluZm8gPSBfY29uc29sZV9mbignaW5mbycpO1xuICAgIGFzeW5jLndhcm4gPSBfY29uc29sZV9mbignd2FybicpO1xuICAgIGFzeW5jLmVycm9yID0gX2NvbnNvbGVfZm4oJ2Vycm9yJyk7Ki9cblxuICAgIGFzeW5jLm1lbW9pemUgPSBmdW5jdGlvbiAoZm4sIGhhc2hlcikge1xuICAgICAgICB2YXIgbWVtbyA9IHt9O1xuICAgICAgICB2YXIgcXVldWVzID0ge307XG4gICAgICAgIHZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICAgICAgICBoYXNoZXIgPSBoYXNoZXIgfHwgaWRlbnRpdHk7XG4gICAgICAgIHZhciBtZW1vaXplZCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24gbWVtb2l6ZWQoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBoYXNoZXIuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICBpZiAoaGFzLmNhbGwobWVtbywga2V5KSkgeyAgIFxuICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIG1lbW9ba2V5XSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChoYXMuY2FsbChxdWV1ZXMsIGtleSkpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZXNba2V5XS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHF1ZXVlc1trZXldID0gW2NhbGxiYWNrXTtcbiAgICAgICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgICAgICBtZW1vW2tleV0gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcSA9IHF1ZXVlc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcXVldWVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHFbaV0uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG1lbW9pemVkLm1lbW8gPSBtZW1vO1xuICAgICAgICBtZW1vaXplZC51bm1lbW9pemVkID0gZm47XG4gICAgICAgIHJldHVybiBtZW1vaXplZDtcbiAgICB9O1xuXG4gICAgYXN5bmMudW5tZW1vaXplID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKGZuLnVubWVtb2l6ZWQgfHwgZm4pLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF90aW1lcyhtYXBwZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjb3VudCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBtYXBwZXIoX3JhbmdlKGNvdW50KSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYy50aW1lcyA9IF90aW1lcyhhc3luYy5tYXApO1xuICAgIGFzeW5jLnRpbWVzU2VyaWVzID0gX3RpbWVzKGFzeW5jLm1hcFNlcmllcyk7XG4gICAgYXN5bmMudGltZXNMaW1pdCA9IGZ1bmN0aW9uIChjb3VudCwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMubWFwTGltaXQoX3JhbmdlKGNvdW50KSwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnNlcSA9IGZ1bmN0aW9uICgvKiBmdW5jdGlvbnMuLi4gKi8pIHtcbiAgICAgICAgdmFyIGZucyA9IGFyZ3VtZW50cztcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wb3AoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBub29wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhc3luYy5yZWR1Y2UoZm5zLCBhcmdzLCBmdW5jdGlvbiAobmV3YXJncywgZm4sIGNiKSB7XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhhdCwgbmV3YXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgbmV4dGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoZXJyLCBuZXh0YXJncyk7XG4gICAgICAgICAgICAgICAgfSldKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoYXQsIFtlcnJdLmNvbmNhdChyZXN1bHRzKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFzeW5jLmNvbXBvc2UgPSBmdW5jdGlvbiAoLyogZnVuY3Rpb25zLi4uICovKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5zZXEuYXBwbHkobnVsbCwgQXJyYXkucHJvdG90eXBlLnJldmVyc2UuY2FsbChhcmd1bWVudHMpKTtcbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiBfYXBwbHlFYWNoKGVhY2hmbikge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbihmbnMsIGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBnbyA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oYXJncykge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlYWNoZm4oZm5zLCBmdW5jdGlvbiAoZm4sIF8sIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIGFyZ3MuY29uY2F0KFtjYl0pKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdvLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdvO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5hcHBseUVhY2ggPSBfYXBwbHlFYWNoKGFzeW5jLmVhY2hPZik7XG4gICAgYXN5bmMuYXBwbHlFYWNoU2VyaWVzID0gX2FwcGx5RWFjaChhc3luYy5lYWNoT2ZTZXJpZXMpO1xuXG5cbiAgICBhc3luYy5mb3JldmVyID0gZnVuY3Rpb24gKGZuLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZG9uZSA9IG9ubHlfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgdmFyIHRhc2sgPSBlbnN1cmVBc3luYyhmbik7XG4gICAgICAgIGZ1bmN0aW9uIG5leHQoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvbmUoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhc2sobmV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dCgpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBlbnN1cmVBc3luYyhmbikge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIGFyZ3MucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlubmVyQXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBpZiAoc3luYykge1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgaW5uZXJBcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgaW5uZXJBcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgc3luYyA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5lbnN1cmVBc3luYyA9IGVuc3VyZUFzeW5jO1xuXG4gICAgYXN5bmMuY29uc3RhbnQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKHZhbHVlcykge1xuICAgICAgICB2YXIgYXJncyA9IFtudWxsXS5jb25jYXQodmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXN5bmMud3JhcFN5bmMgPVxuICAgIGFzeW5jLmFzeW5jaWZ5ID0gZnVuY3Rpb24gYXN5bmNpZnkoZnVuYykge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgcmVzdWx0IGlzIFByb21pc2Ugb2JqZWN0XG4gICAgICAgICAgICBpZiAoX2lzT2JqZWN0KHJlc3VsdCkgJiYgdHlwZW9mIHJlc3VsdC50aGVuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSlbXCJjYXRjaFwiXShmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyLm1lc3NhZ2UgPyBlcnIgOiBuZXcgRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBOb2RlLmpzXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gYXN5bmM7XG4gICAgfVxuICAgIC8vIEFNRCAvIFJlcXVpcmVKU1xuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhc3luYztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGluY2x1ZGVkIGRpcmVjdGx5IHZpYSA8c2NyaXB0PiB0YWdcbiAgICBlbHNlIHtcbiAgICAgICAgcm9vdC5hc3luYyA9IGFzeW5jO1xuICAgIH1cblxufSgpKTtcbiIsIi8qKlxuICogR2V0IGF2ZXJhZ2UgdmFsdWUuXG4gKiBAZnVuY3Rpb24gYXZlXG4gKiBAcGFyYW0gey4uLm51bWJlcn0gdmFsdWVzIC0gVmFsdWVzIHRvIGF2ZS5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IC0gQXZlcmFnZSB2YWx1ZS5cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBzdW0gPSByZXF1aXJlKCcuL3N1bScpO1xuXG4vKiogQGxlbmRzIGF2ZSAqL1xuZnVuY3Rpb24gYXZlKCkge1xuICAgIGxldCBhcmdzID0gYXJndW1lbnRzO1xuICAgIGxldCB2YWx1ZXMgPSAwLCBzaXplID0gMDtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gYXJncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBsZXQgdmFsID0gYXJnc1tpXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xuICAgICAgICAgICAgc2l6ZSArPSB2YWwubGVuZ3RoO1xuICAgICAgICAgICAgdmFsID0gc3VtLmFwcGx5KHN1bSwgdmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNpemUgKz0gMTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZXMgKz0gdmFsO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWVzIC8gc2l6ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhdmU7XG5cbiIsIi8qKlxuICogQmFzaWMgbnVtZXJpYyBjYWxjdWxhdGlvbiBmdW5jdGlvbnMuXG4gKiBAbW9kdWxlIG51bWNhbFxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXQgYXZlKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9hdmUnKTsgfSxcbiAgICBnZXQgbWF4KCkgeyByZXR1cm4gcmVxdWlyZSgnLi9tYXgnKTsgfSxcbiAgICBnZXQgbWluKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9taW4nKTsgfSxcbiAgICBnZXQgc3VtKCkgeyByZXR1cm4gcmVxdWlyZSgnLi9zdW0nKTsgfVxufTsiLCIvKipcbiAqIEZpbmQgbWF4IHZhbHVlLlxuICogQGZ1bmN0aW9uIG1heFxuICogQHBhcmFtIHsuLi5udW1iZXJ9IHZhbHVlcyAtIFZhbHVlcyB0byBjb21wYXJlLlxuICogQHJldHVybnMge251bWJlcn0gLSBNYXggbnVtYmVyLlxuICovXG5cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKiBAbGVuZHMgbWF4ICovXG5mdW5jdGlvbiBtYXgoKSB7XG4gICAgbGV0IGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gYXJncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBsZXQgdmFsID0gYXJnc1tpXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xuICAgICAgICAgICAgdmFsID0gbWF4LmFwcGx5KG1heCwgdmFsKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaGl0ID0gKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB8fCAodmFsID4gcmVzdWx0KTtcbiAgICAgICAgaWYgKGhpdCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdmFsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWF4O1xuXG4iLCIvKipcbiAqIEZpbmQgbWluIHZhbHVlLlxuICogQGZ1bmN0aW9uIG1pblxuICogQHBhcmFtIHsuLi5udW1iZXJ9IHZhbHVlcyAtIFZhbHVlcyB0byBjb21wYXJlLlxuICogQHJldHVybnMge251bWJlcn0gLSBNaW4gbnVtYmVyLlxuICovXG5cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKiBAbGVuZHMgbWluICovXG5mdW5jdGlvbiBtaW4oKSB7XG4gICAgbGV0IGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gYXJncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBsZXQgdmFsID0gYXJnc1tpXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xuICAgICAgICAgICAgdmFsID0gbWluLmFwcGx5KG1pbiwgdmFsKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaGl0ID0gKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB8fCAodmFsIDwgcmVzdWx0KTtcbiAgICAgICAgaWYgKGhpdCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdmFsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWluO1xuXG4iLCIvKipcbiAqIEdldCBzdW0gdmFsdWUuXG4gKiBAZnVuY3Rpb24gc3VtXG4gKiBAcGFyYW0gey4uLm51bWJlcn0gdmFsdWVzIC0gVmFsdWVzIHRvIHN1bS5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IC0gU3VtIHZhbHVlLlxuICovXG5cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKiBAbGVuZHMgc3VtICovXG5mdW5jdGlvbiBzdW0oKSB7XG4gICAgbGV0IGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbCA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHZhbCA9IHN1bS5hcHBseShzdW0sIHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IHZhbDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdW07XG5cbiIsIlxudmFyIHJuZztcblxuaWYgKGdsb2JhbC5jcnlwdG8gJiYgY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAvLyBXSEFUV0cgY3J5cHRvLWJhc2VkIFJORyAtIGh0dHA6Ly93aWtpLndoYXR3Zy5vcmcvd2lraS9DcnlwdG9cbiAgLy8gTW9kZXJhdGVseSBmYXN0LCBoaWdoIHF1YWxpdHlcbiAgdmFyIF9ybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoX3JuZHM4KTtcbiAgICByZXR1cm4gX3JuZHM4O1xuICB9O1xufVxuXG5pZiAoIXJuZykge1xuICAvLyBNYXRoLnJhbmRvbSgpLWJhc2VkIChSTkcpXG4gIC8vXG4gIC8vIElmIGFsbCBlbHNlIGZhaWxzLCB1c2UgTWF0aC5yYW5kb20oKS4gIEl0J3MgZmFzdCwgYnV0IGlzIG9mIHVuc3BlY2lmaWVkXG4gIC8vIHF1YWxpdHkuXG4gIHZhciAgX3JuZHMgPSBuZXcgQXJyYXkoMTYpO1xuICBybmcgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IDE2OyBpKyspIHtcbiAgICAgIGlmICgoaSAmIDB4MDMpID09PSAwKSByID0gTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMDAwO1xuICAgICAgX3JuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9ybmRzO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJuZztcblxuIiwiLy8gICAgIHV1aWQuanNcbi8vXG4vLyAgICAgQ29weXJpZ2h0IChjKSAyMDEwLTIwMTIgUm9iZXJ0IEtpZWZmZXJcbi8vICAgICBNSVQgTGljZW5zZSAtIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcblxuLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIFdlIGZlYXR1cmVcbi8vIGRldGVjdCB0byBkZXRlcm1pbmUgdGhlIGJlc3QgUk5HIHNvdXJjZSwgbm9ybWFsaXppbmcgdG8gYSBmdW5jdGlvbiB0aGF0XG4vLyByZXR1cm5zIDEyOC1iaXRzIG9mIHJhbmRvbW5lc3MsIHNpbmNlIHRoYXQncyB3aGF0J3MgdXN1YWxseSByZXF1aXJlZFxudmFyIF9ybmcgPSByZXF1aXJlKCcuL3JuZycpO1xuXG4vLyBNYXBzIGZvciBudW1iZXIgPC0+IGhleCBzdHJpbmcgY29udmVyc2lvblxudmFyIF9ieXRlVG9IZXggPSBbXTtcbnZhciBfaGV4VG9CeXRlID0ge307XG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gIF9ieXRlVG9IZXhbaV0gPSAoaSArIDB4MTAwKS50b1N0cmluZygxNikuc3Vic3RyKDEpO1xuICBfaGV4VG9CeXRlW19ieXRlVG9IZXhbaV1dID0gaTtcbn1cblxuLy8gKipgcGFyc2UoKWAgLSBQYXJzZSBhIFVVSUQgaW50byBpdCdzIGNvbXBvbmVudCBieXRlcyoqXG5mdW5jdGlvbiBwYXJzZShzLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IChidWYgJiYgb2Zmc2V0KSB8fCAwLCBpaSA9IDA7XG5cbiAgYnVmID0gYnVmIHx8IFtdO1xuICBzLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvWzAtOWEtZl17Mn0vZywgZnVuY3Rpb24ob2N0KSB7XG4gICAgaWYgKGlpIDwgMTYpIHsgLy8gRG9uJ3Qgb3ZlcmZsb3chXG4gICAgICBidWZbaSArIGlpKytdID0gX2hleFRvQnl0ZVtvY3RdO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gWmVybyBvdXQgcmVtYWluaW5nIGJ5dGVzIGlmIHN0cmluZyB3YXMgc2hvcnRcbiAgd2hpbGUgKGlpIDwgMTYpIHtcbiAgICBidWZbaSArIGlpKytdID0gMDtcbiAgfVxuXG4gIHJldHVybiBidWY7XG59XG5cbi8vICoqYHVucGFyc2UoKWAgLSBDb252ZXJ0IFVVSUQgYnl0ZSBhcnJheSAoYWxhIHBhcnNlKCkpIGludG8gYSBzdHJpbmcqKlxuZnVuY3Rpb24gdW5wYXJzZShidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IG9mZnNldCB8fCAwLCBidGggPSBfYnl0ZVRvSGV4O1xuICByZXR1cm4gIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXTtcbn1cblxuLy8gKipgdjEoKWAgLSBHZW5lcmF0ZSB0aW1lLWJhc2VkIFVVSUQqKlxuLy9cbi8vIEluc3BpcmVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9MaW9zSy9VVUlELmpzXG4vLyBhbmQgaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L3V1aWQuaHRtbFxuXG4vLyByYW5kb20gIydzIHdlIG5lZWQgdG8gaW5pdCBub2RlIGFuZCBjbG9ja3NlcVxudmFyIF9zZWVkQnl0ZXMgPSBfcm5nKCk7XG5cbi8vIFBlciA0LjUsIGNyZWF0ZSBhbmQgNDgtYml0IG5vZGUgaWQsICg0NyByYW5kb20gYml0cyArIG11bHRpY2FzdCBiaXQgPSAxKVxudmFyIF9ub2RlSWQgPSBbXG4gIF9zZWVkQnl0ZXNbMF0gfCAweDAxLFxuICBfc2VlZEJ5dGVzWzFdLCBfc2VlZEJ5dGVzWzJdLCBfc2VlZEJ5dGVzWzNdLCBfc2VlZEJ5dGVzWzRdLCBfc2VlZEJ5dGVzWzVdXG5dO1xuXG4vLyBQZXIgNC4yLjIsIHJhbmRvbWl6ZSAoMTQgYml0KSBjbG9ja3NlcVxudmFyIF9jbG9ja3NlcSA9IChfc2VlZEJ5dGVzWzZdIDw8IDggfCBfc2VlZEJ5dGVzWzddKSAmIDB4M2ZmZjtcblxuLy8gUHJldmlvdXMgdXVpZCBjcmVhdGlvbiB0aW1lXG52YXIgX2xhc3RNU2VjcyA9IDAsIF9sYXN0TlNlY3MgPSAwO1xuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Jyb29mYS9ub2RlLXV1aWQgZm9yIEFQSSBkZXRhaWxzXG5mdW5jdGlvbiB2MShvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcbiAgdmFyIGIgPSBidWYgfHwgW107XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIGNsb2Nrc2VxID0gb3B0aW9ucy5jbG9ja3NlcSAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5jbG9ja3NlcSA6IF9jbG9ja3NlcTtcblxuICAvLyBVVUlEIHRpbWVzdGFtcHMgYXJlIDEwMCBuYW5vLXNlY29uZCB1bml0cyBzaW5jZSB0aGUgR3JlZ29yaWFuIGVwb2NoLFxuICAvLyAoMTU4Mi0xMC0xNSAwMDowMCkuICBKU051bWJlcnMgYXJlbid0IHByZWNpc2UgZW5vdWdoIGZvciB0aGlzLCBzb1xuICAvLyB0aW1lIGlzIGhhbmRsZWQgaW50ZXJuYWxseSBhcyAnbXNlY3MnIChpbnRlZ2VyIG1pbGxpc2Vjb25kcykgYW5kICduc2VjcydcbiAgLy8gKDEwMC1uYW5vc2Vjb25kcyBvZmZzZXQgZnJvbSBtc2Vjcykgc2luY2UgdW5peCBlcG9jaCwgMTk3MC0wMS0wMSAwMDowMC5cbiAgdmFyIG1zZWNzID0gb3B0aW9ucy5tc2VjcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5tc2VjcyA6IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gIC8vIFBlciA0LjIuMS4yLCB1c2UgY291bnQgb2YgdXVpZCdzIGdlbmVyYXRlZCBkdXJpbmcgdGhlIGN1cnJlbnQgY2xvY2tcbiAgLy8gY3ljbGUgdG8gc2ltdWxhdGUgaGlnaGVyIHJlc29sdXRpb24gY2xvY2tcbiAgdmFyIG5zZWNzID0gb3B0aW9ucy5uc2VjcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5uc2VjcyA6IF9sYXN0TlNlY3MgKyAxO1xuXG4gIC8vIFRpbWUgc2luY2UgbGFzdCB1dWlkIGNyZWF0aW9uIChpbiBtc2VjcylcbiAgdmFyIGR0ID0gKG1zZWNzIC0gX2xhc3RNU2VjcykgKyAobnNlY3MgLSBfbGFzdE5TZWNzKS8xMDAwMDtcblxuICAvLyBQZXIgNC4yLjEuMiwgQnVtcCBjbG9ja3NlcSBvbiBjbG9jayByZWdyZXNzaW9uXG4gIGlmIChkdCA8IDAgJiYgb3B0aW9ucy5jbG9ja3NlcSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY2xvY2tzZXEgPSBjbG9ja3NlcSArIDEgJiAweDNmZmY7XG4gIH1cblxuICAvLyBSZXNldCBuc2VjcyBpZiBjbG9jayByZWdyZXNzZXMgKG5ldyBjbG9ja3NlcSkgb3Igd2UndmUgbW92ZWQgb250byBhIG5ld1xuICAvLyB0aW1lIGludGVydmFsXG4gIGlmICgoZHQgPCAwIHx8IG1zZWNzID4gX2xhc3RNU2VjcykgJiYgb3B0aW9ucy5uc2VjcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbnNlY3MgPSAwO1xuICB9XG5cbiAgLy8gUGVyIDQuMi4xLjIgVGhyb3cgZXJyb3IgaWYgdG9vIG1hbnkgdXVpZHMgYXJlIHJlcXVlc3RlZFxuICBpZiAobnNlY3MgPj0gMTAwMDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3V1aWQudjEoKTogQ2FuXFwndCBjcmVhdGUgbW9yZSB0aGFuIDEwTSB1dWlkcy9zZWMnKTtcbiAgfVxuXG4gIF9sYXN0TVNlY3MgPSBtc2VjcztcbiAgX2xhc3ROU2VjcyA9IG5zZWNzO1xuICBfY2xvY2tzZXEgPSBjbG9ja3NlcTtcblxuICAvLyBQZXIgNC4xLjQgLSBDb252ZXJ0IGZyb20gdW5peCBlcG9jaCB0byBHcmVnb3JpYW4gZXBvY2hcbiAgbXNlY3MgKz0gMTIyMTkyOTI4MDAwMDA7XG5cbiAgLy8gYHRpbWVfbG93YFxuICB2YXIgdGwgPSAoKG1zZWNzICYgMHhmZmZmZmZmKSAqIDEwMDAwICsgbnNlY3MpICUgMHgxMDAwMDAwMDA7XG4gIGJbaSsrXSA9IHRsID4+PiAyNCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsID4+PiAxNiAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdGwgJiAweGZmO1xuXG4gIC8vIGB0aW1lX21pZGBcbiAgdmFyIHRtaCA9IChtc2VjcyAvIDB4MTAwMDAwMDAwICogMTAwMDApICYgMHhmZmZmZmZmO1xuICBiW2krK10gPSB0bWggPj4+IDggJiAweGZmO1xuICBiW2krK10gPSB0bWggJiAweGZmO1xuXG4gIC8vIGB0aW1lX2hpZ2hfYW5kX3ZlcnNpb25gXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMjQgJiAweGYgfCAweDEwOyAvLyBpbmNsdWRlIHZlcnNpb25cbiAgYltpKytdID0gdG1oID4+PiAxNiAmIDB4ZmY7XG5cbiAgLy8gYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgIChQZXIgNC4yLjIgLSBpbmNsdWRlIHZhcmlhbnQpXG4gIGJbaSsrXSA9IGNsb2Nrc2VxID4+PiA4IHwgMHg4MDtcblxuICAvLyBgY2xvY2tfc2VxX2xvd2BcbiAgYltpKytdID0gY2xvY2tzZXEgJiAweGZmO1xuXG4gIC8vIGBub2RlYFxuICB2YXIgbm9kZSA9IG9wdGlvbnMubm9kZSB8fCBfbm9kZUlkO1xuICBmb3IgKHZhciBuID0gMDsgbiA8IDY7IG4rKykge1xuICAgIGJbaSArIG5dID0gbm9kZVtuXTtcbiAgfVxuXG4gIHJldHVybiBidWYgPyBidWYgOiB1bnBhcnNlKGIpO1xufVxuXG4vLyAqKmB2NCgpYCAtIEdlbmVyYXRlIHJhbmRvbSBVVUlEKipcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjQob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgLy8gRGVwcmVjYXRlZCAtICdmb3JtYXQnIGFyZ3VtZW50LCBhcyBzdXBwb3J0ZWQgaW4gdjEuMlxuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICBpZiAodHlwZW9mKG9wdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgYnVmID0gb3B0aW9ucyA9PSAnYmluYXJ5JyA/IG5ldyBBcnJheSgxNikgOiBudWxsO1xuICAgIG9wdGlvbnMgPSBudWxsO1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBybmRzID0gb3B0aW9ucy5yYW5kb20gfHwgKG9wdGlvbnMucm5nIHx8IF9ybmcpKCk7XG5cbiAgLy8gUGVyIDQuNCwgc2V0IGJpdHMgZm9yIHZlcnNpb24gYW5kIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYFxuICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gIHJuZHNbOF0gPSAocm5kc1s4XSAmIDB4M2YpIHwgMHg4MDtcblxuICAvLyBDb3B5IGJ5dGVzIHRvIGJ1ZmZlciwgaWYgcHJvdmlkZWRcbiAgaWYgKGJ1Zikge1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgaWkrKykge1xuICAgICAgYnVmW2kgKyBpaV0gPSBybmRzW2lpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmIHx8IHVucGFyc2Uocm5kcyk7XG59XG5cbi8vIEV4cG9ydCBwdWJsaWMgQVBJXG52YXIgdXVpZCA9IHY0O1xudXVpZC52MSA9IHYxO1xudXVpZC52NCA9IHY0O1xudXVpZC5wYXJzZSA9IHBhcnNlO1xudXVpZC51bnBhcnNlID0gdW5wYXJzZTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dWlkO1xuIl19
