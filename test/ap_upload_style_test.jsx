/**
 * Test case for ap-upload-style.
 * Runs with mocha.
 */
'use strict'

import ApUploadStyle from '../lib/ap_upload_style'
import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'

describe('ap-upload-style', () => {
  before(() => {
  })

  after(() => {
  })

  it('Render a component', () => {
    let element = shallow(
      <ApUploadStyle/>
    )
    assert.ok(element)
  })
})

/* global describe, before, after, it */
