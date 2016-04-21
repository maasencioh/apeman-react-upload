/**
 * apeman react package for file upload components.
 * @constructor ApUpload
 */

'use strict'

import React, {PropTypes as types} from 'react'
import classnames from 'classnames'
import async from 'async'
import path from 'path'
import uuid from 'uuid'
import {ApImage} from 'apeman-react-image'
import {ApSpinner} from 'apeman-react-spinner'
import {ApButton} from 'apeman-react-button'

/** @lends ApUpload */
const ApUpload = React.createClass({

  // --------------------
  // Specs
  // --------------------

  propTypes: {
    /** Name of input */
    name: types.string,
    /** DOM id of input */
    id: types.string,
    /** Allow multiple upload */
    multiple: types.bool,
    /** Handler for change event */
    onChange: types.func,
    /** Handler for load event */
    onLoad: types.func,
    /** Handler for error event */
    onError: types.func,
    /** Image width */
    width: types.number,
    /** Image height */
    height: types.number,
    /** Guide text */
    text: types.string,
    /** Accept file type */
    accept: types.string,
    /** Guide icon */
    icon: types.string,
    /** Icon for close images */
    closeIcon: types.string,
    /** Spinner theme */
    spinner: types.string,
    /** Value of input */
    value: types.oneOfType([
      types.string,
      types.array
    ])
  },

  mixins: [],

  statics: {
    readFile (file, callback) {
      let reader = new window.FileReader()
      reader.onerror = function onerror (err) {
        callback(err)
      }
      reader.onload = function onload (ev) {
        callback(null, ev.target.result)
      }
      reader.readAsDataURL(file)
    },
    isImageUrl(url) {
      return /^data:image/.test(url) || !!~[
          '.jpg',
          '.jpeg',
          '.svg',
          '.gif',
          '.png'
        ].indexOf(path.extname(url))
    }
  },

  getInitialState() {
    const s = this,
      { props } = s;
    let hasValue = props.value && props.value.length > 0
    return {
      spinning: false,
      error: null,
      urls: hasValue ? [].concat(props.value) : null
    }
  },

  getDefaultProps () {
    return {
      name: null,
      id: `ap-upload-${uuid.v4()}`,
      multiple: false,
      width: 180,
      height: 180,
      accept: null,
      text: 'Upload file',
      icon: 'fa fa-cloud-upload',
      closeIcon: 'fa fa-close',
      spinnerIcon: ApSpinner.DEFAULT_THEME,
      onChange: null,
      onLoad: null,
      onError: null
    }
  },

  render () {
    const s = this
    let { state, props } = s
    let { width, height } = props
    return (
      <div className={classnames('ap-upload', props.className)}
           style={Object.assign({}, props.style)}>
        <input type="file"
               className="ap-upload-input"
               multiple={ props.multiple }
               name={ props.name }
               id={ props.id }
               accept={ props.accept }
               onChange={s.handleChange}
               style={{width, height}}
        />
        <label className="ap-upload-label" htmlFor={ props.id }>
                    <span className="ap-upload-aligner">
                    </span>
                    <span className="ap-upload-label-inner">
                        <i className={ classnames("ap-upload-icon", props.icon) }/>
                        <span className="ap-upload-text">{props.text}</span>
                      { props.children }
                    </span>
        </label>
        { s._renderPreviewImage(state.urls, width, height) }
        { s._renderRemoveButton(!!(state.urls && state.urls.length > 0), props.closeIcon) }
        { s._renderSpinner(state.spinning, props.spinner) }
      </div>
    )
  },

  // --------------------
  // Lifecycle
  // --------------------

  // ------------------
  // Custom
  // ------------------

  handleChange (e) {
    const s = this
    let { props } = s
    let { target } = e
    let files = Array.prototype.slice.call(target.files, 0)

    let { onChange, onError, onLoad } = props

    s.setState({ spinning: true })
    if (onChange) {
      onChange(e)
    }
    async.concat(files, ApUpload.readFile, (err, urls) => {
      e.urls = urls
      e.target = target
      s.setState({
        spinning: false,
        error: err,
        urls: urls
      })
      if (err) {
        if (onError) {
          onError(err)
        }
      } else {
        if (onLoad) {
          onLoad(e)
        }
      }
    })
  },

  handleRemove() {
    const s = this,
      { props } = s,
      { onLoad } = props
    s.setState({
      error: null,
      urls: null
    })
    if (onLoad) {
      onLoad([])
    }
  },

  // ------------------
  // Private
  // ------------------

  _renderSpinner (spinning, theme) {
    const s = this
    return (
      <ApSpinner enabled={spinning} theme={theme}>
      </ApSpinner>
    )
  },

  _renderRemoveButton (removable, icon) {
    const s = this
    if (!removable) {
      return null
    }
    return (
      <ApButton onTap={ s.handleRemove } className="ap-upload-remove-button">
        <i className={ classnames("ap-upload-remove-icon", icon) }/>
      </ApButton>
    )
  },

  _renderPreviewImage (urls, width, height) {
    if (!urls) {
      return null
    }
    const s = this
    return urls
      .filter((url) => ApUpload.isImageUrl(url))
      .map((url, i) => (
        <ApImage key={ url }
                 src={ url }
                 height={ height }
                 width={ width }
                 className={ classnames("ap-upload-preview-image") }
                 style={ {
                            left: `${i * 10}%`,
                            top: `${i * 10}%`
                         } }
                 scale="fit">
        </ApImage>
      ))
  }
})

module.exports = ApUpload
