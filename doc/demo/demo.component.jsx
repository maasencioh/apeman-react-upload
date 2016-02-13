"use strict";

import React from 'react' ;
import ApUpload from '../../lib/ap_upload';

const DEMO_IMAGES = [
    'https://raw.githubusercontent.com/apeman-asset-labo/apeman-asset-images/master/dist/dummy/12.jpg'
];

let Demo = React.createClass({
    render() {
        let s = this;
        return (
            <div>
                <ApUpload multiple={true}
                          id="demo-file-upload-01"
                          name="file-input-01"
                          accept="image/*"
                          onLoad={s.handleLoaded}>
                </ApUpload>

                <ApUpload multiple={true}
                          id="demo-file-upload-02"
                          name="file-input-02"
                          accept="image/*"
                          value={DEMO_IMAGES}
                          onLoad={s.handleLoaded}>
                </ApUpload>
            </div>
        );
    },
    handleLoaded(ev){
        console.log('result', ev.target, ev.urls);
    }
});

module.exports = Demo;