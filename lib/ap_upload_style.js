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
        highlightColor: _react.PropTypes.string,
        backgroundColor: _react.PropTypes.string
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
            '.ap-upload': {
                position: 'relative',
                display: 'inline-block',
                color: '#888'
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
                pointerEvents: 'none'
            },
            '.ap-upload-remove-button': {
                display: 'inline-block',
                position: 'absolute',
                right: 0,
                top: 0,
                zIndex: 5,
                margin: '0',
                border: 'none',
                padding: '8px',
                fontSize: '24px',
                color: '#AAA',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '0'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwX3VwbG9hZF9zdHlsZS5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFLQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7O0FBTWIsSUFBSSxhQUFhLEdBQUcsZ0JBQU0sV0FBVyxDQUFDOzs7QUFDbEMsYUFBUyxFQUFFO0FBQ1AsY0FBTSxFQUFFLGlCQUFNLElBQUk7QUFDbEIsYUFBSyxFQUFFLGlCQUFNLE1BQU07QUFDbkIsc0JBQWMsRUFBRSxpQkFBTSxNQUFNO0FBQzVCLHVCQUFlLEVBQUUsaUJBQU0sTUFBTTtLQUNoQztBQUNELG1CQUFlLDZCQUFHO0FBQ2QsZUFBTztBQUNILGtCQUFNLEVBQUUsS0FBSztBQUNiLGlCQUFLLEVBQUUsRUFBRTtBQUNULDBCQUFjLEVBQUUsMEJBQVEsdUJBQXVCO0FBQy9DLDJCQUFlLEVBQUUsMEJBQVEsd0JBQXdCO1NBQ3BELENBQUE7S0FDSjtBQUNELFVBQU0sb0JBQUc7QUFDTCxZQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDUixLQUFLLEdBQUksQ0FBQyxDQUFWLEtBQUs7WUFFTCxjQUFjLEdBQXFCLEtBQUssQ0FBeEMsY0FBYztZQUFFLGVBQWUsR0FBSSxLQUFLLENBQXhCLGVBQWU7O0FBRXBDLFlBQUksSUFBSSxHQUFHO0FBQ0gsd0JBQVksRUFBRTtBQUNWLHdCQUFRLFlBQVk7QUFDcEIsdUJBQU8sZ0JBQWdCO0FBQ3ZCLHFCQUFLLFFBQVE7YUFDaEI7QUFDRCw4QkFBa0IsRUFBRTtBQUNoQixxQkFBSyxRQUFRO2FBQ2hCO0FBQ0QsK0JBQW1CLEVBQUU7QUFDakIsMEJBQVUsUUFBUTtBQUNsQix1QkFBTyxFQUFFLENBQUM7QUFDVixxQkFBSyxRQUFRO2FBQ2hCO0FBQ0QsOEJBQWtCLEVBQUU7QUFDaEIsd0JBQVEsWUFBWTtBQUNwQixzQkFBTSxFQUFFLENBQUM7QUFDVCx5QkFBUyxVQUFVO0FBQ25CLHlCQUFTLGNBQWM7QUFDdkIsb0JBQUksRUFBRSxDQUFDO0FBQ1AsbUJBQUcsRUFBRSxDQUFDO0FBQ04scUJBQUssRUFBRSxDQUFDO0FBQ1Isc0JBQU0sRUFBRSxDQUFDO0FBQ1QsNkJBQWEsUUFBUTtBQUNyQiwrQkFBZSxPQUFLLGVBQWUsQUFBRTtBQUNyQyx5QkFBUyxzQ0FBc0M7QUFDL0Msc0JBQU0sa0JBQWtCO0FBQ3hCLDRCQUFZLE9BQU87YUFDdEI7QUFDRCw4QkFBa0IsRUFBRTtBQUNoQix1QkFBTyxFQUFFLENBQUM7QUFDVix1QkFBTyxnQkFBZ0I7QUFDdkIsc0JBQU0sV0FBVztBQUNqQix3QkFBUSxZQUFZO0FBQ3BCLHNCQUFNLEVBQUUsQ0FBQzthQUNaO0FBQ0QsNkJBQWlCLEVBQUU7QUFDZix1QkFBTyxTQUFTO0FBQ2hCLHdCQUFRLE9BQU87YUFDbEI7QUFDRCxvQ0FBd0IsRUFBRTtBQUN0Qix1QkFBTyxnQkFBZ0I7QUFDdkIsNkJBQWEsVUFBVTthQUMxQjtBQUNELGdDQUFvQixFQUFFO0FBQ2xCLHVCQUFPLGdCQUFnQjtBQUN2QixxQkFBSyxPQUFPO0FBQ1osMkJBQVcsUUFBUTtBQUNuQixzQkFBTSxRQUFRO0FBQ2QseUJBQVMsY0FBYztBQUN2Qiw2QkFBYSxVQUFVO2FBQzFCO0FBQ0Qsb0NBQXdCLEVBQUU7QUFDdEIsd0JBQVEsWUFBWTtBQUNwQixtQkFBRyxFQUFFLENBQUM7QUFDTixvQkFBSSxFQUFFLENBQUM7QUFDUCxxQkFBSyxFQUFFLENBQUM7QUFDUixzQkFBTSxFQUFFLENBQUM7QUFDVCxzQkFBTSxFQUFFLENBQUM7QUFDVCwrQkFBZSxPQUFLLGVBQWUsQUFBRTtBQUNyQyxxQkFBSyxRQUFRO2FBQ2hCO0FBQ0Qsc0NBQTBCLEVBQUU7QUFDeEIsdUJBQU8sZ0JBQWdCO0FBQ3ZCLHlCQUFTLGNBQWM7QUFDdkIsc0JBQU0sRUFBRSxDQUFDO0FBQ1Qsd0JBQVEsWUFBWTtBQUNwQixvQkFBSSxFQUFFLENBQUM7QUFDUCxtQkFBRyxFQUFFLENBQUM7QUFDTixxQkFBSyxFQUFFLENBQUM7QUFDUixzQkFBTSxFQUFFLENBQUM7QUFDVCw2QkFBYSxRQUFRO2FBQ3hCO0FBQ0Qsc0NBQTBCLEVBQUU7QUFDeEIsdUJBQU8sRUFBRSxjQUFjO0FBQ3ZCLHdCQUFRLFlBQVk7QUFDcEIscUJBQUssRUFBRSxDQUFDO0FBQ1IsbUJBQUcsRUFBRSxDQUFDO0FBQ04sc0JBQU0sRUFBRSxDQUFDO0FBQ1Qsc0JBQU0sS0FBSztBQUNYLHNCQUFNLFFBQVE7QUFDZCx1QkFBTyxPQUFPO0FBQ2Qsd0JBQVEsUUFBUTtBQUNoQixxQkFBSyxFQUFFLE1BQU07QUFDYiwwQkFBVSx5QkFBeUI7QUFDbkMsNEJBQVksS0FBSzthQUNwQjtBQUNELDRDQUFnQyxFQUFFO0FBQzlCLHVCQUFPLEVBQUUsQ0FBQztBQUNWLHlCQUFTLFFBQVE7QUFDakIscUJBQUssRUFBRSxNQUFNO2FBQ2hCO0FBQ0QsNkNBQWlDLEVBQUU7QUFDL0IsdUJBQU8sRUFBRSxDQUFDO0FBQ1YseUJBQVMsUUFBUTtBQUNqQixxQkFBSyxFQUFFLE1BQU07YUFDaEI7U0FDSjtZQUNELGNBQWMsR0FBRyxFQUFFO1lBQ25CLGVBQWUsR0FBRyxFQUFFO1lBQ3BCLGNBQWMsR0FBRyxFQUFFLENBQUM7QUFDeEIsZUFDSTs7Y0FBUyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sQUFBQztBQUNyQixvQkFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQUFBQztBQUN2Qyw4QkFBYyxFQUFFLGNBQWMsQUFBQztBQUMvQiwrQkFBZSxFQUFFLGVBQWUsQUFBQztBQUNqQyw4QkFBYyxFQUFFLGNBQWMsQUFBQzs7WUFDdEMsS0FBSyxDQUFDLFFBQVE7U0FBVyxDQUM3QjtLQUNMO0NBQ0osQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDIiwiZmlsZSI6ImFwX3VwbG9hZF9zdHlsZS5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvb2t1bmlzaGluaXNoaS9Qcm9qZWN0cy9hcGVtYW4tcHJvamVjdHMvYXBlbWFuLXJlYWN0LXVwbG9hZC9saWIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFN0eWxlIGZvciBBcFVwbG9hZC5cbiAqIEBjb25zdHJ1Y3RvciBBcFVwbG9hZFN0eWxlXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcyBhcyB0eXBlc30gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHtBcFN0eWxlfSBmcm9tICdhcGVtYW4tcmVhY3Qtc3R5bGUnO1xuXG4vKiogQGxlbmRzIEFwVXBsb2FkU3R5bGUgKi9cbmxldCBBcFVwbG9hZFN0eWxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHByb3BUeXBlczoge1xuICAgICAgICBzY29wZWQ6IHR5cGVzLmJvb2wsXG4gICAgICAgIHN0eWxlOiB0eXBlcy5vYmplY3QsXG4gICAgICAgIGhpZ2hsaWdodENvbG9yOiB0eXBlcy5zdHJpbmcsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogdHlwZXMuc3RyaW5nLFxuICAgIH0sXG4gICAgZ2V0RGVmYXVsdFByb3BzKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHN0eWxlOiB7fSxcbiAgICAgICAgICAgIGhpZ2hsaWdodENvbG9yOiBBcFN0eWxlLkRFRkFVTFRfSElHSExJR0hUX0NPTE9SLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBBcFN0eWxlLkRFRkFVTFRfQkFDS0dST1VORF9DT0xPUlxuICAgICAgICB9XG4gICAgfSxcbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgbGV0IHtwcm9wc30gPSBzO1xuXG4gICAgICAgIGxldCB7aGlnaGxpZ2h0Q29sb3IsIGJhY2tncm91bmRDb2xvcn0gPSBwcm9wcztcblxuICAgICAgICBsZXQgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZCc6IHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGByZWxhdGl2ZWAsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGBpbmxpbmUtYmxvY2tgLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogYCM4ODhgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZDpob3Zlcic6IHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IGAjNTU1YFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQ6YWN0aXZlJzoge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0U2hhZG93OiBgbm9uZWAsXG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiBgIzc3N2BcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkLWxhYmVsJzoge1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogYGFic29sdXRlYCxcbiAgICAgICAgICAgICAgICAgICAgekluZGV4OiAxLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ246IGBjZW50ZXJgLFxuICAgICAgICAgICAgICAgICAgICBib3hTaXppbmc6IGBib3JkZXItYm94YCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgICAgICAgICAgICBwb2ludGVyRXZlbnRzOiBgbm9uZWAsXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogYCR7YmFja2dyb3VuZENvbG9yfWAsXG4gICAgICAgICAgICAgICAgICAgIGJveFNoYWRvdzogYGluc2V0IDFweCAxcHggMnB4IHJnYmEoMCwwLDAsMC4zMylgLFxuICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGAxcHggc29saWQgI0NDQ2AsXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogYDJweGBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkLWlucHV0Jzoge1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBgaW5saW5lLWJsb2NrYCxcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiBgcG9pbnRlcmAsXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBgcmVsYXRpdmVgLFxuICAgICAgICAgICAgICAgICAgICB6SW5kZXg6IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkLWljb24nOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGBibG9ja2AsXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiBgMmVtYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtbGFiZWwtaW5uZXInOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGBpbmxpbmUtYmxvY2tgLFxuICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNhbEFsaWduOiBgbWlkZGxlYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtYWxpZ25lcic6IHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogYGlubGluZS1ibG9ja2AsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBgMXB4YCxcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6IGAtMXB4YCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBgMTAwJWAsXG4gICAgICAgICAgICAgICAgICAgIGJveFNpemluZzogYGJvcmRlci1ib3hgLFxuICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNhbEFsaWduOiBgbWlkZGxlYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQgLmFwLXNwaW5uZXInOiB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBgYWJzb2x1dGVgLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgICAgICAgICBib3R0b206IDAsXG4gICAgICAgICAgICAgICAgICAgIHpJbmRleDogOCxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBgJHtiYWNrZ3JvdW5kQ29sb3J9YCxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IGAjREREYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtcHJldmlldy1pbWFnZSc6IHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogYGlubGluZS1ibG9ja2AsXG4gICAgICAgICAgICAgICAgICAgIGJveFNpemluZzogYGJvcmRlci1ib3hgLFxuICAgICAgICAgICAgICAgICAgICB6SW5kZXg6IDQsXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBgYWJzb2x1dGVgLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgICAgICAgICBib3R0b206IDAsXG4gICAgICAgICAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6IGBub25lYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtcmVtb3ZlLWJ1dHRvbic6IHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBgYWJzb2x1dGVgLFxuICAgICAgICAgICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgICAgICAgICB6SW5kZXg6IDUsXG4gICAgICAgICAgICAgICAgICAgIG1hcmdpbjogYDBgLFxuICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogYDhweGAsXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiBgMjRweGAsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI0FBQScsXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGByZ2JhKDI1NSwyNTUsMjU1LDAuMilgLFxuICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IGAwYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtcmVtb3ZlLWJ1dHRvbjpob3Zlcic6IHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiBgbm9uZWAsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzU1NSdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkLXJlbW92ZS1idXR0b246YWN0aXZlJzoge1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6IGBub25lYCxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjNTU1J1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzbWFsbE1lZGlhRGF0YSA9IHt9LFxuICAgICAgICAgICAgbWVkaXVtTWVkaWFEYXRhID0ge30sXG4gICAgICAgICAgICBsYXJnZU1lZGlhRGF0YSA9IHt9O1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEFwU3R5bGUgc2NvcGVkPXtwcm9wcy5zY29wZWR9XG4gICAgICAgICAgICAgICAgICAgICBkYXRhPXtPYmplY3QuYXNzaWduKGRhdGEsIHByb3BzLnN0eWxlKX1cbiAgICAgICAgICAgICAgICAgICAgIHNtYWxsTWVkaWFEYXRhPXtzbWFsbE1lZGlhRGF0YX1cbiAgICAgICAgICAgICAgICAgICAgIG1lZGl1bU1lZGlhRGF0YT17bWVkaXVtTWVkaWFEYXRhfVxuICAgICAgICAgICAgICAgICAgICAgbGFyZ2VNZWRpYURhdGE9e2xhcmdlTWVkaWFEYXRhfVxuICAgICAgICAgICAgPntwcm9wcy5jaGlsZHJlbn08L0FwU3R5bGU+XG4gICAgICAgICk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBVcGxvYWRTdHlsZTtcbiJdfQ==