/**
 * apeman react package for file upload components.
 * @constructor ApUpload
 */

"use strict";

import React, {PropTypes as types} from 'react';
import classnames from 'classnames';
import async from 'async';

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
        onError: types.func
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
        return {};
    },

    getDefaultProps() {
        return {
            name: null,
            id: null,
            multiple: false
        };
    },

    render() {
        let s = this;
        let {state, props} = s;

        return (
            <div className={classnames('ap-upload', props.className)}
                 style={Object.assign({}, props.style)}>
                <input type="file"
                       multiple={props.multiple}
                       name={props.name}
                       id={props.id}
                       onChange={s.handleChange}
                />
                {props.children}
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

        async.concat(files, ApUpload.readFile, (err, urls) => {
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
