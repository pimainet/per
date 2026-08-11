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
    doiTuong: 'Founder / chủ doanh nghiệp nhỏ đang muốn dùng AI nhưng bị quá tải và thiếu hệ thống',
    tinhHuong: 'Biết AI quan trọng nhưng không biết bắt đầu từ đâu, sợ làm sai hoặc tốn thời gian',
    ketQua: 'Có cách tiếp cận AI thực tế, tiết kiệm thời gian và tăng năng lực vận hành',
    cauDinhVi:
      'Tôi giúp founder và chủ doanh nghiệp nhỏ thoát khỏi sự lúng túng khi ứng dụng AI, để họ vận hành gọn hơn và tập trung vào việc quan trọng.',
  },
  khacBiet: {
    phoBien: 'Nói về AI theo hướng công cụ, tính năng, hoặc hứa hẹn chung chung',
    diemKhac: 'Đi từ bài toán thật của doanh nghiệp → chọn đúng chỗ dùng AI → duy trì được',
    lyDo: 'AI chỉ có giá trị khi gắn vào việc đang bị tắc, không phải khi chỉ “biết dùng tool”',
  },
  cauChuyen:
    'Từng tự làm nhiều việc bằng AI cho doanh nghiệp mình, nhận ra vấn đề không phải thiếu tool mà thiếu cách chọn việc và duy trì.',
  niemTin:
    'AI không thay người — AI thay phần việc lặp lại để người làm việc có chiều sâu hơn. Sẵn sàng nói công khai.',
  giongDieu: {
    phongCach: 'Thẳng + có chiều sâu, gần gũi nhưng không sến',
    uuTien: 'Rõ ràng → Thẳng thắn → Chiều sâu → Gần gũi',
    xungHo: 'Tôi / bạn, khoảng cách vừa phải',
    tranh: 'Sáo rỗng, hứa suông, giọng “guru”',
  },
  diemNghen: 'Biết cần đăng đều nhưng hay trì hoãn vì chưa rõ hôm nay viết gì và sợ sai giọng',
  mucTieu12Thang:
    'Có người chủ động tìm đến vì nội dung; được nhận diện là người thực chiến về AI cho doanh nghiệp',
  dinhHuong: [
    'Chia sẻ góc nhìn thực tế khi ứng dụng AI vào vận hành',
    'Kể câu chuyện / bài học từ việc tự làm',
    'Phản biện các cách dùng AI chung chung, thiếu hệ thống',
  ],
}

export const SAMPLE_ROADMAP = {
  tenGiaiDoan: 'Gieo nhận diện chuyên gia thực chiến',
  mucTieu: 'Người đọc nhớ bạn là người nói về AI từ việc thật, không phải từ lý thuyết',
  thoiGian: '45 ngày',
  truCot: [
    { ten: 'Góc nhìn thực chiến về AI cho doanh nghiệp', lyDo: 'Bám định vị và điểm khác biệt' },
    { ten: 'Câu chuyện / bài học cá nhân', lyDo: 'Tăng độ tin và gần gũi, giảm khô' },
  ],
  nhip: '3 bài/tuần',
  tyLe: '2 quan điểm – 1 câu chuyện',
  tuanMau: [
    { ngay: 'Thứ 2', loai: 'Quan điểm', truCot: 'Góc nhìn thực chiến', goiY: 'Một sai lầm phổ biến khi đưa AI vào doanh nghiệp' },
    { ngay: 'Thứ 4', loai: 'Câu chuyện', truCot: 'Bài học cá nhân', goiY: 'Khoảnh khắc khiến bạn đổi cách nhìn về AI' },
    { ngay: 'Thứ 6', loai: 'Quan điểm', truCot: 'Góc nhìn thực chiến', goiY: 'Việc gì nên để AI làm, việc gì không' },
  ],
  ruiRo: 'Quá nghiêng về kiến thức → thiếu cảm xúc. Giảm bằng cách giữ đúng 1 bài chuyện/tuần.',
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
    pillar: 'Góc nhìn thực chiến',
    time: 'Hôm nay, 08:30',
    content: `Một điều tôi nhận ra sau nhiều năm làm việc với các founder: vấn đề hiếm khi nằm ở việc họ thiếu ý tưởng.

Vấn đề thường là họ chưa có một cách rõ ràng để biến trải nghiệm thành câu chuyện mà người khác có thể nhớ và tin cậy.

Thương hiệu cá nhân không được xây bằng vài bài viết hay. Nó được xây bằng sự nhất quán — trong cách bạn nhìn vấn đề, kể lại điều mình đã học, và giúp người khác tiến lên một bước nhỏ.

Đó cũng là lý do tôi luôn bắt đầu từ câu hỏi: “Bạn muốn được nhớ đến vì điều gì?”`,
    note: 'Bài mở đầu chuỗi về xây dựng thương hiệu từ trải nghiệm thật. Góc gần gũi, có chiều sâu.',
    status: 'pending',
  },
  {
    id: '2',
    platform: 'LinkedIn',
    pillar: 'Bài học cá nhân',
    time: 'Hôm qua, 09:15',
    content: `Có một giai đoạn tôi nghĩ cứ có thêm tool AI là việc sẽ nhẹ hơn.

Thực tế ngược lại: càng nhiều tool, càng dễ loạn nếu chưa biết việc nào đáng giao cho AI.

Từ đó tôi đổi cách làm. Không hỏi “AI làm được gì?”, mà hỏi “Việc nào đang ăn thời gian và lặp lại nhiều nhất?”.

Chỉ một câu hỏi đó đã giúp tôi cắt được khá nhiều việc không cần ôm.`,
    note: 'Bài kể chuyện, củng cố trụ cột bài học cá nhân trong tuần mẫu.',
    status: 'pending',
  },
  {
    id: '3',
    platform: 'Facebook',
    pillar: 'Góc nhìn thực chiến',
    time: '2 ngày trước',
    content: `AI không phải chỗ để “thử cho vui” rồi bỏ.

Nếu bạn đưa AI vào một việc đang tắc thật — báo cáo tuần, trả lời khách, soạn nội dung đều — bạn sẽ thấy giá trị rất nhanh.

Còn nếu chỉ chơi với prompt cho vui, sau 2 tuần mọi thứ quay về như cũ.`,
    note: 'Bài quan điểm ngắn, phù hợp Facebook, nhấn mạnh tính thực dụng.',
    status: 'pending',
  },
]
