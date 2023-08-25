const images = document.querySelectorAll('.slideshow img');
let currentIndex = 0;

function showSlide(index) {
    images.forEach((img, i) => {
        img.style.opacity = i === index ? '1' : '0';
    });
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % images.length;
    showSlide(currentIndex);
}

setInterval(nextSlide, 2500);

// Exibindo o primeiro slide inicialmente
showSlide(currentIndex);
