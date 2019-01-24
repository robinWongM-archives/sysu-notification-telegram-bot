module.exports = {
  sites: [
    {
      name: '计院',
      domain: 'sdcs.sysu.edu.cn',
      categories: [
        {
          name: '本科教务',
          path: '/bk/jw',
          updateInterval: 300,
          parseType: 'sdcs'
        },
        {
          name: '学工通知',
          path: 'student/notice',
          updateInterval: 300,
          parseType: 'sdcs'
        }
      ]
    },
    {
      name: '教务部',
      domain: 'jwb.sysu.edu.cn',
      categories: [
        {
          name: '通知',
          path: '/notice',
          updateInterval: 300,
          parseType: 'jwb'
        }
      ]
    }
  ],
  parseType: {
    'sdcs': {
      list: {
        item: {
          type: 'container',
          selector: '.full-page-list ul li'
        },
        title: {
          type: 'children',
          selector: 'a',
          attr: '[text]'
        },
        url: {
          type: 'children',
          selector: 'a',
          attr: 'href'
        },
        date: {
          type: 'children',
          selector: '.p-fl-time',
          attr: '[text]'
        }
      },
      post: {
        title: {
          type: 'direct',
          selector: '.page-header',
          attr: '[text]'
        },
        content: {
          type: 'direct',
          selector: '.field-name-body .field-items .field-item',
          attr: '[html]'
        }
      },
      attachment: {
        container: {
          type: 'container',
          selector: '.field-name-field-file .field-items .field-item .file'
        },
        name: {
          type: 'children',
          selector: 'a',
          attr: '[text]'
        },
        url: {
          type: 'children',
          selector: 'a',
          attr: 'href'
        },
        fileType: {
          type: 'children',
          selector: 'img',
          attr: 'title'
        }
      }
    },
    'jwb': {
      list: {
        item: {
          type: 'container',
          selector: '.view-id-jwnews .view-content .list-i ul li'
        },
        title: {
          type: 'children',
          selector: 'a',
          attr: '[text]'
        },
        url: {
          type: 'children',
          selector: 'a',
          attr: 'href'
        },
        date: {
          type: 'children',
          selector: '.block-time',
          attr: '[text]'
        }
      },
      post: {
        title: {
          type: 'direct',
          selector: '.page-header',
          attr: '[text]'
        },
        content: {
          type: 'direct',
          selector: '.field-name-body .field-items .field-item',
          attr: '[html]'
        }
      },
      attachment: {
        container: {
          type: 'container',
          selector: '.field-name-field-tzfj .field-items .field-item .file'
        },
        name: {
          type: 'children',
          selector: 'a',
          attr: '[text]'
        },
        url: {
          type: 'children',
          selector: 'a',
          attr: 'href'
        },
        fileType: {
          type: 'children',
          selector: 'img',
          attr: 'title'
        }
      }
    }
  }
}