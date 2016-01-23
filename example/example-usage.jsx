"use strict";

import React from 'react';
import {ApUpload, ApUploadStyle} from 'apeman-react-upload';

let ExampleComponent = React.createClass({
    render () {
        return (
            <div>
                <ApUploadStyle scoped={true}></ApUploadStyle>
                <ApUpload></ApUpload>
            </div>
        )
    }
});

