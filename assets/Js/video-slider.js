class VideoSlider {
    constructor(root, videos, options = {}) {
        this.root = typeof root === 'string' ? document.querySelector(root) : root;
        if (!this.root) throw new Error('VideoSlider: контейнер не найден');
        if (!Array.isArray(videos) || videos.length === 0) {
            throw new Error('VideoSlider: нужен непустой массив videos');
        }

        this.videos = videos;
        this.options = options;
        this.loop = options.loop !== false;
        this.activeIndex = 0;
        this.player = null;
        this.playerIndex = null;
        this.trackHeightBreakpoint = options.trackHeightBreakpoint || 991;
        this.trackHeightOffset = options.trackHeightOffset ?? 32;

        this._buildDOM();
        this._bindEvents();
        this._update();
    }

    _buildDOM() {
        this.root.classList.add('video-slider');
        if (this.options.theme === 'light') this.root.classList.add('video-slider--light');
        if (this.options.compact) this.root.classList.add('video-slider--compact');

        this.stage = document.createElement('div');
        this.stage.className = 'video-slider__stage';

        this.track = document.createElement('div');
        this.track.className = 'video-slider__track';
        this.stage.appendChild(this.track);

        this.slides = this.videos.map((video, i) => this._buildSlide(video, i));
        this.slides.forEach((slide) => this.track.appendChild(slide.el));

        this.prevBtn = this._buildNavButton('prev');
        this.nextBtn = this._buildNavButton('next');
        this.stage.appendChild(this.prevBtn);
        this.stage.appendChild(this.nextBtn);

        this.root.appendChild(this.stage);

        this.dots = document.createElement('div');
        this.dots.className = 'video-slider__dots';
        this.dotEls = this.videos.map((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'video-slider__dot';
            dot.setAttribute('aria-label', `Слайд ${i + 1}`);
            dot.addEventListener('click', () => this.goTo(i));
            this.dots.appendChild(dot);
            return dot;
        });
        this.root.appendChild(this.dots);
    }

    _buildSlide(video, index) {
        const el = document.createElement('div');
        el.className = 'video-slider__slide';
        el.dataset.index = String(index);

        const thumb = document.createElement('img');
        thumb.className = 'video-slider__thumb';
        thumb.loading = 'lazy';
        thumb.alt = video.title || '';
        thumb.src = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
        el.appendChild(thumb);

        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'video-slider__play';
        playBtn.setAttribute('aria-label', 'Воспроизвести видео');
        playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        el.appendChild(playBtn);

        if (video.title) {
            const title = document.createElement('div');
            title.className = 'video-slider__title';
            title.textContent = video.title;
            el.appendChild(title);
        }

        el.addEventListener('click', (e) => {
            if (index !== this.activeIndex) {
                this.goTo(index);
                return;
            }
            if (this.playerIndex !== index) {
                this._loadPlayer(index);
            }
        });

        return { el, thumb, playBtn, video };
    }

    _buildNavButton(dir) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `video-slider__nav video-slider__nav--${dir}`;
        btn.setAttribute('aria-label', dir === 'prev' ? 'Предыдущий слайд' : 'Следующий слайд');
        const d = dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
        btn.addEventListener('click', () => (dir === 'prev' ? this.prev() : this.next()));
        return btn;
    }

    _bindEvents() {
        this.root.tabIndex = 0;
        this.root.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });

        let startX = 0;
        let dragging = false;
        this.stage.addEventListener('pointerdown', (e) => {
            dragging = true;
            startX = e.clientX;
        });
        window.addEventListener('pointerup', (e) => {
            if (!dragging) return;
            dragging = false;
            const diff = e.clientX - startX;
            if (Math.abs(diff) > 40) {
                diff > 0 ? this.prev() : this.next();
            }
        });

        window.addEventListener('resize', () => this._update());
    }

    _offset(index) {
        const total = this.videos.length;
        let diff = index - this.activeIndex;
        if (this.loop) {
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;
        }
        return diff;
    }

    _update() {
        this.slides.forEach((slide, i) => {
            const offset = this._offset(i);
            const abs = Math.abs(offset);
            const isMobile = window.innerWidth <= 767;
            const spacing = isMobile ? 60 : 130;
            const rotate = Math.max(-45, Math.min(45, offset * -35));
            const scale = Math.max(0.55, 1.3);
            const translateZ = -abs * (isMobile ? 90 : 170);
            const translateX = offset * spacing;
            const opacity = abs > 3 ? 0 : abs === 0 ? 1 : Math.max(0.15, 0.7);
            const zIndex = 100 - abs;

            slide.el.style.transform =
                `translate(-50%, -50%) translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotate}deg) scale(${scale})`;
            slide.el.style.opacity = String(opacity);
            slide.el.style.zIndex = String(zIndex);
            slide.el.style.pointerEvents = abs > 3 ? 'none' : 'auto';
            slide.el.classList.toggle('is-active', i === this.activeIndex);
            slide.el.classList.toggle('is-prev', offset < 0);
            slide.el.classList.toggle('is-next', offset > 0);
        });

        this.dotEls.forEach((dot, i) => dot.classList.toggle('is-active', i === this.activeIndex));

        this._updateTrackHeight();
    }

    _updateTrackHeight() {
        const isNarrow = window.innerWidth <= this.trackHeightBreakpoint;

        if (!isNarrow) {
            this.track.style.height = '';
            return;
        }

        const stageWidth = this.stage.clientWidth;
        const slideWidth = stageWidth * 0.6;
        const activeSlideScale = 1.2;
        const slideHeight = (slideWidth * 9 / 16) * activeSlideScale;

        this.track.style.height = `${Math.round(slideHeight + this.trackHeightOffset)}px`;
    }

    _loadPlayer(index) {
        this._disposePlayer();

        const slide = this.slides[index];
        slide.thumb.remove();
        slide.playBtn.remove();

        const videoEl = document.createElement('video-js');
        videoEl.className = 'video-js vjs-default-skin';
        slide.el.insertBefore(videoEl, slide.el.firstChild);

        const isHttp = window.location.protocol === 'http:' || window.location.protocol === 'https:';
        if (!isHttp) {
            console.warn(
                'VideoSlider: страница открыта не через http(s) (например, напрямую как файл). ' +
                'YouTube-плеер требует валидный origin и может выдавать ошибку 153. ' +
                'Запусти сайт через локальный сервер (Live Server, `python -m http.server` и т.п.).'
            );
        }

        this.player = videojs(videoEl, {
            techOrder: ['youtube'],
            sources: [{ type: 'video/youtube', src: `https://www.youtube.com/watch?v=${slide.video.id}` }],
            youtube: {
                iv_load_policy: 3,
                modestbranding: 1,
                rel: 0,
                ...(isHttp ? { origin: window.location.origin } : {}),
                customVars: { playsinline: 1 },
            },
            autoplay: true,
            controls: true,
            fluid: false,
            responsive: true,
        });
        this.playerIndex = index;
    }

    _disposePlayer() {
        if (this.player) {
            this.player.dispose();
            this.player = null;
        }
        if (this.playerIndex !== null) {
            const slide = this.slides[this.playerIndex];
            if (slide && !slide.el.contains(slide.thumb)) {
                slide.el.innerHTML = '';
                slide.el.appendChild(slide.thumb);
                slide.el.appendChild(slide.playBtn);
                const title = slide.video.title;
                if (title) {
                    const titleEl = document.createElement('div');
                    titleEl.className = 'video-slider__title';
                    titleEl.textContent = title;
                    slide.el.appendChild(titleEl);
                }
            }
        }
        this.playerIndex = null;
    }

    goTo(index) {
        if (index === this.activeIndex) return;
        this._disposePlayer();
        const total = this.videos.length;
        this.activeIndex = this.loop ? ((index % total) + total) % total : Math.max(0, Math.min(total - 1, index));
        this._update();
    }

    next() {
        this.goTo(this.activeIndex + 1);
    }

    prev() {
        this.goTo(this.activeIndex - 1);
    }
}