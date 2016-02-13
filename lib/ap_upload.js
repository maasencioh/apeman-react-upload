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

    //--------------------
    // Specs
    //--------------------

    propTypes: {
        name: _react.PropTypes.string,
        id: _react.PropTypes.string,
        multiple: _react.PropTypes.bool,
        onChange: _react.PropTypes.func,
        onLoad: _react.PropTypes.func,
        onError: _react.PropTypes.func,
        width: _react.PropTypes.number,
        height: _react.PropTypes.number,
        text: _react.PropTypes.string,
        accept: _react.PropTypes.string,
        icon: _react.PropTypes.string,
        closeIcon: _react.PropTypes.string,
        spinnerTheme: _react.PropTypes.string,
        value: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.array])
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
            s._renderSpinner(state.spinning, props.spinnerTheme)
        );
    },

    //--------------------
    // Lifecycle
    //--------------------

    //------------------
    // Custom
    //------------------

    handleChange: function handleChange(e) {
        var s = this;
        var props = s.props;
        var files = Array.prototype.slice.call(e.target.files, 0);var onChange = props.onChange;
        var onError = props.onError;
        var onLoad = props.onLoad;

        s.setState({ spinning: true });
        if (onChange) {
            onChange(e);
        }
        _async2.default.concat(files, ApUpload.readFile, function (err, urls) {
            e.urls = urls;
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
//# sourceMappingURL=data:application/json;base64,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LEVBQWpDO1lBQ0kscUNBQUcsV0FBVywwQkFBVyx1QkFBWCxFQUFvQyxJQUFwQyxDQUFYLEVBQUgsQ0FESjtTQURKLENBTGdDO0tBaExQO0FBNEw3QixzREFBb0IsTUFBTSxPQUFPLFFBQU87QUFDcEMsWUFBSSxDQUFDLElBQUQsRUFBTztBQUNQLG1CQUFPLElBQVAsQ0FETztTQUFYO0FBR0EsWUFBSSxJQUFJLElBQUosQ0FKZ0M7QUFLcEMsZUFBTyxLQUNGLE1BREUsQ0FDSzttQkFBTyxTQUFTLFVBQVQsQ0FBb0IsR0FBcEI7U0FBUCxDQURMLENBRUYsR0FGRSxDQUVFLFVBQUMsR0FBRCxFQUFNLENBQU47bUJBQ0QsMkRBQVMsS0FBSyxHQUFMO0FBQ0EscUJBQUssR0FBTDtBQUNBLHdCQUFRLE1BQVI7QUFDQSx1QkFBTyxLQUFQO0FBQ0EsMkJBQVcsMEJBQVcseUJBQVgsQ0FBWDtBQUNBLHVCQUFPO0FBQ0osMEJBQVMsSUFBSSxFQUFKLE1BQVQ7QUFDQSx5QkFBUSxJQUFJLEVBQUosTUFBUjtpQkFGSDtBQUlBLHVCQUFNLEtBQU4sRUFUVDtTQURDLENBRlQsQ0FMb0M7S0E1TFg7Q0FBbEIsQ0FBWDs7QUFtTkosT0FBTyxPQUFQLEdBQWlCLFFBQWpCIiwiZmlsZSI6ImFwX3VwbG9hZC5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LXVwbG9hZC9saWIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGFwZW1hbiByZWFjdCBwYWNrYWdlIGZvciBmaWxlIHVwbG9hZCBjb21wb25lbnRzLlxuICogQGNvbnN0cnVjdG9yIEFwVXBsb2FkXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQgYXN5bmMgZnJvbSAnYXN5bmMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdXVpZCBmcm9tICd1dWlkJztcbmltcG9ydCB7QXBJbWFnZX0gZnJvbSAnYXBlbWFuLXJlYWN0LWltYWdlJztcbmltcG9ydCB7QXBTcGlubmVyfSBmcm9tICdhcGVtYW4tcmVhY3Qtc3Bpbm5lcic7XG5pbXBvcnQge0FwQnV0dG9ufSBmcm9tICdhcGVtYW4tcmVhY3QtYnV0dG9uJztcblxuXG4vKiogQGxlbmRzIEFwVXBsb2FkICovXG5sZXQgQXBVcGxvYWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBTcGVjc1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBuYW1lOiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIGlkOiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIG11bHRpcGxlOiB0eXBlcy5ib29sLFxuICAgICAgICBvbkNoYW5nZTogdHlwZXMuZnVuYyxcbiAgICAgICAgb25Mb2FkOiB0eXBlcy5mdW5jLFxuICAgICAgICBvbkVycm9yOiB0eXBlcy5mdW5jLFxuICAgICAgICB3aWR0aDogdHlwZXMubnVtYmVyLFxuICAgICAgICBoZWlnaHQ6IHR5cGVzLm51bWJlcixcbiAgICAgICAgdGV4dDogdHlwZXMuc3RyaW5nLFxuICAgICAgICBhY2NlcHQ6IHR5cGVzLnN0cmluZyxcbiAgICAgICAgaWNvbjogdHlwZXMuc3RyaW5nLFxuICAgICAgICBjbG9zZUljb246IHR5cGVzLnN0cmluZyxcbiAgICAgICAgc3Bpbm5lclRoZW1lOiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIHZhbHVlOiB0eXBlcy5vbmVPZlR5cGUoW1xuICAgICAgICAgICAgdHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgdHlwZXMuYXJyYXlcbiAgICAgICAgXSlcbiAgICB9LFxuXG4gICAgbWl4aW5zOiBbXSxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgcmVhZEZpbGUoZmlsZSwgY2FsbGJhY2spe1xuICAgICAgICAgICAgbGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIG9uZXJyb3IoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gb25sb2FkKGV2KSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgZXYudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGlzSW1hZ2VVcmwodXJsKXtcbiAgICAgICAgICAgIHJldHVybiAvXmRhdGE6aW1hZ2UvLnRlc3QodXJsKSB8fCAhIX5bXG4gICAgICAgICAgICAgICAgICAgICcuanBnJyxcbiAgICAgICAgICAgICAgICAgICAgJy5qcGVnJyxcbiAgICAgICAgICAgICAgICAgICAgJy5zdmcnLFxuICAgICAgICAgICAgICAgICAgICAnLmdpZicsXG4gICAgICAgICAgICAgICAgICAgICcucG5nJ1xuICAgICAgICAgICAgICAgIF0uaW5kZXhPZihwYXRoLmV4dG5hbWUodXJsKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlKCkge1xuICAgICAgICBsZXQgcyA9IHRoaXMsXG4gICAgICAgICAgICB7cHJvcHN9ID0gcztcbiAgICAgICAgbGV0IGhhc1ZhbHVlID0gcHJvcHMudmFsdWUgJiYgcHJvcHMudmFsdWUubGVuZ3RoID4gMDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNwaW5uaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgdXJsczogaGFzVmFsdWUgPyBbXS5jb25jYXQocHJvcHMudmFsdWUpIDogbnVsbFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHMoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICAgICAgaWQ6IGBhcC11cGxvYWQtJHt1dWlkLnY0KCl9YCxcbiAgICAgICAgICAgIG11bHRpcGxlOiBmYWxzZSxcbiAgICAgICAgICAgIHdpZHRoOiAxODAsXG4gICAgICAgICAgICBoZWlnaHQ6IDE4MCxcbiAgICAgICAgICAgIGFjY2VwdDogbnVsbCxcbiAgICAgICAgICAgIHRleHQ6ICdVcGxvYWQgZmlsZScsXG4gICAgICAgICAgICBpY29uOiAnZmEgZmEtY2xvdWQtdXBsb2FkJyxcbiAgICAgICAgICAgIGNsb3NlSWNvbjogJ2ZhIGZhLWNsb3NlJyxcbiAgICAgICAgICAgIHNwaW5uZXJJY29uOiBBcFNwaW5uZXIuREVGQVVMVF9USEVNRSxcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBudWxsLFxuICAgICAgICAgICAgb25Mb2FkOiBudWxsLFxuICAgICAgICAgICAgb25FcnJvcjogbnVsbFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgbGV0IHtzdGF0ZSwgcHJvcHN9ID0gcztcbiAgICAgICAgbGV0IHt3aWR0aCwgaGVpZ2h0fSA9IHByb3BzO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzbmFtZXMoJ2FwLXVwbG9hZCcsIHByb3BzLmNsYXNzTmFtZSl9XG4gICAgICAgICAgICAgICAgIHN0eWxlPXtPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSl9PlxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiZmlsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1pbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGxlPXtwcm9wcy5tdWx0aXBsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgbmFtZT17cHJvcHMubmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgaWQ9e3Byb3BzLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHQ9e3Byb3BzLmFjY2VwdH1cbiAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3MuaGFuZGxlQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e3dpZHRoLCBoZWlnaHR9fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1sYWJlbFwiIGh0bWxGb3I9e3Byb3BzLmlkfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWFsaWduZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC11cGxvYWQtbGFiZWwtaW5uZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT17Y2xhc3NuYW1lcyhcImFwLXVwbG9hZC1pY29uXCIsIHByb3BzLmljb24pfS8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC11cGxvYWQtdGV4dFwiPntwcm9wcy50ZXh0fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAge3MuX3JlbmRlclByZXZpZXdJbWFnZShzdGF0ZS51cmxzLCB3aWR0aCwgaGVpZ2h0KX1cbiAgICAgICAgICAgICAgICB7cy5fcmVuZGVyUmVtb3ZlQnV0dG9uKCEhKHN0YXRlLnVybHMgJiYgc3RhdGUudXJscy5sZW5ndGggPiAwKSwgcHJvcHMuY2xvc2VJY29uKX1cbiAgICAgICAgICAgICAgICB7cy5fcmVuZGVyU3Bpbm5lcihzdGF0ZS5zcGlubmluZywgcHJvcHMuc3Bpbm5lclRoZW1lKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG5cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBMaWZlY3ljbGVcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIEN1c3RvbVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBoYW5kbGVDaGFuZ2UoZSl7XG4gICAgICAgIGxldCBzID0gdGhpcyxcbiAgICAgICAgICAgIHtwcm9wc30gPSBzLFxuICAgICAgICAgICAgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlLnRhcmdldC5maWxlcywgMCk7XG5cbiAgICAgICAgbGV0IHtvbkNoYW5nZSwgb25FcnJvciwgb25Mb2FkfSA9IHByb3BzO1xuXG4gICAgICAgIHMuc2V0U3RhdGUoe3NwaW5uaW5nOiB0cnVlfSk7XG4gICAgICAgIGlmIChvbkNoYW5nZSkge1xuICAgICAgICAgICAgb25DaGFuZ2UoZSk7XG4gICAgICAgIH1cbiAgICAgICAgYXN5bmMuY29uY2F0KGZpbGVzLCBBcFVwbG9hZC5yZWFkRmlsZSwgKGVyciwgdXJscykgPT4ge1xuICAgICAgICAgICAgZS51cmxzID0gdXJscztcbiAgICAgICAgICAgIHMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHNwaW5uaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyLFxuICAgICAgICAgICAgICAgIHVybHM6IHVybHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChvbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIG9uRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChvbkxvYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGhhbmRsZVJlbW92ZSgpe1xuICAgICAgICBsZXQgcyA9IHRoaXMsXG4gICAgICAgICAgICB7cHJvcHN9ID0gcyxcbiAgICAgICAgICAgIHtvbkxvYWR9ID0gcHJvcHM7XG4gICAgICAgIHMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICB1cmxzOiBudWxsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAob25Mb2FkKSB7XG4gICAgICAgICAgICBvbkxvYWQoW10pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gUHJpdmF0ZVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBfcmVuZGVyU3Bpbm5lcihzcGlubmluZywgdGhlbWUpe1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QXBTcGlubmVyIGVuYWJsZWQ9e3NwaW5uaW5nfSB0aGVtZT17dGhlbWV9PlxuICAgICAgICAgICAgPC9BcFNwaW5uZXI+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9yZW5kZXJSZW1vdmVCdXR0b24ocmVtb3ZhYmxlLCBpY29uKXtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgICAgICBpZiAoIXJlbW92YWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxBcEJ1dHRvbiBvblRhcD17cy5oYW5kbGVSZW1vdmV9IGNsYXNzTmFtZT1cImFwLXVwbG9hZC1yZW1vdmUtYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPXtjbGFzc25hbWVzKFwiYXAtdXBsb2FkLXJlbW92ZS1pY29uXCIsIGljb24pfS8+XG4gICAgICAgICAgICA8L0FwQnV0dG9uPlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBfcmVuZGVyUHJldmlld0ltYWdlKHVybHMsIHdpZHRoLCBoZWlnaHQpe1xuICAgICAgICBpZiAoIXVybHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHVybHNcbiAgICAgICAgICAgIC5maWx0ZXIodXJsID0+IEFwVXBsb2FkLmlzSW1hZ2VVcmwodXJsKSlcbiAgICAgICAgICAgIC5tYXAoKHVybCwgaSkgPT4gKFxuICAgICAgICAgICAgICAgIDxBcEltYWdlIGtleT17dXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17dXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD17aGVpZ2h0fVxuICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPXt3aWR0aH1cbiAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzbmFtZXMoXCJhcC11cGxvYWQtcHJldmlldy1pbWFnZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IGAke2kgKiAxMH0lYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGAke2kgKiAxMH0lYFxuICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU9XCJmaXRcIj5cbiAgICAgICAgICAgICAgICA8L0FwSW1hZ2U+XG4gICAgICAgICAgICApKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcFVwbG9hZDtcbiJdfQ==