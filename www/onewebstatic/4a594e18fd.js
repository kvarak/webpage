(function ($) {
    function isCopied(id, idsMap) {
        return Object.keys(idsMap).some(function (pId) {
            return pId.split('_copy').length > 1;
        });
    }
    function getParentId(elt) {
        return $(elt.parentNode).attr('data-id');
    }
    function fixImgAspectRatio(data) {
        var cmps = $('.image-container .col'), styles = '';
        cmps.each(function (index, elt) {
            var image = $(elt).parents('.image-container')[0], actualHeight = parseFloat($(image).attr('data-height')), actualWidth = parseFloat($(image).attr('data-width')), $imageParentNode = $(image.parentNode), parentId = getParentId(image);
            if ($imageParentNode.attr('data-kind') === 'Component') {
                var newImageWidth = $(image).outerWidth();
                var newImageHeight = newImageWidth * (actualHeight / actualWidth);
                styles += 'div[data-id="' + parentId + '"] .imgFixRatio {' + 'height: ' + actualHeight + 'px !important;' + 'width: ' + actualWidth + 'px !important;' + 'min-height: ' + Math.min(actualHeight, newImageHeight) + 'px !important;' + 'max-height: ' + newImageHeight + 'px;}';
            } else if (!$imageParentNode.hasClass('stretched') && $imageParentNode.attr('data-kind').toLowerCase() === 'block' && !data[parentId]) {
                var isTopLevelImage = $imageParentNode.hasClass('mobileTopLevelComponents');
                var imageWidth = $(image).outerWidth();
                var maxHeight = imageWidth * (actualHeight / actualWidth);
                styles += 'div[data-id="' + parentId + '"] .imgFixRatio {' + 'height: ' + actualHeight + 'px !important;' + 'width: ' + actualWidth + 'px !important;' + 'min-height: ' + Math.min(actualHeight, maxHeight) + 'px !important;' + 'max-height: ' + maxHeight + 'px;}';
                styles += 'div[data-id="' + parentId + '"] {' + 'display: flex;' + 'justify-content: center;}';
                if (isTopLevelImage) {
                    styles += 'div[data-id="' + parentId + '"] {' + 'padding-left: 18px;' + 'padding-right: 18px;}';
                }
            } else {
                var minHeight = $(image).outerWidth() * (actualHeight / actualWidth);
                styles += 'div[data-id="' + getParentId(image) + '"] .imgFixRatio { min-height: ' + minHeight + 'px !important;}';
            }
            $(image).addClass('imgFixRatio');
        });
        return styles;
    }
    function fixVideoHeight() {
        var videoCmps = $('iframe[data-kind="VIDEO"]'), styles = '';
        videoCmps.each(function (index, elt) {
            var height = $(elt).outerWidth() * (parseFloat(elt.height) / parseFloat(elt.width));
            styles += 'div[data-id="' + getParentId(elt) + '"] .videoFixRatio { height: ' + height + 'px;} ';
            $(elt).addClass('videoFixRatio');
        });
        return styles;
    }
    function fixCodeComponentWidth() {
        var codeCmps = $('.code-component-container'), styles = '';
        codeCmps.filter(function (_, item) {
            return !$(item).data('location');
        }).each(function (_, item) {
            var $item = $(item), id = $item.attr('id');
            styles += 'div#' + id + ' { width: 100%;} ';
        });
        return styles;
    }
    var tableFirstCellReductionWidth = 35;
    function fixTableColWidth() {
        var tableNodes = $('[data-specific-kind="TABLE"]'), styles = '';
        tableNodes.each(function (_, node) {
            var tableNode = $(node), cols = tableNode.find('colgroup')[0].children, firstColWidth = parseInt(cols[0].width, 10), availableWidth = parseInt(tableNode.css('width'), 10);
            if (cols.length > 1 && firstColWidth + tableFirstCellReductionWidth > availableWidth) {
                var id = tableNode.attr('data-id'), newWidth = availableWidth - tableFirstCellReductionWidth, tableStyle = tableNode.find('table')[0].style, newTableWidth = parseInt(tableStyle.width, 10);
                for (var i = 0; i < cols.length; i++) {
                    cols[i].width = newWidth + '';
                    newTableWidth = newTableWidth - (firstColWidth - newWidth);
                }
                tableStyle.width = newTableWidth + 'px';
                styles += 'div[data-id="' + id + '"] tr td { word-break: break-word }';
            }
        });
        return styles;
    }
    function fixCmpsStylesForMobile(data) {
        var styles = fixImgAspectRatio(data);
        styles += fixVideoHeight();
        styles += fixCodeComponentWidth();
        styles += fixTableColWidth();
        $('<style data-dynamicStyle type="text/css">' + styles + '</style>').appendTo('head');
    }
    function updateCopiedBlockElts(blocks, blockEltsMap, requiredIds, data) {
        Object.keys(requiredIds).forEach(function (id) {
            var idParts = id.split('_');
            if (idParts.length > 1) {
                if (blockEltsMap[idParts[0]]) {
                    blockEltsMap[id] = $(blockEltsMap[idParts[0]][0].cloneNode(true));
                } else {
                    for (var i = 0; i < blocks.length; i++) {
                        var cmpId = blocks[i].getAttribute('data-id');
                        if (cmpId === idParts[0]) {
                            blockEltsMap[id] = $(blocks[i].cloneNode(true));
                            break;
                        }
                    }
                }
            }
        });
    }
    function getCurrentWindowWidth() {
        return $(window).width();
    }
    function triggerChangeToMobileView() {
        $(window).trigger('changed-to-mobile-view');
    }
    function removeImpFontAttr(node) {
        var style = node.attr('style') || '', matches = style.match(/font-size:[\s\w\.%]*!important;?/);
        if (matches) {
            matches.forEach(function (match) {
                style = style.replace(match, '');
            });
            node.attr('style', style);
        }
    }
    var updateTextView = function (componentEle, textSize) {
        var nodes = componentEle.find('*').toArray().reverse();
        nodes.forEach(function (domNode) {
            var node = $(domNode), fontSize = parseFloat(node.css('fontSize')), removeCls = domNode.classList.toString().split(' ').filter(function (cls) {
                    return cls.match(/mobile-((oversized)|(undersized))[\w-]*/g);
                }).join(' ');
            node.removeClass(removeCls);
            removeImpFontAttr(node);
            fontSize = fontSize + textSize;
            node.css({ 'font-size': (fontSize > 9 ? fontSize : 9) + 'px' });
        });
    };
    var processComponentChanges = function (cmpSettingsMap, parentElt) {
        var components = parentElt.find('[data-mve-font-change]');
        components.each(function () {
            var cmp = $(this), fontChange = cmp.data('mveFontChange');
            updateTextView(cmp, fontChange);
        });
    };
    function updateMobileHeaderView() {
        var titleContainer = $('.mobile-title');
        if (!titleContainer.length) {
            return;
        }
        var scaleFn = function (title) {
            var textWidth = title.width(), headerWidth = titleContainer.width();
            if (textWidth > headerWidth) {
                var scale = headerWidth / textWidth;
                $(title).css({
                    textAlign: 'center',
                    transform: 'scale(' + scale + ')',
                    transformOrigin: 'left center'
                });
            }
        };
        var title = titleContainer.children();
        window.addEventListener('load', function () {
            title.css({
                textAlign: '',
                transform: '',
                transformOrigin: ''
            });
            scaleFn(title);
        });
        scaleFn(title);
    }
    function updateFeaturedComponentView(components) {
        for (i = 0; i < components.length; i++) {
            var cmp = components[i];
            var cmpKind = cmp.getAttribute('data-specific-kind');
            if (cmpKind === 'FEATURED_PRODUCTS') {
                var iframeEl = $(cmp).find('iframe');
                if (iframeEl && iframeEl.length > 0) {
                    var iframeSrc = iframeEl.attr('src');
                    if (iframeSrc) {
                        iframeSrc = iframeSrc.replace('&forceDesktopView=true', '');
                        iframeEl.attr('src', iframeSrc);
                    }
                    var mobilePreviewHeight = iframeEl.attr('mobilepreviewheight');
                    if (mobilePreviewHeight) {
                        iframeEl.height(mobilePreviewHeight);
                    }
                }
            }
        }
    }
    var templateElt = $('.template'), isMobileView = $(templateElt).data('mobile-view'), isMobileWidth = $().isMobileWidth(), isDesktopView = !isMobileView || !isMobileWidth;
    function run() {
        var mobileEditorChanges = window._mobileEditorData, root = mobileEditorChanges.root, data = mobileEditorChanges.data, groups = mobileEditorChanges.groups, wrappedCmpsMap = mobileEditorChanges.wrappedCmpsMap, styles = mobileEditorChanges.styles, settings = mobileEditorChanges.settings, publishOnlyComponentsElt = $('.publishOnlyComponents');
        function move() {
            if (isDesktopView) {
                return;
            }
            var blocks = $('div[data-id][data-kind$=\'Block\']'), components = $('div[data-id][data-kind$=\'Component\']'), componentEltsMap = {}, blockEltsMap = {}, groupsEltsMap = {}, groupsItemsEltsMap = {}, i, cmpId, col, extractElts = function (elts, extractTo, requiredIds, getAll) {
                    for (i = 0; i < elts.length; i++) {
                        cmpId = elts[i].getAttribute('data-id');
                        if (requiredIds && requiredIds[cmpId] || getAll) {
                            extractTo[cmpId] = $(elts[i]).detach();
                        }
                    }
                };
            $(document.body).addClass('mobileMenu');
            var requiredIds = {};
            Object.keys(data).forEach(function (parentId) {
                requiredIds[parentId] = true;
                data[parentId].forEach(function (childId) {
                    requiredIds[childId] = true;
                    if (groups[childId]) {
                        groups[childId].forEach(function (itemId) {
                            requiredIds[itemId] = true;
                        });
                    }
                });
            });
            Object.keys(wrappedCmpsMap).forEach(function (textId) {
                var wrappedCmpsElts = $('div[data-id="' + textId + '"] .mceNonEditable div[data-specific-kind]');
                for (var j = 0; j < wrappedCmpsElts.length; j++) {
                    var elt = $(wrappedCmpsElts[j]);
                    if (!elt.hasClass('mobileDown')) {
                        requiredIds[elt.attr('data-id')] = false;
                    }
                }
                wrappedCmpsMap[textId].forEach(function (wId) {
                    if (requiredIds[wId]) {
                        if (isCopied(wId, requiredIds)) {
                            requiredIds[wId] = false;
                        } else {
                            requiredIds[wId] = true;
                        }
                    }
                });
            });
            extractElts(components, componentEltsMap, requiredIds);
            extractElts(blocks, blockEltsMap, requiredIds);
            Object.keys(groups).forEach(function (groupId) {
                var groupIdParts = groupId.split('-'), grpClass = 'mobileGroup ' + groupIdParts[0] + '-' + groupIdParts[1], groupSettings = settings[groupId] || {}, align = groupSettings.align, scale = groupSettings.scale, style = groupSettings.style, font = groupSettings.font, reqGroupItemIds = groups[groupId].reduce(function (acc, item) {
                        acc[item] = true;
                        return acc;
                    }, {});
                grpClass += align ? ' align-' + align : '';
                extractElts(components, groupsItemsEltsMap, reqGroupItemIds);
                groupsEltsMap[groupId] = $('<div></div>').addClass(grpClass);
                groups[groupId].forEach(function (itemId) {
                    var groupItem = groupsItemsEltsMap[itemId];
                    if (scale) {
                        scale = Math.min(scale, 100);
                        var img = groupItem.find('img'), imgWrapper = groupItem.find('> div'), imgWrapperWidth = imgWrapper.data('width'), imgWrapperHeight = imgWrapper.data('height'), width = img.data('width'), height = img.data('height'), scaledWrapperWidth = imgWrapperWidth * scale / 100, scaledWrapperHeight = imgWrapperHeight * scale / 100, roundedScaledWrapperWidth = Math.round(scaledWrapperWidth), roundedScaledWrapperHeight = Math.round(scaledWrapperHeight), scaledImgWidth = width * scale / 100, scaledImgHeight = height * scale / 100, roundedScaledImgWidth = Math.round(scaledImgWidth), roundedScaledImgHeight = Math.round(scaledImgHeight), roundOffError = 0.0001;
                        if (roundedScaledWrapperWidth - scaledWrapperWidth <= roundOffError) {
                            scaledWrapperWidth = roundedScaledWrapperWidth;
                        }
                        if (roundedScaledWrapperHeight - scaledWrapperHeight <= roundOffError) {
                            scaledWrapperHeight = roundedScaledWrapperHeight;
                        }
                        if (roundedScaledImgWidth - scaledImgWidth <= roundOffError) {
                            scaledImgWidth = roundedScaledWrapperWidth;
                        }
                        if (roundedScaledImgHeight - scaledImgHeight <= roundOffError) {
                            scaledImgHeight = roundedScaledWrapperHeight;
                        }
                        imgWrapper.width(scaledWrapperWidth);
                        imgWrapper.height(scaledWrapperHeight);
                        img.width(scaledImgWidth);
                        img.height(scaledImgHeight);
                    }
                    if (style && style[itemId]) {
                        Object.keys(style[itemId]).forEach(function (css) {
                            groupItem[0].style[css] = style[itemId][css];
                        });
                    }
                    if (font && groupItem.attr('data-specific-kind') === 'TEXT') {
                        groupItem.children().attr('data-mve-font-change', font);
                    }
                    groupsEltsMap[groupId].append(groupItem);
                });
            });
            updateCopiedBlockElts(blocks, blockEltsMap, requiredIds, data);
            var process = function (parentId, parentElt, isRoot) {
                var cmpSequence = data[parentId], newParent = parentElt;
                if (cmpSequence) {
                    if (!isRoot) {
                        var parent = parentElt || blockEltsMap[parentId];
                        if (parent && $(parent).attr('data-specific-kind') !== 'TEXT') {
                            col = parent.find('.col')[0];
                            if (col) {
                                $(col).addClass('mobile-moved-hidden').css('display', 'none');
                                newParent = $(col.parentNode);
                            } else {
                                newParent = $(parent).find('>div:last').first();
                                newParent.addClass('hasChildren');
                            }
                        }
                    }
                    if (cmpSequence.length) {
                        var extraContainer = $('<div></div>').addClass('extraContainer');
                        extraContainer.css({
                            overflow: 'auto',
                            position: 'relative'
                        });
                        newParent.append(extraContainer);
                        newParent = extraContainer;
                        var hiddenStripStyle = { display: 'none' };
                        cmpSequence.forEach(function (cmpId) {
                            var child = blockEltsMap[cmpId] || componentEltsMap[cmpId] || groupsEltsMap[cmpId];
                            if (child) {
                                child.addClass('mobile-moved' + (isRoot ? ' mobileTopLevelComponents' : ''));
                                if ($(child).find('.stretched').length) {
                                    child.addClass('stretched');
                                }
                                var specificKind = child.data('specificKind');
                                if ((specificKind === 'STRIP' || specificKind === 'SECTION') && !data[cmpId]) {
                                    child.css(hiddenStripStyle);
                                }
                                var extra = $('<div></div>').addClass('extra');
                                var cmpStyle = styles[cmpId];
                                if (cmpStyle) {
                                    extra.css(cmpStyle);
                                    if (cmpStyle.height === 0 && (specificKind === 'STRIP' || specificKind === 'SECTION')) {
                                        child.css(hiddenStripStyle);
                                    }
                                }
                                var newEl = newParent[0].appendChild(extra[0]);
                                newEl.appendChild(child[0]);
                                process(cmpId, $(child[0]));
                            }
                        });
                    }
                }
            };
            process(root, $(templateElt), true);
            setTimeout(function () {
                processComponentChanges(settings, $(templateElt));
            });
            updateMobileHeaderView();
            updateFeaturedComponentView(components);
            $(templateElt).addClass('mobileV mobileViewLoaded');
            $(document.body).addClass('mobileV mobileViewLoaded');
            fixCmpsStylesForMobile(data);
            $(publishOnlyComponentsElt).addClass('mobileViewLoadedPublishOnlyComponents');
            triggerChangeToMobileView();
        }
        try {
            move();
        } finally {
            $(templateElt).css('visibility', 'visible');
            if ($().isMobileWidth()) {
                $(document.documentElement).css('overflow-x', 'hidden');
                $(document.body).css('overflow-x', 'hidden');
                $(document.body).css('overflow-y', 'inherit');
            } else {
                $(document.body).css('overflow-x', 'auto');
            }
        }
        var windowWidth = getCurrentWindowWidth();
        $(window).resize(function () {
            if (isMobileView && isMobileWidth) {
                var newWindowWidth = getCurrentWindowWidth();
                var isLightBoxShown = $('html').hasClass('shinybox-html');
                if (windowWidth !== newWindowWidth && !isLightBoxShown) {
                    windowWidth = newWindowWidth;
                    fixCmpsStylesForMobile(data);
                    triggerChangeToMobileView();
                }
            }
        });
    }
    run();
    window.runMobileSort = run;
}(oneJQuery));
(function ($) {
    history.scrollRestoration = 'manual';
    function subscribePageHeightChange(cb) {
        var scrollHeight = document.documentElement.scrollHeight, canceled = false;
        (function checkForChange() {
            if (canceled) {
                return;
            }
            var currentScrollHeight = document.documentElement.scrollHeight;
            if (scrollHeight !== currentScrollHeight) {
                cb(scrollHeight);
                scrollHeight = currentScrollHeight;
            }
            window.requestAnimationFrame(checkForChange);
        }());
        return function () {
            canceled = true;
        };
    }
    (function onReady() {
        var isCanceled = false, previewHash = window.localStorage.getItem('previewHash'), sectionId = window.location.hash.substr(1) || previewHash, strip = document.body.querySelector('div[data-specific-kind=SECTION][data-id="' + sectionId + '"], div[data-specific-kind=STRIP][data-id="' + sectionId + '"]'), stripId;
        window.localStorage.removeItem('previewHash');
        strip = strip || document.getElementById(sectionId);
        stripId = strip && strip.id;
        function cancelDefaultScroll() {
            isCanceled = true;
        }
        document.addEventListener('wheel', cancelDefaultScroll);
        $(window).on('load', cancelDefaultScroll);
        function cb(element, top) {
            if (isCanceled) {
                return;
            }
            if (strip.getBoundingClientRect().top === top) {
                var cancelSub = subscribePageHeightChange(function () {
                    if (isCanceled) {
                        cancelSub();
                        return;
                    }
                    $.fn.scrollIntoView(strip, top, null, 0);
                });
            } else {
                $.fn.scrollIntoView(strip, top, cb);
            }
        }
        if (stripId) {
            $.fn.removeHash();
            window.scrollTo(0, 0);
            history.replaceState(null, null, '#' + stripId);
            $.fn.scrollIntoSection(stripId, cb);
        }
    }());
    window.addEventListener('popstate', function () {
        var hash = location.hash.substr(1);
        $.fn.scrollIntoSection(hash);
    });
}(oneJQuery));