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
    }
  ]
}