export const formFields = [
  {
    id: 'acceptTerms',
    name: 'acceptTerms',
    label: '接受條款',
    type: 'checkbox',
    required: true,
    placeholder: null,
    helpText: '請詳閱並接受活動條款與條件',
    order: 1
  },
  {
    id: 'nickname',
    name: 'nickname',
    label: '暱稱',
    type: 'text',
    required: true,
    placeholder: '請輸入您的暱稱',
    helpText: '2-20個字元',
    order: 2
  },
  {
    id: 'phoneNumber',
    name: 'phoneNumber',
    label: '電話號碼',
    type: 'phone',
    required: true,
    placeholder: '09xxxxxxxx',
    helpText: '請輸入有效的台灣手機號碼',
    order: 3
  },
  {
    id: 'sex',
    name: 'sex',
    label: '性別',
    type: 'radio',
    required: true,
    options: [
      { value: 'male', label: '男' },
      { value: 'female', label: '女' },
      { value: 'other', label: '其他' }
    ],
    order: 4
  },
  {
    id: 'foodHabits',
    name: 'foodHabits',
    label: '飲食習慣',
    type: 'select',
    required: true,
    options: [
      { value: 'normal', label: '一般' },
      { value: 'no-beef', label: '不吃牛肉' },
      { value: 'no-pork', label: '不吃豬肉' },
      { value: 'vegetarian', label: '素食' }
    ],
    order: 5
  },
  {
    id: 'livingArea',
    name: 'livingArea',
    label: '居住地區',
    type: 'select',
    required: true,
    options: [
      { value: 'north', label: '北部' },
      { value: 'middle', label: '中部' },
      { value: 'south', label: '南部' },
      { value: 'east', label: '東部' }
    ],
    order: 6
  },
  {
    id: 'workingAt',
    name: 'workingAt',
    label: '工作地點',
    type: 'text',
    required: true,
    placeholder: '請輸入您的工作地點',
    helpText: '最多100個字元',
    order: 7
  },
  {
    id: 'jobTitle',
    name: 'jobTitle',
    label: '職位',
    type: 'text',
    required: true,
    placeholder: '請輸入您的職位',
    helpText: '最多50個字元',
    order: 8
  },
  {
    id: 'grade',
    name: 'grade',
    label: '年級',
    type: 'text',
    required: true,
    placeholder: '請輸入您的年級',
    helpText: '最多20個字元',
    order: 9
  },
  {
    id: 'haveEverBeenHere',
    name: 'haveEverBeenHere',
    label: '是否曾經來過',
    type: 'radio',
    required: true,
    options: [
      { value: true, label: '是' },
      { value: false, label: '否' }
    ],
    order: 10
  },
  {
    id: 'whereYouGotThis',
    name: 'whereYouGotThis',
    label: '從哪裡得知此活動',
    type: 'select',
    required: true,
    options: [
      { value: 'google', label: 'Google搜尋' },
      { value: 'social_media', label: '社群媒體' },
      { value: 'friend', label: '朋友介紹' },
      { value: 'family', label: '家人介紹' }
    ],
    order: 11
  }
];