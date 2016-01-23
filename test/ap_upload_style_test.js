/**
 * Test case for apUploadStyle.
 * Runs with mocha.
 */
"use strict";

const ApUploadStyle = require('../lib/ap_upload_style.js'),
    React = require('react'),
    ReactDOM = require('react-dom/server'),
    assert = require('assert');

describe('ap-upload-style', () => {

    before((done) => {
        done();
    });

    after((done) => {
        done();
    });


    it('Render style component', (done) => {
        let style = ReactDOM.renderToString(
            React.createElement(ApUploadStyle, {})
        );
        console.log(style);
        assert.ok(style);
        done();
    });
});

