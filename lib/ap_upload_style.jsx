/**
 * Style for ApUpload.
 * @class ApUploadStyle
 */

'use strict'

import React, {PropTypes as types} from 'react'
import {ApStyle} from 'apeman-react-style'

/** @lends ApUploadStyle */
const ApUploadStyle = React.createClass({
  propTypes: {
    style: types.object,
    highlightColor: types.string,
    backgroundColor: types.string
  },
  getDefaultProps () {
    return {
      style: {},
      highlightColor: ApStyle.DEFAULT_HIGHLIGHT_COLOR,
      backgroundColor: ApStyle.DEFAULT_BACKGROUND_COLOR
    }
  },
  render () {
    const s = this
    let { props } = s

    let { highlightColor, backgroundColor } = props;

    let data = {
      '.ap-upload': {
        position: 'relative',
        display: 'inline-block',
        color: '#888',
        overflow: 'hidden'
      },
      '.ap-upload:hover': {
        color: '#555'
      },
      '.ap-upload:active': {
        textShadow: 'none',
        opacity: 1,
        color: '#777'
      },
      '.ap-upload-label': {
        position: 'absolute',
        zIndex: 1,
        textAlign: 'center',
        boxSizing: 'border-box',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        backgroundColor: `${backgroundColor}`,
        boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.33)',
        border: '1px solid #CCC',
        borderRadius: '2px'
      },
      '.ap-upload-input': {
        opacity: 0,
        display: 'inline-block',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 2
      },
      '.ap-upload-icon': {
        display: 'block',
        fontSize: '2em'
      },
      '.ap-upload-label-inner': {
        display: 'inline-block',
        verticalAlign: 'middle'
      },
      '.ap-upload-aligner': {
        display: 'inline-block',
        width: '1px',
        marginRight: '-1px',
        height: '100%',
        boxSizing: 'border-box',
        verticalAlign: 'middle'
      },
      '.ap-upload .ap-spinner': {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 8,
        backgroundColor: `${backgroundColor}`,
        color: '#DDD'
      },
      '.ap-upload-preview-image': {
        display: 'inline-block',
        boxSizing: 'border-box',
        zIndex: 4,
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        border: '1px solid #AAA'
      },
      '.ap-upload-remove-button': {
        display: 'inline-block',
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 5,
        margin: 0,
        border: 'none',
        padding: '8px',
        fontSize: '24px',
        color: '#AAA',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: 0
      },
      '.ap-upload-remove-button:hover': {
        opacity: 1,
        boxShadow: 'none',
        color: '#555'
      },
      '.ap-upload-remove-button:active': {
        opacity: 1,
        boxShadow: 'none',
        color: '#555'
      }
    }
    let smallMediaData = {}
    let mediumMediaData = {}
    let largeMediaData = {}
    return (
      <ApStyle data={ Object.assign(data, props.style) }
               smallMediaData={ smallMediaData }
               mediumMediaData={ mediumMediaData }
               largeMediaData={ largeMediaData }
      >{ props.children }</ApStyle>
    )
  }
})

export default ApUploadStyle
