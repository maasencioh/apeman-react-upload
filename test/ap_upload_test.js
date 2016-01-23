/**
 * Test case for apUpload.
 * Runs with mocha.
 */
"use strict";

const ApUpload = require('../lib/ap_upload.js'),
    React = require('react'),
    ReactDOM = require('react-dom/server'),
    assert = require('assert');

describe('ap-upload', () => {

    before((done) => {
        done();
    });

    after((done) => {
        done();
    });


    it('Render component.', (done) => {
        let html = ReactDOM.renderToString(
            React.createElement('div',
                {},
                React.createElement(ApUpload, {})
            )
        );
        console.log(html);
        assert.ok(html);
        done();
    });
});

