(function (doc, win) {

    var apps = win.apps = win.apps || {},
        $ = apps.utils = apps.utils || {};

    var MODULE_ID = 'mads-slider',
        OFFSET_FOR_MOVE = 50;

    // bSlider base class
    var bSlider = function (config) {
        $.extend.apply(null, [this, config]);
    };

    $.extend(bSlider.prototype, {
        animatedStatus: false,
        touchFirstPoint: 0,
        touchEvent: false,
        listOfSlideStyle: 'style="width:{{sliders}}; left:{{offset}};"',
        slideItemStyle: '',
        sliderItemData: {
            tag: 'li',
            class: MODULE_ID + '__item',
            alt: ''
        },
        initialize: function (arg) {
            if (this.images.length < 1) {
                return;
            }

            this.renderSlider(arg);
            this.addTransition(this.$list);

            if (this.mode === 'manual' ||
                this.mode === 'automanual') {
                this.addListener();
            }
            this.playSlider()
        },
        listOfSlidesData: function (className, sliderItems) {
            var swipeSlider = className === 'slide',
                slideWidth = this.slideWidth + 'px',
                offset, sliders;

            if (swipeSlider) {
                offset = '-' + slideWidth;
                sliders = sliderItems.length + '00%';
            } else {
                offset = 0;
                sliders = slideWidth;
            }

            return {
                tag: 'ul',
                class: MODULE_ID + '__list ' + MODULE_ID + '__' + className,
                data: sliderItems.join(''),
                offset: offset,
                sliders: sliders
            }
        },
        listOfSlide: function () {
            return '<{{tag}} class="{{class}}" ' + this.listOfSlideStyle + '>{{data}}</{{tag}}>';
        },
        slideItem: function () {
            return '<{{tag}} class="{{class}}" ' + this.slideItemStyle + '><img src="{{img}}" alt="{{alt}}"/></{{tag}}>';
        },
        generateSliders: function (ln) {
            return this.images.map($.bind(function (item, index) {
                return $.tpl(this.slideItem(), $.extend(this.sliderItemData, {
                    img: item,
                    index: ln - index
                }));
            }, this));
        },
        infiniteSlider: function (sliderItems, ln) {
            // clone the first slider item and add to and
            sliderItems.push($.tpl(this.slideItem(), $.extend(this.sliderItemData, {
                img: this.images[0],
                index: 0
            })));

            // clone the last slider item and add to start
            sliderItems.unshift($.tpl(this.slideItem(), $.extend(this.sliderItemData, {
                img: this.images[ln - 1],
                index: ln + 1
            })));
        },
        createSlider: function (arg) {
            var Sliders = this.images.length,
                sliderItems = this.generateSliders(Sliders);

            this.slideWidth = this.$root.clientWidth; // Slide item width
            this.sliderWidth = this.slideWidth * Sliders; // Slider Width
            this.currentSlide = 1; // Current Slide

            this.infiniteSlider(sliderItems, Sliders);

            return $.tpl(this.listOfSlide(), this.listOfSlidesData(arg.className, sliderItems));
        },
        renderSlider: function (arg) {
            this.$root = $.getElemById(this.renderTo);
            if (!this.$root) {
                return;
            }
            this.$root.innerHTML = this.createSlider(arg);
            this.$list = this.$root.childNodes[0];
        },
        playSlider: function () {
            if (this.mode === 'auto' || this.mode === 'automanual') {
                this.animateStartId = setTimeout($.bind(this.animateStart, this), this.swipeDelay);
            }
        },
        getValidTouchPoint: function (e) {
            var ct;
            if ($.isTouchDevice() && e) {
                ct = e.changedTouches;
                return ct && ct[0] && ct[0].pageX;
            }
            return e.x;
        },
        touchStart: function (e) {
            e.preventDefault(e);
            this.touchFirstPoint = this.getValidTouchPoint(e);
        },
        touchEnd: function (e) {
            var offset;
            e.preventDefault();

            if (!this.touchFirstPoint) {
                return;
            }

            offset = this.touchFirstPoint - this.getValidTouchPoint(e);

            clearInterval(this.animateStartId);
            this.touchEvent = true;

            if (offset > OFFSET_FOR_MOVE) {
                this.animateStart();
            } else if (offset < -OFFSET_FOR_MOVE) {
                this.animateStart('left');
            }
        },
        play: function (e) {
            e.preventDefault();
            this.touchEvent = false;
            this.playSlider();
        },
        stop: function (e) {
            e.preventDefault();
            clearInterval(this.animateStartId);
        },
        getListOfListeners: function () {
            if ($.isTouchDevice()) {
                return {
                    'touchstart': [this.$list, this.touchStart],
                    'touchmove': [this.$list, this.touchEnd]
                }
            } else {
                return {
                    'mouseenter': [this.$list, this.stop],
                    'mouseleave': [this.$list, this.play],
                    'mousedown': [this.$list, this.touchStart],
                    'mousemove': [this.$list, this.touchEnd]
                }
            }
        },
        addListener: function () {
            var events = this.getListOfListeners(),
                mbSlider = this;
            for (var eventType in events) {
                if (events.hasOwnProperty(eventType)) {
                    eventType.split(',').forEach(function (e) {
                        events[eventType][0].addEventListener(e, $.bind(events[eventType][1], mbSlider), false);
                    });
                }
            }
        },
        addTransition: function (el) {
            el.style.transitionDuration = (this.swipeSpeed / 1000) + 's';
        },
        clearTransition: function (el) {
            el.style.transitionDuration = 'inherit';
        },
        animateStart: function (direction) {
            if (!this.animatedStatus) {
                this.touchFirstPoint = 0;
                this.animatedStatus = true;
                this.addTransition(this.$list);
                if (direction) {
                    this.changeSlide(this.goPrev());
                    this.currentSlide--;
                } else {
                    this.changeSlide(this.goNext());
                    this.currentSlide++;
                }
                setTimeout($.bind(this.animateEnd, this), this.swipeSpeed);
            }
        }
    });

    // swipeSlider
    apps.swipeSlider = function (config) {
        bSlider.call(this, config);
        this.initialize({className: 'slide'});
    };

    $.inherit(apps.swipeSlider, bSlider);

    $.extend(apps.swipeSlider.prototype, {
        getOffset: function (fn) {
            return fn.apply(this, [this.getCurrentPos(), this.slideWidth]);
        },
        goNext: function () {
            return this.getOffset(function (a, b) {
                return a - b
            });
        },
        goPrev: function () {
            return this.getOffset(function (a, b) {
                return a + b
            });
        },
        resetPos: function (pos) {
            this.changeSlide(-pos);
            this.currentSlide = 1;
            this.animateEnd();
        },
        getCurrentPos: function () {
            return parseInt(this.$list.style.left) || 0;
        },
        changeSlide: function (n) {
            this.$list.style.left = n + 'px';
        },
        animateEnd: function () {
            this.animatedStatus = false;
            if (Math.abs(this.getCurrentPos()) >= (this.sliderWidth + this.slideWidth)) {
                this.clearTransition(this.$list);
                this.resetPos(this.slideWidth);
                return;
            } else if (this.getCurrentPos() === 0) {
                this.clearTransition(this.$list);
                this.resetPos(this.sliderWidth);
                return;
            }
            if (!this.touchEvent || $.isTouchDevice()) {
                this.playSlider();
            }
        }
    });

    // fadeSlider
    apps.fadeSlider = function (config) {
        bSlider.call(this, config);
        this.initialize({className: 'fade-in'});
        this.addTransition();
    };

    $.inherit(apps.fadeSlider, bSlider);

    $.extend(apps.fadeSlider.prototype, {
        addTransition: function () {
            this.each(apps.fadeSlider.superclass.addTransition);
        },
        clearTransition: function () {
            this.each(apps.fadeSlider.superclass.clearTransition);
        },
        each: function (fn) {
            var fadeSlider = this;
            [].slice.call(this.$list.childNodes).forEach(function (item, index) {
                $.bind(fn, fadeSlider)(item, index);
            });
        },
        slideItemStyle: 'style="z-index: {{index}}"',
        listOfSlideStyle: 'style="width:{{sliders}};"',
        goPrev: function () {
            return [this.currentSlide - 1, 1];
        },
        goNext: function () {
            return [this.currentSlide, 0];
        },
        resetPos: function (num) {
            this.each(function (item, index) {
                if (num === 0 && index !== 0) {
                    item.style.opacity = 1;
                    this.currentSlide = 1;
                } else if (num === 4 && index < 4) {
                    item.style.opacity = 0;
                    this.currentSlide = 4;
                }
            });
            this.animateEnd();
        },
        changeSlide: function (arg) {
            this.$list.childNodes[arg[0]].style.opacity = arg[1];
        },
        animateEnd: function () {
            this.animatedStatus = false;
            if (this.currentSlide === 5) {
                this.clearTransition();
                this.resetPos(0);
                return;
            } else if (this.currentSlide === 0) {
                this.clearTransition();
                this.resetPos(4);
                return;
            }
            if (!this.touchEvent || $.isTouchDevice()) {
                this.playSlider();
            }
        }
    });

}(document, window));