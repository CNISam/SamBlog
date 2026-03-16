(function () {
    var q = QPlayer;
    var $ = q.$;
    var plugin = q.plugin = {
        version: '1.0.0',
        setList: function (list) {
            var length = list.length;
            if (length === 0) {
                return;
            }
            var asyncList = {};
            var asyncTotal = 0;
            var asyncCount = 0;
            var asyncOffset = 0;
            var isComplete = false;
            function complete() {
                if (!isComplete || asyncCount !== asyncTotal) {
                    return;
                }
                var keys = Object.keys(asyncList);
                keys.sort();
                var length = keys.length;
                for (var i = 0; i < length; ++i) {
                    var key = keys[i];
                    var array = asyncList[key];
                    var len = array.length;
                    var index = parseInt(key) + asyncOffset;
                    splice(list, index, 1, array);
                    asyncOffset += len - 1;
                }
                q.list = list;
            }
            for (var i = 0; i < length; ++i) {
                var current = list[i];
                if (!(current.type && !current.provider)) {
                    continue;
                }
                ++asyncTotal;
                (function (i) {
                    $.ajax({
                        url: plugin.api,
                        data: current,
                        success: function (array) {
                            if (!Array.isArray(array)) {
                                return;
                            }
                            asyncList[i] = array;
                        },
                        complete: function () {
                            ++asyncCount;
                            complete();
                        }
                    });
                })(i);
            }
            isComplete = true;
            complete();
        }
    };
    function splice(source, start, deleteCount, dest) {
        var dLength = Array.isArray(dest) ? dest.length : 0;
        var sLength = source.length;
        if (start > sLength) {
            start = sLength;
        } else if (start < 0) {
            start = 0;
        }
        if (deleteCount < 0) {
            deleteCount = 0;
        }
        if (start + deleteCount > sLength) {
            deleteCount = sLength - start;
        }
        var offset = dLength - deleteCount;
        var length = sLength + offset;
        var i;
        if (offset > 0) {
            for (i = length - 1; i > start + offset - 1; --i) {
                source[i] = source[i - offset];
            }
        } else if (offset < 0) {
            for (i = start + dLength; i < sLength; ++i) {
                source[i] = source[i - offset];
            }
        }
        source.length = length;
        for (i = 0; i < dLength; ++i) {
            source[start + i] = dest[i];
        }
    }

    // 默认音量设置
    q.defaultVolume = q.defaultVolume || 80;

    // 添加音量控制功能
    q.addVolumeControl = function() {
        console.log('QPlayer.addVolumeControl 被调用');
        
        var volumeButton = q.$('#QPlayer-btn-volume');
        
        if (volumeButton.length > 0) {
            console.log('音量控制已存在，绑定事件');
            
            // 检查是否已有滑块容器
            var sliderContainer = volumeButton.find('#QPlayer-volume-slider-container');
            if (sliderContainer.length === 0) {
                console.log('创建滑块容器，默认音量:', q.defaultVolume);
                // 创建滑块容器
                sliderContainer = q.$('<div id="QPlayer-volume-slider-container" style="position: absolute; bottom: 25px; right: 0; width: 80px; background: #fff; padding: 10px; border: 1px solid #dedede; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: none; z-index: 100;"><input type="range" id="QPlayer-volume-slider" min="0" max="100" value="' + q.defaultVolume + '" style="width: 100%; cursor: pointer;"></div>');
                volumeButton.append(sliderContainer);
            } else {
                // 如果滑块容器已存在，更新默认音量值
                console.log('滑块容器已存在，更新默认音量:', q.defaultVolume);
                var slider = sliderContainer.find('#QPlayer-volume-slider');
                slider.val(q.defaultVolume);
            }
            
            var volumeIcon = volumeButton.find('#QPlayer-volume-icon');
            
            console.log('音量图标元素:', volumeIcon.length);
            console.log('滑块容器元素:', sliderContainer.length);
            
            // 设置音量图标样式
            volumeIcon.css({
                'width': '16px',
                'height': '16px',
                'fill': 'currentColor',
                'cursor': 'pointer',
                'transition': 'fill .2s linear',
                'display': 'block',
                'margin': '1px auto'
            });
            
            // 悬停效果
            volumeIcon.hover(function() {
                this.style.fill = '#3d3d3d';
            }, function() {
                this.style.fill = '#666';
            });
            
            // 点击事件
            volumeButton.off('click').on('click', function (e) {
                e.stopPropagation();
                console.log('音量按钮被点击');
                var container = $(this).find('#QPlayer-volume-slider-container');
                console.log('滑块容器当前状态:', container.css('display'));
                container.toggle();
                console.log('滑块容器新状态:', container.css('display'));
            });
            
            // 点击其他地方隐藏滑块
            q.$(document).off('click.QPlayerVolume').on('click.QPlayerVolume', function(e) {
                if (!q.$(e.target).closest('#QPlayer-btn-volume').length) {
                    q.$('#QPlayer-volume-slider-container').hide();
                }
            });
            
            // 音量滑块事件
            var audio = q.audio || q.$('audio').first()[0];
            if (audio) {
                console.log('找到音频元素，设置音量控制');
                var defaultVolume = q.defaultVolume / 100;
                audio.volume = defaultVolume;
                
                var slider = volumeButton.find('#QPlayer-volume-slider');
                slider.off('input').on('input', function() {
                    var volume = parseInt($(this).val()) / 100;
                    audio.volume = volume;
                    localStorage.setItem('QPlayer_volume', volume);
                    console.log('音量调整为:', volume);
                });
                
                // 从localStorage加载保存的音量设置
                var savedVolume = localStorage.getItem('QPlayer_volume');
                if (savedVolume !== null) {
                    var volume = parseFloat(savedVolume);
                    audio.volume = volume;
                    slider.val(volume * 100);
                    console.log('从localStorage加载音量:', volume);
                }
            }
        } else {
            console.log('创建音量控制元素');
            
            // 创建音量控制元素
            var volumeButton = q.$('<div id="QPlayer-btn-volume" style="float: left; width: 18px; height: 18px; position: relative; z-index: 101;"><svg id="QPlayer-volume-icon" width="16px" height="16px" viewBox="0 0 24 24" fill="currentColor"><path d="M13.728 6.272v19.456q0 0.448-0.352 0.8t-0.8 0.32-0.8-0.32l-5.952-5.952h-4.672q-0.48 0-0.8-0.352t-0.352-0.8v-6.848q0-0.48 0.352-0.8t0.8-0.352h4.672l5.952-5.952q0.32-0.32 0.8-0.32t0.8 0.32 0.352 0.8zM20.576 16q0 1.344-0.768 2.528t-2.016 1.664q-0.16 0.096-0.448 0.096-0.448 0-0.8-0.32t-0.32-0.832q0-0.384 0.192-0.64t0.544-0.448 0.608-0.384 0.512-0.64 0.192-1.024-0.192-1.024-0.512-0.64-0.608-0.384-0.544-0.448-0.192-0.64q0-0.48 0.32-0.832t0.8-0.32q0.288 0 0.448 0.096 1.248 0.48 2.016 1.664t0.768 2.528z"></path></svg><div id="QPlayer-volume-slider-container" style="position: absolute; bottom: 25px; right: 0; width: 80px; background: #fff; padding: 10px; border: 1px solid #dedede; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: none; z-index: 100;"><input type="range" id="QPlayer-volume-slider" min="0" max="100" value="' + q.defaultVolume + '" style="width: 100%; cursor: pointer;"></div></div>');
            
            // 确保音量按钮与其他按钮样式一致
            volumeButton.css({
                'float': 'left',
                'width': '18px',
                'height': '18px',
                'margin': '0',
                'padding': '0',
                'position': 'relative',
                'user-select': 'none',
                'z-index': '101'
            });
            
            var volumeIcon = volumeButton.find('#QPlayer-volume-icon');
            var sliderContainer = volumeButton.find('#QPlayer-volume-slider-container');
            
            console.log('音量图标元素:', volumeIcon.length);
            console.log('滑块容器元素:', sliderContainer.length);
            
            // 设置音量图标样式
            volumeIcon.css({
                'width': '16px',
                'height': '16px',
                'fill': 'currentColor',
                'cursor': 'pointer',
                'transition': 'fill .2s linear',
                'display': 'block',
                'margin': '1px auto'
            });
            
            // 悬停效果
            volumeIcon.hover(function() {
                this.style.fill = '#3d3d3d';
            }, function() {
                this.style.fill = '#666';
            });
            
            // 点击事件
            volumeButton.on('click', function (e) {
                e.stopPropagation();
                console.log('音量按钮被点击');
                var container = $(this).find('#QPlayer-volume-slider-container');
                console.log('滑块容器当前状态:', container.css('display'));
                container.toggle();
                console.log('滑块容器新状态:', container.css('display'));
            });
            
            // 查找QPlayer-control-more并添加音量按钮
            var controlMore = q.$('#QPlayer-control-more');
            console.log('查找QPlayer-control-more:', controlMore.length);
            
            if (controlMore.length > 0) {
                console.log('找到QPlayer-control-more，添加音量按钮');
                var repeatButton = controlMore.find('#QPlayer-btn-repeat');
                if (repeatButton.length > 0) {
                    volumeButton.insertBefore(repeatButton);
                    console.log('音量按钮插入到重复按钮之前');
                } else {
                    controlMore.prepend(volumeButton);
                    console.log('音量按钮添加到QPlayer-control-more开头');
                }
            } else {
                console.log('未找到QPlayer-control-more，尝试查找QPlayer-btn-mode');
                var modeButton = q.$('#QPlayer-btn-mode');
                if (modeButton.length > 0) {
                    console.log('找到QPlayer-btn-mode，添加音量按钮');
                    modeButton.prepend(volumeButton);
                } else {
                    console.log('未找到控制区域，添加到QPlayer容器');
                    q.$('#QPlayer').append(volumeButton);
                }
            }
            
            // 点击其他地方隐藏滑块
            q.$(document).on('click', function(e) {
                if (!q.$(e.target).closest('#QPlayer-btn-volume').length) {
                    q.$('#QPlayer-volume-slider-container').hide();
                }
            });
            
            // 音量滑块事件
            var audio = q.audio || q.$('audio').first()[0];
            if (audio) {
                console.log('找到音频元素，设置音量控制');
                var defaultVolume = q.defaultVolume / 100;
                audio.volume = defaultVolume;
                
                volumeButton.find('#QPlayer-volume-slider').on('input', function() {
                    var volume = parseInt($(this).val()) / 100;
                    audio.volume = volume;
                    localStorage.setItem('QPlayer_volume', volume);
                    console.log('音量调整为:', volume);
                });
                
                // 从localStorage加载保存的音量设置
                var savedVolume = localStorage.getItem('QPlayer_volume');
                if (savedVolume !== null) {
                    var volume = parseFloat(savedVolume);
                    audio.volume = volume;
                    volumeButton.find('#QPlayer-volume-slider').val(volume * 100);
                    console.log('从localStorage加载音量:', volume);
                }
            }
        }
    };

    // 当QPlayer准备就绪时添加音量控制
    if (q.ready) {
        q.ready(function() {
            q.addVolumeControl();
        });
    } else {
        // 如果没有ready方法，使用setTimeout
        setTimeout(function() {
            q.addVolumeControl();
        }, 1000);
    }
})();