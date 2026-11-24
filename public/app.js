const MAX_CHARACTERS = 10_000;
const MAX_PARAGRAPHS = 60;
const samples = {
  ai: [
    "Trong bối cảnh cuộc cách mạng công nghiệp lần thứ tư đang diễn ra mạnh mẽ, trí tuệ nhân tạo ngày càng được ứng dụng rộng rãi trong nhiều lĩnh vực của đời sống. Đặc biệt, giáo dục là một trong những lĩnh vực có nhiều tiềm năng thay đổi nhờ công nghệ này. Việc ứng dụng trí tuệ nhân tạo không chỉ góp phần nâng cao chất lượng dạy và học mà còn mở ra những cơ hội mới cho người học.",
    "Trước hết, trí tuệ nhân tạo có thể hỗ trợ cá nhân hóa quá trình học tập. Thông qua việc phân tích kết quả và tốc độ tiếp thu, các nền tảng học tập có thể đề xuất nội dung phù hợp với nhu cầu của từng học sinh. Nhờ đó, người học có thể tập trung cải thiện những kiến thức còn hạn chế, đồng thời phát huy điểm mạnh của bản thân. Đây là một lợi ích quan trọng trong bối cảnh mỗi học sinh có năng lực và phương pháp học tập khác nhau.",
    "Bên cạnh đó, công nghệ này còn giúp giáo viên tiết kiệm thời gian trong một số công việc thường xuyên, chẳng hạn như tổng hợp kết quả, xây dựng câu hỏi ôn tập và cung cấp phản hồi ban đầu. Khi những công việc này được hỗ trợ hiệu quả, giáo viên có thêm thời gian để trao đổi trực tiếp, khuyến khích tư duy phản biện và quan tâm đến sự tiến bộ của từng học sinh. Vì vậy, trí tuệ nhân tạo nên được xem là công cụ hỗ trợ chứ không phải phương tiện thay thế vai trò của người thầy.",
    "Tuy nhiên, việc ứng dụng trí tuệ nhân tạo trong giáo dục cũng đặt ra một số thách thức. Nếu phụ thuộc quá nhiều vào công cụ, học sinh có thể giảm khả năng tự tìm hiểu và giải quyết vấn đề. Ngoài ra, thông tin do hệ thống tạo ra đôi khi chưa chính xác hoặc chưa phù hợp với hoàn cảnh cụ thể. Những vấn đề liên quan đến quyền riêng tư và sự chênh lệch trong khả năng tiếp cận thiết bị cũng cần được quan tâm.",
    "Nhìn chung, trí tuệ nhân tạo mang lại nhiều lợi ích thiết thực cho giáo dục, từ cá nhân hóa việc học đến hỗ trợ công việc giảng dạy. Để khai thác hiệu quả những lợi ích đó, nhà trường cần hướng dẫn học sinh sử dụng công nghệ có trách nhiệm, đồng thời duy trì vai trò trung tâm của tư duy độc lập và sự tương tác giữa con người với con người. Khi được triển khai một cách phù hợp, trí tuệ nhân tạo có thể góp phần xây dựng môi trường học tập linh hoạt, công bằng và hiệu quả hơn."
  ].join("\n\n"),
  specific: [
    "Tuần trước, nhóm em thử bán bánh mì vào giờ tan học ở cổng ký túc xá. Đến gần 5 giờ, trời đổ mưa nên khách đứng nép dưới mái hiên; tụi em phải chuyển bàn vào trong và gói từng ổ bánh bằng túi giấy để khỏi ướt. Cuối buổi còn dư khá nhiều rau, thành ra hôm sau nhóm đổi sang chuẩn bị ít hơn.",
    "Điều em không ngờ là nhiều bạn hỏi có thể quét mã để trả tiền không. Ban đầu nhóm chỉ chuẩn bị tiền mặt, nên có vài người bỏ đi khi phải chờ tìm tiền lẻ. Từ trải nghiệm đó, nhóm thêm mã QR và ghi lại số lượng bán theo từng khung giờ, thay vì chỉ dựa vào cảm giác."
  ].join("\n\n"),
  structured: [
    "Thứ nhất, việc lập kế hoạch rõ ràng giúp tổ chức công việc hiệu quả. Bên cạnh đó, sự phối hợp giữa các thành viên góp phần nâng cao chất lượng thực hiện. Qua đó, nhóm có thể đạt được mục tiêu đã đề ra.",
    "Thứ hai, việc ứng dụng công nghệ mang lại nhiều lợi ích thiết thực. Ngoài ra, quá trình số hóa giúp tối ưu hóa nguồn lực và cải thiện năng suất. Từ đó, tổ chức có thể nâng cao năng lực cạnh tranh trong bối cảnh hiện nay.",
    "Cuối cùng, việc đánh giá kết quả định kỳ là yếu tố quan trọng. Đồng thời, những phản hồi phù hợp hỗ trợ quá trình điều chỉnh và hoàn thiện. Nhìn chung, đây là giải pháp toàn diện nhằm hướng tới sự phát triển bền vững."
  ].join("\n\n")
};

