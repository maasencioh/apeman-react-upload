'use strict'

import React from 'react'
import {ApUpload, ApUploadStyle} from 'apeman-react-upload'

let ExampleComponent = React.createClass({
  render () {
    let s = this
    return (
      <div>
        <ApUploadStyle scoped={ true }/>
        <ApUpload multiple={ false }
                  id="demo-file-upload-01"
                  name="file-input-01"
                  accept="image/*"
                  onLoad={ s.handleLoaded }
                  onError={ s.handleError }/>
      </div>
    )
  },
  handleLoaded (urls) {
    console.log('Image urls:', urls)
    /* ... */
  },
  handleError (err) {
    /* ... */
  }
})
