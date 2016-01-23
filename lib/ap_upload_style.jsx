/**
 * Style for ApUpload.
 * @constructor ApUploadStyle
 */

"use strict";

import React, {PropTypes as types} from 'react';
import {ApStyle} from 'apeman-react-style';

/** @lends ApUploadStyle */
let ApUploadStyle = React.createClass({
    propTypes: {
        scoped: types.bool,
        style: types.object,
        highlightColor: types.string
    },
    getDefaultProps() {
        return {
            scoped: false,
            style: {},
            highlightColor: ApStyle.DEFAULT_HIGHLIGHT_COLOR,
            backgroundColor: ApStyle.DEFAULT_BACKGROUND_COLOR
        }
    },
    render() {
        let s = this;
        let {props} = s;

        let {highlightColor, backgroundColor} = props;

        let data = {
                '.ap-upload': {}
            },
            smallMediaData = {},
            mediumMediaData = {},
            largeMediaData = {};
        return (
            <ApStyle scoped={props.scoped}
                     data={Object.assign(data, props.style)}
                     smallMediaData={smallMediaData}
                     mediumMediaData={mediumMediaData}
                     largeMediaData={largeMediaData}
            >{props.children}</ApStyle>
        );
    }
});

module.exports = ApUploadStyle;
