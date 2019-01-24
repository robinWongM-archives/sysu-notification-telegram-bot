const debug = require('debug')('SYSUBOT_Fetch_Helper')

module.exports = {
  getItem ($el, item) {
    switch (item.type) {
      case 'container':
        return $el(item.selector)
      case 'direct':
        $el = $el(item.selector)
        break
      case 'children':
        $el = $el.children(item.selector)
        break
      default:
        return
    }
  
    switch (item.attr) {
      case '[text]':
        return $el.text() ? $el.text().trim() : ''
      case '[html]':
        return $el.html() ? $el.html().trim() : ''
      default:
        return $el.attr(item.attr) ? $el.attr(item.attr).trim() : ''
    }
  }
}