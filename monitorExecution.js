const fingerprintingDetection = (function () {

    const detectFingerprinting = function () {
        function getCallerFile() {
            let originalFunc = Error.prepareStackTrace;

            let callerfile;
            try {
                const err = new Error();
                let currentfile;

                Error.prepareStackTrace = function (err, stack) {
                    return stack;
                };

                currentfile = err.stack.shift().getFileName();
                while (err.stack.length) {
                    callerfile = err.stack.shift().getFileName();

                    if (currentfile !== callerfile) break;
                }
            } catch (e) {}

            Error.prepareStackTrace = originalFunc;

            return callerfile;
        }

        function overrideFunction(item) {
            item.obj[item.propName] = (function (orig) {
                return function () {
                    let args = arguments;
                    const callerFile = getCallerFile();
                    let value;
                    if (typeof window.navigator.monitorFingerprinting[callerFile] === 'undefined') {
                        window.navigator.monitorFingerprinting[callerFile] = [];
                    } else {
                        value = orig.apply(this, args);
                        let valueToStore = value;
                        if (value instanceof Array) {
                            valueToStore = JSON.stringify(value);
                        }
                        else if (typeof value === 'object') {
                            valueToStore = JSON.stringify(value);
                        }

                        window.navigator.monitorFingerprinting[callerFile][window.navigator.monitorFingerprinting[callerFile].length] = {
                            name: item.propName,
                            args: Array.from(args).map(arg => arg.toString()).join(','),
                            value: valueToStore
                        }
                    }

                    return value;
                };

            }(item.obj[item.propName]));
        }

        const attributesToMonitor = {
            navigator: [
                'platform',
                'userAgent',
                'platform',
                'plugins',
                'mimeTypes',
                'doNotTrack',
                'languages',
                'productSub',
                'language',
                'vendor',
                'oscpu',
                'hardwareConcurrency',
                'cpuClass',
                'webdriver',
                'maxTouchPoints',
                'appVersion',
                'appCodeName',
                'cookieEnabled'
            ],
            screen: [
                'width',
                'height',
                'availWidth',
                'availHeight',
                'availTop',
                'availLeft',
                'colorDepth',
                'pixelDepth'
            ],
            window: [
                'ActiveXObject',
                'webdriver',
                'domAutomation',
                'domAutomationController',
                'callPhantom',
                'spawn',
                'emit',
                'Buffer',
                'awesomium',
                '_Selenium_IDE_Recorder',
                '__webdriver_script_fn',
                '_phantom',
                '__nightmare',
                'callSelenium',
                '_selenium',
                'scrollX',
                'scrollY',
                'pageXOffset',
                'pageYOffset',
                'outerHeight',
                'outerWidth',
                'innerWidth',
                'innerHeight',
                'devicePixelRatio',
                'localStorage',
                'indexedDB',
                'sessionStorage'
            ]
        };

        function saveAccessGetter(prop, subProp) {
            let value;
            const callerFile = getCallerFile();
            if (window.navigator.monitorFingerprinting[callerFile] === undefined) {
                window.navigator.monitorFingerprinting[callerFile] = [];
            } else {
                value = originalValues[subProp];
                let valueToStore = value;
                if (typeof value === 'object') {
                    valueToStore = JSON.stringify(value);
                }

                window.navigator.monitorFingerprinting[callerFile][window.navigator.monitorFingerprinting[callerFile].length] = {
                    name: `${prop}.${subProp}`,
                    value: valueToStore
                };
            }

            return value;
        }

        window.navigator.monitorFingerprinting = {};
        const originalValues = {};

        for (let prop of Object.keys(attributesToMonitor)) {
            for (let subProp of attributesToMonitor[prop]) {
                if(prop !== 'window') {
                    originalValues[subProp] = window[prop][subProp];
                    window[prop].__defineGetter__(subProp, () => {
                        return saveAccessGetter(prop, subProp);
                    });
                } else {
                    originalValues[subProp] = window[subProp];
                    window.__defineGetter__(subProp, () => {
                        return saveAccessGetter(prop, subProp);
                    });
                }

            }
        }

        const audioContextMethods = ['createAnalyser', 'createOscillator', 'createGain',
            'createScriptProcessor', 'createDynamicsCompressor'];
        audioContextMethods.forEach((method) => {
            overrideFunction({
                propName: method,
                obj: window.AudioContext.prototype
            });
        });

        const offlineAudioContextMethods = ['createAnalyser', 'createOscillator', 'createGain',
            'createScriptProcessor', 'createDynamicsCompressor'];
        offlineAudioContextMethods.forEach((method) => {
            overrideFunction({
                propName: method,
                obj: window.OfflineAudioContext.prototype
            });
        });

        const analyserMethods = ['getFloatFrequencyData', 'getByteFrequencyData',
            'getFloatTimeDomainData', 'getByteTimeDomainData'];
        analyserMethods.forEach((method) => {
            overrideFunction({
                propName: method,
                obj: window.AnalyserNode.prototype
            });
        });

        const webGLMethods = ['getParameter', 'getSupportedExtensions', 'getContextAttributes',
            'getShaderPrecisionFormat', 'getExtension', 'readPixels', 'getUniformLocation',
            'getAttribLocation', 'clearColor', 'enable', 'depthFunc', 'clear', 'createBuffer', 'bindBuffer', 'bufferData',
            'createProgram', 'createShader', 'shaderSource', 'compileShader', 'attachShader', 'linkProgram', 'useProgram', 'drawArrays'];
        webGLMethods.forEach((method) => {
            overrideFunction({
                propName: method,
                obj: window.WebGLRenderingContext.prototype
            });
        });

        const canvasEltMethods = ['toDataURL', 'toBlob'];
        canvasEltMethods.forEach((method) => {
            overrideFunction({
                propName: method,
                obj: HTMLCanvasElement.prototype
            });
        });

        const canvasMethods = ['getImageData', 'getLineDash', 'measureText', 'isPointInPath', 'fillText',
            'fillRect', 'beginPath', 'beginPath', 'arc', 'closePath', 'fill'];
        canvasMethods.forEach((method) => {
            overrideFunction({
                propName: method,
                obj: CanvasRenderingContext2D.prototype
            });
        });


        const webrtcMethods = ['createOffer', 'createAnswer', 'setLocalDescription', 'setRemoteDescription'];
        webrtcMethods.forEach((method) => {
            overrideFunction({
                propName: method,
                obj: webkitRTCPeerConnection.prototype
            });
        });


        const otherFunctionsToOverride = [
            {
                propName: 'getTimezoneOffset',
                obj: Date.prototype
            },
            {
                propName: 'getComputedTextLength',
                obj: SVGTextContentElement.prototype
            },
            {
                propName: 'createElement',
                obj: document
            },
            {
                propName: 'getElementById',
                obj: document
            },
            {
                propName: 'getElementsByClassName',
                obj: document
            },
            {
                propName: 'getElementsByName',
                obj: document
            },
            {
                propName: 'getElementsByTagName',
                obj: document
            },
            {
                propName: 'insertBefore',
                obj: document
            },
            {
                propName: 'appendChild',
                obj: document
            },
            {
                propName: 'getAttribute',
                obj: document
            },
            {
                propName: 'elementFromPoint',
                obj: document
            },
            {
                propName: 'getVoices',
                obj: speechSynthesis
            },
            {
                propName: 'setItem',
                obj: localStorage
            },
            {
                propName: 'getItem',
                obj: localStorage
            },
            {
                propName: 'removeItem',
                obj: localStorage
            },
            {
                propName: 'setItem',
                obj: sessionStorage
            },
            {
                propName: 'getItem',
                obj: sessionStorage
            },
            {
                propName: 'removeItem',
                obj: sessionStorage
            },
            {
                propName: 'getComputedStyle',
                obj: window
            },
            {
                propName: 'send',
                obj: XMLHttpRequest.prototype
            },
            {
                propName: 'canPlayType',
                obj: HTMLVideoElement.prototype
            },
            {
                propName: 'canPlayType',
                obj: HTMLAudioElement.prototype
            }
        ];

        otherFunctionsToOverride.forEach(overrideFunction);
    };

    return detectFingerprinting;

})();

module.exports = {
    detectFingerprinting: fingerprintingDetection,
};