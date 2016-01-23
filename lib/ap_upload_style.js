/**
 * Style for ApUpload.
 * @constructor ApUploadStyle
 */

"use strict";

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _apemanReactStyle = require('apeman-react-style');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @lends ApUploadStyle */
var ApUploadStyle = _react2.default.createClass({
    displayName: 'ApUploadStyle',

    propTypes: {
        scoped: _react.PropTypes.bool,
        style: _react.PropTypes.object,
        highlightColor: _react.PropTypes.string
    },
    getDefaultProps: function getDefaultProps() {
        return {
            scoped: false,
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
            '.ap-upload': {}
        },
            smallMediaData = {},
            mediumMediaData = {},
            largeMediaData = {};
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

module.exports = ApUploadStyle;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwX3VwbG9hZF9zdHlsZS5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFLQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7O0FBTWIsSUFBSSxhQUFhLEdBQUcsZ0JBQU0sV0FBVyxDQUFDOzs7QUFDbEMsYUFBUyxFQUFFO0FBQ1AsY0FBTSxFQUFFLGlCQUFNLElBQUk7QUFDbEIsYUFBSyxFQUFFLGlCQUFNLE1BQU07QUFDbkIsc0JBQWMsRUFBRSxpQkFBTSxNQUFNO0tBQy9CO0FBQ0QsbUJBQWUsNkJBQUc7QUFDZCxlQUFPO0FBQ0gsa0JBQU0sRUFBRSxLQUFLO0FBQ2IsaUJBQUssRUFBRSxFQUFFO0FBQ1QsMEJBQWMsRUFBRSwwQkFBUSx1QkFBdUI7QUFDL0MsMkJBQWUsRUFBRSwwQkFBUSx3QkFBd0I7U0FDcEQsQ0FBQTtLQUNKO0FBQ0QsVUFBTSxvQkFBRztBQUNMLFlBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNSLEtBQUssR0FBSSxDQUFDLENBQVYsS0FBSztZQUVMLGNBQWMsR0FBcUIsS0FBSyxDQUF4QyxjQUFjO1lBQUUsZUFBZSxHQUFJLEtBQUssQ0FBeEIsZUFBZTs7QUFFcEMsWUFBSSxJQUFJLEdBQUc7QUFDSCx3QkFBWSxFQUFFLEVBQUU7U0FDbkI7WUFDRCxjQUFjLEdBQUcsRUFBRTtZQUNuQixlQUFlLEdBQUcsRUFBRTtZQUNwQixjQUFjLEdBQUcsRUFBRSxDQUFDO0FBQ3hCLGVBQ0k7O2NBQVMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEFBQUM7QUFDckIsb0JBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEFBQUM7QUFDdkMsOEJBQWMsRUFBRSxjQUFjLEFBQUM7QUFDL0IsK0JBQWUsRUFBRSxlQUFlLEFBQUM7QUFDakMsOEJBQWMsRUFBRSxjQUFjLEFBQUM7O1lBQ3RDLEtBQUssQ0FBQyxRQUFRO1NBQVcsQ0FDN0I7S0FDTDtDQUNKLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyIsImZpbGUiOiJhcF91cGxvYWRfc3R5bGUuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC11cGxvYWQvbGliIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTdHlsZSBmb3IgQXBVcGxvYWQuXG4gKiBAY29uc3RydWN0b3IgQXBVcGxvYWRTdHlsZVxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJztcblxuLyoqIEBsZW5kcyBBcFVwbG9hZFN0eWxlICovXG5sZXQgQXBVcGxvYWRTdHlsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgc2NvcGVkOiB0eXBlcy5ib29sLFxuICAgICAgICBzdHlsZTogdHlwZXMub2JqZWN0LFxuICAgICAgICBoaWdobGlnaHRDb2xvcjogdHlwZXMuc3RyaW5nXG4gICAgfSxcbiAgICBnZXREZWZhdWx0UHJvcHMoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY29wZWQ6IGZhbHNlLFxuICAgICAgICAgICAgc3R5bGU6IHt9LFxuICAgICAgICAgICAgaGlnaGxpZ2h0Q29sb3I6IEFwU3R5bGUuREVGQVVMVF9ISUdITElHSFRfQ09MT1IsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IEFwU3R5bGUuREVGQVVMVF9CQUNLR1JPVU5EX0NPTE9SXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IHMgPSB0aGlzO1xuICAgICAgICBsZXQge3Byb3BzfSA9IHM7XG5cbiAgICAgICAgbGV0IHtoaWdobGlnaHRDb2xvciwgYmFja2dyb3VuZENvbG9yfSA9IHByb3BzO1xuXG4gICAgICAgIGxldCBkYXRhID0ge1xuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkJzoge31cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzbWFsbE1lZGlhRGF0YSA9IHt9LFxuICAgICAgICAgICAgbWVkaXVtTWVkaWFEYXRhID0ge30sXG4gICAgICAgICAgICBsYXJnZU1lZGlhRGF0YSA9IHt9O1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEFwU3R5bGUgc2NvcGVkPXtwcm9wcy5zY29wZWR9XG4gICAgICAgICAgICAgICAgICAgICBkYXRhPXtPYmplY3QuYXNzaWduKGRhdGEsIHByb3BzLnN0eWxlKX1cbiAgICAgICAgICAgICAgICAgICAgIHNtYWxsTWVkaWFEYXRhPXtzbWFsbE1lZGlhRGF0YX1cbiAgICAgICAgICAgICAgICAgICAgIG1lZGl1bU1lZGlhRGF0YT17bWVkaXVtTWVkaWFEYXRhfVxuICAgICAgICAgICAgICAgICAgICAgbGFyZ2VNZWRpYURhdGE9e2xhcmdlTWVkaWFEYXRhfVxuICAgICAgICAgICAgPntwcm9wcy5jaGlsZHJlbn08L0FwU3R5bGU+XG4gICAgICAgICk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBVcGxvYWRTdHlsZTtcbiJdfQ==