(function($){function fixGalleryCaptionHeights(){$('.gallery').each(function(index,gallery){var $gallery=$(gallery),galleryCaptionContainers=$gallery.find('.gallery-caption').toArray(),galleryCaptionsHeights=galleryCaptionContainers.map(function(captionContainer){return $(captionContainer).height()}),maxGalleryCaptionsHeight=Math.max.apply(null,galleryCaptionsHeights.concat(0)),setCaptionMinHeight=function(captionContainer){$(captionContainer).css('min-height',maxGalleryCaptionsHeight);$(captionContainer).css('height',maxGalleryCaptionsHeight)};if(maxGalleryCaptionsHeight!==0){galleryCaptionContainers.forEach(setCaptionMinHeight)}})}$(function(){setTimeout(fixGalleryCaptionHeights,100)})}(oneJQuery));