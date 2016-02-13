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
            e.urls = urls;
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
                    props.onLoad(e);
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
//# sourceMappingURL=data:application/json;base64,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QUUzQixlQUNJLCtEQUFXLFNBQVMsUUFBVCxFQUFtQixPQUFPLEtBQVAsRUFBOUIsQ0FESixDQUYyQjtLQTNMRjtBQW1NN0Isc0RBQW9CLFdBQVcsTUFBSztBQUNoQyxZQUFJLElBQUksSUFBSixDQUQ0QjtBQUVoQyxZQUFJLENBQUMsU0FBRCxFQUFZO0FBQ1osbUJBQU8sSUFBUCxDQURZO1NBQWhCO0FBR0EsZUFDSTs7Y0FBVSxPQUFPLEVBQUUsWUFBRixFQUFnQixXQUFVLHlCQUFWLEVBQWpDO1lBQ0kscUNBQUcsV0FBVywwQkFBVyx1QkFBWCxFQUFvQyxJQUFwQyxDQUFYLEVBQUgsQ0FESjtTQURKLENBTGdDO0tBbk1QO0FBK003QixzREFBb0IsTUFBTSxPQUFPLFFBQU87QUFDcEMsWUFBSSxDQUFDLElBQUQsRUFBTztBQUNQLG1CQUFPLElBQVAsQ0FETztTQUFYO0FBR0EsWUFBSSxJQUFJLElBQUosQ0FKZ0M7QUFLcEMsZUFBTyxLQUNGLE1BREUsQ0FDSzttQkFBTyxTQUFTLFVBQVQsQ0FBb0IsR0FBcEI7U0FBUCxDQURMLENBRUYsR0FGRSxDQUVFLFVBQUMsR0FBRCxFQUFNLENBQU47bUJBQ0QsMkRBQVMsS0FBSyxHQUFMO0FBQ0EscUJBQUssR0FBTDtBQUNBLHdCQUFRLE1BQVI7QUFDQSx1QkFBTyxLQUFQO0FBQ0EsMkJBQVcsMEJBQVcseUJBQVgsQ0FBWDtBQUNBLHVCQUFPO0FBQ0osMEJBQVMsSUFBSSxFQUFKLE1BQVQ7QUFDQSx5QkFBUSxJQUFJLEVBQUosTUFBUjtpQkFGSDtBQUlBLHVCQUFNLEtBQU4sRUFUVDtTQURDLENBRlQsQ0FMb0M7S0EvTVg7Q0FBbEIsQ0FBWDs7QUFzT0osT0FBTyxPQUFQLEdBQWlCLFFBQWpCIiwiZmlsZSI6ImFwX3VwbG9hZC5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LXVwbG9hZC9saWIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGFwZW1hbiByZWFjdCBwYWNrYWdlIGZvciBmaWxlIHVwbG9hZCBjb21wb25lbnRzLlxuICogQGNvbnN0cnVjdG9yIEFwVXBsb2FkXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQgYXN5bmMgZnJvbSAnYXN5bmMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdXVpZCBmcm9tICd1dWlkJztcbmltcG9ydCB7QXBJbWFnZX0gZnJvbSAnYXBlbWFuLXJlYWN0LWltYWdlJztcbmltcG9ydCB7QXBTcGlubmVyfSBmcm9tICdhcGVtYW4tcmVhY3Qtc3Bpbm5lcic7XG5pbXBvcnQge0FwQnV0dG9ufSBmcm9tICdhcGVtYW4tcmVhY3QtYnV0dG9uJztcblxuXG4vKiogQGxlbmRzIEFwVXBsb2FkICovXG5sZXQgQXBVcGxvYWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBTcGVjc1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBuYW1lOiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIGlkOiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIG11bHRpcGxlOiB0eXBlcy5ib29sLFxuICAgICAgICBvbkxvYWQ6IHR5cGVzLmZ1bmMsXG4gICAgICAgIG9uRXJyb3I6IHR5cGVzLmZ1bmMsXG4gICAgICAgIHdpZHRoOiB0eXBlcy5udW1iZXIsXG4gICAgICAgIGhlaWdodDogdHlwZXMubnVtYmVyLFxuICAgICAgICB0ZXh0OiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIGFjY2VwdDogdHlwZXMuc3RyaW5nLFxuICAgICAgICBpY29uOiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIGNsb3NlSWNvbjogdHlwZXMuc3RyaW5nLFxuICAgICAgICBzcGlubmVyVGhlbWU6IHR5cGVzLnN0cmluZyxcbiAgICAgICAgdmFsdWU6IHR5cGVzLm9uZU9mVHlwZShbXG4gICAgICAgICAgICB0eXBlcy5zdHJpbmcsXG4gICAgICAgICAgICB0eXBlcy5hcnJheVxuICAgICAgICBdKVxuICAgIH0sXG5cbiAgICBtaXhpbnM6IFtdLFxuXG4gICAgc3RhdGljczoge1xuICAgICAgICByZWFkRmlsZShmaWxlLCBjYWxsYmFjayl7XG4gICAgICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gb25lcnJvcihlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiBvbmxvYWQoZXYpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBldi50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNJbWFnZVVybCh1cmwpe1xuICAgICAgICAgICAgcmV0dXJuIC9eZGF0YTppbWFnZS8udGVzdCh1cmwpIHx8ICEhfltcbiAgICAgICAgICAgICAgICAgICAgJy5qcGcnLFxuICAgICAgICAgICAgICAgICAgICAnLmpwZWcnLFxuICAgICAgICAgICAgICAgICAgICAnLnN2ZycsXG4gICAgICAgICAgICAgICAgICAgICcuZ2lmJyxcbiAgICAgICAgICAgICAgICAgICAgJy5wbmcnXG4gICAgICAgICAgICAgICAgXS5pbmRleE9mKHBhdGguZXh0bmFtZSh1cmwpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgICAgIGxldCBzID0gdGhpcyxcbiAgICAgICAgICAgIHtwcm9wc30gPSBzO1xuICAgICAgICBsZXQgaGFzVmFsdWUgPSBwcm9wcy52YWx1ZSAmJiBwcm9wcy52YWx1ZS5sZW5ndGggPiAwO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICB1cmxzOiBoYXNWYWx1ZSA/IFtdLmNvbmNhdChwcm9wcy52YWx1ZSkgOiBudWxsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wcygpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6IG51bGwsXG4gICAgICAgICAgICBpZDogYGFwLXVwbG9hZC0ke3V1aWQudjQoKX1gLFxuICAgICAgICAgICAgbXVsdGlwbGU6IGZhbHNlLFxuICAgICAgICAgICAgd2lkdGg6IDE4MCxcbiAgICAgICAgICAgIGhlaWdodDogMTgwLFxuICAgICAgICAgICAgYWNjZXB0OiBudWxsLFxuICAgICAgICAgICAgdGV4dDogJ1VwbG9hZCBmaWxlJyxcbiAgICAgICAgICAgIGljb246ICdmYSBmYS1jbG91ZC11cGxvYWQnLFxuICAgICAgICAgICAgY2xvc2VJY29uOiAnZmEgZmEtY2xvc2UnLFxuICAgICAgICAgICAgc3Bpbm5lckljb246ICdjJ1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgbGV0IHtzdGF0ZSwgcHJvcHN9ID0gcztcbiAgICAgICAgbGV0IHt3aWR0aCwgaGVpZ2h0fSA9IHByb3BzO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzbmFtZXMoJ2FwLXVwbG9hZCcsIHByb3BzLmNsYXNzTmFtZSl9XG4gICAgICAgICAgICAgICAgIHN0eWxlPXtPYmplY3QuYXNzaWduKHt9LCBwcm9wcy5zdHlsZSl9PlxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiZmlsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1pbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGxlPXtwcm9wcy5tdWx0aXBsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgbmFtZT17cHJvcHMubmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgaWQ9e3Byb3BzLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHQ9e3Byb3BzLmFjY2VwdH1cbiAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3MuaGFuZGxlQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e3dpZHRoLCBoZWlnaHR9fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1sYWJlbFwiIGh0bWxGb3I9e3Byb3BzLmlkfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWFsaWduZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC11cGxvYWQtbGFiZWwtaW5uZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT17Y2xhc3NuYW1lcyhcImFwLXVwbG9hZC1pY29uXCIsIHByb3BzLmljb24pfS8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcC11cGxvYWQtdGV4dFwiPntwcm9wcy50ZXh0fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAge3MuX3JlbmRlclByZXZpZXdJbWFnZShzdGF0ZS51cmxzLCB3aWR0aCwgaGVpZ2h0KX1cbiAgICAgICAgICAgICAgICB7cy5fcmVuZGVyUmVtb3ZlQnV0dG9uKCEhKHN0YXRlLnVybHMgJiYgc3RhdGUudXJscy5sZW5ndGggPiAwKSwgcHJvcHMuY2xvc2VJY29uKX1cbiAgICAgICAgICAgICAgICB7cy5fcmVuZGVyU3Bpbm5lcihzdGF0ZS5zcGlubmluZywgcHJvcHMuc3Bpbm5lclRoZW1lKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG5cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBMaWZlY3ljbGVcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXh0UHJvcHMpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVwZGF0ZShuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gQ3VzdG9tXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGhhbmRsZUNoYW5nZShlKXtcbiAgICAgICAgbGV0IHMgPSB0aGlzLFxuICAgICAgICAgICAge3Byb3BzfSA9IHMsXG4gICAgICAgICAgICBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGUudGFyZ2V0LmZpbGVzLCAwKTtcblxuICAgICAgICBzLnNldFN0YXRlKHtzcGlubmluZzogdHJ1ZX0pO1xuICAgICAgICBhc3luYy5jb25jYXQoZmlsZXMsIEFwVXBsb2FkLnJlYWRGaWxlLCAoZXJyLCB1cmxzKSA9PiB7XG4gICAgICAgICAgICBlLnVybHMgPSB1cmxzO1xuICAgICAgICAgICAgcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIsXG4gICAgICAgICAgICAgICAgdXJsczogdXJsc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5vbkxvYWQoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaGFuZGxlUmVtb3ZlKCl7XG4gICAgICAgIGxldCBzID0gdGhpcyxcbiAgICAgICAgICAgIHtwcm9wc30gPSBzO1xuICAgICAgICBzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgdXJsczogbnVsbFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgICAgICAgcHJvcHMub25Mb2FkKFtdKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFByaXZhdGVcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgX3JlbmRlclNwaW5uZXIoc3Bpbm5pbmcsIHRoZW1lKXtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEFwU3Bpbm5lciBlbmFibGVkPXtzcGlubmluZ30gdGhlbWU9e3RoZW1lfT5cbiAgICAgICAgICAgIDwvQXBTcGlubmVyPlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBfcmVuZGVyUmVtb3ZlQnV0dG9uKHJlbW92YWJsZSwgaWNvbil7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgaWYgKCFyZW1vdmFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QXBCdXR0b24gb25UYXA9e3MuaGFuZGxlUmVtb3ZlfSBjbGFzc05hbWU9XCJhcC11cGxvYWQtcmVtb3ZlLWJ1dHRvblwiPlxuICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT17Y2xhc3NuYW1lcyhcImFwLXVwbG9hZC1yZW1vdmUtaWNvblwiLCBpY29uKX0vPlxuICAgICAgICAgICAgPC9BcEJ1dHRvbj5cbiAgICAgICAgKVxuICAgIH0sXG5cbiAgICBfcmVuZGVyUHJldmlld0ltYWdlKHVybHMsIHdpZHRoLCBoZWlnaHQpe1xuICAgICAgICBpZiAoIXVybHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHVybHNcbiAgICAgICAgICAgIC5maWx0ZXIodXJsID0+IEFwVXBsb2FkLmlzSW1hZ2VVcmwodXJsKSlcbiAgICAgICAgICAgIC5tYXAoKHVybCwgaSkgPT4gKFxuICAgICAgICAgICAgICAgIDxBcEltYWdlIGtleT17dXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17dXJsfVxuICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD17aGVpZ2h0fVxuICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPXt3aWR0aH1cbiAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzbmFtZXMoXCJhcC11cGxvYWQtcHJldmlldy1pbWFnZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IGAke2kgKiAxMH0lYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGAke2kgKiAxMH0lYFxuICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU9XCJmaXRcIj5cbiAgICAgICAgICAgICAgICA8L0FwSW1hZ2U+XG4gICAgICAgICAgICApKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcFVwbG9hZDtcbiJdfQ==