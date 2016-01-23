"use strict";

import React from 'react' ;
import ApUpload from '../../lib/ap_upload';

let Demo = React.createClass({
    render() {
        return (
            <div>
                <ApUpload multiple={true}
                          id="demo-file-upload"
                          name="file-input-01">
                </ApUpload>
            </div>
        );
    }
});

module.exports = Demo;