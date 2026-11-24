(function () {
  const BASE_SCORE = 22;
  const GROUP_CAPS = { 1: 26, 2: 24, 3: 20, 4: 18, 5: 28 };
  const TRANSITION_PHRASES = [
    "bên cạnh đó", "hơn thế nữa", "ngoài ra", "thêm vào đó", "song song với đó",
    "đồng thời", "qua đó", "từ đó", "hơn nữa", "tuy nhiên", "mặt khác"
  ];
  const CONNECTOR_ENDINGS = ["nhìn chung", "tóm lại", "qua đó", "từ đó", "kết lại", "in conclusion", "in summary", "to sum up"];
  const HEDGE_PHRASES = [
    "ở một khía cạnh nào đó", "phần nào đó", "tương đối", "nhìn từ góc độ",
    "có thể nói", "có lẽ", "dường như", "to some extent", "relatively", "from one perspective"
  ];
  const ABSTRACT_NOUNS = [
    "giải pháp", "xu hướng", "chiến lược", "hệ thống", "yếu tố", "thách thức",
    "quá trình", "mô hình", "năng lực", "hiệu quả", "phát triển", "tác động",
    "solution", "trend", "strategy", "system", "factor", "challenge", "process", "model", "capability", "efficiency", "development", "impact"
  ];
  const RESEARCH_VERBS = [
    "khảo sát", "đo lường", "so sánh", "thử nghiệm", "tính toán", "phỏng vấn",
    "quan sát", "thu thập", "kiểm chứng", "phân tích dữ liệu", "đối chiếu",
    "thử bán", "bán thử", "ghi lại", "survey", "measure", "compare", "test",
    "calculate", "interview", "observe", "collect", "verify", "analyze data", "we tested", "we tracked"
  ];
  const STANCE_MARKERS = [
    "theo em", "theo tôi", "tôi cho rằng", "em cho rằng", "đáng chú ý",
    "điều bất ngờ", "tôi nhận thấy", "em nhận thấy", "nhóm nhận thấy", "nhóm em",
    "em không ngờ", "ưu tiên", "cần cân nhắc", "in my view", "I think", "I noticed",
    "surprisingly", "we observed", "I would prioritize"
  ];
  const EVIDENCE_MARKERS = [
    "theo", "dựa trên", "qua khảo sát", "theo báo cáo", "nghiên cứu cho thấy",
    "số liệu", "nguồn:", "trích dẫn", "tác giả", "according to", "based on", "the report", "the study"
  ];
  const EXAMPLE_MARKERS = [
    "ví dụ", "chẳng hạn", "cụ thể là", "trường hợp", "minh họa", "một lần",
    "for example", "for instance", "in the case of"
  ];
  const MACRO_TERMS = [
    "toàn diện", "bền vững", "chiến lược", "cốt lõi", "sâu rộng", "vĩ mô"
  ];
  const FORMULAIC_ADJECTIVES = [
    "hiệu quả", "thiết thực", "phù hợp", "quan trọng", "toàn diện",
    "bền vững", "đáng kể", "linh hoạt", "effective", "practical", "appropriate", "important", "comprehensive", "sustainable"
  ];
  const FUNCTION_WORDS = new Set([
    "và", "của", "là", "có", "cho", "với", "trong", "được", "các", "những",
    "một", "này", "đó", "để", "khi", "thì", "mà", "cũng", "như", "từ", "theo",
    "về", "đến", "tại", "vì", "nên", "nếu", "vào", "ở", "bởi", "do", "tuy",
    "however", "and", "the", "of", "to", "in", "with", "for", "that", "this"
  ]);
  const FIELD_TERMS = {
    business: ["doanh thu", "chi phí", "dòng tiền", "thị phần", "ROI", "biên lợi nhuận", "định vị", "revenue", "cost", "cash flow", "market share", "gross margin", "positioning"],
    humanities: ["luận điểm", "diễn ngôn", "ẩn dụ", "tư liệu", "bối cảnh lịch sử", "phương pháp định tính", "thesis", "discourse", "metaphor", "source material", "historical context", "qualitative method"],
    technology: ["thuật toán", "API", "cơ sở dữ liệu", "độ phức tạp", "kiến trúc", "mô hình hồi quy", "giao thức", "algorithm", "database", "complexity", "architecture", "regression model", "protocol"]
  };
  const DISCLAIMER = "Đây là heuristic demo, không phải xác suất sử dụng AI hay kết luận về tác giả. Các dấu hiệu này có thể xuất hiện trong bài do con người viết; không dùng kết quả làm bằng chứng hoặc căn cứ kỷ luật.";

  function phraseCount(text, phrases) {
    let total = 0;
    for (const phrase of phrases) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      total += [...text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu"))].length;
    }
    return total;
  }

  function hasAny(text, phrases) {
    return phraseCount(text, phrases) > 0;
  }

  function getWords(text) {
    return text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  }

  function splitSentences(text) {
    return text.trim().split(/(?<=[.!?。！？])\s+/u).filter(Boolean);
  }

  function average(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function standardDeviation(values) {
    const mean = average(values);
    return mean ? Math.sqrt(average(values.map((value) => (value - mean) ** 2))) : 0;
  }

  function contentWords(text) {
    return getWords(text).filter((word) => word.length > 2 && !FUNCTION_WORDS.has(word));
  }

  function overlapRatio(first, second) {
    const a = new Set(contentWords(first));
    const b = new Set(contentWords(second));
    if (!a.size || !b.size) return 0;
    const common = [...a].filter((word) => b.has(word)).length;
    return common / new Set([...a, ...b]).size;
  }

  function startsWithAny(text, phrases) {
    const normalized = text.trim().toLocaleLowerCase();
    return phrases.some((phrase) => normalized.startsWith(phrase));
  }

  function repeatedNgram(text) {
    const words = getWords(text);
    if (words.length >= 80) return false;
    const counts = new Map();
    for (const size of [2, 3]) {
      for (let index = 0; index <= words.length - size; index += 1) {
        const phrase = words.slice(index, index + size);
        if (phrase.every((word) => FUNCTION_WORDS.has(word))) continue;
        const key = phrase.join(" ");
        counts.set(key, (counts.get(key) || 0) + 1);
        if (counts.get(key) >= 3) return true;
      }
    }
    return false;
  }

  function analyzeParagraph(text, index, context, globalSignals) {
    const lower = text.toLocaleLowerCase();
    const words = getWords(text);
    const sentences = splitSentences(text);
    const sentenceLengths = sentences.map((sentence) => getWords(sentence).length);
    const firstSentence = sentences[0] || "";
    const lastSentence = sentences[sentences.length - 1] || "";
    const acceptsEnglish = context.language === "en" || context.language === "other";
    const hits = [];
    const add = (id, group, weight, reason, active) => {
      if (active) hits.push({ id, group, weight, reason });
    };

    const macroOpeners = ["trong bối cảnh hiện nay", "trong thời đại số", "trong kỷ nguyên", "ngày nay, khi", "in today's world", "in the modern era", "in an increasingly digital world", "nowadays, when"];
    add("R01", 1, 8, "Mở đầu bằng cụm từ bối cảnh mang tính khuôn mẫu chung.", startsWithAny(firstSentence, macroOpeners));

    add("R02", 1, 9, "Mật độ từ nối chuyển ý bổ sung cao trong cùng đoạn.", phraseCount(lower, TRANSITION_PHRASES) >= 2);

    add("R03", 1, 6, "Sử dụng cụm từ dẫn dắt mang tính khẳng định chung chung.", hasAny(lower, [
      "có thể thấy rằng", "không thể phủ nhận rằng", "rõ ràng là", "điều này cho thấy",
      "it is important to note that", "it is clear that", "it is undeniable that"
    ]));

    add("R04", 1, 7, "Câu kết đoạn theo mẫu tổng kết khái quát quen thuộc.", startsWithAny(lastSentence, CONNECTOR_ENDINGS));

    add("R05", 1, 7, "Lạm dụng cấu trúc câu song song đối xứng.", /(?:không chỉ|không những)[\s\S]{1,140}mà còn|vừa[\s\S]{1,100}vừa|not only[\s\S]{1,140}but also|both[\s\S]{1,100}and/iu.test(text));

    add("R06", 1, 6, "Triển khai lập luận hai chiều theo mẫu đối xứng đều.", /một mặt[\s\S]{1,140}mặt khác|tuy nhiên,?\s+ở chiều ngược lại|dù[\s\S]{1,100}nhưng|on the one hand[\s\S]{1,140}on the other hand/iu.test(text));

    add("R07", 1, 8, "Dùng cụm từ đánh giá vai trò mang tính công thức.", hasAny(lower, [
      "mang lại nhiều lợi ích thiết thực", "đóng vai trò then chốt", "góp phần quan trọng"
    ]));

    add("R08", 1, 6, "Diễn đạt theo lối khẩu hiệu khái quát, thiếu hành động cụ thể.", hasAny(lower, [
      "tạo nền tảng vững chắc", "tạo động lực thúc đẩy", "mở ra cơ hội mới", "lays a strong foundation", "drives growth"
    ]));

    add("R09", 1, 7, "Lặp các động từ khái quát hóa hiệu quả.", phraseCount(lower, [
      "tối ưu hóa", "nâng cao hiệu quả", "nâng cao chất lượng", "cải thiện đáng kể", "optimize", "enhance efficiency", "improve effectiveness"
    ]) >= 2);

    add("R10", 1, 5, "Dùng nhiều cụm từ rào đón trung tính, thiếu lập trường rõ.", phraseCount(lower, HEDGE_PHRASES) >= 2);

    const listMarkers = [...lower.matchAll(/(?:thứ\s+(?:nhất|hai|ba|tư)|một\s+là|hai\s+là|ba\s+là|first(?:ly)?|second(?:ly)?|third(?:ly)?)/gu)];
    add("R11", 1, 8, "Liệt kê theo thứ tự cứng nhắc nhưng chưa đào sâu từng ý.", listMarkers.length >= 2);

    add("R12", 1, 8, "Sử dụng các cụm từ chuyển ý điển hình của văn bản AI tiếng Anh.", acceptsEnglish && hasAny(lower, [
      "furthermore", "moreover", "additionally", "in addition", "however", "in conclusion",
      "it is worth noting that", "plays a crucial role"
    ]));

    add("R13", 2, 10, "Độ dài các câu trong đoạn quá đồng đều, thiếu nhịp biến thiên.", sentenceLengths.length >= 3 && standardDeviation(sentenceLengths) < 3.5);

    const lengthRange = sentenceLengths.length ? Math.max(...sentenceLengths) - Math.min(...sentenceLengths) : Infinity;
    add("R14", 2, 8, "Các câu có kích thước gần bằng nhau một cách bất thường.", sentenceLengths.length >= 4 && lengthRange <= 6);

    add("R15", 2, 6, "Thiếu câu ngắn dứt khoát đan xen giữa các câu giải thích dài.", words.length > 90 && sentenceLengths.every((length) => length >= 10));

    const nominalOpenings = sentences.map((sentence) => /^(?:việc|quá trình|sự|tính)\b/iu.test(sentence.trim()));
    const repeatedNominalOpening = nominalOpenings.some((active, position) => active && nominalOpenings[position + 1]);
    add("R16", 2, 8, "Lặp khuôn mẫu danh từ hóa ở đầu các câu liên tiếp.", repeatedNominalOpening);

    add("R17", 2, 7, "Nối câu bằng đại từ chỉ định khái quát lặp lại.", phraseCount(lower, [
      "điều này giúp", "điều này tạo", "điều này đòi hỏi", "điều đó giúp", "điều đó cho phép", "this helps", "this creates", "this requires"
    ]) > 0);

    add("R18", 2, 7, "Chuỗi câu đi theo một mẫu nguyên nhân – kết quả đơn điệu.", phraseCount(lower, [
      "giúp", "tạo điều kiện", "dẫn đến", "enables", "leads to"
    ]) >= 2);

    const commasPerSentence = sentences.map((sentence) => (sentence.match(/,/gu) || []).length);
    add("R19", 2, 6, "Nhịp ngắt phẩy giữa các câu lặp lại đều đặn.", sentences.length >= 3 && commasPerSentence.every((count) => count >= 2 && count <= 3));

    add("R20", 2, 7, "Bố cục 4 câu khép kín theo khuôn sinh đoạn.", sentences.length === 4 && overlapRatio(firstSentence, lastSentence) > 0.5);

    add("R21", 2, 7, "Các đoạn văn trong bài có dung lượng gần như bằng nhau.", globalSignals.uniformParagraphLengths);

    const subjectOpenings = sentences.filter((sentence) =>
      /^(?:việc|quá trình|sự|tính|người|sinh viên|công nghệ|the|this|these|students|technology|it|they|we)\b/iu.test(sentence.trim())
    ).length;
    const inversionMarkers = ["đặc biệt", "chỉ khi", "mãi đến", "trên hết", "chính vì", "only when", "not until"];
    add("R22", 2, 5, "Cấu trúc ngữ pháp phẳng, thiếu sắc thái nhấn mạnh tự nhiên.", sentences.length >= 3 && subjectOpenings === sentences.length && !hasAny(lower, inversionMarkers));

    const staticVerbs = phraseCount(lower, ["là", "trở thành", "đóng vai trò", "is", "becomes", "serves as"]);
    add("R23", 2, 6, "Đoạn văn thiên về định nghĩa tĩnh thay vì mô tả hành động cụ thể.", staticVerbs >= 2 && staticVerbs / Math.max(1, words.length) > 0.04);

    const bulletLines = text.split(/\r?\n/u).filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+/u.test(line));
    const bulletLengths = bulletLines.map((line) => getWords(line).length);
    const bulletMean = average(bulletLengths);
    add("R24", 2, 9, "Các gạch đầu dòng có cấu trúc và độ dài đồng nhất cao.", bulletLengths.length >= 2 && bulletMean > 0 && standardDeviation(bulletLengths) / bulletMean < 0.15);

    const abstractCount = phraseCount(lower, ABSTRACT_NOUNS);
    add("R25", 3, 8, "Mật độ danh từ khái quát cao nhưng thiếu đối tượng cụ thể.", words.length >= 20 && abstractCount / words.length > 0.12);

    add("R26", 3, 6, "Lặp lại cụm từ chủ đề nhiều lần thay vì diễn đạt linh hoạt.", repeatedNgram(text));

    add("R27", 3, 6, "Sử dụng cặp khái niệm đối lập mang tính công thức.", hasAny(lower, [
      "cơ hội và thách thức", "thách thức và cơ hội", "thuận lợi và khó khăn", "tích cực và tiêu cực",
      "opportunities and challenges", "challenges and opportunities"
    ]));

    add("R28", 3, 6, "Dùng từ ngữ vĩ mô cho nội dung phân tích ở mức cơ bản.", words.length < 120 && phraseCount(lower, [...MACRO_TERMS, "comprehensive", "sustainable", "strategic", "core", "far-reaching"]) >= 2);

    const requiredTerms = FIELD_TERMS[context.field];
    add("R29", 3, 7, "Nội dung dừng ở mức phổ thông, thiếu thuật ngữ chuyên biệt của ngành đã chọn.", words.length >= 35 && requiredTerms && !hasAny(lower, requiredTerms));

    add("R30", 3, 5, "Giọng văn trung tính đều đặn, thiếu dấu ấn lập luận người viết.", words.length >= 50 && !hasAny(lower, STANCE_MARKERS));

    add("R31", 3, 6, "Các danh từ thường xuyên gắn với tính từ bổ nghĩa khuôn mẫu.", phraseCount(lower, FORMULAIC_ADJECTIVES) >= 2);

    const repetitiveAdjacentSentences = sentences.slice(1).some((sentence, position) =>
      overlapRatio(sentences[position], sentence) > 0.55
    );
    add("R32", 3, 8, "Hai câu liền kề diễn đạt cùng một ý bằng từ ngữ khác nhau.", repetitiveAdjacentSentences);

    const functionRatio = words.filter((word) => FUNCTION_WORDS.has(word)).length / Math.max(1, words.length);
    add("R33", 3, 5, "Tỷ lệ từ dẫn dắt và hư từ cao so với từ mang nội dung.", words.length >= 25 && functionRatio > 0.4);

    add("R34", 3, 6, "Thiếu động từ thể hiện thao tác phân tích hoặc kiểm chứng thực tế.", words.length >= 40 && !hasAny(lower, RESEARCH_VERBS));

    add("R35", 4, 7, "Câu kết đoạn lặp lại ý câu mở đoạn theo lối viết khép kín.", overlapRatio(firstSentence, lastSentence) > 0.5);

    const strongClaims = hasAny(lower, ["chắc chắn", "luôn luôn", "không thể phủ nhận", "rõ ràng là", "tất yếu", "certainly", "always", "undeniably", "clearly"]);
    add("R36", 4, 7, "Nhận định mang tính khẳng định nhưng thiếu căn cứ đi kèm.", strongClaims && !hasAny(lower, EVIDENCE_MARKERS));

    const punctuationOnly = /^[^:;?()—–]+$/u.test(text) && (text.match(/[.!?,]/gu) || []).every((mark) => mark === "." || mark === "," );
    add("R37", 4, 5, "Hệ thống dấu câu đơn điệu, thiếu nhịp ngắt giải thích.", words.length > 80 && punctuationOnly && !/[?!:;()—–]/u.test(text));

    const colonDefinitions = sentences.filter((sentence) => /^[^:]{2,50}:\s+\S+/u.test(sentence)).length;
    add("R38", 4, 6, "Trình bày theo kiểu liệt kê định nghĩa từ điển.", colonDefinitions >= 2);

    add("R39", 4, 7, "Nêu nhiều luận điểm khái quát nhưng thiếu ví dụ minh họa.", phraseCount(lower, [
      "thứ nhất", "thứ hai", "thứ ba", "bên cạnh đó", "ngoài ra", "đồng thời", "firstly", "secondly", "additionally"
    ]) >= 2 && !hasAny(lower, EXAMPLE_MARKERS));

    const longWords = words.filter((word) => word.length >= 7).length;
    add("R40", 4, 5, "Mật độ từ ghép trang trọng dày đặc và đồng đều.", words.length >= 30 && longWords / words.length > 0.35);

    add("R41", 4, 6, "Kết thúc đoạn theo hướng trung hòa hai chiều quen thuộc.", hasAny(lower, ["nhược điểm", "hạn chế", "khó khăn", "drawback", "limitation"]) && /(?:tuy nhiên|dù vậy|mặt khác|however|nevertheless)[^.!?]{0,100}(?:cơ hội|lợi ích|tích cực|tiềm năng|opportunity|benefit|positive|potential)/iu.test(lastSentence));

    add("R42", 4, 7, "Cách mở đầu giữa các đoạn lặp lại theo cùng một khuôn.", globalSignals.repeatedParagraphTransitions);

    const quantitativeSignal =
      /(?:\b\d+(?:[.,]\d+)?\s*(?:%|phần trăm|người|đồng|USD|VNĐ|ngày|tháng|năm|giờ|km|kg|m²|cm|mm|m|people|dollars?|days?|months?|years?|hours?)\b|\b(?:19|20)\d{2}\b)/iu.test(text) &&
      !/^\s*(?:thứ\s+(?:nhất|hai|ba|tư|\w+)|\d+[.)])(?:\s|$)/iu.test(text);
    add("R43", 5, 10, "Có dữ liệu định lượng hoặc mốc thời gian cụ thể neo vào lập luận.", quantitativeSignal);

    const namedEvidence =
      /(?:theo\s+(?:báo cáo|nghiên cứu|tác giả|mô hình|luật|nghị định|tổ chức)\b|(?:luật|nghị định|nghị quyết)\s+(?:số\s+)?[\p{N}\p{L}]+|(?:tác giả|nguồn|tài liệu tham khảo|tham khảo)\s*[:(]|\b(?:WHO|UNESCO|World Bank|OECD|CIA|FPT|VNG|NASA|Google|Microsoft)\b|[A-ZÀ-Ỹ][\p{L}\p{N}-]*(?:\s+[A-ZÀ-Ỹ][\p{L}\p{N}-]*){1,3}\s*\(\d{4}\))/iu.test(text);
    add("R44", 5, 9, "Có tên thực thể, tài liệu hoặc nguồn tham khảo cụ thể.", namedEvidence);

    add("R45", 5, 8, "Có ví dụ tình huống cụ thể giúp làm rõ luận điểm.", hasAny(lower, [
      "ví dụ như", "chẳng hạn tại", "trong trường hợp", "trường hợp cụ thể", "một lần",
      "tuần trước", "hôm qua", "cuối buổi", "for example", "for instance"
    ]));

    const hasShortAndLongSentence = sentenceLengths.some((length) => length < 9) && sentenceLengths.some((length) => length > 22);
    add("R46", 5, 8, "Nhịp điệu câu có độ biến thiên tự nhiên rõ rệt.", sentenceLengths.length >= 3 && hasShortAndLongSentence && standardDeviation(sentenceLengths) > 7.5);

    add("R47", 5, 6, "Câu hỏi đặt vấn đề tạo tương tác tư duy.", /\?/u.test(text));

    add("R48", 5, 5, "Có phần chú thích hoặc mở rộng ý xen kẽ tự nhiên trong câu.", /\([^)]{2,}\)|[—–]/u.test(text));

    add("R49", 5, 9, "Có dấu hiệu gắn với quá trình quan sát hoặc thực nghiệm riêng.", hasAny(lower, [
      "khi khảo sát", "qua thực tế thử nghiệm", "nhóm nhận thấy", "em nhận thấy",
      "trong lần thử", "khi chúng tôi", "tôi đã thử", "từ trải nghiệm", "we observed", "in my experience"
    ]));

    const quotedText = /["“][^"”]{2,}["”]/u.test(text);
    add("R50", 5, 6, "Có trích dẫn trực tiếp kèm giải thích hoặc phân tích.", quotedText && hasAny(lower, [
      "cho thấy", "nghĩa là", "theo đó", "điều này", "ý là"
    ]));

    const positiveHits = hits.filter((hit) => hit.group !== 5);
    const naturalHits = hits.filter((hit) => hit.group === 5);
    const positivePoints = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const hit of positiveHits) positivePoints[hit.group] += hit.weight;
    const cappedPositive = Object.entries(positivePoints).reduce(
      (sum, [group, points]) => sum + Math.min(GROUP_CAPS[group], points),
      0
    );
    const naturalDeduction = Math.min(GROUP_CAPS[5], naturalHits.reduce((sum, hit) => sum + hit.weight, 0));
    const score = Math.max(0, Math.min(100, BASE_SCORE + cappedPositive - naturalDeduction));
    const topReasons = positiveHits
      .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
      .slice(0, 3)
      .map((hit) => `${hit.id}: ${hit.reason}`);
    if (!topReasons.length) {
      topReasons.push("Không kích hoạt luật cộng điểm rõ rệt; điều này không xác nhận nguồn gốc bài viết.");
    }
    if (naturalHits.length) {
      topReasons.push(`Có ${naturalHits.length} tín hiệu tự nhiên (${naturalHits.map((hit) => hit.id).join(", ")}), đã giảm ${naturalDeduction} điểm.`);
    }

    return {
      index,
      text,
      suspicion_score: score,
      label: score < 40 ? "Ít dấu hiệu" : score < 65 ? "Cần lưu ý" : "Nhiều dấu hiệu",
      reasons: topReasons,
      activated_rules: hits.map((hit) => hit.id)
    };
  }

  function analyzeText(text, language, field) {
    const paragraphs = text.trim().split(/\n\s*\n/u).map((part) => part.trim()).filter(Boolean);
    const paragraphLengths = paragraphs.map((paragraph) => getWords(paragraph).length);
    const uniformParagraphLengths = paragraphLengths.length >= 2 &&
      paragraphLengths.slice(1).every((length, index) =>
        Math.abs(length - paragraphLengths[index]) / Math.max(1, paragraphLengths[index]) < 0.15
      );
    const paragraphTransitions = paragraphs.map((paragraph) => {
      const firstSentence = splitSentences(paragraph)[0] || "";
      const candidates = [
        "thứ nhất", "thứ hai", "thứ ba", "cuối cùng", "một là", "hai là", "ba là",
        "bên cạnh đó", "ngoài ra", "đồng thời", "hơn nữa", "trong bối cảnh hiện nay",
        "firstly", "secondly", "thirdly", "finally", "moreover", "furthermore", "in conclusion"
      ];
      return candidates.find((candidate) => startsWithAny(firstSentence, [candidate])) || "";
    }).filter(Boolean);
    const repeatedParagraphTransitions = paragraphTransitions.length >= 2 &&
      paragraphTransitions.length === paragraphs.length &&
      new Set(paragraphTransitions.map((transition) =>
        /^(?:thứ|một là|hai là|ba là|cuối cùng|firstly|secondly|thirdly|finally)/u.test(transition) ? "ordered-list" : "connector"
      )).size === 1;
    const globalSignals = { uniformParagraphLengths, repeatedParagraphTransitions };
    const context = { language, field };
    const results = paragraphs.map((paragraph, index) =>
      analyzeParagraph(paragraph, index + 1, context, globalSignals)
    );
    const overallScore = results.length
      ? Math.round(results.reduce((sum, item) => sum + item.suspicion_score, 0) / results.length)
      : 0;
    const overallLevel = overallScore < 40 ? "Ít dấu hiệu" : overallScore < 65 ? "Cần lưu ý" : "Nhiều dấu hiệu";
    const summary = overallScore < 40
      ? "Bộ luật demo tìm thấy ít tín hiệu cấu trúc/cụm từ trong bài. Điểm thấp không chứng minh bài do con người viết."
      : overallScore < 65
        ? "Một số đoạn có cụm từ hoặc nhịp câu trùng với bộ luật demo. Hãy xem tối đa ba lý do của từng đoạn; đây chỉ là phép rà soát tham khảo."
        : "Một số mẫu câu và cụm từ xuất hiện khá rõ theo bộ luật demo. Điểm này không xác định bài có dùng AI hay không.";
    return {
      overall_risk_level: overallLevel,
      overall_suspicion_score: overallScore,
      summary,
      paragraphs: results,
      disclaimer: DISCLAIMER
    };
  }

  globalThis.EssayLensRuleEngine = Object.freeze({ analyzeText });
})();
