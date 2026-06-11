const previewCategories = [
  { id: 'kaoyan', code: 'kaoyan', name: '考研' },
  { id: 'kaogong', code: 'kaogong', name: '考公考编' },
  { id: 'job', code: 'job', name: '就业' },
  { id: 'liuxue', code: 'liuxue', name: '留学' },
  { id: 'experience', code: 'experience', name: '经验分享' },
  { id: 'resource', code: 'resource', name: '资料互助' },
]

const previewPosts = [
  {
    id: 12,
    title: '复试结束后，我怎么把跨考资料整理成可复用清单',
    content: [
      '## 我最后留下了三类资料',
      '',
      '- 能直接复用的模板：复试自我介绍、项目问答、联系导师邮件',
      '- 只保留一次的记录：目标院校真题回忆、面试官追问路径、时间线',
      '- 必须写清来源的文件：学长经验、论坛搬运、自己整理的笔记',
      '',
      '### 我现在的整理顺序',
      '',
      '先把每份资料标成“模板 / 记录 / 来源文件”，再决定要不要公开分享。',
      '这样后面不管是继续二战、转给学弟学妹，还是补个人知识库，都不会重新翻一遍。',
      '',
      '> 如果你也在跨考，最容易乱掉的不是资料数量，而是资料边界。',
    ].join('\n'),
    category: { id: 'kaoyan', code: 'kaoyan', name: '考研' },
    tags: '跨考,复试,资料整理',
    visibility: 'public',
    anonymous: false,
    hasAttachment: true,
    attachmentCount: 2,
    attachmentNote: '附件里放的是我最后留下来的资料目录模板和问答整理方式，先看说明再下载。',
    attachments: [
      { id: 701, originalName: '资料包说明.md', fileSize: 4096, fileType: 'text/markdown', downloadCount: 48, createdAt: '2026-06-10T10:10:00' },
      { id: 702, originalName: '复试问题树.pdf', fileSize: 684032, fileType: 'application/pdf', downloadCount: 93, createdAt: '2026-06-10T10:10:00' },
    ],
    contentFormat: 'markdown',
    sourceFileName: 'kaoyan-materials-preview.md',
    authorId: 2001,
    authorName: '考研测试用户',
    status: 'PUBLISHED',
    reviewReason: null,
    reviewedById: null,
    reviewedAt: null,
    viewCount: 426,
    commentCount: 3,
    likeCount: 58,
    favoriteCount: 37,
    reportCount: 0,
    liked: false,
    favorited: false,
    createdAt: '2026-06-10T09:20:00',
    updatedAt: '2026-06-10T11:00:00',
  },
  {
    id: 21,
    title: '求职经验复盘：简历被筛掉后我补了什么',
    content: '把项目关键词、业务结果和岗位技能重新对齐后，第二周开始稳定收到面试邀约。',
    category: { id: 'job', code: 'job', name: '就业' },
    tags: '简历,就业,校招',
    visibility: 'public',
    anonymous: false,
    hasAttachment: true,
    attachmentCount: 1,
    attachmentNote: '附件是我修改前后的简历检查表，适合校招投递前自查。',
    attachments: [
      { id: 703, originalName: 'resume-checklist.pdf', fileSize: 204800, fileType: 'application/pdf', downloadCount: 61, createdAt: '2026-06-09T20:30:00' },
    ],
    contentFormat: 'markdown',
    sourceFileName: 'job-resume-preview.md',
    authorId: 2002,
    authorName: '就业测试用户',
    status: 'PUBLISHED',
    reviewReason: null,
    reviewedById: null,
    reviewedAt: null,
    viewCount: 318,
    commentCount: 2,
    likeCount: 46,
    favoriteCount: 22,
    reportCount: 0,
    liked: true,
    favorited: false,
    createdAt: '2026-06-09T19:40:00',
    updatedAt: '2026-06-09T21:10:00',
  },
  {
    id: 33,
    title: '留学时间线怎么拆，才不会把文书和语言考试撞在一起',
    content: '我把语言考试、文书修改、推荐信确认拆成三条并行线，每条线只保留一个下阶段动作。',
    category: { id: 'liuxue', code: 'liuxue', name: '留学' },
    tags: '时间线,文书,语言考试',
    visibility: 'public',
    anonymous: true,
    hasAttachment: false,
    attachmentCount: 0,
    attachmentNote: '',
    attachments: [],
    contentFormat: 'markdown',
    sourceFileName: 'studyabroad-timeline-preview.md',
    authorId: null,
    authorName: null,
    status: 'PUBLISHED',
    reviewReason: null,
    reviewedById: null,
    reviewedAt: null,
    viewCount: 205,
    commentCount: 1,
    likeCount: 19,
    favoriteCount: 11,
    reportCount: 0,
    liked: false,
    favorited: false,
    createdAt: '2026-06-08T18:15:00',
    updatedAt: '2026-06-08T18:15:00',
  },
  {
    id: 45,
    title: '资料互助帖要怎么写，别人下载后才知道从哪里开始看',
    content: '我现在会把资料用途、适用阶段和先读顺序放在正文前 5 行，避免附件下载了却不知道怎么用。',
    category: { id: 'resource', code: 'resource', name: '资料互助' },
    tags: '资料互助,附件说明,使用路径',
    visibility: 'members',
    anonymous: false,
    hasAttachment: true,
    attachmentCount: 3,
    attachmentNote: '每个附件前都写了“先看什么，再看什么”，适合做资料帖说明模板。',
    attachments: [
      { id: 704, originalName: '资料说明模板.docx', fileSize: 76800, fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', downloadCount: 27, createdAt: '2026-06-07T16:20:00' },
      { id: 705, originalName: '附件顺序示例.pdf', fileSize: 168320, fileType: 'application/pdf', downloadCount: 18, createdAt: '2026-06-07T16:20:00' },
      { id: 706, originalName: '目录结构样例.xlsx', fileSize: 45296, fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', downloadCount: 12, createdAt: '2026-06-07T16:20:00' },
    ],
    contentFormat: 'markdown',
    sourceFileName: 'resource-post-preview.md',
    authorId: 2003,
    authorName: '资料互助测试用户',
    status: 'PUBLISHED',
    reviewReason: null,
    reviewedById: null,
    reviewedAt: null,
    viewCount: 167,
    commentCount: 4,
    likeCount: 24,
    favoriteCount: 41,
    reportCount: 0,
    liked: false,
    favorited: true,
    createdAt: '2026-06-07T16:00:00',
    updatedAt: '2026-06-07T17:10:00',
  },
]

const previewCommentsByPostId = {
  12: [
    {
      id: 9001,
      content: '我也在做跨考资料整理，最难的是区分“经验”跟“模板”，你这个分类法很有用。',
      authorId: 3201,
      authorName: '复试冲刺用户',
      parentId: null,
      status: 'PUBLISHED',
      reportCount: 0,
      editable: true,
      deleted: false,
      hidden: false,
      createdAt: '2026-06-10T10:32:00',
      updatedAt: '2026-06-10T10:32:00',
      replyCount: 1,
      replies: [
        {
          id: 9002,
          content: '是的，我后来发现如果不先划边界，资料会越留越多。',
          authorId: 2001,
          authorName: '考研测试用户',
          parentId: 9001,
          status: 'PUBLISHED',
          reportCount: 0,
          editable: true,
          deleted: false,
          hidden: false,
          createdAt: '2026-06-10T10:48:00',
          updatedAt: '2026-06-10T10:48:00',
          replyCount: 0,
          replies: [],
        },
      ],
    },
    {
      id: 9003,
      content: '资料包说明这一步很关键，不然下载完还是不知道先看哪份。',
      authorId: 3202,
      authorName: '跨考二战用户',
      parentId: null,
      status: 'PUBLISHED',
      reportCount: 0,
      editable: true,
      deleted: false,
      hidden: false,
      createdAt: '2026-06-10T11:12:00',
      updatedAt: '2026-06-10T11:12:00',
      replyCount: 0,
      replies: [],
    },
  ],
  21: [
    {
      id: 9010,
      content: '我就是把项目描述写得太像流水账，后来补上结果数据才有回复。',
      authorId: 3203,
      authorName: '校招准备中',
      parentId: null,
      status: 'PUBLISHED',
      reportCount: 0,
      editable: true,
      deleted: false,
      hidden: false,
      createdAt: '2026-06-09T20:12:00',
      updatedAt: '2026-06-09T20:12:00',
      replyCount: 0,
      replies: [],
    },
    {
      id: 9011,
      content: '想看你怎么写技能关键词和项目结果这一段。',
      authorId: 3204,
      authorName: '前端转后端用户',
      parentId: null,
      status: 'PUBLISHED',
      reportCount: 0,
      editable: true,
      deleted: false,
      hidden: false,
      createdAt: '2026-06-09T20:40:00',
      updatedAt: '2026-06-09T20:40:00',
      replyCount: 0,
      replies: [],
    },
  ],
  33: [
    {
      id: 9020,
      content: '把时间线拆成并行任务这个思路很好，我之前全塞在一个表里特别乱。',
      authorId: 3205,
      authorName: '留学准备用户',
      parentId: null,
      status: 'PUBLISHED',
      reportCount: 0,
      editable: true,
      deleted: false,
      hidden: false,
      createdAt: '2026-06-08T19:02:00',
      updatedAt: '2026-06-08T19:02:00',
      replyCount: 0,
      replies: [],
    },
  ],
  45: [
    {
      id: 9030,
      content: '成员帖也能先把阅读顺序写清楚，这样下载前就知道值不值得看。',
      authorId: 3206,
      authorName: '资料整理用户',
      parentId: null,
      status: 'PUBLISHED',
      reportCount: 0,
      editable: true,
      deleted: false,
      hidden: false,
      createdAt: '2026-06-07T18:08:00',
      updatedAt: '2026-06-07T18:08:00',
      replyCount: 0,
      replies: [],
    },
    {
      id: 9031,
      content: '我现在会在标题里就写“资料用途”，这样别人筛选时更清楚。',
      authorId: 3207,
      authorName: '资源分享用户',
      parentId: null,
      status: 'PUBLISHED',
      reportCount: 0,
      editable: true,
      deleted: false,
      hidden: false,
      createdAt: '2026-06-07T18:22:00',
      updatedAt: '2026-06-07T18:22:00',
      replyCount: 0,
      replies: [],
    },
    {
      id: 9032,
      content: '附件顺序示例这个想法不错，很多资料帖的问题就出在这里。',
      authorId: 3208,
      authorName: '经验分享用户',
      parentId: null,
      status: 'PUBLISHED',
      reportCount: 0,
      editable: true,
      deleted: false,
      hidden: false,
      createdAt: '2026-06-07T18:35:00',
      updatedAt: '2026-06-07T18:35:00',
      replyCount: 1,
      replies: [
        {
          id: 9033,
          content: '对，尤其是资料一多，就更需要正文先告诉别人怎么读。',
          authorId: 2003,
          authorName: '资料互助测试用户',
          parentId: 9032,
          status: 'PUBLISHED',
          reportCount: 0,
          editable: true,
          deleted: false,
          hidden: false,
          createdAt: '2026-06-07T18:46:00',
          updatedAt: '2026-06-07T18:46:00',
          replyCount: 0,
          replies: [],
        },
      ],
    },
  ],
}

function cloneAttachment(item) {
  return { ...item }
}

function cloneComment(item) {
  return {
    ...item,
    replies: Array.isArray(item.replies) ? item.replies.map(cloneComment) : [],
  }
}

function clonePost(item) {
  return {
    ...item,
    category: item.category ? { ...item.category } : null,
    attachments: Array.isArray(item.attachments) ? item.attachments.map(cloneAttachment) : [],
  }
}

function includesText(source, query) {
  if (!query) return true
  return String(source || '').toLowerCase().includes(String(query).trim().toLowerCase())
}

function matchesKeyword(post, keyword) {
  if (!keyword) return true
  return [
    post.title,
    post.content,
    post.tags,
    post.category?.name,
    post.category?.code,
    post.attachmentNote,
  ].some((field) => includesText(field, keyword))
}

function calculateHotScore(post) {
  return post.likeCount * 3 + post.favoriteCount * 4 + post.commentCount * 5 + Math.round(post.viewCount / 20)
}

export function canUseCommunityPreview() {
  return Boolean(import.meta.env.DEV)
}

export function shouldForceCommunityPreview(token) {
  return Boolean(import.meta.env.DEV && token === 'dev-token')
}

export function createCommunityPreviewCategories() {
  return previewCategories.map((item) => ({ ...item }))
}

export function createCommunityPreviewPosts(filters = {}) {
  const normalizedCategory = filters.category ? String(filters.category) : ''
  const normalizedTag = filters.tag ? String(filters.tag).trim().toLowerCase() : ''

  const items = previewPosts
    .filter((post) => !normalizedCategory || post.category?.code === normalizedCategory)
    .filter((post) => matchesKeyword(post, filters.keyword))
    .filter((post) => !normalizedTag || String(post.tags || '').toLowerCase().includes(normalizedTag))
    .filter((post) => (
      typeof filters.hasAttachment === 'boolean'
        ? Boolean(post.hasAttachment) === filters.hasAttachment
        : true
    ))
    .map(clonePost)

  items.sort((left, right) => {
    if (filters.sort === 'hot') {
      return calculateHotScore(right) - calculateHotScore(left)
    }
    return String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
  })

  return items
}

export function findCommunityPreviewPostById(id) {
  const match = previewPosts.find((item) => String(item.id) === String(id))
  return match ? clonePost(match) : null
}

export function createCommunityPreviewComments(postId) {
  return (previewCommentsByPostId[postId] || previewCommentsByPostId[String(postId)] || []).map(cloneComment)
}
