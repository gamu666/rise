// THE RISE public site — all content in one place. `node tools/build-site.cjs` writes index.html and surgalt/*.html.
//
// SAMPLE VALUES: everything inside `sample` objects (prices, durations, hours, schedules, start dates, FAQ answers that
// state policy) is placeholder data chosen from the 2026-11 market research, NOT confirmed by THE RISE.
// On the page they render with class="s" (thin amber underline). Replace them with real values, set `confirmed: true`
// on that object, and rebuild — confirmed values render without the marker.
//
// Course names, descriptions and topics come from the previous public site (legacy/app-2026-11-15.js).
// Contact details come from the THE RISE Facebook page (checked 2026-11-15).
module.exports = {
  org: {
    name: 'THE RISE мэргэжил сургалтын төв',
    short: 'THE RISE',
    phone: '7772 1170',
    tel: '77721170',
    address: 'Peace Tower, 15 давхар, 1501 тоот, Улаанбаатар',
    facebook: 'https://www.facebook.com/EDURISE.MN',
    messenger: 'https://m.me/EDURISE.MN',
    instagram: 'https://www.instagram.com/the.rise.official',
    instagramHandle: 'the.rise.official',
    followers: '16K',
    intro: 'Хүнд машин механизм, гоо сайхны мэргэжлийн сургалт — танхим болон онлайнаар.'
  },
  tracks: [
    { id: 'heavy', name: 'Хүнд машин', full: 'Хүнд машин механизм' },
    { id: 'beauty', name: 'Beauty', full: 'Гоо сайхан' }
  ],
  courses: [
    {
      slug: 'ekskavator', track: 'heavy', name: 'Экскаватор оператор', image: 'course-excavator', imagePos: '55% 60%', alt: 'Уулын бэлд ажиллаж буй гинжит экскаватор',
      tagline: 'Онолоо бодит машин дээр бататгана.',
      description: 'Экскаваторын ажиллагааны үндсэн зарчим, техник ашиглах аюулгүй байдал болон операторын дадлагыг хослуулна.',
      topics: ['Техник, удирдлагын үндэс', 'Аюулгүй ажиллагаа', 'Бодит техник дээрх дадлага'],
      sample: { confirmed: false, price: 450000, days: 21, theory: 30, practice: 40, schedule: 'Өдөр 09:00 · Орой 18:30', next: '2026-11-24', machine: 'гинжит экскаватор' }
    },
    {
      slug: 'damp', track: 'heavy', name: 'Дамп оператор', image: 'course-dump-truck', imagePos: '45% 45%', alt: 'Уурхайн шар дамп машин',
      tagline: 'Жолоодлого, ачилт, аюулгүй ажиллагаа.',
      description: 'Дампын ажиллагаа, техник ашиглах суурь мэдлэг болон аюулгүй ажиллах дадлаа хөгжүүлнэ.',
      topics: ['Техник ашиглалтын үндэс', 'Аюулгүй ажиллагааны дадал', 'Операторын дадлага'],
      sample: { confirmed: false, price: 420000, days: 18, theory: 24, practice: 36, schedule: 'Өдөр 09:00 · Орой 18:30', next: '2026-12-01', machine: 'дамп' }
    },
    {
      slug: 'kovsh', track: 'heavy', name: 'Ковш оператор', image: 'course-wheel-loader', imagePos: '50% 62%', alt: 'Нар жаргах үеийн дугуйт ковш',
      tagline: 'Ковшны ажиллагааг дадлагаар эзэмшинэ.',
      description: 'Ковшны бүтэц, ажиллагааны үндсэн ойлголт, аюулгүй ажиллагаа болон бодит техник дээрх дадлагатай танилцана.',
      topics: ['Техникийн бүтэц ба үзлэг', 'Аюулгүй ажиллах суурь дүрэм', 'Операторын дадлага'],
      sample: { confirmed: false, price: 420000, days: 18, theory: 24, practice: 36, schedule: 'Өдөр 09:00 · Орой 18:30', next: '2026-12-01', machine: 'дугуйт ковш' }
    },
    {
      slug: 'manikyur', track: 'beauty', name: 'Маникюр', image: 'course-manicure', imagePos: '55% 50%', alt: 'Маникюрын мастер хумс арчилж буй нь',
      tagline: 'Арчилгаанаас дизайн хүртэл.',
      description: 'Хумсны арчилгаа, хэлбэр гаргалт, дизайн болон нарийн ажиллагааны ур чадварыг дадлагаар хөгжүүлнэ.',
      topics: ['Арчилгааны үндэс', 'Хэлбэр, дизайн', 'Мэргэжлийн дадлага'],
      sample: { confirmed: false, price: 250000, days: 14, schedule: 'Өдөр · Орой · Амралтын өдөр', next: '2026-11-24', materials: 'Багтсан' }
    },
    {
      slug: 'sormuus', track: 'beauty', name: 'Сормуус', image: 'course-lash', imagePos: '50% 45%', alt: 'Сормуус суулгаж буй ойрын зураг',
      tagline: 'Нарийн техник. Цэвэр гүйцэтгэл.',
      description: 'Сормуусны нарийн ажиллагаа, техник болон үйлчлүүлэгчтэй ажиллах суурь дадлыг хөгжүүлнэ.',
      topics: ['Техникийн үндэс', 'Нарийвчлал ба зөв дадал', 'Мэргэжлийн дадлага'],
      sample: { confirmed: false, price: 240000, days: 10, schedule: 'Өдөр · Амралтын өдөр', next: '2026-11-29', materials: 'Багтсан' }
    }
  ],
  // Shared policy lines shown on course pages.
  policy: {
    sample: { confirmed: false, installments: '2 удаа (50% / 50%)', requirements: '18-аас дээш нас, иргэний үнэмлэх' }
  },
  steps: [
    ['Бүртгүүлэх', 'Нэр, утсаа үлдээнэ — 1 минут.'],
    ['Менежертэй холбогдох', 'Хуваарь, төлбөрийн нөхцөлөө тохирно.'],
    ['Онол + дадлага', 'Хуваарь, явцаа сурагчийн самбараас харна.'],
    ['Шалгалт, сертификат', 'Тэнцмэгц сертификатаа захиална.']
  ],
  faq: [
    { q: 'Төлбөрөө хувааж төлж болох уу?', sample: { confirmed: false, a: 'Болно. Сургалтын төлбөрийг 2 хувааж (50% / 50%) төлөх боломжтой.' } },
    { q: 'Хүнд машины сургалтад жолооны үнэмлэх хэрэгтэй юу?', sample: { confirmed: false, a: 'Шаардлагагүй. 18-аас дээш нас, иргэний үнэмлэхтэй байхад хангалттай.' } },
    { q: 'Орой эсвэл амралтын өдөр суралцаж болох уу?', sample: { confirmed: false, a: 'Хүнд машины сургалт өдөр, оройн ангитай. Beauty сургалт амралтын өдрийн ангитай.' } },
    { q: 'Төгсөхөд юу авах вэ?', sample: { confirmed: false, a: 'Төгсөлтийн шалгалтад тэнцсэн суралцагчид THE RISE-ийн сертификат олгоно.' } }
  ]
};
