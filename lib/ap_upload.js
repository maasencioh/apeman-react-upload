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
//# sourceMappingURL=data:application/json;base64,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O0FBQ2hDLFlBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNiLFlBQUksQ0FBQyxTQUFTLEVBQUU7QUFDWixtQkFBTyxJQUFJLENBQUM7U0FDZjtBQUNELGVBQ0k7O2NBQVUsS0FBSyxFQUFFLENBQUMsQ0FBQyxZQUFZLEFBQUMsRUFBQyxTQUFTLEVBQUMseUJBQXlCO1lBQ2hFLHFDQUFHLFNBQVMsRUFBRSwwQkFBVyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsQUFBQyxHQUFFO1NBQ25ELENBQ2Q7S0FDSjtBQUVELHVCQUFtQiwrQkFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQztBQUNwQyxZQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1AsbUJBQU8sSUFBSSxDQUFDO1NBQ2Y7QUFDRCxZQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDYixlQUFPLElBQUksQ0FDTixNQUFNLENBQUMsVUFBQSxHQUFHO21CQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO1NBQUEsQ0FBQyxDQUN2QyxHQUFHLENBQUMsVUFBQyxHQUFHLEVBQUUsQ0FBQzttQkFDUiwyREFBUyxHQUFHLEVBQUUsR0FBRyxBQUFDO0FBQ1QsbUJBQUcsRUFBRSxHQUFHLEFBQUM7QUFDVCxzQkFBTSxFQUFFLE1BQU0sQUFBQztBQUNmLHFCQUFLLEVBQUUsS0FBSyxBQUFDO0FBQ2IseUJBQVMsRUFBRSwwQkFBVyx5QkFBeUIsQ0FBQyxBQUFDO0FBQ2pELHFCQUFLLEVBQUU7QUFDSix3QkFBSSxFQUFLLENBQUMsR0FBRyxFQUFFLE1BQUc7QUFDbEIsdUJBQUcsRUFBSyxDQUFDLEdBQUcsRUFBRSxNQUFHO2lCQUNuQixBQUFDO0FBQ0YscUJBQUssRUFBQyxLQUFLLEdBQ1Y7U0FDYixDQUFDLENBQUM7S0FDVjtDQUNKLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyIsImZpbGUiOiJhcF91cGxvYWQuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC11cGxvYWQvbGliIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3IgZmlsZSB1cGxvYWQgY29tcG9uZW50cy5cbiAqIEBjb25zdHJ1Y3RvciBBcFVwbG9hZFxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IGFzeW5jIGZyb20gJ2FzeW5jJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHV1aWQgZnJvbSAndXVpZCc7XG5pbXBvcnQge0FwSW1hZ2V9IGZyb20gJ2FwZW1hbi1yZWFjdC1pbWFnZSc7XG5pbXBvcnQge0FwU3Bpbm5lcn0gZnJvbSAnYXBlbWFuLXJlYWN0LXNwaW5uZXInO1xuaW1wb3J0IHtBcEJ1dHRvbn0gZnJvbSAnYXBlbWFuLXJlYWN0LWJ1dHRvbic7XG5cblxuLyoqIEBsZW5kcyBBcFVwbG9hZCAqL1xubGV0IEFwVXBsb2FkID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gU3BlY3NcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgbmFtZTogdHlwZXMuc3RyaW5nLFxuICAgICAgICBpZDogdHlwZXMuc3RyaW5nLFxuICAgICAgICBtdWx0aXBsZTogdHlwZXMuYm9vbCxcbiAgICAgICAgb25Mb2FkOiB0eXBlcy5mdW5jLFxuICAgICAgICBvbkVycm9yOiB0eXBlcy5mdW5jLFxuICAgICAgICB3aWR0aDogdHlwZXMubnVtYmVyLFxuICAgICAgICBoZWlnaHQ6IHR5cGVzLm51bWJlcixcbiAgICAgICAgdGV4dDogdHlwZXMuc3RyaW5nLFxuICAgICAgICBhY2NlcHQ6IHR5cGVzLnN0cmluZyxcbiAgICAgICAgaWNvbjogdHlwZXMuc3RyaW5nLFxuICAgICAgICBjbG9zZUljb246IHR5cGVzLnN0cmluZyxcbiAgICAgICAgc3Bpbm5lclRoZW1lOiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIHZhbHVlOiB0eXBlcy5vbmVPZlR5cGUoW1xuICAgICAgICAgICAgdHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgdHlwZXMuYXJyYXlcbiAgICAgICAgXSlcbiAgICB9LFxuXG4gICAgbWl4aW5zOiBbXSxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgcmVhZEZpbGUoZmlsZSwgY2FsbGJhY2spe1xuICAgICAgICAgICAgbGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIG9uZXJyb3IoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gb25sb2FkKGV2KSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgZXYudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGlzSW1hZ2VVcmwodXJsKXtcbiAgICAgICAgICAgIHJldHVybiAvXmRhdGE6aW1hZ2UvLnRlc3QodXJsKSB8fCAhIX5bXG4gICAgICAgICAgICAgICAgICAgICcuanBnJyxcbiAgICAgICAgICAgICAgICAgICAgJy5qcGVnJyxcbiAgICAgICAgICAgICAgICAgICAgJy5zdmcnLFxuICAgICAgICAgICAgICAgICAgICAnLmdpZicsXG4gICAgICAgICAgICAgICAgICAgICcucG5nJ1xuICAgICAgICAgICAgICAgIF0uaW5kZXhPZihwYXRoLmV4dG5hbWUodXJsKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlKCkge1xuICAgICAgICBsZXQgcyA9IHRoaXMsXG4gICAgICAgICAgICB7cHJvcHN9ID0gcztcbiAgICAgICAgbGV0IGhhc1ZhbHVlID0gcHJvcHMudmFsdWUgJiYgcHJvcHMudmFsdWUubGVuZ3RoID4gMDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNwaW5uaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgdXJsczogaGFzVmFsdWUgPyBbXS5jb25jYXQocHJvcHMudmFsdWUpIDogbnVsbFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHMoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICAgICAgaWQ6IGBhcC11cGxvYWQtJHt1dWlkLnY0KCl9YCxcbiAgICAgICAgICAgIG11bHRpcGxlOiBmYWxzZSxcbiAgICAgICAgICAgIHdpZHRoOiAxODAsXG4gICAgICAgICAgICBoZWlnaHQ6IDE4MCxcbiAgICAgICAgICAgIGFjY2VwdDogbnVsbCxcbiAgICAgICAgICAgIHRleHQ6ICdVcGxvYWQgZmlsZScsXG4gICAgICAgICAgICBpY29uOiAnZmEgZmEtY2xvdWQtdXBsb2FkJyxcbiAgICAgICAgICAgIGNsb3NlSWNvbjogJ2ZhIGZhLWNsb3NlJyxcbiAgICAgICAgICAgIHNwaW5uZXJJY29uOiAnYydcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgICAgIGxldCB7c3RhdGUsIHByb3BzfSA9IHM7XG4gICAgICAgIGxldCB7d2lkdGgsIGhlaWdodH0gPSBwcm9wcztcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc25hbWVzKCdhcC11cGxvYWQnLCBwcm9wcy5jbGFzc05hbWUpfVxuICAgICAgICAgICAgICAgICBzdHlsZT17T2JqZWN0LmFzc2lnbih7fSwgcHJvcHMuc3R5bGUpfT5cbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhcC11cGxvYWQtaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZT17cHJvcHMubXVsdGlwbGV9XG4gICAgICAgICAgICAgICAgICAgICAgIG5hbWU9e3Byb3BzLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgIGlkPXtwcm9wcy5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgYWNjZXB0PXtwcm9wcy5hY2NlcHR9XG4gICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtzLmhhbmRsZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3t3aWR0aCwgaGVpZ2h0fX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJhcC11cGxvYWQtbGFiZWxcIiBodG1sRm9yPXtwcm9wcy5pZH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1hbGlnbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWxhYmVsLWlubmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9e2NsYXNzbmFtZXMoXCJhcC11cGxvYWQtaWNvblwiLCBwcm9wcy5pY29uKX0vPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLXRleHRcIj57cHJvcHMudGV4dH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cHJvcHMuY2hpbGRyZW59XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgIHtzLl9yZW5kZXJQcmV2aWV3SW1hZ2Uoc3RhdGUudXJscywgd2lkdGgsIGhlaWdodCl9XG4gICAgICAgICAgICAgICAge3MuX3JlbmRlclJlbW92ZUJ1dHRvbighIShzdGF0ZS51cmxzICYmIHN0YXRlLnVybHMubGVuZ3RoID4gMCksIHByb3BzLmNsb3NlSWNvbil9XG4gICAgICAgICAgICAgICAge3MuX3JlbmRlclNwaW5uZXIoc3RhdGUuc3Bpbm5pbmcsIHByb3BzLnNwaW5uZXJUaGVtZSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gTGlmZWN5Y2xlXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICB9LFxuXG4gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVcGRhdGUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIEN1c3RvbVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBoYW5kbGVDaGFuZ2UoZSl7XG4gICAgICAgIGxldCBzID0gdGhpcyxcbiAgICAgICAgICAgIHtwcm9wc30gPSBzLFxuICAgICAgICAgICAgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlLnRhcmdldC5maWxlcywgMCk7XG5cbiAgICAgICAgcy5zZXRTdGF0ZSh7c3Bpbm5pbmc6IHRydWV9KTtcbiAgICAgICAgYXN5bmMuY29uY2F0KGZpbGVzLCBBcFVwbG9hZC5yZWFkRmlsZSwgKGVyciwgdXJscykgPT4ge1xuICAgICAgICAgICAgcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIsXG4gICAgICAgICAgICAgICAgdXJsczogdXJsc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5vbkxvYWQodXJscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaGFuZGxlUmVtb3ZlKCl7XG4gICAgICAgIGxldCBzID0gdGhpcyxcbiAgICAgICAgICAgIHtwcm9wc30gPSBzO1xuICAgICAgICBzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgdXJsczogbnVsbFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgICAgICAgcHJvcHMub25Mb2FkKFtdKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFByaXZhdGVcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgX3JlbmRlclNwaW5uZXIoc3Bpbm5pbmcsIHRoZW1lKXtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEFwU3Bpbm5lciBlbmFibGVkPXtzcGlubmluZ30gdGhlbWU9e3RoZW1lfT5cbiAgICAgICAgICAgIDwvQXBTcGlubmVyPlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBfcmVuZGVyUmVtb3ZlQnV0dG9uKHJlbW92YWJsZSwgaWNvbil7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgaWYgKCFyZW1vdmFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QXBCdXR0b24gb25UYXA9e3MuaGFuZGxlUmVtb3ZlfSBjbGFzc05hbWU9XCJhcC11cGxvYWQtcmVtb3ZlLWJ1dHRvblwiPlxuICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT17Y2xhc3NuYW1lcyhcImFwLXVwbG9hZC1yZW1vdmUtaWNvblwiLCBpY29uKX0vPlxuICAgICAgICAgICAgPC9BcEJ1dHRvbj5cbiAgICAgICAgKVxuICAgIH0sXG5cbiAgICBfcmVuZGVyUHJldmlld0ltYWdlKHVybHMsIHdpZHRoLCBoZWlnaHQpe1xuICAgICAgICBpZiAoIXVybHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHVybHNcbiAgICAgICAgICAgIC5maWx0ZXIodXJsID0+IEFwVXBsb2FkLmlzSW1hZ2VVcmwodXJsKSlcbiAgICAgICAgICAgIC5tYXAoKHVybCwgaSkgPT4gKFxuICAgICAgICAgICAgICAgIDxBcEltYWdlIGtleT17dXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17dXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD17aGVpZ2h0fVxuICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPXt3aWR0aH1cbiAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzbmFtZXMoXCJhcC11cGxvYWQtcHJldmlldy1pbWFnZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IGAke2kgKiAxMH0lYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGAke2kgKiAxMH0lYFxuICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU9XCJmaXRcIj5cbiAgICAgICAgICAgICAgICA8L0FwSW1hZ2U+XG4gICAgICAgICAgICApKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcFVwbG9hZDtcbiJdfQ==