const elements = {
  text: document.querySelector("#essay-text"),
  count: document.querySelector("#text-count"),
  language: document.querySelector("#language"),
  field: document.querySelector("#field"),
  analyze: document.querySelector("#analyze-button"),
  modeStatus: document.querySelector("#analysis-mode-status"),
  error: document.querySelector("#error-message"),
  empty: document.querySelector("#result-empty"),
  result: document.querySelector("#result-content"),
  score: document.querySelector("#risk-score"),
  level: document.querySelector("#risk-level"),
  paragraphsCount: document.querySelector("#paragraph-count"),
  summary: document.querySelector("#result-summary"),
  checkedWords: document.querySelector("#checked-words"),
  disclaimer: document.querySelector("#disclaimer-text"),
  paragraphsEmpty: document.querySelector("#paragraphs-empty"),
  paragraphLayout: document.querySelector("#paragraph-layout"),
  paragraphList: document.querySelector("#paragraph-list"),
  paragraphDetail: document.querySelector("#paragraph-detail"),
  export: document.querySelector("#export-button")
};

let latestResult = null;
let activeFilter = "all";
let selectedIndex = null;

function getWordCount(text) {
  return (text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []).length;
}

function updateCounter() {
  const text = elements.text.value;
  const charCount = Array.from(text).length;
  elements.count.replaceChildren(
    document.createTextNode(`${getWordCount(text).toLocaleString("vi-VN")} từ · ${charCount.toLocaleString("vi-VN")} / ${MAX_CHARACTERS.toLocaleString("vi-VN")} ký tự`)
  );
  elements.count.classList.toggle("over-limit", charCount > MAX_CHARACTERS);
}

