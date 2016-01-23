"use strict";

import React from 'react' ;
import ApUpload from '../../lib/ap_upload';

let Demo = React.createClass({
    render() {
        let s = this;
        return (
            <div>
                <ApUpload multiple={true}
                          id="demo-file-upload"
                          name="file-input-01"
                          accept="image/*"
                          onLoad={s.handleLoaded}>
                </ApUpload>
            </div>
        );
    },
    handleLoaded(files){
        console.log('files', files);
    }
});

module.exports = Demo;