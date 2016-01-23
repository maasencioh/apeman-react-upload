'use strict';var _react=require('react');var _react2=_interopRequireDefault(_react);var _package=require('../../package.json');var _package2=_interopRequireDefault(_package);var _links=require('../links.json');var _links2=_interopRequireDefault(_links);var _fs=require('fs');var _fs2=_interopRequireDefault(_fs);var _apeHighlighting=require('ape-highlighting');var _apemanAssetStylesheets=require('apeman-asset-stylesheets');var _apemanAssetStylesheets2=_interopRequireDefault(_apemanAssetStylesheets);var _demoComponent=require('./demo.component.js');var _demoComponent2=_interopRequireDefault(_demoComponent);var _ap_upload_style=require('../../lib/ap_upload_style');var _ap_upload_style2=_interopRequireDefault(_ap_upload_style);var _apemanReactTheme=require('apeman-react-theme');var _apemanReactBasic=require('apeman-react-basic');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}var FAVICON_URL='https://raw.githubusercontent.com/apeman-asset-labo/apeman-asset-images/master/dist/favicon/react-favicon.png';module.exports=_react2.default.createElement(_apemanReactBasic.ApHtml,{className:'react-demo'},_react2.default.createElement(_apemanReactBasic.ApHead,{charset:'UTF-8',title:_package2.default.name+' Demo',version:_package2.default.version,icon:FAVICON_URL},_react2.default.createElement(_apemanReactBasic.ApStyle,{data:_fs2.default.readFileSync(_apemanAssetStylesheets2.default.reactDemo).toString()}),_react2.default.createElement(_apemanReactTheme.ApThemeStyle,{dominant:'#b35600'}),_react2.default.createElement(_apemanReactBasic.ApIonIconStyle,null),_react2.default.createElement(_apemanReactBasic.ApFaIconStyle,null),_react2.default.createElement(_ap_upload_style2.default,null)),_react2.default.createElement(_apemanReactBasic.ApBody,null,_react2.default.createElement('div',{id:'demo-style'}),_react2.default.createElement('header',{className:'react-demo-header'},_react2.default.createElement('div',{className:'react-demo-container'},_react2.default.createElement('h1',null,_react2.default.createElement('a',{href:_package2.default.homepage},_package2.default.name)))),_react2.default.createElement('main',null,_react2.default.createElement('div',null,_react2.default.createElement('div',{className:'react-demo-playground'},_react2.default.createElement('div',{className:'react-demo-container'},_react2.default.createElement('div',{id:'demo-wrap'},_react2.default.createElement(_demoComponent2.default,null))))),_react2.default.createElement('div',{className:'react-demo-container'},_react2.default.createElement('div',null,_react2.default.createElement('pre',{className:'react-demo-src',dangerouslySetInnerHTML:{__html:_apeHighlighting.highlightJsx.fromFile(require.resolve('./demo.component.jsx'))}})))),_react2.default.createElement('footer',null,_react2.default.createElement('div',{className:'react-demo-container'},_react2.default.createElement(_apemanReactBasic.ApLinks,{links:_links2.default}))),_react2.default.createElement('script',{src:'./demo.js'})));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlbW8uaHRtbC5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDLHk0QkFlYixJQUFNLFdBQVcsQ0FBRywrR0FBK0csQ0FBQyxBQUVwSSxNQUFNLENBQUMsT0FBTyxDQUNWLHdEQUFRLFNBQVMsQ0FBQyxZQUFZLEVBQzFCLHdEQUFRLE9BQU8sQ0FBQyxPQUFPLENBQ2YsS0FBSyxDQUFFLGtCQUFJLElBQUksQ0FBRyxPQUFPLEFBQUMsQ0FDMUIsT0FBTyxDQUFFLGtCQUFJLE9BQU8sQUFBQyxDQUNyQixJQUFJLENBQUUsV0FBVyxBQUFDLEVBQ3RCLHlEQUFTLElBQUksQ0FBRSxhQUFHLFlBQVksQ0FBQyxpQ0FBWSxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsQUFBQyxFQUFXLENBQzVFLDhEQUFjLFFBQVEsQ0FBQyxTQUFTLEVBQWdCLENBQ2hELG9FQUFpQyxDQUNqQyxtRUFBK0IsQ0FDL0IsNkRBQStCLENBQzFCLENBQ1QsNERBQ0kscUNBQUssRUFBRSxDQUFDLFlBQVksRUFBTyxDQUMzQix3Q0FBUSxTQUFTLENBQUMsbUJBQW1CLEVBQ2pDLHFDQUFLLFNBQVMsQ0FBQyxzQkFBc0IsRUFDakMsd0NBQ0ksbUNBQUcsSUFBSSxDQUFFLGtCQUFJLFFBQVEsQUFBQyxFQUFFLGtCQUFJLElBQUksQ0FBSyxDQUNwQyxDQUNILENBQ0QsQ0FDVCwwQ0FDSSx5Q0FDSSxxQ0FBSyxTQUFTLENBQUMsdUJBQXVCLEVBQ2xDLHFDQUFLLFNBQVMsQ0FBQyxzQkFBc0IsRUFDakMscUNBQUssRUFBRSxDQUFDLFdBQVcsRUFDZiwyREFBYSxDQUNYLENBQ0osQ0FDSixDQUNKLENBQ04scUNBQUssU0FBUyxDQUFDLHNCQUFzQixFQUNqQyx5Q0FDcEIscUNBQUssU0FBUyxDQUFDLGdCQUFnQixDQUFDLHVCQUF1QixDQUN2RCxDQUFDLE1BQU0sQ0FBQyw4QkFBYSxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQUFDdEUsRUFDSyxDQUNvQixDQUNKLENBRUgsQ0FDUCw0Q0FDSSxxQ0FBSyxTQUFTLENBQUMsc0JBQXNCLEVBQ2pDLHlEQUFTLEtBQUssZ0JBQVEsRUFBVyxDQUMvQixDQUNELENBQ1Qsd0NBQVEsR0FBRyxDQUFDLFdBQVcsRUFBVSxDQUM1QixDQUNKLEFBQ1osQ0FBQyIsImZpbGUiOiJkZW1vLmh0bWwuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC11cGxvYWQvZG9jL2RlbW8iLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBwa2cgZnJvbSAnLi4vLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCBsaW5rcyBmcm9tICcuLi9saW5rcy5qc29uJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQge2hpZ2hsaWdodEpzeH0gZnJvbSAnYXBlLWhpZ2hsaWdodGluZyc7XG5pbXBvcnQgc3R5bGVzaGVldHMgZnJvbSAnYXBlbWFuLWFzc2V0LXN0eWxlc2hlZXRzJztcblxuaW1wb3J0IERlbW8gZnJvbSAnLi9kZW1vLmNvbXBvbmVudC5qcyc7XG5pbXBvcnQgQXBVcGxvYWRTdHlsZSBmcm9tICcuLi8uLi9saWIvYXBfdXBsb2FkX3N0eWxlJztcblxuaW1wb3J0IHtBcFRoZW1lU3R5bGV9IGZyb20gJ2FwZW1hbi1yZWFjdC10aGVtZSc7XG5pbXBvcnQge0FwSW9uSWNvblN0eWxlLCBBcEZhSWNvblN0eWxlLCBBcFN0eWxlLCBBcEhlYWQsIEFwQm9keSwgQXBMaW5rcywgQXBIdG1sfSBmcm9tICdhcGVtYW4tcmVhY3QtYmFzaWMnO1xuXG5jb25zdCBGQVZJQ09OX1VSTCA9IFwiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2FwZW1hbi1hc3NldC1sYWJvL2FwZW1hbi1hc3NldC1pbWFnZXMvbWFzdGVyL2Rpc3QvZmF2aWNvbi9yZWFjdC1mYXZpY29uLnBuZ1wiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChcbiAgICA8QXBIdG1sIGNsYXNzTmFtZT1cInJlYWN0LWRlbW9cIj5cbiAgICAgICAgPEFwSGVhZCBjaGFyc2V0PVwiVVRGLThcIlxuICAgICAgICAgICAgICAgIHRpdGxlPXtwa2cubmFtZSArICcgRGVtbyd9XG4gICAgICAgICAgICAgICAgdmVyc2lvbj17cGtnLnZlcnNpb259XG4gICAgICAgICAgICAgICAgaWNvbj17RkFWSUNPTl9VUkx9PlxuICAgICAgICAgICAgPEFwU3R5bGUgZGF0YT17ZnMucmVhZEZpbGVTeW5jKHN0eWxlc2hlZXRzLnJlYWN0RGVtbykudG9TdHJpbmcoKX0+PC9BcFN0eWxlPlxuICAgICAgICAgICAgPEFwVGhlbWVTdHlsZSBkb21pbmFudD1cIiNiMzU2MDBcIj48L0FwVGhlbWVTdHlsZT5cbiAgICAgICAgICAgIDxBcElvbkljb25TdHlsZT48L0FwSW9uSWNvblN0eWxlPlxuICAgICAgICAgICAgPEFwRmFJY29uU3R5bGU+PC9BcEZhSWNvblN0eWxlPlxuICAgICAgICAgICAgPEFwVXBsb2FkU3R5bGU+PC9BcFVwbG9hZFN0eWxlPlxuICAgICAgICA8L0FwSGVhZD5cbiAgICAgICAgPEFwQm9keT5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJkZW1vLXN0eWxlXCI+PC9kaXY+XG4gICAgICAgICAgICA8aGVhZGVyIGNsYXNzTmFtZT1cInJlYWN0LWRlbW8taGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWFjdC1kZW1vLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8aDE+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPXtwa2cuaG9tZXBhZ2V9Pntwa2cubmFtZX08L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvaDE+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2hlYWRlcj5cbiAgICAgICAgICAgIDxtYWluPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVhY3QtZGVtby1wbGF5Z3JvdW5kXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlYWN0LWRlbW8tY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImRlbW8td3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RGVtbz48L0RlbW8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWFjdC1kZW1vLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuPHByZSBjbGFzc05hbWU9XCJyZWFjdC1kZW1vLXNyY1wiIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXtcbntfX2h0bWw6aGlnaGxpZ2h0SnN4LmZyb21GaWxlKHJlcXVpcmUucmVzb2x2ZSgnLi9kZW1vLmNvbXBvbmVudC5qc3gnKSl9XG59PlxuPC9wcmU+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8L21haW4+XG4gICAgICAgICAgICA8Zm9vdGVyPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVhY3QtZGVtby1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPEFwTGlua3MgbGlua3M9e2xpbmtzfT48L0FwTGlua3M+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Zvb3Rlcj5cbiAgICAgICAgICAgIDxzY3JpcHQgc3JjPVwiLi9kZW1vLmpzXCI+PC9zY3JpcHQ+XG4gICAgICAgIDwvQXBCb2R5PlxuICAgIDwvQXBIdG1sPlxuKTtcbiJdfQ==