'use strict';var _react=require('react');var _react2=_interopRequireDefault(_react);var _ap_upload=require('../../lib/ap_upload');var _ap_upload2=_interopRequireDefault(_ap_upload);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}var DEMO_IMAGES=['https://raw.githubusercontent.com/apeman-asset-labo/apeman-asset-images/master/dist/dummy/12.jpg'];var Demo=_react2.default.createClass({displayName:'Demo',render:function render(){var s=this;return _react2.default.createElement('div',null,_react2.default.createElement(_ap_upload2.default,{multiple:true,id:'demo-file-upload-01',name:'file-input-01',accept:'image/*',onLoad:s.handleLoaded}),_react2.default.createElement(_ap_upload2.default,{multiple:true,id:'demo-file-upload-02',name:'file-input-02',accept:'image/*',value:DEMO_IMAGES,onLoad:s.handleLoaded}))},handleLoaded:function handleLoaded(ev){console.log('result',ev.target,ev.urls)}});module.exports=Demo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlbW8uY29tcG9uZW50LmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx1UUFLQSxJQUFNLFlBQWMsQ0FDaEIsa0dBRGdCLENBQWQsQ0FJTixJQUFJLEtBQU8sZ0JBQU0sV0FBTixDQUFrQixvQkFDekIsd0JBQVMsQ0FDTCxJQUFJLEVBQUksSUFBSixDQURDLE9BR0QseUNBQ0ksbURBQVUsU0FBVSxJQUFWLENBQ0EsR0FBRyxxQkFBSCxDQUNBLEtBQUssZUFBTCxDQUNBLE9BQU8sU0FBUCxDQUNBLE9BQVEsRUFBRSxZQUFGLENBSmxCLENBREosQ0FRSSxtREFBVSxTQUFVLElBQVYsQ0FDQSxHQUFHLHFCQUFILENBQ0EsS0FBSyxlQUFMLENBQ0EsT0FBTyxTQUFQLENBQ0EsTUFBTyxXQUFQLENBQ0EsT0FBUSxFQUFFLFlBQUYsQ0FMbEIsQ0FSSixDQURKLENBRkssQ0FxQlQsbUNBQWEsR0FBRyxDQUNaLFFBQVEsR0FBUixDQUFZLFFBQVosQ0FBc0IsR0FBRyxNQUFILENBQVcsR0FBRyxJQUFILENBQWpDLENBRFksQ0F0QlQsQ0FBUCxDQTJCSixPQUFPLE9BQVAsQ0FBaUIsSUFBakIiLCJmaWxlIjoiZGVtby5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL29rdW5pc2hpbmlzaGkvUHJvamVjdHMvYXBlbWFuLXByb2plY3RzL2FwZW1hbi1yZWFjdC11cGxvYWQvZG9jL2RlbW8iLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JyA7XG5pbXBvcnQgQXBVcGxvYWQgZnJvbSAnLi4vLi4vbGliL2FwX3VwbG9hZCc7XG5cbmNvbnN0IERFTU9fSU1BR0VTID0gW1xuICAgICdodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vYXBlbWFuLWFzc2V0LWxhYm8vYXBlbWFuLWFzc2V0LWltYWdlcy9tYXN0ZXIvZGlzdC9kdW1teS8xMi5qcGcnXG5dO1xuXG5sZXQgRGVtbyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPEFwVXBsb2FkIG11bHRpcGxlPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImRlbW8tZmlsZS11cGxvYWQtMDFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwiZmlsZS1pbnB1dC0wMVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdD1cImltYWdlLypcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkxvYWQ9e3MuaGFuZGxlTG9hZGVkfT5cbiAgICAgICAgICAgICAgICA8L0FwVXBsb2FkPlxuXG4gICAgICAgICAgICAgICAgPEFwVXBsb2FkIG11bHRpcGxlPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImRlbW8tZmlsZS11cGxvYWQtMDJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwiZmlsZS1pbnB1dC0wMlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdD1cImltYWdlLypcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17REVNT19JTUFHRVN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uTG9hZD17cy5oYW5kbGVMb2FkZWR9PlxuICAgICAgICAgICAgICAgIDwvQXBVcGxvYWQ+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuICAgIGhhbmRsZUxvYWRlZChldil7XG4gICAgICAgIGNvbnNvbGUubG9nKCdyZXN1bHQnLCBldi50YXJnZXQsIGV2LnVybHMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlbW87Il19