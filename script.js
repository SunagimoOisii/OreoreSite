const message = document.getElementById("message");

// ボタンのクリックイベント
document.getElementById("btn").addEventListener("click", () => {
  message.textContent = "ボタンがクリックされました！";
});

// ナビゲーションリンクのクリックイベント
document.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", () => {
    message.textContent = `リンク「${link.textContent}」がクリックされました`;
  });
});

// スクロール時のフェードイン処理
const fadeElems = document.querySelectorAll(".fade-in");
const showElement = () => {
  fadeElems.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      el.classList.add("visible");
    }
  });
};

window.addEventListener("scroll", showElement);
showElement();