function splitParagraphs(text) {
  return text.trim().split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

function scoreClass(score) {
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = false;
}

function clearError() {
  elements.error.textContent = "";
  elements.error.hidden = true;
}

function renderDetail(item) {
  if (!item) {
    const empty = document.createElement("p");
    empty.className = "detail-empty";
    empty.textContent = "Chọn một đoạn để xem các quy tắc câu chữ được khớp.";
    elements.paragraphDetail.replaceChildren(empty);
    return;
  }
  const tone = scoreClass(item.suspicion_score);
  elements.paragraphDetail.replaceChildren();
  const kicker = document.createElement("p");
  kicker.className = "detail-kicker";
  kicker.textContent = "NHẬN ĐỊNH THEO ĐOẠN";
  const heading = document.createElement("div");
  heading.className = "detail-heading";
  const title = document.createElement("strong");
  title.textContent = `Đoạn ${item.index + 1} · ${item.label}`;
  const score = document.createElement("span");
  score.className = `detail-score ${tone}`;
  score.textContent = `${item.suspicion_score}/100`;
  heading.append(title, score);
  const text = document.createElement("p");
  text.className = "detail-text";
  text.textContent = item.text;
  const reasonsTitle = document.createElement("p");
  reasonsTitle.className = "detail-reasons-title";
  reasonsTitle.textContent = "QUY TẮC ĐƯỢC KHỚP";
  const reasons = document.createElement("ul");
  reasons.className = "detail-reasons";
  for (const reason of item.reasons) {
    const li = document.createElement("li");
    li.textContent = reason;
    reasons.append(li);
  }
  elements.paragraphDetail.append(kicker, heading, text, reasonsTitle, reasons);
}

function renderParagraphs() {
  if (!latestResult) return;
  const items = latestResult.paragraphs.filter((item) =>
    activeFilter === "all" || item.suspicion_score >= 40
  );
  elements.paragraphList.replaceChildren();
  for (const item of items) {
    const button = document.createElement("button");
    const tone = scoreClass(item.suspicion_score);
    button.type = "button";
    button.className = `paragraph-card ${tone}${selectedIndex === item.index ? " selected" : ""}`;
    button.setAttribute("aria-pressed", String(selectedIndex === item.index));
    const top = document.createElement("span");
    top.className = "paragraph-card-top";
    const title = document.createElement("span");
    title.className = "paragraph-title";
    title.textContent = `ĐOẠN ${String(item.index + 1).padStart(2, "0")}`;
    const label = document.createElement("span");
    label.className = "paragraph-label";
    label.textContent = item.label;
    top.append(title, label);
    const preview = document.createElement("span");
    preview.className = "paragraph-preview";
    preview.textContent = item.text;
    button.append(top, preview);
    button.addEventListener("click", () => {
      selectedIndex = item.index;
      renderParagraphs();
      renderDetail(item);
    });
    elements.paragraphList.append(button);
  }
  const selected = items.find((item) => item.index === selectedIndex);
  if (selected) {
    renderDetail(selected);
  } else if (items.length) {
    selectedIndex = items[0].index;
    renderParagraphs();
    return;
  } else {
    renderDetail(null);
  }
}

function renderResult(result, wordCount) {
  latestResult = result;
  activeFilter = "all";
  selectedIndex = result.paragraphs[0]?.index ?? null;
  elements.empty.hidden = true;
  elements.result.hidden = false;
  elements.score.textContent = result.overall_score ?? result.overall_suspicion_score;
  elements.level.textContent = result.overall_risk_level;
  elements.paragraphsCount.textContent = `${result.paragraphs.length} đoạn`;
  elements.summary.textContent = result.summary;
  elements.checkedWords.textContent = `${wordCount.toLocaleString("vi-VN")} từ đã rà soát`;
  elements.disclaimer.textContent = result.disclaimer;
  const overallClass = result.overall_risk_level === "Nhiều dấu hiệu" ? "high" :
    result.overall_risk_level === "Cần lưu ý" ? "medium" : "";
  elements.score.className = `risk-score ${overallClass}`;
  elements.level.className = `risk-level ${overallClass}`;
  elements.paragraphsEmpty.hidden = true;
  elements.paragraphLayout.hidden = false;
  elements.export.disabled = false;
  document.querySelectorAll(".filter-button").forEach((button) => {
    const active = button.dataset.filter === "all";
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderParagraphs();
}

function analyze() {
  clearError();
  const text = elements.text.value;
  const charCount = Array.from(text).length;
  if (!text.trim()) {
    showError("Vui lòng nhập nội dung bài làm trước khi chạy kiểm tra.");
    elements.text.focus();
    return;
  }
  if (charCount > MAX_CHARACTERS) {
    showError(`Nội dung đang vượt giới hạn ${MAX_CHARACTERS.toLocaleString("vi-VN")} ký tự.`);
    elements.text.focus();
    return;
  }
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length > MAX_PARAGRAPHS) {
    showError(`Bản demo hỗ trợ tối đa ${MAX_PARAGRAPHS} đoạn mỗi lần rà soát.`);
    return;
  }
  const result = window.EssayLensRuleEngine.analyzeText(
    text,
    elements.language.value,
    elements.field.value
  );
  elements.modeStatus.textContent = "Đã phân tích trên trình duyệt bằng bộ luật văn phong.";
  renderResult(result, getWordCount(text));
}

function exportReport() {
  if (!latestResult) return;
  const lines = [
    "ESSAY LENS — BÁO CÁO RÀ SOÁT THAM KHẢO",
    `Mức tín hiệu: ${latestResult.overall_risk_level} (${latestResult.overall_suspicion_score}/100)`,
    `Số từ: ${getWordCount(elements.text.value)}`,
    "",
    "TÓM TẮT",
    latestResult.summary,
    "",
    "NHẬN ĐỊNH THEO ĐOẠN"
  ];
  for (const item of latestResult.paragraphs) {
    lines.push(
      "",
      `Đoạn ${item.index + 1} — ${item.label} (${item.suspicion_score}/100)`,
      item.text,
      ...item.reasons.map((reason) => `- ${reason}`)
    );
  }
  lines.push("", "LƯU Ý", latestResult.disclaimer);
  const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "essay-lens-bao-cao-tham-khao.txt";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

elements.text.addEventListener("input", updateCounter);
elements.analyze.addEventListener("click", analyze);
document.querySelector("#sample-ai-style").addEventListener("click", () => {
  elements.text.value = samples.ai;
  elements.language.value = "vi";
  updateCounter();
  clearError();
  elements.text.focus();
});
document.querySelector("#sample-specific").addEventListener("click", () => {
  elements.text.value = samples.specific;
  elements.language.value = "vi";
  updateCounter();
  clearError();
  elements.text.focus();
});
document.querySelector("#sample-structured").addEventListener("click", () => {
  elements.text.value = samples.structured;
  elements.language.value = "vi";
  updateCounter();
  clearError();
  elements.text.focus();
});
document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((filterButton) => {
      const active = filterButton === button;
      filterButton.classList.toggle("active", active);
      filterButton.setAttribute("aria-pressed", String(active));
    });
    renderParagraphs();
  });
});
elements.export.addEventListener("click", exportReport);
elements.text.value = samples.ai;
updateCounter();
