/**
 * apeman react package for file upload components.
 * @constructor ApUpload
 */

"use strict";

import React, {PropTypes as types} from 'react';
import classnames from 'classnames';
import async from 'async';
import uuid from 'uuid';
import {ApImage} from 'apeman-react-image';
import {ApSpinner} from 'apeman-react-spinner';
import {ApButton} from 'apeman-react-button';


/** @lends ApUpload */
let ApUpload = React.createClass({


    //--------------------
    // Specs
    //--------------------

    propTypes: {
        name: types.string,
        id: types.string,
        multiple: types.bool,
        onLoad: types.func,
        onError: types.func,
        width: types.number,
        height: types.number,
        text: types.string,
        icon: types.string,
        closeIcon: types.string,
        spinnerTheme: types.string
    },

    mixins: [],

    statics: {
        readFile(file, callback){
            let reader = new FileReader();
            reader.onerror = function onerror(err) {
                callback(err);
            };
            reader.onload = function onload(ev) {
                callback(null, ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    },

    getInitialState() {
        return {
            spinning: false,
            error: null,
            urls: null
        };
    },

    getDefaultProps() {
        return {
            name: null,
            id: `ap-upload-${uuid.v4()}`,
            multiple: false,
            width: 180,
            height: 180,
            text: 'Upload file',
            icon: 'fa fa-cloud-upload',
            closeIcon: 'fa fa-close',
            spinnerIcon: 'c'
        };
    },

    render() {
        let s = this;
        let {state, props} = s;
        let {width, height} = props;
        return (
            <div className={classnames('ap-upload', props.className)}
                 style={Object.assign({}, props.style)}>
                <input type="file"
                       className="ap-upload-input"
                       multiple={props.multiple}
                       name={props.name}
                       id={props.id}
                       onChange={s.handleChange}
                       style={{width, height}}
                />
                <label className="ap-upload-label" htmlFor={props.id}>
                    <span className="ap-upload-aligner">
                    </span>
                    <span className="ap-upload-label-inner">
                        <i className={classnames("ap-upload-icon", props.icon)}/>
                        <span className="ap-upload-text">{props.text}</span>
                        {props.children}
                    </span>
                </label>
                {s._renderPreviewImage(state.urls, width, height)}
                {s._renderRemoveButton(!!state.urls, props.closeIcon)}
                {s._renderSpinner(state.spinning, props.spinnerTheme)}
            </div>
        );
    },


    //--------------------
    // Lifecycle
    //--------------------

    componentWillMount() {
        let s = this;
    },

    componentDidMount() {
        let s = this;
    },

    componentWillReceiveProps(nextProps) {
        let s = this;
    },

    shouldComponentUpdate(nextProps, nextState) {
        let s = this;
        return true;
    },

    componentWillUpdate(nextProps, nextState) {
        let s = this;
    },

    componentDidUpdate(prevProps, prevState) {
        let s = this;
    },

    componentWillUnmount() {
        let s = this;
    },

    //------------------
    // Custom
    //------------------

    handleChange(e){
        let s = this,
            {props} = s,
            files = Array.prototype.slice.call(e.target.files, 0);

        s.setState({spinning: true});
        async.concat(files, ApUpload.readFile, (err, urls) => {
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

    handleRemove(){
        let s = this,
            {props} = s;
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

    _renderSpinner(spinning, theme){
        let s = this;
        return (
            <ApSpinner enabled={spinning} theme={theme}>
            </ApSpinner>
        );
    },

    _renderRemoveButton(removable, icon){
        let s = this;
        if (!removable) {
            return null;
        }
        return (
            <ApButton onTap={s.handleRemove} className="ap-upload-remove-button">
                <i className={classnames("ap-upload-remove-icon", icon)}/>
            </ApButton>
        )
    },

    _renderPreviewImage(urls, width, height){
        if (!urls) {
            return null;
        }
        return urls
            .filter(url => /^data:image/.test(url))
            .map(url => (
                <ApImage key={url}
                         src={url}
                         height={height}
                         width={width}
                         className={classnames("ap-upload-preview-image")}
                         scale="fit">
                </ApImage>
            ));
    }
});

module.exports = ApUpload;
