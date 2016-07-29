/**
 * Test case for ap-upload.
 * Runs with mocha.
 */
'use strict'

import ApUpload from '../lib/ap_upload'
import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'

describe('ap-upload', () => {
  before(() => {
  })

  after(() => {
  })

  it('Render a component', () => {
    let element = shallow(
      <ApUpload/>
    )
    assert.ok(element)
  })
})

/* global describe, before, after, it */
