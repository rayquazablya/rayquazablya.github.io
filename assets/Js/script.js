

const mainBlock = document.querySelector('.main-block');
const starImage = document.querySelector('.main-image img');

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

const amplitude = 15;
const smoothing = 0.08;
const minWidth = 992;

mainBlock.addEventListener('mousemove', (e) => {
    if (window.innerWidth < minWidth) return;
    
    const rect = mainBlock.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    targetX = ((mouseX - centerX) / centerX) * amplitude;
    targetY = ((mouseY - centerY) / centerY) * amplitude;
});

mainBlock.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
});

function animate() {
    if (window.innerWidth >= minWidth) {
        currentX += (targetX - currentX) * smoothing;
        currentY += (targetY - currentY) * smoothing;
        
        starImage.style.transform = `translate(${currentX}px, ${currentY}px)`;
    } else {
        if (currentX !== 0 || currentY !== 0) {
            currentX = 0;
            currentY = 0;
            starImage.style.transform = `translate(0px, 0px)`;
        }
    }
    
    requestAnimationFrame(animate);
}

animate();



document.addEventListener('DOMContentLoaded', () => {
    const arrowBtn = document.querySelector('.arrow-button-bottom');
    const infoBlock = document.querySelector('.info-block');

    if (arrowBtn && infoBlock) {
        arrowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            infoBlock.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }
});



const container = document.querySelector('.body-container');

if (container && window.innerWidth > 768) {
    let currentScroll = container.scrollTop;
    let targetScroll = container.scrollTop;
    let isScrolling = false;

    const ease = 0.10;        
    const sensitivity = 5;    

    container.addEventListener('scroll', () => {
        if (!isScrolling) {
            currentScroll = container.scrollTop;
            targetScroll = container.scrollTop;
        }
    });

    container.addEventListener('wheel', (e) => {
        e.preventDefault();

        targetScroll += e.deltaY * sensitivity;

        const maxScroll = container.scrollHeight - container.clientHeight;
        targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

        if (!isScrolling) {
            isScrolling = true;
            requestAnimationFrame(smoothScrollLoop);
        }
    }, { passive: false });

    function smoothScrollLoop() {
        const diff = targetScroll - currentScroll;
        currentScroll += diff * ease;

        container.scrollTop = currentScroll;

        if (Math.abs(diff) > 0.5) {
            requestAnimationFrame(smoothScrollLoop);
        } else {
            container.scrollTop = targetScroll;
            currentScroll = targetScroll;
            isScrolling = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const arrowBtn = document.querySelector('.arrow-button-bottom');
    const infoBlock = document.querySelector('.info-block');

    if (arrowBtn && infoBlock) {
        arrowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            infoBlock.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }
});