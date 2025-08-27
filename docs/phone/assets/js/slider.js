// Slider infinito duplicando el track
const track = document.querySelector('.slider-track');
track.innerHTML += track.innerHTML;

// Popup
const popup = document.getElementById("popup");
const iframe = popup.querySelector("iframe");
const closeBtn = popup.querySelector(".close-btn");

document.querySelectorAll(".slide img").forEach(img => {
  img.addEventListener("click", () => {
    iframe.src = img.dataset.iframe;
    popup.style.display = "flex";
  });
});

closeBtn.addEventListener("click", () => {
  popup.style.display = "none";
  iframe.src = "";
});

window.addEventListener("click", e => {
  if (e.target === popup) {
    popup.style.display = "none";
    iframe.src = "";
  }
});
