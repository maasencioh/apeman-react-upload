'use strict';var _react=require('react');var _react2=_interopRequireDefault(_react);var _package=require('../../package.json');var _package2=_interopRequireDefault(_package);var _links=require('../links.json');var _links2=_interopRequireDefault(_links);var _fs=require('fs');var _fs2=_interopRequireDefault(_fs);var _apeHighlighting=require('ape-highlighting');var _apemanAssetStylesheets=require('apeman-asset-stylesheets');var _apemanAssetStylesheets2=_interopRequireDefault(_apemanAssetStylesheets);var _demoComponent=require('./demo.component.js');var _demoComponent2=_interopRequireDefault(_demoComponent);var _ap_upload_style=require('../../lib/ap_upload_style');var _ap_upload_style2=_interopRequireDefault(_ap_upload_style);var _apemanReactTheme=require('apeman-react-theme');var _apemanReactBasic=require('apeman-react-basic');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}var FAVICON_URL='https://raw.githubusercontent.com/apeman-asset-labo/apeman-asset-images/master/dist/favicon/react-favicon.png';module.exports=_react2.default.createElement(_apemanReactBasic.ApHtml,{className:'react-demo'},_react2.default.createElement(_apemanReactBasic.ApHead,{charset:'UTF-8',title:_package2.default.name+' Demo',version:_package2.default.version,icon:FAVICON_URL},_react2.default.createElement(_apemanReactBasic.ApStyle,{data:_fs2.default.readFileSync(_apemanAssetStylesheets2.default.reactDemo).toString()}),_react2.default.createElement(_apemanReactTheme.ApThemeStyle,{dominant:'#b35600'}),_react2.default.createElement(_ap_upload_style2.default,null)),_react2.default.createElement(_apemanReactBasic.ApBody,null,_react2.default.createElement('div',{id:'demo-style'}),_react2.default.createElement('header',{className:'react-demo-header'},_react2.default.createElement('div',{className:'react-demo-container'},_react2.default.createElement('h1',null,_react2.default.createElement('a',{href:_package2.default.homepage},_package2.default.name)))),_react2.default.createElement('main',null,_react2.default.createElement('div',null,_react2.default.createElement('div',{className:'react-demo-playground'},_react2.default.createElement('div',{className:'react-demo-container'},_react2.default.createElement('div',{id:'demo-wrap'},_react2.default.createElement(_demoComponent2.default,null))))),_react2.default.createElement('div',{className:'react-demo-container'},_react2.default.createElement('div',null,_react2.default.createElement('pre',{className:'react-demo-src',dangerouslySetInnerHTML:{__html:_apeHighlighting.highlightJsx.fromFile(require.resolve('./demo.component.jsx'))}})))),_react2.default.createElement('footer',null,_react2.default.createElement('div',{className:'react-demo-container'},_react2.default.createElement(_apemanReactBasic.ApLinks,{links:_links2.default}))),_react2.default.createElement('script',{src:'./demo.js'})));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlbW8uaHRtbC5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDLHk0QkFlYixJQUFNLFdBQVcsQ0FBRywrR0FBK0csQ0FBQyxBQUVwSSxNQUFNLENBQUMsT0FBTyxDQUNWLHdEQUFRLFNBQVMsQ0FBQyxZQUFZLEVBQzFCLHdEQUFRLE9BQU8sQ0FBQyxPQUFPLENBQ2YsS0FBSyxDQUFFLGtCQUFJLElBQUksQ0FBRyxPQUFPLEFBQUMsQ0FDMUIsT0FBTyxDQUFFLGtCQUFJLE9BQU8sQUFBQyxDQUNyQixJQUFJLENBQUUsV0FBVyxBQUFDLEVBQ3RCLHlEQUFTLElBQUksQ0FBRSxhQUFHLFlBQVksQ0FBQyxpQ0FBWSxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsQUFBQyxFQUFXLENBQzVFLDhEQUFjLFFBQVEsQ0FBQyxTQUFTLEVBQWdCLENBQ2hELDZEQUErQixDQUMxQixDQUNULDREQUNJLHFDQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQU8sQ0FDM0Isd0NBQVEsU0FBUyxDQUFDLG1CQUFtQixFQUNqQyxxQ0FBSyxTQUFTLENBQUMsc0JBQXNCLEVBQ2pDLHdDQUNJLG1DQUFHLElBQUksQ0FBRSxrQkFBSSxRQUFRLEFBQUMsRUFBRSxrQkFBSSxJQUFJLENBQUssQ0FDcEMsQ0FDSCxDQUNELENBQ1QsMENBQ0kseUNBQ0kscUNBQUssU0FBUyxDQUFDLHVCQUF1QixFQUNsQyxxQ0FBSyxTQUFTLENBQUMsc0JBQXNCLEVBQ2pDLHFDQUFLLEVBQUUsQ0FBQyxXQUFXLEVBQ2YsMkRBQWEsQ0FDWCxDQUNKLENBQ0osQ0FDSixDQUNOLHFDQUFLLFNBQVMsQ0FBQyxzQkFBc0IsRUFDakMseUNBQ3BCLHFDQUFLLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyx1QkFBdUIsQ0FDdkQsQ0FBQyxNQUFNLENBQUMsOEJBQWEsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEFBQ3RFLEVBQ0ssQ0FDb0IsQ0FDSixDQUVILENBQ1AsNENBQ0kscUNBQUssU0FBUyxDQUFDLHNCQUFzQixFQUNqQyx5REFBUyxLQUFLLGdCQUFRLEVBQVcsQ0FDL0IsQ0FDRCxDQUNULHdDQUFRLEdBQUcsQ0FBQyxXQUFXLEVBQVUsQ0FDNUIsQ0FDSixBQUNaLENBQUMiLCJmaWxlIjoiZGVtby5odG1sLmpzIiwic291cmNlUm9vdCI6Ii9Vc2Vycy9va3VuaXNoaW5pc2hpL1Byb2plY3RzL2FwZW1hbi1wcm9qZWN0cy9hcGVtYW4tcmVhY3QtdXBsb2FkL2RvYy9kZW1vIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgcGtnIGZyb20gJy4uLy4uL3BhY2thZ2UuanNvbic7XG5pbXBvcnQgbGlua3MgZnJvbSAnLi4vbGlua3MuanNvbic7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHtoaWdobGlnaHRKc3h9IGZyb20gJ2FwZS1oaWdobGlnaHRpbmcnO1xuaW1wb3J0IHN0eWxlc2hlZXRzIGZyb20gJ2FwZW1hbi1hc3NldC1zdHlsZXNoZWV0cyc7XG5cbmltcG9ydCBEZW1vIGZyb20gJy4vZGVtby5jb21wb25lbnQuanMnO1xuaW1wb3J0IEFwVXBsb2FkU3R5bGUgZnJvbSAnLi4vLi4vbGliL2FwX3VwbG9hZF9zdHlsZSc7XG5cbmltcG9ydCB7QXBUaGVtZVN0eWxlfSBmcm9tICdhcGVtYW4tcmVhY3QtdGhlbWUnO1xuaW1wb3J0IHtBcFN0eWxlLCBBcEhlYWQsIEFwQm9keSwgQXBMaW5rcywgQXBIdG1sfSBmcm9tICdhcGVtYW4tcmVhY3QtYmFzaWMnO1xuXG5jb25zdCBGQVZJQ09OX1VSTCA9IFwiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2FwZW1hbi1hc3NldC1sYWJvL2FwZW1hbi1hc3NldC1pbWFnZXMvbWFzdGVyL2Rpc3QvZmF2aWNvbi9yZWFjdC1mYXZpY29uLnBuZ1wiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChcbiAgICA8QXBIdG1sIGNsYXNzTmFtZT1cInJlYWN0LWRlbW9cIj5cbiAgICAgICAgPEFwSGVhZCBjaGFyc2V0PVwiVVRGLThcIlxuICAgICAgICAgICAgICAgIHRpdGxlPXtwa2cubmFtZSArICcgRGVtbyd9XG4gICAgICAgICAgICAgICAgdmVyc2lvbj17cGtnLnZlcnNpb259XG4gICAgICAgICAgICAgICAgaWNvbj17RkFWSUNPTl9VUkx9PlxuICAgICAgICAgICAgPEFwU3R5bGUgZGF0YT17ZnMucmVhZEZpbGVTeW5jKHN0eWxlc2hlZXRzLnJlYWN0RGVtbykudG9TdHJpbmcoKX0+PC9BcFN0eWxlPlxuICAgICAgICAgICAgPEFwVGhlbWVTdHlsZSBkb21pbmFudD1cIiNiMzU2MDBcIj48L0FwVGhlbWVTdHlsZT5cbiAgICAgICAgICAgIDxBcFVwbG9hZFN0eWxlPjwvQXBVcGxvYWRTdHlsZT5cbiAgICAgICAgPC9BcEhlYWQ+XG4gICAgICAgIDxBcEJvZHk+XG4gICAgICAgICAgICA8ZGl2IGlkPVwiZGVtby1zdHlsZVwiPjwvZGl2PlxuICAgICAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJyZWFjdC1kZW1vLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVhY3QtZGVtby1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGgxPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj17cGtnLmhvbWVwYWdlfT57cGtnLm5hbWV9PC9hPlxuICAgICAgICAgICAgICAgICAgICA8L2gxPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9oZWFkZXI+XG4gICAgICAgICAgICA8bWFpbj5cbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlYWN0LWRlbW8tcGxheWdyb3VuZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWFjdC1kZW1vLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJkZW1vLXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPERlbW8+PC9EZW1vPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVhY3QtZGVtby1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbjxwcmUgY2xhc3NOYW1lPVwicmVhY3QtZGVtby1zcmNcIiBkYW5nZXJvdXNseVNldElubmVySFRNTD17XG57X19odG1sOmhpZ2hsaWdodEpzeC5mcm9tRmlsZShyZXF1aXJlLnJlc29sdmUoJy4vZGVtby5jb21wb25lbnQuanN4JykpfVxufT5cbjwvcHJlPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPC9tYWluPlxuICAgICAgICAgICAgPGZvb3Rlcj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlYWN0LWRlbW8tY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxBcExpbmtzIGxpbmtzPXtsaW5rc30+PC9BcExpbmtzPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9mb290ZXI+XG4gICAgICAgICAgICA8c2NyaXB0IHNyYz1cIi4vZGVtby5qc1wiPjwvc2NyaXB0PlxuICAgICAgICA8L0FwQm9keT5cbiAgICA8L0FwSHRtbD5cbik7XG4iXX0=