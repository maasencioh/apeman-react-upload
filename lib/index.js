/**
 * apeman react package for file upload components.
 * @module apeman-react-upload
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get ApUploadStyle () { return d(require('./ap_upload_style')) },
  get ApUpload () { return d(require('./ap_upload')) }
}
