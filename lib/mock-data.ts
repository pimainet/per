export const ONBOARDING_QUESTIONS = [
  {
    id: 1,
    text: 'Bạn muốn được nhớ đến như người giúp nhóm người nào thoát khỏi tình huống khó chịu hoặc bế tắc cụ thể nào?',
    hint: 'Hãy nói rõ đến mức người khác đọc cũng hình dung được họ đang ở trong hoàn cảnh đó.',
    followUp:
      'Bạn có thể kể một tình huống cụ thể họ từng gặp không? Họ đang nghĩ gì hoặc đang bị kẹt ở quyết định nào lúc đó?',
  },
  {
    id: 2,
    text: 'Khi bạn làm việc với họ thành công, điều gì thay đổi rõ nhất trong cách họ nghĩ, quyết định, hoặc hành động?',
    hint: 'Không nói “hiệu quả hơn” chung chung. Hãy nói sự thay đổi cụ thể bạn từng chứng kiến.',
    followUp:
      'Bạn nhớ một người từng thay đổi rõ rệt sau khi làm việc với bạn không? Họ bắt đầu làm khác đi điều gì cụ thể?',
  },
  {
    id: 3,
    text: 'Hầu hết người trong lĩnh vực của bạn đang chọn cách làm hoặc cách nói như thế nào? Còn bạn cố tình không làm theo họ ở điểm nào? Vì sao bạn cho rằng cách của mình đúng hơn?',
    hint: '',
    followUp:
      'Nếu phải chỉ ra một điểm bạn cố tình làm khác với đa số, đó là điểm nào? Bạn chọn cách đó vì lý do gì?',
  },
  {
    id: 4,
    text: 'Kể một khoảnh khắc, quyết định, hoặc sai lầm trong quá khứ từng thay đổi cách bạn nhìn nhận công việc hiện tại.',
    hint: 'Chỉ cần một câu chuyện ngắn, không cần hoàn hảo.',
    followUp:
      'Lúc xảy ra khoảnh khắc đó, điều gì khiến bạn khó chịu hoặc trăn trở nhất? Nó ảnh hưởng đến cách bạn làm việc bây giờ ra sao?',
  },
  {
    id: 5,
    text: 'Có điều gì bạn tin là đúng, nhưng nhiều người trong ngành vẫn chưa chấp nhận hoặc còn e ngại? Bạn có sẵn sàng nói điều đó công khai không? Vì sao?',
    hint: '',
    followUp:
      'Điều bạn tin đó hiện vẫn còn bị nhiều người e ngại ở điểm nào? Bạn đã từng phải giải thích hoặc bảo vệ quan điểm này chưa?',
  },
  {
    id: 6,
    text: 'Khi bạn viết hoặc nói về công việc, bạn tự nhiên nghiêng về phong cách nào hơn: Nói thẳng và có phần sắc / Phân tích sâu và logic / Kể chuyện và gần gũi / Hay kết hợp? Hãy chọn và giải thích ngắn vì sao phong cách đó hợp với bạn.',
    hint: '',
    followUp:
      'Khi bạn viết hoặc nói ở trạng thái thoải mái nhất, bạn thường ưu tiên điều gì hơn: sự rõ ràng, chiều sâu, sự gần gũi, hay sự thẳng thắn?',
  },
  {
    id: 7,
    text: 'Hiện tại, điều gì đang khiến bạn chưa duy trì được việc xây dựng thương hiệu cá nhân một cách đều đặn?',
    hint: 'Nói thật. Bot cần biết đúng điểm nghẽn để hỗ trợ, không phải để phán xét.',
    followUp:
      'Trong những lý do bạn vừa nêu, đâu là lý do khiến bạn dừng lại nhiều nhất? Nó thường xuất hiện vào lúc nào?',
  },
  {
    id: 8,
    text: 'Nếu 12 tháng tới thương hiệu cá nhân của bạn vận hành tốt, dấu hiệu nào khiến bạn biết là “đáng”?',
    hint: 'Ví dụ cụ thể: có người chủ động tìm đến, được mời nói chuyện, chốt được việc quan trọng…',
    followUp:
      'Dấu hiệu đó cụ thể sẽ trông như thế nào? Có một tình huống hoặc kết quả nào bạn xem là “được” không?',
  },
] as const

export const SAMPLE_BRAND_PROFILE = {
  dinhVi: {
    doiTuong: 'Chưa xác định — cần hoàn thành onboarding và tạo hồ sơ bằng AI',
    tinhHuong: 'Chưa có dữ liệu',
    ketQua: 'Chưa có dữ liệu',
    cauDinhVi: 'Hồ sơ chưa được tạo. Hãy bấm “Tạo lại bằng AI” hoặc làm lại onboarding.',
  },
  khacBiet: {
    phoBien: 'Chưa có dữ liệu',
    diemKhac: 'Chưa có dữ liệu',
    lyDo: 'Chưa có dữ liệu',
  },
  cauChuyen: 'Chưa có dữ liệu từ câu trả lời của bạn.',
  niemTin: 'Chưa có dữ liệu',
  giongDieu: {
    phongCach: 'Chưa xác định',
    uuTien: 'Chưa xác định',
    xungHo: 'Tôi / bạn',
    tranh: 'Nội dung generic',
  },
  diemNghen: 'Chưa có dữ liệu',
  mucTieu12Thang: 'Chưa có dữ liệu',
  dinhHuong: ['Chưa có định hướng — cần tạo hồ sơ bằng AI'],
}

export const SAMPLE_ROADMAP = {
  tenGiaiDoan: 'Giai đoạn khởi động nhận diện',
  mucTieu: 'Người đọc bắt đầu nhớ bạn vì một góc nhìn rõ ràng, nhất quán',
  thoiGian: '30–45 ngày',
  truCot: [
    { ten: 'Góc nhìn chuyên môn riêng', lyDo: 'Bám định vị trong Brand Profile' },
    { ten: 'Câu chuyện / bài học cá nhân', lyDo: 'Tăng độ tin, giảm generic' },
  ],
  nhip: '3 bài/tuần',
  tyLe: '2 quan điểm – 1 câu chuyện',
  tuanMau: [
    { ngay: 'Thứ 2', loai: 'Quan điểm', truCot: 'Góc nhìn chuyên môn', goiY: 'Một quan điểm bạn sẵn sàng bảo vệ công khai' },
    { ngay: 'Thứ 4', loai: 'Câu chuyện', truCot: 'Bài học cá nhân', goiY: 'Một khoảnh khắc đổi cách bạn làm việc' },
    { ngay: 'Thứ 6', loai: 'Quan điểm', truCot: 'Góc nhìn chuyên môn', goiY: 'Phản biện một cách làm phổ biến trong ngành' },
  ],
  ruiRo: 'Viết generic hoặc lệch giọng. Giữ bám Brand Profile mỗi bài.',
}

export type Draft = {
  id: string
  platform: 'LinkedIn' | 'Facebook'
  pillar: string
  time: string
  content: string
  note: string
  status: 'pending' | 'approved'
}

export const SAMPLE_DRAFTS: Draft[] = [
  {
    id: '1',
    platform: 'LinkedIn',
    pillar: 'Góc nhìn chuyên môn',
    time: 'Mới tạo',
    content: `Đây là bài nháp mẫu — sẽ được thay bằng bài viết theo Brand Profile của bạn khi AI soạn xong.

Hãy xác nhận lộ trình, rồi dùng “Tạo bài bằng AI” (sắp có) hoặc đợi hệ thống soạn theo đúng định vị của bạn.`,
    note: 'Placeholder trung tính — không phải nội dung của user khác.',
    status: 'pending',
  },
]
