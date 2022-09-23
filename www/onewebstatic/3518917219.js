(function ($) {
    $.fn.isMobileWidth = function () {
        var innerWidth = window.innerWidth;
        var clientWidth = document.documentElement.clientWidth;
        var width = innerWidth && clientWidth ? Math.min(innerWidth, clientWidth) : innerWidth || clientWidth;
        return width <= 650;
    };
    $.fn.isDesktopView = function () {
        var templateElt = $('.template'), isMobileView = $(templateElt).data('mobile-view'), isMobileWidth = $().isMobileWidth();
        return !isMobileView || !isMobileWidth;
    };
    function getStickyElementHeightsUntil(node) {
        var stickyCmpSelector = 'div.mm-mobile-preview, body:not(.mobileV) div[data-specific-kind="STRIP"], body:not(.mobileV) div[data-specific-kind="SECTION"]', found;
        return $(stickyCmpSelector).filter(function () {
            var dataset = this.dataset;
            if (found || this === node) {
                found = true;
                return;
            }
            return (dataset.mobilePin || dataset.pin) > 0;
        }).toArray().reduce(function (sum, ele) {
            return sum + ele.offsetHeight;
        }, 0);
    }
    $.fn.scrollIntoSection = function (sectionId, callback) {
        var element = document.getElementById(sectionId || ''), newTop = getStickyElementHeightsUntil(element);
        if (element) {
            $.fn.scrollIntoView(element, newTop, callback);
        }
    };
    $.fn.scrollIntoView = function (element, newTop, callback, duration) {
        var $ele = $(element), isStickyClass = 'is-sticky', start = $(document).scrollTop(), currentTime = 0, increment = 20, cancelScroll = false, change, target;
        function easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) {
                return c / 2 * t * t + b;
            }
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
        var cancelAnimateScroll = function () {
                cancelScroll = true;
                document.removeEventListener('wheel', cancelAnimateScroll);
            }, getPositionOfStrip = function () {
                var target, display = element.style.display;
                element.style.display = 'block';
                target = $ele.offset().top;
                if (element.dataset.pin !== 0 && $ele.hasClass(isStickyClass)) {
                    $ele.removeClass(isStickyClass);
                    target = $ele.offset().top;
                    $ele.addClass(isStickyClass);
                }
                element.style.display = display;
                return target;
            };
        document.addEventListener('wheel', cancelAnimateScroll);
        target = getPositionOfStrip();
        change = target - (start + newTop || 0);
        duration = !isNaN(duration) ? duration : Math.abs(change) > 1000 ? Math.abs(change / 2) : 500;
        function animateScroll() {
            if (cancelScroll)
                return;
            currentTime += increment;
            window.scrollTo(0, easeInOutQuad(currentTime, start, change, duration));
            if (currentTime < duration) {
                window.requestAnimationFrame(animateScroll);
            } else {
                window.scrollBy(0, element.getBoundingClientRect().top - newTop);
                document.removeEventListener('wheel', cancelAnimateScroll);
                if (typeof callback === 'function') {
                    callback(element, newTop);
                }
            }
        }
        animateScroll();
    };
    $.fn.removeHash = function () {
        var hash = location.hash, url = location.href.replace(hash, '');
        history.replaceState(null, null, url);
    };
    $.fn.pushHashState = function (value) {
        if (!value) {
            return;
        }
        if (location.hash.substr(1) !== value) {
            try {
                history.pushState(null, null, '#' + value);
            } catch (e) {
                console.warn(e.message);
            }
        }
        $.fn.scrollIntoSection(value);
    };
    function sectionLinkHandler(e) {
        var $target = $(e.target), $sectionLink = $target.closest('a[sectionid]'), sectionId = $sectionLink.length ? $sectionLink.attr('sectionid') : null;
        if (!sectionId) {
            return;
        }
        var strip = document.body.querySelector('div[data-specific-kind=SECTION][data-id="' + sectionId + '"], div[data-specific-kind=STRIP][data-id="' + sectionId + '"]'), stripId = strip && strip.id;
        if (stripId) {
            e.preventDefault();
            $.fn.pushHashState(stripId);
        }
    }
    $('div.menu.dropdown, a[sectionid], [data-specific-kind="IMAGESLIDER"]').on('click', sectionLinkHandler);
    function removeBlurImage() {
        var urls = $('div[data-small-image][data-src]');
        urls.each(function () {
            var othis = $(this);
            var img = new Image();
            img.onload = function () {
                othis.remove();
            };
            img.src = othis.data('src');
        });
    }
    removeBlurImage();
}(oneJQuery));
(function ($) {
    function initializeStripNames() {
        var stripSelector = '[data-specific-kind="STRIP"]', pageStripCount = 0, templateStripCount = 0;
        $(stripSelector).toArray().map(function (ele) {
            var bound = ele.getBoundingClientRect(), inTemplate = ele.dataset.inTemplate === 'true', zIndex = parseInt($(ele).closest('[style*="z-index"]').css('zIndex')) || 0;
            return {
                top: bound.top,
                zIndex: zIndex,
                ele: ele,
                inTemplate: inTemplate
            };
        }).sort(function (a, b) {
            var value = a.top - b.top;
            if (!value) {
                return a.zIndex - b.zIndex;
            }
            return value;
        }).forEach(function (obj) {
            if (!obj.ele.id) {
                obj.ele.id = obj.inTemplate ? 'TemplateStrip' + ++templateStripCount : 'Strip' + ++pageStripCount;
            }
        });
    }
    initializeStripNames();
}(oneJQuery));
(function ($) {
    function run() {
        var g = function (id) {
                return document.getElementById(id);
            }, container = g('MobileHeader_container'), burgerMenuIcon = g('MobileHeader_burgerMenuIcon'), inActivebgColor = burgerMenuIcon.getAttribute('data-inactive-bgcolor'), activebgColor = burgerMenuIcon.getAttribute('data-active-bgcolor'), menu = g('mm'), overlay = g('mm-overlay'), body = document.getElementsByTagName('body')[0], on = false;
        if (!container || !body) {
            return;
        }
        function setOnOffClass(ele, newCls) {
            ele.className = ele.className.replace(/\bon|off\b/, '').trim() + ' ' + newCls;
        }
        function setMenuIconStyles(color) {
            Array.prototype.slice.call(burgerMenuIcon.childNodes).forEach(function (node) {
                node.style.backgroundColor = color;
            });
        }
        function toggleClasses() {
            var className = on ? 'on' : 'off';
            setOnOffClass(burgerMenuIcon, className);
            setOnOffClass(menu, className);
            setOnOffClass(overlay, className);
            setMenuIconStyles(on ? activebgColor : inActivebgColor);
        }
        function handleStickyMenu(on) {
            menu.scrollTop = 1;
            if (on) {
                $('html').css({
                    overflowY: 'hidden',
                    marginRight: Math.abs(window.innerWidth - document.documentElement.clientWidth) + 'px'
                });
            } else {
                $('html').css({
                    overflowY: '',
                    marginRight: ''
                });
            }
        }
        function onScroll() {
            if (menu.scrollTop < 1) {
                menu.scrollTop = 1;
            } else if (menu.scrollHeight - menu.scrollTop - menu.clientHeight < 1) {
                menu.scrollTop = menu.scrollTop - 1;
            }
        }
        var preventEvent = function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
        };
        var disableMenuTouchMove = function () {
            var windowInnerHeight = $(window).height();
            var padding = 149;
            var menuHeight = $(menu).find('ul:first').outerHeight() + padding;
            var menuHasNoScroll = menuHeight < windowInnerHeight;
            if (menuHasNoScroll) {
                $(menu).on('touchmove', preventEvent);
            } else {
                menu.scrollTop = 1;
                $(menu).off('touchmove');
            }
        };
        disableMenuTouchMove();
        $(menu).on('scroll', onScroll);
        $(window).resize(disableMenuTouchMove);
        $(overlay).on('touchmove', preventEvent);
        function toggleMenu() {
            on = !on;
            toggleClasses();
            handleStickyMenu(on);
        }
        overlay.onclick = toggleMenu;
        burgerMenuIcon.onclick = toggleMenu;
        menu.onclick = function (e) {
            var target, parent, targetTag;
            target = e ? e.target : window.event.srcElement;
            target = target.nodeType === 3 ? target.parentNode : target;
            targetTag = target.tagName;
            if ((targetTag === 'DIV' || targetTag === 'SPAN') && target.id !== 'mm') {
                parent = targetTag === 'SPAN' ? target.parentNode.parentNode.parentNode : target.parentNode.parentNode;
                parent.className = parent.className ? '' : 'expanded';
                disableMenuTouchMove();
                return;
            }
            on = false;
            handleStickyMenu(on);
            toggleClasses();
        };
    }
    var readyTimer = setInterval(function () {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            run();
            clearInterval(readyTimer);
        }
    }, 10);
}(oneJQuery));