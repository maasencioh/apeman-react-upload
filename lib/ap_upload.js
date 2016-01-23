/**
 * apeman react package for file upload components.
 * @constructor ApUpload
 */

"use strict";

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _apemanReactImage = require('apeman-react-image');

var _apemanReactSpinner = require('apeman-react-spinner');

var _apemanReactButton = require('apeman-react-button');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApUpload */
var ApUpload = _react2.default.createClass({
    displayName: 'ApUpload',

    //--------------------
    // Specs
    //--------------------

    propTypes: {
        name: _react.PropTypes.string,
        id: _react.PropTypes.string,
        multiple: _react.PropTypes.bool,
        onLoad: _react.PropTypes.func,
        onError: _react.PropTypes.func,
        width: _react.PropTypes.number,
        height: _react.PropTypes.number,
        text: _react.PropTypes.string,
        icon: _react.PropTypes.string,
        closeIcon: _react.PropTypes.string,
        spinnerTheme: _react.PropTypes.string
    },

    mixins: [],

    statics: {
        readFile: function readFile(file, callback) {
            var reader = new FileReader();
            reader.onerror = function onerror(err) {
                callback(err);
            };
            reader.onload = function onload(ev) {
                callback(null, ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    },

    getInitialState: function getInitialState() {
        return {
            spinning: false,
            error: null,
            urls: null
        };
    },
    getDefaultProps: function getDefaultProps() {
        return {
            name: null,
            id: 'ap-upload-' + _uuid2.default.v4(),
            multiple: false,
            width: 180,
            height: 180,
            text: 'Upload file',
            icon: 'fa fa-cloud-upload',
            closeIcon: 'fa fa-close',
            spinnerIcon: 'c'
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
            s._renderRemoveButton(!!state.urls, props.closeIcon),
            s._renderSpinner(state.spinning, props.spinnerTheme)
        );
    },

    //--------------------
    // Lifecycle
    //--------------------

    componentWillMount: function componentWillMount() {
        var s = this;
    },
    componentDidMount: function componentDidMount() {
        var s = this;
    },
    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
        var s = this;
    },
    shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
        var s = this;
        return true;
    },
    componentWillUpdate: function componentWillUpdate(nextProps, nextState) {
        var s = this;
    },
    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
        var s = this;
    },
    componentWillUnmount: function componentWillUnmount() {
        var s = this;
    },

    //------------------
    // Custom
    //------------------

    handleChange: function handleChange(e) {
        var s = this;
        var props = s.props;
        var files = Array.prototype.slice.call(e.target.files, 0);

        s.setState({ spinning: true });
        _async2.default.concat(files, ApUpload.readFile, function (err, urls) {
            s.setState({
                spinning: false,
                error: err,
                urls: urls
            });
            if (err) {
                if (props.onError) {
                    props.onError(err);
                }
            } else {
                if (props.onLoad) {
                    props.onLoad(urls);
                }
            }
        });
    },
    handleRemove: function handleRemove() {
        var s = this;
        var props = s.props;

        s.setState({
            error: null,
            urls: null
        });
        if (props.onLoad) {
            props.onLoad([]);
        }
    },

    //------------------
    // Private
    //------------------

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
        return urls.filter(function (url) {
            return (/^data:image/.test(url)
            );
        }).map(function (url) {
            return _react2.default.createElement(_apemanReactImage.ApImage, { key: url,
                src: url,
                height: height,
                width: width,
                className: (0, _classnames2.default)("ap-upload-preview-image"),
                scale: 'fit' });
        });
    }
});

