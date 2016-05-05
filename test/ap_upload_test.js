/**
 * Test case for apUpload.
 * Runs with mocha.
 */
'use strict'

const ApUpload = require('../lib/ap_upload.js').default
const React = require('react')
const ReactDOM = require('react-dom/server')
const assert = require('assert')

describe('ap-upload', () => {
  before((done) => {
    done()
  })

  after((done) => {
    done()
  })

  it('Detect image url', (done) => {
    assert.ok(ApUpload.isImageUrl('https://example.com/dummy/12.jpg'))
    assert.ok(ApUpload.isImageUrl('https://example.com/dummy/12.gif'))
    assert.ok(!ApUpload.isImageUrl('https://example.com/dummy/12.txt'))
    done()
  })

  it('Render component.', (done) => {
    let html = ReactDOM.renderToString(
      React.createElement('div',
        {},
        React.createElement(ApUpload, {})
      )
    )
    console.log(html)
    assert.ok(html)
    done()
  })
})

/* global describe, before, after, it */
