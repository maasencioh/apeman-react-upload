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
        onError: _react.PropTypes.func
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
        return {};
    },
    getDefaultProps: function getDefaultProps() {
        return {
            name: null,
            id: null,
            multiple: false
        };
    },
    render: function render() {
        var s = this;
        var state = s.state;
        var props = s.props;

        return _react2.default.createElement(
            'div',
            { className: (0, _classnames2.default)('ap-upload', props.className),
                style: Object.assign({}, props.style) },
            _react2.default.createElement('input', { type: 'file',
                multiple: props.multiple,
                name: props.name,
                id: props.id,
                onChange: s.handleChange
            }),
            props.children
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

        _async2.default.concat(files, ApUpload.readFile, function (err, urls) {
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
    }

    //------------------
    // Private
    //------------------

});

module.exports = ApUpload;
//# sourceMappingURL=data:application/json;base64,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QyxFQUFDO0FBQ1AsWUFBQSxDQUFDLEdBQUcsSUFBSSxDQUFBO0FBQ1IsWUFBQyxLQUFLLEdBQUksQ0FBQyxDQUFWLEtBQUssQ0FBSztBQUNYLFlBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQTs7QUFFekQsd0JBQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLFVBQUMsR0FBRyxFQUFFLElBQUksRUFBSztBQUNsRCxnQkFBSSxHQUFHLEVBQUU7QUFDTCxvQkFBSSxLQUFLLENBQUMsT0FBTyxFQUFFO0FBQ2YseUJBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ3RCO2FBQ0osTUFBTTtBQUNILG9CQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDZCx5QkFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDdEI7YUFDSjtTQUNKLENBQUMsQ0FBQztLQUNOOzs7Ozs7Q0FLSixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMiLCJmaWxlIjoiYXBfdXBsb2FkLmpzIiwic291cmNlUm9vdCI6Ii9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2xpYiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogYXBlbWFuIHJlYWN0IHBhY2thZ2UgZm9yIGZpbGUgdXBsb2FkIGNvbXBvbmVudHMuXG4gKiBAY29uc3RydWN0b3IgQXBVcGxvYWRcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCBhc3luYyBmcm9tICdhc3luYyc7XG5cbi8qKiBAbGVuZHMgQXBVcGxvYWQgKi9cbmxldCBBcFVwbG9hZCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFNwZWNzXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG5hbWU6IHR5cGVzLnN0cmluZyxcbiAgICAgICAgaWQ6IHR5cGVzLnN0cmluZyxcbiAgICAgICAgbXVsdGlwbGU6IHR5cGVzLmJvb2wsXG4gICAgICAgIG9uTG9hZDogdHlwZXMuZnVuYyxcbiAgICAgICAgb25FcnJvcjogdHlwZXMuZnVuY1xuICAgIH0sXG5cbiAgICBtaXhpbnM6IFtdLFxuXG4gICAgc3RhdGljczoge1xuICAgICAgICByZWFkRmlsZShmaWxlLCBjYWxsYmFjayl7XG4gICAgICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gb25lcnJvcihlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiBvbmxvYWQoZXYpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBldi50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICB9LFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogbnVsbCxcbiAgICAgICAgICAgIGlkOiBudWxsLFxuICAgICAgICAgICAgbXVsdGlwbGU6IGZhbHNlXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgICAgICBsZXQge3N0YXRlLCBwcm9wc30gPSBzO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17Y2xhc3NuYW1lcygnYXAtdXBsb2FkJywgcHJvcHMuY2xhc3NOYW1lKX1cbiAgICAgICAgICAgICAgICAgc3R5bGU9e09iamVjdC5hc3NpZ24oe30sIHByb3BzLnN0eWxlKX0+XG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJmaWxlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGU9e3Byb3BzLm11bHRpcGxlfVxuICAgICAgICAgICAgICAgICAgICAgICBuYW1lPXtwcm9wcy5uYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICBpZD17cHJvcHMuaWR9XG4gICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtzLmhhbmRsZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG5cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBMaWZlY3ljbGVcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXh0UHJvcHMpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVwZGF0ZShuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gQ3VzdG9tXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGhhbmRsZUNoYW5nZShlKXtcbiAgICAgICAgbGV0IHMgPSB0aGlzLFxuICAgICAgICAgICAge3Byb3BzfSA9IHMsXG4gICAgICAgICAgICBmaWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGUudGFyZ2V0LmZpbGVzLCAwKTtcblxuICAgICAgICBhc3luYy5jb25jYXQoZmlsZXMsIEFwVXBsb2FkLnJlYWRGaWxlLCAoZXJyLCB1cmxzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5vbkxvYWQodXJscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFByaXZhdGVcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBVcGxvYWQ7XG4iXX0=