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
//# sourceMappingURL=data:application/json;base64,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QUNyQixzQkFBTSxrQkFBa0I7YUFDM0I7QUFDRCxzQ0FBMEIsRUFBRTtBQUN4Qix1QkFBTyxFQUFFLGNBQWM7QUFDdkIsd0JBQVEsWUFBWTtBQUNwQixxQkFBSyxFQUFFLENBQUM7QUFDUixtQkFBRyxFQUFFLENBQUM7QUFDTixzQkFBTSxFQUFFLENBQUM7QUFDVCxzQkFBTSxLQUFLO0FBQ1gsc0JBQU0sUUFBUTtBQUNkLHVCQUFPLE9BQU87QUFDZCx3QkFBUSxRQUFRO0FBQ2hCLHFCQUFLLEVBQUUsTUFBTTtBQUNiLDBCQUFVLHlCQUF5QjtBQUNuQyw0QkFBWSxLQUFLO2FBQ3BCO0FBQ0QsNENBQWdDLEVBQUU7QUFDOUIsdUJBQU8sRUFBRSxDQUFDO0FBQ1YseUJBQVMsUUFBUTtBQUNqQixxQkFBSyxFQUFFLE1BQU07YUFDaEI7QUFDRCw2Q0FBaUMsRUFBRTtBQUMvQix1QkFBTyxFQUFFLENBQUM7QUFDVix5QkFBUyxRQUFRO0FBQ2pCLHFCQUFLLEVBQUUsTUFBTTthQUNoQjtTQUNKO1lBQ0QsY0FBYyxHQUFHLEVBQUU7WUFDbkIsZUFBZSxHQUFHLEVBQUU7WUFDcEIsY0FBYyxHQUFHLEVBQUUsQ0FBQztBQUN4QixlQUNJOztjQUFTLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxBQUFDO0FBQ3JCLG9CQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxBQUFDO0FBQ3ZDLDhCQUFjLEVBQUUsY0FBYyxBQUFDO0FBQy9CLCtCQUFlLEVBQUUsZUFBZSxBQUFDO0FBQ2pDLDhCQUFjLEVBQUUsY0FBYyxBQUFDOztZQUN0QyxLQUFLLENBQUMsUUFBUTtTQUFXLENBQzdCO0tBQ0w7Q0FDSixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMiLCJmaWxlIjoiYXBfdXBsb2FkX3N0eWxlLmpzIiwic291cmNlUm9vdCI6Ii9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2xpYiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogU3R5bGUgZm9yIEFwVXBsb2FkLlxuICogQGNvbnN0cnVjdG9yIEFwVXBsb2FkU3R5bGVcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzIGFzIHR5cGVzfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQge0FwU3R5bGV9IGZyb20gJ2FwZW1hbi1yZWFjdC1zdHlsZSc7XG5cbi8qKiBAbGVuZHMgQXBVcGxvYWRTdHlsZSAqL1xubGV0IEFwVXBsb2FkU3R5bGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHNjb3BlZDogdHlwZXMuYm9vbCxcbiAgICAgICAgc3R5bGU6IHR5cGVzLm9iamVjdCxcbiAgICAgICAgaGlnaGxpZ2h0Q29sb3I6IHR5cGVzLnN0cmluZyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiB0eXBlcy5zdHJpbmdcbiAgICB9LFxuICAgIGdldERlZmF1bHRQcm9wcygpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlZDogZmFsc2UsXG4gICAgICAgICAgICBzdHlsZToge30sXG4gICAgICAgICAgICBoaWdobGlnaHRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0hJR0hMSUdIVF9DT0xPUixcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogQXBTdHlsZS5ERUZBVUxUX0JBQ0tHUk9VTkRfQ09MT1JcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgcyA9IHRoaXM7XG4gICAgICAgIGxldCB7cHJvcHN9ID0gcztcblxuICAgICAgICBsZXQge2hpZ2hsaWdodENvbG9yLCBiYWNrZ3JvdW5kQ29sb3J9ID0gcHJvcHM7XG5cbiAgICAgICAgbGV0IGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQnOiB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBgcmVsYXRpdmVgLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBgaW5saW5lLWJsb2NrYCxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IGAjODg4YCxcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6IGBoaWRkZW5gXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZDpob3Zlcic6IHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IGAjNTU1YFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQ6YWN0aXZlJzoge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0U2hhZG93OiBgbm9uZWAsXG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiBgIzc3N2BcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkLWxhYmVsJzoge1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogYGFic29sdXRlYCxcbiAgICAgICAgICAgICAgICAgICAgekluZGV4OiAxLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ246IGBjZW50ZXJgLFxuICAgICAgICAgICAgICAgICAgICBib3hTaXppbmc6IGBib3JkZXItYm94YCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgICAgICAgICAgICBwb2ludGVyRXZlbnRzOiBgbm9uZWAsXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogYCR7YmFja2dyb3VuZENvbG9yfWAsXG4gICAgICAgICAgICAgICAgICAgIGJveFNoYWRvdzogYGluc2V0IDFweCAxcHggMnB4IHJnYmEoMCwwLDAsMC4zMylgLFxuICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGAxcHggc29saWQgI0NDQ2AsXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogYDJweGBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkLWlucHV0Jzoge1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBgaW5saW5lLWJsb2NrYCxcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiBgcG9pbnRlcmAsXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBgcmVsYXRpdmVgLFxuICAgICAgICAgICAgICAgICAgICB6SW5kZXg6IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkLWljb24nOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGBibG9ja2AsXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiBgMmVtYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtbGFiZWwtaW5uZXInOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGBpbmxpbmUtYmxvY2tgLFxuICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNhbEFsaWduOiBgbWlkZGxlYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtYWxpZ25lcic6IHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogYGlubGluZS1ibG9ja2AsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBgMXB4YCxcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6IGAtMXB4YCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBgMTAwJWAsXG4gICAgICAgICAgICAgICAgICAgIGJveFNpemluZzogYGJvcmRlci1ib3hgLFxuICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNhbEFsaWduOiBgbWlkZGxlYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQgLmFwLXNwaW5uZXInOiB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBgYWJzb2x1dGVgLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgICAgICAgICBib3R0b206IDAsXG4gICAgICAgICAgICAgICAgICAgIHpJbmRleDogOCxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBgJHtiYWNrZ3JvdW5kQ29sb3J9YCxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IGAjREREYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtcHJldmlldy1pbWFnZSc6IHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogYGlubGluZS1ibG9ja2AsXG4gICAgICAgICAgICAgICAgICAgIGJveFNpemluZzogYGJvcmRlci1ib3hgLFxuICAgICAgICAgICAgICAgICAgICB6SW5kZXg6IDQsXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBgYWJzb2x1dGVgLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgICAgICAgICBib3R0b206IDAsXG4gICAgICAgICAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6IGBub25lYCxcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICNBQUFgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZC1yZW1vdmUtYnV0dG9uJzoge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGBhYnNvbHV0ZWAsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgICAgICAgIHpJbmRleDogNSxcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiBgMGAsXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBgOHB4YCxcbiAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6IGAyNHB4YCxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjQUFBJyxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogYHJnYmEoMjU1LDI1NSwyNTUsMC4yKWAsXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogYDBgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZC1yZW1vdmUtYnV0dG9uOmhvdmVyJzoge1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6IGBub25lYCxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjNTU1J1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtcmVtb3ZlLWJ1dHRvbjphY3RpdmUnOiB7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgICAgIGJveFNoYWRvdzogYG5vbmVgLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyM1NTUnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNtYWxsTWVkaWFEYXRhID0ge30sXG4gICAgICAgICAgICBtZWRpdW1NZWRpYURhdGEgPSB7fSxcbiAgICAgICAgICAgIGxhcmdlTWVkaWFEYXRhID0ge307XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QXBTdHlsZSBzY29wZWQ9e3Byb3BzLnNjb3BlZH1cbiAgICAgICAgICAgICAgICAgICAgIGRhdGE9e09iamVjdC5hc3NpZ24oZGF0YSwgcHJvcHMuc3R5bGUpfVxuICAgICAgICAgICAgICAgICAgICAgc21hbGxNZWRpYURhdGE9e3NtYWxsTWVkaWFEYXRhfVxuICAgICAgICAgICAgICAgICAgICAgbWVkaXVtTWVkaWFEYXRhPXttZWRpdW1NZWRpYURhdGF9XG4gICAgICAgICAgICAgICAgICAgICBsYXJnZU1lZGlhRGF0YT17bGFyZ2VNZWRpYURhdGF9XG4gICAgICAgICAgICA+e3Byb3BzLmNoaWxkcmVufTwvQXBTdHlsZT5cbiAgICAgICAgKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcFVwbG9hZFN0eWxlO1xuIl19