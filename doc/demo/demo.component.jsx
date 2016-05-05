'use strict'

import React from 'react'
import ApUpload from '../../lib/ap_upload'
import ApUploadStyle from '../../lib/ap_upload_style'
import {ApImageStyle} from 'apeman-react-image'
import {ApSpinnerStyle} from 'apeman-react-spinner'
import {ApButtonStyle} from 'apeman-react-button'

const DEMO_IMAGES = [
  'https://raw.githubusercontent.com/apeman-asset-labo/apeman-asset-images/master/dist/dummy/12.jpg'
]

const Demo = React.createClass({
  render () {
    const s = this
    return (
      <div>
        <ApSpinnerStyle />
        <ApButtonStyle highlightColor="#b35600"/>
        <ApImageStyle />
        <ApUploadStyle />
        <ApUpload multiple={ true }
                  id="demo-file-upload-01"
                  name="file-input-01"
                  accept="image/*"
                  onLoad={ s.handleLoaded }>
        </ApUpload>

        <ApUpload multiple={ true }
                  id="demo-file-upload-02"
                  name="file-input-02"
                  accept="image/*"
                  value={ DEMO_IMAGES }
                  onLoad={ s.handleLoaded }>
        </ApUpload>
      </div>
    )
  },
  handleLoaded (ev) {
    console.log('result', ev.target, ev.urls)
  }
})

export default Demo
