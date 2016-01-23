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
        accept: _react.PropTypes.string,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwX3VwbG9hZC5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFLQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVliLElBQUksUUFBUSxHQUFHLGdCQUFNLFdBQVcsQ0FBQzs7Ozs7OztBQU83QixhQUFTLEVBQUU7QUFDUCxZQUFJLEVBQUUsaUJBQU0sTUFBTTtBQUNsQixVQUFFLEVBQUUsaUJBQU0sTUFBTTtBQUNoQixnQkFBUSxFQUFFLGlCQUFNLElBQUk7QUFDcEIsY0FBTSxFQUFFLGlCQUFNLElBQUk7QUFDbEIsZUFBTyxFQUFFLGlCQUFNLElBQUk7QUFDbkIsYUFBSyxFQUFFLGlCQUFNLE1BQU07QUFDbkIsY0FBTSxFQUFFLGlCQUFNLE1BQU07QUFDcEIsWUFBSSxFQUFFLGlCQUFNLE1BQU07QUFDbEIsY0FBTSxFQUFFLGlCQUFNLE1BQU07QUFDcEIsWUFBSSxFQUFFLGlCQUFNLE1BQU07QUFDbEIsaUJBQVMsRUFBRSxpQkFBTSxNQUFNO0FBQ3ZCLG9CQUFZLEVBQUUsaUJBQU0sTUFBTTtLQUM3Qjs7QUFFRCxVQUFNLEVBQUUsRUFBRTs7QUFFVixXQUFPLEVBQUU7QUFDTCxnQkFBUSxvQkFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ3BCLGdCQUFJLE1BQU0sR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO0FBQzlCLGtCQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRTtBQUNuQyx3QkFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2pCLENBQUM7QUFDRixrQkFBTSxDQUFDLE1BQU0sR0FBRyxTQUFTLE1BQU0sQ0FBQyxFQUFFLEVBQUU7QUFDaEMsd0JBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNwQyxDQUFDO0FBQ0Ysa0JBQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDOUI7S0FDSjs7QUFFRCxtQkFBZSw2QkFBRztBQUNkLGVBQU87QUFDSCxvQkFBUSxFQUFFLEtBQUs7QUFDZixpQkFBSyxFQUFFLElBQUk7QUFDWCxnQkFBSSxFQUFFLElBQUk7U0FDYixDQUFDO0tBQ0w7QUFFRCxtQkFBZSw2QkFBRztBQUNkLGVBQU87QUFDSCxnQkFBSSxFQUFFLElBQUk7QUFDVixjQUFFLGlCQUFlLGVBQUssRUFBRSxFQUFFLEFBQUU7QUFDNUIsb0JBQVEsRUFBRSxLQUFLO0FBQ2YsaUJBQUssRUFBRSxHQUFHO0FBQ1Ysa0JBQU0sRUFBRSxHQUFHO0FBQ1gsa0JBQU0sRUFBRSxJQUFJO0FBQ1osZ0JBQUksRUFBRSxhQUFhO0FBQ25CLGdCQUFJLEVBQUUsb0JBQW9CO0FBQzFCLHFCQUFTLEVBQUUsYUFBYTtBQUN4Qix1QkFBVyxFQUFFLEdBQUc7U0FDbkIsQ0FBQztLQUNMO0FBRUQsVUFBTSxvQkFBRztBQUNMLFlBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNSLEtBQUssR0FBVyxDQUFDLENBQWpCLEtBQUs7WUFBRSxLQUFLLEdBQUksQ0FBQyxDQUFWLEtBQUs7WUFDWixLQUFLLEdBQVksS0FBSyxDQUF0QixLQUFLO1lBQUUsTUFBTSxHQUFJLEtBQUssQ0FBZixNQUFNOztBQUNsQixlQUNJOztjQUFLLFNBQVMsRUFBRSwwQkFBVyxXQUFXLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxBQUFDO0FBQ3BELHFCQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxBQUFDO1lBQ3ZDLHlDQUFPLElBQUksRUFBQyxNQUFNO0FBQ1gseUJBQVMsRUFBQyxpQkFBaUI7QUFDM0Isd0JBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxBQUFDO0FBQ3pCLG9CQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQUFBQztBQUNqQixrQkFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFLEFBQUM7QUFDYixzQkFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEFBQUM7QUFDckIsd0JBQVEsRUFBRSxDQUFDLENBQUMsWUFBWSxBQUFDO0FBQ3pCLHFCQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLE1BQU0sRUFBTixNQUFNLEVBQUMsQUFBQztjQUM1QjtZQUNGOztrQkFBTyxTQUFTLEVBQUMsaUJBQWlCLEVBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFLEFBQUM7Z0JBQ2pELHdDQUFNLFNBQVMsRUFBQyxtQkFBbUIsR0FDNUI7Z0JBQ1A7O3NCQUFNLFNBQVMsRUFBQyx1QkFBdUI7b0JBQ25DLHFDQUFHLFNBQVMsRUFBRSwwQkFBVyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEFBQUMsR0FBRTtvQkFDekQ7OzBCQUFNLFNBQVMsRUFBQyxnQkFBZ0I7d0JBQUUsS0FBSyxDQUFDLElBQUk7cUJBQVE7b0JBQ25ELEtBQUssQ0FBQyxRQUFRO2lCQUNaO2FBQ0g7WUFDUCxDQUFDLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDO1lBQ2hELENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsWUFBWSxDQUFDO1NBQ25ELENBQ1I7S0FDTDs7Ozs7O0FBT0Qsc0JBQWtCLGdDQUFHO0FBQ2pCLFlBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztLQUNoQjtBQUVELHFCQUFpQiwrQkFBRztBQUNoQixZQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDaEI7QUFFRCw2QkFBeUIscUNBQUMsU0FBUyxFQUFFO0FBQ2pDLFlBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztLQUNoQjtBQUVELHlCQUFxQixpQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFO0FBQ3hDLFlBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNiLGVBQU8sSUFBSSxDQUFDO0tBQ2Y7QUFFRCx1QkFBbUIsK0JBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRTtBQUN0QyxZQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDaEI7QUFFRCxzQkFBa0IsOEJBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRTtBQUNyQyxZQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDaEI7QUFFRCx3QkFBb0Isa0NBQUc7QUFDbkIsWUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQ2hCOzs7Ozs7QUFNRCxnQkFBWSx3QkFBQyxDQUFDLEVBQUM7QUFDUCxZQUFBLENBQUMsR0FBRyxJQUFJLENBQUE7QUFDUixZQUFDLEtBQUssR0FBSSxDQUFDLENBQVYsS0FBSyxDQUFLO0FBQ1gsWUFBQSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFBOztBQUV6RCxTQUFDLENBQUMsUUFBUSxDQUFDLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDN0Isd0JBQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLFVBQUMsR0FBRyxFQUFFLElBQUksRUFBSztBQUNsRCxhQUFDLENBQUMsUUFBUSxDQUFDO0FBQ1Asd0JBQVEsRUFBRSxLQUFLO0FBQ2YscUJBQUssRUFBRSxHQUFHO0FBQ1Ysb0JBQUksRUFBRSxJQUFJO2FBQ2IsQ0FBQyxDQUFDO0FBQ0gsZ0JBQUksR0FBRyxFQUFFO0FBQ0wsb0JBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtBQUNmLHlCQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUN0QjthQUNKLE1BQU07QUFDSCxvQkFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO0FBQ2QseUJBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3RCO2FBQ0o7U0FDSixDQUFDLENBQUM7S0FDTjtBQUVELGdCQUFZLDBCQUFFO0FBQ04sWUFBQSxDQUFDLEdBQUcsSUFBSSxDQUFBO1lBQ1AsS0FBSyxHQUFJLENBQUMsQ0FBVixLQUFLOztBQUNWLFNBQUMsQ0FBQyxRQUFRLENBQUM7QUFDUCxpQkFBSyxFQUFFLElBQUk7QUFDWCxnQkFBSSxFQUFFLElBQUk7U0FDYixDQUFDLENBQUM7QUFDSCxZQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDZCxpQkFBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNwQjtLQUNKOzs7Ozs7QUFNRCxrQkFBYywwQkFBQyxRQUFRLEVBQUUsS0FBSyxFQUFDO0FBQzNCLFlBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNiLGVBQ0ksK0RBQVcsT0FBTyxFQUFFLFFBQVEsQUFBQyxFQUFDLEtBQUssRUFBRSxLQUFLLEFBQUMsR0FDL0IsQ0FDZDtLQUNMO0FBRUQsdUJBQW1CLCtCQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUM7QUFDaEMsWUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2IsWUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNaLG1CQUFPLElBQUksQ0FBQztTQUNmO0FBQ0QsZUFDSTs7Y0FBVSxLQUFLLEVBQUUsQ0FBQyxDQUFDLFlBQVksQUFBQyxFQUFDLFNBQVMsRUFBQyx5QkFBeUI7WUFDaEUscUNBQUcsU0FBUyxFQUFFLDBCQUFXLHVCQUF1QixFQUFFLElBQUksQ0FBQyxBQUFDLEdBQUU7U0FDbkQsQ0FDZDtLQUNKO0FBRUQsdUJBQW1CLCtCQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDO0FBQ3BDLFlBQUksQ0FBQyxJQUFJLEVBQUU7QUFDUCxtQkFBTyxJQUFJLENBQUM7U0FDZjtBQUNELGVBQU8sSUFBSSxDQUNOLE1BQU0sQ0FBQyxVQUFBLEdBQUc7bUJBQUksY0FBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7O1NBQUEsQ0FBQyxDQUN0QyxHQUFHLENBQUMsVUFBQSxHQUFHO21CQUNKLDJEQUFTLEdBQUcsRUFBRSxHQUFHLEFBQUM7QUFDVCxtQkFBRyxFQUFFLEdBQUcsQUFBQztBQUNULHNCQUFNLEVBQUUsTUFBTSxBQUFDO0FBQ2YscUJBQUssRUFBRSxLQUFLLEFBQUM7QUFDYix5QkFBUyxFQUFFLDBCQUFXLHlCQUF5QixDQUFDLEFBQUM7QUFDakQscUJBQUssRUFBQyxLQUFLLEdBQ1Y7U0FDYixDQUFDLENBQUM7S0FDVjtDQUNKLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyIsImZpbGUiOiJhcF91cGxvYWQuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC11cGxvYWQvbGliIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBhcGVtYW4gcmVhY3QgcGFja2FnZSBmb3IgZmlsZSB1cGxvYWQgY29tcG9uZW50cy5cbiAqIEBjb25zdHJ1Y3RvciBBcFVwbG9hZFxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IGFzeW5jIGZyb20gJ2FzeW5jJztcbmltcG9ydCB1dWlkIGZyb20gJ3V1aWQnO1xuaW1wb3J0IHtBcEltYWdlfSBmcm9tICdhcGVtYW4tcmVhY3QtaW1hZ2UnO1xuaW1wb3J0IHtBcFNwaW5uZXJ9IGZyb20gJ2FwZW1hbi1yZWFjdC1zcGlubmVyJztcbmltcG9ydCB7QXBCdXR0b259IGZyb20gJ2FwZW1hbi1yZWFjdC1idXR0b24nO1xuXG5cbi8qKiBAbGVuZHMgQXBVcGxvYWQgKi9cbmxldCBBcFVwbG9hZCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFNwZWNzXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG5hbWU6IHR5cGVzLnN0cmluZyxcbiAgICAgICAgaWQ6IHR5cGVzLnN0cmluZyxcbiAgICAgICAgbXVsdGlwbGU6IHR5cGVzLmJvb2wsXG4gICAgICAgIG9uTG9hZDogdHlwZXMuZnVuYyxcbiAgICAgICAgb25FcnJvcjogdHlwZXMuZnVuYyxcbiAgICAgICAgd2lkdGg6IHR5cGVzLm51bWJlcixcbiAgICAgICAgaGVpZ2h0OiB0eXBlcy5udW1iZXIsXG4gICAgICAgIHRleHQ6IHR5cGVzLnN0cmluZyxcbiAgICAgICAgYWNjZXB0OiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIGljb246IHR5cGVzLnN0cmluZyxcbiAgICAgICAgY2xvc2VJY29uOiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIHNwaW5uZXJUaGVtZTogdHlwZXMuc3RyaW5nXG4gICAgfSxcblxuICAgIG1peGluczogW10sXG5cbiAgICBzdGF0aWNzOiB7XG4gICAgICAgIHJlYWRGaWxlKGZpbGUsIGNhbGxiYWNrKXtcbiAgICAgICAgICAgIGxldCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiBvbmVycm9yKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIG9ubG9hZChldikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGV2LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNwaW5uaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgdXJsczogbnVsbFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHMoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICAgICAgaWQ6IGBhcC11cGxvYWQtJHt1dWlkLnY0KCl9YCxcbiAgICAgICAgICAgIG11bHRpcGxlOiBmYWxzZSxcbiAgICAgICAgICAgIHdpZHRoOiAxODAsXG4gICAgICAgICAgICBoZWlnaHQ6IDE4MCxcbiAgICAgICAgICAgIGFjY2VwdDogbnVsbCxcbiAgICAgICAgICAgIHRleHQ6ICdVcGxvYWQgZmlsZScsXG4gICAgICAgICAgICBpY29uOiAnZmEgZmEtY2xvdWQtdXBsb2FkJyxcbiAgICAgICAgICAgIGNsb3NlSWNvbjogJ2ZhIGZhLWNsb3NlJyxcbiAgICAgICAgICAgIHNwaW5uZXJJY29uOiAnYydcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgICAgIGxldCB7c3RhdGUsIHByb3BzfSA9IHM7XG4gICAgICAgIGxldCB7d2lkdGgsIGhlaWdodH0gPSBwcm9wcztcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc25hbWVzKCdhcC11cGxvYWQnLCBwcm9wcy5jbGFzc05hbWUpfVxuICAgICAgICAgICAgICAgICBzdHlsZT17T2JqZWN0LmFzc2lnbih7fSwgcHJvcHMuc3R5bGUpfT5cbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhcC11cGxvYWQtaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZT17cHJvcHMubXVsdGlwbGV9XG4gICAgICAgICAgICAgICAgICAgICAgIG5hbWU9e3Byb3BzLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgIGlkPXtwcm9wcy5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgYWNjZXB0PXtwcm9wcy5hY2NlcHR9XG4gICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtzLmhhbmRsZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3t3aWR0aCwgaGVpZ2h0fX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJhcC11cGxvYWQtbGFiZWxcIiBodG1sRm9yPXtwcm9wcy5pZH0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwLXVwbG9hZC1hbGlnbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLWxhYmVsLWlubmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9e2NsYXNzbmFtZXMoXCJhcC11cGxvYWQtaWNvblwiLCBwcm9wcy5pY29uKX0vPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYXAtdXBsb2FkLXRleHRcIj57cHJvcHMudGV4dH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cHJvcHMuY2hpbGRyZW59XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgIHtzLl9yZW5kZXJQcmV2aWV3SW1hZ2Uoc3RhdGUudXJscywgd2lkdGgsIGhlaWdodCl9XG4gICAgICAgICAgICAgICAge3MuX3JlbmRlclJlbW92ZUJ1dHRvbighIXN0YXRlLnVybHMsIHByb3BzLmNsb3NlSWNvbil9XG4gICAgICAgICAgICAgICAge3MuX3JlbmRlclNwaW5uZXIoc3RhdGUuc3Bpbm5pbmcsIHByb3BzLnNwaW5uZXJUaGVtZSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gTGlmZWN5Y2xlXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICB9LFxuXG4gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVcGRhdGUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgIH0sXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIEN1c3RvbVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBoYW5kbGVDaGFuZ2UoZSl7XG4gICAgICAgIGxldCBzID0gdGhpcyxcbiAgICAgICAgICAgIHtwcm9wc30gPSBzLFxuICAgICAgICAgICAgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlLnRhcmdldC5maWxlcywgMCk7XG5cbiAgICAgICAgcy5zZXRTdGF0ZSh7c3Bpbm5pbmc6IHRydWV9KTtcbiAgICAgICAgYXN5bmMuY29uY2F0KGZpbGVzLCBBcFVwbG9hZC5yZWFkRmlsZSwgKGVyciwgdXJscykgPT4ge1xuICAgICAgICAgICAgcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgc3Bpbm5pbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIsXG4gICAgICAgICAgICAgICAgdXJsczogdXJsc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5vbkxvYWQodXJscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaGFuZGxlUmVtb3ZlKCl7XG4gICAgICAgIGxldCBzID0gdGhpcyxcbiAgICAgICAgICAgIHtwcm9wc30gPSBzO1xuICAgICAgICBzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgdXJsczogbnVsbFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHByb3BzLm9uTG9hZCkge1xuICAgICAgICAgICAgcHJvcHMub25Mb2FkKFtdKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFByaXZhdGVcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgX3JlbmRlclNwaW5uZXIoc3Bpbm5pbmcsIHRoZW1lKXtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEFwU3Bpbm5lciBlbmFibGVkPXtzcGlubmluZ30gdGhlbWU9e3RoZW1lfT5cbiAgICAgICAgICAgIDwvQXBTcGlubmVyPlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBfcmVuZGVyUmVtb3ZlQnV0dG9uKHJlbW92YWJsZSwgaWNvbil7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgaWYgKCFyZW1vdmFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QXBCdXR0b24gb25UYXA9e3MuaGFuZGxlUmVtb3ZlfSBjbGFzc05hbWU9XCJhcC11cGxvYWQtcmVtb3ZlLWJ1dHRvblwiPlxuICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT17Y2xhc3NuYW1lcyhcImFwLXVwbG9hZC1yZW1vdmUtaWNvblwiLCBpY29uKX0vPlxuICAgICAgICAgICAgPC9BcEJ1dHRvbj5cbiAgICAgICAgKVxuICAgIH0sXG5cbiAgICBfcmVuZGVyUHJldmlld0ltYWdlKHVybHMsIHdpZHRoLCBoZWlnaHQpe1xuICAgICAgICBpZiAoIXVybHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmxzXG4gICAgICAgICAgICAuZmlsdGVyKHVybCA9PiAvXmRhdGE6aW1hZ2UvLnRlc3QodXJsKSlcbiAgICAgICAgICAgIC5tYXAodXJsID0+IChcbiAgICAgICAgICAgICAgICA8QXBJbWFnZSBrZXk9e3VybH1cbiAgICAgICAgICAgICAgICAgICAgICAgICBzcmM9e3VybH1cbiAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9e2hlaWdodH1cbiAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aD17d2lkdGh9XG4gICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc25hbWVzKFwiYXAtdXBsb2FkLXByZXZpZXctaW1hZ2VcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU9XCJmaXRcIj5cbiAgICAgICAgICAgICAgICA8L0FwSW1hZ2U+XG4gICAgICAgICAgICApKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcFVwbG9hZDtcbiJdfQ==