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
//# sourceMappingURL=data:application/json;base64,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O2NBQVMsUUFBUSxNQUFNLE1BQU47QUFDUixzQkFBTSxPQUFPLE1BQVAsQ0FBYyxJQUFkLEVBQW9CLE1BQU0sS0FBTixDQUExQjtBQUNBLGdDQUFnQixjQUFoQjtBQUNBLGlDQUFpQixlQUFqQjtBQUNBLGdDQUFnQixjQUFoQjthQUpUO1lBS0UsTUFBTSxRQUFOO1NBTk4sQ0E3R0s7S0FmeUI7Q0FBbEIsQ0FBaEI7O0FBdUlKLE9BQU8sT0FBUCxHQUFpQixhQUFqQiIsImZpbGUiOiJhcF91cGxvYWRfc3R5bGUuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC11cGxvYWQvbGliIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTdHlsZSBmb3IgQXBVcGxvYWQuXG4gKiBAY29uc3RydWN0b3IgQXBVcGxvYWRTdHlsZVxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgUmVhY3QsIHtQcm9wVHlwZXMgYXMgdHlwZXN9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7QXBTdHlsZX0gZnJvbSAnYXBlbWFuLXJlYWN0LXN0eWxlJztcblxuLyoqIEBsZW5kcyBBcFVwbG9hZFN0eWxlICovXG5sZXQgQXBVcGxvYWRTdHlsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgc2NvcGVkOiB0eXBlcy5ib29sLFxuICAgICAgICBzdHlsZTogdHlwZXMub2JqZWN0LFxuICAgICAgICBoaWdobGlnaHRDb2xvcjogdHlwZXMuc3RyaW5nLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHR5cGVzLnN0cmluZ1xuICAgIH0sXG4gICAgZ2V0RGVmYXVsdFByb3BzKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHN0eWxlOiB7fSxcbiAgICAgICAgICAgIGhpZ2hsaWdodENvbG9yOiBBcFN0eWxlLkRFRkFVTFRfSElHSExJR0hUX0NPTE9SLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBBcFN0eWxlLkRFRkFVTFRfQkFDS0dST1VORF9DT0xPUlxuICAgICAgICB9XG4gICAgfSxcbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgbGV0IHtwcm9wc30gPSBzO1xuXG4gICAgICAgIGxldCB7aGlnaGxpZ2h0Q29sb3IsIGJhY2tncm91bmRDb2xvcn0gPSBwcm9wcztcblxuICAgICAgICBsZXQgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZCc6IHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGByZWxhdGl2ZWAsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGBpbmxpbmUtYmxvY2tgLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogYCM4ODhgLFxuICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdzogYGhpZGRlbmBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkOmhvdmVyJzoge1xuICAgICAgICAgICAgICAgICAgICBjb2xvcjogYCM1NTVgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZDphY3RpdmUnOiB7XG4gICAgICAgICAgICAgICAgICAgIHRleHRTaGFkb3c6IGBub25lYCxcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IGAjNzc3YFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtbGFiZWwnOiB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBgYWJzb2x1dGVgLFxuICAgICAgICAgICAgICAgICAgICB6SW5kZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgIHRleHRBbGlnbjogYGNlbnRlcmAsXG4gICAgICAgICAgICAgICAgICAgIGJveFNpemluZzogYGJvcmRlci1ib3hgLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgICAgICAgICBib3R0b206IDAsXG4gICAgICAgICAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6IGBub25lYCxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBgJHtiYWNrZ3JvdW5kQ29sb3J9YCxcbiAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiBgaW5zZXQgMXB4IDFweCAycHggcmdiYSgwLDAsMCwwLjMzKWAsXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAjQ0NDYCxcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiBgMnB4YFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtaW5wdXQnOiB7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGBpbmxpbmUtYmxvY2tgLFxuICAgICAgICAgICAgICAgICAgICBjdXJzb3I6IGBwb2ludGVyYCxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGByZWxhdGl2ZWAsXG4gICAgICAgICAgICAgICAgICAgIHpJbmRleDogMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy5hcC11cGxvYWQtaWNvbic6IHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogYGJsb2NrYCxcbiAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6IGAyZW1gXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZC1sYWJlbC1pbm5lcic6IHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogYGlubGluZS1ibG9ja2AsXG4gICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsQWxpZ246IGBtaWRkbGVgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZC1hbGlnbmVyJzoge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBgaW5saW5lLWJsb2NrYCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGAxcHhgLFxuICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogYC0xcHhgLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGAxMDAlYCxcbiAgICAgICAgICAgICAgICAgICAgYm94U2l6aW5nOiBgYm9yZGVyLWJveGAsXG4gICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsQWxpZ246IGBtaWRkbGVgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZCAuYXAtc3Bpbm5lcic6IHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGBhYnNvbHV0ZWAsXG4gICAgICAgICAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgICAgICAgICAgekluZGV4OiA4LFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGAke2JhY2tncm91bmRDb2xvcn1gLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogYCNERERgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZC1wcmV2aWV3LWltYWdlJzoge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBgaW5saW5lLWJsb2NrYCxcbiAgICAgICAgICAgICAgICAgICAgYm94U2l6aW5nOiBgYm9yZGVyLWJveGAsXG4gICAgICAgICAgICAgICAgICAgIHpJbmRleDogNCxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGBhYnNvbHV0ZWAsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRlckV2ZW50czogYG5vbmVgLFxuICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGAxcHggc29saWQgI0FBQWBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkLXJlbW92ZS1idXR0b24nOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogYGFic29sdXRlYCxcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgICAgICAgICAgekluZGV4OiA1LFxuICAgICAgICAgICAgICAgICAgICBtYXJnaW46IGAwYCxcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IGA4cHhgLFxuICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogYDI0cHhgLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNBQUEnLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBgcmdiYSgyNTUsMjU1LDI1NSwwLjIpYCxcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiBgMGBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcuYXAtdXBsb2FkLXJlbW92ZS1idXR0b246aG92ZXInOiB7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgICAgIGJveFNoYWRvdzogYG5vbmVgLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyM1NTUnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnLmFwLXVwbG9hZC1yZW1vdmUtYnV0dG9uOmFjdGl2ZSc6IHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiBgbm9uZWAsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzU1NSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc21hbGxNZWRpYURhdGEgPSB7fSxcbiAgICAgICAgICAgIG1lZGl1bU1lZGlhRGF0YSA9IHt9LFxuICAgICAgICAgICAgbGFyZ2VNZWRpYURhdGEgPSB7fTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxBcFN0eWxlIHNjb3BlZD17cHJvcHMuc2NvcGVkfVxuICAgICAgICAgICAgICAgICAgICAgZGF0YT17T2JqZWN0LmFzc2lnbihkYXRhLCBwcm9wcy5zdHlsZSl9XG4gICAgICAgICAgICAgICAgICAgICBzbWFsbE1lZGlhRGF0YT17c21hbGxNZWRpYURhdGF9XG4gICAgICAgICAgICAgICAgICAgICBtZWRpdW1NZWRpYURhdGE9e21lZGl1bU1lZGlhRGF0YX1cbiAgICAgICAgICAgICAgICAgICAgIGxhcmdlTWVkaWFEYXRhPXtsYXJnZU1lZGlhRGF0YX1cbiAgICAgICAgICAgID57cHJvcHMuY2hpbGRyZW59PC9BcFN0eWxlPlxuICAgICAgICApO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwVXBsb2FkU3R5bGU7XG4iXX0=