module.exports = ApUpload;
//# sourceMappingURL=data:application/json;base64,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R0FDVjtTQUNiLENBQUMsQ0FBQztLQUNWO0NBQ0osQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDIiwiZmlsZSI6ImFwX3VwbG9hZC5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LXVwbG9hZC9saWIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGFwZW1hbiByZWFjdCBwYWNrYWdlIGZvciBmaWxlIHVwbG9hZCBjb21wb25lbnRzLlxuICogQGNvbnN0cnVjdG9yIEFwVXBsb2FkXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQgYXN5bmMgZnJvbSAnYXN5bmMnO1xuaW1wb3J0IHV1aWQgZnJvbSAndXVpZCc7XG5pbXBvcnQge0FwSW1hZ2V9IGZyb20gJ2FwZW1hbi1yZWFjdC1pbWFnZSc7XG5pbXBvcnQge0FwU3Bpbm5lcn0gZnJvbSAnYXBlbWFuLXJlYWN0LXNwaW5uZXInO1xuaW1wb3J0IHtBcEJ1dHRvbn0gZnJvbSAnYXBlbWFuLXJlYWN0LWJ1dHRvbic7XG5cblxuLyoqIEBsZW5kcyBBcFVwbG9hZCAqL1xubGV0IEFwVXBsb2FkID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gU3BlY3NcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgbmFtZTogdHlwZXMuc3RyaW5nLFxuICAgICAgICBpZDogdHlwZXMuc3RyaW5nLFxuICAgICAgICBtdWx0aXBsZTogdHlwZXMuYm9vbCxcbiAgICAgICAgb25Mb2FkOiB0eXBlcy5mdW5jLFxuICAgICAgICBvbkVycm9yOiB0eXBlcy5mdW5jLFxuICAgICAgICB3aWR0aDogdHlwZXMubnVtYmVyLFxuICAgICAgICBoZWlnaHQ6IHR5cGVzLm51bWJlcixcbiAgICAgICAgdGV4dDogdHlwZXMuc3RyaW5nLFxuICAgICAgICBpY29uOiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIGNsb3NlSWNvbjogdHlwZXMuc3RyaW5nLFxuICAgICAgICBzcGlubmVyVGhlbWU6IHR5cGVzLnN0cmluZ1xuICAgIH0sXG5cbiAgICBtaXhpbnM6IFtdLFxuXG4gICAgc3RhdGljczoge1xuICAgICAgICByZWFkRmlsZShmaWxlLCBjYWxsYmFjayl7XG4gICAgICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gb25lcnJvcihlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiBvbmxvYWQoZXYpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBldi50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzcGlubmluZzogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgIHVybHM6IG51bGxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogbnVsbCxcbiAgICAgICAgICAgIGlkOiBgYXAtdXBsb2FkLSR7dXVpZC52NCgpfWAsXG4gICAgICAgICAgICBtdWx0aXBsZTogZmFsc2UsXG4gICAgICAgICAgICB3aWR0aDogMTgwLFxuICAgICAgICAgICAgaGVpZ2h0OiAxODAsXG4gICAgICAgICAgICB0ZXh0OiAnVXBsb2FkIGZpbGUnLFxuICAgICAgICAgICAgaWNvbjogJ2ZhIGZhLWNsb3VkLXVwbG9hZCcsXG4gICAgICAgICAgICBjbG9zZUljb246ICdmYSBmYS1jbG9zZScsXG4gICAgICAgICAgICBzcGlubmVySWNvbjogJ2MnXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgICAgICBsZXQge3N0YXRlLCBwcm9wc30gPSBzO1xuICAgICAgICBsZXQge3dpZHRoLCBoZWlnaHR9ID0gcHJvcHM7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17Y2xhc3NuYW1lcygnYXAtdXBsb2FkJywgcHJvcHMuY2xhc3NOYW1lKX1cbiAgICAgICAgICAgICAgICAgc3R5bGU9e09iamVjdC5hc3NpZ24oe30sIHByb3BzLnN0eWxlKX0+XG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJmaWxlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWlucHV0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGU9e3Byb3BzLm11bHRpcGxlfVxuICAgICAgICAgICAgICAgICAgICAgICBuYW1lPXtwcm9wcy5uYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICBpZD17cHJvcHMuaWR9XG4gICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtzLmhhbmRsZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3t3aWR0aCwgaGVpZ2h0fX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJhcC11cGxvYWQtbGFiZWxcIiBodG1sRm9yPXtwcm9wcy5pZH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1hbGlnbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWxhYmVsLWlubmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9e2NsYXNzbmFtZXMoXCJhcC11cGxvYWQtaWNvblwiLCBwcm9wcy5pY29uKX0vPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLXRleHRcIj57cHJvcHMudGV4dH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cHJvcHMuY2hpbGRyZW59XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgIHtzLl9yZW5kZXJQcmV2aWV3SW1hZ2Uoc3RhdGUudXJscywgd2lkdGgsIGhlaWdodCl9XG4gICAgICAgICAgICAgICAge3MuX3JlbmRlclJlbW92ZUJ1dHRvbighIXN0YXRlLnVybHMsIHByb3BzLmNsb3NlSWNvbil9XG4gICAgICAgICAgICAgICAge3MuX3JlbmRlclNwaW5uZXIoc3RhdGUuc3Bpbm5pbmcsIHByb3BzLnNwaW5uZXJUaGVtZSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gTGlmZWN5Y2xlXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICB9LFxuXG4gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVcGRhdGUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIEN1c3RvbVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBoYW5kbGVDaGFuZ2UoZSl7XG4gICAgICAgIGxldCBzID0gdGhpcyxcbiAgICAgICAgICAgIHtwcm9wc30gPSBzLFxuICAgICAgICAgICAgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlLnRhcmdldC5maWxlcywgMCk7XG5cbiAgICAgICAgcy5zZXRTdGF0ZSh7c3Bpbm5pbmc6IHRydWV9KTtcbiAgICAgICAgYXN5bmMuY29uY2F0KGZpbGVzLCBBcFVwbG9hZC5yZWFkRmlsZSwgKGVyciwgdXJscykgPT4ge1xuICAgICAgICAgICAgcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIsXG4gICAgICAgICAgICAgICAgdXJsczogdXJsc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5vbkxvYWQodXJscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaGFuZGxlUmVtb3ZlKCl7XG4gICAgICAgIGxldCBzID0gdGhpcyxcbiAgICAgICAgICAgIHtwcm9wc30gPSBzO1xuICAgICAgICBzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgdXJsczogbnVsbFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgICAgICAgcHJvcHMub25Mb2FkKFtdKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFByaXZhdGVcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgX3JlbmRlclNwaW5uZXIoc3Bpbm5pbmcsIHRoZW1lKXtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEFwU3Bpbm5lciBlbmFibGVkPXtzcGlubmluZ30gdGhlbWU9e3RoZW1lfT5cbiAgICAgICAgICAgIDwvQXBTcGlubmVyPlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBfcmVuZGVyUmVtb3ZlQnV0dG9uKHJlbW92YWJsZSwgaWNvbil7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgaWYgKCFyZW1vdmFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QXBCdXR0b24gb25UYXA9e3MuaGFuZGxlUmVtb3ZlfSBjbGFzc05hbWU9XCJhcC11cGxvYWQtcmVtb3ZlLWJ1dHRvblwiPlxuICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT17Y2xhc3NuYW1lcyhcImFwLXVwbG9hZC1yZW1vdmUtaWNvblwiLCBpY29uKX0vPlxuICAgICAgICAgICAgPC9BcEJ1dHRvbj5cbiAgICAgICAgKVxuICAgIH0sXG5cbiAgICBfcmVuZGVyUHJldmlld0ltYWdlKHVybHMsIHdpZHRoLCBoZWlnaHQpe1xuICAgICAgICBpZiAoIXVybHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmxzXG4gICAgICAgICAgICAuZmlsdGVyKHVybCA9PiAvXmRhdGE6aW1hZ2UvLnRlc3QodXJsKSlcbiAgICAgICAgICAgIC5tYXAodXJsID0+IChcbiAgICAgICAgICAgICAgICA8QXBJbWFnZSBrZXk9e3VybH1cbiAgICAgICAgICAgICAgICAgICAgICAgICBzcmM9e3VybH1cbiAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9e2hlaWdodH1cbiAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aD17d2lkdGh9XG4gICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc25hbWVzKFwiYXAtdXBsb2FkLXByZXZpZXctaW1hZ2VcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU9XCJmaXRcIj5cbiAgICAgICAgICAgICAgICA8L0FwSW1hZ2U+XG4gICAgICAgICAgICApKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcFVwbG9hZDtcbiJdfQ==